import {randomBytes,createHash} from 'node:crypto';

// Separate, bounded memory namespace. Practice keys and invitation hashes never
// touch the real issuer collections or the collector's administrator sessions.
export function installEvaluatorIssuer(app,{suite,internal,safe}){
 const events=new Map(),TTL=40*60*1000,hash=x=>createHash('sha256').update(x).digest('hex');
 const prune=()=>{for(const [id,e] of events)if(e.expiresAt<=Date.now())events.delete(id);};
 app.post('/internal/sandbox/events',internal,safe(async(req,res)=>{
  prune();if(events.size>=64)return res.status(503).json({error:'Practice capacity is full. Try again later.'});
  const id=req.body.id;if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))return res.status(400).json({error:'Invalid practice event.'});
  if(events.has(id))return res.status(409).json({error:'Practice event already exists.'});
  const e={id,open:true,expiresAt:Date.now()+TTL,invites:new Map()};events.set(id,e);
  try{const keys=await suite.generateKey({modulusLength:2048,publicExponent:new Uint8Array([1,0,1])});e.publicJwk=await crypto.subtle.exportKey('jwk',keys.publicKey);e.privateKey=keys.privateKey;res.status(201).json({publicJwk:e.publicJwk});}catch(err){events.delete(id);throw err;}
 }));
 app.post('/internal/sandbox/events/:id/invites',internal,(req,res)=>{
  prune();const e=events.get(req.params.id),count=Number(req.body.count||1);
  if(!e?.open||!e.privateKey)return res.status(410).json({error:'Practice issuer expired. Start a fresh practice session.'});
  if(!Number.isInteger(count)||count<1||count>5||e.invites.size+count>20)return res.status(400).json({error:'Practice allows up to 20 invitations per event, five at a time.'});
  const codes=Array.from({length:count},()=>randomBytes(12).toString('hex'));for(const code of codes)e.invites.set(hash(code),{});res.json({codes});
 });
 app.post('/internal/sandbox/events/:id/state',internal,(req,res)=>{prune();const e=events.get(req.params.id);if(!e)return res.status(410).json({error:'Practice issuer expired. Start a fresh session.'});e.open=false;res.json({ok:true});});
 app.post('/internal/sandbox/events/:id/discard',internal,(req,res)=>{events.delete(req.params.id);res.json({ok:true});});
 app.post('/api/sandbox/events/:id/issue',safe(async(req,res)=>{
  prune();if(req.headers.cookie||req.headers.authorization)return res.status(400).json({error:'Practice exchange must omit account credentials.'});
  const e=events.get(req.params.id);if(!e?.open||!e.privateKey)return res.status(410).json({error:'Practice event expired or closed. Start a fresh session.'});
  const {code,blinded}=req.body;if(typeof code!=='string'||code.length>100||typeof blinded!=='string'||!/^[A-Za-z0-9+/=]+$/.test(blinded))return res.status(400).json({error:'Invalid practice invitation.'});
  const bytes=Uint8Array.from(Buffer.from(blinded,'base64'));if(bytes.length!==256)return res.status(400).json({error:'Invalid token size.'});
  const row=e.invites.get(hash(code)),fingerprint=hash(bytes);if(!row||row.blindedHash&&row.blindedHash!==fingerprint)return res.status(409).json({error:'Practice code invalid or already exchanged.'});
  // Reserve synchronously before awaiting crypto to prevent concurrent exchanges.
  row.blindedHash=fingerprint;
  const signature=await suite.blindSign(e.privateKey,bytes);res.json({signature:Buffer.from(signature).toString('base64')});
 }));
}
