import logging

def send_discord_notification(title, request_id, available_on, reason, action):
    logging.info(f"Mock Discord notify: {title} ({request_id}) {action}. Found on: {available_on}. Reason: {reason}")
