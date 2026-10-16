import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {projectRecords,projectActivity} from '../projection.ts';
const at='2026-10-16T18:35:00.000Z';
const pin={id:'MP03',kind:'pin',revision:4,updatedAt:at,body:{title:'Гостиная',status:'Опубликован',description:'Публичный текст',publishedUrl:'https://ru.pinterest.com/pin/625718942027164655/',lastAction:'Проверен живой пин и его целевая ссылка.',lastActionRevision:4,nextAction:'Проверить переходы через неделю.',notes:'PRIVATE',metrics:{leads:99},checks:{media:true}}};
const event={id:12,record_id:'MP03',created_at:at,action:'Гостиная · Опубликован',private:'SECRET'};
test('only approved public fields and history survive projection',()=>{
 const records=projectRecords([pin,{...pin,id:'MP99'},{...pin,id:'T01'},pin]);
 assert.equal(records.length,1);assert.equal(records[0].body.nextAction,pin.body.nextAction);
 assert(!JSON.stringify(records).includes('PRIVATE'));assert(!('lastActionRevision' in records[0].body));
 const activity=projectActivity([event,{...event,id:13,record_id:'MP99'}],[pin]);
 assert.equal(activity.length,1);assert.equal(activity[0].detail,pin.body.lastAction);
 assert.equal(activity[0].publishedUrl,pin.body.publishedUrl);assert(!JSON.stringify(activity).includes('SECRET'));
});
test('history retains original summaries, deduplicates, and survives upstream window rotation',()=>{
 const first=projectActivity([event],[pin]);
 const next={...pin,revision:5,updatedAt:'2026-10-17T10:00:00.000Z',body:{...pin.body,lastAction:'Новая проверка.',lastActionRevision:5}};
 const e2={...event,id:20,created_at:next.updatedAt};
 const merged=projectActivity([e2],[next],first);
 assert.equal(merged.length,2);assert.equal(merged[1].detail,pin.body.lastAction);
 assert.deepEqual(projectActivity([e2],[next],merged),merged);
});
test('manual edits cannot inherit an earlier action summary',()=>{
 const edited={...pin,revision:5};
 assert.equal(projectActivity([event],[edited])[0].detail,'');
});
test('invalid history and unsafe publication links are excluded',()=>{
 const bad={...pin,body:{...pin.body,publishedUrl:'https://mercury-bureau.com/not-a-pin'}};
 const result=projectActivity([event,{...event,id:0},{...event,id:3,created_at:'bad'},{...event,id:4,action:'PRIVATE'}],[bad]);
 assert.equal(result.length,1);assert.equal(result[0].publishedUrl,'');
 assert.throws(()=>projectActivity(undefined,[pin]));
 const queued={...event,action:'Гостиная · В очереди'};
 assert.equal(projectActivity([queued],[pin])[0].publishedUrl,'');
});
test('updates require an action summary and next step, and reject internal metadata',()=>{
 const run=body=>spawnSync(process.execPath,['mercury/sync/update.mjs'],{encoding:'utf8',env:{...process.env,VALIDATE_ONLY:'1',BOARD_CHANGES:JSON.stringify([{id:'MP03',body}])}});
 assert.equal(run({lastAction:'Проверен пин.',nextAction:'Проверить статистику.'}).status,0);
 assert.notEqual(run({status:'Опубликован'}).status,0);
 assert.notEqual(run({lastAction:'ok',nextAction:'',lastActionRevision:4}).status,0);
});
