import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BALL_MASTERY,
  COMMITMENTS,
  DOMINANT_FEET,
  EQUIPMENT,
  LIMITATIONS,
  MORNING_ROUTINE,
  RESET_ROUTINE,
  POSITIONS,
  ROLE_OPTIONS,
  SESSION_LENGTHS,
  TRAINING_ENVIRONMENTS,
  TRAINING_LOCATIONS,
  TRAINING_TYPES,
  focusAreasFor,
} from "./exercises.js";
import {
  DAY_NAMES,
  DAY_SHORT,
  FOCUS_LABELS,
  LEVELS,
  LS,
  TYPE_META,
  createDemoProfile,
  feedbackCoachAdjustment,
  dateKey,
  exerciseById,
  focusStats,
  formatDuration,
  formatTimer,
  historySummary,
  loadLS,
  mainSessions,
  masterySessions,
  normalizeClientProfile,
  normalizeDailyCheckIn,
  readinessFromCheckIn,
  rehydrateActiveWorkout,
  checkInNeedsAdaptation,
  applyWeekOverrides,
  exerciseHistorySummary,
  getISOWeek,
  movePlanSession,
  possibleMoveTargets,
  saveLS,
  sessionsThisWeek,
  todayIndex,
  weeklyCoachReview,
  weeklyConsistencyStreak,
} from "./appUtils.js";
import { BLOCK_META, POSITION_DEVELOPMENT_PATHS, PROGRESSION_STAGES, progressionConstraint } from "./development.js";
import { track } from "./analytics.js";

const OUTDOOR_LOCATION_IDS = new Set(["garden", "pitch"]);

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-7h5v7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    play: <path d="m8 5 11 7-11 7V5Z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    back: <path d="m15 18-6-6 6-6"/>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    spark: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 14l.7 1.8L7.5 16.5l-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    flame: <path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 4-3 4 1-5-2-8-5-10 1 5-3 7-3 13 0 4 4 7 8 7Z"/>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 18.5 6.5L20 8M4 16l1.5 1.5A7 7 0 0 0 17.9 15"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    ball: <><circle cx="12" cy="12" r="9"/><path d="m9 9 3-2 3 2-1 4h-4L9 9ZM12 7V3M10 13l-3 3M14 13l3 3M7 16l-3-1M17 16l3-1"/></>,
    star: <path d="m12 2.8 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 2.8Z"/>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></>,
    foot: <><path d="M8 3c1 3 1 6-1 8-2 2-3 5-1 8 2 3 7 2 9-1 2-3 1-5-1-7-2-2-2-5-1-8"/><path d="M9 20c2 1 4 0 5-1"/></>,
    rain: <><path d="M7 17a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.5 10 3.5 3.5 0 1 1 18 17H7Z"/><path d="m8 20-1 2M13 20l-1 2M18 20l-1 2"/></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></>,
    minus: <path d="M5 12h14"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
  };
  return <svg {...common}>{paths[name] || paths.ball}</svg>;
}

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <div className="brand-mark"><Icon name="ball" size={compact ? 20 : 24} /></div>
      <div><strong>FOOTBALL AI</strong><span>COACH</span></div>
    </div>
  );
}

function Spinner({ small = false }) {
  return <span className={`spinner ${small ? "spinner-small" : ""}`} aria-hidden="true" />;
}

function ErrorBanner({ children, onDismiss, title = "Couldn’t complete that" }) {
  if (!children) return null;
  return (
    <div className="error-banner" role="alert">
      <div><strong>{title}</strong><span>{children}</span></div>
      {onDismiss && <button className="icon-button" onClick={onDismiss} aria-label="Dismiss"><Icon name="close" size={17} /></button>}
    </div>
  );
}

function ConnectivityBanner() {
  return <div className="connectivity-banner" role="status"><Icon name="shield" size={15}/><span><strong>Offline mode</strong> Your saved week and workout remain available. Reconnect to refresh Coach.</span></div>;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return online;
}

function Button({ children, variant = "primary", icon, loading = false, className = "", ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner small /> : icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </button>
  );
}

function Landing({ onStart, onDemo, demoLoading, error, onDismissError }) {
  return (
    <main className="landing-screen">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />
      <header className="landing-header"><Logo /></header>

      <section className="hero-copy">
        <div className="eyebrow"><Icon name="spark" size={15} /> YOUR FOOTBALL DEVELOPMENT SYSTEM</div>
        <h1>Train with<br/><em>a purpose.</em></h1>
        <p>A personalised week built around your position, goals, team sessions and match day — with a technical habit designed to compound over time.</p>
      </section>

      <div className="pitch-preview" aria-hidden="true">
        <div className="hero-photo-shade" />
        <div className="hero-speed-lines"><i/><i/><i/></div>
        <div className="pitch-line pitch-half" />
        <div className="pitch-circle" />
        <div className="pitch-box pitch-box-left" />
        <div className="pitch-box pitch-box-right" />
        <div className="player-dot dot-one"><span>1</span></div>
        <div className="player-dot dot-two"><span>2</span></div>
        <div className="player-dot dot-three"><span>3</span></div>
        <div className="hero-performance-tag"><Icon name="bolt" size={14}/><span>BUILD YOUR EDGE</span></div>
        <div className="plan-float-card">
          <span className="mini-label">TODAY</span>
          <strong>Speed + 1v1</strong>
          <span>45 min · development session</span>
        </div>
      </div>

      <div className="landing-proof-row" aria-label="Product highlights">
        <div><strong>7</strong><span>Day structure</span></div>
        <div><strong>4×</strong><span>Ball Mastery</span></div>
        <div><strong>AI</strong><span>Personalised</span></div>
      </div>

      <div className="landing-actions">
        <ErrorBanner onDismiss={onDismissError}>{error}</ErrorBanner>
        <Button className="button-block button-large" onClick={onStart}>Start Free</Button>
        <Button className="button-block" variant="ghost" icon="play" loading={demoLoading} onClick={onDemo}>Try a Demo Plan</Button>
        <div className="trust-row">
          <span><Icon name="shield" size={14} /> No account required</span>
          <span><Icon name="clock" size={14} /> About 2 minutes</span>
        </div>
      </div>
    </main>
  );
}

function SelectionCard({ selected, onClick, title, sub, icon }) {
  return (
    <button type="button" className={`selection-card ${selected ? "selected" : ""}`} onClick={onClick}>
      {icon && <span className="selection-icon"><Icon name={icon} size={20} /></span>}
      <span className="selection-copy"><strong>{title}</strong>{sub && <small>{sub}</small>}</span>
      <span className="selection-check">{selected && <Icon name="check" size={14} strokeWidth={2.4} />}</span>
    </button>
  );
}

