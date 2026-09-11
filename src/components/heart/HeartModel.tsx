import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildHeartGeometry, buildVesselTrunks } from "./geometry";
import type { StateKey } from "@/lib/twin-data";

const vertexShader = /* glsl */ `
attribute float aField;
uniform float uTime;
uniform float uBeat;
uniform float uSeverity;
uniform vec3 uLesion;
varying float vField;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vPos;

void main(){
  vec3 p = position;
  float d = distance(normalize(position + vec3(0.0, 0.25, 0.0)), normalize(uLesion));
  float lesion = exp(-pow(d / 0.78, 2.0)) * uSeverity;
  // contraction: healthy tissue squeezes, ischaemic tissue stays akinetic
  float contract = uBeat * (1.0 - lesion * 0.95) * 0.055;
  p -= normal * contract;
  p.y += contract * 0.35 * (1.0 - smoothstep(-1.2, 1.0, position.y));

  vField = clamp(aField * (1.0 - 0.92 * lesion) - 0.06 * uSeverity, 0.0, 1.0);
  vPos = p;
  vNormalW = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform float uTime;
varying float vField;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vPos;
uniform float uState;

vec3 stateColor(float state, float lvMask, float rvMask, float atriaMask){
  vec3 neutral = vec3(0.886, 0.910, 0.941); // #e2e8f0
  vec3 warningLv = vec3(0.929, 0.537, 0.212); // #ed8936
  vec3 criticalLv = vec3(0.773, 0.188, 0.188); // #c53030
  vec3 criticalRv = vec3(0.929, 0.537, 0.212); // #ed8936
  vec3 criticalAtria = vec3(0.867, 0.420, 0.125); // #dd6b20

  if(state < 0.5){
    return neutral;
  }

  if(state < 1.5){
    return mix(neutral, warningLv, lvMask);
  }

  vec3 crit = neutral;
  crit = mix(crit, criticalAtria, atriaMask);
  crit = mix(crit, criticalRv, rvMask);
  crit = mix(crit, criticalLv, lvMask);
  return crit;
}

void main(){
  vec3 n = normalize(vNormalW);
  float atriaMask = smoothstep(0.30, 0.75, vPos.y);
  float rvMask = (1.0 - atriaMask) * (1.0 - smoothstep(-0.35, 0.12, vPos.x));
  float lvMask = (1.0 - atriaMask) * (1.0 - rvMask);
  float sumMasks = max(lvMask + rvMask + atriaMask, 0.0001);
  lvMask /= sumMasks;
  rvMask /= sumMasks;
  atriaMask /= sumMasks;

  vec3 base = stateColor(uState, lvMask, rvMask, atriaMask);
  // Fine surface variation and anatomical grooves keep the shell from reading
  // as a perfectly smooth decorative blob.
  float striation = 0.018 * sin(vPos.y * 28.0 + vPos.x * 9.0 + vPos.z * 13.0);
  float avGroove = exp(-pow((vPos.y - 0.42) / 0.055, 2.0));
  float septalGroove = exp(-pow((vPos.x + 0.04) / 0.075, 2.0)) * (1.0 - atriaMask);
  base *= 0.96 + striation;
  base *= 1.0 - 0.25 * max(avGroove, septalGroove);
  vec3 l1 = normalize(vec3(0.6, 0.8, 0.9));
  vec3 l2 = normalize(vec3(-0.7, 0.2, -0.5));
  float diff = max(dot(n, l1), 0.0) * 0.75 + max(dot(n, l2), 0.0) * 0.25;
  vec3 h = normalize(l1 + vViewDir);
  float spec = pow(max(dot(n, h), 0.0), 42.0) * 0.55;
  float fres = pow(1.0 - max(dot(n, vViewDir), 0.0), 2.2);

  vec3 col = base * (0.42 + 0.78 * diff) + vec3(spec) + base * fres * 0.5;
  float alpha = clamp(uOpacity * (0.55 + 0.6 * fres), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

interface Props {
  severity: number;
  lesion: [number, number, number];
  bpm: number;
  stateKey: StateKey;
  mode: "perfusion" | "xray";
  autoRotate: boolean;
  onBeat?: () => void;
}

const STATE_TO_INDEX: Record<StateKey, number> = {
  healthy: 0,
  warning: 1,
  critical: 2,
};

export function HeartModel({ severity, lesion, bpm, stateKey, mode, onBeat }: Props) {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { invalidate } = useThree();

  const geometry = useMemo(() => buildHeartGeometry(), []);
  const trunks = useMemo(() => buildVesselTrunks(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBeat: { value: 0 },
      uSeverity: { value: severity },
      uLesion: { value: new THREE.Vector3(...lesion) },
      uState: { value: STATE_TO_INDEX[stateKey] ?? 0 },
      uOpacity: { value: 0.92 },
    }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    trunks.forEach((t) => t.dispose());
  }, [geometry, trunks]);

  const phase = useRef(0);
  const lastBeat = useRef(0);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const u = (matRef.current?.uniforms ?? uniforms) as typeof uniforms;
    phase.current = (phase.current + (dt * bpm) / 60) % 1;
    const t = phase.current;
    const beat =
      Math.exp(-Math.pow((t - 0.16) / 0.11, 2)) +
      0.35 * Math.exp(-Math.pow((t - 0.42) / 0.13, 2));
    u.uBeat.value = beat;
    u.uTime.value = state.clock.elapsedTime;
    u.uSeverity.value = THREE.MathUtils.damp(
      u.uSeverity.value,
      severity,
      3,
      dt,
    );
    u.uLesion.value.lerp(new THREE.Vector3(...lesion), 1 - Math.exp(-3 * dt));
    u.uState.value = STATE_TO_INDEX[stateKey] ?? 0;
    u.uOpacity.value = THREE.MathUtils.damp(
      u.uOpacity.value,
      mode === "xray" ? 0.34 : 0.92,
      4,
      dt,
    );
    if (t < lastBeat.current) onBeat?.();
    lastBeat.current = t;
    invalidate();
  });

  return (
    <group ref={group} rotation={[0.12, -0.35, 0.06]} position={[0, -0.25, 0]}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={mode === "perfusion"}
        />
      </mesh>

      {trunks.map((g, i) => (
        <mesh key={`trunk-${i}`} geometry={g}>
          <meshStandardMaterial
            color={i === 0 ? "#3b5bdb" : i === 1 ? "#2b6ed8" : "#4a4fd4"}
            roughness={0.3}
            metalness={0.15}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

    </group>
  );
}
