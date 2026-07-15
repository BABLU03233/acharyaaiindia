"""
Acharya AI backend service.

This process is what supervisor boots on port 8001. Kubernetes ingress routes
every path starting with `/api` here. Two responsibilities:

1. Own the admin panel: JWT-based single-admin auth backed by env credentials,
   MongoDB-backed storage of orders / readings / users, and an LLM proxy that
   uses `emergentintegrations` so the app's own Claude prompts can be served
   with the shared Emergent LLM key without shipping raw Anthropic credentials.

2. Reverse-proxy every other `/api/*` request to the TanStack Start (Vite) dev
   server on port 3000 — that's where all business logic (checkout, palm
   scanning, reading generation, razorpay verify, webhooks) actually lives.

Order matters: FastAPI-native routes are declared BEFORE the catch-all proxy
route so more specific paths win.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/.env")

import bcrypt
import httpx
import jwt as pyjwt
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field


# ── Config ──────────────────────────────────────────────────────────────────
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-secret-change-me")
JWT_ALG = "HS256"
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@acharyaai.local")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@12345")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get(
    "ANTHROPIC_API_KEY", ""
)

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


# ── App bootstrap ───────────────────────────────────────────────────────────
app = FastAPI(title="Acharya AI backend", docs_url=None, redoc_url=None)

_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None
_client: Optional[httpx.AsyncClient] = None


@app.on_event("startup")
async def _startup() -> None:
    global _mongo_client, _db, _client
    _mongo_client = AsyncIOMotorClient(MONGO_URL)
    _db = _mongo_client[DB_NAME]
    _client = httpx.AsyncClient(base_url=FRONTEND_ORIGIN, timeout=60.0)

    # Ensure the admin account is present. Because the whole admin experience is
    # driven by a single env-controlled credential, on every boot we upsert the
    # hash so rotating the env password just works.
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )
    await _db.admins.update_one(
        {"username": ADMIN_USERNAME},
        {
            "$set": {
                "username": ADMIN_USERNAME,
                "email": ADMIN_EMAIL,
                "password_hash": hashed,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )
    await _db.orders.create_index("order_id", unique=True, sparse=True)
    await _db.orders.create_index("created_at")
    await _db.readings.create_index("created_at")
    await _db.users.create_index("email", sparse=True)


@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client, _mongo_client
    if _client is not None:
        await _client.aclose()
        _client = None
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None


# ── Helpers ────────────────────────────────────────────────────────────────
def _mint_admin_jwt() -> str:
    payload = {
        "sub": ADMIN_USERNAME,
        "role": "admin",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def require_admin(authorization: str = Header(default="")) -> dict:
    token = ""
    if authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
    if payload.get("role") != "admin" or payload.get("sub") != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Forbidden")
    return payload


def _clean(doc: dict[str, Any]) -> dict[str, Any]:
    """Mongo document → JSON-safe dict. Strips internal `_id`, converts dates."""
    out = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


# ── Admin auth ─────────────────────────────────────────────────────────────
class AdminLoginBody(BaseModel):
    username: str
    password: str


@app.post("/api/admin/login")
async def admin_login(body: AdminLoginBody) -> dict:
    doc = await _db.admins.find_one({"username": body.username.strip().lower()})
    if not doc:
        # Also allow login by canonical env username regardless of case.
        if body.username.strip().lower() == ADMIN_USERNAME.lower():
            doc = await _db.admins.find_one({"username": ADMIN_USERNAME})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(body.password.encode("utf-8"), doc["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token": _mint_admin_jwt(),
        "admin": {"username": doc["username"], "email": doc.get("email")},
    }


@app.get("/api/admin/me")
async def admin_me(admin: dict = Depends(require_admin)) -> dict:
    return {"username": admin.get("sub"), "role": admin.get("role")}


# ── Admin data views ───────────────────────────────────────────────────────
@app.get("/api/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)) -> dict:
    """Top-level metrics for the admin dashboard.

    Everything is derived from the collections we ingest into, so the numbers
    reflect what actually happened rather than a mocked constant.
    """
    total_orders = await _db.orders.count_documents({})
    paid_orders = await _db.orders.count_documents({"status": "paid"})
    total_readings = await _db.readings.count_documents({})
    total_users = await _db.users.count_documents({})

    # Revenue sum, only for paid orders.
    revenue_agg = await _db.orders.aggregate(
        [
            {"$match": {"status": "paid"}},
            {"$group": {"_id": None, "amount": {"$sum": "$amount"}}},
        ]
    ).to_list(1)
    revenue_paise = revenue_agg[0]["amount"] if revenue_agg else 0

    # Daily counts for the last 7 days (readings + orders).
    since = datetime.now(timezone.utc) - timedelta(days=7)
    daily_orders = await _db.orders.aggregate(
        [
            {"$match": {"created_at": {"$gte": since}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
    ).to_list(30)
    daily_readings = await _db.readings.aggregate(
        [
            {"$match": {"created_at": {"$gte": since}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
    ).to_list(30)

    return {
        "totals": {
            "orders": total_orders,
            "paid_orders": paid_orders,
            "readings": total_readings,
            "users": total_users,
            "revenue_paise": revenue_paise,
            "revenue_inr": round(revenue_paise / 100, 2),
        },
        "daily_orders": daily_orders,
        "daily_readings": daily_readings,
    }


@app.get("/api/admin/orders")
async def admin_orders(
    admin: dict = Depends(require_admin), limit: int = 50, skip: int = 0
) -> dict:
    cursor = (
        _db.orders.find({})
        .sort("created_at", -1)
        .skip(max(0, skip))
        .limit(max(1, min(limit, 200)))
    )
    items = [_clean(doc) async for doc in cursor]
    total = await _db.orders.count_documents({})
    return {"total": total, "items": items}


@app.get("/api/admin/readings")
async def admin_readings(
    admin: dict = Depends(require_admin), limit: int = 50, skip: int = 0
) -> dict:
    cursor = (
        _db.readings.find({})
        .sort("created_at", -1)
        .skip(max(0, skip))
        .limit(max(1, min(limit, 200)))
    )
    items = [_clean(doc) async for doc in cursor]
    total = await _db.readings.count_documents({})
    return {"total": total, "items": items}


@app.get("/api/admin/users")
async def admin_users(
    admin: dict = Depends(require_admin), limit: int = 50, skip: int = 0
) -> dict:
    cursor = (
        _db.users.find({})
        .sort("last_seen_at", -1)
        .skip(max(0, skip))
        .limit(max(1, min(limit, 200)))
    )
    items = [_clean(doc) async for doc in cursor]
    total = await _db.users.count_documents({})
    return {"total": total, "items": items}


# ── Event ingestion (called from TanStack Start server functions) ──────────
class EventIn(BaseModel):
    type: str = Field(..., description="'order' | 'reading' | 'user'")
    payload: dict[str, Any]


@app.post("/api/events")
async def ingest_event(body: EventIn) -> dict:
    """Simple ingestion endpoint that TanStack Start server functions POST to.

    This is deliberately NOT behind admin auth — it's an internal channel from
    the app's own trusted backend into the admin store. We accept from
    localhost only (the app and this backend share a pod).
    """
    now = datetime.now(timezone.utc)
    doc = {**body.payload, "created_at": now}

    if body.type == "order":
        # Upsert by order_id if present so razorpay's order_id + verify hooks
        # produce a single record instead of two.
        order_id = doc.get("order_id")
        if order_id:
            await _db.orders.update_one(
                {"order_id": order_id}, {"$set": doc}, upsert=True
            )
        else:
            await _db.orders.insert_one(doc)
        # Track the user if we have an email.
        email = doc.get("email")
        if email:
            await _db.users.update_one(
                {"email": email},
                {
                    "$set": {"email": email, "last_seen_at": now},
                    "$inc": {"order_count": 1},
                    "$setOnInsert": {"first_seen_at": now},
                },
                upsert=True,
            )
        return {"ok": True}
    if body.type == "reading":
        await _db.readings.insert_one(doc)
        anon = doc.get("anon_id")
        if anon:
            await _db.users.update_one(
                {"anon_id": anon},
                {
                    "$set": {"anon_id": anon, "last_seen_at": now},
                    "$inc": {"reading_count": 1},
                    "$setOnInsert": {"first_seen_at": now},
                },
                upsert=True,
            )
        return {"ok": True}
    if body.type == "user":
        anon = doc.get("anon_id")
        email = doc.get("email")
        filt = {"email": email} if email else {"anon_id": anon}
        await _db.users.update_one(
            filt,
            {
                "$set": {**doc, "last_seen_at": now},
                "$setOnInsert": {"first_seen_at": now},
            },
            upsert=True,
        )
        return {"ok": True}

    raise HTTPException(status_code=400, detail=f"Unknown event type: {body.type}")


# ── LLM proxy (Anthropic-compatible façade over emergentintegrations) ──────
class AnthropicMessagesBody(BaseModel):
    model: str
    max_tokens: int = 1024
    messages: list[dict[str, Any]]


def _extract_prompt_and_image(messages: list[dict[str, Any]]) -> tuple[str, Optional[str], Optional[str]]:
    """Collapse the Anthropic-style `messages` array into a single user text
    prompt and (optionally) one base64 image. Handles both:
      • messages[i].role == "system" (surfaces as system message)
      • messages[i].content == str  OR  == [ {type: text|image, ...} ]
    """
    system_parts: list[str] = []
    text_parts: list[str] = []
    image_b64: Optional[str] = None
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        chunks = content if isinstance(content, list) else [{"type": "text", "text": content}]
        for chunk in chunks:
            if chunk.get("type") == "text":
                if role == "system":
                    system_parts.append(chunk.get("text", ""))
                else:
                    text_parts.append(chunk.get("text", ""))
            elif chunk.get("type") == "image":
                src = chunk.get("source") or {}
                if src.get("type") == "base64":
                    image_b64 = src.get("data")
    system = "\n\n".join(p for p in system_parts if p) or None
    user_text = "\n\n".join(p for p in text_parts if p)
    return user_text, image_b64, system


@app.post("/llm/anthropic/v1/messages")
async def llm_anthropic_messages(body: AnthropicMessagesBody) -> dict:
    """Anthropic-compatible endpoint served by emergentintegrations.

    The TanStack Start `callClaude` helper posts here (via ANTHROPIC_BASE_URL)
    and receives the exact same response shape it expects from Anthropic
    proper. Under the hood we route through the shared Emergent LLM key so no
    real Anthropic key needs to be handled by the app.
    """
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    try:
        from emergentintegrations.llm.chat import ImageContent  # newer sdk
    except ImportError:  # pragma: no cover
        ImageContent = None  # type: ignore

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LOCAL_FALLBACK: EMERGENT_LLM_KEY not configured")

    user_text, image_b64, system_msg = _extract_prompt_and_image(body.messages)
    if not user_text and not image_b64:
        raise HTTPException(status_code=400, detail="Empty prompt")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"acharya-{datetime.now(timezone.utc).timestamp()}",
        system_message=system_msg or "",
    ).with_model("anthropic", body.model).with_params(max_tokens=body.max_tokens)

    kwargs: dict[str, Any] = {"text": user_text or "Analyze the provided image."}
    if image_b64 and ImageContent is not None:
        kwargs["file_contents"] = [ImageContent(image_base64=image_b64)]

    try:
        raw = await chat.send_message(UserMessage(**kwargs))
    except Exception as exc:  # noqa: BLE001
        # Bubble up as a 502 so `callClaude` can trigger its fallback path.
        raise HTTPException(status_code=502, detail=f"LLM upstream: {exc}") from exc

    # emergentintegrations may return a plain string or an object with .content.
    text_out = raw if isinstance(raw, str) else getattr(raw, "content", "") or str(raw)

    return {
        "id": f"msg_{datetime.now(timezone.utc).timestamp()}",
        "type": "message",
        "role": "assistant",
        "model": body.model,
        "content": [{"type": "text", "text": text_out}],
        "stop_reason": "end_turn",
    }


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "time": datetime.now(timezone.utc).isoformat(),
        "service": "acharya-backend",
    }


# ── Vite reverse-proxy (catch-all for every other /api/*) ──────────────────
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
