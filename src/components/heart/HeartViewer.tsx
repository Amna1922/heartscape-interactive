import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useState } from "react";
import { HeartModel } from "./HeartModel";
import type { StateKey } from "@/lib/twin-data";

const MODES = [
  { key: "perfusion", label: "Perfusion" },
  { key: "xray", label: "Translucent" },
] as const;

type Mode = (typeof MODES)[number]["key"];

interface Props {
  severity: number;
  lesion: [number, number, number];
  bpm: number;
  stateKey: StateKey;
}

export function HeartViewer({ severity, lesion, bpm, stateKey }: Props) {
  const [mode, setMode] = useState<Mode>("perfusion");
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[var(--viz-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--viz-glow),transparent_65%)]" />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [3.4, 1.1, 4.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <directionalLight position={[-5, 1, -4]} intensity={0.4} color="#88b6ff" />
        <Environment>
          <Lightformer intensity={1.6} position={[0, 5, 2]} scale={[8, 8, 1]} />
          <Lightformer
            intensity={0.9}
            color="#9ec6ff"
            position={[-5, 1, -2]}
            rotation-y={Math.PI / 2}
            scale={[14, 3, 1]}
          />
        </Environment>
        <Suspense fallback={null}>
          <HeartModel
            severity={severity}
            lesion={lesion}
            bpm={bpm}
            stateKey={stateKey}
            mode={mode}
            autoRotate={autoRotate}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={2.2}
          minDistance={3}
          maxDistance={11}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* mode switcher */}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1 rounded-lg border border-border/80 bg-card/80 p-1 backdrop-blur">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              mode === m.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAutoRotate((v) => !v)}
        className="absolute right-3 top-3 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        {autoRotate ? "Pause spin" : "Auto-rotate"}
      </button>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-border/80 bg-card/85 px-2.5 py-1.5 backdrop-blur">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          State map
        </span>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: stateKey === "critical" ? "#c53030" : stateKey === "warning" ? "#ed8936" : "#e2e8f0" }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 text-right">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Drag to rotate · scroll to zoom
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          twin state: {stateKey}
        </p>
      </div>
    </div>
  );
}
