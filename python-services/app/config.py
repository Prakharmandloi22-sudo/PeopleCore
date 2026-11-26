import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "PeopleCore Python Payroll & Analytics Service"
    app_version: str = "1.0.0"
    port: int = int(os.getenv("PYTHON_SERVICE_PORT", "8000"))
    internal_api_key: str = os.getenv("PYTHON_API_KEY", "peoplecore_internal_python_service_secret_token_2026")
    environment: str = os.getenv("NODE_ENV", "development")

settings = Settings()
