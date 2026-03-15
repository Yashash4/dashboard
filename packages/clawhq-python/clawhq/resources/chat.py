from typing import Optional, List, Dict, Any, Iterator, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import ClawHQ

from ..types import ChatResponse, StreamChunk


class ChatResource:
    def __init__(self, client: "ClawHQ"):
        self._client = client

    def create(
        self,
        message: str,
        agent: Optional[str] = None,
        session_id: Optional[str] = None,
        stream: bool = False,
        response_format: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        moderation: Optional[Dict[str, Any]] = None,
        cache_key: Optional[str] = None,
    ) -> Union[ChatResponse, Iterator[StreamChunk]]:
        """Send a chat message.

        Args:
            message: The user's message.
            agent: Agent name (defaults to first deployed).
            session_id: For conversation persistence.
            stream: If True, returns an iterator of StreamChunks.
            response_format: "json" for JSON-only responses.
            tools: Function calling tool definitions.
            moderation: Content moderation config.
            cache_key: Context caching key.

        Returns:
            ChatResponse or Iterator[StreamChunk] if streaming.
        """
        body: Dict[str, Any] = {"message": message}
        if agent:
            body["agent"] = agent
        if session_id:
            body["session_id"] = session_id
        if stream:
            body["stream"] = True
        if response_format:
            body["response_format"] = response_format
        if tools:
            body["tools"] = tools
        if moderation:
            body["moderation"] = moderation
        if cache_key:
            body["cache_key"] = cache_key

        if stream:
            return self._client._stream_request("/v1/chat", body)

        result = self._client._request("POST", "/v1/chat", body)
        return ChatResponse(
            response=result.get("response", ""),
            agent=result.get("agent", ""),
            request_id=self._client._last_request_id or "",
            format=result.get("format"),
            test=result.get("test", False),
        )
