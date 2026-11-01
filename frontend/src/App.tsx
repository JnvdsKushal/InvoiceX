
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
import SupplierWorkspacePage from "./pages/supplier/SupplierWorkspacePage";

// Supplier invoice management pages
import CreateInvoicePage from "./pages/supplier/CreateInvoicePage";
import MyInvoicesPage from "./pages/supplier/MyInvoicesPage";
import InvoiceDetailsPage from "./pages/supplier/InvoiceDetailsPage";

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

              {/* Live supplier operational workspaces */}
              <Route path="verification" element={<SupplierWorkspacePage />} />
              <Route path="marketplace" element={<SupplierWorkspacePage />} />
              <Route path="financing" element={<SupplierWorkspacePage />} />
              <Route path="repayments" element={<SupplierWorkspacePage />} />
              <Route path="ledger" element={<SupplierWorkspacePage />} />
              {/* Profile and preferences are intentionally kept as next-phase work. */}
              <Route path="organization" element={<SupplierWorkspacePage />} />
              <Route path="settings" element={<SupplierWorkspacePage />} />
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
