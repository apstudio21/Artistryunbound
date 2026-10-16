// Info blocks, footer and the checkout dialog. Content from content/*.json (inline JSON is the fallback). Text only via textContent.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var J = function (id) { try { return JSON.parse(document.getElementById(id).textContent); } catch (e) { return null; } };
  var S = J('settings-data') || {}, I = J('info-data') || {};
  var load = function (f, cb) { fetch('content/' + f + '.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) cb(d); }).catch(function () {}); };
  var T = function (s) { return String(s || '').replace(/\{time\}/g, S.response_time || '30 minutes'); };
  var el = function (tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  function renderInfo() {
    var h = $('#how-title'), st = $('#how-steps'), ft = $('#faq-title'), fl = $('#faq-list');
    if (I.how_title) h.textContent = I.how_title; if (I.faq_title) ft.textContent = I.faq_title;
    st.textContent = ''; (I.steps || []).forEach(function (s, i) {
      var li = el('li');
      li.append(el('b', ('0' + (i + 1)).slice(-2)), el('h3', s.title), el('p', T(s.text))); st.appendChild(li);
    });
    fl.textContent = ''; (I.faq || []).forEach(function (f) {
      var d = el('details'), sm = el('summary', f.q); d.append(sm, el('p', T(f.a))); fl.appendChild(d);
    });
  }
  var ICONS = {
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    telegram: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>'
  };
  var NAMES = { instagram: 'Instagram', telegram: 'Telegram', whatsapp: 'WhatsApp' };
  function link(kind) {
    var v = String(S[kind] || '').trim(); if (!v) return '';
    if (/^https:\/\//i.test(v)) return v;
    var u = v.replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?(t\.me|instagram\.com|wa\.me)\//i, '');
    if (kind === 'instagram') return 'https://instagram.com/' + encodeURIComponent(u);
    if (kind === 'telegram') return 'https://t.me/' + encodeURIComponent(u);
    var d = v.replace(/\D/g, ''); return d ? 'https://wa.me/' + d : '';
  }
  function icon(kind) {
    var href = link(kind), a = el(href ? 'a' : 'span', null, 'ico' + (href ? '' : ' is-off'));
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[kind] + '</svg>';
    a.setAttribute('aria-label', NAMES[kind]); a.title = href ? NAMES[kind] : NAMES[kind] + ' (link not added yet)';
    if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } else a.setAttribute('role', 'img');
    return a;
  }
  // Instagram strip: posts come from a Behold JSON feed (set in CMS -> Settings); placeholders until then
  var feedUrl = null;
  function tile(href, src, alt) {
    var a = el(href ? 'a' : 'span', null, 'insta__tile' + (src ? '' : ' is-ph'));
    if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', alt || 'Instagram post'); }
    if (src) { var i = document.createElement('img'); i.src = src; i.alt = ''; i.loading = 'lazy'; i.decoding = 'async'; a.appendChild(i); }
    else a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.instagram + '</svg>';
    return a;
  }
  function placeholders(row) { row.textContent = ''; for (var n = 0; n < 8; n++) row.appendChild(tile(link('instagram'), '', 'Instagram')); }
  function renderInsta() {
    var row = $('#insta-row'), prof = link('instagram'), hd = $('.insta__handle');
    hd.hidden = !prof; if (prof) { hd.href = prof; hd.textContent = '@' + decodeURIComponent(prof.replace(/\/+$/, '').split('/').pop()); }
    var url = String(S.instagram_feed || '').trim(); if (url === feedUrl) return; feedUrl = url;
    placeholders(row);
    if (!/^https:\/\/feeds\.behold\.so\//i.test(url)) return;
    fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var posts = d && (d.posts || d); if (!Array.isArray(posts) || !posts.length || url !== feedUrl) return;
      row.textContent = '';
      posts.slice(0, 12).forEach(function (p) {
        var sz = p.sizes && (p.sizes.medium || p.sizes.small || p.sizes.large), src = (sz && sz.mediaUrl) || p.thumbnailUrl || p.mediaUrl || '';
        var href = String(p.permalink || '');
        if (!/^https:\/\//i.test(src) || !/^https:\/\/(www\.)?instagram\.com\//i.test(href)) return;
        row.appendChild(tile(href, src, String(p.prunedCaption || p.caption || '').slice(0, 100)));
      });
      if (!row.children.length) placeholders(row);
    }).catch(function () {});
  }
  function renderContacts() {
    var foot = $('#foot-links'), faq = $('#faq-contacts'); foot.textContent = ''; faq.textContent = '';
    var ig = link('instagram');
    if (ig) { var p = el('a', 'Instagram'); p.href = ig; p.target = '_blank'; p.rel = 'noopener'; foot.appendChild(p); }
    foot.append(icon('telegram'), icon('whatsapp'));
    faq.append(icon('instagram'), icon('telegram'), icon('whatsapp'));
    $('#year').textContent = new Date().getFullYear();
    renderInsta();
  }
  document.documentElement.classList.add('js');
  function reveal() {
    var items = document.querySelectorAll('.how__steps li');
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .25 });
    items.forEach(function (i, n) { i.style.transitionDelay = (n * 0.1) + 's'; io.observe(i); });
  }
  renderInfo(); renderContacts(); reveal();
  load('info', function (d) { I = d; renderInfo(); reveal(); }); load('settings', function (d) { S = d; renderContacts(); });

  // Checkout
  var dlg = $('#checkout'), form = $('#order-form'), cur = null, free = false, orderId = '';
  var CH = {
    Email: { label: 'Your email', type: 'email', ph: 'you@example.com', pat: '' },
    Telegram: { label: 'Your Telegram', type: 'text', ph: '@username or phone number', pat: '@?[A-Za-z0-9_]{5,32}|\\+?[0-9 ()\\-]{7,20}' },
    WhatsApp: { label: 'Your WhatsApp number', type: 'tel', ph: '+1 555 000 0000', pat: '\\+?[0-9 ()\\-]{7,20}' }
  };
  var dev = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname); // no backend when opened as a file or on localhost: skip sending
  function show(name) { dlg.querySelectorAll('.step').forEach(function (s) { s.hidden = s.dataset.step !== name; }); dlg.scrollTop = 0; }
  function err(msg) { dlg.querySelectorAll('.co-err').forEach(function (e) { e.hidden = !msg; e.textContent = msg || ''; }); }
  function send(type, data) {
    if (dev) return Promise.resolve();
    var body = Object.assign({}, data, { type: type });
    return fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('send'); });
  }
  function setChannel() {
    var c = CH[form.channel.value], inp = form.contact;
    $('#contact-label').textContent = c.label; inp.type = c.type; inp.placeholder = c.ph;
    if (c.pat) inp.setAttribute('pattern', c.pat); else inp.removeAttribute('pattern');
    inp.title = c.label;
  }
  form.querySelectorAll('[name=channel]').forEach(function (r) { r.addEventListener('change', setChannel); });

  // Payment methods (editable in the CMS): name, optional pay link with {amount}, copyable details, note
  var pmName = '';
  function methods() {
    var list = Array.isArray(S.payment_methods) ? S.payment_methods : [];
    return list.map(function (m) {
      var l = String(m.pay_link || '').trim();
      return { name: String(m.name || '').trim(), link: /^https:\/\//i.test(l) ? l : '', note: String(m.note || '').trim(),
        rows: (m.details || []).filter(function (r) { return r && String(r.value || '').trim(); }) };
    }).filter(function (m) { return m.name && (m.link || m.rows.length); });
  }
  function showMethod(m) {
    pmName = m.name; var rows = $('#pm-rows'); rows.textContent = '';
    m.rows.forEach(function (r) {
      var d = el('div', null, 'kv'), b = el('b', String(r.value).trim()), c = el('button', 'Copy', 'copy'); c.type = 'button';
      d.append(el('span', r.label || m.name), b, c); rows.appendChild(d);
    });
    var note = $('.pm-note'); note.textContent = m.note; note.hidden = !m.note;
    var a = $('.pm-link'); a.hidden = !m.link;
    if (m.link) { a.href = m.link.replace(/\{amount\}/g, encodeURIComponent(String(cur.price))); a.textContent = 'Pay with ' + m.name; }
  }
  function renderPay() {
    var ms = methods(), pick = $('#pm-pick'); pmName = '';
    pick.querySelectorAll('label').forEach(function (l) { l.remove(); });
    $('.pm-none').hidden = !!ms.length; $('#pm').hidden = !ms.length; pick.hidden = ms.length < 2; $('.pm-link').hidden = true;
    if (!ms.length) return;
    ms.forEach(function (m, i) {
      var l = el('label'), r = document.createElement('input'); r.type = 'radio'; r.name = 'pm'; r.value = i; r.checked = i === 0;
      r.addEventListener('change', function () { showMethod(m); }); l.append(r, el('span', m.name)); pick.appendChild(l);
    });
    showMethod(ms[0]);
  }

  document.addEventListener('buy', function (e) {
    cur = e.detail; free = !Number(cur.price);
    var d = new Date(), pad = function (n) { return ('0' + n).slice(-2); };
    orderId = 'AU-' + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + (1000 + Math.floor(Math.random() * 9000));
    form.reset(); setChannel(); err('');
    form.card.value = cur.title; form.price.value = free ? 0 : cur.price; form.order.value = orderId;
    $('.wish').hidden = !cur.custom; form.wishes.required = !!cur.custom;
    $('#co-title').textContent = (free ? 'Get ' : 'Buy ') + '\u201C' + cur.title + '\u201D';
    $('.co-sum').textContent = free ? 'Leave your details and I will send it to you.' : '$' + cur.price + ' \u00B7 sent after your payment is confirmed.';
    $('.co-submit').textContent = free ? 'Send it to me' : 'Continue to payment';
    show('form'); dlg.showModal(); dlg.focus();
  });

  function done() {
    var name = form.elements.name.value.trim(), where = form.contact.value.trim(), t = cur.title;
    $('.done-title').textContent = 'Thank you, ' + name + '!';
    var time = S.response_time || '30 minutes';
    $('.done-text').textContent = free ? 'I will send \u201C' + t + '\u201D to ' + where + ' within ' + time + '.'
      : cur.custom ? 'Once your payment is confirmed, I will write to you at ' + where + ' to agree on the details of your recording.'
      : 'Once your payment is confirmed, \u201C' + t + '\u201D will arrive at ' + where + ' within ' + time + '.';
    show('done');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); err('');
    if (form['bot-field'].value) return;
    var btn = $('.co-submit'); btn.disabled = true;
    send('order', Object.fromEntries(new FormData(form))).then(function () {
      btn.disabled = false;
      if (free) return done();
      $('.pay-amt').textContent = '$' + cur.price; $('.order-id').textContent = orderId;
      renderPay();
      show('pay');
    }).catch(function () { btn.disabled = false; err('Something went wrong. Please try again, or write to me on Instagram.'); });
  });
  $('#paid-btn').addEventListener('click', function () {
    var b = this; b.disabled = true; err('');
    send('paid', { order: orderId, method: pmName, card: cur.title, price: cur.price, name: form.elements.name.value, channel: form.channel.value, contact: form.contact.value })
      .then(function () { b.disabled = false; done(); }).catch(function () { b.disabled = false; err('Something went wrong. Please try again, or write to me on Instagram.'); });
  });
  dlg.addEventListener('click', function (e) {
    var t = e.target;
    var r = dlg.getBoundingClientRect(), out = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (t.closest('[data-close]') || (t === dlg && out)) dlg.close();
    else if (t.closest('[data-back]')) show('form');
    else if (t.classList.contains('copy')) {
      var src = t.dataset.copy ? $(t.dataset.copy) : t.previousElementSibling, txt = src.textContent; if (navigator.clipboard) navigator.clipboard.writeText(txt);
      t.textContent = 'Copied'; setTimeout(function () { t.textContent = 'Copy'; }, 1500);
    }
  });
})();
