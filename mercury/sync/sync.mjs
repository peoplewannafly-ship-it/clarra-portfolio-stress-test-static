import {readFile,writeFile,rename} from 'node:fs/promises';
import {projectRecords,projectActivity} from './projection.ts';
import {launchIds} from './approved-ids.mjs';
const token=process.env.MERCURY_PLAN_READ_TOKEN;
if(!token)throw Error('Mercury source credential is missing');
const source='https://mercury-content-desk.peoplewannafly.chatgpt.site/api/records';
try {
 const response=await fetch(source,{headers:{'OAI-Sites-Authorization':'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Mercury source HTTP '+response.status);
 const body=await response.text();if(body.length>2000000)throw Error('Oversized source');
 const upstream=JSON.parse(body);
 const records=projectRecords(upstream.records).sort((a,b)=>a.id.localeCompare(b.id));
 if(launchIds.some(id=>!records.some(r=>r.id===id)))throw Error('Incomplete launch record set');
 const path='mercury/data.json';let old=null;
 try{old=JSON.parse(await readFile(path,'utf8'));}catch{}
 const activity=projectActivity(upstream.history,upstream.records,old?.activity);
 if(old&&JSON.stringify(old.records)===JSON.stringify(records)&&JSON.stringify(old.activity)===JSON.stringify(activity)&&Date.now()-Date.parse(old.checkedAt)<3600000){console.log('Source checked; approved records and activity unchanged');process.exit(0);}
 const data=JSON.stringify({records,activity,checkedAt:new Date().toISOString()},null,2)+'\n';
 if(data.includes(token))throw Error('Credential projection rejected');
 await writeFile(path+'.tmp',data);await rename(path+'.tmp',path);
 console.log(`Updated approved snapshot: ${records.filter(r=>r.kind==='pin').length} pins, ${records.filter(r=>r.kind==='task').length} tasks, ${activity.length} public actions`);
}catch(e){console.error(e instanceof Error?e.message:'Mercury sync failed');process.exit(1);}
