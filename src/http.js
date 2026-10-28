// Retry only reads. Repeating a write could create duplicate events or responses.
export async function requestJson(url,options={}){
 const method=(options.method||'GET').toUpperCase(),read=method==='GET',attempts=read?2:1;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const response=await fetch(url,{...options,signal:options.signal||AbortSignal.timeout(90000)});
   const text=await response.text();let data;
   try{data=JSON.parse(text);}catch{}
   if(!response.ok||!data||typeof data!=='object'){
    const retryAfter=Number(response.headers.get('retry-after'));
    const message=response.status===429?`Too many requests. Please wait ${Number.isFinite(retryAfter)&&retryAfter>0?Math.ceil(retryAfter/60)+' minute(s)':'a few minutes'} before trying again.`:data?.error||(!data?'The hosting service is starting or temporarily unavailable. Please retry in a moment.':'Request failed. Please try again.');
    throw Object.assign(new Error(message),{status:response.status,retryable:(response.ok&&!data)||[502,503,504].includes(response.status)});
   }
   return data;
  }catch(error){
   const network=error.name==='TypeError'||error.name==='TimeoutError'||error.name==='AbortError';
   if(read&&attempt+1<attempts&&(network||error.retryable))continue;
   if(network)throw Object.assign(new Error('Unable to reach ClubPulse. Free hosting may be waking up. Wait a moment and retry; your form has been kept.'),{status:0});
   throw error;
  }
 }
}
