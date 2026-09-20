import { ADAPTIVE_EXERCISES, BALL_MASTERY, EXERCISES, MORNING_ROUTINE, RESET_ROUTINE, TRAINING_LOCATIONS, exerciseMeta, exercisesFor } from "../src/exercises.js";
import { BLOCK_META, PROGRESSION_STAGES, blockTypeForExercise, developmentPathFor, progressionConstraint, progressionReview, stageByLevel } from "../src/development.js";

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const VALID_TYPES = new Set(["personal", "team", "match", "rest", "recovery"]);
const VALID_LEVELS = new Set(["beginner", "developing", "competitive", "advanced"]);
const VALID_POSITIONS = new Set(["kaleci", "stoper", "bek", "ortasaha", "kanat", "forvet"]);
const VALID_EQUIPMENT = new Set(["top", "koni", "kale", "duvar", "yok"]);
const VALID_FEET = new Set(["right", "left", "both"]);
const VALID_ENVIRONMENTS = new Set(["small_space", "full_pitch", "indoor", "gym"]);
const VALID_COMMITMENTS = new Set(["light", "committed", "high"]);
const VALID_LIMITATIONS = new Set(["none", "returning", "discomfort"]);
const VALID_SESSION_LENGTHS = new Set([30, 45, 60]);
const VALID_LOCATIONS = new Set(TRAINING_LOCATIONS.map((item) => item.id));
const LOCATION_ENVIRONMENT = Object.fromEntries(TRAINING_LOCATIONS.map((item) => [item.id, item.environment]));
const OUTDOOR_LOCATIONS = new Set(["garden", "pitch"]);
const WARMUP_SECONDS = MORNING_ROUTINE.reduce((sum, exercise) => sum + exercise.duration, 0);
const RESET_SECONDS = RESET_ROUTINE.reduce((sum, exercise) => sum + exercise.duration, 0);
const MAIN_REST_SECONDS = 45;

function uniqueDays(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
}

function cleanText(value, max = 80) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}


function safeCountMap(value, maxEntries = 80, maxCount = 20) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => typeof key === "string" && key.length <= 40)
      .slice(0, maxEntries)
      .map(([key, count]) => [key, Math.min(maxCount, Math.max(0, Number(count) || 0))])
  );
}

function safeExerciseHistory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value).slice(0, 80);
  return Object.fromEntries(entries.map(([id, item]) => {
    const history = item && typeof item === "object" ? item : {};
    return [id, {
      exposures: Math.min(100, Math.max(0, Number(history.exposures) || 0)),
      recentExposures: Math.min(20, Math.max(0, Number(history.recentExposures) || 0)),
      positiveSignals: Math.min(20, Math.max(0, Number(history.positiveSignals) || 0)),
      holdSignals: Math.min(20, Math.max(0, Number(history.holdSignals) || 0)),
      latestStage: Math.min(PROGRESSION_STAGES.length, Math.max(1, Number(history.latestStage) || 1)),
      latestFeedback: history.latestFeedback && typeof history.latestFeedback === "object" ? {
        difficulty: cleanText(history.latestFeedback.difficulty, 16),
        quality: cleanText(history.latestFeedback.quality, 16),
        energy: cleanText(history.latestFeedback.energy, 16),
        discomfort: cleanText(history.latestFeedback.discomfort, 8),
      } : null,
    }];
  }));
}

