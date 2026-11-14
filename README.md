# FirstRep — a home dumbbell trainer for complete beginners

A free, open-source web app that tells a first-timer **exactly what to do** at home with a few light
dumbbells (or none): a 12-week plan built around the equipment you actually have, step-by-step
exercise guides with an **animated 3D figure**, a workout logger with a rest timer, and progress charts.

No account, no server, no tracking — everything is stored in your browser.

**▶ Try it: <https://ashutoshanand13.github.io/mygym/>** — on iPhone, tap Share → *Add to Home Screen*.

## Features

- **Personal plan from a 1-minute setup** — what you own (dumbbell weights or none, chair, mat, table,
  backpack), 2/3/4 days a week, 30/45/60 minutes, goal (build muscle / get fit & lose fat).
  It picks your training days, exercises, rep ranges, rest times and starting weights, and adapts
  exercises to your home (no chair → standing presses, no dumbbells → backpack or water bottles…).
- **12-week beginner programme** — two full-body workouts (A/B), three phases (Learn → Build → Grow).
- **Smart weight suggestions** — double progression using only the weights you own; tells you when
  you've outgrown them.
- **3D exercise guides** — a rigged 3D figure performs every rep with the working muscles in red,
  colour-coded dumbbells (2 kg green, 3 kg blue, 5 kg orange), plus steps, cues and common mistakes.
  Falls back to 2D figures when WebGL or the network isn't available.
- **Workout logger** — sets × reps × weight, "last time" numbers, automatic rest timer, personal bests.
- **Progress** — streaks, 12-week calendar, per-exercise charts, bodyweight chart, history.
- **Today's coach** — for your goal, it shows how much you've walked today (+10 / +20 / +30 min buttons)
  and how much lifting to do. Get fit & lose fat aims for a 30-minute walk; build muscle counts walking as
  a bonus. Sleep under 6 hours or high soreness gives an easier day (one set fewer per move). Reaching the
  walk goal gives one set more on the first three moves; for build muscle, that also needs 7+ hours of
  sleep and low soreness.
- **Friends & partner progress** — no account and no server. Copy your share code (`FR1.…`) to a friend,
  paste theirs into the Friends tab, and see their week's workouts, streak, total lifted, 7-day walking and a
14-day activity strip. The
  code holds only those numbers, never bodyweight, sleep, soreness or notes. It's a snapshot: they share
  a new code when they want you to see fresh numbers.
- **Your own 3D character** — Settings → *My 3D character* lets you upload your own Mixamo `.glb`/`.gltf`.
  It's stored only in this browser (IndexedDB) and never uploaded. Mixamo doesn't allow redistributing its
  characters, so the public site can't include one.
- **Phone & tablet ready** — bottom tab bar on iPhone, two-column layout on iPad,
  *Add to Home Screen* for a full-screen app.
- Export / import your data as JSON.

## Run it

It's plain HTML/CSS/JS — no build step. Serve the folder with any static server:

```bash
python -m http.server 5180
```

Open <http://localhost:5180>. On your phone (same Wi-Fi), open `http://<your-computer's-IP>:5180`.
An internet connection is needed for the 3D figure (three.js and the model load from jsDelivr).

The default figure is `assets/character.glb`. To use your own, upload a rigged GLB in Settings → *My 3D
character*, or make one with [tools/rig.html](tools/rig.html). See [models/README.md](models/README.md) for
the Mixamo option.

## Project layout

| File | What it does |
|---|---|
| `index.html` | App shell, tab bar, loads everything |
| `app.js` | Screens: Today (logger), Plan, Exercises, Progress, Settings, first-time setup |
| `program.js` | Builds the personal plan from the setup answers |
| `data.js` | Exercise library (steps, cues, mistakes) and the base A/B programme |
| `anim.js` | Exercise keyframes + 2D animated fallback figures |
| `three-fig.js` | 3D figure: poses a Mixamo-rigged character from the keyframes (three.js) |
| `3d.html` | Stand-alone 3D preview of all exercises |
| `tools/convert-fbx.html` | Converts a Mixamo FBX into a compact GLB |
| `tools/rig.html` | Rig tool: place 15 joints on a humanoid mesh, build a skeleton and export a rigged GLB the app can pose |
| `PLAN.md` | The training plan and design notes |

## Contributing

Issues and pull requests are welcome — new exercises (add an entry in `data.js` and its start/finish
pose in `anim.js`), better poses, translations, accessibility fixes.

## Credits

- [three.js](https://threejs.org) (MIT) for 3D rendering.
- X Bot character from the three.js examples, originally from [Mixamo](https://www.mixamo.com) (Adobe). Used as
  the fallback if the default figure can't load.
- Default figure `assets/character.glb`: a cartoon 3D man made for this project with AI tools (an AI-generated
  image, then an image-to-3D model, rigged with `tools/rig.html`).

## Disclaimer

General fitness guidance, not medical advice. Stop if you feel sharp or joint pain, and check with a
doctor before starting if you have any health condition.

## License

[MIT](LICENSE) © 2026 Ashutosh Anand
