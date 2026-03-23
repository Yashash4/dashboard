import { NextResponse } from "next/server";
import crypto from "crypto";

// --- Error Types ---

export type APIErrorCode =
  | "rate_limited"
  | "invalid_api_key"
  | "revoked_api_key"
  | "plan_required"
  | "invalid_request"
  | "missing_parameter"
  | "invalid_parameter"
  | "agent_not_found"
  | "agent_offline"
  | "model_error"
  | "model_timeout"
  | "content_blocked"
  | "file_too_large"
  | "unsupported_file_type"
  | "batch_too_large"
  | "thread_not_found"
  | "not_found"
  | "request_in_progress"
  | "internal_error";

export type APIErrorType =
  | "authentication_error"
  | "authorization_error"
  | "validation_error"
  | "agent_error"
  | "model_error"
  | "api_error";

const ERROR_TYPE_MAP: Record<APIErrorCode, APIErrorType> = {
  rate_limited: "api_error",
  invalid_api_key: "authentication_error",
  revoked_api_key: "authentication_error",
  plan_required: "authorization_error",
  invalid_request: "validation_error",
  missing_parameter: "validation_error",
  invalid_parameter: "validation_error",
  agent_not_found: "agent_error",
  agent_offline: "agent_error",
  model_error: "model_error",
  model_timeout: "model_error",
  content_blocked: "validation_error",
  file_too_large: "validation_error",
  unsupported_file_type: "validation_error",
  batch_too_large: "validation_error",
  thread_not_found: "validation_error",
  not_found: "validation_error",
  request_in_progress: "api_error",
  internal_error: "api_error",
};

const ERROR_STATUS_MAP: Record<APIErrorCode, number> = {
  rate_limited: 429,
  invalid_api_key: 401,
  revoked_api_key: 403,
  plan_required: 403,
  invalid_request: 400,
  missing_parameter: 400,
  invalid_parameter: 400,
  agent_not_found: 404,
  agent_offline: 503,
  model_error: 502,
  model_timeout: 504,
  content_blocked: 400,
  file_too_large: 400,
  unsupported_file_type: 400,
  batch_too_large: 400,
  thread_not_found: 404,
  not_found: 404,
  request_in_progress: 409,
  internal_error: 500,
};

// --- Request Context ---

export interface RequestContext {
  requestId: string;
  clientRequestId: string | null;
}

export function createRequestContext(request: Request): RequestContext {
  return {
    requestId: `req_${crypto.randomUUID().replace(/-/g, "")}`,
    clientRequestId: request.headers.get("x-client-request-id") || null,
  };
}

// --- CORS Headers for V1 API ---

const V1_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Client-Request-Id, X-Idempotency-Key",
  "Access-Control-Expose-Headers": "X-Request-Id, X-Client-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After",
};

export function corsHeaders(): Record<string, string> {
  return { ...V1_CORS_HEADERS };
}

// --- Rate Limit Headers ---

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // unix timestamp
}

export function rateLimitHeaders(info: RateLimitInfo, ctx: RequestContext): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Request-Id": ctx.requestId,
    "X-RateLimit-Limit": String(info.limit),
    "X-RateLimit-Remaining": String(Math.max(0, info.remaining)),
    "X-RateLimit-Reset": String(info.reset),
  };
  if (ctx.clientRequestId) {
    headers["X-Client-Request-Id"] = ctx.clientRequestId;
  }
  return headers;
}

// --- API Error Response ---

export function apiError(
  code: APIErrorCode,
  message: string,
  ctx: RequestContext,
  options?: { param?: string; retryAfterSeconds?: number }
): NextResponse {
  const status = ERROR_STATUS_MAP[code] || 500;
  const type = ERROR_TYPE_MAP[code] || "api_error";

  const body: Record<string, unknown> = {
    error: {
      code,
      message,
      type,
      request_id: ctx.requestId,
    },
  };

  if (options?.param) {
    (body.error as Record<string, unknown>).param = options.param;
  }

  const headers: Record<string, string> = {
    ...V1_CORS_HEADERS,
    "X-Request-Id": ctx.requestId,
  };
  if (ctx.clientRequestId) {
    headers["X-Client-Request-Id"] = ctx.clientRequestId;
  }
  if (code === "rate_limited") {
    const retryAfter = options?.retryAfterSeconds ?? 60;
    headers["Retry-After"] = String(Math.max(1, Math.ceil(retryAfter)));
  }

  return NextResponse.json(body, { status, headers });
}

// --- Success Response Helper ---

export function apiSuccess(
  data: Record<string, unknown>,
  ctx: RequestContext,
  rlInfo?: RateLimitInfo
): NextResponse {
  const headers: Record<string, string> = {
    ...V1_CORS_HEADERS,
    "X-Request-Id": ctx.requestId,
  };
  if (ctx.clientRequestId) {
    headers["X-Client-Request-Id"] = ctx.clientRequestId;
  }
  if (rlInfo) {
    headers["X-RateLimit-Limit"] = String(rlInfo.limit);
    headers["X-RateLimit-Remaining"] = String(Math.max(0, rlInfo.remaining));
    headers["X-RateLimit-Reset"] = String(rlInfo.reset);
  }

  return NextResponse.json(data, { headers });
}