export function normalizeProfile(input = {}) {
  const legacyTeamDays = input.teamSchedule ? Object.keys(input.teamSchedule).map(Number) : [];
  const legacyAvailableDays = input.personalSchedule ? Object.keys(input.personalSchedule).map(Number) : [];
  const legacyMatchDay = Array.isArray(input.matchDays) && input.matchDays.length ? Number(input.matchDays[0]) : null;
  const age = Math.min(60, Math.max(10, Number(input.age) || 16));
  const position = VALID_POSITIONS.has(input.position) ? input.position : "ortasaha";
  const secondaryPosition = VALID_POSITIONS.has(input.secondaryPosition) && input.secondaryPosition !== position ? input.secondaryPosition : null;
  const equipmentRaw = Array.isArray(input.equipment) ? input.equipment.filter((item) => VALID_EQUIPMENT.has(item)) : [];
  const equipment = equipmentRaw.length ? [...new Set(equipmentRaw)] : ["top"];
  const teamDays = uniqueDays(input.teamDays ?? legacyTeamDays);
  const matchCandidate = input.matchDay ?? legacyMatchDay;
  const matchDay = matchCandidate !== null && matchCandidate !== undefined && Number.isInteger(Number(matchCandidate)) && Number(matchCandidate) >= 0 && Number(matchCandidate) <= 6
    ? Number(matchCandidate)
    : null;
  const availableDays = uniqueDays(input.availableDays ?? legacyAvailableDays)
    .filter((day) => day !== matchDay && !teamDays.includes(day));
  const allowedFocus = new Set(EXERCISES.filter((exercise) => exercise.position === position).map((exercise) => exercise.focus));
  const goals = (Array.isArray(input.goals) ? input.goals : input.focus || []).filter((goal) => allowedFocus.has(goal)).slice(0, 3);
  const primaryGoal = goals.includes(input.primaryGoal) ? input.primaryGoal : goals[0] || null;
  const history = input.historySummary && typeof input.historySummary === "object" ? input.historySummary : {};
  const legacyLocationByEnvironment = { small_space: "home", full_pitch: "pitch", indoor: "indoor", gym: "gym" };
  const trainingLocationsRaw = Array.isArray(input.trainingLocations) ? input.trainingLocations.filter((item) => VALID_LOCATIONS.has(item)) : [];
  const trainingLocations = [...new Set(trainingLocationsRaw.length ? trainingLocationsRaw : [legacyLocationByEnvironment[input.environment] || "home"])];
  const dayLocations = {};
  if (input.dayLocations && typeof input.dayLocations === "object") {
    for (const [day, location] of Object.entries(input.dayLocations)) {
      const dayNumber = Number(day);
      if (Number.isInteger(dayNumber) && dayNumber >= 0 && dayNumber <= 6 && VALID_LOCATIONS.has(location) && trainingLocations.includes(location)) dayLocations[dayNumber] = location;
    }
  }
  for (const day of availableDays) if (!dayLocations[day]) dayLocations[day] = trainingLocations[0];

  const primaryEnvironment = LOCATION_ENVIRONMENT[trainingLocations[0]] || (VALID_ENVIRONMENTS.has(input.environment) ? input.environment : "small_space");

  return {
    age,
    position,
    secondaryPosition,
    role: cleanText(input.role, 60),
    dominantFoot: VALID_FEET.has(input.dominantFoot) ? input.dominantFoot : "right",
    level: VALID_LEVELS.has(input.level) ? input.level : "developing",
    goals,
    primaryGoal,
    equipment,
    availableDays,
    teamDays: teamDays.filter((day) => day !== matchDay),
    matchDay,
    sessionLength: VALID_SESSION_LENGTHS.has(Number(input.sessionLength)) ? Number(input.sessionLength) : 45,
    environment: primaryEnvironment,
    trainingLocations,
    dayLocations,
    commitment: VALID_COMMITMENTS.has(input.commitment) ? input.commitment : "committed",
    limitation: VALID_LIMITATIONS.has(input.limitation) ? input.limitation : "none",
    ballMasteryEnabled: input.ballMasteryEnabled !== false,
    historySummary: {
      completedWorkouts: Math.min(1000, Math.max(0, Number(history.completedWorkouts) || 0)),
      completedBallMastery: Math.min(5000, Math.max(0, Number(history.completedBallMastery) || 0)),
      latestStage: history.latestStage === null || history.latestStage === undefined ? 0 : Math.min(6, Math.max(1, Number(history.latestStage) || 1)),
      stageExposureCount: Math.min(100, Math.max(0, Number(history.stageExposureCount) || 0)),
      positiveSignals: Math.min(3, Math.max(0, Number(history.positiveSignals) || 0)),
      holdSignals: Math.min(3, Math.max(0, Number(history.holdSignals) || 0)),
      lastFeedback: history.lastFeedback && typeof history.lastFeedback === "object" ? {
        difficulty: cleanText(history.lastFeedback.difficulty, 16),
        quality: cleanText(history.lastFeedback.quality, 16),
        energy: cleanText(history.lastFeedback.energy, 16),
        discomfort: cleanText(history.lastFeedback.discomfort, 8),
      } : null,
      daysSinceLastMain: history.daysSinceLastMain === null || history.daysSinceLastMain === undefined ? null : Math.min(3650, Math.max(0, Number(history.daysSinceLastMain) || 0)),
      recentExerciseCounts: safeCountMap(history.recentExerciseCounts),
      recentFocusCounts: safeCountMap(history.recentFocusCounts),
      exerciseHistory: safeExerciseHistory(history.exerciseHistory),
    },
    demo: Boolean(input.demo),
  };
}

export function validateProfile(profile) {
  if (!profile || !VALID_POSITIONS.has(profile.position)) return { ok: false, error: "Choose a valid position." };
  if (!Number.isFinite(profile.age) || profile.age < 10 || profile.age > 60) return { ok: false, error: "Age must be between 10 and 60." };
  if (!VALID_LEVELS.has(profile.level)) return { ok: false, error: "Choose a valid playing level." };
  if (!Array.isArray(profile.availableDays)) return { ok: false, error: "Available training days are missing." };
  if (!VALID_COMMITMENTS.has(profile.commitment)) return { ok: false, error: "Choose a valid training commitment." };
  return { ok: true };
}

function maxFootballDaysForAge(age) {
  if (age <= 13) return 4;
  if (age <= 16) return 5;
  return 6;
}

function maxPersonalSessions(profile) {
  if (profile.age <= 13) return 2;
  if (profile.limitation === "discomfort") return 2;
  if (profile.commitment === "light") return 2;
  if (profile.commitment === "high" && profile.age >= 17) return 4;
  return 3;
}

function distanceFromMatch(day, matchDay) {
  if (matchDay === null) return 3;
  const forward = (matchDay - day + 7) % 7;
  const backward = (day - matchDay + 7) % 7;
  return Math.min(forward, backward);
}

export function buildScheduleSkeleton(rawProfile) {
  const profile = normalizeProfile(rawProfile);
  const days = DAY_NAMES.map((dayName, day) => ({ day, dayName, type: "rest", exerciseIds: [] }));

  if (profile.matchDay !== null) days[profile.matchDay].type = "match";
  for (const day of profile.teamDays) if (day !== profile.matchDay) days[day].type = "team";

  if (profile.matchDay !== null) {
    const afterMatch = (profile.matchDay + 1) % 7;
    const beforeMatch = (profile.matchDay + 6) % 7;
    if (days[afterMatch].type === "rest") days[afterMatch].type = "recovery";
    if (days[beforeMatch].type === "rest") days[beforeMatch].type = "recovery";
  }

  const fixedActiveDays = days.filter((day) => day.type === "team" || day.type === "match").length;
  const activityBudget = Math.max(0, maxFootballDaysForAge(profile.age) - fixedActiveDays);
  const personalLimit = Math.min(maxPersonalSessions(profile), activityBudget);
  const candidates = profile.availableDays
    .filter((day) => days[day].type === "rest")
    .sort((a, b) => {
      const aMatchDistance = distanceFromMatch(a, profile.matchDay);
      const bMatchDistance = distanceFromMatch(b, profile.matchDay);
      if (aMatchDistance !== bMatchDistance) return bMatchDistance - aMatchDistance;
      const aNeighborLoad = [days[(a + 6) % 7].type, days[(a + 1) % 7].type].filter((type) => type === "team" || type === "match").length;
      const bNeighborLoad = [days[(b + 6) % 7].type, days[(b + 1) % 7].type].filter((type) => type === "team" || type === "match").length;
      if (aNeighborLoad !== bNeighborLoad) return aNeighborLoad - bNeighborLoad;
      return profile.availableDays.indexOf(a) - profile.availableDays.indexOf(b);
    });

  for (const day of candidates.slice(0, personalLimit)) days[day].type = "personal";
  return days;
}

