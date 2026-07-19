/* ============================================
   Admin Router — Manage email whitelist
   ============================================ */
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAllowedEmails, addAllowedEmail, removeAllowedEmail } from '../middleware/auth.js';

export const adminRouter = Router();

// GET /api/admin/access  — List all allowed emails
adminRouter.get('/access', requireAdmin, (req, res) => {
  res.json({
    success: true,
    allowed: getAllowedEmails(),
    count: getAllowedEmails().length
  });
});

// POST /api/admin/access  — Add an email to whitelist
adminRouter.post('/access', requireAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '"email" is required' });

  const added = addAllowedEmail(email);
  if (!added) {
    return res.status(400).json({ error: `"${email}" is invalid or already allowed` });
  }
  res.json({ success: true, message: `Added "${email}" to access list`, allowed: getAllowedEmails() });
});

// DELETE /api/admin/access/:email  — Remove an email from whitelist
adminRouter.delete('/access/:email', requireAdmin, (req, res) => {
  const { email } = req.params;
  const removed = removeAllowedEmail(email);
  if (!removed) {
    return res.status(400).json({ error: `Cannot remove "${email}" (may be admin or not listed)` });
  }
  res.json({ success: true, message: `Removed "${email}" from access list`, allowed: getAllowedEmails() });
});
