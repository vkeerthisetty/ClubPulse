import React,{useState,useEffect} from 'react';

export function MessengerArtwork(){
 return <svg className="messenger-art" viewBox="0 0 860 460" fill="none" aria-hidden="true">
  <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".8"><path d="M88 118q12-15 24 0m-4-1q12-15 24 0M157 91q10-13 20 0m-3-1q10-13 20 0M690 134h30m-15-15v30M744 247h20m-10-10v20"/><circle cx="100" cy="285" r="4"/><circle cx="677" cy="57" r="3"/><path d="m228 240 7-16 7 16 16 7-16 7-7 16-7-16-16-7z"/></g>
  <g stroke="#1b1b20" strokeWidth="3" strokeLinejoin="round"><path d="M327 456c-2-61 25-109 73-120h75c51 8 84 53 88 120" fill="#1b1b20"/><path d="M397 304v45q35 30 69 0v-47" fill="#b5b0ca"/><path d="M386 336q44 39 95-1l-14 51-37-21-34 22z" fill="#f1efe4"/>
  <path d="M341 342c-45 6-72-22-90-63l-31 16c13 72 50 110 120 105" fill="#1b1b20"/>
  <path d="M222 296c-19-24-34-49-34-66 0-7 10-9 14-1l11 19-9-53c-1-9 10-11 13-2l10 35-3-48c-1-10 11-11 13-1l7 46 4-39c1-10 13-8 12 2l-2 52 12-18c7-10 17-3 10 7l-24 38-4 24" fill="#b5b0ca"/>
  <path d="M494 346c56 3 84-19 100-56l33 15c-18 70-67 99-109 96" fill="#1b1b20"/>
  <path d="M594 295c-8-21-3-41 4-50 5-6 13-1 11 6l-3 16 21-31c6-8 15-1 10 7l-14 23 24-19c8-6 16 3 8 10l-27 25-12 24" fill="#b5b0ca"/>
  <g transform="rotate(-5 434 219)"><rect x="323" y="129" width="222" height="177" rx="42" fill="#b5b0ca"/><path d="m326 145 106 89 108-87" strokeWidth="2"/><path d="m329 293 65-63m146 65-64-64" strokeWidth="2"/><ellipse cx="393" cy="207" rx="15" ry="23" fill="#f1efe4"/><ellipse cx="469" cy="207" rx="15" ry="23" fill="#f1efe4"/><ellipse cx="397" cy="211" rx="6" ry="10" fill="#1b1b20"/><ellipse cx="473" cy="211" rx="6" ry="10" fill="#1b1b20"/><path d="M421 253q14 16 28-2" strokeWidth="3"/><path d="M369 167q20-13 36-1m50-2q18-10 34 3"/>
  <path d="M321 153c-8-42 20-74 64-75l109 4c36 3 56 24 53 62-83-28-156-24-226 9Z" fill="#1b1b20"/><path d="M322 153c51-15 101-22 153-13" stroke="#f1efe4" strokeWidth="1"/></g>
  <g transform="rotate(8 633 195)"><path d="M573 140h133v65h-58l-21 22v-22h-54z" fill="#e0edb5"/><path d="M597 165h85m-85 16h57" strokeWidth="3"/></g>
  <path d="M425 411h20m-10-10v20" stroke="#f1efe4" strokeWidth="2"/></g>
 </svg>;
}

export default function LucidHero({onNavigate,Icon}){
 return <section className="lucid-hero" id="hello" aria-labelledby="lucid-title">
  <p className="lucid-pretitle">A little space for honest feedback</p>
  <div className="lucid-title-frame"><h1 id="lucid-title">CLUB PULSE</h1><i/><i/><i/><i/><span className="selection-caption">your voice belongs here</span></div>
  <div className="lucid-tagline"><span>Say what you think.</span><em>Keep who you are.</em></div>
  <MessengerArtwork/>
  <div className="lucid-side-note"><span>NO NAMES.<br/>NO EMAILS.<br/>JUST FEEDBACK.</span><svg viewBox="0 0 100 75"><path d="M85 8C32-5 7 17 20 40c9 14 35 14 61 3M70 29l14 14-15 9" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>
  <div className="lucid-intro"><p>Have an invitation from your club?</p><button className="primary" onClick={()=>onNavigate('submit')}>Enter with your event code <Icon name="arrow" size={18}/></button><a href="#proof" onClick={()=>onNavigate('proof')}>How anonymity works</a></div>
  <span className="lucid-scroll">Scroll to find your event <span>↓</span></span>
 </section>;
}

export function RulerIndex({onNavigate}){
 const [active,setActive]=useState('hello');
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)setActive(e.target.id);},{rootMargin:'-10% 0px -45% 0px',threshold:0});for(const id of ['hello','entry','event-directory','how-it-works']){const node=document.getElementById(id);if(node)observer.observe(node);}return()=>observer.disconnect();},[]);
 const scroll=id=>{document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setActive(id);};
 return <nav className="ruler-index" aria-label="Page index"><span className="ruler-line"/>{[['hello','Hello'],['entry','Your entry'],['event-directory','Events'],['how-it-works','The process']].map(([id,label])=><button key={id} aria-current={active===id?'location':undefined} onClick={()=>scroll(id)}>{label}</button>)}<button onClick={()=>onNavigate('demo')}>Demo report</button><button onClick={()=>onNavigate('login')}>Backstage</button></nav>;
}
