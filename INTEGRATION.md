# Portal v2 ↔ dm-api integration

Branch: `v2-web`. Companion changes live in `../dm-api` (not a git repository —
those files are on disk only).

Two pieces of work, in one pass because they turned out to be the same problem
seen from two sides:

1. **dm-api** — affiliate commission is now credited only after Razorpay
   confirms the payment to the server, instead of at anonymous enrolment time.
2. **portal** — every call site now resolves its backend through one module and
   sends the credential dm-api's per-route authorization requires.

---

## 1. The commission defect

`POST /api/v1/users/enroll` is public, anonymous and (until this change) not
rate limited. It credited a full flat commission — ₹1,000 by default, from
`admin_settings.flat_commision` — inline, from its own request body:

- no lookup of `payment_logs`,
- no Razorpay order fetch,
- no signature of any kind,
- no join to anything that had been paid.

`plan_id`, `subscription_amount_paid`, `order_id` and `referralCode` were all
read straight from an untrusted body. The only replay guard was per-enrolee
(`referrals.status = 'converted'` for that email), so **one POST per throwaway
email minted one commission, without limit.**

It was trivially weaponisable. Referral codes are minted as `DM-001`, `DM-002`, …
(`users.ts`), and `POST /api/v1/verify-referral` is an anonymous oracle that
confirms whether a code exists. An attacker walks that keyspace in seconds, then
enrols throwaway emails against any affiliate's code — or their own, and
withdraws it through `POST /payout-requests` once KYC is approved.

The same handler also wrote `users.is_subscribed = 1` unconditionally. Nothing
in the API gates course content on anything else (`courses` and `course-content`
never read subscription state), so an anonymous POST was also a self-service
paid account.

### The rule now

> A referral commission moves only for an order Razorpay has confirmed **to this
> server**.

Confirmation is a column, not a convention. `payment_logs.confirmed_at` is
written by exactly two things, both of which hold provider-side proof:

| Writer | Proof it holds |
|---|---|
| `POST /api/v1/razorpay/webhook` | HMAC-SHA256 of the raw body under `RAZORPAY_WEBHOOK_SECRET` |
| `reconcileConfirmedPayments` (cron) | its own read of Razorpay's Orders API, requiring `status === 'paid'` |

`creditReferralForOrder` refuses to move a paisa while `confirmed_at` is NULL.
That single check is what makes every other caller safe: the enrolment path may
call it, an admin may call it, the sweep may call it, and none of them can cause
a payout that Razorpay has not underwritten.

### Where the code lives

| File | Role |
|---|---|
| `dm-api/src/lib/commission.ts` | **the only code that moves referral money.** Credit and reversal. |
| `dm-api/src/lib/settlement.ts` | confirmation → entitlement → commission; Razorpay event dispatch; the reconcile sweep |
| `dm-api/src/controllers/payments.ts` | `handleRazorpayWebhook` — signature, de-duplication, audit row |
| `dm-api/src/controllers/users.ts` | `enrollUser` — records intent, credits nothing |
| `dm-api/migrations/0005_commission_on_payment_confirmation.sql` | the columns and indexes all of the above depend on |

### Exactly-once, and why it actually holds

The old guard was `referrals.status != 'converted'`, read and then acted on
across about eight untransacted statements. That has two failure modes, and the
second is worse than the first because it is silent and permanent:

1. two concurrent credits both pass the read and both pay;
2. a crash between the conversion and the wallet write leaves the referral
   marked converted, the affiliate unpaid, and **every retry rejected by the
   very sentinel meant to protect them.** dm-backend hits this whenever the
   referrer has no `affiliates` row, because its wallet fallback binds NULL into
   `wallet.affiliate_id`, which is `NOT NULL`.

The credit is now a single `env.DB.batch()` — D1 runs a batch as one
transaction — and its **first** statement is the ledger insert:

