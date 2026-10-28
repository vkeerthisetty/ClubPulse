import test from 'node:test';
import assert from 'node:assert/strict';
import {requestJson} from '../src/http.js';

test('hosting recovery retries reads but never repeats writes or authentication failures',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 let calls=0;
 globalThis.fetch=async()=>++calls===1?new Response('<html>Starting</html>',{status:503}):Response.json({ok:true});
 assert.deepEqual(await requestJson('/api/config'),{ok:true});assert.equal(calls,2);
 calls=0;globalThis.fetch=async()=>{calls++;return new Response('<html>Starting</html>',{status:503});};
 await assert.rejects(requestJson('/api/login',{method:'POST'}),e=>e.status===503&&e.message.includes('starting'));assert.equal(calls,1);
 calls=0;globalThis.fetch=async()=>{calls++;return Response.json({error:'Email or password is incorrect.'},{status:401});};
 await assert.rejects(requestJson('/api/login',{method:'POST'}),e=>e.status===401&&e.message.includes('incorrect'));assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('Too many requests',{status:429,headers:{'retry-after':'60'}});
 await assert.rejects(requestJson('/api/login',{method:'POST'}),e=>e.status===429&&e.message.includes('1 minute'));
 globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(requestJson('/api/feedback',{method:'POST',credentials:'omit'}),e=>e.status===0&&e.message.includes('form has been kept'));
 let sent;globalThis.fetch=async(_url,options)=>{sent=options;return Response.json({ok:true});};
 await requestJson('/api/feedback',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',body:'{}'});
 assert.equal(sent.credentials,'omit');assert.equal(sent.referrerPolicy,'no-referrer');assert.equal(sent.body,'{}');
});
