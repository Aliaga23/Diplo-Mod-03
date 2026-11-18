"""Tipos base de los esquemas: JSON en camelCase, montos como número y fechas ISO en UTC."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


def _iso_utc(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
UtcDatetime = Annotated[datetime, PlainSerializer(_iso_utc, return_type=str, when_used="json")]
