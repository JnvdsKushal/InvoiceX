import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {user?.name}
            </h1>
            <p className="mt-2 text-slate-500">
              {user?.organization.name} · {user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Your InvoiceX dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">
            Authentication is connected. We'll add your role-specific
            dashboard features next.
          </p>
        </section>
      </div>
    </main>
  );
}