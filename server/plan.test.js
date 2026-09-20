import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBallMasterySchedule,
  buildScheduleSkeleton,
  createAdaptedSession,
  createPlan,
  generateFallbackPlan,
  normalizeProfile,
  validatePlan,
} from "./plan.js";
import { BALL_MASTERY, EXERCISES } from "../src/exercises.js";

const baseProfile = {
  age: 17,
  position: "kanat",
  secondaryPosition: "forvet",
  role: "Inside Forward",
  dominantFoot: "right",
  level: "competitive",
  goals: ["calim", "hiz", "ilk_temas"],
  primaryGoal: "calim",
  equipment: ["top", "koni", "kale", "duvar"],
  environment: "full_pitch",
  trainingLocations: ["home", "pitch", "indoor"],
  dayLocations: { 0: "pitch", 2: "home", 4: "pitch", 6: "indoor" },
  availableDays: [0, 2, 4, 6],
  teamDays: [1, 3],
  matchDay: 5,
  sessionLength: 45,
  commitment: "committed",
  limitation: "none",
  ballMasteryEnabled: true,
  historySummary: { completedWorkouts: 0, completedBallMastery: 0 },
};

test("profile normalization keeps the new development inputs", () => {
  const profile = normalizeProfile(baseProfile);
  assert.equal(profile.role, "Inside Forward");
  assert.equal(profile.dominantFoot, "right");
  assert.equal(profile.primaryGoal, "calim");
  assert.equal(profile.sessionLength, 45);
  assert.equal(profile.commitment, "committed");
  assert.equal(profile.environment, "small_space");
  assert.deepEqual(profile.trainingLocations, ["home", "pitch", "indoor"]);
  assert.equal(profile.dayLocations[0], "pitch");
});

test("schedule never puts main personal work on team, match or protected pre-match recovery days", () => {
  const skeleton = buildScheduleSkeleton(baseProfile);
  assert.equal(skeleton[1].type, "team");
  assert.equal(skeleton[3].type, "team");
  assert.equal(skeleton[5].type, "match");
  assert.equal(skeleton[4].type, "recovery");
  assert.notEqual(skeleton[6].type, "personal");
  for (const day of skeleton.filter((item) => item.type === "personal")) {
    assert.ok(!baseProfile.teamDays.includes(day.day));
    assert.notEqual(day.day, baseProfile.matchDay);
  }
});

test("younger players still receive a conservative main-football activity budget", () => {
  const skeleton = buildScheduleSkeleton({ ...baseProfile, age: 12, teamDays: [1, 3], matchDay: 5 });
  const active = skeleton.filter((day) => ["personal", "team", "match"].includes(day.type));
  assert.ok(active.length <= 4);
});

test("fallback plan creates meaningful-duration main sessions from validated exercises", () => {
  const plan = generateFallbackPlan(baseProfile);
  assert.equal(plan.days.length, 7);
  assert.equal(plan.version, 71);
  assert.ok(validatePlan(plan, baseProfile));
  const personal = plan.days.filter((day) => day.type === "personal");
  assert.ok(personal.length >= 1);
  assert.ok(personal.every((day) => day.estimatedMinutes >= 30));
  assert.ok(personal.every((day) => day.exerciseIds.every((id) => EXERCISES.some((exercise) => exercise.id === id))));
  assert.ok(personal.every((day) => day.exerciseIds.every((id) => day.exerciseDurations[id] >= 300)));
});

test("Ball Mastery targets four weekly touch blocks when the football week allows it", () => {
  const profile = { ...baseProfile, teamDays: [2], matchDay: 6, availableDays: [0, 1, 3, 4, 5] };
  const map = buildBallMasterySchedule(profile);
  assert.equal(map.size, 4);
  for (const [day, mastery] of map.entries()) {
    assert.notEqual(day, profile.matchDay);
    assert.ok(mastery.minutes >= 10 && mastery.minutes <= 20);
    assert.ok(mastery.exerciseIds.every((id) => BALL_MASTERY.some((exercise) => exercise.id === id)));
  }
});

