
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/60"
          />

          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg bg-white/10 p-2 text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>

            <AdminSidebar
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-72">
        <AdminHeader
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-5 sm:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
          InvoiceX Platform Administration · Secure management workspace
        </footer>
      </div>
    </div>
  );
}
