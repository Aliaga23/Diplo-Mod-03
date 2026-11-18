"""Rutas públicas y del organizador. Vía Nginx: /api/events/events/..."""

import uuid

from fastapi import APIRouter, status

from app.api.deps import DbSession, OptionalUser, Organizer
from app.schemas.event import EventIn, EventOut, StatusIn
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_billboard(db: DbSession):
    """Cartelera: solo eventos publicados, ordenados por fecha."""
    return event_service.list_billboard(db)


@router.get("/mine", response_model=list[EventOut])
def list_mine(db: DbSession, user: Organizer):
    return event_service.list_mine(db, user)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: uuid.UUID, db: DbSession, user: OptionalUser):
    return event_service.get_visible(db, event_id, user)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(data: EventIn, db: DbSession, user: Organizer):
    return event_service.create(db, data, user)


@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: uuid.UUID, data: EventIn, db: DbSession, user: Organizer):
    return event_service.update(db, event_id, data, user)


@router.patch("/{event_id}/status", response_model=EventOut)
def change_status(event_id: uuid.UUID, data: StatusIn, db: DbSession, user: Organizer):
    return event_service.change_status(db, event_id, data.status, user)