```sql
INSERT INTO affiliate_earnings_events
  (user_id, referral_id, event_type, amount_cents, note, order_ref, created_at)
VALUES (?, ?, 'referral_conversion_credit', ?, ?, ?, datetime('now'));
```

under `UNIQUE(order_ref, event_type)`. So:

- two concurrent credits for one order race on that index; the loser's **entire
  batch** rolls back and nothing moved;
- there is no ordering in which the referral is converted but the wallet is not
  — they commit together or not at all;
- the affiliate row is resolved *before* the batch, so the `NOT NULL` crash
  cannot happen: no affiliate, no batch.

`payment_logs.commission_status` is reporting and a sweep filter. It is
deliberately **not** the safety mechanism.

### Event ordering

The webhook can arrive before, during or after `/users/enroll` — Razorpay
delivers a second or two after capture, while a mobile UPI app-switch can delay
the browser's return by much longer, or forever. The rule is symmetric:

> The credit happens when the **later** of {payment confirmed, enrolment
> recorded} lands.

- *Enrolment first* (the normal path): the webhook arrives, finds the referral
  row bound to the order, credits.
- *Webhook first*: nothing to credit yet, so the payment log is stamped
  `awaiting_enrolment`. `enrollUser` calls `creditReferralForOrder` at its tail —
  which no-ops unless `confirmed_at` is already set, so enrolment still cannot
  pay anybody by itself — and the credit lands immediately.
- *Neither, because the webhook never came*: the cron sweep re-reads the order
  from Razorpay and settles it. This is the case that makes the design survive a
  mistyped secret or an unregistered dashboard endpoint.

### New endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/razorpay/webhook` | payload signature | the payment authority. Handles `payment.captured`, `order.paid`, `payment.failed`, `refund.created`, `refund.processed` |
| GET | `/api/v1/payment-logs/commission-queue` | `requireAdmin()` | orders whose money is confirmed but whose commission is stuck |
| POST | `/api/v1/payment-logs/reconcile` | `requireAdmin()` | run the sweep now |
| POST | `/api/v1/payment-logs/:id/settle` | `requireAdmin()` | re-drive one order, via a fresh Orders-API read |
| POST | `/api/v1/r2/lesson-video` | `requireAnyPrincipal()` + `activeSession()` | learner video playback (see §3) |
| POST | `/api/v1/r2/my-upload` | `requireAnyPrincipal()` + `activeSession()` | learner file uploads (see §3) |

No existing path or response body changed. `POST /users/enroll` still answers
`{ success, user, subscription }` with 201.

`/payment-logs/callback` — which already accepted a valid `X-Razorpay-Signature`
— now detects a real Razorpay event envelope and hands it to the same processor.
If anyone ever pointed the dashboard at that URL, the event used to verify and
then fall into extractors written for a flat custom envelope: order id NULL,
amount 0, status `pending`, nobody credited, silently. Either URL now works.

### Webhook status codes

Chosen around Razorpay redelivering a non-2xx for roughly 24 hours:

| Code | When | Why |
|---|---|---|
| 401 | bad or missing signature | a forgery; retrying must not make it real |
| 503 | `RAZORPAY_WEBHOOK_SECRET` unset | **do** retry, so a genuine event survives the window while the secret is installed |
| 200 | everything else, including a processing failure | a deterministic 500 would replay identical bytes for a day, failing identically. The delivery is marked `failed` in `webhook_logs` and the sweep is the real retry channel |

De-duplication keys on `X-Razorpay-Event-Id`, which is stable across retries of
one event, falling back to a hash of the body.

---

## 2. Portal integration

### One base URL

The portal reached the backend five different ways:

| Style | Where | Followed `.env.local`? |
|---|---|---|
| `const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"` | ~12 files | no |
| `process.env.NEXT_PUBLIC_API_BASE_URL \|\| "…"` | 5 files | yes |
| `lib/api-client.ts` | 116 call sites | yes |
| `process.env.NEXT_PUBLIC_API_URL \|\| "…"` | 2 files | **no** — that variable is defined nowhere |
| `https://dm-backend.copybykhan.workers.dev` | `app/page.tsx` | no |

