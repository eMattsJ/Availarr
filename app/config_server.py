import os
import json
import hashlib
import requests
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.utils.logging import log_event

# Default to Docker volume location for persisted config
CONFIG_FILE = os.getenv("CONFIG_PATH", "/config/config.json")

router = APIRouter()

def hash_value(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

DEFAULT_CONFIG = {
    "username": "admin",
    "password": hash_value("123456"),
    "require_password_change": True,
    "TMDB_API_KEY": "",
    "OVERSEERR_URL": "",
    "OVERSEERR_API_KEY": "",
    "DISCORD_WEBHOOK_URL": "",
    "providers": []
}

class EnvConfig(BaseModel):
    TMDB_API_KEY: str
    OVERSEERR_URL: str
    OVERSEERR_API_KEY: str
    DISCORD_WEBHOOK_URL: str
    PROVIDERS: list[str] = []

def load_config():
    # Ensure directory exists for first-time deployment
    config_dir = os.path.dirname(CONFIG_FILE)
    if not os.path.exists(config_dir):
        os.makedirs(config_dir, exist_ok=True)

    if not os.path.exists(CONFIG_FILE) or os.path.isdir(CONFIG_FILE):
        with open(CONFIG_FILE, "w") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return DEFAULT_CONFIG

    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        log_event("config_load_error", error=str(e))
        return {}

def save_config(cfg: dict):
    try:
        if "password" in cfg:
            cfg["password"] = hash_value(cfg["password"])

        with open(CONFIG_FILE, "w") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        log_event("config_save_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to save configuration")

@router.get("")
def get_config():
    config = load_config()
    log_event("config_read", keys=list(config.keys()))
    return config

@router.post("")
def update_config(cfg: EnvConfig):
    config = load_config()
    config.update(cfg.dict())
    save_config(config)
    log_event("config_updated", updated_keys=list(cfg.dict().keys()))
    return {"message": "Configuration updated successfully"}

@router.get("/test/tmdb")
def test_tmdb(key: str = Query(None)):
    api_key = key or load_config().get("TMDB_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="TMDB_API_KEY missing")

    url = "https://api.themoviedb.org/3/authentication"
    headers = {"Authorization": f"Bearer {api_key}", "accept": "application/json"}
    r = requests.get(url, headers=headers, timeout=10)
    log_event("test_tmdb", status=r.status_code)

    return {"success": r.status_code == 200}

@router.get("/test/overseerr")
def test_overseerr(url: str = Query(None), key: str = Query(None)):
    cfg = load_config()
    test_url = url or cfg.get("OVERSEERR_URL")
    api_key = key or cfg.get("OVERSEERR_API_KEY")

    if not test_url:
        raise HTTPException(status_code=400, detail="Overseerr URL missing")
    if not api_key:
        raise HTTPException(status_code=400, detail="Overseerr API Key missing")

    headers = {"X-Api-Key": api_key}
    try:
        response = requests.get(f"{test_url}/api/v1/user", headers=headers, timeout=10)
        log_event("test_overseerr", url=test_url, status=response.status_code)
        return {"success": response.status_code == 200}
    except Exception as e:
        log_event("test_overseerr_failed", error=str(e))
        return {"success": False}

@router.get("/test/discord")
def test_discord(url: str = Query(None)):
    webhook = url or load_config().get("DISCORD_WEBHOOK_URL")
    if not webhook:
        raise HTTPException(status_code=400, detail="Discord webhook URL missing")

    data = {"content": "✅ Discord webhook test successful."}
    try:
        r = requests.post(webhook, json=data, timeout=10)
        log_event("test_discord", status=r.status_code)
        return {"success": r.status_code in [200, 204]}
    except Exception as e:
        log_event("test_discord_failed", error=str(e))
        return {"success": False}
