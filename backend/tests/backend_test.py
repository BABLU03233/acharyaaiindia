"""Backend regression tests for Acharya AI:
- /api/health
- Admin auth (JWT): /api/admin/login, /me, /stats, /orders
- Razorpay order creation: /api/razorpay-order
- Razorpay verify with bad signature: /api/razorpay-verify
- Routing sanity for TanStack routes and sitemap
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://2de8cb58-793a-4715-ae65-be05072b0e0b.preview.emergentagent.com").rstrip("/")
ADMIN_USER = "admin"
ADMIN_PASS = "Admin@12345"
RZP_KEY_ID = "rzp_test_TDhSd7QRTTx6tx"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:400]}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
    return data["token"]


# ------------- Health / routing -------------
class TestHealthAndRouting:
    def test_health(self, s):
        r = s.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200

    @pytest.mark.parametrize("path", ["/", "/scan", "/reading", "/checkout", "/success", "/cancel", "/admin", "/sitemap.xml"])
    def test_pages_200(self, s, path):
        r = s.get(f"{BASE_URL}{path}", timeout=20)
        assert r.status_code == 200, f"{path} => {r.status_code}"

    def test_admin_me_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/me", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


# ------------- Admin Auth -------------
class TestAdminAuth:
    def test_login_ok(self, admin_token):
        assert admin_token

    def test_login_wrong_password(self, s):
        r = s.post(f"{BASE_URL}/api/admin/login", json={"username": ADMIN_USER, "password": "wrong-pass"}, timeout=15)
        assert r.status_code in (400, 401, 403), f"got {r.status_code}"

    def test_me_with_token(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/admin/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert data.get("username") == ADMIN_USER

    def test_stats(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        # expect totals + daily arrays
        assert isinstance(d, dict) and len(d) > 0

    def test_orders_list(self, s, admin_token):
        r = s.get(f"{BASE_URL}/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert isinstance(d, (list, dict))


# ------------- Razorpay -------------
class TestRazorpay:
    def test_create_order_one_time(self, s):
        r = s.post(f"{BASE_URL}/api/razorpay-order", json={"plan": "one-time", "email": "TEST_seeker@example.com"}, timeout=25)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        d = r.json()
        assert d.get("key_id") == RZP_KEY_ID, f"key_id mismatch: {d.get('key_id')}"
        order = d.get("order") or {}
        oid = order.get("id") or d.get("order_id")
        assert isinstance(oid, str) and oid.startswith("order_"), f"bad order id: {oid}"
        # stash for downstream
        TestRazorpay.created_order_id = oid

    def test_create_order_monthly(self, s):
        r = s.post(f"{BASE_URL}/api/razorpay-order", json={"plan": "monthly", "email": "TEST_month@example.com"}, timeout=25)
        assert r.status_code == 200
        d = r.json()
        oid = (d.get("order") or {}).get("id") or d.get("order_id")
        assert oid and oid.startswith("order_")

    def test_verify_bad_signature(self, s):
        r = s.post(f"{BASE_URL}/api/razorpay-verify", json={
            "razorpay_order_id": "order_TEST_bogus",
            "razorpay_payment_id": "pay_TEST_bogus",
            "razorpay_signature": "BOGUS",
            "plan": "one-time",
        }, timeout=20)
        # should return 200 with status:failed OR 400
        assert r.status_code in (200, 400), r.status_code
        if r.status_code == 200:
            d = r.json()
            assert d.get("status") in ("failed", "invalid", "error"), f"expected failed status, got {d}"

    def test_order_appears_in_admin(self, s, admin_token):
        oid = getattr(TestRazorpay, "created_order_id", None)
        if not oid:
            pytest.skip("no order created")
        r = s.get(f"{BASE_URL}/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200
        body = r.json()
        rows = body if isinstance(body, list) else (body.get("orders") or body.get("items") or [])
        found = any((row.get("order_id") == oid) or (row.get("id") == oid) or (row.get("razorpay_order_id") == oid) for row in rows if isinstance(row, dict))
        assert found, f"created order {oid} not in admin orders (n={len(rows)})"
