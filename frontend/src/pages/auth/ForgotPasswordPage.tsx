import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Password reset API will be implemented in Django.
    console.log("Password reset form ready for API integration:", email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm">
        <Link to="/" className="text-2xl font-bold text-slate-900">
          Invoice<span className="text-teal-600">X</span>
        </Link>

        <div className="mt-12 w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Mail size={27} className="text-teal-700" />
        </div>

        <p className="text-sm font-semibold text-teal-700 mt-7">
          ACCOUNT RECOVERY
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mt-3">
          Forgot your password?
        </h1>

        <p className="text-slate-500 leading-7 mt-4">
          Enter the email address associated with your InvoiceX account.
          We'll use it to initiate the password recovery process.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="email" className="block text-sm font-semibold mb-2">
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full h-13 pl-10 pr-4 border border-slate-200 rounded-xl outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full h-13 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-center gap-2 transition"
          >
            Send recovery request <Send size={17} />
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 mt-8"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;