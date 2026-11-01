import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, BadgeCheck, CalendarClock, CheckCircle2, FileText, Landmark, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import axios from "axios";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Invoice, PaginatedResponse } from "../../types/invoice.types";

type Offer = {
  id: string; invoice: string; invoiceNumber: string; invoiceAmount: string;
  currency: string; supplierName: string; advance_percentage: string;
  fee_percentage: string; annual_interest_rate: string; repayment_days: number;
  expires_at: string; status: string; advanceAmount: string; feeAmount: string;
};
type Agreement = {
  id: string; invoiceNumber: string; supplierName: string; principal_amount: string;
  fee_amount: string; interest_amount: string; net_proceeds: string;
  repayment_amount: string; due_date: string; status: string;
  disbursement_reference: string;
};
type Receipt = { id: string; amount: string; reference: string; recordedBy: string; created_at: string };
type Repayment = {
  id: string; invoiceNumber: string; amount_due: string; amount_received: string;
  outstanding: string; due_date: string; status: string; receipts: Receipt[];
};
type LedgerEvent = {
  id: string; eventId: string; eventType: string; entityType: string; entityId: string;
  status: string; sequence: number | null; hash: string; previousHash: string;
  actor: string; createdAt: string; deliveredAt: string | null; lastError: string;
};