export function environmentForDay(rawProfile, day = null) {
  const profile = normalizeProfile(rawProfile);
  const location = day !== null ? profile.dayLocations?.[day] : null;
  return LOCATION_ENVIRONMENT[location] || profile.environment || LOCATION_ENVIRONMENT[profile.trainingLocations[0]] || "small_space";
}

export function availableExercisesFor(rawProfile, day = null, overrides = {}) {
  const profile = normalizeProfile(rawProfile);
  const equipmentSource = Array.isArray(overrides.equipment) ? overrides.equipment : profile.equipment;
  const equipment = equipmentSource.includes("yok") && equipmentSource.length === 1 ? [] : equipmentSource;
  const environment = overrides.environment || environmentForDay(profile, day);
  return exercisesFor(profile.position, equipment, environment);
}

function progressionFor(profile) {
  const history = profile.historySummary;
  const baseline = Math.min(PROGRESSION_STAGES.length, 1 + Math.floor(history.completedWorkouts / 4));
  const startingLevel = Math.max(1, Math.min(PROGRESSION_STAGES.length, history.latestStage > 0 ? history.latestStage : baseline));
  const comeback = Number(history.daysSinceLastMain) >= 7;
  const initialReview = progressionReview({
    level: startingLevel,
    exposureCount: history.stageExposureCount,
    positiveSignals: history.positiveSignals,
    holdSignals: history.holdSignals,
  });
  let level = startingLevel;
  let decision = "hold";

  if (!comeback && initialReview.status === "ready" && startingLevel < PROGRESSION_STAGES.length) {
    level = startingLevel + 1;
    decision = "progress";
  } else if (!comeback && history.holdSignals === 0 && baseline > startingLevel && history.stageExposureCount >= stageByLevel(startingLevel).minQualityExposures) {
    // Catch up gradually. Never skip multiple football constraints because of workout count alone.
    level = Math.min(PROGRESSION_STAGES.length, startingLevel + 1);
    decision = "progress";
  }

  const stage = stageByLevel(level);
  const review = decision === "progress"
    ? {
        status: "progressed",
        exposuresNeeded: stage.minQualityExposures,
        label: `Now building ${stage.label}`,
        message: `Coach has enough evidence to move into ${stage.label}. The next review still waits for repeated quality.`,
      }
    : progressionReview({
        level,
        exposureCount: history.stageExposureCount,
        positiveSignals: history.positiveSignals,
        holdSignals: history.holdSignals,
      });

  return {
    ...stage,
    completedWorkouts: history.completedWorkouts,
    decision,
    comeback,
    cue: comeback
      ? "Return with control first. Keep the session submaximal and finish with energy in reserve before rebuilding match-speed exposure."
      : stage.cue,
    next: level < PROGRESSION_STAGES.length ? stageByLevel(level + 1) : null,
    pathway: developmentPathFor(profile.primaryGoal, profile.position),
    pathwayFocus: profile.primaryGoal || null,
    review,
  };
}

function exerciseProgressionFor(profile, exercise) {
  const global = progressionFor(profile);
  const history = profile.historySummary.exerciseHistory?.[exercise.id] || {};
  const exposures = Math.max(0, Number(history.exposures) || 0);
  let level = exposures > 0
    ? Math.min(global.level, Math.max(1, Number(history.latestStage) || 1))
    : Math.max(1, global.level - 1);
  const holdSignals = Math.max(0, Number(history.holdSignals) || 0);
  const positiveSignals = Math.max(0, Number(history.positiveSignals) || 0);
  if (exposures >= 2 && positiveSignals >= 2 && holdSignals === 0 && level < global.level) level += 1;
  const stage = stageByLevel(level);
  const review = progressionReview({ level, exposureCount: exposures, positiveSignals, holdSignals });
  return {
    ...stage,
    exposures,
    review,
    cue: progressionConstraint(stage, exercise, profile.dominantFoot),
  };
}

function sessionTargetMinutes(profile, day) {
  const progression = progressionFor(profile).level;
  const ageCap = profile.age <= 13 ? 40 : profile.age <= 16 ? 50 : 60;
  let cap = Math.min(profile.sessionLength, ageCap);
  if (profile.limitation === "returning") cap = Math.min(cap, 40);
  if (profile.limitation === "discomfort") cap = Math.min(cap, 30);
  if (progressionFor(profile).comeback) cap = Math.min(cap, profile.age <= 16 ? 30 : 35);
  if (profile.matchDay !== null && distanceFromMatch(day, profile.matchDay) === 2) cap = Math.min(cap, profile.age <= 16 ? 35 : 40);
  const progressionFactor = Math.min(1, 0.95 + (progression - 1) * 0.02);
  return Math.max(20, Math.round(cap * progressionFactor));
}

function desiredExerciseCount(profile) {
  if (profile.age <= 13 || profile.commitment === "light") return 3;
  return 4;
}

function sessionTitle(profile, exercises) {
  const focus = exercises[0]?.focus;
  const labels = {
    reaksiyon: "Reaction Speed",
    ayak_teknigi: "Goalkeeper Footwork",
    elle_oynama: "Handling Quality",
    dagitim: "Distribution Quality",
    savunma: "Defending Fundamentals",
    pas: "Passing Quality",
    tarama: "Scanning & Awareness",
    ilk_temas: "First Touch",
    hiz: "Speed & Acceleration",
    orta: "Wide Delivery",
    calim: "1v1 & Dribbling",
    top_kontrol: "Ball Control",
    bitiricilik: "Finishing",
    hareket: "Striker Movement",
  };
  return labels[focus] || "Individual Development Session";
}

