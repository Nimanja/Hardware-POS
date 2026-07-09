# API Specification

REST API served by `apps/api` (NestJS). All routes are versioned under **`/v1`**.

> Draft contract — endpoints are not implemented yet. Shapes align with the models in
> [database-model.md](./database-model.md) and the shared enums in `packages/shared`.

## Conventions

- Base URL: `http://localhost:4000/v1` (dev). Configurable via `API_PORT` / `NEXT_PUBLIC_API_URL`.
- JSON request/response bodies. Money as string decimals (e.g. `"12.50"`).
- Success envelope: `{ "data": ... }`. Error envelope: `{ "statusCode", "message", "error" }`.
- Auth: cashier logs in with a PIN and receives a session token (JWT/bearer) sent as
  `Authorization: Bearer <token>` on subsequent calls.
- Tenant context: until auth is wired, tenant-scoped endpoints require an `x-tenant-id`
  header (a temporary placeholder; the tenant will later be derived from the session token).
- Not-yet-implemented write/QuickBooks flows return `501 Not Implemented` in the standard
  error envelope.
- Pagination: `?page=1&pageSize=25` → `{ "data": { "items": [], "total", "page", "pageSize" } }`.

## Health

```
GET /v1/health
200 → { "status": "ok", "service": "hardware-pos-api", "timestamp": "..." }
```

## Auth

Two login methods issue the same bearer JWT (payload: `sub`, `tenantId`, `role`). Send it as
`Authorization: Bearer <token>` on all other calls; the tenant is taken from the token.

```
POST /v1/auth/login                   # email + password (owner / admin / accountant)
body:  { "email": "owner@hardwarepos.test", "password": "password123" }
200 →  { "data": { "token": "...", "user": { "id", "tenantId", "name", "email", "role" } } }
401 →  invalid email or password

POST /v1/auth/pin-login               # PIN (cashier / manager); requires x-tenant-id header
headers: x-tenant-id: <tenantId>
body:  { "pin": "1111" }
200 →  { "data": { "token": "...", "user": { ... } } }
401 →  invalid PIN

GET  /v1/auth/me                      # current user + effective permissions
200 →  { "data": { "id", "tenantId", "name", "email", "role", "branchId", "permissions": [] } }

POST /v1/auth/approve-discount        # inline manager approval (cashier submits a manager PIN)
body:  { "managerPin": "2222", "discountType": "PERCENTAGE", "discountValue": 25 }
200 →  { "data": { "approvedByUserId": "...", "approvedByName": "Manager" } }
401 →  PIN does not authorize discount approval
```

### Roles & permissions

Roles: `OWNER`, `ADMIN`, `MANAGER`, `CASHIER`, `ACCOUNTANT`. Routes are protected by a global
JWT guard plus role/permission guards. Summary of enforced access:

| Capability                         | Roles                          |
| ---------------------------------- | ------------------------------ |
| Create sales / take payments       | Cashier, Manager, Owner, Admin |
| Approve high discounts             | Manager, Owner, Admin          |
| View sync logs & QuickBooks status | Accountant, Owner, Admin       |
| Connect QuickBooks / manage users / settings | Owner, Admin         |
| Everything                         | Owner, Admin                   |

Unauthenticated → `401`; authenticated but not permitted → `403`.

## Products (read-only cache)

```
GET /v1/products?query=hammer&page=1&pageSize=25
200 → { "data": { "items": [ { "id", "qboId", "sku", "barcode", "name", "price", "quantityOnHand" } ], "total", "page", "pageSize" } }

GET /v1/products/barcode/{barcode}
200 → { "data": { "id", "name", "price", "quantityOnHand", ... } }
404 → unknown barcode
```

## Customers (read-only cache)

```
GET /v1/customers?query=acme
200 → { "data": { "items": [ { "id", "qboId", "name", "email", "phone" } ], ... } }
```

## Sales

```
POST /v1/sales                        # create + complete a sale
body: {
  "customerId": "<id|null>",
  "items": [
    { "productId": "...", "quantity": "2", "discount": { "type": "PERCENT", "value": "10" }, "discountApprovedBy": "<userId|null>" }
  ],
  "payments": [ { "method": "CASH", "amount": "40.00" } ]
}
201 → { "data": {
  "id", "number", "type": "RECEIPT|INVOICE", "status": "COMPLETED",
  "subtotal", "discountTotal", "taxTotal", "total", "amountPaid",
  "syncStatus": "PENDING",
  "receipt": { ... }                  # data used to render/print the receipt
} }
400 → validation error (e.g. INVOICE without customer, unapproved high discount)

# The API derives type from amountPaid vs total:
#   amountPaid >= total → RECEIPT   |   amountPaid < total → INVOICE

GET /v1/sales?page=1&pageSize=25&syncStatus=FAILED
200 → paginated sales for the history screen (includes syncStatus per sale)

GET /v1/sales/{id}
200 → full sale with items, payments, syncStatus, qboId

GET /v1/sales/{id}/receipt
200 → receipt payload for reprint
```

## Sync

```
GET /v1/sync/logs?entityType=SALE&status=FAILED&page=1
200 → { "data": { "items": [ { "id", "entityType", "entityId", "direction", "status", "attempt", "error", "createdAt" } ], ... } }

POST /v1/sync/sales/{id}/retry        # manual retry of a failed outbound sale sync
202 → { "data": { "id", "syncStatus": "PENDING" } }

POST /v1/sync/products/refresh        # on-demand inbound catalog pull (admin)
202 → { "data": { "started": true } }
```

## QuickBooks connection (admin)

```
GET  /v1/quickbooks/connect           # 302 → QBO OAuth consent
GET  /v1/quickbooks/callback          # OAuth redirect target; stores tokens + realmId
GET  /v1/quickbooks/status
200 → { "data": { "connected": true, "realmId": "...", "environment": "sandbox", "tokenExpiresAt": "..." } }
```

## Error codes

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| 400    | Validation error (bad body, business-rule violation)|
| 401    | Missing/invalid session or PIN                      |
| 403    | Authenticated but not permitted (e.g. non-manager)  |
| 404    | Resource not found                                  |
| 409    | Conflict (e.g. duplicate sale number)               |
| 502    | Upstream QBO error surfaced to the caller           |
