// FirstRep — local-only beginner dumbbell trainer. All data lives in localStorage.
const KEY = "firstrep.v1";
const $ = (s, el = document) => el.querySelector(s);
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtDate = (s) => parseYmd(s).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DBS = [1, 2, 3, 4, 5, 6, 7.5, 8, 10, 12.5, 15, 17.5, 20];

function defaultState() {
  return {
    settings: { dumbbells: [2, 3, 5], startDate: ymd(), days: [1, 3, 5], bodyweight: "" },
    sessions: [], checkins: [], draft: null
  };
}
let state;
try { state = Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY)) || {}); }
catch { state = defaultState(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

// ---------- program logic ----------
function weekNum(date = ymd()) {
  const diff = Math.floor((parseYmd(date) - parseYmd(state.settings.startDate)) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}
function phaseFor(week) {
  return PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) || PHASES[2];
}
function setsFor(item, idx, phase) {
  let n = Math.max(phase.minSets, item.sets + phase.setsDelta);
  if (phase.extraSetFirstTwo && idx < 2) n += 1;
  return n;
}
const nextLetter = () => (state.sessions.length % 2 === 0 ? "A" : "B");
// The personal plan (program.js) built from the onboarding answers.
const P = () => buildProgram(state.settings);
const avail = () => loadsFor(state.settings);
const kgLabel = (w) => loadLabel(state.settings, w);
const twoHanded = (ex) => !ex.oneDb && !ex.perSide;

function lastEntry(exId) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const e = state.sessions[i].entries.find((x) => x.id === exId && x.sets.length);
    if (e) return { entry: e, date: state.sessions[i].date };
  }
  return null;
}

// Double progression: same weight until every set hits the top of the range, then the next dumbbell you own.
function suggest(item, plannedSets) {
  const ex = EXERCISES[item.id];
  const dbs = avail();
  const last = lastEntry(item.id);
  const unit = ex.type === "time" ? "s" : "reps";
  if (!last) {
    let w = 0;
    if (ex.start > 0) w = [...dbs].reverse().find((d) => d <= ex.start) ?? dbs[0] ?? 0;
    return { w, reps: item.min, note: `First time — start at ${w ? kgLabel(w) : "bodyweight"}, aim for ${item.min} ${unit} with clean form.` };
  }
  const sets = last.entry.sets;
  const lastW = Math.max(...sets.map((s) => s.w));
  const atW = sets.filter((s) => s.w === lastW);
  const hitTop = atW.length >= Math.min(plannedSets, sets.length) && atW.every((s) => s.reps >= item.max);
  const minReps = Math.min(...atW.map((s) => s.reps));
  if (hitTop) {
    if (ex.type === "time") return { w: 0, reps: item.max, note: `You held ${item.max}s on every set. Try the harder version: ${ex.harder}.`, maxed: true };
    const canAddWeight = ex.start > 0 || ex.canLoad;
    const next = canAddWeight ? dbs.find((d) => d > lastW) : undefined;
    if (next !== undefined) return { w: next, reps: item.min, note: `⬆ Level up! You hit ${item.max} on every set — move to ${next} kg and restart at ${item.min} reps.`, up: true };
    return {
      w: lastW, reps: item.max, maxed: true,
      note: canAddWeight
        ? `Maxed out at ${lastW} kg. Make it harder: 3-second lowering + 1-second pause, or ${ex.harder}. Time to think about heavier dumbbells.`
        : `Top of range reached. Try the harder version: ${ex.harder}.`
    };
  }
  const target = Math.min(item.max, minReps + 1);
  return { w: lastW, reps: target, note: `Last time: ${sets.map((s) => (s.w ? s.w + "×" : "") + s.reps).join(", ")}. Beat it — aim for ${target}+ ${unit}.` };
}

// ---------- rendering ----------
const views = { today: renderToday, plan: renderPlan, exercises: renderExercises, progress: renderProgress, settings: renderSettings };
function route() {
  const tab = (location.hash || "#today").slice(1);
  const onboarding = !state.settings.onboarded || tab === "setup";
  document.body.classList.toggle("onboarding", onboarding);
  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + tab));
  if (onboarding) renderOnboarding($("#view"));
  else (views[tab] || renderToday)($("#view"));
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

function startDraft(letter) {
  const week = weekNum(), phase = phaseFor(week);
  const items = P().W[letter].items;
  state.draft = {
    date: ymd(), workout: letter, week, started: Date.now(), items,
    entries: items.map((item, i) => {
      const n = setsFor(item, i, phase);
      const s = suggest(item, n);
      return { id: item.id, sets: Array.from({ length: n }, () => ({ w: s.w, reps: s.reps, done: false })) };
    })
  };
  save(); route();
}

