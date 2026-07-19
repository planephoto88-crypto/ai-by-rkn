/* ============================================
   Toast Notification System
   ============================================ */
const Toast = {
  container: null,
  
  init() {
    this.container = $('#toast-container');
  },
  
  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const toast = DOM.create('div', {
      className: `toast glass-heavy toast-${type}`,
      style: { animation: 'toastIn 0.3s ease' }
    }, [
      DOM.create('i', { className: `fas ${icons[type]} toast-icon` }),
      DOM.create('span', { className: 'toast-msg' }, message)
    ]);
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
    
    return toast;
  },
  
  success(msg, dur) { return this.show(msg, 'success', dur); },
  error(msg, dur) { return this.show(msg, 'error', dur); },
  warning(msg, dur) { return this.show(msg, 'warning', dur); },
  info(msg, dur) { return this.show(msg, 'info', dur); }
};
