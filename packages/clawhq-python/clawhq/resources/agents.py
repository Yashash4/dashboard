from typing import Optional, Dict, Any, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import ClawHQ

from ..types import Agent


class AgentsResource:
    def __init__(self, client: "ClawHQ"):
        self._client = client

    def list(self) -> List[Agent]:
        """List deployed agents."""
        result = self._client._request("GET", "/v1/agents")
        return [
            Agent(
                id=a["id"], name=a["name"], slug=a["slug"],
                status=a["status"], description=a.get("description"),
                model=a.get("model"), deployed_at=a.get("deployed_at"),
            )
            for a in result.get("agents", [])
        ]

    def get(self, agent_id: str) -> Agent:
        """Get agent details."""
        result = self._client._request("GET", f"/v1/agents/{agent_id}")
        a = result["agent"]
        return Agent(
            id=a["id"], name=a["name"], slug=a.get("slug", ""),
            status=a["status"], description=a.get("description"),
            model=a.get("model"), deployed_at=a.get("deployed_at"),
        )

    def delete(self, agent_id: str) -> bool:
        """Undeploy an agent."""
        result = self._client._request("DELETE", f"/v1/agents/{agent_id}")
        return result.get("undeployed", False)
