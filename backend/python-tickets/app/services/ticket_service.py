"""Reglas de negocio de las entradas: emisión idempotente, consulta y descarga del PDF."""

import logging
import uuid
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import not_found
from app.core.security import CurrentUser
from app.models import Ticket, TicketStatus
from app.repositories import ticket_repository as repo
from app.schemas.ticket import IssueTicketsIn
from app.services import codes
from app.services.pdf import render_ticket_pdf

log = logging.getLogger(__name__)

_TZ = ZoneInfo(settings.display_timezone)
_NOT_FOUND = ("TICKET_NO_ENCONTRADO", "La entrada no existe")


def pdf_path(ticket: Ticket) -> Path:
    return settings.tickets_dir / f"{ticket.code}.pdf"


def ensure_pdf(ticket: Ticket) -> Path:
    """Crea el PDF si todavía no está en la carpeta (por ejemplo, si se borró o falló la primera vez)."""
    path = pdf_path(ticket)
    if not path.exists():
        render_ticket_pdf(ticket, path, _TZ)
    return path


def issue(db: Session, data: IssueTicketsIn) -> list[Ticket]:
    """Una entrada por asiento. Si la orden ya tiene entradas, devuelve las mismas (idempotente)."""
    existing = repo.list_by_order(db, data.order_id)
    if existing:
        log.info("emisión repetida, se devuelven las entradas existentes", extra={"orderId": str(data.order_id)})
    else:
        tickets = [
            Ticket(
                code=codes.new_code(),
                order_id=data.order_id,
                seq=seq,
                user_id=data.user_id,
                event_id=data.event.id,
                event_name=data.event.name,
                event_date=data.event.date,
                venue=data.event.venue,
                sector_id=data.sector.id,
                sector_name=data.sector.name,
                status=TicketStatus.VALIDA,
            )
            for seq in range(1, data.quantity + 1)
        ]
        repo.add_all(db, tickets)
        try:
            db.commit()
            existing = tickets
            log.info("entradas emitidas", extra={"orderId": str(data.order_id), "quantity": data.quantity})
        except IntegrityError:
            # Emisión simultánea de la misma orden (o choque de código, casi imposible): se usa lo que quedó guardado.
            db.rollback()
            existing = repo.list_by_order(db, data.order_id)
            if not existing:
                raise

    for ticket in existing:
        ensure_pdf(ticket)
    return existing


def get_by_code(db: Session, code: str) -> Ticket:
    normalized = codes.normalize(code)
    ticket = repo.get_by_code(db, normalized) if normalized else None
    if ticket is None:
        raise not_found(*_NOT_FOUND)
    return ticket


def list_mine(db: Session, user: CurrentUser) -> list[Ticket]:
    return repo.list_by_user(db, uuid.UUID(user.id))


def pdf_for_owner(db: Session, code: str, user: CurrentUser) -> tuple[Ticket, Path]:
    ticket = get_by_code(db, code)
    if str(ticket.user_id) != user.id:
        raise not_found(*_NOT_FOUND)  # no se revela que la entrada existe
    return ticket, ensure_pdf(ticket)
