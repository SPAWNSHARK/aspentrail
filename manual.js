// SS Wayfarer — THE CAPTAIN'S MANUAL (user, Nov 26: "the console in the hallway should be a manual guide that discusses all of
// the various aspects of this game and all of the hidden Easter eggs"). Opened from the corridor console (Forge's maintenance
// panel, port wall z −6) or key H anywhere. KEEP THIS CURRENT whenever a feature ships — it is the user's map of the game.
(function () {
  var S = [
    ['🏛 The Atrium (new, Nov 26)', [
      'The ship’s main hall is now a split-level ATRIUM: two walkways either side of an opening that looks down onto the lower deck, with a skylight overhead.',
      'Upper deck doors: Command Bridge (bow end) · Holodeck and Captain’s Quarters (port) · Crew Lounge and Media Nexus (starboard) · the Library (aft end).',
      'Walk past either side of the Library door at the aft end onto the walkway that rings the Library, then take either curved staircase down to the lower deck. Shortcut: inside the Library, the two side doors (STAIRS · LOWER DECK, where the book wings used to be) put you at the top of each staircase.',
      'Lower deck doors: Firefly Hangar (the Pathfinder cruiser WF-01) · Medbay · Xenobiology · Mess Hall & Galley · Maintenance & Storage · Engine Room (the Halcyon power core, under the Library). All open — they’re furnished blockouts for now; their jobs (landings, recovery, specimens, cooking, the reactor) are coming.',
      'Captain’s Quarters (upper deck, port, aft of the Holodeck): your bunk, desk and lockers. Ask Halcyon to “take me to the medbay / engine room / my quarters”.',
      'Room jobs — tap the furniture with a glowing amber ring: QUARTERS bunk = sleep · trophy locker = your Hiveport curios · desk = a private Captain’s log (saved on this device). MEDBAY bed = check-up with Vesper · console = your medical record. XENOBIOLOGY tanks = every planet and anomaly you’ve scanned. MESS HALL replicator = order food, or replicate cat treats (20 cr). MAINTENANCE console = open ship faults. ENGINE ROOM core console = reactor status and “spin up a light-speed jump now”. FIREFLY HANGAR (tap the cruiser or its console): BOARD HER — step into the cabin (pilot + co-pilot seats, lockers, quarantine alcove) — then take the pilot’s seat to LAUNCH: the bow jaw swings open, the gear folds up and you ride the Firefly down and out into Flight Mode, flying the Firefly itself. Leaving Flight Mode brings her back to the hangar.',
      'Ship Log → MAP has ⬆ UPPER DECK / ⬇ LOWER DECK; it opens on the deck you’re on.',
      'Forge’s Engineering console on the port walkway (labelled GUIDE) still opens this manual.'
    ]],
    ['🤖 Droid crew (V2)', [
      'Each droid greets you in character. Talk to one for three new topics: Recent duty log (what they’ve actually been doing), Maintenance register (the live fault list) and Personal log.',
      'Talking interrupts their work — they go back to it afterwards (unless you order them back to station). On red alert they drop everything and run home; no chit-chat until it’s over.'
    ]],
    ['🛋 Crew Lounge', [
      'Alien aquarium in the port wall: glowing fish, a drifting ray, swaying kelp. Star-fire hearth on the starboard wall. Brass pendants over the table, bar cabinet by the door. Alien TV on the window wall (tap to change channel), Starjack on the coffee table.'
    ]],
    ['🧭 Getting around', [
      'Phone: left glass stick walks, right stick looks. Desktop: WASD / arrows walk, drag (or click to lock the mouse) to look.',
      'Top bar: clock and credits on the left; 📍 map · 📋 Ship Log · 🧠 Halcyon · 📖 this manual · 🔊 sound · ⚙️ settings. The ⚙️ menu holds thumbstick size (S / M / L) and opacity, VR / gyro look, level the view, and 1st / 3rd person.',
      'Doors: walk up and tap the glowing hub button, or just walk through an open one. The coloured half-round rug in front of each door matches its room.',
      'Ship Log (📋 or J): GOALS · MAP (live deck map — tap a room to go straight there) · CARGO · SCIENCE · ORDERS.',
      'Keys: J log · H this manual · I Halcyon · M mute · V view · Esc closes panels.']],
    ['💰 Credits, rank & daily goals', [
      'One wallet for everything. Contracts, goals, repairs, scans, games and bounties pay into it; shops and bets take from it.',
      'Three DAILY GOALS every day (150 cr each, +300 for all three). They reset at local midnight. Rank rises with total credits: Ensign → Lieutenant (600) → Lt Cdr (1,800) → Commander (4,000) → Captain (8,000) → Commodore (15,000).',
      'A ration of 3 cat treats arrives every day.']],
    ['🤖 The crew', [
      'Six droids: Aster (navigation), Forge (engineering), Vesper (science), Echo (comms), Sentinel (tactical), Prism (sensors). They sit at their Bridge stations, then walk off to work at consoles around the ship and come back.',
      'Tap a droid within ~2 m to talk: status, destination, crew, their job, your last order, send them back to their station.',
      'They step aside when you walk up to them. You can’t walk through them.',
      'ORDERS (Ship Log, only on the Bridge): Battle stations · Red alert (klaxons + red lights on every deck) · Shore leave (they party in the Lounge and Media Nexus) · Stand down.']],
    ['🐈 The cats', [
      'Ember (playful), Nimbus (sleepy), Orbit (observant), Pixel (independent). At least two are always in the Crew Lounge; the others wander the ship.',
      'Tap a cat: Pet · Treat · Laser (look around to steer the red dot) · Feather wand · Catnip (from the Hiveport) · Trick (once trust ≥ 70 %).',
      'Trust (the hearts) grows with petting, treats and play.']],
    ['🔧 Repairs', [
      'Every 5–11 minutes Forge reports a fault somewhere aboard: a sparking conduit, coolant leak or failing power relay in a floor hatch. ⚠ marks it on the deck map.',
      'Walk to it, tap it, and trace the circuit: tap the numbered nodes in order before the bar runs out. +80 cr.']],
    ['🎮 Holodeck', [
      'SIM LIBRARY on the centre console: TARGET RANGE (tap the drifting orbs — gold 50, violet 10, red −20, combo ×2 after five), QUICK DRAW (wait for DRAW!, tap first; early = foul; best of five), HOLO GOLF (face the flag, hold to charge, release to putt; the console in the middle is solid).',
      'The HOUSE PLANNER terminal on the port wall opens the blueprint planner.']],
    ['📚 The Library', [
      'STAR MAP: tap the bronze lectern at the centre of the glass floor. The galaxy unfolds across the dome above you; drag to spin it, pinch or scroll to zoom. Each charted system shows its worlds\u2019 emoji, and a cyan ring marks where the Wayfarer is.',
      'Vesper\u2019s console (port side) opens your Sons of Naphtali website: the live site, or the Reader tab.',
      'The brain is Halcyon, the ship\u2019s mind. Tap it to talk.']],
    ['🃏 Crew Lounge', [
      'ALIEN TV: tap the big screen to flip channels: KNN news, Glorpo’s Kitchen, the space-whale nature hour, Cryovale weather, Bioship racing, a Mandible Mints ad, and the Talking Rock.',
      'STARJACK: tap the deck of cards on the brass coffee table. Blackjack against a droid dealer while two more droids play and quip. Starjack (21 in two cards) pays 3:2.']],
    ['🪑 The helm (Command Bridge)', [
      'The NAVIGATOR is the giant Milky Way hologram at the bow windows (a cyan pulse marks where you are). Tap it, or the captain’s chair, and you sit down first. When you navigate, the galaxy blooms and spins up.',
      'Seated menu: CRUISING (peaceful flight) · HUNTING (combat) · SHIP (inspect the Wayfarer in Ship View) · NAVIGATE (turn to the navigator and open the galactic map) · STAND.',
      'In the galactic map your ship sits at your current system. Planet emojis mark each world, and ✓ marks the ones you’ve visited. Confirm a destination and the ship jumps there.',
      'Keys while seated: N navigate · L cruise · K hunt · X / Esc stand.']],
    ['🚨 Red alert & light-speed escapes', [
      'Every 7–13 minutes the ship makes an evasive light-speed jump (pirates on sensors!). Twenty seconds before it, klaxons sound, every deck turns red, and any droid away from the Bridge sprints back to its chair.',
      'You can also call Red alert yourself from the Bridge (Ship Log → ORDERS).']],
    ['🧠 Halcyon, the ship’s mind', [
      'The living brain under the Library is HALCYON, the ship’s AI. Tap the brain, the eye icon in the top bar (any deck), or press I.',
      'Ask for a status report, where everyone is, what to do next, or the next light-speed jump. Or say "take me to the Lounge" and it walks you there. It also searches this manual. The brain flickers while it talks.',
      'It speaks aloud (🔊 to mute it). Ask it about the eels.']],
    ['🚀 Flight Mode (the captain’s chair)', [
      'Explore (peaceful — no enemies, but you can still fire the lasers for fun) or Combat. Steer with the stick / WASD. Zoom: pinch, mouse wheel, or Z / X. Leave with the round ✕ (top left) or Esc: the camera swoops back into the ship and you get up from the captain’s chair.',
      'NAV chip: ‹ › pick a destination, WARP to jump there. Fly near the Hiveport → DOCK AT HIVEPORT (F) plays the docking sequence (SKIP to cut it short).',
      'SCAN (G): fly close to a planet you haven’t scanned, or one of today’s three anomalies (glowing rings near random planets). Planets 80 cr once, anomalies 150 cr. Results: Ship Log → SCIENCE, or Vesper’s console in the Library.',
      'Combat: tap an enemy to lock on and fire homing shots. Drones, Strikers, Brutes; every third wave a BIOSHIP carrier boss.',
      'Upgrades from the Hiveport shipwright: engines (+12 % speed each), shields (+1 hull bar), cannons (fire faster), hull paint (also shows in Ship View).']],
    ['🛰️ The Hiveport', [
      'Resin Spire bar (tap the bartender) · Job board (contracts) · Airlock home (walk in).',
      'TRADE LOUNGE (west): Chitin & Thrust (ship upgrades + paint), Purr & Plenty (treats, catnip), Odds & Ends (curios for your future quarters).',
      'DANCE FLOOR in front of the hologram stage: step on it → DANCE, tap on the beat. Combos make the crowd cheer.',
      'THE COMB (gaming den, east): Hive Dice and the Honey Wheel. Bets 10 / 50 / 100.',
      'BRAWLS break out every few minutes — break them up (tap as the ring meets the circle) or join in. Soldiers and generals will fight if you ask.',
      'FISTFIGHTS: PUNCH when they’re OPEN, BLOCK when they SWING.',
      'BOUNTY BROKER by the airlock: one wanted K’Vetar a day, described by crest and eye colour. Find them in the crowd, talk, take them in. 200 cr.',
      'Talk to any K’Vetar. Their crest colour is their caste: blue civilian, yellow soldier, orange commander, red general, purple matron.']],
    ['🥚 Easter eggs & secrets', [
      'Hole-in-one in Holo Golf gets its own call-out.',
      'Roll a triple in Hive Dice for a 4× payout.',
      'Catnip makes a cat do zoomies.',
      'The Bounty Broker’s sign: "wanted dead or embarrassed".',
      'Some droids get a little sassy at the card table — try losing to Forge.',
      'The planets’ scan facts each hide one oddity (Selenite hums at 41 Hz at sunrise; Mycelion may be a single organism).',
      'Red alert from the Bridge lights the whole ship.']],
    ['🛠️ Coming next', [
            'More props everywhere, more varied bookshelves.',
      'BELOW DECK down the Library staircases: medbay, quarters, galley, cruiser hangar. Holodeck house builder. Busier space, new alien races, a packed Hiveport, and planet landings on foot.']]
  ];
  var css = document.createElement('style');
  css.textContent = '#wf-manual{position:fixed;inset:calc(40px + env(safe-area-inset-top,0px)) 0 0 0;margin:0 auto;z-index:66;display:none;width:min(94vw,560px);max-height:calc(100vh - 56px - env(safe-area-inset-top,0px));overflow:auto;padding:16px 16px 20px;border-radius:22px;box-sizing:border-box;height:max-content;' +
    'background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),rgba(26,16,8,.74);-webkit-backdrop-filter:blur(24px) saturate(185%);backdrop-filter:blur(24px) saturate(185%);border:1px solid rgba(255,200,140,.32);color:#fff;font:500 13.5px -apple-system,system-ui,sans-serif;line-height:1.45}' +
    '#wf-manual h2{margin:0 0 2px;font:800 13px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#ffc98a;text-align:center}#wf-manual .sub{text-align:center;color:#d9c4ae;font-size:12px;margin-bottom:10px}' +
    '#wf-manual details{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.05);margin:7px 0;padding:0 12px}#wf-manual summary{padding:11px 0;font:700 14px -apple-system,system-ui,sans-serif;cursor:pointer;list-style:none}' +
    '#wf-manual summary::-webkit-details-marker{display:none}#wf-manual ul{margin:0 0 10px 18px;padding:0}#wf-manual li{margin:5px 0;color:#f2e4d2}#wf-manual .x{position:sticky;top:0;float:right;background:none;border:none;color:#e8d4bf;font-size:20px;cursor:pointer}';
  document.head.appendChild(css);
  var box = null;
  function open() {
    if (!box) { box = document.createElement('div'); box.id = 'wf-manual'; document.body.appendChild(box); ['pointerdown', 'touchstart', 'mousedown', 'click', 'wheel'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
      var h = '<button class="x">✕</button><h2>CAPTAIN’S MANUAL</h2><div class="sub">How to play the SS Wayfarer · tap a section</div>';
      S.forEach(function (sec, i) { h += '<details' + (i === 0 ? ' open' : '') + '><summary>' + sec[0] + '</summary><ul>' + sec[1].map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></details>'; });
      box.innerHTML = h; box.querySelector('.x').onclick = close; }
    box.style.display = 'block'; document.body.classList.add('reading'); if (window.WF_LIFE) WF_LIFE.event('manual');
  }
  function close() { if (box) box.style.display = 'none'; document.body.classList.remove('reading'); }
  addEventListener('keydown', function (e) { if (e.code === 'KeyH' && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) { if (box && box.style.display === 'block') close(); else open(); } if (e.code === 'Escape') close(); });
  window.WF_MANUAL = { open: open, close: close, sections: S };
}());
