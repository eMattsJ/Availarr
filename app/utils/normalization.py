def normalize_provider(name: str) -> str:
    """
    Normalize a provider name for comparison.
    This removes common suffixes or symbols that lead to duplicates.

    Example:
        >>> normalize_provider("Netflix Standard with Ads")
        'netflix'
        >>> normalize_provider("Paramount+ & Showtime")
        'paramountplus and showtime'
    """
    return (
        name.lower()
        .strip()
        .replace("standard with ads", "")
        .replace("with ads", "")
        .replace("+", "plus")
        .replace("&", "and")
    )
