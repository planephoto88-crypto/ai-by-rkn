/* ============================================
   AI Email Companion
   Fetch, read, summarize & reply to emails
   ============================================ */
const EmailModule = {
  emails: [],
  selectedEmail: null,
  filters: { label: 'INBOX', query: '', limit: 20 },
  composing: false,

  async render(container) {
    container.innerHTML = `
      <div class="email-page">
        <!-- Top Actions -->
        <div class="card glass" style="padding:var(--space-md);margin-bottom:var(--space-lg);display:flex;gap:var(--space-md);align-items:center;flex-wrap:wrap;justify-content:space-between">
          <div style="display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap">
            <h3 style="margin:0"><i class="fas fa-envelope"></i> AI Email Companion</h3>
            <span class="badge" style="font-size:10px;background:var(--primary);color:#fff;padding:2px 8px;border-radius:var(--radius-full)">Powered by Gmail</span>
          </div>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
            <button id="email-compose-btn" class="btn btn-primary btn-sm">
              <i class="fas fa-pen"></i> Compose
            </button>
            <button id="email-refresh-btn" class="btn btn-secondary btn-sm">
              <i class="fas fa-sync"></i> Refresh
            </button>
            <button id="email-summarize-btn" class="btn btn-accent btn-sm">
              <i class="fas fa-robot"></i> AI Summarize Inbox
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="card glass" style="padding:var(--space-md);margin-bottom:var(--space-lg);display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:center">
          <div class="email-filter-chips" style="display:flex;gap:var(--space-xs);flex-wrap:wrap">
            ${['INBOX','UNREAD','STARRED','IMPORTANT','SENT','DRAFT'].map(label => `
              <button class="email-label-chip ${label === 'INBOX' ? 'active' : ''}" data-label="${label}">
                ${this.getLabelIcon(label)} ${label}
              </button>
            `).join('')}
          </div>
          <div style="flex:1;min-width:200px">
            <div class="input-with-icon" style="margin:0">
              <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary)"></i>
              <input id="email-search" type="text" placeholder="Search emails..." style="padding-left:36px;width:100%;background:var(--surface-1);border:1px solid var(--border-color);border-radius:var(--radius-full);padding:var(--space-xs) var(--space-md);color:var(--text-primary)">
            </div>
          </div>
        </div>

        <!-- Main Layout: List + Detail -->
        <div class="email-layout" style="display:grid;grid-template-columns:380px 1fr;gap:var(--space-lg);min-height:500px">
          
          <!-- Email List -->
          <div class="email-list-panel card glass" style="padding:0;overflow-y:auto;max-height:70vh">
            <div id="email-list" style="padding:var(--space-sm)">
              <div style="text-align:center;padding:var(--space-2xl);color:var(--text-tertiary)">
                <div class="spinner" style="margin:0 auto var(--space-md)"></div>
                <p>Loading emails...</p>
                <p style="font-size:var(--font-size-xs);margin-top:var(--space-xs)">Connect Gmail in Settings to enable</p>
              </div>
            </div>
          </div>

          <!-- Email Detail / Compose -->
          <div class="email-detail-panel card glass" style="padding:var(--space-lg);max-height:70vh;overflow-y:auto">
            <div id="email-detail-empty" style="text-align:center;padding:var(--space-3xl);color:var(--text-tertiary)">
              <div style="font-size:4rem;margin-bottom:var(--space-md)">📧</div>
              <h3>Select an Email</h3>
              <p>Click an email from the list to read it, or compose a new one.</p>
              <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap">
                <button id="email-empty-compose" class="btn btn-primary btn-sm"><i class="fas fa-pen"></i> Compose New</button>
                <button id="email-empty-summarize" class="btn btn-accent btn-sm"><i class="fas fa-robot"></i> Summarize Inbox</button>
              </div>
            </div>
            <div id="email-detail-content" style="display:none"></div>
            <div id="email-compose-form" style="display:none"></div>
          </div>

        </div>
      </div>
    `;

    // Load emails
    this.fetchEmails('INBOX');
    this.setupEvents(container);
  },

  getLabelIcon(label) {
    const icons = {
      INBOX: '📥', UNREAD: '🔵', STARRED: '⭐', IMPORTANT: '🔴', SENT: '📤', DRAFT: '📝'
    };
    return icons[label] || '📨';
  },

  setupEvents(container) {
    // Label filter chips
    container.querySelectorAll('.email-label-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.email-label-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filters.label = chip.dataset.label;
        this.fetchEmails(this.filters.label);
      });
    });

    // Search
    const searchInput = container.querySelector('#email-search');
    searchInput?.addEventListener('input', (e) => {
      this.filters.query = e.target.value;
      this.fetchEmails(this.filters.label);
    });
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.fetchEmails(this.filters.label);
    });

    // Compose
    container.querySelector('#email-compose-btn')?.addEventListener('click', () => this.showCompose());
    container.querySelector('#email-empty-compose')?.addEventListener('click', () => this.showCompose());

    // Refresh
    container.querySelector('#email-refresh-btn')?.addEventListener('click', () => this.fetchEmails(this.filters.label));

    // AI Summarize
    container.querySelector('#email-summarize-btn')?.addEventListener('click', () => this.aiSummarizeInbox());
    container.querySelector('#email-empty-summarize')?.addEventListener('click', () => this.aiSummarizeInbox());
  },

  // -------------------------------------------------------
  // Fetch emails from Gmail
  // -------------------------------------------------------
  async fetchEmails(label) {
    this.filters.label = label;
    const listEl = document.getElementById('email-list');
    if (!listEl) return;

    listEl.innerHTML = `
      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-tertiary)">
        <div class="spinner" style="margin:0 auto var(--space-md)"></div>
        <p>Loading ${label}...</p>
      </div>
    `;

    try {
      // First try Gmail integration
      const result = await this.callGmailAPI('fetch', { label, query: this.filters.query, limit: this.filters.limit });
      
      if (result && result.emails) {
        this.emails = result.emails.map(e => ({
          id: e.id,
          threadId: e.threadId,
          from: e.from || 'Unknown',
          subject: e.subject || '(No Subject)',
          snippet: e.snippet || '',
          date: e.date || '',
          unread: e.unread || false,
          starred: e.starred || false,
          body: e.body || '',
        }));
        this.renderEmailList(listEl);
      } else {
        throw new Error('No emails returned');
      }
    } catch (err) {
      // Show demo / connect prompt
      listEl.innerHTML = `
        <div style="text-align:center;padding:var(--space-xl);color:var(--text-tertiary)">
          <div style="font-size:2rem;margin-bottom:var(--space-sm)">🔌</div>
          <p style="font-weight:600;color:var(--text-secondary)">Gmail Not Connected</p>
          <p style="font-size:var(--font-size-xs);margin:var(--space-sm) 0">Connect your Gmail account to fetch, read, and send emails</p>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('settings')">
            <i class="fas fa-link"></i> Connect Gmail in Settings
          </button>
        </div>
      `;
    }
  },

  async callGmailAPI(action, params = {}) {
    // This would call the backend proxy which uses Gmail integration tool
    try {
      const r = await fetch('/api/email/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (r.ok) return await r.json();
      throw new Error('API unavailable');
    } catch {
      // Fallback: try direct integration tool (won't work in browser, but good for future)
      return null;
    }
  },

  renderEmailList(listEl) {
    if (this.emails.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:var(--space-2xl);color:var(--text-tertiary)">
          <p>No emails found</p>
        </div>`;
      return;
    }

    listEl.innerHTML = this.emails.map((email, i) => `
      <div class="email-item ${email.unread ? 'unread' : ''} ${this.selectedEmail?.id === email.id ? 'selected' : ''}" 
           data-id="${email.id}" data-index="${i}"
           style="padding:var(--space-sm) var(--space-md);cursor:pointer;border-radius:var(--radius-md);margin-bottom:2px;transition:all var(--transition-fast);${email.unread ? 'font-weight:700' : ''}${this.selectedEmail?.id === email.id ? 'background:var(--surface-2);border-left:3px solid var(--primary)' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-sm)">
          <span style="font-size:var(--font-size-xs);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${this.escapeHtml(email.from)}</span>
          <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);white-space:nowrap">${this.formatDate(email.date)}</span>
        </div>
        <div style="font-size:var(--font-size-sm);margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${email.starred ? '⭐ ' : ''}${email.unread ? '🔵 ' : ''}${this.escapeHtml(email.subject)}
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${this.escapeHtml(email.snippet)}
        </div>
      </div>
    `).join('');

    // Click handler
    listEl.querySelectorAll('.email-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        this.selectedEmail = this.emails[idx];
        this.showEmailDetail(this.selectedEmail);
        this.renderEmailList(listEl);
      });
    });
  },

  // -------------------------------------------------------
  // Email Detail View
  // -------------------------------------------------------
  showEmailDetail(email) {
    const emptyEl = document.getElementById('email-detail-empty');
    const contentEl = document.getElementById('email-detail-content');
    const composeEl = document.getElementById('email-compose-form');
    
    if (emptyEl) emptyEl.style.display = 'none';
    if (composeEl) composeEl.style.display = 'none';
    if (!contentEl) return;

    contentEl.style.display = 'block';
    contentEl.innerHTML = `
      <div style="margin-bottom:var(--space-lg)">
        <h2 style="margin-bottom:var(--space-xs);font-size:var(--font-size-xl)">${this.escapeHtml(email.subject)}</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-sm)">
          <div>
            <p style="font-weight:600;margin:0">${this.escapeHtml(email.from)}</p>
            <p style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin:0">${email.date}</p>
          </div>
          <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap">
            <button class="btn btn-sm btn-secondary" id="email-reply-btn">
              <i class="fas fa-reply"></i> Reply
            </button>
            <button class="btn btn-sm btn-accent" id="email-ai-reply-btn">
              <i class="fas fa-robot"></i> AI Reply
            </button>
            <button class="btn btn-sm btn-secondary" id="email-summarize-single-btn">
              <i class="fas fa-compress"></i> Summarize
            </button>
          </div>
        </div>
      </div>
      <hr style="border-color:var(--border-color);margin-bottom:var(--space-lg)">
      <div class="email-body" style="line-height:1.8;color:var(--text-primary);white-space:pre-wrap">
        ${this.formatBody(email.body || email.snippet)}
      </div>
    `;

    // Action buttons
    document.getElementById('email-reply-btn')?.addEventListener('click', () => this.showCompose(email));
    document.getElementById('email-ai-reply-btn')?.addEventListener('click', () => this.aiReply(email));
    document.getElementById('email-summarize-single-btn')?.addEventListener('click', () => this.aiSummarizeSingle(email));
  },

  // -------------------------------------------------------
  // Compose
  // -------------------------------------------------------
  showCompose(replyTo = null) {
    const emptyEl = document.getElementById('email-detail-empty');
    const contentEl = document.getElementById('email-detail-content');
    const composeEl = document.getElementById('email-compose-form');
    
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    if (!composeEl) return;
    this.composing = true;

    const toVal = replyTo ? replyTo.from.match(/<(.+)>/) ? replyTo.from.match(/<(.+)>/)[1] : replyTo.from : '';
    const subjectVal = replyTo ? `Re: ${replyTo.subject}` : '';

    composeEl.style.display = 'block';
    composeEl.innerHTML = `
      <h3 style="margin-bottom:var(--space-md)">
        ${replyTo ? '<i class="fas fa-reply"></i> Reply' : '<i class="fas fa-pen"></i> Compose Email'}
      </h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <input id="compose-to" type="email" placeholder="To" value="${toVal}" 
          style="padding:var(--space-sm) var(--space-md);background:var(--surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);width:100%">
        <input id="compose-subject" type="text" placeholder="Subject" value="${subjectVal}"
          style="padding:var(--space-sm) var(--space-md);background:var(--surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);width:100%">
        <textarea id="compose-body" placeholder="Write your message..." rows="8"
          style="padding:var(--space-md);background:var(--surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);width:100%;resize:vertical;min-height:200px;font-family:var(--font-family)"></textarea>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <button id="compose-send-btn" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i> Send</button>
          <button id="compose-ai-draft-btn" class="btn btn-accent btn-sm"><i class="fas fa-robot"></i> AI Draft</button>
          <button id="compose-cancel-btn" class="btn btn-secondary btn-sm">Cancel</button>
        </div>
        <div id="compose-ai-preview" style="display:none;margin-top:var(--space-md);padding:var(--space-md);background:var(--surface-1);border-radius:var(--radius-md)"></div>
      </div>
    `;

    document.getElementById('compose-cancel-btn')?.addEventListener('click', () => {
      this.composing = false;
      composeEl.style.display = 'none';
      if (this.selectedEmail) this.showEmailDetail(this.selectedEmail);
      else {
        const emptyEl = document.getElementById('email-detail-empty');
        if (emptyEl) emptyEl.style.display = 'block';
      }
    });

    document.getElementById('compose-send-btn')?.addEventListener('click', () => this.sendEmail());
    document.getElementById('compose-ai-draft-btn')?.addEventListener('click', () => this.aiDraftEmail());
  },

  async sendEmail() {
    const to = document.getElementById('compose-to')?.value.trim();
    const subject = document.getElementById('compose-subject')?.value.trim();
    const body = document.getElementById('compose-body')?.value.trim();

    if (!to) { Toast.warning('Please enter a recipient'); return; }
    if (!subject) { Toast.warning('Please enter a subject'); return; }

    Toast.info('Sending...');

    try {
      const r = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body })
      });
      if (r.ok) {
        Toast.success('Email sent! ✓');
        this.composing = false;
        document.getElementById('email-compose-form').style.display = 'none';
        window.scrollTo(0, 0);
      } else {
        throw new Error('Send failed');
      }
    } catch {
      // Demo mode
      Toast.success('Email composed (demo mode)');
      this.composing = false;
      document.getElementById('email-compose-form').style.display = 'none';
    }
  },

  // -------------------------------------------------------
  // AI Features
  // -------------------------------------------------------
  async aiDraftEmail() {
    const subject = document.getElementById('compose-subject')?.value.trim();
    const previewEl = document.getElementById('compose-ai-preview');
    if (!previewEl) return;

    previewEl.style.display = 'block';
    previewEl.innerHTML = '<div class="spinner" style="margin:0 auto"></div><p style="text-align:center;color:var(--text-tertiary)">AI drafting...</p>';

    try {
      const draft = await API.chat(
        `Write a professional email with this subject: "${subject}". Keep it concise, friendly, and well-formatted. Use a proper greeting and sign-off.`,
        { agent: 'document' }
      );
      previewEl.innerHTML = `
        <p style="font-size:var(--font-size-xs);color:var(--accent);margin-bottom:var(--space-sm)">🤖 AI Draft:</p>
        <div style="white-space:pre-wrap;line-height:1.7">${draft}</div>
        <button id="use-ai-draft-btn" class="btn btn-sm btn-accent" style="margin-top:var(--space-sm)">
          <i class="fas fa-check"></i> Use This Draft
        </button>
      `;
      document.getElementById('use-ai-draft-btn')?.addEventListener('click', () => {
        const bodyEl = document.getElementById('compose-body');
        if (bodyEl) bodyEl.value = draft;
        previewEl.style.display = 'none';
      });
    } catch {
      previewEl.innerHTML = '<p style="color:var(--danger)">Failed to generate draft</p>';
    }
  },

  async aiReply(email) {
    const detailEl = document.getElementById('email-detail-content');
    if (!detailEl) return;

    // Show loading in detail
    detailEl.insertAdjacentHTML('beforeend', `
      <div id="ai-reply-section" style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--surface-1);border-radius:var(--radius-md)">
        <div class="spinner" style="margin:var(--space-md) auto"></div>
        <p style="text-align:center;color:var(--text-tertiary)">AI analyzing email & drafting reply...</p>
      </div>
    `);

    try {
      const reply = await API.chat(
        `Here is an email I received:\n\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body || email.snippet}\n\nDraft a professional, concise reply to this email. Include a proper greeting and sign-off.`,
        { agent: 'document' }
      );

      document.getElementById('ai-reply-section')?.remove();
      detailEl.insertAdjacentHTML('beforeend', `
        <div id="ai-reply-section" style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--surface-1);border-radius:var(--radius-md)">
          <p style="font-size:var(--font-size-xs);color:var(--accent);margin-bottom:var(--space-sm)">🤖 AI Suggested Reply:</p>
          <div style="white-space:pre-wrap;line-height:1.7">${reply}</div>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm)">
            <button id="use-ai-reply-btn" class="btn btn-sm btn-accent"><i class="fas fa-reply"></i> Reply with This</button>
            <button id="dismiss-ai-reply-btn" class="btn btn-sm btn-secondary">Dismiss</button>
          </div>
        </div>
      `);

      document.getElementById('use-ai-reply-btn')?.addEventListener('click', () => {
        this.showCompose(email);
        setTimeout(() => {
          const bodyEl = document.getElementById('compose-body');
          if (bodyEl) bodyEl.value = reply;
        }, 300);
      });
      document.getElementById('dismiss-ai-reply-btn')?.addEventListener('click', () => {
        document.getElementById('ai-reply-section')?.remove();
      });
    } catch {
      document.getElementById('ai-reply-section')?.innerHTML = '<p style="color:var(--danger)">Failed. Is the server running?</p>';
    }
  },

  async aiSummarizeSingle(email) {
    const detailEl = document.getElementById('email-detail-content');
    if (!detailEl) return;

    detailEl.insertAdjacentHTML('beforeend', `
      <div id="ai-summary-section" style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--surface-1);border-radius:var(--radius-md)">
        <div class="spinner" style="margin:var(--space-md) auto"></div>
        <p style="text-align:center;color:var(--text-tertiary)">AI summarizing...</p>
      </div>
    `);

    try {
      const summary = await API.chat(
        `Summarize this email in 3 bullet points:\n\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body || email.snippet}`,
        { agent: 'research' }
      );
      document.getElementById('ai-summary-section')?.remove();
      detailEl.insertAdjacentHTML('beforeend', `
        <div id="ai-summary-section" style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--surface-1);border-radius:var(--radius-md);border-left:3px solid var(--accent)">
          <p style="font-size:var(--font-size-xs);color:var(--accent);margin-bottom:var(--space-sm)">🤖 AI Summary:</p>
          <div style="line-height:1.7">${marked.parse(summary)}</div>
        </div>
      `);
    } catch {
      document.getElementById('ai-summary-section')?.innerHTML = '<p style="color:var(--danger)">Failed</p>';
    }
  },

  async aiSummarizeInbox() {
    const detailEl = document.getElementById('email-detail-content');
    const emptyEl = document.getElementById('email-detail-empty');
    if (emptyEl) emptyEl.style.display = 'none';
    if (!detailEl) return;
    detailEl.style.display = 'block';

    if (this.emails.length === 0) {
      detailEl.innerHTML = '<p style="color:var(--text-tertiary);text-align:center;padding:var(--space-2xl)">No emails loaded. Connect Gmail first.</p>';
      return;
    }

    detailEl.innerHTML = `
      <div style="text-align:center;padding:var(--space-2xl)">
        <div class="spinner" style="margin:0 auto var(--space-md)"></div>
        <p>AI is analyzing your inbox...</p>
      </div>
    `;

    const emailList = this.emails.slice(0, 10).map(e =>
      `- From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet}`
    ).join('\n');

    try {
      const summary = await API.chat(
        `Analyze these emails from my inbox and provide:\n1. A brief overview of what's happening\n2. Any urgent/important emails that need attention\n3. Suggested priorities\n\nEmails:\n${emailList}`,
        { agent: 'research' }
      );
      detailEl.innerHTML = `
        <h3 style="margin-bottom:var(--space-md)">🤖 AI Inbox Analysis</h3>
        <div class="doc-preview" style="line-height:1.8">${marked.parse(summary)}</div>
        <button id="back-to-list-btn" class="btn btn-sm btn-secondary" style="margin-top:var(--space-md)">Back to List</button>
      `;
      document.getElementById('back-to-list-btn')?.addEventListener('click', () => {
        if (this.selectedEmail) this.showEmailDetail(this.selectedEmail);
        else {
          detailEl.style.display = 'none';
          if (emptyEl) emptyEl.style.display = 'block';
        }
      });
    } catch {
      detailEl.innerHTML = '<p style="color:var(--danger);text-align:center">Failed. Is the server running?</p>';
    }
  },

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
      if (diff < 86400000) return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      if (diff < 604800000) return d.toLocaleDateString([], {weekday:'short'});
      return d.toLocaleDateString([], {month:'short',day:'numeric'});
    } catch { return dateStr; }
  },

  formatBody(body) {
    if (!body) return '(No content)';
    // Truncate very long emails
    if (body.length > 5000) return body.slice(0, 5000) + '\n\n... [truncated]';
    return body;
  }
};
