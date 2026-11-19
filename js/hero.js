/* Hero: cycle through services — headline word blinks in, matching tile lights up. */
(function () {
  var word = document.getElementById('rotWord');
  var grid = document.getElementById('svcGrid');
  if (!word || !grid) return;
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.svc-tile'));
  var labels = tiles.map(function (t) { return t.getAttribute('data-label'); });
  var i = 0, timer = null, paused = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(n) {
    i = (n + labels.length) % labels.length;
    tiles.forEach(function (t, k) { t.classList.toggle('is-active', k === i); });
    if (reduce) { word.textContent = labels[i]; return; }
    word.classList.remove('is-in');
    word.classList.add('is-out');
    setTimeout(function () {
      word.textContent = labels[i];
      word.classList.remove('is-out');
      void word.offsetWidth; // restart animation
      word.classList.add('is-in');
    }, 220);
  }
  function start() { stop(); timer = setInterval(function () { if (!paused) show(i + 1); }, 2000); }
  function stop() { if (timer) clearInterval(timer); }

  tiles.forEach(function (t, k) {
    t.addEventListener('mouseenter', function () { paused = true; show(k); });
    t.addEventListener('mouseleave', function () { paused = false; });
    t.addEventListener('focus', function () { paused = true; show(k); });
    t.addEventListener('blur', function () { paused = false; });
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  show(0);
  start();
})();
