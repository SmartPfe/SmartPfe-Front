import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";


/* ─── Data ──────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "description",
    title: "Problem Statement",
    desc: "Define your project scope, context, and goals with a structured, guided editor.",
  },
  {
    icon: "groups_3",
    title: "Jury Simulation",
    desc: "Practice your defense with realistic AI-generated committee questions.",
  },
  {
    icon: "settings_suggest",
    title: "Requirements",
    desc: "Capture functional and non-functional specs, organized by module.",
  },
  {
    icon: "format_list_bulleted",
    title: "Product Backlog",
    desc: "Break down work into prioritized tasks from kickoff to delivery.",
  },
  {
    icon: "account_tree",
    title: "UML Diagrams",
    desc: "Plan your architecture and technical design with guided UML preparation.",
  },
  {
    icon: "auto_stories",
    title: "PFE Report",
    desc: "Write your thesis chapter by chapter with a guided academic structure.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your workspace",
    desc: "Describe your project in a few minutes. We structure the rest.",
  },
  {
    num: "02",
    title: "Follow the methodology",
    desc: "14 modules that map to every phase of academic project development.",
  },
  {
    num: "03",
    title: "Build your deliverables",
    desc: "Report, backlog, UML, pitch — produced step by step, in one place.",
  },
  {
    num: "04",
    title: "Ace your defense",
    desc: "Simulate jury questions, iterate on answers, walk in confident.",
  },
];

const PHASES = ["Analysis", "Design", "Development", "Report", "Defense"];

/* ─── Sub-components ─────────────────────────────────────────────────── */

