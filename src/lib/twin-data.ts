export type StateKey = "healthy" | "warning" | "critical";

export interface Lab {
  label: string;
  unit: string;
  value: number;
  ref: [number, number];
  precision?: number;
}

export interface TwinState {
  key: StateKey;
  timepoint: string;
  dateLabel: string;
  headline: string;
  status: string;
  ef: number;
  hr: number;
  bp: string;
  spo2: number;
  cardiacOutput: number;
  strain: number;
  riskScore: number;
  riskBand: string;
  riskDelta: string;
  labs: Lab[];
  summary: string;
  findings: string[];
  actions: string[];
  /** drives the 3D colour map: 0 = uniform perfusion, 1 = severe regional defect */
  severity: number;
  /** centre of the ischaemic territory, in model space */
  lesion: [number, number, number];
  waveform: number[];
  perfusionSeries: { segment: string; value: number }[];
}

function wave(amp: number, jitter: number, notch: number) {
  const pts: number[] = [];
  for (let i = 0; i < 120; i++) {
    const t = (i % 30) / 30;
    let v = 0;
    v += Math.exp(-Math.pow((t - 0.18) / 0.03, 2)) * amp;
    v -= Math.exp(-Math.pow((t - 0.12) / 0.022, 2)) * amp * 0.28;
    v -= Math.exp(-Math.pow((t - 0.24) / 0.028, 2)) * amp * 0.22;
    v += Math.exp(-Math.pow((t - 0.05) / 0.045, 2)) * amp * 0.12;
    v += Math.exp(-Math.pow((t - 0.52) / 0.09, 2)) * amp * (0.2 + notch);
    v += (Math.sin(i * 12.9898) * 43758.5453) % 1 === 0 ? 0 : 0;
    v += (Math.sin(i * 3.13) * 0.5 + Math.sin(i * 7.7) * 0.5) * jitter;
    pts.push(v);
  }
  return pts;
}

