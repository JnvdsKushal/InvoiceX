
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Public pages
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import InvoiceFinancingDemoPage from "./pages/demo/InvoiceFinancingDemoPage";

// Admin layout and pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import OrganizationsPage from "./pages/admin/OrganizationsPage";
import UsersPage from "./pages/admin/UsersPage";
import InvoiceMonitoringPage from "./pages/admin/InvoiceMonitoringPage";
import FinancingPage from "./pages/admin/FinancingPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Supplier layout and pages
import SupplierLayout from "./components/supplier/SupplierLayout";
import RoleWorkspaceLayout from "./components/workspace/RoleWorkspaceLayout";
import SupplierOverviewPage from "./pages/supplier/SupplierOverviewPage";
import SupplierModulePage from "./components/supplier/SupplierModulePage";

// Supplier invoice management pages
import CreateInvoicePage from "./pages/supplier/CreateInvoicePage";
import MyInvoicesPage from "./pages/supplier/MyInvoicesPage";
import InvoiceDetailsPage from "./pages/supplier/InvoiceDetailsPage";

// Supplier module icons
import {
  BadgeCheck,
  Landmark,
  Wallet,
  CalendarClock,
  ShieldCheck,
  Building2,
  Settings,
} from "lucide-react";

// Other role dashboards
import BuyerDashboardPage from "./pages/buyer/BuyerDashboardPage";
import LenderDashboardPage from "./pages/lender/LenderDashboardPage";

