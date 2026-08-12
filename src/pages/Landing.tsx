import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleCheck,
  FileText,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Mic2,
  Network,
  PenLine,
  Presentation,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { fetchApi } from "../lib/api";

type Feature = { icon: LucideIcon; title: string; description: string };
type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  benefits: string[];
  cta: string;
  popular?: boolean;
};

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About us" },
  { href: "#contact", label: "Contact" },
];

const HERO_METRICS = [
  { value: "14+", label: "Guided modules" },
  { value: "5", label: "Project phases" },
  { value: "100%", label: "Built for students" },
  { value: "AI-Powered", label: "Guidance & tools" },
];

const WORKSPACE_NAV = [
  "Overview",
  "Problem Statement",
  "Actors",
  "Backlog",
  "Report",
  "UML Diagrams",
  "Jury Simulation",
];

const RECENT_ACTIVITY = [
  "Actors section updated",
  "Backlog tasks prioritized",
  "Jury simulation completed",
];

const TRUST_PLACEHOLDERS = [
  "School logo",
  "Engineering faculty",
  "Computer science club",
  "Student incubator",
];

const PROBLEMS = [
  "No single source of truth",
  "Deliverables created independently",
  "Difficult to track progress",
  "Little preparation for the final defense",
];

const SOLUTIONS = [
  "Structured PFE methodology",
  "14+ connected modules",
  "Guided editors",
  "AI assistance",
  "Progress tracking",
  "Jury simulation",
];

const JOURNEY_STEPS = [
  { number: "01", title: "Create your workspace", description: "Describe your project and technical context." },
  { number: "02", title: "Follow the methodology", description: "Progress through structured PFE modules." },
  { number: "03", title: "Build your deliverables", description: "Create your backlog, UML, report, presentation and other deliverables." },
  { number: "04", title: "Ace your defense", description: "Prepare your pitch and practice using AI jury simulation." },
];

const FEATURES: Feature[] = [
  { icon: Target, title: "Problem Statement", description: "Structure project context, objectives and scope." },
  { icon: Users, title: "Actors", description: "Identify and organize project stakeholders." },
  { icon: ShieldCheck, title: "Requirements", description: "Manage functional and non-functional requirements." },
  { icon: PenLine, title: "User Stories", description: "Generate and structure user stories." },
  { icon: ListChecks, title: "Product Backlog", description: "Prioritize project tasks and features." },
  { icon: BarChart3, title: "Existing Solutions", description: "Analyze competing or existing solutions." },
  { icon: Network, title: "UML Diagrams", description: "Prepare project architecture and technical diagrams." },
  { icon: FileText, title: "Report Builder", description: "Build the PFE report chapter by chapter." },
  { icon: Presentation, title: "Presentation Builder", description: "Prepare professional defense slides." },
  { icon: Mic2, title: "Pitch Preparation", description: "Prepare and improve the oral presentation." },
  { icon: MessageSquareText, title: "Jury Simulation", description: "Practice with realistic AI-generated jury questions." },
  { icon: LayoutDashboard, title: "Progress Tracking", description: "Track completed modules and next steps." },
];

const AI_POINTS = [
  "Generate structured content",
  "Improve existing work",
  "Maintain consistency between deliverables",
  "Identify missing information",
  "Suggest next steps",
  "Generate jury questions",
  "Prepare your defense",
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "0 DT",
    cadence: "Forever",
    description: "Start your PFE workspace with the essentials.",
    benefits: ["Core PFE modules", "Basic AI assistance", "Project workspace", "Progress tracking", "Limited AI generations"],
    cta: "Get started free",
  },
  {
    name: "Premium",
    price: "19 DT",
    cadence: "/ month",
    description: "More guidance for report writing and defense preparation.",
    benefits: ["Everything in Free", "More AI generations", "Advanced AI assistance", "Advanced report generation", "Presentation assistance", "Jury simulation", "Premium templates", "Priority access to new AI features"],
    cta: "Upgrade to Premium",
    popular: true,
  },
];

