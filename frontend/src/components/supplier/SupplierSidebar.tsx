
import { NavLink } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarClock,
  FilePlus2,
  Files,
  LayoutDashboard,
  Landmark,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

interface SupplierSidebarProps {
  onNavigate?: () => void;
}

const navigation = [
  {
    label: "Overview",
    path: "/supplier",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Create Invoice",
    path: "/supplier/invoices/create",
    icon: FilePlus2,
  },
  {
    label: "My Invoices",
    path: "/supplier/invoices",
    icon: Files,
  },
  {
    label: "Verification Tracking",
    path: "/supplier/verification",
    icon: BadgeCheck,
  },
  {
    label: "Financing Marketplace",
    path: "/supplier/marketplace",
    icon: Landmark,
  },
  {
    label: "My Financing",
    path: "/supplier/financing",
    icon: Wallet,
  },
  {
    label: "Repayments",
    path: "/supplier/repayments",
    icon: CalendarClock,
  },
  {
    label: "Blockchain Ledger",
    path: "/supplier/ledger",
    icon: ShieldCheck,
  },
  {
    label: "Organization Profile",
    path: "/supplier/organization",
    icon: Building2,
  },
  {
    label: "Settings",
    path: "/supplier/settings",
    icon: Settings,
  },
];

export default function SupplierSidebar({
  onNavigate,
}: SupplierSidebarProps) {
  return (
    <aside className="flex h-full w-72 flex-col bg-slate-950 text-white">
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-7">
        <span className="text-2xl font-bold tracking-tight">
          Invoice<span className="text-teal-400">X</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-500">
          SUPPLIER WORKSPACE
        </p>

        <nav className="space-y-1.5">
          {navigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
            <Activity size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold">InvoiceX</p>
            <p className="text-xs text-slate-500">MSME Portal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