const money = (value: string | number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
const date = (value: string) => value ? new Date(value).toLocaleDateString("en-IN") : "—";
const dateTime = (value: string) => value ? new Date(value).toLocaleString("en-IN") : "—";
const readable = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const statusClass = (status: string) =>
  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
  (["DELIVERED", "ACTIVE", "PAID", "SETTLED", "ACCEPTED", "ELIGIBLE_FOR_FINANCING"].includes(status)
    ? "bg-emerald-50 text-emerald-700"
    : ["FAILED", "REJECTED", "OVERDUE", "CANCELLED"].includes(status)
      ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700");

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="font-bold text-slate-900">{title}</h2>{action}
    </div><div className="p-5">{children}</div>
  </section>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}
function Metric({ label, value, icon: Icon, note }: { label: string; value: string; icon: typeof Wallet; note: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div><span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icon size={20}/></span></div>
  </div>;
}

export default function SupplierWorkspacePage() {
  const path = useLocation().pathname.split("/").filter(Boolean)[1] || "overview";
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [chain, setChain] = useState<{available: boolean; valid: boolean | null; totalBlocks?: number; detail?: string} | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const requests = await Promise.allSettled([
      api.get<PaginatedResponse<Invoice>>("/invoices/"),
      api.get<Offer[]>("/financing/offers/"),
      api.get<Agreement[]>("/financing/agreements/"),
      api.get<Repayment[]>("/financing/repayments/"),
      api.get<LedgerEvent[]>("/ledger/events/"),
    ]);
    const failures: string[] = [];
    requests.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push(["invoices", "offers", "agreements", "repayments", "ledger"][index]);
        return;
      }
      const data = result.value.data;
      if (index === 0) setInvoices(data.results || []);
      if (index === 1) setOffers(data || []);
      if (index === 2) setAgreements(data || []);
      if (index === 3) setRepayments(data || []);
      if (index === 4) setEvents(data || []);
    });
    if (failures.length) setError("Some sections could not load (" + failures.join(", ") + "). Refresh after checking your connection.");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeOffers = offers.filter((offer) => offer.status === "ACTIVE" && new Date(offer.expires_at).getTime() > Date.now());
  const openAgreements = agreements.filter((agreement) => !["SETTLED", "CANCELLED"].includes(agreement.status));
  const outstanding = repayments.reduce((total, row) => total + Number(row.outstanding || 0), 0);
  const received = repayments.reduce((total, row) => total + Number(row.amount_received || 0), 0);
  const filteredInvoices = useMemo(() => invoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    invoice.status.toLowerCase().includes(search.toLowerCase())
  ), [invoices, search]);

  const accept = async (offer: Offer) => {
    if (!window.confirm("Accept the financing offer for invoice " + offer.invoiceNumber + "? This creates a financing agreement.")) return;
    setBusy(offer.id); setError(""); setNotice("");
    try {
      await api.post("/financing/offers/" + offer.id + "/accept/", {});
      setNotice("Offer accepted. Your financing agreement is now available under My Financing.");
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail || "Could not accept this offer.") : "Unexpected error while accepting the offer.");
    } finally { setBusy(""); }
  };

  const verify = async () => {
    setBusy("verify"); setChain(null);
    try {
      const response = await api.get("/ledger/verify/");
      setChain(response.data);
    } catch {
      setChain({ available: false, valid: null, detail: "Ledger service is unavailable. Pending events remain queued for delivery." });
    } finally { setBusy(""); }
  };

  const headings: Record<string, [string, string]> = {
    overview: ["Supplier Overview", "A live view of your invoices, financing and repayment position."],
    verification: ["Verification Tracking", "Follow buyer decisions and the current status of every submitted invoice."],
    marketplace: ["Financing Marketplace", "Compare active lender offers for your verified invoices."],
    financing: ["My Financing", "Track accepted offers, funding confirmation and settlement."],
    repayments: ["Repayments", "Review repayment obligations, receipts and outstanding balances."],
    ledger: ["Blockchain Ledger", "Inspect tamper-evident events recorded for your organization."],
    organization: ["Organization Profile", "View the organization associated with your supplier account."],
    settings: ["Account Settings", "Review your account and access details."],
  };
  const [title, subtitle] = headings[path] || headings.overview;

  if (loading) return <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Loading your supplier workspace…</div>;

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold tracking-widest text-teal-700">SUPPLIER WORKSPACE</p><h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><RefreshCw size={16}/>Refresh</button>
    </div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}
    {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice}</div>}

    {path === "overview" && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total invoices" value={String(invoices.length)} icon={FileText} note="Invoices in your workspace"/>
        <Metric label="Awaiting buyer" value={String(invoices.filter((x) => ["PENDING_VERIFICATION", "NEEDS_CLARIFICATION"].includes(x.status)).length)} icon={BadgeCheck} note="Verification in progress"/>
        <Metric label="Active agreements" value={String(openAgreements.length)} icon={Wallet} note="Accepted financing"/>
        <Metric label="Outstanding repayment" value={money(outstanding)} icon={CalendarClock} note={"Received so far: " + money(received)}/>
      </div>
      <Panel title="Recent invoices" action={<Link to="/supplier/invoices" className="text-sm font-semibold text-teal-700">View all →</Link>}>
        {invoices.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Invoice</th><th className="pb-3">Amount</th><th className="pb-3">Due date</th><th className="pb-3">Status</th></tr></thead><tbody>{invoices.slice(0, 6).map((x) => <tr key={x.id} className="border-t border-slate-100"><td className="py-3 font-semibold"><Link className="text-teal-700" to={"/supplier/invoices/" + x.id}>{x.invoiceNumber}</Link></td><td className="py-3">{money(x.amount, x.currency)}</td><td className="py-3">{date(x.dueDate)}</td><td className="py-3"><span className={statusClass(x.status)}>{readable(x.status)}</span></td></tr>)}</tbody></table></div> : <Empty>No invoices yet. <Link className="font-semibold text-teal-700" to="/supplier/invoices/create">Create your first invoice</Link>.</Empty>}
      </Panel>
      <Panel title="Financing opportunities">
        {activeOffers.length ? <p className="text-sm text-slate-600">You have {activeOffers.length} active offer(s) available. <Link to="/supplier/marketplace" className="font-semibold text-teal-700">Compare offers →</Link></p> : <p className="text-sm text-slate-500">No active financing offers are currently available for your invoices.</p>}
      </Panel>
    </>}

    {path === "verification" && <Panel title="Invoice verification status">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice number or status" className="mb-4 w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-sm"/>
      {filteredInvoices.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Invoice</th><th className="pb-3">Submitted</th><th className="pb-3">Due date</th><th className="pb-3">Status</th><th className="pb-3">Details</th></tr></thead><tbody>{filteredInvoices.map((x) => <tr key={x.id} className="border-t border-slate-100"><td className="py-3 font-semibold">{x.invoiceNumber}</td><td className="py-3">{date(x.updatedAt)}</td><td className="py-3">{date(x.dueDate)}</td><td className="py-3"><span className={statusClass(x.status)}>{readable(x.status)}</span></td><td className="py-3"><Link className="font-semibold text-teal-700" to={"/supplier/invoices/" + x.id}>Open</Link></td></tr>)}</tbody></table></div> : <Empty>No invoices match your search.</Empty>}
    </Panel>}

    {path === "marketplace" && <Panel title="Available financing offers">
      {activeOffers.length ? <div className="grid gap-4 lg:grid-cols-2">{activeOffers.map((offer) => <article key={offer.id} className="rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Invoice {offer.invoiceNumber}</p><h3 className="mt-1 text-lg font-bold">{money(offer.invoiceAmount, offer.currency)}</h3></div><span className={statusClass(offer.status)}>Active</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Advance</p><p className="mt-1 font-semibold">{offer.advance_percentage}%</p><p className="text-xs text-slate-500">{money(offer.advanceAmount, offer.currency)}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Fee</p><p className="mt-1 font-semibold">{offer.fee_percentage}%</p><p className="text-xs text-slate-500">{money(offer.feeAmount, offer.currency)}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Annual interest</p><p className="mt-1 font-semibold">{offer.annual_interest_rate}%</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Repayment term</p><p className="mt-1 font-semibold">{offer.repayment_days} days</p></div></div>
        <p className="mt-3 text-xs text-slate-500">Offer expires {dateTime(offer.expires_at)}. Review the agreement terms before accepting.</p>
        <button disabled={busy === offer.id} onClick={() => void accept(offer)} className="mt-4 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === offer.id ? "Accepting…" : "Accept financing offer"}</button>
      </article>)}</div> : <Empty>No active offers are available yet. Offers appear here after a lender publishes one for an eligible invoice.</Empty>}
    </Panel>}

    {path === "financing" && <Panel title="Financing agreements">
      {agreements.length ? <div className="space-y-3">{agreements.map((a) => <article key={a.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Invoice {a.invoiceNumber}</h3><p className="mt-1 text-xs text-slate-500">Due {date(a.due_date)}</p></div><span className={statusClass(a.status)}>{readable(a.status)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Principal</p><p className="mt-1 font-semibold">{money(a.principal_amount)}</p></div><div><p className="text-xs text-slate-500">Net proceeds</p><p className="mt-1 font-semibold">{money(a.net_proceeds)}</p></div><div><p className="text-xs text-slate-500">Total repayment</p><p className="mt-1 font-semibold">{money(a.repayment_amount)}</p></div></div>{a.disbursement_reference && <p className="mt-3 text-xs text-slate-500">Disbursement reference: {a.disbursement_reference}</p>}</article>)}</div> : <Empty>You have not accepted a financing offer yet.</Empty>}
    </Panel>}

    {path === "repayments" && <Panel title="Repayment schedule and receipts">
      {repayments.length ? <div className="space-y-4">{repayments.map((row) => <article key={row.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Invoice {row.invoiceNumber}</h3><p className="mt-1 text-xs text-slate-500">Due {date(row.due_date)}</p></div><span className={statusClass(row.status)}>{readable(row.status)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Amount due</p><p className="mt-1 font-semibold">{money(row.amount_due)}</p></div><div><p className="text-xs text-slate-500">Received</p><p className="mt-1 font-semibold">{money(row.amount_received)}</p></div><div><p className="text-xs text-slate-500">Outstanding</p><p className="mt-1 font-semibold">{money(row.outstanding)}</p></div></div><div className="mt-4 border-t pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment receipts</p>{row.receipts?.length ? row.receipts.map((receipt) => <div key={receipt.id} className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><span>{money(receipt.amount)} · {receipt.reference}</span><span className="text-xs text-slate-500">{dateTime(receipt.created_at)}</span></div>) : <p className="mt-2 text-sm text-slate-500">No receipts recorded yet.</p>}</div></article>)}</div> : <Empty>No repayment schedule has been created. It appears after a lender confirms disbursement.</Empty>}
      <p className="mt-4 text-xs text-slate-500">This page displays lender-recorded payment confirmations. It does not initiate bank payments.</p>
    </Panel>}

    {path === "organization" && <Panel title="Organization information">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Organization name</p><p className="mt-1 font-semibold text-slate-900">{user?.organization?.name || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Organization status</p><p className="mt-1"><span className={statusClass(user?.organization?.status || "UNKNOWN")}>{readable(user?.organization?.status || "UNKNOWN")}</span></p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Account holder</p><p className="mt-1 font-semibold text-slate-900">{user?.name || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Email</p><p className="mt-1 font-semibold text-slate-900">{user?.email || "—"}</p></div>
      </div>
      <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Organization profile editing and document management are not enabled yet. These details are read-only.</p>
    </Panel>}

    {path === "settings" && <Panel title="Account and security">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Signed-in user</p><p className="mt-1 font-semibold text-slate-900">{user?.name || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Login email</p><p className="mt-1 font-semibold text-slate-900">{user?.email || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Role</p><p className="mt-1 font-semibold text-slate-900">{readable(user?.role || "supplier")}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Account status</p><p className="mt-1"><span className={statusClass(user?.status || "UNKNOWN")}>{readable(user?.status || "UNKNOWN")}</span></p></div>
      </div>
      <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Password changes, notification preferences and session controls will be added after the corresponding secure account APIs are implemented.</p>
    </Panel>}

    {path === "ledger" && <Panel title="Tamper-evident event history" action={<button disabled={busy === "verify"} onClick={() => void verify()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShieldCheck size={15}/>{busy === "verify" ? "Verifying…" : "Verify chain"}</button>}>
      {chain && <div role="status" className={"mb-4 rounded-xl border p-3 text-sm " + (chain.available && chain.valid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{chain.available ? (chain.valid ? "Ledger chain is valid." : "Ledger verification reported an invalid chain.") + " Blocks: " + (chain.totalBlocks ?? "—") : chain.detail || "Ledger service unavailable."}</div>}
      {events.length ? <div className="space-y-3">{events.map((event) => <article key={event.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{readable(event.eventType)}</p><p className="mt-1 text-xs text-slate-500">{dateTime(event.createdAt)} · {event.actor}</p></div><span className={statusClass(event.status)}>{readable(event.status)}</span></div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><p><span className="text-slate-500">Sequence:</span> {event.sequence ?? "Pending"}</p><p><span className="text-slate-500">Entity:</span> {event.entityType} · {event.entityId}</p><p className="break-all sm:col-span-2"><span className="text-slate-500">Event hash:</span> {event.hash || "Awaiting ledger delivery"}</p><p className="break-all sm:col-span-2"><span className="text-slate-500">Previous hash:</span> {event.previousHash || "—"}</p></div>{event.lastError && <p className="mt-2 text-xs text-red-600">Delivery issue: {event.lastError}</p>}</article>)}</div> : <Empty>No ledger events are visible yet. Events appear after invoice and financing actions are recorded.</Empty>}
      <p className="mt-4 text-xs text-slate-500">Events are queued in Django and delivered asynchronously to the Rust hash-linked ledger. Pending delivery is not the same as a failed integrity check.</p>
    </Panel>}
  </div>;
}
