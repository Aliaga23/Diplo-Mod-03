"""Toda la configuración sale de variables de entorno (o de un archivo .env en desarrollo)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = "events"
    host: str
    port: int
    log_level: str = "info"
    database_url: str
    jwt_secret: str
    jwt_issuer: str
    internal_api_token: str


settings = Settings()  # type: ignore[call-arg]  # los valores vienen del entorno
