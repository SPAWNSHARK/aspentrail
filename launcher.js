/* SS Wayfarer — "Where to?" launcher. Shown once when the app is opened (first page of a session, atrium only, after the loading screen). */
(function () {
  if (!window.WF_FIRSTOPEN || location.search) return;
  var T = [['bridge.html', 'COMMAND BRIDGE', 'Upper deck'], ['holodeck.html', 'HOLODECK', 'Upper deck'], ['lounge.html', 'CREW LOUNGE', 'Upper deck'],
    ['media.html', 'MEDIA NEXUS', 'Upper deck'], ['library.html', 'LIBRARY', 'Upper deck'], ['quarters.html', "CAPTAIN'S QUARTERS", 'Upper deck'],
    ['firefly.html', 'HANGAR', 'Lower deck'], ['medbay.html', 'MEDBAY', 'Lower deck'], ['xeno.html', 'XENOBIOLOGY', 'Lower deck'],
    ['mess.html', 'MESS HALL', 'Lower deck'], ['maint.html', 'MAINTENANCE', 'Lower deck'], ['core.html', 'THE CORE', 'Lower deck']];
  var css = '#wf-launch{position:fixed;inset:0;z-index:100002;background:rgba(7,11,28,.94);display:flex;flex-direction:column;justify-content:flex-end;padding:calc(env(safe-area-inset-top,0px) + 70px) 12px calc(env(safe-area-inset-bottom,0px) + 14px);font-family:ui-monospace,Menlo,monospace;color:#cfeeff;overflow-y:auto}' +
    '#wf-launch h1{margin:0 0 4px;font:700 15px ui-monospace,Menlo,monospace;letter-spacing:3px;color:#7fe3ff}#wf-launch p{margin:0 0 12px;font-size:10px;letter-spacing:1.2px;opacity:.7}' +
    '#wf-launch .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}#wf-launch button{padding:14px 8px;border-radius:4px;border:1px solid rgba(127,227,255,.35);background:rgba(127,227,255,.07);color:#cfeeff;font:700 11px ui-monospace,Menlo,monospace;letter-spacing:1.2px;text-align:left}' +
    '#wf-launch button small{display:block;margin-top:3px;font-weight:400;font-size:9px;opacity:.6;letter-spacing:1px}#wf-launch button:active{background:rgba(127,227,255,.25)}' +
    '#wf-launch .stay{grid-column:1/3;text-align:center;border-color:rgba(255,210,122,.5);color:#ffd27a;background:rgba(255,210,122,.07)}';
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'wf-launch';
    d.innerHTML = '<h1>SS WAYFARER</h1><p>WHERE TO, CAPTAIN?</p>';
    var g = document.createElement('div'); g.className = 'g'; d.appendChild(g);
    var s = document.createElement('button'); s.className = 'stay'; s.textContent = 'STAY IN THE ATRIUM'; s.onclick = function () { d.remove(); }; g.appendChild(s);
    T.forEach(function (t) {
      var b = document.createElement('button'); b.innerHTML = t[1] + '<small>' + t[2] + '</small>';
      b.onclick = function () { var LS = window.WF_LOADSCREEN; if (LS) LS.leave(t[0]); setTimeout(function () { location.href = t[0]; }, LS ? 450 : 0); };
      g.appendChild(b);
    });
    document.body.appendChild(d);
  }
  var n = 0, iv = setInterval(function () {
    var LS = window.WF_LOADSCREEN, f = document.getElementById('wf-fade');
    if (++n > 120) return clearInterval(iv);
    if (LS && LS.active()) return;
    if (f && f.style.opacity !== '0') return;        // atrium fade not cleared yet
    clearInterval(iv); setTimeout(build, 600);
  }, 500);
})();
