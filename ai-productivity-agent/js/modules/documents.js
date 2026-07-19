/* ============================================
   Documents Module - AI Document Generator with Chat History
   ============================================ */
const DocumentsModule = {
  activeDocType: 'essay',
  module: 'documents',
  
  render(container) {
    const documents = Storage.get('documents', []);
    
    container.innerHTML = `
      <div class="page-header">
        <h2>📄 Document Generator</h2>
        <p>Generate essays, reports, presentations, and study notes with AI</p>
      </div>
      
      <!-- Document Type Tabs -->
      <div class="tabs mb-lg">
        <button class="tab active" data-doc-type="essay" onclick="DocumentsModule.switchType('essay')">
          📝 Essay
        </button>
        <button class="tab" data-doc-type="report" onclick="DocumentsModule.switchType('report')">
          📊 Report
        </button>
        <button class="tab" data-doc-type="presentation" onclick="DocumentsModule.switchType('presentation')">
          📽️ Presentation
        </button>
        <button class="tab" data-doc-type="notes" onclick="DocumentsModule.switchType('notes')">
          📒 Study Notes
        </button>
      </div>
      
      <div class="grid-2">
        <!-- Generator -->
        <div class="glass-card">
          <h3 class="card-title mb-md" id="doc-type-title">Generate Essay</h3>
          <div id="doc-generator-form"></div>
          <div id="doc-result" class="mt-md"></div>
        </div>
        
        <!-- Saved Documents + Recent Generations History -->
        <div class="flex-col gap-md" style="max-height:600px;overflow:hidden">
          <!-- Recent Generations History -->
          <div class="glass-card" style="overflow-y:auto;max-height:250px">
            <div class="card-header">
              <h3 class="card-title">📜 Recent Generations</h3>
              <button class="btn btn-sm btn-secondary" onclick="DocumentsModule.clearDocHistory()" title="Clear history">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div id="doc-history-list" class="flex-col gap-sm">
              ${ChatHistory.getAll('documents').length === 0 ? `<div class="empty-state" style="padding:var(--space-md)">
                <i class="fas fa-history" style="font-size:1.5rem"></i>
                <p style="margin:0;font-size:var(--font-size-xs)">No recent generations</p>
              </div>` : ChatHistory.getRecent('documents', 10).map(h => `
                <div class="card" style="padding:var(--space-sm) var(--space-md);cursor:pointer" 
                     onclick="DocumentsModule.loadDocHistory('${h.id}')">
                  <div class="flex-between">
                    <span style="font-weight:500;font-size:var(--font-size-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">
                      ${Helpers.escapeHtml(Helpers.truncate(h.title, 35))}
                    </span>
                    <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);white-space:nowrap">${Helpers.timeAgo(h.updatedAt)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Saved Documents -->
          <div class="glass-card" style="flex:1;overflow-y:auto">
            <div class="card-header">
              <h3 class="card-title">📁 Saved Documents</h3>
            </div>
            <div id="saved-docs-list" class="flex-col gap-sm">
              ${documents.length === 0 ? `<div class="empty-state" style="padding:var(--space-lg)">
                <i class="fas fa-file-alt" style="font-size:1.5rem"></i>
                <p style="margin:0;font-size:var(--font-size-xs)">No saved documents</p>
              </div>` : documents.map(d => `
                <div class="card" style="padding:var(--space-md);cursor:pointer" 
                     onclick="DocumentsModule.loadDocument('${d.id}')">
                  <div style="font-weight:600;font-size:var(--font-size-sm)">
                    ${Helpers.escapeHtml(Helpers.truncate(d.title, 40))}
                  </div>
                  <div class="flex-between mt-sm">
                    <span class="badge badge-info">${d.type}</span>
                    <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${Helpers.timeAgo(d.createdAt)}</span>
                  </div>
                  <button class="btn btn-sm btn-danger mt-sm" style="width:100%"
                    onclick="event.stopPropagation();DocumentsModule.deleteDocument('${d.id}')">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.renderGeneratorForm();
  },
  
  switchType(type) {
    this.activeDocType = type;
    $$('[data-doc-type]').forEach(t => {
      t.classList.toggle('active', t.dataset.docType === type);
    });
    const titles = { essay: 'Generate Essay', report: 'Generate Report', presentation: 'Create Presentation', notes: 'Generate Study Notes' };
    const titleEl = $('#doc-type-title');
    if (titleEl) titleEl.textContent = titles[type];
    this.renderGeneratorForm();
  },
  
  renderGeneratorForm() {
    const form = $('#doc-generator-form');
    if (!form) return;
    
    switch (this.activeDocType) {
      case 'essay':
        form.innerHTML = `
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Essay Topic</label>
            <input type="text" id="doc-topic" class="glass-input" placeholder="e.g., The impact of AI on education">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Style</label>
            <select id="doc-style" class="glass-input">
              <option value="academic">Academic</option>
              <option value="persuasive">Persuasive</option>
              <option value="narrative">Narrative</option>
              <option value="descriptive">Descriptive</option>
              <option value="expository">Expository</option>
            </select>
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Approximate Length</label>
            <select id="doc-length" class="glass-input">
              <option value="short">Short (~500 words)</option>
              <option value="medium" selected>Medium (~1000 words)</option>
              <option value="long">Long (~2000 words)</option>
            </select>
            <button class="btn btn-primary" onclick="DocumentsModule.generate()">
              <i class="fas fa-magic"></i> Generate
            </button>
          </div>
        `;
        break;
      case 'report':
        form.innerHTML = `
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Report Topic</label>
            <input type="text" id="doc-topic" class="glass-input" placeholder="e.g., Q3 Marketing Performance">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Report Type</label>
            <select id="doc-style" class="glass-input">
              <option value="business">Business Report</option>
              <option value="technical">Technical Report</option>
              <option value="research">Research Report</option>
              <option value="progress">Progress Report</option>
            </select>
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Include Sections</label>
            <div class="flex-col gap-xs" style="font-size:var(--font-size-sm)">
              <label><input type="checkbox" checked> Executive Summary</label>
              <label><input type="checkbox" checked> Data Analysis</label>
              <label><input type="checkbox" checked> Recommendations</label>
              <label><input type="checkbox"> Charts & Graphs</label>
              <label><input type="checkbox"> Appendix</label>
            </div>
            <button class="btn btn-primary" onclick="DocumentsModule.generate()">
              <i class="fas fa-magic"></i> Generate
            </button>
          </div>
        `;
        break;
      case 'presentation':
        form.innerHTML = `
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Presentation Topic</label>
            <input type="text" id="doc-topic" class="glass-input" placeholder="e.g., Product Launch Strategy">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Number of Slides</label>
            <input type="number" id="doc-length-val" class="glass-input" value="10" min="5" max="30">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Tone</label>
            <select id="doc-style" class="glass-input">
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="educational">Educational</option>
              <option value="pitch">Pitch Deck</option>
            </select>
            <button class="btn btn-primary" onclick="DocumentsModule.generate()">
              <i class="fas fa-magic"></i> Generate Outline
            </button>
          </div>
        `;
        break;
      case 'notes':
        form.innerHTML = `
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Subject / Topic</label>
            <input type="text" id="doc-topic" class="glass-input" placeholder="e.g., World War II Causes">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Detail Level</label>
            <select id="doc-style" class="glass-input">
              <option value="summary">Summary Overview</option>
              <option value="detailed">Detailed Notes</option>
              <option value="revision">Revision Notes</option>
              <option value="bullet">Bullet Points</option>
            </select>
            <button class="btn btn-primary" onclick="DocumentsModule.generate()">
              <i class="fas fa-magic"></i> Generate Notes
            </button>
          </div>
        `;
        break;
    }
  },
  
  async generate() {
    const topic = $('#doc-topic')?.value.trim();
    if (!topic) { Toast.warning('Enter a topic'); return; }
    const style = $('#doc-style')?.value || '';
    const length = $('#doc-length')?.value || 'medium';
    const lengthVal = $('#doc-length-val')?.value || 10;
    const resultDiv = $('#doc-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div> Generating...';
    
    const typeLabels = { essay: 'essay', report: 'report', presentation: 'presentation outline', notes: 'study notes' };
    const lengthLabels = { short: 'short (~500 words)', medium: 'medium (~1000 words)', long: 'long (~2000 words)' };
    
    let prompt = '';
    switch (this.activeDocType) {
      case 'essay':
        prompt = `Write a ${style} essay on "${topic}". Length: ${lengthLabels[length]}.
Include: Introduction, Body (3-4 paragraphs), Conclusion. Use proper formatting and citations.`;
        break;
      case 'report':
        prompt = `Create a ${style} report on "${topic}".
Include: Executive Summary, Introduction, Analysis, Findings, Recommendations, and Conclusion.
Use professional formatting with sections and subsections.`;
        break;
      case 'presentation':
        prompt = `Create a ${style} presentation outline for "${topic}" with ${lengthVal} slides.
For each slide provide: Slide number, Title, Key points (3-5 bullets), Speaker notes. Format in markdown.`;
        break;
      case 'notes':
        prompt = `Create ${style} study notes on "${topic}".
Organize with clear headings, subheadings, key concepts in bold, examples, and a summary section.`;
        break;
    }
    
    try {
      const finalResponse = await GeminiAPI.call(prompt, { temperature: 0.7 });
      
      // Save to chat history
      const session = ChatHistory.create('documents', `${this.activeDocType}: ${topic.slice(0, 50)}`);
      ChatHistory.addMessage('documents', session.id, 'user', prompt);
      ChatHistory.addMessage('documents', session.id, 'agent', finalResponse);
      
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="doc-preview" style="max-height:500px;overflow-y:auto">${marked.parse(finalResponse)}</div>
          <div class="flex-row gap-sm mt-md">
            <button class="btn btn-primary btn-sm" onclick="DocumentsModule.saveDocument()">
              <i class="fas fa-save"></i> Save
            </button>
            <button class="btn btn-secondary btn-sm" onclick="DocumentsModule.copyDocument()">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
        `;
        resultDiv.dataset.content = finalResponse;
        resultDiv.dataset.topic = topic;
      }
      
      // Refresh history list
      this.renderDocHistory();
      Toast.success(`${typeLabels[this.activeDocType]} generated!`);
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  renderDocHistory() {
    const container = $('#doc-history-list');
    if (!container) return;
    const all = ChatHistory.getAll('documents');
    if (all.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-md)">
        <i class="fas fa-history" style="font-size:1.5rem"></i>
        <p style="margin:0;font-size:var(--font-size-xs)">No recent generations</p>
      </div>`;
      return;
    }
    container.innerHTML = all.slice(0, 10).map(h => `
      <div class="card" style="padding:var(--space-sm) var(--space-md);cursor:pointer" 
           onclick="DocumentsModule.loadDocHistory('${h.id}')">
        <div class="flex-between">
          <span style="font-weight:500;font-size:var(--font-size-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">
            ${Helpers.escapeHtml(Helpers.truncate(h.title, 35))}
          </span>
          <div class="flex-row gap-xs">
            <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);white-space:nowrap">${Helpers.timeAgo(h.updatedAt)}</span>
            <button class="icon-btn" style="width:18px;height:18px;font-size:8px" 
                    onclick="event.stopPropagation();DocumentsModule.deleteDocHistory('${h.id}')">
              <i class="fas fa-times" style="font-size:8px"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  loadDocHistory(id) {
    const msgs = ChatHistory.getMessages('documents', id);
    const agentMsg = msgs.find(m => m.role === 'agent');
    if (!agentMsg) return;
    const resultDiv = $('#doc-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="doc-preview" style="max-height:500px;overflow-y:auto">${marked.parse(agentMsg.content)}</div>
        <div class="flex-row gap-sm mt-md">
          <button class="btn btn-primary btn-sm" onclick="DocumentsModule.saveDocument()">
            <i class="fas fa-save"></i> Save
          </button>
          <button class="btn btn-secondary btn-sm" onclick="DocumentsModule.copyDocument()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
      `;
      resultDiv.dataset.content = agentMsg.content;
      resultDiv.dataset.topic = ChatHistory.getAll('documents').find(h => h.id === id)?.title || '';
    }
  },

  deleteDocHistory(id) {
    if (!confirm('Delete this generation from history?')) return;
    ChatHistory.delete('documents', id);
    this.renderDocHistory();
    Toast.success('History item deleted');
  },

  clearDocHistory() {
    if (!confirm('Clear all generation history?')) return;
    Storage.set('chatHistory', { ...Storage.get('chatHistory', {}), documents: [] });
    this.renderDocHistory();
    Toast.success('History cleared');
  },
  
  saveDocument() {
    const resultDiv = $('#doc-result');
    const content = resultDiv?.dataset.content;
    const topic = resultDiv?.dataset.topic;
    if (!content) { Toast.warning('Nothing to save'); return; }
    const documents = Storage.get('documents', []);
    documents.unshift({
      id: Helpers.uid(),
      title: topic || 'Untitled',
      type: this.activeDocType,
      content,
      createdAt: new Date().toISOString()
    });
    Storage.set('documents', documents);
    this.renderSavedDocs();
    Toast.success('Document saved!');
  },
  
  copyDocument() {
    const content = $('#doc-result')?.dataset.content;
    if (!content) return;
    Helpers.copyToClipboard(content);
    Toast.success('Copied!');
  },
  
  loadDocument(id) {
    const documents = Storage.get('documents', []);
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    const resultDiv = $('#doc-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="doc-preview" style="max-height:500px;overflow-y:auto">${marked.parse(doc.content)}</div>
        <div class="flex-row gap-sm mt-md">
          <button class="btn btn-primary btn-sm" onclick="DocumentsModule.copyDocument()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
      `;
      resultDiv.dataset.content = doc.content;
      resultDiv.dataset.topic = doc.title;
    }
  },
  
  deleteDocument(id) {
    let documents = Storage.get('documents', []);
    documents = documents.filter(d => d.id !== id);
    Storage.set('documents', documents);
    this.renderSavedDocs();
    Toast.success('Document deleted');
  },
  
  renderSavedDocs() {
    const container = $('#saved-docs-list');
    if (!container) return;
    const documents = Storage.get('documents', []);
    if (documents.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-lg)">
        <i class="fas fa-file-alt" style="font-size:1.5rem"></i>
        <p style="margin:0;font-size:var(--font-size-xs)">No saved documents</p>
      </div>`;
      return;
    }
    container.innerHTML = documents.slice(0, 20).map(d => `
      <div class="card" style="padding:var(--space-md);cursor:pointer" 
           onclick="DocumentsModule.loadDocument('${d.id}')">
        <div style="font-weight:600;font-size:var(--font-size-sm)">
          ${Helpers.escapeHtml(Helpers.truncate(d.title, 40))}
        </div>
        <div class="flex-between mt-sm">
          <span class="badge badge-info">${d.type}</span>
          <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${Helpers.timeAgo(d.createdAt)}</span>
        </div>
        <button class="btn btn-sm btn-danger mt-sm" style="width:100%"
          onclick="event.stopPropagation();DocumentsModule.deleteDocument('${d.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `).join('');
  }
};
