export interface ClawHQOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface ChatResponse {
  response: string;
  agent: string;
  requestId: string;
  format?: string;
  test?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  model?: { primary: string; fallback?: string };
  deployedAt?: string;
}

export interface Thread {
  threadId: string;
  agent: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface ThreadMessage {
  response: string;
  messageId: string;
  threadId: string;
  requestId: string;
}

export interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description?: string;
}

export interface FileObject {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  purpose: string;
  status: string;
  createdAt?: string;
}

export interface HealthResponse {
  status: string;
  plan: string;
  keyName: string;
  rateLimit: number;
  agents: string[];
}

export interface ChatCreateParams {
  message: string;
  agent?: string;
  sessionId?: string;
  stream?: boolean;
  responseFormat?: string;
  tools?: Array<{ type: string; function: Record<string, unknown> }>;
  moderation?: { enabled: boolean; block_categories?: string[]; custom_blocked_words?: string[] };
  cacheKey?: string;
}
