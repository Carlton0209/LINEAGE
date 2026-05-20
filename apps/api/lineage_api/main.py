from datetime import datetime
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from lineage_api.config import get_settings
from lineage_api.database import get_session
from lineage_api.models import AIEvent
from lineage_api.schemas import EventCreate, EventListResponse, EventRead, ManifestPendingResponse

app = FastAPI(title=get_settings().app_name, version="0.1.0")


SessionDep = Annotated[Session, Depends(get_session)]


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
    project_id: str = Query(min_length=1),
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


@app.post("/manifest/{project_id}", response_model=ManifestPendingResponse)
def generate_manifest(project_id: str, session: SessionDep) -> ManifestPendingResponse:
    events = session.exec(select(AIEvent).where(AIEvent.project_id == project_id)).all()
    return ManifestPendingResponse(
        project_id=project_id,
        event_count=len(events),
        status="pending_certification",
        detail="Manifest signing and PDF generation are implemented in Step 3.",
    )