function renderToday(el) {
  const today = ymd(), week = weekNum(), phase = phaseFor(week);
  const doneToday = state.sessions.filter((s) => s.date === today);
  const isTrainingDay = state.settings.days.includes(new Date().getDay());
  const letter = state.draft ? state.draft.workout : nextLetter();
  const W = P().W[letter];

  let html = `<section class="hero">
    <div><div class="eyebrow">Week ${week}${week > 12 ? " (bonus)" : ""} · ${phase.name} phase</div>
    <h1>${fmtDate(today)}</h1><p class="muted">${phase.rir}</p></div>
    <div class="ring">${weekProgressRing()}</div></section>`;

  if (state.draft) {
    html += renderDraft();
  } else if (doneToday.length) {
    html += `<div class="card ok"><h2>✅ Workout ${doneToday[0].workout} done today</h2>
      <p>${sessionVolume(doneToday[0]).toLocaleString()} kg lifted in ${doneToday[0].minutes} min. Recover well — next up is Workout ${nextLetter()}.</p></div>`;
    html += renderCheckin();
  } else {
    html += `<div class="card">
      <div class="eyebrow">${isTrainingDay ? "Training day" : "Rest day"}</div>
      <h2>${W.title}</h2>
      <p class="muted">${phase.note}</p>
      <ol class="preview">${W.items.map((it, i) => {
        const ex = EXERCISES[it.id], n = setsFor(it, i, phase), s = suggest(it, n);
        return `<li><span>${ex.icon} ${ex.name}</span><span class="pill">${n} × ${it.min}–${it.max}${ex.type === "time" ? "s" : ""}${ex.perSide ? "/side" : ""} · ${s.w ? kgLabel(s.w) : "bodyweight"}</span>${it.note ? `<div class="small muted eqnote">${it.note}</div>` : ""}</li>`;
      }).join("")}</ol>
      <details class="warm"><summary>Warm-up (5 min)</summary><ul>${WARMUP.map((w) => `<li>${w}</li>`).join("")}</ul></details>
      <button class="primary big" data-act="start" data-l="${letter}">${isTrainingDay ? "Start workout" : "Train anyway"}</button>
    </div>`;
    if (!isTrainingDay) html += renderCheckin();
  }
  el.innerHTML = html;
  bindToday(el);
}

function renderDraft() {
  const d = state.draft, W = { title: P().W[d.workout].title, items: d.items || P().W[d.workout].items }, phase = phaseFor(d.week);
  const opts = (sel) => [...new Set([0, ...avail(), sel])].sort((a, b) => a - b).map((w) => `<option value="${w}" ${w === sel ? "selected" : ""}>${kgLabel(w)}</option>`).join("");
  const done = d.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const total = d.entries.reduce((a, e) => a + e.sets.length, 0);
  return `<div class="progressbar"><div style="width:${(done / total) * 100}%"></div></div>
  <p class="muted small">${done}/${total} sets · ${W.title}</p>
  <div class="excards">${d.entries.map((e, ei) => {
    const ex = EXERCISES[e.id], item = W.items[ei], s = suggest(item, e.sets.length);
    const unit = ex.type === "time" ? "sec" : "reps";
    return `<div class="card ex ${e.sets.every((x) => x.done) ? "complete" : ""}">
      <div class="ex-top"><button class="thumb" data-act="guide" data-id="${e.id}" aria-label="How to do ${ex.name}">${demo(e.id, "sm")}</button>
      <div class="ex-info"><div class="ex-head"><h3>${ex.name}</h3><button class="link" data-act="guide" data-id="${e.id}">How to ▸</button></div>
      <p class="muscles">${ex.muscles.join(" · ")} · target ${item.min}–${item.max} ${unit}${ex.perSide ? " per side" : ""}${ex.oneDb ? " · one dumbbell" : twoHanded(ex) && s.w ? " · one in each hand" : ""}</p></div></div>
      <p class="tip ${s.up ? "up" : s.maxed ? "warn" : ""}">${s.note}</p>
      ${item.note ? `<p class="small muted eqnote">🏠 ${item.note}</p>` : ""}
      <div class="sets">${e.sets.map((st, si) => `
        <div class="set ${st.done ? "done" : ""}">
          <span class="n">${si + 1}</span>
          ${ex.type === "time" || (ex.start === 0 && !ex.canLoad) ? `<span class="bw">BW</span>` : `<select data-e="${ei}" data-s="${si}" data-f="w">${opts(st.w)}</select>`}
          <span class="x">×</span>
          <input type="number" inputmode="numeric" min="0" value="${st.reps}" data-e="${ei}" data-s="${si}" data-f="reps"><span class="unit">${unit}</span>
          <button class="check" data-act="tick" data-e="${ei}" data-s="${si}" aria-label="Mark set done">${st.done ? "✓" : ""}</button>
        </div>`).join("")}</div>
    </div>`;
  }).join("")}</div>
  <details class="warm card"><summary>Cool-down stretches</summary><ul>${COOLDOWN.map((w) => `<li>${w}</li>`).join("")}</ul></details>
  <div class="row"><button class="ghost" data-act="cancel">Discard</button><button class="primary big" data-act="finish">Finish workout</button></div>`;
}

