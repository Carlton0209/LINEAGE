import json
from datetime import datetime
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from lineage_api.config import get_settings
from lineage_api.database import get_session
from lineage_api.manifest import build_unsigned_manifest, sign_manifest
from lineage_api.manifest_verifier import verification_result
from lineage_api.models import AIEvent
from lineage_api.pdf import generate_manifest_pdf
from lineage_api.schemas import EventCreate, EventListResponse, EventRead, PROJECT_ID_PATTERN

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
    tool: str | None = None,
    asset: str | None = None,
    asset_type: str | None = None,
) -> EventListResponse:
    statement = select(AIEvent).where(AIEvent.project_id == project_id)

    if start_date is not None:
        statement = statement.where(AIEvent.occurred_at >= start_date)
    if end_date is not None:
        statement = statement.where(AIEvent.occurred_at <= end_date)
    if tool is not None:
        statement = statement.where(AIEvent.tool_identifier == tool)
    if asset is not None:
        statement = statement.where(AIEvent.output_asset_url.contains(asset))
    if asset_type is not None:
        statement = statement.where(AIEvent.output_asset_type == asset_type)

    events = session.exec(statement.order_by(col(AIEvent.occurred_at).desc())).all()
    return EventListResponse(project_id=project_id, count=len(events), events=events)


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


@app.post("/manifest/verify")
async def verify_manifest(request: Request) -> dict:
    manifest = await _bounded_json_object(request)
    return verification_result(manifest)


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
