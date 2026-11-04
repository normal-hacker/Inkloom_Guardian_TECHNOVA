from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.check import router as check_router
from app.routers.health import router as health_router

app = FastAPI(
    title="Inkloom Guardian API",
    version="0.1.0",
    description="Brand governance checks for the Inkloom Guardian demo.",
)

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(check_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Inkloom Guardian API is running."}
