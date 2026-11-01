
import { NavLink } from "react-router-dom";
import {
  Activity,
  Building2,
  FileCheck,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  Users,
} from "lucide-react";

const navigation = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Organizations", path: "/admin/organizations", icon: Building2 },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Invoice Monitoring", path: "/admin/invoices", icon: FileCheck },
  { label: "Financing", path: "/admin/financing", icon: Wallet },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: Activity },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-72 flex-col bg-slate-950 text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-7">
        <span className="text-2xl font-bold tracking-tight">
          Invoice<span className="text-teal-400">X</span>
        </span>
      </div>

      <div className="px-5 py-7">
        <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-500">
          PLATFORM MANAGEMENT
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
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
            <ShieldCheck size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold">Platform Admin</p>
            <p className="text-xs text-slate-500">Control Center</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
