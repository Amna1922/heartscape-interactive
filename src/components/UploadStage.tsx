import { useRef, useState } from "react";
import { Activity, FileSpreadsheet, ScanLine, Upload, X, Check } from "lucide-react";

interface FileItem {
  name: string;
  kind: "mri" | "labs";
}

const SAMPLES: Record<FileItem["kind"], FileItem> = {
  mri: { name: "cardiac_mri_scan.dcm", kind: "mri" },
  labs: { name: "lab_values.csv", kind: "labs" },
};

const SLOTS = [
  {
    kind: "mri" as const,
    icon: ScanLine,
    title: "Cardiac MRI",
  },
  {
    kind: "labs" as const,
    icon: FileSpreadsheet,
    title: "Lab Values",
  },
];

export function UploadStage({ onStart }: { onStart: (files: FileItem[]) => void }) {
  const [files, setFiles] = useState<Record<FileItem["kind"], FileItem | null>>({
    mri: null,
    labs: null,
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const attach = (kind: FileItem["kind"], name?: string) => {
    const item: FileItem = name ? { name, kind } : SAMPLES[kind];
    setFiles((f) => ({ ...f, [kind]: item }));
  };

  const ready = Object.values(files).filter(Boolean).length >= 2;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-14">
      <div className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Cardiac Digital Twin · POC
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Build a patient-specific heart twin
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The CardioTwin provides a powerful platform for medical device simulation - allowing doctors/surgeons to diagnose, model cardiac defects and diseased states, explore treatment options.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SLOTS.map(({ kind, icon: Icon, title }) => {
          const file = files[kind];
          return (
            <div
              key={kind}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(kind);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const f = e.dataTransfer.files?.[0];
                attach(kind, f?.name);
              }}
              className={`group relative flex flex-col rounded-2xl border p-6 shadow-[0_10px_25px_rgba(31,58,79,0.06)] transition-colors ${
                file
                  ? "border-primary/60 bg-primary/5"
                  : dragOver === kind
                    ? "border-primary bg-primary/10"
                    : "border-dashed border-border bg-card hover:border-primary/50"
              }`}
            >
              <input
                ref={(el) => {
                  inputs.current[kind] = el;
                }}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) attach(kind, f.name);
                }}
              />
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${file ? "text-primary" : "text-muted-foreground"}`} />
                {file && (
                  <button
                    onClick={() => setFiles((f) => ({ ...f, [kind]: null }))}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">{title}</h3>

              {file ? (
                <div className="mt-4 rounded-lg border border-border bg-background/60 px-3 py-2">
                  <p className="truncate font-mono text-[11px] text-foreground">{file.name}</p>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => inputs.current[kind]?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    <Upload className="h-3 w-3" /> Browse
                  </button>
                  <button
                    onClick={() => attach(kind)}
                    className="rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary transition-colors hover:underline"
                  >
                    Use sample
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <Check className={`h-3.5 w-3.5 ${ready ? "text-[var(--ok)]" : "opacity-30"}`} />
          {ready
            ? "Inputs sufficient for reconstruction"
            : "Attach at least two sources to continue"}
        </div>
        <button
          disabled={!ready}
          onClick={() => onStart(Object.values(files).filter(Boolean) as FileItem[])}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_5px_12px_rgba(15,118,110,0.18)] transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Generate digital twin
        </button>
      </div>
    </div>
  );
}
