/* SS Wayfarer — "Where to?" launcher. Shown once when the app is opened (first page of a session, atrium only, after the loading screen). */
(function () {
  if (!window.WF_FIRSTOPEN || location.search) return;
  var T = [['bridge.html', '🚀 COMMAND BRIDGE', 'Upper deck'], ['holodeck.html', '🌐 HOLODECK', 'Upper deck'], ['lounge.html', '🛋️ CREW LOUNGE', 'Upper deck'],
    ['media.html', '🎬 MEDIA NEXUS', 'Upper deck'], ['library.html', '📚 LIBRARY', 'Upper deck'], ['quarters.html', "🛏️ CAPTAIN'S QUARTERS", 'Upper deck'],
    ['firefly.html', '🛩️ HANGAR', 'Lower deck'], ['medbay.html', '⚕️ MEDBAY', 'Lower deck'], ['xeno.html', '🧬 XENOBIOLOGY', 'Lower deck'],
    ['mess.html', '🍽️ MESS HALL', 'Lower deck'], ['maint.html', '🔧 MAINTENANCE', 'Lower deck'], ['core.html', '🧠 THE CORE', 'Lower deck']];
  var css = '#wf-launch{position:fixed;inset:0;z-index:100002;background:rgba(7,11,28,.94);display:flex;flex-direction:column;justify-content:flex-end;padding:calc(env(safe-area-inset-top,0px) + 70px) 12px calc(env(safe-area-inset-bottom,0px) + 14px);font-family:ui-monospace,Menlo,monospace;color:#cfeeff;overflow-y:auto}' +
    '#wf-launch h1{margin:0 0 4px;font:700 15px ui-monospace,Menlo,monospace;letter-spacing:3px;color:#7fe3ff}#wf-launch p{margin:0 0 12px;font-size:10px;letter-spacing:1.2px;opacity:.7}' +
    '#wf-launch .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}#wf-launch button{padding:14px 8px;border-radius:4px;border:1px solid rgba(127,227,255,.35);background:rgba(127,227,255,.07);color:#cfeeff;font:700 11px ui-monospace,Menlo,monospace;letter-spacing:1.2px;text-align:left}' +
    '#wf-launch button small{display:block;margin-top:3px;font-weight:400;font-size:9px;opacity:.6;letter-spacing:1px}#wf-launch button:active{background:rgba(127,227,255,.25)}' +
    '@keyframes wfl{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}#wf-launch{animation:wfl .5s ease-out}#wf-launch button{animation:wfl .45s ease-out both}#wf-launch h1,#wf-launch p{animation:wfl .5s ease-out both}' +
    '#wf-launch .hb{flex:1;min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}#wf-launch .hb svg{width:min(62vw,250px);height:auto;filter:drop-shadow(0 0 14px rgba(95,168,122,.7));animation:wfb 1.6s ease-in-out infinite}#wf-launch .hb span{margin-top:8px;font:700 10px ui-monospace,Menlo,monospace;letter-spacing:3px;color:#8fe0a8}' +
    '@keyframes wfb{0%,100%{transform:scale(1)}12%{transform:scale(1.05)}24%{transform:scale(1)}36%{transform:scale(1.035)}}@keyframes wfs{to{stroke-dashoffset:-60}}#wf-launch .sp{stroke-dasharray:6 54;animation:wfs 1.4s linear infinite}' +
    '#wf-launch .stay{grid-column:1/3;text-align:center;border-color:rgba(255,210,122,.5);color:#ffd27a;background:rgba(255,210,122,.07)}';
  var FOLDS = 'M60 40c10-14 28-10 34 4M45 62c12-10 22-4 26 6M100 48c12 4 18 14 14 26M38 92c10 6 18 2 24-8M84 84c8-8 20-6 26 2M70 104c6-6 14-6 20 0';
  var BRAIN = '<svg viewBox="0 0 170 130"><path d="M85 14C62 4 30 14 24 42c-12 6-16 26-6 38-2 16 10 30 26 30 8 12 28 14 41 4 13 10 33 8 41-4 16 0 28-14 26-30 10-12 6-32-6-38C145 14 108 4 85 14Z" fill="#2c5a40" stroke="#8fe0a8" stroke-width="2.2"/><path d="M85 16v96" stroke="#8fe0a8" stroke-width="1.6" opacity=".7"/><path d="'+FOLDS+'" fill="none" stroke="#8fe0a8" stroke-width="2" stroke-linecap="round" opacity=".85"/><path class="sp" d="'+FOLDS+'" fill="none" stroke="#e6fff0" stroke-width="2.6" stroke-linecap="round"/></svg>';
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'wf-launch';
    d.innerHTML = '<div class="hb">'+BRAIN+'<span>HALCYON · TAP TO TALK</span></div><h1>SS WAYFARER</h1><p>WHERE TO, CAPTAIN?</p>';
    var g = document.createElement('div'); g.className = 'g'; d.appendChild(g);
    var s = document.createElement('button'); s.className = 'stay'; s.textContent = '🏛️ STAY IN THE ATRIUM'; s.onclick = function () { d.remove(); }; g.appendChild(s);
    T.forEach(function (t) {
      var b = document.createElement('button'); b.innerHTML = t[1] + '<small>' + t[2] + '</small>';
      b.onclick = function () { var LS = window.WF_LOADSCREEN; if (LS) LS.leave(t[0]); setTimeout(function () { location.href = t[0]; }, LS ? 450 : 0); };
      b.style.animationDelay = (0.12 + T.indexOf(t) * 0.05) + 's'; g.appendChild(b);
    });
    d.querySelector('.hb').onclick = function () { d.remove(); if (window.WF_AI) WF_AI.open(); };
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
