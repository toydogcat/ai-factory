from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Factory"
    API_V1_STR: str = "/api/v1"
    
    # 🕵️‍♂️ Enforce .env loading to bypass default local fallbacks
    # Note: .env is in the project root, while this app starts in backend/
    model_config = SettingsConfigDict(
        env_file="../.env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # DB settings (Loaded from .env if present)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "ai_factory"
    POSTGRES_PORT: str = "5432"
    
    # Dual Database URLs for Mother-Child Orchestration
    DATABASE_URL: str | None = None
    FACTORY_DATABASE_URL: str | None = None
    
    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def get_factory_url(self) -> str:
        if self.FACTORY_DATABASE_URL:
            return self.FACTORY_DATABASE_URL
        return self.get_database_url

    SECRET_KEY: str = "super-secret-key-ai-factory"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
settings = Settings()
