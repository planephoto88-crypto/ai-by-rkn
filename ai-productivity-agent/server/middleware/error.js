/* ============================================
   Express Error Handler & Utility Middleware
   ============================================ */
export const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const message = err.expose ? err.message : 'Internal server error';

  // Log in dev
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${status} ${req.method} ${req.path}:`, err.stack || err.message);
  } else {
    console.error(`[ERROR] ${status}:`, err.message);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.stack })
  });
};

// Async wrapper to avoid try/catch boilerplate
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
