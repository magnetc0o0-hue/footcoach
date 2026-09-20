// Validated football exercise library. The AI can only select exercise IDs
// from this file; session load and timing are enforced by deterministic code.

export const POSITIONS = [
  { id: "kaleci", label: "Goalkeeper" },
  { id: "stoper", label: "Centre Back" },
  { id: "bek", label: "Full Back" },
  { id: "ortasaha", label: "Midfielder" },
  { id: "kanat", label: "Winger" },
  { id: "forvet", label: "Striker" },
];

export const ROLE_OPTIONS = {
  kaleci: ["Shot Stopper", "Sweeper Keeper", "Build-up Goalkeeper"],
  stoper: ["Ball-playing Centre Back", "Stopper", "Cover Defender"],
  bek: ["Attacking Full Back", "Balanced Full Back", "Inverted Full Back"],
  ortasaha: ["No. 6", "Box-to-box No. 8", "Creative No. 10"],
  kanat: ["Touchline Winger", "Inside Forward", "Wide Playmaker"],
  forvet: ["Mobile No. 9", "Target Forward", "Penalty-box Striker"],
};

export const EQUIPMENT = [
  { id: "top", label: "Ball" },
  { id: "koni", label: "Cones" },
  { id: "kale", label: "Goal" },
  { id: "duvar", label: "Wall / Rebounder" },
  { id: "yok", label: "No equipment" },
];

export const TRAINING_ENVIRONMENTS = [
  { id: "small_space", label: "Home / small space", sub: "Bedroom-safe movement area, driveway or garden" },
  { id: "full_pitch", label: "Football pitch", sub: "Space for running, crossing and finishing" },
  { id: "indoor", label: "Indoor court", sub: "Futsal hall or indoor technical space" },
  { id: "gym", label: "Gym", sub: "Strength area with room for controlled movement" },
];

// Real-life places the player can regularly access. Each place maps to an
// exercise environment so weekly sessions can change by day without changing
// the validated drill library.
export const TRAINING_LOCATIONS = [
  { id: "home", label: "Home", sub: "Small indoor space", environment: "small_space", icon: "home" },
  { id: "garden", label: "Garden / driveway", sub: "Small outdoor area", environment: "small_space", icon: "spark" },
  { id: "pitch", label: "Football pitch", sub: "Full outdoor football space", environment: "full_pitch", icon: "ball" },
  { id: "indoor", label: "Indoor court", sub: "Sports hall or futsal court", environment: "indoor", icon: "shield" },
  { id: "gym", label: "Gym", sub: "Strength and movement space", environment: "gym", icon: "bolt" },
];

export const DOMINANT_FEET = [
  { id: "right", label: "Right" },
  { id: "left", label: "Left" },
  { id: "both", label: "Both" },
];

export const SESSION_LENGTHS = [30, 45, 60];

export const COMMITMENTS = [
  { id: "light", label: "Light", sub: "Build consistency around a busy week" },
  { id: "committed", label: "Committed", sub: "Strong development pace with recovery protected" },
  { id: "high", label: "High Development", sub: "Maximise quality work without stacking unsafe load" },
];

export const LIMITATIONS = [
  { id: "none", label: "No current limitation", sub: "Training normally" },
  { id: "returning", label: "Returning from a break", sub: "Ramp volume up more gradually" },
  { id: "discomfort", label: "Minor discomfort", sub: "Keep load conservative and stop if symptoms increase" },
];

// Fixed five-minute preparation block used before every main personal session.
export const MORNING_ROUTINE = [
  {
    id: "warmup-1",
    name: "Dynamic mobility",
    position: "all",
    focus: "warmup",
    equipment: [],
    environment: ["small_space", "full_pitch", "indoor", "gym"],
    duration: 150,
    description: "Easy ankle, hip and hamstring mobility. Move through a comfortable range without forcing stretches.",
  },
  {
    id: "warmup-2",
    name: "Football activation",
    position: "all",
    focus: "warmup",
    equipment: [],
    environment: ["small_space", "full_pitch", "indoor", "gym"],
    duration: 150,
    description: "Light skips, quick feet and controlled direction changes to raise temperature before the main work.",
  },
];


