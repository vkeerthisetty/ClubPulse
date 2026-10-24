import React from 'react';



export default function Front({events, config, onNavigate, Logo, Icon, proof}) {

  const open = events.filter(event => event.open);

  const openEvent = id => { location.hash = 'submit/' + id; onNavigate('submit/' + id); };

  return <div className="front-page">

    <header className="front-header"><Logo/><nav aria-label="Main navigation">

      <a className={!proof?'selected':''} href="#" onClick={()=>onNavigate('home')}>Events</a>

      <a className={proof?'selected':''} href="#proof" onClick={()=>onNavigate('proof')}>Anonymity proof</a>

      <a href="#demo" onClick={()=>onNavigate('demo')}>Demo report</a>

      <a className="backstage-link" href="#admin/login" onClick={()=>onNavigate('login')}>Administrator sign-in <Icon name="arrow" size={17}/></a>

    </nav></header>

    <main className="front-main">

    {proof ? <>

      <section className="proof-hero"><span className="eyebrow">PRIVACY WITHOUT THE FINE-PRINT TRICKS</span><h1>DON’T TAKE<br/>OUR <em>word.</em><br/><mark>CHECK THE FLOW.</mark></h1><p>Anonymous feedback should come with an explanation. Here is exactly how your invitation becomes a response without carrying your code along.</p></section>

      <div className="proof-flow">{[

        ['01','THE INVITATION','Your organiser gives you a random, one-use code. The database stores a hash of that code, not your name or email.'],

        ['02','THE BLIND SIGNATURE','Your browser creates and blinds a random token. A separate issuer checks your invitation and signs the blinded value. The collector holds only the public key. Local preview uses two listeners on this computer; production requires separate origins.'],

        ['03','THE RESPONSE','Your browser unblinds the signature. Your feedback is submitted with this token and signature. Your invitation code, account cookies and referrer are omitted.'],

        ['04','THE ONE-USE CHECK','The collector verifies a token once. Reports release only after the event closes, a 15-minute cooldown and at least five responses. No live individual updates.']

      ].map(([n,t,p])=><article key={n}><span>{n}</span><div><h2>{t}</h2><p>{p}</p></div></article>)}</div>

      <section className="proof-storage"><div><span className="eyebrow">THE FEEDBACK RECORD</span><h2>WHAT WE STORE.</h2><p>Event ID, rating, topic, comment, random record ID, and a one-use token hash. No submission date, time, IP or browser metadata is stored in feedback records.</p><span className="record-label">NO NAME / NO EMAIL / NO INVITATION CODE</span></div><div><span className="eyebrow">THE REAL-WORLD LIMITS</span><h2>WHAT THIS CAN’T HIDE.</h2><p>Hosting providers can see network metadata. Timing and identifying comments can reveal information. The whole application has not been independently audited.</p><p>Implemented with Cloudflare’s RFC 9474 library. This explains the design; it is not a claim of perfect anonymity.</p></div></section>

      <button className="primary proof-return" onClick={()=>onNavigate('home')}>Find your event <Icon name="arrow"/></button>

    </> : <>

      <section className="front-hero">

        <span className="eyebrow">ANONYMOUS FEEDBACK FOR CLUB EVENTS</span>

        <h1><span className="hero-first">SAY IT <em>straight.</em></span><span className="hero-second">MAKE IT <mark>BETTER.</mark></span></h1>

        <p>Sign in with your event code. No names on your feedback. Tell your organisers what worked, what didn’t, and what the next event could do better. <a href="#proof" onClick={()=>onNavigate('proof')}>See how anonymity works <Icon name="arrow" size={22}/></a></p>

      </section>

      <section className="access-entrances" aria-label="Choose your access"><div><span className="eyebrow">FOR ATTENDEES</span><h2>PARTICIPANT SIGN-IN</h2><p>Your event code opens anonymous feedback. No email or password required.</p><button className="primary" onClick={()=>onNavigate('submit')}>Enter with event code <Icon name="arrow" size={18}/></button></div><div><span className="eyebrow">FOR AUTHORISED ORGANISERS</span><h2>ADMINISTRATOR SIGN-IN</h2><p>Your club credentials open event management, invitations and protected reports.</p><button className="button" onClick={()=>onNavigate('login')}>Administrator sign-in <Icon name="lock" size={18}/></button></div></section>
      <section className="reviewer-demo"><div><span className="eyebrow">VISITING FOR A PRODUCT REVIEW?</span><h2>EXPLORE A COMPLETE REPORT.</h2><p>Open a read-only dashboard with four sample events, twenty synthetic responses and the privacy controls explained in context. No account or event code required.</p></div><button className="primary" onClick={()=>onNavigate('demo')}>Explore the guided demo <Icon name="arrow" size={18}/></button></section>
      <section className="front-steps" aria-label="How it works">{[

        ['1','Pick your event','Find your workshop below. Your organiser gives you a one-use invitation code.'],

        ['2','Say what you think','Exchange your code privately. Leave a rating, choose a topic, and tell it straight.'],

        ['3','Shape the next one','Your organisers see the feedback, not your invitation. Give them something they can act on.']

      ].map(([n,t,p])=><article key={n}><span>{n}</span><h2>{t}</h2><p>{p}</p></article>)}</section>

      <section className="front-events" aria-labelledby="open-events"><div className="section-rule"><h2 id="open-events">OPEN EVENTS</h2><span/>{config.demo&&<small>LOCAL PREVIEW</small>}</div>

      {open.length ? <div className="ticket-list">{open.map(event=><article className="event-ticket" key={event.id}>

        <div className="ticket-date"><strong>{new Date(event.date+'T12:00:00').getDate()}</strong><span>{new Date(event.date+'T12:00:00').toLocaleString('en',{month:'short'})}</span><small>{event.date.slice(0,4)}</small></div>

        <div className="ticket-body"><div className="ticket-labels"><span className="ticket-tag">CODE NEEDED</span>{event.demo&&<span className="ticket-tag demo-tag">DEMO EVENT</span>}</div><h3>{event.name}</h3>{event.description&&<p>{event.description}</p>}</div>

        <button className="ticket-cta" aria-label={event.demo?'View sample report for '+event.name:'Give feedback for '+event.name} onClick={()=>event.demo?onNavigate('demo'):openEvent(event.id)}>{event.demo?<><span>VIEW</span><span>REPORT</span></>:<>SPEAK<br/>UP</>} <Icon name="arrow" size={30}/></button>

      </article>)}</div> : <div className="event-ticket empty-ticket"><div className="ticket-date"><Icon name="calendar" size={33}/><small>UP NEXT</small></div><div className="ticket-body"><span className="ticket-tag">THE STAGE IS QUIET</span><h3>No open events. Yet.</h3><p>When your organiser opens an event, it lands here.<br className="desktop-break"/> Have an invitation? Ask them for the event link.</p></div><button className="ticket-cta" onClick={()=>onNavigate('login')}>SET<br/>ONE UP <Icon name="arrow" size={30}/></button></div>}

      </section>

      <section className="front-note"><div className="note-seal"><Icon name="shield" size={29}/></div><div><h2>YOUR CODE GETS YOU IN.<br/>IT DOESN’T FOLLOW YOU AROUND.</h2><p>Blind signatures separate your invitation from your response. No name or email fields, no tracker scripts. Clear limits, explained in plain language.</p></div><a href="#proof" onClick={()=>onNavigate('proof')}>Read the anonymity proof <Icon name="arrow" size={19}/></a></section>

    </>}

    </main>

    <footer className="front-footer"><span>ClubPulse · anonymous by design</span><div><a href="#proof" onClick={()=>onNavigate('proof')}>See exactly what we store <Icon name="arrow" size={14}/></a><a href="#admin/login" onClick={()=>onNavigate('login')}>Administrator sign-in</a></div></footer>

  </div>;

}