export const TWIN_STATES: TwinState[] = [
  {
    key: "healthy",
    timepoint: "T0 — Baseline",
    dateLabel: "12 Mar · 09:14",
    headline: "Physiology within normal limits",
    status: "Stable",
    ef: 62,
    hr: 68,
    bp: "118 / 74",
    spo2: 98,
    cardiacOutput: 5.4,
    strain: -20.4,
    riskScore: 11,
    riskBand: "Low",
    riskDelta: "reference",
    severity: 0.05,
    lesion: [0.75, -0.15, 0.55],
    labs: [
      { label: "hs-Troponin T", unit: "ng/L", value: 6, ref: [0, 14] },
      { label: "NT-proBNP", unit: "pg/mL", value: 48, ref: [0, 125] },
      { label: "Creatinine", unit: "mg/dL", value: 0.9, ref: [0.6, 1.2], precision: 2 },
      { label: "CRP", unit: "mg/L", value: 1.8, ref: [0, 5], precision: 1 },
      { label: "LDL-C", unit: "mg/dL", value: 96, ref: [0, 100] },
      { label: "Potassium", unit: "mmol/L", value: 4.2, ref: [3.5, 5.1], precision: 1 },
    ],
    summary:
      "Digital twin reconstruction from contrast CT and transthoracic echo shows symmetric left ventricular geometry with uniform myocardial perfusion. Global longitudinal strain and ejection fraction are preserved. No regional wall-motion abnormality was reproduced by the simulation across three cardiac cycles.",
    findings: [
      "Uniform perfusion across all 17 AHA segments",
      "LV mass index 74 g/m² — normal",
      "No inducible ischaemia at simulated peak stress",
    ],
    actions: ["Continue annual surveillance", "Maintain lipid targets"],
    waveform: wave(1, 0.01, 0),
    perfusionSeries: [
      { segment: "Ant", value: 96 },
      { segment: "Ant-sep", value: 95 },
      { segment: "Inf-sep", value: 97 },
      { segment: "Inf", value: 94 },
      { segment: "Inf-lat", value: 95 },
      { segment: "Ant-lat", value: 96 },
      { segment: "Apex", value: 93 },
    ],
  },
  {
    key: "warning",
    timepoint: "T1 — 6-month follow-up",
    dateLabel: "18 Sep · 10:02",
    headline: "Emerging inferolateral perfusion deficit",
    status: "Watch",
    ef: 51,
    hr: 84,
    bp: "138 / 88",
    spo2: 96,
    cardiacOutput: 4.6,
    strain: -15.2,
    riskScore: 44,
    riskBand: "Moderate",
    riskDelta: "+33 vs baseline",
    severity: 0.5,
    lesion: [0.85, -0.2, 0.5],
    labs: [
      { label: "hs-Troponin T", unit: "ng/L", value: 21, ref: [0, 14] },
      { label: "NT-proBNP", unit: "pg/mL", value: 310, ref: [0, 125] },
      { label: "Creatinine", unit: "mg/dL", value: 1.14, ref: [0.6, 1.2], precision: 2 },
      { label: "CRP", unit: "mg/L", value: 6.4, ref: [0, 5], precision: 1 },
      { label: "LDL-C", unit: "mg/dL", value: 138, ref: [0, 100] },
      { label: "Potassium", unit: "mmol/L", value: 4.9, ref: [3.5, 5.1], precision: 1 },
    ],
    summary:
      "Simulation now reproduces a reduced-flow territory in the inferolateral wall consistent with a moderate stenosis of the obtuse marginal branch. Ejection fraction has fallen 11 points and global longitudinal strain is impaired. Biomarker drift (troponin, NT-proBNP, LDL-C) supports an evolving ischaemic process rather than measurement noise.",
    findings: [
      "Perfusion reserve reduced to 1.9 in inferolateral segments",
      "Regional strain −9.8% (basal inferolateral)",
      "Simulated FFR 0.79 in OM1 territory",
    ],
    actions: [
      "Escalate to high-intensity statin",
      "Stress perfusion imaging within 4 weeks",
      "Ambulatory BP monitoring",
    ],
    waveform: wave(0.86, 0.03, 0.12),
    perfusionSeries: [
      { segment: "Ant", value: 88 },
      { segment: "Ant-sep", value: 86 },
      { segment: "Inf-sep", value: 79 },
      { segment: "Inf", value: 68 },
      { segment: "Inf-lat", value: 58 },
      { segment: "Ant-lat", value: 74 },
      { segment: "Apex", value: 81 },
    ],
  },
  {
    key: "critical",
    timepoint: "T2 — Acute presentation",
    dateLabel: "04 Feb · 03:41",
    headline: "Transmural ischaemia with pump failure",
    status: "Critical",
    ef: 34,
    hr: 118,
    bp: "94 / 61",
    spo2: 91,
    cardiacOutput: 3.1,
    strain: -8.6,
    riskScore: 87,
    riskBand: "High",
    riskDelta: "+76 vs baseline",
    severity: 1,
    lesion: [0.9, -0.35, 0.45],
    labs: [
      { label: "hs-Troponin T", unit: "ng/L", value: 1840, ref: [0, 14] },
      { label: "NT-proBNP", unit: "pg/mL", value: 4120, ref: [0, 125] },
      { label: "Creatinine", unit: "mg/dL", value: 1.68, ref: [0.6, 1.2], precision: 2 },
      { label: "CRP", unit: "mg/L", value: 28.7, ref: [0, 5], precision: 1 },
      { label: "LDL-C", unit: "mg/dL", value: 151, ref: [0, 100] },
      { label: "Potassium", unit: "mmol/L", value: 5.6, ref: [3.5, 5.1], precision: 1 },
    ],
    summary:
      "The twin reproduces a large transmural low-flow region spanning inferior, inferolateral and apical territories with akinetic wall motion. Ejection fraction is severely depressed at 34% and cardiac output has dropped below 3.5 L/min. Biomarker profile and simulated haemodynamics are consistent with an acute coronary occlusion complicated by early cardiogenic decompensation.",
    findings: [
      "Akinesis across 5 contiguous AHA segments",
      "Simulated FFR 0.41 — occlusive lesion",
      "Filling pressure estimate 26 mmHg",
    ],
    actions: [
      "Activate cath lab — immediate revascularisation",
      "Initiate cardiogenic shock protocol",
      "Continuous rhythm and lactate monitoring",
    ],
    waveform: wave(0.62, 0.07, 0.34),
    perfusionSeries: [
      { segment: "Ant", value: 71 },
      { segment: "Ant-sep", value: 66 },
      { segment: "Inf-sep", value: 47 },
      { segment: "Inf", value: 31 },
      { segment: "Inf-lat", value: 22 },
      { segment: "Ant-lat", value: 44 },
      { segment: "Apex", value: 28 },
    ],
  },
];

export const RISK_TREND = [
  { t: "T0", risk: 11, ef: 62 },
  { t: "T0+2m", risk: 18, ef: 60 },
  { t: "T0+4m", risk: 29, ef: 56 },
  { t: "T1", risk: 44, ef: 51 },
  { t: "T1+3m", risk: 58, ef: 47 },
  { t: "T1+5m", risk: 71, ef: 41 },
  { t: "T2", risk: 87, ef: 34 },
];

export const PIPELINE_STEPS = [
  { label: "Ingesting DICOM series", detail: "412 slices · 0.6 mm isotropic" },
  { label: "Segmenting chambers & myocardium", detail: "nnU-Net cardiac v4" },
  { label: "Extracting coronary tree", detail: "centreline + lumen radius" },
  { label: "Fusing echo strain & lab timeline", detail: "temporal registration" },
  { label: "Solving electro-mechanical model", detail: "3 cardiac cycles · FEM" },
  { label: "Rendering patient-specific twin", detail: "perfusion colour map" },
];

export const formatLab = (l: Lab) => l.value.toFixed(l.precision ?? 0);
export const labStatus = (l: Lab): "normal" | "high" | "low" =>
  l.value > l.ref[1] ? "high" : l.value < l.ref[0] ? "low" : "normal";