function DaySelector({ selected, onToggle, disabled = [], single = false }) {
  return (
    <div className="day-selector">
      {DAY_SHORT.map((day, index) => {
        const isSelected = single ? selected === index : selected.includes(index);
        return (
          <button type="button" key={day} className={`day-button ${isSelected ? "selected" : ""}`} disabled={disabled.includes(index)} onClick={() => onToggle(index)}>
            <span>{day.slice(0, 2)}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegmentedOptions({ options, value, onChange, className = "" }) {
  return (
    <div className={`segmented-options ${className}`}>
      {options.map((option) => {
        const item = typeof option === "object" ? option : { id: option, label: String(option) };
        return <button type="button" key={item.id} className={value === item.id ? "selected" : ""} onClick={() => onChange(item.id)}>{item.label}</button>;
      })}
    </div>
  );
}

function Onboarding({ initialProfile, onSubmit, onCancel, mode = "create" }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(() => normalizeClientProfile(initialProfile) || {
    age: 16,
    position: "",
    secondaryPosition: null,
    role: "",
    dominantFoot: "right",
    level: "developing",
    goals: [],
    primaryGoal: null,
    equipment: ["top"],
    availableDays: [],
    teamDays: [],
    matchDay: null,
    sessionLength: 45,
    environment: "small_space",
    trainingLocations: ["home"],
    dayLocations: {},
    commitment: "committed",
    limitation: "none",
    ballMasteryEnabled: true,
    demo: false,
  });

  const steps = ["Player", "Role", "Goals", "Week", "Places", "Training", "Readiness"];
  useEffect(() => {
    track("onboarding_step_viewed", { mode, step_index: step + 1, step_name: steps[step] });
  }, [step, mode]);
  const focusOptions = profile.position ? focusAreasFor(profile.position) : [];
  const roles = profile.position ? ROLE_OPTIONS[profile.position] || [] : [];

  const toggleValue = (array, value, max = Infinity) => {
    if (array.includes(value)) return array.filter((item) => item !== value);
    return [...array, value].slice(-max);
  };

  const toggleGoal = (goal) => {
    setProfile((current) => {
      const goals = toggleValue(current.goals, goal, 3);
      const primaryGoal = goals.includes(current.primaryGoal) ? current.primaryGoal : goals[0] || null;
      return { ...current, goals, primaryGoal };
    });
  };

  const toggleAvailableDay = (day) => setProfile((current) => {
    const availableDays = toggleValue(current.availableDays, day);
    const dayLocations = { ...(current.dayLocations || {}) };
    if (availableDays.includes(day) && !dayLocations[day] && current.trainingLocations?.length) dayLocations[day] = current.trainingLocations[0];
    if (!availableDays.includes(day)) delete dayLocations[day];
    return { ...current, availableDays, dayLocations, teamDays: current.teamDays.filter((item) => item !== day), matchDay: current.matchDay === day ? null : current.matchDay };
  });

  const toggleTeamDay = (day) => setProfile((current) => {
    const dayLocations = { ...(current.dayLocations || {}) }; delete dayLocations[day];
    return { ...current, teamDays: toggleValue(current.teamDays, day), availableDays: current.availableDays.filter((item) => item !== day), dayLocations, matchDay: current.matchDay === day ? null : current.matchDay };
  });

  const setMatchDay = (day) => setProfile((current) => {
    const dayLocations = { ...(current.dayLocations || {}) }; delete dayLocations[day];
    return { ...current, matchDay: current.matchDay === day ? null : day, availableDays: current.availableDays.filter((item) => item !== day), teamDays: current.teamDays.filter((item) => item !== day), dayLocations };
  });

  const toggleEquipment = (id) => {
    setProfile((current) => {
      if (id === "yok") return { ...current, equipment: current.equipment.includes("yok") ? [] : ["yok"] };
      const withoutNone = current.equipment.filter((item) => item !== "yok");
      return { ...current, equipment: toggleValue(withoutNone, id) };
    });
  };

  const toggleTrainingLocation = (id) => {
    setProfile((current) => {
      const trainingLocations = toggleValue(current.trainingLocations || [], id);
      const safeLocations = trainingLocations.length ? trainingLocations : [];
      const dayLocations = { ...(current.dayLocations || {}) };
      Object.keys(dayLocations).forEach((day) => { if (!safeLocations.includes(dayLocations[day])) delete dayLocations[day]; });
      if (safeLocations.length) current.availableDays.forEach((day) => { if (!dayLocations[day]) dayLocations[day] = safeLocations[0]; });
      return { ...current, trainingLocations: safeLocations, dayLocations };
    });
  };

  const setDayLocation = (day, location) => setProfile((current) => ({ ...current, dayLocations: { ...(current.dayLocations || {}), [day]: location } }));

  const changeAge = (delta) => setProfile((current) => ({ ...current, age: Math.min(60, Math.max(10, Number(current.age || 16) + delta)) }));

  const canContinue = () => {
    if (step === 0) return profile.age >= 10 && profile.age <= 60 && Boolean(profile.level) && Boolean(profile.dominantFoot);
    if (step === 1) return Boolean(profile.position);
    if (step === 2) return profile.goals.length > 0 && Boolean(profile.primaryGoal);
    if (step === 3) return profile.availableDays.length > 0;
    if (step === 4) return (profile.trainingLocations || []).length > 0 && profile.availableDays.every((day) => profile.dayLocations?.[day]);
    if (step === 5) return profile.equipment.length > 0 && Boolean(profile.commitment);
    return true;
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ ...profile, age: Number(profile.age), demo: false });
    } catch (err) {
      setError(err.message || "Your plan could not be generated. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <PlanLoading demo={false} />;

  return (
    <main className="onboarding-screen">
      <header className="flow-header">
        <button className="icon-button" onClick={() => step > 0 ? setStep((current) => current - 1) : onCancel()} aria-label="Back"><Icon name="back" /></button>
        <Logo compact />
        <span className="step-count">{step + 1} of {steps.length}</span>
      </header>
      <div className="step-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

      <section className="flow-content">
        <div className="step-label-row"><span>{steps[step]}</span><small>{Math.round(((step + 1) / steps.length) * 100)}% complete</small></div>

        {step === 0 && (
          <>
            <div className="section-kicker">PLAYER PROFILE</div>
            <h2>Set the right training load.</h2>
            <p className="section-intro">Age and playing level help us protect recovery while still targeting meaningful development.</p>
            <label className="field-label">Age</label>
            <div className="age-stepper" role="group" aria-label="Age">
              <button type="button" onClick={() => changeAge(-1)} aria-label="Decrease age"><Icon name="minus" size={20}/></button>
              <div><strong>{profile.age}</strong><span>years old</span></div>
              <button type="button" onClick={() => changeAge(1)} aria-label="Increase age"><Icon name="plus" size={20}/></button>
            </div>
            <label className="field-label">Playing level</label>
            <div className="selection-stack">{LEVELS.map((level) => <SelectionCard key={level.id} selected={profile.level === level.id} onClick={() => setProfile((current) => ({ ...current, level: level.id }))} title={level.label} sub={level.sub} />)}</div>
            <label className="field-label">Dominant foot</label>
            <SegmentedOptions options={DOMINANT_FEET} value={profile.dominantFoot} onChange={(dominantFoot) => setProfile((current) => ({ ...current, dominantFoot }))} />
          </>
        )}

        {step === 1 && (
          <>
            <div className="section-kicker">POSITION & ROLE</div>
            <h2>Build around how you play.</h2>
            <p className="section-intro">Your role gives the coach more context than a position label alone.</p>
            <div className="position-grid">
              {POSITIONS.map((position, idx) => (
                <button type="button" key={position.id} className={`position-card ${profile.position === position.id ? "selected" : ""}`} onClick={() => setProfile((current) => ({ ...current, position: position.id, role: "", goals: [], primaryGoal: null, secondaryPosition: current.secondaryPosition === position.id ? null : current.secondaryPosition }))}>
                  <span className="position-number">{String(idx + 1).padStart(2, "0")}</span><Icon name="ball" size={25} /><strong>{position.label}</strong>{profile.position === position.id && <span className="position-tick"><Icon name="check" size={13} /></span>}
                </button>
              ))}
            </div>
            {profile.position && <>
              <label className="field-label">Your role <span className="optional-label">optional</span></label>
              <div className="role-chip-grid">{roles.map((role) => <button type="button" key={role} className={profile.role === role ? "selected" : ""} onClick={() => setProfile((current) => ({ ...current, role: current.role === role ? "" : role }))}>{role}</button>)}</div>
              <label className="field-label">Secondary position <span className="optional-label">optional</span></label>
              <div className="secondary-position-row">{POSITIONS.filter((item) => item.id !== profile.position).map((item) => <button type="button" key={item.id} className={profile.secondaryPosition === item.id ? "selected" : ""} onClick={() => setProfile((current) => ({ ...current, secondaryPosition: current.secondaryPosition === item.id ? null : item.id }))}>{item.label}</button>)}</div>
            </>}
          </>
        )}

        {step === 2 && (
          <>
            <div className="section-kicker">DEVELOPMENT GOALS</div>
            <h2>What changes your game most?</h2>
            <p className="section-intro">Choose up to three areas, then mark one as your top priority. That priority gets first weight in the plan.</p>
            <div className="goal-grid">
              {focusOptions.map((focus) => {
                const selected = profile.goals.includes(focus);
                const priority = profile.primaryGoal === focus;
                return (
                  <div key={focus} className={`goal-card goal-card-v3 ${selected ? "selected" : ""} ${priority ? "priority" : ""}`}>
                    <button type="button" className="goal-main" onClick={() => toggleGoal(focus)}>
                      <span className="goal-icon"><Icon name={focus === "hiz" ? "bolt" : focus === "bitiricilik" ? "trophy" : "target"} size={20} /></span>
                      <strong>{FOCUS_LABELS[focus] || focus}</strong>
                      <span className="goal-check">{selected && <Icon name="check" size={13} />}</span>
                    </button>
                    {selected && <button type="button" className={`priority-button ${priority ? "active" : ""}`} onClick={() => setProfile((current) => ({ ...current, primaryGoal: focus }))}><Icon name="star" size={13}/>{priority ? "Top priority" : "Make priority"}</button>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="section-kicker">YOUR FOOTBALL WEEK</div>
            <h2>Protect the important days.</h2>
            <p className="section-intro">Team training and match day always take priority. We place personal work around them instead of stacking load blindly.</p>
            <div className="schedule-block"><div className="schedule-heading"><span className="schedule-dot personal"/><div><strong>Available for personal training</strong><small>Choose every day you could realistically train</small></div></div><DaySelector selected={profile.availableDays} onToggle={toggleAvailableDay} disabled={profile.teamDays.concat(profile.matchDay ?? [])} /></div>
            <div className="schedule-block"><div className="schedule-heading"><span className="schedule-dot team"/><div><strong>Team training days</strong><small>Leave empty if you do not have team sessions</small></div></div><DaySelector selected={profile.teamDays} onToggle={toggleTeamDay} disabled={profile.availableDays.concat(profile.matchDay ?? [])} /></div>
            <div className="schedule-block"><div className="schedule-heading"><span className="schedule-dot match"/><div><strong>Match day</strong><small>Select one if you have a match this week</small></div></div><DaySelector single selected={profile.matchDay} onToggle={setMatchDay} disabled={profile.availableDays.concat(profile.teamDays)} /><button type="button" className={`no-match-button ${profile.matchDay === null ? "active" : ""}`} onClick={() => setProfile((current) => ({ ...current, matchDay: null }))}>No match this week</button></div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="section-kicker">YOUR TRAINING PLACES</div>
            <h2>Train where real life allows.</h2>
            <p className="section-intro">Choose every place you can genuinely use. Then tell us where each personal-training day usually happens so the plan never assumes a pitch you do not have.</p>
            <div className="location-grid">
              {TRAINING_LOCATIONS.map((item) => {
                const selected = (profile.trainingLocations || []).includes(item.id);
                return <button type="button" key={item.id} className={`location-card ${selected ? "selected" : ""}`} onClick={() => toggleTrainingLocation(item.id)}><span className="location-icon"><Icon name={item.icon || "map"} size={21}/></span><div><strong>{item.label}</strong><small>{item.sub}</small></div><i>{selected && <Icon name="check" size={12}/>}</i></button>;
              })}
            </div>
            {(profile.trainingLocations || []).length > 0 && profile.availableDays.length > 0 && <div className="day-location-section"><div className="field-label">Usual place by personal day</div><p className="micro-copy">You can change this later if weather or access changes.</p>{profile.availableDays.map((day) => <div className="day-location-row" key={day}><div><strong>{DAY_NAMES[day]}</strong><span>Personal training</span></div><div className="location-chip-row">{profile.trainingLocations.map((locationId) => { const location = TRAINING_LOCATIONS.find((item) => item.id === locationId); return <button type="button" key={locationId} className={profile.dayLocations?.[day] === locationId ? "selected" : ""} onClick={() => setDayLocation(day, locationId)}>{location?.label || locationId}</button>; })}</div></div>)}</div>}
          </>
        )}

        {step === 5 && (
          <>
            <div className="section-kicker">TRAINING SETUP</div>
            <h2>Choose your development pace.</h2>
            <p className="section-intro">The goal is more quality over time — not random extra fatigue.</p>
            <label className="field-label">Training commitment</label>
            <div className="selection-stack">{COMMITMENTS.map((item) => <SelectionCard key={item.id} selected={profile.commitment === item.id} onClick={() => setProfile((current) => ({ ...current, commitment: item.id }))} title={item.label} sub={item.sub} icon={item.id === "high" ? "bolt" : item.id === "committed" ? "target" : "heart"} />)}</div>
            <label className="field-label">Preferred main-session length</label>
            <SegmentedOptions options={SESSION_LENGTHS.map((minutes) => ({ id: minutes, label: `${minutes} min` }))} value={profile.sessionLength} onChange={(sessionLength) => setProfile((current) => ({ ...current, sessionLength }))} />
            <label className="field-label">Equipment</label>
            <div className="equipment-grid">{EQUIPMENT.map((item) => <button type="button" key={item.id} className={`equipment-card ${profile.equipment.includes(item.id) ? "selected" : ""}`} onClick={() => toggleEquipment(item.id)}><span><Icon name={item.id === "yok" ? "moon" : "ball"} size={22} /></span><strong>{item.label}</strong>{profile.equipment.includes(item.id) && <div className="equipment-check"><Icon name="check" size={12} /></div>}</button>)}</div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="section-kicker">READINESS & HABIT</div>
            <h2>Finish the setup intelligently.</h2>
            <p className="section-intro">This is not a medical assessment. It simply helps the app avoid aggressive load when you are not training normally.</p>
            <label className="field-label">Current training status</label>
            <div className="selection-stack">{LIMITATIONS.map((item) => <SelectionCard key={item.id} selected={profile.limitation === item.id} onClick={() => setProfile((current) => ({ ...current, limitation: item.id }))} title={item.label} sub={item.sub} icon={item.id === "none" ? "check" : "heart"} />)}</div>

            <div className={`mastery-onboarding-card ${profile.ballMasteryEnabled ? "enabled" : ""}`}>
              <div className="mastery-onboarding-icon"><Icon name="ball" size={26}/></div>
              <div><span className="section-kicker">CORE TECHNICAL HABIT</span><h3>4× weekly Ball Mastery</h3><p>Up to 20 minutes of high-frequency touches at home or in a small space. The plan automatically reduces it around heavy team or match load.</p></div>
              <button type="button" className={`switch-control ${profile.ballMasteryEnabled ? "on" : ""}`} aria-label="Toggle Ball Mastery" onClick={() => setProfile((current) => ({ ...current, ballMasteryEnabled: !current.ballMasteryEnabled }))}><span/></button>
            </div>
            {!profile.equipment.includes("top") && profile.ballMasteryEnabled && <div className="safety-note"><Icon name="ball" size={18}/><span>Ball Mastery requires a ball. Add “Ball” to your equipment or the habit will be skipped.</span></div>}
            <div className="safety-note"><Icon name="shield" size={18}/><span>Sharp pain, worsening discomfort or altered movement is a reason to stop. The app does not replace a qualified coach or clinician.</span></div>
          </>
        )}

        <ErrorBanner>{error}</ErrorBanner>
      </section>
      <footer className="flow-footer"><Button className="button-block button-large" disabled={!canContinue()} loading={submitting} onClick={handleNext}>{step === steps.length - 1 ? (mode === "edit" ? "Save & Rebuild Plan" : "Generate My Plan") : "Continue"}</Button></footer>
    </main>
  );
}

function PlanLoading({ demo = false }) {
  const [progress, setProgress] = useState(6);
  useEffect(() => {
    let frame;
    const startedAt = performance.now();
    const animate = (now) => {
      const elapsed = now - startedAt;
      // Keep moving steadily while the API works, then wait near completion instead of visually freezing early.
      const next = Math.min(96, 5 + elapsed * 0.0105);
      setProgress(next);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const rounded = Math.round(progress);
  const buildRadius = 49;
  const buildCircumference = 2 * Math.PI * buildRadius;
  const buildOffset = buildCircumference * (1 - progress / 100);
  const message = rounded < 28 ? "Mapping your real football week" : rounded < 52 ? "Protecting team and match load" : rounded < 74 ? "Matching drills to your time and space" : "Balancing progression, quality and recovery";

  return (
    <main className="loading-screen loading-screen-v5">
      <Logo />
      <div className="plan-build-orbit" aria-label={`${rounded}% plan generated`}>
        <svg className="plan-build-svg" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="plan-build-track" cx="60" cy="60" r={buildRadius} />
          <circle className="plan-build-value" cx="60" cy="60" r={buildRadius} style={{ strokeDasharray: `${buildCircumference} ${buildCircumference}`, strokeDashoffset: buildOffset }} />
        </svg>
        <div className="plan-build-ring-inner"><strong>{rounded}%</strong><span>BUILDING PLAN</span></div>
      </div>

      <div className="loading-copy">
        <div className="eyebrow"><Icon name="spark" size={15} /> ADAPTIVE COACH</div>
        <h2>{demo ? "Building your demo week" : "Building your football week"}</h2>
        <p>{message}</p>
      </div>

      <div className="loading-status-v5">
        {[
          ["calendar", "Schedule", 22],
          ["map", "Setup", 46],
          ["ball", "Drills", 70],
          ["shield", "Recovery", 90],
        ].map(([icon, label, threshold]) => (
          <div key={label} className={rounded >= threshold ? "done" : rounded >= threshold - 22 ? "active" : ""}>
            <span><Icon name={rounded >= threshold ? "check" : icon} size={14}/></span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      <p className="loading-footnote">Only validated exercises. Match day stays protected.</p>
    </main>
  );
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.rest;
  return <span className={`type-badge type-${meta.tone}`}><Icon name={meta.icon} size={13} />{meta.label}</span>;
}

function TrainingTypeBadge({ exercise, compact = false }) {
  if (!exercise) return null;
  const type = exercise.trainingType || "technique";
  const meta = TRAINING_TYPES[type] || TRAINING_TYPES.technique;
  const icon = type === "game_realistic" ? "spark" : type === "physical" ? "bolt" : type === "recovery" ? "heart" : type === "activation" ? "refresh" : "target";
  return <span className={`training-type-badge mode-${type} ${compact ? "compact" : ""}`}><Icon name={icon} size={compact ? 11 : 12}/>{meta.short}</span>;
}

function SessionMix({ mix, intent, compact = false }) {
  if (!mix) return null;
  const entries = [
    ["technique", mix.technique || 0],
    ["game_realistic", mix.game_realistic || 0],
    ["physical", mix.physical || 0],
  ].filter(([, count]) => count > 0);
  const total = Math.max(1, entries.reduce((sum, [, count]) => sum + count, 0));
  return (
    <div className={`session-mix-card ${compact ? "compact" : ""}`}>
      <div className="session-mix-head"><span>SESSION DNA</span><strong>{intent || "Football Development"}</strong></div>
      <div className="session-mix-bars" aria-label={intent || "Session training mix"}>
        {entries.map(([type, count]) => <i key={type} className={`mix-${type}`} style={{ flexGrow: count, "--mix-width": `${(count / total) * 100}%` }}/>) }
      </div>
      <div className="session-mix-labels">{entries.map(([type, count]) => <span key={type}><b className={`dot-${type}`}/>{TRAINING_TYPES[type]?.label || type}<small>{count}</small></span>)}</div>
    </div>
  );
}

function DevelopmentJourney({ progression, position, compact = false }) {
  const level = Math.min(PROGRESSION_STAGES.length, Math.max(1, Number(progression?.level) || 1));
  const pathway = progression?.pathway?.length ? progression.pathway : POSITION_DEVELOPMENT_PATHS[position] || [];
  const review = progression?.review;
  return (
    <section className={`development-journey-v7 development-journey-v71 ${compact ? "compact" : ""}`}>
      <div className="development-journey-head"><div><span>CURRENT DEVELOPMENT</span><strong>{progression?.label || PROGRESSION_STAGES[level - 1].label}</strong></div><small>Stage {level}/{PROGRESSION_STAGES.length}</small></div>
      <div className="development-stage-track-v7">{PROGRESSION_STAGES.map((stage, index) => <div key={stage.id} className={`${index + 1 < level ? "done" : ""} ${index + 1 === level ? "current" : ""}`}><i>{index + 1 < level ? <Icon name="check" size={10}/> : index + 1}</i><span>{stage.label}</span></div>)}</div>
      {!compact && pathway.length > 0 && <div className="position-path-v7 focus-path-v71"><span>{progression?.pathwayFocus ? "PRIMARY SKILL PATH" : "POSITION PATH"}</span><div>{pathway.map((skill, index) => <b key={`${skill}-${index}`} className={index === Math.min(pathway.length - 1, level - 1) ? "current" : index < level - 1 ? "done" : ""}>{skill}</b>)}</div></div>}
      {!compact && <p>{progression?.cue || PROGRESSION_STAGES[level - 1].cue}</p>}
      {review && <div className={`progression-review-v71 review-${review.status || "build"}`}><Icon name={review.status === "hold" ? "shield" : review.status === "progressed" ? "spark" : "target"} size={15}/><div><strong>{review.label}</strong>{!compact && <span>{review.message}</span>}</div></div>}
    </section>
  );
}

function WorkoutBlocksPreview({ blocks = [], compact = false }) {
  if (!blocks.length) return null;
  return <div className={`workout-blocks-preview-v7 ${compact ? "compact" : ""}`}>{blocks.map((block, index) => { const meta = BLOCK_META[block.id] || block; return <div key={`${block.id}-${index}`} className={`block-${block.id}`}><span>{String(index + 1).padStart(2,"0")}</span><i/><div><strong>{meta.label || block.label}</strong><small>{block.exerciseIds?.length || 0} block{(block.exerciseIds?.length || 0) === 1 ? "" : "s"} · {meta.purpose || block.purpose}</small></div></div>; })}</div>;
}

function WeekLoadBars({ plan, today }) {
  if (!plan?.days?.length) return null;
  const values = plan.days.map((day) => {
    if (day.type === "match") return 60;
    if (day.type === "team") return 46;
    if (day.type === "personal") return Math.max(18, Math.min(55, day.estimatedMinutes || 35));
    if (day.type === "recovery") return 14;
    return day.ballMastery ? Math.min(20, day.ballMastery.minutes || 10) : 6;
  });
  const max = Math.max(60, ...values);
  return (
    <div className="week-load-bars-v6" aria-label="Planned weekly football load">
      {plan.days.map((day, index) => <div key={day.day} className={`${day.day === today ? "today" : ""} type-${day.type}`}><span><i style={{ height: `${Math.max(10, (values[index] / max) * 100)}%` }}/></span><small>{DAY_SHORT[day.day].slice(0,1)}</small></div>)}
    </div>
  );
}

function Ring({ percent, value, label }) {
  const pct = Math.min(100, Math.max(0, percent || 0));
  return <div className="progress-ring" style={{ "--progress": `${pct * 3.6}deg` }}><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function TimerRing({ ratio, value, label, rest = false }) {
  const safeRatio = Math.min(1, Math.max(0, ratio || 0));
  return (
    <div className={`timer-ring-v5 ${rest ? "rest" : ""}`} aria-label={`${value} remaining`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="timer-track-v5" cx="80" cy="80" r="68" />
        <circle className="timer-value-v5" cx="80" cy="80" r="68" pathLength="100" style={{ strokeDashoffset: 100 - safeRatio * 100 }} />
      </svg>
      <div><strong>{value}</strong><span>{label}</span></div>
      <i />
    </div>
  );
}

function ExerciseMedia({ exercise, compact = false }) {
  if (!exercise?.videoSrc && !exercise?.posterSrc) return null;
  return (
    <div className={`exercise-media ${compact ? "compact" : ""}`}>
      {exercise.videoSrc ? (
        <video
          src={exercise.videoSrc}
          poster={exercise.posterSrc || undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={`${exercise.name} demonstration`}
        />
      ) : (
        <img src={exercise.posterSrc} alt={`${exercise.name} demonstration`} loading="lazy" />
      )}
      <span><Icon name="play" size={12}/> DEMO</span>
    </div>
  );
}

function TodayCard({ day, onStart, onAdapt, completedToday, profile, readiness = "normal", checkIn, startLoading = false }) {
  if (!day) return <div className="today-card empty-state"><Icon name="calendar" size={26}/><strong>Today’s plan is missing</strong><span>Rebuild your plan from Profile.</span></div>;
  const meta = TYPE_META[day.type] || TYPE_META.rest;
  const exercises = (day.exerciseIds || []).map(exerciseById).filter(Boolean);
  const location = TRAINING_LOCATIONS.find((item) => item.id === day.trainingLocation);
  const primaryFocus = exercises[0]?.focus ? FOCUS_LABELS[exercises[0].focus] || exercises[0].focus : FOCUS_LABELS[profile?.primaryGoal] || "Development";

  if (day.type !== "personal") {
    return (
      <section className={`today-card today-card-v5 today-${meta.tone}`}>
        <div className="today-card-v5-top"><div><span className="section-kicker">TODAY</span><TypeBadge type={day.type}/></div><span className="today-state-icon"><Icon name={meta.icon} size={25}/></span></div>
        <h2>{day.title || meta.label}</h2>
        <p>{day.coachNote}</p>
        <div className="today-nonpersonal-note"><Icon name="shield" size={15}/><span>This is already a meaningful football load. Extra work stays intentionally limited.</span></div>
      </section>
    );
  }

  return (
    <section className={`today-card today-card-v5 today-personal-v5 ${completedToday ? "completed" : ""}`}>
      <div className="today-card-v5-top">
        <div><span className="section-kicker">TODAY’S MAIN SESSION</span><TypeBadge type="personal"/></div>
        <span className={`readiness-chip readiness-${readiness}`}><i/>{readiness}</span>
      </div>

      <h2>{completedToday ? "Main session complete." : day.title || "Personal Development"}</h2>
      {completedToday ? (
        <p>Good work. Recovery and your next quality session matter now.</p>
      ) : (
        <div className="today-coach-logic"><Icon name="spark" size={15}/><div><small>WHY THIS SESSION</small><span>{day.coachNote}</span></div></div>
      )}

      <div className="today-fact-grid">
        <div><Icon name="clock" size={17}/><span><small>DURATION</small><strong>{day.estimatedMinutes || 35} min</strong></span></div>
        <div><Icon name="map" size={17}/><span><small>PLACE</small><strong>{location?.label || "Flexible"}</strong></span></div>
        <div><Icon name="target" size={17}/><span><small>FOCUS</small><strong>{primaryFocus}</strong></span></div>
      </div>

      {!completedToday && <SessionMix mix={day.trainingMix} intent={day.sessionIntent} compact />}
      {!completedToday && day.progression && <div className="today-development-v71"><div><span>CURRENT CONSTRAINT</span><strong>{day.progression.label}</strong></div><div><span>COACH REVIEW</span><strong>{day.progression.review?.label || "Build another quality exposure"}</strong></div></div>}

      {!completedToday && checkIn && (checkIn.timeAvailable < (day.estimatedMinutes || 35) || readiness === "tired") && (
        <div className="checkin-adjustment-note"><Icon name="spark" size={15}/><span>{readiness === "tired" ? "Your check-in suggests a lighter session today." : `You have ${checkIn.timeAvailable} min available, so Coach will shorten today automatically.`}</span></div>
      )}

      {!completedToday && (
        <div className="today-actions-v5">
          <Button className="button-block button-large today-start-v5" icon="play" loading={startLoading} onClick={onStart}>{checkIn && (checkIn.timeAvailable < (day.estimatedMinutes || 35) || readiness === "tired") ? "Start Adjusted Session" : "Start Session"}</Button>
          <button className="adapt-button-v5" type="button" onClick={onAdapt}><Icon name="refresh" size={17}/><span><strong>Adapt Session</strong><small>Weather, time, energy or setup changed?</small></span><Icon name="arrow" size={17}/></button>
        </div>
      )}

      {completedToday && <div className="session-complete-inline"><Icon name="check" size={18}/><span>Logged to Progress</span></div>}

      {!completedToday && exercises.length > 0 && (
        <details className="today-drill-disclosure">
          <summary><span>Preview session</span><small>{day.workoutBlocks?.length || exercises.length + MORNING_ROUTINE.length + RESET_ROUTINE.length} structured blocks</small><Icon name="arrow" size={16}/></summary>
          <div>{exercises.slice(0,4).map((exercise, index) => <span key={exercise.id}><i>{String(index + 1).padStart(2,"0")}</i><b>{exercise.name}</b><em>{exercise.gameMoment}</em><TrainingTypeBadge exercise={exercise} compact/><small>{formatDuration(day.exerciseDurations?.[exercise.id] || exercise.duration)}</small></span>)}</div>
        </details>
      )}
    </section>
  );
}

function BallMasteryCard({ mastery, completed, onStart, compact = false }) {
  if (!mastery) return null;
  return (
    <section className={`ball-mastery-card ${compact ? "compact" : ""} ${completed ? "completed" : ""}`}>
      <div className="mastery-card-icon"><Icon name="ball" size={24}/><span>{mastery.minutes}</span></div>
      <div className="mastery-card-copy"><span className="section-kicker">TECHNICAL HABIT</span><h3>{mastery.title}</h3><p>{mastery.minutes} min · {mastery.exerciseIds.length} touch blocks · {mastery.intensity === "light" ? "reduced load" : "quality volume"}</p></div>
      <button className="mastery-play" disabled={completed} onClick={onStart} aria-label={completed ? "Ball Mastery complete" : "Start Ball Mastery"}><Icon name={completed ? "check" : "play"} size={18}/></button>
    </section>
  );
}

function HomeScreen({ profile, plan, sessions, onStartWorkout, onOpenPlan, checkIn, onCheckInChange, onAdapt, startLoading }) {
  const today = todayIndex();
  const todayPlan = plan.days.find((day) => day.day === today);
  const weekSessions = sessionsThisWeek(sessions);
  const weekMain = mainSessions(weekSessions);
  const weekMastery = masterySessions(weekSessions);
  const weeklyTarget = Math.max(1, plan.days.filter((day) => day.type === "personal").length);
  const weeklyUniqueDone = new Set(weekMain.map((session) => session.day)).size;
  const completedToday = weekMain.some((session) => session.day === today);
  const masteryCompleted = weekMastery.some((session) => session.day === today);
  const position = POSITIONS.find((item) => item.id === profile.position)?.label || "Player";
  const priority = FOCUS_LABELS[profile.primaryGoal] || "your game";
  const nextPersonal = plan.days.map((day) => ({ ...day, offset: (day.day - today + 7) % 7 })).filter((day) => day.type === "personal" && day.offset > 0).sort((a, b) => a.offset - b.offset)[0];
  const location = TRAINING_LOCATIONS.find((item) => item.id === todayPlan?.trainingLocation);
  const readiness = readinessFromCheckIn(checkIn, profile.sessionLength);
  const readinessMessage = readiness === "fresh" ? "High energy and low soreness — quality can stay high." : readiness === "tired" ? "Low energy or high soreness — today should be lighter." : "Balanced readiness — follow the planned load.";

  return (
    <div className="screen-content home-screen home-screen-v5">
      <header className="app-topbar">
        <Logo compact />
        <div className="profile-pill"><span>{position.slice(0,2).toUpperCase()}</span><div><strong>{position}</strong><small>{LEVELS.find((item) => item.id === profile.level)?.label}</small></div></div>
      </header>

      {sessions.length === 0 ? (
        <section className="home-command-hero">
          <div className="home-command-photo"/>
          <div className="home-command-shade"/>
          <div className="home-command-copy">
            <span className="home-day-label"><Icon name="bolt" size={13}/>{DAY_NAMES[today].toUpperCase()}</span>
            <h1>Train for<br/><em>{priority}.</em></h1>
            <p>{plan.progression?.label || "Foundation"} phase · Level {plan.progression?.level || 1}</p>
          </div>
          <div className="home-command-badge"><Icon name="spark" size={14}/><span>ADAPTIVE<br/>COACH</span></div>
        </section>
      ) : (
        <section className="returning-home-head-v72">
          <div><span><Icon name="bolt" size={13}/>{DAY_NAMES[today].toUpperCase()} · COACH READY</span><strong>{priority} · {plan.progression?.label || "Foundation"}</strong></div>
          <span className="returning-coach-status-v72"><i/>Adaptive</span>
        </section>
      )}

      <section className="today-readiness-v5 daily-checkin-v52">
        <div className="today-readiness-head">
          <div><span className="section-kicker">DAILY CHECK-IN</span><strong>Match the plan to your body and day.</strong></div>
          <span>{readinessMessage}</span>
        </div>
        <div className="checkin-row-v52">
          <div className="checkin-row-head"><span><Icon name="bolt" size={14}/>Energy</span><strong>{checkIn.energy === "high" ? "High" : checkIn.energy === "low" ? "Low" : "Okay"}</strong></div>
          <div className="checkin-options-v52">{[{id:"low",label:"Low"},{id:"normal",label:"Okay"},{id:"high",label:"High"}].map((item) => <button type="button" key={item.id} className={checkIn.energy === item.id ? "selected" : ""} onClick={() => onCheckInChange({ energy:item.id })}>{item.label}</button>)}</div>
        </div>
        <div className="checkin-row-v52">
          <div className="checkin-row-head"><span><Icon name="heart" size={14}/>Soreness</span><strong>{checkIn.soreness === "high" ? "High" : checkIn.soreness === "some" ? "Some" : "Low"}</strong></div>
          <div className="checkin-options-v52">{[{id:"low",label:"Low"},{id:"some",label:"Some"},{id:"high",label:"High"}].map((item) => <button type="button" key={item.id} className={checkIn.soreness === item.id ? "selected" : ""} onClick={() => onCheckInChange({ soreness:item.id })}>{item.label}</button>)}</div>
        </div>
        <div className="checkin-row-v52">
          <div className="checkin-row-head"><span><Icon name="clock" size={14}/>Time available</span><strong>{checkIn.timeAvailable} min</strong></div>
          <div className="checkin-options-v52 time">{[20,30,45,60].map((value) => <button type="button" key={value} className={checkIn.timeAvailable === value ? "selected" : ""} onClick={() => onCheckInChange({ timeAvailable:value })}>{value}</button>)}</div>
        </div>
      </section>

      <TodayCard day={todayPlan} profile={profile} readiness={readiness} checkIn={checkIn} startLoading={startLoading} onStart={() => onStartWorkout("main")} onAdapt={onAdapt} completedToday={completedToday} />

      <DevelopmentJourney progression={plan.progression} position={profile.position} compact />

      <BallMasteryCard mastery={todayPlan?.ballMastery} completed={masteryCompleted} onStart={() => onStartWorkout("ball_mastery")} />

      <section className="coach-brief-v5">
        <div className="coach-brief-v5-icon"><Icon name={plan.source === "openai" ? "spark" : "shield"} size={18}/></div>
        <div>
          <span>COACH BRIEF</span>
          <strong>{todayPlan?.type === "personal" ? `${location?.label || "Your setup"} · ${todayPlan?.estimatedMinutes || 35} min` : todayPlan?.title || "Protect today’s load"}</strong>
          <p>{todayPlan?.type === "personal" ? (plan.coachAdjustment || `${todayPlan.sessionIntent || "Development session"}: clean mechanics first, then transfer them into football actions that fit your ${plan.progression?.label?.toLowerCase() || "development"} stage.`) : todayPlan?.coachNote}</p>
        </div>
      </section>

      <section className="week-snapshot-v5">
        <div className="week-snapshot-head">
          <div><span>THIS WEEK</span><strong>{weeklyUniqueDone}/{weeklyTarget} main sessions</strong></div>
          <button type="button" onClick={onOpenPlan}>Open plan <Icon name="arrow" size={14}/></button>
        </div>
        <div className="week-snapshot-track"><span style={{ width: `${Math.min(100, (weeklyUniqueDone / weeklyTarget) * 100)}%` }}/></div>
        <WeekLoadBars plan={plan} today={today} />
        <div className="week-snapshot-meta"><span><Icon name="ball" size={13}/>{weekMastery.length}/{plan.masteryTarget || 0} mastery</span><span><Icon name="calendar" size={13}/>Next: {nextPersonal ? DAY_NAMES[nextPersonal.day] : "Recovery"}</span></div>
      </section>
    </div>
  );
}

function WeeklyPlanScreen({ plan, profile, sessions, onMoveSession }) {
  const today = todayIndex();
  const [selectedDay, setSelectedDay] = useState(today);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveError, setMoveError] = useState("");
  const day = plan.days.find((item) => item.day === selectedDay) || plan.days[0];
  const exercises = (day.exerciseIds || []).map(exerciseById).filter(Boolean);
  const meta = TYPE_META[day.type] || TYPE_META.rest;
  const location = TRAINING_LOCATIONS.find((item) => item.id === day.trainingLocation);
  const totalWork = day.type === "personal" ? `${day.estimatedMinutes || 35} min` : day.type === "team" ? "Team session" : day.type === "match" ? "Match day" : day.type === "recovery" ? "Low load" : "Off";
  const completedDays = new Set(mainSessions(sessionsThisWeek(sessions)).map((session) => session.day));
  const moveTargets = day.type === "personal" && !completedDays.has(day.day) ? possibleMoveTargets(plan, profile, day.day) : [];

  const handleMove = (targetDay) => {
    setMoveError("");
    try {
      onMoveSession(day.day, targetDay);
      setSelectedDay(targetDay);
      setMoveOpen(false);
    } catch (error) {
      setMoveError(error.message || "This session could not be moved safely.");
    }
  };

  return (
    <div className="screen-content plan-screen plan-screen-v5 plan-screen-v71">
      <header className="section-header plan-header-v5">
        <div><span className="section-kicker">THIS WEEK</span><h1>Your Plan</h1><p>Seven days. One clear job each day.</p></div>
        <span className={`source-pill ${plan.source === "openai" ? "ai" : "safe"}`}><Icon name={plan.source === "openai" ? "spark" : "shield"} size={13}/>{plan.source === "openai" ? "AI built" : "Safe plan"}</span>
      </header>

      <div className="week-rail-v5" aria-label="Select a day">
        {plan.days.map((item) => {
          const itemMeta = TYPE_META[item.type] || TYPE_META.rest;
          return (
            <button key={item.day} className={`${selectedDay === item.day ? "selected" : ""} ${item.day === today ? "today" : ""}`} onClick={() => setSelectedDay(item.day)}>
              <span>{DAY_SHORT[item.day].slice(0,2)}</span>
              <i className={`week-dot-v5 type-${itemMeta.tone}`}/>
              <small>{item.day === today ? "Today" : itemMeta.label}</small>
              {item.ballMastery && <b className="mastery-pin"/>}
              {item.movedFromDay !== undefined && <b className="move-pin" title="Moved session"/>}
            </button>
          );
        })}
      </div>

      <section className={`plan-focus-v5 focus-${meta.tone}`}>
        <div className="plan-focus-v5-top">
          <div><span>{DAY_NAMES[day.day].toUpperCase()}{day.day === today ? " · TODAY" : ""}</span><TypeBadge type={day.type}/></div>
          <span className="plan-focus-v5-icon"><Icon name={meta.icon} size={25}/></span>
        </div>
        {day.movedFromDay !== undefined && <div className="moved-session-banner-v71"><Icon name="calendar" size={14}/><span>Moved from {DAY_NAMES[day.movedFromDay]} for this week only</span></div>}
        <h2>{day.title || meta.label}</h2>
        <p>{day.coachNote}</p>

        <div className="plan-facts-v5">
          <div><Icon name="clock" size={16}/><span><small>LOAD</small><strong>{totalWork}</strong></span></div>
          <div><Icon name="map" size={16}/><span><small>PLACE</small><strong>{location?.label || (day.type === "team" ? "Team venue" : day.type === "match" ? "Match venue" : "Flexible")}</strong></span></div>
          {day.ballMastery && <div><Icon name="ball" size={16}/><span><small>MASTERY</small><strong>{day.ballMastery.minutes} min</strong></span></div>}
        </div>

        {day.type === "personal" && <SessionMix mix={day.trainingMix} intent={day.sessionIntent} compact />}
        {day.type === "personal" && <WorkoutBlocksPreview blocks={day.workoutBlocks || []} compact />}
        {day.type === "personal" && day.progression?.review && <div className="plan-progress-review-v71"><Icon name="target" size={15}/><span><small>PROGRESSION REVIEW</small><strong>{day.progression.review.label}</strong></span></div>}
        <div className="plan-rationale-v5"><Icon name="spark" size={16}/><span>{day.type === "personal" ? `Placed here to fit your weekly load and ${location?.label?.toLowerCase() || "available setup"}. The session progresses from repeatable quality toward game transfer.` : day.type === "match" ? "Match day is protected as the main performance load." : day.type === "team" ? "Team training already provides the main football load." : "This lower-load day protects the quality of your next hard session."}</span></div>
        {moveTargets.length > 0 && <button className="move-session-button-v71" type="button" onClick={() => setMoveOpen(true)}><Icon name="calendar" size={16}/><span><strong>Move this session</strong><small>Reschedule inside this week without touching team or match days.</small></span><Icon name="arrow" size={16}/></button>}
      </section>

      {day.type === "personal" && (
        <details className="session-disclosure session-disclosure-v5">
          <summary><span><Icon name="bolt" size={18}/><div><strong>Session preview</strong><small>{MORNING_ROUTINE.length + exercises.length + RESET_ROUTINE.length} blocks</small></div></span><Icon name="arrow" size={18}/></summary>
          <div className="session-disclosure-body">
            {MORNING_ROUTINE.map((exercise, index) => <div className="plan-exercise-row warmup" key={exercise.id}><span className="exercise-index">{String(index + 1).padStart(2,"0")}</span><div><strong>{exercise.name}</strong><small>Warm-up · {formatDuration(exercise.duration)}</small></div></div>)}
            {exercises.map((exercise, index) => { const exerciseProgression = day.exerciseProgressions?.[exercise.id]; return <div className="plan-exercise-row plan-exercise-row-v6" key={exercise.id}><span className="exercise-index">{String(index + 1 + MORNING_ROUTINE.length).padStart(2,"0")}</span><div><div className="exercise-row-title"><strong>{exercise.name}</strong><TrainingTypeBadge exercise={exercise} compact/></div><small>{FOCUS_LABELS[exercise.focus] || exercise.focus} · {exercise.gameMoment} · {formatDuration(day.exerciseDurations?.[exercise.id] || exercise.duration)}</small>{exerciseProgression && <em className="exercise-progression-inline-v71">{exerciseProgression.label}: {exerciseProgression.cue}</em>}</div></div>; })}
            {RESET_ROUTINE.map((exercise, index) => <div className="plan-exercise-row reset" key={exercise.id}><span className="exercise-index">{String(MORNING_ROUTINE.length + exercises.length + index + 1).padStart(2,"0")}</span><div><strong>{exercise.name}</strong><small>Reset · {formatDuration(exercise.duration)}</small></div></div>)}
          </div>
        </details>
      )}

      {day.ballMastery && <section className="week-mastery-mini"><div className="mastery-card-icon"><Icon name="ball" size={20}/></div><div><span>BALL MASTERY</span><strong>{day.ballMastery.minutes} min technical habit</strong><small>{day.ballMastery.intensity === "light" ? "Reduced around today’s football load" : "Low-load repetition that compounds over time"}</small></div></section>}
      {moveOpen && <SessionMoveSheet day={day} targets={moveTargets} error={moveError} onClose={() => { setMoveOpen(false); setMoveError(""); }} onMove={handleMove}/>} 
    </div>
  );
}

function SessionMoveSheet({ day, targets, error, onClose, onMove }) {
  return (
    <div className="adapt-overlay" role="dialog" aria-modal="true" aria-label="Move this week’s session">
      <div className="adapt-sheet session-move-sheet-v71">
        <div className="adapt-sheet-handle"/>
        <header className="adapt-sheet-header"><button className="icon-button" type="button" onClick={onClose}><Icon name="close"/></button><div><span>MOVE SESSION</span><strong>This week only</strong></div></header>
        <section className="adapt-step"><span className="section-kicker">PROTECT THE WEEK</span><h2>Choose an open training day.</h2><p>Team sessions, match day, recovery protection and training-space compatibility stay locked.</p>
          <div className="move-target-list-v71">{targets.map((target) => { const place = TRAINING_LOCATIONS.find((item) => item.id === target.location)?.label || "Available setup"; return <button type="button" key={target.day} onClick={() => onMove(target.day)}><span><small>{DAY_SHORT[target.day].toUpperCase()}</small><strong>{target.dayName}</strong></span><em>{place}</em><Icon name="arrow" size={17}/></button>; })}</div>
          {!targets.length && <div className="adapt-constraint-note"><Icon name="shield" size={16}/><span>No safe open day matches this session’s space and weekly load.</span></div>}
        </section>
        <ErrorBanner>{error}</ErrorBanner>
        <footer className="adapt-sheet-footer"><Button className="button-block" variant="secondary" onClick={onClose}>Keep Current Day</Button></footer>
      </div>
    </div>
  );
}

function ProgressScreen({ sessions, plan, profile }) {
  const weekSessions = sessionsThisWeek(sessions);
  const weekMain = mainSessions(weekSessions);
  const weekMastery = masterySessions(weekSessions);
  const mainTarget = plan.days.filter((day) => day.type === "personal").length;
  const masteryTarget = plan.masteryTarget || 0;
  const mainDone = new Set(weekMain.map((session) => session.day)).size;
  const masteryDone = new Set(weekMastery.map((session) => session.day)).size;
  const combinedTarget = Math.max(1, mainTarget + masteryTarget);
  const combinedDone = Math.min(combinedTarget, mainDone + masteryDone);
  const totalSeconds = sessions.reduce((sum, session) => sum + (Number(session.durationSeconds) || 0), 0);
  const weekStreak = weeklyConsistencyStreak(sessions);
  const focuses = focusStats(sessions);
  const maxFocus = Math.max(1, ...focuses.map((item) => item.count));
  const review = weeklyCoachReview(sessions, plan, profile);
  const exerciseHistory = Object.values(exerciseHistorySummary(sessions))
    .filter((item) => item.exposures > 0)
    .sort((a, b) => b.exposures - a.exposures || String(b.lastCompletedAt || "").localeCompare(String(a.lastCompletedAt || "")))
    .slice(0, 5);

  return (
    <div className="screen-content progress-screen progress-screen-v7 progress-screen-v71">
      <header className="section-header"><div><span className="section-kicker">DEVELOPMENT, NOT FAKE SCORES</span><h1>Progress</h1><p>Your path moves from completed work and real feedback.</p></div></header>

      <section className="weekly-review-v7 weekly-review-v71">
        <div className="weekly-review-top"><div><span>WEEKLY COACH REVIEW</span><strong>{review.headline}</strong></div><Icon name="spark" size={21}/></div>
        <p>{review.message}</p>
        <div className="weekly-review-metrics"><span><strong>{review.metrics.main}</strong><small>Main</small></span><span><strong>{review.metrics.mastery}</strong><small>Mastery</small></span><span><strong>{review.metrics.minutes}</strong><small>Minutes</small></span></div>
        <div className="next-priority-v71"><span>NEXT PRIORITY</span><strong>{review.nextPriority}</strong><small>{plan.progression?.review?.label || "Build another clean exposure"}</small></div>
      </section>

      <DevelopmentJourney progression={plan.progression} position={profile?.position} />

      <section className="progress-hero-card"><Ring percent={(combinedDone / combinedTarget) * 100} value={`${combinedDone}/${combinedTarget}`} label="this week" /><div><span>WEEKLY CONSISTENCY</span><h2>{combinedDone >= combinedTarget ? "Week complete" : `${combinedTarget - combinedDone} planned blocks left`}</h2><p>Only sessions you actually complete count here. Recovery days never break the streak.</p></div></section>
      <div className="stat-grid"><div className="stat-card"><span className="stat-icon"><Icon name="check"/></span><strong>{sessions.length}</strong><small>Completed</small></div><div className="stat-card"><span className="stat-icon"><Icon name="clock"/></span><strong>{totalSeconds >= 3600 ? `${(totalSeconds / 3600).toFixed(1)}h` : `${Math.round(totalSeconds / 60)}m`}</strong><small>Training time</small></div><div className="stat-card"><span className="stat-icon"><Icon name="flame"/></span><strong>{weekStreak}</strong><small>Active weeks</small></div></div>

      <section className="exercise-development-card-v71">
        <div className="list-heading"><div><strong>Drill progression</strong><span>Exercise-level history</span></div><span>{exerciseHistory.length ? `${exerciseHistory.length} shown` : ""}</span></div>
        {exerciseHistory.length === 0 ? <div className="empty-state compact"><Icon name="target" size={24}/><strong>No drill history yet</strong><span>Complete a coached session and each validated drill will start building its own progression history.</span></div> : exerciseHistory.map((item) => { const stage = PROGRESSION_STAGES[Math.min(PROGRESSION_STAGES.length - 1, Math.max(0, (item.latestStage || 1) - 1))]; const signal = item.latestFeedback?.quality ? item.latestFeedback.quality : "building"; return <div className="exercise-development-row-v71" key={item.id}><div><span className="exercise-development-icon-v71"><Icon name="target" size={14}/></span><div><strong>{item.name}</strong><small>{FOCUS_LABELS[item.focus] || item.focus} · {item.exposures} exposure{item.exposures === 1 ? "" : "s"}</small></div></div><span><small>{stage?.label || "Control"}</small><strong>{signal}</strong></span></div>; })}
      </section>

      <section className="mastery-progress-card"><div className="mastery-progress-head"><div className="mastery-card-icon"><Icon name="ball" size={22}/></div><div><span>BALL MASTERY HABIT</span><strong>{masteryDone}/{masteryTarget || 0} this week</strong></div></div><div className="mastery-week-dots">{DAY_SHORT.map((label, dayIndex) => { const scheduled = Boolean(plan.days.find((item) => item.day === dayIndex)?.ballMastery); const done = weekMastery.some((session) => session.day === dayIndex); return <div key={label} className={`${scheduled ? "scheduled" : ""} ${done ? "done" : ""}`}><i>{done && <Icon name="check" size={10}/>}</i><span>{label.slice(0,1)}</span></div>; })}</div></section>

      <section className="focus-card"><div className="list-heading"><strong>Training focus</strong><span>From completed work</span></div>{focuses.length === 0 ? <div className="empty-state compact"><Icon name="chart" size={24}/><strong>No data yet</strong><span>Finish your first session and your focus distribution will appear here.</span></div> : focuses.slice(0, 5).map((item) => <div className="focus-row" key={item.focus}><div><strong>{item.label}</strong><span>{item.count} blocks</span></div><div className="focus-track"><span style={{ width: `${(item.count / maxFocus) * 100}%` }}/></div></div>)}</section>

      <section className="history-card"><div className="list-heading"><strong>Recent training</strong><span>{sessions.length ? `${sessions.length} total` : ""}</span></div>{sessions.length === 0 ? <div className="empty-state compact"><Icon name="ball" size={24}/><strong>Your starting line</strong><span>Completed sessions and feedback will live here.</span></div> : sessions.slice(0, 8).map((session) => <div className="history-row history-row-v7" key={session.id || session.completedAt}><div className={`history-icon ${session.kind === "ball_mastery" ? "mastery" : ""}`}><Icon name={session.kind === "ball_mastery" ? "ball" : "check"} size={15}/></div><div><strong>{session.kind === "ball_mastery" ? "Ball Mastery" : DAY_NAMES[session.day] || "Training"}</strong><span>{new Date(session.completedAt || session.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{session.feedback?.quality ? ` · ${session.feedback.quality}` : ""}</span></div><span>{formatDuration(session.durationSeconds || 0)}</span></div>)}</section>
    </div>
  );
}

function ProfileScreen({ profile, plan, onEdit, onRegenerate, regenerating, error, onReset }) {
  const position = POSITIONS.find((item) => item.id === profile.position)?.label || "Player";
  const secondary = POSITIONS.find((item) => item.id === profile.secondaryPosition)?.label;
  const level = LEVELS.find((item) => item.id === profile.level)?.label || "Developing";
  const environment = TRAINING_ENVIRONMENTS.find((item) => item.id === profile.environment)?.label;
  const commitment = COMMITMENTS.find((item) => item.id === profile.commitment)?.label;
  const places = (profile.trainingLocations || []).map((id) => TRAINING_LOCATIONS.find((item) => item.id === id)?.label).filter(Boolean);
  const foot = DOMINANT_FEET.find((item) => item.id === profile.dominantFoot)?.label;

  return (
    <div className="screen-content profile-screen">
      <header className="section-header"><div><span className="section-kicker">PLAYER SETTINGS</span><h1>Profile</h1></div></header>
      <ErrorBanner>{error}</ErrorBanner>
      <section className="profile-hero"><div className="profile-avatar"><span>{position.slice(0,2).toUpperCase()}</span><i/></div><div><h2>{position}</h2><p>{profile.age} yrs · {level}{profile.role ? ` · ${profile.role}` : ""}</p>{profile.demo && <span className="demo-badge">DEMO PROFILE</span>}</div></section>
      <section className="profile-section"><div className="profile-section-head"><strong>Player identity</strong></div><div className="profile-detail-grid"><span><small>Dominant foot</small><strong>{foot}</strong></span><span><small>Secondary</small><strong>{secondary || "—"}</strong></span><span><small>Commitment</small><strong>{commitment}</strong></span><span><small>Main session</small><strong>{profile.sessionLength} min</strong></span></div></section>
      <section className="profile-section"><div className="profile-section-head"><strong>Development goals</strong></div><div className="tag-wrap">{profile.goals.map((goal) => <span className={`soft-tag ${profile.primaryGoal === goal ? "priority" : ""}`} key={goal}>{profile.primaryGoal === goal && <Icon name="star" size={11}/>} {FOCUS_LABELS[goal] || goal}</span>)}</div></section>
      <section className="profile-section"><div className="profile-section-head"><strong>Training setup</strong></div><p className="profile-inline-copy">{places.length ? places.join(" · ") : environment} · {profile.ballMasteryEnabled ? "Ball Mastery enabled" : "Ball Mastery off"}</p><div className="tag-wrap">{profile.equipment.map((id) => <span className="soft-tag" key={id}>{EQUIPMENT.find((item) => item.id === id)?.label || id}</span>)}</div>{profile.availableDays.length > 0 && <div className="profile-place-list">{profile.availableDays.map((day) => { const place = TRAINING_LOCATIONS.find((item) => item.id === profile.dayLocations?.[day])?.label || "Flexible"; return <span key={day}><small>{DAY_SHORT[day]}</small><strong>{place}</strong></span>; })}</div>}</section>
      <section className="profile-section"><div className="profile-section-head"><strong>Weekly availability</strong></div><div className="profile-schedule-row"><span className="schedule-dot personal"/><div><strong>Personal</strong><span>{profile.availableDays.length ? profile.availableDays.map((day) => DAY_SHORT[day]).join(" · ") : "None"}</span></div></div><div className="profile-schedule-row"><span className="schedule-dot team"/><div><strong>Team</strong><span>{profile.teamDays.length ? profile.teamDays.map((day) => DAY_SHORT[day]).join(" · ") : "None"}</span></div></div><div className="profile-schedule-row"><span className="schedule-dot match"/><div><strong>Match</strong><span>{profile.matchDay === null ? "None" : DAY_NAMES[profile.matchDay]}</span></div></div></section>
      <div className="profile-actions"><Button className="button-block" icon="edit" onClick={onEdit}>Edit Football Profile</Button><Button className="button-block" variant="secondary" icon="refresh" loading={regenerating} onClick={onRegenerate}>Regenerate Plan</Button></div>
      <div className="plan-meta-note"><Icon name={plan.source === "openai" ? "spark" : "shield"} size={16}/><span>{plan.source === "openai" ? "Your latest plan used AI personalisation inside the safe schedule rules." : "AI was unavailable, so the validated safe local plan is being used."}</span></div>
      <div className="beta-storage-note-v72"><Icon name="shield" size={16}/><div><strong>Beta data stays on this device</strong><span>Your profile, plan and training history are stored locally in this browser. Clearing browser data or changing devices will remove it until cloud accounts are added.</span></div></div>
      <button className="text-danger-button" onClick={onReset}>Reset all beta data on this device</button>
    </div>
  );
}

function WorkoutFlow({ initialState, planDay, onPersist, onAbandon, onComplete }) {
  const exercises = useMemo(() => initialState.exerciseIds.map((id) => {
    const base = exerciseById(id);
    if (!base) return null;
    return { ...base, duration: initialState.exerciseDurations?.[id] || base.duration };
  }).filter(Boolean), [initialState.exerciseIds, initialState.exerciseDurations]);
  const workoutBlocks = useMemo(() => {
    if (Array.isArray(initialState.workoutBlocks) && initialState.workoutBlocks.length) return initialState.workoutBlocks;
    const groups = [];
    for (const exercise of exercises) {
      const type = exercise.trainingType || "technique";
      const existing = groups.find((block) => block.id === type);
      if (existing) existing.exerciseIds.push(exercise.id);
      else groups.push({ ...(BLOCK_META[type] || BLOCK_META.technique), id: type, exerciseIds: [exercise.id] });
    }
    return groups;
  }, [initialState.workoutBlocks, exercises]);
  const [phase, setPhase] = useState(initialState.phase || "intro");
  const [index, setIndex] = useState(Math.min(initialState.index || 0, Math.max(0, exercises.length - 1)));
  const [remainingMs, setRemainingMs] = useState(() => (initialState.remainingMs ?? (initialState.remaining ?? exercises[0]?.duration ?? 0) * 1000));
  const [running, setRunning] = useState(() => Boolean(initialState.running && ["exercise", "rest"].includes(initialState.phase)));
  const [elapsedMs, setElapsedMs] = useState(() => (initialState.elapsedSeconds || 0) * 1000);
  const [completionFeedback, setCompletionFeedback] = useState({ difficulty: "", quality: "", energy: "", discomfort: "no" });
  const [restoreNotice, setRestoreNotice] = useState(() => Boolean(initialState.resumeNotice));
  useEffect(() => { if (running) setRestoreNotice(false); }, [running]);
  const restSeconds = initialState.restSeconds || (initialState.kind === "ball_mastery" ? 20 : 45);
  const current = exercises[index];
  const nextExercise = exercises[index + 1];
  const plannedSeconds = exercises.reduce((sum, exercise) => sum + exercise.duration, 0) + Math.max(0, exercises.length - 1) * restSeconds;
  const lastFrameRef = useRef(null);
  const currentBlock = workoutBlocks.find((block) => block.exerciseIds?.includes(current?.id)) || null;
  const nextBlock = workoutBlocks.find((block) => block.exerciseIds?.includes(nextExercise?.id)) || null;
  const currentBlockIndex = Math.max(0, workoutBlocks.findIndex((block) => block === currentBlock));
  const blockChangedNext = Boolean(currentBlock && nextBlock && currentBlock.id !== nextBlock.id);

  useEffect(() => {
    if (!running || !["exercise", "rest"].includes(phase)) {
      lastFrameRef.current = null;
      return undefined;
    }
    let frame;
    const tick = (now) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const delta = Math.max(0, now - lastFrameRef.current);
      lastFrameRef.current = now;
      setElapsedMs((value) => value + delta);
      setRemainingMs((value) => Math.max(0, value - delta));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running, phase]);

  useEffect(() => {
    if (remainingMs > 8 || !["exercise", "rest"].includes(phase)) return;
    if (phase === "exercise") {
      if (index >= exercises.length - 1) {
        setPhase("complete");
        setRunning(false);
      } else {
        setPhase("rest");
        setRemainingMs(restSeconds * 1000);
        setRunning(true);
      }
    } else {
      const nextIndex = Math.min(index + 1, exercises.length - 1);
      setIndex(nextIndex);
      setPhase("exercise");
      setRemainingMs((exercises[nextIndex]?.duration || 0) * 1000);
      setRunning(true);
    }
  }, [remainingMs, phase, index, exercises, restSeconds]);

  const persistRemaining = Math.ceil(remainingMs / 1000);
  const persistElapsed = Math.floor(elapsedMs / 1000);
  const persistenceSnapshotRef = useRef(null);
  persistenceSnapshotRef.current = { phase, index, remaining: persistRemaining, remainingMs: Math.max(0, Math.round(remainingMs)), elapsedSeconds: persistElapsed, running, resumeNotice: false };
  useEffect(() => { onPersist(persistenceSnapshotRef.current); }, [phase, index, persistRemaining, persistElapsed, running, onPersist]);
  useEffect(() => {
    const persistNow = () => { if (persistenceSnapshotRef.current) onPersist(persistenceSnapshotRef.current); };
    const onVisibility = () => { if (document.visibilityState === "hidden") persistNow(); };
    window.addEventListener("pagehide", persistNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pagehide", persistNow); document.removeEventListener("visibilitychange", onVisibility); };
  }, [onPersist]);

  const durationMs = Math.max(1, (phase === "rest" ? restSeconds : current?.duration || 1) * 1000);
  const segmentRatio = Math.min(1, Math.max(0, remainingMs / durationMs));
  const progress = exercises.length ? ((index + (phase === "rest" || phase === "complete" ? 1 : 1 - segmentRatio)) / exercises.length) * 100 : 0;
  const currentExerciseProgression = initialState.exerciseProgressions?.[current?.id] || null;
  const progressionCue = currentExerciseProgression?.cue || progressionConstraint(initialState.progression || { level: 1 }, current, initialState.dominantFoot || "right");

  const closeWorkout = () => {
    if (phase === "intro" || window.confirm("Leave this workout? It will not count as completed.")) onAbandon();
  };
  const start = () => { setPhase("exercise"); setRemainingMs((current?.duration || 0) * 1000); setRunning(true); };
  const advance = () => {
    if (phase === "rest") {
      const nextIndex = Math.min(index + 1, exercises.length - 1);
      setIndex(nextIndex); setPhase("exercise"); setRemainingMs((exercises[nextIndex]?.duration || 0) * 1000); setRunning(true); return;
    }
    if (index >= exercises.length - 1) { setPhase("complete"); setRunning(false); return; }
    setPhase("rest"); setRemainingMs(restSeconds * 1000); setRunning(true);
  };

  if (!exercises.length) return <main className="workout-shell"><div className="empty-state"><strong>No exercises found</strong><span>Update your profile and regenerate the plan.</span><Button onClick={onAbandon}>Go back</Button></div></main>;

  if (phase === "intro") {
    return (
      <main className={`workout-shell workout-intro workout-intro-v7 ${initialState.kind === "ball_mastery" ? "mastery-workout" : ""}`}>
        <header className="workout-header"><button className="icon-button" onClick={closeWorkout}><Icon name="close"/></button><Logo compact/><span/></header>
        <div className="workout-intro-hero"><div className="workout-photo-ribbon"><span><Icon name={initialState.kind === "ball_mastery" ? "ball" : initialState.kind === "adapted" ? "refresh" : "bolt"} size={14}/> {initialState.kind === "ball_mastery" ? "TECHNICAL HABIT" : initialState.kind === "adapted" ? "ADAPTED SESSION" : "COACHED SESSION"}</span></div>{initialState.kind === "ball_mastery" ? <span className="type-badge mastery-badge"><Icon name="ball" size={13}/>Ball Mastery</span> : <TypeBadge type="personal"/>}<h1>{initialState.title || planDay.title || "Today’s session"}</h1><p>{initialState.coachNote || planDay.coachNote}</p><div className="session-meta-row centered"><span><Icon name="clock" size={15}/>{formatDuration(plannedSeconds)}</span><span><Icon name="ball" size={15}/>{exercises.length} exercises</span>{initialState.kind === "adapted" && <span><Icon name="refresh" size={15}/>Adapted today</span>}</div>{initialState.trainingMix && <SessionMix mix={initialState.trainingMix} intent={initialState.sessionIntent} compact />}{initialState.progression && <div className="progression-cue-v7"><span>{initialState.progression.label?.toUpperCase()} STAGE</span><strong>{initialState.progression.cue}</strong></div>}{initialState.kind === "adapted" && initialState.rescheduleDay !== null && initialState.rescheduleDay !== undefined && <div className="reschedule-hint"><Icon name="calendar" size={15}/><span><strong>Original pitch focus protected</strong><small>{DAY_NAMES[initialState.rescheduleDay]} is the best available day to revisit the outdoor focus if access returns.</small></span></div>}</div>
        <WorkoutBlocksPreview blocks={workoutBlocks}/>
        <details className="workout-exercise-disclosure-v7"><summary>See every exercise <Icon name="arrow" size={16}/></summary><div className="workout-list workout-list-v6">{exercises.map((exercise, idx) => { const drillProgression = initialState.exerciseProgressions?.[exercise.id]; return <div key={`${exercise.id}-${idx}`}><span>{String(idx + 1).padStart(2,"0")}</span><div><div className="exercise-row-title"><strong>{exercise.name}</strong><TrainingTypeBadge exercise={exercise} compact/></div><small>{exercise.gameMoment} · {FOCUS_LABELS[exercise.focus] || exercise.focus} · {formatDuration(exercise.duration)}</small>{drillProgression && <em className="exercise-progression-inline-v71">{drillProgression.label}: {drillProgression.cue}</em>}</div></div>; })}</div></details>
        <div className="workout-bottom-actions"><Button className="button-block button-large" icon="play" onClick={start}>Start Session</Button><span>Stop if pain or sharp discomfort changes the way you move.</span></div>
      </main>
    );
  }

  if (phase === "complete") {
    const feedbackReady = completionFeedback.difficulty && completionFeedback.quality && completionFeedback.energy;
    return (
      <main className={`workout-shell complete-screen complete-screen-v7 ${initialState.kind === "ball_mastery" ? "mastery-complete" : ""}`}>
        <div className="complete-icon"><Icon name={initialState.kind === "ball_mastery" ? "ball" : "trophy"} size={42}/></div>
        <span className="section-kicker">SESSION COMPLETE</span>
        <h1>{initialState.kind === "ball_mastery" ? "Touches banked." : initialState.kind === "adapted" ? "Session rescued." : "Quality work done."}</h1>
        <p>Give Coach three quick signals. They will influence the next progression decision.</p>
        <div className="complete-stats"><div><strong>{exercises.length}</strong><span>Exercises</span></div><div><strong>{formatDuration(elapsedMs / 1000)}</strong><span>Actual time</span></div><div><strong>{Math.round(Math.min(100, (elapsedMs / 1000 / plannedSeconds) * 100))}%</strong><span>Time completed</span></div></div>
        <div className="feedback-loop-v7">
          <div className="feedback-row-v7"><div><span>DIFFICULTY</span><strong>Was the challenge right?</strong></div><div>{[{id:"easy",label:"Too easy"},{id:"right",label:"Right level"},{id:"hard",label:"Too hard"}].map((item) => <button key={item.id} className={completionFeedback.difficulty === item.id ? "selected" : ""} onClick={() => setCompletionFeedback((value) => ({...value,difficulty:item.id}))}>{item.label}</button>)}</div></div>
          <div className="feedback-row-v7"><div><span>QUALITY</span><strong>How clean did you feel?</strong></div><div>{[{id:"poor",label:"Poor"},{id:"okay",label:"Okay"},{id:"sharp",label:"Sharp"}].map((item) => <button key={item.id} className={completionFeedback.quality === item.id ? "selected" : ""} onClick={() => setCompletionFeedback((value) => ({...value,quality:item.id}))}>{item.label}</button>)}</div></div>
          <div className="feedback-row-v7"><div><span>ENERGY NOW</span><strong>What did the session cost?</strong></div><div>{[{id:"good",label:"Good"},{id:"tired",label:"Tired"},{id:"drained",label:"Drained"}].map((item) => <button key={item.id} className={completionFeedback.energy === item.id ? "selected" : ""} onClick={() => setCompletionFeedback((value) => ({...value,energy:item.id}))}>{item.label}</button>)}</div></div>
          <button className={`discomfort-check-v7 ${completionFeedback.discomfort === "yes" ? "active" : ""}`} onClick={() => setCompletionFeedback((value) => ({...value,discomfort:value.discomfort === "yes" ? "no" : "yes"}))}><span><Icon name="heart" size={17}/><b>Any pain or unusual discomfort?</b></span><strong>{completionFeedback.discomfort === "yes" ? "YES" : "NO"}</strong></button>
        </div>
        {feedbackReady && <div className="coach-adjustment-preview-v7"><Icon name="spark" size={17}/><div><span>COACH ADJUSTMENT</span><strong>{feedbackCoachAdjustment(completionFeedback)}</strong></div></div>}
        <Button className="button-block button-large" icon="check" disabled={!feedbackReady} onClick={() => onComplete(completionFeedback, { elapsedSeconds: elapsedMs / 1000, plannedSeconds, exercises })}>Save Session & Update Coach</Button>
      </main>
    );
  }

  if (phase === "rest") {
    return (
      <main className="workout-shell timer-screen rest-screen immersive-workout">
        <div className="workout-ambient rest-ambient"/>
        <header className="workout-header"><button className="icon-button" onClick={closeWorkout}><Icon name="close"/></button><span>{index + 1} / {exercises.length}</span><span className="workout-phase-label">REST</span></header>
        <div className="workout-progress-line"><span style={{ width: `${Math.min(100, progress)}%` }}/></div>
        <div className="timer-center"><span className="section-kicker">{blockChangedNext ? `${(currentBlock?.label || "Block").toUpperCase()} COMPLETE` : "RESET"}</span><TimerRing ratio={segmentRatio} value={formatTimer(remainingMs / 1000)} label={running ? "Breathe & reset" : "Paused"} rest />{blockChangedNext && <div className="block-transition-v7"><small>NEXT BLOCK</small><strong>{nextBlock?.label}</strong><span>{nextBlock?.purpose}</span></div>}<div className="next-up-card"><span>NEXT UP</span><h2>{nextExercise?.name || "Finish"}</h2><p>{nextExercise?.description || "Session complete."}</p></div></div>
        <div className="timer-actions"><Button className="button-block" variant="secondary" icon={running ? "pause" : "play"} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Resume"}</Button><Button className="button-block" onClick={advance}>Skip Rest</Button></div>
      </main>
    );
  }

  return (
    <main className={`workout-shell timer-screen immersive-workout ${initialState.kind === "ball_mastery" ? "mastery-timer" : ""}`}>
      <div className="workout-ambient"/>
      <header className="workout-header"><button className="icon-button" onClick={closeWorkout}><Icon name="close"/></button><span>{index + 1} / {exercises.length}</span><span className="workout-phase-label">{currentBlock?.short || currentBlock?.label || (initialState.kind === "ball_mastery" ? "MASTERY" : "WORK")}</span></header>
      <div className="workout-block-rail-v7">{workoutBlocks.map((block, idx) => <i key={`${block.id}-${idx}`} className={`${idx < currentBlockIndex ? "done" : ""} ${idx === currentBlockIndex ? "active" : ""}`}/>)}</div>
      <div className="workout-progress-line"><span style={{ width: `${Math.min(100, progress)}%` }}/></div>
      {restoreNotice && <div className="workout-restore-banner-v72"><Icon name="refresh" size={15}/><span><strong>Workout restored</strong> The timer was paused after a long break. Resume when you are ready.</span></div>}
      <div className="timer-center"><div className="workout-type-line"><TrainingTypeBadge exercise={current}/><span>{current?.gameMoment || FOCUS_LABELS[current?.focus] || "Football action"}</span></div>{currentExerciseProgression && <div className="live-progression-chip-v71"><Icon name="target" size={13}/><span>{currentExerciseProgression.label}</span></div>}<h1>{current?.name}</h1><p className="exercise-instruction">{current?.description}</p><ExerciseMedia exercise={current} compact /><TimerRing ratio={segmentRatio} value={formatTimer(remainingMs / 1000)} label={running ? (current?.trainingType === "game_realistic" ? "Game intent" : current?.trainingType === "physical" ? "Quality speed" : current?.trainingType === "recovery" ? "Reset" : "Stay clean") : "Paused"} /><div className="workout-tip workout-tip-v7"><Icon name={current?.trainingType === "game_realistic" ? "spark" : "target"} size={16}/><span>{initialState.kind === "ball_mastery" ? "Stay relaxed, use both feet and keep the touches sharp rather than rushed." : progressionCue}</span></div>{nextExercise && <div className="next-exercise-peek"><span>Next</span><strong>{nextExercise.name}</strong><TrainingTypeBadge exercise={nextExercise} compact/></div>}</div>
      <div className="timer-actions"><Button className="button-block" variant="secondary" icon={running ? "pause" : "play"} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Resume"}</Button><Button className="button-block" onClick={advance}>{index === exercises.length - 1 ? "Finish" : "Next"}</Button></div>
    </main>
  );
}

function AdaptSessionSheet({ profile, day, readiness = "normal", initialMinutes = 20, onClose, onStart }) {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState(day?.trainingLocation || profile.trainingLocations?.[0] || "home");
  const [minutes, setMinutes] = useState(() => [10,20,30,45,60].reduce((best, option) => Math.abs(option - Number(initialMinutes || 20)) < Math.abs(best - Number(initialMinutes || 20)) ? option : best, 20));
  const [currentReadiness, setCurrentReadiness] = useState(readiness || "normal");
  const [ballAvailable, setBallAvailable] = useState(profile.equipment.includes("top"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reasons = [
    { id: "weather", icon: "rain", title: "Bad weather", sub: "Outdoor session is not realistic now" },
    { id: "no_pitch", icon: "map", title: "No pitch access", sub: "The space I planned to use is unavailable" },
    { id: "short_time", icon: "clock", title: "Short on time", sub: "I still want useful work today" },
    { id: "tired", icon: "heart", title: "Feeling tired", sub: "Reduce the load without wasting the day" },
    { id: "equipment", icon: "ball", title: "Equipment changed", sub: "I do not have everything from the plan" },
  ];
  const availableLocations = useMemo(() => {
    const preferred = TRAINING_LOCATIONS.filter((item) => (profile.trainingLocations || []).includes(item.id));
    const source = preferred.length ? preferred : TRAINING_LOCATIONS;
    const allowed = (item) => {
      if (reason === "weather") return !OUTDOOR_LOCATION_IDS.has(item.id);
      if (reason === "no_pitch") return item.id !== "pitch";
      return true;
    };
    const preferredSafe = source.filter(allowed);
    return preferredSafe.length ? preferredSafe : TRAINING_LOCATIONS.filter(allowed);
  }, [profile.trainingLocations, reason]);

  useEffect(() => {
    if (availableLocations.length && !availableLocations.some((item) => item.id === location)) {
      setLocation(availableLocations[0].id);
    }
  }, [availableLocations, location]);

  const canNext = step === 0 ? Boolean(reason) : step === 1 ? Boolean(location) : true;

  const finish = async () => {
    setLoading(true); setError("");
    try { await onStart({ reason, location, minutes, readiness: currentReadiness, ballAvailable }); }
    catch (err) { setError(err.message || "Could not adapt this session."); setLoading(false); }
  };

  return (
    <div className="adapt-overlay" role="dialog" aria-modal="true" aria-label="Adapt today’s session">
      <div className="adapt-sheet">
        <div className="adapt-sheet-handle"/>
        <header className="adapt-sheet-header"><button className="icon-button" type="button" onClick={step ? () => setStep((value) => value - 1) : onClose}><Icon name={step ? "back" : "close"}/></button><div><span>ADAPT SESSION</span><strong>{step + 1} of 3</strong></div><div className="adapt-mini-progress"><span style={{ width: `${((step + 1) / 3) * 100}%` }}/></div></header>

        {step === 0 && <section className="adapt-step"><span className="section-kicker">REAL LIFE CHANGED</span><h2>What changed today?</h2><p>We’ll keep the useful part of the session and remove what no longer fits.</p><div className="adapt-choice-stack">{reasons.map((item) => <button type="button" key={item.id} className={reason === item.id ? "selected" : ""} onClick={() => setReason(item.id)}><i><Icon name={item.icon} size={20}/></i><div><strong>{item.title}</strong><small>{item.sub}</small></div><span>{reason === item.id && <Icon name="check" size={13}/>}</span></button>)}</div></section>}

        {step === 1 && <section className="adapt-step"><span className="section-kicker">AVAILABLE NOW</span><h2>Where can you train?</h2><p>Use the space you actually have right now, not the space the original plan assumed.</p>{reason === "weather" && <div className="adapt-constraint-note"><Icon name="rain" size={16}/><span>Outdoor options are hidden because you selected bad weather.</span></div>}{reason === "no_pitch" && <div className="adapt-constraint-note"><Icon name="map" size={16}/><span>The football pitch is hidden because it is unavailable today.</span></div>}<div className="adapt-location-grid">{(availableLocations.length ? availableLocations : TRAINING_LOCATIONS.slice(0, 3)).map((item) => <button type="button" key={item.id} className={location === item.id ? "selected" : ""} onClick={() => setLocation(item.id)}><Icon name={item.icon || "map"} size={21}/><strong>{item.label}</strong><small>{item.sub}</small></button>)}</div><div className="ball-now-card"><div><Icon name="ball" size={21}/><span><strong>Ball available now?</strong><small>Turn this off for a bodyweight alternative.</small></span></div><button type="button" className={`switch-control ${ballAvailable ? "on" : ""}`} onClick={() => setBallAvailable((value) => !value)}><span/></button></div></section>}

        {step === 2 && <section className="adapt-step"><span className="section-kicker">FINAL ADJUSTMENT</span><h2>Match the session to today.</h2><p>Time and readiness change the volume — not the quality standard.</p><label className="field-label">Time available</label><SegmentedOptions options={[10,20,30,45,60].map((value) => ({ id:value, label:`${value} min` }))} value={minutes} onChange={setMinutes}/><label className="field-label">How do you feel?</label><div className="readiness-options adapt-readiness">{[{id:"fresh",label:"Fresh"},{id:"normal",label:"Normal"},{id:"tired",label:"Tired"}].map((item) => <button type="button" key={item.id} className={currentReadiness === item.id ? "selected" : ""} onClick={() => setCurrentReadiness(item.id)}>{item.label}</button>)}</div><div className="adapt-summary"><Icon name="spark" size={18}/><div><strong>Your coach will rebuild only today</strong><span>The rest of the weekly plan stays intact. Lower readiness automatically caps volume.</span></div></div></section>}

        <ErrorBanner>{error}</ErrorBanner>
        <footer className="adapt-sheet-footer">{step < 2 ? <Button className="button-block button-large" disabled={!canNext} onClick={() => setStep((value) => value + 1)}>Continue</Button> : <Button className="button-block button-large" icon="refresh" loading={loading} onClick={finish}>Build Adapted Session</Button>}</footer>
      </div>
    </div>
  );
}

function BottomNav({ tab, onChange, onTrain, trainAvailable }) {
  const items = [
    { id: "home", label: "Home", icon: "home" },
    { id: "plan", label: "Plan", icon: "calendar" },
    { id: "train", label: "Train", icon: "play", special: true },
    { id: "progress", label: "Progress", icon: "chart" },
    { id: "profile", label: "Profile", icon: "user" },
  ];
  return <nav className="bottom-nav bottom-nav-v3" aria-label="Main navigation">{items.map((item) => item.special ? <button key={item.id} className="train-nav-button" onClick={onTrain} aria-label={trainAvailable ? "Start today’s training" : "Open today"}><span><Icon name="play" size={20}/></span><small>{item.label}</small></button> : <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onChange(item.id)}><Icon name={item.icon} size={20}/><span>{item.label}</span></button>)}</nav>;
}

async function requestJson(url, options = {}, timeoutMs = 45000) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("You’re offline. Your saved training remains available; reconnect to update Coach.");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Coach took too long to respond. Your saved training is unchanged — try again in a moment.");
    throw new Error("Coach could not be reached. Your saved training is unchanged — check your connection and try again.");
  } finally {
    window.clearTimeout(timeout);
  }
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    if (response.status === 429) throw new Error("Coach is busy right now. Your saved training is unchanged — try again in a minute.");
    throw new Error(body?.error || "Coach could not complete that update right now.");
  }
  return body;
}

async function requestPlan(profile, sessions = [], weekOverrides = {}) {
  const payload = { ...profile, historySummary: historySummary(sessions) };
  const body = await requestJson("/api/generate-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, 45000);
  if (!body || !Array.isArray(body.days) || body.days.length !== 7) throw new Error("Coach returned an invalid week. Your previous plan is unchanged.");
  return applyWeekOverrides(body, profile, weekOverrides);
}

async function requestAdaptedSession(profile, day, options, sessions = []) {
  const profileWithHistory = { ...profile, historySummary: historySummary(sessions) };
  const body = await requestJson("/api/adapt-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: profileWithHistory, day, options }) }, 20000);
  if (!body || !Array.isArray(body.exerciseIds) || !body.exerciseIds.length) throw new Error("No safe adapted session could be built for this setup.");
  return body;
}

export default function App() {
  const [profile, setProfile] = useState(() => normalizeClientProfile(loadLS(LS.profile, null)));
  const [plan, setPlan] = useState(() => loadLS(LS.plan, null));
  const [sessions, setSessions] = useState(() => loadLS(LS.sessions, []));
  const [activeWorkout, setActiveWorkout] = useState(() => rehydrateActiveWorkout(loadLS(LS.activeWorkout, null)));
  const [view, setView] = useState(() => loadLS(LS.profile, null) && loadLS(LS.plan, null) ? "app" : "landing");
  const [tab, setTab] = useState("home");
  const [demoLoading, setDemoLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [appError, setAppError] = useState("");
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [startingToday, setStartingToday] = useState(false);
  const [readinessByDate, setReadinessByDate] = useState(() => loadLS(LS.readiness, {}));
  const [weekOverrides, setWeekOverrides] = useState(() => loadLS(LS.weekOverrides, {}));
  const online = useOnlineStatus();
  const migrationStartedRef = useRef(false);

  useEffect(() => {
    if (!profile || !plan || plan.version === 71 || migrationStartedRef.current) return;
    migrationStartedRef.current = true;
    requestPlan(profile, sessions, weekOverrides)
      .then((nextPlan) => setPlan(nextPlan))
      .catch(() => { /* Keep the previous validated plan if migration refresh is unavailable. */ });
  }, [profile, plan, sessions, weekOverrides]);

  useEffect(() => { saveLS(LS.profile, profile); }, [profile]);
  useEffect(() => { saveLS(LS.plan, plan); }, [plan]);
  useEffect(() => { saveLS(LS.sessions, sessions); }, [sessions]);
  useEffect(() => { saveLS(LS.activeWorkout, activeWorkout); }, [activeWorkout]);
  useEffect(() => { saveLS(LS.readiness, readinessByDate); }, [readinessByDate]);
  useEffect(() => { saveLS(LS.weekOverrides, weekOverrides); }, [weekOverrides]);
  useEffect(() => { track("app_opened", { has_profile: Boolean(profile), has_plan: Boolean(plan), resumed_workout: Boolean(activeWorkout) }); }, []);

  const generateAndSave = async (nextProfile) => {
    const normalized = normalizeClientProfile(nextProfile);
    const nextPlan = await requestPlan(normalized, sessions, {});
    const mode = view === "edit" ? "edit" : "onboarding";
    setWeekOverrides({});
    setProfile(normalized); setPlan(nextPlan); setAppError(""); setTab("home"); setView("app");
    track("profile_saved", { mode, position: normalized.position, level: normalized.level });
    if (mode === "onboarding") track("onboarding_completed", { position: normalized.position, level: normalized.level, plan_source: nextPlan.source || "safe" });
    return nextPlan;
  };

  const startDemo = async () => {
    setDemoLoading(true); setAppError("");
    const demo = createDemoProfile(todayIndex());
    setView("loading-demo");
    try {
      const demoPlan = await requestPlan(demo, [], {});
      setProfile(demo); setPlan(demoPlan); setSessions([]); setActiveWorkout(null); setReadinessByDate({}); setWeekOverrides({}); setTab("home"); setView("app");
      track("demo_plan_started", { position: demo.position });
    } catch (error) {
      setAppError(`${error.message} Check that the backend is running.`); setView("landing");
    } finally { setDemoLoading(false); }
  };

  const regeneratePlan = async () => {
    if (!profile) return;
    setRegenerating(true); setAppError("");
    try { setPlan(await requestPlan(profile, sessions, weekOverrides)); track("plan_regenerated", { position: profile.position }); } catch (error) { setAppError(error.message); } finally { setRegenerating(false); }
  };

  const startTodayWorkout = async (kind = "main") => {
    const day = plan?.days?.find((item) => item.day === todayIndex());
    if (!day) return;
    if (kind === "main") {
      if (day.type !== "personal") { setTab("home"); return; }
      const todayCheckIn = normalizeDailyCheckIn(readinessByDate[dateKey(new Date())], profile?.sessionLength || 45);
      const readiness = readinessFromCheckIn(todayCheckIn, profile?.sessionLength || 45);
      if (checkInNeedsAdaptation(todayCheckIn, day.estimatedMinutes || profile?.sessionLength || 45, profile?.sessionLength || 45)) {
        const reason = readiness === "tired" ? "tired" : "short_time";
        const requestedMinutes = Math.min(60, Math.max(10, todayCheckIn.timeAvailable));
        setStartingToday(true);
        try {
          await startAdaptedSession({ reason, location: day.trainingLocation, minutes: requestedMinutes, readiness, ballAvailable: profile.equipment.includes("top") });
        } catch (error) {
          setAppError(error.message || "Today’s session could not be adjusted.");
        } finally {
          setStartingToday(false);
        }
        return;
      }
      const ids = [...MORNING_ROUTINE.map((exercise) => exercise.id), ...(day.exerciseIds || []), ...RESET_ROUTINE.map((exercise) => exercise.id)];
      const exerciseDurations = { ...Object.fromEntries(MORNING_ROUTINE.map((exercise) => [exercise.id, exercise.duration])), ...(day.exerciseDurations || {}), ...Object.fromEntries(RESET_ROUTINE.map((exercise) => [exercise.id, exercise.duration])) };
      setActiveWorkout({ kind: "main", day: day.day, title: day.title, coachNote: day.coachNote, sessionIntent: day.sessionIntent, trainingMix: day.trainingMix, workoutBlocks: day.workoutBlocks || [], progression: day.progression || plan.progression, exerciseProgressions: day.exerciseProgressions || {}, dominantFoot: profile.dominantFoot, planExerciseIds: day.exerciseIds || [], exerciseIds: ids, exerciseDurations, restSeconds: day.restSeconds || 45, phase: "intro", index: 0, remaining: exerciseDurations[ids[0]] || 0, elapsedSeconds: 0, planGeneratedAt: plan.generatedAt || null });
      track("session_started", { kind: "main", day: day.day, progression_stage: day.progression?.level || plan.progression?.level || 1 });
      return;
    }
    const mastery = day.ballMastery;
    if (!mastery) { setTab("home"); return; }
    const exerciseDurations = Object.fromEntries(mastery.exerciseIds.map((id) => [id, Math.round((mastery.minutes * 60) / mastery.exerciseIds.length)]));
    setActiveWorkout({ kind: "ball_mastery", day: day.day, title: mastery.title, coachNote: mastery.coachNote, workoutBlocks: [{ ...BLOCK_META.technique, exerciseIds: mastery.exerciseIds }], progression: plan.progression, exerciseProgressions: {}, dominantFoot: profile.dominantFoot, planExerciseIds: mastery.exerciseIds, exerciseIds: mastery.exerciseIds, exerciseDurations, restSeconds: 20, phase: "intro", index: 0, remaining: exerciseDurations[mastery.exerciseIds[0]] || 300, elapsedSeconds: 0, planGeneratedAt: plan.generatedAt || null });
    track("session_started", { kind: "ball_mastery", day: day.day });
  };

  const startAdaptedSession = async (options) => {
    const day = plan?.days?.find((item) => item.day === todayIndex());
    if (!profile || !day || day.type !== "personal") throw new Error("There is no personal session to adapt today.");
    const adapted = await requestAdaptedSession(profile, day, options, sessions);
    const firstId = adapted.exerciseIds[0];
    setActiveWorkout({ kind: "adapted", day: day.day, title: adapted.title, coachNote: adapted.coachNote, sessionIntent: adapted.sessionIntent, trainingMix: adapted.trainingMix, workoutBlocks: adapted.workoutBlocks || [], progression: adapted.progression || plan.progression, exerciseProgressions: adapted.exerciseProgressions || {}, dominantFoot: profile.dominantFoot, planExerciseIds: adapted.exerciseIds, exerciseIds: adapted.exerciseIds, exerciseDurations: adapted.exerciseDurations, restSeconds: adapted.restSeconds || 30, phase: "intro", index: 0, remaining: adapted.exerciseDurations?.[firstId] || 300, elapsedSeconds: 0, planGeneratedAt: plan.generatedAt || null, trainingLocation: adapted.trainingLocation, adaptationReason: adapted.reason, rescheduleDay: adapted.rescheduleDay ?? null });
    track("session_adapted", { readiness_adjustment: adapted.reason === "tired", day: day.day, minutes: adapted.estimatedMinutes || 0, location: adapted.trainingLocation || "unknown" });
    track("session_started", { kind: "adapted", day: day.day, progression_stage: adapted.progression?.level || plan.progression?.level || 1 });
    setAdaptOpen(false);
  };

  const finishWorkout = async (feedback, summary) => {
    const completedAt = new Date().toISOString();
    const kind = activeWorkout?.kind || "main";
    const exerciseIds = activeWorkout?.planExerciseIds || summary.exercises.map((exercise) => exercise.id);
    const session = { id: `session-${Date.now()}`, completedAt, day: activeWorkout?.day ?? todayIndex(), kind, durationSeconds: Math.round(summary.elapsedSeconds), plannedSeconds: summary.plannedSeconds, exerciseIds, feedback, progressionStage: activeWorkout?.progression?.level || plan?.progression?.level || 1, sessionIntent: activeWorkout?.sessionIntent || null, trainingMix: activeWorkout?.trainingMix || null, planGeneratedAt: activeWorkout?.planGeneratedAt || null };
    const nextSessions = [session, ...sessions];
    setSessions(nextSessions); setActiveWorkout(null); setTab("progress");
    track("feedback_submitted", { kind, difficulty: feedback?.difficulty || "", quality: feedback?.quality || "" });
    track("session_completed", { kind, day: session.day, duration_minutes: Math.round(session.durationSeconds / 60), progression_stage: session.progressionStage });

    if (["main", "adapted"].includes(kind) && profile) {
      try {
        const nextPlan = await requestPlan(profile, nextSessions, weekOverrides);
        if ((nextPlan.progression?.level || 1) > (plan?.progression?.level || 1)) track("progression_advanced", { from_stage: plan?.progression?.level || 1, to_stage: nextPlan.progression?.level || 1 });
        setPlan(nextPlan);
      } catch { track("plan_refresh_failed", { after_session: true }); /* Feedback remains saved even if plan refresh is temporarily unavailable. */ }
    }
  };

  const persistWorkout = useCallback((patch) => setActiveWorkout((current) => {
    if (!current) return current;
    const next = { ...current, ...patch, lastPersistedAt: new Date().toISOString() };
    saveLS(LS.activeWorkout, next);
    return next;
  }), []);

  const moveSessionThisWeek = (fromDay, toDay) => {
    if (!profile || !plan) throw new Error("Your weekly plan is not ready yet.");
    const nextPlan = movePlanSession(plan, profile, fromDay, toDay);
    const week = getISOWeek(new Date());
    setPlan(nextPlan);
    setWeekOverrides((current) => ({ [week]: [...(Array.isArray(current?.[week]) ? current[week] : []), { fromDay, toDay }] }));
    track("session_moved", { from_day: fromDay, to_day: toDay });
  };

  const resetApp = () => {
    if (!window.confirm("Reset your profile, plan and completed training data on this device?")) return;
    setProfile(null); setPlan(null); setSessions([]); setActiveWorkout(null); setReadinessByDate({}); setWeekOverrides({}); setAdaptOpen(false); setStartingToday(false); setAppError(""); setTab("home"); setView("landing");
  };

  if (activeWorkout && profile && plan) {
    const planDay = plan.days.find((day) => day.day === activeWorkout.day) || { title: "Personal Training", coachNote: "Keep every repetition technically clean." };
    return <div className="app-shell workout-mode">{!online && <ConnectivityBanner/>}<WorkoutFlow initialState={activeWorkout} planDay={planDay} onPersist={persistWorkout} onAbandon={() => { track("workout_abandoned", { kind: activeWorkout.kind || "main", day: activeWorkout.day ?? todayIndex() }); setActiveWorkout(null); }} onComplete={finishWorkout} /></div>;
  }

  if (view === "loading-demo") return <div className="app-shell">{!online && <ConnectivityBanner/>}<PlanLoading demo /></div>;
  if (view === "landing" || !profile || !plan) {
    if (view === "onboarding") return <div className="app-shell">{!online && <ConnectivityBanner/>}<Onboarding onCancel={() => setView("landing")} onSubmit={generateAndSave}/></div>;
    return <div className="app-shell">{!online && <ConnectivityBanner/>}<Landing onStart={() => { track("onboarding_started"); setView("onboarding"); }} onDemo={startDemo} demoLoading={demoLoading} error={appError} onDismissError={() => setAppError("")}/></div>;
  }
  if (view === "edit") return <div className="app-shell">{!online && <ConnectivityBanner/>}<Onboarding mode="edit" initialProfile={profile} onCancel={() => setView("app")} onSubmit={generateAndSave}/></div>;

  const todayPlan = plan.days.find((day) => day.day === todayIndex());
  const todayKey = dateKey(new Date());
  const currentCheckIn = normalizeDailyCheckIn(readinessByDate[todayKey], profile.sessionLength || 45);
  const currentReadiness = readinessFromCheckIn(currentCheckIn, profile.sessionLength || 45);
  const updateTodayCheckIn = (patch) => {
    setReadinessByDate((current) => ({ ...current, [todayKey]: { ...normalizeDailyCheckIn(current[todayKey], profile.sessionLength || 45), ...patch } }));
    const field = Object.keys(patch || {})[0];
    track("daily_checkin_updated", { field: field || "unknown" });
  };
  const week = sessionsThisWeek(sessions);
  const mainDone = mainSessions(week).some((session) => session.day === todayIndex());
  const masteryDone = masterySessions(week).some((session) => session.day === todayIndex());
  const trainKind = todayPlan?.type === "personal" && !mainDone ? "main" : todayPlan?.ballMastery && !masteryDone ? "ball_mastery" : null;

  return (
    <div className="app-shell">
      {!online && <ConnectivityBanner/>}
      <div className="app-main">
        {tab === "home" && <HomeScreen profile={profile} plan={plan} sessions={sessions} onStartWorkout={startTodayWorkout} onOpenPlan={() => setTab("plan")} checkIn={currentCheckIn} onCheckInChange={updateTodayCheckIn} onAdapt={() => { track("adapt_session_opened", { day: todayPlan?.day ?? todayIndex() }); setAdaptOpen(true); }} startLoading={startingToday}/>} 
        {tab === "plan" && <WeeklyPlanScreen plan={plan} profile={profile} sessions={sessions} onMoveSession={moveSessionThisWeek}/>} 
        {tab === "progress" && <ProgressScreen sessions={sessions} plan={plan} profile={profile}/>} 
        {tab === "profile" && <ProfileScreen profile={profile} plan={plan} onEdit={() => setView("edit")} onRegenerate={regeneratePlan} regenerating={regenerating} error={appError} onReset={resetApp}/>} 
      </div>
      <BottomNav tab={tab} trainAvailable={Boolean(trainKind)} onTrain={() => trainKind ? startTodayWorkout(trainKind) : setTab("home")} onChange={(next) => { setTab(next); setAppError(""); }}/>
      {adaptOpen && todayPlan?.type === "personal" && !mainDone && <AdaptSessionSheet profile={profile} day={todayPlan} readiness={currentReadiness} initialMinutes={currentCheckIn.timeAvailable} onClose={() => setAdaptOpen(false)} onStart={startAdaptedSession}/>}
    </div>
  );
}
