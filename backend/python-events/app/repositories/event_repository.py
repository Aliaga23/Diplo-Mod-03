"""Acceso a datos de eventos y sectores. Sin reglas de negocio."""

import uuid

from sqlalchemy import exists, select, update
from sqlalchemy.orm import Session

from app.models import Event, EventStatus, Reservation, Sector


def list_published(db: Session) -> list[Event]:
    stmt = select(Event).where(Event.status == EventStatus.PUBLICADO).order_by(Event.date)
    return list(db.scalars(stmt))


def list_by_organizer(db: Session, organizer_id: uuid.UUID) -> list[Event]:
    stmt = select(Event).where(Event.organizer_id == organizer_id).order_by(Event.date.desc())
    return list(db.scalars(stmt))


def get(db: Session, event_id: uuid.UUID) -> Event | None:
    return db.get(Event, event_id)


def add(db: Session, event: Event) -> Event:
    db.add(event)
    return event


def sector_has_reservations(db: Session, sector_id: uuid.UUID) -> bool:
    return bool(db.scalar(select(exists().where(Reservation.sector_id == sector_id))))


def try_take_seats(db: Session, event_id: uuid.UUID, sector_id: uuid.UUID, quantity: int) -> bool:
    """Descuenta cupos en UNA sentencia atómica: solo afecta la fila si alcanza el disponible.

    Dos compras simultáneas nunca pueden dejar `available` en negativo.
    """
    stmt = (
        update(Sector)
        .where(Sector.id == sector_id, Sector.event_id == event_id, Sector.available >= quantity)
        .values(available=Sector.available - quantity)
        .returning(Sector.id)
    )
    return db.execute(stmt).first() is not None


def give_back_seats(db: Session, sector_id: uuid.UUID, quantity: int) -> None:
    db.execute(update(Sector).where(Sector.id == sector_id).values(available=Sector.available + quantity))
