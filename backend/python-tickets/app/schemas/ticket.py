import uuid

from pydantic import AwareDatetime, Field

from app.models import TicketStatus
from app.schemas.common import CamelModel, UtcDatetime


# ---------- Entrada (desde orders) ----------
class EventInfo(CamelModel):
    id: uuid.UUID
    name: str = Field(min_length=1, max_length=200)
    date: AwareDatetime
    venue: str = Field(min_length=1, max_length=200)


class SectorInfo(CamelModel):
    id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)


class IssueTicketsIn(CamelModel):
    order_id: uuid.UUID
    user_id: uuid.UUID
    event: EventInfo
    sector: SectorInfo
    quantity: int = Field(gt=0, le=6)


# ---------- Salida ----------
class TicketOut(CamelModel):
    code: str
    order_id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    event_name: str
    event_date: UtcDatetime
    venue: str
    sector_name: str
    status: TicketStatus
    created_at: UtcDatetime


class IssueTicketsOut(CamelModel):
    tickets: list[TicketOut]
