
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  FileText,
  Plus,
  Wallet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SupplierStatCard from "../../components/supplier/SupplierStatCard";

export default function SupplierOverviewPage() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Create a new invoice",
      description: "Add an invoice and submit it for buyer verification.",
      path: "/supplier/invoices/create",
      icon: Plus,
    },
    {
      title: "Explore financing",
      description: "Compare financing opportunities for eligible invoices.",
      path: "/supplier/marketplace",
      icon: Wallet,
    },
    {
      title: "Track verification",
      description: "Review the status of submitted invoices.",
      path: "/supplier/verification",
      icon: BadgeCheck,
    },
    {
      title: "View blockchain records",
      description: "Inspect the tamper-evident history of your records.",
      path: "/supplier/ledger",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">
            MSME SUPPLIER DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] || "Supplier"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {user?.organization?.name || "Your organization"} · Here's your
            business workspace.
          </p>
        </div>

        <Link
          to="/supplier/invoices/create"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus size={18} />
          Create Invoice
        </Link>
      </section>

      {/* KPI Cards */}
      <section>
        <div className="mb-4">
          <h3 className="font-bold text-slate-900">Business overview</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your invoice and financing performance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SupplierStatCard
            label="Total invoices"
            value="—"
            description="Awaiting live data connection"
            icon={FileText}
            color="bg-blue-50 text-blue-700"
          />

          <SupplierStatCard
            label="Pending verification"
            value="—"
            description="Invoices awaiting buyer action"
            icon={BadgeCheck}
            color="bg-amber-50 text-amber-700"
          />

          <SupplierStatCard
            label="Financing received"
            value="—"
            description="Confirmed disbursements"
            icon={Wallet}
            color="bg-emerald-50 text-emerald-700"
          />

          <SupplierStatCard
            label="Outstanding repayments"
            value="—"
            description="Remaining repayment obligations"
            icon={CalendarClock}
            color="bg-violet-50 text-violet-700"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-4">
          <h3 className="font-bold text-slate-900">Quick actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Get things done without navigating through multiple menus.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.path}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
              >
                <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                  <Icon size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {action.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ArrowRight
                  size={18}
                  className="mt-1 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-600"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Activity size={21} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">Recent activity</h3>
            <p className="text-sm text-slate-500">
              Your latest invoice and financing events.
            </p>
          </div>
        </div>

        <div className="py-10 text-center">
          <Activity className="mx-auto text-slate-300" size={32} />

          <p className="mt-3 font-semibold text-slate-700">
            Activity feed is being connected
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Your invoice submissions, buyer decisions and financing events
            will appear here.
          </p>
        </div>
      </section>

      {/* Blockchain Information */}
      <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-3 text-teal-700">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Tamper-evident invoice records
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                InvoiceX records important invoice and financing events in
                a hash-linked ledger. You will be able to inspect event
                history and verify record integrity.
              </p>
            </div>
          </div>

          <Link
            to="/supplier/ledger"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Explore ledger <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