function renderCheckin() {
  const c = state.checkins.find((x) => x.date === ymd()) || {};
  return `<div class="card"><h2>Daily check-in</h2>
    <div class="grid2">
      <label class="tog"><input type="checkbox" id="ci-walk" ${c.walk ? "checked" : ""}> Walked 20+ min</label>
      <label class="tog"><input type="checkbox" id="ci-protein" ${c.protein ? "checked" : ""}> Hit protein goal</label>
      <label>Sleep (h)<input type="number" step="0.5" id="ci-sleep" value="${c.sleep ?? ""}"></label>
      <label>Bodyweight (kg)<input type="number" step="0.1" id="ci-bw" value="${c.bw ?? ""}"></label>
      <label class="span2">Soreness <input type="range" min="1" max="5" id="ci-sore" value="${c.sore ?? 2}"><span class="muted small">1 = fresh · 5 = very sore</span></label>
    </div>
    <button class="primary" data-act="checkin">${c.date ? "Update" : "Save"} check-in</button></div>`;
}

function bindToday(el) {
  el.onclick = (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "start") startDraft(b.dataset.l);
    if (act === "guide") openGuide(b.dataset.id);
    if (act === "tick") {
      const st = state.draft.entries[b.dataset.e].sets[b.dataset.s];
      st.done = !st.done; save();
      if (st.done) {
        const item = (state.draft.items || [])[b.dataset.e];
        const ex = EXERCISES[state.draft.entries[b.dataset.e].id];
        startRest(item?.rest || (ex.start >= 5 || ex.id === "pushup" ? 90 : 60));
      }
      const y = window.scrollY; renderToday(el); window.scrollTo(0, y);
    }
    if (act === "cancel" && confirm("Discard this workout?")) { state.draft = null; save(); route(); }
    if (act === "finish") finishWorkout();
    if (act === "checkin") {
      const c = { date: ymd(), walk: $("#ci-walk").checked, protein: $("#ci-protein").checked, sleep: num($("#ci-sleep").value), bw: num($("#ci-bw").value), sore: +$("#ci-sore").value };
      state.checkins = state.checkins.filter((x) => x.date !== c.date).concat(c);
      if (c.bw) state.settings.bodyweight = c.bw;
      save(); toast("Check-in saved"); route();
    }
  };
  el.onchange = (ev) => {
    const t = ev.target; if (!t.dataset.f || !state.draft) return;
    const sets = state.draft.entries[t.dataset.e].sets, si = +t.dataset.s;
    const v = +t.value;
    sets[si][t.dataset.f] = v;
    // Changing a weight carries forward to the remaining unticked sets, like Hevy does.
    if (t.dataset.f === "w") sets.forEach((s, i) => { if (i > si && !s.done) s.w = v; });
    save(); if (t.dataset.f === "w") { const y = window.scrollY; renderToday($("#view")); window.scrollTo(0, y); }
  };
}
const num = (v) => (v === "" ? null : +v);

function finishWorkout() {
  const d = state.draft;
  const entries = d.entries.map((e) => ({ id: e.id, sets: e.sets.filter((s) => s.done).map(({ w, reps }) => ({ w, reps })) })).filter((e) => e.sets.length);
  if (!entries.length) return alert("Tick at least one set before finishing.");
  const prs = entries.filter((e) => {
    const prev = state.sessions.flatMap((s) => s.entries.filter((x) => x.id === e.id).flatMap((x) => x.sets));
    if (!prev.length) return false;
    const best = (arr) => Math.max(...arr.map((s) => s.w * 1000 + s.reps));
    return best(e.sets) > best(prev);
  }).map((e) => EXERCISES[e.id].name);
  const session = { date: d.date, workout: d.workout, week: d.week, minutes: Math.max(1, Math.round((Date.now() - d.started) / 60000)), entries };
  state.sessions.push(session); state.draft = null; save(); stopRest();
  toast(`Workout saved! ${sessionVolume(session).toLocaleString()} kg lifted${prs.length ? " · New best: " + prs.join(", ") : ""} 🎉`, 5000);
  route();
}

function sessionVolume(s) {
  return Math.round(s.entries.reduce((a, e) => {
    const ex = EXERCISES[e.id];
    return a + e.sets.reduce((b, st) => b + (ex.type === "time" ? 0 : st.w * st.reps * (twoHanded(ex) ? 2 : 1)), 0);
  }, 0));
}

