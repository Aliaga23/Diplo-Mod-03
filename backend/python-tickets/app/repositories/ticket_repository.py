"""Acceso a datos de entradas. Sin reglas de negocio."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Ticket


def list_by_order(db: Session, order_id: uuid.UUID) -> list[Ticket]:
    return list(db.scalars(select(Ticket).where(Ticket.order_id == order_id).order_by(Ticket.seq)))


def list_by_user(db: Session, user_id: uuid.UUID) -> list[Ticket]:
    stmt = select(Ticket).where(Ticket.user_id == user_id).order_by(Ticket.created_at.desc(), Ticket.seq)
    return list(db.scalars(stmt))


def get_by_code(db: Session, code: str) -> Ticket | None:
    return db.scalar(select(Ticket).where(Ticket.code == code))


def add_all(db: Session, tickets: list[Ticket]) -> list[Ticket]:
    db.add_all(tickets)
    return tickets
