
import type { LucideIcon } from "lucide-react";
import { Database } from "lucide-react";

interface SupplierModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  integrationNote: string;
}

export default function SupplierModulePage({
  title,
  description,
  icon: Icon,
  features,
  integrationNote,
}: SupplierModulePageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          SUPPLIER WORKSPACE
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <Icon size={25} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={feature}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Module {index + 1}
            </p>
            <h3 className="mt-2 font-semibold text-slate-900">
              {feature}
            </h3>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Database size={25} />
        </div>

        <h3 className="mt-4 font-semibold text-slate-900">
          Module ready for implementation
        </h3>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {integrationNote}
        </p>
      </section>
    </div>
  );
}
