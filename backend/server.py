"""
Reverse-proxy backend for the acharyaaiindia (TanStack Start) app.

The TanStack Start server (Vite dev server) serves BOTH the SSR HTML shell
and the file-based `/api/*` server routes on port 3000. Kubernetes ingress in
this environment, however, routes any request whose path starts with `/api`
to port 8001. So this FastAPI app runs on 8001 and simply forwards every
`/api/*` request (any HTTP method) to the Vite dev server at
http://localhost:3000, preserving headers, query string, and raw body.

No application logic lives here — this is purely infrastructure glue so the
project's own `src/routes/api.*.ts` handlers stay authoritative.
"""

import os
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# Headers that must never be forwarded verbatim (hop-by-hop or set by httpx itself).
_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}

app = FastAPI(title="acharyaaiindia api proxy", docs_url=None, redoc_url=None)

# Reuse a single client so connections are pooled between requests.
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(base_url=FRONTEND_ORIGIN, timeout=60.0)


@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {"ok": True, "service": "acharya-api-proxy", "upstream": FRONTEND_ORIGIN}


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request) -> Response:
    if _client is None:
        return JSONResponse({"error": "proxy not ready"}, status_code=503)

    url = f"/api/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    fwd_headers = {
        k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    body = await request.body()

    try:
        upstream = await _client.request(
            request.method,
            url,
            headers=fwd_headers,
            content=body if body else None,
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            {"error": "upstream unavailable", "detail": str(exc)},
            status_code=502,
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )
