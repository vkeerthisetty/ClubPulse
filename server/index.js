import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {randomBytes,randomUUID,createHash,createHmac,timingSafeEqual,scryptSync} from 'node:crypto';
import {RSABSSA} from '@cloudflare/blindrsa-ts';
import {connect,store} from './store.js';
import {startIssuer} from './issuer.js';
import {MINIMUM,RELEASE_DELAY_MS,sealReport,combineReports,validateReportQuery,reportCsv} from './privacy.js';
const production=process.env.NODE_ENV==='production';
const demo=process.env.DEMO_MODE==='true'||(!process.env.MONGODB_URI&&!production);
if(production&&demo)throw new Error('Demo mode forbidden in production.');
const email=process.env.ADMIN_EMAIL||(demo?'admin@clubpulse.local':'');
const password=process.env.ADMIN_PASSWORD||(demo?'local-preview-only':'');
const secret=process.env.SESSION_SECRET||(demo?randomBytes(32).toString('hex'):'');
if(!email||password.length<12||secret.length<32)throw new Error('Configure strong admin credentials and SESSION_SECRET.');
const port=Number(process.env.PORT||3000),origin=process.env.PUBLIC_ORIGIN||`http://localhost:${port}`;
const issuerSecret=process.env.ISSUER_ADMIN_SECRET||(demo?randomBytes(32).toString('hex'):'');
const issuerPort=Number(process.env.ISSUER_PORT||port+1);
const issuerOrigin=process.env.ISSUER_URL||`http://localhost:${issuerPort}`;
if(production&&(!origin.startsWith('https://')||!issuerOrigin.startsWith('https://')||new URL(origin).origin===new URL(issuerOrigin).origin||issuerSecret.length<32||issuerSecret.startsWith('replace-')||password.startsWith('replace-')||secret.startsWith('replace-')))throw new Error('Production requires separate HTTPS collector/issuer origins and real secrets.');
if(!process.env.ISSUER_URL){
  if(!demo)throw new Error('Configure ISSUER_URL for the separately deployed issuance service.');
  await startIssuer({demo:true,secret:issuerSecret,port:issuerPort,origin});
}
async function issuer(path,body){const r=await fetch(issuerOrigin+'/internal'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+issuerSecret},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error||'Issuer unavailable.'),{status:503});return data;}
await connect(demo);
const db=store(demo),suite=RSABSSA.SHA384.PSS.Randomized();
// Accelerated clock only for isolated automated tests, never a deployment setting.
const releaseDelay=process.env.NODE_ENV==='test'?Number(process.env.TEST_RELEASE_DELAY_MS||RELEASE_DELAY_MS):RELEASE_DELAY_MS;
if(demo&&process.env.NODE_ENV!=='test'){
  const id=randomUUID(),key=await issuer('/events',{id});
  const samples=[[5,'Content','The mentor check-ins helped us turn a rough idea into a working prototype. Keep those.'],[4,'Organisation','A great format. A clearer schedule for meals and judging would make the night easier.'],[4,'Content','The problem statements left room for original ideas without being too broad.'],[3,'Delivery','The opening briefing moved too quickly. Share the judging criteria before coding starts.'],[5,'Organisation','Plenty of time to build, helpful volunteers, and a strong final showcase.']].map(([rating,category,comment])=>({eventId:id,rating,category,comment,demo:true,tokenHash:'demo:'+randomUUID()}));
  await db.addEvent({_id:id,name:'24-Hour Hackathon',description:'Build something worth staying up for. 24 hours of ideas, code and late-night problem solving.',date:new Date().toISOString().slice(0,10),open:true,demo:true,publicJwk:key.publicJwk,report:sealReport(samples,{demo:true})});
  await issuer('/events/'+id+'/invites',{count:1,demoCode:true});
  // Only the frozen synthetic report is seeded. New submissions cannot alter it.
}
const app=express(),sessions=new Map(),abuseSecret=randomBytes(32);
app.disable('x-powered-by');if(production)app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:production?{directives:{connectSrc:["'self'",new URL(issuerOrigin).origin]}}:false,referrerPolicy:{policy:'no-referrer'}}));
app.use(express.json({limit:'12kb'}));
app.use('/api',rateLimit({windowMs:60000,limit:120,keyGenerator:req=>createHmac('sha256',abuseSecret).update(ipKeyGenerator(req.ip||'127.0.0.1')).digest('hex'),validate:{keyGeneratorIpFallback:false}}));
app.use('/api',(req,res,next)=>{res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==origin)return res.status(403).json({error:'Origin not allowed.'});next();});
const hash=x=>createHash('sha256').update(x).digest('hex');
const safe=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
function auth(req,res,next){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cp_session='))?.slice(11);const session=token&&sessions.get(token);if(!session||session.expiresAt<Date.now()){if(token)sessions.delete(token);return res.status(401).json({error:'Administrator sign-in required.'});}if(session.role!=='admin')return res.status(403).json({error:'Administrator access only.'});req.sessionToken=token;next();}
const publicEvent=e=>({id:e._id,name:e.name,description:e.description,date:e.date,open:e.open,demo:!!e.demo});
app.get('/api/config',(req,res)=>res.json({demo,privacyMinimum:MINIMUM,releaseDelayMinutes:15,issuerOrigin,separateIssuer:production?'separate-origin':'local-preview',reportPolicy:'sealed-event-reports'}));
app.post('/api/login',rateLimit({windowMs:15*60000,limit:10}), (req,res)=>{const got=scryptSync(String(req.body.password||'').slice(0,200),secret,32),expected=scryptSync(password,secret,32);if(req.body.email!==email||!timingSafeEqual(got,expected))return res.status(401).json({error:'Email or password is incorrect.'});for(const [k,v] of sessions)if(v.expiresAt<Date.now())sessions.delete(k);const token=randomBytes(32).toString('hex');sessions.set(token,{role:'admin',expiresAt:Date.now()+8*3600000});res.setHeader('Set-Cookie',`cp_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800${production?'; Secure':''}`);res.json({email,role:'admin'});});
app.get('/api/session',auth,(req,res)=>res.json({email,role:'admin'}));
app.post('/api/logout',auth,(req,res)=>{sessions.delete(req.sessionToken);res.setHeader('Set-Cookie','cp_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');res.json({ok:true});});
app.get('/api/events',safe(async(req,res)=>res.json((await db.events()).map(publicEvent))));
app.post('/api/events',auth,safe(async(req,res)=>{const {name,description='',date}=req.body;if(typeof name!=='string'||!name.trim()||name.length>100||typeof description!=='string'||description.length>500||!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return res.status(400).json({error:'Enter a name, date, and description under 500 characters.'});const id=randomUUID(),key=await issuer('/events',{id});const e=await db.addEvent({_id:id,name:name.trim(),description:description.trim(),date,open:true,publicJwk:key.publicJwk});res.status(201).json(publicEvent(e));}));
app.patch('/api/events/:id',auth,safe(async(req,res)=>{const e=await db.event(req.params.id);if(!e)return res.status(404).json({error:'Event not found.'});if(typeof req.body.open!=='boolean')return res.status(400).json({error:'Invalid state.'});if(e.report&&!e.demo)return res.status(409).json({error:'This event has a sealed report. Create a new event instead of changing its cohort.'});if(req.body.open){await issuer('/events/'+e._id+'/state',{open:true});await db.updateEvent(e._id,{open:true,releaseAt:null});}else{await db.updateEvent(e._id,{open:false,releaseAt:Date.now()+releaseDelay});await issuer('/events/'+e._id+'/state',{open:false});}res.json({ok:true});}));
app.post('/api/events/:id/invites',auth,safe(async(req,res)=>{const e=await db.event(req.params.id);if(!e||!e.open)return res.status(400).json({error:'Event is not open.'});res.json(await issuer('/events/'+e._id+'/invites',{count:req.body.count}));}));
app.get('/api/events/:id/key',safe(async(req,res)=>{const e=await db.event(req.params.id);if(!e||!e.open)return res.status(404).json({error:'Event is not accepting feedback.'});res.json(e.publicJwk);}));
// Intentionally no /issue endpoint here. Invitations and private keys live at the issuer.
app.post('/api/feedback',safe(async(req,res)=>{
  if(req.headers.cookie||req.headers.authorization)return res.status(400).json({error:'Anonymous submissions must omit cookies and account credentials.'});
  const {eventId,rating,category,comment='',message,signature}=req.body;
  const allowed=new Set(['eventId','rating','category','comment','message','signature']);
  if(Object.keys(req.body).some(k=>!allowed.has(k))||typeof eventId!=='string'||!Number.isInteger(rating)||rating<1||rating>5||!['Content','Delivery','Organisation','Other'].includes(category)||typeof comment!=='string'||comment.length>2000||typeof message!=='string'||typeof signature!=='string')return res.status(400).json({error:'Invalid feedback fields. Do not send identity or invitation information.'});
  const e=await db.event(eventId);if(!e||!e.open)return res.status(400).json({error:'This event is closed.'});
  const prepared=Uint8Array.from(Buffer.from(message,'base64')),sig=Uint8Array.from(Buffer.from(signature,'base64'));
  if(prepared.length!==64||sig.length!==256)return res.status(400).json({error:'Invalid token size.'});
  const key=await crypto.subtle.importKey('jwk',e.publicJwk,{name:'RSA-PSS',hash:'SHA-384'},true,['verify']);
  if(!await suite.verify(key,sig,prepared))return res.status(403).json({error:'Invalid anonymous token.'});
  await db.addFeedback({eventId,rating,category,comment:comment.trim(),tokenHash:hash(eventId+':'+Buffer.from(prepared).toString('base64'))});
  res.status(201).json({ok:true,message:'Stored privately. It will not appear as a live individual update.'});
}));
async function releasedEvents(){
  const events=await db.events();
  for(const e of events){if(!e.report&&!e.open&&e.releaseAt&&e.releaseAt<=Date.now()){const rows=await db.feedback(e._id);if(rows.length>=MINIMUM)e.report=await db.saveReport(e._id,sealReport(rows));}}
  return events;
}
function state(e){return e.report?'released':e.open?'collecting':e.releaseAt>Date.now()?'cooldown':'protected';}
app.get('/api/showcase',safe(async(req,res)=>{
  if(!validateReportQuery(req.query))return res.status(400).json({error:'Select a whole event only.'});
  const events=(await db.events()).filter(e=>e.demo&&e.report);
  const selected=events.filter(e=>!req.query.event||e._id===req.query.event);
  res.json({...combineReports(selected),events:events.map(e=>({...publicEvent(e),count:e.report.count,reportState:'released',report:{count:e.report.count,average:e.report.average,positive:e.report.positive,demo:true,version:e.report.version}})),privacy:{minimum:MINIMUM,delayMinutes:15,immutable:true,noTimestamps:true,cookiesOmitted:true,smallCellsSuppressed:true,export:'aggregate-only'},demo:true,readOnly:true});
}));
app.get('/api/statistics',auth,safe(async(req,res)=>{
  if(!validateReportQuery(req.query))return res.status(400).json({error:'Only whole-event selection is supported. Rating, topic, search and submission-date slices are disabled for privacy.'});
  const events=await releasedEvents(),selected=events.filter(e=>!req.query.event||e._id===req.query.event);
  res.json({...combineReports(selected),events:events.map(e=>({...publicEvent(e),count:e.report?.count??null,reportState:state(e),releaseAt:!e.report&&!e.open?e.releaseAt:null,reportLocked:!!e.report&&!e.demo,report:e.report?{count:e.report.count,average:e.report.average,positive:e.report.positive,demo:e.report.demo,version:e.report.version}:null})),privacy:{minimum:MINIMUM,delayMinutes:15,immutable:true,noTimestamps:true,cookiesOmitted:true,smallCellsSuppressed:true,export:'aggregate-only',issuer:production?'separate-origin':'local-preview'},demo});
}));
app.get('/api/export',auth,safe(async(req,res)=>{
  if(!validateReportQuery(req.query))return res.status(400).json({error:'Export supports whole-event reports only.'});
  const events=(await releasedEvents()).filter(e=>(!req.query.event||e._id===req.query.event)&&e.report);
  if(!events.length)return res.status(403).json({error:'No privacy-eligible reports are available to export.'});
  res.setHeader('Content-Disposition','attachment; filename="clubpulse-sealed-reports.csv"');res.type('text/csv').send(reportCsv(events));
}));
app.get('/api/diagnostics',auth,safe(async(req,res)=>{
  let database=false,issuance=false;
  try{await db.events();database=true;}catch{}
  try{const result=await issuer('/check',{});issuance=result.ok===true&&result.role==='issuer';}catch{}
  res.json({database,issuance,separateOrigin:new URL(origin).origin!==new URL(issuerOrigin).origin,https:production,preview:demo});
}));
app.get('/api/health',(req,res)=>res.json({ok:true,demo,role:'collector'}));
app.use('/api',(req,res)=>res.status(404).json({error:'API route not found.'}));
if(production){app.use(express.static('dist'));app.get('/{*path}',(req,res)=>res.sendFile('index.html',{root:'dist'}));}else if(process.env.NODE_ENV!=='test'){const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.use((err,req,res,next)=>res.status(err.code===11000?409:err.status||500).json({error:err.code===11000?'Token already used.':err.status?err.message:'Request could not be processed.'}));
app.listen(port,production?'0.0.0.0':'127.0.0.1',()=>console.log(`ClubPulse collector: http://localhost:${port}. No request or body logging.`));
