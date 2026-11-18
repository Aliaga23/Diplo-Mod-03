"""Toda la configuración sale de variables de entorno (o de un archivo .env en desarrollo)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = "tickets"
    host: str
    port: int
    log_level: str = "info"
    database_url: str
    jwt_secret: str
    jwt_issuer: str
    internal_api_token: str
    tickets_dir: Path  # carpeta local donde se guardan los PDF
    display_timezone: str = "UTC"  # zona horaria con la que se imprime la fecha en el PDF


settings = Settings()  # type: ignore[call-arg]  # los valores vienen del entorno
