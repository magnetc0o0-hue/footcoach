import { ADAPTIVE_EXERCISES, BALL_MASTERY, EXERCISES, MORNING_ROUTINE, RESET_ROUTINE, TRAINING_LOCATIONS, enrichExercise } from "./exercises.js";
import { feedbackSignal } from "./development.js";

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const FOCUS_LABELS = {
  reaksiyon: "Reactions",
  ayak_teknigi: "Footwork",
  elle_oynama: "Handling",
  dagitim: "Distribution",
  savunma: "Defending",
  pas: "Passing",
  tarama: "Scanning",
  ilk_temas: "First touch",
  hiz: "Speed",
  orta: "Crossing",
  calim: "1v1 dribbling",
  top_kontrol: "Ball control",
  bitiricilik: "Finishing",
  hareket: "Movement",
  ball_mastery: "Ball mastery",
  warmup: "Warm-up",
  mobility: "Mobility",
  strength: "Strength",
};

export const LEVELS = [
  { id: "beginner", label: "Beginner", sub: "Building the fundamentals" },
  { id: "developing", label: "Developing", sub: "Training regularly and improving" },
  { id: "competitive", label: "Competitive", sub: "Playing in a structured team environment" },
  { id: "advanced", label: "Advanced", sub: "Training consistently at a high level" },
];

export const TYPE_META = {
  personal: { label: "Personal", icon: "bolt", tone: "personal" },
  team: { label: "Team", icon: "users", tone: "team" },
  match: { label: "Match", icon: "trophy", tone: "match" },
  recovery: { label: "Recovery", icon: "heart", tone: "recovery" },
  rest: { label: "Rest", icon: "moon", tone: "rest" },
};

export const LS = {
  profile: "fac_profile",
  plan: "fac_plan",
  sessions: "fac_sessions",
  activeWorkout: "fac_active_workout",
  readiness: "fac_daily_readiness",
  weekOverrides: "fac_week_overrides",
};

const VALID_COMMITMENTS = new Set(["light", "committed", "high"]);
const VALID_ENVIRONMENTS = new Set(["small_space", "full_pitch", "indoor", "gym"]);
const VALID_FEET = new Set(["right", "left", "both"]);
const VALID_LIMITATIONS = new Set(["none", "returning", "discomfort"]);
const VALID_LENGTHS = new Set([30, 45, 60]);
const VALID_LOCATIONS = new Set(TRAINING_LOCATIONS.map((item) => item.id));
const LOCATION_ENV = Object.fromEntries(TRAINING_LOCATIONS.map((item) => [item.id, item.environment]));

export function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLS(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in privacy modes. The app still works for the current session.
  }
}

const WORKOUT_BACKGROUND_RESUME_LIMIT_MS = 15 * 60 * 1000;

