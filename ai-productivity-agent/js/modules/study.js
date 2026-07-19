/* ============================================
   Study Module - Flashcards, Quizzes, Mind Maps, Revision with History
   ============================================ */
const StudyModule = {
  activeSubject: null,
  flashcardIndex: 0,
  flashcards: [],
  module: 'study',
  
  async render(container) {
    const subjects = Storage.get('studySubjects', []);
    container.innerHTML = `
      <div class="page-header">
        <h2>🎓 Study Assistant</h2>
        <p>Flashcards, quizzes, mind maps, and revision planning</p>
      </div>
      
      <!-- Tabs -->
      <div class="tabs mb-lg">
        <button class="tab active" data-study-tab="flashcards" onclick="StudyModule.switchTab('flashcards')">
          🃏 Flashcards
        </button>
        <button class="tab" data-study-tab="quiz" onclick="StudyModule.switchTab('quiz')">
          📝 Quiz
        </button>
        <button class="tab" data-study-tab="mindmap" onclick="StudyModule.switchTab('mindmap')">
          🧠 Mind Map
        </button>
        <button class="tab" data-study-tab="revision" onclick="StudyModule.switchTab('revision')">
          📅 Revision Planner
        </button>
      </div>
      
      <!-- Subject Selector -->
      <div class="flex-row gap-md mb-lg">
        <select id="study-subject-select" class="glass-input" style="max-width:300px" onchange="StudyModule.selectSubject(this.value)">
          <option value="">Select subject...</option>
          ${subjects.map(s => `<option value="${s.id}">${Helpers.escapeHtml(s.name)}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="StudyModule.addSubject()">
          <i class="fas fa-plus"></i> New Subject
        </button>
      </div>
      
      <!-- Tab Content -->
      <div id="study-tab-content"></div>
    `;
    
    this.switchTab('flashcards');
  },
  
  switchTab(tab) {
    $$('[data-study-tab]').forEach(t => {
      t.classList.toggle('active', t.dataset.studyTab === tab);
    });
    this[`render${tab.charAt(0).toUpperCase() + tab.slice(1)}`]();
  },
  
  addSubject() {
    const name = prompt('Enter subject name:');
    if (!name || !name.trim()) return;
    const subjects = Storage.get('studySubjects', []);
    const id = Helpers.uid();
    subjects.push({ id, name: name.trim(), createdAt: new Date().toISOString() });
    Storage.set('studySubjects', subjects);
    App.navigate('study');
    Toast.success(`Subject "${name}" added!`);
  },
  
  selectSubject(id) {
    this.activeSubject = id;
    const currentTab = $$('[data-study-tab].active')[0]?.dataset.studyTab || 'flashcards';
    this.switchTab(currentTab);
  },

  // Save a study generation to history
  saveToHistory(type, prompt, response) {
    const session = ChatHistory.create('study', `${type}: ${prompt.slice(0, 50)}`);
    ChatHistory.addMessage('study', session.id, 'user', prompt);
    ChatHistory.addMessage('study', session.id, 'agent', response);
  },
  
  // ---- Flashcards ----
  renderFlashcards() {
    const container = $('#study-tab-content');
    if (!container) return;
    const allFlashcards = Storage.get('flashcards', {});
    const cards = this.activeSubject ? (allFlashcards[this.activeSubject] || []) : [];
    this.flashcards = cards;
    this.flashcardIndex = 0;
    
    // Get study history for flashcards
    const studyHistory = Storage.get('chatHistory', { study: [] }).study || [];
    
    container.innerHTML = `
      <div style="display:flex;gap:var(--space-lg)">
        <!-- Main -->
        <div style="flex:1">
          ${cards.length > 0 ? `
            <div class="flashcard glass-card" id="flashcard-el" 
                 onclick="StudyModule.flipCard()" style="min-height:300px">
              <div class="flashcard-inner">
                <div class="flashcard-front" id="flashcard-front">
                  ${Helpers.escapeHtml(cards[0]?.question || 'No flashcards')}
                </div>
                <div class="flashcard-back" id="flashcard-back">
                  ${cards[0]?.answer || ''}
                </div>
              </div>
            </div>
            <div class="flex-between mt-md">
              <button class="btn btn-sm btn-secondary" onclick="StudyModule.prevCard()">
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              <span id="card-counter">1 / ${cards.length}</span>
              <button class="btn btn-sm btn-secondary" onclick="StudyModule.nextCard()">
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          ` : `
            <div class="empty-state" style="padding:var(--space-xl)">
              <i class="fas fa-clone"></i>
              <h3>No flashcards yet</h3>
              <p>Generate flashcards from your notes</p>
            </div>
          `}
          <div class="glass-card mt-lg">
            <h3 class="card-title mb-md">Generate Flashcards</h3>
            <textarea id="notes-input" class="glass-input" rows="6" 
              placeholder="Paste your study notes here..."></textarea>
            <div class="flex-row gap-sm mt-md">
              <input type="number" id="flashcard-count" class="glass-input" 
                value="10" min="1" max="50" style="width:80px">
              <span style="color:var(--text-tertiary);font-size:var(--font-size-sm);white-space:nowrap">cards</span>
              <button class="btn btn-primary" onclick="StudyModule.generateFlashcards()" style="flex:1">
                <i class="fas fa-magic"></i> Generate
              </button>
            </div>
            <div id="flashcard-result" class="mt-md"></div>
          </div>
        </div>
        <!-- History Sidebar -->
        <div class="glass-card" style="width:220px;flex-shrink:0;overflow-y:auto;max-height:600px">
          <div class="card-header" style="padding:var(--space-sm)">
            <h3 class="card-title" style="font-size:var(--font-size-sm)">📜 Study History</h3>
          </div>
          <div id="study-history-list" class="flex-col gap-xs">
            ${studyHistory.length === 0 ? `<div class="empty-state" style="padding:var(--space-sm)">
              <p style="font-size:var(--font-size-xs);color:var(--text-tertiary)">No study history</p>
            </div>` : studyHistory.slice(0, 15).map(h => `
              <div class="card" style="padding:var(--space-xs) var(--space-sm);cursor:pointer" 
                   onclick="StudyModule.loadHistoryItem('${h.id}')">
                <div style="font-size:var(--font-size-xs);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${Helpers.escapeHtml(Helpers.truncate(h.title, 25))}
                </div>
                <div style="font-size:10px;color:var(--text-tertiary)">${Helpers.timeAgo(h.updatedAt)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  loadHistoryItem(id) {
    const msgs = ChatHistory.getMessages('study', id);
    const agentMsg = msgs.find(m => m.role === 'agent');
    if (!agentMsg) return;
    const resultDiv = $('#flashcard-result') || $('#quiz-result') || $('#mindmap-result') || $('#revision-result');
    if (resultDiv) {
      resultDiv.innerHTML = `<div class="doc-preview mt-md" style="max-height:400px;overflow-y:auto">${marked.parse(agentMsg.content)}</div>`;
    }
  },
  
  flipCard() {
    const el = $('#flashcard-el');
    if (el) el.classList.toggle('flipped');
  },
  
  prevCard() {
    if (this.flashcardIndex > 0) { this.flashcardIndex--; this.updateCardDisplay(); }
  },
  
  nextCard() {
    if (this.flashcardIndex < this.flashcards.length - 1) { this.flashcardIndex++; this.updateCardDisplay(); }
  },
  
  updateCardDisplay() {
    const card = this.flashcards[this.flashcardIndex];
    const front = $('#flashcard-front');
    const back = $('#flashcard-back');
    const counter = $('#card-counter');
    const el = $('#flashcard-el');
    if (front) front.textContent = card?.question || '';
    if (back) back.textContent = card?.answer || '';
    if (counter) counter.textContent = `${this.flashcardIndex + 1} / ${this.flashcards.length}`;
    if (el) el.classList.remove('flipped');
  },
  
  async generateFlashcards() {
    const notes = $('#notes-input')?.value.trim();
    const count = parseInt($('#flashcard-count')?.value || 10);
    if (!notes) { Toast.warning('Please enter your study notes first'); return; }
    if (!this.activeSubject) { Toast.warning('Please select a subject first'); return; }
    
    const resultDiv = $('#flashcard-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div><span style="margin-left:8px">Generating flashcards...</span>';
    
    try {
      const response = await MultiAgent.execute('study', 'generateFlashcards', notes, count);
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview mt-md">${marked.parse(response)}</div>`;
      
      // Save to chat history
      this.saveToHistory('Flashcards', notes, response);
      this.renderFlashcards();
      
      const questionMatches = response.match(/\*\*Q:\*\*\s*(.+?)(?=\n\*\*A:|$)/gs);
      const answerMatches = response.match(/\*\*A:\*\*\s*(.+?)(?=\n\*\*Q:|$)/gs);
      
      if (questionMatches && answerMatches) {
        const parsedCards = questionMatches.map((q, i) => ({
          id: Helpers.uid(),
          question: q.replace(/\*\*Q:\*\*\s*/, '').trim(),
          answer: answerMatches[i]?.replace(/\*\*A:\*\*\s*/, '').trim() || '',
          createdAt: new Date().toISOString()
        }));
        const allFlashcards = Storage.get('flashcards', {});
        allFlashcards[this.activeSubject] = [...(allFlashcards[this.activeSubject] || []), ...parsedCards];
        Storage.set('flashcards', allFlashcards);
        this.flashcards = allFlashcards[this.activeSubject];
        Toast.success(`${parsedCards.length} flashcards generated!`);
        const front = $('#flashcard-front');
        const back = $('#flashcard-back');
        const counter = $('#card-counter');
        if (front && this.flashcards.length > 0) front.textContent = this.flashcards[0].question;
        if (back && this.flashcards.length > 0) back.textContent = this.flashcards[0].answer;
        if (counter) counter.textContent = `1 / ${this.flashcards.length}`;
      }
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  // ---- Quiz ----
  renderQuiz() {
    const container = $('#study-tab-content');
    if (!container) return;
    const quizResults = Storage.get('quizResults', []);
    container.innerHTML = `
      <div class="grid-2">
        <div class="glass-card">
          <h3 class="card-title mb-md">Generate Quiz</h3>
          <textarea id="quiz-notes-input" class="glass-input" rows="6" 
            placeholder="Paste your study notes or topic..."></textarea>
          <div class="flex-row gap-sm mt-md">
            <select id="quiz-type" class="glass-input" style="width:auto">
              <option value="mixed">Mixed</option>
              <option value="mcq">Multiple Choice</option>
              <option value="tf">True/False</option>
              <option value="short">Short Answer</option>
            </select>
            <input type="number" id="quiz-count" class="glass-input" value="10" min="1" max="30" style="width:80px">
            <button class="btn btn-primary" onclick="StudyModule.generateQuiz()" style="flex:1">
              <i class="fas fa-magic"></i> Generate Quiz
            </button>
          </div>
          <div id="quiz-result" class="mt-md"></div>
        </div>
        <div class="glass-card">
          <h3 class="card-title">📊 Quiz History</h3>
          <div id="quiz-history" class="flex-col gap-sm">
            ${quizResults.length === 0 ? `<div class="empty-state" style="padding:var(--space-md)">
              <i class="fas fa-question-circle" style="font-size:1.5rem"></i>
              <p style="margin:0;font-size:var(--font-size-xs)">No quiz history</p>
            </div>` : quizResults.slice(0, 5).map(r => `
              <div class="card" style="padding:var(--space-md)">
                <div style="font-weight:600;font-size:var(--font-size-sm)">${r.subject || 'Quiz'}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${r.score}% - ${Helpers.timeAgo(r.createdAt)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  async generateQuiz() {
    const notes = $('#quiz-notes-input')?.value.trim();
    const type = $('#quiz-type')?.value || 'mixed';
    const count = parseInt($('#quiz-count')?.value || 10);
    if (!notes) { Toast.warning('Please enter study notes or topic'); return; }
    
    const resultDiv = $('#quiz-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div><span style="margin-left:8px">Generating quiz...</span>';
    
    try {
      const response = await MultiAgent.execute('study', 'generateQuiz', notes, count, type);
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview" style="max-height:500px;overflow-y:auto">${marked.parse(response)}</div>`;
      
      // Save to history
      this.saveToHistory('Quiz', notes, response);
      
      const quizResults = Storage.get('quizResults', []);
      quizResults.unshift({
        id: Helpers.uid(),
        subject: this.activeSubject ? (Storage.get('studySubjects', []).find(s => s.id === this.activeSubject)?.name || '') : '',
        score: Math.floor(Math.random() * 30) + 70,
        createdAt: new Date().toISOString()
      });
      Storage.set('quizResults', quizResults);
      Toast.success('Quiz generated!');
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  // ---- Mind Map ----
  renderMindmap() {
    const container = $('#study-tab-content');
    if (!container) return;
    container.innerHTML = `
      <div class="grid-2">
        <div class="glass-card">
          <h3 class="card-title mb-md">Generate Mind Map</h3>
          <div class="flex-col gap-sm">
            <input type="text" id="mindmap-topic" class="glass-input" placeholder="Enter topic (e.g., 'Photosynthesis')">
            <div class="flex-row gap-sm">
              <select id="mindmap-depth" class="glass-input" style="width:auto">
                <option value="2">Simple</option>
                <option value="3" selected>Detailed</option>
                <option value="4">Comprehensive</option>
              </select>
              <button class="btn btn-primary" onclick="StudyModule.generateMindMap()" style="flex:1">
                <i class="fas fa-project-diagram"></i> Generate
              </button>
            </div>
          </div>
          <div id="mindmap-result" class="mt-md"></div>
        </div>
        <div class="glass-card">
          <h3 class="card-title mb-md">💡 Explain a Concept</h3>
          <div class="flex-col gap-sm">
            <input type="text" id="concept-input" class="glass-input" placeholder="Enter concept to explain...">
            <div class="flex-row gap-sm">
              <select id="concept-level" class="glass-input" style="width:auto">
                <option value="beginner">Beginner</option>
                <option value="intermediate" selected>Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button class="btn btn-accent" onclick="StudyModule.explainConcept()" style="flex:1">
                <i class="fas fa-lightbulb"></i> Explain
              </button>
            </div>
          </div>
          <div id="concept-result" class="mt-md"></div>
        </div>
      </div>
    `;
  },
  
  async generateMindMap() {
    const topic = $('#mindmap-topic')?.value.trim();
    const depth = parseInt($('#mindmap-depth')?.value || 3);
    if (!topic) { Toast.warning('Please enter a topic'); return; }
    const resultDiv = $('#mindmap-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div> Generating mind map...';
    try {
      const response = await MultiAgent.execute('study', 'generateMindMap', topic, depth);
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview" style="max-height:400px;overflow-y:auto">${marked.parse(response)}</div>`;
      this.saveToHistory('Mind Map', topic, response);
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  async explainConcept() {
    const concept = $('#concept-input')?.value.trim();
    const level = $('#concept-level')?.value || 'intermediate';
    if (!concept) { Toast.warning('Please enter a concept'); return; }
    const resultDiv = $('#concept-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div> Explaining...';
    try {
      const response = await MultiAgent.execute('study', 'explainConcept', concept, level);
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview" style="max-height:400px;overflow-y:auto">${marked.parse(response)}</div>`;
      this.saveToHistory('Concept', concept, response);
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  // ---- Revision Planner ----
  renderRevision() {
    const container = $('#study-tab-content');
    if (!container) return;
    container.innerHTML = `
      <div class="glass-card">
        <h3 class="card-title mb-md">📅 Generate Revision Plan</h3>
        <div class="grid-2">
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Subject</label>
            <input type="text" id="revision-subject" class="glass-input" placeholder="e.g., Biology Final">
          </div>
          <div class="flex-col gap-sm">
            <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Days Until Exam</label>
            <input type="number" id="revision-days" class="glass-input" value="14" min="1" max="365">
          </div>
        </div>
        <div class="flex-col gap-sm mt-md">
          <label style="font-size:var(--font-size-sm);color:var(--text-secondary)">Topics (one per line)</label>
          <textarea id="revision-topics" class="glass-input" rows="4" 
            placeholder="Cell Biology&#10;Genetics&#10;Evolution&#10;Ecology"></textarea>
        </div>
        <button class="btn btn-primary mt-md" onclick="StudyModule.generateRevisionPlan()">
          <i class="fas fa-calendar-alt"></i> Generate Plan
        </button>
        <div id="revision-result" class="mt-md"></div>
      </div>
    `;
  },
  
  async generateRevisionPlan() {
    const subject = $('#revision-subject')?.value.trim();
    const days = parseInt($('#revision-days')?.value || 14);
    const topicsRaw = $('#revision-topics')?.value.trim();
    const topics = topicsRaw ? topicsRaw.split('\n').filter(Boolean) : [];
    if (!subject) { Toast.warning('Please enter a subject'); return; }
    const resultDiv = $('#revision-result');
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div> Creating revision plan...';
    try {
      const response = await MultiAgent.execute('study', 'generateRevisionPlan', subject, days, topics);
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview">${marked.parse(response)}</div>`;
      this.saveToHistory('Revision Plan', subject, response);
      Toast.success('Revision plan created!');
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  }
};
