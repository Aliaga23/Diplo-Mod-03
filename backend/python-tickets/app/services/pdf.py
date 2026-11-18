"""Genera el PDF de una entrada (A6, negro sobre blanco) con el código QR."""

import io
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import segno
from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.models import Ticket

_DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]  # fmt: skip

_PAGE_W, _PAGE_H = 105, 148  # A6 en mm
_MARGIN = 8
_QR_SIZE = 50


def format_date(value: datetime, tz: ZoneInfo) -> str:
    local = value.astimezone(tz)
    return f"{_DAYS[local.weekday()]} {local.day} de {_MONTHS[local.month - 1]} de {local.year}, {local:%H:%M}"


# Las fuentes estándar del PDF solo cubren Latin-1 (incluye tildes y ñ). Lo demás se aproxima.
_TYPOGRAPHY = str.maketrans({"–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'", "…": "...", "•": "·"})


def _pdf_text(value: str) -> str:
    return value.translate(_TYPOGRAPHY).encode("latin-1", "replace").decode("latin-1")


def _qr_png(code: str) -> io.BytesIO:
    buffer = io.BytesIO()
    # make_qr fuerza un QR normal: con códigos cortos, segno.make elegiría Micro QR, que muchas cámaras no leen.
    segno.make_qr(code, error="m").save(buffer, kind="png", scale=10, border=2)
    buffer.seek(0)
    return buffer


def _field(pdf: FPDF, label: str, value: str) -> None:
    pdf.set_font("Helvetica", "", 6.5)
    pdf.set_text_color(110)
    pdf.cell(0, 3.5, label.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(0)
    pdf.multi_cell(0, 4.5, _pdf_text(value), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1.5)


def render_ticket_pdf(ticket: Ticket, target: Path, tz: ZoneInfo) -> None:
    pdf = FPDF(orientation="P", unit="mm", format=(_PAGE_W, _PAGE_H))
    pdf.set_auto_page_break(False)
    pdf.set_margins(_MARGIN, _MARGIN, _MARGIN)
    pdf.set_title(f"Entrada {ticket.code}")
    pdf.set_author("EntradasYa")
    pdf.add_page()

    # Encabezado
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 5, "EntradasYa", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 6.5)
    pdf.set_text_color(110)
    pdf.cell(0, 3.5, "ENTRADA ELECTRÓNICA", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    y = pdf.get_y() + 2
    pdf.set_line_width(0.3)
    pdf.line(_MARGIN, y, _PAGE_W - _MARGIN, y)
    pdf.set_y(y + 4)

    # Evento
    pdf.set_text_color(0)
    pdf.set_font("Helvetica", "B", 13)
    pdf.multi_cell(0, 6, _pdf_text(ticket.event_name), new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
    pdf.ln(2)
    _field(pdf, "Fecha", format_date(ticket.event_date, tz))
    _field(pdf, "Lugar", ticket.venue)
    _field(pdf, "Sector", ticket.sector_name)

    # QR centrado y código legible debajo
    qr_y = max(pdf.get_y() + 2, 74)
    qr_size = min(_QR_SIZE, _PAGE_H - 24 - qr_y)  # si el nombre es muy largo, el QR se achica y no pisa el pie
    pdf.image(_qr_png(ticket.code), x=(_PAGE_W - qr_size) / 2, y=qr_y, w=qr_size, h=qr_size)
    pdf.set_y(qr_y + qr_size + 1)
    pdf.set_font("Courier", "B", 14)
    pdf.cell(0, 6, ticket.code, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Pie
    pdf.set_y(-14)
    pdf.set_font("Helvetica", "", 6.5)
    pdf.set_text_color(110)
    pdf.multi_cell(0, 3.2, "Válida para un solo ingreso. Presente este código en la puerta del evento.", align="C")

    # Escritura atómica: nunca queda un PDF a medio escribir en la carpeta.
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(".pdf.tmp")
    pdf.output(str(tmp))
    os.replace(tmp, target)
