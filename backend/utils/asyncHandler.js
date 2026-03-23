/**
 * asyncHandler — wraps async route controllers to eliminate repetitive try-catch blocks.
 * Any error thrown inside the handler is forwarded to Express's centralized error handler.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
