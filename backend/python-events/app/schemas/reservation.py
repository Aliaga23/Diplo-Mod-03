import uuid

from pydantic import BaseModel, Field

from app.schemas.common import CamelModel, Money, UtcDatetime


class ReservationIn(CamelModel):
    order_id: uuid.UUID
    event_id: uuid.UUID
    sector_id: uuid.UUID
    quantity: int = Field(gt=0, le=100)


class ReservedEvent(CamelModel):
    id: uuid.UUID
    name: str
    date: UtcDatetime
    venue: str


class ReservedSector(CamelModel):
    id: uuid.UUID
    name: str


class ReservationOut(CamelModel):
    order_id: uuid.UUID
    quantity: int
    unit_price: Money
    total: Money
    event: ReservedEvent
    sector: ReservedSector


class ReleaseOut(BaseModel):
    released: bool
