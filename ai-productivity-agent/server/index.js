/* ============================================
   AI Productivity Agent — Backend Server
   Express + Gemini API Proxy + Caching + Sessions
   ============================================ */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFound } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';
import { requireAllowedEmail } from './middleware/auth.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { emailRouter } from './routes/email.js';
import { adminRouter } from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// -------------------------------------------------------
// Security & Parsing
// -------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
        "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// -------------------------------------------------------
// Rate Limiting
// -------------------------------------------------------
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 100,                    // 100 requests / minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,                     // 20 AI calls / minute
  message: { error: 'AI rate limit reached. Wait a moment.' }
});

// -------------------------------------------------------
// Logging
// -------------------------------------------------------
app.use(requestLogger);
app.use('/api', limiter);

// -------------------------------------------------------
// Routes
// -------------------------------------------------------
app.use('/api/health', healthRouter);
app.use('/api/ai', aiLimiter, requireAllowedEmail, aiRouter);
app.use('/api/email', requireAllowedEmail, emailRouter);
app.use('/api/admin', adminRouter);

// -------------------------------------------------------
// Serve static frontend
// -------------------------------------------------------
app.use(express.static(STATIC_DIR, {
  maxAge: isDev ? 0 : '7d',
  etag: true,
  lastModified: true
}));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return notFound(req, res);
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// -------------------------------------------------------
// Error handling
// -------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// -------------------------------------------------------
// Start
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         ⚡ AI Productivity Agent Backend          ║
║                                                  ║
║   Status:  ${isDev ? '🔧 DEVELOPMENT' : '🚀 PRODUCTION'}
║   Port:    ${PORT}
║   API:     http://localhost:${PORT}/api
║   Health:  http://localhost:${PORT}/api/health
║   Front:   http://localhost:${PORT}/
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