function coachNoteFor(profile, day, exercises) {
  const primary = exercises.find((exercise) => exercise.focus === profile.primaryGoal);
  const gameBlock = exercises.find((exercise) => exerciseType(exercise) === "game_realistic");
  const progression = progressionFor(profile);
  if (profile.limitation === "discomfort") return "Keep the session controlled. Stop if discomfort increases or changes your movement quality; persistent symptoms should be assessed by a qualified professional.";
  if (profile.limitation === "returning") return "You are building back into training. Technique stays clean, game-speed exposure stays controlled and you should finish with energy in reserve.";
  if (profile.matchDay !== null && distanceFromMatch(day, profile.matchDay) <= 2) return "This sits close to match day, so the session keeps technical quality and game transfer while removing unnecessary physical fatigue.";
  if (primary && gameBlock && primary.id !== gameBlock.id) return `${primary.name} develops your top priority, then ${gameBlock.name.toLowerCase()} transfers it into a more match-like action. ${progression.cue}`;
  if (primary) return `${primary.name} supports your top priority. ${progression.cue}`;
  if (gameBlock) return `The session moves from repeatable quality into ${gameBlock.gameMoment?.toLowerCase?.() || "a match-like football action"}. ${progression.cue}`;
  return `Train with intent, not exhaustion. ${progression.cue}`;
}

function exerciseType(exercise) {
  return exercise?.trainingType || exerciseMeta(exercise).trainingType;
}

function scoreExercise(profile, exercise, preferred = new Set()) {
  let score = 0;
  if (exercise.focus === profile.primaryGoal) score += 20;
  else if (profile.goals.includes(exercise.focus)) score += 10;
  if (preferred.has(exercise.id)) score += 6;
  if (exerciseType(exercise) === "game_realistic") score += profile.level === "beginner" ? 0 : 2;
  if (exerciseType(exercise) === "technique") score += profile.level === "beginner" ? 3 : 1;

  // Avoid serving the same exact drill every week when an equally relevant validated option exists.
  const recentExerciseCount = Number(profile.historySummary.recentExerciseCounts?.[exercise.id]) || 0;
  const recentFocusCount = Number(profile.historySummary.recentFocusCounts?.[exercise.focus]) || 0;
  score -= Math.min(9, recentExerciseCount * 3);
  if (exercise.focus !== profile.primaryGoal) score -= Math.min(3, recentFocusCount);

  const exerciseHistory = profile.historySummary.exerciseHistory?.[exercise.id];
  if (exerciseHistory?.latestFeedback?.discomfort === "yes" && exerciseType(exercise) === "physical") score -= 8;
  if (exerciseHistory?.holdSignals > exerciseHistory?.positiveSignals && exerciseType(exercise) === "technique") score += 2;
  return score;
}

function balancedExerciseIds(profile, day, pool, preferredIds = []) {
  if (!pool.length) return [];
  const desired = Math.min(desiredExerciseCount(profile), pool.length);
  const preferred = new Set(preferredIds);
  const nearMatch = profile.matchDay !== null && distanceFromMatch(day, profile.matchDay) <= 2;
  const safePool = pool.filter((exercise) => !(nearMatch && exerciseType(exercise) === "physical"));
  const candidates = (safePool.length >= Math.min(2, desired) ? safePool : pool)
    .map((exercise, index) => ({ exercise, index, score: scoreExercise(profile, exercise, preferred) }))
    .sort((a, b) => b.score - a.score || ((a.index - day + pool.length) % pool.length) - ((b.index - day + pool.length) % pool.length))
    .map((item) => item.exercise);

  const chosen = [];
  const addBestType = (type) => {
    const match = candidates.find((exercise) => exerciseType(exercise) === type && !chosen.includes(exercise.id));
    if (match) chosen.push(match.id);
  };

  // Every meaningful development session should connect clean mechanics to football transfer.
  addBestType("technique");
  if (desired >= 2) addBestType("game_realistic");
  if (desired >= 4 && !nearMatch && profile.limitation === "none") addBestType("physical");

  for (const exercise of candidates) {
    if (chosen.length >= desired) break;
    if (!chosen.includes(exercise.id)) chosen.push(exercise.id);
  }
  return chosen.slice(0, desired);
}

function fallbackExerciseIds(profile, day, pool) {
  return balancedExerciseIds(profile, day, pool);
}

function mergeExerciseIds(profile, day, pool, aiIds) {
  const allowed = new Set(pool.map((exercise) => exercise.id));
  const cleanAi = Array.isArray(aiIds) ? [...new Set(aiIds)].filter((id) => allowed.has(id)) : [];
  return balancedExerciseIds(profile, day, pool, cleanAi);
}

function sessionMix(exercises) {
  const mix = { technique: 0, game_realistic: 0, physical: 0, recovery: 0, activation: 0 };
  for (const exercise of exercises) {
    const type = exerciseType(exercise);
    if (type in mix) mix[type] += 1;
  }
  return mix;
}

function sessionIntentFor(exercises) {
  const mix = sessionMix(exercises);
  if (mix.technique && mix.game_realistic) return "Technique → Game Transfer";
  if (mix.game_realistic >= 2) return "Game-Realistic Sharpness";
  if (mix.physical) return "Football Physical Quality";
  return "Technical Quality";
}

