import {isDeepStrictEqual} from 'node:util';
import {approvedIds,newPinIds} from './approved-ids.mjs';

// Invoked only by an authenticated manual workflow dispatch. Never publishes Pins.
const endpoint='https://mercury-content-desk.peoplewannafly.chatgpt.site/api/records';
const fields=new Set(['title','description','status','owner','date','project','rubric','board','mediaType','alt','publishedAt','publishedUrl','target','destination','source','mediaUrl','checks','scheduleEvidence','notes','category','due','lastAction','nextAction']);
const links=new Set(['publishedUrl','target','destination','source','mediaUrl']);
const hosts=new Set(['pinterest.com','ru.pinterest.com','www.pinterest.com','i.pinimg.com','mercury-bureau.com','www.mercury-bureau.com','disk.yandex.ru']);
const changes=JSON.parse(process.env.BOARD_CHANGES||'null');
if(!Array.isArray(changes)||!changes.length||changes.length>20)throw Error('Expected 1–20 changes');
const seen=new Set();
for(const change of changes){
  if(!change||Object.keys(change).some(k=>!['id','body','operation'].includes(k))||!approvedIds.has(change.id)||seen.has(change.id))throw Error('Invalid or repeated record id');
  if(change.operation!==undefined&&change.operation!=='create')throw Error('Invalid operation');
  if(change.operation==='create'&&(!newPinIds.includes(change.id)||typeof change.body?.title!=='string'||!change.body.title.trim()||change.body.title.length>200||change.body.status!=='План'))throw Error('Creation requires an approved new Pin ID, title and Plan status');
  seen.add(change.id);
  if(!change.body||Array.isArray(change.body)||typeof change.body!=='object'||!Object.keys(change.body).length)throw Error('Expected field patch');
  if(typeof change.body.lastAction!=='string'||!change.body.lastAction.trim()||change.body.lastAction.length>1500||typeof change.body.nextAction!=='string'||change.body.nextAction.length>1000)throw Error('Every action requires a public lastAction summary and nextAction (empty only when finished)');
  for(const [key,value] of Object.entries(change.body)){
    if(!fields.has(key))throw Error('Unexpected field');
    if(key==='checks'){
      if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([k,v])=>!['media','copy','duplicate','link'].includes(k)||typeof v!=='boolean'))throw Error('Invalid checks');
    }else if(typeof value!=='string'||value.length>6000)throw Error('Invalid field value');
    if(links.has(key)&&value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!hosts.has(u.hostname))throw Error('Unapproved link');}
  }
}
if(process.env.VALIDATE_ONLY==='1'){console.log(`Validated ${changes.length} record patches`);process.exit(0);}
const token=process.env.MERCURY_PLAN_READ_TOKEN;if(!token)throw Error('Missing board credential');
async function request(method,body){
 const res=await fetch(endpoint,{method,headers:{'OAI-Sites-Authorization':'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!res.ok)throw Error(`Board ${method} returned ${res.status}; no retry or overwrite`);
 const text=await res.text();if(text.length>2000000)throw Error('Oversized board response');return JSON.parse(text);
}
const before=await request('GET');if(!Array.isArray(before.records))throw Error('Invalid board');
const byId=new Map(before.records.map(r=>[r.id,r]));
// Validate the whole batch before mutation. Creation never replaces an existing ID.
for(const c of changes){
 const r=byId.get(c.id);
 if(c.operation==='create'){if(r)throw Error('Creation ID already exists; read source, do not overwrite');}
 else if(!r||!r.body||!Number.isInteger(r.revision)||r.revision<1)throw Error('Existing versioned record required');
}
for(const c of changes){
 const r=byId.get(c.id)||{id:c.id,kind:'pin',revision:0,body:{}};
 const body={...r.body,...c.body, ...(c.body.checks?{checks:{...r.body.checks,...c.body.checks}}:{})};
 if(isDeepStrictEqual(r.body,body)){console.log(`${c.id}: already applied`);continue;}
 body.lastActionRevision=r.revision+1;
 const result=await request('POST',{id:r.id,kind:r.kind,revision:r.revision,body});
 if(!result.record||result.record.id!==r.id||result.record.revision!==r.revision+1||!isDeepStrictEqual(result.record.body,body))throw Error('Write confirmation mismatch');
 byId.set(c.id,result.record);console.log(`${c.id}: saved revision ${result.record.revision}`);
}
const after=await request('GET');if(after.records.length!==before.records.length+changes.filter(c=>c.operation==='create').length)throw Error('Unexpected record count changed during update');
for(const c of changes){const r=after.records.find(r=>r.id===c.id);if(!r||!isDeepStrictEqual(r.body,byId.get(c.id).body))throw Error('Read-back mismatch');}
console.log(`Verified ${changes.length} patches against the source board`);