function WorkspaceMockup() {
  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      {/* Soft ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-32px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.12), transparent 70%)",
          borderRadius: "2rem",
          pointerEvents: "none",
        }}
      />

      {/* Window chrome */}
      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8f7ff 100%)",
          boxShadow:
            "0 24px 70px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "12px 16px",
            borderBottom: "1px solid #f0e9fb",
            background: "#fbfaff",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fca5a5",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fcd34d",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#86efac",
              display: "inline-block",
            }}
          />
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "#94a3b8",
              fontFamily: "monospace",
            }}
          >
            workspace / overview
          </span>
        </div>

        {/* Body */}
        <div style={{ display: "flex", minHeight: 260 }}>
          {/* Sidebar */}
          <div
            style={{
              width: 148,
              borderRight: "1px solid #f0e9fb",
              background: "#fbfaff",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                P
              </div>
              <span
                style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}
              >
                PFE Guidance
              </span>
            </div>
            {["Overview", "Problem", "Actors", "Backlog", "Report"].map(
              (item, i) => (
                <div
                  key={item}
                  style={{
                    fontSize: 11,
                    padding: "6px 8px",
                    borderRadius: 6,
                    marginBottom: 2,
                    background: i === 0 ? "#f3e8ff" : "transparent",
                    color: i === 0 ? "#4f46e5" : "#94a3b8",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>

          {/* Main panel */}
          <div style={{ flex: 1, padding: "20px" }}>
            <p
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#4f46e5",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Active project
            </p>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              AI-Powered Retail Analytics
            </h3>

            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}
            >
              {[
                { label: "Progress", value: "68%", color: "#10b981" },
                { label: "Modules", value: "9 / 14", color: "#0f172a" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #f0e9fb",
                    background: "#fbfaff",
                    padding: "10px 12px",
                  }}
                >
                  <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
                    {s.label}
                  </p>
                  <p
                    style={{ fontSize: 18, fontWeight: 700, color: s.color }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 8,
                border: "1px solid #ddd6fe",
                background: "#f3e8ff",
                padding: "10px 12px",
              }}
            >
              <p
                style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600 }}
              >
                Next step
              </p>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Draft the Problem Statement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f3ff",
        color: "#0f172a",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 16,
              border: "1px solid rgba(79,70,229,0.14)",
              background: "rgba(245,243,255,0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: "10px 20px",
              boxShadow: "0 16px 44px rgba(49,46,129,0.14)",
            }}
          >
            {/* Logo */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: "-0.02em",
                  boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
                }}
              >
                P
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                PFE Guidance
              </span>
            </Link>

            {/* Nav links */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
              }}
              className="hidden-mobile"
            >
              {[
                { href: "#features", label: "Features" },
                { href: "#workflow", label: "How it works" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#64748b",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.color = "#4f46e5")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color = "#64748b")
                  }
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                to="/login"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#64748b",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 10,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#4f46e5")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#64748b")
                }
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fbfaff",
                  textDecoration: "none",
                  padding: "8px 18px",
                  borderRadius: 10,
                  background: "#4f46e5",
                  boxShadow: "0 2px 8px rgba(79,70,229,0.25)",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#4338ca";
                  el.style.boxShadow = "0 4px 12px rgba(79,70,229,0.35)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#4f46e5";
                  el.style.boxShadow = "0 2px 8px rgba(79,70,229,0.25)";
                }}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 100,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 44%, #312e81 76%, #4f46e5 100%)",
        }}
      >
        {/* Subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />
        {/* Soft accent blob */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-10%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(199,210,254,0.24) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "center",
            }}
            className="hero-grid"
          >
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Eyebrow */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 100,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(255,255,255,0.10)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#e0e7ff",
                  marginBottom: 28,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, color: "#c7d2fe" }}
                >
                  school
                </span>
                For engineering & computer science students
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: "clamp(2.2rem, 4vw, 3.25rem)",
                  fontWeight: 800,
                  lineHeight: 1.07,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                  marginBottom: 20,
                }}
              >
                Structure your PFE.
                <br />
                <span style={{ color: "#c7d2fe" }}>Defend with confidence.</span>
              </h1>

              {/* Sub */}
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: "#dbe4ff",
                  lineHeight: 1.65,
                  maxWidth: 480,
                  marginBottom: 36,
                }}
              >
                One workspace to manage every deliverable of your Final Year
                Project — from needs analysis to jury simulation.
              </p>

              {/* CTAs */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 12 }}
                className="cta-row"
              >
                <Link
                  to="/signup"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 24px",
                    borderRadius: 12,
                    background: "#4f46e5",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.28)",
                    transition: "background 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "#4338ca";
                    el.style.boxShadow = "0 6px 20px rgba(79,70,229,0.38)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "#4f46e5";
                    el.style.boxShadow = "0 4px 14px rgba(79,70,229,0.28)";
                  }}
                >
                  Create free workspace
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                  >
                    arrow_forward
                  </span>
                </Link>
                <a
                  href="#features"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.24)",
                    background: "rgba(255,255,255,0.10)",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.42)";
                    el.style.background = "rgba(255,255,255,0.16)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.24)";
                    el.style.background = "rgba(255,255,255,0.10)";
                  }}
                >
                  See features
                </a>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: 36,
                  marginTop: 48,
                  paddingTop: 40,
                  borderTop: "1px solid rgba(255,255,255,0.18)",
                }}
                className="stats-row"
              >
                {[
                  { n: "14+", label: "Guided modules" },
                  { n: "5", label: "Project phases" },
                  { n: "100%", label: "Free to use" },
                ].map((s) => (
                  <div key={s.label}>
                    <p
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {s.n}
                    </p>
                    <p
                      style={{ fontSize: 13, color: "#c7d2fe", marginTop: 2 }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right mockup */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <WorkspaceMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ─────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          background: "#f6f3ff",
          borderTop: "1px solid #ddd6fe",
          borderBottom: "1px solid #ddd6fe",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "start",
            }}
            className="two-col"
          >
            {/* Problem */}
            <div
              style={{
                border: "1px solid #e7dff2",
                background: "linear-gradient(180deg, #faf9ff 0%, #f8f6ff 100%)",
                borderRadius: 18,
                padding: "32px",
                boxShadow: "0 18px 50px rgba(49,46,129,0.07)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                The problem
              </span>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                  lineHeight: 1.2,
                  marginBottom: 16,
                }}
              >
                PFE projects fail from poor structure, not poor ideas.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "#64748b",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Most students manage 14+ deliverables across scattered tools — Google
                Docs, sheets, slides, emails. Nothing is connected. Progress is invisible.
                The defense suffers.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "No single source of truth for the project",
                  "Deliverables done in isolation, out of order",
                  "Zero preparation for jury questions",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "#64748b",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fef2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12, color: "#dc2626" }}
                      >
                        close
                      </span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div
              style={{
                border: "1px solid #ddd6fe",
                background: "linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)",
                borderRadius: 18,
                padding: "32px",
                boxShadow: "0 18px 50px rgba(79,70,229,0.10)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                The solution
              </span>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                  lineHeight: 1.2,
                  marginBottom: 16,
                }}
              >
                One workspace. Full methodology. Built for PFE.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "#64748b",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                PFE Guidance gives you a structured workspace that mirrors the real
                academic methodology — every module maps to a phase, every output
                connects to the next.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "14 modules, 5 phases — fully connected",
                  "Guided editors for every deliverable",
                  "Jury simulation to prepare your final defense",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "#64748b",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#f0fdf4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12, color: "#16a34a" }}
                      >
                        check
                      </span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phase bar */}
          <div
            style={{
              marginTop: 56,
              display: "flex",
              gap: 8,
              padding: "20px 24px",
              borderRadius: 14,
              border: "1px solid #e7dff2",
              background: "#faf9ff",
              boxShadow: "0 16px 40px rgba(49,46,129,0.06)",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginRight: 4 }}
            >
              Project phases:
            </span>
            {PHASES.map((phase, i) => (
              <div
                key={phase}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "#f3e8ff",
                    border: "1px solid #ddd6fe",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#4f46e5",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 500, color: "#4f46e5" }}
                  >
                    {phase}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: "#cbd5e1" }}
                  >
                    arrow_forward
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px", background: "#f1edff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 56, maxWidth: 520 }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 6,
                background: "#f3e8ff",
                color: "#4f46e5",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Features
            </span>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              Every deliverable, guided.
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.65 }}>
              Each module covers a specific deliverable in your academic journey —
              with a dedicated editor and clear output.
            </p>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
            className="features-grid"
          >
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section
        id="workflow"
        style={{
          padding: "96px 24px",
          background: "#f7f5ff",
          borderTop: "1px solid #ddd6fe",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto 64px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 6,
                background: "#ede9fe",
                color: "#4f46e5",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              How it works
            </span>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                lineHeight: 1.15,
              }}
            >
              Four steps. One goal.
            </h2>
          </div>

          {/* Steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
              position: "relative",
            }}
            className="steps-grid"
          >
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)",
                  border: "1px solid #ddd6fe",
                  boxShadow: "0 16px 42px rgba(49,46,129,0.08)",
                  borderRadius: 14,
                  padding: "28px 24px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#f0e9fb",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    display: "block",
                    marginBottom: 20,
                    userSelect: "none",
                  }}
                >
                  {step.num}
                </span>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
                {/* Connector dot */}
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 40,
                      right: -13,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "#ffffff",
                      border: "1px solid #e7dff2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                    className="step-arrow"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: "#94a3b8" }}
                    >
                      arrow_forward
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: "#ede9fe" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "linear-gradient(135deg, #111827 0%, #1e1b4b 40%, #312e81 72%, #4f46e5 100%)",
              padding: "72px 48px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(30,27,75,0.24)",
            }}
          >
            {/* Subtle dot accent */}
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -60,
                left: -60,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                  lineHeight: 1.1,
                  marginBottom: 16,
                }}
              >
                Ready to start your PFE?
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "#dbe4ff",
                  lineHeight: 1.65,
                  marginBottom: 36,
                }}
              >
                Set up your workspace in under a minute and start structuring
                your project today. No credit card. No complexity.
              </p>
              <Link
                to="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  borderRadius: 12,
                  background: "#ffffff",
                  color: "#312e81",
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                  transition: "background 0.15s, box-shadow 0.15s",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#eef2ff";
                  el.style.boxShadow = "0 16px 36px rgba(0,0,0,0.22)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#ffffff";
                  el.style.boxShadow = "0 12px 30px rgba(0,0,0,0.18)";
                }}
              >
                Create free account
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #f0e9fb",
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              P
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              PFE Guidance · {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { to: "/login", label: "Sign in" },
              { to: "/signup", label: "Sign up" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#4f46e5")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#94a3b8")
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Responsive overrides ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 48px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .step-arrow { display: none !important; }
          .stats-row { gap: 24px !important; }
          .hidden-mobile { display: none !important; }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .cta-row { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Feature card ───────────────────────────────────────────────────── */

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => {
  return (
    <div
      style={{
        padding: "28px 24px",
        borderRadius: 14,
        border: "1px solid #ddd6fe",
        background: "linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)",
        boxShadow: "0 16px 42px rgba(49,46,129,0.08)",
        transition: "border-color 0.18s, box-shadow 0.18s, transform 0.18s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "#c4b5fd";
        el.style.boxShadow = "0 22px 52px rgba(79,70,229,0.16)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "#ddd6fe";
        el.style.boxShadow = "0 16px 42px rgba(49,46,129,0.08)";
        el.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: "#4f46e5" }}
        >
          {icon}
        </span>
      </div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 8,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}


