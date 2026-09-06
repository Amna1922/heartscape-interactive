import * as THREE from "three";

/**
 * Procedural bi-ventricular myocardial shell.
 * Parameterised so every vertex also carries an apex->base scalar (aField)
 * used by the perfusion colour map, plus a stable model-space normal.
 */
export function buildHeartGeometry(segU = 96, segV = 120) {
  const positions: number[] = [];
  const fields: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const surface = (u: number, v: number) => {
    // u: 0 = base (top), 1 = apex (bottom)
    const phi = v * Math.PI * 2;
    const y = 1.02 - u * 2.16;

    // silhouette width: full at mid ventricle, pinched at apex, slightly
    // narrowed at the base plane
    const t = u;
    let w = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.52)), 0.72);
    w *= 1 - 0.18 * Math.pow(t, 3.2);
    w = Math.max(w, 0.02);

    // cross-section: dominant LV circle + smaller RV bulge on -x side
    const lobe =
      1 +
      0.2 * Math.cos(phi) +
      0.1 * Math.cos(2 * phi) -
      0.06 * Math.cos(3 * phi + 0.6);
    // atrioventricular sulcus groove near the base
    const groove = 1 - 0.09 * Math.exp(-Math.pow((u - 0.16) / 0.06, 2)) * (1 + 0.4 * Math.cos(phi));

    const r = w * lobe * groove * 0.95;
    const x = Math.cos(phi) * r + 0.06 * Math.sin(u * Math.PI) - 0.12 * u * u;
    const z = Math.sin(phi) * r * 0.86;
    return new THREE.Vector3(x, y - 0.05 * Math.cos(phi) * (1 - u), z);
  };

  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      const p = surface(u, v);
      positions.push(p.x, p.y, p.z);
      uvs.push(v, 1 - u);
      // scalar field: activation-like gradient, apex late, septum early
      const phi = v * Math.PI * 2;
      const f =
        0.56 +
        0.2 * u +
        0.07 * Math.cos(phi + 0.5) * (0.4 + u) +
        0.03 * Math.sin(phi * 3 + u * 6);
      fields.push(f);
    }
  }

  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + segV + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("aField", new THREE.Float32BufferAttribute(fields, 1));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Great vessels rising from the base, echoing the reference anatomy. */
export function buildVesselTrunks() {
  const defs: { pts: [number, number, number][]; r: number }[] = [
    // aortic arch
    {
      pts: [
        [0.05, 0.75, 0.1],
        [0.02, 1.25, 0.05],
        [-0.12, 1.7, -0.02],
        [-0.5, 1.95, -0.05],
        [-0.78, 1.72, -0.02],
        [-0.8, 1.3, 0.06],
      ],
      r: 0.17,
    },
    // pulmonary trunk
    {
      pts: [
        [-0.42, 0.72, 0.3],
        [-0.5, 1.15, 0.28],
        [-0.42, 1.55, 0.2],
        [-0.18, 1.8, 0.12],
      ],
      r: 0.15,
    },
    // superior vena cava
    {
      pts: [
        [0.5, 0.7, -0.1],
        [0.56, 1.2, -0.12],
        [0.52, 1.7, -0.16],
        [0.5, 2.0, -0.18],
      ],
      r: 0.12,
    },
    // brachiocephalic branches
    {
      pts: [
        [-0.3, 1.68, 0.0],
        [-0.28, 2.0, -0.02],
        [-0.3, 2.25, -0.02],
      ],
      r: 0.06,
    },
    {
      pts: [
        [-0.52, 1.86, -0.04],
        [-0.55, 2.15, -0.05],
        [-0.56, 2.32, -0.05],
      ],
      r: 0.055,
    },
  ];

  return defs.map(({ pts, r }) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 40, r, 14, false);
  });
}

/** Branching coronary tree hugging the myocardial surface. */
export function buildCoronaryTree(seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  // must mirror surface() so vessels sit on the myocardium
  const onSurface = (y: number, phi: number) => {
    const u = THREE.MathUtils.clamp((1.02 - y) / 2.16, 0, 1);
    let w = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.52)), 0.72);
    w *= 1 - 0.18 * Math.pow(u, 3.2);
    w = Math.max(w, 0.02);
    const lobe =
      1 + 0.2 * Math.cos(phi) + 0.1 * Math.cos(2 * phi) - 0.06 * Math.cos(3 * phi + 0.6);
    const groove =
      1 - 0.09 * Math.exp(-Math.pow((u - 0.16) / 0.06, 2)) * (1 + 0.4 * Math.cos(phi));
    const r = w * lobe * groove * 0.95 * 1.02;
    return new THREE.Vector3(
      Math.cos(phi) * r + 0.06 * Math.sin(u * Math.PI) - 0.12 * u * u,
      y - 0.05 * Math.cos(phi) * (1 - u),
      Math.sin(phi) * r * 0.86,
    );
  };

  const geoms: THREE.BufferGeometry[] = [];

  const grow = (
    startPhi: number,
    startY: number,
    endY: number,
    twist: number,
    radius: number,
    depth: number,
  ) => {
    const pts: THREE.Vector3[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      const y = THREE.MathUtils.lerp(startY, endY, k);
      const phi = startPhi + twist * k + 0.15 * Math.sin(k * 5 + startPhi);
      pts.push(onSurface(y, phi));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    geoms.push(new THREE.TubeGeometry(curve, 26, radius, 6, false));

    if (depth > 0) {
      const branches = depth > 1 ? 2 : 2;
      for (let b = 0; b < branches; b++) {
        const at = 0.35 + rnd() * 0.45;
        grow(
          startPhi + twist * at,
          THREE.MathUtils.lerp(startY, endY, at),
          Math.max(endY - 0.1 - rnd() * 0.35, -0.92),
          (rnd() - 0.5) * 1.6,
          radius * 0.62,
          depth - 1,
        );
      }
    }
  };

  for (let i = 0; i < 9; i++) {
    const phi = (i / 9) * Math.PI * 2 + 0.3;
    grow(
      phi,
      0.62 - rnd() * 0.12,
      Math.max(-0.7 - rnd() * 0.22, -0.9),
      (rnd() - 0.5) * 1.4,
      0.038,
      2,
    );
  }
  return geoms;
}
