
import { useState } from "react";
import { Lock, ShieldCheck, UserCog, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Admin Profile", icon: UserCog },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "platform", label: "Platform", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <p className="text-sm font-medium text-teal-700">Configuration</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Admin Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your administrator profile and platform configuration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {activeTab === "profile" && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <UserCog className="text-teal-700" size={22} />
                <div>
                  <h3 className="font-bold text-slate-900">Admin Profile</h3>
                  <p className="text-sm text-slate-500">
                    Your current administrator account information.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    FULL NAME
                  </label>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {user?.name || "Not available"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    EMAIL ADDRESS
                  </label>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {user?.email || "Not available"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    ACCOUNT ROLE
                  </label>
                  <p className="mt-2 text-sm font-medium capitalize text-slate-900">
                    {user?.role || "Admin"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    ACCOUNT STATUS
                  </label>
                  <p className="mt-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {user?.status || "Unknown"}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <ShieldCheck className="text-teal-700" size={22} />
                <div>
                  <h3 className="font-bold text-slate-900">Security</h3>
                  <p className="text-sm text-slate-500">
                    Security controls for your administrator account.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Lock className="mt-1 text-slate-600" size={19} />
                  <div>
                    <p className="font-semibold text-slate-800">
                      Authentication
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      InvoiceX uses token-based authentication for protected
                      platform APIs.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Security configuration
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Password changes, two-factor authentication and active
                    session management need dedicated backend endpoints
                    before they can be controlled here.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "platform" && (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <Settings className="text-teal-700" size={22} />
                <div>
                  <h3 className="font-bold text-slate-900">
                    Platform Configuration
                  </h3>
                  <p className="text-sm text-slate-500">
                    Platform-level configuration overview.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-800">InvoiceX</p>
                <p className="mt-1 text-sm text-slate-500">
                  Invoice financing and verification platform.
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Environment-specific configuration should remain on the
                  backend. Sensitive credentials must never be exposed in
                  frontend settings.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
