import React,{useState} from 'react';
import LucidHero,{RulerIndex} from './LucidHero.jsx';



export default function Front({events, config, onNavigate, Logo, Icon, proof}) {

  const open = events.filter(event => event.open);

  const openEvent = id => { location.hash = 'submit/' + id; onNavigate('submit/' + id); };

  return <div className={"front-page "+(proof?"proof-page":"dream-home")}>

    <header className="front-header"><Logo/><nav aria-label="Main navigation">

      <a className={!proof?'selected':''} href="#" onClick={()=>onNavigate('home')}>Events</a>

      <a className={proof?'selected':''} href="#proof" onClick={()=>onNavigate('proof')}>Anonymity proof</a>

      <a href="#demo" onClick={()=>onNavigate('demo')}>Demo report</a>

      <a className="backstage-link" href="#admin/login" onClick={()=>onNavigate('login')}>Administrator sign-in <Icon name="arrow" size={17}/></a>
      <a className="header-entry" href="#participant" onClick={()=>onNavigate('submit')}>Give feedback <Icon name="arrow" size={16}/></a>

    </nav></header>

    <main className="front-main">

    {proof ? <>

      <section className="proof-hero"><span className="eyebrow">PRIVACY WITHOUT THE FINE-PRINT TRICKS</span><h1>Privacy you<br/>can <em>understand.</em></h1><p>Anonymous feedback should come with an explanation. Here is exactly how your invitation becomes a response without carrying your code along.</p></section>

      <div className="proof-flow">{[

        ['01','THE INVITATION','Your organiser gives you a random, one-use code. The database stores a hash of that code, not your name or email.'],

        ['02','THE BLIND SIGNATURE','Your browser creates and blinds a random token. A separate issuer checks your invitation and signs the blinded value. The collector holds only the public key. Local preview uses two listeners on this computer; production requires separate origins.'],

        ['03','THE RESPONSE','Your browser unblinds the signature. Your feedback is submitted with this token and signature. Your invitation code, account cookies and referrer are omitted.'],

        ['04','THE ONE-USE CHECK','The collector verifies a token once. Reports release only after the event closes, a 15-minute cooldown and at least five responses. No live individual updates.']

      ].map(([n,t,p])=><article key={n}><span>{n}</span><div><h2>{t}</h2><p>{p}</p></div></article>)}</div>

      <PrivacyLab Icon={Icon}/>

      <section className="proof-storage"><div><span className="eyebrow">THE FEEDBACK RECORD</span><h2>WHAT WE STORE.</h2><p>Event ID, rating, topic, comment, random record ID, and a one-use token hash. No submission date, time, IP or browser metadata is stored in feedback records.</p><span className="record-label">NO NAME / NO EMAIL / NO INVITATION CODE</span></div><div><span className="eyebrow">THE REAL-WORLD LIMITS</span><h2>WHAT THIS CAN’T HIDE.</h2><p>Hosting providers can see network metadata. Timing and identifying comments can reveal information. The whole application has not been independently audited.</p><p>Implemented with Cloudflare’s RFC 9474 library. This explains the design; it is not a claim of perfect anonymity.</p></div></section>

      <button className="primary proof-return" onClick={()=>onNavigate('home')}>Find your event <Icon name="arrow"/></button>

    </> : <>

      <LucidHero onNavigate={onNavigate} Icon={Icon}/>

      <section id="entry" className="access-entrances" aria-label="Choose your access"><div><span className="eyebrow">FOR ATTENDEES</span><h2>PARTICIPANT SIGN-IN</h2><p>Your event code opens anonymous feedback. No email or password required.</p><button className="primary" onClick={()=>onNavigate('submit')}>Enter with event code <Icon name="arrow" size={18}/></button></div><div><span className="eyebrow">FOR AUTHORISED ORGANISERS</span><h2>ADMINISTRATOR SIGN-IN</h2><p>Your club credentials open event management, invitations and protected reports.</p><button className="button" onClick={()=>onNavigate('login')}>Administrator sign-in <Icon name="lock" size={18}/></button><button className="text-button practice-entry-link" onClick={()=>onNavigate('try/organiser')}>Try the organiser practice space <Icon name="arrow" size={16}/></button></div></section>
      <section className="reviewer-demo"><div><span className="eyebrow">VISITING FOR A PRODUCT REVIEW?</span><h2>A look behind the scenes.</h2><p>Try submitting a response and managing a temporary event. Switch between participant and practice organiser without a password. Example entries are clearly labelled.</p></div><button className="primary" onClick={()=>onNavigate('try')}>Try the interactive demo <Icon name="arrow" size={18}/></button></section>
      <section id="how-it-works" className="front-steps" aria-label="How it works">{[

        ['1','Pick your event','Find your workshop below. Your organiser gives you a one-use invitation code.'],

        ['2','Say what you think','Exchange your code privately. Leave a rating, choose a topic, and tell it straight.'],

        ['3','Shape the next one','Your organisers see the feedback, not your invitation. Give them something they can act on.']

      ].map(([n,t,p])=><article key={n}><span>{n}</span><h2>{t}</h2><p>{p}</p></article>)}</section>

      <section id="event-directory" className="front-events" aria-labelledby="open-events"><div className="section-rule"><h2 id="open-events">The event directory</h2><span/>{config.demo&&<small>LOCAL PREVIEW</small>}</div>

      {open.length ? <div className="ticket-list">{open.map(event=><article className="event-ticket" key={event.id}>

        <div className="ticket-date"><strong>{new Date(event.date+'T12:00:00').getDate()}</strong><span>{new Date(event.date+'T12:00:00').toLocaleString('en',{month:'short'})}</span><small>{event.date.slice(0,4)}</small></div>

        <div className="ticket-body"><div className="ticket-labels">{event.demo?<span className="ticket-tag demo-tag">SAMPLE EVENT</span>:<span className="ticket-tag">CODE NEEDED</span>}</div><h3><a href={event.demo?'#try/'+event.id:'#participant/'+event.id} onClick={()=>event.demo?onNavigate('try/'+event.id):openEvent(event.id)}>{event.name}</a></h3>{event.description&&<p>{event.description.replace(/^Synthetic showcase:\s*/,'')}</p>}{event.demo&&<button className="text-button sample-report-link" onClick={()=>onNavigate('demo')}>View sample report <Icon name="arrow" size={13}/></button>}</div>

        <button className="ticket-cta" aria-label={event.demo?'Try event as participant: '+event.name:'Give feedback for '+event.name} onClick={()=>event.demo?onNavigate('try/'+event.id):openEvent(event.id)}>{event.demo?<><span>TRY</span><span>EVENT</span></>:<>SPEAK<br/>UP</>} <Icon name="arrow" size={30}/></button>

      </article>)}</div> : <div className="event-ticket empty-ticket"><div className="ticket-date"><Icon name="calendar" size={33}/><small>UP NEXT</small></div><div className="ticket-body"><span className="ticket-tag">THE STAGE IS QUIET</span><h3>No open events. Yet.</h3><p>When your organiser opens an event, it lands here.<br className="desktop-break"/> Have an invitation? Ask them for the event link.</p></div><button className="ticket-cta" onClick={()=>onNavigate('login')}>SET<br/>ONE UP <Icon name="arrow" size={30}/></button></div>}

      </section>

      <section className="front-note"><div className="note-seal"><Icon name="shield" size={29}/></div><div><h2>YOUR CODE GETS YOU IN.<br/>IT DOESN’T FOLLOW YOU AROUND.</h2><p>Blind signatures separate your invitation from your response. No name or email fields, no tracker scripts. Clear limits, explained in plain language.</p></div><a href="#proof" onClick={()=>onNavigate('proof')}>Read the anonymity proof <Icon name="arrow" size={19}/></a></section>

    </>}

    </main>

    <footer className="front-footer"><span>ClubPulse · anonymous by design</span><div><a href="#proof" onClick={()=>onNavigate('proof')}>See exactly what we store <Icon name="arrow" size={14}/></a><a href="#admin/login" onClick={()=>onNavigate('login')}>Administrator sign-in</a></div></footer>
    {!proof&&<RulerIndex onNavigate={onNavigate}/>}

  </div>;

}

