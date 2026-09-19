import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAdaptedSession, createPlan, normalizeProfile } from "./plan.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist");
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 30;
const requestBuckets = new Map();

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
else app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

function rateLimitCoach(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  const current = requestBuckets.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  current.count += 1;
  if (current.count > RATE_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - current.startedAt)) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Coach is receiving too many requests. Please try again shortly." });
  }
  return next();
}

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [key, bucket] of requestBuckets.entries()) {
    if (bucket.startedAt < cutoff) requestBuckets.delete(key);
  }
}, RATE_WINDOW_MS).unref();

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, aiConfigured: Boolean(OPENAI_API_KEY), model: OPENAI_MODEL, version: "7.2-beta" });
});

app.post("/api/generate-plan", rateLimitCoach, async (req, res) => {
  try {
    const profile = normalizeProfile(req.body || {});
    const plan = await createPlan(profile, { apiKey: OPENAI_API_KEY, model: OPENAI_MODEL });
    return res.json(plan);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Plan generation failed:", error.message);
    return res.status(status).json({
      error: status === 400 ? error.message : "The plan could not be generated right now. Please try again.",
    });
  }
});

app.post("/api/adapt-session", rateLimitCoach, (req, res) => {
  try {
    const { profile: rawProfile, day, options } = req.body || {};
    const profile = normalizeProfile(rawProfile || {});
    const adapted = createAdaptedSession(profile, day || {}, options || {});
    return res.json(adapted);
  } catch (error) {
    console.error("Session adaptation failed:", error.message);
    return res.status(400).json({ error: "The session could not be adapted. Please update your choices and try again." });
  }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false, maxAge: "1h", immutable: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.setHeader("Cache-Control", "no-cache");
    return res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON request body." });
  console.error("Unhandled server error:", error);
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Football AI Coach running on port ${PORT}`);
});
