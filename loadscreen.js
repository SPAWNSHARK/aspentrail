/* SS WAYFARER loading screen (Nov 28). Shared by every page; load it FIRST in <head>.
   Covers the page with images/wayfarer-loading-clean.gif (the user's loading GIF with its "LOADING THE LIBRARY..." caption
   painted out) and overlays a live caption "LOADING THE <ROOM>..." at the same spot.
   WF_LOADSCREEN.show(min, instant, target)  cover now; target = page ('bridge.html?x'), room id ('medbay') or full caption text
   WF_LOADSCREEN.leave(target, instant)      show + remember in sessionStorage so the NEXT page opens already covered, same caption
   WF_LOADSCREEN.ready()                     destination in place: hide once the minimum display time has passed
   WF_LOADSCREEN.label(target)               caption text for a page / room id
   Also shown on the first page load of a session (app / tab just opened; sessionStorage 'wf-opened').
   Used by: deck-map taps (life.js), every door (door.js leave), Halcyon "take me to…" (ai.js).
   Pages hide it via ready(); a page with no #wf-fade / pending wf-goto gets a fallback (scene loaded + 1.8 s). Hard cap 25 s. */
(function () {
  var KEY = 'wf-loadscreen', SRC = 'images/wayfarer-loading-clean.gif?v=1', CAP = 25000, IW = 852, IH = 1846, TY = 1333;
  var NAMES = { index: 'ATRIUM', atrium: 'ATRIUM', corridor: 'ATRIUM', bridge: 'COMMAND BRIDGE', holodeck: 'HOLODECK', lounge: 'CREW LOUNGE', media: 'MEDIA NEXUS',
    library: 'LIBRARY', core: 'CORE', corenorth: 'CORE', medbay: 'MEDBAY', xeno: 'XENOBIOLOGY LAB', mess: 'MESS HALL', maint: 'MAINTENANCE BAY', firefly: 'HANGAR',
    quarters: "CAPTAIN'S QUARTERS", engine: 'ENGINE ROOM', station: 'HIVEPORT', hangar: 'SHIP VIEW', minigame: 'FLIGHT MODE', core2: 'CORE' };
  var FULL = { minigame: 'LAUNCHING FLIGHT MODE...', hangar: 'LOADING SHIP VIEW...' };
  function label(t) {
    if (!t) t = location.pathname;
    if (/\s/.test(t) && t === t.toUpperCase()) return t;                       // already a caption
    var k = String(t).split('#')[0].split('?')[0].split('/').pop().replace(/\.html$/, '').toLowerCase() || 'index';
    if (FULL[k]) return FULL[k];
    return 'LOADING THE ' + (NAMES[k] || k.toUpperCase()) + '...';
  }
  var el = null, box = null, cap = null, minUntil = 0, timer = null, capT = null, onRs = null;
  function css() {
    if (document.getElementById('wf-ls-css')) return;
    var s = document.createElement('style'); s.id = 'wf-ls-css';
    s.textContent = '#wf-loadscreen{position:fixed;left:0;top:0;width:100vw;height:100vh;height:100lvh;background:#04060b;z-index:2147483000;opacity:0;transition:opacity .35s ease;overflow:hidden;touch-action:none}' +
      '#wf-loadscreen .b{position:absolute;left:50%;top:50%}' +
      '#wf-loadscreen img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none}' +
      '#wf-loadscreen .c{position:absolute;left:0;width:100%;text-align:center;white-space:nowrap;transform:translateY(-50%);color:#ecd9ad;text-shadow:0 0 .6em rgba(255,190,110,.35),0 1px 2px rgba(0,0,0,.6);' +
      'font-family:"Avenir Next","Avenir","Montserrat","Futura","Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:300;text-transform:uppercase;pointer-events:none}';
    (document.head || document.documentElement).appendChild(s);
  }
  function fit() {                                                              // size the 852×1846 art like object-fit (cover portrait / contain landscape) and place the caption on it
    if (!el || !box) return;
    var w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight, s = (w > h) ? Math.min(w / IW, h / IH) : Math.max(w / IW, h / IH);
    box.style.width = IW * s + 'px'; box.style.height = IH * s + 'px'; box.style.marginLeft = -IW * s / 2 + 'px'; box.style.marginTop = -IH * s / 2 + 'px';
    cap.style.top = TY * s + 'px';
    var fs = 24 * s; cap.style.fontSize = fs + 'px'; cap.style.letterSpacing = '0.44em'; cap.style.paddingLeft = '0.44em';
    var tw = cap.scrollWidth, maxW = IW * s * 0.9; var span = cap.firstChild; if (span && span.getBoundingClientRect) { tw = span.getBoundingClientRect().width; }
    if (tw > maxW) cap.style.fontSize = fs * maxW / tw + 'px';
  }
  function show(min, instant, target) {
    css(); clearTimeout(timer); clearTimeout(capT);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = document.createElement('div'); el.id = 'wf-loadscreen';
    box = document.createElement('div'); box.className = 'b';
    var im = document.createElement('img'); im.alt = ''; im.draggable = false; im.src = SRC; box.appendChild(im);
    cap = document.createElement('div'); cap.className = 'c'; var sp = document.createElement('span'); sp.style.display = 'inline-block'; sp.textContent = label(target); cap.appendChild(sp); box.appendChild(cap);
    el.appendChild(box); document.documentElement.appendChild(el); fit();
    if (!onRs) { onRs = function () { fit(); }; addEventListener('resize', onRs); addEventListener('orientationchange', onRs); }
    if (instant) el.style.transition = 'none';
    void el.offsetWidth; el.style.opacity = '1';
    minUntil = Date.now() + (min == null ? 2500 : min);
    capT = setTimeout(hide, CAP);
  }
  function hide() {
    clearTimeout(timer); clearTimeout(capT); try { sessionStorage.removeItem(KEY); } catch (e) {}
    var e = el; if (!e) return; el = null; box = null; cap = null; e.style.transition = 'opacity .5s ease'; e.style.opacity = '0';
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 600);
  }
  function ready() { if (!el) return; clearTimeout(timer); timer = setTimeout(hide, Math.max(0, minUntil - Date.now())); }
  function leave(target, instant) { show(2500, instant, target); try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), l: label(target) })); } catch (e) {} }
  window.WF_LOADSCREEN = { show: show, hide: hide, ready: ready, leave: leave, label: label, active: function () { return !!el; } };

  /* arrived from a teleport / door / Halcyon request on another page: cover immediately, before anything else paints */
  var rec = null; try { rec = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (typeof rec === 'number') rec = { t: rec };
  var opened = false; try { opened = !!sessionStorage.getItem('wf-opened'); sessionStorage.setItem('wf-opened', '1'); } catch (e) { opened = true; }
  window.WF_FIRSTOPEN = !opened;
  var viaTravel = !!(rec && rec.t && Date.now() - rec.t < 60000);
  if (viaTravel || !opened) {                      // travel arrival, or the app/tab was just opened (first page of the session)
    var hadGoto = false; try { hadGoto = !!sessionStorage.getItem('wf-goto'); } catch (e) {}
    show(2000, true, viaTravel ? rec.l : null);
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    document.addEventListener('DOMContentLoaded', function () {
      if (hadGoto || document.getElementById('wf-fade')) return;       /* life.js arrive() / atrium ready() call ready() themselves */
      var done = false, go = function () { if (done) return; done = true; setTimeout(ready, 1800); };
      var sc = document.querySelector('a-scene');
      if (sc && !sc.hasLoaded) sc.addEventListener('loaded', go); else go();
      setTimeout(go, 12000);
    });
  }
})();