function buildExerciseDurations(profile, day, exerciseIds) {
  if (!exerciseIds.length) return { exerciseDurations: {}, estimatedMinutes: 0 };
  const requested = sessionTargetMinutes(profile, day);
  const allExerciseCount = MORNING_ROUTINE.length + exerciseIds.length + RESET_ROUTINE.length;
  const transitionRestSeconds = Math.max(0, allExerciseCount - 1) * MAIN_REST_SECONDS;
  const maxByVarietySeconds = WARMUP_SECONDS + RESET_SECONDS + exerciseIds.length * 720 + transitionRestSeconds;
  const targetSeconds = Math.min(requested * 60, maxByVarietySeconds);
  const activeSeconds = Math.max(exerciseIds.length * 300, targetSeconds - WARMUP_SECONDS - RESET_SECONDS - transitionRestSeconds);
  const perExercise = Math.max(300, Math.min(720, Math.floor(activeSeconds / exerciseIds.length / 30) * 30));
  const exerciseDurations = Object.fromEntries(exerciseIds.map((id) => [id, perExercise]));
  const actualSeconds = WARMUP_SECONDS + RESET_SECONDS + exerciseIds.length * perExercise + transitionRestSeconds;
  return { exerciseDurations, estimatedMinutes: Math.round(actualSeconds / 60) };
}

function masteryPool(profile) {
  if (!profile.equipment.includes("top")) return [];
  return BALL_MASTERY.filter((exercise) => exercise.equipment.every((item) => profile.equipment.includes(item)));
}

export function buildBallMasterySchedule(rawProfile, skeleton = null) {
  const profile = normalizeProfile(rawProfile);
  const days = skeleton || buildScheduleSkeleton(profile);
  const pool = masteryPool(profile);
  if (!profile.ballMasteryEnabled || !pool.length) return new Map();

  let target = profile.commitment === "high" && profile.age >= 14 ? 5 : 4;
  if (profile.limitation === "discomfort") target = 3;
  const candidates = days
    .filter((day) => day.type !== "match")
    .map((day) => {
      let score = day.type === "rest" ? 60 : day.type === "recovery" ? 48 : day.type === "personal" ? 38 : 22;
      const matchDistance = distanceFromMatch(day.day, profile.matchDay);
      if (matchDistance === 1) score -= 30;
      if (day.type === "team") score -= 10;
      return { ...day, score };
    })
    .sort((a, b) => b.score - a.score || a.day - b.day)
    .slice(0, target);

  const map = new Map();
  candidates.forEach((day, routineIndex) => {
    const nearMatch = profile.matchDay !== null && distanceFromMatch(day.day, profile.matchDay) === 1;
    let minutes = profile.age <= 13 ? 15 : 20;
    if (day.type === "team" || nearMatch) minutes = Math.min(minutes, 10);
    if (profile.limitation === "returning") minutes = Math.min(minutes, 15);
    if (profile.limitation === "discomfort") minutes = Math.min(minutes, 10);
    const drillCount = Math.max(2, Math.min(4, Math.round(minutes / 5)));
    const exerciseIds = Array.from({ length: drillCount }, (_, index) => pool[(routineIndex * 2 + index) % pool.length].id);
    map.set(day.day, {
      title: "Ball Mastery",
      minutes,
      exerciseIds,
      intensity: minutes < 20 ? "light" : "standard",
      coachNote: minutes < 20
        ? "A reduced touch block keeps the habit alive without competing with today's main football load."
        : "Twenty minutes of clean, high-frequency touches. Stay relaxed, use both feet and keep your head up between combinations.",
    });
  });
  return map;
}

function buildWorkoutBlocks(exerciseIds) {
  const groups = new Map();
  const add = (type, ids) => {
    if (!ids.length) return;
    const meta = BLOCK_META[type] || BLOCK_META.technique;
    groups.set(type, { ...meta, exerciseIds: ids });
  };
  add("activation", MORNING_ROUTINE.map((exercise) => exercise.id));
  const mainExercises = exerciseIds.map((id) => EXERCISES.find((exercise) => exercise.id === id)).filter(Boolean);
  for (const type of ["technique", "game_realistic", "physical"]) {
    add(type, mainExercises.filter((exercise) => blockTypeForExercise({ ...exercise, ...exerciseMeta(exercise) }) === type).map((exercise) => exercise.id));
  }
  add("recovery", RESET_ROUTINE.map((exercise) => exercise.id));
  return [...groups.values()];
}

function developmentCoachMessage(profile) {
  const progression = progressionFor(profile);
  if (progression.comeback) return "You have had a longer break, so this week rebuilds rhythm before intensity. There is nothing to catch up on.";
  if (profile.historySummary.lastFeedback?.discomfort === "yes") return "Your last feedback mentioned discomfort, so progression is held and the next load stays conservative.";
  if (profile.historySummary.holdSignals > 0) return `Coach is holding ${progression.label} until the work feels cleaner and better controlled.`;
  if (progression.decision === "progress") return `Your recent feedback supports progression into ${progression.label}. Difficulty rises through constraints, not reckless volume.`;
  if (progression.review?.exposuresNeeded > 0) return `${progression.review.exposuresNeeded} more quality session${progression.review.exposuresNeeded === 1 ? "" : "s"} will give Coach enough evidence to review ${progression.label}.`;
  return `You are building another quality exposure at ${progression.label} before the next progression step.`;
}

