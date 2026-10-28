import test from 'node:test';
import assert from 'node:assert/strict';
import {createIssuerClient} from '../server/issuerClient.js';

test('issuer wakes through safe health reads before one invitation write',async()=>{
 const calls=[];let health=0;
 const issuer=createIssuerClient('https://issuer.invalid','test-secret',{pause:async()=>{},fetchImpl:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/health'))return ++health===1?new Response('<html>Starting</html>',{status:503}):Response.json({ok:true,role:'issuer'});
  return Response.json({codes:['one-code']});
 }});
 assert.deepEqual(await issuer('/events/id/invites',{count:1}),{codes:['one-code']});
 assert.equal(calls.filter(c=>c.options.method==='POST').length,1);
 assert.equal(calls.filter(c=>c.url.endsWith('/health')).length,2);
 assert.ok(calls.filter(c=>c.url.endsWith('/health')).every(c=>!c.options.headers));
 await issuer('/events/id/invites',{count:1});assert.equal(health,2);
});

test('issuer preserves expired practice status and does not replay interrupted writes',async()=>{
 let writes=0;
 const issuer=createIssuerClient('https://issuer.invalid','test-secret',{fetchImpl:async(url)=>{
  if(url.endsWith('/health'))return Response.json({ok:true,role:'issuer'});
  writes++;return Response.json({error:'Practice issuer expired. Start fresh.'},{status:410});
 }});
 await assert.rejects(issuer('/sandbox/events/id/invites',{}),e=>e.status===410);assert.equal(writes,1);
 const interrupted=createIssuerClient('https://issuer.invalid','secret',{fetchImpl:async(url)=>{
  if(url.endsWith('/health'))return Response.json({ok:true,role:'issuer'});
  throw new TypeError('network interrupted');
 }});
 await assert.rejects(interrupted('/events/id/invites',{}),e=>e.status===503&&e.message.includes('not repeated'));
});

test('an unavailable issuer prevents writes instead of sending them into startup',async()=>{
 const methods=[];
 const issuer=createIssuerClient('https://issuer.invalid','secret',{wakeMs:1,pause:async()=>{},fetchImpl:async(_url,options)=>{methods.push(options.method||'GET');return new Response('Starting',{status:503});}});
 await assert.rejects(issuer('/events/id/invites',{}),e=>e.status===503);
 assert.ok(methods.length>0);assert.ok(methods.every(m=>m==='GET'));
});
