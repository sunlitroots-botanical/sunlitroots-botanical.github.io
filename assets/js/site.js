/* Sunlit Roots — public site behaviour (progressive enhancement only).
   Everything here is optional: pages, navigation, and the shelf work without it.
   No network calls, no cookies, no trackers. The basket lives in this browser only. */
(function () {
  'use strict';
  var root = document.documentElement;
  var CART_KEY = 'sunlit-roots-cart';
  var MAX_QTY = 24;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function money(c) { return '$' + (c / 100).toFixed(c % 100 ? 2 : 0); }

  /* ---------- Mobile navigation ---------- */
  var toggle = $('.nav-toggle'), nav = $('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
      if (open) { var first = $('a', nav); if (first) first.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); toggle.focus();
      }
    });
  }

  /* ---------- Preview banner text (set from the owner's preview tools, same browser only) ---------- */
  var bannerText = read('srb-preview-banner');
  if (bannerText) $$('[data-banner-text]').forEach(function (el) { el.textContent = bannerText; });

  /* ---------- Seasonal particles ---------- */
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var layer = $('.particles');
  var leafSrc = layer ? layer.getAttribute('data-leaf') : '';
  function rand(a, b) { return a + Math.random() * (b - a); }
  function buildParticles() {
    if (!layer) return;
    layer.textContent = '';
    if (reduce.matches || root.classList.contains('motion-paused')) return;
    var season = root.getAttribute('data-season');
    var w = window.innerWidth;
    var n = w < 640 ? 7 : w < 1100 ? 10 : 14;
    for (var i = 0; i < n; i++) {
      var el, size, kind = season === 'fall' ? 'leaf' : season === 'spring' ? 'petal' : season === 'summer' ? 'mote' : 'snow';
      if (kind === 'leaf') {
        el = document.createElement('img'); el.src = leafSrc; el.alt = '';
        size = 34 + (i % 4) * 13;
        el.style.objectPosition = ((i * 19) % 80) + '% ' + ((i * 27) % 70) + '%';
      } else {
        el = document.createElement('span');
        size = kind === 'petal' ? rand(12, 22) : kind === 'mote' ? rand(10, 26) : rand(5, 12);
      }
      el.className = 'particle ' + kind;
      el.setAttribute('aria-hidden', 'true');
      el.style.width = size + 'px';
      el.style.height = (kind === 'petal' ? size * 0.8 : size) + 'px';
      el.style.left = ((i * 100 / n) + rand(-3, 3)) + '%';
      el.style.animationDuration = (kind === 'snow' ? rand(12, 20) : kind === 'mote' ? rand(14, 22) : rand(11, 16)) + 's';
      el.style.animationDelay = (-rand(0, 14)) + 's';
      layer.appendChild(el);
    }
  }
  buildParticles();
  if (reduce.addEventListener) reduce.addEventListener('change', buildParticles);
  var resizeT; window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(buildParticles, 400); });

  var motionBtn = $('.motion-btn');
  function syncMotionBtn() {
    if (!motionBtn) return;
    var paused = root.classList.contains('motion-paused');
    motionBtn.setAttribute('aria-pressed', String(paused));
    motionBtn.textContent = paused ? 'Play seasonal motion' : 'Pause seasonal motion';
  }
  if (motionBtn) {
    syncMotionBtn();
    motionBtn.addEventListener('click', function () {
      var paused = !root.classList.contains('motion-paused');
      root.classList.toggle('motion-paused', paused);
      store('srb-motion', paused ? 'paused' : null);
      syncMotionBtn(); buildParticles();
    });
  }
  var seasonLabel = $('[data-season-label]');
  if (seasonLabel) {
    var s = root.getAttribute('data-season');
    seasonLabel.textContent = s.charAt(0).toUpperCase() + s.slice(1) + (root.getAttribute('data-season-mode') === 'auto' ? ' (follows the calendar)' : '');
  }

  /* ---------- Basket (browser-only list; it is not an order) ---------- */
  function cart() {
    try { var c = JSON.parse(read(CART_KEY) || '{}'); var lines = (c.state && c.state.lines) || c.lines || []; return Array.isArray(lines) ? lines : []; }
    catch (e) { return []; }
  }
  function saveCart(lines) { store(CART_KEY, JSON.stringify({ state: { lines: lines }, version: 0 })); updateCount(); }
  function same(a, b) { return a.productId === b.productId && (a.scentId || '') === (b.scentId || '') && (a.vesselId || '') === (b.vesselId || ''); }
  function updateCount() {
    var n = cart().reduce(function (s, l) { return s + (l.qty || 0); }, 0);
    $$('.basket-count').forEach(function (el) { el.textContent = n ? String(n) : ''; });
    $$('[data-basket-sr]').forEach(function (el) { el.textContent = n ? ', ' + n + ' item' + (n === 1 ? '' : 's') : ''; });
  }
  updateCount();

  function optionPrice(sel) {
    var o = sel && sel.options[sel.selectedIndex];
    return o ? parseInt(o.getAttribute('data-price'), 10) : NaN;
  }
  $$('[data-product]').forEach(function (box) {
    var vessel = $('select[data-kind="vessel"]', box), scent = $('select[data-kind="scent"]', box);
    var priceEl = $('[data-price-display]', box);
    function refresh() {
      var p = vessel ? optionPrice(vessel) : scent ? optionPrice(scent) : NaN;
      if (priceEl && !isNaN(p)) priceEl.textContent = money(p);
    }
    if (vessel) vessel.addEventListener('change', refresh);
    if (scent) scent.addEventListener('change', refresh);
    refresh();
    var btn = $('.add-btn', box), msg = $('.added', box);
    if (btn) btn.addEventListener('click', function () {
      var line = { productId: box.getAttribute('data-product'), qty: 1, scentId: scent ? scent.value : undefined, vesselId: vessel ? vessel.value : undefined };
      var lines = cart(), found = false;
      lines = lines.map(function (l) { if (same(l, line)) { found = true; return Object.assign({}, l, { qty: Math.min(MAX_QTY, (l.qty || 0) + 1) }); } return l; });
      if (!found) lines.push(line);
      saveCart(lines);
      if (msg) msg.textContent = 'Added to your basket. It stays on this browser — ordering is not open yet.';
    });
  });

  /* Basket page */
  var basket = $('#basket');
  if (basket && window.SRB_CATALOG) {
    var cat = {}; window.SRB_CATALOG.forEach(function (p) { cat[p.slug] = p; });
    var list = $('#basket-list'), empty = $('#basket-empty'), total = $('#basket-total'), status = $('#basket-status');
    function pick(opts, id) { if (!opts || !opts.length) return null; for (var i = 0; i < opts.length; i++) if (opts[i].id === id) return opts[i]; return opts[0]; }
    function priceOf(p, l) { var v = pick(p.vessels, l.vesselId); if (v) return v.priceCents; var s = pick(p.scents, l.scentId); if (s) return s.priceCents; return p.priceCents; }
    function render(announce) {
      var lines = cart().filter(function (l) { return cat[l.productId]; });
      list.textContent = '';
      var sum = 0;
      lines.forEach(function (l, idx) {
        var p = cat[l.productId], v = pick(p.vessels, l.vesselId), s = pick(p.scents, l.scentId), each = priceOf(p, l);
        sum += each * l.qty;
        var li = document.createElement('li'); li.className = 'basket-item';
        var img = document.createElement('img'); img.src = p.thumb; img.alt = ''; img.width = 80; img.height = 80; img.loading = 'lazy';
        var body = document.createElement('div');
        var a = document.createElement('a'); a.href = p.url; a.textContent = p.name; a.className = 'card-title';
        body.appendChild(a);
        var meta = [v && v.name, s && s.name, money(each) + ' each'].filter(Boolean).join(' · ');
        var m = document.createElement('p'); m.className = 'small muted'; m.textContent = meta; body.appendChild(m);
        if (p.heat) { var h = document.createElement('p'); h.className = 'small'; h.textContent = 'Heat-sensitive: may wait for cooler shipping weather.'; body.appendChild(h); }
        var q = document.createElement('div'); q.className = 'qty'; q.setAttribute('role', 'group'); q.setAttribute('aria-label', 'Quantity for ' + p.name);
        function mk(t, label, fn, cls) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-label', label); if (cls) b.className = cls; b.addEventListener('click', fn); return b; }
        var out = document.createElement('output'); out.textContent = l.qty; out.setAttribute('aria-live', 'polite');
        q.appendChild(mk('−', 'Decrease ' + p.name, function () { setQty(l, l.qty - 1); }));
        q.appendChild(out);
        q.appendChild(mk('+', 'Increase ' + p.name, function () { setQty(l, l.qty + 1); }));
        var rm = mk('Remove', 'Remove ' + p.name, function () { setQty(l, 0); }, 'rm'); rm.removeAttribute('aria-label'); rm.innerHTML = 'Remove<span class="visually-hidden"> ' + p.name.replace(/[<>&]/g, '') + '</span>';
        q.appendChild(rm);
        body.appendChild(q);
        li.appendChild(img); li.appendChild(body); list.appendChild(li);
      });
      empty.hidden = lines.length > 0;
      $('#basket-filled').hidden = lines.length === 0;
      total.textContent = money(sum);
      if (announce && status) status.textContent = announce;
    }
    function setQty(line, qty) {
      var lines = cart();
      if (qty <= 0) lines = lines.filter(function (l) { return !same(l, line); });
      else lines = lines.map(function (l) { return same(l, line) ? Object.assign({}, l, { qty: Math.min(MAX_QTY, qty) }) : l; });
      saveCart(lines);
      var p = cat[line.productId];
      render(qty <= 0 ? p.name + ' removed.' : p.name + ': quantity ' + Math.min(MAX_QTY, qty) + '.');
      if (qty <= 0) { var h = $('#basket h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
    }
    $('#basket-js').hidden = false; $('#basket-nojs').hidden = true;
    render();
  }

  /* ---------- Shop filters ---------- */
  var shelf = $('#shelf');
  if (shelf) {
    var cards = $$('[data-tags]', shelf), live = $('#shelf-count');
    function apply(id) {
      var shown = 0;
      cards.forEach(function (c) { var ok = id === 'all' || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + id + ' ') > -1; c.hidden = !ok; if (ok) shown++; });
      $$('.filter').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === id)); });
      if (live) live.textContent = 'Showing ' + shown + ' of ' + cards.length + ' goods.';
    }
    $$('.filter').forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); if (history.replaceState) history.replaceState(null, '', b.getAttribute('data-filter') === 'all' ? location.pathname : '#' + b.getAttribute('data-filter')); }); });
    var start = (location.hash || '').slice(1);
    apply($('.filter[data-filter="' + start + '"]') ? start : 'all');
  }

  /* ---------- Write us (questions only; opens your own mail app) ---------- */
  var form = $('#write-us');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim(), note = String(f.get('question') || '').trim();
    if (/\b(?:\d[ -]?){13,19}\b/.test(note)) {
      var warn = $('#card-warning'); if (warn) { warn.hidden = false; warn.focus(); }
      return;
    }
    var to = form.getAttribute('data-to');
    var subject = encodeURIComponent('Question for Sunlit Roots' + (name ? ' from ' + name : ''));
    var body = encodeURIComponent(note + '\n\n— ' + name + (email ? '\n' + email : ''));
    window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    var done = $('#write-us-done'); if (done) { done.hidden = false; done.focus(); }
  });
})();
