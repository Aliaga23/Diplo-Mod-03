import uuid
from decimal import Decimal

from pydantic import AwareDatetime, Field, field_validator

from app.models import EventStatus
from app.schemas.common import CamelModel, Money, UtcDatetime


# ---------- Entrada ----------
class SectorIn(CamelModel):
    id: uuid.UUID | None = None  # con id se actualiza; sin id se crea
    name: str = Field(min_length=1, max_length=100)
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    capacity: int = Field(gt=0, le=1_000_000)


class EventIn(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    date: AwareDatetime
    venue: str = Field(min_length=1, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    description: str = Field(default="", max_length=5000)
    sectors: list[SectorIn] = Field(min_length=1, max_length=20)

    @field_validator("name", "venue", "description")
    @classmethod
    def strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("image_url")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("sectors")
    @classmethod
    def unique_sector_names(cls, sectors: list[SectorIn]) -> list[SectorIn]:
        names = [s.name.strip().lower() for s in sectors]
        if len(names) != len(set(names)):
            raise ValueError("Los nombres de sector no pueden repetirse")
        return sectors


class StatusIn(CamelModel):
    status: EventStatus


# ---------- Salida ----------
class SectorOut(CamelModel):
    id: uuid.UUID
    name: str
    price: Money
    capacity: int
    available: int


class EventOut(CamelModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    name: str
    date: UtcDatetime
    venue: str
    image_url: str | None
    description: str
    status: EventStatus
    sectors: list[SectorOut]
    created_at: UtcDatetime
