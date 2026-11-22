// @ts-nocheck -- Plain JavaScript, kept as it was written for the page this came from.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* A forest glade in soft toon shading: chunky trees all around, and on the
   left a sword resting in a sandstone pedestal, lit by a few shafts of light.
   The camera is fixed. Everything is generated in code, so there are no model
   or texture files to ship. */

const FOG = 0x7ccdb2;
const CAM = new THREE.Vector3(0, 3.8, 17);
const LOOK = new THREE.Vector3(0, 3.0, 0);
const DAIS = { x: -4.3, z: 0.8 };
const TREES = [                                     // x, z, size
  [-11.5, 0.4, 1.3], [-8.6, -4.6, 1.2], [-4.2, -6.6, 1.3], [-0.4, -8.2, 1.2], [3.6, -9.2, 1.35],
  [7.6, -8.0, 1.25], [11.6, -6.2, 1.4], [15.0, -2.4, 1.3], [-15.5, -3.5, 1.5], [-13.0, -9.5, 1.6],
  [-7.0, -13.5, 1.7], [0.5, -15.5, 1.8], [7.5, -15.0, 1.7], [14.5, -12.5, 1.7], [21.0, -8.0, 1.6],
  [-21.0, -9.0, 1.7], [-18.0, -16.0, 1.9], [22.0, -16.0, 1.9],
];

// deterministic random, so the scene is the same on every visit
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// gentle ground: flat around the pedestal, rolling further out, rising into soft hills at the horizon
function groundH(x, z) {
  const d = Math.hypot(x, z - 4);
  return 0.05 * Math.sin(x * 1.3) * Math.cos(z * 1.1)
       + 0.4 * Math.sin(x * 0.23 + 1) * Math.cos(z * 0.19) * smooth(6, 16, d)
       + 4.5 * smooth(18, 60, d);
}

// soft, rounded lumps instead of sharp facets
function lumpy(geo, amount, seed) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 2.7 + seed) + Math.sin(v.y * 3.1 + seed * 1.7) + Math.sin(v.z * 2.9 + seed * 0.6)
            + 0.5 * Math.sin(v.x * 6.1 + v.y * 5.3 + seed) + 0.5 * Math.sin(v.z * 6.7 - v.y * 4.9 + seed * 2.0);
    const k = 1 + amount * n / 4;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

// paint a geometry's vertices with a colour chosen per vertex
function paint(geo, fn) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  const v = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(v.fromBufferAttribute(p, i), col);
    c.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}

