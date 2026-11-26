# SS Wayfarer — Crew Social Intelligence V3 (foundation)
This is an additive prototype, not a complete social animation pack. Keep both V2 packages. It uses the existing CrewEngine pair API and does not introduce a second movement loop.

## Integration
Copy social-controller.mjs into crew/. Import attachSocial from './crew/social-controller.mjs' in crew.js (adjust relative path to the module). After constructing the engine, call:
```js
let saved={}; try { saved=JSON.parse(localStorage.getItem('wf-social-v3')||'{}'); } catch {}
const social=attachSocial(engine,{saved,hooks:{end(){try{localStorage.setItem('wf-social-v3',JSON.stringify(social.snapshot()));}catch{}}}});
```
Use the actual engine variable in crew.js. Check both V2 installers first for API changes. Existing pair() increments cat trust at initiation, so canceled encounters may still increase existing trust; V3 relationship affinity only increases after completion. Existing legacy social() can still handle encounters outside V3 eligibility; integration should route all droid-cat pairing through one owner while retaining droid-droid conversations. Do not blindly patch the live branch.

## Acceptance criteria for next implementation
- Paired animation contact: use droid hand and cat head anchors; align at reachable distance, use IK and blend in/out. No teleporting or hand penetration. Validate standing and seated variants.
- Feeding: reserve bowl, approach, refill, release; cat hunger decreases only after eating.
- Play: reserve safe floor area, alternate chase/pounce/rest, avoid player and furniture.
- Follow: use existing route planner with distance hysteresis, never chase across locked doors.
- Sleep beside droid: reserve a safe rest spot; wake before droid departure.
- Emergency: cancel social action, release reservations, route cats to verified safe spots; preserve droid emergency duties.
- Audio: trigger existing sound API at animation markers, with cooldowns.
- Test in live iOS Safari with all four cats and six droids, room transitions, reloads and alerts.

## Verification
Run `node --test test.mjs`. Six isolated mock-engine tests pass. No live browser, actual paired animation alignment, V2 compatibility or GitHub write tested. No new GLBs are included. Following, feeding, play, sleeping together, emergency escort and IK remain specifications, not implemented features.
