import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightOrion Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./data/insightorion.db")
    
    # Authentication & JWT
    JWT_SECRET_KEY: str = Field(default="enterprise_mind_super_secret_session_key_98234")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)  # 24 hours
    
    # Gemini AI
    GEMINI_API_KEY: str = Field(default="")
    
    # Google Workspace Integration
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/api/v1/auth/google/callback")
    
    # Directories
    DATA_DIR: str = Field(default="data")
    UPLOAD_DIR: str = Field(default="data/uploads")
    TENANTS_DATA_DIR: str = Field(default="data/tenants")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Reset placeholder values to empty strings to preserve sandbox/mock mode functionality
if settings.GEMINI_API_KEY.startswith("your-") or "placeholder" in settings.GEMINI_API_KEY.lower():
    settings.GEMINI_API_KEY = ""
if settings.GOOGLE_CLIENT_ID.startswith("your-") or "placeholder" in settings.GOOGLE_CLIENT_ID.lower():
    settings.GOOGLE_CLIENT_ID = ""
if settings.GOOGLE_CLIENT_SECRET.startswith("your-") or "placeholder" in settings.GOOGLE_CLIENT_SECRET.lower():
    settings.GOOGLE_CLIENT_SECRET = ""

# Ensure base directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TENANTS_DATA_DIR, exist_ok=True)
