
import api from "./api";
import type {
  CreateInvoicePayload,
  Invoice,
  PaginatedResponse,
} from "../types/invoice.types";

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get<PaginatedResponse<Invoice>>(
      "/invoices/"
    );

    return response.data.results;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}/`);
    return response.data;
  },

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const response = await api.post<Invoice>("/invoices/", payload);
    return response.data;
  },

  async submitInvoice(invoice: Invoice): Promise<Invoice> {
    const response = await api.post<Invoice>(
      `/invoices/${invoice.id}/submit`,
      { version: invoice.version }
    );

    return response.data;
  },
};
