// Shared V7.1 development model. Progression stays deterministic and explainable:
// AI may choose validated drill IDs, but it cannot invent development stages or load rules.

export const PROGRESSION_STAGES = [
  { id: "control", label: "Control", short: "CONTROL", minQualityExposures: 2, cue: "Own the movement at a controlled pace. Clean contacts and balanced body shape come first." },
  { id: "speed", label: "Speed", short: "SPEED", minQualityExposures: 2, cue: "Raise the tempo without losing the same clean technique or body position." },
  { id: "weak_foot", label: "Weak Foot", short: "WEAK FOOT", minQualityExposures: 2, cue: "Repeat the action on your weaker side or opposite direction before returning to your strongest pattern." },
  { id: "scan", label: "Scan", short: "SCAN", minQualityExposures: 3, cue: "Add an early shoulder check before the key touch or movement so information comes before action." },
  { id: "decision", label: "Decision", short: "DECISION", minQualityExposures: 3, cue: "Use a late cue or imagined defender to choose the action instead of pre-planning every repetition." },
  { id: "match_speed", label: "Match Speed", short: "MATCH SPEED", minQualityExposures: 3, cue: "Execute at match intent with short high-quality bursts. Stop the set when technical quality drops." },
];

export const BLOCK_META = {
  activation: { id: "activation", label: "Activation", short: "ACTIVATE", purpose: "Prepare joints, feet and movement quality." },
  technique: { id: "technique", label: "Technique", short: "TECHNIQUE", purpose: "Build repeatable mechanics before pressure or speed." },
  game_realistic: { id: "game_realistic", label: "Game Transfer", short: "GAME TRANSFER", purpose: "Turn the technique into a football decision or match action." },
  physical: { id: "physical", label: "Football Speed", short: "PHYSICAL", purpose: "Add controlled football-specific speed only when the week can absorb it." },
  recovery: { id: "recovery", label: "Reset", short: "RESET", purpose: "Bring the session down and leave with quality in reserve." },
};

// Broad position journey. This remains useful when the player has no primary focus yet.
export const POSITION_DEVELOPMENT_PATHS = {
  kaleci: ["Set position", "Handling", "Distribution", "Reactions", "Pressure decisions", "Match-speed actions"],
  stoper: ["Body shape", "Passing", "Scanning", "Pressure escape", "Defensive decisions", "Match-speed defending"],
  bek: ["First touch", "1v1 defending", "Progression", "Delivery", "Recovery actions", "Match-speed wide play"],
  ortasaha: ["First touch", "Scanning", "Passing", "Pressure escape", "Decision speed", "Tempo under pressure"],
  kanat: ["Ball control", "1v1", "Explosive exit", "End product", "Decision speed", "Match-speed 1v1"],
  forvet: ["Movement", "First touch", "Finishing", "Both sides", "Box decisions", "Match-speed finishing"],
};

// Focus-specific pathways make the development journey feel football-specific instead of generic.
// Six milestones line up with the six progression stages without pretending to measure a fake skill percentage.
export const FOCUS_DEVELOPMENT_PATHS = {
  reaksiyon: ["Set early", "Fast reset", "Read the cue", "React both ways", "Second action", "Match-speed saves"],
  ayak_teknigi: ["Balanced feet", "Faster set", "Both directions", "Scan before set", "Choose position", "Match-speed footwork"],
  elle_oynama: ["Clean hand shape", "Faster handling", "Both sides", "Read flight", "Choose catch/parry", "Match-speed handling"],
  dagitim: ["Clean release", "Faster setup", "Both feet", "Scan first", "Choose target", "Pressure distribution"],
  savunma: ["Body shape", "Close space", "Both channels", "Scan danger", "Press or delay", "Match-speed defending"],
  pas: ["Clean pass", "Pass at tempo", "Both feet", "Scan first", "Choose line", "Pressure passing"],
  tarama: ["Head up", "Earlier scan", "Scan both sides", "Scan before touch", "Act on info", "Match-speed awareness"],
  ilk_temas: ["Secure touch", "Faster touch", "Both feet", "Scan before receive", "Choose escape", "Pressure first touch"],
  hiz: ["Clean mechanics", "Faster first steps", "Both directions", "Scan before burst", "Choose acceleration", "Match-speed repeat"],
  orta: ["Clean delivery", "Faster setup", "Both sides", "Scan target", "Choose delivery", "Match-speed crossing"],
  calim: ["Own the move", "Explosive exit", "Both sides", "Read defender", "Choose the action", "Match-speed 1v1"],
  top_kontrol: ["Close control", "Higher tempo", "Both feet", "Scan while moving", "Choose escape", "Pressure control"],
  bitiricilik: ["Clean contact", "Faster setup", "Both feet", "Scan keeper", "Choose finish", "Match-speed finishing"],
  hareket: ["Timing", "Explosive first steps", "Both channels", "Scan defender", "Choose movement", "Match-speed movement"],
  ball_mastery: ["Clean touches", "Higher rhythm", "Weak foot", "Head up", "Reactive combinations", "Match-speed control"],
};

