import uuid

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models import Reservation


def get_by_order(db: Session, order_id: uuid.UUID) -> Reservation | None:
    return db.scalar(select(Reservation).where(Reservation.order_id == order_id))


def add(db: Session, reservation: Reservation) -> Reservation:
    db.add(reservation)
    return reservation


def mark_released(db: Session, order_id: uuid.UUID) -> Reservation | None:
    """Marca la reserva como liberada solo si no lo estaba (atómico). Devuelve None si no había nada que liberar."""
    stmt = (
        update(Reservation)
        .where(Reservation.order_id == order_id, Reservation.released_at.is_(None))
        .values(released_at=func.now())
        .returning(Reservation)
    )
    return db.scalars(stmt).first()
