import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {rateLimit} from 'express-rate-limit';
import {sealReport,combineReports,MINIMUM,TOPICS} from './privacy.js';

const examples=[
 [5,'Content','Example response: mentor check-ins made it easier to keep building.'],
 [4,'Organisation','Example response: publish meal times and judging milestones together.'],
 [4,'Content','Example response: the problem statements left room for original ideas.'],
 [3,'Delivery','Example response: slow down the opening briefing and share the criteria first.'],
 [5,'Organisation','Example response: helpful volunteers and a clear final showcase.']
];
export function installEvaluator(app,{issuer,suite,safe,limiterKey}){
 const sessions=new Map(),events=new Map(),TTL=30*60*1000;
 const clean=()=>{for(const [token,s] of sessions)if(s.expiresAt<=Date.now()){for(const e of s.events)events.delete(e._id);sessions.delete(token);}};
 const auth=(req,res,next)=>{clean();const s=sessions.get(req.headers['x-evaluator-session']);if(!s||s.pending)return res.status(410).json({error:'Your temporary practice session expired. Start a fresh session.'});req.practice=s;next();};
 const publicEvent=e=>({id:e._id,name:e.name,description:e.description,date:e.date,open:e.open,demo:true,examplesAdded:!!e.examplesAdded,reportState:e.report?'released':'collecting',reportLocked:!!e.report,report:e.report?{count:e.report.count,average:e.report.average,positive:e.report.positive,demo:true,version:1}:null});
 const data=(s,scope='')=>({...combineReports(s.events.filter(e=>!scope||e._id===scope)),scope,events:s.events.map(publicEvent),readOnly:true,demo:true,practice:true,expiresAt:s.expiresAt,privacy:{minimum:5,immutable:true,smallCellsSuppressed:true}});
 async function provision(s,name,date,description){
  const id=randomUUID(),key=await issuer('/sandbox/events',{id});
  try{const {codes}=await issuer('/sandbox/events/'+id+'/invites',{count:1});const e={_id:id,name,description,date,open:true,publicJwk:key.publicJwk,rows:[],used:new Set(),examplesAdded:false};s.events.push(e);events.set(id,e);return {event:publicEvent(e),code:codes[0]};}catch(err){await issuer('/sandbox/events/'+id+'/discard',{}).catch(()=>{});throw err;}
 }
 app.post('/api/evaluator/session',rateLimit({windowMs:10*60*1000,limit:8,keyGenerator:limiterKey,validate:{keyGeneratorIpFallback:false},handler:(_req,res)=>res.status(429).json({error:'Too many practice starts. Continue an existing session or retry in ten minutes.'})}),safe(async(req,res)=>{
  clean();if(sessions.size>=16)return res.status(503).json({error:'Practice capacity is full. Please try again later.'});
  const name=req.body?.name||'24-Hour Hackathon';if(typeof name!=='string'||name.length>100)return res.status(400).json({error:'Choose an event name under 100 characters.'});
  const token=randomBytes(32).toString('hex'),s={pending:true,events:[],expiresAt:Date.now()+TTL};sessions.set(token,s);
  try{
   const today=new Date().toISOString().slice(0,10),baseline={_id:randomUUID(),name:'Example: completed workshop',description:'Five labelled example responses, provided to explore a completed report.',date:today,open:false};
   baseline.report=sealReport(examples.map(([rating,category,comment])=>({rating,category,comment,demo:true})),{demo:true});s.events.push(baseline);
   const created=await provision(s,name.trim().slice(0,85)+' / practice',today,'Temporary evaluator event. Not real club attendance or feedback.');s.pending=false;
   res.status(201).json({token,...created,data:data(s,created.event.id)});
  }catch(err){sessions.delete(token);throw err;}
 }));
 app.get('/api/evaluator/session',auth,(req,res)=>{const scope=typeof req.query.event==='string'?req.query.event:'';if(scope&&!req.practice.events.some(e=>e._id===scope))return res.status(404).json({error:'Practice event not found.'});res.json(data(req.practice,scope));});
 app.post('/api/evaluator/events',auth,safe(async(req,res)=>{
  const s=req.practice,{name,date,description=''}=req.body;
  if(s.events.length>=3)return res.status(400).json({error:'Practice allows two collection events per session. Start fresh to try again.'});
  if(typeof name!=='string'||!name.trim()||name.length>100||typeof description!=='string'||description.length>500||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return res.status(400).json({error:'Enter a valid name, calendar date and description.'});
  // Reserve the event slot before asynchronous provisioning.
  if(s.creating)return res.status(409).json({error:'A practice event is already being created.'});s.creating=true;
  try{res.status(201).json(await provision(s,name.trim(),date,description.trim()));}finally{s.creating=false;}
 }));
 app.post('/api/evaluator/events/:id/invites',auth,safe(async(req,res)=>{const e=req.practice.events.find(e=>e._id===req.params.id);if(!e?.open)return res.status(409).json({error:'Choose an open practice event.'});res.json(await issuer('/sandbox/events/'+e._id+'/invites',{count:req.body.count||1}));}));
 app.get('/api/evaluator/events/:id/key',(req,res)=>{clean();const e=events.get(req.params.id);if(!e?.open)return res.status(410).json({error:'Practice event expired or closed. Start fresh.'});res.json(e.publicJwk);});
 app.post('/api/evaluator/feedback',safe(async(req,res)=>{
  clean();if(req.headers.cookie||req.headers.authorization||req.headers['x-evaluator-session'])return res.status(400).json({error:'Practice feedback must omit administrator and session credentials.'});
  const allowed=new Set(['eventId','rating','category','comment','message','signature']),{eventId,rating,category,comment='',message,signature}=req.body;
  if(Object.keys(req.body).some(k=>!allowed.has(k))||typeof eventId!=='string'||!Number.isInteger(rating)||rating<1||rating>5||!TOPICS.includes(category)||typeof comment!=='string'||comment.length>2000||typeof message!=='string'||typeof signature!=='string')return res.status(400).json({error:'Invalid practice feedback.'});
  const e=events.get(eventId);if(!e?.open)return res.status(410).json({error:'Practice event expired or closed.'});
  const bytes=Uint8Array.from(Buffer.from(message,'base64')),sig=Uint8Array.from(Buffer.from(signature,'base64'));if(bytes.length!==64||sig.length!==256)return res.status(400).json({error:'Invalid token size.'});
  const key=await crypto.subtle.importKey('jwk',e.publicJwk,{name:'RSA-PSS',hash:'SHA-384'},true,['verify']);if(!await suite.verify(key,sig,bytes))return res.status(403).json({error:'Invalid practice token.'});
  const hash=createHash('sha256').update(Buffer.from(bytes)).digest('hex');
  if(!e.open)return res.status(409).json({error:'Practice event is closed.'});if(e.used.has(hash))return res.status(409).json({error:'Practice token already used.'});if(e.rows.length>=20)return res.status(429).json({error:'Practice response limit reached.'});
  e.used.add(hash);e.rows.push({rating,category,comment:comment.trim(),demo:true});res.status(201).json({ok:true});
 }));
 app.post('/api/evaluator/events/:id/examples',auth,(req,res)=>{
  const e=req.practice.events.find(e=>e._id===req.params.id);if(!e?.open||e.examplesAdded)return res.status(409).json({error:'Examples already added or practice event closed.'});
  for(const [rating,category,comment] of examples.slice(0,4))e.rows.push({rating,category,comment,demo:true});e.examplesAdded=true;res.json({ok:true,examplesAdded:4});
 });
 app.post('/api/evaluator/events/:id/seal',auth,safe(async(req,res)=>{
  const e=req.practice.events.find(e=>e._id===req.params.id);if(!e?.open)return res.status(409).json({error:'Practice report is already sealed.'});
  if(e.rows.length<MINIMUM)return res.status(409).json({error:'Submit your participant response and add the four labelled examples first. A report still needs five responses.'});
  await issuer('/sandbox/events/'+e._id+'/state',{});e.open=false;e.report=sealReport(e.rows,{demo:true});e.rows=[];res.json({ok:true,practiceCooldownSkipped:true});
 }));
 app.delete('/api/evaluator/session',auth,safe(async(req,res)=>{const s=req.practice;for(const e of s.events){events.delete(e._id);if(e.publicJwk)await issuer('/sandbox/events/'+e._id+'/discard',{}).catch(()=>{});}sessions.delete(req.headers['x-evaluator-session']);res.json({ok:true});}));
}
