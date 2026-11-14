# FirstRep — beginner dumbbell plan + app design (draft v0.1)

Personal app for a complete beginner training at home with light dumbbells (2 kg, 3 kg, 5 kg).
Not medical advice: stop on sharp or joint pain, and check with a doctor first if you have any condition.

## 1. What we learned from Hevy & the "home workout" apps

| What they do well | What we copy | What we skip (for now) |
|---|---|---|
| Hevy: fast set logging, previous numbers shown next to each set, rest timer, progress charts | Same: log weight × reps per set, show "last time", auto rest timer, charts | Social feed, routines marketplace, accounts |
| Fitbod/JEFIT: suggest next weight from history | Simple rule-based "next weight" suggestion (double progression) | AI recovery models |
| Nike Training Club / Darebee: exercise instructions | Step-by-step form guide, cues, common mistakes, easier/harder version, video link | Hosted videos (we link to a YouTube search instead) |

The gap for you: none of those apps know you only own 2/3/5 kg dumbbells, so they suggest weights you don't have.
FirstRep only ever suggests weights you own, and tells you what to do when you outgrow them.

## 2. The training plan (12 weeks, 3 days/week, ~40 min)

**Schedule:** Mon / Wed / Fri (any 3 non-consecutive days). Alternate Workout A and B:
week 1 = A B A, week 2 = B A B, and so on. Rest days: walk 20–30 min.

**Every session:** 5 min warm-up (arm circles, 10 bodyweight squats, 10 hip hinges, 10 cat-cows) →
workout → 2 min stretch.

### Workout A — Squat, Press, Row
| Exercise | Sets × reps | Starting dumbbell |
|---|---|---|
| Goblet squat | 3 × 8–15 | 5 kg (one, held at chest) |
| Floor press | 3 × 8–15 | 3 kg each hand → 5 kg |
| One-arm row | 3 × 8–15 | 5 kg |
| Shoulder press (seated) | 2 × 8–15 | 3 kg each hand |
| Biceps curl | 2 × 10–15 | 3 kg each hand |
| Plank | 3 × 20–40 s | bodyweight |

### Workout B — Hinge, Push-up, Lunge
| Exercise | Sets × reps | Starting dumbbell |
|---|---|---|
| Romanian deadlift | 3 × 8–15 | 5 kg each hand |
| Push-up (incline or knees to start) | 3 × 5–15 | bodyweight |
| Reverse lunge | 2 × 8–12 per leg | bodyweight → 2–3 kg each hand |
| Lateral raise | 2 × 10–15 | 2 kg each hand |
| Overhead triceps extension | 2 × 10–15 | 3 kg (one dumbbell, both hands) |
| Glute bridge | 3 × 12–20 | 5 kg on hips |
| Dead bug | 2 × 8 per side | bodyweight |

### Phases
| Weeks | Phase | Sets | Effort |
|---|---|---|---|
| 1–2 | **Learn** — form first | 2 sets of everything | Stop with 3–4 reps left in the tank |
| 3–6 | **Build** | Full sets as listed | Stop with 2 reps left |
| 7–12 | **Grow** | +1 set on the first two exercises | Stop with 1 rep left; slow 3-second lowering |

### How you progress (double progression)
1. Start at the bottom of the rep range (e.g. 8 reps).
2. Each session try to add 1 rep to some sets, same weight.
3. When **every set hits the top of the range** (e.g. 3 × 15) with good form → move up to the next dumbbell you own (2 → 3 → 5 kg).
4. **Already at 5 kg?** Make it harder without more weight: slow 3-second lowering, 1-second pause at the bottom,
   one extra set, or a harder version (goblet squat → Bulgarian split squat, RDL → single-leg RDL, push-up → feet-flat push-up).
5. When legs and back max out at 5 kg (likely around week 4–8), the app flags it: that's the time to buy a pair of
   adjustable dumbbells (up to ~10–20 kg each).

### Outside the gym bit
- Protein ~1.6 g per kg bodyweight per day (e.g. 70 kg → ~110 g), spread over meals.
- Sleep 7–9 h. Muscles grow while recovering, not while lifting.
- Soreness in the first 2 weeks is normal; sharp or joint pain is not.

## 3. App design (draft v0.1 — what's built)

Single-page web app, no login, no server: plain HTML/CSS/JS, data saved in the browser (localStorage), with
export/import to a JSON file as backup. Works on phone and laptop.

| Tab | What it does |
|---|---|
| **Today** | Shows the next workout (A or B), current week & phase, and for each exercise: suggested dumbbell, target reps, "last time" numbers, set rows to tick off, a rest timer, and a "How to do it" guide. On a rest day: a quick check-in (walk, sleep, soreness, bodyweight). |
| **Plan** | The 12-week plan, phases, weekly schedule, progression rules. |
| **Exercises** | Library: muscles worked, steps, form cues, common mistakes, easier/harder versions, starting dumbbell, video link. |
| **Progress** | Workouts done, weekly streak, total kg lifted, 12-week calendar, per-exercise chart, bodyweight chart, workout history. |
| **Settings** | Which dumbbells you own, start date, bodyweight, export/import, reset. |

