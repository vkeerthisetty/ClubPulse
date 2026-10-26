import test from 'node:test';
import assert from 'node:assert/strict';
import {parseActionImport} from '../src/actionImport.js';
const action={title:'Improve briefing',owner:'Organiser',due:'2026-10-30',status:'Planned'};
test('action import validates scope and preserves only supported fields',()=>{
 assert.deepEqual(parseActionImport(JSON.stringify({scope:'all',actions:[{...action,id:'old',extra:'ignored'}]}),'all'),[action]);
 assert.equal(parseActionImport(JSON.stringify({scope:'all',actions:[action,action]}),'all').length,1);
 assert.throws(()=>parseActionImport(JSON.stringify({scope:'different',actions:[action]}),'all'));
 assert.throws(()=>parseActionImport(JSON.stringify({scope:'all',actions:[action,{...action,status:'unknown'}]}),'all'));
 assert.throws(()=>parseActionImport(JSON.stringify({scope:'all',actions:Array(201).fill(action)}),'all'));
 assert.throws(()=>parseActionImport('not json','all'));
});
