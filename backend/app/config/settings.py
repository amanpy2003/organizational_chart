from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    cors_origins: str = "http://localhost:5180,http://127.0.0.1:5180"
    # Local-dev safety net: if the frontend's port ever changes again (another
    # app squatting the usual port, a manual --port override, etc.), requests
    # from any localhost port still work instead of failing CORS with a
    # generic, hard-to-diagnose "upload failed" error. Only matches
    # localhost/127.0.0.1 — never opens this up to arbitrary origins.
    cors_origin_regex: str = r"^http://(localhost|127\.0\.0\.1):\d+$"
    max_upload_mb: int = 15
    max_employees: int = 5000

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
