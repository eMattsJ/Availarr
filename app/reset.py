from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
import os
from fastapi.templating import Jinja2Templates
from app.auth import verify_session

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

CONFIG_FILE = os.getenv("CONFIG_PATH", "/config/config.json")
RESET_TOKEN = os.getenv("RESET_TOKEN", "letmein")

@router.get("/reset", response_class=HTMLResponse)
async def reset_page(request: Request, token: str = ""):
    # ensure valid session and token
    _ = verify_session(request)
    if token != RESET_TOKEN:
        return HTMLResponse("<h1>403 Forbidden</h1><p>Invalid reset token.</p>", status_code=403)
    return templates.TemplateResponse("reset.html", {"request": request, "token": RESET_TOKEN})

@router.post("/reset", response_class=HTMLResponse)
async def reset_action(request: Request, token: str = Form(...)):
    _ = verify_session(request)
    if token != RESET_TOKEN:
        return HTMLResponse("<h1>403 Forbidden</h1><p>Invalid reset token.</p>", status_code=403)

    if os.path.exists(CONFIG_FILE):
        os.remove(CONFIG_FILE)

    return templates.TemplateResponse("reset_success.html", {"request": request})
