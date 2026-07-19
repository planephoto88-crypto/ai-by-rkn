/* ============================================
   Dashboard Module
   ============================================ */
const DashboardModule = {
  charts: {},
  
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>👋 Welcome back</h2>
        <p>Here's your productivity overview for today</p>
      </div>
      
      <!-- Stats Row -->
      <div class="grid-4 stagger mb-lg">
        <div class="glass-card stat-card" id="stat-productivity">
          <div class="stat-icon">⚡</div>
          <div class="stat-value" id="productivity-score">--</div>
          <div class="stat-label">Productivity Score</div>
          <div class="stat-change positive" id="productivity-change"></div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value" id="completed-tasks-stat">0</div>
          <div class="stat-label">Tasks Completed</div>
          <div class="stat-change" id="tasks-change"></div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value" id="active-goals-stat">0</div>
          <div class="stat-label">Active Goals</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value" id="streak-days">0</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid-2 mb-lg">
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">Weekly Progress</h3>
          </div>
          <canvas id="weekly-chart" height="220"></canvas>
        </div>
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">Task Distribution</h3>
          </div>
          <canvas id="task-pie-chart" height="220"></canvas>
        </div>
      </div>
      
      <!-- Today's Plan + Agent Quick Actions -->
      <div class="grid-2 mb-lg">
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">📅 Today's Plan</h3>
            <button class="btn btn-sm btn-primary" onclick="App.navigate('tasks')">
              <i class="fas fa-plus"></i> Add Task
            </button>
          </div>
          <div id="today-tasks-list" class="flex-col gap-sm"></div>
        </div>
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">🤖 AI Agents</h3>
          </div>
          <div class="flex-col gap-sm" id="agent-quick-actions">
            <div class="agent-card glass" data-agent="research" onclick="App.navigate('research')" style="cursor:pointer">
              <div class="agent-card-avatar" style="background:rgba(108,92,231,0.2)">🔍</div>
              <div class="agent-card-info">
                <div class="agent-card-name">Research Agent</div>
                <div class="agent-card-status">Deep research & reports</div>
              </div>
              <i class="fas fa-chevron-right" style="color:var(--text-tertiary)"></i>
            </div>
            <div class="agent-card glass" data-agent="study" onclick="App.navigate('study')" style="cursor:pointer">
              <div class="agent-card-avatar" style="background:rgba(0,206,201,0.2)">🎓</div>
              <div class="agent-card-info">
                <div class="agent-card-name">Study Agent</div>
                <div class="agent-card-status">Flashcards, quizzes, revision</div>
              </div>
              <i class="fas fa-chevron-right" style="color:var(--text-tertiary)"></i>
            </div>
            <div class="agent-card glass" data-agent="coding" onclick="App.navigate('research')" style="cursor:pointer">
              <div class="agent-card-avatar" style="background:rgba(253,121,168,0.2)">💻</div>
              <div class="agent-card-info">
                <div class="agent-card-name">Coding Agent</div>
                <div class="agent-card-status">Code generation & review</div>
              </div>
              <i class="fas fa-chevron-right" style="color:var(--text-tertiary)"></i>
            </div>
            <div class="agent-card glass" data-agent="planning" onclick="App.navigate('projects')" style="cursor:pointer">
              <div class="agent-card-avatar" style="background:rgba(253,203,110,0.2)">📋</div>
              <div class="agent-card-info">
                <div class="agent-card-name">Planning Agent</div>
                <div class="agent-card-status">Project breakdown & timelines</div>
              </div>
              <i class="fas fa-chevron-right" style="color:var(--text-tertiary)"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="glass-card">
        <div class="card-header">
          <h3 class="card-title">🕐 Recent Activity</h3>
        </div>
        <div id="recent-activity" class="flex-col gap-sm">
          <div class="empty-state">
            <i class="fas fa-chart-line"></i>
            <h3>Start being productive!</h3>
            <p>Your activity will appear here</p>
          </div>
        </div>
      </div>
    `;
    
    this.loadData();
  },
  
  loadData() {
    const analytics = Storage.get('analytics', {});
    const tasks = Storage.get('tasks', []);
    const goals = Storage.get('goals', []);
    const today = Helpers.today();
    
    // Update stats
    const completedToday = tasks.filter(t => t.completed && t.completedDate === today).length;
    const totalCompleted = analytics.completedTasks || 0;
    const yesterdayCompleted = tasks.filter(t => t.completed && t.completedDate === this._yesterdayDate()).length;
    
    // Calculate productivity score
    let productivityScore = 0;
    if (tasks.length > 0) {
      const doneToday = tasks.filter(t => t.completed && t.completedDate === today).length;
      const totalToday = tasks.filter(t => t.createdDate === today || (!t.completedDate && t.createdDate <= today)).length;
      productivityScore = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : (doneToday > 0 ? 100 : 0);
    }
    // Bonus for streak
    const streak = analytics.streakDays || 0;
    productivityScore = Math.min(100, productivityScore + streak * 3);
    
    const scoreEl = $('#productivity-score');
    if (scoreEl) scoreEl.textContent = `${productivityScore}%`;
    
    const changeEl = $('#productivity-change');
    if (changeEl) {
      if (completedToday > yesterdayCompleted) {
        changeEl.innerHTML = `<i class="fas fa-arrow-up"></i> +${completedToday - yesterdayCompleted} from yesterday`;
        changeEl.className = 'stat-change positive';
      } else if (completedToday > 0) {
        changeEl.innerHTML = `<i class="fas fa-minus"></i> Same as yesterday`;
        changeEl.className = 'stat-change';
      }
    }
    
    const tasksEl = $('#completed-tasks-stat');
    if (tasksEl) tasksEl.textContent = totalCompleted;
    
    const activeGoalsEl = $('#active-goals-stat');
    if (activeGoalsEl) activeGoalsEl.textContent = goals.filter(g => !g.completed).length;
    
    const streakEl = $('#streak-days');
    if (streakEl) streakEl.textContent = streak;
    
    // Today's tasks
    this.renderTodayTasks(tasks, today);
    
    // Charts
    this.renderCharts(tasks);
    
    // Recent activity
    this.renderRecentActivity(tasks, goals);
  },
  
  renderTodayTasks(tasks, today) {
    const container = $('#today-tasks-list');
    if (!container) return;
    
    const todayTasks = tasks.filter(t => t.createdDate === today || t.dueDate === today);
    
    if (todayTasks.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:var(--space-lg)">
        <i class="fas fa-calendar-check" style="font-size:1.5rem"></i>
        <p style="margin:0;color:var(--text-tertiary)">No tasks planned for today</p>
      </div>`;
      return;
    }
    
    container.innerHTML = todayTasks.slice(0, 5).map(t => `
      <div class="task-item">
        <div class="task-checkbox ${t.completed ? 'checked' : ''}" 
             onclick="App.modules.tasks.toggleTask('${t.id}'); DashboardModule.loadData();">
        </div>
        <div class="task-content">
          <div class="task-title ${t.completed ? 'done' : ''}">${Helpers.escapeHtml(t.title)}</div>
          <div class="task-meta">
            ${t.priority ? `<span class="badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}">${t.priority}</span>` : ''}
            ${t.project ? `<span>📁 ${Helpers.escapeHtml(t.project)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },
  
  renderCharts(tasks) {
    // Destroy existing charts
    Object.values(this.charts).forEach(c => c.destroy?.());
    this.charts = {};
    
    // Weekly chart
    const weeklyCanvas = $('#weekly-chart');
    if (weeklyCanvas) {
      const days = [];
      const completedData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        days.push(Helpers.weekDay(dateStr));
        completedData.push(tasks.filter(t => t.completed && t.completedDate === dateStr).length);
      }
      
      this.charts.weekly = new Chart(weeklyCanvas, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [{
            label: 'Completed',
            data: completedData,
            backgroundColor: 'rgba(108, 92, 231, 0.6)',
            borderColor: 'rgba(108, 92, 231, 1)',
            borderWidth: 1,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              ticks: { stepSize: 1, color: getComputedStyle(document.body).getPropertyValue('--text-tertiary') },
              grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
            },
            x: { 
              ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-tertiary') },
              grid: { display: false }
            }
          }
        }
      });
    }
    
    // Task distribution pie chart
    const pieCanvas = $('#task-pie-chart');
    if (pieCanvas) {
      const done = tasks.filter(t => t.completed).length;
      const pending = tasks.filter(t => !t.completed).length;
      
      this.charts.pie = new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [done, pending],
            backgroundColor: ['rgba(0, 184, 148, 0.7)', 'rgba(108, 92, 231, 0.4)'],
            borderColor: ['rgba(0, 184, 148, 1)', 'rgba(108, 92, 231, 0.6)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary'), padding: 20 }
            }
          }
        }
      });
    }
  },
  
  renderRecentActivity(tasks, goals) {
    const container = $('#recent-activity');
    if (!container) return;
    
    // Combine all activities
    const activities = [
      ...tasks.filter(t => t.completed).map(t => ({
        type: 'task',
        text: `Completed "${t.title}"`,
        date: t.completedDate || t.updatedAt || t.createdAt,
        icon: 'fa-check-circle',
        color: 'var(--success)'
      })),
      ...goals.filter(g => g.completed).map(g => ({
        type: 'goal',
        text: `Achieved goal "${g.title}"`,
        date: g.completedDate || g.updatedAt,
        icon: 'fa-trophy',
        color: 'var(--warning)'
      })),
      ...tasks.filter(t => !t.completed && t.createdAt).slice(0, 5).map(t => ({
        type: 'task-new',
        text: `Added task "${t.title}"`,
        date: t.createdAt,
        icon: 'fa-plus-circle',
        color: 'var(--info)'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    if (activities.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <i class="fas fa-chart-line"></i>
        <h3>No activity yet</h3>
        <p>Your recent actions will appear here</p>
      </div>`;
      return;
    }
    
    container.innerHTML = activities.map(a => `
      <div class="flex-row" style="padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
        <i class="fas ${a.icon}" style="color:${a.color};font-size:var(--font-size-lg)"></i>
        <span style="flex:1">${a.text}</span>
        <span style="color:var(--text-tertiary);font-size:var(--font-size-xs)">${Helpers.timeAgo(a.date)}</span>
      </div>
    `).join('');
  },
  
  _yesterdayDate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
};
