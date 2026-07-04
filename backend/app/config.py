# ============================================================================
# FILE: app/config.py
# ============================================================================

from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Sistem Koperasi Simpan Pinjam"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API untuk Sistem Informasi Koperasi Simpan Pinjam"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "koperasi_sp"
    
    # Connection Pool Settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
    
    # JWT & Security Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Password Hashing
    BCRYPT_ROUNDS: int = 12
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "*"
    CORS_ALLOW_HEADERS: str = "*"
    
    # Pagination Settings
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100
    
    # File Upload Settings
    @property
    def UPLOAD_FOLDER(self) -> str:
        import os
        if os.getenv("VERCEL"):
            return "/tmp/uploads"
        return "uploads"

    MAX_FILE_SIZE: int = 5242880  # 5MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,pdf"
    
    # Koperasi Business Rules
    DEFAULT_BUNGA_PERSEN: float = 2.0
    DENDA_KETERLAMBATAN_PERSEN: float = 0.5
    MAX_LAMA_ANGSURAN: int = 60
    MIN_NOMINAL_PINJAMAN: float = 1000000.0
    MAX_NOMINAL_PINJAMAN: float = 100000000.0
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def DATABASE_URL(self) -> str:
        """
        Generate database URL from components.
        Priority: 
        1. Localhost/Local MySQL (if DB_HOST is localhost/127.0.0.1)
        2. Direct environment DATABASE_URL (Railway)
        3. Vercel Postgres URL (POSTGRES_URL)
        4. Fallback to MySQL config
        """
        import os
        
        # 1. Prioritize localhost MySQL if DB_HOST is localhost/127.0.0.1 (Safeguarded on Railway/Vercel)
        if self.DB_HOST in ["localhost", "127.0.0.1"] and not os.getenv("RAILWAY_ENVIRONMENT_NAME") and not os.getenv("RAILWAY_PROJECT_ID") and not os.getenv("VERCEL"):
            return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            
        # 2. Check if DATABASE_URL is defined directly (e.g. Railway)
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            return db_url
            
        # 3. Check for Vercel/Neon Postgres URL
        # Vercel provides POSTGRES_URL which might start with postgres://
        # SQLAlchemy requires postgresql://
        vercel_db_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL_UNPOOLED")
        
        if vercel_db_url:
            if vercel_db_url.startswith("postgres://"):
                vercel_db_url = vercel_db_url.replace("postgres://", "postgresql://", 1)
            return vercel_db_url
            
        # 4. Fallback to MySQL
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Convert allowed extensions string to list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]


settings = Settings()