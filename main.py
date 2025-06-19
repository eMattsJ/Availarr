from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api import api_router  # centralized router file

app = FastAPI(strict_slashes=False)

# Include API routes (webhook and config)
app.include_router(api_router)

# Serve static files (e.g., frontend)
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")

# Debug: Log all registered routes
import logging
from fastapi.routing import APIRoute

logger = logging.getLogger("availarr")
logging.basicConfig(level=logging.INFO)

for route in app.routes:
    if isinstance(route, APIRoute):
        logger.info(f"Registered route: {route.path} - Methods: {', '.join(route.methods)}")
    else:
        logger.info(f"Mounted route: {route.path} (type: {type(route).__name__})")
