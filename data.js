// Exercise library + program definition. Weights are per hand unless "oneDb" is true.
const EXERCISES = {
  goblet_squat: {
    name: "Goblet Squat", muscles: ["Quads", "Glutes", "Core"], type: "reps",
    start: 5, oneDb: true, icon: "🦵",    steps: [
      "Hold one dumbbell vertically at your chest with both hands, elbows pointing down.",
      "Feet slightly wider than shoulders, toes turned out a little.",
      "Push hips back and bend knees, sit down between your heels as low as comfortable.",
      "Keep chest up; drive through the whole foot to stand back up."
    ],
    cues: ["Knees follow your toes", "Chest proud, eyes forward", "Breathe in going down, out coming up"],
    mistakes: ["Heels lifting off the floor", "Knees caving inward", "Rounding the lower back at the bottom"],
    easier: "Squat to a chair (touch and stand)", harder: "Bulgarian split squat (rear foot on a chair)"
  },
  floor_press: {
    name: "Dumbbell Floor Press", muscles: ["Chest", "Triceps", "Front shoulders"], type: "reps",
    start: 3, icon: "💪",
    steps: [
      "Lie on your back, knees bent, feet flat. A dumbbell in each hand.",
      "Upper arms on the floor at ~45° from your body, forearms vertical.",
      "Press the dumbbells straight up until arms are straight above your chest.",
      "Lower slowly until your upper arms touch the floor; pause 1 second."
    ],
    cues: ["Elbows at 45°, not flared out to 90°", "Squeeze your chest at the top", "Lower in 2–3 seconds"],
    mistakes: ["Bouncing elbows off the floor", "Arching the lower back", "Wrists bent backward"],
    easier: "Lighter dumbbells / fewer reps", harder: "Slow 4-second lowering, or single-arm press"
  },
  db_row: {
    name: "One-Arm Dumbbell Row", muscles: ["Upper back", "Lats", "Biceps"], type: "reps",
    start: 5, perSide: true, icon: "🚣",
    steps: [
      "Put your left hand and left knee on a bed/bench (or hand on a chair, staggered stance).",
      "Back flat like a table, dumbbell hanging in your right hand.",
      "Pull the dumbbell toward your hip, elbow close to your body.",
      "Lower slowly until the arm is straight. Do all reps, then switch sides."
    ],
    cues: ["Pull with your elbow, not your hand", "Squeeze shoulder blade back at the top", "Don't twist your torso"],
    mistakes: ["Jerking the weight up", "Rounding your back", "Shrugging toward the ear"],
    easier: "Fewer reps, pause at top", harder: "3-second lowering + 1-second squeeze at the top"
  },
  shoulder_press: {
    name: "Seated Shoulder Press", muscles: ["Shoulders", "Triceps"], type: "reps",
    start: 3, icon: "🙌",
    steps: [
      "Sit tall on a chair, dumbbells at shoulder height, palms facing forward.",
      "Brace your stomach as if about to be poked.",
      "Press up until arms are straight overhead, dumbbells nearly touching.",
      "Lower back to shoulder height with control."
    ],
    cues: ["Ribs down, don't lean back", "Head slightly forward at the top", "Wrists stacked over elbows"],
    mistakes: ["Arching the lower back", "Half reps", "Letting elbows drift far behind"],
    easier: "One arm at a time", harder: "Standing press, slow lowering"
  },
  biceps_curl: {
    name: "Biceps Curl", muscles: ["Biceps", "Forearms"], type: "reps",
    start: 3, icon: "💪",
    steps: [
      "Stand tall, dumbbells at your sides, palms facing forward.",
      "Keeping elbows pinned to your sides, curl the weights up to your shoulders.",
      "Squeeze for a moment at the top.",
      "Lower slowly all the way until arms are straight."
    ],
    cues: ["Elbows don't move", "No swinging", "Full straighten at the bottom"],
    mistakes: ["Swinging with the back", "Elbows drifting forward", "Dropping the weight fast"],
    easier: "Alternate arms", harder: "3-second lowering, or hammer curls (palms facing in)"
  },
  plank: {
    name: "Plank", muscles: ["Core", "Shoulders"], type: "time",
    start: 0, icon: "🧱",
    steps: [
      "Forearms on the floor, elbows under shoulders.",
      "Step feet back; body forms a straight line from head to heels.",
      "Squeeze glutes and brace stomach.",
      "Hold for the target time while breathing normally."
    ],
    cues: ["Squeeze your butt", "Push the floor away with forearms", "Breathe — don't hold your breath"],
    mistakes: ["Hips sagging", "Butt high in the air", "Looking up (neck strain)"],
    easier: "Plank on knees", harder: "Lift one foot an inch for each half of the hold"
  },
  rdl: {
    name: "Romanian Deadlift", muscles: ["Hamstrings", "Glutes", "Lower back"], type: "reps",
    start: 5, icon: "🏋️", imgNote: "Keep a soft bend in the knees and stop when you feel the hamstring stretch — you don't need to go as low as shown.",
    steps: [
      "Stand with feet hip-width, dumbbell in each hand in front of thighs.",
      "Soft bend in the knees — keep it the same the whole time.",
      "Push hips straight back, sliding dumbbells down the front of your legs, back flat.",
      "Go until you feel a stretch in the back of your thighs (usually around shins), then squeeze glutes to stand."
    ],
    cues: ["It's a hip hinge, not a squat", "Dumbbells stay close to legs", "Flat back, neck neutral"],
    mistakes: ["Rounding the back", "Bending knees too much (turns into a squat)", "Leaning back at the top"],
    easier: "Practice the hinge with no weight, hands on hips", harder: "Single-leg RDL"
  },
  pushup: {
    name: "Push-up", muscles: ["Chest", "Triceps", "Core"], type: "reps",
    start: 0, icon: "🤸", imgNote: "Shown as an incline push-up (hands on a table) — the best way to start. A bed edge or wall works too.",
    steps: [
      "Hands slightly wider than shoulders. Start on an incline (table/bed edge) or on knees if needed.",
      "Body straight from head to knees/heels, stomach braced.",
      "Lower chest toward the floor/surface, elbows at 45°.",
      "Push back up to straight arms."
    ],
    cues: ["Body moves as one plank", "Elbows back, not out", "Full range: chest close to surface"],
    mistakes: ["Hips sagging", "Head poking forward", "Tiny half reps"],
    easier: "Incline push-up (hands on table) or knee push-up", harder: "Lower the incline, then full push-up"
  },
  reverse_lunge: {
    name: "Reverse Lunge", muscles: ["Quads", "Glutes", "Balance"], type: "reps",
    start: 0, perSide: true, canLoad: true, icon: "🚶", imgNote: "Hold a chair or wall for balance at first.",
    steps: [
      "Stand tall, feet hip-width (hold a chair/wall for balance at first).",
      "Step one foot back about 2 feet and lower until the back knee is just above the floor.",
      "Front shin stays roughly vertical.",
      "Push through the front heel to return. Do all reps on one side, then switch."
    ],
    cues: ["Torso tall", "Front knee tracks over toes", "Control the way down"],
    mistakes: ["Slamming the back knee", "Front heel lifting", "Wobbling — use support"],
    easier: "Hold a wall/chair, shorter range", harder: "Hold dumbbells, or Bulgarian split squat"
  },
  lateral_raise: {
    name: "Lateral Raise", muscles: ["Side shoulders"], type: "reps",
    start: 2, icon: "🦅",
    steps: [
      "Stand tall, dumbbells at your sides, slight bend in elbows.",
      "Raise arms out to the sides until hands reach shoulder height.",
      "Lead with elbows, thumbs neutral (not pointing up).",
      "Lower slowly over 2–3 seconds."
    ],
    cues: ["Light weight, strict form", "Shoulders down, away from ears", "Stop at shoulder height"],
    mistakes: ["Swinging the body", "Shrugging", "Going too heavy"],
    easier: "One arm at a time", harder: "Pause 1 second at the top"
  },
  oh_triceps: {
    name: "Overhead Triceps Extension", muscles: ["Triceps"], type: "reps",
    start: 3, oneDb: true, icon: "🔨",
    steps: [
      "Sit or stand tall, holding one dumbbell with both hands overhead (hands cupping the top end).",
      "Keep upper arms close to your head.",
      "Bend elbows to lower the dumbbell behind your head.",
      "Straighten arms to lift it back up."
    ],
    cues: ["Elbows point forward, not out", "Ribs down", "Only the forearms move"],
    mistakes: ["Elbows flaring wide", "Arching the back", "Going too fast"],
    easier: "Do it lying on the floor", harder: "Slow 3-second lowering"
  },
  glute_bridge: {
    name: "Glute Bridge", muscles: ["Glutes", "Hamstrings"], type: "reps",
    start: 5, oneDb: true, icon: "🌉", imgNote: "Shown without weight — rest one dumbbell on your hip bones once bodyweight feels easy.",
    steps: [
      "Lie on your back, knees bent, feet flat near your butt.",
      "Rest one dumbbell on your hip bones, holding it in place.",
      "Push through heels and squeeze glutes to lift hips until body is straight from knees to shoulders.",
      "Hold 1 second at the top, lower slowly."
    ],
    cues: ["Squeeze glutes hard at the top", "Ribs down — don't arch the back", "Push through heels"],
    mistakes: ["Overarching lower back", "Feet too far away", "Rushing reps"],
    easier: "No weight", harder: "Single-leg glute bridge"
  },
  dead_bug: {
    name: "Dead Bug", muscles: ["Core (deep abs)"], type: "reps",
    start: 0, perSide: true, icon: "🐞",
    steps: [
      "Lie on your back, arms straight up to the ceiling, knees bent at 90° above hips.",
      "Press your lower back flat into the floor.",
      "Slowly lower the opposite arm and leg toward the floor without letting the back lift.",
      "Return and switch sides."
    ],
    cues: ["Lower back glued to the floor", "Move slowly", "Exhale as you extend"],
    mistakes: ["Back arching off the floor", "Moving too fast", "Holding breath"],
    easier: "Move only the legs", harder: "Hold a 2 kg dumbbell in each hand"
  }
};