export function rehydrateActiveWorkout(input, nowMs = Date.now()) {
  if (!input || typeof input !== "object") return null;
  const workout = { ...input };
  const activePhase = ["exercise", "rest"].includes(workout.phase);
  const persistedAtMs = Date.parse(workout.lastPersistedAt || workout.updatedAt || workout.createdAt || "");

  if (!activePhase || !workout.running) {
    return { ...workout, running: false };
  }

  if (!Number.isFinite(persistedAtMs)) {
    return { ...workout, running: false, resumeNotice: true };
  }

  const gapMs = Math.max(0, Number(nowMs) - persistedAtMs);
  if (gapMs > WORKOUT_BACKGROUND_RESUME_LIMIT_MS) {
    return { ...workout, running: false, resumeNotice: true, lastPersistedAt: new Date(nowMs).toISOString() };
  }

  const exerciseIds = Array.isArray(workout.exerciseIds) ? workout.exerciseIds : [];
  if (!exerciseIds.length) return { ...workout, running: false };

  let phase = workout.phase;
  let index = Math.min(Math.max(0, Number(workout.index || 0)), exerciseIds.length - 1);
  let remainingMs = Number.isFinite(Number(workout.remainingMs))
    ? Math.max(0, Number(workout.remainingMs))
    : Math.max(0, Number(workout.remaining || 0) * 1000);
  let elapsedMs = Math.max(0, Number(workout.elapsedSeconds || 0) * 1000);
  let gap = gapMs;
  let running = true;
  let safety = 0;
  const restMs = Math.max(0, Number(workout.restSeconds || (workout.kind === "ball_mastery" ? 20 : 45)) * 1000);
  const durationFor = (exerciseIndex) => Math.max(0, Number(workout.exerciseDurations?.[exerciseIds[exerciseIndex]] || 0) * 1000);

  while (running && gap > 0 && safety < exerciseIds.length * 3 + 6) {
    safety += 1;
    if (remainingMs > gap) {
      remainingMs -= gap;
      elapsedMs += gap;
      gap = 0;
      break;
    }

    elapsedMs += remainingMs;
    gap = Math.max(0, gap - remainingMs);

    if (phase === "exercise") {
      if (index >= exerciseIds.length - 1) {
        phase = "complete";
        remainingMs = 0;
        running = false;
        break;
      }
      phase = "rest";
      remainingMs = restMs;
    } else {
      index = Math.min(index + 1, exerciseIds.length - 1);
      phase = "exercise";
      remainingMs = durationFor(index);
    }

    if (remainingMs <= 0 && gap <= 0) break;
  }

  return {
    ...workout,
    phase,
    index,
    remainingMs,
    remaining: Math.ceil(remainingMs / 1000),
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    running,
    resumeNotice: false,
    lastPersistedAt: new Date(nowMs).toISOString(),
  };
}

export function exerciseById(id) {
  const exercise = EXERCISES.find((item) => item.id === id)
    || MORNING_ROUTINE.find((item) => item.id === id)
    || RESET_ROUTINE.find((item) => item.id === id)
    || BALL_MASTERY.find((item) => item.id === id)
    || ADAPTIVE_EXERCISES.find((item) => item.id === id);
  return enrichExercise(exercise);
}

export function normalizeClientProfile(input) {
  if (!input) return null;
  const teamDays = Array.isArray(input.teamDays)
    ? input.teamDays
    : Object.keys(input.teamSchedule || {}).map(Number);
  const availableDays = Array.isArray(input.availableDays)
    ? input.availableDays
    : Object.keys(input.personalSchedule || {}).map(Number);
  const matchDay = Number.isInteger(input.matchDay)
    ? input.matchDay
    : Array.isArray(input.matchDays) && input.matchDays.length
      ? Number(input.matchDays[0])
      : null;
  const goals = Array.isArray(input.goals) ? input.goals : input.focus || [];
  const primaryGoal = goals.includes(input.primaryGoal) ? input.primaryGoal : goals[0] || null;
  const sessionLength = VALID_LENGTHS.has(Number(input.sessionLength)) ? Number(input.sessionLength) : 45;
  const commitment = VALID_COMMITMENTS.has(input.commitment) ? input.commitment : "committed";
  const environment = VALID_ENVIRONMENTS.has(input.environment) ? input.environment : "small_space";
  const dominantFoot = VALID_FEET.has(input.dominantFoot) ? input.dominantFoot : "right";
  const limitation = VALID_LIMITATIONS.has(input.limitation) ? input.limitation : "none";
  const position = input.position || "ortasaha";
  const secondaryPosition = input.secondaryPosition && input.secondaryPosition !== position ? input.secondaryPosition : null;
  const legacyLocationByEnvironment = { small_space: "home", full_pitch: "pitch", indoor: "indoor", gym: "gym" };
  const trainingLocations = Array.isArray(input.trainingLocations)
    ? [...new Set(input.trainingLocations.filter((item) => VALID_LOCATIONS.has(item)))]
    : [legacyLocationByEnvironment[input.environment] || "home"];
  const safeLocations = trainingLocations.length ? trainingLocations : ["home"];
  const primaryEnvironment = TRAINING_LOCATIONS.find((item) => item.id === safeLocations[0])?.environment || environment;
  const dayLocations = {};
  if (input.dayLocations && typeof input.dayLocations === "object") {
    for (const [day, location] of Object.entries(input.dayLocations)) {
      const dayNumber = Number(day);
      if (Number.isInteger(dayNumber) && dayNumber >= 0 && dayNumber <= 6 && VALID_LOCATIONS.has(location) && safeLocations.includes(location)) dayLocations[dayNumber] = location;
    }
  }
  for (const day of availableDays) if (!dayLocations[day]) dayLocations[day] = safeLocations[0];

  return {
    age: Math.min(60, Math.max(10, Number(input.age) || 16)),
    position,
    secondaryPosition,
    role: typeof input.role === "string" ? input.role : "",
    dominantFoot,
    level: input.level || "developing",
    goals,
    primaryGoal,
    equipment: Array.isArray(input.equipment) && input.equipment.length ? input.equipment : ["top"],
    availableDays: [...new Set(availableDays.map(Number))].filter((day) => day >= 0 && day <= 6 && day !== matchDay && !teamDays.includes(day)),
    teamDays: [...new Set(teamDays.map(Number))].filter((day) => day >= 0 && day <= 6 && day !== matchDay),
    matchDay,
    sessionLength,
    environment: primaryEnvironment,
    trainingLocations: safeLocations,
    dayLocations,
    commitment,
    limitation,
    ballMasteryEnabled: input.ballMasteryEnabled !== false,
    demo: Boolean(input.demo),
  };
}

