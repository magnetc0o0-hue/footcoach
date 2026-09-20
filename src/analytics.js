// Lightweight, optional product analytics. No SDK dependency is required.
// Set VITE_POSTHOG_KEY to enable anonymous PostHog capture in deployed builds.
// Never send health notes, free-text profile fields or other sensitive information.

const key = import.meta.env?.VITE_POSTHOG_KEY || "";
const host = (import.meta.env?.VITE_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const ANON_ID_KEY = "fac_anon_analytics_id";

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function anonymousId() {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const next = randomId();
    localStorage.setItem(ANON_ID_KEY, next);
    return next;
  } catch {
    return "anonymous-session";
  }
}

function cleanProperties(properties = {}) {
  const allowed = {};
  for (const [name, value] of Object.entries(properties || {})) {
    if (value === undefined || value === null) continue;
    if (["string", "number", "boolean"].includes(typeof value)) allowed[name] = value;
  }
  return allowed;
}

export function track(event, properties = {}) {
  if (!event || typeof event !== "string") return;
  const safeProperties = {
    distinct_id: anonymousId(),
    app_version: "7.2-beta",
    release_channel: "closed_beta",
    ...cleanProperties(properties),
  };

  if (!key) {
    if (import.meta.env?.DEV) console.debug("[analytics]", event, safeProperties);
    return;
  }

  try {
    fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, event, properties: safeProperties }),
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  } catch {
    // Analytics must never block training or plan generation.
  }
}
