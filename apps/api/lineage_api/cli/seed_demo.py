from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, select

from lineage_api.database import engine
from lineage_api.models import AIEvent

OPERATORS = {
    "maya": ("usr_demo_maya", "Maya Chen"),
    "eli": ("usr_demo_eli", "Eli Parker"),
}

PROJECT_METADATA = {
    "prj_demo_feature": {
        "title": "Harbor Glass",
        "productionCompany": "Northlight Pictures",
        "deliveryTarget": "streamer_orig_v3",
        "periodStart": "2026-06-01",
        "periodEnd": "2026-06-14",
    },
    "prj_demo_ad_spot": {
        "title": "Luma Bottle Launch",
        "productionCompany": "Northlight Pictures",
        "deliveryTarget": "brand_social_2026",
        "periodStart": "2026-06-03",
        "periodEnd": "2026-06-13",
    },
    "prj_demo_doc": {
        "title": "Signal Room",
        "productionCompany": "Northlight Pictures",
        "deliveryTarget": "documentary_delivery_v2",
        "periodStart": "2026-06-02",
        "periodEnd": "2026-06-15",
    },
}


def sha256_hex() -> str:
    return secrets.token_hex(32)


def rights(
    *,
    commercial_use: str = "permitted",
    output_license: str = "runway-enterprise",
    training_data_basis: str = "vendor-indemnified",
) -> dict[str, str]:
    return {
        "commercialUse": commercial_use,
        "outputLicense": output_license,
        "trainingDataBasis": training_data_basis,
    }


def disclosure(category: str, project_id: str) -> dict[str, str]:
    return {
        "category": category,
        "buyerProfile": PROJECT_METADATA[project_id]["deliveryTarget"],
    }


def voice_consent(subject: str) -> dict[str, str]:
    return {
        "consentId": "cons_demo_sag_001",
        "subject": subject,
        "scope": "Synthetic voice lines for the LINEAGE demo ledger",
        "guildReference": "SAG-AFTRA-AI-2026-001",
    }


def event(
    *,
    event_id: str,
    project_id: str,
    days_ago: int,
    hour: int,
    tool_identifier: str,
    tool_version: str,
    tool_url: str,
    model_identifier: str,
    model_version: str,
    prompt_text: str,
    asset_name: str,
    asset_type: str,
    mime_type: str,
    duration_seconds: float | None,
    operator_key: str,
    parameters: dict[str, Any],
    parent_event_ids: list[str] | None = None,
    rights_info: dict[str, str] | None = None,
    disclosure_info: dict[str, str] | None = None,
    consent_info: dict[str, str] | None = None,
) -> AIEvent:
    operator_user_id, operator_human_name = OPERATORS[operator_key]
    occurred_at = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(
        days=days_ago,
        hours=hour,
    )
    asset_url = f"s3://lineage-demo/{project_id}/{asset_name}"

    raw_event: dict[str, Any] = {
        "eventId": event_id,
        "projectId": project_id,
        "assetUrl": asset_url,
        "assetType": asset_type,
        "operator": operator_user_id,
        "project": PROJECT_METADATA[project_id],
        "rights": rights_info or rights(),
        "disclosure": disclosure_info or disclosure("ai generated asset", project_id),
    }
    if consent_info:
        raw_event["consent"] = consent_info

    return AIEvent(
        event_id=event_id,
        project_id=project_id,
        occurred_at=occurred_at,
        tool_identifier=tool_identifier,
        tool_version=tool_version,
        tool_url=tool_url,
        model_identifier=model_identifier,
        model_version=model_version,
        prompt_text=prompt_text,
        output_asset_url=asset_url,
        output_asset_hash_algorithm="SHA-256",
        output_asset_hash_value=sha256_hex(),
        output_asset_type=asset_type,
        output_mime_type=mime_type,
        output_duration_seconds=duration_seconds,
        operator_user_id=operator_user_id,
        operator_human_name=operator_human_name,
        parameters=parameters,
        reference_assets=[],
        parent_event_ids=parent_event_ids or [],
        raw_event=raw_event,
    )


def runway_event(
    *,
    event_id: str,
    project_id: str,
    days_ago: int,
    hour: int,
    prompt_text: str,
    asset_name: str,
    operator_key: str,
    parent_event_ids: list[str] | None = None,
    rights_info: dict[str, str] | None = None,
    disclosure_category: str = "ai video",
) -> AIEvent:
    return event(
        event_id=event_id,
        project_id=project_id,
        days_ago=days_ago,
        hour=hour,
        tool_identifier="runway-ml",
        tool_version="2026.05",
        tool_url="https://runwayml.com",
        model_identifier="gen-3-alpha-turbo",
        model_version="3.0",
        prompt_text=prompt_text,
        asset_name=asset_name,
        asset_type="video",
        mime_type="video/mp4",
        duration_seconds=8.0,
        operator_key=operator_key,
        parameters={"seconds": 8, "resolution": "1080p", "camera": "cinematic"},
        parent_event_ids=parent_event_ids,
        rights_info=rights_info or rights(output_license="runway-enterprise"),
        disclosure_info=disclosure(disclosure_category, project_id),
    )


