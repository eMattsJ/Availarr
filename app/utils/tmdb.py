import logging

def get_streaming_providers(tmdb_id, media_type):
    logging.info(f"Mock TMDb lookup for {media_type} ID {tmdb_id}")
    return ["Netflix", "Prime Video"]  # Example return for testing
