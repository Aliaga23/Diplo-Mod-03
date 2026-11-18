"""Rutas del cliente. Vía Nginx: /api/tickets/tickets/..."""

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.api.deps import Client, DbSession
from app.schemas.ticket import TicketOut
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/mine", response_model=list[TicketOut])
def list_mine(db: DbSession, user: Client):
    return ticket_service.list_mine(db, user)


@router.get("/{code}/pdf", response_class=FileResponse)
def download_pdf(code: str, db: DbSession, user: Client):
    ticket, path = ticket_service.pdf_for_owner(db, code, user)
    return FileResponse(path, media_type="application/pdf", filename=f"entrada-{ticket.code}.pdf")
