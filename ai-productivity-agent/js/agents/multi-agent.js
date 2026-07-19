/* ============================================
   Multi-Agent Orchestrator — Backend-aware
   Tries backend API first, falls back to direct Gemini
   ============================================ */
class MultiAgentOrchestrator {
  constructor() {
    this.agents = {
      research: new ResearchAgent(),
      study: new StudyAgent(),
      coding: new CodingAgent(),
      planning: new PlanningAgent()
    };
    this.chatSessions = {};
  }
  
  getAgent(name) {
    return this.agents[name] || null;
  }
  
  async routeRequest(userInput) {
    const input = userInput.toLowerCase();
    const routing = [
      { agent: 'research', keywords: ['research', 'find', 'search', 'what is', 'explain', 'summarize', 'fact check', 'report on', 'tell me about', 'history of', 'latest'] },
      { agent: 'study', keywords: ['flashcard', 'quiz', 'mind map', 'revision', 'study', 'learn', 'teach', 'exam', 'test prep', 'notes into'] },
      { agent: 'coding', keywords: ['code', 'debug', 'function', 'program', 'api', 'bug', 'error', 'javascript', 'python', 'html', 'css', 'react', 'component', 'app'] },
      { agent: 'planning', keywords: ['plan', 'schedule', 'timeline', 'goal', 'milestone', 'deadline', 'organize', 'prioritize', 'break down', 'project plan'] }
    ];
    for (const route of routing) {
      if (route.keywords.some(kw => input.includes(kw))) return route.agent;
    }
    return 'research';
  }
  
  async execute(agentName, action, ...args) {
    const agent = this.getAgent(agentName);
    if (!agent) throw new Error(`Agent "${agentName}" not found`);
    if (typeof agent[action] !== 'function') throw new Error(`Action "${action}" not found on ${agentName} agent`);

    // Try backend API first — much faster with caching
    try {
      const serverOk = await API.healthCheck();
      if (serverOk) {
        const msg = typeof args[0] === 'string' ? args[0] : JSON.stringify(args);
        const typeMap = {
          generateFlashcards: 'flashcards', generateQuiz: 'quiz',
          generateMindMap: 'mindmap', generateRevisionPlan: 'revision',
          breakDownProject: 'breakdown', createDailyPlan: 'daily',
          analyzeRisks: 'risks', generateCode: 'generate'
        };
        return await API.chat(msg, {
          agent: agentName,
          depth: typeof args[1] === 'string' ? args[1] : 'standard'
        });
      }
    } catch { /* fall through to direct API */ }

    return await agent[action](...args);
  }
  
  async parallelExecute(tasks) {
    const results = await Promise.allSettled(
      tasks.map(task => this.execute(task.agent, task.action, ...(task.args || [])))
    );
    return results.map((r, i) => ({
      agent: tasks[i].agent, action: tasks[i].action,
      success: r.status === 'fulfilled',
      result: r.status === 'fulfilled' ? r.value : r.reason?.message
    }));
  }
  
  // Chat with any agent — backend-first with streaming
  async chat(agentName, message, onStreamChunk = null) {
    const agent = this.getAgent(agentName);
    if (!agent) throw new Error(`Agent "${agentName}" not found`);

    // 1. Try backend API
    try {
      const serverOk = await API.healthCheck();
      if (serverOk) {
        if (onStreamChunk) {
          return new Promise((resolve, reject) => {
            API.streamChat(message, { agent: agentName },
              (chunk, full) => onStreamChunk(chunk, full),
              (full) => { agent?.addToHistory('user', message); agent?.addToHistory('assistant', full); resolve(full); },
              (err) => reject(err)
            );
          });
        }
        const response = await API.chat(message, { agent: agentName });
        agent.addToHistory('user', message);
        agent.addToHistory('assistant', response);
        return response;
      }
    } catch { /* fall through */ }

    // 2. Fallback: direct Gemini call
    if (!GeminiAPI.hasKey()) {
      return `⚠️ **AI Unavailable**\n\nThe server is not running and no API key is configured.\n\nStart the server with \`npm start\` or set your Gemini API key in Settings.\n\nGet a free key: [Google AI Studio](https://aistudio.google.com/apikey)`;
    }

    try {
      if (onStreamChunk) {
        return await agent.thinkStream(message, '', onStreamChunk);
      }
      const response = await agent.think(message);
      agent.addToHistory('user', message);
      agent.addToHistory('assistant', response);
      return response;
    } catch (e) {
      return `❌ **Error**: ${e.message}`;
    }
  }
}

// Global instance
const MultiAgent = new MultiAgentOrchestrator();
