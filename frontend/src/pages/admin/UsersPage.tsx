
import { Users } from "lucide-react";
import AdminResourcePage from "../../components/admin/AdminResourcePage";

export default function UsersPage() {
  return (
    <AdminResourcePage
      title="User Management"
      description="Manage platform accounts, roles, access and account status."
      icon={Users}
      resourceName="Users"
      features={[
        "User Directory",
        "Role & Permission Management",
        "Account Activation & Suspension",
        "Organization Membership",
        "Login & Access Monitoring",
        "Pending Account Reviews",
      ]}
      columns={[
        "User",
        "Email",
        "Organization",
        "Role",
        "Account Status",
        "Joined",
        "Actions",
      ]}
      integrationNote="The user directory, account filters and account actions will connect to dedicated Django admin user APIs. Account activation and suspension will be enforced by the backend."
    />
  );
}
