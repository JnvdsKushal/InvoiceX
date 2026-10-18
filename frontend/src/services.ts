import type { FinancingOffer, Invoice, InvoiceStatus, Role } from "./domain"
import { seedInvoices, seedOffers } from "./mockData"

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  ledgerBaseUrl: import.meta.env.VITE_LEDGER_BASE_URL || "",
  mockMode: import.meta.env.VITE_MOCK_MODE !== "false",
}

export const routes = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    refresh: "/auth/refresh",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  organizations: "/organizations",
  users: "/users",
  invoices: "/invoices",
  verificationQueue: "/verification/queue",
  opportunities: "/financing/opportunities",
  offers: "/offers",
  fundings: "/fundings",
  settlements: "/settlements",
  audit: "/audit-events",
  ledgerVerify: "/ledger/verify",
  adminMetrics: "/admin/metrics",
  health: "/health/",
} as const

export interface ApiErrorShape {
  error: { code: string; message: string; fields?: Record<string, string[]> }
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const payload = body as Partial<ApiErrorShape>
    throw new ApiError(
      response.status,
      payload.error?.code || "REQUEST_FAILED",
      payload.error?.message || "The request could not be completed.",
      payload.error?.fields,
    )
  }
  return body as T
}

export const permissions: Record<Role, string[]> = {
  supplier: [
    "invoice:create",
    "invoice:submit",
    "offer:accept",
    "document:upload",
  ],
  buyer: ["invoice:review", "verification:create", "document:authorized-read"],
  lender: ["opportunity:read", "offer:create", "offer:withdraw"],
  admin: ["organization:manage", "user:manage", "audit:read", "ledger:verify"],
}

export const legalTransitions: Partial<Record<InvoiceStatus, InvoiceStatus[]>> =
  {
    DRAFT: ["PENDING_VERIFICATION"],
    PENDING_VERIFICATION: ["NEEDS_CLARIFICATION", "VERIFIED", "REJECTED"],
    VERIFIED: ["ELIGIBLE_FOR_FINANCING"],
    ELIGIBLE_FOR_FINANCING: ["OFFER_PENDING"],
    OFFER_PENDING: ["OFFER_ACCEPTED"],
    OFFER_ACCEPTED: ["FUNDING_PENDING"],
    FUNDING_PENDING: ["FUNDED"],
    FUNDED: ["REPAYMENT_PENDING"],
    REPAYMENT_PENDING: ["SETTLED"],
  }

export interface InvoiceRepository {
  list(): Promise<Paginated<Invoice>>
  create(
    input: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "version">,
  ): Promise<Invoice>
  submit(id: string, version: number): Promise<Invoice>
}

export interface FinancingRepository {
  listOffers(invoiceId?: string): Promise<Paginated<FinancingOffer>>
  createOffer(
    invoiceId: string,
    input: Pick<FinancingOffer, "advanceAmount" | "feeAmount" | "expiryAt" | "repaymentTerms">,
  ): Promise<FinancingOffer>
  acceptOffer(id: string): Promise<FinancingOffer>
}