// Short reset block used after main sessions. It is intentionally low load and
// helps structured V7 sessions finish with controlled breathing and mobility.
export const RESET_ROUTINE = [
  {
    id: "reset-1",
    name: "Football reset",
    position: "all",
    focus: "mobility",
    equipment: [],
    environment: ["small_space", "full_pitch", "indoor", "gym"],
    duration: 180,
    description: "Walk, breathe and use easy ankle, hip and hamstring mobility. Finish feeling better than you started the final block.",
  },
];

// Low-load technical habit. Four five-minute blocks create the standard 20-minute routine.
export const BALL_MASTERY = [
  { id: "bm-1", name: "Foundation touches", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Alternate fast inside touches. Stay light on your feet and keep the ball directly under control." },
  { id: "bm-2", name: "Sole rolls + V-pulls", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Roll across the body, pull the ball back and push out at a new angle. Use both feet evenly." },
  { id: "bm-3", name: "Inside-outside rhythm", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Move with repeated inside-outside touches while keeping your head up between contacts." },
  { id: "bm-4", name: "Drag turns + L-turns", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Change direction sharply with the sole and inside of the foot. Accelerate for two touches after each turn." },
  { id: "bm-5", name: "Weak-foot control block", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Use only your weaker foot for controlled touches, pulls and direction changes. Quality before speed." },
  { id: "bm-6", name: "Pull-push combinations", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Pull the ball toward you, push diagonally away, then reset. Build a clean left-right rhythm." },
  { id: "bm-7", name: "Figure-eight dribble", position: "all", focus: "ball_mastery", equipment: ["top", "koni"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Dribble a tight figure eight around two markers. Short touches in the turn, faster touches on the exit." },
  { id: "bm-8", name: "Free-control challenge", position: "all", focus: "ball_mastery", equipment: ["top"], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Link your best moves continuously. Every 30 seconds switch direction, dominant foot or movement pattern." },
];

const ALL = ["small_space", "full_pitch", "indoor", "gym"];
const PITCH = ["full_pitch", "gym"];
const TECH = ["small_space", "full_pitch", "indoor", "gym"];

export const EXERCISES = [
  // Goalkeeper
  { id: "gk-1", name: "Wall reaction catches", position: "kaleci", focus: "reaksiyon", equipment: ["duvar", "top"], environment: TECH, duration: 420, description: "React to unpredictable rebounds with a balanced set position. Reset your feet before every repetition." },
  { id: "gk-2", name: "Starting-position footwork", position: "kaleci", focus: "ayak_teknigi", equipment: ["top"], environment: ALL, duration: 420, description: "Shuffle, set and move into line with the ball. Keep every movement controlled before adding speed." },
  { id: "gk-3", name: "Handling fundamentals", position: "kaleci", focus: "elle_oynama", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Work clean hand shape on low, mid-height and chest-level rebounds without diving into unsafe space." },
  { id: "gk-4", name: "Short distribution quality", position: "kaleci", focus: "dagitim", equipment: ["top"], environment: ALL, duration: 480, description: "Play accurate passes from different starting angles with both feet. Scan before each first touch." },
  { id: "gk-5", name: "Set-step reaction pattern", position: "kaleci", focus: "reaksiyon", equipment: ["top"], environment: ALL, duration: 420, description: "Use a quick lateral step, set your base and react to a self-served ball. Stay technically clean rather than chasing speed." },

  // Centre back
  { id: "def-1", name: "1v1 defending footwork", position: "stoper", focus: "savunma", equipment: [], environment: ALL, duration: 480, description: "Rehearse side-on body shape, controlled drop steps and the moment to close space without diving in." },
  { id: "def-2", name: "Progressive passing block", position: "stoper", focus: "pas", equipment: ["top"], environment: ALL, duration: 540, description: "Alternate firm short passes with longer driven passes when space allows. Receive across your body before playing." },
  { id: "def-3", name: "Scan-before-receive circuit", position: "stoper", focus: "tarama", equipment: ["top"], environment: ALL, duration: 480, description: "Check both shoulders before every receive, open your body and play into the next imagined line." },
  { id: "def-4", name: "First-touch escape", position: "stoper", focus: "ilk_temas", equipment: ["top", "duvar"], environment: TECH, duration: 540, description: "Receive from a wall and take the first touch away from pressure before playing the next pass." },
  { id: "def-5", name: "Back-foot receive + switch", position: "stoper", focus: "pas", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Receive on the back foot, move the ball across your body and play through a new passing angle." },

  // Full back
  { id: "fb-1", name: "1v1 channel defending", position: "bek", focus: "savunma", equipment: ["koni"], environment: ALL, duration: 480, description: "Use cones as a channel. Practise showing the attacker away from danger while keeping a recoverable body position." },
  { id: "fb-2", name: "Overlap acceleration repeats", position: "bek", focus: "hiz", equipment: ["koni"], environment: PITCH, duration: 480, description: "Build from controlled acceleration into fast overlap runs. Take full recovery between high-quality repetitions." },
  { id: "fb-3", name: "Moving cross technique", position: "bek", focus: "orta", equipment: ["top", "koni"], environment: PITCH, duration: 540, description: "Carry at match-like speed, set the final touch and deliver into a target zone with both driven and clipped technique." },
  { id: "fb-4", name: "Tight-space direction changes", position: "bek", focus: "calim", equipment: ["koni", "top"], environment: TECH, duration: 480, description: "Attack a marker, sell the first direction and escape with an explosive first touch into the new lane." },
  { id: "fb-5", name: "Receive, scan, play forward", position: "bek", focus: "ilk_temas", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Receive from the side, scan inside and use the first touch to open a forward passing lane." },

  // Midfielder
  { id: "mid-1", name: "One-touch passing rhythm", position: "ortasaha", focus: "pas", equipment: ["top", "duvar"], environment: TECH, duration: 540, description: "Build a crisp one-touch rhythm off a wall. Change distance and passing foot without losing body shape." },
  { id: "mid-2", name: "Half-turn receiving", position: "ortasaha", focus: "tarama", equipment: ["top"], environment: ALL, duration: 480, description: "Check your shoulder, receive side-on and take the ball into the next action with one efficient touch." },
  { id: "mid-3", name: "Tight-space ball protection", position: "ortasaha", focus: "top_kontrol", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Use short touches and body positioning inside a small box. Escape through a new gate every few contacts." },
  { id: "mid-4", name: "First-touch direction change", position: "ortasaha", focus: "ilk_temas", equipment: ["top", "duvar"], environment: TECH, duration: 540, description: "Receive from a wall and use the first touch to exit left, right or forward based on a pre-selected cue." },
  { id: "mid-5", name: "Two-foot tempo passing", position: "ortasaha", focus: "pas", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Alternate feet and passing angles while maintaining a quick, relaxed tempo. Scan away from the ball before each return." },

  // Winger
  { id: "wing-1", name: "1v1 slalom + exit", position: "kanat", focus: "calim", equipment: ["koni", "top"], environment: TECH, duration: 540, description: "Attack each cone with intent, use one decisive move and accelerate for three touches after the exit." },
  { id: "wing-2", name: "Acceleration ladder", position: "kanat", focus: "hiz", equipment: ["koni"], environment: PITCH, duration: 480, description: "Run 10–20–30 metre accelerations with full recovery. Stop the set when speed or mechanics noticeably drop." },
  { id: "wing-3", name: "Angle finishing", position: "kanat", focus: "bitiricilik", equipment: ["top", "kale"], environment: PITCH, duration: 600, description: "Approach from both sides and finish across goal, near post and after a small direction change." },
  { id: "wing-4", name: "First touch into acceleration", position: "kanat", focus: "ilk_temas", equipment: ["top"], environment: ALL, duration: 480, description: "Push the first touch into space and accelerate immediately. Alternate inside and outside foot receptions." },
  { id: "wing-5", name: "Small-space change of pace", position: "kanat", focus: "calim", equipment: ["top", "koni"], environment: TECH, duration: 480, description: "Use a compact box to rehearse slow-fast tempo changes, shoulder drops and explosive exits." },

  // Striker
  { id: "fwd-1", name: "One-touch finishing patterns", position: "forvet", focus: "bitiricilik", equipment: ["top", "kale"], environment: PITCH, duration: 600, description: "Finish with minimal touches from different angles. Alternate feet and reset your body shape between repetitions." },
  { id: "fwd-2", name: "Movement off the shoulder", position: "forvet", focus: "hareket", equipment: ["koni"], environment: ALL, duration: 480, description: "Use markers as defenders. Check away, curve the run and accelerate into the space behind." },
  { id: "fwd-3", name: "Receive, pin and turn", position: "forvet", focus: "ilk_temas", equipment: ["top"], environment: ALL, duration: 540, description: "Receive with your back to goal, protect the ball and use the first touch to create a clean turning angle." },
  { id: "fwd-4", name: "1v1 finishing move", position: "forvet", focus: "calim", equipment: ["top", "kale"], environment: PITCH, duration: 540, description: "Approach under control, commit the imaginary keeper with one move and finish immediately after the touch." },
  { id: "fwd-5", name: "Sharp-touch finishing prep", position: "forvet", focus: "bitiricilik", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Bounce the ball off a wall, set it with one touch and strike a controlled pass into a small target area." },
];

// V7 professional training taxonomy. "Technique" isolates mechanics; "Game Realistic"
// adds scanning, decisions or a match-like action; "Physical" targets football movement
// qualities; "Recovery" and "Activation" deliberately keep load low.
export const TRAINING_TYPES = {
  technique: { id: "technique", label: "Technique", short: "TECHNIQUE", description: "Own the mechanics with clean, repeatable actions." },
  game_realistic: { id: "game_realistic", label: "Game Realistic", short: "GAME REALISTIC", description: "Scan, decide and execute in a match-like football moment." },
  physical: { id: "physical", label: "Physical", short: "PHYSICAL", description: "Football-specific speed, movement or strength quality." },
  recovery: { id: "recovery", label: "Recovery", short: "RECOVERY", description: "Low-load work that supports the next quality session." },
  activation: { id: "activation", label: "Activation", short: "ACTIVATION", description: "Prepare the body and movement patterns for training." },
};

// Extra validated drills broaden the library so the coach can build sessions around
// different football situations instead of rotating the same small set of exercises.
EXERCISES.push(
  // Goalkeeper — technique, decision/action and movement
  { id: "gk-6", name: "Set-save-recover sequence", position: "kaleci", focus: "reaksiyon", equipment: ["top", "duvar"], environment: TECH, duration: 480, description: "Play the ball into the wall, set for the rebound, secure it cleanly and recover your feet into a second set position before repeating." },
  { id: "gk-7", name: "Pressure distribution scan", position: "kaleci", focus: "dagitim", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Scan a left or right cue before receiving, open your body and play quickly through the selected gate with both feet." },
  { id: "gk-8", name: "Explosive set-position footwork", position: "kaleci", focus: "ayak_teknigi", equipment: ["koni"], environment: ["full_pitch", "indoor", "gym"], duration: 420, description: "Move through short shuffle and crossover patterns, then arrive balanced in a goalkeeper set position. Full recovery between sharp repetitions." },

  // Centre back
  { id: "def-6", name: "Press-trigger shadow defending", position: "stoper", focus: "savunma", equipment: ["koni"], environment: ALL, duration: 480, description: "Use markers as attacker positions. Drop, hold or step forward on a visual cue while keeping a side-on, recoverable body shape." },
  { id: "def-7", name: "Line-break pass after scan", position: "stoper", focus: "pas", equipment: ["top", "duvar"], environment: TECH, duration: 540, description: "Scan before the return pass, receive across your body and punch the next pass through a narrow target gate as if breaking the first press." },
  { id: "def-8", name: "Recovery run + defend channel", position: "stoper", focus: "savunma", equipment: ["koni"], environment: ["full_pitch", "indoor", "gym"], duration: 480, description: "Accelerate back toward goal, decelerate under control and finish in a side-on defending stance. Keep every rep sharp rather than exhausting." },

  // Full back
  { id: "fb-6", name: "Touchline receive + escape", position: "bek", focus: "ilk_temas", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Receive near a touchline marker, scan inside and use the first touch to escape either down the line or into the half-space." },
  { id: "fb-7", name: "Crossing decision circuit", position: "bek", focus: "orta", equipment: ["top", "koni"], environment: ["full_pitch", "indoor"], duration: 600, description: "Carry into the final third, read a cue for early, cut-back or deeper delivery, then execute into a marked target zone." },
  { id: "fb-8", name: "Recovery run to wide duel", position: "bek", focus: "hiz", equipment: ["koni"], environment: ["full_pitch", "indoor", "gym"], duration: 480, description: "Sprint back through a recovery lane, slow under control and finish in a balanced 1v1 stance. Use complete recovery between high-quality reps." },

  // Midfielder
  { id: "mid-6", name: "Scan-turn-play sequence", position: "ortasaha", focus: "tarama", equipment: ["top", "duvar"], environment: TECH, duration: 540, description: "Check both shoulders before the ball returns, receive on the half-turn and play the next pass through a different angle each repetition." },
  { id: "mid-7", name: "Pressure escape box", position: "ortasaha", focus: "top_kontrol", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Receive inside a tight box, protect the first touch and escape through a called gate within two or three touches." },
  { id: "mid-8", name: "Sprint-to-receive transition", position: "ortasaha", focus: "hiz", equipment: ["top", "koni"], environment: ["full_pitch", "indoor"], duration: 480, description: "Accelerate five to ten metres, check your shoulder, then receive and control the ball immediately after the run. Recover fully between sets." },

  // Winger
  { id: "wing-6", name: "Commit defender + exit", position: "kanat", focus: "calim", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Drive at a defender marker, slow enough to sell the move, then explode past it with one decisive action and three fast exit touches." },
  { id: "wing-7", name: "Cut-in decision finish", position: "kanat", focus: "bitiricilik", equipment: ["top", "kale", "koni"], environment: ["full_pitch"], duration: 600, description: "Start wide, attack inside and use a late cue to choose far-post, near-post or an extra touch before finishing." },
  { id: "wing-8", name: "Wide acceleration + brake", position: "kanat", focus: "hiz", equipment: ["koni"], environment: ["full_pitch", "indoor", "gym"], duration: 480, description: "Accelerate down a wide channel, decelerate under control at the marker and re-accelerate. Keep the number of maximal reps low and clean." },

  // Striker
  { id: "fwd-6", name: "Check away, receive, spin", position: "forvet", focus: "hareket", equipment: ["top", "koni"], environment: TECH, duration: 540, description: "Check away from a defender marker, arrive back to the ball, secure the first touch and spin into the opposite space." },
  { id: "fwd-7", name: "Near-post / far-post timing", position: "forvet", focus: "hareket", equipment: ["koni"], environment: ["full_pitch", "indoor"], duration: 480, description: "Use markers for centre backs and rehearse delaying, double-moving and accelerating across near-post and far-post finishing lanes." },
  { id: "fwd-8", name: "Explosive first three steps", position: "forvet", focus: "hiz", equipment: ["koni"], environment: ["full_pitch", "indoor", "gym"], duration: 420, description: "Start from different striker body positions and explode for three to five steps. Take full recovery so every repetition stays fast." }
);

const EXERCISE_META = {
  "gk-1": ["game_realistic", "Reaction save"], "gk-2": ["technique", "Set position"], "gk-3": ["technique", "Handling"], "gk-4": ["technique", "Build-up"], "gk-5": ["game_realistic", "Set + react"], "gk-6": ["game_realistic", "Second action"], "gk-7": ["game_realistic", "Play through pressure"], "gk-8": ["physical", "Goalkeeper movement"],
  "def-1": ["technique", "1v1 defending"], "def-2": ["technique", "Build-up passing"], "def-3": ["game_realistic", "Scan + receive"], "def-4": ["game_realistic", "Escape pressure"], "def-5": ["technique", "Switch play"], "def-6": ["game_realistic", "Press or hold"], "def-7": ["game_realistic", "Break the press"], "def-8": ["physical", "Recovery defending"],
  "fb-1": ["technique", "Wide 1v1 defend"], "fb-2": ["physical", "Overlap run"], "fb-3": ["technique", "Crossing"], "fb-4": ["technique", "Escape 1v1"], "fb-5": ["game_realistic", "Receive + progress"], "fb-6": ["game_realistic", "Touchline pressure"], "fb-7": ["game_realistic", "Final-third delivery"], "fb-8": ["physical", "Recovery run"],
  "mid-1": ["technique", "Passing rhythm"], "mid-2": ["game_realistic", "Receive between lines"], "mid-3": ["technique", "Protect the ball"], "mid-4": ["game_realistic", "First-touch decision"], "mid-5": ["technique", "Tempo passing"], "mid-6": ["game_realistic", "Scan-turn-play"], "mid-7": ["game_realistic", "Escape pressure"], "mid-8": ["physical", "Transition movement"],
  "wing-1": ["technique", "1v1 move"], "wing-2": ["physical", "Acceleration"], "wing-3": ["technique", "Angle finishing"], "wing-4": ["game_realistic", "Receive + explode"], "wing-5": ["technique", "Change of pace"], "wing-6": ["game_realistic", "Isolate defender"], "wing-7": ["game_realistic", "Cut inside + finish"], "wing-8": ["physical", "Wide acceleration"],
  "fwd-1": ["technique", "One-touch finish"], "fwd-2": ["game_realistic", "Run in behind"], "fwd-3": ["game_realistic", "Back to goal"], "fwd-4": ["game_realistic", "Beat keeper"], "fwd-5": ["technique", "Finishing prep"], "fwd-6": ["game_realistic", "Check + spin"], "fwd-7": ["game_realistic", "Box movement"], "fwd-8": ["physical", "Explosive separation"],
};

export function exerciseMeta(exerciseOrId) {
  const id = typeof exerciseOrId === "string" ? exerciseOrId : exerciseOrId?.id;
  if (!id) return { trainingType: "technique", gameMoment: "Technical quality" };
  if (id.startsWith("warmup-")) return { trainingType: "activation", gameMoment: "Preparation" };
  if (id.startsWith("reset-")) return { trainingType: "recovery", gameMoment: "Session reset" };
  if (id.startsWith("bm-")) return { trainingType: "technique", gameMoment: "Ball mastery" };
  if (id.startsWith("adapt-1")) return { trainingType: "recovery", gameMoment: "Recovery" };
  if (id.startsWith("adapt-")) return { trainingType: "physical", gameMoment: "Movement quality" };
  const meta = EXERCISE_META[id] || ["technique", "Technical quality"];
  return { trainingType: meta[0], gameMoment: meta[1] };
}

export function enrichExercise(exercise) {
  return exercise ? { ...exercise, ...exerciseMeta(exercise) } : exercise;
}


// Validated low-risk rescue-session blocks. These are used when real life
// changes (weather, no pitch, no ball, short time). They intentionally avoid
// maximal conditioning and can be completed in a small space without equipment.
export const ADAPTIVE_EXERCISES = [
  { id: "adapt-1", name: "Mobility reset", position: "all", focus: "mobility", equipment: [], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Move through ankles, hips and hamstrings with controlled ranges. Keep the effort easy and smooth." },
  { id: "adapt-2", name: "Single-leg control", position: "all", focus: "strength", equipment: [], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 360, description: "Alternate slow single-leg balance, calf raises and controlled reaches. Quality and alignment matter more than reps." },
  { id: "adapt-3", name: "Football core stability", position: "all", focus: "strength", equipment: [], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 360, description: "Cycle through dead-bug, side-plank and controlled trunk stability work. Stop before form breaks down." },
  { id: "adapt-4", name: "Low-impact footwork", position: "all", focus: "ayak_teknigi", equipment: [], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 300, description: "Use quick but quiet feet, small lateral steps and body-position changes without maximal jumping or sprinting." },
  { id: "adapt-5", name: "Bodyweight strength control", position: "all", focus: "strength", equipment: [], environment: ["small_space", "full_pitch", "indoor", "gym"], duration: 420, description: "Use controlled squats, split-squat holds and push-up variations at a submaximal effort. Leave clean reps in reserve." },
];

export function focusAreasFor(positionId) {
  const seen = new Set();
  return EXERCISES.filter((exercise) => exercise.position === positionId)
    .map((exercise) => exercise.focus)
    .filter((focus) => !seen.has(focus) && seen.add(focus));
}

export function exercisesFor(positionId, equipmentIds, environment = null) {
  const equipment = Array.isArray(equipmentIds) ? equipmentIds : [];
  return EXERCISES.filter((exercise) => {
    const gearOk = exercise.equipment.every((item) => equipment.includes(item));
    const environmentOk = !environment || !exercise.environment || exercise.environment.includes(environment);
    return exercise.position === positionId && gearOk && environmentOk;
  }).map(enrichExercise);
}
