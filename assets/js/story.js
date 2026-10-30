/* =========================================================
   Example — story: the timeline fills as you scroll
   ========================================================= */
(function () {
  'use strict';
  var EX = window.EX;

  function boot() {
    var list = EX.$('[data-chapters]');
    var bar = EX.$('[data-chapters-progress]');
    if (!list || !bar) return;
    var ticking = false;
    var update = function () {
      var r = list.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.6 - r.top) / r.height;
      bar.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
