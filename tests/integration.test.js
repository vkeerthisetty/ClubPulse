import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {RSABSSA} from '@cloudflare/blindrsa-ts';
const base='http://localhost:3011',enc=b=>Buffer.from(b).toString('base64');
test('separate issuance, credential-free collection and sealed privacy reports',async t=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'3011',ISSUER_PORT:'3012',PUBLIC_ORIGIN:base,DEMO_MODE:'true',NODE_ENV:'test',TEST_RELEASE_DELAY_MS:'1000'},stdio:['ignore','pipe','pipe']});
 let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);t.after(()=>server.kill());
 for(let i=0;i<120;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===119)throw new Error(output);}
 let cookie='';async function call(path,body,auth=false,method=body?'POST':'GET',endpoint=base){const r=await fetch(endpoint+path,{method,headers:{'Content-Type':'application/json',...(auth?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text);}catch{}return{r,data,text};}
 assert.equal((await call('/api/statistics')).r.status,401);
 assert.equal((await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.invalid'},body:'{}'})).status,403);
 assert.equal((await call('/api/diagnostics')).r.status,401);
 const login=await call('/api/login',{email:'  ADMIN@CLUBPULSE.LOCAL  ',password:'local-preview-only'});assert.equal(login.r.status,200);assert.equal(login.data.role,'admin');cookie=login.r.headers.get('set-cookie').split(';')[0];assert.ok(login.r.headers.get('set-cookie').includes('Path=/api'));
 const config=(await call('/api/config')).data;assert.equal(config.issuerOrigin,'http://localhost:3012');
 // A slow or interrupted response can be retried without creating another event.
 const requestId=crypto.randomUUID(),creation={name:'Retry-safe event',description:'Creation retry test',date:'2026-10-28',requestId};
 const [createdA,createdB]=await Promise.all([call('/api/events',creation,true),call('/api/events',creation,true)]);
 assert.equal(createdA.r.status,201);assert.equal(createdB.r.status,201);assert.equal(createdA.data.id,requestId);assert.equal(createdB.data.id,requestId);
 assert.equal((await call('/api/events',creation,true)).data.id,requestId);
 assert.equal((await call('/api/events',{...creation,name:'Different event'},true)).r.status,409);
 assert.equal((await call('/api/events',{name:'Invalid date',date:'2026-02-30'},true)).r.status,400);
 assert.equal((await call('/api/events')).data.filter(e=>e.id===requestId).length,1);
 const diagnostics=await call('/api/diagnostics',null,true);assert.equal(diagnostics.r.status,200);assert.equal(diagnostics.data.database,true);assert.equal(diagnostics.data.issuance,true);assert.equal(diagnostics.data.separateOrigin,true);
 assert.equal((await call('/api/showcase?rating=5')).r.status,400);
 const showcase=await call('/api/showcase');assert.equal(showcase.r.status,200);assert.equal(showcase.data.readOnly,true);assert.equal(showcase.data.count,null);assert.ok(showcase.data.events.every(e=>e.demo&&e.report));
 const preflight=await fetch(config.issuerOrigin+'/api/events/example/issue',{method:'OPTIONS',headers:{Origin:base,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),base);assert.equal(preflight.headers.get('access-control-allow-credentials'),null);
 assert.equal((await fetch(config.issuerOrigin+'/api/events/example/issue',{method:'OPTIONS',headers:{Origin:'https://untrusted.invalid'}})).status,403);
 assert.equal((await call('/api/statistics',null,true)).data.count,null);
 const e=await call('/api/events',{name:'Private workshop',date:'2026-10-24',description:'Integration test'},true);assert.equal(e.r.status,201);const id=e.data.id;
 assert.equal((await call('/api/events/'+id+'/details',{name:'Revised workshop',date:'2026-10-25',description:'Revised'},false,'PATCH')).r.status,401);
 assert.equal((await call('/api/events/'+id+'/details',{name:'Revised workshop',date:'2026-02-30'},true,'PATCH')).r.status,400);
 assert.equal((await call('/api/events/'+id+'/details',{name:'Private workshop',date:'2026-10-25',description:'Revised'},true,'PATCH')).r.status,200);
 assert.equal((await call('/api/events')).data.find(e=>e.id===id).description,'Revised');
 assert.equal((await call('/api/events/'+id+'/revoke',{codes:['invalid']},false)).r.status,401);
 // Every administrative capability rejects missing credentials and a fabricated participant cookie.
 const protectedRoutes=[['/api/statistics',null,'GET'],['/api/export',null,'GET'],['/api/session',null,'GET'],['/api/events',{name:'Denied',date:'2026-10-24'},'POST'],['/api/events/'+id,{open:false},'PATCH'],['/api/events/'+id+'/invites',{count:1},'POST']];
 for(const [path,body,method] of protectedRoutes){
  assert.equal((await call(path,body,false,method)).r.status,401,path);
  const forged=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:'cp_session=participant',Authorization:'Bearer HACKATHON-DEMO-2026'},...(body?{body:JSON.stringify(body)}:{})});assert.equal(forged.status,401,path);
 }
 assert.equal((await call('/api/login',{email:'participant',password:'HACKATHON-DEMO-2026',role:'admin'})).r.status,401);
 const publicEvents=(await call('/api/events')).data;assert.ok(publicEvents.every(e=>!('report' in e)&&!('count' in e)&&!('publicJwk' in e)));
 const invites=(await call('/api/events/'+id+'/invites',{count:5},true)).data.codes;
 const jwk=(await call('/api/events/'+id+'/key')).data;assert.ok(!jwk.d);const suite=RSABSSA.SHA384.PSS.Randomized(),key=await crypto.subtle.importKey('jwk',jwk,{name:'RSA-PSS',hash:'SHA-384'},true,['verify']);
 let first;
 const withdrawn=(await call('/api/events/'+id+'/invites',{count:1},true)).data.codes[0];
 assert.equal((await call('/api/events/'+id+'/revoke',{codes:[withdrawn]},true)).r.status,200);
 const withdrawnMessage=suite.prepare(crypto.getRandomValues(new Uint8Array(32))),withdrawnBlind=await suite.blind(key,withdrawnMessage);
 assert.equal((await call('/api/events/'+id+'/issue',{code:withdrawn,blinded:enc(withdrawnBlind.blindedMsg)},false,'POST',config.issuerOrigin)).r.status,409);
 for(let i=0;i<5;i++){
  const message=suite.prepare(crypto.getRandomValues(new Uint8Array(32))),blind=await suite.blind(key,message);
  assert.equal((await call('/api/events/'+id+'/issue',{code:invites[i],blinded:enc(blind.blindedMsg)})).r.status,404);
  if(i===0)assert.equal((await call('/api/events/'+id+'/issue',{code:invites[i],blinded:enc(blind.blindedMsg)},true,'POST',config.issuerOrigin)).r.status,400);
  const issue=await call('/api/events/'+id+'/issue',{code:invites[i],blinded:enc(blind.blindedMsg)},false,'POST',config.issuerOrigin);assert.equal(issue.r.status,200,issue.text);
  if(i===0){const alternate=await suite.blind(key,message);assert.equal((await call('/api/events/'+id+'/issue',{code:invites[i],blinded:enc(alternate.blindedMsg)},false,'POST',config.issuerOrigin)).r.status,409);}
  if(i===0){assert.equal((await call('/api/events/'+id+'/revoke',{codes:[invites[i]]},true)).r.status,200);assert.equal((await call('/api/events/'+id+'/issue',{code:invites[i],blinded:enc(blind.blindedMsg)},false,'POST',config.issuerOrigin)).r.status,200);}
  if(i===0){const denied=await fetch(base+'/api/statistics',{headers:{Authorization:'Bearer '+issue.data.signature}});assert.equal(denied.status,401);}
  const sig=await suite.finalize(key,message,Buffer.from(issue.data.signature,'base64'),blind.inv);
  const payload={eventId:id,rating:[5,4,4,3,5][i],category:i%2?'Delivery':'Content',comment:'Released comment '+i,message:enc(message),signature:enc(sig)};
  if(i===0){first=payload;assert.equal((await call('/api/feedback',payload,true)).r.status,400);assert.equal((await call('/api/feedback',{...payload,code:invites[i]})).r.status,400);assert.equal((await call('/api/feedback',{...payload,signature:enc(new Uint8Array(256))})).r.status,403);for(const field of ['email','userId','timestamp','ipAddress'])assert.equal((await call('/api/feedback',{...payload,[field]:'forbidden metadata'})).r.status,400);assert.equal((await fetch(base+'/api/feedback',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer participant'},body:JSON.stringify(payload)})).status,400);}
  assert.equal((await call('/api/feedback',payload)).r.status,201);
  const protectedStats=(await call('/api/statistics?event='+id,null,true)).data;assert.equal(protectedStats.count,null);assert.equal(protectedStats.feedback.length,0);assert.equal(protectedStats.events.find(e=>e.id===id).count,null);
 }
 assert.equal((await call('/api/feedback',first)).r.status,409);assert.equal((await call('/api/feedback',{...first,message:first.message+'\n'})).r.status,409);
 assert.equal((await call('/api/statistics?rating=5',null,true)).r.status,400);assert.equal((await call('/api/export',null,true)).r.status,403);
 assert.equal((await call('/api/events/'+id,{open:false},true,'PATCH')).r.status,200);
 assert.equal((await call('/api/statistics',null,true)).data.count,null);
 await new Promise(r=>setTimeout(r,1100));
 const released=(await call('/api/statistics',null,true)).data;assert.equal(released.count,5);assert.equal(released.average,4.2);assert.equal(released.positive,null);assert.ok(released.distribution.every(c=>c.count===null));assert.equal(released.events.find(e=>e.id===id).reportState,'released');
 const scoped=(await call('/api/statistics?event='+id,null,true)).data;assert.equal(scoped.scope,id);assert.equal(scoped.count,5);
 assert.deepEqual(Object.keys(released.feedback[0]).sort(),['comment','demo','eventId']);
 const privateShowcase=await call('/api/showcase?event='+id);assert.equal(privateShowcase.data.count,null);assert.equal(privateShowcase.data.feedback.length,0);
 assert.equal(privateShowcase.data.scope,id);
 const repeat=(await call('/api/statistics',null,true)).data;assert.deepEqual(released.feedback,repeat.feedback);
 assert.equal((await call('/api/events/'+id,{open:true},true,'PATCH')).r.status,409);
 assert.equal((await call('/api/events/'+id+'/details',{name:'Changed sealed report',date:'2026-10-25'},true,'PATCH')).r.status,409);
 const csv=await call('/api/export',null,true);assert.equal(csv.r.status,200);assert.ok(csv.text.includes('Private workshop'));assert.ok(!csv.text.includes('Released comment'));assert.ok(!csv.text.includes('message'));
 assert.equal((await call('/api/export?search=comment',null,true)).r.status,400);
 assert.equal((await call('/api/logout',{},true)).r.status,200);assert.equal((await call('/api/statistics',null,true)).r.status,401);
});
