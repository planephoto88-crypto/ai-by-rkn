/* ============================================
   Health Check Route
   ============================================ */
import { Router } from 'express';
import { cache } from '../cache/store.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  const apiKeySet = !!process.env.GEMINI_API_KEY;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cache.stats(),
    apiKeyConfigured: apiKeySet,
    node: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});
