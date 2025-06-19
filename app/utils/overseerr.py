import logging

def delete_approved_request(request_id):
    logging.info(f"Mock delete request {request_id} (approved)")

def decline_pending_request(request_id):
    logging.info(f"Mock decline request {request_id} (pending)")
