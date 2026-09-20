import test from "node:test";
import assert from "node:assert/strict";
import { generateFallbackPlan, validatePlan } from "../server/plan.js";
import {
  applyWeekOverrides,
  completedDevelopmentLevel,
  createDemoProfile,
  exerciseById,
  focusStats,
  historySummary,
  feedbackCoachAdjustment,
  exerciseHistorySummary,
  getISOWeek,
  movePlanSession,
  possibleMoveTargets,
  weeklyCoachReview,
  weeklyConsistencyStreak,
  mainSessions,
  masterySessions,
  normalizeDailyCheckIn,
  readinessFromCheckIn,
  checkInNeedsAdaptation,
  rehydrateActiveWorkout,
  sessionsThisWeek,
  currentStreak,
} from "./appUtils.js";

test("demo profile produces a startable main workout and Ball Mastery experience", () => {
  const today = 3;
  const profile = createDemoProfile(today);
  const plan = generateFallbackPlan(profile);
  assert.equal(validatePlan(plan, profile), true);
  const day = plan.days.find((item) => item.day === today);
  assert.equal(day?.type, "personal");
  assert.ok(day.exerciseIds.length > 0);
  assert.ok(day.exerciseIds.every((id) => exerciseById(id)));
  assert.ok(day.ballMastery);
  assert.ok(day.ballMastery.exerciseIds.every((id) => exerciseById(id)));
});

test("completed training drives weekly progress, mastery tracking and progression", () => {
  const now = new Date(2026, 8, 10, 18, 0, 0);
  const sessions = [
    { id: "main-1", completedAt: now.toISOString(), day: 3, kind: "main", durationSeconds: 2400, exerciseIds: ["wing-1", "wing-4"], feedback: "good" },
    { id: "bm-1", completedAt: now.toISOString(), day: 3, kind: "ball_mastery", durationSeconds: 1200, exerciseIds: ["bm-1", "bm-2", "bm-3", "bm-4"], feedback: "good" },
  ];
  assert.equal(sessionsThisWeek(sessions, now).length, 2);
  assert.equal(masterySessions(sessions).length, 1);
  assert.equal(currentStreak(sessions, now), 1);
  assert.ok(focusStats(sessions).some((item) => item.focus === "ball_mastery"));
  assert.equal(historySummary(sessions).completedWorkouts, 1);
  assert.equal(completedDevelopmentLevel(sessions), 1);
});


test("adapted rescue sessions count as completed main development work", () => {
  const sessions = [{ id: "adapted-1", completedAt: new Date().toISOString(), day: 2, kind: "adapted", durationSeconds: 1200, exerciseIds: ["adapt-1", "adapt-2"] }];
  assert.equal(mainSessions(sessions).length, 1);
  assert.equal(historySummary(sessions).completedWorkouts, 1);
  assert.ok(exerciseById("adapt-1"));
});


test("daily check-in derives safe readiness and time adaptation", () => {
  const tired = normalizeDailyCheckIn({ energy: "low", soreness: "some", timeAvailable: 20 }, 45);
  assert.equal(readinessFromCheckIn(tired, 45), "tired");
  assert.equal(checkInNeedsAdaptation(tired, 40, 45), true);

  const fresh = normalizeDailyCheckIn({ energy: "high", soreness: "low", timeAvailable: 60 }, 45);
  assert.equal(readinessFromCheckIn(fresh, 45), "fresh");
  assert.equal(checkInNeedsAdaptation(fresh, 40, 45), false);
});

test("legacy readiness values migrate into the richer daily check-in", () => {
  const legacy = normalizeDailyCheckIn("tired", 45);
  assert.equal(legacy.energy, "low");
  assert.equal(legacy.soreness, "high");
  assert.equal(legacy.timeAvailable, 45);
});

