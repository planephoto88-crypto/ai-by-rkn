/* ============================================
   AI Scanner Utility — File & Paste Processing
   Reads files, images, or clipboard content
   and prepares them for AI analysis
   ============================================ */
const Scanner = {

  // File type detection
  TYPE_MAP: {
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'],
    text: ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'rs', 'go', 'ts'],
    pdf: ['pdf'],
    office: ['docx', 'pptx', 'xlsx']
  },

  getType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    for (const [type, extensions] of Object.entries(this.TYPE_MAP)) {
      if (extensions.includes(ext)) return type;
    }
    return 'other';
  },

  // -------------------------------------------------------
  // Main scan entry — pick files or paste content
  // -------------------------------------------------------
  async scan(options = {}) {
    const { mode = 'file', accept = '*', multiple = true } = options;
    
    if (mode === 'paste') {
      return await this.scanClipboard();
    }
    return await this.scanFiles(accept, multiple);
  },

  // File-based scan
  async scanFiles(accept = '*', multiple = true) {
    return new Promise((resolve, reject) => {
      const input = document.getElementById('scan-file-input');
      if (!input) return reject(new Error('File input not found'));

      input.accept = accept;
      input.multiple = multiple;
      input.value = ''; // reset
      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return resolve([]);

        const results = [];
        for (const file of files) {
          const type = this.getType(file.name);
          let content = '';

          if (type === 'text') {
            content = await this.readTextFile(file);
          } else if (type === 'image') {
            content = await this.readImageBase64(file);
            content = `[IMAGE: ${file.name} (${(file.size/1024).toFixed(1)} KB)]\nBase64 length: ${content.length} chars`;
          } else if (type === 'pdf') {
            content = `[PDF DOCUMENT: ${file.name} (${(file.size/1024).toFixed(1)} KB)]\nNote: PDF text extraction limited in browser. Upload to a PDF tool first.`;
          } else {
            content = `[FILE: ${file.name} (${(file.size/1024).toFixed(1)} KB)]\nType: ${type}\nBinary content — unable to extract text in browser.`;
          }

          results.push({
            name: file.name,
            size: file.size,
            type,
            content,
            file
          });
        }
        resolve(results);
      };
      input.click();
    });
  },

  // Clipboard scan
  async scanClipboard() {
    try {
      const items = await navigator.clipboard.read();
      const results = [];

      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const base64 = await this.blobToBase64(blob);
            results.push({
              name: 'clipboard-image.png',
              type: 'image',
              content: `[CLIPBOARD IMAGE]\nBase64 length: ${base64.length} chars`,
              base64
            });
          } else if (type === 'text/plain') {
            const blob = await item.getType(type);
            const text = await blob.text();
            results.push({
              name: 'clipboard-text.txt',
              type: 'text',
              content: text
            });
          }
        }
      }

      if (results.length === 0) {
        // Fallback: read from textarea
        throw new Error('No clipboard content found');
      }
      return results;
    } catch (err) {
      // Clipboard API not available — prompt for paste
      return await this.promptPaste();
    }
  },

  // Fallback paste dialog
  async promptPaste() {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById('paste-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'paste-modal';
      modal.className = 'modal glass-heavy';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="max-width:600px">
          <div class="modal-header">
            <h2><i class="fas fa-paste"></i> Paste Content</h2>
            <button class="modal-close icon-btn" id="paste-close">&times;</button>
          </div>
          <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-md)">
            <p style="color:var(--text-secondary);font-size:var(--font-size-sm)">
              Paste text, code, or data below. The AI will analyze it and respond.
            </p>
            <textarea id="paste-textarea" style="min-height:200px;resize:vertical;padding:var(--space-md);border-radius:var(--radius-md);background:var(--surface-1);color:var(--text-primary);border:1px solid var(--border-color);font-family:var(--font-mono);font-size:var(--font-size-sm)" placeholder="Paste your content here..."></textarea>
            <div style="display:flex;gap:var(--space-sm);justify-content:flex-end">
              <button id="paste-cancel" class="btn btn-secondary">Cancel</button>
              <button id="paste-submit" class="btn btn-primary"><i class="fas fa-robot"></i> Scan & Analyze</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const cleanup = () => { modal.remove(); };
      modal.querySelector('.modal-overlay').onclick = cleanup;
      modal.querySelector('#paste-close').onclick = cleanup;
      modal.querySelector('#paste-cancel').onclick = cleanup;

      modal.querySelector('#paste-submit').onclick = () => {
        const text = modal.querySelector('#paste-textarea').value.trim();
        cleanup();
        if (text) {
          resolve([{ name: 'pasted-content.txt', type: 'text', content: text }]);
        } else {
          reject(new Error('No content pasted'));
        }
      };

      // Auto-focus textarea
      setTimeout(() => modal.querySelector('#paste-textarea').focus(), 150);
    });
  },

  // -------------------------------------------------------
  // Send scanned content to AI for processing
  // -------------------------------------------------------
  async processWithAI(scannedItems, agentType = 'research') {
    if (!scannedItems || scannedItems.length === 0) {
      throw new Error('No content to process');
    }

    const prompts = scannedItems.map((item, i) => {
      let prefix = `**📎 Scanned Item ${i+1}:** ${item.name} (${item.type})\n`;
      
      if (item.type === 'image') {
        return prefix + 'Please analyze this image and describe its contents, key details, and any actionable insights.';
      }
      if (item.type === 'pdf') {
        return prefix + 'This is a PDF document. Please acknowledge and explain what you would need to provide a thorough analysis.';
      }
      // Text — include up to 8000 chars
      const snippet = item.content.slice(0, 8000);
      return `**📎 Scanned: ${item.name}**\n\n${snippet}\n\n---\nAnalyze the above content. ${this.getAnalysisPrompt(agentType)}`;
    });

    // Use the backend API
    const combinedPrompt = prompts.join('\n\n---\n\n');

    try {
      return await API.chat(combinedPrompt, { agent: agentType });
    } catch {
      // Fallback
      return await GeminiAPI.call(combinedPrompt, { agentType });
    }
  },

  getAnalysisPrompt(agentType) {
    const prompts = {
      research: 'Provide a thorough analysis: key findings, important details, patterns, and recommendations.',
      study: 'Convert this into study notes with flashcards (Q&A format), key concepts, and a summary.',
      coding: 'Review this code. Identify issues, suggest improvements, and explain the logic.',
      planning: 'Extract actionable tasks, create a plan, and identify priorities.',
      document: 'Summarize this content professionally with clear sections and key takeaways.'
    };
    return prompts[agentType] || prompts.research;
  },

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  readImageBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
};
