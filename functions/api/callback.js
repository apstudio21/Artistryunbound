// Decap CMS GitHub login, step 2: GitHub redirects here with ?code, we swap it for a token
// and hand it to the CMS window that opened this popup.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const cookie = (request.headers.get('Cookie') || '').match(/oauth_state=([\w-]+)/);
  const page = (status, body) => new Response(
    '<!doctype html><meta charset="utf-8"><body><script>' + body + '<\/script>',
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'oauth_state=; Path=/api; Max-Age=0' } });
  const fail = (msg) => page(400, 'document.body.textContent=' + JSON.stringify(msg));

  const code = url.searchParams.get('code');
  if (!code || !cookie || cookie[1] !== url.searchParams.get('state')) return fail('Login failed: invalid state. Close this window and try again.');

  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
  });
  const t = await r.json().catch(() => ({}));
  if (!t.access_token) return fail('Login failed: GitHub did not return a token.');

  const msg = 'authorization:github:success:' + JSON.stringify({ token: t.access_token, provider: 'github' });
  return page(200,
    'var o=' + JSON.stringify(url.origin) + ',m=' + JSON.stringify(msg) + ';' +
    'window.addEventListener("message",function(e){if(e.origin!==o)return;e.source.postMessage(m,o);window.close()});' +
    'window.opener.postMessage("authorizing:github",o);');
}