test("high development can schedule a fifth technical habit block without adding a match-day session", () => {
  const profile = { ...baseProfile, commitment: "high", teamDays: [2], matchDay: 6, availableDays: [0, 1, 3, 4, 5] };
  const plan = generateFallbackPlan(profile);
  assert.ok(plan.masteryTarget >= 4 && plan.masteryTarget <= 5);
  assert.equal(plan.days[6].ballMastery, null);
  assert.ok(validatePlan(plan, profile));
});

test("progression increases after completed main sessions without exceeding the selected session cap", () => {
  const early = generateFallbackPlan({ ...baseProfile, historySummary: { completedWorkouts: 0 } });
  const progressed = generateFallbackPlan({ ...baseProfile, historySummary: { completedWorkouts: 16 } });
  assert.ok(progressed.progression.level > early.progression.level);
  const earlyMinutes = Math.max(...early.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  const progressedMinutes = Math.max(...progressed.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  assert.ok(progressedMinutes >= earlyMinutes);
  assert.ok(progressedMinutes <= baseProfile.sessionLength + 1);
});

test("minor discomfort reduces load rather than increasing development volume", () => {
  const normal = generateFallbackPlan(baseProfile);
  const limited = generateFallbackPlan({ ...baseProfile, limitation: "discomfort" });
  const normalMax = Math.max(...normal.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  const limitedMax = Math.max(...limited.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  assert.ok(limitedMax <= normalMax);
  assert.ok(limited.masteryTarget <= normal.masteryTarget);
});

test("equipment mismatch degrades a main session safely instead of inventing exercises", () => {
  const noGear = { ...baseProfile, position: "kaleci", equipment: ["yok"], environment: "small_space", teamDays: [], matchDay: null, availableDays: [0, 2] };
  const plan = generateFallbackPlan(noGear);
  assert.ok(validatePlan(plan, noGear));
  assert.equal(plan.days.filter((day) => day.type === "personal").length, 0);
  assert.equal(plan.masteryTarget, 0);
});

test("malformed AI output cannot break plan generation", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, async json() { return { output_text: "not-json" }; } });
  try {
    const plan = await createPlan(baseProfile, { apiKey: "test-key" });
    assert.equal(plan.source, "fallback");
    assert.equal(validatePlan(plan, baseProfile), true);
  } finally {
    global.fetch = originalFetch;
  }
});


test("day-specific training locations change the validated exercise pool", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2], dayLocations: { 0: "pitch", 2: "home" } });
  const pitchDay = plan.days[0];
  const homeDay = plan.days[2];
  assert.equal(pitchDay.trainingLocation, "pitch");
  assert.equal(homeDay.trainingLocation, "home");
  assert.ok(homeDay.exerciseIds.every((id) => {
    const exercise = EXERCISES.find((item) => item.id === id);
    return exercise?.environment?.includes("small_space");
  }));
});

test("Adapt Session can rescue a no-ball day with validated bodyweight work", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0], dayLocations: { 0: "home" } });
  const session = createAdaptedSession(baseProfile, plan.days[0], { reason: "weather", location: "home", minutes: 20, readiness: "normal", ballAvailable: false });
  assert.equal(session.kind, "adapted");
  assert.equal(session.ballAvailable, false);
  assert.ok(session.exerciseIds.length >= 2);
  assert.ok(session.exerciseIds.every((id) => id.startsWith("adapt-")));
  assert.ok(session.estimatedMinutes <= 22);
});

test("lower readiness caps an adapted session instead of forcing requested volume", () => {
  const session = createAdaptedSession(baseProfile, { day: 0, type: "personal" }, { reason: "tired", location: "pitch", minutes: 45, readiness: "tired", ballAvailable: true });
  assert.ok(session.estimatedMinutes <= 21);
  assert.equal(session.readiness, "tired");
});

test("bad-weather adaptation never returns an outdoor training location", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2], dayLocations: { 0: "pitch", 2: "pitch" } });
  const session = createAdaptedSession(baseProfile, plan.days[0], { reason: "weather", location: "pitch", minutes: 20, readiness: "normal", ballAvailable: true });
  assert.ok(!["pitch", "garden"].includes(session.trainingLocation));
});

