/* ============================================
   Base Agent Class — Uses backend server for AI
   Never exposes API key to browser
   ============================================ */
class BaseAgent {
  constructor(name, emoji, color) {
    this.name = name;
    this.emoji = emoji;
    this.color = color;
    this.chatHistory = [];
  }
  
  async think(prompt, systemInstruction = '') {
    // Always try backend server first
    try {
      const serverOk = await API.healthCheck();
      if (serverOk) {
        return await API.chat(prompt, { agent: this.name.toLowerCase() });
      }
    } catch { /* fall through */ }

    // Fallback: direct Gemini (needs key in localStorage)
    if (!GeminiAPI.hasKey()) {
      throw new Error('Server offline and no API key configured. Start the server with `npm start`.');
    }
    return await GeminiAPI.call(prompt, {
      systemInstruction: systemInstruction || this.defaultSystemPrompt(),
      temperature: 0.7
    });
  }
  
  async thinkStream(prompt, systemInstruction, onChunk) {
    // Try backend streaming first
    try {
      const serverOk = await API.healthCheck();
      if (serverOk) {
        return new Promise((resolve, reject) => {
          API.streamChat(prompt, { agent: this.name.toLowerCase() },
            (chunk, full) => onChunk?.(chunk, full),
            (full) => resolve(full),
            (err) => reject(err)
          );
        });
      }
    } catch { /* fall through */ }

    if (!GeminiAPI.hasKey()) throw new Error('Server offline');
    return await GeminiAPI.streamCall(prompt, {
      systemInstruction: systemInstruction || this.defaultSystemPrompt(),
      temperature: 0.7
    }, onChunk);
  }
  
  defaultSystemPrompt() {
    return `You are the ${this.name} Agent for the AI Productivity Agent app.
You help users be more productive. Be concise, actionable, and helpful.
Respond in markdown format.`;
  }
  
  addToHistory(role, content) {
    this.chatHistory.push({ role, content, timestamp: Date.now() });
    if (this.chatHistory.length > 50) this.chatHistory.shift();
  }
  
  clearHistory() {
    this.chatHistory = [];
  }
}
