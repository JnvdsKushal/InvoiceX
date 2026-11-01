
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, RefreshCw } from "lucide-react";
import axios from "axios";

import { invoiceService } from "../../services/invoice.service";
import type { Invoice } from "../../types/invoice.types";

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    (location.state as { message?: string } | null)?.message || ""
  );

  async function loadInvoice() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
    } catch {
      setError("Unable to load this invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function handleSubmitInvoice() {
    if (!invoice) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit this invoice to the buyer for verification?"
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const updatedInvoice =
        await invoiceService.submitInvoice(invoice);

      setInvoice(updatedInvoice);
      setNotice("Invoice submitted successfully for verification.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const message =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.error?.message === "string"
              ? data.error.message
              : "Unable to submit invoice. Please refresh and try again.";

        setError(message);
      } else {
        setError("Something went wrong while submitting the invoice.");
      }

      if (axios.isAxiosError(err) && err.response?.status === 409) {
        await loadInvoice();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
        Loading invoice details...
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-white p-8">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => navigate("/supplier/invoices")}
          className="font-semibold text-teal-700"
        >
          Back to My Invoices
        </button>
      </div>
    );
  }

  if (!invoice) return null;

  const status = invoice.status.replaceAll("_", " ");

  const details = [
    ["Invoice Number", invoice.invoiceNumber],
    ["Issue Date", invoice.issueDate],
    ["Due Date", invoice.dueDate],
    ["Invoice Amount", `${invoice.currency} ${Number(invoice.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
    ["Purchase Order Reference", invoice.purchaseOrderReference || "Not provided"],
    ["Invoice Version", String(invoice.version)],
    ["Created At", new Date(invoice.createdAt).toLocaleString()],
    ["Last Updated", new Date(invoice.updatedAt).toLocaleString()],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/supplier/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"
      >
        <ArrowLeft size={16} />
        Back to My Invoices
      </Link>

      {notice && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Invoice Details
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Invoice ID: {invoice.id}
          </p>
        </div>

        <span className="w-fit rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
          {status}
        </span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Invoice Information
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="border-b border-slate-100 pb-3">
              <p className="text-xs font-medium uppercase text-slate-400">
                {label}
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase text-slate-400">
            Description
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {invoice.description || "No description provided."}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Verification Workflow
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {invoice.status === "DRAFT"
            ? "Review your invoice details before submitting it to the buyer."
            : invoice.status === "PENDING_VERIFICATION"
              ? "Your invoice has been submitted and is awaiting buyer verification."
              : `Current invoice status: ${status}.`}
        </p>

        {invoice.status === "DRAFT" && (
          <button
            onClick={handleSubmitInvoice}
            disabled={submitting}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        )}
      </section>
    </div>
  );
}
