// Cloudflare Pages Function: POST /api/order -> Telegram message to the owner.
// Secrets (Cloudflare Pages -> Settings -> Variables and Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'not_configured' }, 500);

  // Same-origin only
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ ok: false }, 403);

  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false }, 400); }
  if (d['bot-field']) return json({ ok: true }); // honeypot: pretend success

  const type = d.type === 'paid' ? 'paid' : 'order';
  const f = {
    order: clip(d.order, 24), card: clip(d.card, 120), price: clip(d.price, 8), name: clip(d.name, 60),
    method: clip(d.method, 40), channel: ['Email', 'Telegram', 'WhatsApp'].includes(d.channel) ? d.channel : '?', contact: clip(d.contact, 80), wishes: clip(d.wishes, 600)
  };
  if (!/^AU-\d{4}-\d{4}$/.test(f.order) || !f.name || !f.contact) return json({ ok: false, error: 'invalid' }, 400);

  const head = type === 'paid' ? '✅ PAID? Check PayPal' : (Number(f.price) ? '📝 New order (not paid yet)' : '🎁 Free request');
  const lines = [head, '', 'Order: ' + f.order, 'Card: ' + f.card, 'Price: $' + f.price, 'Name: ' + f.name, f.channel + ': ' + f.contact];
  if (type === 'paid' && f.method) lines.splice(3, 0, 'Method: ' + f.method);
  if (f.wishes) lines.push('', 'Wishes: ' + f.wishes);

  const r = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), disable_web_page_preview: true })
  });
  return r.ok ? json({ ok: true }) : json({ ok: false, error: 'telegram' }, 502);
}
