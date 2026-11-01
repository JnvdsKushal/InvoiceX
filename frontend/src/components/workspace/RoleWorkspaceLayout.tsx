import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, Bell, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Role = "buyer" | "lender";
interface Item { label: string; path: string; icon: LucideIcon; end?: boolean }
const buyerItems: Item[] = [
  { label: "Overview", path: "/buyer", icon: Activity, end: true },
  { label: "Invoice Inbox", path: "/buyer/inbox", icon: Activity },
  { label: "Verification History", path: "/buyer/history", icon: Activity },
  { label: "Suppliers", path: "/buyer/suppliers", icon: Activity },
  { label: "Blockchain Ledger", path: "/buyer/ledger", icon: Activity },
  { label: "Organization Profile", path: "/buyer/organization", icon: Activity },
  { label: "Settings", path: "/buyer/settings", icon: Activity },
];
const lenderItems: Item[] = [
  { label: "Overview", path: "/lender", icon: Activity, end: true },
  { label: "Invoice Marketplace", path: "/lender/marketplace", icon: Activity },
  { label: "My Offers", path: "/lender/offers", icon: Activity },
  { label: "Active Financing", path: "/lender/financing", icon: Activity },
  { label: "Repayments", path: "/lender/repayments", icon: Activity },
  { label: "Portfolio Analytics", path: "/lender/portfolio", icon: Activity },
  { label: "Blockchain Ledger", path: "/lender/ledger", icon: Activity },
  { label: "Organization Profile", path: "/lender/organization", icon: Activity },
  { label: "Settings", path: "/lender/settings", icon: Activity },
];

function Sidebar({ role, close }: { role: Role; close?: () => void }) {
  const items = role === "buyer" ? buyerItems : lenderItems;
  const title = role === "buyer" ? "BUYER WORKSPACE" : "LENDER WORKSPACE";
  return <aside className="flex h-full w-72 flex-col bg-slate-950 text-white">
    <div className="flex h-20 items-center border-b border-white/10 px-7">
      <span className="text-2xl font-bold tracking-tight">Invoice<span className="text-cyan-400">X</span></span>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-500">{title}</p>
      <nav className="space-y-1.5">
        {items.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end} onClick={close}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
        </NavLink>)}
      </nav>
    </div>
    <div className="border-t border-white/10 p-5">
      <div className="rounded-xl bg-white/5 p-3"><p className="text-sm font-semibold">InvoiceX</p><p className="text-xs text-slate-500">Secure invoice finance</p></div>
    </div>
  </aside>;
}

export default function RoleWorkspaceLayout({ role }: { role: Role }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const title = role === "buyer" ? "Buyer Workspace" : "Lender Workspace";
  async function handleLogout() {
    try { await logout(); } finally { navigate("/login", { replace: true }); }
  }
  return <div className="flex min-h-screen bg-slate-50">
    <div className="fixed inset-y-0 left-0 z-40 hidden md:block"><Sidebar role={role} /></div>
    {menuOpen && <div className="fixed inset-0 z-50 md:hidden">
      <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-slate-950/60" />
      <div className="absolute inset-y-0 left-0"><button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 rounded-lg bg-white/10 p-2 text-white"><X size={20}/></button><Sidebar role={role} close={() => setMenuOpen(false)} /></div>
    </div>}
    <div className="flex min-w-0 flex-1 flex-col md:ml-72">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Open navigation"><Menu size={21}/></button>
          <div><h1 className="text-lg font-bold text-slate-900">{title}</h1><p className="hidden text-xs text-slate-500 sm:block">{role === "buyer" ? "Review invoices and verify supplier submissions" : "Discover verified invoices and manage financing"}</p></div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button aria-label="Notifications" title="Notifications" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Bell size={19}/></button>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user?.name || title}</p><p className="text-xs text-slate-500">{user?.organization?.name}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 font-bold text-cyan-800">{user?.name?.charAt(0).toUpperCase() || role[0].toUpperCase()}</div>
          <button onClick={handleLogout} title="Sign out" aria-label="Sign out" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"><LogOut size={18}/></button>
        </div>
      </header>
      <main className="flex-1 p-5 sm:p-8"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">InvoiceX · {role === "buyer" ? "Buyer Portal" : "Lender Portal"} · Tamper-evident event tracking</footer>
    </div>
  </div>;
}
