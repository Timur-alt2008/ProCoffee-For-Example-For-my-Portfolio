/* =========================================================
   Example — бронирование столиков и контакты
   Архитектура:
     state      — выбранные гости, дата, время, столик
     render*    — отрисовка дат, слотов и схемы зала
     validate   — проверка формы
     Service    — отправка: демо (localStorage) или реальный endpoint
   ========================================================= */
(function () {
  'use strict';
  var EX = window.EX;
  var $ = EX.$;
  var $$ = EX.$$;
  var CFG = (window.EX_CONFIG && window.EX_CONFIG.booking) || { mode: 'demo' };
  var STORE_KEY = 'example.bookings';

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var DAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var OCCASIONS = { casual: 'Просто встреча', birthday: 'День рождения', date: 'Свидание', business: 'Деловая встреча', work: 'Работа с ноутбуком' };

  /* ---------- вспомогательное ---------- */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  var parseIso = function (s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  var humanDate = function (s) { var d = parseIso(s); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ', ' + DAYS_SHORT[d.getUTCDay()]; };
  var guestsWord = function (n) { return n === 1 ? 'гость' : (n >= 2 && n <= 4 ? 'гостя' : 'гостей'); };
  /* детерминированная «занятость» для демо: одинакова для одной даты/времени */
  var hash = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  };

  /* ---------- сервис отправки ---------- */
  var Service = {
    submit: function (payload) {
      if (CFG.mode === 'endpoint' && CFG.endpoint) return this.remote(payload);
      return this.demo(payload);
    },
    demo: function (payload) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var id = 'EX-' + String(1000 + (hash(payload.date + payload.time + payload.phone + Date.now()) % 9000));
          var record = Object.assign({ id: id, createdAt: new Date().toISOString() }, payload);
          var all = EX.store.get(STORE_KEY, []);
          all.push(record);
          EX.store.set(STORE_KEY, all);
          resolve(record);
        }, 900);
      });
    },
    remote: function (payload) {
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, CFG.timeoutMs || 12000) : null;
      return fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (timer) clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Ошибка сервера');
        var record = Object.assign({ id: data.id || 'EX-' + Date.now().toString().slice(-4) }, payload);
        var all = EX.store.get(STORE_KEY, []);
        all.push(record);
        EX.store.set(STORE_KEY, all);
        return record;
      });
    }
  };

  function boot() {
    var form = $('[data-booking]');
    if (!form) return;

    var state = { guests: 2, date: null, time: null, table: null };
    var datesEl = $('[data-dates]', form);
    var slotsEl = $('[data-slots]', form);
    var tables = $$('.floor__table', form);
    var tableLabel = $('[data-table-label]', form);
    var guestsOut = $('[data-guests-out]', form);
    var guestsUnit = $('[data-guests-unit]', form);
    var decBtn = $('[data-guests-dec]', form);
    var incBtn = $('[data-guests-inc]', form);
    var phone = $('[data-phone]', form);
    var occasion = $('[data-occasion]', form);
    var submitBtn = $('[data-submit]', form);
    var sum = {};
    $$('[data-sum]').forEach(function (el) { sum[el.getAttribute('data-sum')] = el; });

    /* ---------- повод из адреса: visit.html?occasion=birthday ---------- */
    try {
      var occ = new URLSearchParams(location.search).get('occasion');
      if (occ && OCCASIONS[occ]) occasion.value = occ;
    } catch (e) { /* старые браузеры */ }

    /* ---------- гости ---------- */
    var setGuests = function (n) {
      state.guests = Math.max(1, Math.min(8, n));
      guestsOut.textContent = String(state.guests);
      guestsUnit.textContent = guestsWord(state.guests);
      decBtn.disabled = state.guests <= 1;
      incBtn.disabled = state.guests >= 8;
      updateTables();
      updateSummary();
    };
    decBtn.addEventListener('click', function () { setGuests(state.guests - 1); });
    incBtn.addEventListener('click', function () { setGuests(state.guests + 1); });

    /* ---------- даты: 14 дней от сегодняшнего (по Киеву) ---------- */
    var now = EX.kyivNow();
    var today = new Date(Date.UTC(now.y, now.m - 1, now.d));
    var slotsFor = function (dateStr) {
      var d = parseIso(dateStr);
      var h = EX.HOURS[d.getUTCDay()];
      var from = EX.toMin(h[0]) + 30;
      var to = EX.toMin(h[1]) - 60;
      from = Math.ceil(from / 30) * 30;
      var list = [];
      for (var m = from; m <= to; m += 30) {
        var t = EX.fromMin(m);
        var past = dateStr === iso(today) && m <= EX.kyivNow().minutes + 30;
        var busy = hash(dateStr + t) % 7 === 0;
        list.push({ t: t, disabled: past || busy, busy: busy && !past });
      }
      return list;
    };

    var renderDates = function () {
      var html = '';
      var firstAvailable = null;
      for (var i = 0; i < 14; i++) {
        var d = new Date(today.getTime() + i * 86400000);
        var s = iso(d);
        var label = i === 0 ? 'сегодня' : (i === 1 ? 'завтра' : DAYS_SHORT[d.getUTCDay()]);
        var hasSlots = slotsFor(s).some(function (x) { return !x.disabled; });
        if (hasSlots && !firstAvailable) firstAvailable = s;
        html += '<label class="date-chip"><input type="radio" name="date" value="' + s + '"' + (hasSlots ? '' : ' disabled') + '>' +
          '<span>' + label + '<b>' + d.getUTCDate() + '</b>' + MONTHS_SHORT[d.getUTCMonth()] + '</span></label>';
      }
      datesEl.innerHTML = html;
      datesEl.setAttribute('role', 'radiogroup');
      datesEl.setAttribute('aria-label', 'Дата визита');
      $$('input', datesEl).forEach(function (inp) {
        inp.addEventListener('change', function () { selectDate(inp.value); });
      });
      if (firstAvailable) {
        $('input[value="' + firstAvailable + '"]', datesEl).checked = true;
        selectDate(firstAvailable);
      }
    };

    var selectDate = function (s) {
      state.date = s;
      clearError('date');
      renderSlots();
      updateSummary();
    };

    var renderSlots = function () {
      var list = slotsFor(state.date);
      var prev = state.time;
      state.time = null;
      var free = list.filter(function (x) { return !x.disabled; });
      if (!free.length) {
        slotsEl.innerHTML = '<p class="slots__empty">На этот день свободного времени не осталось — выберите другую дату.</p>';
      } else {
        slotsEl.innerHTML = list.map(function (x) {
          return '<label class="slot"><input type="radio" name="time" value="' + x.t + '"' + (x.disabled ? ' disabled' : '') +
            (x.busy ? ' aria-label="' + x.t + ', занято"' : '') + '><span>' + x.t + '</span></label>';
        }).join('');
      }
      slotsEl.setAttribute('role', 'radiogroup');
      slotsEl.setAttribute('aria-label', 'Время визита');
      $$('input', slotsEl).forEach(function (inp) {
        if (inp.value === prev && !inp.disabled) { inp.checked = true; state.time = prev; }
        inp.addEventListener('change', function () {
          state.time = inp.value;
          clearError('time');
          updateTables();
          updateSummary();
        });
      });
      updateTables();
    };

    /* ---------- схема зала ---------- */
    var tableBusy = function (id) {
      if (!state.date || !state.time) return false;
      return hash(state.date + state.time + 'T' + id) % 5 === 0;
    };

    var updateTables = function () {
      tables.forEach(function (t) {
        var id = t.getAttribute('data-table');
        var cap = Number(t.getAttribute('data-cap'));
        var off = cap < state.guests || tableBusy(id);
        t.setAttribute('aria-disabled', String(off));
        if (off && state.table === id) {
          state.table = null;
          t.setAttribute('aria-pressed', 'false');
        }
      });
      updateTableLabel();
    };

    var updateTableLabel = function () {
      var t = state.table ? $('.floor__table[data-table="' + state.table + '"]', form) : null;
      tableLabel.textContent = t
        ? 'Вы выбрали столик ' + state.table + ' — ' + t.getAttribute('data-zone') + ', до ' + t.getAttribute('data-cap') + ' гостей'
        : 'Столик пока не выбран';
      updateSummary();
    };

    var pickTable = function (t) {
      if (t.getAttribute('aria-disabled') === 'true') {
        var cap = Number(t.getAttribute('data-cap'));
        EX.toast(cap < state.guests ? 'Этот столик рассчитан до ' + cap + ' гостей' : 'На это время столик уже забронирован');
        return;
      }
      state.table = t.getAttribute('data-table');
      tables.forEach(function (o) { o.setAttribute('aria-pressed', String(o === t)); });
      clearError('table');
      updateTableLabel();
    };

    tables.forEach(function (t) {
      t.addEventListener('click', function () { pickTable(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickTable(t); }
      });
    });

    /* ---------- телефон: маска +380 XX XXX XX XX ---------- */
    var formatPhone = function (v) {
      var digits = v.replace(/\D/g, '');
      if (digits.indexOf('380') === 0) digits = digits.slice(3);
      else if (digits.indexOf('80') === 0) digits = digits.slice(2);
      if (digits.indexOf('0') === 0) digits = digits.slice(1);
      digits = digits.slice(0, 9);
      var out = '+380';
      if (digits.length) out += ' ' + digits.slice(0, 2);
      if (digits.length > 2) out += ' ' + digits.slice(2, 5);
      if (digits.length > 5) out += ' ' + digits.slice(5, 7);
      if (digits.length > 7) out += ' ' + digits.slice(7, 9);
      return out;
    };
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+380 '; });
    phone.addEventListener('blur', function () { if (phone.value.replace(/\D/g, '') === '380') phone.value = ''; });
    phone.addEventListener('input', function () {
      phone.value = formatPhone(phone.value);
      clearError('phone');
    });
    $('#b-name').addEventListener('input', function () { clearError('name'); });

    /* ---------- ошибки ---------- */
    var setError = function (key, msg) {
      var el = $('[data-error="' + key + '"]', form);
      if (el) el.textContent = msg;
      var field = el && el.closest('.field');
      if (field) field.classList.add('has-error');
    };
    var clearError = function (key) {
      var el = $('[data-error="' + key + '"]', form);
      if (el) el.textContent = '';
      var field = el && el.closest('.field');
      if (field) field.classList.remove('has-error');
    };

    var validate = function () {
      var errors = [];
      var name = $('#b-name').value.trim();
      var digits = phone.value.replace(/\D/g, '');
      if (!state.date) { setError('date', 'Выберите дату'); errors.push(datesEl); }
      if (!state.time) { setError('time', 'Выберите удобное время'); errors.push(slotsEl); }
      if (!state.table) { setError('table', 'Выберите столик на схеме'); errors.push($('[data-floor]', form)); }
      if (name.length < 2) { setError('name', 'Как к вам обращаться? Минимум 2 буквы'); errors.push($('#b-name')); }
      if (digits.length !== 12) { setError('phone', 'Введите номер полностью: +380 XX XXX XX XX'); errors.push(phone); }
      return errors;
    };

    /* ---------- сводка ---------- */
    var updateSummary = function () {
      if (!sum.guests) return;
      sum.guests.textContent = state.guests + ' ' + guestsWord(state.guests);
      sum.date.textContent = state.date ? humanDate(state.date) : '—';
      sum.time.textContent = state.time || '—';
      sum.table.textContent = state.table ? '№ ' + state.table : '—';
    };

    /* ---------- отправка ---------- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = validate();
      if (errors.length) {
        var first = errors[0];
        first.scrollIntoView({ behavior: EX.reduceMotion() ? 'auto' : 'smooth', block: 'center' });
        var focusable = first.matches('input') ? first : $('input:not(:disabled), .floor__table', first);
        if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 350);
        EX.toast('Проверьте, пожалуйста, отмеченные поля');
        return;
      }
      var tableEl = $('.floor__table[data-table="' + state.table + '"]', form);
      var payload = {
        guests: state.guests,
        date: state.date,
        time: state.time,
        table: state.table,
        zone: tableEl.getAttribute('data-zone'),
        name: $('#b-name').value.trim(),
        phone: phone.value.trim(),
        occasion: occasion.value,
        comment: $('#b-comment').value.trim()
      };
      submitBtn.setAttribute('aria-busy', 'true');
      $('.btn__label', submitBtn).textContent = 'Отправляем…';
      Service.submit(payload).then(function (rec) {
        showConfirm(rec);
        form.reset();
        phone.value = '';
        state.table = null;
        tables.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
        setGuests(2);
        renderDates();
        renderMine();
      }).catch(function () {
        EX.toast('Не удалось отправить бронь. Позвоните нам: ' + ((window.EX_CONFIG && window.EX_CONFIG.cafe.phone) || ''));
      }).then(function () {
        submitBtn.removeAttribute('aria-busy');
        $('.btn__label', submitBtn).textContent = 'Подтвердить бронь';
      });
    });

    /* ---------- окно подтверждения ---------- */
    var dlg = $('[data-confirm]');
    var lastRecord = null;
    var showConfirm = function (rec) {
      lastRecord = rec;
      $('[data-confirm-code]', dlg).textContent = rec.id;
      var rows = [
        ['Гости', rec.guests + ' ' + guestsWord(rec.guests)],
        ['Дата', humanDate(rec.date)],
        ['Время', rec.time],
        ['Столик', '№ ' + rec.table + ', ' + rec.zone],
        ['Повод', OCCASIONS[rec.occasion] || '—']
      ];
      var list = $('[data-confirm-list]', dlg);
      list.innerHTML = '';
      rows.forEach(function (r) {
        var div = document.createElement('div');
        var dt = document.createElement('dt');
        var dd = document.createElement('dd');
        dt.textContent = r[0];
        dd.textContent = r[1];
        div.appendChild(dt);
        div.appendChild(dd);
        list.appendChild(div);
      });
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    };
    $('[data-confirm-close]', dlg).addEventListener('click', function () {
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

    /* .ics-файл для календаря */
    $('[data-ics]', dlg).addEventListener('click', function () {
      if (!lastRecord) return;
      var r = lastRecord;
      var start = r.date.replace(/-/g, '') + 'T' + r.time.replace(':', '') + '00';
      var endMin = EX.toMin(r.time) + 90;
      var end = r.date.replace(/-/g, '') + 'T' + EX.fromMin(endMin).replace(':', '') + '00';
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Example Coffee//Booking//RU', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:' + r.id + '@example-coffee',
        'DTSTAMP:' + stamp,
        'DTSTART;TZID=Europe/Kyiv:' + start,
        'DTEND;TZID=Europe/Kyiv:' + end,
        'SUMMARY:Столик в Example (' + r.guests + ' ' + guestsWord(r.guests) + ')',
        'LOCATION:' + ((window.EX_CONFIG && window.EX_CONFIG.cafe.address) || 'Example').replace(/,/g, '\\,'),
        'DESCRIPTION:Бронь ' + r.id + '\\, столик № ' + r.table,
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'example-' + r.id + '.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      EX.toast('Файл для календаря скачан');
    });

    /* ---------- мои брони ---------- */
    var mine = $('[data-my-bookings]');
    var mineList = $('[data-my-list]');
    var renderMine = function () {
      var todayIso = iso(today);
      var all = EX.store.get(STORE_KEY, []).filter(function (r) { return r && r.date >= todayIso; });
      EX.store.set(STORE_KEY, all);
      mine.hidden = !all.length;
      mineList.innerHTML = '';
      all.forEach(function (r) {
        var li = document.createElement('li');
        var text = document.createElement('span');
        text.innerHTML = '<b></b> · ';
        text.querySelector('b').textContent = r.id;
        text.appendChild(document.createTextNode(humanDate(r.date) + ', ' + r.time + ', столик ' + r.table));
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'text-btn';
        btn.textContent = 'Отменить';
        btn.addEventListener('click', function () {
          var rest = EX.store.get(STORE_KEY, []).filter(function (x) { return x.id !== r.id; });
          EX.store.set(STORE_KEY, rest);
          renderMine();
          EX.toast('Бронь ' + r.id + ' отменена');
        });
        li.appendChild(text);
        li.appendChild(btn);
        mineList.appendChild(li);
      });
    };

    /* ---------- карта по клику ---------- */
    var map = $('[data-map]');
    var mapBtn = $('[data-map-load]');
    if (map && mapBtn) {
      mapBtn.addEventListener('click', function () {
        var q = (window.EX_CONFIG && window.EX_CONFIG.cafe.mapQuery) || '50.4655,30.5155';
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=16&output=embed';
        iframe.title = 'Карта: как добраться до Example';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        map.appendChild(iframe);
        $('.map-card__placeholder', map).hidden = true;
      });
    }

    setGuests(2);
    renderDates();
    renderMine();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
