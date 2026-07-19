/* ============================================
   Research Module - AI Research Assistant with Chat History
   ============================================ */
const ResearchModule = {
  activeSessionId: null,
  activeDepth: 'standard',
  module: 'research',

  async render(container) {
    const reports = Storage.get('researchReports', []);
    // Ensure at least one session exists
    let sessions = ChatHistory.getAll(this.module);
    if (sessions.length === 0) {
      const session = ChatHistory.create(this.module, 'New Research');
      this.activeSessionId = session.id;
    } else {
      this.activeSessionId = this.activeSessionId || sessions[0].id;
    }

    container.innerHTML = `
      <div class="page-header">
        <h2>🔍 AI Research Assistant</h2>
        <p>Deep research, fact-checking, and report generation</p>
      </div>
      
      <div style="display:flex;gap:var(--space-lg);height:calc(100vh - 200px)">
        <!-- Chat History Sidebar -->
        <div class="glass-card" style="width:240px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden">
          <div class="card-header" style="padding:var(--space-sm) var(--space-md)">
            <h3 class="card-title" style="font-size:var(--font-size-sm)">💬 Chat History</h3>
            <button class="btn btn-sm btn-primary" onclick="ResearchModule.newChat()" title="New Chat">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div id="research-history-list" class="flex-col gap-xs" style="flex:1;overflow-y:auto;padding:var(--space-sm)"></div>
          <div style="padding:var(--space-sm);border-top:1px solid var(--border-color);font-size:var(--font-size-xs);color:var(--text-tertiary);text-align:center">
            ${sessions.length} saved chat(s)
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="glass-card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div class="card-header">
            <h3 class="card-title" id="research-session-title">${this.getActiveSessionTitle()}</h3>
            <div class="flex-row gap-sm">
              <select id="research-depth" class="glass-input" style="width:auto;padding:4px 8px;font-size:var(--font-size-xs)" onchange="ResearchModule.setDepth(this.value)">
                <option value="quick">Quick</option>
                <option value="standard" selected>Standard</option>
                <option value="deep">Deep</option>
              </select>
              <button class="btn btn-sm btn-secondary" onclick="ResearchModule.clearCurrentChat()" title="Clear chat">
                <i class="fas fa-eraser"></i>
              </button>
            </div>
          </div>
          <div id="research-messages" class="message-list" style="flex:1;padding:var(--space-md)"></div>
          <div class="chat-input-container">
            <textarea id="research-input" placeholder="Ask the Research Agent anything..." rows="1"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ResearchModule.sendMessage()}"></textarea>
            <button class="btn btn-primary" onclick="ResearchModule.sendMessage()">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        
        <!-- Side Panel: Quick Actions + Reports -->
        <div class="flex-col gap-md" style="width:280px;flex-shrink:0">
          <div class="glass-card">
            <h3 class="card-title mb-md">⚡ Quick Research</h3>
            <div class="flex-col gap-sm">
              <button class="btn btn-secondary" onclick="ResearchModule.quickResearch('Latest AI breakthroughs in 2026')">
                🤖 Latest AI breakthroughs
              </button>
              <button class="btn btn-secondary" onclick="ResearchModule.quickResearch('Best productivity techniques backed by science')">
                📚 Productivity science
              </button>
              <button class="btn btn-secondary" onclick="ResearchModule.quickResearch('Climate change solutions and progress')">
                🌍 Climate solutions
              </button>
              <button class="btn btn-secondary" onclick="ResearchModule.quickResearch('Future of remote work trends')">
                💼 Remote work trends
              </button>
            </div>
          </div>
          
          <div class="glass-card" style="flex:1;overflow-y:auto">
            <div class="card-header">
              <h3 class="card-title">📄 Saved Reports</h3>
            </div>
            <div id="saved-reports-list" class="flex-col gap-sm">
              ${reports.length === 0 ? `<div class="empty-state" style="padding:var(--space-md)">
                <i class="fas fa-file-alt" style="font-size:1.5rem"></i>
                <p style="margin:0;font-size:var(--font-size-xs)">No saved reports</p>
              </div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.renderHistoryList();
    this.renderSavedReports();
    this.loadActiveSession();
  },

  // ---- Session Management ----
  getActiveSessionTitle() {
    const sessions = ChatHistory.getAll(this.module);
    const session = sessions.find(s => s.id === this.activeSessionId);
    return session ? session.title : 'New Chat';
  },

  newChat() {
    const session = ChatHistory.create(this.module, 'New Research');
    this.activeSessionId = session.id;
    this.renderHistoryList();
    this.loadActiveSession();
    // Update title
    const titleEl = $('#research-session-title');
    if (titleEl) titleEl.textContent = session.title;
    Toast.success('New chat created!');
  },

  selectSession(sessionId) {
    this.activeSessionId = sessionId;
    this.renderHistoryList();
    this.loadActiveSession();
    const titleEl = $('#research-session-title');
    if (titleEl) {
      const sessions = ChatHistory.getAll(this.module);
      const s = sessions.find(x => x.id === sessionId);
      if (titleEl) titleEl.textContent = s ? s.title : 'Chat';
    }
  },

  renameSession(sessionId) {
    const sessions = ChatHistory.getAll(this.module);
    const s = sessions.find(x => x.id === sessionId);
    const newTitle = prompt('Rename chat:', s ? s.title : '');
    if (newTitle && newTitle.trim()) {
      ChatHistory.rename(this.module, sessionId, newTitle.trim());
      this.renderHistoryList();
      if (sessionId === this.activeSessionId) {
        const titleEl = $('#research-session-title');
        if (titleEl) titleEl.textContent = newTitle.trim();
      }
    }
  },

  deleteSession(sessionId) {
    const sessions = ChatHistory.getAll(this.module);
    if (sessions.length <= 1) {
      Toast.warning('Cannot delete the last chat');
      return;
    }
    if (!confirm('Delete this chat history?')) return;
    
    ChatHistory.delete(this.module, sessionId);
    
    // Switch to another session
    if (this.activeSessionId === sessionId) {
      const remaining = ChatHistory.getAll(this.module);
      this.activeSessionId = remaining.length > 0 ? remaining[0].id : null;
    }
    
    this.renderHistoryList();
    this.loadActiveSession();
    const titleEl = $('#research-session-title');
    if (titleEl) titleEl.textContent = this.getActiveSessionTitle();
    Toast.success('Chat deleted');
  },

  renderHistoryList() {
    const container = $('#research-history-list');
    if (!container) return;

    container.innerHTML = ChatHistory.renderPanel(
      this.module,
      'ResearchModule.selectSession',
      'ResearchModule.deleteSession',
      'ResearchModule.renameSession',
      this.activeSessionId
    );
  },

  loadActiveSession() {
    const messages = ChatHistory.getMessages(this.module, this.activeSessionId);
    const container = $('#research-messages');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="message agent fade-in">
          <div class="message-avatar">🔍</div>
          <div class="message-bubble">
            <p><strong>Research Agent ready!</strong> 👋</p>
            <p>I can help you with:</p>
            <ul>
              <li>Deep research on any topic</li>
              <li>Fact-checking claims and statements</li>
              <li>Generating detailed reports</li>
              <li>Summarizing complex topics</li>
              <li>Web search synthesis with sources</li>
            </ul>
            <p><strong>Choose a depth level</strong> and ask me anything!</p>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = messages.map(m => `
        <div class="message ${m.role} fade-in">
          <div class="message-avatar">${m.role === 'user' ? '👤' : '🔍'}</div>
          <div class="message-bubble">${marked.parse(m.content)}</div>
        </div>
      `).join('');
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
  },

  clearCurrentChat() {
    if (!confirm('Clear all messages in this chat?')) return;
    const sessions = ChatHistory.getAll(this.module);
    const session = sessions.find(s => s.id === this.activeSessionId);
    if (session) {
      session.messages = [];
      session.title = 'New Research';
      session.updatedAt = new Date().toISOString();
      ChatHistory._saveAll(this.module, sessions);
    }
    this.loadActiveSession();
    this.renderHistoryList();
    const titleEl = $('#research-session-title');
    if (titleEl) titleEl.textContent = 'New Research';
    Toast.success('Chat cleared');
  },

  // ---- Depth & Input ----
  setDepth(depth) {
    this.activeDepth = depth;
  },
  
  async quickResearch(topic) {
    const input = $('#research-input');
    if (input) input.value = topic;
    await this.sendMessage();
  },
  
  async sendMessage() {
    const input = $('#research-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    
    // Ensure session exists
    if (!this.activeSessionId) {
      const session = ChatHistory.create(this.module, message.slice(0, 50));
      this.activeSessionId = session.id;
      this.renderHistoryList();
    }

    input.value = '';
    input.style.height = 'auto';
    
    // Save user message
    ChatHistory.addMessage(this.module, this.activeSessionId, 'user', message);
    
    const msgContainer = $('#research-messages');
    if (!msgContainer) return;
    
    // Re-render with new user message
    this.loadActiveSession();
    
    // Update title
    const titleEl = $('#research-session-title');
    if (titleEl) titleEl.textContent = this.getActiveSessionTitle();
    this.renderHistoryList();
    
    // Add typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message agent';
    typingDiv.innerHTML = `
      <div class="message-avatar">🔍</div>
      <div class="message-bubble"><div class="dot-pulse"><span></span><span></span><span></span></div> Researching...</div>
    `;
    msgContainer.appendChild(typingDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    
    try {
      const prompt = `[Research Depth: ${this.activeDepth}]\n\n${message}`;
      const response = await MultiAgent.chat('research', prompt);
      
      // Save agent response
      ChatHistory.addMessage(this.module, this.activeSessionId, 'agent', response);
      typingDiv.remove();
      this.loadActiveSession();
      
      // Update title again if it was auto-titled
      if (titleEl) titleEl.textContent = this.getActiveSessionTitle();
      this.renderHistoryList();
      
      // Offer to save as report
      if (response.length > 500) {
        this.offerSaveReport(message, response);
      }
    } catch (e) {
      typingDiv.remove();
      ChatHistory.addMessage(this.module, this.activeSessionId, 'agent', `❌ Error: ${e.message}`);
      this.loadActiveSession();
    }
  },
  
  offerSaveReport(query, content) {
    setTimeout(() => {
      const container = $('#research-messages');
      if (!container) return;
      
      const saveDiv = DOM.create('div', { className: 'message agent fade-in' }, [
        DOM.create('div', { className: 'message-avatar' }, '💾'),
        DOM.create('div', { className: 'message-bubble' }, [
          DOM.create('p', {}, 'Save this as a report?'),
          DOM.create('button', {
            className: 'btn btn-sm btn-accent',
            onclick: () => {
              ResearchModule.saveReport(query, content);
              saveDiv.remove();
            }
          }, '💾 Save Report')
        ])
      ]);
      container.appendChild(saveDiv);
      container.scrollTop = container.scrollHeight;
    }, 300);
  },

  saveReport(query, content) {
    const reports = Storage.get('researchReports', []);
    reports.unshift({
      id: Helpers.uid(),
      query,
      content,
      createdAt: new Date().toISOString(),
      depth: this.activeDepth
    });
    Storage.set('researchReports', reports);
    this.renderSavedReports();
    Toast.success('Report saved!');
  },
  
  renderSavedReports() {
    const container = $('#saved-reports-list');
    if (!container) return;
    const reports = Storage.get('researchReports', []);
    if (reports.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-md)">
        <i class="fas fa-file-alt" style="font-size:1.5rem"></i>
        <p style="margin:0;font-size:var(--font-size-xs)">No saved reports</p>
      </div>`;
      return;
    }
    container.innerHTML = reports.slice(0, 10).map(r => `
      <div class="card" style="padding:var(--space-md);cursor:pointer" 
           onclick="ResearchModule.viewReport('${r.id}')">
        <div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-xs)">
          ${Helpers.escapeHtml(Helpers.truncate(r.query, 60))}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="badge badge-info">${r.depth}</span>
          <span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${Helpers.timeAgo(r.createdAt)}</span>
        </div>
        <button class="btn btn-sm btn-secondary" style="margin-top:var(--space-xs);width:100%"
                onclick="event.stopPropagation();ResearchModule.deleteReport('${r.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `).join('');
  },
  
  viewReport(id) {
    const reports = Storage.get('researchReports', []);
    const report = reports.find(r => r.id === id);
    if (!report) return;
    const session = ChatHistory.create(this.module, report.query.slice(0, 50));
    ChatHistory.addMessage(session.module || this.module, session.id, 'user', report.query);
    ChatHistory.addMessage(session.module || this.module, session.id, 'agent', report.content);
    this.activeSessionId = session.id;
    this.renderHistoryList();
    this.loadActiveSession();
    const titleEl = $('#research-session-title');
    if (titleEl) titleEl.textContent = this.getActiveSessionTitle();
  },
  
  deleteReport(id) {
    let reports = Storage.get('researchReports', []);
    reports = reports.filter(r => r.id !== id);
    Storage.set('researchReports', reports);
    this.renderSavedReports();
    Toast.success('Report deleted');
  }
};
