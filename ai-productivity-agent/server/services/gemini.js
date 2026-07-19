/* ============================================
   Gemini AI Service — Core AI Engine
   Handles: prompt construction, streaming, fallback, retry
   ============================================ */
import { cache } from '../cache/store.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// -------------------------------------------------------
// Model presets per agent type
// -------------------------------------------------------
const MODEL_PRESETS = {
  research: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
    topP: 0.95,
    topK: 40
  },
  study: {
    model: 'gemini-2.5-flash',
    temperature: 0.6,
    maxTokens: 4096,
    topP: 0.95,
    topK: 40
  },
  coding: {
    model: 'gemini-2.5-flash',
    temperature: 0.4,
    maxTokens: 8192,
    topP: 0.95,
    topK: 40
  },
  planning: {
    model: 'gemini-2.5-flash',
    temperature: 0.5,
    maxTokens: 4096,
    topP: 0.95,
    topK: 40
  },
  document: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
    topP: 0.95,
    topK: 40
  }
};

// -------------------------------------------------------
// System prompts per agent
// -------------------------------------------------------
const SYSTEM_PROMPTS = {
  research: `You are the Research Agent for AI Productivity Agent. You specialize in:
- Deep research on any topic with comprehensive analysis
- Balanced perspectives and fact-based conclusions
- Well-structured reports with clear sections
- Source-like citations when applicable [Source: Name]
Respond in professional, well-organized markdown with headings, bullet points, and clear structure. Always provide actionable insights.`,

  study: `You are the Study Agent for AI Productivity Agent. You specialize in:
- Creating effective flashcards (Q&A format)
- Generating varied quiz questions (MCQ, True/False, Short Answer)
- Building structured mind maps
- Designing revision plans and study schedules
- Explaining concepts at different difficulty levels
Be educational, clear, and encourage active recall. Use markdown formatting.`,

  coding: `You are the Coding Agent for AI Productivity Agent. You specialize in:
- Writing clean, well-commented code
- Code review and optimization
- Debugging and error analysis
- Architecture and design patterns
Always provide runnable examples, explain your approach, and highlight best practices. Use proper markdown code blocks.`,

  planning: `You are the Planning Agent for AI Productivity Agent. You specialize in:
- Breaking projects into actionable tasks with time estimates
- Creating realistic timelines and milestone plans
- Risk analysis with mitigation strategies
- Goal setting (SMART) and progress tracking
- Daily/weekly prioritization (Eisenhower Matrix)
Be practical, realistic, and highly organized. Use structured markdown with checkboxes.`,

  document: `You are the Document Generator for AI Productivity Agent. You specialize in:
- Writing professional essays, reports, and presentations
- Creating comprehensive study notes
- Adapting tone and style to the requested format
- Organizing content with proper structure and flow
Be thorough, well-structured, and format beautifully in markdown.`
};

// -------------------------------------------------------
// Build AI prompt with agent persona
// -------------------------------------------------------
function buildPrompt(userMessage, agentType, options = {}) {
  const { depth, style, format } = options;
  let enhanced = '';

  if (agentType === 'research' && depth) {
    const depthGuides = {
      quick: 'Provide a brief but accurate overview.',
      standard: 'Provide comprehensive analysis with multiple angles.',
      deep: 'Conduct an exhaustive deep-dive. Include historical context, current landscape, future trends, and expert opinions.'
    };
    enhanced = `[Research Mode: ${depth.toUpperCase()}]\n${depthGuides[depth] || ''}\n\n`;
  }

  if (agentType === 'document' && style) {
    enhanced += `[Format: ${style}] [Type: ${format}]\n`;
  }

  return enhanced + userMessage;
}

// -------------------------------------------------------
// Core API call (non-streaming)
// -------------------------------------------------------
export async function callGemini(rawPrompt, agentType = 'research', options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('GEMINI_API_KEY not configured on server'), { status: 500 });

  const preset = MODEL_PRESETS[agentType] || MODEL_PRESETS.research;
  const systemPrompt = SYSTEM_PROMPTS[agentType] || SYSTEM_PROMPTS.research;
  const prompt = buildPrompt(rawPrompt, agentType, options);

  // Check cache for identical requests
  const cacheKey = `${agentType}:${Buffer.from(prompt).toString('base64').slice(0, 120)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${agentType}`);
    return cached;
  }

  const url = `${GEMINI_BASE}/${preset.model}:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: preset.temperature,
      maxOutputTokens: preset.maxTokens,
      topP: preset.topP,
      topK: preset.topK
    }
  };

  // Retry logic (3 attempts)
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000)
      });

      if (response.status === 429 && attempt < 3) {
        const wait = attempt * 2000;
        console.log(`[RATE LIMIT] Retrying in ${wait}ms... (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(errBody.error?.message || `Gemini API ${response.status}`),
          { status: response.status, expose: true }
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from model');

      // Cache successful responses
      cache.set(cacheKey, text);
      return text;

    } catch (err) {
      lastError = err;
      if (err.status === 400 || err.status === 401 || err.status === 403) break; // Don't retry auth errors
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw lastError || new Error('Gemini API call failed');
}

// -------------------------------------------------------
// Streaming API call (SSE)
// -------------------------------------------------------
export async function streamGemini(rawPrompt, agentType = 'research', options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('GEMINI_API_KEY not configured'), { status: 500 });

  const preset = MODEL_PRESETS[agentType] || MODEL_PRESETS.research;
  const systemPrompt = SYSTEM_PROMPTS[agentType] || SYSTEM_PROMPTS.research;
  const prompt = buildPrompt(rawPrompt, agentType, options);

  const url = `${GEMINI_BASE}/${preset.model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: preset.temperature,
      maxOutputTokens: preset.maxTokens,
      topP: preset.topP,
      topK: preset.topK
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(errBody.error?.message || `Gemini API ${response.status}`),
      { status: response.status, expose: true }
    );
  }

  return response.body;
}
