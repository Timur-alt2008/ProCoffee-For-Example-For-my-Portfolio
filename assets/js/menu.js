/* =========================================================
   Example — menu: category tabs, search, deep links
   ========================================================= */
(function () {
  'use strict';
  var EX = window.EX;
  var $ = EX.$;
  var $$ = EX.$$;

  function boot() {
    var tabs = $$('[role="tab"]');
    var panels = $$('[data-panel]');
    var ink = $('[data-tabs-ink]');
    var scroller = $('.menu-tabs__scroller');
    var bar = $('[data-menu-tabs]');
    if (!tabs.length) return;

    var moveInk = function (tab) {
      if (!ink || !tab) return;
      ink.style.width = tab.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    };

    var activate = function (id, opts) {
      opts = opts || {};
      var tab = $('#tab-' + id);
      if (!tab) return;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === id;
        p.hidden = !on;
        p.classList.remove('is-entering');
        if (on) {
          void p.offsetWidth;
          p.classList.add('is-entering');
        }
      });
      moveInk(tab);
      /* keep the active tab in view */
      var left = tab.offsetLeft - scroller.clientWidth / 2 + tab.offsetWidth / 2;
      scroller.scrollTo({ left: left, behavior: EX.reduceMotion() ? 'auto' : 'smooth' });
      if (opts.focus) tab.focus();
      if (opts.hash !== false && history.replaceState) history.replaceState(null, '', '#' + id);
      if (opts.scroll) {
        var top = bar.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 70) + 2;
        if (window.scrollY > top + 4 || opts.scroll === 'force') window.scrollTo({ top: top, behavior: EX.reduceMotion() ? 'auto' : 'smooth' });
      }
    };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        clearSearch();
        activate(t.getAttribute('data-tab'), { scroll: true });
      });
      t.addEventListener('keydown', function (e) {
        var k = e.key;
        var idx = null;
        if (k === 'ArrowRight') idx = (i + 1) % tabs.length;
        if (k === 'ArrowLeft') idx = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') idx = 0;
        if (k === 'End') idx = tabs.length - 1;
        if (idx !== null) {
          e.preventDefault();
          activate(tabs[idx].getAttribute('data-tab'), { focus: true });
        }
      });
    });

    window.addEventListener('resize', function () { moveInk($('[role="tab"][aria-selected="true"]')); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk($('[role="tab"][aria-selected="true"]')); });

    /* ---------- search ---------- */
    var input = $('[data-menu-search]');
    var clearBtn = $('[data-search-clear]');
    var results = $('[data-menu-results]');
    var list = $('[data-results-list]');
    var empty = $('[data-menu-empty]');
    var title = $('[data-results-title]');
    var dishes = $$('.menu-panel .dish');
    var lastTab = 'classic';

    var plural = function (n) {
      return n === 1 ? 'item' : 'items';
    };

    var run = function () {
      var q = input.value.trim().toLowerCase();
      clearBtn.hidden = !q;
      if (!q) {
        results.hidden = true;
        bar.classList.remove('is-muted');
        activate(lastTab, { hash: false });
        return;
      }
      var sel = $('[role="tab"][aria-selected="true"]');
      if (sel && !bar.classList.contains('is-muted')) lastTab = sel.getAttribute('data-tab');
      bar.classList.add('is-muted');
      panels.forEach(function (p) { p.hidden = true; });
      var words = q.split(/\s+/);
      var found = dishes.filter(function (d) {
        var hay = d.getAttribute('data-search');
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      list.innerHTML = '';
      found.forEach(function (d) { list.appendChild(d.cloneNode(true)); });
      title.textContent = found.length ? 'Found ' + found.length + ' ' + plural(found.length) : 'Nothing found';
      empty.hidden = found.length > 0;
      results.hidden = false;
    };

    var clearSearch = function () {
      if (!input.value) return;
      input.value = '';
      clearBtn.hidden = true;
      results.hidden = true;
      bar.classList.remove('is-muted');
    };

    var t;
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; run(); } });
    clearBtn.addEventListener('click', function () { input.value = ''; run(); input.focus(); });

    /* ---------- initial tab from the URL hash (#signature etc.) ---------- */
    var fromHash = function () {
      var id = (location.hash || '').replace('#', '');
      if (id && $('#tab-' + id)) {
        activate(id, { hash: false, scroll: 'force' });
        return true;
      }
      return false;
    };
    if (!fromHash()) activate('classic', { hash: false });
    window.addEventListener('hashchange', fromHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
