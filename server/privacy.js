import {randomBytes,createHmac} from 'node:crypto';
export const MINIMUM=5;
export const RELEASE_DELAY_MS=15*60*1000;
export const TOPICS=['Content','Delivery','Organisation','Other'];
// One immutable report per event. No response-time series or queryable micro-cohorts.
export function sealReport(rows,{demo=false}={}) {
  if(rows.length<MINIMUM)throw new Error('A report needs at least five responses.');
  const count=rows.length,average=Math.round(rows.reduce((s,r)=>s+r.rating,0)/count*10)/10;
  const positiveCount=rows.filter(r=>r.rating>=4).length;
  const positive=positiveCount>=MINIMUM&&count-positiveCount>=MINIMUM?Math.round(positiveCount/count*100):null;
  function cells(values,key) {
    const counts=values.map(value=>rows.filter(r=>r[key]===value).length);
    // Hold the whole breakdown if any cell is small. Releasing other cells could
    // reveal the hidden cell by subtracting their sum from the published total.
    const releasable=counts.every(n=>n>=MINIMUM&&count-n>=MINIMUM);
    return values.map((value,i)=>({[key]:value,count:releasable?counts[i]:null,suppressed:!releasable}));
  }
  const salt=randomBytes(32);
  const comments=rows.filter(r=>r.comment?.trim()).map(r=>({comment:r.comment,demo:!!r.demo}));
  // Stable only within this frozen report; no insertion order, row IDs, ratings or times.
  comments.sort((a,b)=>createHmac('sha256',salt).update(a.comment).digest('hex').localeCompare(createHmac('sha256',salt).update(b.comment).digest('hex')));
  return {count,average,positive,ratingSum:rows.reduce((s,r)=>s+r.rating,0),positiveCount,distribution:cells([1,2,3,4,5],'rating'),categories:cells(TOPICS,'category'),comments,demo,version:1};
}
export function validateReportQuery(q) {
  const allowed=new Set(['event']);
  return Object.keys(q).every(k=>allowed.has(k)&&typeof q[k]==='string');
}
export function combineReports(events) {
  const reports=events.filter(e=>e.report).map(e=>e.report),count=reports.reduce((s,r)=>s+r.count,0);
  // Never recompute suppressed cells from raw data. Combining cannot undo suppression.
  const combineCells=(key,values,field)=>values.map(value=>{
    const cells=reports.map(r=>r[field].find(c=>c[key]===value));
    const suppressed=!cells.length||cells.some(c=>!c||c.suppressed);
    return {[key]:value,count:suppressed?null:cells.reduce((s,c)=>s+c.count,0),suppressed};
  });
  return {count:count||null,average:count?Math.round(reports.reduce((s,r)=>s+r.ratingSum,0)/count*10)/10:null,positive:count&&reports.every(r=>r.positive!==null)?Math.round(reports.reduce((s,r)=>s+r.positiveCount,0)/count*100):null,distribution:combineCells('rating',[1,2,3,4,5],'distribution'),categories:combineCells('category',TOPICS,'categories'),feedback:events.flatMap(e=>(e.report?.comments||[]).map(c=>({...c,eventId:String(e._id)}))),reportCount:reports.length};
}
export function reportCsv(events) {
  const cell=v=>'"'+String(/^\s*[=+@-]|^[\t\r]/.test(String(v))?"'"+v:v).replaceAll('"','""')+'"';
  return ['Event,Source,Responses,Average rating,Positive percentage,Report version',...events.filter(e=>e.report).map(e=>[e.name,e.report.demo?'DEMO SAMPLE':'Sealed report',e.report.count,e.report.average,e.report.positive??'Protected',e.report.version].map(cell).join(','))].join('\r\n');
}
