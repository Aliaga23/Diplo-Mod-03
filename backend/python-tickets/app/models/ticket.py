import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TicketStatus(StrEnum):
    VALIDA = "valida"


class Ticket(Base):
    """Una entrada por asiento comprado. Guarda una copia de los datos del evento para el PDF."""

    __tablename__ = "tickets"
    __table_args__ = (
        # (order_id, seq) único: si orders reintenta, la segunda emisión choca y se devuelven las existentes.
        UniqueConstraint("order_id", "seq", name="uq_tickets_order_id_seq"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(14), unique=True)
    order_id: Mapped[uuid.UUID] = mapped_column(index=True)
    seq: Mapped[int]  # 1..N dentro de la orden
    user_id: Mapped[uuid.UUID] = mapped_column(index=True)
    event_id: Mapped[uuid.UUID] = mapped_column(index=True)
    event_name: Mapped[str] = mapped_column(String(200))
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    venue: Mapped[str] = mapped_column(String(200))
    sector_id: Mapped[uuid.UUID]
    sector_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default=TicketStatus.VALIDA)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