**v0.3:** every exercise has an original animated cartoon figure (`anim.js`, pure SVG, no images): it moves
start → finish → start like a real rep. v0.4 restyled it as a shaded 3D-look grey mannequin (black shorts/shoes,
studio background, floor shadow, dark equipment) with working muscles in red. Shown on the workout
screen, the how-to guide and the exercise library. Our own drawings, so safe to publish.

**v0.5 — true 3D:** `three-fig.js` loads a rigged 3D mannequin (Mixamo "X Bot" from the three.js examples,
via jsDelivr) with three.js 0.170 from jsDelivr, and poses its skeleton from the same keyframes as `anim.js`
(each bone aimed along the 2D limb direction, then grounded). Working muscles are painted red on the mesh from skin
weights; dumbbells, chair, bench, table and mat are 3D props; studio lighting with soft shadows. The guide shows the
live 3D animation (tap to pause); cards and the library use 3D-rendered start/finish thumbnails. Without WebGL or
internet it falls back to the 2D figures. `3d.html` is a standalone 3D preview of all 13 exercises.
Licence note: Mixamo characters are free to use in projects, but not to redistribute as standalone assets.

**v0.6:** the mannequin is dressed as a bearded man (skin tone, beard/moustache, hair, eyes, brows, nose, ears,
blue T-shirt, black shorts, white trainers). Dumbbells are larger hex dumbbells colour-coded by weight
(2 kg green, 3 kg blue, 5 kg orange) with chrome handles, gripped in closed fists; two-handed holds (goblet,
overhead triceps) bring both hands together on one dumbbell.
**Realistic character option:** download any Mixamo character (free Adobe account, e.g. a bearded man) as FBX in
T-pose and save it as `models/man.fbx` — it's picked up automatically with its own textures and the red muscle tint.

**v0.7 — realistic man:** `models/man.glb` is Mixamo's "Adam" (bearded, grey hoodie and track pants),
downloaded as FBX T-pose and converted with `tools/convert-fbx.html` (87 MB FBX → 17 MB GLB, textures ≤1024 px).
The app loads it automatically; X Bot stays as the fallback. Bone lookup ignores Mixamo name prefixes
(`mixamorig7…`) and nested duplicate bones. Licence: Mixamo assets may be used in your projects but not
redistributed on their own — don't push `models/man.glb` to a public repo.

**v0.8 — personal plan + phone/tablet:**
- First-time setup (also Settings → Redo setup, Plan → Change answers): dumbbells owned (or none), chair/bench,
  mat, table/counter, backpack (+kg); 2/3/4 days a week; 30/45/60 min; goal build muscle / get fit & lose fat;
  optional bodyweight. `program.js` builds the plan: training days, exercise list (30 min = 4 key exercises),
  rep ranges and rest times by goal, extra sets for 60 min, loads from dumbbells → backpack → water bottles,
  per-exercise home notes (no chair → standing, no table → wall push-ups, no mat → carpet), and what to buy next.
- iPhone: bottom tab bar with icons (safe-area aware), full-screen guide sheets, 44 px+ tap targets, 16 px inputs
  (no zoom). iPad: wider layout, Workout A/B side by side, 2-column workout cards in landscape.
  Add to Home Screen: manifest + icons (`icons/`), opens full-screen.
- On your phone: same Wi-Fi as the PC running `python -m http.server 5180`, open `http://<PC-IP>:5180`.

**v0.9 — coach, friends, own character, UI check:**
- Today's coach (`todayDose`, `coachCard`): walk goal per goal type (fit 30 min/day, muscle 10 min bonus),
  +10/+20/+30 buttons and a minutes field, sleep and soreness autosave to the day's check-in. Dose is
  `light` (sore ≥ 4 or sleep < 6 h), `big` (fit: walk goal met; muscle: 10+ min walk, sleep ≥ 7 h and sore ≤ 2),
  or `standard`; a
  started workout uses it (`doseSets`: light −1 set, floor 2; big +1 set on the first three moves).
- Friends (`friendCard`, `renderFriends`): share codes `FR1.` + base64url JSON (v1), with only the progress
  numbers. No server, so friends see a snapshot when the code is re-shared, not live data.
- Own character (`character.js`): upload a Mixamo GLB/glTF in Settings. It's kept in IndexedDB on this
  device and loaded before the bundled model, so Adam shows locally. The live site uses X Bot unless the user
  uploads one. Mixamo's licence forbids redistribution, so `models/man.glb` stays local.
- UI/UX check (`.claude/skills/ui-ux-check`): a reusable audit for tap targets, input size, overflow,
  contrast and safe areas at 375/768/1280. Fixes from it: 44 px targets; text-safe accent and danger
  colours; phone nav labels at 11 px with the active tab in blue (it was invisible as white); number fields
  at 16 px so iOS doesn't zoom.

### Later (if v0.1 is useful)
- Offline install (service worker) — needs HTTPS hosting, e.g. Cloudflare Pages.
- Stronger muscle highlight on clothing (tint is subtle on the grey hoodie).
- Smoother wrist/foot rotations, drag-to-rotate camera.
- Install as phone app (PWA, works offline).
- Body measurements & progress photos.
- Sync across devices (would need a small backend).
