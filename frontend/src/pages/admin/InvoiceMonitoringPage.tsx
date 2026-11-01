
import { FileCheck } from "lucide-react";
import AdminResourcePage from "../../components/admin/AdminResourcePage";

export default function InvoiceMonitoringPage() {
  return (
    <AdminResourcePage
      title="Invoice Monitoring"
      description="Monitor invoice activity and verification across the platform."
      icon={FileCheck}
      resourceName="Invoices"
      features={[
        "All Platform Invoices",
        "Pending Verification",
        "Verified Invoices",
        "Rejected & Disputed Invoices",
        "Invoice Status Tracking",
        "Supplier & Buyer Details",
      ]}
      columns={[
        "Invoice Number",
        "Supplier",
        "Buyer",
        "Amount",
        "Issue Date",
        "Due Date",
        "Status",
      ]}
      integrationNote="This workspace will connect to a platform-wide invoice endpoint with admin-only access. It will show invoice records and their actual workflow statuses."
    />
  );
}
