// Builds the personal plan from what the user told us in onboarding (equipment, days, time, goal).
// Output has the same shape as WORKOUTS ({A:{title,items}, B:{...}}) plus schedule, notes and shopping tips.

const DAY_SETS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5] }; // Mon/Thu · Mon/Wed/Fri · Mon/Tue/Thu/Fri

// Which exercises to keep for short sessions (most value first).
const SHORT = { A: ["goblet_squat", "floor_press", "db_row", "plank"], B: ["rdl", "pushup", "reverse_lunge", "dead_bug"] };

function defaultEquipment() {
  return { chair: true, mat: true, table: true, backpack: false };
}

// Loads the user can actually lift: their dumbbells, else a filled backpack, else water bottles.
function loadsFor(s) {
  if (s.dumbbells && s.dumbbells.length) return [...s.dumbbells].sort((a, b) => a - b);
  const eq = s.equipment || defaultEquipment();
  const l = [1, 2]; // 1 L / 2 L water bottles
  if (eq.backpack) l.push(+s.backpackKg || 5);
  return [...new Set(l)].sort((a, b) => a - b);
}
function loadLabel(s, kg) {
  if (!kg) return "BW";
  if (s.dumbbells && s.dumbbells.length) return kg + " kg";
  const eq = s.equipment || {};
  if (eq.backpack && kg === (+s.backpackKg || 5)) return `${kg} kg 🎒`;
  return `${kg} kg 🧴`;
}

function buildProgram(s) {
  const eq = Object.assign(defaultEquipment(), s.equipment || {});
  const days = s.daysPerWeek || 3, minutes = s.minutes || 45, goal = s.goal || "muscle";
  const hasDb = !!(s.dumbbells && s.dumbbells.length);
  const loads = loadsFor(s), heaviest = loads[loads.length - 1] || 0;

  const exNote = {};
  const add = (id, txt) => (exNote[id] = (exNote[id] ? exNote[id] + " " : "") + txt);
  if (!hasDb) {
    const pack = eq.backpack ? `a backpack filled with books (~${+s.backpackKg || 5} kg)` : "water bottles (1–2 L)";
    ["goblet_squat", "rdl", "db_row", "glute_bridge"].forEach((id) => add(id, `No dumbbells: use ${pack}.`));
    ["floor_press", "shoulder_press", "biceps_curl", "lateral_raise", "oh_triceps"].forEach((id) => add(id, "No dumbbells: use water bottles."));
  }
  if (!eq.chair) {
    add("shoulder_press", "No chair: do it standing, glutes squeezed, ribs down.");
    add("oh_triceps", "No chair: do it standing.");
    add("db_row", "No bench: put your free hand on a bed or sofa edge.");
  }
  if (!eq.table) add("pushup", "No table: do them against a wall or kitchen counter, or on your knees.");
  if (!eq.mat) ["plank", "dead_bug", "glute_bridge", "floor_press"].forEach((id) => add(id, "Use a carpet or folded blanket under you."));

  const fit = goal === "fit";
  const W = {};
  for (const L of ["A", "B"]) {
    let items = WORKOUTS[L].items.map((it) => ({ ...it }));
    if (minutes <= 30) items = items.filter((it) => SHORT[L].includes(it.id));
    if (fit) items = items.map((it) => EXERCISES[it.id].type === "time"
      ? { ...it, min: it.min + 10, max: it.max + 15 } : { ...it, min: it.min + 4, max: it.max + 5 });
    if (minutes >= 60) items = items.map((it, i) => (i < 3 ? { ...it, sets: it.sets + 1 } : it));
    items.forEach((it) => { it.note = exNote[it.id] || ""; it.rest = fit ? 45 : (EXERCISES[it.id].start >= 5 || it.id === "pushup" ? 90 : 60); });
    W[L] = { title: WORKOUTS[L].title, items };
  }

  const notes = [], buy = [];
  if (!hasDb) buy.push("A pair of adjustable dumbbells (2–10 kg each) — the single best upgrade for building muscle at home.");
  else if (heaviest <= 5) buy.push(`Your heaviest dumbbell is ${heaviest} kg. Legs and back will outgrow it in ~4–8 weeks — then get adjustable dumbbells (up to 10–20 kg).`);
  if (!eq.mat) buy.push("An exercise mat (optional) — makes floor exercises comfier.");
  if (days === 2) notes.push("2 days a week works — each session trains your whole body. Try to add a 3rd day once it feels routine.");
  if (days === 4) notes.push("4 days: alternate A and B, never two hard days in a row more than once a week. Sleep matters more now.");
  if (minutes <= 30) notes.push("30-minute sessions: the 4 most important exercises each day, short rests.");
  if (minutes >= 60) notes.push("60-minute sessions: an extra set on the first three exercises.");
  if (fit) notes.push("Fat-loss focus: higher reps, 45 s rests, and a 30-minute walk on every non-training day. Food matters most — a small calorie deficit with high protein.");
  else notes.push("Muscle focus: 8–15 reps, 60–90 s rests, eat enough protein (~1.6 g per kg bodyweight).");

  return {
    W, days: DAY_SETS[days] || DAY_SETS[3], daysPerWeek: days, minutes, goal, loads, hasDb, notes, buy,
    summary: `${days} days a week · ~${minutes} min · ${fit ? "get fit & lose fat" : "build muscle"}`
  };
}
