from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.routing import APIRoute
from starlette.middleware.sessions import SessionMiddleware
from app.api import api_router
from app.config_server import load_config, save_config, hash_value
import logging
import os

app = FastAPI(strict_slashes=False)
app.add_middleware(SessionMiddleware, secret_key="your-secure-random-key")

# Mount only under /static
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include API endpoints
app.include_router(api_router)

# Root route manually serves login/index based on auth
@app.get("/")
async def root(request: Request):
    static_path = "app/static"
    if not request.session.get("user"):
        return FileResponse(os.path.join(static_path, "login.html"))
    return FileResponse(os.path.join(static_path, "index.html"))

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    config = load_config()
    hashed_input = hash_value(password)
    if username == config.get("username") and hashed_input == config.get("password"):
        request.session["user"] = username
        if config.get("require_password_change", True):
            return RedirectResponse("/static/change_password.html", status_code=302)
        return RedirectResponse("/", status_code=302)
    return RedirectResponse("/static/login.html?error=1", status_code=302)

@app.post("/change-password")
async def change_password(request: Request, username: str = Form(...), password: str = Form(...)):
    config = load_config()
    config["username"] = username
    config["password"] = hash_value(password)
    config["require_password_change"] = False
    save_config(config)
    request.session["user"] = username
    return RedirectResponse("/", status_code=302)

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/static/login.html")

# Optional: Route logger
logger = logging.getLogger("availarr")
logging.basicConfig(level=logging.INFO)
for route in app.routes:
    if isinstance(route, APIRoute):
        logger.info(f"Registered route: {route.path} - Methods: {', '.join(route.methods)}")
