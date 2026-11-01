
import { Wallet } from "lucide-react";
import AdminResourcePage from "../../components/admin/AdminResourcePage";

export default function FinancingPage() {
  return (
    <AdminResourcePage
      title="Financing & Transactions"
      description="Monitor financing offers, funding activity and repayments."
      icon={Wallet}
      resourceName="Financing"
      features={[
        "Financing Offers",
        "Funding Requests",
        "Funded Invoices",
        "Lender Activity",
        "Repayment Monitoring",
        "Settlement Records",
      ]}
      columns={[
        "Reference",
        "Invoice",
        "Supplier",
        "Lender",
        "Financed Amount",
        "Funding Date",
        "Status",
      ]}
      integrationNote="This workspace requires financing and transaction APIs. Financial amounts, funding statuses and repayments will only be displayed after retrieving actual backend records."
    />
  );
}
