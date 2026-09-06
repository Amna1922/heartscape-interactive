import { useRef, useState } from "react";
import { Activity, FileSpreadsheet, ScanLine, Upload, Waves, X, Check } from "lucide-react";

interface FileItem {
  name: string;
  size: string;
  kind: "ct" | "echo" | "csv";
}

const SAMPLES: Record<FileItem["kind"], FileItem[]> = {
  ct: [{ name: "cardiac_ct_angio_412slices.dcm.zip", size: "184.2 MB", kind: "ct" }],
  echo: [{ name: "tte_apical4ch_strain.dcm", size: "42.8 MB", kind: "echo" }],
  csv: [{ name: "labs_timeline_2024-2026.csv", size: "37 KB", kind: "csv" }],
};

const SLOTS = [
  {
    kind: "ct" as const,
    icon: ScanLine,
    title: "Cardiac CT series",
    hint: "DICOM · contrast-enhanced · ≤ 1 mm slices",
  },
  {
    kind: "echo" as const,
    icon: Waves,
    title: "Echocardiography",
    hint: "DICOM cine loops · apical + parasternal",
  },
  {
    kind: "csv" as const,
    icon: FileSpreadsheet,
    title: "Longitudinal labs",
    hint: "CSV · biomarker timeline with dates",
  },
];

export function UploadStage({ onStart }: { onStart: (files: FileItem[]) => void }) {
  const [files, setFiles] = useState<Record<string, FileItem | null>>({
    ct: null,
    echo: null,
    csv: null,
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const attach = (kind: FileItem["kind"], name?: string, size?: number) => {
    const item: FileItem = name
      ? { name, size: size ? `${(size / 1048576).toFixed(1)} MB` : "—", kind }
      : SAMPLES[kind][0]!;
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
          Attach imaging and a longitudinal biomarker file. The pipeline segments the
          myocardium, extracts the coronary tree and solves an electro-mechanical model to
          produce an interactive twin with perfusion mapping. Demonstration build — all
          data is simulated.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SLOTS.map(({ kind, icon: Icon, title, hint }) => {
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
                attach(kind, f?.name, f?.size);
              }}
              className={`group relative flex flex-col rounded-xl border p-5 transition-colors ${
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
                  if (f) attach(kind, f.name, f.size);
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
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {hint}
              </p>

              {file ? (
                <div className="mt-4 rounded-lg border border-border bg-background/60 px-3 py-2">
                  <p className="truncate font-mono text-[11px] text-foreground">{file.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {file.size} · verified
                  </p>
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
        >
          Generate digital twin
        </button>
      </div>
    </div>
  );
}
