from fastapi import APIRouter
from app.webhook import router as webhook_router
from app.config_server import router as config_router

# Create a master router
api_router = APIRouter()

# Mount feature routers
api_router.include_router(webhook_router, prefix="/webhook")
api_router.include_router(config_router, prefix="/config")

# Health check route
@api_router.get("/healthz")
async def health_check():
    return {"status": "ok"}
