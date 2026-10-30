/**
 * Example — серверная часть бронирования (пример для Cloudflare Workers)
 * ---------------------------------------------------------------------
 * Принимает заявку с сайта (POST JSON), проверяет её и отправляет
 * уведомление администратору кофейни в Telegram.
 *
 * Переменные окружения (Settings → Variables в Cloudflare):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата или группы администраторов
 *   ALLOWED_ORIGIN     — адрес сайта, например https://timur-alt2008.github.io
 *
 * После публикации укажите адрес воркера в assets/js/config.js:
 *   booking: { mode: 'endpoint', endpoint: 'https://<ваш-воркер>.workers.dev' }
 */

const OCCASIONS = {
  casual: 'Просто встреча',
  birthday: 'День рождения',
  date: 'Свидание',
  business: 'Деловая встреча',
  work: 'Работа с ноутбуком',
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
  if (!b || typeof b !== 'object') return 'Пустая заявка';
  if (!Number.isInteger(b.guests) || b.guests < 1 || b.guests > 8) return 'Неверное число гостей';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return 'Неверная дата';
  if (!/^\d{2}:\d{2}$/.test(b.time || '')) return 'Неверное время';
  if (!/^\d{1,2}$/.test(String(b.table || ''))) return 'Не выбран столик';
  if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.length > 60) return 'Неверное имя';
  if (String(b.phone || '').replace(/\D/g, '').length !== 12) return 'Неверный телефон';
  if (b.comment && String(b.comment).length > 300) return 'Слишком длинный комментарий';
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
      return json({ ok: false, error: 'Некорректный JSON' }, 400, env);
    }

    const error = validate(body);
    if (error) return json({ ok: false, error }, 422, env);

    const id = 'EX-' + Math.floor(1000 + Math.random() * 9000);
    const text = [
      `☕ <b>Новая бронь ${id}</b>`,
      `📅 ${body.date} в ${body.time}`,
      `👥 Гостей: ${body.guests}`,
      `🪑 Столик № ${escapeHtml(body.table)} (${escapeHtml(body.zone || '')})`,
      `🙂 ${escapeHtml(body.name)} · ${escapeHtml(body.phone)}`,
      `🎉 ${OCCASIONS[body.occasion] || '—'}`,
      body.comment ? `💬 ${escapeHtml(body.comment)}` : '',
    ].filter(Boolean).join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!tg.ok) return json({ ok: false, error: 'Не удалось отправить уведомление' }, 502, env);
    return json({ ok: true, id }, 200, env);
  },
};