function enrichSkeleton(profile, skeleton, sessionMap = new Map(), source = "fallback") {
  const masteryMap = buildBallMasterySchedule(profile, skeleton);

  const days = skeleton.map((day) => {
    const pool = availableExercisesFor(profile, day.day);
    const trainingLocation = day.type === "personal" ? (profile.dayLocations?.[day.day] || profile.trainingLocations[0] || "home") : null;
    const mastery = masteryMap.get(day.day) || null;
    if (day.type !== "personal") {
      const copy = { ...day, exerciseIds: [], exerciseDurations: {}, estimatedMinutes: 0, exerciseProgressions: {}, ballMastery: mastery, trainingLocation };
      if (day.type === "match") return { ...copy, title: "Match Day", coachNote: "The match is today's main load. No extra high-intensity work is scheduled." };
      if (day.type === "team") return { ...copy, title: "Team Training", coachNote: "Treat the team session as today's main football load. Keep any extra technical work easy." };
      if (day.type === "recovery") return { ...copy, title: "Recovery", coachNote: "Prioritise easy movement, sleep, food and hydration. Recovery is part of the development plan." };
      return { ...copy, title: "Rest / Technical Habit", coachNote: mastery ? "No main session today. Use the short Ball Mastery block as low-load technical work if you feel fresh." : "Recover today. More training is not automatically more development." };
    }

    const aiSession = sessionMap.get(day.day);
    const exerciseIds = mergeExerciseIds(profile, day.day, pool, aiSession?.exerciseIds);
    if (!exerciseIds.length) {
      return {
        ...day,
        type: "rest",
        exerciseIds: [],
        exerciseDurations: {},
        exerciseProgressions: {},
        estimatedMinutes: 0,
        ballMastery: mastery,
        title: "Equipment Reset",
        coachNote: "Your current equipment and training space do not support a safe main session from the validated library. Update your setup in Profile.",
        trainingLocation,
      };
    }
    const exercises = exerciseIds.map((id) => {
      const exercise = EXERCISES.find((item) => item.id === id);
      return exercise ? { ...exercise, ...exerciseMeta(exercise) } : null;
    }).filter(Boolean);
    const timing = buildExerciseDurations(profile, day.day, exerciseIds);
    const mix = sessionMix(exercises);
    const exerciseProgressions = Object.fromEntries(exercises.map((exercise) => [exercise.id, exerciseProgressionFor(profile, exercise)]));
    return {
      ...day,
      exerciseIds,
      exerciseDurations: timing.exerciseDurations,
      restSeconds: MAIN_REST_SECONDS,
      title: sessionTitle(profile, exercises),
      coachNote: coachNoteFor(profile, day.day, exercises),
      estimatedMinutes: timing.estimatedMinutes,
      sessionIntent: sessionIntentFor(exercises),
      trainingMix: mix,
      workoutBlocks: buildWorkoutBlocks(exerciseIds),
      progression: progressionFor(profile),
      exerciseProgressions,
      ballMastery: mastery,
      trainingLocation,
    };
  });

  const progression = progressionFor(profile);
  return {
    version: 71,
    release: "7.1",
    days,
    source,
    generatedAt: new Date().toISOString(),
    progression,
    coachAdjustment: developmentCoachMessage(profile),
    masteryTarget: days.filter((day) => day.ballMastery).length,
    weeklyFocus: {
      focus: profile.primaryGoal,
      pathway: progression.pathway,
      currentMilestone: progression.pathway?.[Math.max(0, progression.level - 1)] || progression.label,
      nextMilestone: progression.pathway?.[progression.level] || null,
    },
  };
}

export function generateFallbackPlan(rawProfile) {
  const profile = normalizeProfile(rawProfile);
  return enrichSkeleton(profile, buildScheduleSkeleton(profile));
}

export function validatePlan(plan, rawProfile) {
  const profile = normalizeProfile(rawProfile);
  if (!plan || !Array.isArray(plan.days) || plan.days.length !== 7) return false;
  const ids = new Set(EXERCISES.map((exercise) => exercise.id));
  const masteryIds = new Set(BALL_MASTERY.map((exercise) => exercise.id));
  const seen = new Set();
  const expected = buildScheduleSkeleton(profile);

  for (const day of plan.days) {
    if (!Number.isInteger(day.day) || day.day < 0 || day.day > 6 || seen.has(day.day)) return false;
    seen.add(day.day);
    if (!VALID_TYPES.has(day.type)) return false;
    const expectedType = expected[day.day].type;
    if (expectedType !== "personal" && day.type !== expectedType) return false;
    if (expectedType === "personal" && !["personal", "rest"].includes(day.type)) return false;
    if (!Array.isArray(day.exerciseIds)) return false;
    if (!day.exerciseIds.every((id) => ids.has(id))) return false;
    if (day.type !== "personal" && day.exerciseIds.length !== 0) return false;
    if (day.type === "personal" && (day.exerciseIds.length < 1 || day.exerciseIds.length > 4)) return false;
    if (day.type === "personal") {
      if (!VALID_LOCATIONS.has(day.trainingLocation)) return false;
      const expectedEnvironment = LOCATION_ENVIRONMENT[day.trainingLocation];
      if (!day.exerciseIds.every((id) => {
        const exercise = EXERCISES.find((item) => item.id === id);
        return exercise && (!exercise.environment || exercise.environment.includes(expectedEnvironment));
      })) return false;
      if (!day.exerciseDurations || typeof day.exerciseDurations !== "object") return false;
      if (!day.exerciseIds.every((id) => Number.isFinite(day.exerciseDurations[id]) && day.exerciseDurations[id] >= 300 && day.exerciseDurations[id] <= 720)) return false;
      if (!Array.isArray(day.workoutBlocks) || day.workoutBlocks.length < 3) return false;
      if (!day.exerciseProgressions || typeof day.exerciseProgressions !== "object") return false;
      if (!day.exerciseIds.every((id) => {
        const item = day.exerciseProgressions[id];
        return item && Number.isInteger(item.level) && item.level >= 1 && item.level <= PROGRESSION_STAGES.length && typeof item.cue === "string" && item.cue.length > 10;
      })) return false;
      const structuredIds = new Set(day.workoutBlocks.flatMap((block) => Array.isArray(block.exerciseIds) ? block.exerciseIds : []));
      if (!day.exerciseIds.every((id) => structuredIds.has(id))) return false;
      if (day.workoutBlocks[0]?.id !== "activation" || day.workoutBlocks.at(-1)?.id !== "recovery") return false;
      if (!Number.isFinite(day.estimatedMinutes) || day.estimatedMinutes < 15 || day.estimatedMinutes > 60) return false;
    }
    if (day.ballMastery) {
      if (day.type === "match") return false;
      if (!Array.isArray(day.ballMastery.exerciseIds) || !day.ballMastery.exerciseIds.length) return false;
      if (!day.ballMastery.exerciseIds.every((id) => masteryIds.has(id))) return false;
      if (!Number.isFinite(day.ballMastery.minutes) || day.ballMastery.minutes < 5 || day.ballMastery.minutes > 20) return false;
    }
  }
  return seen.size === 7;
}

function responseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text;
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .flatMap((item) => Array.isArray(item.content) ? item.content.map((content) => content.text || "") : [])
    .join("")
    .trim();
}

export async function generateWithOpenAI(rawProfile, { apiKey, model = "gpt-5.6-luna" } = {}) {
  if (!apiKey) throw new Error("no_api_key");
  const profile = normalizeProfile(rawProfile);
  const skeleton = buildScheduleSkeleton(profile);
  const personalDays = skeleton.filter((day) => day.type === "personal").map((day) => day.day);
  const pool = [...new Map(personalDays.flatMap((day) => availableExercisesFor(profile, day)).map((exercise) => [exercise.id, exercise])).values()];
  if (!personalDays.length || !pool.length) return generateFallbackPlan(profile);

  const allowedIds = pool.map((exercise) => exercise.id);
  const schema = {
    type: "object",
    properties: {
      sessions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "integer", enum: personalDays },
            exerciseIds: { type: "array", items: { type: "string", enum: allowedIds } },
          },
          required: ["day", "exerciseIds"],
          additionalProperties: false,
        },
      },
    },
    required: ["sessions"],
    additionalProperties: false,
  };

  const input = JSON.stringify({
    player: profile,
    personalDays,
    schedule: skeleton.map(({ day, type }) => ({ day, type })),
    exercises: pool.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      focus: exercise.focus,
      equipment: exercise.equipment,
      environment: exercise.environment,
      trainingType: exerciseType(exercise),
      gameMoment: exercise.gameMoment || exerciseMeta(exercise).gameMoment,
    })),
  });

  const instructions = `Personalize the player's MAIN individual football sessions for the supplied personalDays only.
Use the player's primary goal, role, dominant foot, level and environment to make the exercise choices feel specific.
Use only supplied exercise IDs. Prefer 3-4 complementary exercises per personal day when the library allows it.
When possible, combine at least one Technique exercise with at least one Game Realistic exercise so isolated skill transfers into a football situation. Use at most one Physical block and avoid making physical work the centre of a session close to match day.
The server controls session duration, Ball Mastery, team days, match days, recovery and progression. Do not add extra sessions or change the schedule.
Do not generate titles, explanations or coaching prose. The server owns all user-facing language so the app remains English-only and consistent.
Do not provide medical diagnosis, punishment workouts, exhaustion challenges or unsafe volume.
Return exactly one unique session for each supplied personal day.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      store: false,
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "football_weekly_sessions",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`openai_${response.status}:${body.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = responseText(data);
  if (!raw) throw new Error("empty_openai_response");
  const parsed = JSON.parse(raw);
  const sessionMap = new Map();
  for (const session of parsed.sessions || []) {
    if (personalDays.includes(session.day) && !sessionMap.has(session.day)) sessionMap.set(session.day, session);
  }
  const plan = enrichSkeleton(profile, skeleton, sessionMap, "openai");
  if (!validatePlan(plan, profile)) throw new Error("invalid_plan_after_normalization");
  return plan;
}

function locationAllowedForReason(location, reason) {
  if (!VALID_LOCATIONS.has(location)) return false;
  if (reason === "weather") return !OUTDOOR_LOCATIONS.has(location);
  if (reason === "no_pitch") return location !== "pitch";
  return true;
}

function resolveAdaptLocation(profile, originalDay, requestedLocation, reason) {
  const candidates = [
    requestedLocation,
    profile.dayLocations?.[Number(originalDay.day)],
    originalDay.trainingLocation,
    ...(profile.trainingLocations || []),
    "home",
    "indoor",
    "gym",
    "garden",
    "pitch",
  ];
  return candidates.find((location) => locationAllowedForReason(location, reason)) || "home";
}

function suggestedRescheduleDay(profile, originalDay, reason) {
  const originalLocation = originalDay?.trainingLocation || profile.dayLocations?.[Number(originalDay?.day)];
  if (!["weather", "no_pitch"].includes(reason) || !OUTDOOR_LOCATIONS.has(originalLocation)) return null;
  const originalDayNumber = Number(originalDay?.day);
  if (!Number.isInteger(originalDayNumber)) return null;
  const skeleton = buildScheduleSkeleton(profile);
  const candidates = profile.availableDays
    .filter((day) => day !== originalDayNumber)
    .filter((day) => skeleton[day]?.type === "rest")
    .filter((day) => profile.dayLocations?.[day] === originalLocation)
    .map((day) => ({ day, distance: (day - originalDayNumber + 7) % 7 }))
    .filter((item) => item.distance > 0)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.day ?? null;
}