// Program: 3 days/week alternating A/B. sets = base sets in Build phase.
const WORKOUTS = {
  A: {
    title: "Workout A — Squat, Press, Row",
    items: [
      { id: "goblet_squat", sets: 3, min: 8, max: 15 },
      { id: "floor_press", sets: 3, min: 8, max: 15 },
      { id: "db_row", sets: 3, min: 8, max: 15 },
      { id: "shoulder_press", sets: 2, min: 8, max: 15 },
      { id: "biceps_curl", sets: 2, min: 10, max: 15 },
      { id: "plank", sets: 3, min: 20, max: 40 }
    ]
  },
  B: {
    title: "Workout B — Hinge, Push-up, Lunge",
    items: [
      { id: "rdl", sets: 3, min: 8, max: 15 },
      { id: "pushup", sets: 3, min: 5, max: 15 },
      { id: "reverse_lunge", sets: 2, min: 8, max: 12 },
      { id: "lateral_raise", sets: 2, min: 10, max: 15 },
      { id: "oh_triceps", sets: 2, min: 10, max: 15 },
      { id: "glute_bridge", sets: 3, min: 12, max: 20 },
      { id: "dead_bug", sets: 2, min: 6, max: 10 }
    ]
  }
};

const PHASES = [
  { name: "Learn", weeks: [1, 2], setsDelta: -1, minSets: 2, rir: "Stop with 3–4 reps left in the tank", note: "Form first. Light is fine. The goal is to learn the movements and get the habit going." },
  { name: "Build", weeks: [3, 6], setsDelta: 0, minSets: 2, rir: "Stop with ~2 reps left in the tank", note: "Full sets. Add a rep or two each session; move up a dumbbell when you hit the top of the range on every set." },
  { name: "Grow", weeks: [7, 12], setsDelta: 0, extraSetFirstTwo: true, minSets: 2, rir: "Stop with ~1 rep left; lower slowly (3 s)", note: "One extra set on the first two exercises. Use slow lowering and pauses once you're at your heaviest dumbbell." }
];

const WARMUP = ["Arm circles — 20 s each way", "Bodyweight squats × 10", "Hip hinges (hands on hips) × 10", "Cat-cow × 10", "Light set of the first exercise"];
const COOLDOWN = ["Hamstring stretch — 30 s/leg", "Chest stretch in a doorway — 30 s", "Child's pose — 45 s"];
