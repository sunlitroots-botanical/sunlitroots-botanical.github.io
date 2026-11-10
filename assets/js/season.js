/* Sunlit Roots — season picker. Loaded in <head> (tiny, no dependencies) so the
   right scene paints first. Northern Hemisphere cutovers:
   spring Mar 20 · summer Jun 21 · fall Sep 22 · winter Dec 21. */
(function () {
  var SEASONS = ['spring', 'summer', 'fall', 'winter'];
  function byDate(d) {
    d = d || new Date();
    var md = (d.getMonth() + 1) * 100 + d.getDate();
    if (md >= 1221 || md < 320) return 'winter';
    if (md >= 922) return 'fall';
    if (md >= 621) return 'summer';
    return 'spring';
  }
  function read(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function mode() {
    var q = /[?&]season=(spring|summer|fall|winter|auto)\b/.exec(window.location.search);
    if (q) return q[1];
    var saved = read('srb-season-mode');
    if (saved && (saved === 'auto' || SEASONS.indexOf(saved) > -1)) return saved;
    return document.documentElement.getAttribute('data-season-mode') || 'auto';
  }
  function resolve(m) { return SEASONS.indexOf(m) > -1 ? m : byDate(); }
  var root = document.documentElement;
  var m = mode();
  root.setAttribute('data-season-mode', m);
  root.setAttribute('data-season', resolve(m));
  root.className = root.className.replace(/\bno-js\b/, 'js');
  if (read('srb-motion') === 'paused') root.className += ' motion-paused';
  window.SRBSeason = { byDate: byDate, resolve: resolve, mode: mode, list: SEASONS };
})();
