export class ClawHQError extends Error {
  code?: string;
  status: number;
  requestId?: string;

  constructor(message: string, options?: { code?: string; status?: number; requestId?: string }) {
    super(message);
    this.name = "ClawHQError";
    this.code = options?.code;
    this.status = options?.status ?? 500;
    this.requestId = options?.requestId;
  }
}

export class AuthenticationError extends ClawHQError {
  constructor(message: string, options?: { requestId?: string }) {
    super(message, { code: "invalid_api_key", status: 401, ...options });
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends ClawHQError {
  retryAfter: number;

  constructor(message: string, options?: { retryAfter?: number; requestId?: string }) {
    super(message, { code: "rate_limited", status: 429, ...options });
    this.name = "RateLimitError";
    this.retryAfter = options?.retryAfter ?? 60;
  }
}

export class ValidationError extends ClawHQError {
  constructor(message: string, options?: { code?: string; requestId?: string }) {
    super(message, { code: options?.code ?? "invalid_request", status: 400, ...options });
    this.name = "ValidationError";
  }
}

export class AgentError extends ClawHQError {
  constructor(message: string, options?: { code?: string; requestId?: string }) {
    super(message, { code: options?.code ?? "agent_not_found", status: 404, ...options });
    this.name = "AgentError";
  }
}

export class ModelError extends ClawHQError {
  constructor(message: string, options?: { code?: string; requestId?: string }) {
    super(message, { code: options?.code ?? "model_error", status: 502, ...options });
    this.name = "ModelError";
  }
}
