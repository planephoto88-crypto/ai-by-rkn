/* ============================================
   Projects Module - AI Project Manager
   ============================================ */
const ProjectsModule = {
  activeProject: null,

  loadHistoryItem(id) {
    const msgs = ChatHistory.getMessages('projects', id);
    const agentMsg = msgs.find(m => m.role === 'agent');
    if (!agentMsg) return;
    const detail = $('#project-detail');
    if (detail) {
      const historyItem = ChatHistory.getAll('projects').find(h => h.id === id);
      detail.innerHTML = `
        <div class="mb-lg">
          <h3>📜 ${Helpers.escapeHtml(historyItem?.title || 'AI Plan')}</h3>
          <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${Helpers.timeAgo(historyItem?.updatedAt)}</span>
        </div>
        <div class="doc-preview">${marked.parse(agentMsg.content)}</div>
      `;
    }
  },
  
  render(container) {
    const projects = Storage.get('projects', []);
    
    container.innerHTML = `
      <div class="page-header">
        <h2>📊 AI Project Manager</h2>
        <p>Break projects into tasks, generate timelines, and track milestones</p>
      </div>
      
      <!-- Create Project -->
      <div class="glass-card mb-lg">
        <div class="flex-row gap-sm">
          <input type="text" id="new-project-name" class="glass-input" placeholder="Project name..."
            onkeydown="if(event.key==='Enter')ProjectsModule.createProject()">
          <input type="date" id="new-project-deadline" class="glass-input" style="width:160px">
          <button class="btn btn-primary" onclick="ProjectsModule.createProject()">
            <i class="fas fa-plus"></i> Create Project
          </button>
          <button class="btn btn-accent btn-sm" onclick="ProjectsModule.aiGenerateProject()">
            <i class="fas fa-magic"></i> AI Generate
          </button>
        </div>
      </div>
      
      <div style="display:flex;gap:var(--space-lg);height:calc(100vh - 280px)">
        <!-- Project List -->
        <div class="glass-card" style="width:260px;flex-shrink:0;overflow-y:auto">
          <h3 class="card-title mb-md">Projects</h3>
          <div id="project-list" class="flex-col gap-sm">
            ${projects.length === 0 ? `<div class="empty-state" style="padding:var(--space-lg)">
              <i class="fas fa-folder-open" style="font-size:1.5rem"></i>
              <p style="margin:0;font-size:var(--font-size-xs)">No projects yet</p>
            </div>` : ''}
          </div>
        </div>
        
        <!-- Project Details -->
        <div class="glass-card" style="flex:1;overflow-y:auto">
          <div id="project-detail">
            <div class="empty-state">
              <i class="fas fa-project-diagram"></i>
              <h3>Select a project</h3>
              <p>Create or select a project to view details</p>
            </div>
          </div>
        </div>
        
        <!-- Project AI History -->
        <div class="glass-card" style="width:200px;flex-shrink:0;overflow-y:auto">
          <div class="card-header" style="padding:var(--space-sm)">
            <h3 class="card-title" style="font-size:var(--font-size-sm)">📜 AI Plans</h3>
          </div>
          <div id="project-history-list" class="flex-col gap-xs">
            ${ChatHistory.getAll('projects').length === 0 ? `<div class="empty-state" style="padding:var(--space-sm)">
              <p style="font-size:var(--font-size-xs);color:var(--text-tertiary)">No AI plans yet</p>
            </div>` : ChatHistory.getAll('projects').slice(0, 15).map(h => `
              <div class="card" style="padding:var(--space-xs) var(--space-sm);cursor:pointer" 
                   onclick="ProjectsModule.loadHistoryItem('${h.id}')">
                <div style="font-size:var(--font-size-xs);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${Helpers.escapeHtml(Helpers.truncate(h.title, 22))}
                </div>
                <div style="font-size:10px;color:var(--text-tertiary)">
                  ${h.messages.length} msgs · ${Helpers.timeAgo(h.updatedAt)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    this.renderProjectList();
  },
  
  createProject() {
    const nameEl = $('#new-project-name');
    const deadlineEl = $('#new-project-deadline');
    const name = nameEl?.value.trim();
    
    if (!name) { Toast.warning('Enter project name'); return; }
    
    const projects = Storage.get('projects', []);
    projects.unshift({
      id: Helpers.uid(),
      name,
      description: '',
      deadline: deadlineEl?.value || '',
      createdAt: new Date().toISOString(),
      milestones: [],
      tasks: [],
      status: 'active',
      progress: 0,
      timeline: null,
      risks: null
    });
    Storage.set('projects', projects);
    
    if (nameEl) nameEl.value = '';
    this.renderProjectList();
    Toast.success('Project created!');
  },
  
  async aiGenerateProject() {
    const name = prompt('Describe your project:');
    if (!name?.trim()) return;
    
    Toast.info('AI is creating project plan...');
    
    try {
      // Generate breakdown
      const breakdown = await MultiAgent.execute('planning', 'breakDownProject', name, name);
      
      // Save to projects chat history
      const session = ChatHistory.create('projects', `Project: ${name.slice(0, 50)}`);
      ChatHistory.addMessage('projects', session.id, 'user', `Create project plan for: ${name}`);
      ChatHistory.addMessage('projects', session.id, 'agent', breakdown);
      
      // Parse milestones and tasks from breakdown
      const milestones = [];
      const phaseMatches = breakdown.match(/###\s*(?:Phase|Milestone)\s*\d*:?\s*(.+?)(?=\n|$)/g);
      
      if (phaseMatches) {
        phaseMatches.forEach(phase => {
          const phaseName = phase.replace(/###\s*(?:Phase|Milestone)\s*\d*:?\s*/, '').trim();
          milestones.push({
            id: Helpers.uid(),
            title: phaseName,
            completed: false
          });
        });
      }
      
      const taskMatches = breakdown.match(/- \[ \]\s*(.+?)(?=\n|$)/g);
      const tasks = taskMatches ? taskMatches.map(m => ({
        id: Helpers.uid(),
        title: m.replace(/- \[ \]\s*/, '').trim(),
        completed: false
      })) : [];
      
      // Create project
      const projects = Storage.get('projects', []);
      const project = {
        id: Helpers.uid(),
        name,
        description: '',
        deadline: '',
        createdAt: new Date().toISOString(),
        milestones,
        tasks,
        status: 'active',
        progress: 0,
        timeline: breakdown,
        risks: null
      };
      projects.unshift(project);
      Storage.set('projects', projects);
      
      // Also add tasks to main task list
      const mainTasks = Storage.get('tasks', []);
      tasks.forEach(t => {
        mainTasks.unshift({
          id: Helpers.uid(),
          title: t.title,
          priority: 'medium',
          dueDate: '',
          completed: false,
          completedDate: null,
          createdDate: Helpers.today(),
          createdAt: new Date().toISOString(),
          project: name
        });
      });
      Storage.set('tasks', mainTasks);
      
      this.renderProjectList();
      this.selectProject(project.id);
      Toast.success(`Project "${name}" created with ${tasks.length} tasks!`);
    } catch (e) {
      Toast.error(`AI Error: ${e.message}`);
    }
  },
  
  renderProjectList() {
    const container = $('#project-list');
    if (!container) return;
    
    const projects = Storage.get('projects', []);
    
    if (projects.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-lg)">
        <i class="fas fa-folder-open" style="font-size:1.5rem"></i>
        <p style="margin:0;font-size:var(--font-size-xs)">No projects yet</p>
      </div>`;
      return;
    }
    
    container.innerHTML = projects.map(p => `
      <div class="card ${this.activeProject === p.id ? 'glow-primary' : ''}" 
           style="padding:var(--space-md);cursor:pointer"
           onclick="ProjectsModule.selectProject('${p.id}')">
        <div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-xs)">
          ${Helpers.escapeHtml(p.name)}
        </div>
        <div class="flex-between">
          <span class="badge badge-${p.status === 'active' ? 'info' : 'success'}">${p.status}</span>
          <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${p.progress || 0}%</span>
        </div>
        <div class="progress-bar mt-sm">
          <div class="progress-fill ${(p.progress || 0) >= 80 ? 'success' : ''}" style="width:${p.progress || 0}%"></div>
        </div>
        <button class="btn btn-sm btn-danger mt-sm" style="width:100%"
          onclick="event.stopPropagation();ProjectsModule.deleteProject('${p.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `).join('');
  },
  
  selectProject(id) {
    this.activeProject = id;
    const projects = Storage.get('projects', []);
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    this.renderProjectList();
    this.renderProjectDetail(project);
  },
  
  renderProjectDetail(project) {
    const container = $('#project-detail');
    if (!container) return;
    
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const progress = project.tasks.length > 0 ? Helpers.percent(completedTasks, project.tasks.length) : 0;
    
    container.innerHTML = `
      <div class="mb-lg">
        <h3>${Helpers.escapeHtml(project.name)}</h3>
        <div class="flex-row gap-sm mt-sm">
          <span class="badge badge-${project.status === 'active' ? 'info' : 'success'}">${project.status}</span>
          ${project.deadline ? `<span class="badge badge-warning">📅 ${project.deadline}</span>` : ''}
          <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">Created ${Helpers.timeAgo(project.createdAt)}</span>
        </div>
      </div>
      
      <div class="grid-2 mb-lg">
        <div class="card">
          <div class="stat-label">Progress</div>
          <div class="stat-value" style="font-size:var(--font-size-3xl)">${progress}%</div>
          <div class="progress-bar mt-sm">
            <div class="progress-fill ${progress >= 80 ? 'success' : ''}" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="card">
          <div class="stat-label">Tasks</div>
          <div style="font-size:var(--font-size-sm)">
            ${completedTasks} / ${project.tasks.length} completed
          </div>
          <div style="font-size:var(--font-size-sm);color:var(--text-tertiary)">
            ${project.milestones.length} milestones
          </div>
        </div>
      </div>
      
      <!-- Milestones -->
      <h4 class="mb-md">🏁 Milestones</h4>
      <div class="flex-col gap-sm mb-lg" id="milestone-list">
        ${project.milestones.length === 0 ? '<p style="color:var(--text-tertiary)">No milestones</p>' : 
          project.milestones.map(m => `
            <div class="task-item">
              <div class="task-checkbox ${m.completed ? 'checked' : ''}" 
                   onclick="ProjectsModule.toggleMilestone('${project.id}','${m.id}')"></div>
              <div class="task-content">
                <div class="task-title ${m.completed ? 'done' : ''}">${Helpers.escapeHtml(m.title)}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <!-- Tasks -->
      <h4 class="mb-md">📋 Tasks</h4>
      <div class="flex-col gap-sm" id="project-task-list">
        ${project.tasks.length === 0 ? '<p style="color:var(--text-tertiary)">No tasks</p>' : 
          project.tasks.map(t => `
            <div class="task-item">
              <div class="task-checkbox ${t.completed ? 'checked' : ''}" 
                   onclick="ProjectsModule.toggleProjectTask('${project.id}','${t.id}')"></div>
              <div class="task-content">
                <div class="task-title ${t.completed ? 'done' : ''}">${Helpers.escapeHtml(t.title)}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <!-- Timeline / AI Output -->
      ${project.timeline ? `
        <h4 class="mt-lg mb-md">📄 AI Generated Plan</h4>
        <div class="doc-preview">${marked.parse(project.timeline)}</div>
      ` : ''}
      
      <!-- Risk Analysis Button -->
      <div class="mt-lg">
        <button class="btn btn-secondary" onclick="ProjectsModule.analyzeRisks('${project.id}')">
          <i class="fas fa-shield-alt"></i> Analyze Risks
        </button>
        <div id="risks-result-${project.id}" class="mt-md"></div>
      </div>
    `;
  },
  
  toggleMilestone(projectId, milestoneId) {
    const projects = Storage.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (milestone) milestone.completed = !milestone.completed;
    Storage.set('projects', projects);
    
    this.selectProject(projectId);
  },
  
  toggleProjectTask(projectId, taskId) {
    const projects = Storage.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const task = project.tasks.find(t => t.id === taskId);
    if (task) task.completed = !task.completed;
    
    // Update progress
    const completed = project.tasks.filter(t => t.completed).length;
    project.progress = project.tasks.length > 0 ? Helpers.percent(completed, project.tasks.length) : 0;
    if (project.progress >= 100) project.status = 'completed';
    
    Storage.set('projects', projects);
    this.selectProject(projectId);
    this.renderProjectList();
  },
  
  async analyzeRisks(projectId) {
    const projects = Storage.get('projects', []);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const resultDiv = $(`#risks-result-${projectId}`);
    if (resultDiv) resultDiv.innerHTML = '<div class="spinner"></div> Analyzing risks...';
    
    try {
      const response = await MultiAgent.execute('planning', 'analyzeRisks', project.name + ': ' + (project.description || ''));
      project.risks = response;
      Storage.set('projects', projects);
      
      // Save to history
      const session = ChatHistory.create('projects', `Risk: ${project.name.slice(0, 50)}`);
      ChatHistory.addMessage('projects', session.id, 'user', `Analyze risks for: ${project.name}`);
      ChatHistory.addMessage('projects', session.id, 'agent', response);
      
      if (resultDiv) resultDiv.innerHTML = `<div class="doc-preview">${marked.parse(response)}</div>`;
    } catch (e) {
      if (resultDiv) resultDiv.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },
  
  deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    
    let projects = Storage.get('projects', []);
    projects = projects.filter(p => p.id !== id);
    Storage.set('projects', projects);
    
    if (this.activeProject === id) {
      this.activeProject = null;
      const detail = $('#project-detail');
      if (detail) detail.innerHTML = `<div class="empty-state">
        <i class="fas fa-project-diagram"></i>
        <h3>Select a project</h3>
      </div>`;
    }
    
    this.renderProjectList();
    Toast.success('Project deleted');
  }
};
