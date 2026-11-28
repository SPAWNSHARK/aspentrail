/* SS WAYFARER map-teleport loading screen (Nov 28). Shared by every page; load it FIRST in <head>.
   WF_LOADSCREEN.show(min)  cover the page with images/wayfarer-loading.gif
   WF_LOADSCREEN.leave()    show + remember it in sessionStorage, so the NEXT page opens already covered (cross-page travel)
   WF_LOADSCREEN.ready()    the destination is in place: hide once the minimum display time has passed
   Pages hide it themselves via ready(); a page with no #wf-fade / pending wf-goto gets a fallback (scene loaded + 3.5 s). Hard cap 25 s. */
(function () {
  var KEY = 'wf-loadscreen', SRC = 'images/wayfarer-loading.gif?v=1', CAP = 25000;
  var el = null, minUntil = 0, timer = null, capT = null;
  function css() {
    if (document.getElementById('wf-ls-css')) return;
    var s = document.createElement('style'); s.id = 'wf-ls-css';
    s.textContent = '#wf-loadscreen{position:fixed;left:0;top:0;width:100vw;height:100vh;height:100lvh;background:#04060b;z-index:2147483000;opacity:0;transition:opacity .35s ease;display:flex;align-items:center;justify-content:center;touch-action:none}' +
      '#wf-loadscreen img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none;user-select:none}' +
      '@media (orientation:landscape){#wf-loadscreen img{object-fit:contain}}';
    (document.head || document.documentElement).appendChild(s);
  }
  function show(min, instant) {
    css(); clearTimeout(timer); clearTimeout(capT);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = document.createElement('div'); el.id = 'wf-loadscreen';
    var im = document.createElement('img'); im.alt = ''; im.draggable = false; im.src = SRC; el.appendChild(im);
    document.documentElement.appendChild(el);
    if (instant) el.style.transition = 'none';
    void el.offsetWidth; el.style.opacity = '1';
    minUntil = Date.now() + (min == null ? 2500 : min);
    capT = setTimeout(hide, CAP);
  }
  function hide() {
    clearTimeout(timer); clearTimeout(capT); try { sessionStorage.removeItem(KEY); } catch (e) {}
    var e = el; if (!e) return; el = null; e.style.transition = 'opacity .5s ease'; e.style.opacity = '0';
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 600);
  }
  function ready() { if (!el) return; clearTimeout(timer); timer = setTimeout(hide, Math.max(0, minUntil - Date.now())); }
  function leave() { show(); try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  window.WF_LOADSCREEN = { show: show, hide: hide, ready: ready, leave: leave, active: function () { return !!el; } };

  /* arrived from a map tap on another page: cover immediately, before anything else paints */
  var t = 0; try { t = +sessionStorage.getItem(KEY) || 0; } catch (e) {}
  if (t && Date.now() - t < 60000) {
    var hadGoto = false; try { hadGoto = !!sessionStorage.getItem('wf-goto'); } catch (e) {}
    show(2000, true);
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    document.addEventListener('DOMContentLoaded', function () {
      if (hadGoto || document.getElementById('wf-fade')) return;       /* life.js arrive() / atrium ready() call ready() themselves */
      var done = false, go = function () { if (done) return; done = true; setTimeout(ready, 3500); };
      var sc = document.querySelector('a-scene');
      if (sc && !sc.hasLoaded) sc.addEventListener('loaded', go); else go();
      setTimeout(go, 12000);
    });
  }
})();
