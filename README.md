# Football AI Coach — Closed Beta V7.2

Mobile-first football development app using the existing **React + Vite frontend** and **Node/Express backend**. V7.2 keeps the V7.1 coaching engine and adds closed-beta resilience: **clearer returning-player UX, offline-safe messaging, persistent workouts, production serving, API rate limiting and beta analytics instrumentation**.


## What V7.2 adds for closed beta

- **Returning-player Home hierarchy:** after the first completed session, the oversized hero collapses into a compact Coach-ready strip so Daily Check-in and Today move higher on the screen.
- **Workout recovery:** active workouts persist every second and on page hide. A short refresh/background interruption restores the live timer; a long interruption restores the workout paused instead of silently completing it.
- **Offline-safe UX:** the app clearly indicates offline mode while keeping the validated saved week, progress and in-progress workout available. Plan/adaptation requests use explicit timeout and retry-safe error messages.
- **Production Express serving:** `npm start` now serves the Vite `dist` build and the `/api/*` routes from one origin, which matches the beta deployment architecture.
- **Basic beta abuse protection:** coaching API routes have an in-memory request limit, payload limits and conservative security headers.
- **Render blueprint:** `render.yaml` provides a one-service deployment path with health checking and build/start commands.
- **Analytics funnel completion:** events now include onboarding completion, workout/session completion, feedback submission, progression advancement and plan-refresh failures. No soreness, energy, limitation text or other health details are sent to analytics.
- **Device-data clarity:** Profile explicitly explains that beta data is local to the current browser/device.
- **Mobile accessibility polish:** safe-area padding, larger coarse-pointer tap targets, 320–340px layout safeguards and reduced-motion support.

## What V7.1 adds

- **Structured sessions:** main workouts are organised into Activation → Technique → Game Transfer → Football Speed (when appropriate) → Reset.
- **Evidence-based progression review:** progression is no longer based on workout count alone. Repeated quality exposures plus Difficulty, Quality, post-session Energy and Discomfort determine whether a stage builds, holds or becomes ready for review.
- **Exercise-level progression:** every main drill carries its own stage, exposure history and coaching constraint instead of inheriting one global difficulty blindly.
- **Skill-specific development paths:** the primary goal now has its own football pathway (for example finishing, 1v1, scanning or first touch), while the position pathway remains the fallback.
- **Smarter drill rotation:** recent drill/focus history influences selection so the plan avoids unnecessary repetition while keeping the primary development priority.
- **Safe weekly session moves:** a personal session can move to a compatible open day without overwriting team training, match day, protected recovery or training-space requirements. The override survives plan refreshes for the current week only.
- **Coach adjustment loop:** after a main/adapted workout the plan refreshes so the next session can react to the player’s feedback.
- **Weekly Coach Review:** completed main sessions, Ball Mastery, training minutes, primary focus and next priority are summarised from real completion data without fake performance scores.
- **Drill Progression view:** Progress shows recent drill exposures, latest constraint and feedback evidence so development is visible rather than hidden.
- **Comeback protection:** after a longer break, the first return plan automatically reduces load and rebuilds rhythm instead of trying to “catch up”.
- **English-only coach output:** OpenAI can choose only validated exercise IDs. User-facing titles and coaching explanations are deterministic server-side English, so AI-generated Turkish/other-language copy cannot leak into the product.
- **PostHog-ready anonymous analytics:** optional event capture for onboarding, check-in, session start/completion/adaptation/move and progression behavior. No health notes or free-text profile fields are sent.
- **Premium navy + electric-blue visual system:** clearer hierarchy, restrained glow, structured-block visuals and a more performance-product feel.

## Existing product flow

