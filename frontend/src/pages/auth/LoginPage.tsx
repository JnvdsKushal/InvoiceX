
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      let message = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        message =
          data?.detail ||
          data?.non_field_errors?.[0] ||
          data?.email?.[0] ||
          message;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left branding panel */}
      <section className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-14 xl:p-20">
        <Link to="/" className="text-3xl font-bold">
          Invoice<span className="text-teal-400">X</span>
        </Link>

        <div className="max-w-lg">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center">
            <ShieldCheck size={29} className="text-teal-400" />
          </div>

          <h1 className="text-5xl xl:text-6xl font-bold leading-tight mt-8">
            Your business.
            <br />
            Your finances.
            <br />
            <span className="text-teal-400">Connected.</span>
          </h1>

          <p className="text-slate-400 text-lg leading-8 mt-7">
            Access your invoice financing workspace and manage your
            business interactions through one secure platform.
          </p>
        </div>

        <div className="border-t border-white/10 pt-6 text-sm text-slate-500">
          Secure access to the InvoiceX ecosystem.
        </div>
      </section>

      {/* Login form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden text-2xl font-bold">
            Invoice<span className="text-teal-600">X</span>
          </Link>

          <div className="mt-12 lg:mt-0">
            <p className="text-sm font-semibold text-teal-700">
              WELCOME BACK
            </p>

            <h2 className="text-4xl font-bold text-slate-900 mt-3">
              Sign in to InvoiceX
            </h2>

            <p className="text-slate-500 mt-3">
              Enter your account details to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="you@company.com"
                    className="w-full h-13 pl-12 pr-4 rounded-xl border border-slate-200 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    className="w-full h-13 pl-12 pr-12 rounded-xl border border-slate-200 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-8">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-teal-700 hover:text-teal-800"
              >
                Create an account
              </Link>
            </p>

            <p className="text-center text-xs text-slate-400 mt-12">
              By continuing, you agree to the InvoiceX terms and privacy policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
