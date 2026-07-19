/* ============================================
   AI Router — All Agent Endpoints
   /api/ai/chat       — Standard chat
   /api/ai/stream     — Streaming SSE chat
   /api/ai/research   — Research agent
   /api/ai/study      — Study agent
   /api/ai/coding     — Coding agent
   /api/ai/planning   — Planning agent
   /api/ai/document   — Document generator
   /api/ai/cache      — Cache management
   ============================================ */
import { Router } from 'express';
import { callGemini, streamGemini } from '../services/gemini.js';
import { asyncHandler } from '../middleware/error.js';
import { cache } from '../cache/store.js';

export const aiRouter = Router();

// -------------------------------------------------------
// POST /api/ai/chat  — Universal chat endpoint
// -------------------------------------------------------
aiRouter.post('/chat', asyncHandler(async (req, res) => {
  const { message, agent = 'research', depth, style, format } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: '"message" is required' });
  }
  if (message.length > 25000) {
    return res.status(400).json({ error: 'Message too long (max 25,000 chars)' });
  }

  const result = await callGemini(message.trim(), agent, { depth, style, format });

  res.json({
    success: true,
    agent,
    content: result,
    timestamp: new Date().toISOString()
  });
}));

// -------------------------------------------------------
// POST /api/ai/stream  — SSE streaming endpoint
// -------------------------------------------------------
aiRouter.post('/stream', asyncHandler(async (req, res) => {
  const { message, agent = 'research', depth, style, format } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: '"message" is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = await streamGemini(message.trim(), agent, { depth, style, format });
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('event: done\ndata: [DONE]\n\n');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    }
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  res.end();
}));

// -------------------------------------------------------
// Specialized routes for each agent type
// -------------------------------------------------------

// POST /api/ai/research
aiRouter.post('/research', asyncHandler(async (req, res) => {
  const { message, depth = 'standard' } = req.body;
  if (!message) return res.status(400).json({ error: '"message" is required' });
  const result = await callGemini(message, 'research', { depth });
  res.json({ success: true, agent: 'research', content: result });
}));

// POST /api/ai/study
aiRouter.post('/study', asyncHandler(async (req, res) => {
  const { message, type = 'flashcards' } = req.body;
  if (!message) return res.status(400).json({ error: '"message" is required' });

  let enhanced = message;
  if (type === 'flashcards') enhanced = `Convert these notes into flashcards (Q&A pairs with topics and difficulty):\n\n${message}`;
  else if (type === 'quiz') enhanced = `Create a quiz from these notes with varied question types:\n\n${message}`;
  else if (type === 'mindmap') enhanced = `Create a mind map structure for: "${message}" with depth 3`;
  else if (type === 'revision') enhanced = `Create a revision plan for: ${message}`;

  const result = await callGemini(enhanced, 'study');
  res.json({ success: true, agent: 'study', content: result });
}));

// POST /api/ai/coding
aiRouter.post('/coding', asyncHandler(async (req, res) => {
  const { message, action = 'generate' } = req.body;
  if (!message) return res.status(400).json({ error: '"message" is required' });

  let enhanced = message;
  if (action === 'review') enhanced = `Review this code and provide detailed feedback:\n\n${message}`;
  else if (action === 'debug') enhanced = `Debug this code — find issues and provide the fixed version:\n\n${message}`;

  const result = await callGemini(enhanced, 'coding');
  res.json({ success: true, agent: 'coding', content: result });
}));

// POST /api/ai/planning
aiRouter.post('/planning', asyncHandler(async (req, res) => {
  const { message, action = 'breakdown' } = req.body;
  if (!message) return res.status(400).json({ error: '"message" is required' });

  let enhanced = message;
  if (action === 'breakdown') enhanced = `Break down this project into actionable tasks with phases, milestones, and time estimates:\n\n${message}`;
  else if (action === 'daily') enhanced = `Create an optimized daily plan for these tasks:\n\n${message}`;
  else if (action === 'risks') enhanced = `Analyze risks for this project:\n\n${message}`;

  const result = await callGemini(enhanced, 'planning');
  res.json({ success: true, agent: 'planning', content: result });
}));

// POST /api/ai/document
aiRouter.post('/document', asyncHandler(async (req, res) => {
  const { message, format = 'essay', style = 'academic' } = req.body;
  if (!message) return res.status(400).json({ error: '"message" is required' });

  const result = await callGemini(message, 'document', { format, style });
  res.json({ success: true, agent: 'document', content: result });
}));

// -------------------------------------------------------
// Cache management
// -------------------------------------------------------
aiRouter.get('/cache', (req, res) => {
  res.json(cache.stats());
});

aiRouter.post('/cache/clear', (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared', stats: cache.stats() });
});
