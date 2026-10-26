import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import {randomBytes,createHash,timingSafeEqual,createHmac} from 'node:crypto';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {RSABSSA} from '@cloudflare/blindrsa-ts';
import {pathToFileURL} from 'node:url';

export async function startIssuer({demo,secret,port,origin,mongoUri,host='127.0.0.1'}) {
  if(!secret||secret.length<32||(process.env.NODE_ENV==='production'&&secret.startsWith('replace-')))throw new Error('Issuer service secret must be at least 32 characters.');
  if(process.env.NODE_ENV==='production'&&(demo||!origin?.startsWith('https://')))throw new Error('Production issuer requires HTTPS PUBLIC_ORIGIN and no demo mode.');
  if(!demo&&!mongoUri)throw new Error('ISSUER_MONGODB_URI is required.');
  const suite=RSABSSA.SHA384.PSS.Randomized(),memoryEvents=new Map(),memoryInvites=new Map();
  let connection,Event,Invite;
  if(!demo){
    connection=await mongoose.createConnection(mongoUri,{serverSelectionTimeoutMS:8000}).asPromise();
    Event=connection.model('IssuerEvent',new mongoose.Schema({_id:String,open:Boolean,publicJwk:Object,privateJwk:Object},{versionKey:false}));
    Invite=connection.model('IssuerInvite',new mongoose.Schema({_id:{type:String,default:()=>crypto.randomUUID()},eventId:String,codeHash:{type:String,unique:true},blindedHash:String},{versionKey:false}));
    await Promise.all([Event.init(),Invite.init()]);
  }
  const hash=x=>createHash('sha256').update(x).digest('hex');
  const getEvent=id=>demo?memoryEvents.get(id):Event.findById(id).lean();
  const app=express();app.disable('x-powered-by');
  if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
  app.use(helmet({referrerPolicy:{policy:'no-referrer'}}));
  app.use((req,res,next)=>{
    res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
    if(req.headers.origin){if(req.headers.origin!==origin)return res.status(403).json({error:'Origin not allowed.'});res.set({'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});}
    if(req.method==='OPTIONS')return res.sendStatus(204);
    next();
  });
  app.use(express.json({limit:'4kb'}));
  // Transient pseudonymous abuse keys, never logged or persisted. A restart rotates them.
  const abuseSecret=randomBytes(32);
  app.use('/api',rateLimit({windowMs:60000,limit:20,keyGenerator:req=>createHmac('sha256',abuseSecret).update(ipKeyGenerator(req.ip||'127.0.0.1')).digest('hex'),validate:{keyGeneratorIpFallback:false}}));
  function internal(req,res,next){const got=Buffer.from(req.headers.authorization?.replace(/^Bearer /,'')||'');const expected=Buffer.from(secret);if(got.length!==expected.length||!timingSafeEqual(got,expected))return res.status(401).json({error:'Service authentication required.'});next();}
  const safe=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
  app.post('/internal/check',internal,(req,res)=>res.json({ok:true,role:'issuer'}));
  app.post('/internal/events',internal,safe(async(req,res)=>{
    const {id}=req.body;if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))return res.status(400).json({error:'Invalid event ID.'});
    if(await getEvent(id))return res.status(409).json({error:'Event already provisioned.'});
    const keys=await suite.generateKey({modulusLength:2048,publicExponent:new Uint8Array([1,0,1])});
    const e={_id:id,open:true,publicJwk:await crypto.subtle.exportKey('jwk',keys.publicKey),privateJwk:await crypto.subtle.exportKey('jwk',keys.privateKey)};
    if(demo)memoryEvents.set(id,e);else await Event.create(e);
    res.status(201).json({publicJwk:e.publicJwk});
  }));
  app.post('/internal/events/:id/state',internal,safe(async(req,res)=>{const e=await getEvent(req.params.id);if(!e)return res.status(404).json({error:'Event not found.'});if(typeof req.body.open!=='boolean')return res.status(400).json({error:'Invalid state.'});if(demo)e.open=req.body.open;else await Event.updateOne({_id:e._id},{$set:{open:req.body.open}});res.json({ok:true});}));
  app.post('/internal/events/:id/invites',internal,safe(async(req,res)=>{
    const e=await getEvent(req.params.id);if(!e||!e.open)return res.status(400).json({error:'Event is closed.'});const count=Number(req.body.count);if(!Number.isInteger(count)||count<1||count>200)return res.status(400).json({error:'Choose 1 to 200 codes.'});
    const codes=Array.from({length:count},()=>randomBytes(12).toString('hex'));
    if(demo&&req.body.demoCode)codes[0]='HACKATHON-DEMO-2026';
    const rows=codes.map(code=>({eventId:e._id,codeHash:hash(code)}));if(demo)for(const row of rows)memoryInvites.set(row.codeHash,row);else await Invite.insertMany(rows);
    res.json({codes});
  }));
  app.post('/api/events/:id/issue',safe(async(req,res)=>{
    // Collector/admin cookies must never be forwarded to this protocol endpoint.
    if(req.headers.cookie)return res.status(400).json({error:'Invitation exchange must omit cookies.'});
    const e=await getEvent(req.params.id);if(!e||!e.open)return res.status(404).json({error:'Event is not accepting feedback.'});
    const {code,blinded}=req.body;if(typeof code!=='string'||code.length>100||typeof blinded!=='string'||!/^[A-Za-z0-9+/=]+$/.test(blinded))return res.status(400).json({error:'Invalid invitation request.'});
    const bytes=Uint8Array.from(Buffer.from(blinded,'base64'));if(bytes.length!==256)return res.status(400).json({error:'Invalid token size.'});
    const codeHash=hash(code),blindedHash=hash(bytes);
    const invitation=demo?memoryInvites.get(codeHash):await Invite.findOne({eventId:e._id,codeHash}).lean();
    if(!invitation||invitation.eventId!==e._id||invitation.blindedHash&&invitation.blindedHash!==blindedHash)return res.status(409).json({error:'Code invalid or exchanged. Retry in the original tab.'});
    const key=await crypto.subtle.importKey('jwk',e.privateJwk,{name:'RSA-PSS',hash:'SHA-384'},true,['sign']);
    const signature=await suite.blindSign(key,bytes);
    if(demo){if(invitation.blindedHash&&invitation.blindedHash!==blindedHash)return res.status(409).json({error:'Code already exchanged.'});invitation.blindedHash=blindedHash;}
    else if(!await Invite.findOneAndUpdate({eventId:e._id,codeHash,$or:[{blindedHash:{$exists:false}},{blindedHash}]},{$set:{blindedHash}},{new:true}))return res.status(409).json({error:'Code already exchanged.'});
    res.json({signature:Buffer.from(signature).toString('base64')});
  }));
  app.get('/health',(req,res)=>res.json({ok:true,role:'issuer'}));
  app.use((err,req,res,next)=>res.status(400).json({error:'Invitation request could not be processed.'}));
  const server=await new Promise(resolve=>{const server=app.listen(port,host,()=>resolve(server));});
  return {server,close:async()=>{server.close();if(connection)await connection.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.env.NODE_ENV==='production'&&process.env.DEMO_MODE==='true')throw new Error('Demo issuer forbidden in production.');
  await startIssuer({demo:process.env.DEMO_MODE==='true',secret:process.env.ISSUER_ADMIN_SECRET,port:Number(process.env.PORT||3001),origin:process.env.PUBLIC_ORIGIN,mongoUri:process.env.ISSUER_MONGODB_URI,host:process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1'});
  console.log('ClubPulse issuer ready. Request logging disabled.');
}
