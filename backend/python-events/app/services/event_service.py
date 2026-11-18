"""Reglas de negocio del catálogo: quién ve qué, edición de sectores y estados."""

import uuid

from sqlalchemy.orm import Session

from app.core.errors import AppError, not_found
from app.core.security import CurrentUser
from app.models import Event, EventStatus, Sector
from app.repositories import event_repository as repo
from app.schemas.event import EventIn

_EVENT_NOT_FOUND = ("EVENTO_NO_ENCONTRADO", "El evento no existe")

# Transiciones permitidas. "cancelado" es definitivo.
_TRANSITIONS: dict[EventStatus, set[EventStatus]] = {
    EventStatus.BORRADOR: {EventStatus.PUBLICADO, EventStatus.CANCELADO},
    EventStatus.PUBLICADO: {EventStatus.BORRADOR, EventStatus.CANCELADO},
    EventStatus.CANCELADO: set(),
}


def list_billboard(db: Session) -> list[Event]:
    return repo.list_published(db)


def list_mine(db: Session, user: CurrentUser) -> list[Event]:
    return repo.list_by_organizer(db, uuid.UUID(user.id))


def get_visible(db: Session, event_id: uuid.UUID, user: CurrentUser | None) -> Event:
    """Los publicados los ve cualquiera; los demás, solo su organizador."""
    event = repo.get(db, event_id)
    if event is None:
        raise not_found(*_EVENT_NOT_FOUND)
    if event.status == EventStatus.PUBLICADO or (user and str(event.organizer_id) == user.id):
        return event
    raise not_found(*_EVENT_NOT_FOUND)


def get_any(db: Session, event_id: uuid.UUID) -> Event:
    event = repo.get(db, event_id)
    if event is None:
        raise not_found(*_EVENT_NOT_FOUND)
    return event


def _get_owned(db: Session, event_id: uuid.UUID, user: CurrentUser) -> Event:
    event = repo.get(db, event_id)
    if event is None or str(event.organizer_id) != user.id:
        # 404 también si no es el dueño: no se revela que el evento existe.
        raise not_found(*_EVENT_NOT_FOUND)
    return event


def create(db: Session, data: EventIn, user: CurrentUser) -> Event:
    event = Event(
        organizer_id=uuid.UUID(user.id),
        name=data.name,
        date=data.date,
        venue=data.venue,
        image_url=data.image_url,
        description=data.description,
        status=EventStatus.BORRADOR,
        sectors=[
            Sector(name=s.name.strip(), price=s.price, capacity=s.capacity, available=s.capacity) for s in data.sectors
        ],
    )
    repo.add(db, event)
    db.commit()
    db.refresh(event)
    return event


def update(db: Session, event_id: uuid.UUID, data: EventIn, user: CurrentUser) -> Event:
    event = _get_owned(db, event_id, user)
    event.name, event.date, event.venue = data.name, data.date, data.venue
    event.image_url, event.description = data.image_url, data.description

    current = {s.id: s for s in event.sectors}
    incoming_ids = {s.id for s in data.sectors if s.id is not None}

    if incoming_ids - current.keys():
        raise AppError(422, "SECTOR_INVALIDO", "Uno de los sectores no pertenece a este evento")

    # Sectores que ya no vienen: solo se pueden quitar si nunca se reservó en ellos.
    for sector_id, sector in current.items():
        if sector_id not in incoming_ids:
            if repo.sector_has_reservations(db, sector_id):
                raise AppError(
                    422, "SECTOR_CON_VENTAS", f"El sector «{sector.name}» tiene ventas y no puede eliminarse"
                )
            event.sectors.remove(sector)
    db.flush()  # borra primero, así un sector nuevo puede reutilizar el nombre de uno eliminado

    for item in data.sectors:
        if item.id is None:
            event.sectors.append(
                Sector(name=item.name.strip(), price=item.price, capacity=item.capacity, available=item.capacity)
            )
            continue
        sector = current[item.id]
        sold = sector.sold
        if item.capacity < sold:
            raise AppError(
                422,
                "CUPO_MENOR_A_VENDIDO",
                f"El sector «{sector.name}» ya vendió {sold} entradas; el cupo no puede ser menor",
            )
        sector.name, sector.price = item.name.strip(), item.price
        sector.capacity, sector.available = item.capacity, item.capacity - sold

    db.commit()
    db.refresh(event)
    return event


def change_status(db: Session, event_id: uuid.UUID, new_status: EventStatus, user: CurrentUser) -> Event:
    event = _get_owned(db, event_id, user)
    current = EventStatus(event.status)
    if new_status != current and new_status not in _TRANSITIONS[current]:
        raise AppError(422, "TRANSICION_INVALIDA", f"No se puede pasar de «{current}» a «{new_status}»")
    event.status = new_status
    db.commit()
    db.refresh(event)
    return event
