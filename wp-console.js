// SS Wayfarer — THE LIBRARY CONSOLE = the user's WordPress site (user, Nov 26: "the console in the brain library room needs to be
// my WordPress site that I can scroll through, animation interactions included"). Site: sonsofnaphtali.wordpress.com (found via
// the user's WordPress.com connection). Posts come live from the public WordPress.com REST API (CORS-enabled, read-only, no key):
// a glass reader with the site masthead, post cards that fade/slide in as you scroll, and full posts. "Open the full site" opens it
// in the browser. The console's own 3D screen shows the site title and the latest post (canvas texture).
(function () {
  var SITE = 'sonsofnaphtali.wordpress.com', API = 'https://public-api.wordpress.com/rest/v1.1/sites/' + SITE;
  var posts = null, box = null;
  function fetchPosts() { if (posts) return Promise.resolve(posts); return fetch(API + '/posts/?type=any&number=30&fields=ID,title,excerpt,content,date,featured_image,URL,type').then(function (r) { return r.json(); }).then(function (d) { posts = d.posts || []; return posts; }); }
  function clean(h) { var d = document.createElement('div'); d.innerHTML = h || ''; d.querySelectorAll('script,iframe,style').forEach(function (e) { e.remove(); }); return d.innerHTML; }
  var css = document.createElement('style');
  css.textContent = '#wf-wp{position:fixed;inset:calc(40px + env(safe-area-inset-top,0px)) 0 0 0;margin:0 auto;z-index:66;display:none;width:min(96vw,640px);height:calc(100vh - 52px - env(safe-area-inset-top,0px));border-radius:22px 22px 0 0;overflow:hidden;box-sizing:border-box;' +
    'background:#14100c;border:1px solid rgba(255,200,140,.3);box-shadow:0 18px 50px rgba(0,0,0,.6);color:#f4ead8;font:400 16px Georgia,"Iowan Old Style",serif}' +
    '#wf-wp .bar{position:absolute;top:0;left:0;right:0;z-index:2;display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(20,16,12,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,200,140,.18);font:700 12px -apple-system,system-ui,sans-serif;letter-spacing:2px;color:#ffc98a}' +
    '#wf-wp .bar span{flex:1}#wf-wp .bar button,#wf-wp .bar a{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;border-radius:10px;padding:6px 10px;font:600 12px -apple-system,system-ui,sans-serif;text-decoration:none;letter-spacing:0}' +
    '#wf-wp .sc{position:absolute;inset:46px 0 0 0;overflow-y:auto;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}' +
    '#wf-wp .mast{padding:46px 24px 34px;text-align:center;background:radial-gradient(ellipse at 50% 0%,rgba(255,170,80,.25),transparent 70%)}#wf-wp .mast h1{margin:0;font:700 34px Georgia,serif;letter-spacing:1px;animation:wpIn 1s ease both}#wf-wp .mast p{color:#d8c3a8;font-style:italic;margin:8px 0 0;animation:wpIn 1.2s .2s ease both}' +
    '#wf-wp .card{margin:0 18px 18px;border-radius:16px;overflow:hidden;background:#1e1812;border:1px solid rgba(255,200,140,.14);opacity:0;transform:translateY(26px) scale(.98);transition:opacity .6s ease,transform .6s ease,box-shadow .3s;cursor:pointer}' +
    '#wf-wp .card.in{opacity:1;transform:none}#wf-wp .card:active{transform:scale(.98)}#wf-wp .card img{width:100%;height:190px;object-fit:cover;display:block;transition:transform 6s ease}#wf-wp .card.in img{transform:scale(1.06)}' +
    '#wf-wp .card div{padding:14px 16px}#wf-wp .card h2{margin:0 0 6px;font:700 20px Georgia,serif;color:#fff}#wf-wp .card small{color:#c8a27a;font:600 11px -apple-system,system-ui,sans-serif;letter-spacing:1.5px}#wf-wp .card p{margin:8px 0 0;color:#e2d4bf;line-height:1.55;font-size:15px}' +
    '#wf-wp article{padding:22px 22px 60px;line-height:1.7;animation:wpIn .6s ease both}#wf-wp article h1{font:700 28px Georgia,serif;margin:0 0 6px;color:#fff}#wf-wp article img{max-width:100%;height:auto;border-radius:10px}#wf-wp article a{color:#ffc98a}#wf-wp article blockquote{border-left:3px solid #ffb050;margin:16px 0;padding:2px 14px;color:#e8d8c0}' +
    '#wf-wp .st{padding:40px;text-align:center;color:#c8b49a;font:500 14px -apple-system,system-ui,sans-serif}@keyframes wpIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}' +
    '#wf-wp .prog{position:absolute;top:46px;left:0;height:2px;background:linear-gradient(90deg,#ffb050,#ffe08a);z-index:3;width:0}';
  document.head.appendChild(css);
  function shell() {
    if (box) return box; box = document.createElement('div'); box.id = 'wf-wp'; document.body.appendChild(box);
    ['pointerdown', 'touchstart', 'mousedown', 'click', 'wheel', 'keydown'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
    box.innerHTML = '<div class="bar"><button class="bk" style="display:none">‹ Reader</button><span>📚 SONS OF NAPHTALI</span><button class="tg">Reader</button><a href="https://' + SITE + '" target="_blank" rel="noopener">↗</a><button class="x">✕</button></div><div class="prog"></div><div class="sc"></div>' +
      '<iframe class="live" src="about:blank" style="position:absolute;inset:46px 0 0 0;width:100%;height:calc(100% - 46px);border:0;background:#fff;display:none" allow="fullscreen" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    box.querySelector('.x').onclick = close; box.querySelector('.bk').onclick = list;
    box.querySelector('.tg').onclick = function () { live(!liveOn); };
    var sc = box.querySelector('.sc'); sc.addEventListener('scroll', function () { box.querySelector('.prog').style.width = (sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight) * 100) + '%'; }, { passive: true });
    return box;
  }
  var io = null;
  function list() {
    var sc = box.querySelector('.sc'); box.querySelector('.bk').style.display = 'none'; sc.innerHTML = '<div class="mast"><h1>Sons of Naphtali</h1><p>Genetics · history · prophecy</p></div><div class="st">Loading the archive…</div>'; sc.scrollTop = 0;
    fetchPosts().then(function (P) {
      sc.querySelector('.st').remove();
      if (!P.length) { sc.insertAdjacentHTML('beforeend', '<div class="st">Nothing published yet — pages and posts appear here as you publish them.</div>'); return; }
      if (io) io.disconnect(); io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('in'); }); }, { root: sc, threshold: 0.12 });
      P.forEach(function (p, i) {
        var c = document.createElement('div'); c.className = 'card'; c.style.transitionDelay = Math.min(i, 3) * 0.08 + 's';
        c.innerHTML = (p.featured_image ? '<img loading="lazy" src="' + p.featured_image + '">' : '') + '<div><small>' + new Date(p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() + '</small><h2>' + p.title + '</h2><p>' + (p.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 220) + '…</p></div>';
        c.onclick = function () { read(p); }; sc.appendChild(c); io.observe(c);
      });
    }).catch(function () { sc.querySelector('.st').innerHTML = 'The archive is out of reach right now. <a href="https://' + SITE + '" target="_blank" style="color:#ffc98a">Open the site ↗</a>'; });
  }
  function read(p) { var sc = box.querySelector('.sc'); box.querySelector('.bk').style.display = ''; sc.innerHTML = '<article><small style="color:#c8a27a;font:600 11px -apple-system,system-ui,sans-serif;letter-spacing:1.5px">' + new Date(p.date).toLocaleDateString().toUpperCase() + '</small><h1>' + p.title + '</h1>' + clean(p.content) + '</article>'; sc.scrollTop = 0; }
  var liveOn = true;
  function live(on) {           // the real site, framed: its own scrolling + animations. Reader = the same content via the API.
    liveOn = on; var f = box.querySelector('.live'); f.style.display = on ? 'block' : 'none'; box.querySelector('.sc').style.display = on ? 'none' : 'block'; box.querySelector('.prog').style.display = on ? 'none' : 'block';
    box.querySelector('.tg').textContent = on ? 'Reader' : 'Live site'; if (on && f.src === 'about:blank') f.src = 'https://' + SITE + '/'; if (!on) list();
  }
  function open() { shell(); box.style.display = 'block'; document.body.classList.add('reading'); window.WAYFARER && (WAYFARER.frozen = true); live(liveOn); if (window.WF_SOUND) WF_SOUND.droid('scan', 0, 0.4); if (window.WF_LIFE) WF_LIFE.event('wordpress'); }
  function close() { if (box) box.style.display = 'none'; document.body.classList.remove('reading'); if (window.WAYFARER) WAYFARER.frozen = false; }
  // the console's 3D screen: masthead + latest post title
  function screenTexture(cb) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var x = c.getContext('2d'), T = AFRAME.THREE;
    function draw(title) { var g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#2a1a0e'); g.addColorStop(1, '#0e0a06'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
      x.fillStyle = '#ffc98a'; x.font = '700 40px Georgia, serif'; x.textAlign = 'center'; x.fillText('Sons of Naphtali', 256, 78); x.fillStyle = '#c8a27a'; x.font = '600 18px -apple-system, Helvetica, sans-serif'; x.fillText('LATEST', 256, 128);
      x.fillStyle = '#fff'; x.font = '600 24px Georgia, serif'; var t = (title || 'Tap to read').slice(0, 34); x.fillText(t, 256, 166); x.fillStyle = '#ffb050'; x.font = '700 16px -apple-system, Helvetica, sans-serif'; x.fillText('▶ TAP TO OPEN', 256, 220); tex.needsUpdate = true; }
    var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; draw(null); fetchPosts().then(function (P) { draw(P[0] && P[0].title.replace(/<[^>]+>/g, '')); }).catch(function () {}); cb(tex);
  }
  window.WF_WP = { open: open, close: close, screenTexture: screenTexture, site: SITE };
}());
