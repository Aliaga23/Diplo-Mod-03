"""Rutas internas: orders emite entradas y checkin las valida. Exigen X-Internal-Token."""

from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, require_internal
from app.schemas.ticket import IssueTicketsIn, IssueTicketsOut, TicketOut
from app.services import ticket_service

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_internal)])


@router.post("/tickets", response_model=IssueTicketsOut, status_code=status.HTTP_201_CREATED)
def issue_tickets(data: IssueTicketsIn, db: DbSession):
    return IssueTicketsOut(tickets=ticket_service.issue(db, data))


@router.get("/tickets/{code}", response_model=TicketOut)
def get_ticket(code: str, db: DbSession):
    """Informa si el código existe, a qué evento pertenece y su estado."""
    return ticket_service.get_by_code(db, code)