export function startScene(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG, 20, 62);          // far trees and hills melt into the backdrop
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 160);

  const rnd = rng(1998);
  const rr = (a, b) => a + rnd() * (b - a);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler();
  const pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
  const UP = new THREE.Vector3(0, 1, 0);
  const uTime = { value: 0 };

  // cel shading: light falls off in a few soft steps instead of a smooth ramp
  const ramp = new THREE.DataTexture(new Uint8Array([105, 165, 215, 255]), 4, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...opts });
  const add = (mesh, cast = true, receive = true) => { mesh.castShadow = cast; mesh.receiveShadow = receive; scene.add(mesh); return mesh; };

  /* ---------- backdrop: deeper teal overhead, pale and misty toward the horizon ---------- */
  {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2f8f86');
    grad.addColorStop(0.45, '#63bfa6');
    grad.addColorStop(0.62, '#7ccdb2');
    grad.addColorStop(1, '#7ccdb2');
    g.fillStyle = grad; g.fillRect(0, 0, 16, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  }

  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight(0xfff6de, 0x3f7a66, 1.0));
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.0);
  sun.position.set(9, 18, 9);                         // from the upper right, matching the light shafts
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  /* ---------- the ground ---------- */
  {
    const grass = new THREE.Color(0x77c653), grassLight = new THREE.Color(0x9bd95f), grassDark = new THREE.Color(0x56a84a), dirt = new THREE.Color(0xd9953f);
    const geo = new THREE.RingGeometry(0.001, 75, 128, 64);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, groundH(p.getX(i), p.getZ(i)));
    geo.computeVertexNormals();
    paint(geo, (v, c) => {
      const n = Math.sin(v.x * 0.9 + 1.2) * Math.cos(v.z * 0.8 - 0.5) + 0.5 * Math.sin(v.x * 2.1 + v.z * 1.7);
      c.copy(grass).lerp(n > 0 ? grassLight : grassDark, Math.min(1, Math.abs(n)) * 0.55);
      // worn orange earth around the roots, as in a painted backdrop
      let near = 9;
      for (const [tx, tz, ts] of TREES) near = Math.min(near, Math.hypot(v.x - tx, v.z - tz) / ts);
      c.lerp(dirt, (1 - smooth(1.0, 2.1, near)) * 0.9);
    });
    add(new THREE.Mesh(geo, toon(0xffffff, { vertexColors: true })), false, true);
  }

  /* ---------- trees: fat trunks, bushy crowns, little leaves poking out ---------- */
  {
    const trunkGeo = new THREE.LatheGeometry(
      [[1.35, 0], [1.05, 0.22], [0.78, 0.8], [0.62, 1.9], [0.66, 2.8], [0.95, 3.5]].map(([r, y]) => new THREE.Vector2(r, y)), 22);
    lumpy(trunkGeo, 0.1, 5);
    const barkLo = new THREE.Color(0xb78152), barkHi = new THREE.Color(0x8a5c3c);
    paint(trunkGeo, (v, c) => c.copy(barkLo).lerp(barkHi, smooth(1.2, 3.4, v.y)));
    const trunks = new THREE.InstancedMesh(trunkGeo, toon(0xffffff, { vertexColors: true }), TREES.length);

    const crownGeo = lumpy(new THREE.IcosahedronGeometry(1, 4), 0.2, 9);
    const leafTop = new THREE.Color(0x3d9a62), leafLow = new THREE.Color(0x1a5a4b);
    paint(crownGeo, (v, c) => c.copy(leafLow).lerp(leafTop, smooth(-0.5, 0.9, v.y)));
    const blobs = [];
    TREES.forEach(([x, z, s], i) => {
      q.setFromEuler(e.set(0, rr(0, 6.28), 0));
      const gy = groundH(x, z);
      m4.compose(pos.set(x, gy - 0.08, z), q, scl.set(s, s, s));
      trunks.setMatrixAt(i, m4);
      // a big central mass with smaller ones bulging off it
      const R = 2.5 * s, cy = gy + 3.2 * s + R * 0.72;
      blobs.push({ x, y: cy, z, r: R, sy: 0.86 });
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + rr(-0.4, 0.4), d = R * rr(0.55, 0.75), r = R * rr(0.5, 0.68);
        blobs.push({ x: x + Math.cos(a) * d, y: cy + rr(-0.5, 0.9) * s, z: z + Math.sin(a) * d, r, sy: 0.9 });
      }
    });
    trunks.instanceMatrix.needsUpdate = true;
    add(trunks);

    const crowns = new THREE.InstancedMesh(crownGeo, toon(0xffffff, { vertexColors: true }), blobs.length);
    blobs.forEach((b, i) => {
      q.setFromEuler(e.set(rr(-0.3, 0.3), rr(0, 6.28), rr(-0.3, 0.3)));
      m4.compose(pos.set(b.x, b.y, b.z), q, scl.set(b.r, b.r * b.sy, b.r));
      crowns.setMatrixAt(i, m4);
      crowns.setColorAt(i, col.setScalar(rr(0.9, 1.08)));
    });
    crowns.instanceMatrix.needsUpdate = true;
    crowns.instanceColor.needsUpdate = true;
    add(crowns);

    // leaves: small teardrops standing off the surface of each crown
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.34, 0.1, 0.3, 0.42, 0, 0.56);
    shape.bezierCurveTo(-0.3, 0.42, -0.34, 0.1, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(shape, 6);
    const PER = 30, N = blobs.length * PER;
    const leaves = new THREE.InstancedMesh(leafGeo, toon(0xffffff, { side: THREE.DoubleSide }), N);
    const tones = [0x57c26e, 0x3fa862, 0x2c8a58, 0x17544a, 0x123f3c].map(c => new THREE.Color(c));
    const dir = new THREE.Vector3(), out = new THREE.Vector3();
    let n = 0;
    for (const b of blobs) {
      for (let i = 0; i < PER; i++) {
        dir.set(rr(-1, 1), rr(-0.25, 1), rr(-1, 1)).normalize();
        pos.set(b.x + dir.x * b.r * 0.96, b.y + dir.y * b.r * b.sy * 0.96, b.z + dir.z * b.r * 0.96);
        out.copy(dir).addScaledVector(UP, 0.3).normalize();
        q.setFromUnitVectors(UP, out).multiply(q2.setFromAxisAngle(UP, rr(0, 6.28)));
        const s = rr(0.75, 1.3);
        m4.compose(pos, q, scl.set(s, s, s));
        leaves.setMatrixAt(n, m4);
        // lighter leaves up top where the sun hits, darker ones underneath
        const t = Math.min(tones.length - 1, Math.max(0, Math.floor((1 - dir.y) * 2.2 + rr(-0.6, 0.9))));
        leaves.setColorAt(n++, tones[t]);
      }
    }
    leaves.instanceMatrix.needsUpdate = true;
    leaves.instanceColor.needsUpdate = true;
    add(leaves, false, false);
  }

  /* ---------- the pedestal ring ---------- */
  const dais = new THREE.Group();
  dais.position.set(DAIS.x, 0, DAIS.z);
  dais.scale.setScalar(1.15);
  scene.add(dais);
  const sand = toon(0xe4d2a2), sandMid = toon(0xcbb684), sandDark = toon(0xa38c5c);
  const piece = (geo, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    dais.add(m);
    return m;
  };
  {
    piece(new THREE.CylinderGeometry(2.25, 2.35, 0.16, 48), sandMid, 0, 0.08, 0);
    // a ring of chunky rounded blocks, open at the front with a step up
    const COUNT = 12;
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      if (i === 0) continue;                              // the gap, facing the viewer
      const h = rr(0.5, 0.78), w = rr(1.0, 1.22);
      const block = piece(new RoundedBoxGeometry(w, h, 0.62, 3, 0.13), i % 2 ? sand : sandMid, Math.sin(a) * 2.45, h / 2 + 0.02, Math.cos(a) * 2.45, a);
      block.rotation.z = rr(-0.05, 0.05);
    }
    piece(new RoundedBoxGeometry(1.25, 0.22, 0.7, 3, 0.08), sand, 0, 0.13, 2.5);
    // the central stone
    piece(new RoundedBoxGeometry(1.75, 1.2, 1.5, 4, 0.2), sand, 0, 0.72, 0);
    piece(new RoundedBoxGeometry(1.35, 0.3, 1.15, 3, 0.1), sandMid, 0, 1.42, 0);
    // a carved panel on the front, with three small gold triangles
    piece(new RoundedBoxGeometry(0.95, 0.6, 0.08, 3, 0.04), sandDark, 0, 0.74, 0.74);
    const tri = new THREE.Shape();
    tri.moveTo(-0.115, 0); tri.lineTo(0.115, 0); tri.lineTo(0, 0.2); tri.closePath();
    const triGeo = new THREE.ShapeGeometry(tri);
    const gold = toon(0xffcf4a, { emissive: 0x8a5a00, emissiveIntensity: 0.5 });
    for (const [x, y] of [[-0.115, 0.56], [0.115, 0.56], [0, 0.76]]) piece(triGeo, gold, x, y, 0.785).castShadow = false;
  }

  let glow;
  /* ---------- the sword ----------
     Proportions follow the real design: a wide blade, a compact thick guard about
     twice the blade's width, and a long slim grip. */
  {
    const sword = new THREE.Group();
    sword.position.set(0, 1.5, 0);
    sword.rotation.z = 0.04;
    sword.scale.setScalar(1.0);
    dais.add(sword);
    const part = (geo, mat, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.castShadow = true;
      sword.add(m);
      return m;
    };
    const extrude = (shape, depth, bevel) => {
      const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 20 });
      g.translate(0, 0, -depth / 2);
      return g;
    };
    // a closed outline from points; entries with six numbers are bezier curves. sx mirrors it for the left side.
    const outline2d = (pts, sx = 1) => {
      const sh = new THREE.Shape();
      sh.moveTo(sx * pts[0][0], pts[0][1]);
      for (const q of pts.slice(1)) {
        if (q.length === 2) sh.lineTo(sx * q[0], q[1]);
        else sh.bezierCurveTo(sx * q[0], q[1], sx * q[2], q[3], sx * q[4], q[5]);
      }
      sh.closePath();
      return sh;
    };
    const edgeSteel = toon(0xe8f4fb, { emissive: 0x7fc0e0, emissiveIntensity: 0.1 });   // pale bevelled edges
    const blue = toon(0x86c6ea, { emissive: 0x3f8fc0, emissiveIntensity: 0.12 });        // the blue face of the blade
    const mark = toon(0xcdeeff);
    const hilt = toon(0x3d3cab), hiltLight = toon(0x5d60d4), hiltDark = toon(0x2a2a82);
    const wrapMat = toon(0x5fd0b4), gold = toon(0xf2b53a, { emissive: 0x9a5a00, emissiveIntensity: 0.4 });
    const G = 2.45;                                   // height of the middle of the guard

    // ---- blade: wide, with a short narrow neck under the guard. Its lower end is hidden in the stone.
    const bladePts = [[0.26, -0.35], [0.26, G - 0.54], [0.26, G - 0.42, 0.13, G - 0.44, 0.13, G - 0.32], [0.13, G - 0.05]];
    const b = new THREE.Shape();
    b.moveTo(...bladePts[0]);
    b.lineTo(...bladePts[1]);
    b.bezierCurveTo(...bladePts[2]);
    b.lineTo(...bladePts[3]);
    b.lineTo(-0.13, G - 0.05); b.lineTo(-0.13, G - 0.32);
    b.bezierCurveTo(-0.13, G - 0.44, -0.26, G - 0.42, -0.26, G - 0.54);
    b.lineTo(-0.26, -0.35);
    b.closePath();
    part(extrude(b, 0.05, 0.045), edgeSteel);
    part(new RoundedBoxGeometry(0.34, G - 0.16, 0.16, 2, 0.03), blue, 0, (G - 0.84) / 2, 0);   // blue face
    part(new RoundedBoxGeometry(0.16, 0.42, 0.16, 2, 0.03), blue, 0, G - 0.34, 0);        // and up the neck
    const tri = new THREE.Shape();
    tri.moveTo(-0.07, 0); tri.lineTo(0.07, 0); tri.lineTo(0, 0.12); tri.closePath();
    const triGeo = new THREE.ShapeGeometry(tri);
    for (const z of [0.083, -0.083]) for (const [x, y] of [[-0.07, G - 0.84], [0.07, G - 0.84], [0, G - 0.72]]) {
      const t = part(triGeo, mark, x, y, z);          // the mark etched into the blade
      t.castShadow = false;
      if (z < 0) t.rotation.y = Math.PI;
    }
    for (const sx of [-1, 1]) part(new RoundedBoxGeometry(0.085, 0.1, 0.2, 2, 0.025), gold, sx * 0.165, G - 0.3, 0);   // gold studs on the neck

    // ---- guard: compact and thick. Each wing has a small peak at the shoulder, then curves out and
    // down to a point; a second, smaller feather curls under it beside the blade.
    const WING = [[0.13, 0.11], [0.22, 0.11, 0.3, 0.14, 0.37, 0.22],          // up to the shoulder peak
                  [0.5, 0.15, 0.63, -0.04, 0.64, -0.31],                       // over and down to the tip
                  [0.54, -0.17, 0.4, -0.05, 0.15, -0.08]];                     // the underside, back to the hilt
    const CURL = [[0.13, -0.06], [0.3, -0.05, 0.41, -0.15, 0.43, -0.37], [0.35, -0.25, 0.27, -0.2, 0.14, -0.21]];
    const RIM = [[0.24, 0.1], [0.3, 0.11, 0.34, 0.14, 0.37, 0.17], [0.48, 0.11, 0.58, -0.04, 0.61, -0.22],
                 [0.55, -0.07, 0.46, 0.05, 0.36, 0.1], [0.32, 0.08, 0.28, 0.07, 0.24, 0.07]];
    for (const sx of [-1, 1]) {
      part(extrude(outline2d(WING, sx), 0.13, 0.045), hilt, 0, G, 0);
      part(extrude(outline2d(RIM, sx), 0.225, 0.008), hiltLight, 0, G, 0);     // a lighter edge along the top
      part(extrude(outline2d(CURL, sx), 0.17, 0.04), hiltDark, 0, G, 0);
    }
    part(new RoundedBoxGeometry(0.32, 0.32, 0.27, 4, 0.09), hilt, 0, G - 0.03, 0);   // the block the wings grow from
    for (const z of [0.15, -0.15]) {                  // gold gem with a short tail toward the blade
      const gem = part(new THREE.OctahedronGeometry(0.085), gold, 0, G - 0.03, z);
      gem.scale.set(1, 1.45, 0.6);
      const tail = part(new THREE.ConeGeometry(0.032, 0.17, 8), gold, 0, G - 0.22, z * 0.9);
      tail.rotation.x = Math.PI;
    }
    // the rounded bell above the guard, with a rim
    const bell = new THREE.LatheGeometry([[0.001, G + 0.08], [0.2, G + 0.1], [0.235, G + 0.14], [0.225, G + 0.19], [0.17, G + 0.27], [0.11, G + 0.33], [0.085, G + 0.37]].map(([r, y]) => new THREE.Vector2(r, y)), 32);
    part(bell, hilt);
    const rim = part(new THREE.TorusGeometry(0.225, 0.03, 10, 32), hiltLight, 0, G + 0.15, 0);
    rim.rotation.x = Math.PI / 2;

    // ---- grip: long and slim, dark, with a teal criss-cross wrap (two flat ribbons wound in opposite directions)
    const g0 = G + 0.35, g1 = g0 + 1.05;
    part(new THREE.CylinderGeometry(0.07, 0.078, g1 - g0, 18), hiltDark, 0, (g0 + g1) / 2, 0);
    for (const hand of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 90; i++) {
        const t = i / 90, a = hand * t * Math.PI * 2 * 3;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.078, g0 + 0.04 + t * (g1 - g0 - 0.08), Math.sin(a) * 0.078));
      }
      const wrap = part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.03, 8), wrapMat);
      wrap.scale.set(0.9, 1, 0.9);             // pressed into the grip, like a flat ribbon
    }
    // ---- a soft blue glow, breathing, where the blade meets the stone
    {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(200,235,255,1)');
      grad.addColorStop(0.35, 'rgba(120,180,255,.55)');
      grad.addColorStop(1, 'rgba(90,140,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      glow.position.set(0, 0.75, 0.25);
      sword.add(glow);
    }

    // ---- pommel: a collar, a small bulb and a point
    const pommel = new THREE.LatheGeometry([[0.075, g1 - 0.02], [0.13, g1 + 0.01], [0.13, g1 + 0.06], [0.085, g1 + 0.09], [0.12, g1 + 0.15], [0.125, g1 + 0.2], [0.09, g1 + 0.27], [0.04, g1 + 0.33], [0.001, g1 + 0.4]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
    part(pommel, hilt);
  }

  /* ---------- shafts of light falling on the pedestal ---------- */
  const shafts = [];
  {
    const geo = new THREE.PlaneGeometry(1, 1);
    for (const [x, z, w, strength] of [[-1.5, -0.6, 1.5, 0.9], [0.1, -1.2, 1.0, 0.7], [1.3, -0.3, 1.7, 1.0], [2.9, -1.5, 0.9, 0.6]]) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime, uPhase: { value: rr(0, 6.28) }, uStrength: { value: strength } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `
          varying vec2 vUv; uniform float uTime, uPhase, uStrength;
          void main() {
            float side = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            float fall = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
            float breathe = 0.8 + 0.2 * sin(uTime * 0.35 + uPhase);
            gl_FragColor = vec4(vec3(1.0, 0.98, 0.86) * side * fall * breathe * uStrength * 0.1, 1.0);
          }`,
      });
      const m = new THREE.Mesh(geo, mat);
      const LEN = 13, lean = -0.5;                        // leaning over from the upper right
      m.scale.set(w, LEN, 1);
      m.rotation.z = lean;
      m.position.set(DAIS.x + x - Math.sin(lean) * LEN / 2, Math.cos(lean) * LEN / 2 + 0.1, DAIS.z + z);
      scene.add(m);
      shafts.push(m);
    }
  }

  /* ---------- where things may be planted ---------- */
  const clear = (x, z, pad = 0) => {
    if (Math.hypot(x - DAIS.x, z - DAIS.z) < 3.4 + pad) return false;
    for (const [tx, tz, ts] of TREES) if (Math.hypot(x - tx, z - tz) < 1.25 * ts + pad) return false;
    return true;
  };
  // somewhere in the part of the glade the camera can see; `front` pulls it toward the viewer
  const spot = (pad, front = 0) => {
    for (let i = 0; i < 60; i++) {
      const z = front ? rr(-1, 11) : rr(-12, 11);
      const x = rr(-1, 1) * (7 + (17 - z) * 0.75);
      if (clear(x, z, pad)) return [x, z];
    }
    return [0, 6];
  };

  /* ---------- grass tufts ---------- */
  {
    const blades = [];
    for (const [x, lean, h] of [[-0.07, 0.35, 0.34], [0, 0, 0.46], [0.07, -0.35, 0.36]]) {
      const g = new THREE.ConeGeometry(0.055, h, 4, 1);
      g.translate(0, h / 2, 0);
      g.rotateZ(lean);
      g.translate(x, 0, 0);
      blades.push(g);
    }
    const tuft = mergeGeometries(blades);
    const N = 2600;
    const mesh = new THREE.InstancedMesh(tuft, toon(0xffffff), N);
    const lo = new THREE.Color(0x3f9a45), hi = new THREE.Color(0x8fd35c);
    for (let i = 0; i < N; i++) {
      const [x, z] = spot(-0.25);
      const s = rr(0.8, 1.7);
      q.setFromEuler(e.set(0, rr(0, 6.28), 0));
      m4.compose(pos.set(x, groundH(x, z), z), q, scl.set(s, s * rr(0.8, 1.3), s));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.copy(lo).lerp(hi, rnd()));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    add(mesh, false, true);
  }

  /* ---------- flowers ---------- */
  {
    const flower = (petalCount, len, wide) => {
      const parts = [];
      for (let i = 0; i < petalCount; i++) {
        const g = new THREE.CircleGeometry(wide, 8);
        g.scale(1, len / wide, 1);
        g.translate(0, len * 0.9, 0);
        g.rotateX(-0.22);
        g.rotateZ((i / petalCount) * Math.PI * 2);
        parts.push(g);
      }
      const head = mergeGeometries(parts);
      head.rotateX(-Math.PI / 2);
      return head;
    };
    const eye = new THREE.SphereGeometry(0.07, 10, 6);
    eye.scale(1, 0.6, 1);
    const stem = new THREE.CylinderGeometry(0.016, 0.016, 1, 5);
    stem.translate(0, -0.5, 0);
    // [geometry, how many, petal colours, centre colour, height range, size range, leaning toward the front]
    const kinds = [
      [flower(4, 0.13, 0.1), 110, [0xfffdf2], 0xf6c945, [0.06, 0.12], [1.0, 1.6], 0],        // small white ones lying in the grass
      [flower(9, 0.17, 0.062), 90, [0xf2472f, 0xf7cb3d, 0xf58a2e], 0xfff0a8, [0.3, 0.6], [1.1, 1.8], 1],   // taller daisies toward the front
    ];
    for (const [geo, N, petals, centre, hRange, sRange, front] of kinds) {
      const heads = new THREE.InstancedMesh(geo, toon(0xffffff, { side: THREE.DoubleSide }), N);
      const eyes = new THREE.InstancedMesh(eye, toon(centre), N);
      const stems = new THREE.InstancedMesh(stem, toon(0x3f8a48), N);
      for (let i = 0; i < N; i++) {
        const [x, z] = spot(0.15, front);
        const gy = groundH(x, z), h = rr(hRange[0], hRange[1]), s = rr(sRange[0], sRange[1]);
        q.setFromEuler(e.set(rr(-0.3, 0.3) + front * 0.35, rr(0, 6.28), rr(-0.3, 0.3)));
        m4.compose(pos.set(x, gy + h, z), q, scl.set(s, s, s));
        heads.setMatrixAt(i, m4);
        eyes.setMatrixAt(i, m4);
        heads.setColorAt(i, col.set(petals[Math.floor(rnd() * petals.length)]));
        m4.compose(pos, q.identity(), scl.set(1, h, 1));
        stems.setMatrixAt(i, m4);
      }
      heads.instanceColor.needsUpdate = true;
      for (const m of [heads, eyes, stems]) { m.instanceMatrix.needsUpdate = true; add(m, false, true); }
    }
  }

  /* ---------- a few round stones ---------- */
  {
    const geo = lumpy(new THREE.IcosahedronGeometry(1, 3), 0.22, 3);
    for (let i = 0; i < 26; i++) {
      const [x, z] = spot(0.3);
      const s = rr(0.22, 0.5);
      const m = new THREE.Mesh(geo, toon(i % 2 ? 0xcfd6c4 : 0xb3bcae));
      m.position.set(x, groundH(x, z) + s * 0.3, z);
      m.scale.set(s * rr(1, 1.4), s * rr(0.6, 0.85), s);
      m.rotation.y = rr(0, 6.28);
      add(m);
    }
  }

  /* ---------- floating golden orbs ---------- */
  let orbs;
  {
    const N = 80;
    const p = new Float32Array(N * 3), seed = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      p.set([rr(-17, 17), rr(0.6, 10), rr(-12, 9)], i * 3);
      seed.set([rnd() * 6.28, rr(0.3, 1), rr(0.5, 1.5), rnd()], i * 4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    orbs = new THREE.ShaderMaterial({
      uniforms: { uTime, uScale: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec4 aSeed;
        uniform float uTime, uScale;
        varying float vA;
        void main() {
          float t = uTime * aSeed.y * 0.5;
          vec3 p = position + vec3(sin(t * 0.7 + aSeed.x) * 0.7, sin(t * 0.9 + aSeed.x * 2.0) * 0.6, cos(t * 0.6 + aSeed.x * 1.3) * 0.7);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vA = 0.55 + 0.45 * sin(uTime * 0.8 * aSeed.z + aSeed.x * 9.0);
          gl_PointSize = uScale * aSeed.z * 0.9 / -mv.z;
        }`,
      fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float core = smoothstep(0.42, 0.3, d);            // a solid disc...
          float halo = pow(max(1.0 - d, 0.0), 2.0) * 0.45;  // ...with a soft glow around it
          gl_FragColor = vec4(vec3(1.0, 0.88, 0.5) * (core * 0.9 + halo) * vA, 1.0);
        }`,
    });
    const pts = new THREE.Points(geo, orbs);
    pts.frustumCulled = false;
    scene.add(pts);
  }

  /* ---------- post-processing ---------- */
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.6, 0.97);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* The camera never moves. On wide screens the pedestal sits in the left third;
     on tall ones the view is centred on it and shifted up, above the text. */
  const resize = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    const tall = w / h < 1.1;
    camera.aspect = w / h;
    camera.fov = tall ? 56 : 38;
    camera.position.set(tall ? DAIS.x : CAM.x, CAM.y, CAM.z);
    camera.lookAt(tall ? DAIS.x : LOOK.x, LOOK.y, LOOK.z);
    if (tall) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    orbs.uniforms.uScale.value = h * dpr;
    for (const s of shafts) s.rotation.y = Math.atan2(camera.position.x - s.position.x, camera.position.z - s.position.z);
  };
  resize();
  addEventListener('resize', resize);

  /* ---------- animate (the camera stays put) ---------- */
  const clock = new THREE.Clock();
  const render = () => {
    uTime.value = reduced ? 8 : clock.getElapsedTime();
    const beat = 0.5 + 0.5 * Math.sin(uTime.value * 1.4);
    glow.scale.setScalar(2.3 + beat * 0.5);
    glow.material.opacity = 0.32 + beat * 0.2;
    composer.render();
  };
  renderer.setAnimationLoop(render);

  return { resize, stop: () => { renderer.setAnimationLoop(null); removeEventListener('resize', resize); } };
}
