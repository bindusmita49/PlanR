import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">

      {/* ── Ambient red glow behind the heading ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full blur-[140px] opacity-20"
        style={{ background: "#E62429" }}
      />

      {/* ── Subtle grid overlay ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#F5F5F0 1px, transparent 1px), linear-gradient(90deg, #F5F5F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Eyebrow label */}
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ borderColor: "rgba(230,36,41,0.4)", color: "#E62429" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E62429] animate-pulse" />
          Day Planner
        </span>

        {/* Heading */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="text-[clamp(5rem,18vw,10rem)] font-black leading-none tracking-tight text-foreground"
            style={{ letterSpacing: "-0.04em" }}
          >
            Plan<span style={{ color: "#E62429" }}>R</span>
          </h1>

          {/* Red accent underline */}
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-foreground/20" />
            <div className="h-[3px] w-16 rounded-full" style={{ background: "#E62429" }} />
            <div className="h-px w-12 bg-foreground/20" />
          </div>
        </div>

        {/* Tagline */}
        <p
          className="max-w-sm text-lg font-medium leading-relaxed"
          style={{ color: "rgba(245,245,240,0.55)" }}
        >
          Plan your day.{" "}
          <span className="text-foreground font-semibold">Own your time.</span>
        </p>

        {/* CTA buttons */}
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          {/* Get Started — primary */}
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_28px_rgba(230,36,41,0.5)] active:scale-[0.97]"
            style={{ background: "#E62429" }}
          >
            {/* Shine sweep on hover */}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/10 transition-transform duration-500 group-hover:translate-x-full"
            />
            <span className="relative">Get Started →</span>
          </Link>

          {/* Log In — ghost */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border px-8 py-3.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-white/5 active:scale-[0.97]"
            style={{ borderColor: "rgba(245,245,240,0.15)" }}
          >
            Log In
          </Link>
        </div>

        {/* Footer micro-copy */}
        <p className="mt-6 text-xs" style={{ color: "rgba(245,245,240,0.25)" }}>
          No credit card required &nbsp;·&nbsp; Free to get started
        </p>
      </div>

      {/* ── Bottom fade-out ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: "linear-gradient(to bottom, transparent, #0A0A0A)",
        }}
      />
    </main>
  );
}
