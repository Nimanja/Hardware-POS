# Database Model

Local PostgreSQL schema, managed with Prisma (`packages/database`). This database holds the
POS's operational data plus a cache of QBO products and customers. **QuickBooks Online remains
the source of truth** for catalog, inventory, prices, and accounting.

> The Prisma schema currently defines no models (foundation only). This document is the
> agreed target model; add these to `packages/database/prisma/schema.prisma` as features land.

## Conventions

- UUID (`cuid`/`uuid`) primary keys.
- `createdAt` / `updatedAt` timestamps on every table.
- Cached QBO entities store the QBO id (`qboId`) and a `syncedAt` marker.
- Monetary values stored as `Decimal(12, 2)`; quantities as `Decimal(12, 3)`.
- Enums mirror `packages/shared`: `UserRole`, `SaleStatus`, `SaleType`, `SyncStatus`.

## Entity overview

```
User ─┐
      ├─< Sale >─┬─< SaleItem >── Product (cache)
Customer ────────┘        │
                          ├─< Payment
                          └─< SyncLog
```

## Tables

### User

PIN-based staff accounts.

| Column      | Type      | Notes                                         |
| ----------- | --------- | --------------------------------------------- |
| id          | uuid PK   |                                               |
| name        | string    |                                               |
| pinHash     | string    | Hashed PIN (never stored in plaintext)        |
| role        | UserRole  | `CASHIER` \| `MANAGER` \| `ADMIN`             |
| isActive    | boolean   | default `true`                                |
| createdAt   | datetime  |                                               |
| updatedAt   | datetime  |                                               |

### Product (QBO cache)

Read-mostly cache of QBO items. Refreshed by the inbound sync; the POS does not edit these.

| Column        | Type          | Notes                                          |
| ------------- | ------------- | ---------------------------------------------- |
| id            | uuid PK       |                                                |
| qboId         | string        | QBO Item id — **unique**                       |
| sku           | string?       | indexed for search                             |
| barcode       | string?       | **unique**, indexed for barcode lookup         |
| name          | string        | indexed for search                             |
| price         | Decimal(12,2) | unit price from QBO                             |
| quantityOnHand| Decimal(12,3) | last-known QOH from QBO                         |
| isActive      | boolean       |                                                |
| syncedAt      | datetime      | when this row was last pulled from QBO         |
| createdAt     | datetime      |                                                |
| updatedAt     | datetime      |                                                |

Indexes: `@unique(qboId)`, `@unique(barcode)`, `@index(name)`, `@index(sku)`.

### Customer (QBO cache)

| Column    | Type     | Notes                             |
| --------- | -------- | --------------------------------- |
| id        | uuid PK  |                                   |
| qboId     | string   | QBO Customer id — **unique**      |
| name      | string   | indexed                           |
| email     | string?  |                                   |
| phone     | string?  |                                   |
| syncedAt  | datetime |                                   |
| createdAt | datetime |                                   |
| updatedAt | datetime |                                   |

### Sale

One completed (or in-progress) transaction.

| Column        | Type          | Notes                                                          |
| ------------- | ------------- | -------------------------------------------------------------- |
| id            | uuid PK       |                                                                |
| number        | string        | human-readable sale number — **unique**                        |
| status        | SaleStatus    | `DRAFT` \| `COMPLETED` \| `VOIDED` \| `REFUNDED`               |
| type          | SaleType      | `RECEIPT` (fully paid) \| `INVOICE` (partial/credit)          |
| cashierId     | uuid FK       | → User                                                          |
| customerId    | uuid FK?      | → Customer (required when `type = INVOICE`)                    |
| subtotal      | Decimal(12,2) | sum of line net amounts before tax                             |
| discountTotal | Decimal(12,2) | sum of line discounts                                          |
| taxTotal      | Decimal(12,2) |                                                                |
| total         | Decimal(12,2) | grand total                                                    |
| amountPaid    | Decimal(12,2) | sum of payments; `< total` ⇒ INVOICE, `>= total` ⇒ RECEIPT    |
| qboId         | string?       | id of the created QBO SalesReceipt/Invoice — **unique**       |
| syncStatus    | SyncStatus    | `PENDING` \| `SYNCING` \| `SYNCED` \| `FAILED`                 |
| completedAt   | datetime?     |                                                                |
| createdAt     | datetime      |                                                                |
| updatedAt     | datetime      |                                                                |

Indexes: `@unique(number)`, `@unique(qboId)`, `@index(syncStatus)`, `@index(cashierId)`,
`@index(createdAt)`.

### SaleItem

A cart line. Discounts are **product-wise** and captured here.

| Column          | Type          | Notes                                                     |
| --------------- | ------------- | --------------------------------------------------------- |
| id              | uuid PK       |                                                           |
| saleId          | uuid FK       | → Sale (cascade delete)                                   |
| productId       | uuid FK       | → Product                                                 |
| nameSnapshot    | string        | product name at time of sale                              |
| unitPrice       | Decimal(12,2) | price at time of sale                                     |
| quantity        | Decimal(12,3) |                                                           |
| discountType    | enum?         | `PERCENT` \| `FIXED` (null = no discount)                 |
| discountValue   | Decimal(12,2) | percent or amount                                         |
| discountApprovedBy | uuid FK?   | → User (manager) when discount exceeded threshold         |
| lineTotal       | Decimal(12,2) | `(unitPrice * quantity) - discount`                       |

Index: `@index(saleId)`.

### Payment

One or more payments against a sale.

| Column    | Type          | Notes                                    |
| --------- | ------------- | ---------------------------------------- |
| id        | uuid PK       |                                          |
| saleId    | uuid FK       | → Sale                                    |
| method    | enum          | `CASH` \| `CARD`                          |
| amount    | Decimal(12,2) |                                          |
| qboId     | string?       | QBO Payment id (for INVOICE sales)       |
| createdAt | datetime      |                                          |

Index: `@index(saleId)`.

### SyncLog

Append-only record of every sync attempt (inbound and outbound).

| Column      | Type       | Notes                                                       |
| ----------- | ---------- | ----------------------------------------------------------- |
| id          | uuid PK    |                                                             |
| entityType  | enum       | `PRODUCT` \| `CUSTOMER` \| `SALE` \| `PAYMENT`              |
| entityId    | string     | local id of the affected row                                |
| direction   | enum       | `INBOUND` (QBO→POS) \| `OUTBOUND` (POS→QBO)                 |
| status      | SyncStatus | `PENDING` \| `SYNCING` \| `SYNCED` \| `FAILED`             |
| attempt     | int        | retry counter                                               |
| error       | string?    | error message on failure                                    |
| createdAt   | datetime   |                                                             |

Indexes: `@index(entityType, entityId)`, `@index(status)`, `@index(createdAt)`.

## Sync-state lifecycle

```
Sale created  ──▶  syncStatus = PENDING
job picks up  ──▶  SYNCING   (+ SyncLog attempt=n, SYNCING)
QBO success   ──▶  SYNCED    (Sale.qboId set; SyncLog SYNCED)
QBO error     ──▶  FAILED    (SyncLog FAILED + error) ──▶ retry ──▶ SYNCING …
```

See [quickbooks-integration.md](./quickbooks-integration.md) for how each entity maps to QBO
and how idempotency keys prevent duplicates on retry.
