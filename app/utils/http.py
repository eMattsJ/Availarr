def get_tmdb_headers(api_key):
    return {
        "Authorization": f"Bearer {api_key}"
    }

def get_overseerr_headers(api_key):
    return {
        "X-Api-Key": api_key
    }
