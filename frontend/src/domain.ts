export type Role = "supplier" | "buyer" | "lender" | "admin"

export type InvoiceStatus = "DRAFT" | "PENDING_VERIFICATION" | "NEEDS_CLARIFICATION" | "VERIFIED" | "REJECTED" | "DISPUTED" | "ELIGIBLE_FOR_FINANCING" | "OFFER_PENDING" | "OFFER_ACCEPTED" | "FUNDING_PENDING" | "FUNDED" | "REPAYMENT_PENDING" | "SETTLED" | "CANCELLED"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  organizationId: string
  status: "ACTIVE" | "PENDING" | "SUSPENDED"
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  type: "MSME" | "BUYER" | "LENDER" | "PLATFORM"
  registrationIdentifier: string | null
  status: "ACTIVE" | "PENDING" | "SUSPENDED"
  createdAt: string
}

export interface InvoiceDocument {
  id: string
  invoiceId: string
  filename: string
  contentType: string
  size: number
  uploadStatus: "UPLOADING" | "UPLOADED" | "FAILED"
  createdAt: string
}

export interface Invoice {
  id: string
  organizationId: string
  buyerOrganizationId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: string
  currency: string
  status: InvoiceStatus
  documentIds: string[]
  purchaseOrderReference: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface FinancingOffer {
  id: string
  invoiceId: string
  lenderOrganizationId: string
  advanceAmount: string
  feeAmount: string
  repaymentTerms: string | null
  expiryAt: string
  status: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED"
  createdAt: string
}

export interface TimelineEvent {
  id: string
  invoiceId: string
  title: string
  detail: string
  occurredAt: string
  outcome: "SUCCESS" | "INFO" | "WARNING"
}

export interface Notification {
  id: string
  type: "ACTION" | "UPDATE" | "SYSTEM"
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

export interface AuditEvent {
  id: string
  actorId: string | null
  organizationId: string | null
  entityType: string
  entityId: string
  action: string
  occurredAt: string
  outcome: "SUCCESS" | "DENIED" | "FAILED"
  metadata: Record<string, string>
}

export interface LedgerRecord {
  id: string
  eventType: string
  recordHash: string
  previousHash: string | null
  createdAt: string
  verificationStatus: "VERIFIED" | "DISCREPANCY" | "PENDING"
  discrepancyDetails: string | null
}

export interface Funding {
  id: string
  offerId: string
  invoiceId: string
  amount: string
  status: "PENDING" | "FUNDED" | "REPAID" | "OVERDUE"
  initiatedAt: string
  completedAt: string | null
}
