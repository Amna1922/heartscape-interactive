import { lazy, Suspense, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Download,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RISK_TREND, TWIN_STATES } from "@/lib/twin-data";

const HeartViewer = lazy(() =>
  import("./heart/HeartViewer").then((m) => ({ default: m.HeartViewer })),
);

const TONE: Record<string, { color: string; label: string }> = {
  healthy: { color: "var(--ok)", label: "Stable" },
  warning: { color: "var(--warn)", label: "Watch" },
  critical: { color: "var(--crit)", label: "Critical" },
};

function Metric({
  label,
  value,
  unit,
  tone,
  sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl leading-none" style={{ color: tone ?? undefined }}>
        {value}
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
      </p>
      {sub && <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Dashboard({ onReset }: { onReset: () => void }) {
  const [idx, setIdx] = useState(0);
  const s = TWIN_STATES[idx] ?? TWIN_STATES[0]!;
  const tone = TONE[s.key] ?? TONE["healthy"]!;

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="h-5 w-5" style={{ color: tone.color }} />
            <div>
              <p className="text-sm font-semibold leading-tight text-primary">
                Cardiac Digital Twin
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Patient A-2291 · 64 y · M
              </p>
            </div>
          </div>

          <span
            className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: tone.color, backgroundColor: `color-mix(in oklab, ${tone.color} 15%, transparent)` }}
          >
            {s.status}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New study
            </button>
          </div>
        </div>

        {/* temporal scrubber */}
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 border-t border-border px-4 py-2.5 sm:px-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Timeline
          </span>
          <div className="flex flex-1 flex-wrap gap-1">
            {TWIN_STATES.map((st, i) => (
              <button
                key={st.key}
                onClick={() => setIdx(i)}
                className={`rounded-md px-3 py-1.5 text-left font-mono text-[11px] transition-colors ${
                  i === idx
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={i === idx ? { boxShadow: `inset 0 -2px 0 ${TONE[st.key]?.color}` } : undefined}
              >
                {st.timepoint}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={TWIN_STATES.length - 1}
            step={1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            aria-label="Scrub twin timeline"
            className="h-1 w-full min-w-[160px] cursor-pointer appearance-none rounded-full bg-secondary accent-[var(--primary)] sm:w-56"
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* left: 3D + signals */}
          <section className="flex flex-col gap-5">
            <div className="h-[420px] sm:h-[520px]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center rounded-xl border border-border bg-card font-mono text-[11px] uppercase tracking-wider text-muted-foreground shadow-sm">
                    Loading twin geometry…
                  </div>
                }
              >
                <HeartViewer
                  severity={s.severity}
                  lesion={s.lesion}
                  bpm={s.hr}
                  stateKey={s.key}
                />
              </Suspense>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Risk & ejection fraction trajectory
              </p>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={RISK_TREND} margin={{ left: -20, right: 6, top: 6 }}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--crit)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--crit)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="var(--crit)"
                      fill="url(#riskFill)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="ef"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* right: clinical panel */}
          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold text-primary">Dummy Lab Values</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Ejection fraction" value={s.ef} unit="%" tone={tone.color} sub="normal ≥ 55%" />
              <Metric label="Heart rate" value={s.hr} unit="bpm" sub="60–100" />
              <Metric label="Blood pressure" value={s.bp} unit="mmHg" sub="target < 130/80" />
              <Metric label="Cardiac output" value={s.cardiacOutput.toFixed(1)} unit="L/min" sub="4.0–8.0" />
              <Metric label="GLS" value={`${s.strain.toFixed(1)}`} unit="%" sub="normal ≤ −18%" />
              <Metric label="SpO₂" value={s.spo2} unit="%" sub="≥ 95%" />
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    MACE risk prediction · 12 months
                  </p>
                  <p className="mt-2 font-mono text-4xl leading-none" style={{ color: tone.color }}>
                    {s.riskScore}
                    <span className="ml-1 text-sm text-muted-foreground">/100</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    {s.riskBand} · {s.riskDelta}
                    {s.key !== "healthy" && <ArrowUpRight className="h-3 w-3" style={{ color: tone.color }} />}
                  </p>
                </div>
                {s.key === "healthy" ? (
                  <ShieldCheck className="h-6 w-6" style={{ color: tone.color }} />
                ) : (
                  <AlertTriangle className="h-6 w-6" style={{ color: tone.color }} />
                )}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${s.riskScore}%`, backgroundColor: tone.color }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                Recommended / Checked by Cardiologist
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Clinical summary · {s.timepoint}
              </p>
              <h3 className="mt-3 text-base font-medium text-foreground">{s.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.summary}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Model findings
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {s.findings.map((f) => (
                      <li key={f} className="flex gap-2 text-[13px] leading-snug text-foreground">
                        <Activity className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Recommended actions
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {s.actions.map((a) => (
                      <li
                        key={a}
                        className="rounded-md border px-2.5 py-1.5 text-[13px] leading-snug"
                        style={{
                          borderColor: `color-mix(in oklab, ${tone.color} 35%, transparent)`,
                          color: "var(--foreground)",
                        }}
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <p className="py-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Demonstration build · simulated physiology · not for clinical use
        </p>
      </main>
    </div>
  );
}
