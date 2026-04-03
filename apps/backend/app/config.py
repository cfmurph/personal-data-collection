from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "supersecretkey-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    DATABASE_URL: str = "sqlite:///./personal_data_hub.db"

    class Config:
        env_file = ".env"


settings = Settings()