// Role-based dashboard router
import DashboardRouter from "./pages/DashboardRouter";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/unauthorized"
            element={<UnauthorizedPage />}
          />

          <Route path="/demo/invoice-financing" element={<InvoiceFinancingDemoPage />} />

          {/* ================= ADMIN ROUTES ================= */}

          <Route
            element={<ProtectedRoute allowedRoles={["admin"]} />}
          >
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={<AdminOverviewPage />}
              />

              <Route
                path="organizations"
                element={<OrganizationsPage />}
              />

              <Route
                path="users"
                element={<UsersPage />}
              />

              <Route
                path="invoices"
                element={<InvoiceMonitoringPage />}
              />

              <Route
                path="financing"
                element={<FinancingPage />}
              />

              <Route
                path="audit-logs"
                element={<AuditLogsPage />}
              />

              <Route
                path="settings"
                element={<AdminSettingsPage />}
              />
            </Route>
          </Route>

          {/* ================= SUPPLIER ROUTES ================= */}

          <Route
            element={<ProtectedRoute allowedRoles={["supplier"]} />}
          >
            <Route path="/supplier" element={<SupplierLayout />}>
              {/* Supplier overview */}

              <Route
                index
                element={<SupplierOverviewPage />}
              />

              {/* Invoice management */}

              <Route
                path="invoices/create"
                element={<CreateInvoicePage />}
              />

              <Route
                path="invoices"
                element={<MyInvoicesPage />}
              />

              <Route
                path="invoices/:id"
                element={<InvoiceDetailsPage />}
              />

              {/* Verification tracking */}

              <Route
                path="verification"
                element={
                  <SupplierModulePage
                    title="Verification Tracking"
                    description="Follow buyer decisions and invoice verification."
                    icon={BadgeCheck}
                    features={[
                      "Pending Verification",
                      "Verified Invoices",
                      "Rejected Invoices",
                      "Clarification Requests",
                      "Buyer Comments",
                      "Verification Timeline",
                    ]}
                    integrationNote="Buyer decisions and verification events will be retrieved from Django and linked to the corresponding ledger events."
                  />
                }
              />

              {/* Financing marketplace */}

              <Route
                path="marketplace"
                element={
                  <SupplierModulePage
                    title="Financing Marketplace"
                    description="Discover financing offers for eligible invoices."
                    icon={Landmark}
                    features={[
                      "Eligible Invoices",
                      "Available Lenders",
                      "Offer Comparison",
                      "Advance Percentage",
                      "Fees & Repayment Terms",
                      "Accept or Reject Offers",
                    ]}
                    integrationNote="Financing offers will be supplied by the lender APIs. Offer acceptance will be validated and recorded by Django before a ledger event is created."
                  />
                }
              />

              {/* My financing */}

              <Route
                path="financing"
                element={
                  <SupplierModulePage
                    title="My Financing"
                    description="Track accepted offers and funding disbursements."
                    icon={Wallet}
                    features={[
                      "Accepted Offers",
                      "Funding Requests",
                      "Disbursement Status",
                      "Amount Received",
                      "Lender Information",
                      "Settlement History",
                    ]}
                    integrationNote="This page will display actual financing agreements and confirmed disbursement records from the backend."
                  />
                }
              />

              {/* Repayments */}

              <Route
                path="repayments"
                element={
                  <SupplierModulePage
                    title="Repayments"
                    description="Track upcoming and completed repayment obligations."
                    icon={CalendarClock}
                    features={[
                      "Upcoming Repayments",
                      "Amounts Due",
                      "Payment History",
                      "Overdue Tracking",
                      "Receipts",
                      "Settlement Status",
                    ]}
                    integrationNote="Repayment schedules and payment confirmations will come from the financial transaction system. Ledger records will provide a tamper-evident event history."
                  />
                }
              />

              {/* Blockchain ledger */}

              <Route
                path="ledger"
                element={
                  <SupplierModulePage
                    title="Blockchain Ledger"
                    description="Inspect the integrity and history of your invoice records."
                    icon={ShieldCheck}
                    features={[
                      "Invoice Creation Events",
                      "Submission Hashes",
                      "Buyer Verification Events",
                      "Financing Events",
                      "Repayment Events",
                      "Integrity Verification",
                    ]}
                    integrationNote="This page will connect to the Rust Axum ledger service through Django. It will display sequence numbers, timestamps, previous hashes, event hashes and verification results."
                  />
                }
              />

              {/* Organization profile */}

              <Route
                path="organization"
                element={
                  <SupplierModulePage
                    title="Organization Profile"
                    description="Manage your MSME organization information."
                    icon={Building2}
                    features={[
                      "Organization Details",
                      "Registration Information",
                      "Contact Information",
                      "Verification Status",
                      "Organization Documents",
                      "Authorized Users",
                    ]}
                    integrationNote="Organization information will be retrieved from the authenticated user's organization record. Sensitive changes will require backend authorization."
                  />
                }
              />

              {/* Supplier settings */}

              <Route
                path="settings"
                element={
                  <SupplierModulePage
                    title="Supplier Settings"
                    description="Manage personal preferences and account security."
                    icon={Settings}
                    features={[
                      "Personal Profile",
                      "Change Password",
                      "Notification Preferences",
                      "Security Information",
                      "Session Management",
                    ]}
                    integrationNote="Profile and security changes will be connected to dedicated authenticated account APIs."
                  />
                }
              />
            </Route>
          </Route>

          {/* ================= BUYER ROUTES ================= */}

          <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
            <Route path="/buyer" element={<RoleWorkspaceLayout role="buyer" />}>
              <Route index element={<BuyerDashboardPage />} />
              <Route path="inbox" element={<BuyerDashboardPage />} />
              <Route path="history" element={<BuyerDashboardPage />} />
              <Route path="suppliers" element={<BuyerDashboardPage />} />
              <Route path="ledger" element={<BuyerDashboardPage />} />
              <Route path="organization" element={<BuyerDashboardPage />} />
              <Route path="settings" element={<BuyerDashboardPage />} />
            </Route>
          </Route>

          {/* ================= LENDER ROUTES ================= */}

          <Route element={<ProtectedRoute allowedRoles={["lender"]} />}>
            <Route path="/lender" element={<RoleWorkspaceLayout role="lender" />}>
              <Route index element={<LenderDashboardPage />} />
              <Route path="marketplace" element={<LenderDashboardPage />} />
              <Route path="offers" element={<LenderDashboardPage />} />
              <Route path="financing" element={<LenderDashboardPage />} />
              <Route path="repayments" element={<LenderDashboardPage />} />
              <Route path="portfolio" element={<LenderDashboardPage />} />
              <Route path="ledger" element={<LenderDashboardPage />} />
              <Route path="organization" element={<LenderDashboardPage />} />
              <Route path="settings" element={<LenderDashboardPage />} />
            </Route>
          </Route>

          {/* ================= LEGACY DASHBOARD ROUTE ================= */}

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardRouter />}
            />
          </Route>

          {/* ================= FALLBACK ================= */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