function PrivacyLab({Icon}){
  const [responses,setResponses]=useState(4),[closed,setClosed]=useState(false),[cooled,setCooled]=useState(false),[smallest,setSmallest]=useState(2);
  const enough=responses>=5,report=closed&&cooled&&enough,breakdown=report&&smallest>=5&&responses-smallest>=5;
  const gates=[['Event closed',closed],['Five or more responses',enough],['15-minute cooldown complete',cooled]];
  return <section className="privacy-lab" aria-labelledby="privacy-lab-title"><header><div><span className="eyebrow">INTERACTIVE PRIVACY LAB</span><h2 id="privacy-lab-title">WHAT GETS RELEASED?</h2></div><p>Change the cohort conditions. The same rules are enforced by the reporting API.</p></header><div className="privacy-lab-grid"><div className="lab-controls"><label>Valid responses <strong>{responses}</strong><input type="range" min="0" max="20" value={responses} onChange={e=>{const value=Number(e.target.value);setResponses(value);setSmallest(Math.min(smallest,value));}}/></label><label>Smallest comparison group <strong>{smallest}</strong><input type="range" min="0" max={responses} value={smallest} onChange={e=>setSmallest(Number(e.target.value))}/></label><label className="lab-check"><input type="checkbox" checked={closed} onChange={e=>setClosed(e.target.checked)}/><span><strong>Event is closed</strong><small>The cohort can no longer change.</small></span></label><label className="lab-check"><input type="checkbox" checked={cooled} onChange={e=>setCooled(e.target.checked)}/><span><strong>Cooldown is complete</strong><small>At least 15 minutes have passed.</small></span></label></div><div className={'lab-result '+(report?'released':'protected')}><div className="lab-result-title"><Icon name={report?'check':'lock'} size={25}/><span>{report?'REPORT RELEASED':'REPORT PROTECTED'}</span></div><div className="gate-list">{gates.map(([name,pass])=><div key={name}><span>{pass?'PASS':'WAIT'}</span><p>{name}</p></div>)}</div><div className="lab-output"><strong>Available to organisers</strong><p>{report?'Response total and overall average. Released comments remain separated from ratings and topics.':'Nothing from this cohort is published yet.'}</p><strong>Detailed breakdowns</strong><p>{breakdown?'Available because both the selected group and its complement contain at least five responses.':'Withheld because a group or its complement contains fewer than five responses.'}</p></div></div></div><footer><Icon name="shield" size={16}/><span>This simulator explains the policy. It does not expose or query stored participant responses.</span></footer></section>;
}

