from typing import Optional, Dict, Any, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import ClawHQ

from ..types import Thread, ThreadMessage


class ThreadsResource:
    def __init__(self, client: "ClawHQ"):
        self._client = client

    def create(self, agent: str = "default", metadata: Optional[Dict[str, Any]] = None) -> Thread:
        """Create a new conversation thread."""
        result = self._client._request("POST", "/v1/threads", {
            "agent": agent, "metadata": metadata or {},
        })
        t = result["thread"]
        return Thread(thread_id=t["id"], agent=t["agent"], metadata=t.get("metadata", {}), created_at=t.get("created_at"))

    def list(self, limit: int = 20, offset: int = 0) -> List[Thread]:
        """List threads."""
        result = self._client._request("GET", f"/v1/threads?limit={limit}&offset={offset}")
        return [
            Thread(thread_id=t["id"], agent=t["agent"], metadata=t.get("metadata", {}), created_at=t.get("created_at"))
            for t in result.get("threads", [])
        ]

    def get(self, thread_id: str) -> Thread:
        """Get thread details."""
        result = self._client._request("GET", f"/v1/threads/{thread_id}")
        t = result["thread"]
        return Thread(thread_id=t["id"], agent=t["agent"], metadata=t.get("metadata", {}), created_at=t.get("created_at"))

    def delete(self, thread_id: str) -> bool:
        """Delete thread and all messages."""
        result = self._client._request("DELETE", f"/v1/threads/{thread_id}")
        return result.get("deleted", False)

    def send(self, thread_id: str, message: str) -> ThreadMessage:
        """Send a message in a thread."""
        result = self._client._request("POST", f"/v1/threads/{thread_id}/messages", {"message": message})
        return ThreadMessage(
            response=result["response"], message_id=result["message_id"],
            thread_id=result["thread_id"], request_id=self._client._last_request_id or "",
        )

    def messages(self, thread_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get thread message history."""
        result = self._client._request("GET", f"/v1/threads/{thread_id}/messages?limit={limit}")
        return result.get("messages", [])
