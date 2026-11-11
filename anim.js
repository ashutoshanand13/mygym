// Original animated exercise figures: a flat cartoon character drawn as SVG and tweened between
// a start pose (a) and a finish pose (b). viewBox is 200×150, floor at y=140.
// Points: head, neck, hip, eN/hN (near elbow/hand), eF/hF (far), kN/fN, kF/fF (knees/feet).
// Optional sN/sF (shoulders) and pN/pF (pelvis) for front views; they default to neck/hip.
// hl = body segments highlighted as "working muscles". dbs = hands holding a dumbbell.
const ANIM = {
  goblet_squat: {
    toe: 1, db: "vert", dbs: ["hN"], hl: ["thN", "thF"],
    a: { head: [100, 28], neck: [100, 40], hip: [100, 82], eN: [111, 61], hN: [112, 47], eF: [109, 61], hF: [110, 47], kN: [102, 111], fN: [100, 140], kF: [98, 111], fF: [96, 140] },
    b: { head: [103, 56], neck: [98, 67], hip: [80, 105], eN: [113, 87], hN: [114, 73], eF: [111, 87], hF: [112, 73], kN: [109, 111], kF: [106, 112] }
  },
  floor_press: {
    toe: 1, props: ["mat"], dbs: ["hN", "hF"], hl: ["torso", "uaN"],
    a: { head: [38, 127], neck: [50, 132], hip: [92, 133], eN: [56, 137], hN: [56, 116], eF: [52, 137], hF: [52, 116], kN: [116, 108], fN: [130, 138], kF: [113, 108], fF: [127, 138] },
    b: { eN: [56, 112], hN: [56, 91], eF: [52, 112], hF: [52, 91] }
  },
  db_row: {
    toe: -1, props: ["bench"], dbs: ["hN"], hl: ["uaN", "torso"],
    a: { head: [56, 72], neck: [68, 78], hip: [108, 82], eF: [66, 90], hF: [64, 100], kF: [100, 100], fF: [128, 100], kN: [114, 111], fN: [116, 140], eN: [70, 100], hN: [70, 121] },
    b: { eN: [88, 74], hN: [88, 95] }
  },
  shoulder_press: {
    toe: 1, props: ["chair"], dbs: ["hN", "hF"], hl: ["uaN"],
    a: { head: [98, 46], neck: [98, 58], hip: [96, 102], eN: [112, 72], hN: [110, 53], eF: [110, 72], hF: [108, 53], kN: [126, 103], fN: [126, 140], kF: [123, 103], fF: [123, 140] },
    b: { eN: [101, 38], hN: [101, 17], eF: [99, 38], hF: [99, 17] }
  },
  biceps_curl: {
    toe: 1, dbs: ["hN", "hF"], hl: ["uaN", "faN"],
    a: { head: [100, 28], neck: [100, 40], hip: [100, 82], eN: [101, 62], hN: [102, 84], eF: [99, 62], hF: [100, 84], kN: [101, 111], fN: [101, 140], kF: [99, 111], fF: [99, 140] },
    b: { hN: [116, 49], hF: [114, 49] }
  },
  plank: {
    toe: 0, props: ["mat"], hl: ["torso"], period: 3600,
    a: { head: [152, 106], neck: [140, 112], hip: [96, 119], eN: [140, 136], hN: [160, 136], eF: [137, 136], hF: [157, 136], kN: [66, 127], fN: [36, 135], kF: [66, 127], fF: [36, 135] },
    b: { head: [152, 104], neck: [140, 110], hip: [96, 117] }
  },
  rdl: {
    toe: 1, dbs: ["hN", "hF"], hl: ["thN", "torso"],
    a: { head: [100, 28], neck: [100, 40], hip: [100, 82], eN: [101, 62], hN: [103, 84], eF: [99, 62], hF: [101, 84], kN: [102, 111], fN: [100, 140], kF: [100, 111], fF: [98, 140] },
    b: { head: [136, 64], neck: [125, 69], hip: [86, 84], eN: [125, 91], hN: [125, 112], eF: [123, 91], hF: [123, 112], kN: [97, 111], kF: [95, 111] }
  },
  pushup: {
    toe: 0, props: ["table"], hl: ["torso", "uaN"],
    a: { head: [139, 66], neck: [130, 74], hip: [97, 101], eN: [136, 91], hN: [140, 108], eF: [134, 91], hF: [138, 108], kN: [74, 120], fN: [50, 140], kF: [74, 120], fF: [50, 140] },
    b: { head: [149, 89], neck: [138, 94], hip: [102, 113], eN: [126, 99], eF: [124, 99], kN: [76, 127], kF: [76, 127] }
  },
  reverse_lunge: {
    toe: 1, hl: ["thN", "thF"],
    a: { head: [110, 28], neck: [110, 40], hip: [110, 82], eN: [111, 62], hN: [112, 84], eF: [109, 62], hF: [110, 84], kN: [112, 111], fN: [112, 140], kF: [108, 111], fF: [108, 140] },
    b: { head: [96, 48], neck: [96, 60], hip: [96, 102], eN: [97, 82], hN: [98, 104], eF: [95, 82], hF: [96, 104], kN: [118, 110], kF: [86, 132], fF: [60, 136] }
  },
  lateral_raise: {
    toe: 0, front: true, dbs: ["hN", "hF"], hl: ["uaN", "uaF"],
    a: { head: [100, 24], neck: [100, 36], sN: [88, 42], sF: [112, 42], hip: [100, 82], pN: [93, 82], pF: [107, 82], eN: [84, 63], hN: [82, 84], eF: [116, 63], hF: [118, 84], kN: [92, 111], fN: [91, 140], kF: [108, 111], fF: [109, 140] },
    b: { eN: [68, 45], hN: [48, 47], eF: [132, 45], hF: [152, 47] }
  },
  oh_triceps: {
    toe: 1, props: ["chair"], db: "vert", dbs: ["hN"], hl: ["uaN"],
    a: { head: [98, 46], neck: [98, 58], hip: [96, 102], eN: [103, 36], hN: [86, 47], eF: [101, 36], hF: [84, 47], kN: [126, 103], fN: [126, 140], kF: [123, 103], fF: [123, 140] },
    b: { eN: [101, 37], hN: [101, 16], eF: [99, 37], hF: [99, 16] }
  },
  glute_bridge: {
    toe: 1, props: ["mat"], hl: ["thN", "thF"],
    a: { head: [38, 127], neck: [50, 132], hip: [92, 134], eN: [70, 137], hN: [90, 137], eF: [70, 137], hF: [90, 137], kN: [116, 108], fN: [130, 138], kF: [113, 108], fF: [127, 138] },
    b: { hip: [94, 112], kN: [122, 104], kF: [119, 104] }
  },
  dead_bug: {
    toe: 1, props: ["mat"], hl: ["torso"], period: 3400,
    a: { head: [38, 126], neck: [50, 132], hip: [92, 134], eN: [52, 112], hN: [52, 92], eF: [50, 112], hF: [50, 92], kN: [94, 104], fN: [122, 104], kF: [92, 104], fF: [120, 104] },
    b: { eN: [34, 122], hN: [16, 130], kF: [118, 124], fF: [146, 130] }
  }
};

