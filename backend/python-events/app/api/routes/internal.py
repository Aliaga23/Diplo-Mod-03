"""Rutas internas (solo orders). Exigen X-Internal-Token y Nginx no las publica."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, require_internal
from app.schemas.event import EventOut
from app.schemas.reservation import ReleaseOut, ReservationIn, ReservationOut
from app.services import event_service, reservation_service

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_internal)])


@router.get("/events/{event_id}", response_model=EventOut)
def get_event_any_status(event_id: uuid.UUID, db: DbSession):
    return event_service.get_any(db, event_id)


@router.post("/reservations", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def reserve(data: ReservationIn, db: DbSession):
    return reservation_service.reserve(db, data)


@router.delete("/reservations/{order_id}", response_model=ReleaseOut)
def release(order_id: uuid.UUID, db: DbSession):
    return ReleaseOut(released=reservation_service.release(db, order_id))
