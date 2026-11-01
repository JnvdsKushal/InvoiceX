
export interface BuyerOrganization {
  id: string;
  name: string;
}

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "NEEDS_CLARIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "DISPUTED"
  | "ELIGIBLE_FOR_FINANCING"
  | "OFFER_PENDING"
  | "OFFER_ACCEPTED"
  | "FUNDING_PENDING"
  | "FUNDED"
  | "REPAYMENT_PENDING"
  | "SETTLED"
  | "CANCELLED";

export interface Invoice {
  id: string;
  organizationId: string;
  buyerOrganizationId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  status: InvoiceStatus;
  documentIds: string[];
  purchaseOrderReference: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateInvoicePayload {
  buyerOrganizationId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  purchaseOrderReference?: string;
  description: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
