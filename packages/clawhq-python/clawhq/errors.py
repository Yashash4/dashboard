from typing import Optional


class ClawHQError(Exception):
    """Base exception for ClawHQ SDK."""

    def __init__(self, message: str, code: Optional[str] = None, status: int = 500, request_id: Optional[str] = None):
        super().__init__(message)
        self.code = code
        self.status = status
        self.request_id = request_id


class AuthenticationError(ClawHQError):
    """Invalid or missing API key."""
    pass


class RateLimitError(ClawHQError):
    """Rate limit exceeded."""

    def __init__(self, message: str, retry_after: int = 60, **kwargs):
        super().__init__(message, code="rate_limited", status=429, **kwargs)
        self.retry_after = retry_after


class ValidationError(ClawHQError):
    """Invalid request parameters."""
    pass


class AgentError(ClawHQError):
    """Agent-related error (not found, offline, etc.)."""
    pass


class ModelError(ClawHQError):
    """Model-related error (timeout, failure)."""
    pass