def suno_event(
    *,
    event_id: str,
    project_id: str,
    days_ago: int,
    hour: int,
    prompt_text: str,
    asset_name: str,
    operator_key: str,
    rights_info: dict[str, str] | None = None,
    disclosure_category: str = "ai score",
) -> AIEvent:
    return event(
        event_id=event_id,
        project_id=project_id,
        days_ago=days_ago,
        hour=hour,
        tool_identifier="suno-ai",
        tool_version="4.5",
        tool_url="https://suno.com",
        model_identifier="suno-v4.5",
        model_version="4.5",
        prompt_text=prompt_text,
        asset_name=asset_name,
        asset_type="audio",
        mime_type="audio/wav",
        duration_seconds=30.0,
        operator_key=operator_key,
        parameters={"duration": 30, "tempo": "medium", "mix": "broadcast"},
        rights_info=rights_info or rights(output_license="suno-enterprise"),
        disclosure_info=disclosure(disclosure_category, project_id),
    )


def voice_event(
    *,
    event_id: str,
    project_id: str,
    days_ago: int,
    hour: int,
    prompt_text: str,
    asset_name: str,
    operator_key: str,
    subject: str,
) -> AIEvent:
    return event(
        event_id=event_id,
        project_id=project_id,
        days_ago=days_ago,
        hour=hour,
        tool_identifier="elevenlabs",
        tool_version="2026.05",
        tool_url="https://elevenlabs.io",
        model_identifier="eleven-v3",
        model_version="3.0",
        prompt_text=prompt_text,
        asset_name=asset_name,
        asset_type="audio",
        mime_type="audio/wav",
        duration_seconds=12.0,
        operator_key=operator_key,
        parameters={"voice": "approved-demo-voice", "delivery": "calm"},
        rights_info=rights(output_license="elevenlabs-enterprise"),
        disclosure_info=disclosure("synthetic voice", project_id),
        consent_info=voice_consent(subject),
    )


