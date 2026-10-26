import mongoose from 'mongoose';
const Event=mongoose.model('CollectorEventV2',new mongoose.Schema({_id:String,name:String,description:String,date:String,open:Boolean,demo:Boolean,publicJwk:Object,releaseAt:Number,writeGuard:String,report:mongoose.Schema.Types.Mixed},{versionKey:false}));
// Explicit collection boundary: no private key, invitation, IP, user-agent, day or timestamp.
const Feedback=mongoose.model('CollectorFeedbackV2',new mongoose.Schema({_id:{type:String,default:()=>crypto.randomUUID()},eventId:String,rating:Number,category:String,comment:String,demo:Boolean,tokenHash:{type:String,unique:true}},{versionKey:false,timestamps:false}));
const memoryEvents=[],memoryFeedback=[];
export async function connect(demo){if(!demo){await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000});await Promise.all([Event.init(),Feedback.init()]);}}
export function store(demo){return {
  async events(){return demo?memoryEvents:Event.find().lean();},
  async event(id){return demo?memoryEvents.find(e=>e._id===id):typeof id==='string'?Event.findById(id).lean():null;},
  async addEvent(e){if(demo){memoryEvents.push(e);return e;}return(await Event.create(e)).toObject();},
  async updateEvent(id,patch){if(demo){const e=memoryEvents.find(e=>e._id===id);if(e)Object.assign(e,patch);}else await Event.updateOne({_id:id},{$set:patch});},
  async editEvent(id,patch){if(demo){const e=memoryEvents.find(e=>e._id===id);if(!e||e.report)return false;Object.assign(e,patch);return true;}const result=await Event.updateOne({_id:id,report:null},{$set:patch});return !!result.matchedCount;},
  async feedback(id){return demo?memoryFeedback.filter(r=>!id||r.eventId===id):Feedback.find(id?{eventId:id}:{}).lean();},
  async addFeedback(row){if(demo){if(!memoryEvents.find(e=>e._id===row.eventId)?.open)throw Object.assign(new Error('Event is closed.'),{status:409});if(memoryFeedback.some(r=>r.tokenHash===row.tokenHash))throw Object.assign(new Error('Token already used.'),{status:409});memoryFeedback.push(row);}else await mongoose.connection.transaction(async session=>{const result=await Event.updateOne({_id:row.eventId,open:true},{$set:{writeGuard:crypto.randomUUID()}},{session});if(!result.matchedCount)throw Object.assign(new Error('Event is closed.'),{status:409});await Feedback.create([row],{session});});},
  async saveReport(id,report){if(demo){const e=memoryEvents.find(e=>e._id===id);if(!e.report&&!e.open&&e.releaseAt<=Date.now())e.report=report;return e.report;}const e=await Event.findOneAndUpdate({_id:id,open:false,report:null,releaseAt:{$lte:Date.now()}},{$set:{report}},{new:true}).lean();return e?.report||(await Event.findById(id).lean())?.report;}
};}
