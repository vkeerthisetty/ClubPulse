// Wake the issuer with safe reads before sending a non-idempotent operation.
// Never automatically repeat invitation creation, event creation or sealing.
export function createIssuerClient(origin,secret,{fetchImpl=fetch,wakeMs=60000,requestMs=20000,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 let readyUntil=0,waking;
 async function ready(){
  if(Date.now()<readyUntil)return;
  if(waking)return waking;
  waking=(async()=>{
   const deadline=Date.now()+wakeMs;
   do{
    try{
     const response=await fetchImpl(origin+'/health',{cache:'no-store',signal:AbortSignal.timeout(Math.max(1,Math.min(10000,deadline-Date.now())))});
     const value=await response.json().catch(()=>null);
     if(response.ok&&value?.ok===true&&value.role==='issuer'){readyUntil=Date.now()+30000;return;}
    }catch{}
    if(Date.now()>=deadline)break;
    await pause(Math.min(1500,deadline-Date.now()));
   }while(Date.now()<deadline);
   throw Object.assign(new Error('The invitation service is not ready yet. Please retry after it finishes starting, or use the local presentation copy.'),{status:503});
  })();
  try{await waking;}finally{waking=null;}
 }
 return async function issuer(path,body){
  await ready();
  let response;
  try{response=await fetchImpl(origin+'/internal'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},body:JSON.stringify(body),signal:AbortSignal.timeout(requestMs)});}catch{readyUntil=0;throw Object.assign(new Error('The invitation service connection was interrupted. The operation was not repeated automatically. Please retry once it is ready.'),{status:503});}
  const value=await response.json().catch(()=>null);
  if(!value){readyUntil=0;throw Object.assign(new Error('The invitation service returned a temporary hosting error. Please retry in a moment.'),{status:503});}
  if(!response.ok){
   if(response.status>=500)readyUntil=0;
   // Preserve expiry so the practice UI can offer a fresh session after restart.
   const status=[400,404,409,410,429].includes(response.status)?response.status:503;
   const message=response.status===401?'The invitation service configuration needs administrator attention.':value.error||'Invitation request failed.';
   throw Object.assign(new Error(message),{status});
  }
  return value;
 };
}