Editing the env var moved about a third of the traffic and silently left the
rest on the old backend — the kind of half-cutover that looks like it works
until an endpoint diverges.

Everything now resolves through **`lib/dm-api.ts`**:

```ts
import { dmApi, apiUrl, API_ORIGIN } from "@/lib/dm-api"

const plans = await dmApi.get<PlansResponse>("/subscription-plans")
const res   = await fetch(apiUrl("/courses"))          // raw fetch, same base
```

`lib/api-client.ts` is now a thin shim over it, keeping its
`{ success, data, message }` shape byte-for-byte so the 116 existing call sites
did not have to move. New code should use `dmApi` directly — it reports the HTTP
status and dm-api's error code, which the old shape cannot express.

Cutover is one variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://dm-api.<subdomain>.workers.dev
```

`NEXT_PUBLIC_` values are inlined at **build** time, so this needs a rebuild,
not just a restart.

### Sending the credential

dm-backend declared most routes `auth: false`, and where it did require auth it
only checked that a signature was valid — a learner's token satisfied every
admin route. dm-api re-derived the policy per route, so roughly 45 portal calls
that worked anonymously now answer 401.

| Area | Was | Now |
|---|---|---|
| Admin course/module/lesson/resource editor (30 call sites across 4 files) | no header at all | `adminFetch` helper attaches the admin bearer |
| Admin media, R2 presign, certificates | no header | `dmApi` with `principal: "admin"`, or `adminFetch` |
| Admin payouts (5 sites, moves real money) | no header | `adminFetch` |
| Admin XHR uploads (7 sites) | no header | explicit `xhr.setRequestHeader` — presigned **PUT**s deliberately excluded, since our header would break the S3 signature |
| Learner / affiliate screens | mixed | `dmApi` with `principal: "user"` |
| Next route handlers under `app/api/**` | no credential; comment read *"we assume the backend route is open"* | read the auth cookie and forward it as a bearer |

The route handlers deserve a note: they run on the server, where there is no
`localStorage`, and `<video src>` loads carry no `Authorization` header. They
read the `user_token` / `admin_token` cookie the portal already sets at login.

### Checkout

The call sequence is unchanged, so nothing about the payment UX moved:

```
POST /razorpay/create-order → POST /payment/log → [Razorpay widget]
  → PUT /payment/log/:uuid → redirect → POST /razorpay/verify → POST /users/enroll
```

What changed is what the last step means. `razorpay_order_id` (which the portal
already sent) is now the join key: dm-api uses it to find the payment log this
signup paid for, claim it for the new account (`user_id IS NULL` is the
concurrency guard, so one order funds exactly one account), bind the referral to
it, and derive entitlement — none of which it takes from the request body any
more.

---

## 3. Fixes made along the way

Each of these is a defect found while tracing the two flows, not a speculative
improvement.

**dm-api**

- `wallet.affiliate_id` is `INTEGER NOT NULL UNIQUE`, and the credit path bound
  `affiliate?.id ?? null` into it. A referrer with no `affiliates` row threw
  `NOT NULL` *after* the referral was already marked converted — affiliate
  unpaid, and every retry rejected as `already_converted_previously`. The
  affiliate is now resolved before the first write, and the wallet write is an
  upsert.
- Two divergent copies of `creditReferralOnEnroll` existed (a private one in
  `users.ts`, an exported one in `affiliates-core.ts`). The private one is
  deleted. The exported one now serves only the admin manual-enrolment tool.
- **Subscriptions were never activated.** `enrollUser` wrote every subscription
  as `transaction_status='processing'` / `subscription_status='inactive'` and
  left activation to `POST /payment-logs/callback` — an endpoint the portal has
  never called. Every enrolled learner's subscription row stayed inactive
  forever; only the hardcoded `is_subscribed = 1` made the product work.
  Settlement activates it now.
- `users.is_subscribed` derives from the confirmed payment instead of being
  hardcoded to 1.
- Rate limits added to `/users/enroll` and `/verify-referral` — the two halves
  of the attack above, both previously unmetered.
- `export default { scheduled: app.scheduled }` was wired to blazefw's stub,
  which is an **empty async function**. A cron trigger pointed at it would fire
  into nothing and report success. Replaced with a real handler.
- Amount floor: the flat commission is refused when the confirmed order
  collected less than the commission itself. `POST /razorpay/create-order` is
  public and takes its amount from the request, so anyone can mint a ₹1 order;
  without the floor that funded a ₹1,000 payout. Bounded by money actually
  collected rather than by plan price, because the portal computes coupon
  discounts client-side and never sends the code — a price-equality check would
  reject legitimate discounted enrolments. Override with
  `COMMISSION_MIN_PAID_CENTS`.
- Refund clawback: `refund.processed` reverses the commission through the same
  atomic, exactly-once path, debiting the amount recorded on the ledger row
  rather than recomputing the rate (so an edit to `flat_commision` between
  credit and refund cannot produce a mismatched reversal).
- The sweep's date comparisons are wrapped in `datetime(...)`.
  `createPublicPaymentLog` writes ISO-8601 (`2026-09-02T10:00:00.000Z`) while
  every other writer uses `datetime('now')` (`2026-09-02 10:00:00`); compared
  lexically the `T` sorts above the space, so an unwrapped window silently
  selects the wrong set of rows.

**portal**

- The Razorpay success handler had a trap: if the bookkeeping `PUT /payment/log`
  failed, the `catch` redirected to `status=failed` **without the Razorpay
  params**. A captured payment was reported to the customer as a failure and no
  enrolment was attempted. Both branches now carry the params.
- `/payment/callback` checked `sessionStorage` *before* it looked at the
  payment, so a lost tab — the common case on mobile UPI, where the app-switch
  backgrounds the tab and the OS may evict it — produced the generic red
  "Payment Failed" card whose only button led back to checkout for a **second
  charge**. It now verifies the payment first and reports an honest
  "payment received, enrolment pending" state with the order and transaction ids.
- No guard against React 19 StrictMode invoking the effect twice, which meant
  two `/users/enroll` POSTs for one payment; the second returned 409 and
  rendered a failure over a successful signup. Guarded with a ref.
- The invoice page read `GET /subscriptions/:id` — the unscoped billing ledger,
  now `requireAdmin()`. It reads `GET /users/:id/subscriptions`
  (`requireSelfOrAdmin`) instead, so a learner sees their own rows and nobody
  else's.
- Learner video playback: `POST /r2/object-access` signs **any key in any
  bucket**, which is why it is admin-only — but the learner player called it.
  New `POST /r2/lesson-video` takes a *lesson id*, resolves the key from
  `lessons.r2_key` server-side and requires an active subscription. The learner
  never names a key, so there is nothing to traverse.
- Learner uploads (profile pictures, affiliate KYC): `POST /static/objects` took
  an arbitrary `?path=` and was anonymous in dm-backend, so a stranger could
  overwrite a course video or park content on the CDN domain. Making it
  `requireAdmin()` closed that and broke every learner upload. New
  `POST /r2/my-upload` takes a *filename* and composes the key under
  `uploads/users/<token subject>/`, so a learner can only write inside their own
  prefix. It returns the public URL, so the portal no longer guesses a CDN path
  that could drift from where the object actually landed.

---

## 4. Known gaps

- **Anonymous contact form.** `POST /support-requests` is `requireUser()` — the
  handler takes `user_id` from the token, and the resource was fully anonymous
  in dm-backend, which also meant `GET /support-requests` handed over every
  ticket ever filed. `/contact` now tells a logged-out visitor to log in or
  email, rather than failing opaquely. Accepting anonymous tickets is a product
  decision; it would need a separate, rate-limited endpoint.
- **`hmacSha256Hex` argument-order footgun.** `payment-logs.ts` defines it as
  `(secret, message)`; `lib/razorpay.ts` defines the same name as
  `(message, secret)`. Both are correct at their current call sites and the new
  webhook uses `RazorpayClient.verifyWebhookSignature`, so nothing is broken —
  but the next person to move a call between files will not be so lucky.
- **`app/api/v1/video-proxy/route.ts` and `app/api/admin/video-proxy/route.ts`
  are dead code** with no callers, and the former references
  `request.searchParams`, which does not exist on `NextRequest`. Left as found.
- **The portal's coupon discount is computed client-side** and the code is never
  transmitted, so `/razorpay/create-order` is asked to charge a
  client-chosen amount. The commission floor bounds the *payout* exposure; the
  real fix is server-side pricing in `create-order`, which is out of scope here.
- **`node_modules` is not installed in `portal/`**, so these changes are not
  typechecked. `dm-api` typechecks clean (`npx tsc --noEmit`).

---

## 5. Deployment runbook

Order matters. Steps 1 and 2 must both be done before the cron trigger first
fires.

1. **Apply the migration**, including the backfill fence at the end of the file:

   ```bash
   npx wrangler d1 execute db-app-v2 --remote \
     --file=./migrations/0005_commission_on_payment_confirmation.sql
   ```

   The fence marks every pre-existing `payment_logs` row `commission_status =
   'legacy'`. Without it the first sweep re-reads the historical order book from
   Razorpay, finds every order paid, and pays **every past enrolment a second
   time**. Do not skip it.

   (Do not apply `dm-backend/migrations/0002` — it is a byte-for-byte duplicate
   of `0001` and fails with eight `duplicate column name` errors.)

2. **Set the webhook secret.** This is *not* `RAZORPAY_KEY_SECRET`; they are
   different values, and crossing them makes every delivery 401 silently for the
   ~24 hours Razorpay keeps retrying.

   ```bash
   npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
   ```

3. **Deploy dm-api**, then re-run the fence once more to catch rows written in
   the gap between migration and deploy:

   ```sql
   UPDATE payment_logs SET commission_status = 'legacy'
    WHERE commission_status IS NULL
      AND datetime(created_at) < datetime('<deploy timestamp UTC>');
   ```

   Verify before going further:

   ```sql
   SELECT commission_status, COUNT(*) FROM payment_logs GROUP BY 1;
   ```

4. **Register the webhook** in the Razorpay dashboard, under
   Settings → Webhooks:

   - URL `https://<dm-api host>/api/v1/razorpay/webhook`
   - events: `payment.captured`, `order.paid`, `payment.failed`,
     `refund.processed`
   - secret: the value from step 2

5. **Point the portal at dm-api** and rebuild:

   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://<dm-api host>
   ```

6. **Watch** `GET /api/v1/payment-logs/commission-queue` for the first day. Two
   states are normal and self-healing; a row that survives several sweeps wants
   a human:

   | `commission_status` | Meaning | Resolution |
   |---|---|---|
   | `awaiting_enrolment` | payment landed, `/users/enroll` did not | enrol the payer by hand; the next sweep credits |
   | `blocked_no_affiliate` | referrer has no `affiliates` row | approve their affiliate request; the next sweep credits |
   | `blocked_below_floor` | order collected less than the commission | investigate — this is the ₹1-order signature |

   The failure worth alerting on: **zero `provider = 'razorpay'` rows in
   `webhook_logs` over 24 hours while payments are succeeding.** That is a
   crossed webhook secret, which otherwise fails as a silent 401 while the
   Orders-API sweep quietly covers for it.

### Rollback

The migration is additive — new nullable columns and new indexes only — so the
previously deployed Worker runs unchanged against a migrated database. Rolling
back the Worker is sufficient; no schema change needs undoing.
