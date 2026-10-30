/**
 * Example — booking backend (example for Cloudflare Workers)
 * ---------------------------------------------------------------------
 * Receives a booking from the site (POST JSON), validates it and sends
 * a notification to the café staff in Telegram.
 *
 * Environment variables (Settings → Variables in Cloudflare):
 *   TELEGRAM_BOT_TOKEN — bot token from @BotFather
 *   TELEGRAM_CHAT_ID   — id of the staff chat or group
 *   ALLOWED_ORIGIN     — the site origin, e.g. https://timur-alt2008.github.io
 *
 * Once deployed, put the worker URL into assets/js/config.js:
 *   booking: { mode: 'endpoint', endpoint: 'https://<your-worker>.workers.dev' }
 */

const OCCASIONS = {
  casual: 'Just catching up',
  birthday: 'Birthday',
  date: 'Date',
  business: 'Business meeting',
  work: 'Working on a laptop',
};

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(env) },
  });
}

function validate(b) {
  if (!b || typeof b !== 'object') return 'Empty request';
  if (!Number.isInteger(b.guests) || b.guests < 1 || b.guests > 8) return 'Invalid number of guests';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return 'Invalid date';
  if (!/^\d{2}:\d{2}$/.test(b.time || '')) return 'Invalid time';
  if (!/^\d{1,2}$/.test(String(b.table || ''))) return 'No table selected';
  if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.length > 60) return 'Invalid name';
  if (String(b.phone || '').replace(/\D/g, '').length !== 12) return 'Invalid phone number';
  if (b.comment && String(b.comment).length > 300) return 'Comment is too long';
  return null;
}

const escapeHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, env);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, env);
    }

    const error = validate(body);
    if (error) return json({ ok: false, error }, 422, env);

    const id = 'EX-' + Math.floor(1000 + Math.random() * 9000);
    const text = [
      `☕ <b>New booking ${id}</b>`,
      `📅 ${body.date} at ${body.time}`,
      `👥 Guests: ${body.guests}`,
      `🪑 Table no. ${escapeHtml(body.table)} (${escapeHtml(body.zone || '')})`,
      `🙂 ${escapeHtml(body.name)} · ${escapeHtml(body.phone)}`,
      `🎉 ${OCCASIONS[body.occasion] || '—'}`,
      body.comment ? `💬 ${escapeHtml(body.comment)}` : '',
    ].filter(Boolean).join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!tg.ok) return json({ ok: false, error: 'Could not send the notification' }, 502, env);
    return json({ ok: true, id }, 200, env);
  },
};
