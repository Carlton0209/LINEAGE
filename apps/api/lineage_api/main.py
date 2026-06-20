import json
import re
from datetime import datetime
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from lineage_api.config import get_settings
from lineage_api.database import get_session
from lineage_api.manifest import build_unsigned_manifest, sign_manifest
from lineage_api.manifest_verifier import verification_result
from lineage_api.models import AIEvent
from lineage_api.pdf import generate_manifest_pdf
from lineage_api.schemas import (
    AssetType,
    AssetLookupRequest,
    AssetLookupResponse,
    AssetLookupResult,
    EventCreate,
    EventListResponse,
    EventRead,
    PROJECT_ID_PATTERN,
    SHA256_PATTERN,
    TOOL_ID_PATTERN,
)

settings = get_settings()
settings.require_production_signing_key()

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


SessionDep = Annotated[Session, Depends(get_session)]
ProjectIdPath = Annotated[str, Path(pattern=PROJECT_ID_PATTERN)]
MAX_VERIFY_MANIFEST_BYTES = 1_048_576


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "environment": get_settings().environment}


@app.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, session: SessionDep) -> AIEvent:
    event = payload.to_model()
    session.add(event)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"event_id already exists: {event.event_id}",
        ) from exc
    session.refresh(event)
    return event


@app.get("/events", response_model=EventListResponse)
def list_events(
    session: SessionDep,
    project_id: str = Query(pattern=PROJECT_ID_PATTERN),
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    tool: str | None = Query(default=None, pattern=TOOL_ID_PATTERN),
    asset: str | None = Query(default=None, min_length=1, max_length=1000),
    asset_type: AssetType | None = None,
) -> EventListResponse:
    statement = select(AIEvent).where(AIEvent.project_id == project_id)

    if start_date is not None:
        statement = statement.where(AIEvent.occurred_at >= start_date)
    if end_date is not None:
        statement = statement.where(AIEvent.occurred_at <= end_date)
    if tool is not None:
        statement = statement.where(AIEvent.tool_identifier == tool)
    if asset is not None:
        statement = statement.where(AIEvent.output_asset_url.contains(asset, autoescape=True))
    if asset_type is not None:
        statement = statement.where(AIEvent.output_asset_type == asset_type)

    events = session.exec(statement.order_by(col(AIEvent.occurred_at).desc())).all()
    return EventListResponse(project_id=project_id, count=len(events), events=events)


@app.post("/assets/lookup", response_model=AssetLookupResponse)
def lookup_assets(payload: AssetLookupRequest, session: SessionDep) -> AssetLookupResponse:
    unique_hashes = list(dict.fromkeys(payload.hashes))
    statement = select(AIEvent).where(
        func.lower(AIEvent.output_asset_hash_value).in_(unique_hashes)
    )

    if payload.algorithm:
        statement = statement.where(AIEvent.output_asset_hash_algorithm == payload.algorithm)

    events = session.exec(statement.order_by(col(AIEvent.occurred_at).desc())).all()
    events_by_hash: dict[str, list[EventRead]] = {hash_value: [] for hash_value in unique_hashes}

    for event in events:
        if event.output_asset_hash_value is None:
            continue

        normalized_hash = event.output_asset_hash_value.lower()
        if normalized_hash in events_by_hash:
            events_by_hash[normalized_hash].append(EventRead.model_validate(event))

    return AssetLookupResponse(
        results=[
            AssetLookupResult(
                hash=hash_value,
                matched=bool(events_by_hash.get(hash_value)),
                events=events_by_hash.get(hash_value, []),
            )
            for hash_value in payload.hashes
        ]
    )


async def _bounded_json_object(request: Request) -> dict:
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_VERIFY_MANIFEST_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="manifest verification payload exceeds 1 MB",
                )
        except ValueError:
            pass

    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_VERIFY_MANIFEST_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="manifest verification payload exceeds 1 MB",
            )

    try:
        manifest = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="request body must be valid JSON",
        ) from None

    if not isinstance(manifest, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="manifest verification payload must be a JSON object",
        )

    return manifest


def _asset_hashes_from_payload(raw_hashes: object) -> list[str]:
    if not isinstance(raw_hashes, list):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="assetHashes must be a list of SHA-256 hashes",
        )
    if len(raw_hashes) > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="assetHashes cannot contain more than 50 hashes",
        )

    asset_hashes: list[str] = []
    for item in raw_hashes:
        if not isinstance(item, str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="assetHashes must contain only SHA-256 hash strings",
            )
        hash_value = item.strip().lower()
        if not re.fullmatch(SHA256_PATTERN, hash_value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="assetHashes must contain 64-character SHA-256 hex digests",
            )
        asset_hashes.append(hash_value)
    return asset_hashes


def _manifest_verify_payload(payload: dict) -> tuple[dict, list[str] | None]:
    manifest = payload
    asset_hashes = None

    if isinstance(payload.get("manifest"), dict):
        manifest = payload["manifest"]
        if "assetHashes" in payload:
            asset_hashes = _asset_hashes_from_payload(payload["assetHashes"])

    return manifest, asset_hashes


@app.post("/manifest/verify")
async def verify_manifest(request: Request) -> dict:
    payload = await _bounded_json_object(request)
    manifest, asset_hashes = _manifest_verify_payload(payload)
    return verification_result(manifest, asset_hashes=asset_hashes)


def _signed_manifest_for_project(project_id: str, session: Session) -> dict:
    events = session.exec(select(AIEvent).where(AIEvent.project_id == project_id)).all()
    if not events:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no events found for project_id: {project_id}",
        )

    settings = get_settings()
    try:
        unsigned_manifest = build_unsigned_manifest(project_id, events, settings)
        return sign_manifest(unsigned_manifest, settings)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@app.post("/manifest/{project_id}")
def generate_manifest(project_id: ProjectIdPath, session: SessionDep) -> dict:
    return _signed_manifest_for_project(project_id, session)


@app.post("/manifest/{project_id}/pdf")
def generate_manifest_pdf_response(project_id: ProjectIdPath, session: SessionDep) -> Response:
    manifest = _signed_manifest_for_project(project_id, session)
    pdf_bytes = generate_manifest_pdf(manifest)
    filename = f"lineage-{project_id}-manifest.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
