import json
import logging
from datetime import datetime, date
from uuid import UUID

logger = logging.getLogger("availarr")

def sanitize(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, dict):
        return {sanitize(k): sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize(v) for v in obj]
    return obj

def log_event(event_type, **data):
    try:
        sanitized = sanitize({"event": event_type, **data})
        logger.info(json.dumps(sanitized))
    except Exception as e:
        logger.error(f"[logging failed] {event_type}: {e} | raw: {data}")