export function normalizeDailyCheckIn(input, fallbackMinutes = 45) {
  if (typeof input === "string") {
    const legacy = ["fresh", "normal", "tired"].includes(input) ? input : "normal";
    return {
      energy: legacy === "fresh" ? "high" : legacy === "tired" ? "low" : "normal",
      soreness: legacy === "tired" ? "high" : "low",
      timeAvailable: Number(fallbackMinutes) || 45,
    };
  }
  const value = input && typeof input === "object" ? input : {};
  const energy = ["low", "normal", "high"].includes(value.energy) ? value.energy : "normal";
  const soreness = ["low", "some", "high"].includes(value.soreness) ? value.soreness : "low";
  const allowedTimes = [15, 20, 30, 45, 60];
  const requestedTime = Number(value.timeAvailable);
  const target = Number(fallbackMinutes) || 45;
  const timeAvailable = allowedTimes.includes(requestedTime)
    ? requestedTime
    : allowedTimes.reduce((best, option) => Math.abs(option - target) < Math.abs(best - target) ? option : best, 45);
  return { energy, soreness, timeAvailable };
}

export function readinessFromCheckIn(input, fallbackMinutes = 45) {
  const checkIn = normalizeDailyCheckIn(input, fallbackMinutes);
  if (checkIn.energy === "low" || checkIn.soreness === "high") return "tired";
  if (checkIn.energy === "high" && checkIn.soreness === "low") return "fresh";
  return "normal";
}

export function checkInNeedsAdaptation(input, plannedMinutes, fallbackMinutes = 45) {
  const checkIn = normalizeDailyCheckIn(input, fallbackMinutes);
  return readinessFromCheckIn(checkIn, fallbackMinutes) === "tired" || checkIn.timeAvailable < Number(plannedMinutes || 0);
}

export function createDemoProfile(todayIdx) {
  const offset = (amount) => (todayIdx + amount) % 7;
  return {
    age: 17,
    position: "kanat",
    secondaryPosition: "forvet",
    role: "Inside Forward",
    dominantFoot: "right",
    level: "competitive",
    goals: ["calim", "hiz", "ilk_temas"],
    primaryGoal: "calim",
    equipment: ["top", "koni", "kale", "duvar"],
    availableDays: [todayIdx, offset(3), offset(5)],
    teamDays: [offset(1), offset(4)],
    matchDay: offset(2),
    sessionLength: 45,
    environment: "full_pitch",
    trainingLocations: ["home", "pitch", "indoor"],
    dayLocations: { [todayIdx]: "pitch", [offset(3)]: "home", [offset(5)]: "pitch" },
    commitment: "committed",
    limitation: "none",
    ballMasteryEnabled: true,
    demo: true,
  };
}

