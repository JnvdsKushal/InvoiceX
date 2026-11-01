
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search, Database, Filter } from "lucide-react";

interface AdminResourcePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  resourceName: string;
  features: string[];
  columns: string[];
  integrationNote: string;
}

export default function AdminResourcePage({
  title,
  description,
  icon: Icon,
  resourceName,
  features,
  columns,
  integrationNote,
}: AdminResourcePageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <p className="text-sm font-medium text-teal-700">
          Platform Management
        </p>
        <div className="mt-1 flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <Icon size={25} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={feature}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">Management area {index + 1}</p>
            <h3 className="mt-2 font-semibold text-slate-900">{feature}</h3>
            <p className="mt-2 text-xs text-slate-400">
              Available in the {resourceName} workspace.
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{resourceName} directory</h3>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter platform records.
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${resourceName.toLowerCase()}...`}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 sm:w-64"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-teal-500 sm:w-40"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-5 py-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Database size={25} />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">
            {search || filter !== "ALL"
              ? "No matching records"
              : `Connect ${resourceName} data`}
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            {integrationNote}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            No sample records are being displayed.
          </p>
        </div>
      </section>
    </div>
  );
}
