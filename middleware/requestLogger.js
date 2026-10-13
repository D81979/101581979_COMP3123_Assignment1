const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  // Capture the path before Express enters a router. Never log query values.
  const requestPath = req.path.toLowerCase().replace(/\/$/, "");
  let route = "unmatched-or-blocked";
  let event = "http_request";

  if (["/api/v1/user/login", "/api/v1/user/signup"].includes(requestPath)) {
    event = "authentication_attempt";
    route = requestPath;
  } else if (requestPath === "/api/v1/emp/employees") {
    event = "employee_request";
    route = "/api/v1/emp/employees";
  } else if (/^\/api\/v1\/emp\/employees\/[^/]+$/.test(requestPath)) {
    event = "employee_request";
    route = "/api/v1/emp/employees/:eid";
  } else if (requestPath === "/health") {
    route = "/health";
  }

  res.on("finish", () => {
    const status = res.statusCode;

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
