
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organizationName: "",
    organizationType: "MSME" as "MSME" | "BUYER" | "LENDER",
    password: "",
    confirmPassword: "",
  });

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password.length < 10) {
      setError("Password must contain at least 10 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        organizationName: formData.organizationName.trim(),
        organizationType: formData.organizationType,
        password: formData.password,
      });

      setSuccess(
        "Registration successful! Your organization is awaiting approval. You'll be able to sign in once your account is activated."
      );

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        organizationName: "",
        organizationType: "MSME",
        password: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      let message = "Registration failed. Please check your details.";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        message =
          data?.detail ||
          data?.email?.[0] ||
          data?.organizationName?.[0] ||
          data?.non_field_errors?.[0] ||
          message;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full h-12 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 sm:px-12 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Invoice<span className="text-teal-600">X</span>
          </Link>

          <p className="text-sm text-slate-500">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Sign in
            </Link>
          </p>
        </div>
      </header>

      <main className="flex-1 px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Building2 size={27} className="text-teal-700" />
            </div>

            <p className="text-sm font-semibold tracking-widest text-teal-700 mt-6">
              JOIN INVOICEX
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
              Create your account
            </h1>

            <p className="text-slate-500 mt-3">
              Get your organization connected to the InvoiceX ecosystem.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm"
          >
            <h2 className="font-bold text-lg text-slate-900">
              Personal information
            </h2>

            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold mb-2"
                >
                  First name
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="firstName"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold mb-2"
                >
                  Last name
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  required
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
              >
                Business email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 my-8" />

            <h2 className="font-bold text-lg text-slate-900">
              Organization information
            </h2>

            <div className="mt-6">
              <label
                htmlFor="organizationName"
                className="block text-sm font-semibold mb-2"
              >
                Organization name
              </label>

              <input
                id="organizationName"
                name="organizationName"
                required
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter your registered business name"
                className={inputClass}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="organizationType"
                className="block text-sm font-semibold mb-2"
              >
                Organization type
              </label>

              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="MSME">MSME / Supplier</option>
                <option value="BUYER">Buyer organization</option>
                <option value="LENDER">Financial institution / Lender</option>
              </select>
            </div>

            <div className="border-t border-slate-100 my-8" />

            <h2 className="font-bold text-lg text-slate-900">
              Create a password
            </h2>

            <div className="mt-6">
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 10 characters"
                  className={`${inputClass} pl-10 pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold mb-2"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`${inputClass} pl-10 pr-12`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 rounded-xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-800"
              >
                {success}
                <p className="mt-3">
                  <Link
                    to="/login"
                    className="font-semibold underline hover:text-teal-900"
                  >
                    Go to sign in
                  </Link>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || Boolean(success)}
              className="mt-8 w-full h-13 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>

            <p className="text-xs leading-6 text-slate-400 text-center mt-5">
              Your organization and account may require platform approval
              before you can access InvoiceX services.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
