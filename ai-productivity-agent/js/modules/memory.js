/* ============================================
   Memory Module - Remember goals, projects, progress
   ============================================ */
const MemoryModule = {
  render(container) {
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    
    container.innerHTML = `
      <div class="page-header">
        <h2>🧠 Memory System</h2>
        <p>Your AI remembers your goals, projects, and learning progress</p>
      </div>
      
      <div class="grid-2 stagger mb-lg">
        <!-- Memory Stats -->
        <div class="glass-card">
          <div class="stat-icon">🧠</div>
          <div class="stat-value">${memory.goals.length + memory.projects.length + memory.notes.length}</div>
          <div class="stat-label">Total Memories</div>
        </div>
        <div class="glass-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${Object.keys(memory.progress).length}</div>
          <div class="stat-label">Tracked Progress Points</div>
        </div>
      </div>
      
      <!-- Memory Sections -->
      <div class="grid-2">
        <!-- Remembered Goals -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">🎯 Remembered Goals</h3>
            <button class="btn btn-sm btn-primary" onclick="MemoryModule.addGoal()">
              <i class="fas fa-plus"></i> Add
            </button>
          </div>
          <div id="memory-goals" class="flex-col gap-sm">
            ${memory.goals.length === 0 ? `<div class="empty-state" style="padding:var(--space-lg)">
              <i class="fas fa-bullseye" style="font-size:1.5rem"></i>
              <p style="margin:0;font-size:var(--font-size-xs)">No remembered goals</p>
            </div>` : memory.goals.map(g => `
              <div class="card" style="padding:var(--space-md)">
                <div class="flex-between">
                  <span style="font-weight:600;font-size:var(--font-size-sm)">${Helpers.escapeHtml(g.title)}</span>
                  <button class="icon-btn" onclick="MemoryModule.removeGoal('${g.id}')" style="width:24px;height:24px">
                    <i class="fas fa-times" style="font-size:10px"></i>
                  </button>
                </div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${g.description || ''}</div>
                <div class="progress-bar mt-sm">
                  <div class="progress-fill" style="width:${g.progress || 0}%"></div>
                </div>
                <div class="flex-between mt-sm">
                  <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${g.progress || 0}%</span>
                  <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">Since ${Helpers.formatDate(g.createdAt, 'medium')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Remembered Projects -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">📁 Remembered Projects</h3>
            <button class="btn btn-sm btn-primary" onclick="MemoryModule.addProject()">
              <i class="fas fa-plus"></i> Add
            </button>
          </div>
          <div id="memory-projects" class="flex-col gap-sm">
            ${memory.projects.length === 0 ? `<div class="empty-state" style="padding:var(--space-lg)">
              <i class="fas fa-folder" style="font-size:1.5rem"></i>
              <p style="margin:0;font-size:var(--font-size-xs)">No remembered projects</p>
            </div>` : memory.projects.map(p => `
              <div class="card" style="padding:var(--space-md)">
                <div class="flex-between">
                  <span style="font-weight:600;font-size:var(--font-size-sm)">${Helpers.escapeHtml(p.name)}</span>
                  <span class="badge badge-${p.status === 'active' ? 'info' : 'success'}">${p.status}</span>
                </div>
                <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${p.description || ''}</div>
                <div class="flex-between mt-sm">
                  <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${Helpers.timeAgo(p.createdAt)}</span>
                  <button class="btn btn-sm btn-secondary" onclick="MemoryModule.removeProject('${p.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <!-- Study Progress -->
      <div class="glass-card mt-lg">
        <div class="card-header">
          <h3 class="card-title">📚 Study Progress</h3>
        </div>
        <div id="memory-progress" class="grid-3">
          ${Object.keys(memory.progress).length === 0 ? `<div class="empty-state" style="grid-column:1/-1;padding:var(--space-lg)">
            <i class="fas fa-graduation-cap" style="font-size:1.5rem"></i>
            <p style="margin:0;font-size:var(--font-size-xs)">Study progress will be tracked automatically</p>
          </div>` : Object.entries(memory.progress).map(([subject, data]) => `
            <div class="card" style="padding:var(--space-md)">
              <div style="font-weight:600;font-size:var(--font-size-sm)">${Helpers.escapeHtml(subject)}</div>
              <div class="progress-bar mt-sm">
                <div class="progress-fill ${data.progress >= 80 ? 'success' : ''}" style="width:${data.progress || 0}%"></div>
              </div>
              <div class="flex-between mt-sm">
                <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${data.progress || 0}%</span>
                <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${data.topics || 0} topics</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Quick Memory -->
      <div class="glass-card mt-lg">
        <div class="card-header">
          <h3 class="card-title">💭 Quick Note to Memory</h3>
        </div>
        <div class="flex-row gap-sm">
          <input type="text" id="quick-memory-input" class="glass-input" placeholder="Something to remember..."
            onkeydown="if(event.key==='Enter')MemoryModule.addQuickNote()">
          <button class="btn btn-primary" onclick="MemoryModule.addQuickNote()">
            <i class="fas fa-brain"></i> Remember
          </button>
        </div>
        <div id="memory-notes" class="flex-col gap-sm mt-md">
          ${memory.notes.length === 0 ? '' : memory.notes.slice(0, 10).map(n => `
            <div class="flex-row" style="padding:var(--space-sm);border-bottom:1px solid var(--border-color)">
              <i class="fas fa-sticky-note" style="color:var(--warning)"></i>
              <span style="flex:1;font-size:var(--font-size-sm)">${Helpers.escapeHtml(n.text)}</span>
              <span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${Helpers.timeAgo(n.createdAt)}</span>
              <button class="icon-btn" onclick="MemoryModule.removeNote('${n.id}')">
                <i class="fas fa-times" style="font-size:10px"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  addGoal() {
    const title = prompt('Goal title:');
    if (!title?.trim()) return;
    const description = prompt('Description (optional):') || '';
    
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.goals.unshift({
      id: Helpers.uid(),
      title: title.trim(),
      description,
      progress: 0,
      createdAt: new Date().toISOString()
    });
    Storage.set('memory', memory);
    
    App.navigate('memory');
    Toast.success('Goal remembered!');
  },
  
  removeGoal(id) {
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.goals = memory.goals.filter(g => g.id !== id);
    Storage.set('memory', memory);
    App.navigate('memory');
    Toast.success('Goal removed');
  },
  
  addProject() {
    const name = prompt('Project name:');
    if (!name?.trim()) return;
    const description = prompt('Description (optional):') || '';
    
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.projects.unshift({
      id: Helpers.uid(),
      name: name.trim(),
      description,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    Storage.set('memory', memory);
    
    App.navigate('memory');
    Toast.success('Project remembered!');
  },
  
  removeProject(id) {
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.projects = memory.projects.filter(p => p.id !== id);
    Storage.set('memory', memory);
    App.navigate('memory');
    Toast.success('Project removed');
  },
  
  addQuickNote() {
    const input = $('#quick-memory-input');
    const text = input?.value.trim();
    if (!text) return;
    
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.notes.unshift({
      id: Helpers.uid(),
      text,
      createdAt: new Date().toISOString()
    });
    Storage.set('memory', memory);
    
    if (input) input.value = '';
    App.navigate('memory');
    Toast.success('Note saved to memory!');
  },
  
  removeNote(id) {
    const memory = Storage.get('memory', { goals: [], projects: [], progress: {}, notes: [] });
    memory.notes = memory.notes.filter(n => n.id !== id);
    Storage.set('memory', memory);
    App.navigate('memory');
  }
};
