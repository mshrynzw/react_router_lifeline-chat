import { useEffect, useRef } from "react";
import * as THREE from "three";
// import GUI from "lil-gui";

/** 粒子数（スクリーンショットの各スライダーに合わせる。合計は各部の和と一致） */
const DEFAULT_FIGURE = 6500;
const DEFAULT_FLOW = 8000;
const DEFAULT_BG = 12000;

const NOISE3 = `
float hash31(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}
float fbm3(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  mat3 m = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
  for (int i = 0; i < 4; i++) {
    s += a * (noise3(p) * 2.0 - 1.0);
    p = m * p * 2.1;
    a *= 0.5;
  }
  return s;
}
`;

const figureVertexShader = `
${NOISE3}
attribute vec3 instanceBasePosition;
attribute vec3 instanceRandomOffset;
attribute float instanceNoiseSeed;

uniform float uTime;
uniform float uBreath;
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uTimeScale;
uniform float uSizeMin;
uniform float uSizeMax;

void main() {
  float seed = instanceNoiseSeed;
  float t = uTime * uTimeScale;
  vec3 base = instanceBasePosition;

  float n = fbm3(vec3(base.xy * 0.35, t * 0.15 + seed));
  float n2 = fbm3(vec3(base.xy * 0.55 + 5.0, t * 0.1));

  vec3 wobble = vec3(
    sin(t * 0.65 + seed * 6.2831853),
    sin(t * 0.5 + seed * 4.17),
    sin(t * 0.45 + seed * 2.91)
  ) * 0.85;

  wobble += instanceRandomOffset * sin(t * 0.22 + seed * 3.1) * 0.6;
  wobble += vec3(n, n * 0.55, n2 * 0.45) * 1.25;

  vec3 pos = base + wobble;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = 1.0 + pos.z * 0.018;
  float sizeVar = mix(uSizeMin, uSizeMax, fract(seed * 17.371));
  gl_PointSize = sizeVar * uPixelRatio * uBreath * depth;
}
`;

const figureFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uAlphaTest;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float glow = 1.0 - smoothstep(0.18, 0.5, r);
  float core = 1.0 - smoothstep(0.0, 0.22, r);
  float a = (glow * 0.55 + core * 0.35) * uOpacity;
  if (a <= uAlphaTest) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const flowVertexShader = `
${NOISE3}
attribute vec3 instanceBasePosition;
attribute vec3 instanceRandomOffset;
attribute float instanceNoiseSeed;

uniform float uTime;
uniform float uBreath;
uniform float uPixelRatio;
uniform float uPointSize;
uniform vec2 uCentroid;
uniform float uTimeScale;
uniform float uSizeMin;
uniform float uSizeMax;

void main() {
  float seed = instanceNoiseSeed;
  float t = uTime * uTimeScale;
  vec3 base = instanceBasePosition;

  vec2 rc = base.xy - uCentroid;
  float ang = atan(rc.y, rc.x);
  float r = length(rc);
  vec2 perp = vec2(-rc.y, rc.x) / max(r, 0.45);

  float headAura = smoothstep(-2.0, 10.0, base.y - uCentroid.y);
  float lift = 0.55 + 0.75 * headAura;

  float spiral = sin(t * 0.26 + ang * 2.4 + seed * 6.2831853);
  float swirl = cos(t * 0.2 + ang * 1.7 + seed * 4.1);

  vec3 stream = vec3(
    perp.x * (1.1 + 0.4 * spiral) + swirl * 0.35,
    lift * (0.9 + 0.5 * sin(t * 0.18 + seed * 5.0)),
    perp.y * (1.1 + 0.4 * spiral) * 0.85
  );

  stream *= 1.35 + 0.5 * headAura;

  float n = fbm3(vec3(base.xy * 0.22, t * 0.1 + seed));
  float n2 = fbm3(vec3(base.xy * 0.38 + 3.0, t * 0.08));
  vec3 wobble = vec3(n, n * 0.62, n2 * 0.5) * 1.45;

  wobble += instanceRandomOffset * sin(t * 0.19 + seed * 3.3) * 0.75;

  vec3 pos = base + stream * sin(t * 0.24 + seed * 6.28) * 2.1 + wobble;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = 1.0 + pos.z * 0.016;
  float soft = mix(uSizeMin, uSizeMax, fract(seed * 13.17));
  float bokeh = mix(1.0, 1.45, headAura * 0.6);
  gl_PointSize = soft * uPixelRatio * uBreath * depth * bokeh * 1.12;
}
`;

const flowFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uAlphaTest;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float glow = 1.0 - smoothstep(0.12, 0.52, r);
  float core = 1.0 - smoothstep(0.0, 0.2, r);
  float a = (glow * 0.42 + core * 0.22) * uOpacity;
  if (a <= uAlphaTest) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const bgVertexShader = `
${NOISE3}
attribute float aSeed;
attribute float aPhase;
varying float vSeed;
varying float vPhase;

uniform float uTime;
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uTimeScale;
uniform float uSizeMin;
uniform float uSizeMax;

void main() {
  vSeed = aSeed;
  vPhase = aPhase;
  vec3 pos = position;
  float t = uTime * uTimeScale;
  float drift = t * 0.35 * 1.1 + aSeed * 0.4;
  pos.y += drift * 1.8;
  pos.x += sin(drift * 0.7 + aSeed * 12.0) * 2.5;
  pos.z += cos(drift * 0.5 + aPhase) * 1.2;
  pos.y = mod(pos.y + 45.0, 90.0) - 45.0;

  float n = fbm3(vec3(pos.xy * 0.06, t * 0.2 + aSeed));
  pos.xy += vec2(n, n * 0.8) * 1.5;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float pulse = 0.65 + 0.35 * sin(uTime * uTimeScale * 0.5 + aPhase);
  float sz = mix(uSizeMin, uSizeMax, fract(aSeed * 9.1));
  gl_PointSize = sz * uPixelRatio * 0.85 * pulse * 0.72;
}
`;

