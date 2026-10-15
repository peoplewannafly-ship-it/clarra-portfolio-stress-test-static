import {readFile,writeFile,rename} from 'node:fs/promises';
import {projectRecords} from './projection.ts';
const token=process.env.MERCURY_PLAN_READ_TOKEN;
if(!token)throw Error('Mercury source credential is missing');
const source='https://mercury-content-desk.peoplewannafly.chatgpt.site/api/records';
try {
 const response=await fetch(source,{headers:{'OAI-Sites-Authorization':'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Mercury source HTTP '+response.status);
 const body=await response.text();if(body.length>2000000)throw Error('Oversized source');
 const records=projectRecords(JSON.parse(body).records).sort((a,b)=>a.id.localeCompare(b.id));
 if(records.length!==20)throw Error('Incomplete approved record set');
 const path='mercury/data.json';let old=null;
 try{old=JSON.parse(await readFile(path,'utf8'));}catch{}
 if(old&&JSON.stringify(old.records)===JSON.stringify(records)&&Date.now()-Date.parse(old.checkedAt)<3600000){console.log('Source checked; approved records unchanged');process.exit(0);}
 const data=JSON.stringify({records,checkedAt:new Date().toISOString()},null,2)+'\n';
 if(data.includes(token))throw Error('Credential projection rejected');
 await writeFile(path+'.tmp',data);await rename(path+'.tmp',path);
 console.log('Updated approved snapshot: 8 pins, 12 tasks');
}catch(e){console.error(e instanceof Error?e.message:'Mercury sync failed');process.exit(1);}
