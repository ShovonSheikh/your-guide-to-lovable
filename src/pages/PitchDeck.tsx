import React, { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Zap,
  Users,
  TrendingUp,
  Shield,
  Globe,
  Target,
  Coins,
  Monitor,
  Volume2,
  BadgeCheck,
  BarChart3,
  Rocket,
  Heart,
  ArrowRight,
} from "lucide-react";

const TOTAL_SLIDES = 12;

// Live stats from database (Feb 2026)
const STATS = {
  totalUsers: 4,
  totalCreators: 3,
  totalTips: 42,
  totalVolume: "20,586",
  avgTip: "490",
  maxTip: "15,000",
  uniqueSupporters: 2,
  liveSince: "Jan 22, 2026",
};

export default function PitchDeck() {
  usePageTitle("TipKoro — Pitch Deck");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goTo = useCallback((n: number) => setCurrentSlide(Math.max(0, Math.min(n, TOTAL_SLIDES - 1))), []);
  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape" && isFullscreen) toggleFullscreen();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div className={`min-h-screen bg-foreground text-primary-foreground flex flex-col select-none ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Slide Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <div className="w-full max-w-6xl aspect-video relative mx-4">
          {/* Slides */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
            {currentSlide === 0 && <CoverSlide />}
            {currentSlide === 1 && <ProblemSlide />}
            {currentSlide === 2 && <SolutionSlide />}
            {currentSlide === 3 && <HowItWorksSlide />}
            {currentSlide === 4 && <TractionSlide />}
            {currentSlide === 5 && <MarketSlide />}
            {currentSlide === 6 && <StreamerSlide />}
            {currentSlide === 7 && <TechSlide />}
            {currentSlide === 8 && <RevenueSlide />}
            {currentSlide === 9 && <CompetitiveSlide />}
            {currentSlide === 10 && <GTMSlide />}
            {currentSlide === 11 && <VisionSlide />}
          </div>
        </div>

        {/* Nav arrows */}
        {currentSlide > 0 && (
          <button onClick={prev} className="absolute left-4 p-3 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>
        )}
        {currentSlide < TOTAL_SLIDES - 1 && (
          <button onClick={next} className="absolute right-4 p-3 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-accent' : 'w-3 bg-primary-foreground/20 hover:bg-primary-foreground/40'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-primary-foreground/50 text-sm">
          <span>{currentSlide + 1}/{TOTAL_SLIDES}</span>
          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-primary-foreground/10">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide Components ─── */

const SlideBase = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute inset-0 flex flex-col justify-center p-12 md:p-16 lg:p-20 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-accent/20 text-accent">
    {children}
  </span>
);

function CoverSlide() {
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(30,10%,8%)] via-[hsl(30,10%,12%)] to-[hsl(40,15%,10%)] items-center text-center">
      <div className="mb-6">
        <Badge>🇧🇩 100% Bangladeshi</Badge>
      </div>
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-4">
        Tip<span className="text-accent">Koro</span>
      </h1>
      <p className="text-xl md:text-2xl lg:text-3xl text-primary-foreground/70 font-medium max-w-3xl">
        Support your favorite creators, <span className="text-accent font-bold">instantly!</span>
      </p>
      <p className="mt-8 text-sm text-primary-foreground/40">
        Bangladesh's first creator tipping & streamer alert platform
      </p>
      <p className="mt-3 text-xs text-primary-foreground/30">tipkoro.com • Press → to navigate</p>
    </SlideBase>
  );
}

function ProblemSlide() {
  const problems = [
    { icon: Globe, title: "No Local Platform", desc: "PayPal unavailable in BD. Creators rely on bank transfers." },
    { icon: Volume2, title: "Dead Live Interaction", desc: "No way for fans to trigger sounds/visuals on BD streams." },
    { icon: Zap, title: "Payment Friction", desc: "Gateway flow takes 60-120s. The funny moment is gone." },
    { icon: Shield, title: "No Trust Layer", desc: "Supporters can't verify if a creator page is real." },
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(0,40%,12%)] to-[hsl(30,10%,8%)]">
      <Badge>The Problem</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-10">
        BD Creators Can't Monetize<br />Their Audience
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problems.map((p) => (
          <div key={p.title} className="flex gap-4 p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
            <div className="p-2.5 rounded-lg bg-red-500/20 h-fit"><p.icon className="w-5 h-5 text-red-400" /></div>
            <div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-primary-foreground/60 mt-1">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SlideBase>
  );
}

function SolutionSlide() {
  const features = [
    { icon: Zap, label: "Instant Token Tips", desc: "Sub-second (200-500ms)" },
    { icon: Volume2, label: "Streamer Alerts", desc: "Sounds, GIFs, animations" },
    { icon: Target, label: "Funding Goals", desc: "Public progress + milestones" },
    { icon: BadgeCheck, label: "ID Verification", desc: "Trust layer for creators" },
    { icon: BarChart3, label: "Analytics Dashboard", desc: "Real-time earnings data" },
    { icon: Monitor, label: "Embeddable Widgets", desc: "Drop on any website" },
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(45,60%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>The Solution</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-3">
        Token-Based Tipping +<br />Streamer Alerts
      </h2>
      <p className="text-primary-foreground/60 mb-8 text-lg">Pre-loaded wallet → tip instantly with zero payment friction</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.label} className="p-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-center">
            <f.icon className="w-6 h-6 text-accent mx-auto mb-2" />
            <h3 className="font-semibold text-sm">{f.label}</h3>
            <p className="text-xs text-primary-foreground/50 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </SlideBase>
  );
}

function HowItWorksSlide() {
  const steps = [
    { step: "1", label: "Fan deposits ৳500 via bKash/Nagad", time: "~30s" },
    { step: "2", label: "Tokens added to wallet", time: "instant" },
    { step: "3", label: "Fan visits creator's page", time: "" },
    { step: "4", label: "Clicks 'Send ৳100 Tip'", time: "~300ms" },
    { step: "5", label: "Alert plays on stream", time: "<500ms" },
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(200,30%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>How It Works</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-10">
        Deposit Once, Tip Instantly
      </h2>
      <div className="flex flex-col gap-4 max-w-2xl">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0">
              {s.step}
            </div>
            <div className="flex-1 p-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex justify-between items-center">
              <span className="font-medium">{s.label}</span>
              {s.time && <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-mono">{s.time}</span>}
            </div>
            {i < steps.length - 1 && <div className="hidden" />}
          </div>
        ))}
      </div>
      <p className="text-sm text-primary-foreground/40 mt-6">
        Key innovation: Token transfer is a single atomic DB operation — no external API at tip time.
      </p>
    </SlideBase>
  );
}

function TractionSlide() {
  const metrics = [
    { label: "Completed Tips", value: STATS.totalTips, sub: "organic" },
    { label: "Volume Processed", value: `৳${STATS.totalVolume}`, sub: "BDT" },
    { label: "Avg Tip Size", value: `৳${STATS.avgTip}`, sub: "per tip" },
    { label: "Largest Tip", value: `৳${STATS.maxTip}`, sub: "single transaction" },
    { label: "Creators", value: STATS.totalCreators, sub: "onboarded" },
    { label: "Live Since", value: STATS.liveSince, sub: "beta launch" },
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(142,30%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>Traction</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-3">
        Early Beta Results
      </h2>
      <p className="text-primary-foreground/50 mb-8">Live production data • Controlled onboarding • Zero paid acquisition</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
            <p className="text-3xl md:text-4xl font-display font-bold text-accent">{m.value}</p>
            <p className="text-sm font-medium mt-1">{m.label}</p>
            <p className="text-xs text-primary-foreground/40">{m.sub}</p>
          </div>
        ))}
      </div>
    </SlideBase>
  );
}

