import { Link } from "react-router-dom";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: "description",
    title: "Problem Statement",
    description: "Define the problem, context, and goals of your project with clarity.",
    size: "large",
  },
  {
    icon: "groups_3",
    title: "Jury Simulation",
    description: "Practice your defense with realistic jury questions.",
    size: "large",
  },
  {
    icon: "settings_suggest",
    title: "Requirements",
    description: "Functional and non-functional specs, organized by module.",
    size: "small",
  },
  {
    icon: "format_list_bulleted",
    title: "Backlog",
    description: "Prioritize your development tasks from start to finish.",
    size: "small",
  },
  {
    icon: "account_tree",
    title: "UML",
    description: "Prepare the architecture and technical design of your solution.",
    size: "small",
  },
  {
    icon: "auto_stories",
    title: "PFE Report",
    description: "Write your thesis step by step with a guided structure.",
    size: "small",
  },
];

const STEPS = [
  { num: "1", title: "Create your account", desc: "Describe your project in just a few minutes." },
  { num: "2", title: "Follow the workflow", desc: "14 modules covering the full methodology." },
  { num: "3", title: "Build your deliverables", desc: "Report, slides, pitch — all in one place." },
  { num: "4", title: "Ace your defense", desc: "Simulate the jury and build real confidence." },
];

function HeroMockup() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto">
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-[#111827] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0f172a]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs text-slate-400 ml-2">workspace / overview</span>
        </div>
        <div className="flex min-h-[280px]">
          <div className="w-[140px] border-r border-white/10 bg-[#0f172a] p-3 hidden sm:block">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">P</div>
              <span className="text-xs font-semibold text-white">PFE Guidance</span>
            </div>
            {["Overview", "Problem", "Actors", "Backlog", "Report"].map((item, i) => (
              <div
                key={item}
                className={`text-[11px] px-2 py-1.5 rounded-md mb-1 ${
                  i === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 mb-2">Active project</p>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3 leading-snug">
              AI-Powered Retail Analytics Platform
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                <p className="text-[10px] text-slate-500 mb-1">Progress</p>
                <p className="text-lg font-bold text-emerald-400">68%</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                <p className="text-[10px] text-slate-500 mb-1">Modules</p>
                <p className="text-lg font-bold text-white">9/14</p>
              </div>
            </div>
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
              <p className="text-xs text-indigo-200 font-medium">Next step</p>
              <p className="text-[11px] text-slate-400 mt-1">Draft the Problem Statement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl px-5 py-3 shadow-sm">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/30">
                P
              </div>
              <span className="font-bold text-[17px] tracking-tight text-slate-900">PFE Guidance</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[15px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Features
              </a>
              <a href="#workflow" className="text-[15px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Workflow
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex text-[15px] font-medium text-slate-700 hover:text-indigo-600 transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[15px] font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-32 overflow-hidden bg-[#0B1120]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="relative max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="w-full min-w-0"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-indigo-200 text-sm font-medium mb-8">
                <span className="material-symbols-outlined text-[18px]">school</span>
                PFE Platform · 2023-24
              </div>

              <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                Structure your PFE.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">
                  Defend with confidence.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-[36rem] mb-10">
                From needs analysis to jury simulation — one workspace to manage every
                deliverable of your Final Year Project.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-900 text-[16px] font-semibold hover:bg-slate-100 transition-colors"
                >
                  Create free workspace
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 text-white text-[16px] font-medium hover:bg-white/10 transition-colors"
                >
                  Explore features
                </a>
              </div>

              <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
                {[
                  { n: "14+", l: "Modules" },
                  { n: "4", l: "Phases" },
                  { n: "100%", l: "Guided" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-2xl font-bold text-white">{s.n}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="w-full min-w-0"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <HeroMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="w-full max-w-[48rem] mx-auto text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">The platform</p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              No more scattered documents
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              PFE Guidance centralizes your methodology: each module maps to a real project
              phase, with dedicated tools and progress tracking built in.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {["Analysis", "Design", "Development", "Report", "Defense"].map((phase, i) => (
              <div
                key={phase}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
              >
                <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold mb-3">
                  {i + 1}
                </span>
                <p className="text-[15px] font-semibold text-slate-900">{phase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="w-full max-w-[42rem] mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Every tool is built for a specific deliverable in your academic journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-slate-200 bg-white p-7 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 ${
                  f.size === "large" ? "sm:col-span-1 lg:row-span-1" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                  <span className="material-symbols-outlined text-indigo-600 text-[26px]">{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="text-center w-full max-w-[42rem] mx-auto mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">Workflow</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 steps. One goal.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="relative bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <span className="text-5xl font-extrabold text-indigo-100 leading-none">{step.num}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">{step.title}</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative z-10 w-full max-w-[42rem] mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-5">
                Ready to start your PFE?
              </h2>
              <p className="text-lg text-indigo-100 leading-relaxed mb-10">
                Set up your workspace in under a minute and start structuring
                your project today.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 text-[16px] font-bold hover:bg-indigo-50 transition-colors shadow-xl"
              >
                Create free account
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="text-sm text-slate-500">PFE Guidance · Academic Year 2023-24</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