export function todayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export function dateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentStreak(sessions, now = new Date()) {
  const completed = new Set((sessions || []).map((session) => dateKey(session.completedAt || session.date)));
  if (!completed.size) return 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = dateKey(cursor);
  if (!completed.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!completed.has(dateKey(cursor))) return 0;
  }
  let streak = 0;
  while (completed.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatDuration(seconds) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem ? `${hours}h ${rem}m` : `${hours}h`;
  }
  if (minutes === 0) return `${secs}s`;
  return secs ? `${minutes}m ${secs}s` : `${minutes}m`;
}

export function formatTimer(seconds) {
  const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function sessionsThisWeek(sessions, now = new Date()) {
  const week = getISOWeek(now);
  return (sessions || []).filter((session) => getISOWeek(new Date(session.completedAt || session.date)) === week);
}

export function mainSessions(sessions) {
  return (sessions || []).filter((session) => !session.kind || session.kind === "main" || session.kind === "adapted");
}

export function masterySessions(sessions) {
  return (sessions || []).filter((session) => session.kind === "ball_mastery");
}

export function completedDevelopmentLevel(sessions) {
  const count = mainSessions(sessions).length;
  return Math.min(8, 1 + Math.floor(count / 4));
}

export function exerciseHistorySummary(sessions, recentLimit = 8) {
  const mains = mainSessions(sessions)
    .slice()
    .sort((a, b) => new Date(a.completedAt || a.date) - new Date(b.completedAt || b.date));
  const map = new Map();
  for (const session of mains) {
    const feedback = session.feedback && typeof session.feedback === "object" ? session.feedback : null;
    const signal = feedbackSignal(feedback);
    for (const id of [...new Set(session.exerciseIds || [])]) {
      const exercise = exerciseById(id);
      if (!exercise || exercise.focus === "warmup" || exercise.trainingType === "recovery" || exercise.trainingType === "activation") continue;
      const current = map.get(id) || {
        id,
        name: exercise.name,
        focus: exercise.focus,
        exposures: 0,
        positiveSignals: 0,
        holdSignals: 0,
        latestStage: 1,
        latestFeedback: null,
        lastCompletedAt: null,
        dates: [],
      };
      current.exposures += 1;
      current.latestStage = Math.max(1, Number(session.progressionStage) || current.latestStage || 1);
      current.latestFeedback = feedback || current.latestFeedback;
      current.lastCompletedAt = session.completedAt || session.date || current.lastCompletedAt;
      current.dates.push(current.lastCompletedAt);
      if (signal === "progress") current.positiveSignals += 1;
      if (signal === "hold") current.holdSignals += 1;
      map.set(id, current);
    }
  }
  return Object.fromEntries([...map.entries()].map(([id, item]) => {
    const recentDates = item.dates.slice(-recentLimit);
    return [id, { ...item, recentExposures: recentDates.length, dates: recentDates }];
  }));
}

export function historySummary(sessions) {
  const mains = mainSessions(sessions).slice().sort((a, b) => new Date(a.completedAt || a.date) - new Date(b.completedAt || b.date));
  const latest = mains[mains.length - 1] || null;
  const latestStage = Math.max(1, Number(latest?.progressionStage) || 1);
  const stageSessions = mains.filter((session) => (Number(session.progressionStage) || 1) === latestStage);
  const recentAtStage = stageSessions.slice(-3);
  const signals = recentAtStage.map((session) => feedbackSignal(session.feedback));
  const lastCompletedAt = latest?.completedAt || latest?.date || null;
  const daysSinceLastMain = lastCompletedAt ? Math.max(0, Math.floor((Date.now() - new Date(lastCompletedAt).getTime()) / 86400000)) : null;
  const recentMains = mains.slice(-8);
  const recentExerciseCounts = {};
  const recentFocusCounts = {};
  for (const session of recentMains) {
    for (const id of [...new Set(session.exerciseIds || [])]) {
      const exercise = exerciseById(id);
      if (!exercise || exercise.focus === "warmup") continue;
      recentExerciseCounts[id] = (recentExerciseCounts[id] || 0) + 1;
      recentFocusCounts[exercise.focus] = (recentFocusCounts[exercise.focus] || 0) + 1;
    }
  }
  return {
    completedWorkouts: mains.length,
    completedBallMastery: masterySessions(sessions).length,
    latestStage,
    stageExposureCount: stageSessions.length,
    positiveSignals: signals.filter((signal) => signal === "progress").length,
    holdSignals: signals.filter((signal) => signal === "hold").length,
    lastFeedback: latest?.feedback && typeof latest.feedback === "object" ? latest.feedback : null,
    daysSinceLastMain,
    recentExerciseCounts,
    recentFocusCounts,
    exerciseHistory: exerciseHistorySummary(sessions),
  };
}

export function weeklyConsistencyStreak(sessions, now = new Date()) {
  const activeWeeks = new Set(mainSessions(sessions).map((session) => getISOWeek(new Date(session.completedAt || session.date))));
  if (!activeWeeks.size) return 0;
  let cursor = new Date(now);
  let streak = 0;
  for (let i = 0; i < 52; i += 1) {
    const key = getISOWeek(cursor);
    if (!activeWeeks.has(key)) {
      if (i === 0) { cursor.setDate(cursor.getDate() - 7); continue; }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function feedbackCoachAdjustment(feedback) {
  const signal = feedbackSignal(feedback);
  if (feedback?.discomfort === "yes") return "Coach will hold progression and keep the next load conservative. Stop if discomfort persists or changes how you move.";
  if (feedback?.energy === "drained") return "Coach will protect recovery before adding more speed or volume.";
  if (signal === "progress") return "Quality was sharp and the load felt comfortable. Coach can progress the constraint instead of simply adding more volume.";
  if (signal === "hold") return "Coach will hold this stage and simplify the next exposure so quality can catch up.";
  return "Coach will keep the current progression stage and build another quality exposure before changing the constraint.";
}

export function focusStats(sessions) {
  const counts = new Map();
  for (const session of sessions || []) {
    const ids = session.exerciseIds || session.focus || [];
    for (const id of ids) {
      const exercise = exerciseById(id);
      if (!exercise || exercise.focus === "warmup") continue;
      counts.set(exercise.focus, (counts.get(exercise.focus) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([focus, count]) => ({ focus, count, label: FOCUS_LABELS[focus] || focus }))
    .sort((a, b) => b.count - a.count);
}

export function weeklyCoachReview(sessions, plan, profile, now = new Date()) {
  const week = sessionsThisWeek(sessions, now);
  const mains = mainSessions(week);
  const mastery = masterySessions(week);
  const minutes = Math.round(week.reduce((sum, session) => sum + (Number(session.durationSeconds) || 0), 0) / 60);
  const feedback = mains.filter((session) => session.feedback && typeof session.feedback === "object");
  const sharp = feedback.filter((session) => session.feedback.quality === "sharp").length;
  const holds = feedback.filter((session) => feedbackSignal(session.feedback) === "hold").length;
  const focus = focusStats(mains)[0];
  const target = Math.max(1, (plan?.days || []).filter((day) => day.type === "personal").length);
  const completedDays = new Set(mains.map((session) => session.day)).size;
  let headline = "Build the week with quality.";
  let message = "Complete a coached session and your weekly review will start using real training feedback.";
  if (holds > 0) {
    headline = "Protect quality before progressing.";
    message = "At least one session felt too hard, poor, drained or uncomfortable. Coach will keep the next constraint conservative instead of chasing volume.";
  } else if (sharp >= 2) {
    headline = "Quality is becoming repeatable.";
    message = "Multiple sharp sessions give Coach useful evidence. The next progression can become more decision-led instead of simply longer.";
  } else if (mains.length > 0) {
    headline = completedDays >= target ? "Planned work complete." : "Useful exposure is building.";
    message = `Coach has ${mains.length} completed main session${mains.length === 1 ? "" : "s"} this week. Another clean exposure gives stronger evidence before changing the progression constraint.`;
  }
  const nextPriority = FOCUS_LABELS[profile?.primaryGoal] || focus?.label || "Technical quality";
  return {
    headline,
    message,
    metrics: { main: mains.length, mastery: mastery.length, minutes },
    primaryFocus: focus?.label || nextPriority,
    nextPriority,
    completedMainDays: completedDays,
    mainTarget: target,
  };
}

function locationForDay(profile, day) {
  return profile?.dayLocations?.[day] || profile?.trainingLocations?.[0] || "home";
}

function canSessionRunAtLocation(day, profile, targetDay) {
  const environment = LOCATION_ENV[locationForDay(profile, targetDay)] || profile?.environment || "small_space";
  return (day?.exerciseIds || []).every((id) => {
    const exercise = exerciseById(id);
    return !exercise?.environment || exercise.environment.includes(environment);
  });
}

export function possibleMoveTargets(plan, profile, fromDay, now = new Date()) {
  const source = plan?.days?.find((day) => day.day === Number(fromDay));
  if (!source || source.type !== "personal") return [];
  const today = todayIndex(now);
  return (plan.days || [])
    .filter((day) => day.day !== source.day)
    .filter((day) => day.type === "rest")
    .filter((day) => day.day >= today)
    .filter((day) => canSessionRunAtLocation(source, profile, day.day))
    .map((day) => ({ day: day.day, dayName: DAY_NAMES[day.day], location: locationForDay(profile, day.day) }));
}

export function movePlanSession(plan, profile, fromDay, toDay) {
  const from = Number(fromDay);
  const to = Number(toDay);
  const source = plan?.days?.find((day) => day.day === from);
  const target = plan?.days?.find((day) => day.day === to);
  if (!source || source.type !== "personal") throw new Error("Only a personal session can be moved.");
  if (!target || target.type !== "rest") throw new Error("Choose an open rest day for this week.");
  if (!canSessionRunAtLocation(source, profile, to)) throw new Error("That session does not fit the training space available on the selected day.");

  const movedFields = ["exerciseIds", "exerciseDurations", "estimatedMinutes", "restSeconds", "title", "coachNote", "sessionIntent", "trainingMix", "workoutBlocks", "progression", "exerciseProgressions"];
  const nextDays = plan.days.map((day) => ({ ...day }));
  const sourceIndex = nextDays.findIndex((day) => day.day === from);
  const targetIndex = nextDays.findIndex((day) => day.day === to);
  const sourceCopy = nextDays[sourceIndex];
  const targetCopy = nextDays[targetIndex];

  const resetSource = {
    ...sourceCopy,
    type: "rest",
    exerciseIds: [],
    exerciseDurations: {},
    estimatedMinutes: 0,
    restSeconds: 0,
    sessionIntent: null,
    trainingMix: null,
    workoutBlocks: [],
    progression: null,
    exerciseProgressions: {},
    trainingLocation: null,
    title: sourceCopy.ballMastery ? "Rest / Technical Habit" : "Rest",
    coachNote: sourceCopy.ballMastery
      ? "The main session moved within this week. Keep the short Ball Mastery block optional and low load."
      : "The main session moved within this week. Use this day to recover and protect the quality of the new training day.",
  };
  delete resetSource.movedFromDay;
  delete resetSource.movedAt;

  const movedTarget = {
    ...targetCopy,
    type: "personal",
    trainingLocation: locationForDay(profile, to),
    movedFromDay: from,
    movedAt: new Date().toISOString(),
  };
  for (const field of movedFields) movedTarget[field] = sourceCopy[field];
  movedTarget.coachNote = `Moved from ${DAY_NAMES[from]} to fit this week. ${sourceCopy.coachNote || "Keep the session technically clean and finish with quality in reserve."}`;
  if (movedTarget.ballMastery) movedTarget.ballMastery = { ...movedTarget.ballMastery, minutes: Math.min(10, movedTarget.ballMastery.minutes || 10), intensity: "light" };

  nextDays[sourceIndex] = resetSource;
  nextDays[targetIndex] = movedTarget;
  return {
    ...plan,
    days: nextDays,
    weeklyOverrides: [...(Array.isArray(plan.weeklyOverrides) ? plan.weeklyOverrides : []), { fromDay: from, toDay: to, week: getISOWeek(new Date()) }],
  };
}

export function applyWeekOverrides(plan, profile, overrides, now = new Date()) {
  const week = getISOWeek(now);
  const current = Array.isArray(overrides?.[week]) ? overrides[week] : [];
  return current.reduce((nextPlan, move) => {
    try {
      return movePlanSession(nextPlan, profile, move.fromDay, move.toDay);
    } catch {
      return nextPlan;
    }
  }, plan);
}
