"""Reserva y liberación de cupos a pedido de orders. Ambas operaciones son idempotentes por orderId."""

import logging
import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError, not_found
from app.models import Event, EventStatus, Reservation
from app.repositories import event_repository as events
from app.repositories import reservation_repository as reservations
from app.schemas.reservation import ReservationIn, ReservationOut, ReservedEvent, ReservedSector

log = logging.getLogger(__name__)


def _to_out(reservation: Reservation, event: Event) -> ReservationOut:
    sector = next(s for s in event.sectors if s.id == reservation.sector_id)
    return ReservationOut(
        order_id=reservation.order_id,
        quantity=reservation.quantity,
        unit_price=reservation.unit_price,
        total=reservation.unit_price * reservation.quantity,
        event=ReservedEvent(id=event.id, name=event.name, date=event.date, venue=event.venue),
        sector=ReservedSector(id=sector.id, name=sector.name),
    )


def _existing(db: Session, reservation: Reservation) -> ReservationOut:
    log.info("reserva repetida, se devuelve la existente", extra={"orderId": str(reservation.order_id)})
    return _to_out(reservation, events.get(db, reservation.event_id))  # type: ignore[arg-type]


def reserve(db: Session, data: ReservationIn) -> ReservationOut:
    existing = reservations.get_by_order(db, data.order_id)
    if existing is not None:
        return _existing(db, existing)

    event = events.get(db, data.event_id)
    if event is None:
        raise not_found("EVENTO_NO_ENCONTRADO", "El evento no existe")
    if event.status != EventStatus.PUBLICADO:
        raise AppError(422, "EVENTO_NO_DISPONIBLE", "El evento no está a la venta")
    sector = next((s for s in event.sectors if s.id == data.sector_id), None)
    if sector is None:
        raise not_found("SECTOR_NO_ENCONTRADO", "El sector no pertenece al evento")

    if not events.try_take_seats(db, event.id, sector.id, data.quantity):
        db.rollback()
        log.info("sin cupo", extra={"orderId": str(data.order_id), "sectorId": str(sector.id)})
        raise AppError(409, "AGOTADO", "No hay cupo suficiente en el sector")

    reservation = reservations.add(
        db,
        Reservation(
            order_id=data.order_id,
            event_id=event.id,
            sector_id=sector.id,
            quantity=data.quantity,
            unit_price=sector.price,
        ),
    )
    try:
        db.commit()
    except IntegrityError:
        # Otra petición con el mismo orderId ganó la carrera: el rollback devuelve los cupos descontados aquí.
        db.rollback()
        existing = reservations.get_by_order(db, data.order_id)
        if existing is None:
            raise
        return _existing(db, existing)

    log.info("cupos reservados", extra={"orderId": str(data.order_id), "quantity": data.quantity})
    return _to_out(reservation, event)


def release(db: Session, order_id: uuid.UUID) -> bool:
    released = reservations.mark_released(db, order_id)
    if released is None:
        db.rollback()
        return False
    events.give_back_seats(db, released.sector_id, released.quantity)
    db.commit()
    log.info("cupos liberados", extra={"orderId": str(order_id), "quantity": released.quantity})
    return True
