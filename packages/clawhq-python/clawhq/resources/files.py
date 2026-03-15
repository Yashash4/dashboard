from typing import List, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import ClawHQ

from ..types import FileObject


class FilesResource:
    def __init__(self, client: "ClawHQ"):
        self._client = client

    def list(self) -> List[FileObject]:
        """List uploaded files."""
        result = self._client._request("GET", "/v1/files")
        return [
            FileObject(
                file_id=f["file_id"], filename=f["filename"], size=f["size"],
                mime_type=f.get("type", ""), purpose="knowledge_base",
                status=f["status"], created_at=f.get("created_at"),
            )
            for f in result.get("files", [])
        ]

    def get(self, file_id: str) -> FileObject:
        """Get file details."""
        result = self._client._request("GET", f"/v1/files/{file_id}")
        return FileObject(
            file_id=result["file_id"], filename=result["filename"], size=result["size"],
            mime_type=result.get("type", ""), purpose="knowledge_base",
            status=result["status"], created_at=result.get("created_at"),
        )

    def delete(self, file_id: str) -> bool:
        """Delete a file."""
        result = self._client._request("DELETE", f"/v1/files/{file_id}")
        return result.get("deleted", False)
