// True-3D exercise demos: a rigged mannequin (Mixamo X Bot) posed procedurally from the same
// start/finish keyframes as anim.js. Each bone is "aimed" along the 2D limb direction of the pose,
// then the figure is grounded on the floor. Working muscles are painted red via skin weights.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0), FWD = V(0, 0, 1);

export async function createViewer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const BG = new THREE.Color("#eef0f3");
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 7, 16);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 50);

  scene.add(new THREE.HemisphereLight("#ffffff", "#b9c0ca", 1.6));
  const key = new THREE.DirectionalLight("#ffffff", 2.4);
  key.position.set(-2.5, 5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#dfe8ff", 0.9);
  rim.position.set(3, 3, -4);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: "#e3e6ea", roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- character ----
  // If you drop a Mixamo character (any, e.g. a bearded man) at models/man.fbx it is used as-is with its
  // own textures. Otherwise the X Bot mannequin is dressed up as a bearded man in code below.
  const url = (p) => new URL(p, import.meta.url).href;
  let model, custom = false;
  // Prefer models/man.glb (made from a Mixamo FBX with tools/convert-fbx.html), then a raw models/man.fbx.
  for (const file of ["man.glb", "man.fbx"]) {
    try {
      const r = await fetch(url("./models/" + file), { method: "HEAD" });
      if (!r.ok) continue;
      if (file.endsWith(".glb")) model = (await new GLTFLoader().loadAsync(url("./models/" + file))).scene;
      else {
        const { FBXLoader } = await import("three/addons/loaders/FBXLoader.js");
        model = await new FBXLoader().loadAsync(url("./models/" + file));
      }
      const h = new THREE.Box3().setFromObject(model).getSize(V()).y;
      model.scale.multiplyScalar(1.8 / h);
      custom = true;
      break;
    } catch (e) { console.warn("Could not load", file, e); model = null; }
  }
  // Default figure: the X Bot mannequin from the three.js examples (a Mixamo character), loaded from the CDN
  // rather than shipped in this repo.
  const XBOT = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/Xbot.glb";
  if (!model) model = (await new GLTFLoader().loadAsync(XBOT)).scene;
  scene.add(model);
  // Mixamo prefixes vary ("mixamorig:", "mixamorig7", …) and FBX files can contain nested duplicate bones;
  // index by the bare name and keep the outermost bone, which drives its duplicates.
  const norm = (n) => n.replace(/^mixamorig\d*:?/, "");
  const boneMap = new Map();
  model.traverse((o) => { if (o.isBone && !boneMap.has(norm(o.name))) boneMap.set(norm(o.name), o); });
  const bone = (n) => boneMap.get(n);
  const rest = new Map();
  model.traverse((o) => {
    if (o.isBone) rest.set(o, o.quaternion.clone());
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; }
  });

  // Finger curl: in the rest (T) pose palms face down, so curling = rotating about the world Z axis
  // (knuckle line). Store that axis in each finger bone's local frame once.
  model.updateMatrixWorld(true);
  const curlAxis = new Map();
  model.traverse((o) => {
    if (o.isBone && /Hand(Index|Middle|Ring|Pinky|Thumb)[123]$/.test(o.name)) {
      const wq = o.getWorldQuaternion(new THREE.Quaternion()).invert();
      curlAxis.set(o, new THREE.Vector3(0, 0, 1).applyQuaternion(wq).normalize());
    }
  });
  const handRest = {};
  for (const s of ["Left", "Right"]) {
    handRest[s] = bone(s + "Hand").getWorldQuaternion(new THREE.Quaternion());
  }
  // Every skinned mesh gets a per-vertex colour channel: outfit/skin regions + red working muscles.
  // For a custom textured character the colours act as a tint over its own textures.
  const surface = [];
  model.traverse((o) => { if (o.isSkinnedMesh) surface.push(o); });
  const skinMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 });
  surface.forEach((m) => {
    if (custom) {
      m.material = (Array.isArray(m.material) ? m.material : [m.material]).map((mt) => { mt = mt.clone(); mt.vertexColors = true; return mt; });
      if (m.material.length === 1) m.material = m.material[0];
    } else m.material = skinMat;
    m.geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(m.geometry.attributes.position.count * 3).fill(1), 3));
  });

  // measure body
  model.updateMatrixWorld(true);
  const wp = (b) => b.getWorldPosition(V());
  const H = wp(bone("HeadTop_End")).y - Math.min(wp(bone("LeftToe_End")).y, wp(bone("LeftFoot")).y - 0.05);
  const torsoLen = wp(bone("Hips")).distanceTo(wp(bone("Neck")));
  const hipsRestWorld = bone("Hips").getWorldQuaternion(new THREE.Quaternion());
  const armLen = wp(bone("RightArm")).distanceTo(wp(bone("RightForeArm"))) + wp(bone("RightForeArm")).distanceTo(wp(bone("RightHand")));

  // ---- equipment ----
  const dark = new THREE.MeshStandardMaterial({ color: "#24272d", roughness: 0.5, metalness: 0.15 });
  const metal = new THREE.MeshStandardMaterial({ color: "#a3a9b2", roughness: 0.25, metalness: 0.85 });
  const k = H / 1.8;
  // Hex rubber dumbbell, colour-coded by weight like real home sets. Built along local Y.
  const DB_COLORS = { 1: "#b06cff", 2: "#22c55e", 3: "#2f7bff", 4: "#14b8a6", 5: "#ff7a1a" };
  const chrome = new THREE.MeshStandardMaterial({ color: "#e9edf2", roughness: 0.15, metalness: 1 });
  function makeDB() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016 * k, 0.016 * k, 0.2 * k, 16), chrome));
    g.plateMat = new THREE.MeshStandardMaterial({ color: "#ff7a1a", roughness: 0.38, metalness: 0.05, emissive: "#000" });
    g.plates = [-1, 1].map((s) => {
      const p = new THREE.Group();
      const hex = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), g.plateMat);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.08, 16), chrome);
      p.add(hex, cap);
      p.userData.s = s;
      g.add(p);
      return p;
    });
    g.traverse((o) => { o.castShadow = true; });
    scene.add(g);
    return g;
  }
  function styleDB(g, kg) {
    const r = (0.044 + 0.005 * Math.min(kg, 6)) * k, t = (0.04 + 0.006 * Math.min(kg, 6)) * k;
    g.plateMat.color.set(DB_COLORS[kg] || "#ff7a1a");
    g.plateMat.emissive.set(DB_COLORS[kg] || "#ff7a1a").multiplyScalar(0.12);
    g.plates.forEach((p) => { p.scale.set(r, t, r); p.position.y = p.userData.s * (0.075 * k + t / 2); });
    g.halfLen = 0.075 * k + t; // centre → outer face
  }
  const dbs = [makeDB(), makeDB()];
  const box = (w, h, d, mat = dark) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = m.receiveShadow = true; return m; };
  const props = {
    mat: box(1.1 * H, 0.012 * H, 0.36 * H),
    seat: box(0.26 * H, 0.035 * H, 0.26 * H), back: box(0.03 * H, 0.32 * H, 0.26 * H),
    bench: box(0.62 * H, 0.05 * H, 0.2 * H), table: box(0.34 * H, 0.03 * H, 0.5 * H),
    legs: Array.from({ length: 4 }, () => box(0.025 * H, 1, 0.025 * H, metal))
  };
  Object.values(props).flat().forEach((m) => scene.add(m));

  // ---- posing ----
  let A = null, near = "Right", far = "Left", facing = V(1, 0, 0), x0 = 0;
  const S = torsoLen / 42; // 2D pose units → metres
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();

  function aim(b, childName, dir) {
    const child = typeof childName === "string" ? bone(childName) : childName;
    const local = child.position.clone().normalize();
    b.getWorldQuaternion(q1);
    const cur = local.applyQuaternion(q1).normalize();
    q2.setFromUnitVectors(cur, dir).multiply(q1);
    b.parent.getWorldQuaternion(q3);
    b.quaternion.copy(q3.invert().multiply(q2));
  }

  function pose(P) {
    for (const [b, q] of rest) b.quaternion.copy(q);
    const pt = (n) => P[n] || (n[0] === "s" ? P.neck : n[0] === "p" ? P.hip : null);
    const d2 = (a, b) => { const p = pt(a), q = pt(b); return V(q[0] - p[0], -(q[1] - p[1]), 0).normalize(); };
    const torso = d2("hip", "neck");

    const hips = bone("Hips");
    const want = new THREE.Quaternion().setFromUnitVectors(UP, torso)
      .multiply(new THREE.Quaternion().setFromUnitVectors(FWD, facing)).multiply(hipsRestWorld);
    hips.parent.getWorldQuaternion(q3);
    hips.quaternion.copy(q3.invert().multiply(want));

    aim(bone("Spine"), "Spine1", torso); aim(bone("Spine1"), "Spine2", torso); aim(bone("Spine2"), "Neck", torso);
    const head = d2("neck", "head");
    aim(bone("Neck"), "Head", head); aim(bone("Head"), "HeadTop_End", head);

    const footDir = A.toe ? facing.clone() : A.front ? FWD.clone() : V(0, -1, 0);
    for (const [s, side] of [["N", near], ["F", far]]) {
      let ua = d2("s" + s, "e" + s), fa = d2("e" + s, "h" + s);
      if (A.db === "vert") {
        // both hands on one dumbbell: angle the arms inward so the hands meet on the midline
        const sz = wp(bone(side + "Arm")).z - model.position.z;
        const dz = -sz / armLen;
        ua = ua.setZ(dz).normalize(); fa = fa.setZ(dz).normalize();
      }
      aim(bone(side + "Arm"), side + "ForeArm", ua);
      aim(bone(side + "ForeArm"), side + "Hand", fa);
      aim(bone(side + "UpLeg"), side + "Leg", d2("p" + s, "k" + s));
      aim(bone(side + "Leg"), side + "Foot", d2("k" + s, "f" + s));
      aim(bone(side + "Foot"), side + "ToeBase", footDir);
      curlFingers(side);
    }

    // place: horizontal from the 2D hip track, vertical by grounding the lowest body point
    model.position.set(0, 0, 0);
    model.position.addScaledVector(A.front ? V(1, 0, 0) : V(1, 0, 0), (P.hip[0] - x0) * S);
    model.updateMatrixWorld(true);
    const contacts = [["Hips", 0.065], ["Spine2", 0.075], ["Head", 0.07], ["HeadTop_End", 0.03], ["LeftToe_End", 0.012], ["RightToe_End", 0.012],
      ["LeftFoot", 0.045], ["RightFoot", 0.045], ["LeftHand", 0.025], ["RightHand", 0.025], ["LeftForeArm", 0.03], ["RightForeArm", 0.03], ["LeftLeg", 0.035], ["RightLeg", 0.035]];
    let minY = Infinity;
    for (const [n, t] of contacts) minY = Math.min(minY, wp(bone(n)).y - t * H);
    model.position.y -= minY;
    model.updateMatrixWorld(true);
    placeGear();
  }

  const holding = (side) => A.db === "vert" ? true : (A.dbs || []).some((h) => (h === "hN" ? near : far) === side);
  const CURL = { 1: 1.05, 2: 1.35, 3: 0.9 };
  function curlFingers(side) {
    if (!holding(side)) return;
    const sign = side === "Left" ? -1 : 1;
    for (const f of ["Index", "Middle", "Ring", "Pinky"]) for (const j of [1, 2, 3]) {
      const b = bone(`${side}Hand${f}${j}`); if (b) b.quaternion.multiply(q1.setFromAxisAngle(curlAxis.get(b), sign * CURL[j]));
    }
    for (const j of [2, 3]) { const b = bone(`${side}HandThumb${j}`); if (b) b.quaternion.multiply(q1.setFromAxisAngle(curlAxis.get(b), sign * 0.6)); }
  }

  // Where the handle sits in a closed fist, and which way it runs (along the knuckle line).
  function gripFrame(side) {
    const hand = wp(bone(side + "Hand")), i1 = wp(bone(side + "HandIndex1")), p1 = wp(bone(side + "HandPinky1"));
    const rel = bone(side + "Hand").getWorldQuaternion(new THREE.Quaternion()).multiply(handRest[side].clone().invert());
    const palm = V(0, -1, 0).applyQuaternion(rel);
    const centre = hand.lerp(i1.clone().add(p1).multiplyScalar(0.5), 0.9).addScaledVector(palm, 0.03 * k);
    return { centre, axis: i1.sub(p1).normalize(), palm };
  }
  function placeGear() {
    dbs.forEach((d) => (d.visible = false));
    const list = A.dbs || [];
    if (A.db === "vert" && list.length) {
      // one dumbbell held upright, both palms cupping the underside of the top plate
      const d = dbs[0]; d.visible = true;
      const a = gripFrame(near).centre, b = gripFrame(far).centre;
      d.position.copy(a.add(b).multiplyScalar(0.5)).addScaledVector(UP, -(d.halfLen - 0.035 * k));
      d.quaternion.identity();
    } else {
      list.forEach((h, i) => {
        const d = dbs[i]; d.visible = true;
        const g = gripFrame(h === "hN" ? near : far);
        d.position.copy(g.centre);
        // every two-dumbbell move in the plan uses an overhand/neutral-side grip: handle runs sideways
        d.quaternion.setFromUnitVectors(UP, FWD);
      });
    }
    // furniture
    const all = [props.mat, props.seat, props.back, props.bench, props.table, ...props.legs];
    all.forEach((m) => (m.visible = false));
    const P = (n) => wp(bone(n));
    const legsUnder = (top, cx, cz, w, d) => props.legs.forEach((l, i) => {
      l.visible = true; l.scale.y = Math.max(0.01, top);
      l.position.set(cx + (i < 2 ? -1 : 1) * (w / 2 - 0.03 * H), top / 2, cz + (i % 2 ? -1 : 1) * (d / 2 - 0.03 * H));
    });
    const want = A.props || [];
    if (want.includes("mat")) { props.mat.visible = true; props.mat.position.set(P("Hips").x, 0.006 * H, 0); }
    if (want.includes("chair")) {
      const hp = P("Hips"), top = hp.y - 0.06 * H;
      props.seat.visible = props.back.visible = true;
      props.seat.position.set(hp.x - facing.x * 0.02 * H, top - 0.0175 * H, 0);
      props.back.position.set(hp.x - facing.x * 0.14 * H, top + 0.16 * H, 0);
      legsUnder(top - 0.035 * H, props.seat.position.x, 0, 0.26 * H, 0.26 * H);
    }
    if (want.includes("bench")) {
      const kn = P(far + "Leg"), hd = P(far + "Hand"), top = Math.min(kn.y - 0.035 * H, hd.y - 0.02 * H);
      const cx = (kn.x + hd.x) / 2;
      props.bench.visible = true; props.bench.position.set(cx, top - 0.025 * H, kn.z * 0.6);
      legsUnder(top - 0.05 * H, cx, kn.z * 0.6, 0.62 * H, 0.2 * H);
    }
    if (want.includes("table")) {
      const hd = P(near + "Hand").add(P(far + "Hand")).multiplyScalar(0.5), top = hd.y - 0.025 * H;
      props.table.visible = true; props.table.position.set(hd.x + 0.06 * H, top - 0.015 * H, 0);
      legsUnder(top - 0.03 * H, hd.x + 0.06 * H, 0, 0.34 * H, 0.5 * H);
    }
  }

  // ---- outfit + muscle paint ----
  const C = (h) => new THREE.Color(h).convertSRGBToLinear();
  const SKIN = C("#d9b39c"), SHIRT = C("#4f78b8"), SHORTS = C("#2c3038"), SHOE = C("#f4f5f7"), RED = C("#d9382a"), WHITE = new THREE.Color(1, 1, 1);
  const region = (n) => custom ? WHITE
    : /Spine|Shoulder/.test(n) ? SHIRT : /Hips|UpLeg/.test(n) ? SHORTS : /Foot|Toe/.test(n) ? SHOE : SKIN;
  const tmp = new THREE.Color();
  function paint() {
    const parts = { th: "UpLeg", sh: "Leg", ua: "Arm", fa: "ForeArm" };
    const names = new Set();
    for (const h of A.hl) {
      if (h === "torso") ["Spine", "Spine1", "Spine2"].forEach((n) => names.add(n));
      else names.add((h.endsWith("N") ? near : far) + parts[h.slice(0, 2)]);
    }
    surface.forEach((m) => {
      const bn = m.skeleton.bones.map((b) => norm(b.name));
      const hot = bn.map((n) => names.has(n));
      const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, col = m.geometry.attributes.color;
      for (let i = 0; i < si.count; i++) {
        let w = 0, best = 0, bestW = -1;
        for (let c = 0; c < 4; c++) {
          const b = si.getComponent(i, c), wt = sw.getComponent(i, c);
          if (hot[b]) w += wt;
          if (wt > bestW) { bestW = wt; best = b; }
        }
        tmp.copy(region(bn[best])).lerp(RED, THREE.MathUtils.smoothstep(w, 0.35, 0.75) * (custom ? 0.65 : 0.85));
        col.setXYZ(i, tmp.r, tmp.g, tmp.b);
      }
      col.needsUpdate = true;
    });
  }

  // ---- face, hair and beard for the X Bot (built in the rest pose, then parented to the head bone) ----
  if (!custom) {
    const hb = new THREE.Box3(), pv = V();
    surface.forEach((m) => {
      const hi = m.skeleton.bones.findIndex((b) => /Head$/.test(b.name));
      const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
      for (let i = 0; i < si.count; i++) for (let c = 0; c < 4; c++)
        if (si.getComponent(i, c) === hi && sw.getComponent(i, c) > 0.6) { m.getVertexPosition(i, pv); m.localToWorld(pv); hb.expandByPoint(pv); }
    });
    const hc = hb.getCenter(V()), hs = hb.getSize(V());
    const face = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({ color: "#2a1d14", roughness: 0.95 });
    const skinM = new THREE.MeshStandardMaterial({ color: "#c9a089", roughness: 0.62 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: "#1a1410", roughness: 0.3 });
    const blob = (mat, sx, sy, sz, x, y, z, geo = new THREE.SphereGeometry(1, 28, 18)) => {
      const m = new THREE.Mesh(geo, mat); m.scale.set(sx * hs.x, sy * hs.y, sz * hs.z);
      m.position.set(hc.x + x * hs.x, hc.y + y * hs.y, hc.z + z * hs.z); m.castShadow = true; face.add(m); return m;
    };
    blob(hairMat, 0.47, 0.34, 0.4, 0, -0.22, 0.1);           // beard
    blob(hairMat, 0.5, 0.2, 0.44, 0, -0.1, 0.04);            // jaw / sideburn fill
    blob(hairMat, 0.2, 0.045, 0.1, 0, -0.06, 0.45);          // moustache
    const hair = blob(hairMat, 0.535, 0.55, 0.55, 0, 0.02, -0.03, new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.44));
    hair.rotation.x = -0.32;
    for (const s of [-1, 1]) {
      blob(eyeMat, 0.055, 0.05, 0.03, s * 0.17, 0.07, 0.47);  // eyes
      blob(hairMat, 0.13, 0.025, 0.05, s * 0.17, 0.14, 0.46); // eyebrows
      blob(skinM, 0.06, 0.13, 0.1, s * 0.5, 0.01, 0);         // ears
    }
    blob(skinM, 0.065, 0.09, 0.09, 0, 0.0, 0.5);             // nose
    scene.add(face);
    bone("Head").attach(face);
  }

  function frameCamera() {
    const bb = new THREE.Box3();
    for (const t of [0, 0.5, 1]) {
      pose(lerpPose(A, t));
      model.traverse((o) => { if (o.isBone) bb.expandByPoint(wp(o)); });
      dbs.forEach((d) => d.visible && bb.expandByPoint(d.position));
    }
    bb.expandByPoint(V(bb.min.x, 0, bb.min.z));
    const c = bb.getCenter(V()), size = bb.getSize(V());
    const dir = A.front ? V(0.28, 0.16, 1).normalize() : V(facing.x * 0.55, 0.2, 1).normalize();
    const aspect = camera.aspect, fov = THREE.MathUtils.degToRad(camera.fov);
    const need = Math.max(size.y * 1.25, (Math.max(size.x, size.z) * 1.2) / aspect);
    const dist = need / (2 * Math.tan(fov / 2)) + 0.45;
    camera.position.copy(c).addScaledVector(dir, dist);
    camera.lookAt(c);
    key.target.position.copy(c); key.target.updateMatrixWorld();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (A) frameCamera();
  }
  new ResizeObserver(resize).observe(canvas);

  let t0 = performance.now(), paused = false, pausedAt = 0, running = true, frozen = null, active = true;
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (!A || !active || document.hidden || !canvas.isConnected) return;
    if (frozen !== null) pose(lerpPose(A, frozen));
    else pose(lerpPose(A, repEase((((paused ? pausedAt : now) - t0) / (A.period || 3000)) % 1)));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  return {
    H,
    show(id) {
      A = ANIM[id];
      facing = A.front ? V(0, 0, 1) : V(A.toe < 0 ? -1 : 1, 0, 0);
      [near, far] = A.toe < 0 ? ["Left", "Right"] : ["Right", "Left"];
      x0 = A.a.hip[0];
      const kg = EXERCISES[id].start || 2;
      dbs.forEach((d) => styleDB(d, kg));
      paint(); resize(); frameCamera();
      t0 = performance.now(); frozen = null;
    },
    // freeze at a given point of the rep (0 = start, 1 = finish) — used for previews/thumbnails
    freeze(t) { frozen = t; },
    setActive(on) { active = on; if (on) { paused = false; t0 = performance.now(); } },
    debug() {
      const w = (n) => wp(bone(n)).toArray().map((x) => +x.toFixed(2));
      return { H, hips: w("Hips"), neck: w("Neck"), rFoot: w("RightFoot"), rToe: w("RightToeBase"), rKnee: w("RightLeg"), rHand: w("RightHand"), lHand: w("LeftHand"), eye: w("RightEye"), cam: camera.position.toArray().map((x) => +x.toFixed(2)) };
    },
    snapshot(t = 0) { pose(lerpPose(A, t)); renderer.render(scene, camera); return canvas.toDataURL("image/jpeg", 0.85); },
    togglePause() {
      if (paused) t0 += performance.now() - pausedAt; else pausedAt = performance.now();
      paused = !paused; return paused;
    },
    dispose() { running = false; renderer.dispose(); }
  };
}