test("no-pitch adaptation rejects pitch even when the client sends it", () => {
  const session = createAdaptedSession(baseProfile, { day: 0, type: "personal", trainingLocation: "pitch" }, { reason: "no_pitch", location: "pitch", minutes: 20, readiness: "normal", ballAvailable: true });
  assert.notEqual(session.trainingLocation, "pitch");
});

test("weather adaptation can suggest the next open day for the original outdoor focus", () => {
  const profile = { ...baseProfile, teamDays: [1], matchDay: 5, availableDays: [0, 2, 4], dayLocations: { 0: "pitch", 2: "pitch", 4: "pitch" } };
  const session = createAdaptedSession(profile, { day: 0, type: "personal", trainingLocation: "pitch" }, { reason: "weather", location: "home", minutes: 20, readiness: "normal", ballAvailable: true });
  assert.ok(session.rescheduleDay === null || Number.isInteger(session.rescheduleDay));
  if (session.rescheduleDay !== null) assert.notEqual(session.rescheduleDay, 0);
});

test("V7 sessions connect technique to game-realistic transfer when the library allows it", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2, 4], dayLocations: { 0: "pitch", 2: "home", 4: "pitch" } });
  const personal = plan.days.filter((day) => day.type === "personal");
  assert.ok(personal.length > 0);
  for (const day of personal) {
    assert.ok(day.sessionIntent);
    assert.ok(day.trainingMix);
    assert.ok(day.trainingMix.technique >= 1);
    assert.ok(day.trainingMix.game_realistic >= 1);
  }
});

test("V7 validated library includes broader professional position scenarios", () => {
  const positions = ["kaleci", "stoper", "bek", "ortasaha", "kanat", "forvet"];
  for (const position of positions) {
    const pool = EXERCISES.filter((exercise) => exercise.position === position);
    assert.ok(pool.length >= 8);
  }
  assert.ok(EXERCISES.length >= 48);
});

test("V7 personal sessions expose structured Activation to Reset workout blocks", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2, 4], dayLocations: { 0: "pitch", 2: "home", 4: "pitch" } });
  const session = plan.days.find((day) => day.type === "personal");
  assert.ok(session);
  assert.equal(session.workoutBlocks[0].id, "activation");
  assert.equal(session.workoutBlocks.at(-1).id, "recovery");
  assert.ok(session.workoutBlocks.some((block) => block.id === "technique"));
  assert.ok(session.workoutBlocks.some((block) => block.id === "game_realistic"));
  assert.ok(session.exerciseIds.every((id) => session.workoutBlocks.some((block) => block.exerciseIds.includes(id))));
});

test("V7 progression advances from repeated sharp/easy feedback rather than volume alone", () => {
  const plan = generateFallbackPlan({
    ...baseProfile,
    historySummary: {
      completedWorkouts: 6,
      latestStage: 2,
      stageExposureCount: 2,
      positiveSignals: 2,
      holdSignals: 0,
      lastFeedback: { difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" },
    },
  });
  assert.equal(plan.progression.level, 3);
  assert.equal(plan.progression.id, "weak_foot");
  assert.equal(plan.progression.decision, "progress");
});

test("V7 progression holds after hard, poor or drained feedback", () => {
  const plan = generateFallbackPlan({
    ...baseProfile,
    historySummary: {
      completedWorkouts: 12,
      latestStage: 3,
      stageExposureCount: 3,
      positiveSignals: 2,
      holdSignals: 1,
      lastFeedback: { difficulty: "hard", quality: "poor", energy: "drained", discomfort: "no" },
    },
  });
  assert.equal(plan.progression.level, 3);
  assert.equal(plan.progression.decision, "hold");
  assert.match(plan.coachAdjustment, /holding|conservative|quality/i);
});

test("V7 comeback mode reduces the first return load after a longer break", () => {
  const normal = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2] });
  const comeback = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2], historySummary: { completedWorkouts: 8, latestStage: 2, daysSinceLastMain: 10 } });
  const normalMax = Math.max(...normal.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  const comebackMax = Math.max(...comeback.days.filter((day) => day.type === "personal").map((day) => day.estimatedMinutes));
  assert.equal(comeback.progression.comeback, true);
  assert.ok(comebackMax <= normalMax);
  assert.match(comeback.coachAdjustment, /longer break|rhythm/i);
});