// Dark gym equipment, lit from the top-left like the figure.
const PROPS_SVG = {
  mat: `<rect x="12" y="136.5" width="166" height="5" rx="2.5" fill="url(#g-dark)" opacity=".9"/>`,
  bench: `<rect x="54" y="103.5" width="82" height="9" rx="3" fill="url(#g-dark)"/><rect x="60" y="112" width="6" height="28" fill="url(#g-metal)"/><rect x="124" y="112" width="6" height="28" fill="url(#g-metal)"/><rect x="54" y="138" width="82" height="3" rx="1.5" fill="url(#g-metal)"/>`,
  chair: `<rect x="75" y="60" width="8" height="51" rx="3" fill="url(#g-dark)"/><rect x="77" y="105.5" width="40" height="7" rx="3" fill="url(#g-dark)"/><rect x="82" y="112" width="5" height="28" fill="url(#g-metal)"/><rect x="107" y="112" width="5" height="28" fill="url(#g-metal)"/>`,
  table: `<rect x="131" y="111.5" width="56" height="7" rx="2.5" fill="url(#g-dark)"/><rect x="136" y="118" width="5" height="22" fill="url(#g-metal)"/><rect x="177" y="118" width="5" height="22" fill="url(#g-metal)"/>`
};

// Tapered capsule between p and q (a "3D" limb), radius r1 at p, r2 at q.
function cap(p, q, r1, r2, fill, outline = true) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 0.01, nx = -dy / L, ny = dx / L;
  const f = (v) => v.toFixed(1);
  const a = [p[0] + nx * r1, p[1] + ny * r1], b = [q[0] + nx * r2, q[1] + ny * r2];
  const c = [q[0] - nx * r2, q[1] - ny * r2], d = [p[0] - nx * r1, p[1] - ny * r1];
  return `<path d="M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}A${r2},${r2} 0 0 0 ${f(c[0])},${f(c[1])}L${f(d[0])},${f(d[1])}A${r1},${r1} 0 0 0 ${f(a[0])},${f(a[1])}Z" fill="${fill}"${outline ? ' stroke="rgba(20,24,30,.22)" stroke-width=".6"' : ""}/>`;
}
const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

