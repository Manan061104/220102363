import { createLogger, withLogging } from "../logger/middleware.js";

const logger = createLogger("api");
const useMock = true; // flip to false if backend is available at /api

// Session-scoped state to enforce uniqueness and persistence for demo
const store = {
  byCode: new Map(), // code -> {url, createdAt, expiresAt, clicks: []}
  byLong: new Map(),
};

function genCode() {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)];
  return c;
}

function minutesFromNow(m) {
  const created = new Date();
  const expires = new Date(created.getTime() + (m ?? 30) * 60 * 1000);
  return { createdAt: created.toISOString(), expiresAt: expires.toISOString() };
}

export async function createBatch(items) {
  // items: [{url, minutes?, code?}]
  if (!useMock) {
    const request = withLogging(logger, (body) =>
      fetch("/api/shorten/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    );
    const res = await request({ items });
    if (!res.ok) throw new Error("API error");
    return res.json();
  }
  // Mock: enforce unique shortcodes and default validity
  const results = items.map((it) => {
    let code = (it.code || "").trim();
    if (code) {
      // ensure alphanumeric reasonable length
      if (!/^[a-zA-Z0-9]{3,20}$/.test(code)) throw new Error("Invalid shortcode");
      if (store.byCode.has(code)) throw new Error("Shortcode collision");
    } else {
      do {
        code = genCode();
      } while (store.byCode.has(code));
    }
    const minutes = Number.isInteger(it.minutes) ? it.minutes : 30;
    const { createdAt, expiresAt } = minutesFromNow(minutes);
    const entry = { url: it.url, code, createdAt, expiresAt, clicks: [] };
    store.byCode.set(code, entry);
    store.byLong.set(it.url, entry);
    return { code, shortUrl: `${window.location.origin}/${code}`, createdAt, expiresAt, url: it.url };
  });
  logger.info("createBatch", { count: results.length });
  return results;
}

export async function resolve(code, clickMeta) {
  if (!useMock) {
    const request = withLogging(logger, (c, meta) =>
      fetch(`/api/resolve/${encodeURIComponent(c)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta || {}),
      })
    );
    const res = await request(code, clickMeta);
    if (!res.ok) throw new Error("Not found");
    return res.json();
  }
  const e = store.byCode.get(code);
  if (!e) throw new Error("Not found");
  const now = new Date().toISOString();
  e.clicks.push({
    ts: now,
    source: clickMeta?.source || "direct",
    geo: clickMeta?.geo || "unknown",
  });
  logger.info("click", { code, now });
  return { url: e.url };
}

export async function stats() {
  if (!useMock) {
    const res = await withLogging(logger, () => fetch("/api/stats"))();
    if (!res.ok) throw new Error("API error");
    return res.json();
  }
  const list = Array.from(store.byCode.values()).map((e) => ({
    code: e.code,
    shortUrl: `${window.location.origin}/${e.code}`,
    url: e.url,
    createdAt: e.createdAt,
    expiresAt: e.expiresAt,
    totalClicks: e.clicks.length,
    clicks: e.clicks,
  }));
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