- Premium football-led landing experience with **Start Free** and **Try a Demo Plan**.
- Seven-step onboarding covering age, level, dominant foot, position/role, goals, football week, real training places, day-by-day locations, commitment, session length, equipment and training status.
- Server-side OpenAI personalisation using Structured Outputs. AI only selects validated exercise IDs; scheduling, timing, recovery, location filtering, progression and Ball Mastery remain deterministic.
- Safe local fallback when no OpenAI key is configured or the API fails.
- Main individual sessions target meaningful development duration (30/45/60 minute preference, age/load capped).
- **Ball Mastery:** normally 4× weekly, up to 20 minutes per block, automatically reduced around heavy team/match load.
- **Daily Check-in:** Energy, Soreness and Time available can automatically reduce or shorten today’s session.
- **Adapt Session:** weather, pitch access, time, readiness or equipment changes can rebuild only today’s work around the player’s real setup.
- Simplified Weekly Plan with day cards, one selected-day focus card and optional drill details.
- Full-screen workout flow with smooth requestAnimationFrame timer, rest transitions, structured block transitions and resume support.
- Real progress from completed sessions only. No fake skill percentages.
- localStorage persistence for profile, plan, check-in, workout-in-progress and completed sessions.
- No account, database, payments or subscriptions in this MVP.

## Training model

### Session structure

A standard personal session can contain:

1. **Activation** — prepare feet, joints and movement quality.
2. **Technique** — repeatable mechanics before pressure or speed.
3. **Game Transfer** — turn the skill into a decision or match action.
4. **Football Speed** — optional controlled physical exposure when the weekly load allows it.
5. **Reset** — easy breathing/mobility to finish with quality in reserve.

### Progression stages

`Control → Speed → Weak Foot → Scan → Decision → Match Speed`

The progression engine uses completed-session feedback. Repeated **Too easy + Sharp** feedback can progress the constraint; **Too hard, Poor, Drained or discomfort** holds progression and protects the next load.

## Requirements

- Node.js 20+
- npm
- Optional OpenAI API key

## Setup

```bash
npm ci
cp .env.example .env
```

Add the API key to `.env` for live AI exercise selection:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
PORT=3001

# Optional anonymous product analytics
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

`OPENAI_API_KEY` is read only by Express. Never expose it through a `VITE_` variable. `VITE_POSTHOG_KEY` is optional and is a public client/project key; do not put private analytics secrets in frontend environment variables. Analytics are disabled when it is blank.

Without a key, the app remains usable with the deterministic validated fallback plan.

## Run locally

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

## Verify before deployment

```bash
npm test
npm run build
# or both:
npm run check
```

## Architecture

```text
src/
  App.jsx          Product screens, workout state machine, structured blocks and feedback UX
  analytics.js     Optional privacy-limited PostHog event capture (no SDK required)
  appUtils.js      localStorage migration, drill history, weekly overrides, progress and feedback summaries
  development.js   V7.1 progression stages, skill/position paths and block definitions
  exercises.js     Validated exercise, Ball Mastery, reset and adaptive libraries
  styles.css       Mobile-first navy/blue design system and interaction states
server/
  index.js         Express API including /api/generate-plan and /api/adapt-session
  plan.js          Safe schedule, exercise-level progression, drill rotation, structured sessions, comeback logic and OpenAI integration
  plan.test.js     Safety, progression, adaptation and validation tests
```

## Exercise media

Exercise videos remain optional. Add `videoSrc` and/or `posterSrc` to an exercise and the workout player will render it automatically.

```js
{
  id: "example-drill",
  name: "Example drill",
  videoSrc: "/videos/example-drill.mp4",
  posterSrc: "/images/exercises/example-drill.jpg"
}
```

Use short, technically clear, muted loop clips. If no media is configured, written instructions remain the fallback.

## Closed-beta deployment

The beta is prepared for a **single-origin Node service**: Vite builds to `dist/`, then Express serves that build and `/api/*` from the same host. This avoids production CORS/routing drift and keeps `OPENAI_API_KEY` server-side.

A Render Blueprint is included:

```text
render.yaml
```

Before deploying, set `OPENAI_API_KEY`. PostHog remains optional; set `VITE_POSTHOG_KEY` only when beta analytics should begin. Do not commit `.env`.

Production verification:

```bash
npm ci
npm run check
NODE_ENV=production npm start
```

Then follow `BETA_QA.md` and verify:

```text
GET /api/health
Onboarding → Today → Workout → Feedback → Progress
Refresh during a running workout
Offline banner + saved-plan access
Adapt Session fallback/error behavior
```
