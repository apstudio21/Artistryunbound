// Info blocks, footer and the checkout dialog. Content from content/*.json (inline JSON is the fallback). Text only via textContent.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var J = function (id) { try { return JSON.parse(document.getElementById(id).textContent); } catch (e) { return null; } };
  var S = J('settings-data') || {}, I = J('info-data') || {};
  var load = function (f, cb) { fetch('content/' + f + '.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) cb(d); }).catch(function () {}); };
  var T = function (s) { return String(s || '').replace(/\{time\}/g, S.response_time || '30 minutes'); };
  var el = function (tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  var IC = ['<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>', '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>', '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3.5 7.5l8.5 6 8.5-6"/>'];
  function renderInfo() {
    var h = $('#how-title'), st = $('#how-steps'), ft = $('#faq-title'), fl = $('#faq-list');
    if (I.how_title) h.textContent = I.how_title; if (I.faq_title) ft.textContent = I.faq_title;
    st.textContent = ''; (I.steps || []).forEach(function (s, i) {
      var li = el('li'), ic = el('div', null, 'how__icon'); ic.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[i % 3] + '</svg>';
      li.append(ic, el('b', i + 1), el('h3', s.title), el('p', T(s.text))); st.appendChild(li);
    });
    fl.textContent = ''; (I.faq || []).forEach(function (f) {
      var d = el('details'), sm = el('summary', f.q); d.append(sm, el('p', T(f.a))); fl.appendChild(d);
    });
  }
  function renderFooter() {
    var box = $('#foot-links'); box.textContent = '';
    var add = function (label, href) { var a = el('a', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a); };
    var clean = function (v) { return String(v || '').replace(/^@/, '').trim(); };
    if (S.instagram) add('Instagram', 'https://instagram.com/' + encodeURIComponent(clean(S.instagram)));
    if (S.telegram) add('Telegram', 'https://t.me/' + encodeURIComponent(clean(S.telegram)));
    if (S.whatsapp) add('WhatsApp', 'https://wa.me/' + String(S.whatsapp).replace(/\D/g, ''));
    $('#year').textContent = new Date().getFullYear();
  }
  renderInfo(); renderFooter();
  load('info', function (d) { I = d; renderInfo(); }); load('settings', function (d) { S = d; renderFooter(); });

  // Checkout
  var dlg = $('#checkout'), form = $('#order-form'), cur = null, free = false, orderId = '';
  var CH = {
    Email: { label: 'Your email', type: 'email', ph: 'you@example.com', pat: '' },
    Telegram: { label: 'Your Telegram', type: 'text', ph: '@username or phone number', pat: '@?[A-Za-z0-9_]{5,32}|\\+?[0-9 ()\\-]{7,20}' },
    WhatsApp: { label: 'Your WhatsApp number', type: 'tel', ph: '+1 555 000 0000', pat: '\\+?[0-9 ()\\-]{7,20}' }
  };
  var dev = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname); // no form backend locally: skip sending
  function show(name) { dlg.querySelectorAll('.step').forEach(function (s) { s.hidden = s.dataset.step !== name; }); dlg.scrollTop = 0; }
  function err(msg) { dlg.querySelectorAll('.co-err').forEach(function (e) { e.hidden = !msg; e.textContent = msg || ''; }); }
  function send(params) {
    if (dev) return Promise.resolve();
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() })
      .then(function (r) { if (!r.ok) throw new Error('send'); });
  }
  function setChannel() {
    var c = CH[form.channel.value], inp = form.contact;
    $('#contact-label').textContent = c.label; inp.type = c.type; inp.placeholder = c.ph;
    if (c.pat) inp.setAttribute('pattern', c.pat); else inp.removeAttribute('pattern');
    inp.title = c.label;
  }
  form.querySelectorAll('[name=channel]').forEach(function (r) { r.addEventListener('change', setChannel); });

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
    show('form'); dlg.showModal();
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
    send(new FormData(form)).then(function () {
      btn.disabled = false;
      if (free) return done();
      $('.pay-amt').textContent = '$' + cur.price; $('.order-id').textContent = orderId;
      var pm = String(S.paypal_me || '').trim(), pe = String(S.paypal_email || '').trim(), a = $('.pp-link');
      a.hidden = !pm; if (pm) a.href = 'https://paypal.me/' + encodeURIComponent(pm) + '/' + cur.price + 'USD';
      $('.pp-mail').hidden = !pe; $('.pp-email').textContent = pe; $('.pp-none').hidden = !!(pm || pe);
      show('pay');
    }).catch(function () { btn.disabled = false; err('Something went wrong. Please try again, or write to me on Instagram.'); });
  });
  $('#paid-btn').addEventListener('click', function () {
    var b = this; b.disabled = true; err('');
    send({ 'form-name': 'paid', order: orderId, card: cur.title, price: cur.price, name: form.elements.name.value, channel: form.channel.value, contact: form.contact.value })
      .then(function () { b.disabled = false; done(); }).catch(function () { b.disabled = false; err('Something went wrong. Please try again, or write to me on Instagram.'); });
  });
  dlg.addEventListener('click', function (e) {
    var t = e.target;
    var r = dlg.getBoundingClientRect(), out = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (t.closest('[data-close]') || (t === dlg && out)) dlg.close();
    else if (t.closest('[data-back]')) show('form');
    else if (t.classList.contains('copy')) {
      var txt = $(t.dataset.copy).textContent; if (navigator.clipboard) navigator.clipboard.writeText(txt);
      t.textContent = 'Copied'; setTimeout(function () { t.textContent = 'Copy'; }, 1500);
    }
  });
})();