function figBody(A, P) {
  const pt = (k) => P[k] || (k[0] === "s" ? P.neck : k[0] === "p" ? P.hip : null);
  const hl = (n) => A.hl.includes(n);
  // muscle "belly" drawn inside a segment, from t0 to t1 along it
  const muscle = (p, q, t0, t1, r1, r2) => cap(along(p, q, t0), along(p, q, t1), r1, r2, "url(#g-mus)", false);

  const leg = (s, skin) => {
    const hp = pt("p" + s), k = pt("k" + s), f = pt("f" + s);
    let out = cap(hp, k, 7, 5, skin) + cap(k, f, 5, 3.6, skin);
    if (hl("sh" + s)) out += muscle(k, f, 0.1, 0.6, 3.8, 2.6);
    if (hl("th" + s)) out += muscle(hp, k, 0.38, 0.92, 5.6, 3.8);
    out += cap(hp, along(hp, k, 0.42), 8, 7.2, "url(#g-dark)"); // shorts
    out += A.toe ? cap(f, [f[0] + A.toe * 7, f[1] + 0.5], 3.6, 3, "url(#g-dark)") : `<circle cx="${f[0]}" cy="${f[1]}" r="3.8" fill="url(#g-dark)"/>`;
    return out;
  };
  const arm = (s, skin) => {
    const sh = pt("s" + s), e = pt("e" + s), h = pt("h" + s);
    let out = cap(sh, e, 5.2, 4, skin) + cap(e, h, 4, 3, skin);
    if (hl("ua" + s)) out += muscle(sh, e, 0.05, 0.85, 4.2, 3);
    if (hl("fa" + s)) out += muscle(e, h, 0.08, 0.6, 3.1, 2.3);
    return out + `<circle cx="${h[0]}" cy="${h[1]}" r="3.6" fill="${skin}" stroke="rgba(20,24,30,.22)" stroke-width=".6"/>`;
  };

  let torso;
  if (A.front) {
    const [sN, sF, pF, pN] = ["sN", "sF", "pF", "pN"].map(pt);
    torso = cap(P.neck, [P.neck[0], sN[1]], 3.5, 4, "url(#g-skin)") +
      `<polygon points="${sN} ${sF} ${pF} ${pN}" fill="url(#g-skin)" stroke="url(#g-skin)" stroke-width="9" stroke-linejoin="round"/>` +
      `<polygon points="${along(pN, sN, 0.12)} ${along(pF, sF, 0.12)} ${pF} ${pN}" fill="url(#g-dark)" stroke="url(#g-dark)" stroke-width="9" stroke-linejoin="round"/>` +
      (hl("torso") ? cap(along(P.neck, P.hip, 0.3), along(P.neck, P.hip, 0.75), 8, 6, "url(#g-mus)", false) : "");
  } else {
    torso = cap(P.neck, P.hip, 11.5, 9.5, "url(#g-skin)") +
      (hl("torso") ? muscle(P.neck, P.hip, 0.12, 0.75, 8.5, 7) : "") +
      `<circle cx="${P.hip[0]}" cy="${P.hip[1]}" r="9.6" fill="url(#g-dark)"/>`;
  }

  const dbs = (A.dbs || []).map((k) => {
    const [x, y] = pt(k);
    return A.db === "vert"
      ? `<rect x="${x - 1.8}" y="${y - 10}" width="3.6" height="20" rx="1" fill="url(#g-metal)"/><rect x="${x - 6.5}" y="${y - 13}" width="13" height="6" rx="2" fill="url(#g-dark)"/><rect x="${x - 6.5}" y="${y + 7}" width="13" height="6" rx="2" fill="url(#g-dark)"/>`
      : `<circle cx="${x}" cy="${y}" r="7" fill="url(#g-dark)"/><circle cx="${x}" cy="${y}" r="4.6" fill="none" stroke="#6b717c" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.8" fill="url(#g-metal)"/>`;
  }).join("");

  const [hx, hy] = P.head;
  const head = cap(P.neck, along(P.neck, P.head, 0.55), 4.2, 4, "url(#g-skin)") +
    `<ellipse cx="${hx}" cy="${hy}" rx="8.6" ry="9.8" fill="url(#g-skin)" stroke="rgba(20,24,30,.22)" stroke-width=".6"/>`;

  const feet = ["fN", "fF"].map(pt);
  const cx = (P.hip[0] + feet[0][0] + feet[1][0]) / 3;
  const shadow = `<ellipse cx="${cx.toFixed(1)}" cy="141" rx="48" ry="5" fill="url(#g-shadow)"/>`;

  const farSkin = A.front ? "url(#g-skin)" : "url(#g-skin-far)";
  return shadow + leg("F", farSkin) + arm("F", farSkin) + torso + leg("N", "url(#g-skin)") + head + arm("N", "url(#g-skin)") + dbs;
}

