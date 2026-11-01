
import { Bell, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SupplierHeaderProps {
  onMenuClick: () => void;
}

export default function SupplierHeader({
  onMenuClick,
}: SupplierHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Supplier Workspace
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage invoices and access financing
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {user?.name || "Supplier"}
          </p>
          <p className="text-xs text-slate-500">
            {user?.organization?.name || "MSME"}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-700">
          {user?.name?.charAt(0).toUpperCase() || "S"}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
