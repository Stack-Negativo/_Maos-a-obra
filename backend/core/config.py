from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_EMAIL: str = "admin@maosaobra.com.br"
    ADMIN_PASSWORD: str = "Admin12345"
    ADMIN_FULL_NAME: str = "Administrador Maos a Obra"
    ADMIN_PHONE: str = "11999999999"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    # BasedPyright: Mandatory fields (DATABASE_URL, SECRET_KEY) are expected
    # to be provided via environment variables at runtime by pydantic-settings.
    return Settings()  # type: ignore
