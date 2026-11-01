
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, RefreshCw } from "lucide-react";
import axios from "axios";
import api from "../../services/api";

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
  const [clarificationEvents, setClarificationEvents] = useState<Array<{ id: string; decision: string; comment: string; createdAt: string; actorName: string; invoiceId: string }>>([]);
  const [clarificationReply, setClarificationReply] = useState("");
  const [documents, setDocuments] = useState<Array<{id:string;filename:string;fileType:string;size:number;sha256:string;uploadedBy:string;createdAt:string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [replying, setReplying] = useState(false);
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
      try {
        const documentResponse = await api.get<Array<{id:string;filename:string;fileType:string;size:number;sha256:string;uploadedBy:string;createdAt:string}>>("/invoices/" + id + "/documents/");
        setDocuments(documentResponse.data);
      } catch {
        setDocuments([]);
      }
      try {
        const history = await api.get<Array<{ id: string; decision: string; comment: string; createdAt: string; actorName: string; invoiceId: string }>>("/invoices/verification-history/");
        setClarificationEvents(history.data.filter((event) => event.invoiceId === id));
      } catch {
        setClarificationEvents([]);
      }
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



  async function handleDocumentUpload(file?: File) {
    if (!invoice || !id || !file) return;
    setUploading(true);
    setDocumentError("");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await api.post("/invoices/" + id + "/documents/", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocuments((current) => [response.data, ...current]);
      setNotice("Document uploaded. Its SHA-256 checksum has been recorded in the ledger event queue.");
    } catch (err) {
      setDocumentError(
        axios.isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to upload this document. Check the file and try again."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDocumentDownload(document: {id:string;filename:string}) {
    if (!id) return;
    setDocumentError("");
    try {
      const response = await api.get("/invoices/" + id + "/documents/" + document.id + "/download/", { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setDocumentError("Unable to download this document. You may not have access or the file is unavailable.");
    }
  }

  async function handleClarificationReply() {
    if (!invoice || !id || !clarificationReply.trim()) return;
    setReplying(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/invoices/" + id + "/clarification-response/", {
        comment: clarificationReply.trim(),
        version: invoice.version,
      });
      setInvoice(response.data.invoice);
      setClarificationReply("");
      setNotice("Your clarification response has been sent to the buyer.");
      try {
        const history = await api.get<Array<{ id: string; decision: string; comment: string; createdAt: string; actorName: string; invoiceId: string }>>("/invoices/verification-history/");
        setClarificationEvents(history.data.filter((event) => event.invoiceId === id));
      } catch {
        // The response was saved; history can be refreshed separately.
      }
    } catch (err) {
      const message = axios.isAxiosError(err) && typeof err.response?.data?.detail === "string"
        ? err.response.data.detail
        : "Unable to send the clarification response. Refresh the invoice and try again.";
      setError(message);
      if (axios.isAxiosError(err) && err.response?.status === 409) await loadInvoice();
    } finally {
      setReplying(false);
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


      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Invoice documents</h2>
            <p className="mt-1 text-sm text-slate-500">Private PDF, JPG or PNG files. Maximum size: 10 MB per file.</p>
          </div>
          {["DRAFT", "NEEDS_CLARIFICATION"].includes(invoice.status) && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">
              <Send size={15} /> {uploading ? "Uploading…" : "Upload document"}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void handleDocumentUpload(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </div>
        {documentError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{documentError}</p>}
        <div className="mt-4 space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-slate-900">{document.filename}</p>
                  <p className="mt-1 text-xs text-slate-500">{document.fileType} · {(document.size / 1024).toFixed(1)} KB · Uploaded by {document.uploadedBy}</p>
                </div>
                <button onClick={() => void handleDocumentDownload(document)} className="text-sm font-semibold text-teal-700">Download</button>
              </div>
              <p className="mt-3 break-all font-mono text-[11px] text-slate-500">SHA-256: {document.sha256}</p>
            </div>
          ))}
          {!documents.length && <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No supporting documents uploaded yet.</p>}
        </div>
        <p className="mt-4 text-xs text-slate-500">Files are served through authenticated invoice-scoped endpoints, not public media URLs. OCR extraction is not enabled yet.</p>
      </section>

      {invoice.status === "NEEDS_CLARIFICATION" && (
        <section className="rounded-2xl border border-amber-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Buyer clarification requested</h2>
          {clarificationEvents.filter((event) => event.decision === "CLARIFICATION").slice(0, 1).map((event) => (
            <div key={event.id} className="mt-4 rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Buyer's note · {event.actorName}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{event.comment}</p>
              <p className="mt-2 text-xs text-amber-700">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}
          <label htmlFor="clarification-reply" className="mt-5 block text-sm font-semibold text-slate-800">Your response</label>
          <textarea
            id="clarification-reply"
            value={clarificationReply}
            onChange={(event) => setClarificationReply(event.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Explain the correction or provide the information requested by the buyer…"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{clarificationReply.length}/5000 characters. This response is recorded in the verification history and ledger.</p>
            <button
              onClick={handleClarificationReply}
              disabled={replying || !clarificationReply.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {replying ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              {replying ? "Sending…" : "Send response to buyer"}
            </button>
          </div>
          {clarificationEvents.filter((event) => event.decision === "CLARIFICATION_RESPONSE").length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous responses</p>
              {clarificationEvents.filter((event) => event.decision === "CLARIFICATION_RESPONSE").map((event) => (
                <div key={event.id} className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{event.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