test("V7 AI personalisation cannot inject non-English coaching copy", async () => {
  const skeleton = buildScheduleSkeleton({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2], dayLocations: { 0: "pitch", 2: "home" } });
  const personalDays = skeleton.filter((day) => day.type === "personal").map((day) => day.day);
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { output_text: JSON.stringify({ sessions: personalDays.map((day) => ({ day, exerciseIds: ["wing-1", "wing-6"] })) }) };
    },
  });
  try {
    const plan = await createPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0, 2], dayLocations: { 0: "pitch", 2: "home" } }, { apiKey: "test-key" });
    assert.equal(plan.source, "openai");
    for (const day of plan.days.filter((item) => item.type === "personal")) {
      assert.doesNotMatch(day.title, /[İıŞşĞğÜüÖöÇç]/);
      assert.doesNotMatch(day.coachNote, /[İıŞşĞğÜüÖöÇç]/);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("V7 estimated minutes match the structured workout timing including activation, reset and rests", () => {
  const plan = generateFallbackPlan({ ...baseProfile, teamDays: [], matchDay: null, availableDays: [0], dayLocations: { 0: "pitch" } });
  const day = plan.days[0];
  const warmupSeconds = 300;
  const resetSeconds = 180;
  const exerciseSeconds = day.exerciseIds.reduce((sum, id) => sum + day.exerciseDurations[id], 0);
  const totalExerciseCount = 2 + day.exerciseIds.length + 1;
  const restSeconds = Math.max(0, totalExerciseCount - 1) * day.restSeconds;
  const actualMinutes = Math.round((warmupSeconds + resetSeconds + exerciseSeconds + restSeconds) / 60);
  assert.equal(day.estimatedMinutes, actualMinutes);
});


test("V7.1 gives every main drill an explainable exercise-level progression constraint", () => {
  const plan = generateFallbackPlan({
    ...baseProfile,
    teamDays: [],
    matchDay: null,
    availableDays: [0, 2, 4],
    historySummary: { completedWorkouts: 12, latestStage: 4, stageExposureCount: 0, positiveSignals: 0, holdSignals: 0 },
  });
  const session = plan.days.find((day) => day.type === "personal");
  assert.ok(session);
  assert.ok(session.exerciseProgressions);
  for (const id of session.exerciseIds) {
    const progression = session.exerciseProgressions[id];
    assert.ok(progression);
    assert.ok(progression.level >= 1 && progression.level <= 6);
    assert.equal(typeof progression.cue, "string");
    assert.ok(progression.cue.length > 20);
    assert.ok(progression.review);
  }
  assert.ok(session.exerciseIds.some((id) => session.exerciseProgressions[id].level < plan.progression.level));
});

test("V7.1 development path follows the player's primary football skill", () => {
  const plan = generateFallbackPlan({ ...baseProfile, primaryGoal: "calim", goals: ["calim", "hiz", "ilk_temas"] });
  assert.equal(plan.release, "7.1");
  assert.equal(plan.progression.pathwayFocus, "calim");
  assert.ok(plan.progression.pathway.includes("Read defender"));
  assert.equal(plan.weeklyFocus.focus, "calim");
});

test("V7.1 recent drill history is accepted safely and cannot break validated planning", () => {
  const profile = {
    ...baseProfile,
    teamDays: [],
    matchDay: null,
    availableDays: [0, 2, 4],
    historySummary: {
      completedWorkouts: 8,
      latestStage: 2,
      recentExerciseCounts: { "wing-1": 8, "wing-6": 7, unknown: 9999 },
      recentFocusCounts: { calim: 8 },
      exerciseHistory: { "wing-1": { exposures: 8, positiveSignals: 3, holdSignals: 0, latestStage: 2 } },
    },
  };
  const plan = generateFallbackPlan(profile);
  assert.equal(validatePlan(plan, profile), true);
  assert.ok(plan.days.filter((day) => day.type === "personal").every((day) => day.exerciseIds.length >= 2));
});
