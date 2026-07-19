/* ============================================
   Task Automation Module
   ============================================ */
const TasksModule = {
  filter: 'all',
  
  render(container) {
    const tasks = Storage.get('tasks', []);
    const today = Helpers.today();
    
    container.innerHTML = `
      <div class="page-header">
        <h2>✅ Task Automation</h2>
        <p>Manage tasks, plan your day, and track progress</p>
      </div>
      
      <!-- Add Task Bar -->
      <div class="glass-card mb-lg">
        <div class="flex-row gap-sm">
          <input type="text" id="new-task-input" class="glass-input" placeholder="What needs to be done?"
            onkeydown="if(event.key==='Enter')TasksModule.addTask()">
          <select id="new-task-priority" class="glass-input" style="width:120px">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
          <input type="date" id="new-task-due" class="glass-input" style="width:150px" value="${today}">
          <button class="btn btn-primary" onclick="TasksModule.addTask()">
            <i class="fas fa-plus"></i> Add
          </button>
          <button class="btn btn-accent btn-sm" onclick="TasksModule.aiBreakdown()" title="AI Task Breakdown">
            <i class="fas fa-magic"></i> AI Plan
          </button>
        </div>
      </div>
      
      <div class="grid-2 mb-lg">
        <!-- Task List -->
        <div class="glass-card" style="max-height:500px;overflow:hidden;display:flex;flex-direction:column">
          <div class="card-header">
            <h3 class="card-title">Tasks</h3>
            <div class="tabs">
              <button class="tab ${this.filter === 'all' ? 'active' : ''}" onclick="TasksModule.setFilter('all')">All</button>
              <button class="tab ${this.filter === 'pending' ? 'active' : ''}" onclick="TasksModule.setFilter('pending')">Pending</button>
              <button class="tab ${this.filter === 'done' ? 'active' : ''}" onclick="TasksModule.setFilter('done')">Done</button>
            </div>
          </div>
          <div id="task-list" class="flex-col gap-xs" style="overflow-y:auto;flex:1;padding:var(--space-sm)"></div>
          <div style="padding:var(--space-sm);border-top:1px solid var(--border-color);font-size:var(--font-size-xs);color:var(--text-tertiary)">
            ${tasks.filter(t => !t.completed).length} pending · ${tasks.filter(t => t.completed).length} completed
          </div>
        </div>
        
        <!-- Daily Planner -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">📅 Daily Planner</h3>
            <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${Helpers.formatDate(today, 'long')}</span>
          </div>
          <div id="daily-planner" class="flex-col gap-sm"></div>
        </div>
      </div>
      
      <!-- Goal Tracker -->
      <div class="glass-card">
        <div class="card-header">
          <h3 class="card-title">🎯 Goals</h3>
          <button class="btn btn-sm btn-primary" onclick="TasksModule.addGoal()">
            <i class="fas fa-plus"></i> New Goal
          </button>
        </div>
        <div id="goals-list" class="grid-3 stagger"></div>
      </div>
    `;
    
    this.renderTaskList();
    this.renderDailyPlanner();
    this.renderGoals();
  },
  
  setFilter(filter) {
    this.filter = filter;
    $$('#task-list + .tabs .tab, .tabs .tab').forEach(t => {
      // Re-render whole section
    });
    this.renderTaskList();
  },
  
  addTask() {
    const input = $('#new-task-input');
    const priority = $('#new-task-priority');
    const dueDate = $('#new-task-due');
    
    const title = input?.value.trim();
    if (!title) return;
    
    const tasks = Storage.get('tasks', []);
    tasks.unshift({
      id: Helpers.uid(),
      title,
      priority: priority?.value || 'medium',
      dueDate: dueDate?.value || Helpers.today(),
      completed: false,
      completedDate: null,
      createdDate: Helpers.today(),
      createdAt: new Date().toISOString(),
      project: null
    });
    Storage.set('tasks', tasks);
    
    if (input) input.value = '';
    this.renderTaskList();
    this.renderDailyPlanner();
    this.updateAnalytics();
    Toast.success('Task added!');
  },
  
  toggleTask(id) {
    const tasks = Storage.get('tasks', []);
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    task.completedDate = task.completed ? Helpers.today() : null;
    task.updatedAt = new Date().toISOString();
    Storage.set('tasks', tasks);
    
    this.renderTaskList();
    this.renderDailyPlanner();
    this.updateAnalytics();
  },
  
  deleteTask(id) {
    let tasks = Storage.get('tasks', []);
    tasks = tasks.filter(t => t.id !== id);
    Storage.set('tasks', tasks);
    this.renderTaskList();
    this.renderDailyPlanner();
    this.updateAnalytics();
    Toast.success('Task deleted');
  },
  
  renderTaskList() {
    const container = $('#task-list');
    if (!container) return;
    
    let tasks = Storage.get('tasks', []);
    if (this.filter === 'pending') tasks = tasks.filter(t => !t.completed);
    if (this.filter === 'done') tasks = tasks.filter(t => t.completed);
    
    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)">
        <i class="fas fa-clipboard-list"></i>
        <h3>No ${this.filter === 'done' ? 'completed' : ''} tasks</h3>
        <p>${this.filter === 'done' ? 'Complete some tasks!' : 'Add your first task above'}</p>
      </div>`;
      return;
    }
    
    container.innerHTML = tasks.slice(0, 50).map(t => `
      <div class="task-item">
        <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="TasksModule.toggleTask('${t.id}')"></div>
        <div class="task-content">
          <div class="task-title ${t.completed ? 'done' : ''}">${Helpers.escapeHtml(t.title)}</div>
          <div class="task-meta">
            <span class="badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}">${t.priority}</span>
            ${t.dueDate ? `<span>📅 ${Helpers.formatDate(t.dueDate)}</span>` : ''}
            ${t.completed ? `<span style="color:var(--success)">✓ Done</span>` : ''}
          </div>
        </div>
        <button class="icon-btn" onclick="TasksModule.deleteTask('${t.id}')" title="Delete">
          <i class="fas fa-trash" style="font-size:var(--font-size-xs)"></i>
        </button>
      </div>
    `).join('');
  },
  
  renderDailyPlanner() {
    const container = $('#daily-planner');
    if (!container) return;
    
    const today = Helpers.today();
    const tasks = Storage.get('tasks', []).filter(t => t.dueDate === today || t.createdDate === today);
    
    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-xl)">
        <i class="fas fa-calendar-day"></i>
        <h3>Nothing planned for today</h3>
        <p>Add tasks and set their due date to today</p>
      </div>`;
      return;
    }
    
    const pending = tasks.filter(t => !t.completed);
    const done = tasks.filter(t => t.completed);
    const progress = tasks.length > 0 ? Helpers.percent(done.length, tasks.length) : 0;
    
    container.innerHTML = `
      <div class="mb-md">
        <div class="flex-between mb-sm">
          <span style="font-weight:600">Daily Progress</span>
          <span style="color:var(--accent)">${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${progress >= 80 ? 'success' : ''}" style="width:${progress}%"></div>
        </div>
      </div>
      <div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-xs)">
        ⏳ Pending (${pending.length})
      </div>
      ${pending.map(t => `
        <div class="task-item">
          <div class="task-checkbox" onclick="TasksModule.toggleTask('${t.id}');TasksModule.renderDailyPlanner()"></div>
          <div class="task-content">
            <div class="task-title">${Helpers.escapeHtml(t.title)}</div>
            <div class="task-meta">
              <span class="badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}">${t.priority}</span>
            </div>
          </div>
        </div>
      `).join('')}
      ${done.length > 0 ? `
        <div style="font-weight:600;font-size:var(--font-size-sm);margin-top:var(--space-md);margin-bottom:var(--space-xs);color:var(--success)">
          ✅ Completed (${done.length})
        </div>
        ${done.slice(0, 5).map(t => `
          <div class="task-item" style="opacity:0.6">
            <div class="task-checkbox checked"></div>
            <div class="task-content">
              <div class="task-title done">${Helpers.escapeHtml(t.title)}</div>
            </div>
          </div>
        `).join('')}
      ` : ''}
    `;
  },
  
  // Goals
  addGoal() {
    const title = prompt('Enter goal name:');
    if (!title?.trim()) return;
    
    const goals = Storage.get('goals', []);
    goals.unshift({
      id: Helpers.uid(),
      title: title.trim(),
      completed: false,
      progress: 0,
      createdAt: new Date().toISOString()
    });
    Storage.set('goals', goals);
    this.renderGoals();
    Toast.success('Goal added!');
  },
  
  updateGoalProgress(id, progress) {
    const goals = Storage.get('goals', []);
    const goal = goals.find(g => g.id === id);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      goal.completed = goal.progress >= 100;
      if (goal.completed) goal.completedDate = Helpers.today();
      Storage.set('goals', goals);
      this.renderGoals();
    }
  },
  
  deleteGoal(id) {
    let goals = Storage.get('goals', []);
    goals = goals.filter(g => g.id !== id);
    Storage.set('goals', goals);
    this.renderGoals();
    Toast.success('Goal deleted');
  },
  
  renderGoals() {
    const container = $('#goals-list');
    if (!container) return;
    
    const goals = Storage.get('goals', []);
    
    if (goals.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-bullseye"></i>
        <h3>No goals set</h3>
        <p>Click "New Goal" to get started</p>
      </div>`;
      return;
    }
    
    container.innerHTML = goals.map(g => `
      <div class="glass-card">
        <div class="flex-between mb-sm">
          <span style="font-weight:600">${Helpers.escapeHtml(g.title)}</span>
          <button class="icon-btn" onclick="TasksModule.deleteGoal('${g.id}')" style="width:24px;height:24px">
            <i class="fas fa-times" style="font-size:10px"></i>
          </button>
        </div>
        <div class="progress-bar mb-sm">
          <div class="progress-fill ${g.progress >= 80 ? 'success' : g.progress >= 40 ? 'warning' : ''}" 
               style="width:${g.progress}%"></div>
        </div>
        <div class="flex-between">
          <span style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${g.progress}% complete</span>
          <div class="flex-row gap-xs">
            <button class="btn btn-sm btn-secondary" onclick="TasksModule.updateGoalProgress('${g.id}', ${g.progress - 10})">-10</button>
            <button class="btn btn-sm btn-primary" onclick="TasksModule.updateGoalProgress('${g.id}', ${g.progress + 10})">+10</button>
          </div>
        </div>
        ${g.completed ? '<div class="badge badge-success mt-sm">✓ Achieved!</div>' : ''}
      </div>
    `).join('');
  },
  
  async aiBreakdown() {
    const goal = prompt('What do you want to accomplish? Describe your project or goal:');
    if (!goal?.trim()) return;
    
    Toast.info('AI is breaking down your goal into tasks...');
    
    try {
      const response = await MultiAgent.execute('planning', 'breakDownProject', goal, goal);
      
      // Parse tasks from response
      const taskMatches = response.match(/- \[ \]\s*(.+?)(?=\n|$)/g);
      if (taskMatches) {
        const tasks = Storage.get('tasks', []);
        const newTasks = taskMatches.map(m => ({
          id: Helpers.uid(),
          title: m.replace(/- \[ \]\s*/, '').trim(),
          priority: 'medium',
          dueDate: Helpers.today(),
          completed: false,
          completedDate: null,
          createdDate: Helpers.today(),
          createdAt: new Date().toISOString(),
          project: goal
        }));
        tasks.unshift(...newTasks);
        Storage.set('tasks', tasks);
        
        this.renderTaskList();
        this.renderDailyPlanner();
        Toast.success(`${newTasks.length} tasks generated from AI plan!`);
      }
    } catch (e) {
      Toast.error(`AI Error: ${e.message}`);
    }
  },
  
  updateAnalytics() {
    const tasks = Storage.get('tasks', []);
    const analytics = Storage.get('analytics', {});
    const today = Helpers.today();
    
    // Update completed count
    analytics.completedTasks = tasks.filter(t => t.completed).length;
    
    // Update streak
    if (analytics.lastActiveDate) {
      const lastDate = new Date(analytics.lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / 86400000);
      
      if (diffDays === 0) {
        // Already active today, keep streak
      } else if (diffDays === 1) {
        analytics.streakDays = (analytics.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        analytics.streakDays = 1;
      }
    } else {
      analytics.streakDays = 1;
    }
    analytics.lastActiveDate = today;
    Storage.set('analytics', analytics);
  }
};
