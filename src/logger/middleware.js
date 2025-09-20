// Placeholder for the provided Logging Middleware interface.
// Replace internals with the exact middleware from Pre-Test Setup when available.
export function createLogger(context = "ui") {
  return {
    info: (event, payload) =>
      window.__AFF_LOGGER__ ? window.__AFF_LOGGER__.info(context, event, payload) : null,
    warn: (event, payload) =>
      window.__AFF_LOGGER__ ? window.__AFF_LOGGER__.warn(context, event, payload) : null,
    error: (event, payload) =>
      window.__AFF_LOGGER__ ? window.__AFF_LOGGER__.error(context, event, payload) : null,
  };
}

// Express-style middleware adapter for fetch calls
export function withLogging(logger, fn) {
  return async (...args) => {
    try {
      logger.info("request", { args });
      const res = await fn(...args);
      logger.info("response", { ok: res.ok, status: res.status });
      return res;
    } catch (e) {
      logger.error("exception", { message: e.message });
      throw e;
    }
  };
}
