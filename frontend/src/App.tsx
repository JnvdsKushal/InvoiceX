import { useMemo, useState, useRef, type FormEvent, type ReactNode } from "react"
import type { FinancingOffer, Invoice, InvoiceStatus, Role } from "./domain"
import {
  auditEvents,
  documents,
  fundings,
  ledgerRecords,
  notifications,
  organizations,
  seedInvoices,
  seedOffers,
  timeline,
  users,
} from "./mockData"
import { registerUser } from "./services"

type View = string
type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "purple"

const roleLabels: Record<Role, string> = {
  supplier: "MSME / Supplier",
  buyer: "Buyer",
  lender: "Lender",
  admin: "Platform admin",
}

const statusMeta: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_VERIFICATION: { label: "Pending verification", tone: "amber" },
  NEEDS_CLARIFICATION: { label: "Needs clarification", tone: "purple" },
  VERIFIED: { label: "Verified", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
  DISPUTED: { label: "Disputed", tone: "red" },
  ELIGIBLE_FOR_FINANCING: { label: "Eligible", tone: "blue" },
  OFFER_PENDING: { label: "Offer pending", tone: "purple" },
  OFFER_ACCEPTED: { label: "Offer accepted", tone: "green" },
  FUNDING_PENDING: { label: "Funding pending", tone: "amber" },
  FUNDED: { label: "Funded", tone: "green" },
  REPAYMENT_PENDING: { label: "Repayment pending", tone: "amber" },
  SETTLED: { label: "Settled", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "green" },
  PENDING: { label: "Pending", tone: "amber" },
  SUSPENDED: { label: "Suspended", tone: "red" },
  SUBMITTED: { label: "Submitted", tone: "blue" },
  ACCEPTED: { label: "Accepted", tone: "green" },
  DECLINED: { label: "Declined", tone: "red" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  SUCCESS: { label: "Success", tone: "green" },
  DENIED: { label: "Denied", tone: "red" },
  FAILED: { label: "Failed", tone: "red" },
}

const navigation: Record<Role, { label: string; view: View; icon: string }[]> = {
  supplier: [
    { label: "Overview", view: "dashboard", icon: "grid" },
    { label: "Invoices", view: "invoices", icon: "file" },
    { label: "Financing", view: "financing", icon: "bank" },
    { label: "Funding & settlement", view: "funding", icon: "trend" },
    { label: "Notifications", view: "notifications", icon: "bell" },
  ],
  buyer: [
    { label: "Overview", view: "dashboard", icon: "grid" },
    { label: "Verification queue", view: "queue", icon: "check" },
    { label: "Verified invoices", view: "verified", icon: "file" },
    { label: "Disputes", view: "disputes", icon: "alert" },
    { label: "Review history", view: "history", icon: "clock" },
  ],
  lender: [
    { label: "Overview", view: "dashboard", icon: "grid" },
    { label: "Opportunities", view: "opportunities", icon: "search" },
    { label: "My offers", view: "offers", icon: "file" },
    { label: "Funding portfolio", view: "portfolio", icon: "trend" },
    { label: "Settlements", view: "settlements", icon: "check" },
  ],
  admin: [
    { label: "Platform overview", view: "dashboard", icon: "grid" },
    { label: "Organizations", view: "organizations", icon: "building" },
    { label: "Users & roles", view: "users", icon: "users" },
    { label: "Workflow monitor", view: "monitor", icon: "file" },
    { label: "Audit trail", view: "audit", icon: "clock" },
    { label: "Ledger integrity", view: "ledger", icon: "link" },
    { label: "System health", view: "health", icon: "pulse" },
  ],
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    bank: (
      <>
        <path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />
      </>
    ),
    trend: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 16 4-5 4 3 5-7" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
        <circle cx="12" cy="12" r="10" />
      </>
    ),
    alert: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
      </>
    ),
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M21 3v18" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.file}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "danger" | "text"
  icon?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

function Badge({ status, text }: { status: string; text?: string }) {
  const meta = statusMeta[status] || {
    label: status.replace(/_/g, " ").toLowerCase(),
    tone: "neutral" as Tone,
  }
  return (
    <span className={`badge badge-${meta.tone}`}>
      <span className="badge-dot" />
      {text || meta.label}
    </span>
  )
}

function money(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value))
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  )
}

