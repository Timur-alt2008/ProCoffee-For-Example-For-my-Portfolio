/* =========================================================
   Example — интерактив главной страницы
   ========================================================= */
(function () {
  'use strict';
  var EX = window.EX;
  var $ = EX.$;
  var $$ = EX.$$;

  /* ---------- Анатомия чашки ---------- */
  function initAnatomy() {
    var root = $('[data-anatomy]');
    var dataEl = $('#anatomy-data');
    if (!root || !dataEl) return;
    var drinks;
    try { drinks = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var names = { espresso: 'эспрессо', water: 'вода', milk: 'молоко', foam: 'пена' };
    var picks = $$('[data-drink]', root);
    var fill = $('[data-fill]', root);
    var layers = {};
    $$('[data-layer]', root).forEach(function (el) { layers[el.getAttribute('data-layer')] = el; });
    var info = $('.anatomy__info', root);
    var out = {
      volume: $('[data-a-volume]', root), name: $('[data-a-name]', root), ratio: $('[data-a-ratio]', root),
      text: $('[data-a-text]', root), price: $('[data-a-price]', root), legend: $('[data-legend]', root)
    };

    var show = function (id) {
      var d = drinks.filter(function (x) { return x.id === id; })[0];
      if (!d) return;
      picks.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-drink') === id)); });
      fill.style.setProperty('--fill', d.fill);
      Object.keys(layers).forEach(function (k) { layers[k].style.setProperty('--h', 0); layers[k].style.order = 9; });
      d.layers.forEach(function (l, i) {
        var el = layers[l[0]];
        el.style.setProperty('--h', l[1]);
        el.style.order = i;
      });
      out.volume.textContent = d.volume;
      out.name.textContent = d.name;
      out.ratio.textContent = d.ratio;
      out.text.textContent = d.text;
      out.price.textContent = d.price + ' ₴';
      out.legend.innerHTML = d.layers.map(function (l) {
        return '<li><span class="legend-dot legend-dot--' + l[0] + '"></span>' + names[l[0]] + '<b>' + l[1] + '%</b></li>';
      }).join('');
      info.classList.remove('is-swapping');
      void info.offsetWidth;
      info.classList.add('is-swapping');
    };

    picks.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-drink')); });
    });
    show(drinks[0].id);
  }

  /* ---------- Авторские напитки ---------- */
  function initSignature() {
    var root = $('[data-sig]');
    if (!root) return;
    var items = $$('[data-sig-item]', root);
    var photos = $$('[data-sig-photo]', root);
    var price = $('[data-sig-price]', root);
    var volume = $('[data-sig-volume]', root);
    var desc = $('[data-sig-desc]', root);
    var bars = $$('[data-flavor]', root);
    var vals = $$('[data-flavor-val]', root);

    var select = function (btn) {
      var id = btn.getAttribute('data-sig-item');
      items.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      photos.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-sig-photo') === id); });
      price.textContent = btn.getAttribute('data-price') + ' ₴';
      volume.textContent = btn.getAttribute('data-volume');
      desc.textContent = btn.getAttribute('data-desc');
      var prof = btn.getAttribute('data-profile').split(',');
      bars.forEach(function (bar, i) { bar.style.setProperty('--v', prof[i]); });
      vals.forEach(function (v, i) { v.textContent = prof[i] + '/5'; });
    };

    items.forEach(function (b) {
      b.addEventListener('click', function () { select(b); });
    });
  }

  /* ---------- Завтраки: живая шкала времени ---------- */
  function initBreakfastClock() {
    var root = $('[data-brk-clock]');
    if (!root) return;
    var nowEl = $('[data-brk-now]', root);
    var statusEl = $('[data-brk-status]', root);
    var START = 7 * 60 + 30;
    var update = function () {
      var now = EX.kyivNow();
      var weekend = now.wd === 0 || now.wd === 6;
      var open = EX.toMin(EX.HOURS[now.wd][0]);
      var end = weekend ? 15 * 60 : 13 * 60;
      var m = now.minutes;
      var p = Math.max(0, Math.min(1, (m - START) / (13 * 60 - START)));
      root.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      nowEl.textContent = 'Сейчас в Киеве ' + EX.fromMin(m);
      var text;
      if (m < open) text = 'откроемся в ' + EX.HOURS[now.wd][0] + ' — и сразу завтраки';
      else if (m < end) {
        var left = end - m;
        var h = Math.floor(left / 60);
        var mm = left % 60;
        text = 'завтраки ещё ' + (h ? h + ' ч ' : '') + mm + ' мин';
      } else text = 'завтраки закончились — ждём завтра';
      statusEl.textContent = text;
    };
    update();
    setInterval(update, 30000);
  }

  /* ---------- Атмосфера: точки на фото ---------- */
  function initHotspots() {
    var root = $('[data-hotspots]');
    if (!root) return;
    var spots = $$('[data-spot]', root);
    var card = $('.atmo__card', root);
    var count = $('[data-spot-count]', root);
    var title = $('[data-spot-title]', root);
    var text = $('[data-spot-text]', root);
    var total = spots.length;
    spots.forEach(function (s, i) {
      s.addEventListener('click', function () {
        spots.forEach(function (o) { o.setAttribute('aria-pressed', String(o === s)); });
        count.textContent = '0' + (i + 1) + ' / 0' + total;
        title.textContent = s.getAttribute('data-title');
        text.textContent = s.getAttribute('data-text');
        card.classList.remove('is-swapping');
        void card.offsetWidth;
        card.classList.add('is-swapping');
      });
    });
  }

  /* ---------- Отзывы: стопка записок ---------- */
  function initNotes() {
    var root = $('[data-notes]');
    if (!root) return;
    var notes = $$('[data-note]', root);
    var countEl = $('[data-rev-count]');
    var order = notes.map(function (_, i) { return i; });
    var current = 0;
    var busy = false;

    var layout = function () {
      order.forEach(function (idx, pos) {
        var n = notes[idx];
        n.style.zIndex = String(notes.length - pos);
        n.style.opacity = pos > 3 ? '0' : '1';
        n.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
        n.style.setProperty('--dy', (pos * 6) + 'px');
        n.style.setProperty('--dx', '0px');
      });
      if (countEl) countEl.textContent = (current + 1) + ' / ' + notes.length;
    };

    var next = function (dir) {
      if (busy) return;
      busy = true;
      if (dir > 0) {
        var top = notes[order[0]];
        top.classList.add('is-flying');
        top.style.setProperty('--dx', '120%');
        setTimeout(function () {
          top.classList.remove('is-flying');
          order.push(order.shift());
          current = (current + 1) % notes.length;
          layout();
          busy = false;
        }, EX.reduceMotion() ? 10 : 420);
      } else {
        order.unshift(order.pop());
        current = (current - 1 + notes.length) % notes.length;
        var incoming = notes[order[0]];
        incoming.style.transition = 'none';
        incoming.style.setProperty('--dx', '-120%');
        incoming.style.opacity = '0';
        incoming.style.zIndex = String(notes.length + 1);
        void incoming.offsetWidth;
        incoming.style.transition = '';
        layout();
        setTimeout(function () { busy = false; }, 300);
      }
    };

    var prev = $('[data-rev-prev]');
    var nextBtn = $('[data-rev-next]');
    if (prev) prev.addEventListener('click', function () { next(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); next(-1); }
    });

    /* перетаскивание верхней записки */
    var startX = 0;
    var startY = 0;
    var dragging = false;
    var active = null;
    root.addEventListener('pointerdown', function (e) {
      var n = e.target.closest('[data-note]');
      if (!n || n !== notes[order[0]] || busy) return;
      active = n;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      n.classList.add('is-dragging');
      n.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging || !active) return;
      var dx = e.clientX - startX;
      var dy = (e.clientY - startY) * 0.3;
      active.style.setProperty('--dx', dx + 'px');
      active.style.setProperty('--dy', dy + 'px');
    });
    var end = function (e) {
      if (!dragging || !active) return;
      var dx = e.clientX - startX;
      active.classList.remove('is-dragging');
      dragging = false;
      var n = active;
      active = null;
      if (Math.abs(dx) > 90) {
        n.style.setProperty('--dx', (dx > 0 ? '' : '-') + '120%');
        n.classList.add('is-flying');
        busy = true;
        setTimeout(function () {
          n.classList.remove('is-flying');
          order.push(order.shift());
          current = (current + 1) % notes.length;
          layout();
          busy = false;
        }, 420);
      } else {
        layout();
      }
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);

    layout();
  }

  /* ---------- Карта гостя ---------- */
  function initStampcard() {
    var root = $('[data-stampcard]');
    if (!root) return;
    var stamps = $$('[data-stamp]', root);
    var gift = $('[data-stamp-gift]', root);
    var status = $('[data-stamp-status]', root);
    var reset = $('[data-stamp-reset]', root);
    var KEY = 'example.stamps';
    var count = Math.max(0, Math.min(9, Number(EX.store.get(KEY, 0)) || 0));

    var render = function (announce) {
      stamps.forEach(function (s, i) { s.setAttribute('aria-pressed', String(i < count)); });
      gift.classList.toggle('is-ready', count === 9);
      status.textContent = count === 9 ? 'Ура! Следующая чашка — бесплатно' : 'До бесплатной чашки — ' + (9 - count);
      EX.store.set(KEY, count);
      if (announce && count === 9) EX.toast('Карта заполнена — покажите её бариста ☕');
    };

    stamps.forEach(function (s, i) {
      s.addEventListener('click', function () {
        count = (i < count) ? i : i + 1;
        render(true);
      });
    });
    reset.addEventListener('click', function () { count = 0; render(false); });
    render(false);
  }

  function boot() {
    initAnatomy();
    initSignature();
    initBreakfastClock();
    initHotspots();
    initNotes();
    initStampcard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
