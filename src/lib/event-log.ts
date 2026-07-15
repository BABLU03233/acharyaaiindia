/**
 * Server-side helper that ingests an event (order / reading / user) into the
 * FastAPI backend's MongoDB store so the admin dashboard sees it. Fire-and-
 * forget by design — the caller does not need to await it, and network
 * failures must never break the primary UX.
 */
export async function logEvent(
  type: "order" | "reading" | "user",
  payload: Record<string, unknown>,
): Promise<void> {
  // The TanStack Start server functions run in the same pod as this FastAPI
  // backend, so localhost is always the fastest path.
  const base = process.env.INTERNAL_BACKEND_URL || "http://localhost:8001";
  try {
    await fetch(`${base}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
  } catch {
    // Swallow — analytics/admin ingestion should never take down the actual flow.
  }
}
