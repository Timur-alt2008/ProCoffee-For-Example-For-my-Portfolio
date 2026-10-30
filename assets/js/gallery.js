/* =========================================================
   Example — gallery: filters and photo viewer (keyboard, swipe)
   ========================================================= */
(function () {
  'use strict';
  var EX = window.EX;
  var $ = EX.$;
  var $$ = EX.$$;

  function boot() {
    var grid = $('[data-gallery]');
    if (!grid) return;
    var items = $$('.masonry__item', grid);
    var filters = $$('[data-filter]');
    var emptyMsg = $('[data-gallery-empty]');

    /* ---------- filters ---------- */
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        var cat = f.getAttribute('data-filter');
        filters.forEach(function (o) { o.setAttribute('aria-pressed', String(o === f)); });
        var shown = 0;
        items.forEach(function (it) {
          var on = cat === 'all' || it.getAttribute('data-cat') === cat;
          it.classList.toggle('is-hidden', !on);
          if (on) {
            shown++;
            it.classList.remove('is-in');
            void it.offsetWidth;
            it.classList.add('is-in');
          }
        });
        emptyMsg.hidden = shown > 0;
      });
    });

    /* ---------- lightbox ---------- */
    var dlg = $('[data-lightbox]');
    var img = $('[data-lb-img]', dlg);
    var cap = $('[data-lb-caption]', dlg);
    var cnt = $('[data-lb-count]', dlg);
    var current = 0;
    var visible = [];
    var opener = null;

    var visibleButtons = function () {
      return items.filter(function (it) { return !it.classList.contains('is-hidden'); })
        .map(function (it) { return $('.masonry__btn', it); });
    };

    var show = function (i) {
      current = (i + visible.length) % visible.length;
      var b = visible[current];
      img.classList.add('is-loading');
      img.onload = function () { img.classList.remove('is-loading'); };
      img.setAttribute('width', b.getAttribute('data-w') * 400);
      img.setAttribute('height', b.getAttribute('data-h') * 400);
      img.src = b.getAttribute('data-full');
      img.alt = b.getAttribute('data-caption');
      cap.textContent = b.getAttribute('data-caption');
      cnt.textContent = (current + 1) + ' / ' + visible.length;
      /* preload the next photo */
      var nb = visible[(current + 1) % visible.length];
      if (nb) { var pre = new Image(); pre.src = nb.getAttribute('data-full'); }
    };

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.masonry__btn');
      if (!b) return;
      visible = visibleButtons();
      opener = b;
      show(visible.indexOf(b));
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      document.body.classList.add('is-locked');
    });

    var close = function () {
      if (dlg.open && typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    };
    dlg.addEventListener('close', function () {
      document.body.classList.remove('is-locked');
      if (opener) opener.focus({ preventScroll: true });
    });
    $('[data-lb-close]', dlg).addEventListener('click', close);
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(current - 1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(current + 1); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.classList.contains('lightbox__inner')) close();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    });

    /* swipe */
    var sx = 0;
    var sy = 0;
    dlg.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