function MarketSlide() {
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(260,30%,10%)] to-[hsl(30,10%,8%)]">
      <Badge>Market Opportunity</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-8">
        Bangladesh Creator Economy
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            ["130M+", "Internet users"],
            ["55M+", "Social media users"],
            ["10,000+", "Facebook Gaming streamers"],
            ["200M+", "MFS accounts (bKash/Nagad)"],
          ].map(([val, label]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-accent w-24 text-right">{val}</span>
              <span className="text-primary-foreground/70">{label}</span>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent font-semibold">TAM</p>
            <p className="text-2xl font-bold">$2B</p>
            <p className="text-xs text-primary-foreground/50">SE Asian creator economy</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent font-semibold">SAM</p>
            <p className="text-2xl font-bold">$200M</p>
            <p className="text-xs text-primary-foreground/50">BD digital creator monetization</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent font-semibold">SOM (Year 3)</p>
            <p className="text-2xl font-bold">$5M</p>
            <p className="text-xs text-primary-foreground/50">Direct tipping on BD content</p>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}

function StreamerSlide() {
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(280,40%,10%)] to-[hsl(30,10%,8%)]">
      <Badge>Key Feature</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-3">
        Streamer Alerts — <span className="text-accent">"Twitch for BD"</span>
      </h2>
      <p className="text-primary-foreground/60 mb-8 text-lg">Real-time tip alerts on live streams, powered by pre-loaded tokens</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {[
            "🎵 Amount-based sound triggers",
            "🎬 Curated GIF animation library",
            "📝 Supporter message overlay",
            "🔇 Emergency mute toggle",
            "🎨 Custom CSS support",
            "🔊 Text-to-Speech (voice/pitch/rate)",
            "⚡ <500ms tip-to-alert latency",
          ].map((f) => (
            <div key={f} className="p-3 rounded-lg bg-primary-foreground/5 text-sm">{f}</div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
          <Monitor className="w-16 h-16 text-accent mb-4" />
          <p className="text-center text-sm text-primary-foreground/60">
            Creator adds <code className="px-1.5 py-0.5 rounded bg-primary-foreground/10 text-accent text-xs">/alerts/token</code> as Browser Source in OBS
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-primary-foreground/40">
            <span>Fan tips ৳200</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-accent font-semibold">&lt;500ms</span>
            <ArrowRight className="w-3 h-3" />
            <span>Alert plays!</span>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}

function TechSlide() {
  const stack = [
    { label: "Frontend", tech: "React 19 + TypeScript + Tailwind" },
    { label: "Backend", tech: "Supabase (Postgres + Edge Functions)" },
    { label: "Auth", tech: "Clerk (social + email)" },
    { label: "Payments", tech: "RupantorPay (bKash, Nagad, Rocket)" },
    { label: "Email", tech: "Resend (transactional)" },
    { label: "Hosting", tech: "Vercel (global CDN)" },
    { label: "Real-time", tech: "Supabase Realtime (WebSocket)" },
  ];
  const security = [
    "Atomic SECURITY DEFINER RPC functions",
    "Row Level Security on every table",
    "Database-backed rate limiting",
    "Withdrawal 2FA (PIN + OTP)",
    "13-flag granular admin permissions",
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(210,30%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>Architecture</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-8">
        Production-Grade Stack
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">Tech Stack</h3>
          <div className="space-y-2">
            {stack.map((s) => (
              <div key={s.label} className="flex justify-between p-3 rounded-lg bg-primary-foreground/5 text-sm">
                <span className="text-primary-foreground/60">{s.label}</span>
                <span className="font-medium">{s.tech}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Security
          </h3>
          <div className="space-y-2">
            {security.map((s) => (
              <div key={s} className="p-3 rounded-lg bg-primary-foreground/5 text-sm flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green-400 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideBase>
  );
}

function RevenueSlide() {
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(45,40%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>Revenue Model</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-8">
        Platform Fee on Token Flow
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            { stream: "Deposit Fee", model: "X% on bKash/Nagad deposits", primary: true },
            { stream: "Creator Subscription", model: "Monthly fee (promo/free now)" },
            { stream: "Withdrawal Fee", model: "Configurable % on payouts" },
            { stream: "Premium Features", model: "Advanced alert customization" },
          ].map((r) => (
            <div key={r.stream} className={`p-4 rounded-xl border ${r.primary ? 'bg-accent/10 border-accent/30' : 'bg-primary-foreground/5 border-primary-foreground/10'}`}>
              <h3 className="font-semibold">{r.stream}</h3>
              <p className="text-sm text-primary-foreground/60 mt-1">{r.model}</p>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
          <h3 className="text-accent font-semibold mb-4">Unit Economics (Projected)</h3>
          <div className="space-y-3 text-sm">
            {[
              ["Avg deposit", "৳500"],
              ["Platform fee (3%)", "৳15/deposit"],
              ["Deposits/user/month", "2"],
              ["Revenue/active user", "৳30/month"],
              ["Break-even", "~3,000 active users"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-primary-foreground/60">{label}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideBase>
  );
}

function CompetitiveSlide() {
  const features = [
    { name: "bKash/Nagad/Rocket", tipkoro: true, kofi: false, bmac: false, se: false },
    { name: "Pre-loaded tokens", tipkoro: true, kofi: false, bmac: false, se: true },
    { name: "Sub-second tipping", tipkoro: true, kofi: false, bmac: false, se: true },
    { name: "Streamer alerts", tipkoro: true, kofi: false, bmac: false, se: true },
    { name: "Identity verification", tipkoro: true, kofi: false, bmac: false, se: false },
    { name: "Bangla-first UX", tipkoro: true, kofi: false, bmac: false, se: false },
  ];
  const Check = () => <span className="text-green-400 font-bold">✓</span>;
  const Cross = () => <span className="text-red-400/50">✗</span>;
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(30,20%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>Competitive Landscape</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-8">
        No One Does This for <span className="text-accent">Bangladesh</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary-foreground/10">
              <th className="text-left py-3 text-primary-foreground/50">Feature</th>
              <th className="text-center py-3 text-accent font-bold">TipKoro</th>
              <th className="text-center py-3 text-primary-foreground/50">Ko-fi</th>
              <th className="text-center py-3 text-primary-foreground/50">BMAC</th>
              <th className="text-center py-3 text-primary-foreground/50">StreamElements</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.name} className="border-b border-primary-foreground/5">
                <td className="py-3">{f.name}</td>
                <td className="text-center py-3">{f.tipkoro ? <Check /> : <Cross />}</td>
                <td className="text-center py-3">{f.kofi ? <Check /> : <Cross />}</td>
                <td className="text-center py-3">{f.bmac ? <Check /> : <Cross />}</td>
                <td className="text-center py-3">{f.se ? <Check /> : <Cross />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-primary-foreground/40">
        <strong className="text-accent">Moat:</strong> Local payment integration + streamer alerts + first-mover in BD market
      </p>
    </SlideBase>
  );
}

function GTMSlide() {
  const phases = [
    { phase: "Phase 1", time: "Now – Q2 2026", title: "Gaming Streamers", items: ["Target 10K+ FB Gaming streamers", "Free onboarding promo", "Partner with top 10 streamers"], color: "text-green-400" },
    { phase: "Phase 2", time: "Q3 2026", title: "YouTube Creators", items: ["Educators, entertainers, vloggers", "Embeddable tip widgets", "YouTube Super Chat alternative"], color: "text-blue-400" },
    { phase: "Phase 3", time: "Q4 2026+", title: "Platform Expansion", items: ["Facebook Page integration", "TikTok creator support", "Mobile app (React Native)"], color: "text-purple-400" },
  ];
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(160,30%,8%)] to-[hsl(30,10%,8%)]">
      <Badge>Go-to-Market</Badge>
      <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-8">
        Land & Expand
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {phases.map((p) => (
          <div key={p.phase} className="p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
            <p className={`text-xs font-semibold ${p.color} uppercase`}>{p.phase} • {p.time}</p>
            <h3 className="text-lg font-bold mt-2 mb-3">{p.title}</h3>
            <ul className="space-y-2">
              {p.items.map((item) => (
                <li key={item} className="text-sm text-primary-foreground/60 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-1 shrink-0 text-primary-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
        <h3 className="text-sm font-semibold text-accent mb-2">Growth Flywheel</h3>
        <p className="text-xs text-primary-foreground/50">
          Creator promotes page → Fan deposits tokens → Tips trigger alerts on stream → Viewers see "Powered by TipKoro" → New creators sign up
        </p>
      </div>
    </SlideBase>
  );
}

function VisionSlide() {
  return (
    <SlideBase className="bg-gradient-to-br from-[hsl(45,50%,8%)] via-[hsl(30,10%,10%)] to-[hsl(30,10%,8%)] items-center text-center">
      <Heart className="w-12 h-12 text-accent mb-6 mx-auto" />
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold max-w-4xl mx-auto leading-tight">
        Every Bangladeshi creator deserves to be supported — <span className="text-accent">instantly.</span>
      </h2>
      <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
        {[
          { year: "2026", creators: "500", volume: "৳5M/mo" },
          { year: "2027", creators: "5,000", volume: "৳50M/mo" },
          { year: "2028", creators: "25,000", volume: "৳250M/mo" },
        ].map((y) => (
          <div key={y.year} className="p-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
            <p className="text-accent font-bold text-lg">{y.year}</p>
            <p className="text-sm mt-1">{y.creators} creators</p>
            <p className="text-xs text-primary-foreground/50">{y.volume}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 space-y-2">
        <p className="text-lg font-semibold">tipkoro.com</p>
        <p className="text-sm text-primary-foreground/40">Let's build the creator economy for Bangladesh together.</p>
      </div>
    </SlideBase>
  );
}
