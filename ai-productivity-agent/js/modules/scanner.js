/* ============================================
   AI Scanner Module — Scan files/paste & analyze
   ============================================ */
const ScannerModule = {
  scanHistory: [],
  totalScanned: 0,

  async render(container) {
    this.loadHistory();
    container.innerHTML = `
      <div class="scanner-page">
        <!-- Hero Section -->
        <div class="scanner-hero card glass" style="text-align:center;padding:var(--space-2xl);margin-bottom:var(--space-lg)">
          <div class="scanner-icon" style="font-size:3rem;margin-bottom:var(--space-md);animation:float 3s ease-in-out infinite">
            📡
          </div>
          <h2 style="margin-bottom:var(--space-sm)">AI Scanner & Analyzer</h2>
          <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-lg)">
            Scan files, paste content, or upload images — the AI will process and intelligently respond.
          </p>
          <div class="scan-actions" style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap">
            <button id="scan-file-btn" class="btn btn-primary btn-lg">
              <i class="fas fa-upload"></i> Upload Files
            </button>
            <button id="scan-paste-btn" class="btn btn-accent btn-lg">
              <i class="fas fa-paste"></i> Paste Content
            </button>
            <button id="scan-image-btn" class="btn btn-secondary btn-lg">
              <i class="fas fa-image"></i> Scan Image
            </button>
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:var(--space-md)">
            Supports: Images (JPG, PNG, WebP) · Documents (PDF, DOCX) · Text (TXT, MD, CSV, JSON) · Code (JS, PY, HTML, CSS)
          </p>
        </div>

        <!-- Results Area -->
        <div id="scan-results" class="scan-results" style="display:none;">
          <div class="card glass" style="padding:var(--space-lg);margin-bottom:var(--space-lg)">
            <div class="scan-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">
              <h3>📋 Scanned Files</h3>
              <div id="scan-file-list" style="display:flex;gap:var(--space-sm);flex-wrap:wrap"></div>
            </div>
            <div class="scan-status" id="scan-status" style="padding:var(--space-md);text-align:center;color:var(--text-secondary)">
              <div class="spinner" style="margin:0 auto var(--space-sm)"></div>
              Processing with AI...
            </div>
            <div id="scan-response" class="scan-response" style="display:none"></div>
          </div>
        </div>

        <!-- AI Agent Picker -->
        <div class="card glass" style="padding:var(--space-lg);margin-bottom:var(--space-lg)">
          <h4 style="margin-bottom:var(--space-sm)">Choose Analysis Type</h4>
          <div class="agent-chips" style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
            <button class="agent-chip active" data-agent="research">
              <i class="fas fa-search"></i> Research
            </button>
            <button class="agent-chip" data-agent="study">
              <i class="fas fa-graduation-cap"></i> Study
            </button>
            <button class="agent-chip" data-agent="coding">
              <i class="fas fa-code"></i> Code Review
            </button>
            <button class="agent-chip" data-agent="planning">
              <i class="fas fa-tasks"></i> Task Planning
            </button>
            <button class="agent-chip" data-agent="document">
              <i class="fas fa-file-alt"></i> Summarize
            </button>
          </div>
        </div>

        <!-- History -->
        <div class="card glass" style="padding:var(--space-lg)">
          <h3 style="margin-bottom:var(--space-md)">
            <i class="fas fa-history"></i> Scan History 
            <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">(${this.totalScanned} total)</span>
          </h3>
          <div id="scan-history" class="scan-history">
            ${this.renderHistory()}
          </div>
          ${this.scanHistory.length > 0 ? `<button id="clear-scan-history" class="btn btn-sm btn-danger" style="margin-top:var(--space-md)">Clear History</button>` : ''}
        </div>
      </div>
    `;

    this.setupEvents(container);
  },

  setupEvents(container) {
    // File scan
    container.querySelector('#scan-file-btn')?.addEventListener('click', () => this.triggerFileScan());

    // Paste scan
    container.querySelector('#scan-paste-btn')?.addEventListener('click', () => this.triggerPasteScan());

    // Image scan
    container.querySelector('#scan-image-btn')?.addEventListener('click', () => this.triggerImageScan());

    // Agent chips
    container.querySelectorAll('.agent-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.agent-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Clear history
    container.querySelector('#clear-scan-history')?.addEventListener('click', () => {
      this.scanHistory = [];
      this.totalScanned = 0;
      this.saveHistory();
      Toast.success('Scan history cleared');
      this.render(container);
    });
  },

  getSelectedAgent(container) {
    const active = container?.querySelector('.agent-chip.active');
    return active?.dataset.agent || 'research';
  },

  // -------------------------------------------------------
  // Trigger actions
  // -------------------------------------------------------
  async triggerFileScan() {
    try {
      const files = await Scanner.scanFiles('*', true);
      await this.processFiles(files);
    } catch (err) {
      Toast.warning(err.message || 'File scan cancelled');
    }
  },

  async triggerPasteScan() {
    try {
      const items = await Scanner.scanClipboard();
      await this.processFiles(items);
    } catch (err) {
      Toast.warning(err.message || 'Paste cancelled');
    }
  },

  async triggerImageScan() {
    try {
      const files = await Scanner.scanFiles('image/*', true);
      await this.processFiles(files);
    } catch (err) {
      Toast.warning(err.message || 'Image scan cancelled');
    }
  },

  async processFiles(files) {
    if (!files || files.length === 0) return;

    const container = document.querySelector('#scan-results');
    const status = document.querySelector('#scan-status');
    const response = document.querySelector('#scan-response');
    const fileList = document.querySelector('#scan-file-list');

    if (!container || !status) return;

    // Show results area
    container.style.display = 'block';
    response.style.display = 'none';
    status.innerHTML = '<div class="spinner" style="margin:0 auto var(--space-sm)"></div>Processing with AI...';

    // Show file chips
    if (fileList) {
      fileList.innerHTML = files.map(f => `
        <span class="file-chip glass" style="display:inline-flex;align-items:center;gap:var(--space-xs);padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-full);font-size:var(--font-size-xs)">
          <i class="fas ${this.getFileIcon(f.type)}"></i> ${f.name}
        </span>
      `).join('');
    }

    // Get agent type
    const agentType = this.getSelectedAgent(document.querySelector('#page-content'));
    
    try {
      const result = await Scanner.processWithAI(files, agentType);
      this.addToHistory(files, result, agentType);
      status.style.display = 'none';
      response.style.display = 'block';
      response.innerHTML = `
        <div class="ai-response markdown-content" style="max-height:600px;overflow-y:auto">
          ${marked.parse(result)}
        </div>
        <div style="margin-top:var(--space-md);display:flex;gap:var(--space-sm)">
          <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(this.closest('.scan-response').querySelector('.ai-response').innerText); Toast.success('Copied!')">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
      `;
    } catch (err) {
      status.innerHTML = `<div style="color:var(--danger)">❌ Error: ${err.message}</div>`;
    }

    // Re-render history
    this.refreshHistory();
  },

  getFileIcon(type) {
    const icons = { image: 'fa-image', text: 'fa-file-alt', pdf: 'fa-file-pdf', office: 'fa-file-word' };
    return icons[type] || 'fa-file';
  },

  // -------------------------------------------------------
  // History
  // -------------------------------------------------------
  addToHistory(files, result, agentType) {
    this.scanHistory.unshift({
      id: Date.now(),
      files: files.map(f => ({ name: f.name, type: f.type })),
      agentType,
      preview: result.slice(0, 200).replace(/[#*`]/g, ''),
      timestamp: new Date().toISOString()
    });
    if (this.scanHistory.length > 50) this.scanHistory.pop();
    this.totalScanned++;
    this.saveHistory();
  },

  renderHistory() {
    if (this.scanHistory.length === 0) {
      return '<p style="color:var(--text-tertiary);text-align:center;padding:var(--space-xl)">No scans yet. Upload a file or paste content to get started.</p>';
    }
    return this.scanHistory.map(h => `
      <div class="history-item glass" style="padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);margin-bottom:var(--space-sm);display:flex;align-items:center;gap:var(--space-md)">
        <div style="font-size:var(--font-size-xs);color:var(--text-tertiary);min-width:60px">
          ${new Date(h.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:var(--space-xs);margin-bottom:2px">
            ${h.files.map(f => `<span style="font-size:var(--font-size-xs);color:var(--accent)">📎 ${f.name}</span>`).join('')}
            <span class="badge" style="font-size:10px;background:var(--primary);color:#fff;padding:1px 6px;border-radius:var(--radius-full)">${h.agentType}</span>
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${h.preview}
          </p>
        </div>
      </div>
    `).join('');
  },

  refreshHistory() {
    const hist = document.querySelector('#scan-history');
    const page = document.querySelector('#page-content');
    if (hist) {
      hist.innerHTML = this.renderHistory();
      const clearBtn = document.querySelector('#clear-scan-history');
      if (!clearBtn && this.scanHistory.length > 0) {
        const card = hist.closest('.card');
        if (card) card.insertAdjacentHTML('beforeend', 
          '<button id="clear-scan-history" class="btn btn-sm btn-danger" style="margin-top:var(--space-md)">Clear History</button>');
      }
    }
  },

  loadHistory() {
    this.scanHistory = Storage.get('scan_history', []);
    this.totalScanned = Storage.get('scan_total', 0);
  },

  saveHistory() {
    Storage.set('scan_history', this.scanHistory);
    Storage.set('scan_total', this.totalScanned);
  }
};
