/**
 * Security utilities for production deployment
 */

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").filter(Boolean);

  const isAllowed =
    !allowedOrigins.length || allowedOrigins.includes(origin || "") || allowedOrigins.includes("*");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    // NOTE: camera must stay enabled for self — /scan uses getUserMedia for live
    // palm capture. A blanket `camera=()` (as a generic template would default to)
    // disables that core feature entirely.
    "Permissions-Policy": "camera=(self), microphone=(), geolocation=(), payment=(self)",
  };
}

/**
 * Applies the security headers directly to an already-built Response.
 * Route-level request middleware in this TanStack Start version does not
 * reliably wrap `server.handlers` responses, so headers are attached here at
 * the actual point each API route constructs its Response instead.
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = rateLimitStore[identifier];

  if (!record || now > record.resetTime) {
    rateLimitStore[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return true;
  }

  if (record.count >= config.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export const RATE_LIMITS = {
  READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_READS || "100", 10),
  },
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_WRITES || "30", 10),
  },
  // The live palm-scan loop legitimately polls roughly every 1.2s while the
  // camera is open, so it needs a much higher ceiling than a normal write.
  LIVE_SCAN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
  },
};

// ============================================================================
// JWT UTILITIES (for API authentication)
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Create a JWT token (requires jsonwebtoken package)
 * Note: This is a placeholder. Use actual JWT library in production
 */
export async function createJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = {
    ...payload,
    iat: now,
    exp: now + 24 * 60 * 60, // 24 hours
  };

  // TODO: Sign with JWT library
  return JSON.stringify(token);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    // TODO: Verify with JWT library
    const payload = JSON.parse(token) as JWTPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number,
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

export function createErrorResponse(
  statusCode: number,
  error: string,
  message: string,
  requestId?: string,
): ErrorResponse {
  return {
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

// ============================================================================
// LOGGING
// ============================================================================

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  // Build log entry safely without spreading unknown values
  const logEntry: Record<string, unknown> = {
    timestamp,
    level,
    message,
  };

  if (data !== undefined) {
    logEntry.data = data;
  }

  // In production, send to logging service (CloudflareWorkers, DataDog, etc.)
  if (process.env.DEBUG === "true") {
    console.log(JSON.stringify(logEntry));
  }
}

export function logError(message: string, error: Error | unknown, context?: unknown): void {
  const payload: Record<string, unknown> = {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };

  if (context !== undefined) payload.context = context;

  log(LogLevel.ERROR, message, payload);
}
