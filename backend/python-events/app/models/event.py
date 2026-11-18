import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EventStatus(StrEnum):
    BORRADOR = "borrador"
    PUBLICADO = "publicado"
    CANCELADO = "cancelado"


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (CheckConstraint("status IN ('borrador', 'publicado', 'cancelado')", name="status_valido"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organizer_id: Mapped[uuid.UUID] = mapped_column(index=True)
    name: Mapped[str] = mapped_column(String(200))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    venue: Mapped[str] = mapped_column(String(200))
    image_url: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default=EventStatus.BORRADOR, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    sectors: Mapped[list[Sector]] = relationship(
        back_populates="event", cascade="all, delete-orphan", order_by="Sector.price", lazy="selectin"
    )


class Sector(Base):
    __tablename__ = "sectors"
    __table_args__ = (
        UniqueConstraint("event_id", "name", name="uq_sectors_event_id_name"),
        CheckConstraint("price >= 0", name="precio_no_negativo"),
        CheckConstraint("capacity > 0", name="cupo_positivo"),
        # La regla "nunca se vende más que el cupo" también la garantiza la base.
        CheckConstraint("available >= 0 AND available <= capacity", name="disponible_en_rango"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    capacity: Mapped[int]
    available: Mapped[int]

    event: Mapped[Event] = relationship(back_populates="sectors")

    @property
    def sold(self) -> int:
        return self.capacity - self.available
