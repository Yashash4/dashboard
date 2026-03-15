import time
import json
from typing import Optional, Dict, Any, Iterator
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from .types import ChatResponse, StreamChunk, HealthResponse
from .errors import ClawHQError, AuthenticationError, RateLimitError, ValidationError, AgentError, ModelError
from .resources.chat import ChatResource
from .resources.agents import AgentsResource
from .resources.threads import ThreadsResource
from .resources.models import ModelsResource
from .resources.files import FilesResource

DEFAULT_BASE_URL = "https://app.clawhq.tech/api"
MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]

ERROR_MAP = {
    "invalid_api_key": AuthenticationError,
    "revoked_api_key": AuthenticationError,
    "rate_limited": RateLimitError,
    "invalid_request": ValidationError,
    "missing_parameter": ValidationError,
    "invalid_parameter": ValidationError,
    "agent_not_found": AgentError,
    "agent_offline": AgentError,
    "model_error": ModelError,
    "model_timeout": ModelError,
}


class ClawHQ:
    """ClawHQ Python SDK client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        max_retries: int = MAX_RETRIES,
        timeout: int = 60,
    ):
        if not api_key or not api_key.startswith("clw_"):
            raise AuthenticationError("API key must start with 'clw_'")

        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.timeout = timeout

        # Resource namespaces
        self.chat = ChatResource(self)
        self.agents = AgentsResource(self)
        self.threads = ThreadsResource(self)
        self.models = ModelsResource(self)
        self.files = FilesResource(self)

    def _request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """Make an HTTP request with auto-retry on 429/500."""
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        data = json.dumps(body).encode() if body else None

        for attempt in range(self.max_retries):
            try:
                req = Request(url, data=data, headers=headers, method=method)
                response = urlopen(req, timeout=self.timeout)
                result = json.loads(response.read().decode())

                # Parse rate limit headers
                self._last_rate_limit = {
                    "limit": response.headers.get("X-RateLimit-Limit"),
                    "remaining": response.headers.get("X-RateLimit-Remaining"),
                    "reset": response.headers.get("X-RateLimit-Reset"),
                }
                self._last_request_id = response.headers.get("X-Request-Id")

                return result

            except HTTPError as e:
                body_text = e.read().decode() if e.fp else "{}"
                try:
                    error_data = json.loads(body_text)
                except json.JSONDecodeError:
                    error_data = {"error": {"message": body_text, "code": "unknown"}}

                error_info = error_data.get("error", {})
                code = error_info.get("code", "unknown")
                message = error_info.get("message", str(e))
                request_id = error_info.get("request_id")

                # Retry on 429 or 500+
                if e.code in (429, 500, 502, 503) and attempt < self.max_retries - 1:
                    retry_after = int(e.headers.get("Retry-After", RETRY_BACKOFF[attempt]))
                    time.sleep(retry_after)
                    continue

                # Map error code to exception type
                error_cls = ERROR_MAP.get(code, ClawHQError)
                raise error_cls(message, code=code, status=e.code, request_id=request_id)

        raise ClawHQError("Max retries exceeded")

    def _stream_request(self, path: str, body: Dict[str, Any]) -> Iterator[StreamChunk]:
        """Make a streaming SSE request."""
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        data = json.dumps(body).encode()

        req = Request(url, data=data, headers=headers, method="POST")
        response = urlopen(req, timeout=self.timeout)

        for line in response:
            line = line.decode().strip()
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    yield StreamChunk(content="", done=True)
                    break
                try:
                    parsed = json.loads(data_str)
                    yield StreamChunk(content=parsed.get("content", ""))
                except json.JSONDecodeError:
                    continue

    def health(self) -> HealthResponse:
        """Check API key validity and get account info."""
        result = self._request("GET", "/v1/health")
        return HealthResponse(
            status=result["status"],
            plan=result["plan"],
            key_name=result["key_name"],
            rate_limit=result["rate_limit"],
            agents=result.get("agents", []),
        )


class AsyncClawHQ:
    """Async version of ClawHQ client. Requires `aiohttp`."""

    def __init__(self, api_key: str, base_url: str = DEFAULT_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        # Async implementation would use aiohttp
        raise NotImplementedError("AsyncClawHQ requires aiohttp. Install: pip install aiohttp")
