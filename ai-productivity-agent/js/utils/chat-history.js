/* ============================================
   Chat History Manager
   ============================================ */
const ChatHistory = {
  // Get all histories for a module
  getAll(module) {
    const all = Storage.get('chatHistory', { research: [], study: [], projects: [], documents: [] });
    return all[module] || [];
  },

  // Save all histories for a module
  _saveAll(module, histories) {
    const all = Storage.get('chatHistory', { research: [], study: [], projects: [], documents: [] });
    all[module] = histories;
    Storage.set('chatHistory', all);
  },

  // Create a new chat session
  create(module, title = '') {
    const histories = this.getAll(module);
    const session = {
      id: Helpers.uid(),
      title: title || `Chat ${histories.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    histories.unshift(session);
    this._saveAll(module, histories);
    return session;
  },

  // Update chat title
  updateTitle(module, sessionId, title) {
    const histories = this.getAll(module);
    const session = histories.find(h => h.id === sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date().toISOString();
      this._saveAll(module, histories);
    }
  },

  // Add message to session
  addMessage(module, sessionId, role, content) {
    const histories = this.getAll(module);
    const session = histories.find(h => h.id === sessionId);
    if (session) {
      session.messages.push({ role, content, timestamp: new Date().toISOString() });
      session.updatedAt = new Date().toISOString();
      // Auto-title from first user message
      if (session.title.startsWith('Chat ') && role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
        session.title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
      }
      this._saveAll(module, histories);
    }
  },

  // Get messages for a session
  getMessages(module, sessionId) {
    const histories = this.getAll(module);
    const session = histories.find(h => h.id === sessionId);
    return session ? session.messages : [];
  },

  // Delete a session
  delete(module, sessionId) {
    let histories = this.getAll(module);
    histories = histories.filter(h => h.id !== sessionId);
    this._saveAll(module, histories);
  },

  // Rename a session
  rename(module, sessionId, newTitle) {
    this.updateTitle(module, sessionId, newTitle);
  },

  // Get session count
  count(module) {
    return this.getAll(module).length;
  },

  // Get recent sessions (for sidebar widget)
  getRecent(module, count = 5) {
    return this.getAll(module).slice(0, count);
  },

  // Create HTML for history sidebar panel
  renderPanel(module, onSelect, onDelete, onRename, activeId = null) {
    const histories = this.getAll(module);
    
    if (histories.length === 0) {
      return `<div class="empty-state" style="padding:var(--space-md)">
        <i class="fas fa-history" style="font-size:1.5rem"></i>
        <p style="margin:0;color:var(--text-tertiary);font-size:var(--font-size-xs)">No saved chats</p>
      </div>`;
    }

    return histories.map(h => `
      <div class="chat-history-item ${activeId === h.id ? 'active' : ''}" 
           data-session-id="${h.id}"
           style="padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);cursor:pointer;
                  transition:all var(--transition-fast);border-left:3px solid ${activeId === h.id ? 'var(--primary)' : 'transparent'};
                  background:${activeId === h.id ? 'var(--surface-2)' : 'transparent'}">
        <div class="flex-between" onclick="${onSelect}('${h.id}')">
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${Helpers.escapeHtml(h.title)}
            </div>
            <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">
              ${h.messages.length} messages · ${Helpers.timeAgo(h.updatedAt)}
            </div>
          </div>
          <div class="flex-row gap-xs" style="flex-shrink:0;margin-left:var(--space-sm)">
            <button class="icon-btn" style="width:22px;height:22px;font-size:10px" 
                    onclick="event.stopPropagation();${onRename}('${h.id}')" title="Rename">
              <i class="fas fa-pen" style="font-size:10px"></i>
            </button>
            <button class="icon-btn" style="width:22px;height:22px;font-size:10px" 
                    onclick="event.stopPropagation();${onDelete}('${h.id}')" title="Delete">
              <i class="fas fa-times" style="font-size:10px"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
};
