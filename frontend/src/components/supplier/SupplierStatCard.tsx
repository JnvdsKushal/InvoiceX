
import type { LucideIcon } from "lucide-react";

interface SupplierStatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: string;
}

export default function SupplierStatCard({
  label,
  value,
  description,
  icon: Icon,
  color = "bg-teal-50 text-teal-700",
}: SupplierStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}
