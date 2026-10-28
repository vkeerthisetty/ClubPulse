export function chartData(events=[],scope='',sort='date'){
 const selected=events.filter(e=>!scope||e.id===scope);
 // Never use an event's provisional count or feedback rows to populate a chart.
 const reports=selected.filter(e=>e.report&&Number.isFinite(e.report.average)&&e.report.average>=1&&e.report.average<=5&&Number.isInteger(e.report.count)&&e.report.count>=5).map(e=>({id:e.id,name:e.name,date:e.date||'',sample:!!e.demo,score:e.report.average,count:e.report.count}));
 reports.sort((a,b)=>sort==='score'?b.score-a.score:sort==='responses'?b.count-a.count:b.date.localeCompare(a.date)||a.name.localeCompare(b.name));
 const states=[['released','Released','#667443'],['collecting','Collecting','#827592'],['cooldown','Cooling down','#b27b43'],['protected','Protected','#a3a1a2'],['sample','Sample reports','#b4bdd0']].map(([key,label,color])=>({key,label,color,count:selected.filter(e=>(e.demo?'sample':e.report?'released':e.reportState||'collecting')===key).length}));
 return {reports,states,total:selected.length,maxCount:Math.max(1,...reports.map(r=>r.count))};
}
