# Acharya AI — Test Credentials

## Admin Console (`/admin`)
- **URL:** https://2de8cb58-793a-4715-ae65-be05072b0e0b.preview.emergentagent.com/admin
- **Username:** `admin`
- **Password:** `Admin@12345`
- **Email (for reference):** `admin@acharyaai.local`
- **Session:** JWT (HS256), 12h expiry, stored in `localStorage["acharya:admin:token"]`

## Backend Auth API
- `POST /api/admin/login` — Body `{username, password}` → returns `{token, admin}`
- `GET /api/admin/me` — Header `Authorization: Bearer <token>` → returns `{username, role}`
- Auto-seeded on backend boot: bcrypt hash of the env-supplied `ADMIN_PASSWORD` is upserted into `admins` collection, keyed by `ADMIN_USERNAME`.

## Razorpay Test Payment (currency INR)
- **Mode:** Test only
- **Key ID:** `rzp_test_TDhSd7QRTTx6tx`
- **Test card:** `4111 1111 1111 1111` · any future expiry · any CVV · OTP `1111`
- **Amounts:** ₹49 (one-time) · ₹699 (monthly) · ₹5,999 (yearly)

## Anonymous Seeker Flow
- The public site does NOT require sign-in. A pseudo-anon id is stored in `localStorage["hasta:anon-id"]` so orders and readings can be correlated per browser.
