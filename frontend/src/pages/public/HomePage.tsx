import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Zap,
  FileCheck,
  Wallet,
  Building2,
} from "lucide-react";

function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      <nav className="flex items-center justify-between px-8 lg:px-20 py-6 border-b border-slate-100">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          Invoice<span className="text-teal-600">X</span>
        </Link>

        <div className="hidden md:flex gap-9 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-teal-600">Features</a>
          <a href="#how-it-works" className="hover:text-teal-600">How it works</a>
          <a href="#about" className="hover:text-teal-600">About</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold">
            Login
          </Link>

          <Link
            to="/register"
            className="bg-teal-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-teal-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="px-8 lg:px-20 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">

        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <ShieldCheck size={16} />
            Secure invoice financing
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
            Turn your
            <span className="text-teal-600"> invoices </span>
            into opportunities.
          </h1>

          <p className="mt-7 text-lg text-slate-500 leading-8 max-w-xl">
            InvoiceX connects businesses, buyers and lenders through a
            transparent invoice financing ecosystem powered by secure
            digital records.
          </p>

          <div className="flex flex-wrap gap-4 mt-9">
            <Link
              to="/register"
              className="bg-teal-600 text-white px-7 py-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-teal-700"
            >
              Get Started <ArrowRight size={18} />
            </Link>

            <a
              href="#how-it-works"
              className="border border-slate-200 px-7 py-4 rounded-xl font-semibold hover:bg-slate-50"
            >
              Explore platform
            </a>
          </div>
        </div>

        <div className="bg-slate-950 rounded-3xl p-8 lg:p-10 text-white shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Platform overview</span>
            <ShieldCheck className="text-teal-400" />
          </div>

          <h2 className="text-3xl font-bold mt-8">
            Smarter working capital.
          </h2>

          <p className="text-slate-400 mt-3">
            From invoice submission to financing.
          </p>

          <div className="mt-10 space-y-5">
            {[
              ["Invoice submission", FileCheck],
              ["Buyer verification", ShieldCheck],
              ["Financing opportunities", TrendingUp],
              ["Funding and settlement", Wallet],
            ].map(([label, Icon], index) => {
              const StepIcon = Icon as typeof FileCheck;

              return (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl"
                >
                  <StepIcon className="text-teal-400" />
                  <span className="font-medium">{label as string}</span>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <section id="features" className="px-8 lg:px-20 py-24 bg-slate-50">
        <div className="max-w-2xl">
          <p className="text-teal-600 font-bold uppercase text-sm tracking-widest">
            Why InvoiceX
          </p>

          <h2 className="text-4xl font-bold mt-4">
            Built for a more connected financial ecosystem.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-7 mt-14">
          {[
            {
              icon: Building2,
              title: "Business connectivity",
              description:
                "Connect suppliers, buyers and lenders in one platform.",
            },
            {
              icon: ShieldCheck,
              title: "Tamper-evident records",
              description:
                "Maintain verifiable invoice event histories using hash-linked records.",
            },
            {
              icon: Zap,
              title: "Faster financing",
              description:
                "Discover financing opportunities against verified invoices.",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={index} className="bg-white p-8 rounded-2xl border border-slate-200">
                <div className="bg-teal-50 text-teal-700 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Icon size={23} />
                </div>

                <h3 className="text-xl font-bold mt-6">{item.title}</h3>
                <p className="text-slate-500 mt-3 leading-7">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="px-8 lg:px-20 py-24 text-center">
        <p className="text-teal-600 font-bold uppercase text-sm tracking-widest">
          Simple process
        </p>

        <h2 className="text-4xl font-bold mt-4">
          How InvoiceX works
        </h2>

        <p className="text-slate-500 mt-5 max-w-2xl mx-auto">
          A structured journey connecting invoice submission, buyer
          verification and financing.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {[
            "Submit an invoice",
            "Get buyer verification",
            "Explore financing offers",
          ].map((step, index) => (
            <div key={index} className="p-8 rounded-2xl border border-slate-200">
              <div className="text-3xl font-bold text-teal-600">
                0{index + 1}
              </div>
              <h3 className="font-bold text-lg mt-5">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <footer id="about" className="bg-slate-950 text-white px-8 lg:px-20 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">
              Invoice<span className="text-teal-400">X</span>
            </h2>
            <p className="text-slate-400 mt-3">
              Connecting businesses through transparent invoice financing.
            </p>
          </div>

          <p className="text-slate-500 text-sm">
            © 2026 InvoiceX. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;