function weekProgressRing() {
  const wk = weekNum(), n = state.sessions.filter((s) => weekNum(s.date) === wk).length, goal = state.settings.days.length || 3;
  const pct = Math.min(1, n / goal), r = 26, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 64 64" width="72" height="72" aria-label="${n} of ${goal} workouts this week">
    <circle cx="32" cy="32" r="${r}" class="ring-bg"/><circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 32 32)"/>
    <text x="32" y="36" text-anchor="middle">${n}/${goal}</text></svg><div class="small muted center">this week</div>`;
}

// ---------- animated demo ----------
// 3D mannequin (three-fig.js) when available: live in the guide, start/finish thumbnails elsewhere.
// Falls back to the 2D figure from anim.js.
function demo(id, size = "") {
  const tag = size === "lg" ? `<span class="demo-tag"><i class="hl-dot"></i> working muscles · tap to pause</span>` : "";
  const F = window.FIG3D;
  if (F && size === "lg") return `<div class="demo lg d3" data-mount3d="${id}">${tag}</div>`;
  if (F) {
    const [a, b] = F.thumbs[id];
    return `<div class="demo ${size} d3"><img src="${a}" alt="${EXERCISES[id].name} start"><img class="f2" src="${b}" alt="${EXERCISES[id].name} finish"></div>`;
  }
  return `<div class="demo ${size}" data-demo>${figSvg(id)}${tag}</div>`;
}
document.addEventListener("click", (e) => {
  const d = e.target.closest(".demo.lg"); if (!d) return;
  if (d.dataset.mount3d) window.FIG3D.v.togglePause(); else d.classList.toggle("paused");
});
window.addEventListener("fig3d-ready", () => {
  if (document.body.classList.contains("onboarding")) return;
  const tab = (location.hash || "#today").slice(1), y = window.scrollY;
  (views[tab] || renderToday)($("#view")); window.scrollTo(0, y);
});
$("#modal").addEventListener("close", () => {
  if (!window.FIG3D) return;
  $("#fig3d-holder").append($("#fig3d")); window.FIG3D.v.setActive(false);
});

// ---------- guide modal ----------
function guideHtml(id) {
  const ex = EXERCISES[id];
  return `${demo(id, "lg")}
    ${ex.imgNote ? `<p class="small muted">ℹ️ ${ex.imgNote}</p>` : ""}
    <div class="eyebrow">${ex.muscles.join(" · ")}</div>
    <h2>${ex.icon} ${ex.name}</h2>
    <p class="pill">Start with: ${ex.start ? ex.start + " kg" + (ex.oneDb ? " (one dumbbell)" : ex.perSide ? "" : " in each hand") : "bodyweight"}</p>
    <h4>How to do it</h4><ol>${ex.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
    <h4>Remember</h4><ul class="cues">${ex.cues.map((s) => `<li>${s}</li>`).join("")}</ul>
    <h4>Avoid</h4><ul class="bad">${ex.mistakes.map((s) => `<li>${s}</li>`).join("")}</ul>
    <div class="grid2"><div class="mini"><b>Too hard?</b><br>${ex.easier}</div><div class="mini"><b>Too easy?</b><br>${ex.harder}</div></div>`;
}
function openGuide(id) {
  $("#modal-body").innerHTML = guideHtml(id);
  $("#modal").showModal();
  const host = $("#modal-body [data-mount3d]");
  if (host) { host.prepend($("#fig3d")); window.FIG3D.v.show(id); window.FIG3D.v.setActive(true); }
}

// ---------- rest timer ----------
let restEnd = 0, restInt = null;
function startRest(sec) {
  restEnd = Date.now() + sec * 1000; $("#rest").hidden = false; tickRest();
  clearInterval(restInt); restInt = setInterval(tickRest, 250);
}
function tickRest() {
  const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000));
  $("#rest-time").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  if (left === 0) { beep(); stopRest(); toast("Rest over — next set!"); }
}
function stopRest() { clearInterval(restInt); $("#rest").hidden = true; }
function beep() {
  try {
    const ctx = new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch {}
  navigator.vibrate?.([200, 100, 200]);
}
$("#rest-add").onclick = () => { restEnd += 15000; tickRest(); };
$("#rest-skip").onclick = stopRest;

// ---------- plan ----------
// first weight to try for an exercise, from what the user can actually lift
function startW(ex, loads) {
  if (!(ex.start > 0)) return 0;
  return [...loads].reverse().find((d) => d <= ex.start) ?? loads[0] ?? 0;
}
function workoutTable(prog, L, phase) {
  return `<div class="card"><h2>${prog.W[L].title}</h2><div class="tablewrap"><table><thead><tr><th>Exercise</th><th>Sets × reps</th><th>Start with</th></tr></thead><tbody>
    ${prog.W[L].items.map((it, i) => {
      const ex = EXERCISES[it.id], w = startW(ex, prog.loads);
      return `<tr><td><button class="link" data-guide="${it.id}">${ex.icon} ${ex.name}</button>${it.note ? `<div class="small muted eqnote">${it.note}</div>` : ""}</td>
        <td>${setsFor(it, i, phase)} × ${it.min}–${it.max}${ex.type === "time" ? "s" : ""}${ex.perSide ? "/side" : ""}</td>
        <td>${w ? kgLabel(w) + (ex.oneDb ? " (one)" : "") : "bodyweight"}</td></tr>`;
    }).join("")}
  </tbody></table></div></div>`;
}

function renderPlan(el) {
  const week = weekNum(), phase = phaseFor(week), prog = P();
  el.innerHTML = `<div class="ex-head"><h1>Your 12-week plan</h1><a class="ghost btnlike small" href="#setup">Change answers</a></div>
  <p class="muted">${prog.summary}. Alternate Workout A and B on ${prog.days.map((d) => DAY_NAMES[d]).join(", ")}; walk on the other days.</p>
  ${prog.notes.length ? `<div class="card tipcard"><h2>Made for you</h2><ul>${prog.notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>` : ""}
  <div class="phases">${PHASES.map((p) => `<div class="card phase ${p === phase ? "current" : ""}">
    <div class="eyebrow">Weeks ${p.weeks[0]}–${p.weeks[1]}${p === phase ? " · you are here" : ""}</div><h3>${p.name}</h3><p>${p.note}</p><p class="small muted">${p.rir}</p></div>`).join("")}</div>
  <div class="twocol">${workoutTable(prog, "A", phase)}${workoutTable(prog, "B", phase)}</div>
  ${prog.buy.length ? `<div class="card"><h2>Worth getting next</h2><ul>${prog.buy.map((n) => `<li>${n}</li>`).join("")}</ul></div>` : ""}
  <div class="card"><h2>How you get stronger</h2><ol>
    <li>Start at the <b>bottom</b> of the rep range with the suggested weight.</li>
    <li>Each session, try to add <b>1 rep</b> to some sets. Same weight.</li>
    <li>When <b>every set hits the top</b> of the range → the app moves you to your next weight (${avail().map(kgLabel).join(" → ")}).</li>
    <li>Already at your heaviest? Slow 3-second lowering, 1-second pause, an extra set, or the harder variation. The app will flag when it's time for heavier dumbbells.</li>
  </ol></div>
  <div class="card"><h2>Outside the workout</h2><ul>
    <li><b>Protein:</b> ~1.6 g per kg bodyweight daily${state.settings.bodyweight ? ` (≈ ${Math.round(state.settings.bodyweight * 1.6)} g for you)` : ""} — dal, paneer, eggs, curd, chicken, soya.</li>
    <li><b>Sleep:</b> 7–9 hours. Muscle is built while you recover.</li>
    <li><b>Soreness</b> in the first 2 weeks is normal. Sharp or joint pain is not — stop and get it checked.</li>
  </ul><p class="small muted">General fitness guidance, not medical advice.</p></div>`;
  el.onclick = (e) => { const b = e.target.closest("[data-guide]"); if (b) openGuide(b.dataset.guide); };
}

// ---------- exercises ----------
function renderExercises(el) {
  el.innerHTML = `<h1>Exercise guide</h1><p class="muted">Tap any exercise to learn the form before you lift.</p>
    <div class="exgrid">${Object.entries(EXERCISES).map(([id, ex]) => `<button class="card extile" data-guide="${id}">
      ${demo(id)}<b>${ex.name}</b><span class="small muted">${ex.muscles.join(" · ")}</span>
      <span class="pill">${startW(ex, avail()) ? kgLabel(startW(ex, avail())) : "bodyweight"}</span></button>`).join("")}</div>`;
  el.onclick = (e) => { const b = e.target.closest("[data-guide]"); if (b) openGuide(b.dataset.guide); };
}

// ---------- progress ----------
let chartEx = "goblet_squat";
function renderProgress(el) {
  const S = state.sessions;
  const totalVol = S.reduce((a, s) => a + sessionVolume(s), 0);
  el.innerHTML = `<h1>Progress</h1>
  <div class="stats">
    <div class="stat"><b>${S.length}</b><span>workouts</span></div>
    <div class="stat"><b>${weekStreak()}</b><span>week streak</span></div>
    <div class="stat"><b>${totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "t" : totalVol + " kg"}</b><span>total lifted</span></div>
    <div class="stat"><b>${S.reduce((a, s) => a + s.minutes, 0)}</b><span>minutes</span></div>
  </div>
  <div class="card"><h2>Last 12 weeks</h2>${calendar()}<p class="small muted legend"><i class="c w"></i> workout <i class="c k"></i> check-in only</p></div>
  <div class="card"><div class="ex-head"><h2>Exercise progress</h2>
    <select id="chart-ex">${Object.entries(EXERCISES).map(([id, ex]) => `<option value="${id}" ${id === chartEx ? "selected" : ""}>${ex.name}</option>`).join("")}</select></div>
    ${exerciseChart(chartEx)}</div>
  <div class="card"><h2>Bodyweight</h2>${bwChart()}</div>
  <div class="card"><h2>History</h2>${S.length ? [...S].reverse().map((s) => `<details class="hist"><summary><span>${fmtDate(s.date)} · Workout ${s.workout}</span><span class="muted small">${sessionVolume(s)} kg · ${s.minutes} min</span></summary>
    <ul>${s.entries.map((e) => `<li><b>${EXERCISES[e.id].name}</b>: ${e.sets.map((x) => (x.w ? x.w + "kg×" : "") + x.reps).join(", ")}</li>`).join("")}</ul></details>`).join("") : `<p class="muted">No workouts yet. Your first one will show up here.</p>`}</div>`;
  $("#chart-ex").onchange = (e) => { chartEx = e.target.value; renderProgress(el); };
}

function weekStreak() {
  const goal = state.settings.days.length || 3;
  const per = {}; state.sessions.forEach((s) => { const w = weekNum(s.date); per[w] = (per[w] || 0) + 1; });
  let w = weekNum(), streak = 0;
  if ((per[w] || 0) < goal) w--; // current week still in progress
  while (w >= 1 && (per[w] || 0) >= goal) { streak++; w--; }
  return streak;
}

function calendar() {
  const end = new Date(); end.setDate(end.getDate() + (6 - end.getDay()));
  const days = new Set(state.sessions.map((s) => s.date)), checks = new Set(state.checkins.map((c) => c.date));
  let cells = "";
  for (let i = 83; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    const k = ymd(d), future = d > new Date();
    cells += `<i class="c ${days.has(k) ? "w" : checks.has(k) ? "k" : ""} ${future ? "f" : ""}" title="${k}"></i>`;
  }
  return `<div class="cal">${cells}</div>`;
}

function lineChart(points, yLabel) {
  if (points.length < 2) return `<p class="muted">${points.length ? "One entry so far — " : ""}Log at least two sessions to see a trend.</p>`;
  const W = 600, H = 200, P = 32;
  const ys = points.map((p) => p.y), min = Math.min(...ys) * 0.9, max = Math.max(...ys) * 1.05 || 1;
  const x = (i) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${yLabel} over time">
    <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" class="axis"/>
    <text x="${P}" y="14" class="lbl">${yLabel}</text>
    <path d="${path}" class="line"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="4" class="dot"><title>${p.label}: ${p.y}</title></circle>`).join("")}
    <text x="${P}" y="${H - 10}" class="lbl">${points[0].label}</text>
    <text x="${W - P}" y="${H - 10}" class="lbl" text-anchor="end">${points.at(-1).label}</text>
    <text x="${x(points.length - 1) - 6}" y="${y(points.at(-1).y) - 10}" class="val" text-anchor="end">${points.at(-1).y}</text>
  </svg>`;
}
function exerciseChart(id) {
  const ex = EXERCISES[id];
  const rows = state.sessions.map((s) => ({ s, e: s.entries.find((e) => e.id === id) })).filter((r) => r.e);
  const weighted = rows.some((r) => r.e.sets.some((x) => x.w > 0));
  const pts = rows.map(({ s, e }) => ({
    label: fmtDate(s.date),
    y: weighted ? e.sets.reduce((a, x) => a + x.w * x.reps * (twoHanded(ex) ? 2 : 1), 0) : Math.max(...e.sets.map((x) => x.reps))
  }));
  const best = rows.length ? rows.flatMap((r) => r.e.sets).sort((a, b) => b.w - a.w || b.reps - a.reps)[0] : null;
  return `${best ? `<p class="small">Best set: <b>${best.w ? best.w + " kg × " : ""}${best.reps} ${ex.type === "time" ? "s" : "reps"}</b> · ${rows.length} sessions</p>` : ""}
    ${lineChart(pts, weighted ? "kg moved per session" : ex.type === "time" ? "best hold (s)" : "best reps")}`;
}
function bwChart() {
  const pts = state.checkins.filter((c) => c.bw).sort((a, b) => a.date.localeCompare(b.date)).map((c) => ({ label: fmtDate(c.date), y: c.bw }));
  return lineChart(pts, "kg") + `<p class="small muted">Log bodyweight in the daily check-in (once a week, same time of day, is enough).</p>`;
}

// ---------- settings ----------
function renderSettings(el) {
  const st = state.settings;
  el.innerHTML = `<h1>Settings</h1>
  <div class="card"><div class="ex-head"><h2>My setup</h2><a class="primary btnlike small" href="#setup">Redo setup</a></div>
    <p class="muted small">${P().summary}. Change your equipment, days, time or goal and the plan rebuilds itself.</p></div>
  <div class="card"><h2>My dumbbells</h2><p class="muted small">Tick every weight you own. The app only ever suggests these.</p>
    <div class="chips">${ALL_DBS.map((w) => `<label class="chip"><input type="checkbox" value="${w}" data-db ${st.dumbbells.includes(w) ? "checked" : ""}><span>${w} kg</span></label>`).join("")}</div></div>
  <div class="card"><h2>Schedule</h2>
    <label>Plan start date<input type="date" id="s-start" value="${st.startDate}"></label>
    <p class="muted small">Training days (3 recommended, with a rest day between):</p>
    <div class="chips">${DAY_NAMES.map((d, i) => `<label class="chip"><input type="checkbox" value="${i}" data-day ${st.days.includes(i) ? "checked" : ""}><span>${d}</span></label>`).join("")}</div>
    <label>Bodyweight (kg)<input type="number" step="0.1" id="s-bw" value="${st.bodyweight ?? ""}"></label></div>
  <div class="card"><h2>Backup</h2><p class="muted small">Data is stored only in this browser. Export now and then so you don't lose it.</p>
    <div class="row"><button class="ghost" id="s-export">Export JSON</button><label class="ghost btnlike">Import JSON<input type="file" accept=".json" id="s-import" hidden></label>
    <button class="danger" id="s-reset">Reset everything</button></div></div>`;
  el.onchange = (e) => {
    if (e.target.matches("[data-db]")) st.dumbbells = [...el.querySelectorAll("[data-db]:checked")].map((i) => +i.value);
    if (e.target.matches("[data-day]")) st.days = [...el.querySelectorAll("[data-day]:checked")].map((i) => +i.value);
    if (e.target.id === "s-start" && e.target.value) st.startDate = e.target.value;
    if (e.target.id === "s-bw") st.bodyweight = num(e.target.value);
    if (e.target.id === "s-import" && e.target.files[0]) {
      e.target.files[0].text().then((t) => { try { state = Object.assign(defaultState(), JSON.parse(t)); save(); toast("Imported"); route(); } catch { alert("That file isn't a valid backup."); } });
    }
    save(); toast("Saved", 1200);
  };
  $("#s-export").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = `firstrep-backup-${ymd()}.json`; a.click();
  };
  $("#s-reset").onclick = () => { if (confirm("Delete all workouts, check-ins and settings? This cannot be undone.")) { state = defaultState(); save(); route(); } };
}

// ---------- first-time setup (onboarding) ----------
let ob = null;
const EQUIP = [
  { k: "chair", icon: "🪑", t: "Sturdy chair or bench", d: "For seated presses and the row" },
  { k: "mat", icon: "🧘", t: "Exercise mat or carpet", d: "For floor exercises" },
  { k: "table", icon: "🍽️", t: "Table or kitchen counter", d: "For easier (incline) push-ups" },
  { k: "backpack", icon: "🎒", t: "A backpack", d: "Fill it with books as extra weight" }
];
function renderOnboarding(el) {
  if (!ob) {
    const s = state.settings;
    ob = {
      step: s.onboarded ? 1 : 0,
      s: {
        dumbbells: s.onboarded ? [...(s.dumbbells || [])] : [], noDb: s.onboarded ? !(s.dumbbells || []).length : false,
        equipment: Object.assign(defaultEquipment(), s.equipment || {}), backpackKg: s.backpackKg || 5,
        daysPerWeek: s.daysPerWeek || 3, minutes: s.minutes || 45, goal: s.goal || "muscle", bodyweight: s.bodyweight || ""
      }
    };
  }
  const o = ob.s, step = ob.step, STEPS = 5;
  const radio = (key, val, icon, title, desc) => `<button class="opt ${o[key] === val ? "on" : ""}" data-set="${key}" data-val="${val}">
    <span class="opt-icon">${icon}</span><span><b>${title}</b><span class="small muted">${desc}</span></span></button>`;
  let body = "";
  if (step === 0) body = `<div class="ob-hero">🏋️</div><h1>Welcome to FirstRep</h1>
    <p class="muted">Answer 3 quick questions about what you have at home and how much time you've got. We'll build a 12-week beginner plan that fits — no gym needed.</p>`;
  if (step === 1) body = `<h1>What do you have at home?</h1>
    <h3 class="ob-q">Dumbbells</h3><p class="muted small">Tick every weight you own (a pair or single).</p>
    <div class="chips">${ALL_DBS.map((w) => `<label class="chip"><input type="checkbox" data-db value="${w}" ${!o.noDb && o.dumbbells.includes(w) ? "checked" : ""}><span>${w} kg</span></label>`).join("")}
      <label class="chip"><input type="checkbox" data-nodb ${o.noDb ? "checked" : ""}><span>None yet</span></label></div>
    <h3 class="ob-q">Anything else?</h3>
    <div class="opts">${EQUIP.map((e) => `<button class="opt ${o.equipment[e.k] ? "on" : ""}" data-eq="${e.k}"><span class="opt-icon">${e.icon}</span><span><b>${e.t}</b><span class="small muted">${e.d}</span></span><span class="opt-check">${o.equipment[e.k] ? "✓" : ""}</span></button>`).join("")}</div>
    ${o.equipment.backpack ? `<label class="ob-inline">Backpack with books weighs about (kg)<input type="number" min="1" max="20" step="1" id="ob-bp" value="${o.backpackKg}"></label>` : ""}`;
  if (step === 2) body = `<h1>How often can you train?</h1>
    <div class="opts">${radio("daysPerWeek", 2, "2️⃣", "2 days a week", "Easy to stick to · whole body each time")}
      ${radio("daysPerWeek", 3, "3️⃣", "3 days a week", "Recommended for beginners")}
      ${radio("daysPerWeek", 4, "4️⃣", "4 days a week", "Faster progress if you sleep well")}</div>
    <h3 class="ob-q">How long per session?</h3>
    <div class="opts row3">${radio("minutes", 30, "⏱️", "30 min", "4 key exercises")}
      ${radio("minutes", 45, "⏱️", "45 min", "Full plan")}
      ${radio("minutes", 60, "⏱️", "60 min", "Full plan + extra sets")}</div>`;
  if (step === 3) body = `<h1>What's your main goal?</h1>
    <div class="opts">${radio("goal", "muscle", "💪", "Build muscle", "8–15 reps, longer rests")}
      ${radio("goal", "fit", "🔥", "Get fit & lose fat", "Higher reps, short rests, daily walks")}</div>
    <label class="ob-inline">Your bodyweight in kg (optional — sets your protein target)<input type="number" step="0.1" id="ob-bw" value="${o.bodyweight}"></label>`;
  if (step === 4) {
    const s = { ...state.settings, ...o, dumbbells: o.noDb ? [] : o.dumbbells };
    const prog = buildProgram(s), phase = phaseFor(1);
    const lbl = (w) => loadLabel(s, w);
    const list = (L) => `<div class="card"><h3>${prog.W[L].title}</h3><ul class="ob-list">${prog.W[L].items.map((it, i) => {
      const ex = EXERCISES[it.id], w = startW(ex, prog.loads);
      return `<li><span>${ex.name}</span><span class="pill">${setsFor(it, i, phase)}×${it.min}–${it.max}${ex.type === "time" ? "s" : ""} · ${w ? lbl(w) : "BW"}</span>${it.note ? `<div class="small muted eqnote">${it.note}</div>` : ""}</li>`;
    }).join("")}</ul></div>`;
    body = `<h1>Your plan is ready</h1><p class="muted">${prog.summary} · train on <b>${prog.days.map((d) => DAY_NAMES[d]).join(", ")}</b>.</p>
      <div class="card tipcard"><ul>${prog.notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>
      <div class="twocol">${list("A")}${list("B")}</div>
      ${prog.buy.length ? `<div class="card"><h3>Worth getting later</h3><ul>${prog.buy.map((n) => `<li>${n}</li>`).join("")}</ul></div>` : ""}`;
  }
  const canNext = step !== 1 || o.noDb || o.dumbbells.length;
  el.innerHTML = `<div class="ob">
    <div class="ob-dots">${Array.from({ length: STEPS }, (_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
    ${body}
    <div class="ob-nav">${step > 0 ? `<button class="ghost" data-ob="back">Back</button>` : (state.settings.onboarded ? `<button class="ghost" data-ob="cancel">Cancel</button>` : "<span></span>")}
      ${step < 4 ? `<button class="primary big" data-ob="next" ${canNext ? "" : "disabled"}>${step === 0 ? "Let's start" : "Next"}</button>`
                 : `<button class="primary big" data-ob="finish">Start my plan</button>`}</div>
    ${step === 1 && !canNext ? `<p class="small muted center">Pick your dumbbell weights, or "None yet".</p>` : ""}
  </div>`;

  const rerender = () => { const y = window.scrollY; renderOnboarding(el); window.scrollTo(0, y); };
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.set) { o[b.dataset.set] = isNaN(+b.dataset.val) ? b.dataset.val : +b.dataset.val; rerender(); }
    if (b.dataset.eq) { o.equipment[b.dataset.eq] = !o.equipment[b.dataset.eq]; rerender(); }
    if (b.dataset.ob === "back") { ob.step--; renderOnboarding(el); window.scrollTo(0, 0); }
    if (b.dataset.ob === "next") { ob.step++; renderOnboarding(el); window.scrollTo(0, 0); }
    if (b.dataset.ob === "cancel") { ob = null; location.hash = "#settings"; }
    if (b.dataset.ob === "finish") {
      const s = state.settings, first = !s.onboarded;
      Object.assign(s, { ...o, dumbbells: o.noDb ? [] : o.dumbbells, onboarded: true });
      delete s.noDb;
      s.days = buildProgram(s).days;
      if (first && !state.sessions.length) s.startDate = ymd();
      ob = null; save(); toast("Your plan is ready 💪");
      if (location.hash === "#today" || !location.hash) route(); else location.hash = "#today";
    }
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.matches("[data-db]")) { o.dumbbells = [...el.querySelectorAll("[data-db]:checked")].map((i) => +i.value); o.noDb = false; rerender(); }
    if (t.matches("[data-nodb]")) { o.noDb = t.checked; if (o.noDb) o.dumbbells = []; rerender(); }
    if (t.id === "ob-bp") o.backpackKg = Math.max(1, +t.value || 5);
    if (t.id === "ob-bw") o.bodyweight = num(t.value) ?? "";
  };
}

// ---------- misc ----------
let toastT;
function toast(msg, ms = 2500) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
}
$("#modal-close").onclick = () => $("#modal").close();
$("#modal").onclick = (e) => { if (e.target.id === "modal") $("#modal").close(); };

route();
