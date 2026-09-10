import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PIPELINE_STEPS } from "@/lib/twin-data";

export function ProcessingStage({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const start = performance.now();
    const total = 7200;
    let raf = 0;
    const tick = () => {
      const p = Math.min((performance.now() - start) / total, 1);
      setProgress(p);
      setStep(Math.min(Math.floor(p * PIPELINE_STEPS.length), PIPELINE_STEPS.length - 1));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 550);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
        Reconstruction in progress
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Solving the patient-specific model
      </h2>

      <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-2 text-right font-mono text-[11px] text-muted-foreground">
        {Math.round(progress * 100)}%
      </p>

      <ol className="mt-8 space-y-1">
        {PIPELINE_STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "queued";
          return (
            <li
              key={s.label}
              className={`flex items-start gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors ${
                state === "active"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border"
              }`}
            >
              <span className="mt-0.5">
                {state === "done" ? (
                  <Check className="h-4 w-4 text-[var(--ok)]" />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="block h-4 w-4 rounded-full border border-border" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm ${
                    state === "queued" ? "text-muted-foreground/60" : "text-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {s.detail && (
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {s.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
