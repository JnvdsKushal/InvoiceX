
import { useAuth } from "../../context/AuthContext";

export default function BuyerDashboardPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm font-semibold text-blue-700">BUYER WORKSPACE</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">
          Welcome, {user?.name}
        </h1>
        <p className="text-slate-500 mt-2">{user?.organization.name}</p>

        <section className="grid sm:grid-cols-3 gap-5 mt-8">
          {["Invoices to Review", "Verified Invoices", "Rejected Invoices"].map(
            (item) => (
              <div key={item} className="bg-white border rounded-2xl p-6">
                <p className="font-semibold text-slate-800">{item}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Your {item.toLowerCase()} will appear here.
                </p>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}
