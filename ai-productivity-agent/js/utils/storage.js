/* ============================================
   Storage Manager - LocalStorage with IndexedDB fallback
   ============================================ */
const Storage = {
  PREFIX: 'aiagent_',
  
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage.get error:', e);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage.set error (quota exceeded?):', e);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (e) {
      console.warn('Storage.remove error:', e);
    }
  },
  
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Storage.clear error:', e);
    }
  },
  
  getAll() {
    const data = {};
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
      keys.forEach(k => {
        const rawKey = k.slice(this.PREFIX.length);
        try { data[rawKey] = JSON.parse(localStorage.getItem(k)); }
        catch { data[rawKey] = localStorage.getItem(k); }
      });
    } catch (e) {
      console.warn('Storage.getAll error:', e);
    }
    return data;
  },
  
  exportAll() {
    return JSON.stringify(this.getAll(), null, 2);
  },
  
  importAll(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (e) {
      console.warn('Storage.importAll error:', e);
      return false;
    }
  }
};

// Data schema defaults
const DataStore = {
  init() {
    if (!Storage.get('initialized')) {
      Storage.set('tasks', []);
      Storage.set('projects', []);
      Storage.set('goals', []);
      Storage.set('studySubjects', []);
      Storage.set('flashcards', {});
      Storage.set('quizResults', []);
      Storage.set('memory', { goals: [], projects: [], progress: {}, notes: [] });
      Storage.set('researchReports', []);
      Storage.set('documents', []);
      Storage.set('dailyPlans', {});
      Storage.set('analytics', {
        completedTasks: 0,
        totalFocusTime: 0,
        streakDays: 0,
        lastActiveDate: null
      });
      Storage.set('chatHistory', { research: [], study: [], projects: [], documents: [] });
      Storage.set('initialized', true);
    }
  },
  
  reset() {
    Storage.clear();
    this.init();
  }
};
