// Renders voice cards from content/cards.json (inline JSON is the fallback). Text only via textContent.
(function () {
  var list = document.getElementById('cards'); if (!list) return;
  var current = null;
  function safe(v) { return typeof v === 'string' && /^\/?(images|audio)\/[\w\-./]+$/.test(v) ? v.replace(/^\//, '') : ''; }
  function fmt(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  var SKEL = '<div class="card__frame"><div class="card__cover"><span class="tag" hidden>Custom made</span><img width="1000" height="1000" loading="lazy" alt="">' +
    '<div class="player"><button class="play" type="button" aria-label="Play preview"><svg class="i-play" viewBox="0 0 12 12"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg><svg class="i-pause" viewBox="0 0 12 12"><path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z" fill="currentColor"/></svg></button>' +
    '<div class="wave" aria-hidden="true"></div><span class="time">0:00</span></div></div>' +
    '<input class="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek in preview"></div>' +
    '<div class="card__body"><h3 class="card__title"></h3><p class="card__text"></p><div class="card__buy"><span class="price"></span><button class="btn btn--sm" type="button"></button></div></div>';

  function build(item, n) {
    var el = document.createElement('article'), free = !Number(item.price);
    el.className = 'card' + (free ? ' card--free' : ''); el.innerHTML = SKEL;
    var q = function (s) { return el.querySelector(s); };
    var img = q('img'); img.src = safe(item.cover); img.alt = item.cover_alt || '';
    q('.card__title').textContent = item.title || ''; q('.card__text').textContent = item.text || '';
    q('.price').textContent = free ? 'Free' : '$' + item.price;
    var buy = q('.btn'); buy.textContent = free ? 'Get it free' : (item.custom ? 'Order yours' : 'Buy full version');
    if (item.custom) q('.tag').hidden = false;
    buy.addEventListener('click', function () { document.dispatchEvent(new CustomEvent('buy', { detail: item })); });
    var wave = q('.wave');
    for (var i = 0; i < 30; i++) { var b = document.createElement('i'); b.style.setProperty('--i', i); b.style.setProperty('--h', (28 + ((i * 37 + n * 17) % 62)) + '%'); wave.appendChild(b); }
    var play = q('.play'), seek = q('.seek'), time = q('.time'), src = safe(item.audio);
    if (!src) { play.disabled = true; seek.disabled = true; play.setAttribute('aria-label', 'Preview coming soon'); time.textContent = 'Soon'; return el; }
    var a = new Audio(); a.preload = 'metadata'; a.src = src;
    a.addEventListener('loadedmetadata', function () { time.textContent = fmt(a.duration); });
    a.addEventListener('timeupdate', function () { var p = a.duration ? a.currentTime / a.duration * 100 : 0; seek.value = p; seek.style.setProperty('--p', p + '%'); time.textContent = fmt(a.currentTime); });
    function stop() { el.classList.remove('is-playing'); play.setAttribute('aria-label', 'Play preview'); }
    a.addEventListener('pause', stop); a.addEventListener('ended', function () { a.currentTime = 0; stop(); });
    a.addEventListener('play', function () { if (current && current !== a) current.pause(); current = a; el.classList.add('is-playing'); play.setAttribute('aria-label', 'Pause preview'); });
    play.addEventListener('click', function () { a.paused ? a.play() : a.pause(); });
    seek.addEventListener('input', function () { if (a.duration) a.currentTime = seek.value / 100 * a.duration; });
    return el;
  }
  function render(d) {
    if (!d || !Array.isArray(d.items)) return;
    if (current) current.pause(); list.textContent = '';
    d.items.forEach(function (it, n) { list.appendChild(build(it, n)); });
    var h = document.querySelector('.voice [data-f="heading"]'), p = document.querySelector('.voice [data-f="intro"]');
    if (h && d.heading) h.textContent = d.heading; if (p && d.intro) p.textContent = d.intro;
  }
  try { render(JSON.parse(document.getElementById('cards-data').textContent)); } catch (e) {}
  fetch('content/cards.json').then(function (r) { return r.ok ? r.json() : null; }).then(render).catch(function () {});
})();
