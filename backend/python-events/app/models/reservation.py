import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Reservation(Base):
    """Cupos apartados para una orden. order_id es único: reservar dos veces no descuenta dos veces."""

    __tablename__ = "reservations"
    __table_args__ = (CheckConstraint("quantity > 0", name="cantidad_positiva"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(unique=True)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), index=True)
    sector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sectors.id"), index=True)
    quantity: Mapped[int]
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
