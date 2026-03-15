from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any


@dataclass
class ChatResponse:
    response: str
    agent: str
    request_id: str
    format: Optional[str] = None
    test: bool = False


@dataclass
class StreamChunk:
    content: str
    done: bool = False


@dataclass
class Agent:
    id: str
    name: str
    slug: str
    status: str
    description: Optional[str] = None
    model: Optional[Dict[str, Any]] = None
    deployed_at: Optional[str] = None


@dataclass
class Thread:
    thread_id: str
    agent: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[str] = None


@dataclass
class ThreadMessage:
    response: str
    message_id: str
    thread_id: str
    request_id: str


@dataclass
class Model:
    id: str
    name: str
    context_window: int
    description: Optional[str] = None


@dataclass
class FileObject:
    file_id: str
    filename: str
    size: int
    mime_type: str
    purpose: str
    status: str
    created_at: Optional[str] = None


@dataclass
class HealthResponse:
    status: str
    plan: str
    key_name: str
    rate_limit: int
    agents: List[str] = field(default_factory=list)


@dataclass
class UsageEntry:
    date: str
    requests: int
    errors: int
    avg_response_time_ms: int


@dataclass
class UsageResponse:
    key_name: str
    period: str
    usage: List[UsageEntry] = field(default_factory=list)
    totals: Optional[Dict[str, Any]] = None
