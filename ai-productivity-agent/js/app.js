/* ============================================
   AI Productivity Agent - Main Application
   ============================================ */
const App = {
  currentPage: 'dashboard',
  isLoggedIn: false,
  themes: ['dark', 'light', 'midnight', 'forest', 'sunset', 'purple', 'ocean', 'rose', 'mono', 'neon'],
  themeIndex: 0,
  modules: {
    dashboard: DashboardModule,
    research: ResearchModule,
    study: StudyModule,
    tasks: TasksModule,
    projects: ProjectsModule,
    documents: DocumentsModule,
    memory: MemoryModule,
    scanner: ScannerModule,
    email: EmailModule,
    login: LoginModule
  },
  
  async init() {
    // Initialize data store
    DataStore.init();
    
    // Restore theme
    const savedTheme = Storage.get('theme', 'dark');
    this.themeIndex = this.themes.indexOf(savedTheme);
    if (this.themeIndex < 0) this.themeIndex = 0;
    document.body.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
    
    // Check server health
    const serverOk = await API.healthCheck();
    this.updateApiStatus(serverOk);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Show app
    setTimeout(() => {
      const loading = $('#loading-screen');
      const app = $('#app-container');
      if (loading) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.5s ease';
      }
      if (app) {
        app.style.display = 'flex';
        app.style.animation = 'slideUp 0.5s ease';
      }
      setTimeout(() => { if (loading) loading.style.display = 'none'; }, 500);
      
      // Check if user is logged in
      const savedEmail = Storage.get('user_email', '');
      if (savedEmail) {
        this.isLoggedIn = true;
        const savedPage = Storage.get('current_page', 'dashboard');
        this.navigate(savedPage);
      } else {
        // Show login
        this.navigate('login');
      }
    }, 1200);
    
    // Update streak on load
    this.updateDailyStreak();
  },
  
  setupEventListeners() {
    // Sidebar navigation
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.navigate(page);
      });
    });
    
    // Sidebar toggle
    $('#sidebar-toggle')?.addEventListener('click', () => {
      const sidebar = $('#sidebar');
      sidebar?.classList.toggle('collapsed');
      Storage.set('sidebar_collapsed', sidebar?.classList.contains('collapsed'));
    });
    
    // Restore sidebar state
    if (Storage.get('sidebar_collapsed', false)) {
      $('#sidebar')?.classList.add('collapsed');
    }
    
    // Mobile menu
    $('#mobile-menu-btn')?.addEventListener('click', () => {
      $('#sidebar')?.classList.toggle('mobile-open');
    });
    
    // Theme toggle — cycles through all 10 themes
    $('#theme-toggle')?.addEventListener('click', () => this.cycleTheme());
    
    // Settings
    $('#settings-btn')?.addEventListener('click', () => this.openSettings());
    $$('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeSettings());
    });
    $('.modal-overlay')?.addEventListener('click', () => this.closeSettings());
    
    // Toggle password visibility (keep for future fields)
    $$('.toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = $(`#${btn.dataset.target}`);
        if (target) {
          target.type = target.type === 'password' ? 'text' : 'password';
          const icon = btn.querySelector('i');
          if (icon) icon.className = target.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
      });
    });
    
    // Theme chips in settings
    $$('.theme-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.themeOption;
        if (theme) {
          this.setTheme(theme);
        }
      });
    });
    
    // Export/Import
    $('#export-data')?.addEventListener('click', () => {
      const data = Storage.exportAll();
      Helpers.downloadFile(data, `ai-agent-backup-${Helpers.today()}.json`);
      Toast.success('Data exported!');
    });
    
    $('#import-data-trigger')?.addEventListener('click', () => {
      $('#import-data-input')?.click();
    });
    
    $('#import-data-input')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = Storage.importAll(ev.target.result);
        if (success) {
          Toast.success('Data imported! Reloading...');
          setTimeout(() => location.reload(), 1000);
        } else {
          Toast.error('Invalid backup file');
        }
      };
      reader.readAsText(file);
    });
    
    $('#clear-data')?.addEventListener('click', () => {
      if (confirm('This will delete ALL your data. Are you sure?')) {
        DataStore.reset();
        Toast.success('All data cleared');
        setTimeout(() => location.reload(), 800);
      }
    });
    
    // Global search / Command palette
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeCommandPalette();
        this.closeSettings();
      }
      // Theme shortcut: Ctrl+Shift+T to cycle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.cycleTheme();
      }
    });
    
    // Click outside to close mobile sidebar
    document.addEventListener('click', (e) => {
      const sidebar = $('#sidebar');
      if (sidebar?.classList.contains('mobile-open') && 
          !sidebar.contains(e.target) && 
          e.target !== $('#mobile-menu-btn') &&
          !$('#mobile-menu-btn')?.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
    
    // Auto-resize textareas
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
      }
    });
    
    // Command palette
    $('#command-input')?.addEventListener('input', (e) => {
      this.filterCommands(e.target.value);
    });
    
    $('#command-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const active = $('.command-item.active');
        if (active) {
          active.click();
          this.closeCommandPalette();
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const items = $$('.command-item');
        const activeIdx = items.findIndex(i => i.classList.contains('active'));
        items.forEach(i => i.classList.remove('active'));
        const next = (activeIdx + 1) % items.length;
        items[next]?.classList.add('active');
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = $$('.command-item');
        const activeIdx = items.findIndex(i => i.classList.contains('active'));
        items.forEach(i => i.classList.remove('active'));
        const prev = (activeIdx - 1 + items.length) % items.length;
        items[prev]?.classList.add('active');
      }
    });
  },
  
  async navigate(page) {
    this.currentPage = page;
    Storage.set('current_page', page);
    
    // Update active nav
    $$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      research: 'Research Assistant',
      study: 'Study Assistant',
      tasks: 'Task Automation',
      projects: 'Project Manager',
      documents: 'Document Generator',
      memory: 'Memory System',
      scanner: 'AI Scanner & Analyzer',
      email: 'AI Email Companion',
      login: 'Login'
    };
    const titleEl = $('#page-title');
    if (titleEl) titleEl.textContent = titles[page] || page;
    
    // Render page
    const container = $('#page-content');
    if (!container) return;
    
    // Scroll to top
    container.scrollTop = 0;
    
    // Show loading state
    container.innerHTML = '<div style="text-align:center;padding:var(--space-3xl)"><div class="spinner" style="margin:0 auto"></div></div>';
    
    // Small delay for smooth transition
    await new Promise(r => setTimeout(r, 100));
    
    // Render module
    const module = this.modules[page];
    if (module && module.render) {
      await module.render(container);
    }
    
    // Close mobile sidebar
    $('#sidebar')?.classList.remove('mobile-open');
  },
  
  // -------------------------------------------------------
  // Theme system — 10 themes with cycling
  // -------------------------------------------------------
  setTheme(theme) {
    if (!this.themes.includes(theme)) return;
    this.themeIndex = this.themes.indexOf(theme);
    document.body.setAttribute('data-theme', theme);
    Storage.set('theme', theme);
    this.updateThemeIcon(theme);
    
    // Update chips in settings
    $$('.theme-chip').forEach(b => {
      b.classList.toggle('active', b.dataset.themeOption === theme);
    });

    // Update charts if on dashboard
    if (this.currentPage === 'dashboard') {
      DashboardModule.renderCharts(Storage.get('tasks', []));
    }

    Toast.show(`🎨 ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme`, 'info', 1500);
  },

  cycleTheme() {
    this.themeIndex = (this.themeIndex + 1) % this.themes.length;
    this.setTheme(this.themes[this.themeIndex]);
  },
  
  updateThemeIcon(theme) {
    const icon = $('#theme-toggle i');
    if (!icon) return;
    const icons = {
      dark: 'fa-moon', light: 'fa-sun', midnight: 'fa-moon', forest: 'fa-leaf',
      sunset: 'fa-fire', purple: 'fa-gem', ocean: 'fa-water', rose: 'fa-heart',
      mono: 'fa-circle', neon: 'fa-bolt'
    };
    icon.className = `fas ${icons[theme] || 'fa-palette'}`;
  },
  
  updateApiStatus(serverOk) {
    const status = $('#api-status');
    if (!status) return;
    if (serverOk) {
      status.innerHTML = '<i class="fas fa-server" style="color:var(--success)"></i>';
      status.title = 'Server connected ✓';
    } else {
      status.innerHTML = '<i class="fas fa-server" style="color:var(--warning)"></i>';
      status.title = 'Server unreachable — AI features unavailable';
    }
  },

  async checkServerStatus() {
    const container = $('#server-status');
    if (!container) return;
    try {
      const r = await fetch('/api/health');
      const data = await r.json();
      container.innerHTML = `
        <div style="color:var(--success);font-size:var(--font-size-2xl)">✓</div>
        <p style="font-weight:600;margin:var(--space-xs) 0">Server Connected</p>
        <p style="font-size:var(--font-size-xs);color:var(--text-tertiary)">
          Model: Gemini · Cache: ${data.cache?.hitRate || '0%'} hit rate<br>
          Uptime: ${Math.floor(data.uptime / 60)}m · Memory: ${(data.memory?.heapUsed / 1024 / 1024).toFixed(1)} MB
        </p>
      `;
      this.updateApiStatus(true);
    } catch {
      container.innerHTML = `
        <div style="color:var(--danger);font-size:var(--font-size-2xl)">✗</div>
        <p style="font-weight:600;margin:var(--space-xs) 0;color:var(--danger)">Server Offline</p>
        <p style="font-size:var(--font-size-xs);color:var(--text-tertiary)">
          AI features are unavailable. Start the server with <code>npm start</code>.
        </p>
      `;
      this.updateApiStatus(false);
    }
  },
  
  openSettings() {
    const modal = $('#settings-modal');
    if (!modal) return;
    
    // Check server status
    this.checkServerStatus();
    
    // Update theme chips
    const currentTheme = document.body.getAttribute('data-theme');
    $$('.theme-chip').forEach(b => {
      b.classList.toggle('active', b.dataset.themeOption === currentTheme);
    });
    
    modal.style.display = 'flex';
  },
  
  closeSettings() {
    const modal = $('#settings-modal');
    if (modal) modal.style.display = 'none';
  },
  
  openCommandPalette() {
    const palette = $('#command-palette');
    if (!palette) return;
    palette.style.display = 'flex';
    setTimeout(() => {
      const input = $('#command-input');
      input?.focus();
      this.renderCommands();
    }, 100);
  },
  
  closeCommandPalette() {
    const palette = $('#command-palette');
    if (palette) palette.style.display = 'none';
  },
  
  renderCommands() {
    const commands = [
      { name: 'Go to Dashboard', icon: '📊', action: () => this.navigate('dashboard') },
      { name: 'Open Research', icon: '🔍', action: () => this.navigate('research') },
      { name: 'Open Study', icon: '🎓', action: () => this.navigate('study') },
      { name: 'Open Tasks', icon: '✅', action: () => this.navigate('tasks') },
      { name: 'Open Projects', icon: '📊', action: () => this.navigate('projects') },
      { name: 'Open Documents', icon: '📄', action: () => this.navigate('documents') },
      { name: 'Open Memory', icon: '🧠', action: () => this.navigate('memory') },
      { name: 'Open AI Scanner', icon: '📡', action: () => this.navigate('scanner') },
      { name: 'Open AI Email', icon: '📧', action: () => this.navigate('email') },
      { name: 'Cycle Theme', icon: '🎨', action: () => this.cycleTheme() },
      { name: 'Open Settings', icon: '⚙️', action: () => { this.closeCommandPalette(); this.openSettings(); } },
    ];
    
    const container = $('#command-results');
    if (!container) return;
    
    container.innerHTML = commands.map((cmd, i) => `
      <div class="command-item ${i === 0 ? 'active' : ''}" onclick="(${cmd.action.toString()})()">
        <div class="cmd-icon">${cmd.icon}</div>
        <span class="cmd-name">${cmd.name}</span>
      </div>
    `).join('');
  },
  
  filterCommands(query) {
    const items = $$('.command-item');
    if (!query) {
      items.forEach(i => i.style.display = '');
      if (items.length > 0) {
        items.forEach(i => i.classList.remove('active'));
        items[0].classList.add('active');
      }
      return;
    }
    
    const lower = query.toLowerCase();
    let firstVisible = null;
    items.forEach(i => {
      const visible = i.textContent?.toLowerCase().includes(lower);
      i.style.display = visible ? '' : 'none';
      i.classList.remove('active');
      if (visible && !firstVisible) firstVisible = i;
    });
    if (firstVisible) firstVisible.classList.add('active');
  },
  
  updateDailyStreak() {
    const analytics = Storage.get('analytics', {});
    const today = Helpers.today();
    
    if (analytics.lastActiveDate) {
      const lastDate = new Date(analytics.lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / 86400000);
      
      if (diffDays === 1) {
        analytics.streakDays = (analytics.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        analytics.streakDays = 1;
      }
    }
    analytics.lastActiveDate = today;
    Storage.set('analytics', analytics);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
