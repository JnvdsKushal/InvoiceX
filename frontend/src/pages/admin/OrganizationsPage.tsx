
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, RefreshCw, Search } from "lucide-react";
import axios from "axios";
import api from "../../services/api";

interface Organization {
  id: string;
  name: string;
  type: string;
  registration_identifier: string | null;
  status: string;
  created_at: string;
  user_count: number;
}

interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<PaginatedResponse<Organization>>(
        "/admin/organizations/",
        { params: { status } }
      );
      setOrganizations(response.data.results ?? []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to load organizations. Check the admin API."
        );
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const filteredOrganizations = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return organizations;

    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(term) ||
        org.type.toLowerCase().includes(term) ||
        (org.registration_identifier || "").toLowerCase().includes(term)
    );
  }, [organizations, search]);

  async function handleApprove(org: Organization) {
    if (
      !window.confirm(
        `Approve ${org.name}? Its pending users will also be activated.`
      )
    ) {
      return;
    }

    setApprovingId(org.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/admin/organizations/${org.id}/approve/`
      );

      setSuccess(
        `${org.name} approved. ${response.data.activated_users ?? 0} user(s) activated.`
      );
      await loadOrganizations();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Approval failed.");
      } else {
        setError("Something went wrong while approving the organization.");
      }
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Administration</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Organizations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage companies registered on InvoiceX.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrganizations}
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

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Building2 className="text-blue-600" size={22} />
          <p className="mt-3 text-sm text-slate-500">Organizations shown</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : organizations.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock3 className="text-amber-600" size={22} />
          <p className="mt-3 text-sm text-slate-500">Pending organizations</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {status === "PENDING" && !loading ? organizations.length : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <CheckCircle2 className="text-emerald-600" size={22} />
          <p className="mt-3 text-sm text-slate-500">Current filter</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{status}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Organization directory</h3>
            <p className="mt-1 text-sm text-slate-500">
              Search and review registered organizations.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 sm:w-64"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading organizations...
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto text-slate-300" size={35} />
            <h4 className="mt-3 font-semibold text-slate-800">
              No organizations found
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Organization</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Users</th>
                  <th className="px-5 py-4">Registered</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {org.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {org.registration_identifier || "No registration ID"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {org.type}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {org.user_count}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {org.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {org.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(org)}
                          disabled={approvingId !== null}
                          className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          {approvingId === org.id ? "Approving..." : "Approve"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
