from datetime import datetime
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator

from lineage_api.models import AIEvent


AssetType = Literal["image", "video", "audio", "text"]


class HashDigest(BaseModel):
    algorithm: Literal["SHA-256"] = "SHA-256"
    value: str = Field(pattern=r"^[a-fA-F0-9]{64}$")


class ToolPayload(BaseModel):
    identifier: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,79}$")
    version: str | None = None
    url: str | None = None


class ModelPayload(BaseModel):
    identifier: str = Field(min_length=1, max_length=128)
    version: str | None = None


class ReferenceAssetPayload(BaseModel):
    assetUrl: str | None = None
    assetHash: HashDigest
    assetType: AssetType
    relationship: str | None = None


class EventInputPayload(BaseModel):
    promptText: str = Field(min_length=1, max_length=20000)
    negativePromptText: str | None = Field(default=None, max_length=20000)
    parameters: dict[str, Any] = Field(default_factory=dict)
    referenceAssets: list[ReferenceAssetPayload] = Field(default_factory=list)


class EventOutputPayload(BaseModel):
    assetUrl: str = Field(min_length=1, max_length=1000)
    assetHash: HashDigest | None = None
    assetType: AssetType
    mimeType: str | None = None
    durationSeconds: float | None = Field(default=None, gt=0)


class OperatorPayload(BaseModel):
    userId: str = Field(min_length=1, max_length=160)
    humanName: str | None = Field(default=None, max_length=200)


class ProvenancePayload(BaseModel):
    parentEventIds: list[str] = Field(default_factory=list)


class EventCreate(BaseModel):
    eventId: str | None = Field(default=None, min_length=8, max_length=160)
    timestamp: datetime
    projectId: str = Field(min_length=4, max_length=160)
    tool: ToolPayload
    model: ModelPayload
    input: EventInputPayload
    output: EventOutputPayload
    operator: OperatorPayload
    provenance: ProvenancePayload = Field(default_factory=ProvenancePayload)

    @field_validator("timestamp")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone")
        return value

    def to_model(self) -> AIEvent:
        event_id = self.eventId or f"evt_{uuid4().hex}"
        output_hash = self.output.assetHash
        return AIEvent(
            event_id=event_id,
            project_id=self.projectId,
            occurred_at=self.timestamp,
            tool_identifier=self.tool.identifier,
            tool_version=self.tool.version,
            tool_url=self.tool.url,
            model_identifier=self.model.identifier,
            model_version=self.model.version,
            prompt_text=self.input.promptText,
            negative_prompt_text=self.input.negativePromptText,
            output_asset_url=self.output.assetUrl,
            output_asset_hash_algorithm=output_hash.algorithm if output_hash else None,
            output_asset_hash_value=output_hash.value if output_hash else None,
            output_asset_type=self.output.assetType,
            output_mime_type=self.output.mimeType,
            output_duration_seconds=self.output.durationSeconds,
            operator_user_id=self.operator.userId,
            operator_human_name=self.operator.humanName,
            parameters=self.input.parameters,
            reference_assets=[asset.model_dump(by_alias=False) for asset in self.input.referenceAssets],
            parent_event_ids=self.provenance.parentEventIds,
            raw_event=self.model_dump(mode="json"),
        )


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    project_id: str
    occurred_at: datetime
    tool_identifier: str
    tool_version: str | None
    model_identifier: str
    prompt_text: str
    output_asset_url: str
    output_asset_hash_value: str | None
    output_asset_type: str
    operator_user_id: str
    operator_human_name: str | None
    parent_event_ids: list[str]
    created_at: datetime


class EventListResponse(BaseModel):
    project_id: str
    count: int
    events: list[EventRead]


class ManifestPendingResponse(BaseModel):
    project_id: str
    event_count: int
    status: Literal["pending_certification"]
    detail: str
