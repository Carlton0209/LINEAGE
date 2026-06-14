import re
from datetime import datetime
from math import isfinite
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator

from lineage_api.models import AIEvent


AssetType = Literal["image", "video", "audio", "text"]
ReferenceRelationship = Literal[
    "input",
    "style-reference",
    "image-to-video-source",
    "audio-reference",
    "mask",
    "other",
]
MANIFEST_ID_PATTERN = r"^urn:lineage:manifest:[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$"
EVENT_ID_PATTERN = r"^evt_[A-Za-z0-9][A-Za-z0-9_-]{7,127}$"
PROJECT_ID_PATTERN = r"^prj_[A-Za-z0-9][A-Za-z0-9_-]{2,127}$"
TIMESTAMP_PATTERN = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$"
SHA256_PATTERN = r"^[a-fA-F0-9]{64}$"
TOOL_ID_PATTERN = r"^[a-z0-9][a-z0-9-]{1,79}$"
MODEL_ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"
MIME_TYPE_PATTERN = r"^[a-z0-9!#$&^_.+-]+/[a-z0-9!#$&^_.+-]+$"
ScalarParameter = str | int | float | bool | None
SAFE_URI_SCHEMES = {"http", "https", "s3", "gs", "ipfs", "urn"}
NETLOC_REQUIRED_URI_SCHEMES = {"http", "https", "s3", "gs", "ipfs"}


class PayloadModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _require_absolute_uri(value: str | None) -> str | None:
    if value is None:
        return None
    parsed = urlparse(value)
    scheme = parsed.scheme.lower()
    if not scheme or scheme not in SAFE_URI_SCHEMES:
        raise ValueError("must be an absolute URI with a supported scheme")
    if scheme in NETLOC_REQUIRED_URI_SCHEMES and not parsed.netloc:
        raise ValueError("must be an absolute URI with a host")
    if not (parsed.netloc or parsed.path):
        raise ValueError("must be an absolute URI")
    if any(character.isspace() for character in value):
        raise ValueError("must be an absolute URI without whitespace")
    return value


class HashDigest(PayloadModel):
    algorithm: Literal["SHA-256"] = "SHA-256"
    value: str = Field(pattern=SHA256_PATTERN)


class ToolPayload(PayloadModel):
    identifier: str = Field(pattern=TOOL_ID_PATTERN)
    version: str | None = Field(default=None, min_length=1, max_length=80)
    url: str | None = None

    @field_validator("url")
    @classmethod
    def require_absolute_tool_url(cls, value: str | None) -> str | None:
        return _require_absolute_uri(value)


class ModelPayload(PayloadModel):
    identifier: str = Field(pattern=MODEL_ID_PATTERN)
    version: str | None = Field(default=None, min_length=1, max_length=80)


class ReferenceAssetPayload(PayloadModel):
    assetUrl: str | None = Field(default=None, max_length=1000)
    assetHash: HashDigest
    assetType: AssetType
    relationship: ReferenceRelationship | None = None

    @field_validator("assetUrl")
    @classmethod
    def require_absolute_reference_asset_url(cls, value: str | None) -> str | None:
        return _require_absolute_uri(value)


class EventInputPayload(PayloadModel):
    promptText: str = Field(min_length=1, max_length=20000)
    negativePromptText: str | None = Field(default=None, max_length=20000)
    parameters: dict[str, ScalarParameter] = Field(default_factory=dict)
    referenceAssets: list[ReferenceAssetPayload] = Field(default_factory=list)

    @field_validator("parameters")
    @classmethod
    def require_scalar_parameters(
        cls, value: dict[str, ScalarParameter]
    ) -> dict[str, ScalarParameter]:
        for key, parameter in value.items():
            if not key:
                raise ValueError("parameter keys must be non-empty strings")
            if isinstance(parameter, float) and not isfinite(parameter):
                raise ValueError("parameter values must be finite JSON scalars")
        return value


class EventOutputPayload(PayloadModel):
    assetUrl: str = Field(min_length=1, max_length=1000)
    assetHash: HashDigest
    assetType: AssetType
    mimeType: str | None = Field(default=None, pattern=MIME_TYPE_PATTERN)
    durationSeconds: float | None = Field(default=None, gt=0)

    @field_validator("assetUrl")
    @classmethod
    def require_absolute_asset_url(cls, value: str) -> str:
        return _require_absolute_uri(value) or value


class OperatorPayload(PayloadModel):
    userId: str = Field(min_length=1, max_length=160)
    humanName: str | None = Field(default=None, min_length=1, max_length=200)


class ProvenancePayload(PayloadModel):
    parentEventIds: list[str] = Field(default_factory=list)

    @field_validator("parentEventIds")
    @classmethod
    def require_valid_unique_parent_ids(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        for event_id in value:
            if not re.fullmatch(EVENT_ID_PATTERN, event_id):
                raise ValueError("parentEventIds must contain valid event IDs")
            if event_id in seen:
                raise ValueError("parentEventIds must be unique")
            seen.add(event_id)
        return value


class EventCreate(PayloadModel):
    eventId: str | None = Field(default=None, pattern=EVENT_ID_PATTERN)
    timestamp: datetime
    projectId: str = Field(pattern=PROJECT_ID_PATTERN)
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
            output_asset_hash_algorithm=self.output.assetHash.algorithm,
            output_asset_hash_value=self.output.assetHash.value,
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


class AssetLookupRequest(PayloadModel):
    hashes: list[str] = Field(min_length=1, max_length=50)
    algorithm: Literal["SHA-256"] = "SHA-256"

    @field_validator("hashes", mode="before")
    @classmethod
    def strip_hashes(cls, value: Any) -> Any:
        if isinstance(value, list):
            return [item.strip() if isinstance(item, str) else item for item in value]
        return value

    @field_validator("hashes")
    @classmethod
    def require_hex_hashes(cls, value: list[str]) -> list[str]:
        for hash_value in value:
            if not re.fullmatch(SHA256_PATTERN, hash_value):
                raise ValueError("hashes must be 64-character SHA-256 hex digests")
        return [hash_value.lower() for hash_value in value]

    @field_validator("algorithm", mode="before")
    @classmethod
    def strip_algorithm(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class AssetLookupResult(BaseModel):
    hash: str
    matched: bool
    events: list[EventRead]


class AssetLookupResponse(BaseModel):
    results: list[AssetLookupResult]
