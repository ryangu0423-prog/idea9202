import test from 'node:test';
import assert from 'node:assert/strict';
import {HorseStateMachine} from '../state-machine.js';
function hold(m,level,start,duration){for(let t=start;t<=start+duration;t+=100)m.update(level,t);}
test('six sustained sound ranges select all original state loops',()=>{const m=new HorseStateMachine();for(let i=0;i<6;i++){hold(m,[0,26,42,58,74,98][i],i*2000,1500);assert.equal(m.state,i);assert.equal(m.clip,i+1);assert.equal(m.recovering,false);}});
test('short loud spikes and boundary noise do not switch the horse',()=>{const m=new HorseStateMachine();hold(m,98,0,800);hold(m,0,900,400);assert.equal(m.clip,1);hold(m,26,1400,1500);assert.equal(m.clip,2);for(let i=0;i<30;i++)m.update(i%2?16:20,3000+i*100);assert.equal(m.clip,2);});
test('quiet after agitation plays recovery 7 then 8 exactly once then calm loop',()=>{const m=new HorseStateMachine();hold(m,98,0,1500);hold(m,0,1600,2000);assert.equal(m.clip,7);assert.equal(m.recovering,true);m.ended();assert.equal(m.clip,8);m.ended();assert.equal(m.clip,1);assert.equal(m.state,0);m.ended();assert.equal(m.clip,1);});
test('agitation recovering to alert stops on alert when sound remains moderate',()=>{const m=new HorseStateMachine();hold(m,98,0,1500);hold(m,42,1600,2000);assert.equal(m.clip,7);m.ended();assert.equal(m.clip,3);assert.equal(m.state,2);assert.equal(m.recovering,false);});
test('alert recovers to calm through clip 8',()=>{const m=new HorseStateMachine();hold(m,42,0,1500);hold(m,0,1600,2000);assert.equal(m.clip,8);m.ended();assert.equal(m.clip,1);});
test('sustained renewed noise interrupts recovery but a spike does not',()=>{const m=new HorseStateMachine();hold(m,98,0,1500);hold(m,0,1600,2000);assert.equal(m.clip,7);hold(m,98,3700,700);assert.equal(m.clip,7);hold(m,98,4500,500);assert.equal(m.clip,6);assert.equal(m.recovering,false);});
