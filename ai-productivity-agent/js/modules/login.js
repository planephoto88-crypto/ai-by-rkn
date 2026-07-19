/* ============================================
   Login Module — Email-based access control
   ============================================ */
const LoginModule = {
  async render(container) {
    const savedEmail = Storage.get('user_email', '');
    
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:70vh">
        <div class="card glass-heavy" style="max-width:420px;width:100%;padding:var(--space-2xl);text-align:center">
          <div style="font-size:3rem;margin-bottom:var(--space-md)">🔐</div>
          <h2 style="margin-bottom:var(--space-sm)">AI Productivity Agent</h2>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);font-size:var(--font-size-sm)">
            Enter your email to access. Only permitted users can use this app.
          </p>
          <div style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div class="input-with-icon" style="position:relative">
              <i class="fas fa-envelope" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-tertiary)"></i>
              <input id="login-email" type="email" value="${savedEmail}" placeholder="your@email.com"
                style="padding:var(--space-sm) var(--space-md) var(--space-sm) 40px;width:100%;background:var(--surface-1);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);font-size:var(--font-size-base)">
            </div>
            <button id="login-submit" class="btn btn-primary btn-lg" style="width:100%;justify-content:center">
              <i class="fas fa-sign-in-alt"></i> Access App
            </button>
          </div>
          <p id="login-error" style="color:var(--danger);font-size:var(--font-size-sm);margin-top:var(--space-md);display:none"></p>
          <p style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:var(--space-lg)">
            Don't have access? Contact the admin.
          </p>
        </div>
      </div>
    `;

    const emailInput = container.querySelector('#login-email');
    const submitBtn = container.querySelector('#login-submit');
    const errorEl = container.querySelector('#login-error');

    const doLogin = async () => {
      const email = emailInput?.value.trim();
      if (!email) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Please enter your email';
        return;
      }
      if (!email.includes('@')) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Please enter a valid email';
        return;
      }

      // Store email
      Storage.set('user_email', email);

      // Verify access with server
      try {
        const r = await fetch('/api/health');
        if (r.ok) {
          // Server is online — validate access
          const check = await fetch('/api/admin/access', {
            headers: { 'x-user-email': email }
          }).catch(() => null);

          if (check && !check.ok) {
            errorEl.style.display = 'block';
            errorEl.textContent = '❌ This email is not authorized. Contact admin.';
            return;
          }
        }
      } catch {
        // Server offline — allow local access attempt
      }

      // Success — navigate to dashboard
      Toast.success('Welcome! 🎉');
      App.isLoggedIn = true;
      App.navigate('dashboard');
    };

    submitBtn?.addEventListener('click', doLogin);
    emailInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });

    // Auto-focus
    setTimeout(() => emailInput?.focus(), 200);
  }
};
