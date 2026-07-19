/* ============================================
   Helper Utilities
   ============================================ */
const Helpers = {
  // Generate unique ID
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  },
  
  // Format date
  formatDate(date, format = 'short') {
    const d = new Date(date);
    const opts = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    };
    return d.toLocaleDateString('en-US', opts[format] || opts.short);
  },
  
  // Time ago
  timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return this.formatDate(date, 'medium');
  },
  
  // Escape HTML
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  // Truncate text
  truncate(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  },
  
  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  
  // Throttle
  throttle(fn, limit = 300) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      }
    };
  },
  
  // Get today's date string (YYYY-MM-DD)
  today() {
    return new Date().toISOString().slice(0, 10);
  },
  
  // Calculate percentage
  percent(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  },
  
  // Random item from array
  randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  
  // Group array by key
  groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const val = typeof key === 'function' ? key(item) : item[key];
      (groups[val] = groups[val] || []).push(item);
      return groups;
    }, {});
  },
  
  // Sort array by key
  sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
      const va = typeof key === 'function' ? key(a) : a[key];
      const vb = typeof key === 'function' ? key(b) : b[key];
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  },
  
  // Get week day name
  weekDay(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  },
  
  // Is today
  isToday(dateStr) {
    return dateStr === this.today();
  },
  
  // Days between
  daysBetween(date1, date2) {
    return Math.ceil(Math.abs(new Date(date1) - new Date(date2)) / 86400000);
  },
  
  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  },
  
  // Download as file
  downloadFile(content, filename, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// DOM helpers
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

const DOM = {
  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      }
      else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      }
      else el.setAttribute(key, val);
    });
    if (typeof children === 'string') el.textContent = children;
    else if (Array.isArray(children)) children.forEach(c => {
      if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  },
  
  empty(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  },
  
  show(el, display = '') {
    if (typeof el === 'string') el = $(el);
    if (el) el.style.display = display || 'block';
  },
  
  hide(el) {
    if (typeof el === 'string') el = $(el);
    if (el) el.style.display = 'none';
  },
  
  toggle(el) {
    if (typeof el === 'string') el = $(el);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  }
};