const TESTIMONIALS = [
  { name: "Demo student", role: "Engineering student placeholder", quote: "This placeholder will later show a real student story about organizing deliverables from the first project idea." },
  { name: "Demo supervisor", role: "Supervisor placeholder", quote: "This placeholder can be replaced by verified feedback about clarity, methodology and defense preparation." },
  { name: "Demo project team", role: "Team placeholder", quote: "This placeholder is reserved for a future verified story about collaboration and progress tracking." },
];

const FAQS = [
  { question: "What is PFE Guidance?", answer: "PFE Guidance is an intelligent workspace that helps students structure, build and defend their Final Year Project deliverables." },
  { question: "Is PFE Guidance free?", answer: "Yes. The Free plan gives students access to core modules, basic AI help, a project workspace and progress tracking." },
  { question: "What is included in Premium?", answer: "Premium adds more AI generations, advanced report support, presentation assistance, jury simulation, templates and priority access to new AI features." },
  { question: "Can I use it for any engineering PFE?", answer: "Yes. The workflow is designed for engineering and computer science PFE projects, while remaining flexible for different technical domains." },
  { question: "Does the AI write my entire report?", answer: "No. AI assists with structure, consistency, suggestions and drafting support, while the student stays responsible for validating and editing the work." },
  { question: "How does Jury Simulation work?", answer: "It uses your project context to generate realistic defense questions so you can practice answers before the final presentation." },
  { question: "Can I export my work?", answer: "Export behavior depends on the active workspace modules and will evolve as report, presentation and template features mature." },
  { question: "Is my project data private?", answer: "Project data is treated as private workspace content. Teams should still avoid adding secrets or confidential third-party data unless their own policy allows it." },
];

