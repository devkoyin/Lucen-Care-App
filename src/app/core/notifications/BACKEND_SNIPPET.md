# Medication Notifications — add to your Node.js course backend

## Overview

Angular sends the patient's medication schedule once. Your backend stores it and runs
two cron jobs — one every minute for dose reminders, one daily for refill alerts.
No browser tab needs to be open.

---

## 1. Install dependencies

```bash
npm install nodemailer node-cron
```

Add to your `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Lucen Care <your-email@gmail.com>
```

For Gmail, use an **App Password**:  
Google Account → Security → 2-Step Verification → App Passwords

---

## 2. Create `routes/notifications.js`

```javascript
const express    = require('express');
const nodemailer = require('nodemailer');
const cron       = require('node-cron');
const router     = express.Router();

// ── Email transporter ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ── In-memory store ────────────────────────────────────────────
// Replace with your DB once you're ready (e.g. save to a users/medications table)
// Map<userId, { email, timezone, medications, sentToday }>
const store = new Map();

// ── Routes ─────────────────────────────────────────────────────

// Angular calls this on page load and whenever a medication is added
router.post('/register', (req, res) => {
  const { userId, email, timezone, medications } = req.body;
  if (!userId || !email || !Array.isArray(medications)) {
    return res.status(400).json({ error: 'userId, email and medications are required' });
  }

  const existing = store.get(userId);
  store.set(userId, {
    email,
    timezone: timezone || 'Africa/Lagos',
    medications,
    // preserve sentToday so re-registration doesn't re-fire today's notifications
    sentToday: existing?.sentToday ?? {},
  });

  console.log(`[MedNotif] Registered ${medications.length} medication(s) for ${email}`);
  res.json({ ok: true, registered: medications.length });
});

// Angular calls this when the patient signs out
router.delete('/unregister/:userId', (req, res) => {
  store.delete(req.params.userId);
  res.json({ ok: true });
});

// ── Helpers ────────────────────────────────────────────────────

function nowTimeLabel(timezone) {
  // Returns e.g. "8:00 AM" — matches schedule strings stored in Angular
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  });
}

function todayISO(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
}

function daysUntil(refillISO, timezone) {
  const today  = new Date(todayISO(timezone) + 'T00:00:00');
  const refill = new Date(refillISO          + 'T00:00:00');
  return Math.round((refill - today) / 86_400_000);
}

// ── Cron: dose reminders — every minute ───────────────────────
cron.schedule('* * * * *', async () => {
  for (const [, entry] of store) {
    const { email, timezone, medications, sentToday } = entry;
    const now   = nowTimeLabel(timezone);
    const today = todayISO(timezone);

    for (const med of medications) {
      if (!Array.isArray(med.schedule)) continue;

      for (const scheduledTime of med.schedule) {
        if (scheduledTime !== now) continue;

        const key = `dose::${med.id}::${scheduledTime}::${today}`;
        if (sentToday[key]) continue;

        try {
          await transporter.sendMail({
            from:    process.env.SMTP_FROM,
            to:      email,
            subject: `Reminder — time to take your ${med.name}`,
            html:    doseHtml(med.name, med.dosage, scheduledTime),
          });
          sentToday[key] = true;
          console.log(`[DOSE] ${email} — ${med.name} at ${scheduledTime}`);
        } catch (err) {
          console.error(`[DOSE ERROR] ${med.name}:`, err.message);
        }
      }
    }
  }
});

// ── Cron: refill alerts — daily at 8 AM WAT (7 AM UTC) ────────
cron.schedule('0 7 * * *', async () => {
  for (const [, entry] of store) {
    const { email, timezone, medications, sentToday } = entry;
    const today = todayISO(timezone);

    for (const med of medications) {
      if (!med.refillDateISO) continue;

      const days = daysUntil(med.refillDateISO, timezone);
      if (days !== 3) continue;

      const key = `refill::${med.id}::${today}`;
      if (sentToday[key]) continue;

      try {
        await transporter.sendMail({
          from:    process.env.SMTP_FROM,
          to:      email,
          subject: `Refill needed — ${med.name} runs out in 3 days`,
          html:    refillHtml(med.name, med.dosage),
        });
        sentToday[key] = true;
        console.log(`[REFILL] ${email} — ${med.name}`);
      } catch (err) {
        console.error(`[REFILL ERROR] ${med.name}:`, err.message);
      }
    }
  }
});

// ── Email templates ────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function doseHtml(name, dosage, time) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#065f46;padding:24px 32px;">
      <p  style="margin:0 0 6px;color:#6ee7b7;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Lucen Care</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Medication Reminder</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;">It's time to take your medication.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;">
        <p style="margin:0;font-size:24px;font-weight:800;color:#064e3b;">💊 ${esc(name)}</p>
        <p style="margin:8px 0 0;color:#059669;font-size:15px;font-weight:600;">
          ${esc(dosage)}&nbsp;&nbsp;·&nbsp;&nbsp;Scheduled for ${esc(time)}
        </p>
      </div>
      <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">
        If you have already taken this dose, you can ignore this message.
        Consistent adherence leads to better health outcomes — keep it up.
      </p>
    </div>
    <div style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Medication reminders from your Lucen Care account.</p>
    </div>
  </div>
</body>
</html>`;
}

function refillHtml(name, dosage) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#065f46;padding:24px 32px;">
      <p  style="margin:0 0 6px;color:#6ee7b7;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Lucen Care</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Refill Reminder</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;">Your medication supply is running low.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px 24px;">
        <p style="margin:0;font-size:24px;font-weight:800;color:#78350f;">⚠️ ${esc(name)}</p>
        <p style="margin:8px 0 0;color:#d97706;font-size:15px;font-weight:600;">
          ${esc(dosage)}&nbsp;&nbsp;·&nbsp;&nbsp;Runs out in <strong>3 days</strong>
        </p>
      </div>
      <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.7;">
        Please contact your pharmacy or prescriber to arrange a refill before you run out.
      </p>
    </div>
    <div style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Refill alerts from your Lucen Care account.</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = router;
```

---

## 3. Mount it in your main `app.js` / `index.js`

```javascript
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);
```

---

## When you add a real database later

Replace the in-memory `Map` with your DB. The two changes are:

- **On `POST /register`:** upsert a row in a `medication_schedules` table
- **In each cron job:** query `SELECT * FROM medication_schedules` instead of iterating `store`

The cron logic and email templates stay exactly the same.
