
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import axios from "axios";

import api from "../../services/api";

interface Overview {
  total_organizations: number;
  pending_organizations: number;
  active_organizations: number;
  suspended_organizations: number;
  total_users: number;
  active_users: number;
  pending_users: number;
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Overview>("/admin/overview/");
      setOverview(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail || "Unable to load platform statistics."
        );
      } else {
        setError("Something went wrong while loading the overview.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const cards = [
    {
      label: "Total Organizations",
      value: overview?.total_organizations,
      icon: Building2,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending Approvals",
      value: overview?.pending_organizations,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active Organizations",
      value: overview?.active_organizations,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Users",
      value: overview?.total_users,
      icon: Users,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Active Users",
      value: overview?.active_users,
      icon: Activity,
      color: "bg-teal-50 text-teal-700",
    },
    {
      label: "Pending Users",
      value: overview?.pending_users,
      icon: Clock3,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Platform Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your InvoiceX platform at a glance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h3 className="font-bold text-slate-900">Platform statistics</h3>
          <p className="text-sm text-slate-500">
            Live counts retrieved from your backend.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {loading ? "—" : (card.value ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Building2 size={21} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Organization health
              </h3>
              <p className="text-sm text-slate-500">
                Organization account distribution
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                label: "Active",
                value: overview?.active_organizations ?? 0,
                color: "bg-emerald-500",
              },
              {
                label: "Pending",
                value: overview?.pending_organizations ?? 0,
                color: "bg-amber-500",
              },
              {
                label: "Suspended",
                value: overview?.suspended_organizations ?? 0,
                color: "bg-red-500",
              },
            ].map((item) => {
              const total = overview?.total_organizations ?? 0;
              const percentage = total
                ? (item.value / total) * 100
                : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <strong className="text-slate-900">{loading ? "—" : item.value}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <Wallet size={21} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Platform operations
              </h3>
              <p className="text-sm text-slate-500">
                Current administrative priorities
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Organization approvals
                </p>
                <p className="text-xs text-slate-500">
                  Registrations awaiting review
                </p>
              </div>
              <span className="text-xl font-bold text-amber-700">
                {loading ? "—" : overview?.pending_organizations ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  User activation
                </p>
                <p className="text-xs text-slate-500">
                  Users awaiting activation
                </p>
              </div>
              <span className="text-xl font-bold text-blue-700">
                {loading ? "—" : overview?.pending_users ?? 0}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
