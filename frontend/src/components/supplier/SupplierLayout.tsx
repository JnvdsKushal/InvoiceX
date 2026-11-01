
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";

import SupplierSidebar from "./SupplierSidebar";
import SupplierHeader from "./SupplierHeader";

export default function SupplierLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <SupplierSidebar />
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

            <SupplierSidebar
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-72">
        <SupplierHeader
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-5 sm:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
          InvoiceX · MSME Supplier Portal
        </footer>
      </div>
    </div>
  );
}
