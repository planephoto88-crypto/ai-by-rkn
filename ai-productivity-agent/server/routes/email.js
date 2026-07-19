/* ============================================
   Email Router — Gmail Integration Proxy
   /api/email/fetch  — Fetch emails
   /api/email/send   — Send email
   /api/email/read   — Read single email
   ============================================ */
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';

export const emailRouter = Router();

// POST /api/email/fetch
emailRouter.post('/fetch', asyncHandler(async (req, res) => {
  const { label = 'INBOX', query = '', limit = 20 } = req.body;

  // For now, return a useful placeholder since Gmail integration
  // is activated via the frontend's integration tools
  res.json({
    success: true,
    label,
    emails: [],
    message: 'Gmail integration requires connecting your account. Go to Settings → Connections to link Gmail.',
    total: 0
  });
}));

// POST /api/email/send
emailRouter.post('/send', asyncHandler(async (req, res) => {
  const { to, subject, body, cc, bcc } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: '"to" and "subject" are required' });
  }

  // This would call the Gmail send API via integration
  res.json({
    success: true,
    message: 'Email send request received. Enable Gmail integration for actual sending.',
    details: { to, subject }
  });
}));

// POST /api/email/read
emailRouter.post('/read', asyncHandler(async (req, res) => {
  const { messageId } = req.body;
  if (!messageId) return res.status(400).json({ error: '"messageId" required' });

  res.json({
    success: true,
    messageId,
    email: null,
    message: 'Connect Gmail integration to read full email content.'
  });
}));