def demo_events() -> dict[str, list[AIEvent]]:
    feature_chain_parent = "evt_demo_feature_bridge_01"
    doc_chain_parent = "evt_demo_doc_plate_01"

    return {
        "prj_demo_feature": [
            runway_event(
                event_id="evt_demo_feature_open_01",
                project_id="prj_demo_feature",
                days_ago=13,
                hour=2,
                prompt_text="Wide sunrise aerial over a practical harbor set, restrained camera drift, natural haze.",
                asset_name="feature-open-harbor.mp4",
                operator_key="maya",
            ),
            runway_event(
                event_id="evt_demo_feature_alley_01",
                project_id="prj_demo_feature",
                days_ago=12,
                hour=5,
                prompt_text="Handheld night alley insert with wet pavement reflections and soft neon signage.",
                asset_name="feature-night-alley.mp4",
                operator_key="eli",
            ),
            runway_event(
                event_id=feature_chain_parent,
                project_id="prj_demo_feature",
                days_ago=10,
                hour=1,
                prompt_text="Hero character crosses a glass pedestrian bridge as city lights bloom in the distance.",
                asset_name="feature-bridge-base.mp4",
                operator_key="maya",
            ),
            runway_event(
                event_id="evt_demo_feature_bridge_02",
                project_id="prj_demo_feature",
                days_ago=9,
                hour=6,
                prompt_text="Refine the bridge shot with slower motion, warmer practical lights, and a clean end frame.",
                asset_name="feature-bridge-refined.mp4",
                operator_key="maya",
                parent_event_ids=[feature_chain_parent],
            ),
            runway_event(
                event_id="evt_demo_feature_train_01",
                project_id="prj_demo_feature",
                days_ago=7,
                hour=3,
                prompt_text="Interior train window reflection, lead actor silhouette, rain streaks, shallow depth.",
                asset_name="feature-train-window.mp4",
                operator_key="eli",
            ),
            runway_event(
                event_id="evt_demo_feature_archive_01",
                project_id="prj_demo_feature",
                days_ago=5,
                hour=4,
                prompt_text="Faux archival newsreel of a coastal research station, monochrome, subtle film weave.",
                asset_name="feature-archive-station.mp4",
                operator_key="maya",
            ),
            runway_event(
                event_id="evt_demo_feature_finale_01",
                project_id="prj_demo_feature",
                days_ago=3,
                hour=2,
                prompt_text="Finale sky replacement with rolling cloud break and grounded practical lighting.",
                asset_name="feature-finale-sky.mp4",
                operator_key="eli",
            ),
            runway_event(
                event_id="evt_demo_feature_plate_01",
                project_id="prj_demo_feature",
                days_ago=1,
                hour=7,
                prompt_text="Clean VFX plate for a museum hallway, locked-off camera, no people, soft overheads.",
                asset_name="feature-museum-plate.mp4",
                operator_key="maya",
            ),
        ],
        "prj_demo_ad_spot": [
            runway_event(
                event_id="evt_demo_ad_product_01",
                project_id="prj_demo_ad_spot",
                days_ago=13,
                hour=4,
                prompt_text="Macro product glide across recycled aluminum texture, crisp reflections, studio sweep.",
                asset_name="ad-product-macro.mp4",
                operator_key="eli",
            ),
            suno_event(
                event_id="evt_demo_ad_music_01",
                project_id="prj_demo_ad_spot",
                days_ago=10,
                hour=3,
                prompt_text="Optimistic 30-second brand bed with warm analog synths and light percussion.",
                asset_name="ad-brand-bed.wav",
                operator_key="maya",
            ),
            runway_event(
                event_id="evt_demo_ad_city_01",
                project_id="prj_demo_ad_spot",
                days_ago=8,
                hour=5,
                prompt_text="Morning commuter montage with bright storefront reflections and quick match cuts.",
                asset_name="ad-commuter-montage.mp4",
                operator_key="eli",
            ),
            suno_event(
                event_id="evt_demo_ad_sting_01",
                project_id="prj_demo_ad_spot",
                days_ago=5,
                hour=2,
                prompt_text="Three-second sonic logo, confident but understated, resolves on a soft bell tone.",
                asset_name="ad-sonic-logo.wav",
                operator_key="maya",
                rights_info=rights(
                    commercial_use="restricted",
                    output_license="temp-only",
                    training_data_basis="unknown",
                ),
                disclosure_category="temporary score",
            ),
            runway_event(
                event_id="evt_demo_ad_packshot_01",
                project_id="prj_demo_ad_spot",
                days_ago=2,
                hour=6,
                prompt_text="End-card packshot with label facing camera, subtle turntable move, cream backdrop.",
                asset_name="ad-packshot-endcard.mp4",
                operator_key="eli",
            ),
        ],
        "prj_demo_doc": [
            runway_event(
                event_id=doc_chain_parent,
                project_id="prj_demo_doc",
                days_ago=12,
                hour=2,
                prompt_text="Documentary reenactment plate of a 1970s newsroom, empty desks, practical lamps.",
                asset_name="doc-newsroom-plate.mp4",
                operator_key="maya",
            ),
            runway_event(
                event_id="evt_demo_doc_plate_02",
                project_id="prj_demo_doc",
                days_ago=11,
                hour=4,
                prompt_text="Extend the newsroom plate with slow push-in and subtle dust in the projector beam.",
                asset_name="doc-newsroom-push.mp4",
                operator_key="maya",
                parent_event_ids=[doc_chain_parent],
            ),
            voice_event(
                event_id="evt_demo_doc_voice_01",
                project_id="prj_demo_doc",
                days_ago=7,
                hour=3,
                prompt_text="Generate approved synthetic narration pickup for an archival transition.",
                asset_name="doc-narration-pickup.wav",
                operator_key="eli",
                subject="Riley Morgan",
            ),
            event(
                event_id="evt_demo_doc_caption_01",
                project_id="prj_demo_doc",
                days_ago=4,
                hour=5,
                tool_identifier="runway-ml",
                tool_version="2026.05",
                tool_url="https://runwayml.com",
                model_identifier="gen-3-alpha-turbo",
                model_version="3.0",
                prompt_text="Generate a neutral lower-third text plate for archival interview identification.",
                asset_name="doc-lower-third.txt",
                asset_type="text",
                mime_type="text/plain",
                duration_seconds=None,
                operator_key="eli",
                parameters={"format": "lower-third", "style": "neutral"},
                rights_info=rights(output_license="runway-enterprise"),
                disclosure_info=disclosure("ai text plate", "prj_demo_doc"),
            ),
        ],
    }


def project_has_events(session: Session, project_id: str) -> bool:
    statement = select(AIEvent).where(AIEvent.project_id == project_id).limit(1)
    return session.exec(statement).first() is not None


def main() -> None:
    inserted = 0
    skipped: list[str] = []

    with Session(engine) as session:
        for project_id, events in demo_events().items():
            if project_has_events(session, project_id):
                skipped.append(project_id)
                print(f"Skipping {project_id}: existing events found.")
                continue

            session.add_all(events)
            inserted += len(events)
            print(f"Prepared {len(events)} events for {project_id}.")

        if inserted:
            session.commit()
        else:
            session.rollback()

    print(
        "Seed demo complete: "
        f"{inserted} event{'s' if inserted != 1 else ''} inserted, "
        f"{len(skipped)} project{'s' if len(skipped) != 1 else ''} skipped."
    )


if __name__ == "__main__":
    main()