function Stat({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string
  value: string
  detail: string
  tone?: Tone
}) {
  return (
    <article className="stat-card">
      <div className={`stat-mark mark-${tone}`} />
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}

function EmptyState({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="file" size={22} />
      </div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  )
}

function DemoBar({
  role,
  setRole,
  reset,
}: {
  role: Role
  setRole: (role: Role) => void
  reset: () => void
}) {
  return (
    <div className="demo-bar">
      <span>
        <strong>DEMO MODE</strong>
        <span className="demo-copy">
          Sample data · Actions are not persisted
        </span>
      </span>
      <div>
        <label htmlFor="role-switch">View as</label>
        <select
          id="role-switch"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={reset}>Reset demo</button>
      </div>
    </div>
  )
}

function AppShell({
  role,
  view,
  setView,
  setRole,
  reset,
  children,
  onSignOut,
}: {
  role: Role
  view: View
  setView: (v: View) => void
  setRole: (r: Role) => void
  reset: () => void
  children: ReactNode
  onSignOut: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = users.find((item) => item.role === role)!
  const org = organizations.find((item) => item.id === user.organizationId)!
  const current =
    navigation[role].find((item) => item.view === view)?.label || "Detail"
  return (
    <div className="app-root">
      <DemoBar
        role={role}
        setRole={(next) => {
          setRole(next)
          setView("dashboard")
        }}
        reset={reset}
      />
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand brand-light">
          <span className="brand-mark">IX</span>
          <span>InvoiceX</span>
        </div>
        <div className="org-context">
          <span>Organization</span>
          <strong>{org.name}</strong>
          <small>{roleLabels[role]}</small>
        </div>
        <nav aria-label="Primary navigation">
          {navigation[role].map((item) => (
            <button
              key={item.view}
              className={view === item.view ? "active" : ""}
              onClick={() => {
                setView(item.view)
                setMobileOpen(false)
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setView("settings")}>
            <Icon name="users" />
            Profile & settings
          </button>
          <button onClick={onSignOut}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="app-area">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumbs">
            <span>InvoiceX</span>
            <Icon name="arrow" size={14} />
            <strong>{current}</strong>
          </div>
          <div className="top-actions">
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() =>
                setView(role === "supplier" ? "notifications" : "dashboard")
              }
            >
              <Icon name="bell" />
              <span />
            </button>
            <div className="avatar">
              {user.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </div>
            <div className="user-copy">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}

function InvoiceTable({
  invoices,
  onOpen,
  title,
  compact = false,
}: {
  invoices: Invoice[]
  onOpen: (invoice: Invoice) => void
  title?: string
  compact?: boolean
}) {
  return (
    <div className="panel table-panel">
      {title && (
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            <p>Latest workflow activity across your invoices</p>
          </div>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Buyer</th>
              <th>Due date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, compact ? 4 : undefined).map((invoice) => (
              <tr key={invoice.id} onClick={() => onOpen(invoice)}>
                <td>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>
                    {invoice.purchaseOrderReference || "No PO reference"}
                  </span>
                </td>
                <td>Northstar Retail</td>
                <td>{date(invoice.dueDate)}</td>
                <td className="money">{money(invoice.amount)}</td>
                <td>
                  <Badge status={invoice.status} />
                </td>
                <td>
                  <button
                    className="row-action"
                    aria-label={`Open ${invoice.invoiceNumber}`}
                  >
                    <Icon name="arrow" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SupplierDashboard({
  invoices,
  offers,
  openInvoice,
  setView,
}: {
  invoices: Invoice[]
  offers: FinancingOffer[]
  openInvoice: (i: Invoice) => void
  setView: (v: View) => void
}) {
  return (
    <>
      <PageHeader
        eyebrow="Monday, 2 June 2025"
        title="Good morning, Priya"
        description="Here’s what needs your attention across receivables and financing."
        actions={
          <Button icon="plus" onClick={() => setView("create-invoice")}>
            Create invoice
          </Button>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Total receivables"
          value={money("1266500")}
          detail="Across 5 open invoices"
        />
        <Stat
          label="Awaiting verification"
          value="1"
          detail={money("185500")}
          tone="amber"
        />
        <Stat
          label="Available offers"
          value={String(offers.filter((o) => o.status === "SUBMITTED").length)}
          detail="For 1 eligible invoice"
          tone="purple"
        />
        <Stat
          label="Funded to date"
          value={money("288000")}
          detail="1 active facility"
          tone="green"
        />
      </div>
      <div className="dashboard-grid">
        <div className="panel cashflow-panel">
          <div className="panel-title">
            <div>
              <h2>Receivables outlook</h2>
              <p>Expected invoice value by due period</p>
            </div>
            <select aria-label="Chart period">
              <option>Next 90 days</option>
            </select>
          </div>
          <div
            className="chart"
            aria-label="Bar chart showing receivables outlook"
          >
            <div className="chart-y">
              <span>₹6L</span>
              <span>₹4L</span>
              <span>₹2L</span>
              <span>₹0</span>
            </div>
            <div className="bars">
              {[
                ["1–15 Jun", 38],
                ["16–30 Jun", 68],
                ["1–15 Jul", 54],
                ["16–31 Jul", 82],
                ["August", 46],
              ].map(([label, height]) => (
                <div className="bar-cell" key={label}>
                  <div className="bar-track">
                    <div className="bar" style={{ height: `${height}%` }} />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-blue" />
              Open receivables
            </span>
            <span>
              Total scheduled: <strong>{money("1266500")}</strong>
            </span>
          </div>
        </div>
        <div className="panel attention-panel">
          <div className="panel-title">
            <div>
              <h2>Needs attention</h2>
              <p>Priority actions for your team</p>
            </div>
          </div>
          <button onClick={() => setView("financing")}>
            <span className="attention-icon purple">
              <Icon name="bank" />
            </span>
            <span>
              <strong>2 offers ready to compare</strong>
              <small>AC-2025-1048 · Expires soon</small>
            </span>
            <Icon name="arrow" />
          </button>
          <button
            onClick={() =>
              openInvoice(
                invoices.find((i) => i.status === "NEEDS_CLARIFICATION")!,
              )
            }
          >
            <span className="attention-icon amber">
              <Icon name="alert" />
            </span>
            <span>
              <strong>Clarification requested</strong>
              <small>AC-2025-1054 · Document needed</small>
            </span>
            <Icon name="arrow" />
          </button>
          <button onClick={() => setView("settings")}>
            <span className="attention-icon blue">
              <Icon name="users" />
            </span>
            <span>
              <strong>Review organization profile</strong>
              <small>Annual check due in 12 days</small>
            </span>
            <Icon name="arrow" />
          </button>
        </div>
      </div>
      <InvoiceTable
        title="Recent invoices"
        invoices={invoices}
        onOpen={openInvoice}
        compact
      />
    </>
  )
}

function InvoiceList({
  invoices,
  openInvoice,
  setView,
}: {
  invoices: Invoice[]
  openInvoice: (i: Invoice) => void
  setView: (v: View) => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("ALL")
  const filtered = invoices.filter(
    (i) =>
      (i.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
        (i.purchaseOrderReference || "")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (status === "ALL" || i.status === status),
  )
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, submit and track invoices throughout the financing lifecycle."
        actions={
          <Button icon="plus" onClick={() => setView("create-invoice")}>
            Create invoice
          </Button>
        }
      />
      <div className="panel">
        <div className="toolbar">
          <div className="search-field">
            <Icon name="search" />
            <input
              aria-label="Search invoices"
              placeholder="Search invoice or PO reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="ELIGIBLE_FOR_FINANCING">Eligible</option>
            <option value="FUNDED">Funded</option>
          </select>
          <Button variant="secondary" icon="filter">
            More filters
          </Button>
        </div>
        {filtered.length ? (
          <InvoiceTable invoices={filtered} onOpen={openInvoice} />
        ) : (
          <EmptyState
            title="No invoices found"
            detail="Try adjusting your search or status filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("")
                  setStatus("ALL")
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
        <div className="pagination">
          <span>
            Showing {filtered.length} of {invoices.length} invoices
          </span>
          <div>
            <Button variant="secondary" disabled>
              Previous
            </Button>
            <Button variant="secondary" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function CreateInvoice({
  onSave,
  onCancel,
}: {
  onSave: (input: Partial<Invoice>) => void
  onCancel: () => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    number: "",
    issueDate: "2025-06-02",
    dueDate: "",
    amount: "",
    po: "",
    description: "",
  })
  const [filename, setFilename] = useState("")
  const invalid =
    submitted &&
    (!form.number || !form.dueDate || !form.amount || Number(form.amount) <= 0)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (
      !form.number ||
      !form.dueDate ||
      !form.amount ||
      Number(form.amount) <= 0
    )
      return
    onSave({
      invoiceNumber: form.number,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      amount: Number(form.amount).toFixed(2),
      purchaseOrderReference: form.po || null,
      description: form.description || null,
      documentIds: filename ? ["demo-upload"] : [],
    })
  }
  return (
    <>
      <PageHeader
        title="Create invoice"
        description="Save a private draft before submitting it to the buyer."
      />
      <form className="form-layout" onSubmit={submit} noValidate>
        <section className="panel form-section">
          <div className="section-heading">
            <span>1</span>
            <div>
              <h2>Invoice details</h2>
              <p>
                Enter the details exactly as shown on the supporting invoice.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>
                Invoice number <b>*</b>
              </span>
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                aria-invalid={submitted && !form.number}
                placeholder="e.g. AC-2025-1058"
              />
              {submitted && !form.number && (
                <small className="field-error">
                  Invoice number is required.
                </small>
              )}
            </label>
            <label>
              <span>
                Buyer organization <b>*</b>
              </span>
              <select>
                <option>Northstar Retail</option>
              </select>
            </label>
            <label>
              <span>
                Invoice date <b>*</b>
              </span>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm({ ...form, issueDate: e.target.value })
                }
              />
            </label>
            <label>
              <span>
                Due date <b>*</b>
              </span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                aria-invalid={submitted && !form.dueDate}
              />
              {submitted && !form.dueDate && (
                <small className="field-error">Due date is required.</small>
              )}
            </label>
            <label>
              <span>
                Invoice amount <b>*</b>
              </span>
              <div className="currency-field">
                <span>₹</span>
                <input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value.replace(/[^\d.]/g, ""),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              {submitted && (!form.amount || Number(form.amount) <= 0) && (
                <small className="field-error">
                  Enter an amount greater than zero.
                </small>
              )}
            </label>
            <label>
              <span>Purchase order reference</span>
              <input
                value={form.po}
                onChange={(e) => setForm({ ...form, po: e.target.value })}
                placeholder="e.g. PO-NS-8944"
              />
            </label>
            <label className="full">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Briefly describe the goods or services invoiced"
              />
            </label>
          </div>
        </section>
        <section className="panel form-section">
          <div className="section-heading">
            <span>2</span>
            <div>
              <h2>Supporting document</h2>
              <p>
                Documents remain private and are never stored on the ledger.
              </p>
            </div>
          </div>
          <label className="upload-zone">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFilename(e.target.files?.[0]?.name || "")}
            />
            <span className="upload-icon">
              <Icon name="download" />
            </span>
            {filename ? (
              <>
                <strong>{filename}</strong>
                <small>Ready to upload with this draft</small>
              </>
            ) : (
              <>
                <strong>Choose a file or drag it here</strong>
                <small>PDF, PNG or JPG · Maximum 10 MB</small>
              </>
            )}
          </label>
        </section>
        <div className="form-actions">
          {invalid && (
            <span className="form-error">
              <Icon name="alert" />
              Please correct the highlighted fields.
            </span>
          )}
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save draft</Button>
        </div>
      </form>
    </>
  )
}

function InvoiceDetail({
  invoice,
  role,
  offers,
  onBack,
  onSubmit,
  onDecision,
  onOffer,
}: {
  invoice: Invoice
  role: Role
  offers: FinancingOffer[]
  onBack: () => void
  onSubmit: () => void
  onDecision: (
    decision: "VERIFIED" | "NEEDS_CLARIFICATION",
    reason: string,
  ) => void
  onOffer: () => void
}) {
  const [decision, setDecision] =
    useState<null | "VERIFIED" | "NEEDS_CLARIFICATION">(null)
  const [reason, setReason] = useState("")
  const doc = documents.find((item) => item.invoiceId === invoice.id)
  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← Back to list
      </button>
      <PageHeader
        eyebrow={`Invoice · Version ${invoice.version}`}
        title={invoice.invoiceNumber}
        description={`Issued ${date(invoice.issueDate)} · Due ${date(invoice.dueDate)}`}
        actions={<Badge status={invoice.status} />}
      />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel summary-panel">
            <div className="panel-title">
              <div>
                <h2>Invoice summary</h2>
                <p>Submitted information and buyer reference</p>
              </div>
            </div>
            <dl className="summary-grid">
              <div>
                <dt>Supplier</dt>
                <dd>Aster Components</dd>
              </div>
              <div>
                <dt>Buyer</dt>
                <dd>Northstar Retail</dd>
              </div>
              <div>
                <dt>Invoice amount</dt>
                <dd className="large-value">{money(invoice.amount)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{date(invoice.dueDate)}</dd>
              </div>
              <div>
                <dt>Purchase order</dt>
                <dd>{invoice.purchaseOrderReference || "Not provided"}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{invoice.currency}</dd>
              </div>
              <div className="full">
                <dt>Description</dt>
                <dd>{invoice.description || "No description provided"}</dd>
              </div>
            </dl>
          </section>
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Supporting documents</h2>
                <p>Access is authorized and tenant-scoped by the backend</p>
              </div>
            </div>
            {doc ? (
              <div className="document-row">
                <span className="doc-icon">
                  <Icon name="file" />
                </span>
                <span>
                  <strong>{doc.filename}</strong>
                  <small>
                    PDF · {(doc.size / 1024).toFixed(0)} KB · Uploaded{" "}
                    {date(doc.createdAt)}
                  </small>
                </span>
                <Button variant="secondary" icon="download">
                  Secure download
                </Button>
              </div>
            ) : (
              <EmptyState
                title="No document attached"
                detail="A supporting invoice document has not been uploaded."
              />
            )}
          </section>
          <section className="panel timeline-panel">
            <div className="panel-title">
              <div>
                <h2>Activity timeline</h2>
                <p>Illustrative events in demo mode</p>
              </div>
            </div>
            {timeline
              .filter((event) => event.invoiceId === "inv-1")
              .map((event) => (
                <div className="timeline-item" key={event.id}>
                  <span
                    className={`timeline-dot ${event.outcome.toLowerCase()}`}
                  >
                    <Icon
                      name={event.outcome === "SUCCESS" ? "check" : "clock"}
                      size={15}
                    />
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                    <small>
                      {date(event.occurredAt)} ·{" "}
                      {new Date(event.occurredAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
              ))}
          </section>
        </div>
        <aside className="detail-aside">
          {role === "supplier" && (
            <section className="panel action-panel">
              <h2>Available actions</h2>
              {invoice.status === "DRAFT" ? (
                <>
                  <p>
                    Review the draft carefully before sending it to the buyer.
                  </p>
                  <Button className="full-button" onClick={onSubmit}>
                    Review & submit
                  </Button>
                  <Button className="full-button" variant="secondary">
                    Edit draft
                  </Button>
                </>
              ) : invoice.status === "ELIGIBLE_FOR_FINANCING" ? (
                <>
                  <span className="success-callout">
                    <Icon name="check" />
                    <span>
                      <strong>Eligible for financing</strong>
                      <small>
                        Eligibility is provided by the platform workflow.
                      </small>
                    </span>
                  </span>
                  <p>
                    {
                      offers.filter(
                        (o) =>
                          o.invoiceId === invoice.id &&
                          o.status === "SUBMITTED",
                      ).length
                    }{" "}
                    financing offers are available.
                  </p>
                  <Button className="full-button" onClick={onOffer}>
                    Compare offers
                  </Button>
                </>
              ) : (
                <p>
                  There are no actions required right now. We’ll notify you when
                  the status changes.
                </p>
              )}
            </section>
          )}
          {role === "buyer" && (
            <section className="panel action-panel">
              <h2>Verification decision</h2>
              <p>
                Confirm the invoice matches your records and the authorized
                supporting document.
              </p>
              <div className="decision-note">
                <Icon name="alert" />
                <span>
                  This decision applies to version {invoice.version}. A newer
                  version requires another review.
                </span>
              </div>
              <Button
                className="full-button"
                onClick={() => setDecision("VERIFIED")}
              >
                Verify invoice
              </Button>
              <Button
                className="full-button"
                variant="secondary"
                onClick={() => setDecision("NEEDS_CLARIFICATION")}
              >
                Request clarification
              </Button>
            </section>
          )}
          {role === "lender" && (
            <section className="panel action-panel">
              <h2>Financing opportunity</h2>
              <p>
                This invoice is eligible based on platform-provided workflow
                data. No credit score is implied.
              </p>
              <Button className="full-button" onClick={onOffer}>
                Create financing offer
              </Button>
            </section>
          )}
          <section className="panel mini-panel">
            <h3>Data integrity</h3>
            <Badge status="VERIFIED" text="Ledger record verified" />
            <p>
              Hash-linked record status returned by the demo ledger response.
              Documents are off-chain.
            </p>
          </section>
        </aside>
      </div>
      {decision && (
        <Dialog
          title={
            decision === "VERIFIED"
              ? "Verify this invoice?"
              : "Request clarification"
          }
          onClose={() => setDecision(null)}
        >
          <p>
            {decision === "VERIFIED"
              ? "This confirms that invoice details match your records. The backend will validate the transition before it is committed."
              : "Explain what the supplier needs to update. A reason is required."}
          </p>
          {decision === "NEEDS_CLARIFICATION" && (
            <label className="dialog-field">
              <span>
                Reason <b>*</b>
              </span>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the discrepancy or missing information"
              />
            </label>
          )}
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              disabled={decision === "NEEDS_CLARIFICATION" && !reason.trim()}
              onClick={() => {
                onDecision(decision, reason)
                setDecision(null)
              }}
            >
              Confirm decision
            </Button>
          </div>
        </Dialog>
      )}
    </>
  )
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FinancingPage({
  invoices,
  offers,
  onAccept,
  role,
  onCreate,
}: {
  invoices: Invoice[]
  offers: FinancingOffer[]
  onAccept: (offer: FinancingOffer) => void
  role: Role
  onCreate: (invoice: Invoice) => void
}) {
  const eligible = invoices.find(
    (i) =>
      i.status === "ELIGIBLE_FOR_FINANCING" || i.status === "OFFER_PENDING",
  )
  const relevant = offers.filter((o) => o.status === "SUBMITTED")
  if (role === "lender")
    return (
      <OpportunityPage
        invoices={invoices}
        offers={offers}
        onCreate={onCreate}
      />
    )
  return (
    <>
      <PageHeader
        title="Financing offers"
        description="Compare transparent terms for your eligible invoices. Demo terms are illustrative, not financial advice."
      />
      <div className="demo-notice">
        <Icon name="alert" />
        <span>
          <strong>Illustrative financing data</strong> These sample offers do
          not represent a real approval, recommendation or commitment to fund.
        </span>
      </div>
      {eligible && (
        <section className="panel invoice-strip">
          <div>
            <span>Eligible invoice</span>
            <strong>{eligible.invoiceNumber}</strong>
            <small>Due {date(eligible.dueDate)} · Northstar Retail</small>
          </div>
          <div>
            <span>Invoice amount</span>
            <strong>{money(eligible.amount)}</strong>
          </div>
          <Badge status={eligible.status} />
        </section>
      )}
      <div className="offer-grid">
        {relevant.map((offer, index) => (
          <article
            className={`panel offer-card ${index === 0 ? "featured" : ""}`}
            key={offer.id}
          >
            {index === 0 && (
              <span className="recommended">Highest net proceeds</span>
            )}
            <div className="offer-head">
              <div className="lender-logo">MC</div>
              <div>
                <h2>{index === 0 ? "Meridian Capital" : "Summit Finance"}</h2>
                <p>Financing offer · Demo</p>
              </div>
              <Badge status={offer.status} />
            </div>
            <dl>
              <div>
                <dt>Advance amount</dt>
                <dd>{money(offer.advanceAmount)}</dd>
              </div>
              <div>
                <dt>Total fee</dt>
                <dd>{money(offer.feeAmount)}</dd>
              </div>
              <div className="net">
                <dt>Estimated net proceeds</dt>
                <dd>
                  {money(Number(offer.advanceAmount) - Number(offer.feeAmount))}
                </dd>
              </div>
              <div>
                <dt>Advance rate</dt>
                <dd>
                  {Math.round(
                    (Number(offer.advanceAmount) /
                      Number(eligible?.amount || 1)) *
                      100,
                  )}
                  %
                </dd>
              </div>
              <div>
                <dt>Offer expires</dt>
                <dd>{date(offer.expiryAt)}</dd>
              </div>
              <div>
                <dt>Repayment</dt>
                <dd>{offer.repaymentTerms}</dd>
              </div>
            </dl>
            <div className="offer-actions">
              <Button variant="secondary">View full terms</Button>
              <Button onClick={() => onAccept(offer)}>Review & accept</Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function OpportunityPage({
  invoices,
  offers,
  onCreate,
}: {
  invoices: Invoice[]
  offers: FinancingOffer[]
  onCreate: (invoice: Invoice) => void
}) {
  const eligible = invoices.filter((i) =>
    ["ELIGIBLE_FOR_FINANCING", "OFFER_PENDING"].includes(i.status),
  )
  return (
    <>
      <PageHeader
        title="Financing opportunities"
        description="Review platform-eligible invoices and submit terms within permitted limits."
      />
      <div className="demo-notice">
        <Icon name="alert" />
        <span>
          Eligibility indicators are <strong>illustrative</strong>. InvoiceX
          does not fabricate credit scores or underwriting decisions.
        </span>
      </div>
      <div className="stats-grid three">
        <Stat
          label="Eligible opportunities"
          value={String(eligible.length)}
          detail="Matching current filters"
        />
        <Stat
          label="Eligible invoice value"
          value={money(eligible.reduce((s, i) => s + Number(i.amount), 0))}
          detail="Across visible opportunities"
          tone="purple"
        />
        <Stat
          label="Offers awaiting response"
          value={String(offers.filter((o) => o.status === "SUBMITTED").length)}
          detail="Supplier response pending"
          tone="amber"
        />
      </div>
      <div className="panel">
        <div className="toolbar">
          <div className="search-field">
            <Icon name="search" />
            <input
              placeholder="Search buyer, supplier or invoice"
              aria-label="Search opportunities"
            />
          </div>
          <select aria-label="Due date filter">
            <option>All due dates</option>
            <option>Due within 30 days</option>
            <option>Due within 60 days</option>
          </select>
          <Button variant="secondary" icon="filter">
            Filters
          </Button>
        </div>
        {eligible.map((invoice) => (
          <div className="opportunity-row" key={invoice.id}>
            <div className="opp-main">
              <span className="lender-logo">AC</span>
              <div>
                <strong>{invoice.invoiceNumber}</strong>
                <small>Aster Components → Northstar Retail</small>
              </div>
            </div>
            <div>
              <span>Invoice amount</span>
              <strong>{money(invoice.amount)}</strong>
            </div>
            <div>
              <span>Due date</span>
              <strong>{date(invoice.dueDate)}</strong>
            </div>
            <div>
              <span>Eligibility</span>
              <Badge status="ELIGIBLE_FOR_FINANCING" />
            </div>
            <Button onClick={() => onCreate(invoice)}>Create offer</Button>
          </div>
        ))}
      </div>
    </>
  )
}

function BuyerDashboard({
  invoices,
  openInvoice,
  setView,
}: {
  invoices: Invoice[]
  openInvoice: (i: Invoice) => void
  setView: (v: View) => void
}) {
  const pending = invoices.filter((i) => i.status === "PENDING_VERIFICATION")
  return (
    <>
      <PageHeader
        title="Verification overview"
        description="Review supplier invoices assigned to Northstar Retail."
      />
      <div className="stats-grid">
        <Stat
          label="Pending verification"
          value={String(pending.length)}
          detail="1 due within 2 business days"
          tone="amber"
        />
        <Stat
          label="Completed this month"
          value="18"
          detail="94% within service target"
          tone="green"
        />
        <Stat
          label="Clarification requests"
          value="1"
          detail="Awaiting supplier response"
          tone="purple"
        />
        <Stat
          label="Disputed"
          value="0"
          detail="No open disputes"
          tone="green"
        />
      </div>
      <div className="panel queue-card">
        <div className="panel-title">
          <div>
            <h2>Priority verification queue</h2>
            <p>Oldest assigned invoices appear first</p>
          </div>
          <Button variant="text" onClick={() => setView("queue")}>
            View full queue →
          </Button>
        </div>
        {pending.map((invoice) => (
          <div className="queue-item" key={invoice.id}>
            <div>
              <strong>{invoice.invoiceNumber}</strong>
              <span>
                Aster Components · Submitted {date(invoice.updatedAt)}
              </span>
            </div>
            <div>
              <span>Invoice amount</span>
              <strong>{money(invoice.amount)}</strong>
            </div>
            <div>
              <span>Due date</span>
              <strong>{date(invoice.dueDate)}</strong>
            </div>
            <Button onClick={() => openInvoice(invoice)}>Review invoice</Button>
          </div>
        ))}
      </div>
      <InvoiceTable
        title="Recent decisions"
        invoices={invoices.filter((i) =>
          [
            "VERIFIED",
            "ELIGIBLE_FOR_FINANCING",
            "FUNDED",
            "NEEDS_CLARIFICATION",
          ].includes(i.status),
        )}
        onOpen={openInvoice}
        compact
      />
    </>
  )
}

function AdminPage({ view, invoices }: { view: View; invoices: Invoice[] }) {
  if (view === "organizations")
    return (
      <>
        <PageHeader
          title="Organizations"
          description="Manage tenant activation and review organization status."
        />
        <div className="panel">
          <div className="toolbar">
            <div className="search-field">
              <Icon name="search" />
              <input
                placeholder="Search organizations"
                aria-label="Search organizations"
              />
            </div>
            <select>
              <option>All organization types</option>
            </select>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Type</th>
                  <th>Identifier</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <strong>{org.name}</strong>
                    </td>
                    <td>{org.type}</td>
                    <td>{org.registrationIdentifier || "Not applicable"}</td>
                    <td>{date(org.createdAt)}</td>
                    <td>
                      <Badge status={org.status} />
                    </td>
                    <td>
                      <Button variant="text">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  if (view === "users")
    return (
      <>
        <PageHeader
          title="Users & roles"
          description="Role assignments require server authorization and are tenant-scoped."
          actions={<Button icon="plus">Invite user</Button>}
        />
        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Organization</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>
                      {
                        organizations.find((o) => o.id === user.organizationId)
                          ?.name
                      }
                    </td>
                    <td>{roleLabels[user.role]}</td>
                    <td>{date(user.createdAt)}</td>
                    <td>
                      <Badge status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  if (view === "audit")
    return (
      <>
        <PageHeader
          title="Audit trail"
          description="Authorized operational events with filters and outcomes."
        />
        <div className="panel">
          <div className="toolbar">
            <input type="date" aria-label="Start date" />
            <select>
              <option>All outcomes</option>
              <option>Success</option>
              <option>Denied</option>
            </select>
            <select>
              <option>All event types</option>
            </select>
            <Button variant="secondary" icon="filter">
              Apply filters
            </Button>
          </div>
          {auditEvents.map((event) => (
            <div className="audit-row" key={event.id}>
              <span className={`audit-icon ${event.outcome.toLowerCase()}`}>
                <Icon name={event.outcome === "SUCCESS" ? "check" : "alert"} />
              </span>
              <div>
                <strong>{event.action.replace(/_/g, " ")}</strong>
                <small>
                  {event.entityType} · {event.entityId}
                </small>
              </div>
              <div>
                <span>Actor</span>
                <strong>
                  {users.find((u) => u.id === event.actorId)?.name ||
                    "System / anonymous"}
                </strong>
              </div>
              <div>
                <span>Occurred</span>
                <strong>{date(event.occurredAt)}</strong>
              </div>
              <Badge status={event.outcome} />
            </div>
          ))}
        </div>
      </>
    )
  if (view === "ledger")
    return (
      <>
        <PageHeader
          title="Ledger integrity"
          description="Verification results reported by the separate Rust ledger service."
          actions={
            <Button variant="secondary" icon="pulse">
              Run verification
            </Button>
          }
        />
        <div className="integrity-summary">
          <span className="integrity-icon">
            <Icon name="check" size={24} />
          </span>
          <div>
            <h2>Hash chain verified</h2>
            <p>
              2 records verified · 1 record awaiting verification · Last checked
              2 Jun 2025, 10:42 IST
            </p>
          </div>
          <Badge status="VERIFIED" />
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Ledger records</h2>
              <p>Only event data and document fingerprints are represented</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Event</th>
                  <th>Record hash</th>
                  <th>Previous hash</th>
                  <th>Timestamp</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.id}</strong>
                    </td>
                   <td>{record.eventType.replace(/_/g, " ")}</td>
                    <td>
                      <code>{record.recordHash}</code>
                    </td>
                    <td>
                      <code>{record.previousHash || "Genesis"}</code>
                    </td>
                    <td>{date(record.createdAt)}</td>
                    <td>
                      <Badge status={record.verificationStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  if (view === "health")
    return (
      <>
        <PageHeader
          title="System health"
          description="Service checks are illustrative in demo mode and not live uptime claims."
        />
        <div className="demo-notice">
          <Icon name="alert" />
          <span>
            <strong>Demo status only.</strong> Live mode must request configured
            health endpoints before showing availability.
          </span>
        </div>
        <div className="health-grid">
          {[
            ["Django API", "/api/v1/health/", "Not checked in demo"],
            [
              "Rust ledger service",
              "Configurable endpoint",
              "Not checked in demo",
            ],
            [
              "Document storage",
              "Private off-chain storage",
              "Not checked in demo",
            ],
          ].map(([name, endpoint, state]) => (
            <div className="panel health-card" key={name}>
              <span className="health-symbol">
                <Icon name="pulse" />
              </span>
              <div>
                <h2>{name}</h2>
                <p>{endpoint}</p>
              </div>
              <Badge status="PENDING" text={state} />
            </div>
          ))}
        </div>
      </>
    )
  if (view === "monitor")
    return (
      <>
        <PageHeader
          title="Workflow monitor"
          description="Observe state transitions without changing tenant workflow decisions."
        />
        <InvoiceTable invoices={invoices} onOpen={() => undefined} />
      </>
    )
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Operational indicators for the InvoiceX demo environment."
      />
      <div className="stats-grid">
        <Stat
          label="Active organizations"
          value="3"
          detail="1 MSME · 1 buyer · 1 lender"
        />
        <Stat
          label="Invoices monitored"
          value={String(invoices.length)}
          detail={money(invoices.reduce((s, i) => s + Number(i.amount), 0))}
          tone="purple"
        />
        <Stat
          label="Pending reviews"
          value={String(
            invoices.filter((i) => i.status === "PENDING_VERIFICATION").length,
          )}
          detail="Within service target"
          tone="amber"
        />
        <Stat
          label="Ledger verification"
          value="2 / 3"
          detail="1 pending record"
          tone="green"
        />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Workflow distribution</h2>
              <p>Current invoice states</p>
            </div>
          </div>
          {[
            "DRAFT",
            "PENDING_VERIFICATION",
            "ELIGIBLE_FOR_FINANCING",
            "FUNDED",
            "NEEDS_CLARIFICATION",
          ].map((status) => (
            <div className="metric-row" key={status}>
              <Badge status={status} />
              <div className="metric-track">
                <span
                  style={{
                    width: `${Math.max(18, invoices.filter((i) => i.status === status).length * 35)}%`,
                  }}
                />
              </div>
              <strong>
                {invoices.filter((i) => i.status === status).length}
              </strong>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Recent operational events</h2>
              <p>Authorized audit event sample</p>
            </div>
          </div>
          {auditEvents.map((event) => (
            <div className="mini-event" key={event.id}>
              <span className={`audit-icon ${event.outcome.toLowerCase()}`}>
                <Icon name={event.outcome === "SUCCESS" ? "check" : "alert"} />
              </span>
              <div>
                <strong>{event.action.replace(/_/g, " ")}</strong>
                <small>
                  {date(event.occurredAt)} · {event.entityType}
                </small>
              </div>
              <Badge status={event.outcome} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function FundingPage({ role }: { role: Role }) {
  return (
    <>
      <PageHeader
        title={role === "lender" ? "Funding portfolio" : "Funding & settlement"}
        description="Track backend-reported funding, repayment and settlement states."
      />
      <div className="stats-grid three">
        <Stat
          label="Active funding"
          value={money("288000")}
          detail="1 funded invoice"
          tone="green"
        />
        <Stat
          label="Awaiting funding"
          value={money("0")}
          detail="No pending disbursements"
          tone="amber"
        />
        <Stat
          label="Settled"
          value={money("0")}
          detail="No settlements yet"
          tone="purple"
        />
      </div>
      {fundings.map((funding) => (
        <div className="panel funding-card" key={funding.id}>
          <div className="funding-head">
            <div>
              <p>Facility {funding.id.toUpperCase()}</p>
              <h2>
                {
                  seedInvoices.find((i) => i.id === funding.invoiceId)
                    ?.invoiceNumber
                }
              </h2>
            </div>
            <Badge status={funding.status} />
          </div>
          <div className="funding-amount">
            <span>Funded amount</span>
            <strong>{money(funding.amount)}</strong>
            <small>
              Completed{" "}
              {funding.completedAt ? date(funding.completedAt) : "Pending"}
            </small>
          </div>
          <div className="progress-steps">
            <div className="complete">
              <i>
                <Icon name="check" size={14} />
              </i>
              <span>
                <strong>Offer accepted</strong>
                <small>29 Apr 2025</small>
              </span>
            </div>
            <div className="complete">
              <i>
                <Icon name="check" size={14} />
              </i>
              <span>
                <strong>Funding completed</strong>
                <small>2 May 2025</small>
              </span>
            </div>
            <div>
              <i>3</i>
              <span>
                <strong>Repayment due</strong>
                <small>20 Jun 2025</small>
              </span>
            </div>
            <div>
              <i>4</i>
              <span>
                <strong>Settlement</strong>
                <small>Awaiting repayment</small>
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Profile & organization"
        description="Manage your account, organization context and session security."
      />
      <div className="settings-grid">
        <div className="panel form-section">
          <div className="panel-title">
            <div>
              <h2>Personal details</h2>
              <p>Your profile information for this demo identity</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input defaultValue="Priya Sharma" />
            </label>
            <label>
              <span>Email</span>
              <input defaultValue="priya@example.test" disabled />
            </label>
            <label>
              <span>Timezone</span>
              <select>
                <option>India Standard Time (IST)</option>
              </select>
            </label>
          </div>
          <div className="settings-action">
            <Button>Save changes</Button>
          </div>
        </div>
        <div className="panel security-card">
          <h2>Security & sessions</h2>
          <div>
            <Icon name="check" />
            <span>
              <strong>HttpOnly session recommended</strong>
              <small>
                Live authentication should use secure cookies where supported.
              </small>
            </span>
          </div>
          <Button variant="secondary">Manage active sessions</Button>
        </div>
      </div>
    </>
  )
}

function PublicApp({ onEnter }: { onEnter: () => void }) {
  const [page, setPage] = useState<"landing" | "login" | "register" | "forgot">(
    "landing",
  )
  const [showPassword, setShowPassword] = useState(false)
  const [sent, setSent] = useState(false)
  // Registration API state
  const [regLoading, setRegLoading] = useState(false)
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})
  const [regSuccess, setRegSuccess] = useState(false)
  const regFormRef = useRef<HTMLFormElement>(null)
  if (page !== "landing")
    return (
      <div className="auth-page">
        <header className="public-nav">
          <button className="brand" onClick={() => setPage("landing")}>
            <span className="brand-mark">IX</span>
            <span>InvoiceX</span>
          </button>
          <span>
            {page === "login" ? "New to InvoiceX?" : "Already registered?"}{" "}
            <button
              onClick={() => setPage(page === "login" ? "register" : "login")}
            >
              {page === "login" ? "Create account" : "Sign in"}
            </button>
          </span>
        </header>
        <main className="auth-main">
          <div className="auth-card">
            {page === "login" && (
              <>
                <div className="auth-heading">
                  <span className="auth-icon">
                    <Icon name="link" />
                  </span>
                  <h1>Welcome back</h1>
                  <p>Sign in to your organization workspace.</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    onEnter()
                  }}
                >
                  <label>
                    <span>Work email</span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                  <div className="form-between">
                    <label className="checkbox">
                      <input type="checkbox" />
                      Keep me signed in
                    </label>
                    <button type="button" onClick={() => setPage("forgot")}>
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="full-button">
                    Sign in
                  </Button>
                </form>
                <div className="demo-login">
                  <strong>Explore the product in demo mode</strong>
                  <p>No password or real account required. Sample data only.</p>
                  <Button
                    variant="secondary"
                    className="full-button"
                    onClick={onEnter}
                  >
                    Enter demo workspace
                  </Button>
                </div>
              </>
            )}
            {page === "register" && (
              <>
                <div className="auth-heading">
                  <span className="auth-icon">
                    <Icon name="building" />
                  </span>
                  <h1>Create your workspace</h1>
                  <p>Register your organization to begin onboarding.</p>
                </div>
                {regSuccess ? (
                  <div className="success-panel">
                    <Icon name="check" size={24} />
                    <h2>Registration received</h2>
                    <p>
                      Your account has been created and is currently{" "}
                      <strong>pending organization approval</strong>. Email
                      verification and admin review are still in progress — you
                      will be notified once your account is activated.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRegSuccess(false)
                        setRegErrors({})
                        regFormRef.current?.reset()
                        setPage("login")
                      }}
                    >
                      Return to sign in
                    </Button>
                  </div>
                ) : (
                  <form
                    ref={regFormRef}
                    onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                      e.preventDefault()
                      if (regLoading) return
                      setRegErrors({})
                      const fd = new FormData(e.currentTarget)
                      const orgTypeRaw = fd.get("organizationType") as string
                      const orgTypeMap: Record<string, "MSME" | "BUYER" | "LENDER"> = {
                        "MSME / Supplier": "MSME",
                        "Buyer": "BUYER",
                        "Bank / NBFC / Lender": "LENDER",
                      }
                      const payload = {
                        firstName: (fd.get("firstName") as string).trim(),
                        lastName: (fd.get("lastName") as string).trim(),
                        email: (fd.get("email") as string).trim(),
                        organizationName: (fd.get("organizationName") as string).trim(),
                        organizationType: orgTypeMap[orgTypeRaw] ?? "MSME",
                        password: fd.get("password") as string,
                      }
                      setRegLoading(true)
                      try {
                        const result = await registerUser(payload)
                        if (result.ok) {
                          setRegSuccess(true)
                        } else {
                          setRegErrors(result.fieldErrors)
                        }
                      } catch {
                        setRegErrors({
                          __all__: "Network error. Please check your connection and try again.",
                        })
                      } finally {
                        setRegLoading(false)
                      }
                    }}
                  >
                    {regErrors["__all__"] && (
                      <div className="error-message" role="alert">
                        {regErrors["__all__"]}
                      </div>
                    )}
                    <div className="auth-two">
                      <label>
                        <span>First name</span>
                        <input name="firstName" required />
                        {regErrors["firstName"] && (
                          <small className="field-error">{regErrors["firstName"]}</small>
                        )}
                      </label>
                      <label>
                        <span>Last name</span>
                        <input name="lastName" required />
                        {regErrors["lastName"] && (
                          <small className="field-error">{regErrors["lastName"]}</small>
                        )}
                      </label>
                    </div>
                    <label>
                      <span>Work email</span>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="name@company.com"
                      />
                      {regErrors["email"] && (
                        <small className="field-error">{regErrors["email"]}</small>
                      )}
                    </label>
                    <label>
                      <span>Organization name</span>
                      <input name="organizationName" required />
                      {regErrors["organizationName"] && (
                        <small className="field-error">{regErrors["organizationName"]}</small>
                      )}
                    </label>
                    <label>
                      <span>Organization type</span>
                      <select name="organizationType">
                        <option value="MSME / Supplier">MSME / Supplier</option>
                        <option value="Buyer">Buyer</option>
                        <option value="Bank / NBFC / Lender">Bank / NBFC / Lender</option>
                      </select>
                      {regErrors["organizationType"] && (
                        <small className="field-error">{regErrors["organizationType"]}</small>
                      )}
                    </label>
                    <label>
                      <span>Password</span>
                      <input name="password" type="password" required minLength={10} />
                      <small>
                        At least 10 characters with a number and symbol.
                      </small>
                      {regErrors["password"] && (
                        <small className="field-error">{regErrors["password"]}</small>
                      )}
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" required />I agree to the prototype
                      terms and privacy notice.
                    </label>
                    <Button
                      type="submit"
                      className="full-button"
                      disabled={regLoading}
                    >
                      {regLoading ? "Creating account…" : "Create account"}
                    </Button>
                  </form>
                )}
              </>
            )}
            {page === "forgot" && (
              <>
                <div className="auth-heading">
                  <span className="auth-icon">
                    <Icon name="file" />
                  </span>
                  <h1>Reset your password</h1>
                  <p>
                    Enter your work email and we’ll send reset instructions if
                    an account exists.
                  </p>
                </div>
                {sent ? (
                  <div className="success-panel">
                    <Icon name="check" size={24} />
                    <h2>Check your inbox</h2>
                    <p>
                      If this email is registered, reset instructions have been
                      sent.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSent(false)
                        setPage("login")
                      }}
                    >
                      Return to sign in
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setSent(true)
                    }}
                  >
                    <label>
                      <span>Work email</span>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                      />
                    </label>
                    <Button type="submit" className="full-button">
                      Send reset link
                    </Button>
                    <Button
                      variant="text"
                      className="full-button"
                      onClick={() => setPage("login")}
                    >
                      Back to sign in
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
          <p className="auth-disclaimer">
            InvoiceX is a prototype integration environment. It is not a
            licensed lender and does not move production funds.
          </p>
        </main>
      </div>
    )
  return (
    <div className="public-page">
      <header className="public-nav landing-nav">
        <div className="brand">
          <span className="brand-mark">IX</span>
          <span>InvoiceX</span>
        </div>
        <nav>
          <button
            onClick={() =>
              document.getElementById("workflow")?.scrollIntoView()
            }
          >
            How it works
          </button>
          <button
            onClick={() =>
              document.getElementById("security")?.scrollIntoView()
            }
          >
            Security
          </button>
          <button
            onClick={() => document.getElementById("faq")?.scrollIntoView()}
          >
            FAQ
          </button>
        </nav>
        <div>
          <Button variant="text" onClick={() => setPage("login")}>
            Sign in
          </Button>
          <Button onClick={() => setPage("register")}>Get started</Button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <i />
              Working capital, with clearer workflows
            </span>
            <h1>
              Turn verified invoices into <em>financing opportunities.</em>
            </h1>
            <p>
              InvoiceX connects suppliers, buyers and lenders through a
              transparent, role-based workflow—with tamper-evident event records
              and private document storage.
            </p>
            <div className="hero-actions">
              <Button onClick={() => setPage("register")}>
                Create your workspace <Icon name="arrow" />
              </Button>
              <Button variant="secondary" onClick={onEnter}>
                Explore demo
              </Button>
            </div>
            <div className="hero-trust">
              <span>
                <Icon name="check" />
                Private documents
              </span>
              <span>
                <Icon name="check" />
                Role-based access
              </span>
              <span>
                <Icon name="check" />
                Auditable events
              </span>
            </div>
          </div>
          <div className="hero-product">
            <div className="product-top">
              <span className="brand-mark">IX</span>
              <span>Receivables overview</span>
              <Badge status="VERIFIED" text="Demo workspace" />
            </div>
            <div className="product-kpis">
              <div>
                <span>Eligible receivables</span>
                <strong>{money("425500")}</strong>
                <small>2 verified invoices</small>
              </div>
              <div>
                <span>Available offers</span>
                <strong>4</strong>
                <small>Across 2 invoices</small>
              </div>
            </div>
            <div className="product-list">
              <span>Recent activity</span>
              {[
                ["AC-2025-1048", "Offer received", "₹2,40,000.00"],
                ["AC-2025-1051", "Pending verification", "₹1,85,500.00"],
                ["AC-2025-1039", "Funding completed", "₹3,20,000.00"],
              ].map(([id, state, amount], i) => (
                <div key={id}>
                  <i className={`product-icon pi-${i}`}>
                    <Icon
                      name={i === 2 ? "check" : i === 1 ? "clock" : "bank"}
                      size={16}
                    />
                  </i>
                  <span>
                    <strong>{id}</strong>
                    <small>{state}</small>
                  </span>
                  <b>{amount}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="logo-band">
          <p>Built for the teams behind every invoice</p>
          <div>
            <span>MSME finance teams</span>
            <span>Enterprise buyers</span>
            <span>Banks & NBFCs</span>
            <span>Platform operations</span>
          </div>
        </section>
        <section className="workflow-section" id="workflow">
          <div className="section-intro">
            <span>CONNECTED WORKFLOW</span>
            <h2>From invoice to settlement, with every role in sync.</h2>
            <p>
              One shared process, clear responsibilities and backend-controlled
              decisions.
            </p>
          </div>
          <div className="workflow-grid">
            {[
              [
                "01",
                "Supplier submits",
                "Create an invoice, attach supporting documents privately, and submit it for buyer review.",
                "file",
              ],
              [
                "02",
                "Buyer verifies",
                "Authorized reviewers verify, request clarification, or reject with a documented reason.",
                "check",
              ],
              [
                "03",
                "Lenders offer",
                "Eligible invoices become opportunities. Lenders provide transparent financing terms.",
                "bank",
              ],
              [
                "04",
                "Funding is tracked",
                "Accepted offers move through funding, repayment and settlement based on API status.",
                "trend",
              ],
            ].map(([n, title, text, icon]) => (
              <article key={n}>
                <span>{n}</span>
                <i>
                  <Icon name={icon} />
                </i>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="security-section" id="security">
          <div>
            <span className="section-label">SECURITY BY DESIGN</span>
            <h2>Private where it matters. Verifiable where it counts.</h2>
            <p>
              InvoiceX separates sensitive business documents from
              tamper-evident workflow records, without overstating what a custom
              ledger provides.
            </p>
            <ul>
              <li>
                <Icon name="check" />
                <span>
                  <strong>Documents stay off-chain</strong>Private storage and
                  authorized, expiring access flows.
                </span>
              </li>
              <li>
                <Icon name="check" />
                <span>
                  <strong>Backend-authoritative decisions</strong>Django
                  controls permissions, tenant scope and state transitions.
                </span>
              </li>
              <li>
                <Icon name="check" />
                <span>
                  <strong>Hash-linked event records</strong>The Rust service
                  reports integrity results for its own ledger.
                </span>
              </li>
            </ul>
          </div>
          <div className="security-visual">
            <div className="security-node">
              <Icon name="file" />
              <span>
                <strong>Private document</strong>
                <small>Encrypted off-chain storage</small>
              </span>
              <Badge status="ACTIVE" text="Restricted" />
            </div>
            <div className="connector">
              <span>Document fingerprint only</span>
            </div>
            <div className="security-node">
              <Icon name="link" />
              <span>
                <strong>Ledger event</strong>
                <small>Hash-linked workflow record</small>
              </span>
              <Badge status="VERIFIED" />
            </div>
          </div>
        </section>
        <section className="faq-section" id="faq">
          <div className="section-intro">
            <span>COMMON QUESTIONS</span>
            <h2>Designed for trust and clarity.</h2>
          </div>
          <div>
            {[
              "Is InvoiceX a lender?",
              "Are invoice documents stored on-chain?",
              "Who decides whether an invoice is eligible?",
              "Is the ledger a decentralized blockchain?",
            ].map((q, i) => (
              <details key={q} open={i === 0}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>
                  {i === 0
                    ? "No. This frontend is a prototype workflow platform and does not claim to be a licensed lender or move production funds."
                    : i === 1
                      ? "No. Documents remain in private off-chain storage. Only appropriate event data and fingerprints may be recorded."
                      : i === 2
                        ? "The authoritative backend returns eligibility according to configured business rules. The frontend does not force eligibility."
                        : "No such claim is made. The separate Rust service maintains tamper-evident, hash-linked records; this is not decentralized consensus."}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <div className="brand brand-light">
          <span className="brand-mark">IX</span>
          <span>InvoiceX</span>
        </div>
        <p>Prototype platform for invoice financing workflows.</p>
        <span>© 2025 InvoiceX · Demo only</span>
      </footer>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<Role>("supplier")
  const [view, setView] = useState<View>("dashboard")
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices)
  const [offers, setOffers] = useState<FinancingOffer[]>(seedOffers)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [confirm, setConfirm] = useState<{
    type: "submit" | "accept"
    offer?: FinancingOffer
  } | null>(null)
  const [toast, setToast] = useState("")
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 3200)
  }
  const reset = () => {
    setInvoices(seedInvoices)
    setOffers(seedOffers)
    setSelected(null)
    setView("dashboard")
    showToast("Demo data has been reset.")
  }
  const updateInvoice = (id: string, status: InvoiceStatus) =>
    setInvoices((current) =>
      current.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              version: i.version + 1,
              updatedAt: new Date().toISOString(),
            }
          : i,
      ),
    )
  const currentInvoices = useMemo(
    () =>
      role === "buyer"
        ? invoices.filter((i) => i.buyerOrganizationId === "org-buyer")
        : invoices,
    [invoices, role],
  )
  const open = (invoice: Invoice) => {
    setSelected(invoice)
    setView("invoice-detail")
  }
  const saveDraft = (input: Partial<Invoice>) => {
    const created: Invoice = {
      id: `inv-${Date.now()}`,
      organizationId: "org-supplier",
      buyerOrganizationId: "org-buyer",
      invoiceNumber: input.invoiceNumber!,
      issueDate: input.issueDate!,
      dueDate: input.dueDate!,
      amount: input.amount!,
      currency: "INR",
      status: "DRAFT",
      documentIds: input.documentIds || [],
      purchaseOrderReference: input.purchaseOrderReference || null,
      description: input.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
    setInvoices((all) => [created, ...all])
    setView("invoices")
    showToast("Draft invoice saved locally in demo mode.")
  }
  const doAccept = (offer: FinancingOffer) => {
    setOffers((all) =>
      all.map((o) =>
        o.id === offer.id
          ? { ...o, status: "ACCEPTED" }
          : o.invoiceId === offer.invoiceId
            ? { ...o, status: "DECLINED" }
            : o,
      ),
    )
    updateInvoice(offer.invoiceId, "OFFER_ACCEPTED")
    setConfirm(null)
    showToast("Offer accepted in demo mode. Funding is not confirmed.")
  }
  if (!authenticated)
    return <PublicApp onEnter={() => setAuthenticated(true)} />
  let content: ReactNode
  if (view === "invoice-detail" && selected) {
    const fresh = invoices.find((i) => i.id === selected.id) || selected
    content = (
      <InvoiceDetail
        invoice={fresh}
        role={role}
        offers={offers}
        onBack={() =>
          setView(
            role === "buyer"
              ? "queue"
              : role === "lender"
                ? "opportunities"
                : "invoices",
          )
        }
        onSubmit={() => setConfirm({ type: "submit" })}
        onDecision={(decision, reason) => {
          updateInvoice(fresh.id, decision)
          showToast(
            decision === "VERIFIED"
              ? "Invoice verified. Eligibility remains backend-controlled."
              : `Clarification requested: ${reason}`,
          )
        }}
        onOffer={() =>
          setView(role === "lender" ? "create-offer" : "financing")
        }
      />
    )
  } else if (view === "create-invoice")
    content = (
      <CreateInvoice onSave={saveDraft} onCancel={() => setView("invoices")} />
    )
  else if (view === "invoices")
    content = (
      <InvoiceList
        invoices={currentInvoices}
        openInvoice={open}
        setView={setView}
      />
    )
  else if (view === "financing")
    content = (
      <FinancingPage
        invoices={invoices}
        offers={offers}
        role={role}
        onAccept={(offer) => setConfirm({ type: "accept", offer })}
        onCreate={(invoice) => {
          setSelected(invoice)
          setView("create-offer")
        }}
      />
    )
  else if (view === "opportunities")
    content = (
      <OpportunityPage
        invoices={invoices}
        offers={offers}
        onCreate={(invoice) => {
          setSelected(invoice)
          setView("create-offer")
        }}
      />
    )
  else if (view === "create-offer" && selected)
    content = (
      <OfferForm
        invoice={selected}
        onCancel={() => setView("opportunities")}
        onSubmit={(offer) => {
          setOffers((all) => [offer, ...all])
          updateInvoice(selected.id, "OFFER_PENDING")
          setView("offers")
          showToast("Offer submitted in demo mode.")
        }}
      />
    )
  else if (["funding", "portfolio", "settlements"].includes(view))
    content = <FundingPage role={role} />
  else if (view === "queue")
    content = (
      <>
        <PageHeader
          title="Verification queue"
          description="Invoices assigned to your organization for authorized review."
        />
        <InvoiceTable
          invoices={currentInvoices.filter(
            (i) => i.status === "PENDING_VERIFICATION",
          )}
          onOpen={open}
        />
      </>
    )
  else if (view === "verified")
    content = (
      <>
        <PageHeader
          title="Verified invoices"
          description="Invoices previously verified by authorized reviewers."
        />
        <InvoiceTable
          invoices={currentInvoices.filter((i) =>
            ["VERIFIED", "ELIGIBLE_FOR_FINANCING", "FUNDED"].includes(i.status),
          )}
          onOpen={open}
        />
      </>
    )
  else if (view === "disputes")
    content = (
      <>
        <PageHeader
          title="Disputed invoices"
          description="Track open disputes and prior clarification requests."
        />
        <InvoiceTable
          invoices={currentInvoices.filter((i) =>
            ["DISPUTED", "NEEDS_CLARIFICATION", "REJECTED"].includes(i.status),
          )}
          onOpen={open}
        />
      </>
    )
  else if (view === "history")
    content = (
      <>
        <PageHeader
          title="Review history"
          description="A record of your organization’s prior invoice decisions."
        />
        <InvoiceTable
          invoices={currentInvoices.filter(
            (i) => i.status !== "PENDING_VERIFICATION" && i.status !== "DRAFT",
          )}
          onOpen={open}
        />
      </>
    )
  else if (view === "offers")
    content = (
      <>
        <PageHeader
          title="My offers"
          description="Review financing offers and backend-reported statuses."
          actions={
            <Button onClick={() => setView("opportunities")}>
              Find opportunities
            </Button>
          }
        />
        <OfferList offers={offers} invoices={invoices} />
      </>
    )
  else if (view === "notifications") content = <NotificationPage />
  else if (view === "settings") content = <SettingsPage />
  else if (role === "admin")
    content = <AdminPage view={view} invoices={invoices} />
  else if (role === "buyer")
    content = (
      <BuyerDashboard
        invoices={currentInvoices}
        openInvoice={open}
        setView={setView}
      />
    )
  else if (role === "lender")
    content = (
      <>
        <PageHeader
          title="Lender overview"
          description="Illustrative opportunity and portfolio indicators for Meridian Capital."
          actions={
            <Button onClick={() => setView("opportunities")}>
              Browse opportunities
            </Button>
          }
        />
        <div className="stats-grid">
          <Stat
            label="Eligible opportunities"
            value="1"
            detail={money("240000")}
          />
          <Stat
            label="Offers awaiting response"
            value={String(
              offers.filter((o) => o.status === "SUBMITTED").length,
            )}
            detail={money(
              offers
                .filter((o) => o.status === "SUBMITTED")
                .reduce((s, o) => s + Number(o.advanceAmount), 0),
            )}
            tone="amber"
          />
          <Stat
            label="Accepted offers"
            value={String(offers.filter((o) => o.status === "ACCEPTED").length)}
            detail="Current demo state"
            tone="purple"
          />
          <Stat
            label="Active funding"
            value={money("288000")}
            detail="1 funded facility"
            tone="green"
          />
        </div>
        <OpportunityPage
          invoices={invoices}
          offers={offers}
          onCreate={(invoice) => {
            setSelected(invoice)
            setView("create-offer")
          }}
        />
      </>
    )
  else
    content = (
      <SupplierDashboard
        invoices={currentInvoices}
        offers={offers}
        openInvoice={open}
        setView={setView}
      />
    )
  return (
    <AppShell
      role={role}
      view={view}
      setView={setView}
      setRole={setRole}
      reset={reset}
      onSignOut={() => setAuthenticated(false)}
    >
      {content}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{toast}</span>
          <button aria-label="Dismiss" onClick={() => setToast("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {confirm && (
        <Dialog
          title={
            confirm.type === "submit"
              ? "Submit invoice for verification?"
              : "Accept this financing offer?"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm.type === "submit"
              ? "The buyer will receive the current invoice version for review. You cannot edit it while verification is pending."
              : `You are about to accept an offer with an advance of ${money(confirm.offer!.advanceAmount)} and a fee of ${money(confirm.offer!.feeAmount)}. The server must approve this action.`}
          </p>
          <div className="confirmation-note">
            <Icon name="alert" />
            <span>
              {confirm.type === "submit"
                ? "Submission changes state only after a successful response."
                : "Acceptance is final only after server confirmation. Funding is a separate status."}
            </span>
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirm.type === "accept") doAccept(confirm.offer!)
                else if (selected) {
                  updateInvoice(selected.id, "PENDING_VERIFICATION")
                  setConfirm(null)
                  showToast("Invoice submitted for buyer verification.")
                }
              }}
            >
              Confirm {confirm.type === "submit" ? "submission" : "acceptance"}
            </Button>
          </div>
        </Dialog>
      )}
    </AppShell>
  )
}

function OfferForm({
  invoice,
  onCancel,
  onSubmit,
}: {
  invoice: Invoice
  onCancel: () => void
  onSubmit: (offer: FinancingOffer) => void
}) {
  const [advance, setAdvance] = useState("216000")
  const [fee, setFee] = useState("6480")
  const [expiry, setExpiry] = useState("2025-06-10")
  const invalid =
    Number(advance) <= 0 ||
    Number(advance) > Number(invoice.amount) ||
    Number(fee) < 0
  return (
    <>
      <PageHeader
        title="Create financing offer"
        description={`Set illustrative terms for ${invoice.invoiceNumber}. Backend rules remain authoritative.`}
      />
      <form
        className="form-layout"
        onSubmit={(e) => {
          e.preventDefault()
          if (invalid) return
          onSubmit({
            id: `off-${Date.now()}`,
            invoiceId: invoice.id,
            lenderOrganizationId: "org-lender",
            advanceAmount: Number(advance).toFixed(2),
            feeAmount: Number(fee).toFixed(2),
            repaymentTerms: "Buyer remittance on invoice due date",
            expiryAt: `${expiry}T18:30:00Z`,
            status: "SUBMITTED",
            createdAt: new Date().toISOString(),
          })
        }}
      >
        <section className="panel form-section">
          <div className="invoice-strip embedded">
            <div>
              <span>Invoice</span>
              <strong>{invoice.invoiceNumber}</strong>
              <small>Aster Components → Northstar Retail</small>
            </div>
            <div>
              <span>Invoice amount</span>
              <strong>{money(invoice.amount)}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>{date(invoice.dueDate)}</strong>
            </div>
          </div>
          <div className="section-heading">
            <span>1</span>
            <div>
              <h2>Offer terms</h2>
              <p>Enter non-negative amounts within the invoice constraints.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>
                Advance amount <b>*</b>
              </span>
              <div className="currency-field">
                <span>₹</span>
                <input
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              {Number(advance) > Number(invoice.amount) && (
                <small className="field-error">
                  Cannot exceed the invoice amount.
                </small>
              )}
            </label>
            <label>
              <span>
                Total fee <b>*</b>
              </span>
              <div className="currency-field">
                <span>₹</span>
                <input
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </label>
            <label>
              <span>
                Offer expiry <b>*</b>
              </span>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </label>
            <label>
              <span>Repayment terms</span>
              <select>
                <option>Buyer remittance on invoice due date</option>
                <option>Single settlement at 60 days</option>
              </select>
            </label>
          </div>
          <div className="calculation-card">
            <div>
              <span>Advance amount</span>
              <strong>{money(advance || 0)}</strong>
            </div>
            <div>
              <span>Less: total fee</span>
              <strong>− {money(fee || 0)}</strong>
            </div>
            <div>
              <span>Estimated net proceeds</span>
              <strong>
                {money(Math.max(0, Number(advance) - Number(fee)))}
              </strong>
            </div>
            <p>
              Illustrative calculation only. Final terms are validated by the
              backend.
            </p>
          </div>
        </section>
        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={invalid}>
            Review & submit offer
          </Button>
        </div>
      </form>
    </>
  )
}

function OfferList({
  offers,
  invoices,
}: {
  offers: FinancingOffer[]
  invoices: Invoice[]
}) {
  return (
    <div className="panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Offer</th>
              <th>Invoice</th>
              <th>Advance</th>
              <th>Fee</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <strong>{offer.id.toUpperCase()}</strong>
                  <span>Meridian Capital</span>
                </td>
                <td>
                  {
                    invoices.find((i) => i.id === offer.invoiceId)
                      ?.invoiceNumber
                  }
                </td>
                <td className="money">{money(offer.advanceAmount)}</td>
                <td>{money(offer.feeAmount)}</td>
                <td>{date(offer.expiryAt)}</td>
                <td>
                  <Badge status={offer.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NotificationPage() {
  const [items, setItems] = useState(notifications)
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates and actions across your organization."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              setItems(
                items.map((i) => ({ ...i, readAt: new Date().toISOString() })),
              )
            }
          >
            Mark all as read
          </Button>
        }
      />
      <div className="panel notification-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={!item.readAt ? "unread" : ""}
            onClick={() =>
              setItems(
                items.map((i) =>
                  i.id === item.id
                    ? { ...i, readAt: new Date().toISOString() }
                    : i,
                ),
              )
            }
          >
            <span className="notification-icon">
              <Icon
                name={
                  item.type === "ACTION"
                    ? "alert"
                    : item.type === "UPDATE"
                      ? "file"
                      : "pulse"
                }
              />
            </span>
            <span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <small>{date(item.createdAt)}</small>
            </span>
            {!item.readAt && <i />}
          </button>
        ))}
      </div>
    </>
  )
}
