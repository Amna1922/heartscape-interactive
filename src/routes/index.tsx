import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { UploadStage } from "@/components/UploadStage";
import { ProcessingStage } from "@/components/ProcessingStage";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cardiac Digital Twin — Interactive Heart Simulation POC" },
      {
        name: "description",
        content:
          "Upload simulated CT, echo and lab data to generate an interactive patient-specific cardiac digital twin with 3D perfusion mapping and temporal risk states.",
      },
      { property: "og:title", content: "Cardiac Digital Twin — Interactive Heart Simulation POC" },
      {
        property: "og:description",
        content:
          "A defense-ready proof of concept: imaging intake, model reconstruction and a clinical dashboard with a rotatable colour-mapped 3D heart.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "upload" | "processing" | "dashboard";

function Index() {
  const [stage, setStage] = useState<Stage>("upload");
  const done = useCallback(() => setStage("dashboard"), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {stage === "upload" && <UploadStage onStart={() => setStage("processing")} />}
      {stage === "processing" && <ProcessingStage onDone={done} />}
      {stage === "dashboard" && <Dashboard onReset={() => setStage("upload")} />}
    </div>
  );
}
