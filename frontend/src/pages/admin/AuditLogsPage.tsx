
import { Activity } from "lucide-react";
import AdminResourcePage from "../../components/admin/AdminResourcePage";

export default function AuditLogsPage() {
  return (
    <AdminResourcePage
      title="Audit & Activity Logs"
      description="Review important events and trace actions performed across InvoiceX."
      icon={Activity}
      resourceName="Audit Logs"
      features={[
        "Authentication Events",
        "Organization Approvals",
        "Invoice Status Changes",
        "Financing Events",
        "User Access Changes",
        "Ledger Verification Events",
      ]}
      columns={[
        "Event ID",
        "Actor",
        "Action",
        "Resource",
        "Timestamp",
        "IP Address",
        "Result",
      ]}
      integrationNote="Audit records will be retrieved from the backend audit service. Events should be recorded server-side, with appropriate access controls and tamper-evident history."
    />
  );
}
