/* LazioEU — site behaviour. No third-party code, no cookies, no tracking. */
(function () {
  'use strict';

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Mobile sticky CTA: show after the first screen, hide while the contact form is visible */
  var mcta = document.querySelector('.mcta');
  if (mcta && 'IntersectionObserver' in window) {
    var top = document.querySelector('.hero, .page-hero');
    var contact = document.getElementById('contatto') || document.getElementById('contact');
    var pastTop = !top, atContact = false;
    var update = function () { mcta.classList.toggle('show', pastTop && !atContact); };
    if (top) new IntersectionObserver(function (e) { pastTop = !e[0].isIntersecting; update(); }).observe(top);
    if (contact) new IntersectionObserver(function (e) { atContact = e[0].isIntersecting; update(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
  } else if (mcta) {
    mcta.classList.add('show');
  }

  /* Grants catalog: filters + search (works without JS: all cards visible) */
  var catalog = document.getElementById('catalog');
  if (catalog) {
    var cards = Array.prototype.slice.call(catalog.querySelectorAll('.gcard'));
    var countEl = document.getElementById('count');
    var emptyEl = document.getElementById('empty');
    var searchEl = document.getElementById('q');
    var state = { theme: 'all', who: 'all', q: '' };
    var words = (countEl && countEl.dataset) || {};

    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var okTheme = state.theme === 'all' || (' ' + c.dataset.theme + ' ').indexOf(' ' + state.theme + ' ') > -1;
        var okWho = state.who === 'all' || (' ' + c.dataset.who + ' ').indexOf(' ' + state.who + ' ') > -1;
        var okQ = !state.q || (c.textContent + ' ' + (c.dataset.kw || '')).toLowerCase().indexOf(state.q) > -1;
        var show = okTheme && okWho && okQ;
        c.hidden = !show;
        if (show) n++;
      });
      if (countEl) countEl.textContent = n + ' ' + (n === 1 ? words.one : words.many);
      if (emptyEl) emptyEl.hidden = n !== 0;
    };

    catalog.querySelectorAll('.fgroup').forEach(function (group) {
      var key = group.dataset.key;
      group.addEventListener('click', function (e) {
        var b = e.target.closest('.fbtn');
        if (!b) return;
        group.querySelectorAll('.fbtn').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        state[key] = b.dataset.value;
        apply();
      });
    });

    var searchForm = document.getElementById('search');
    if (searchForm && searchEl) {
      var onSearch = function (e) {
        if (e) e.preventDefault();
        state.q = searchEl.value.trim().toLowerCase().slice(0, 80);
        apply();
      };
      searchForm.addEventListener('submit', onSearch);
      searchEl.addEventListener('input', onSearch);
    }
    apply();
  }

  /* Lead form: validates, then opens the visitor's email app with a prefilled message.
     Nothing is sent to or stored on this website. */
  var form = document.getElementById('lead-form');
  if (form) {
    var d = form.dataset;
    var project = form.querySelector('#f-project');

    // Prefill programme of interest when arriving from the catalog (?p=...)
    try {
      var p = new URLSearchParams(window.location.search).get('p');
      if (p && project && !project.value) {
        p = p.replace(/[^\w\s+.\-]/g, '').slice(0, 60);
        if (p) project.value = d.prefill + ' ' + p + '\n';
      }
    } catch (e) { /* old browser: no prefill */ }

    var setErr = function (input, msg) {
      var box = document.getElementById(input.id + '-err');
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (box) { box.textContent = msg || ''; box.hidden = !msg; }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('.hp input').value) return; // bot trap
      var name = form.querySelector('#f-name');
      var email = form.querySelector('#f-email');
      var phone = form.querySelector('#f-phone');
      var ok = form.querySelector('#f-ok');
      var bad = null;

      setErr(name, name.value.trim().length < 2 ? d.errName : '');
      if (name.value.trim().length < 2) bad = bad || name;
      var em = email.value.trim();
      var emOk = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(em) && em.length < 120;
      setErr(email, emOk ? '' : d.errEmail);
      if (!emOk) bad = bad || email;
      setErr(project, project.value.trim().length < 10 ? d.errProject : '');
      if (project.value.trim().length < 10) bad = bad || project;
      setErr(ok, ok.checked ? '' : d.errOk);
      if (!ok.checked) bad = bad || ok;
      if (bad) { bad.focus(); return; }

      var clean = function (s, max) { return String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, max); };
      var body =
        d.lName + ': ' + clean(name.value, 100) + '\n' +
        d.lEmail + ': ' + clean(em, 120) + '\n' +
        d.lPhone + ': ' + (clean(phone.value, 40) || '-') + '\n\n' +
        d.lProject + ':\n' + String(project.value).trim().slice(0, 3000);
      var href = 'mailto:' + d.to +
        '?subject=' + encodeURIComponent(d.subject + ' – ' + clean(name.value, 60)) +
        '&body=' + encodeURIComponent(body);
      window.location.href = href;
      var done = document.getElementById('form-done');
      if (done) done.hidden = false;
    });
  }
})();