export function createAdaptedSession(rawProfile, originalDay = {}, rawOptions = {}) {
  const profile = normalizeProfile(rawProfile);
  const reason = ["weather", "no_pitch", "short_time", "tired", "equipment"].includes(rawOptions.reason) ? rawOptions.reason : "short_time";
  const location = resolveAdaptLocation(profile, originalDay, rawOptions.location, reason);
  const environment = LOCATION_ENVIRONMENT[location] || "small_space";
  const readiness = ["fresh", "normal", "tired"].includes(rawOptions.readiness) ? rawOptions.readiness : "normal";
  const ballAvailable = rawOptions.ballAvailable !== false && profile.equipment.includes("top");
  const requestedMinutes = [10, 20, 30, 45, 60].includes(Number(rawOptions.minutes)) ? Number(rawOptions.minutes) : 20;
  let minutes = requestedMinutes;
  if (readiness === "tired" || reason === "tired") minutes = Math.min(minutes, 20);
  if (profile.limitation === "returning") minutes = Math.min(minutes, 30);
  if (profile.limitation === "discomfort") minutes = Math.min(minutes, 15);
  if (profile.matchDay !== null && distanceFromMatch(Number(originalDay.day), profile.matchDay) <= 1) minutes = Math.min(minutes, 20);

  const equipment = ballAvailable ? profile.equipment.filter((item) => item !== "yok") : [];
  let footballPool = availableExercisesFor(profile, Number(originalDay.day), { equipment, environment });
  if (readiness === "tired" || minutes <= 20) footballPool = footballPool.filter((exercise) => exercise.focus !== "hiz");
  const masteryPool = ballAvailable
    ? BALL_MASTERY.filter((exercise) => exercise.environment.includes(environment) && exercise.equipment.every((item) => equipment.includes(item)))
    : [];
  const lowLoadPool = ADAPTIVE_EXERCISES.filter((exercise) => exercise.environment.includes(environment));

  let chosen = [];
  if (ballAvailable && footballPool.length) {
    const priority = [...footballPool].sort((a, b) => {
      const ap = a.focus === profile.primaryGoal ? 2 : profile.goals.includes(a.focus) ? 1 : 0;
      const bp = b.focus === profile.primaryGoal ? 2 : profile.goals.includes(b.focus) ? 1 : 0;
      return bp - ap || a.id.localeCompare(b.id);
    });
    chosen = priority.slice(0, minutes <= 10 ? 1 : minutes <= 20 ? 2 : 3);
    if (minutes <= 20 && masteryPool.length) chosen = [masteryPool[Number(originalDay.day || 0) % masteryPool.length], ...chosen].slice(0, 2);
    if (minutes >= 20 || readiness === "tired") chosen = [lowLoadPool[0], ...chosen].filter(Boolean).slice(0, minutes <= 20 ? 3 : 4);
  } else if (ballAvailable && masteryPool.length) {
    chosen = [lowLoadPool[0], ...masteryPool].filter(Boolean).slice(0, minutes <= 10 ? 2 : 3);
  } else {
    chosen = lowLoadPool.slice(0, minutes <= 10 ? 2 : minutes <= 20 ? 3 : 4);
  }
  if (!chosen.length) chosen = lowLoadPool.slice(0, 2);

  const restSeconds = readiness === "tired" ? 45 : 30;
  const restTotal = Math.max(0, chosen.length - 1) * restSeconds;
  const activeSeconds = Math.max(300 * chosen.length, minutes * 60 - restTotal);
  const perExercise = Math.max(240, Math.min(600, Math.floor(activeSeconds / Math.max(1, chosen.length) / 30) * 30));
  const exerciseIds = chosen.map((exercise) => exercise.id);
  const exerciseDurations = Object.fromEntries(exerciseIds.map((id) => [id, perExercise]));
  const actualMinutes = Math.max(5, Math.round((perExercise * exerciseIds.length + restTotal) / 60));
  const locationLabel = TRAINING_LOCATIONS.find((item) => item.id === location)?.label || "Available space";
  const title = ballAvailable ? (minutes <= 20 ? "Technical Rescue Session" : "Adapted Development Session") : "Bodyweight Football Reset";
  const rescheduleDay = suggestedRescheduleDay(profile, originalDay, reason);
  const rescheduleSuffix = rescheduleDay !== null
    ? ` If access returns, ${DAY_NAMES[rescheduleDay]} is the cleanest open slot to revisit the original outdoor focus.`
    : "";
  const noteByReason = {
    weather: `Weather changed the plan, so this session keeps useful work at ${locationLabel.toLowerCase()} without forcing the original outdoor load.${rescheduleSuffix}`,
    no_pitch: `Pitch access changed, so the session protects today's training habit using the space you actually have.${rescheduleSuffix}`,
    short_time: `The session is compressed to the time you have now. Quality actions stay; unnecessary volume is removed.`,
    tired: `Readiness is lower today, so intensity and volume are reduced instead of pretending every day should be maximal.`,
    equipment: `Equipment changed, so the session uses only what is available now and keeps the weekly load sensible.`,
  };

  const adaptedExercises = exerciseIds.map((id) => {
    const exercise = [...EXERCISES, ...BALL_MASTERY, ...ADAPTIVE_EXERCISES].find((item) => item.id === id);
    return exercise ? { ...exercise, ...exerciseMeta(exercise) } : null;
  }).filter(Boolean);
  const exerciseProgressions = Object.fromEntries(adaptedExercises.map((exercise) => [exercise.id, exerciseProgressionFor(profile, exercise)]));

  return {
    kind: "adapted",
    title,
    coachNote: noteByReason[reason],
    progressionCue: readiness === "tired" ? "Move cleanly and finish with energy in reserve." : "Keep the technical intent high even though the setup changed.",
    exerciseIds,
    exerciseDurations,
    restSeconds,
    estimatedMinutes: actualMinutes,
    sessionIntent: sessionIntentFor(adaptedExercises),
    trainingMix: sessionMix(adaptedExercises),
    workoutBlocks: adaptedExercises.length ? [...new Map(adaptedExercises.map((exercise) => { const type = blockTypeForExercise(exercise); const meta = BLOCK_META[type] || BLOCK_META.technique; return [type, { ...meta, exerciseIds: adaptedExercises.filter((item) => blockTypeForExercise(item) === type).map((item) => item.id) }]; })).values()] : [],
    progression: progressionFor(profile),
    exerciseProgressions,
    trainingLocation: location,
    reason,
    readiness,
    ballAvailable,
    countsAsMain: true,
    rescheduleDay,
  };
}

export async function createPlan(rawProfile, options = {}) {
  const profile = normalizeProfile(rawProfile);
  const validation = validateProfile(profile);
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  try {
    return await generateWithOpenAI(profile, options);
  } catch (error) {
    console.warn("Using safe local plan fallback:", error.message);
    const fallback = generateFallbackPlan(profile);
    if (!validatePlan(fallback, profile)) throw new Error("fallback_plan_invalid");
    return fallback;
  }
}