export function stageByLevel(level = 1) {
  const safe = Math.min(PROGRESSION_STAGES.length, Math.max(1, Number(level) || 1));
  return { ...PROGRESSION_STAGES[safe - 1], level: safe };
}

export function feedbackSignal(feedback) {
  if (!feedback || typeof feedback !== "object") return "neutral";
  if (feedback.discomfort === "yes" || feedback.energy === "drained" || feedback.difficulty === "hard" || feedback.quality === "poor") return "hold";
  if (feedback.difficulty === "easy" && feedback.quality === "sharp" && feedback.energy !== "drained") return "progress";
  return "neutral";
}

export function developmentPathFor(focus, position) {
  return FOCUS_DEVELOPMENT_PATHS[focus] || POSITION_DEVELOPMENT_PATHS[position] || [];
}

export function progressionReview({ level = 1, exposureCount = 0, positiveSignals = 0, holdSignals = 0 } = {}) {
  const stage = stageByLevel(level);
  if (holdSignals > 0) {
    return { status: "hold", exposuresNeeded: 0, label: "Hold & rebuild quality", message: "A recent hard, poor, drained or discomfort signal is holding progression until quality stabilises." };
  }
  if (stage.level >= PROGRESSION_STAGES.length) {
    return { status: "maintain", exposuresNeeded: 0, label: "Maintain match quality", message: "Progress now comes from cleaner decisions and repeatable match-speed execution, not endless extra volume." };
  }
  const required = Math.max(2, stage.minQualityExposures || 2);
  const exposuresNeeded = Math.max(0, required - Number(exposureCount || 0));
  const positivesNeeded = Math.max(0, 2 - Number(positiveSignals || 0));
  if (exposuresNeeded === 0 && positivesNeeded === 0) {
    return { status: "ready", exposuresNeeded: 0, label: "Ready for review", message: "Enough quality evidence is available for Coach to consider the next constraint." };
  }
  const remaining = Math.max(exposuresNeeded, positivesNeeded);
  return {
    status: "build",
    exposuresNeeded: remaining,
    label: `${remaining} quality session${remaining === 1 ? "" : "s"} to review`,
    message: "Coach waits for repeated quality before changing the constraint. One great session alone does not force progression.",
  };
}

export function progressionConstraint(stage, exercise, dominantFoot = "right") {
  const meta = stageByLevel(stage?.level || stage || 1);
  const weaker = dominantFoot === "right" ? "left" : dominantFoot === "left" ? "right" : "opposite";
  const moment = exercise?.gameMoment ? exercise.gameMoment.toLowerCase() : "the action";
  if (meta.id === "control") return `Control: keep ${moment} clean and repeatable before adding speed.`;
  if (meta.id === "speed") return "Speed: raise the tempo while keeping the same first-touch and body-position quality.";
  if (meta.id === "weak_foot") return `Weak foot: complete extra quality reps with your ${weaker} side or opposite direction.`;
  if (meta.id === "scan") return `Scan: check a shoulder before the key touch, then execute ${moment}.`;
  if (meta.id === "decision") return "Decision: use a late visual cue or imagined defender to choose the action at the last useful moment.";
  return `Match speed: execute ${moment} with match intent, then recover fully enough to keep the next rep sharp.`;
}

export function blockTypeForExercise(exercise) {
  const type = exercise?.trainingType || "technique";
  if (["activation", "technique", "game_realistic", "physical", "recovery"].includes(type)) return type;
  return "technique";
}
