# InvoiceX proposed API contract

This document is an integration proposal for the Django REST Framework application and separate Rust ledger service. It does **not** claim that these endpoints exist. Django is authoritative for authentication, authorization, tenant scope, invoice transitions, eligibility, offer acceptance, funding and settlement. The Rust service is authoritative only for its hash-linked records and verification results.

## Conventions

- Base: `{VITE_API_BASE_URL}`, expected `/api/v1`.
- UUID strings, ISO-8601 timestamps, ISO currency codes, and decimal strings for money.
- Prefer secure, `HttpOnly`, `Secure`, `SameSite` cookie sessions.
- Pagination:

```json
{ "count": 0, "next": null, "previous": null, "results": [] }
```

- Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "invoiceNumber": ["This field is required."] }
  }
}
```

All list routes accept `page` and `page_size`. Applicable list routes also accept `search`, `ordering`, `status`, and documented entity/date filters. Return `401` for missing/expired authentication, `403` for denied role or tenant scope, `404` when the entity does not exist or must not be revealed, `409` for stale versions or workflow conflicts, and `422`/`400` for validation according to the backend convention.

## Authentication

| Method | Path | Access | Request / notes |
|---|---|---|---|
| POST | `/auth/register` | Public | User name/email/password, organization name/type, terms acknowledgement. Returns pending user and organization; never tokens in logs. |
| POST | `/auth/login` | Public | `{email,password}`. Returns user/session metadata; sets secure cookies when supported. |
| POST | `/auth/refresh` | Session | Rotates/refreshes the session. |
| POST | `/auth/logout` | Session | Revokes server session and clears cookies. |
| GET | `/auth/me` | Session | Current user, role, organization and permissions. |
| POST | `/auth/forgot-password` | Public | `{email}`. Always returns a non-enumerating acknowledgement. |
| POST | `/auth/reset-password` | Public token | `{token,newPassword}`. One-time, expiring token; validation errors are field-scoped. |

## Organizations and users

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/organizations/me` | All authenticated | Current tenant profile. |
| GET | `/organizations` | Admin; scoped roles where permitted | Paginated. Filters: `type,status,search`. |
| GET | `/organizations/{id}` | Admin or same authorized tenant | Organization detail; registration identifier only where permitted. |
| GET | `/users/me` | All authenticated | Current user. |
| GET | `/users` | Admin / authorized organization managers | Paginated; `organization_id,role,status,search`. |
| POST | `/users` | Authorized manager/admin | User identity, organization and role. |
| PATCH | `/users/{id}` | Authorized manager/admin | Mutable fields only; role changes require backend authorization. |

## Invoices and private documents

`Invoice` responses follow `src/domain.ts`. Legal status transitions are backend-defined. Version-changing writes accept an `invoiceVersion` or `If-Match` value and may return `409 STALE_VERSION`.

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/invoices` | Supplier, scoped buyer, admin monitor | Filters: `status,buyer_organization_id,due_from,due_to,amount_min,amount_max,search,ordering`. Tenant scoped. |
| POST | `/invoices` | Supplier | Invoice number, buyer ID, issue/due dates, decimal amount, currency, optional PO and description. Creates `DRAFT`. |
| GET | `/invoices/{id}` | Authorized related roles | Role-redacted detail. |
| PATCH | `/invoices/{id}` | Supplier | Draft-only editable fields plus version. |
| POST | `/invoices/{id}/submit` | Supplier | `{version}`. Validates complete draft and documents; returns updated invoice. |
| POST | `/invoices/{id}/documents` | Supplier | `multipart/form-data`. Returns document metadata without permanent URL. |
| GET | `/documents/{id}/download` | Authorized tenant user | Returns a short-lived download response/redirect; never a permanent public URL. |
| GET | `/invoices/{id}/events` | Authorized related roles | Paginated authorized timeline. Live UI must use this response. |

## Buyer verification

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/verification/queue` | Buyer | Paginated assigned invoices; filters `status,submitted_from,submitted_to,search,ordering`. |
| GET | `/invoices/{id}/verification` | Assigned buyer | Metadata, permitted documents, prior decisions and current version. |
| POST | `/invoices/{id}/verification-decisions` | Assigned buyer | `{decision,reason,invoiceVersion}`. `reason` required for clarification/rejection. Duplicate/stale decisions return `409`. |

