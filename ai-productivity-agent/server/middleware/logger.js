/* ============================================
   Request Logger Middleware
   ============================================ */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, path: reqPath } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const icon = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌';
    const color = statusCode < 400 ? '\x1b[32m' : statusCode < 500 ? '\x1b[33m' : '\x1b[31m';

    if (reqPath.startsWith('/api')) {
      console.log(
        `${icon} ${color}${statusCode}\x1b[0m ${method} ${reqPath} \x1b[90m${duration}ms\x1b[0m`
      );
    }
  });

  next();
};
