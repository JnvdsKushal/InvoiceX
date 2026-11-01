import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import BuyerDashboardPage from "./buyer/BuyerDashboardPage";
import LenderDashboardPage from "./lender/LenderDashboardPage";

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />;

    case "supplier":
      return <Navigate to="/supplier" replace />;

    case "buyer":
      return <BuyerDashboardPage />;

    case "lender":
      return <LenderDashboardPage />;

    default:
      return <Navigate to="/unauthorized" replace />;
  }
}
