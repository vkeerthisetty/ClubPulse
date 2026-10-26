export function parseActionImport(text,scope){
  const data=JSON.parse(text);
  if(!data||data.scope!==scope||!Array.isArray(data.actions)||data.actions.length>200)throw new Error('Choose an action export for this report scope, with no more than 200 actions.');
  const seen=new Set();
  return data.actions.map(task=>{
    if(!task||typeof task.title!=='string'||!task.title.trim()||task.title.length>250||!['Planned','In progress','Done'].includes(task.status)||typeof task.owner!=='string'||task.owner.length>60||typeof task.due!=='string'||task.due&&!/^\d{4}-\d{2}-\d{2}$/.test(task.due))throw new Error('The file contains an invalid action. Nothing was imported.');
    return {title:task.title.trim(),owner:task.owner,due:task.due,status:task.status};
  }).filter(task=>{const key=JSON.stringify(task);if(seen.has(key))return false;seen.add(key);return true;});
}
