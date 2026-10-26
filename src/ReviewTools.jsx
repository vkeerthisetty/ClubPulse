import React,{useState,useEffect} from 'react';
import './review-tools.css';

export function downloadInvitationCards(event,codes){
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=location.origin+'/#participant/'+encodeURIComponent(event.id);
  const cards=codes.map(code=>`<article><small>CLUBPULSE / ONE-USE INVITATION</small><h2>${escape(event.name)}</h2><p>1. Open the feedback link.<br>2. Enter your private code.<br>3. Share a rating and comment.</p><a href="${escape(link)}">${escape(link)}</a><code>${escape(code)}</code><p>Keep this code private. Hand out one card per attendee. Do not write a name on it.</p></article>`).join('');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>ClubPulse invitation cards</title><style>body{font:14px/1.6 Arial;color:#18140f;margin:25px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{padding:22px;border:1px dashed #18140f;break-inside:avoid}h2{font-size:22px}small{font:10px monospace}a{overflow-wrap:anywhere;font-size:11px;color:inherit}code{display:block;background:#eee;padding:15px;margin-top:16px;font-size:16px}body>p{max-width:700px}@media print{body>p{display:none}body{margin:0}}@page{size:A4;margin:12mm}</style><p>Private invitation sheet. Print using your browser, cut along the borders, and distribute one card per attendee. This file contains access codes; do not publish it.</p><main>${cards}</main></html>`;
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='clubpulse-private-invitation-cards.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function CommentExplorer({comments,events,Icon}){
  const [search,setSearch]=useState(''),[limit,setLimit]=useState(6);
  useEffect(()=>setLimit(6),[search,comments]);
  const rows=comments.filter(row=>row.comment.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="comment-explorer" id="sample-comments">
    <header><div><span className="eyebrow">THE LISTENING ROOM</span><h2>THE WORDS BEHIND THE REPORT.</h2></div><label>Search released comments<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try mentor, schedule or briefing"/></label></header>
    <p className="explorer-method">Demonstration data. These comments illustrate the product and are not real participant submissions. Search runs in your browser and does not filter the statistics.</p>
    <div className="explorer-count" role="status">{rows.length} {rows.length===1?'comment':'comments'}{search.trim()?' matching your search':''}<button className="text-button" disabled={!search} onClick={()=>setSearch('')}>Clear search</button></div>
    <div className="comment-grid">{rows.slice(0,limit).map((row,i)=><article key={row.eventId+':'+i}><span>{events.find(e=>e.id===row.eventId)?.name||'Event report'}</span><p>{row.comment}</p><small><Icon name="shield" size={13}/> Rating and submission time withheld</small></article>)}</div>
    {!rows.length&&<p className="explorer-empty">{search?'No comments match. Try a different word or clear the search.':'No released comments are available for this event.'}</p>}
    {rows.length>limit&&<button className="button" onClick={()=>setLimit(n=>n+6)}>Show more comments ({rows.length-limit} remaining)</button>}
  </section>;
}

export function ConnectionCheck(){
  const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function check(){setBusy(true);setError('');setResult(null);try{const response=await fetch('/api/diagnostics',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Connection check failed.');setResult(data);}catch(e){setError(e.message);}finally{setBusy(false);}}
  const checks=result?[['Feedback database',result.database,'Can read the event store.'],['Invitation service',result.issuance,'The issuer accepts the service credential.'],['Separate service origins',result.separateOrigin,'Invitation exchange uses a different origin.'],['Production HTTPS configuration',result.https,'Both services are configured for HTTPS.']]:[];
  return <section className="connection-check panel"><header><div><span className="eyebrow">ADMINISTRATOR TOOLS</span><h2>CHECK BEFORE YOU INVITE.</h2><p>Check the services needed to create events and distribute invitations. No feedback or invitations are created by this check.</p></div><button className="primary" disabled={busy} onClick={check}>{busy?'Checking services...':'Run connection check'}</button></header>{error&&<p role="alert" className="error">{error}</p>}{result&&<><div className="connection-results">{checks.map(([label,ok,note])=><article key={label}><strong>{label}</strong><span>{ok?'Ready':result.preview&&label==='Production HTTPS configuration'?'Local preview':'Needs attention'}</span><p>{note}</p></article>)}</div>{!result.issuance&&<p role="status">The invitation service did not respond successfully. Check that it is awake, that its database is reachable, and that both services use the same issuer secret. Retry after the free service has started.</p>}</>}</section>;
}
