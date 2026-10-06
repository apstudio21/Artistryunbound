// Fills editable zones from content/*.json (Decap CMS writes there). Static HTML stays as fallback.
(function () {
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, obj); }
  function safeSrc(v) { return typeof v === 'string' && /^(\/|images\/)[\w\-./]+$/.test(v) ? v.replace(/^\//, '') : null; }
  fetch('content/about.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (!data) return;
    var root = { about: data };
    document.querySelectorAll('[data-f]').forEach(function (el) {
      var v = get(root, el.getAttribute('data-f')); if (typeof v === 'string' && v) el.textContent = v;
    });
    document.querySelectorAll('[data-f-src]').forEach(function (el) {
      var v = safeSrc(get(root, el.getAttribute('data-f-src'))); if (v) el.src = v;
    });
    document.querySelectorAll('[data-f-alt]').forEach(function (el) {
      var v = get(root, el.getAttribute('data-f-alt')); if (typeof v === 'string' && v) el.alt = v;
    });
  }).catch(function () {});
})();
