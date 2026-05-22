from __future__ import annotations

from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

TERRACOTTA = colors.HexColor("#E97451")
INK = colors.HexColor("#1F2933")
MUTED = colors.HexColor("#5B6472")
RULE = colors.HexColor("#D8DEE6")


class NumberedDocTemplate(BaseDocTemplate):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates(
            [
                PageTemplate(
                    id="numbered",
                    frames=[frame],
                    onPage=self._draw_footer,
                )
            ]
        )

    def _draw_footer(self, canvas: Any, doc: Any) -> None:
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.line(doc.leftMargin, 0.55 * inch, LETTER[0] - doc.rightMargin, 0.55 * inch)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(doc.leftMargin, 0.35 * inch, "LINEAGE AI Bill of Materials")
        canvas.drawRightString(
            LETTER[0] - doc.rightMargin,
            0.35 * inch,
            f"Page {doc.page}",
        )
        canvas.restoreState()


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "LineageTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=INK,
            spaceAfter=12,
        ),
        "section": ParagraphStyle(
            "LineageSection",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=TERRACOTTA,
            spaceBefore=12,
            spaceAfter=8,
        ),
        "body": ParagraphStyle(
            "LineageBody",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=INK,
        ),
        "small": ParagraphStyle(
            "LineageSmall",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=INK,
        ),
        "small_right": ParagraphStyle(
            "LineageSmallRight",
            parent=base["BodyText"],
            alignment=TA_RIGHT,
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=INK,
        ),
    }


def _p(value: Any, style: ParagraphStyle) -> Paragraph:
    text = "" if value is None else str(value)
    escaped = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )
    return Paragraph(escaped, style)


def _event_rows(manifest: dict[str, Any], styles: dict[str, ParagraphStyle]) -> list[list[Any]]:
    rows: list[list[Any]] = [
        [
            _p("Timestamp", styles["small"]),
            _p("Tool / Model", styles["small"]),
            _p("Prompt", styles["small"]),
            _p("Output", styles["small"]),
        ]
    ]

    for event in manifest["events"]:
        rows.append(
            [
                _p(event["timestamp"], styles["small"]),
                _p(
                    f"{event['tool']['identifier']}<br/>{event['model']['identifier']}",
                    styles["small"],
                ),
                _p(event["input"]["promptText"], styles["small"]),
                _p(
                    f"{event['output']['assetType']}<br/>{event['output']['assetUrl']}",
                    styles["small"],
                ),
            ]
        )

    return rows


def generate_manifest_pdf(manifest: dict[str, Any]) -> bytes:
    styles = _styles()
    buffer = BytesIO()
    doc = NumberedDocTemplate(
        buffer,
        pagesize=LETTER,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.75 * inch,
        title="LINEAGE AI Bill of Materials",
        author=manifest["issuer"]["name"],
    )

    signature = manifest["signature"]
    public_key = signature["publicKey"]
    story: list[Any] = [
        Paragraph("LINEAGE AI Bill of Materials", styles["title"]),
        _p(f"Project: {manifest['project']['name']} ({manifest['project']['id']})", styles["body"]),
        _p(f"Manifest ID: {manifest['manifestId']}", styles["body"]),
        _p(f"Generated: {manifest['generatedAt']}", styles["body"]),
        _p(f"Issuer: {manifest['issuer']['name']} ({manifest['issuer']['id']})", styles["body"]),
        Spacer(1, 0.14 * inch),
        Paragraph("AI Events", styles["section"]),
    ]

    event_table = Table(
        _event_rows(manifest, styles),
        colWidths=[1.15 * inch, 1.2 * inch, 2.55 * inch, 2.1 * inch],
        repeatRows=1,
    )
    event_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TERRACOTTA),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(event_table)
    story.extend(
        [
            Paragraph("Signature", styles["section"]),
            _p(f"Algorithm: {signature['algorithm']}", styles["body"]),
            _p(f"Created: {signature['createdAt']}", styles["body"]),
            _p(f"Key ID: {public_key.get('kid', '')}", styles["body"]),
            _p(f"Public key: {public_key['x']}", styles["small"]),
            _p(f"Payload digest ({signature['digest']['algorithm']}):", styles["body"]),
            _p(signature["digest"]["value"], styles["small"]),
            _p("Signature value:", styles["body"]),
            _p(signature["signatureValue"], styles["small"]),
            Paragraph("C2PA Compatibility", styles["section"]),
            _p(
                (
                    f"Spec version {manifest['c2pa']['specVersion']}; "
                    f"claim signature label {manifest['c2pa']['claimSignatureLabel']}; "
                    f"payload mode {manifest['c2pa']['signaturePayloadMode']}."
                ),
                styles["body"],
            ),
        ]
    )

    doc.build(story)
    return buffer.getvalue()
