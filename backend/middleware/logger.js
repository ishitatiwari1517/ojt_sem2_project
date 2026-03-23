const logger = require("../utils/logger");

/**
 * HTTP Request Logger Middleware
 * Logs: method, route, status code, and response time.
 *
 * Example output:
 *   GET /api/usage 200 - 45ms
 *   POST /api/auth/login 401 - 12ms
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Hook into the response finish event to capture status code
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Color-code by status range
    const statusColor =
      status >= 500
        ? "\x1b[31m" // red
        : status >= 400
        ? "\x1b[33m" // yellow
        : status >= 300
        ? "\x1b[36m" // cyan
        : "\x1b[32m"; // green

    const reset = "\x1b[0m";

    logger.info(
      `${req.method} ${req.originalUrl} ${statusColor}${status}${reset} - ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;