function lerpPose(A, t) {
  const P = {};
  for (const k in A.a) {
    const a = A.a[k], b = A.b[k] || a;
    P[k] = [+(a[0] + (b[0] - a[0]) * t).toFixed(1), +(a[1] + (b[1] - a[1]) * t).toFixed(1)];
  }
  return P;
}

function figSvg(id) {
  const A = ANIM[id];
  return `<svg viewBox="0 0 200 150" class="fig" data-fig="${id}" role="img" aria-label="Animated demo of ${EXERCISES[id].name}">
    <rect width="200" height="150" fill="url(#g-bg)"/>
    <rect y="140" width="200" height="10" fill="url(#g-floor)"/>
    ${(A.props || []).map((p) => PROPS_SVG[p]).join("")}
    <g class="fig-body">${figBody(A, A.a)}</g></svg>`;
}

// Hold at start, move, hold at finish, return — like a real rep.
const smooth = (x) => x * x * (3 - 2 * x);
function repEase(u) {
  if (u < 0.15) return 0;
  if (u < 0.5) return smooth((u - 0.15) / 0.35);
  if (u < 0.65) return 1;
  return 1 - smooth((u - 0.65) / 0.35);
}
const FIG_T0 = performance.now();
const slowMotion = matchMedia("(prefers-reduced-motion: reduce)").matches ? 2 : 1;
function figLoop(now) {
  if (!document.hidden) {
    document.querySelectorAll("svg[data-fig]").forEach((svg) => {
      if (svg.closest(".paused")) return;
      const A = ANIM[svg.dataset.fig];
      const u = ((now - FIG_T0) / ((A.period || 3000) * slowMotion)) % 1;
      svg.querySelector(".fig-body").innerHTML = figBody(A, lerpPose(A, repEase(u)));
    });
  }
  requestAnimationFrame(figLoop);
}
requestAnimationFrame(figLoop);
