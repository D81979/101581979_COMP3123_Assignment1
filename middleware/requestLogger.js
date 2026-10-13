const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const status = res.statusCode;

    // Use route templates instead of user-supplied URLs.
    const route = req.route
      ? `${req.baseUrl || ""}${req.route.path}`
      : "unmatched-or-blocked";

    let event = "http_request";

    if (
      req.path === "/api/v1/user/login" ||
      req.path === "/api/v1/user/signup"
    ) {
      event = "authentication_attempt";
    } else if (req.path.startsWith("/api/v1/emp/")) {
      event = "employee_request";
    }

    let outcome = "success";

    if (status === 400 || status === 413) {
      outcome = "invalid_request";
    } else if (status === 401) {
      outcome = "authentication_failed";
    } else if (status === 403) {
      outcome = "access_denied";
    } else if (status === 404) {
      outcome = "not_found";
    } else if (status === 409) {
      outcome = "conflict";
    } else if (status === 429) {
      outcome = "rate_limited";
    } else if (status >= 500) {
      outcome = "server_error";
    } else if (status >= 400) {
      outcome = "request_rejected";
    }

    logger.log({
      level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      message: event,
      method: req.method,
      route,
      status,
      outcome,
      userId: req.user ? String(req.user._id) : undefined,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}

module.exports = requestLogger;