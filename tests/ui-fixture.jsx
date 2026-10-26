// Local browser fixture only. Vite's production entry never imports this file.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {CompareReports,ActionBoard} from '../src/ReportStudio.jsx';
import Icon from '../src/PixelIcon.jsx';
import EventWorkspace from '../src/EventWorkspace.jsx';
import '../src/design.css';
import '../src/dashboard.css';
import '../src/atelier.css';
import '../src/lucid.css';
const events=[{id:'baseline',name:'Local test baseline',report:{average:3.6,count:10}},{id:'followup',name:'Local test follow-up',report:{average:4.2,count:12}}];
createRoot(document.getElementById('root')).render(<main className="content"><p>Isolated local test fixture. These numbers are not participant data and are not published to ClubPulse.</p><CompareReports events={events} Icon={Icon}/><ActionBoard scope="browser-verification" suggestions={[{title:'Clarify the briefing',action:'Publish the schedule before the event.'}]} Icon={Icon}/><EventWorkspace events={[{id:'sample',name:'Read-only sample fixture',date:'2026-10-26',demo:true,open:true,description:'Local test fixture'}]} data={{demo:false,events:[{id:'sample',report:{count:5}}]}} Icon={Icon}/></main>);
