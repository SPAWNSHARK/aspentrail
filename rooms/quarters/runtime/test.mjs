import assert from 'node:assert/strict';
import {createState,createOrbitGame,channels,interactions,colliderBoxes,modes} from './captains-quarters.mjs';
let memory={};let storage={getItem:k=>memory[k],setItem:(k,v)=>memory[k]=v};
let a=createState(storage);assert.equal(a.state.channel,0);a.state.logs.push({text:'test'});a.save();assert.equal(createState(storage).state.logs[0].text,'test');
let b=createState({getItem:()=>'{broken'});assert.equal(b.state.lighting,'amber');
let c=createOrbitGame(()=>.8);assert.equal(c.next(),3);assert.equal(c.choose(3),true);assert.equal(c.choose(0),false);assert.equal(c.points,1);assert.equal(c.round,1);
assert.equal(channels.length,6);assert.equal(Object.keys(modes).length,4);assert.ok(interactions.arcade&&interactions.holo);assert.ok(colliderBoxes.every(b=>b.size.every(v=>v>0)));console.log('State persistence, corrupt storage recovery, game scoring, channel catalog, lighting and collider data passed.');
