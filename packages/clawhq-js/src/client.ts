import type { ClawHQOptions, ChatCreateParams, ChatResponse, StreamChunk, HealthResponse, Agent, Thread, ThreadMessage, Model, FileObject } from "./types";
import { ClawHQError, AuthenticationError, RateLimitError } from "./errors";

const DEFAULT_BASE_URL = "https://app.clawhq.tech/api";
const RETRY_BACKOFF = [1000, 2000, 4000];

export class ClawHQ {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;
  public lastRequestId?: string;

  public chat: ChatNamespace;
  public agents: AgentsNamespace;
  public threads: ThreadsNamespace;
  public models: ModelsNamespace;
  public files: FilesNamespace;

  constructor(options: ClawHQOptions) {
    if (!options.apiKey?.startsWith("clw_")) {
      throw new AuthenticationError("API key must start with 'clw_'");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 60000;

    this.chat = new ChatNamespace(this);
    this.agents = new AgentsNamespace(this);
    this.threads = new ThreadsNamespace(this);
    this.models = new ModelsNamespace(this);
    this.files = new FilesNamespace(this);
  }

  async _request(method: string, path: string, body?: Record<string, unknown>): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);

        this.lastRequestId = res.headers.get("x-request-id") ?? undefined;

        if (res.ok) return res.json();

        const errorData = await res.json().catch(() => ({}));
        const errorInfo = errorData?.error ?? {};

        if ([429, 500, 502, 503].includes(res.status) && attempt < this.maxRetries - 1) {
          const retryAfter = parseInt(res.headers.get("retry-after") ?? "") || RETRY_BACKOFF[attempt] / 1000;
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (res.status === 429) throw new RateLimitError(errorInfo.message ?? "Rate limited", { requestId: this.lastRequestId });
        throw new ClawHQError(errorInfo.message ?? `HTTP ${res.status}`, { code: errorInfo.code, status: res.status, requestId: this.lastRequestId });
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof ClawHQError) throw err;
        if (err instanceof Error && err.name === "AbortError") throw new ClawHQError("Request timed out", { status: 408 });
        throw new ClawHQError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    throw new ClawHQError("Max retries exceeded");
  }

  async health(): Promise<HealthResponse> {
    const r = await this._request("GET", "/v1/health");
    return { status: r.status, plan: r.plan, keyName: r.key_name, rateLimit: r.rate_limit, agents: r.agents ?? [] };
  }
}

class ChatNamespace {
  constructor(private client: ClawHQ) {}

  async create(params: ChatCreateParams): Promise<ChatResponse> {
    const body: Record<string, unknown> = { message: params.message };
    if (params.agent) body.agent = params.agent;
    if (params.sessionId) body.session_id = params.sessionId;
    if (params.stream) body.stream = true;
    if (params.responseFormat) body.response_format = params.responseFormat;
    if (params.tools) body.tools = params.tools;
    if (params.moderation) body.moderation = params.moderation;
    if (params.cacheKey) body.cache_key = params.cacheKey;

    const r = await this.client._request("POST", "/v1/chat", body);
    return { response: r.response, agent: r.agent, requestId: this.client.lastRequestId ?? "", format: r.format, test: r.test };
  }
}

class AgentsNamespace {
  constructor(private client: ClawHQ) {}
  async list(): Promise<Agent[]> {
    const r = await this.client._request("GET", "/v1/agents");
    return (r.agents ?? []).map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, status: a.status, description: a.description, model: a.model, deployedAt: a.deployed_at }));
  }
  async get(id: string): Promise<Agent> {
    const r = await this.client._request("GET", `/v1/agents/${id}`);
    const a = r.agent;
    return { id: a.id, name: a.name, slug: a.slug ?? "", status: a.status, description: a.description, model: a.model, deployedAt: a.deployed_at };
  }
  async delete(id: string): Promise<boolean> {
    const r = await this.client._request("DELETE", `/v1/agents/${id}`);
    return r.undeployed ?? false;
  }
}

class ThreadsNamespace {
  constructor(private client: ClawHQ) {}
  async create(agent = "default", metadata?: Record<string, unknown>): Promise<Thread> {
    const r = await this.client._request("POST", "/v1/threads", { agent, metadata: metadata ?? {} });
    const t = r.thread;
    return { threadId: t.id, agent: t.agent, metadata: t.metadata ?? {}, createdAt: t.created_at };
  }
  async list(limit = 20): Promise<Thread[]> {
    const r = await this.client._request("GET", `/v1/threads?limit=${limit}`);
    return (r.threads ?? []).map((t: any) => ({ threadId: t.id, agent: t.agent, metadata: t.metadata ?? {}, createdAt: t.created_at }));
  }
  async send(threadId: string, message: string): Promise<ThreadMessage> {
    const r = await this.client._request("POST", `/v1/threads/${threadId}/messages`, { message });
    return { response: r.response, messageId: r.message_id, threadId: r.thread_id, requestId: this.client.lastRequestId ?? "" };
  }
  async delete(threadId: string): Promise<boolean> {
    const r = await this.client._request("DELETE", `/v1/threads/${threadId}`);
    return r.deleted ?? false;
  }
}

class ModelsNamespace {
  constructor(private client: ClawHQ) {}
  async list(): Promise<Model[]> {
    const r = await this.client._request("GET", "/v1/models");
    return (r.models ?? []).map((m: any) => ({ id: m.id, name: m.name, contextWindow: m.context_window, description: m.description }));
  }
}

class FilesNamespace {
  constructor(private client: ClawHQ) {}
  async list(): Promise<FileObject[]> {
    const r = await this.client._request("GET", "/v1/files");
    return (r.files ?? []).map((f: any) => ({ fileId: f.file_id, filename: f.filename, size: f.size, mimeType: f.type ?? "", purpose: "knowledge_base", status: f.status, createdAt: f.created_at }));
  }
  async get(id: string): Promise<FileObject> {
    const r = await this.client._request("GET", `/v1/files/${id}`);
    return { fileId: r.file_id, filename: r.filename, size: r.size, mimeType: r.type ?? "", purpose: "knowledge_base", status: r.status, createdAt: r.created_at };
  }
  async delete(id: string): Promise<boolean> {
    const r = await this.client._request("DELETE", `/v1/files/${id}`);
    return r.deleted ?? false;
  }
}
