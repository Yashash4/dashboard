from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import ClawHQ

from ..types import Model


class ModelsResource:
    def __init__(self, client: "ClawHQ"):
        self._client = client

    def list(self) -> List[Model]:
        """List available AI models."""
        result = self._client._request("GET", "/v1/models")
        return [
            Model(id=m["id"], name=m["name"], context_window=m["context_window"], description=m.get("description"))
            for m in result.get("models", [])
        ]