export const liveInvoiceService: InvoiceRepository = {
  list: () => request(routes.invoices),
  create: (input) =>
    request(routes.invoices, { method: "POST", body: JSON.stringify(input) }),
  submit: (id, version) =>
    request(`${routes.invoices}/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ version }),
    }),
}

let mockInvoices = structuredClone(seedInvoices)
let mockOffers = structuredClone(seedOffers)

const delayed = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => window.setTimeout(resolve, 180))
  return structuredClone(value)
}

export const mockInvoiceService: InvoiceRepository = {
  async list() {
    return delayed({
      count: mockInvoices.length,
      next: null,
      previous: null,
      results: mockInvoices,
    })
  },
  async create(input) {
    const now = new Date().toISOString()
    const invoice: Invoice = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    mockInvoices = [invoice, ...mockInvoices]
    return delayed(invoice)
  },
  async submit(id, version) {
    const invoice = mockInvoices.find((item) => item.id === id)
    if (!invoice) throw new ApiError(404, "NOT_FOUND", "Invoice not found.")
    if (invoice.version !== version) {
      throw new ApiError(
        409,
        "STALE_VERSION",
        "This invoice has changed. Refresh and try again.",
      )
    }
    if (invoice.status !== "DRAFT") {
      throw new ApiError(
        409,
        "INVALID_TRANSITION",
        "Only draft invoices can be submitted.",
      )
    }
    const updated: Invoice = {
      ...invoice,
      status: "PENDING_VERIFICATION",
      version: invoice.version + 1,
      updatedAt: new Date().toISOString(),
    }
    mockInvoices = mockInvoices.map((item) => (item.id === id ? updated : item))
    return delayed(updated)
  },
}

export const mockFinancingService: FinancingRepository = {
  async listOffers(invoiceId) {
    const results = invoiceId
      ? mockOffers.filter((offer) => offer.invoiceId === invoiceId)
      : mockOffers
    return delayed({
      count: results.length,
      next: null,
      previous: null,
      results,
    })
  },
  async createOffer(invoiceId, input) {
    const offer: FinancingOffer = {
      ...input,
      id: crypto.randomUUID(),
      invoiceId,
      lenderOrganizationId: "org-lender",
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    }
    mockOffers = [offer, ...mockOffers]
    return delayed(offer)
  },
  async acceptOffer(id) {
    const offer = mockOffers.find((item) => item.id === id)
    if (!offer) throw new ApiError(404, "NOT_FOUND", "Offer not found.")
    if (offer.status !== "SUBMITTED") {
      throw new ApiError(
        409,
        "OFFER_UNAVAILABLE",
        "This offer can no longer be accepted.",
      )
    }
    const accepted: FinancingOffer = { ...offer, status: "ACCEPTED" }
    mockOffers = mockOffers.map((item) =>
      item.id === id
        ? accepted
        : item.invoiceId === offer.invoiceId && item.status === "SUBMITTED"
          ? { ...item, status: "DECLINED" }
          : item,
    )
    return delayed(accepted)
  },
}

const liveFinancingService: FinancingRepository = {
  listOffers: (invoiceId) =>
    request(
      invoiceId ? `${routes.invoices}/${invoiceId}/offers` : routes.offers,
    ),
  createOffer: (invoiceId, input) =>
    request(`${routes.invoices}/${invoiceId}/offers`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  acceptOffer: (id) =>
    request(`${routes.offers}/${id}/accept`, { method: "POST" }),
}

export const repositories = config.mockMode
  ? { invoices: mockInvoiceService, financing: mockFinancingService }
  : { invoices: liveInvoiceService, financing: liveFinancingService }

export function resetMockRepositories() {
  mockInvoices = structuredClone(seedInvoices)
  mockOffers = structuredClone(seedOffers)
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  organizationName: string
  organizationType: "MSME" | "BUYER" | "LENDER"
  password: string
}

export interface RegisterResult {
  ok: true
  message: string
  user: { id: string; email: string; name: string; role: string; status: string }
}

/**
 * Calls POST /auth/register/ and returns either a RegisterResult on success or
 * a Record<string, string> of field-level errors (keyed by field name, with
 * "__all__" used for non-field / top-level errors) on validation failure.
 *
 * DRF returns errors as { fieldName: ["msg", …], … } (not the { error: {…} }
 * envelope that request() expects), so we fetch directly here.
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResult | { ok: false; fieldErrors: Record<string, string> }> {
  const url = `${config.apiBaseUrl}${routes.auth.register}`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 201) {
    return { ok: true, ...(body as Omit<RegisterResult, "ok">) }
  }
  // DRF validation errors: { field: ["msg"], non_field_errors: ["msg"] }
  const fieldErrors: Record<string, string> = {}
  if (body && typeof body === "object") {
    for (const [key, value] of Object.entries(body)) {
      const msg = Array.isArray(value)
        ? (value as string[]).join(" ")
        : String(value)
      fieldErrors[key === "non_field_errors" ? "__all__" : key] = msg
    }
  }
  if (Object.keys(fieldErrors).length === 0) {
    fieldErrors["__all__"] = "Registration failed. Please try again."
  }
  return { ok: false, fieldErrors }
}

export const authService = {
  login: (email: string, password: string) =>
    request(routes.auth.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request(routes.auth.me),
  logout: () => request(routes.auth.logout, { method: "POST" }),
}

export const organizationService = {
  list: () => request(routes.organizations),
  me: () => request("/organizations/me"),
}
export const documentService = {
  upload: (invoiceId: string, formData: FormData) =>
    fetch(`${config.apiBaseUrl}/invoices/${invoiceId}/documents`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }),
}
export const verificationService = {
  queue: () => request(routes.verificationQueue),
  decide: (
    invoiceId: string,
    decision: string,
    reason: string,
    invoiceVersion: number,
  ) =>
    request(`${routes.invoices}/${invoiceId}/verification-decisions`, {
      method: "POST",
      body: JSON.stringify({ decision, reason, invoiceVersion }),
    }),
}
export const financingService = {
  opportunities: () => request(routes.opportunities),
  offers: () => request(routes.offers),
}
export const fundingService = {
  list: () => request(routes.fundings),
  settlements: () => request(routes.settlements),
}
export const auditService = { list: () => request(routes.audit) }
export const ledgerService = {
  verify: (invoiceId: string) => request(`${routes.ledgerVerify}/${invoiceId}`),
}
export const adminService = {
  metrics: () => request(routes.adminMetrics),
  users: () => request("/admin/users"),
  organizations: () => request("/admin/organizations"),
}
