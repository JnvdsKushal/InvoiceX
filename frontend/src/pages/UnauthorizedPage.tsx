import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="text-slate-500">
        You don't have permission to access this page.
      </p>
      <Link to="/" className="text-blue-600 hover:underline">
        Return home
      </Link>
    </main>
  );
}