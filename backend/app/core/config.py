from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = 'CityFixAI API'
    version: str = '0.1.0'
    environment: str = 'development'
    database_url: str = 'sqlite+aiosqlite:///./cityfix.db'
    jwt_secret: str = 'dev-secret-change-me'
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60 * 24
    refresh_token_expire_minutes: int = 60 * 24 * 30
    openai_api_key: str | None = None
    openai_vision_model: str = 'gpt-4o-mini'
    ai_confidence_threshold: float = 0.7
    demo_seed_enabled: bool = True
    cors_origins: list[str] = ['*']
    rate_limit_per_minute: int = 120
    upload_dir: str = 'uploads'
    public_base_url: str = 'http://localhost:8000'
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_storage_bucket: str = 'cityfix-uploads'
    log_level: str = 'INFO'

    class Config:
        env_file = '.env'

@lru_cache
def get_settings():
    return Settings()
