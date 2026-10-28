import test from 'node:test';
import assert from 'node:assert/strict';
import {chartData} from '../src/chartData.js';
test('charts use sealed aggregates only and retain whole-event scope',()=>{
 const events=[{id:'real',name:'Workshop',date:'2026-10-28',report:{average:3.4,count:5}},{id:'sample',name:'Example',demo:true,report:{average:4.2,count:5}},{id:'hidden',name:'Collecting',reportState:'collecting',count:3,average:5,feedback:[{rating:5}]},{id:'wait',name:'Waiting',reportState:'cooldown'},{id:'small',name:'Invalid small report',report:{average:5,count:2}}];
 const model=chartData(events);assert.equal(model.reports.length,2);assert.equal(model.total,5);assert.equal(model.reports.some(r=>r.id==='hidden'||r.id==='small'),false);assert.equal(model.states.find(s=>s.key==='sample').count,1);
 const scoped=chartData(events,'hidden');assert.equal(scoped.reports.length,0);assert.equal(scoped.states.find(s=>s.key==='collecting').count,1);assert.equal(scoped.maxCount,1);
 assert.equal(chartData(events,'real').reports[0].score,3.4);
 assert.equal(chartData(events,'','score').reports[0].id,'sample');
 assert.deepEqual(chartData([]).reports,[]);assert.equal(chartData([]).total,0);
});
