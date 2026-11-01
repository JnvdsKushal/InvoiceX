
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  RefreshCw,
  FileText,
} from "lucide-react";

import { invoiceService } from "../../services/invoice.service";
import { organizationService } from "../../services/organization.service";
import type {
  BuyerOrganization,
  Invoice,
} from "../../types/invoice.types";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-800",
  NEEDS_CLARIFICATION: "bg-orange-100 text-orange-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DISPUTED: "bg-red-100 text-red-800",
  ELIGIBLE_FOR_FINANCING: "bg-teal-100 text-teal-800",
  OFFER_PENDING: "bg-blue-100 text-blue-800",
  OFFER_ACCEPTED: "bg-indigo-100 text-indigo-800",
  FUNDING_PENDING: "bg-blue-100 text-blue-800",
  FUNDED: "bg-green-100 text-green-800",
  REPAYMENT_PENDING: "bg-amber-100 text-amber-800",
  SETTLED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function readableStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [buyers, setBuyers] = useState<BuyerOrganization[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const [invoiceData, buyerData] = await Promise.all([
        invoiceService.getInvoices(),
        organizationService.getActiveBuyers(),
      ]);

      setInvoices(invoiceData);
      setBuyers(buyerData);
    } catch {
      setError("Unable to load invoices. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const buyerNames = useMemo(
    () => new Map(buyers.map((buyer) => [buyer.id, buyer.name])),
    [buyers]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const buyerName =
        buyerNames.get(invoice.buyerOrganizationId) || "";

      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        buyerName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter, buyerNames]);

  const statuses = Array.from(
    new Set(invoices.map((invoice) => invoice.status))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track the invoices submitted by your organization.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadInvoices}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <Link
            to="/supplier/invoices/create"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Plus size={17} />
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Invoices</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {invoices.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {invoices.filter((item) => item.status === "DRAFT").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending Verification</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {invoices.filter(
              (item) => item.status === "PENDING_VERIFICATION"
            ).length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or buyer..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
        >
          <option value="ALL">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {readableStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-slate-300" size={38} />
            <h3 className="mt-4 font-semibold text-slate-800">
              No invoices found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or create your first invoice.
            </p>
            <Link
              to="/supplier/invoices/create"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {invoice.invoiceNumber}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {buyerNames.get(invoice.buyerOrganizationId) ||
                        "Buyer organization"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.issueDate}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.dueDate}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {invoice.currency}{" "}
                      {Number(invoice.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          statusStyles[invoice.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {readableStatus(invoice.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/supplier/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-2 font-semibold text-teal-700 hover:text-teal-900"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </p>
    </div>
  );
}
