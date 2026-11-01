
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FilePlus2, Loader2 } from "lucide-react";
import axios from "axios";

import { organizationService } from "../../services/organization.service";
import { invoiceService } from "../../services/invoice.service";
import type {
  BuyerOrganization,
  CreateInvoicePayload,
} from "../../types/invoice.types";

export default function CreateInvoicePage() {
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState<BuyerOrganization[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<CreateInvoicePayload>({
    buyerOrganizationId: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    amount: "",
    currency: "INR",
    purchaseOrderReference: "",
    description: "",
  });

  useEffect(() => {
    async function loadBuyers() {
      try {
        const data = await organizationService.getActiveBuyers();
        setBuyers(data);
      } catch {
        setError("Unable to load registered buyers. Please try again.");
      } finally {
        setLoadingBuyers(false);
      }
    }

    loadBuyers();
  }, []);

  function updateField(
    field: keyof CreateInvoicePayload,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.buyerOrganizationId) {
      setError("Please select a buyer organization.");
      return;
    }

    if (Number(form.amount) <= 0) {
      setError("Invoice amount must be greater than zero.");
      return;
    }

    if (form.dueDate < form.issueDate) {
      setError("Due date cannot be before issue date.");
      return;
    }

    setSaving(true);

    try {
      const payload: CreateInvoicePayload = {
        ...form,
        amount: Number(form.amount).toFixed(2),
        purchaseOrderReference:
          form.purchaseOrderReference?.trim() || "",
        description: form.description.trim(),
      };

      const invoice = await invoiceService.createInvoice(payload);

      setSuccess("Invoice draft created successfully.");

      navigate(`/supplier/invoices/${invoice.id}`, {
        state: { message: "Invoice draft created successfully." },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (data && typeof data === "object") {
          const messages = Object.entries(data)
            .map(([field, value]) => {
              const message = Array.isArray(value)
                ? value.join(", ")
                : String(value);

              return `${field}: ${message}`;
            })
            .join(" ");

          setError(messages || "Unable to create invoice.");
        } else {
          setError("Unable to connect to the server.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          to="/supplier/invoices"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to My Invoices
        </Link>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <FilePlus2 size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your invoice details to create a draft.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <section>
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Invoice Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Invoice Number *</label>
              <input
                className={inputClass}
                placeholder="e.g. INV-2026-001"
                value={form.invoiceNumber}
                onChange={(e) =>
                  updateField("invoiceNumber", e.target.value)
                }
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className={labelClass}>Buyer Organization *</label>
              <select
                className={inputClass}
                value={form.buyerOrganizationId}
                onChange={(e) =>
                  updateField("buyerOrganizationId", e.target.value)
                }
                required
                disabled={loadingBuyers}
              >
                <option value="">
                  {loadingBuyers
                    ? "Loading buyers..."
                    : "Select a registered buyer"}
                </option>

                {buyers.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.name}
                  </option>
                ))}
              </select>

              {!loadingBuyers && buyers.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No active buyer organizations are available yet.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Issue Date *</label>
              <input
                type="date"
                className={inputClass}
                value={form.issueDate}
                onChange={(e) =>
                  updateField("issueDate", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className={labelClass}>Due Date *</label>
              <input
                type="date"
                className={inputClass}
                min={form.issueDate || undefined}
                value={form.dueDate}
                onChange={(e) =>
                  updateField("dueDate", e.target.value)
                }
                required
              />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Financial Details
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Invoice Amount *</label>
              <input
                type="number"
                className={inputClass}
                placeholder="50000.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  updateField("amount", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className={labelClass}>Currency *</label>
              <select
                className={inputClass}
                value={form.currency}
                onChange={(e) =>
                  updateField("currency", e.target.value)
                }
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Purchase Order Reference
              </label>
              <input
                className={inputClass}
                placeholder="e.g. PO-2026-001"
                value={form.purchaseOrderReference || ""}
                onChange={(e) =>
                  updateField(
                    "purchaseOrderReference",
                    e.target.value
                  )
                }
                maxLength={100}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        <section>
          <label className={labelClass}>Invoice Description</label>
          <textarea
            className={inputClass}
            rows={4}
            placeholder="Describe the goods or services supplied..."
            value={form.description}
            onChange={(e) =>
              updateField("description", e.target.value)
            }
          />
        </section>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="font-semibold text-slate-700">
            Original Invoice Document
          </p>
          <p className="mt-1 text-sm text-slate-500">
            PDF/image upload and OCR extraction will be added in the
            document integration milestone. For now, enter the details
            manually.
          </p>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            to="/supplier/invoices"
            className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || loadingBuyers || buyers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={17} className="animate-spin" />}
            {saving ? "Saving..." : "Save Invoice Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
