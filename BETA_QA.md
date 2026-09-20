# Closed Beta QA — V7.3 Editorial UI

Run this checklist on the exact deployed build before inviting testers. A beta is ready only when every **P0** item passes.

## 1. Build and server — P0

- [ ] `npm ci` completes on Node 20+.
- [ ] `npm run check` passes (tests + Vite production build).
- [ ] `NODE_ENV=production npm start` serves the app.
- [ ] `GET /api/health` returns HTTP 200.
- [ ] Refreshing a client route still serves the SPA instead of a 404.
- [ ] `.env`, API keys, `node_modules`, and local development files are not committed or shipped as public assets.

## 2. First-use flow — P0

Test once with an OpenAI key and once without one.

- [ ] Landing → Build My Plan opens onboarding.
- [ ] All onboarding controls remain usable at 320, 360/375, 390 and 430px widths.
- [ ] Onboarding creates a seven-day plan.
- [ ] No Turkish or other unexpected-language coaching copy appears.
- [ ] Fallback planning works when AI is unavailable.
- [ ] Home immediately answers: what to do, why it matters, and how to start.

## 3. Returning-player Home — P0

- [ ] After completed training, the large first-use hero no longer dominates the screen.
- [ ] Daily Check-in and Today appear early in the scroll.
- [ ] Today has one visually dominant `Start Session` action.
- [ ] Technique / Game Realistic / Physical labels remain legible and consistent.

## 4. Workout resilience — P0

- [ ] Start a workout, wait 20–30 seconds, refresh: timer resumes with sensible remaining time.
- [ ] Background the tab briefly and return: elapsed time is reconciled.
- [ ] Background for more than 15 minutes: workout restores paused with a clear message.
- [ ] Pause/resume works repeatedly without timer jumps.
- [ ] Exercise → rest → next exercise transitions are correct.
- [ ] Closing an unfinished workout does not count it as completed.
- [ ] Completing feedback clears the active workout and records the session exactly once.

## 5. Coaching safety — P0

- [ ] No personal main session overwrites team training.
- [ ] No personal main session is placed on match day.
- [ ] Protected pre-match recovery is preserved.
- [ ] Tired/adapted sessions respect reduced load.
- [ ] Bad-weather adaptation never selects an outdoor location.
- [ ] No-pitch adaptation never selects the pitch.
- [ ] No-ball adaptation uses only compatible work.
- [ ] Discomfort/returning constraints never increase load.

## 6. Feedback and progression — P0

- [ ] `Too easy + Sharp` can contribute toward progression after enough quality exposure.
- [ ] `Too hard`, `Poor`, `Drained`, or discomfort prevents an aggressive progression jump.
- [ ] Progress shows real completed work, not fabricated performance percentages.
- [ ] Weekly Coach Review reflects the saved session history.
- [ ] Moving a session never overwrites match/team/recovery constraints.

## 7. Network and failure states — P0

- [ ] Turn network off: an offline banner appears while the saved plan stays usable.
- [ ] Plan refresh while offline gives a useful error and does not erase the current plan.
- [ ] Adapt Session failure does not corrupt the weekly plan.
- [ ] Slow/failed Coach request shows retry-safe copy.
- [ ] Rate-limited requests return a useful message rather than breaking the UI.

## 8. Analytics privacy and beta funnel — P0 when PostHog is enabled

Verify only after `VITE_POSTHOG_KEY` is configured in the deployed build.

Expected funnel events:

1. `onboarding_completed`
2. `session_started`
3. `session_completed`
4. `feedback_submitted`

Additional useful events include `session_adapted`, `session_moved`, `progression_advanced`, `workout_abandoned`, and `plan_refresh_failed`.

- [ ] Events arrive in the intended PostHog project.
- [ ] No soreness, energy, limitation text, health notes, or free-text profile content is sent.
- [ ] Anonymous IDs persist on the same browser but do not contain player names/emails.
- [ ] Analytics failure never blocks training.

## 9. Mobile UX and accessibility — P1

Run on at least one real iPhone/Safari and one real Android/Chrome device.

- [ ] Bottom navigation respects device safe areas.
- [ ] Workout controls are reachable with one hand and do not collide with browser chrome.
- [ ] Tap targets are comfortably usable with touch.
- [ ] Text remains readable in dark mode and at narrow widths.
- [ ] Reduced-motion preference removes nonessential motion.
- [ ] Keyboard/focus states remain usable for forms.
- [ ] No horizontal page scrolling occurs.

## 10. Beta data expectations — P0

- [ ] Profile clearly explains that beta training data is stored on this browser/device.
- [ ] Refreshing/reopening the browser preserves profile, plan, progress and in-progress workout.
- [ ] Reset removes local beta data only after confirmation.
- [ ] Testers understand that changing device or clearing browser storage removes local progress until cloud accounts are added.

## Beta exit criteria

Do not broaden the beta until all P0 checks pass, no safety-critical scheduling bug is known, and at least 2–3 testers can complete onboarding → session → feedback without explanation from the developer.
