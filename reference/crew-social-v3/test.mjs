import {test} from 'node:test';import assert from 'node:assert/strict';import {SocialController,attachSocial} from './social-controller.mjs';
function fixture(){const d={id:'d',kind:'droid',state:'SEATED',node:'a',pos:{x:0,z:0}},c={id:'c',kind:'cat',state:'IDLE',node:'a',pos:{x:.6,z:0}};const e={time:0,ship:{},layout:{nodes:{a:{room:'lounge'},b:{room:'bridge'}}},npcs:new Map([['d',d],['c',c]]),random:()=>0,pair(a,b){a.socialReturn='SEATED';a.partner=b.id;b.partner=a.id;a.state=b.state='SOCIAL';return true},set(n,state){n.state=state},update(){},social(){return true}};return {d,c,e,s:new SocialController(e)}}
test('paired reservation and duplicate rejection',()=>{const {d,c,s}=fixture();assert(s.start(d,c));assert(!s.start(d,c));assert.equal(s.active.size,2)});
test('different room rejected',()=>{const {d,c,s}=fixture();c.node='b';assert(!s.start(d,c))});
test('emergency cancels and restores seated droid',()=>{const {d,c,e,s}=fixture();s.start(d,c);e.ship.alert=true;s.tick();assert.equal(d.state,'SEATED');assert.equal(c.partner,null);assert.equal(s.bond(d,c).encounters,0)});
test('completed encounter persists bond',()=>{const {d,c,e,s}=fixture();s.start(d,c);e.time=3.2;s.tick();assert.equal(s.bond(d,c).encounters,1);assert.equal(new SocialController(e,{saved:s.snapshot()}).bond(d,c).encounters,1)});
test('attach idempotent',()=>{const {e}=fixture();assert.equal(attachSocial(e),attachSocial(e))});
test('distance rejects unsafe approach',()=>{const {d,c,s}=fixture();c.pos.x=3;assert(!s.start(d,c))});