const bgFragmentShader = `
uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;
uniform float uAlphaTest;
varying float vSeed;
varying float vPhase;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float glow = 1.0 - smoothstep(0.25, 0.5, r);
  float tw = 0.35 + 0.45 * sin(uTime * 0.4 + vPhase + vSeed * 3.0);
  float a = glow * tw * 0.22 * uOpacity;
  if (a <= uAlphaTest) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

async function sampleSilhouette(
  imageUrl: string,
  targetCount: number,
): Promise<Float32Array> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("silhouette load failed"));
  });

  const maxW = 640;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(1, Math.floor(img.naturalWidth * scale));
  const h = Math.max(1, Math.floor(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (a > 20 && l > 55) candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) {
    return generateFallbackFigure(targetCount);
  }

  const out = new Float32Array(targetCount * 3);
  const cw = w;
  const ch = h;
  for (let i = 0; i < targetCount; i++) {
    const c = candidates[Math.floor(Math.random() * candidates.length)]!;
    const nx = (c.x / cw) * 2 - 1;
    const ny = -((c.y / ch) * 2 - 1);
    const aspect = cw / ch;
    out[i * 3] = nx * 14 * aspect;
    out[i * 3 + 1] = ny * 14 - 4.5;
    out[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  return out;
}

function generateFallbackFigure(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = 3 + Math.sqrt(Math.random()) * 10;
    out[i * 3] = Math.cos(t) * r * 0.55;
    out[i * 3 + 1] = Math.sin(t) * r * 0.95 - 6;
    out[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  return out;
}

function computeCentroid(positions: Float32Array, count: number): THREE.Vector2 {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < count; i++) {
    cx += positions[i * 3];
    cy += positions[i * 3 + 1];
  }
  const n = Math.max(1, count);
  return new THREE.Vector2(cx / n, cy / n);
}

function buildFlowPositions(
  basePositions: Float32Array,
  figureCount: number,
  flowCount: number,
  centroid: THREE.Vector2,
): Float32Array {
  const out = new Float32Array(flowCount * 3);
  for (let i = 0; i < flowCount; i++) {
    const src = Math.floor(Math.random() * figureCount) * 3;
    const bx = basePositions[src];
    const by = basePositions[src + 1];
    const bz = basePositions[src + 2];
    const outward = Math.random() * Math.PI * 2;
    const r = 4.5 + Math.random() * 18;
    const sp = 0.5 + Math.random() * 0.95;
    out[i * 3] = bx + Math.cos(outward) * r * sp;
    out[i * 3 + 1] = by + Math.sin(outward) * r * sp * 0.86 + (Math.random() - 0.5) * 5;
    out[i * 3 + 2] = bz + (Math.random() - 0.5) * 12;
    if (by > centroid.y - 0.5) {
      out[i * 3 + 1] += Math.random() * 3.5;
    }
  }
  return out;
}

function disposePoints(points: THREE.Points) {
  points.geometry.dispose();
  const m = points.material;
  if (!Array.isArray(m)) m.dispose();
}

export interface ParticleGuiControls {
  particleCount: number;
  figureCount: number;
  flowCount: number;
  bgCount: number;
  opacity: number;
  alphaTest: number;
  minSize: number;
  maxSize: number;
  hue: number;
  saturation: number;
  lightness: number;
  motionSpeed: number;
}

function applyColor(
  mats: [THREE.ShaderMaterial, THREE.ShaderMaterial, THREE.ShaderMaterial],
  c: ParticleGuiControls,
) {
  const col = new THREE.Color().setHSL(c.hue, c.saturation, c.lightness);
  mats[0].uniforms.uColor.value.copy(col);
  mats[1].uniforms.uColor.value.copy(col);
  mats[2].uniforms.uColor.value.copy(col);
}

function applyVisualUniforms(
  mats: [THREE.ShaderMaterial, THREE.ShaderMaterial, THREE.ShaderMaterial],
  c: ParticleGuiControls,
) {
  applyColor(mats, c);
  for (const m of mats) {
    m.uniforms.uOpacity.value = c.opacity;
    m.uniforms.uAlphaTest.value = c.alphaTest;
    m.uniforms.uTimeScale.value = c.motionSpeed;
    m.uniforms.uSizeMin.value = c.minSize;
    m.uniforms.uSizeMax.value = Math.max(c.minSize + 0.01, c.maxSize);
  }
}

export function MeditationParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let cleanup: (() => void) | undefined;

    const clock = new THREE.Clock();
    const imageUrl = `${import.meta.env.BASE_URL}images/silhouette.webp`;

    const controls: ParticleGuiControls = {
      particleCount: DEFAULT_FIGURE + DEFAULT_FLOW + DEFAULT_BG,
      figureCount: DEFAULT_FIGURE,
      flowCount: DEFAULT_FLOW,
      bgCount: DEFAULT_BG,
      opacity: 1,
      alphaTest: 0.51,
      minSize: 7.3,
      maxSize: 2.3,
      hue: 0.592,
      saturation: 0.506678,
      lightness: 0.592766,
      motionSpeed: 0.71,
    };

    // --- lil-gui（必要ならコメントを外して調整） ---
    // const gui = new GUI({ title: "瞑想パーティクル調整" });
    // gui.domElement.style.position = "fixed";
    // gui.domElement.style.top = "56px";
    // gui.domElement.style.right = "16px";
    // gui.domElement.style.zIndex = "60";

    let matsRef: [
      THREE.ShaderMaterial,
      THREE.ShaderMaterial,
      THREE.ShaderMaterial,
    ] | null = null;
    let rendererRef: THREE.WebGLRenderer | null = null;
    let cameraRef: THREE.PerspectiveCamera | null = null;
    let raf = 0;
    let rebuildSeq = 0;

    // const syncTotalFromParts = () => {
    //   controls.particleCount = controls.figureCount + controls.flowCount + controls.bgCount;
    // };

    // const syncPartsFromTotal = () => {
    //   const t = Math.max(500, controls.particleCount);
    //   controls.figureCount = Math.max(200, Math.floor(t * 0.48));
    //   controls.flowCount = Math.max(100, Math.floor(t * 0.28));
    //   controls.bgCount = Math.max(100, t - controls.figureCount - controls.flowCount);
    // };

    // const fParticles = gui.addFolder("粒子の量");
    // fParticles
    //   .add(controls, "particleCount", 500, 20000, 100)
    //   .name("合計（再分割）")
    //   .onFinishChange(() => {
    //     syncPartsFromTotal();
    //     void rebuildScene();
    //   });
    // fParticles
    //   .add(controls, "figureCount", 200, 15000, 100)
    //   .name("シルエット")
    //   .onFinishChange(() => {
    //     syncTotalFromParts();
    //     void rebuildScene();
    //   });
    // fParticles
    //   .add(controls, "flowCount", 100, 8000, 100)
    //   .name("周辺の流れ")
    //   .onFinishChange(() => {
    //     syncTotalFromParts();
    //     void rebuildScene();
    //   });
    // fParticles
    //   .add(controls, "bgCount", 100, 12000, 100)
    //   .name("背景")
    //   .onFinishChange(() => {
    //     syncTotalFromParts();
    //     void rebuildScene();
    //   });

    // const fLook = gui.addFolder("見た目");
    // fLook.add(controls, "opacity", 0, 1, 0.01).name("透明度").onChange(applyGui);
    // fLook.add(controls, "alphaTest", 0, 0.8, 0.01).name("透過しきい値").onChange(applyGui);
    // fLook.add(controls, "minSize", 1, 24, 0.1).name("サイズ最小").onChange(applyGui);
    // fLook.add(controls, "maxSize", 2, 64, 0.1).name("サイズ最大").onChange(applyGui);
    // fLook.add(controls, "hue", 0, 1, 0.001).name("色相").onChange(applyGui);
    // fLook.add(controls, "saturation", 0, 1, 0.001).name("彩度").onChange(applyGui);
    // fLook.add(controls, "lightness", 0, 1, 0.001).name("明度").onChange(applyGui);
    // fLook.add(controls, "motionSpeed", 0, 4, 0.01).name("動きの速さ").onChange(applyGui);

    // function applyGui() {
    //   if (matsRef) applyVisualUniforms(matsRef, controls);
    // }

    let figurePoints: THREE.Points | null = null;
    let flowPoints: THREE.Points | null = null;
    let bgPoints: THREE.Points | null = null;
    let scene: THREE.Scene | null = null;

    async function rebuildScene() {
      const id = ++rebuildSeq;
      const figN = controls.figureCount;
      const flowN = controls.flowCount;
      const bgN = controls.bgCount;

      let basePositions: Float32Array;
      try {
        basePositions = await sampleSilhouette(imageUrl, figN);
      } catch {
        basePositions = generateFallbackFigure(figN);
      }
      if (destroyed || id !== rebuildSeq) return;

      if (figurePoints && scene) {
        scene.remove(figurePoints);
        disposePoints(figurePoints);
      }
      if (flowPoints && scene) {
        scene.remove(flowPoints);
        disposePoints(flowPoints);
      }
      if (bgPoints && scene) {
        scene.remove(bgPoints);
        disposePoints(bgPoints);
      }

      if (!rendererRef || !cameraRef || !scene) return;

      const renderer = rendererRef;

      const instanceBase = new Float32Array(figN * 3);
      instanceBase.set(basePositions);

      const centroid = computeCentroid(basePositions, figN);

      const instanceRandom = new Float32Array(figN * 3);
      const instanceSeed = new Float32Array(figN);
      for (let i = 0; i < figN; i++) {
        instanceRandom[i * 3] = (Math.random() - 0.5) * 2;
        instanceRandom[i * 3 + 1] = (Math.random() - 0.5) * 2;
        instanceRandom[i * 3 + 2] = (Math.random() - 0.5) * 2;
        instanceSeed[i] = Math.random();
      }

      const flowBase = buildFlowPositions(basePositions, figN, flowN, centroid);
      const flowRandom = new Float32Array(flowN * 3);
      const flowSeed = new Float32Array(flowN);
      for (let i = 0; i < flowN; i++) {
        flowRandom[i * 3] = (Math.random() - 0.5) * 2;
        flowRandom[i * 3 + 1] = (Math.random() - 0.5) * 2;
        flowRandom[i * 3 + 2] = (Math.random() - 0.5) * 2;
        flowSeed[i] = Math.random();
      }

      const figGeo = new THREE.InstancedBufferGeometry();
      figGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
      );
      figGeo.setAttribute(
        "instanceBasePosition",
        new THREE.InstancedBufferAttribute(instanceBase, 3),
      );
      figGeo.setAttribute(
        "instanceRandomOffset",
        new THREE.InstancedBufferAttribute(instanceRandom, 3),
      );
      figGeo.setAttribute(
        "instanceNoiseSeed",
        new THREE.InstancedBufferAttribute(instanceSeed, 1),
      );
      figGeo.instanceCount = figN;

      const makeUniforms = (cent: THREE.Vector2 | null) => ({
        uTime: { value: 0 },
        uBreath: { value: 1 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uPointSize: { value: 1 },
        uTimeScale: { value: controls.motionSpeed },
        uSizeMin: { value: controls.minSize },
        uSizeMax: { value: Math.max(controls.minSize + 0.01, controls.maxSize) },
        uColor: { value: new THREE.Color().setHSL(controls.hue, controls.saturation, controls.lightness) },
        uOpacity: { value: controls.opacity },
        uAlphaTest: { value: controls.alphaTest },
        ...(cent ? { uCentroid: { value: cent.clone() } } : {}),
      });

      const figMat = new THREE.ShaderMaterial({
        uniforms: makeUniforms(null),
        vertexShader: figureVertexShader,
        fragmentShader: figureFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      figurePoints = new THREE.Points(figGeo, figMat);
      scene.add(figurePoints);

      const flowGeo = new THREE.InstancedBufferGeometry();
      flowGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
      );
      flowGeo.setAttribute(
        "instanceBasePosition",
        new THREE.InstancedBufferAttribute(flowBase, 3),
      );
      flowGeo.setAttribute(
        "instanceRandomOffset",
        new THREE.InstancedBufferAttribute(flowRandom, 3),
      );
      flowGeo.setAttribute(
        "instanceNoiseSeed",
        new THREE.InstancedBufferAttribute(flowSeed, 1),
      );
      flowGeo.instanceCount = flowN;

      const flowMat = new THREE.ShaderMaterial({
        uniforms: makeUniforms(centroid),
        vertexShader: flowVertexShader,
        fragmentShader: flowFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      flowPoints = new THREE.Points(flowGeo, flowMat);
      scene.add(flowPoints);

      const bgPos = new Float32Array(bgN * 3);
      const bgSeed = new Float32Array(bgN);
      const bgPhase = new Float32Array(bgN);
      for (let i = 0; i < bgN; i++) {
        if (Math.random() < 0.42) {
          const ang = Math.random() * Math.PI * 2;
          const rr = 22 + Math.random() * 48;
          bgPos[i * 3] = centroid.x + Math.cos(ang) * rr;
          bgPos[i * 3 + 1] = centroid.y + Math.sin(ang) * rr * 0.75 + (Math.random() - 0.5) * 20;
          bgPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
        } else {
          bgPos[i * 3] = (Math.random() - 0.5) * 85;
          bgPos[i * 3 + 1] = (Math.random() - 0.5) * 75;
          bgPos[i * 3 + 2] = (Math.random() - 0.5) * 35;
        }
        bgSeed[i] = Math.random() * 1000;
        bgPhase[i] = Math.random() * Math.PI * 2;
      }

      const bgGeo = new THREE.BufferGeometry();
      bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
      bgGeo.setAttribute("aSeed", new THREE.BufferAttribute(bgSeed, 1));
      bgGeo.setAttribute("aPhase", new THREE.BufferAttribute(bgPhase, 1));

      const bgMat = new THREE.ShaderMaterial({
        uniforms: makeUniforms(null),
        vertexShader: bgVertexShader,
        fragmentShader: bgFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      bgPoints = new THREE.Points(bgGeo, bgMat);
      scene.add(bgPoints);

      matsRef = [figMat, flowMat, bgMat];
      applyVisualUniforms(matsRef, controls);
    }

    void (async () => {
      if (destroyed) return;

      let width = window.innerWidth;
      let height = window.innerHeight;

      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 220);
      camera.position.set(0, 1.5, 58);
      camera.lookAt(0, -5.5, 0);
      cameraRef = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      rendererRef = renderer;

      await rebuildScene();

      if (destroyed) {
        renderer.dispose();
        return;
      }

      container.appendChild(renderer.domElement);

      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (!matsRef || !rendererRef || !cameraRef || !scene) return;
        const t = clock.getElapsedTime();
        const breath = 1.0 + Math.sin(t * 0.3) * 0.02;
        for (const m of matsRef) {
          m.uniforms.uTime.value = t;
          if (m.uniforms.uBreath) m.uniforms.uBreath.value = breath;
        }
        rendererRef.render(scene, cameraRef);
      };
      raf = requestAnimationFrame(animate);

      const onResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        if (!cameraRef || !rendererRef || !matsRef) return;
        cameraRef.aspect = width / height;
        cameraRef.updateProjectionMatrix();
        rendererRef.setSize(width, height);
        rendererRef.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const pr = rendererRef.getPixelRatio();
        for (const m of matsRef) {
          m.uniforms.uPixelRatio.value = pr;
        }
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        if (figurePoints) disposePoints(figurePoints);
        if (flowPoints) disposePoints(flowPoints);
        if (bgPoints) disposePoints(bgPoints);
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        matsRef = null;
        rendererRef = null;
        cameraRef = null;
        scene = null;
      };
    })();

    return () => {
      destroyed = true;
      cleanup?.();
      // gui.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
      aria-hidden
    />
  );
}
