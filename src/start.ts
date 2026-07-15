import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Security headers (CSP, HSTS, frame/XSS protection, camera Permissions-Policy)
// are NOT attached here — a global requestMiddleware did not reliably reach
// `server.handlers` API route responses in testing. Instead:
//   - Page responses get them via the root route's `headers()` option (see __root.tsx).
//   - API routes get them via `withSecurityHeaders()` wrapped around each
//     handler's Response (see src/lib/security.ts and the api.*.ts route files).

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