test("V7 history summary converts rich workout feedback into progression signals", () => {
  const now = new Date();
  const sessions = [
    { id: "s1", completedAt: new Date(now.getTime() - 86400000).toISOString(), kind: "main", progressionStage: 2, feedback: { difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" } },
    { id: "s2", completedAt: now.toISOString(), kind: "main", progressionStage: 2, feedback: { difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" } },
  ];
  const summary = historySummary(sessions);
  assert.equal(summary.latestStage, 2);
  assert.equal(summary.stageExposureCount, 2);
  assert.equal(summary.positiveSignals, 2);
  assert.equal(summary.holdSignals, 0);
});

test("V7 feedback coach adjustment explains holds and progression without fake scores", () => {
  assert.match(feedbackCoachAdjustment({ difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" }), /progress/i);
  assert.match(feedbackCoachAdjustment({ difficulty: "hard", quality: "poor", energy: "drained", discomfort: "no" }), /hold|recovery/i);
  assert.match(feedbackCoachAdjustment({ difficulty: "right", quality: "okay", energy: "good", discomfort: "yes" }), /discomfort/i);
});

test("weekly consistency tracks active football weeks instead of forcing a daily streak", () => {
  const now = new Date(2026, 8, 12, 12, 0, 0);
  const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 7);
  const sessions = [
    { completedAt: now.toISOString(), kind: "main" },
    { completedAt: lastWeek.toISOString(), kind: "main" },
  ];
  assert.equal(weeklyConsistencyStreak(sessions, now), 2);
});


test("V7.1 exercise history tracks real drill exposures and feedback signals", () => {
  const now = new Date();
  const sessions = [
    { id: "a", completedAt: new Date(now.getTime() - 86400000).toISOString(), day: 1, kind: "main", progressionStage: 2, exerciseIds: ["wing-1", "wing-6"], feedback: { difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" } },
    { id: "b", completedAt: now.toISOString(), day: 2, kind: "main", progressionStage: 2, exerciseIds: ["wing-1"], feedback: { difficulty: "right", quality: "okay", energy: "good", discomfort: "no" } },
  ];
  const drillHistory = exerciseHistorySummary(sessions);
  assert.equal(drillHistory["wing-1"].exposures, 2);
  assert.equal(drillHistory["wing-1"].positiveSignals, 1);
  assert.equal(historySummary(sessions).recentExerciseCounts["wing-1"], 2);
});

test("V7.1 can move a personal session only to a safe compatible open day", () => {
  const profile = { ...createDemoProfile(0), teamDays: [2], matchDay: 6, availableDays: [0, 1, 3, 4, 5], dayLocations: { 0: "home", 1: "home", 3: "home", 4: "home", 5: "home" }, trainingLocations: ["home"] };
  const plan = generateFallbackPlan(profile);
  const source = plan.days.find((day) => day.type === "personal");
  assert.ok(source);
  const targets = possibleMoveTargets(plan, profile, source.day, new Date(2026, 8, 7));
  if (targets.length) {
    const moved = movePlanSession(plan, profile, source.day, targets[0].day);
    assert.equal(moved.days[source.day].type, "rest");
    assert.equal(moved.days[targets[0].day].type, "personal");
    assert.equal(moved.days[targets[0].day].movedFromDay, source.day);
  }
});

test("V7.1 weekly coach review uses completed work instead of invented performance scores", () => {
  const now = new Date(2026, 8, 10, 12, 0, 0);
  const profile = createDemoProfile(3);
  const plan = generateFallbackPlan(profile);
  const sessions = [
    { completedAt: now.toISOString(), day: 3, kind: "main", durationSeconds: 2400, exerciseIds: ["wing-1", "wing-6"], feedback: { difficulty: "easy", quality: "sharp", energy: "good", discomfort: "no" } },
    { completedAt: now.toISOString(), day: 3, kind: "ball_mastery", durationSeconds: 900, exerciseIds: ["bm-1"] },
  ];
  const review = weeklyCoachReview(sessions, plan, profile, now);
  assert.equal(review.metrics.main, 1);
  assert.equal(review.metrics.mastery, 1);
  assert.equal(review.metrics.minutes, 55);
  assert.ok(review.nextPriority);
});


test("V7.1 current-week move overrides survive a regenerated base plan", () => {
  const now = new Date(2026, 8, 7, 12, 0, 0);
  const profile = { ...createDemoProfile(0), teamDays: [2], matchDay: 6, availableDays: [0, 1, 3, 4, 5], dayLocations: { 0: "home", 1: "home", 3: "home", 4: "home", 5: "home" }, trainingLocations: ["home"] };
  const basePlan = generateFallbackPlan(profile);
  const source = basePlan.days.find((day) => day.type === "personal");
  const target = possibleMoveTargets(basePlan, profile, source.day, now)[0];
  if (!target) return;
  const overrides = { [getISOWeek(now)]: [{ fromDay: source.day, toDay: target.day }] };
  const regenerated = generateFallbackPlan(profile);
  const applied = applyWeekOverrides(regenerated, profile, overrides, now);
  assert.equal(applied.days.find((day) => day.day === source.day).type, "rest");
  assert.equal(applied.days.find((day) => day.day === target.day).type, "personal");
  assert.equal(applied.days.find((day) => day.day === target.day).movedFromDay, source.day);

  const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
  const untouched = applyWeekOverrides(generateFallbackPlan(profile), profile, overrides, nextWeek);
  assert.equal(untouched.days.find((day) => day.day === source.day).type, source.type);
});


test("V7.2 workout persistence resumes a running timer after a short refresh gap", () => {
  const persistedAt = Date.parse("2026-09-14T12:00:00.000Z");
  const workout = {
    kind: "main", phase: "exercise", index: 0, running: true,
    exerciseIds: ["wing-1", "wing-6"], exerciseDurations: { "wing-1": 60, "wing-6": 60 },
    restSeconds: 30, remainingMs: 50000, elapsedSeconds: 10, lastPersistedAt: new Date(persistedAt).toISOString(),
  };
  const resumed = rehydrateActiveWorkout(workout, persistedAt + 10000);
  assert.equal(resumed.phase, "exercise");
  assert.equal(resumed.index, 0);
  assert.equal(resumed.remaining, 40);
  assert.equal(resumed.elapsedSeconds, 20);
  assert.equal(resumed.running, true);
});

test("V7.2 workout persistence can cross from exercise into rest while the page reloads", () => {
  const persistedAt = Date.parse("2026-09-14T12:00:00.000Z");
  const workout = {
    kind: "main", phase: "exercise", index: 0, running: true,
    exerciseIds: ["wing-1", "wing-6"], exerciseDurations: { "wing-1": 60, "wing-6": 60 },
    restSeconds: 30, remainingMs: 5000, elapsedSeconds: 55, lastPersistedAt: new Date(persistedAt).toISOString(),
  };
  const resumed = rehydrateActiveWorkout(workout, persistedAt + 10000);
  assert.equal(resumed.phase, "rest");
  assert.equal(resumed.index, 0);
  assert.equal(resumed.remaining, 25);
  assert.equal(resumed.elapsedSeconds, 65);
});

test("V7.2 workout persistence pauses safely after a long background gap", () => {
  const persistedAt = Date.parse("2026-09-14T12:00:00.000Z");
  const workout = {
    kind: "main", phase: "exercise", index: 0, running: true,
    exerciseIds: ["wing-1"], exerciseDurations: { "wing-1": 60 },
    restSeconds: 30, remainingMs: 50000, elapsedSeconds: 10, lastPersistedAt: new Date(persistedAt).toISOString(),
  };
  const resumed = rehydrateActiveWorkout(workout, persistedAt + 20 * 60 * 1000);
  assert.equal(resumed.remainingMs, 50000);
  assert.equal(resumed.elapsedSeconds, 10);
  assert.equal(resumed.running, false);
  assert.equal(resumed.resumeNotice, true);
});
