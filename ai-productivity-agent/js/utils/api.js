/* ============================================
   API Client — Calls backend server
   Backend proxies to Gemini, handles caching, streaming
   ============================================ */
const API = {
  BASE_URL: '/api/ai',

  // Get stored email for auth header
  _emailHeader() {
    const email = Storage.get('user_email', '');
    if (email) return { 'x-user-email': email };
    return {};
  },

  _headers() {
    return { 'Content-Type': 'application/json', ...this._emailHeader() };
  },

  // Check if server is reachable
  async healthCheck() {
    try {
      const r = await fetch('/api/health');
      return r.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------
  // Universal chat (supports all agent types)
  // -------------------------------------------------------
  async chat(message, options = {}) {
    const { agent = 'research', depth = 'standard', style, format } = options;

    const response = await fetch(`${this.BASE_URL}/chat`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, agent, depth, style, format })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  },

  // -------------------------------------------------------
  // Streaming chat via SSE
  // -------------------------------------------------------
  streamChat(message, options = {}, onChunk, onDone, onError) {
    const { agent = 'research', depth = 'standard' } = options;

    fetch(`${this.BASE_URL}/stream`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, agent, depth })
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        onError?.(new Error(err.error || `Stream error: ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onDone?.(fullText);
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
              if (chunk.text) {
                fullText += chunk.text;
                onChunk?.(chunk.text, fullText);
              }
            } catch {}
          } else if (line.startsWith('event: error')) {
            // handled on next line
          } else if (line.startsWith('data: ') && line.includes('error')) {
            try {
              const errData = JSON.parse(line.slice(6));
              onError?.(new Error(errData.error || 'Stream error'));
            } catch {}
          }
        }
      }
    }).catch(err => onError?.(err));
  },

  // -------------------------------------------------------
  // Agent-specific shortcuts
  // -------------------------------------------------------
  async research(message, depth = 'standard') {
    const response = await fetch(`${this.BASE_URL}/research`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, depth })
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Research API error');
    return (await response.json()).content;
  },

  async study(message, type = 'flashcards') {
    const response = await fetch(`${this.BASE_URL}/study`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, type })
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Study API error');
    return (await response.json()).content;
  },

  async coding(message, action = 'generate') {
    const response = await fetch(`${this.BASE_URL}/coding`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, action })
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Coding API error');
    return (await response.json()).content;
  },

  async planning(message, action = 'breakdown') {
    const response = await fetch(`${this.BASE_URL}/planning`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, action })
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Planning API error');
    return (await response.json()).content;
  },

  async document(message, format = 'essay', style = 'academic') {
    const response = await fetch(`${this.BASE_URL}/document`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ message, format, style })
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Document API error');
    return (await response.json()).content;
  },

  // Cache management
  async clearCache() {
    const r = await fetch(`${this.BASE_URL}/cache/clear`, { method: 'POST', headers: this._headers() });
    return r.json();
  }
};

/* ============================================
   GeminiAPI (backward-compatible wrapper)
   Now routes through backend API instead of direct Gemini calls
   ============================================ */
const GeminiAPI = {
  getKey() {
    return Storage.get('gemini_api_key', '');
  },

  setKey(key) {
    Storage.set('gemini_api_key', key);
  },

  hasKey() {
    return Storage.get('gemini_api_key', '') !== '';
  },

  async call(prompt, options = {}) {
    return await API.chat(prompt, {
      agent: options.agentType || 'research',
      depth: 'standard',
      style: options.style,
      format: options.format
    });
  },

  async streamCall(prompt, options = {}, onChunk) {
    return new Promise((resolve, reject) => {
      API.streamChat(
        prompt,
        { agent: options.agentType || 'research' },
        (chunk, full) => onChunk?.(chunk, full),
        (full) => resolve(full),
        (err) => reject(err)
      );
    });
  }
};
