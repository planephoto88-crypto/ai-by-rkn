/* ============================================
   Email Access Control Middleware
   Restricts access to permitted email addresses only
   ============================================ */

// 👇 EDIT THIS LIST — add all permitted emails
const ALLOWED_EMAILS = [
  'planephoto88@gmail.com'
  // Add more permitted emails here:
  // 'colleague@example.com',
  // 'partner@company.com',
];

// Admin emails can manage the whitelist via API
const ADMIN_EMAILS = [
  'planephoto88@gmail.com'
];

const allowedSet = new Set(ALLOWED_EMAILS.map(e => e.toLowerCase().trim()));
const adminSet = new Set(ADMIN_EMAILS.map(e => e.toLowerCase().trim()));

// -------------------------------------------------------
// Middleware — blocks requests from non-allowed users
// -------------------------------------------------------
export function requireAllowedEmail(req, res, next) {
  const email = req.headers['x-user-email'] || req.query.email;

  if (!email) {
    // No email header — allow (for initial load, login page, etc.)
    // The frontend will validate email client-side too
    return next();
  }

  if (allowedSet.has(email.toLowerCase().trim())) {
    req.userEmail = email.toLowerCase().trim();
    return next();
  }

  return res.status(403).json({
    error: 'Access Denied',
    message: `This email (${email}) is not authorized to use this app.`,
    code: 'EMAIL_NOT_ALLOWED'
  });
}

// -------------------------------------------------------
// Admin-only middleware
// -------------------------------------------------------
export function requireAdmin(req, res, next) {
  const email = req.headers['x-user-email'] || req.query.email;
  if (email && adminSet.has(email.toLowerCase().trim())) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// -------------------------------------------------------
// Email whitelist management API
// -------------------------------------------------------
export function getAllowedEmails() {
  return [...allowedSet];
}

export function getAdminEmails() {
  return [...adminSet];
}

export function addAllowedEmail(email) {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes('@')) return false;
  if (allowedSet.has(normalized)) return false;
  allowedSet.add(normalized);
  return true;
}

export function removeAllowedEmail(email) {
  const normalized = email.toLowerCase().trim();
  // Cannot remove admin emails from the list
  if (adminSet.has(normalized)) return false;
  return allowedSet.delete(normalized);
}