const FOOTER_LINKS = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ],
  Resources: [
    { href: "#about", label: "Guides" },
    { href: "#features", label: "Templates" },
    { href: "#faq", label: "FAQ" },
  ],
  Company: [
    { href: "#about", label: "About us" },
    { href: "#contact", label: "Contact us" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
  ],
};

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(FAQS[0].question);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState("");
  const [contactError, setContactError] = useState("");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleContactChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setContactForm((current) => ({ ...current, [name]: value }));
    setContactError("");
    setContactStatus("");
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactError("");
    setContactStatus("");
    setIsContactSubmitting(true);

    try {
      const response = await fetchApi("/contact", {
        method: "POST",
        body: JSON.stringify(contactForm),
      });

      setContactStatus(
        response.message || "Your message has been sent successfully."
      );
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setContactError(
        error instanceof Error
          ? error.message
          : "Could not send your message. Please try again later."
      );
    } finally {
      setIsContactSubmitting(false);
    }
  };

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-[#f7f5ff] font-sans text-slate-950 antialiased">
      <style>{`
        html { scroll-behavior: smooth; }
        .landing-page p,
        .landing-page span,
        .landing-page h1,
        .landing-page h2,
        .landing-page h3,
        .landing-page label,
        .landing-page a,
        .landing-page button {
          overflow-wrap: normal;
          word-break: normal;
        }
        .landing-page .grid > *,
        .landing-page .flex > * {
          min-width: 0;
        }
      `}</style>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-indigo-200/70 bg-white/90 px-4 py-3 shadow-[0_18px_55px_rgba(49,46,129,0.14)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3 text-slate-950" onClick={closeMenu}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25">P</span>
              <span className="truncate text-base font-extrabold">PFE Guidance</span>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-indigo-700">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Sign in</Link>
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 lg:hidden" aria-label="Toggle navigation menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((value) => !value)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="mt-4 border-t border-indigo-100 pt-4 lg:hidden">
              <div className="grid gap-2">
                {NAV_ITEMS.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700" onClick={closeMenu}>
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:hidden">
                <Link to="/login" className="rounded-xl border border-indigo-100 px-4 py-3 text-center text-sm font-semibold text-slate-700" onClick={closeMenu}>Sign in</Link>
                <Link to="/signup" className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white" onClick={closeMenu}>Get started free</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#111c3d_38%,#312e81_72%,#4f46e5_100%)] pb-20 pt-36 text-white sm:pb-24 sm:pt-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(199,210,254,0.20),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.18),transparent_24%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="w-full max-w-[48rem] min-w-0">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-100 shadow-sm backdrop-blur">
                <GraduationCap className="h-4 w-4" />
                AI SaaS workspace for Final Year Projects
              </div>

              <h1 className="max-w-[48rem] text-5xl font-extrabold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
                Structure your PFE.
                <span className="block text-indigo-200">Defend with confidence.</span>
              </h1>

              <p className="mt-6 max-w-[42rem] text-lg leading-8 text-indigo-50/90 sm:text-xl">
                One intelligent workspace to manage every deliverable of your Final Year Project {"\u2014"} from needs analysis to jury simulation.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-indigo-900 shadow-xl shadow-black/20 transition hover:bg-indigo-50">
                  Create free workspace
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/15">See features</a>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {HERO_METRICS.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="text-2xl font-extrabold text-white">{metric.value}</div>
                    <div className="mt-1 text-sm font-medium leading-5 text-indigo-100">{metric.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.12 }} className="w-full min-w-0">
              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-[0_34px_100px_rgba(2,6,23,0.35)] backdrop-blur-xl">
                <div className="overflow-hidden rounded-[1.35rem] border border-indigo-100 bg-white text-slate-950">
                  <div className="flex items-center justify-between border-b border-indigo-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-300" /><span className="h-3 w-3 rounded-full bg-amber-300" /><span className="h-3 w-3 rounded-full bg-emerald-300" /></div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">ACTIVE PROJECT</div>
                  </div>

                  <div className="grid min-h-[430px] grid-cols-[112px_minmax(0,1fr)] sm:grid-cols-[168px_minmax(0,1fr)]">
                    <aside className="border-r border-indigo-100 bg-[#fbfaff] p-4">
                      <div className="mb-6 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-extrabold text-white">P</span><span className="hidden text-sm font-extrabold text-slate-900 sm:block">Guidance</span></div>
                      <div className="space-y-1.5">
                        {WORKSPACE_NAV.map((item, index) => (
                          <div key={item} className={index === 0 ? "truncate rounded-xl bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700" : "truncate rounded-xl px-3 py-2 text-xs font-bold text-slate-500"}>{item}</div>
                        ))}
                      </div>
                    </aside>

                    <div className="min-w-0 bg-white p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div><div className="text-xs font-extrabold uppercase text-indigo-600">Active project</div><h2 className="mt-2 text-xl font-extrabold leading-7 text-slate-950">AI-Powered Retail Analytics</h2></div>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><CircleCheck className="h-4 w-4" />On track</div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                          <div className="text-xs font-bold text-slate-500">Progress</div>
                          <div className="mt-2 flex items-end justify-between gap-3"><span className="text-3xl font-extrabold text-slate-950">68%</span><LayoutDashboard className="h-6 w-6 text-indigo-500" /></div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-[68%] rounded-full bg-indigo-600" /></div>
                        </div>
                        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                          <div className="text-xs font-bold text-slate-500">Modules</div>
                          <div className="mt-2 flex items-end justify-between gap-3"><span className="text-3xl font-extrabold text-slate-950">9 / 14</span><Layers3 className="h-6 w-6 text-violet-500" /></div>
                          <div className="mt-4 grid grid-cols-7 gap-1">{Array.from({ length: 14 }, (_, index) => <span key={index} className={index < 9 ? "h-2 rounded-full bg-violet-500" : "h-2 rounded-full bg-slate-100"} />)}</div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff,#faf5ff)] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-indigo-700"><Sparkles className="h-4 w-4" />Next step</div><p className="mt-2 text-sm font-semibold text-slate-700">Draft the Problem Statement</p></div>
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 text-xs font-extrabold uppercase text-slate-500">Recent activity</div><div className="space-y-2">{RECENT_ACTIVITY.map((activity) => <div key={activity} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 text-emerald-500" /><span>{activity}</span></div>)}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="about" className="border-b border-indigo-100 bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full min-w-0"><p className="text-sm font-extrabold uppercase text-indigo-600">Built for engineering & computer science students</p><p className="mt-2 max-w-[42rem] text-sm leading-6 text-slate-600">Clean placeholders are ready for verified academic logos or school references when the product has permission to display them.</p></div>
              <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-[560px]">{TRUST_PLACEHOLDERS.map((label) => <div key={label} className="flex h-16 items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 text-center text-xs font-bold uppercase text-indigo-300">{label}</div>)}</div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f5ff] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="w-full min-w-0 rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-xl shadow-rose-950/5 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold uppercase text-rose-600"><X className="h-4 w-4" />The challenge</div>
              <h2 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">PFE projects fail from poor structure, not poor ideas.</h2>
              <p className="mt-4 leading-7 text-slate-600">Students often manage their PFE using disconnected documents, emails, notes, slides and tools. Good work becomes hard to follow when the process has no shared system.</p>
              <div className="mt-7 grid gap-3">{PROBLEMS.map((problem) => <div key={problem} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/55 p-4 text-sm font-semibold text-rose-900"><X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />{problem}</div>)}</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: 0.08 }} className="w-full min-w-0 rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase text-emerald-700"><Check className="h-4 w-4" />The solution</div>
              <h2 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">One workspace. Full methodology. Built for PFE.</h2>
              <p className="mt-4 leading-7 text-slate-600">PFE Guidance connects the methodology, editors, AI support and progress tracking into one student-ready product workflow.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">{SOLUTIONS.map((solution) => <div key={solution} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/55 p-4 text-sm font-semibold text-emerald-950"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{solution}</div>)}</div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[42rem] text-center"><p className="text-sm font-extrabold uppercase text-indigo-600">How it works</p><h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">Your journey, step by step.</h2></div>
            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {JOURNEY_STEPS.map((step, index) => <motion.div key={step.number} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="relative rounded-[1.5rem] border border-indigo-100 bg-[linear-gradient(180deg,#ffffff,#faf9ff)] p-6 shadow-lg shadow-indigo-950/5"><div className="mb-8 flex items-center justify-between"><span className="text-4xl font-extrabold text-indigo-100">{step.number}</span>{index < JOURNEY_STEPS.length - 1 && <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-400 shadow-sm lg:flex"><ArrowRight className="h-4 w-4" /></span>}</div><h3 className="text-lg font-extrabold text-slate-950">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p></motion.div>)}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#f1edff] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="w-full max-w-[42rem] min-w-0"><p className="text-sm font-extrabold uppercase text-indigo-600">Features</p><h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">Everything you need. In one place.</h2></div><p className="w-full max-w-[36rem] min-w-0 text-base leading-7 text-slate-600">Guided modules keep each deliverable connected to the same project context, so the work reads like one coherent PFE.</p></div>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.35, delay: (index % 3) * 0.04 }} className="group rounded-[1.5rem] border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-950/5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"><Icon className="h-6 w-6" /></div><h3 className="text-lg font-extrabold text-slate-950">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p></motion.div>;
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#1e1b4b_54%,#4f46e5_100%)] py-20 text-white sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(199,210,254,0.24),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:px-8">
            <div className="w-full min-w-0"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100"><BrainCircuit className="h-4 w-4" />AI showcase</div><h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">AI that understands your project.</h2><p className="mt-5 w-full max-w-[36rem] text-lg leading-8 text-indigo-50/90">Not just another text generator. PFE Guidance uses your project context to help you build consistent deliverables from the first idea to your final defense.</p><div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">{AI_POINTS.map((point) => <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold text-indigo-50 backdrop-blur"><Sparkles className="h-4 w-4 shrink-0 text-cyan-200" />{point}</div>)}</div></div>
            <div className="w-full min-w-0 rounded-[1.75rem] border border-white/15 bg-white/10 p-4 shadow-[0_28px_90px_rgba(2,6,23,0.32)] backdrop-blur-xl"><div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-5"><div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white"><Bot className="h-6 w-6" /></span><div className="min-w-0"><p className="text-sm font-extrabold">PFE AI Assistant</p><p className="text-xs text-indigo-200">Context-aware guidance</p></div></div><span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">Online</span></div><div className="mt-5 space-y-4"><div className="w-full max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-indigo-50">I noticed your backlog mentions inventory prediction, but your problem statement does not yet define the business impact. Add a short measurable objective?</div><div className="ml-auto w-full max-w-[82%] rounded-2xl rounded-tr-sm bg-indigo-500 p-4 text-sm font-semibold leading-6 text-white">Yes. Suggest a concise objective for my context.</div><div className="w-full max-w-[92%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-indigo-50">Suggested objective: reduce manual stock analysis by centralizing sales, inventory and forecasting indicators in a decision dashboard.</div></div><div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3"><span className="min-w-0 flex-1 text-sm text-indigo-200">Ask about report structure, slides, or jury questions...</span><button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700" aria-label="Send demo AI prompt"><ArrowRight className="h-4 w-4" /></button></div></div></div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto w-full max-w-[42rem] text-center"><p className="text-sm font-extrabold uppercase text-indigo-600">Pricing</p><h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">Simple pricing for students.</h2></div><div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">{PRICING_TIERS.map((tier) => <div key={tier.name} className={tier.popular ? "relative w-full min-w-0 rounded-[1.75rem] border border-violet-400 bg-white p-6 shadow-xl shadow-violet-950/15 ring-4 ring-violet-100 sm:p-8" : "relative w-full min-w-0 rounded-[1.75rem] border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8"}>{tier.popular && <div className="absolute right-6 top-6 rounded-full bg-violet-600 px-3 py-1 text-xs font-extrabold text-white shadow-lg shadow-violet-600/25">MOST POPULAR</div>}<h3 className="text-2xl font-extrabold text-slate-950">{tier.name}</h3><p className="mt-3 w-full max-w-[24rem] text-sm leading-6 text-slate-600">{tier.description}</p><div className="mt-7 flex items-end gap-2"><span className="text-5xl font-extrabold text-slate-950">{tier.price}</span><span className="pb-2 text-base font-bold text-slate-500">{tier.cadence}</span></div><Link to="/signup" className={tier.popular ? "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700" : "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-5 py-4 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-100"}>{tier.cta}<ArrowRight className="h-4 w-4" /></Link><div className="mt-8 space-y-3">{tier.benefits.map((benefit) => <div key={benefit} className="flex items-start gap-3 text-sm font-semibold text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{benefit}</div>)}</div></div>)}</div></div>
        </section>

        <section className="bg-[#f7f5ff] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="w-full max-w-[42rem] min-w-0"><p className="text-sm font-extrabold uppercase text-indigo-600">Built for students</p><h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">From project idea to confident defense.</h2></div><div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{TESTIMONIALS.map((testimonial) => <div key={testimonial.name} className="w-full min-w-0 rounded-[1.5rem] border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-950/5"><div className="mb-5 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-600">Placeholder/demo content</div><p className="text-base leading-7 text-slate-700">"{testimonial.quote}"</p><div className="mt-6 border-t border-indigo-100 pt-5"><p className="font-extrabold text-slate-950">{testimonial.name}</p><p className="mt-1 text-sm font-semibold text-slate-500">{testimonial.role}</p></div></div>)}</div></div>
        </section>

        <section id="faq" className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-8"><div className="w-full min-w-0"><p className="text-sm font-extrabold uppercase text-indigo-600">FAQ</p><h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">Questions students ask first.</h2></div><div className="w-full min-w-0 space-y-3">{FAQS.map((faq) => { const isOpen = openFaq === faq.question; return <div key={faq.question} className="rounded-2xl border border-indigo-100 bg-[#fbfaff] shadow-sm"><button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left" onClick={() => setOpenFaq(isOpen ? "" : faq.question)} aria-expanded={isOpen}><span className="text-base font-extrabold text-slate-950">{faq.question}</span><ChevronDown className={isOpen ? "h-5 w-5 shrink-0 rotate-180 text-indigo-500 transition" : "h-5 w-5 shrink-0 text-indigo-500 transition"} /></button>{isOpen && <div className="px-5 pb-5 text-sm leading-7 text-slate-600">{faq.answer}</div>}</div>; })}</div></div>
        </section>

        <section id="contact" className="bg-[#f1edff] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8">
            <div className="w-full min-w-0 rounded-[1.75rem] border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8">
              <p className="text-sm font-extrabold uppercase text-indigo-600">Contact</p>
              <h2 className="mt-3 text-4xl font-extrabold leading-tight text-slate-950">Have a question? Let's talk.</h2>
              <form className="mt-8 grid gap-5" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                    Full name
                    <input
                      required
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      maxLength={120}
                      disabled={isContactSubmitting}
                      className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                    Email
                    <input
                      required
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      maxLength={160}
                      disabled={isContactSubmitting}
                      className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 invalid:focus:border-rose-400 invalid:focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                  Subject
                  <input
                    required
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                    maxLength={180}
                    disabled={isContactSubmitting}
                    className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="How can we help?"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
                  Message
                  <textarea
                    required
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    maxLength={4000}
                    disabled={isContactSubmitting}
                    rows={5}
                    className="resize-none rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="Write your message..."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isContactSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
                >
                  {isContactSubmitting ? "Sending..." : "Send message"}
                  <Mail className="h-4 w-4" />
                </button>
                <div aria-live="polite" className="grid gap-3">
                  {contactStatus && (
                    <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      {contactStatus}
                    </p>
                  )}
                  {contactError && (
                    <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                      {contactError}
                    </p>
                  )}
                </div>
              </form>
            </div>
            <div className="grid w-full min-w-0 content-start gap-5"><div className="rounded-[1.75rem] border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><MapPin className="h-6 w-6" /></div><h3 className="mt-6 text-2xl font-extrabold text-slate-950">Contact information</h3><div className="mt-5 space-y-4 text-sm font-semibold text-slate-600"><div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-indigo-500" />Tunisia</div><div className="flex items-center gap-3"><Mail className="h-4 w-4 text-indigo-500" />Developer email placeholder</div></div></div><div className="rounded-[1.75rem] border border-indigo-100 bg-[linear-gradient(135deg,#ffffff,#eef2ff)] p-6 shadow-xl shadow-indigo-950/5 sm:p-8"><h3 className="text-2xl font-extrabold text-slate-950">Built around the PFE method.</h3><p className="mt-4 w-full max-w-[36rem] leading-7 text-slate-600">The product keeps students moving from analysis to design, implementation, report writing and defense preparation inside a single workspace.</p></div></div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,#07111f_0%,#1e1b4b_46%,#4f46e5_100%)] p-8 text-center text-white shadow-[0_28px_90px_rgba(49,46,129,0.24)] sm:p-14"><h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">Ready to start your PFE?</h2><p className="mx-auto mt-5 max-w-[42rem] text-lg leading-8 text-indigo-50/90">Create your workspace in under a minute and start structuring your project today.</p><div className="mt-8 flex flex-col items-center justify-center gap-3"><Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-indigo-900 shadow-xl shadow-black/20 transition hover:bg-indigo-50">Create free workspace<ArrowRight className="h-5 w-5" /></Link><p className="text-sm font-semibold text-indigo-100">No credit card required.</p></div></div>
        </section>
      </main>

      <footer className="bg-[#07111f] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,2fr)]"><div className="w-full min-w-0"><Link to="/" className="inline-flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white">P</span><span className="text-lg font-extrabold">PFE Guidance</span></Link><p className="mt-5 w-full max-w-[28rem] text-sm leading-7 text-slate-300">The intelligent workspace helping engineering students structure, build and defend their Final Year Project with confidence.</p></div><div className="grid w-full min-w-0 grid-cols-1 gap-8 sm:grid-cols-3">{Object.entries(FOOTER_LINKS).map(([title, links]) => <div key={title}><h3 className="text-sm font-extrabold uppercase text-indigo-200">{title}</h3><div className="mt-4 grid gap-3">{links.map((link) => <a key={title + link.label} href={link.href} className="text-sm font-semibold text-slate-300 transition hover:text-white">{link.label}</a>)}</div></div>)}</div></div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>{"\u00A9"} 2026 PFE Guidance. All rights reserved.</span><span>Built for students in Tunisia and beyond.</span></div>
      </footer>
    </div>
  );
}