The backend validates assignment, tenant, version and legal transition. A verify response may contain `VERIFIED`; financing eligibility is a separate backend decision and must not be inferred by the frontend.

## Financing

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/financing/opportunities` | Lender | Paginated, redacted opportunities. Filters: due range, amount range, buyer/supplier where permitted, eligibility fields and ordering. |
| GET | `/invoices/{id}/offers` | Related supplier; permitted lender | Paginated role-scoped offers. |
| GET | `/offers` | Supplier/lender | Paginated offers scoped to requester. Filters `status,invoice_id,expiry_from`. |
| POST | `/invoices/{id}/offers` | Lender | Decimal `advanceAmount`, `feeAmount`, supported rate/repayment fields, `expiryAt`. Backend validates eligibility and limits. |
| GET | `/offers/{id}` | Related supplier/lender | Role-redacted offer detail. |
| POST | `/offers/{id}/accept` | Supplier | `{invoiceVersion,offerVersion?}`. Returns accepted offer and invoice. Expired/already accepted offers return `409`. |
| POST | `/offers/{id}/withdraw` | Lender if backend permits | Optional reason/version. Only backend-defined states may be withdrawn. |

## Funding and settlement

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/fundings` | Related supplier/lender, admin monitor | Paginated; `status,invoice_id`. |
| GET | `/fundings/{id}` | Related roles | Funding and authorized timeline. |
| GET | `/settlements` | Related supplier/lender, admin monitor | Paginated; `status,due_from,due_to`. |
| GET | `/settlements/{id}` | Related roles | Settlement detail. |

Frontend confirmation never means funds moved. Only backend-returned status may show funding completion or settlement.

## Audit, ledger, admin and health

| Method | Path | Roles | Contract |
|---|---|---|---|
| GET | `/audit-events` | Admin/auditor | Paginated; `date_from,date_to,actor_id,organization_id,action,entity_type,entity_id,outcome`. Metadata is authorization-filtered. |
| GET | `/ledger/verify/{invoiceId}` | Admin; related roles if allowed | Backend-mediated ledger verification result and hash-linked record metadata. |
| GET | `/admin/metrics` | Admin | Aggregate counts and operational indicators. |
| GET | `/admin/organizations` | Admin | Paginated admin organization projection. |
| GET | `/admin/users` | Admin | Paginated admin user projection. |
| GET | `/health/` | Deployment policy | Actual Django dependency status. Avoid leaking versions, secrets or connection details. |

The Rust health endpoint uses `VITE_LEDGER_BASE_URL` or, preferably, a Django-mediated endpoint to avoid exposing a private service. The UI must show “not checked” until a real response arrives. Ledger records may include `id,eventType,recordHash,previousHash,createdAt,verificationStatus,discrepancyDetails`. They never include document contents.

## State and permission restrictions

Candidate display states include `DRAFT`, `PENDING_VERIFICATION`, `NEEDS_CLARIFICATION`, `VERIFIED`, `REJECTED`, `DISPUTED`, `ELIGIBLE_FOR_FINANCING`, `OFFER_PENDING`, `OFFER_ACCEPTED`, `FUNDING_PENDING`, `FUNDED`, `REPAYMENT_PENDING`, `SETTLED`, and `CANCELLED`. These are not client permissions. Unknown future values must be rendered safely as plain labels.

- Suppliers can edit only mutable drafts in their organization.
- Buyers can review only explicitly assigned invoices for their organization.
- Lenders see only fields allowed in an eligible opportunity.
- Admin monitoring does not grant private document access by default.
- Destructive or irreversible operations require confirmation and server authorization.
- Document content is never sent to the ledger.
