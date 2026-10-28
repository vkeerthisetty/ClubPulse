import React,{useState} from 'react';
import {chartData} from './chartData.js';
import './feedback-charts.css';

export default function FeedbackCharts({data,event,onEvent,onComments}){
 const [sort,setSort]=useState('date'),[table,setTable]=useState(false);
 const model=chartData(data?.events,event,sort),score=data?.average;
 const available=model.reports.length>0&&Number.isFinite(score),ratio=available?(score-1)/4:0;
 const circumference=2*Math.PI*57;let offset=0;
 const fallback=(data?.events||[]).find(e=>e.report&&!e.demo)||(data?.events||[]).find(e=>e.report);
 return <section id="visual-report" className="feedback-charts" aria-label="Visual feedback report">
  <header className="charts-intro"><div><span className="eyebrow">THE VISUAL REPORT</span><h2>See the feedback clearly.</h2><p>Whole-event scores and released responses. No individual tracking.</p></div><button className="button" onClick={onComments}>Read written comments <span aria-hidden="true">↗</span></button></header>
  <div className="charts-grid">
   <article className="chart-card score-dial"><header><span>01 / OVERALL EXPERIENCE</span><h3>The room's overall rating</h3></header>
    <svg viewBox="0 0 260 175" role="img" aria-label={available?`Average rating ${score} out of 5`:'Average rating protected until the report is released'}>
     <path d="M30 130 A100 100 0 0 1 230 130" fill="none" stroke="#ddd8d0" strokeWidth="18"/>
     {available&&<path d="M30 130 A100 100 0 0 1 230 130" fill="none" stroke="#6d698b" strokeWidth="18" strokeDasharray={`${ratio*Math.PI*100} ${Math.PI*100}`}/>}
     {[1,2,3,4,5].map((n,i)=><text key={n} x={130-119*Math.cos(i*Math.PI/4)} y={134-119*Math.sin(i*Math.PI/4)} textAnchor="middle" className="dial-tick">{n}</text>)}
     <text x="130" y="110" textAnchor="middle" className={available?'dial-number':'dial-protected'}>{available?score:'Protected'}</text><text x="130" y="137" textAnchor="middle" className="dial-caption">{available?'average out of 5':'No provisional score'}</text>
     {available&&<circle cx={130-100*Math.cos(ratio*Math.PI)} cy={130-100*Math.sin(ratio*Math.PI)} r="9" fill="#d9f36b" stroke="#25252a" strokeWidth="2"/>}
    </svg><p>{available?'Every released response has equal weight. The scale runs from 1 to 5.':'Close the event, meet the five-response minimum and complete the cooldown.'}</p>
   </article>
   <article className="chart-card release-donut"><header><span>02 / REPORT AVAILABILITY</span><h3>What can be read now</h3></header><div className="donut-content">
    <svg viewBox="0 0 150 150" role="img" aria-label={model.states.map(s=>`${s.label}: ${s.count} events`).join(', ')}><circle cx="75" cy="75" r="57" fill="none" stroke="#ddd8d0" strokeWidth="18"/>{model.states.filter(s=>s.count).map(s=>{const length=s.count/model.total*circumference,previous=offset;offset+=length;return <circle key={s.key} cx="75" cy="75" r="57" fill="none" stroke={s.color} strokeWidth="18" strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-previous} transform="rotate(-90 75 75)"/>;})}<text x="75" y="77" textAnchor="middle" className="donut-number">{model.total}</text><text x="75" y="96" textAnchor="middle" className="dial-caption">{model.total===1?'event':'events'}</text></svg>
    <ul>{model.states.map(s=><li key={s.key}><i style={{background:s.color}}/><span>{s.label}</span><strong>{s.count}</strong></li>)}</ul></div><p>This counts events, not hidden responses. Samples are labelled separately.</p>
   </article>
   <article className="chart-card event-scores"><header><span>03 / EVENT SCORES</span><h3>How each event was rated</h3></header><div className="plot-axis"><span>Event / source</span><div>{[1,2,3,4,5].map(n=><span key={n}>{n}</span>)}</div><span>/ 5</span></div>
    {model.reports.map(r=><button className="event-plot-row" key={r.id} onClick={()=>onEvent(r.id)} aria-label={`Open ${r.name}: average ${r.score} out of 5`}><span>{r.name}<small>{r.sample?'Sample report':'Sealed club report'}</small></span><svg viewBox="0 0 400 32" aria-hidden="true">{[12,106,200,294,388].map(x=><line key={x} x1={x} x2={x} y1="1" y2="31" stroke="#d8d4cc"/>)}<line x1="12" x2="388" y1="16" y2="16" stroke="#bdb8b1"/><line x1="12" x2={12+(r.score-1)/4*376} y1="16" y2="16" stroke="#827592" strokeWidth="3"/><circle cx={12+(r.score-1)/4*376} cy="16" r="6" fill={r.sample?'#b4bdd0':'#6d7748'} stroke="#29292d"/></svg><strong>{r.score.toFixed(1)}</strong></button>)}
    {!model.reports.length&&<Empty fallback={fallback} onEvent={onEvent}/>}<p>Click an event to inspect its whole report. These are averages, not individual ratings or a time trend.</p>
   </article>
   <article className="chart-card response-volume"><header><span>04 / RELEASED RESPONSES</span><h3>How much feedback is included</h3></header><div className="volume-scale"><span>0</span><span>{model.reports.length?model.maxCount:'No released total'}</span></div>
    {model.reports.map(r=><button className="response-plot-row" key={r.id} onClick={()=>onEvent(r.id)} aria-label={`Open ${r.name}: ${r.count} released responses`}><span>{r.name}<small>{r.sample?'Sample report':'Sealed club report'}</small></span><span className="response-track"><i style={{width:`${r.count/model.maxCount*100}%`,background:r.sample?'#b4bdd0':'#8b9865'}}/></span><strong>{r.count}</strong></button>)}
    {!model.reports.length&&<Empty fallback={fallback} onEvent={onEvent}/>}<p>Released response totals only. These are not attendance figures or a response rate.</p>
   </article>
  </div>
  <div className="chart-controls"><label>Order plotted events<select value={sort} onChange={e=>setSort(e.target.value)}><option value="date">Event date</option><option value="score">Highest score</option><option value="responses">Most released responses</option></select></label><button className="text-button" aria-expanded={table} onClick={()=>setTable(v=>!v)}>{table?'Hide chart data':'View chart data as a table'}</button><span>Protected values stay hidden.</span></div>
  {table&&<div className="chart-table-wrap"><table><caption>Data behind the event charts</caption><thead><tr><th>Event</th><th>Source</th><th>Average / 5</th><th>Released responses</th></tr></thead><tbody>{model.reports.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.sample?'Sample':'Sealed club report'}</td><td>{r.score.toFixed(1)}</td><td>{r.count}</td></tr>)}{!model.reports.length&&<tr><td colSpan="4">No released values for this selection.</td></tr>}</tbody></table></div>}
 </section>;
}
function Empty({fallback,onEvent}){return <div className="chart-empty"><strong>This report is still protected.</strong><p>No values are drawn until this cohort can be released.</p>{fallback&&<button className="button" onClick={()=>onEvent(fallback.id)}>Open an available report</button>}</div>;}
