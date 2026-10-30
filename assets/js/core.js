/* =========================================================
   Example — общие модули: шапка, меню, появление, время Киева
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var EX = (window.EX = window.EX || {});
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  EX.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  EX.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  EX.reduceMotion = function () { return reduceMq.matches; };

  /* ---------- часы работы (минуты от полуночи), 0 = воскресенье ---------- */
  EX.HOURS = {
    0: ['08:30', '20:00'],
    1: ['07:30', '21:00'],
    2: ['07:30', '21:00'],
    3: ['07:30', '21:00'],
    4: ['07:30', '21:00'],
    5: ['07:30', '22:00'],
    6: ['08:30', '22:00']
  };

  EX.toMin = function (hhmm) {
    var p = hhmm.split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  };

  EX.fromMin = function (m) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  };

  /* Текущее время в Киеве — независимо от часового пояса посетителя */
  EX.kyivNow = function () {
    var zones = ['Europe/Kyiv', 'Europe/Kiev'];
    for (var i = 0; i < zones.length; i++) {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: zones[i], year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
        }).formatToParts(new Date());
        var get = function (t) {
          for (var j = 0; j < parts.length; j++) if (parts[j].type === t) return parts[j].value;
          return '';
        };
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var h = Number(get('hour')) % 24;
        return {
          y: Number(get('year')), m: Number(get('month')), d: Number(get('day')),
          h: h, min: Number(get('minute')), wd: days.indexOf(get('weekday')),
          minutes: h * 60 + Number(get('minute'))
        };
      } catch (e) { /* пробуем следующий идентификатор зоны */ }
    }
    var n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours(), min: n.getMinutes(), wd: n.getDay(), minutes: n.getHours() * 60 + n.getMinutes() };
  };

  EX.isOpenNow = function () {
    var now = EX.kyivNow();
    var h = EX.HOURS[now.wd];
    return now.minutes >= EX.toMin(h[0]) && now.minutes < EX.toMin(h[1]);
  };

  /* ---------- уведомление ---------- */
  var toastTimer;
  EX.toast = function (text) {
    var el = EX.$('[data-toast]');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  };

  /* ---------- безопасное хранилище ---------- */
  EX.store = {
    get: function (key, fallback) {
      try {
        var v = window.localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
  };

  /* ---------- шапка ---------- */
  function initHeader() {
    var header = EX.$('[data-header]');
    if (!header) return;
    var ticking = false;
    var update = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- мобильное меню ---------- */
  function initOverlay() {
    var toggle = EX.$('[data-nav-toggle]');
    var overlay = EX.$('[data-overlay]');
    if (!toggle || !overlay) return;
    var label = EX.$('[data-nav-label]', toggle);
    var lastFocus = null;

    var setOrigin = function () {
      var r = toggle.getBoundingClientRect();
      overlay.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
      overlay.style.setProperty('--oy', (r.top + r.height / 2) + 'px');
    };

    var focusables = function () {
      return EX.$$('a[href], button:not([disabled])', overlay).concat([toggle]);
    };

    var open = function () {
      lastFocus = document.activeElement;
      setOrigin();
      overlay.removeAttribute('inert');
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Закрыть меню';
      document.body.classList.add('is-locked');
      var first = EX.$('a', overlay);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    };

    var close = function (restore) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('inert', '');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'Открыть меню';
      document.body.classList.remove('is-locked');
      if (restore !== false && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', function () {
      if (overlay.classList.contains('is-open')) close(); else open();
    });

    overlay.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (link) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches && overlay.classList.contains('is-open')) close(false);
    });
  }

  /* ---------- появление при прокрутке ---------- */
  function initReveal() {
    var items = EX.$$('[data-reveal]');
    if (!('IntersectionObserver' in window) || EX.reduceMotion()) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });

    /* элементы, уже видимые при загрузке (например, переход по якорю) */
    window.addEventListener('load', function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    });
  }

  /* ---------- счётчики ---------- */
  function initCounters() {
    var els = EX.$$('[data-count]');
    if (!els.length) return;
    var run = function (el) {
      var target = Number(el.getAttribute('data-count'));
      if (EX.reduceMotion()) { el.textContent = String(target); return; }
      var start = target > 1000 && target < 2100 ? target - 40 : 0;
      var t0 = performance.now();
      var dur = 1400;
      var step = function (t) {
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(start + (target - start) * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- часы работы: подсветка сегодняшнего дня ---------- */
  function initHours() {
    var now = EX.kyivNow();
    var today = EX.HOURS[now.wd];
    EX.$$('[data-day="' + now.wd + '"]').forEach(function (el) { el.classList.add('is-today'); });
    EX.$$('[data-today-hours]').forEach(function (el) { el.textContent = today[0] + '–' + today[1]; });
    var status = EX.$('[data-open-status]');
    if (status) {
      var open = EX.isOpenNow();
      status.classList.toggle('is-open', open);
      status.textContent = open ? 'Сейчас открыто до ' + today[1] : 'Сейчас закрыто · откроемся в ' + EX.HOURS[(now.minutes < EX.toMin(today[0])) ? now.wd : (now.wd + 1) % 7][0];
    }
  }

  /* ---------- прочее ---------- */
  function initMisc() {
    EX.$$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
    var toTop = EX.$('[data-to-top]');
    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: EX.reduceMotion() ? 'auto' : 'smooth' });
        var skip = EX.$('.brand');
        if (skip) skip.focus({ preventScroll: true });
      });
    }
  }

  function boot() {
    initHeader();
    initOverlay();
    initReveal();
    initCounters();
    initHours();
    initMisc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
