import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='..';
await mkdir(out,{recursive:true});
const result=await build({entryPoints:['main.tsx'],bundle:true,write:false,outdir:out,minify:true,jsx:'automatic',format:'esm',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
const assets={};
for(const file of result.outputFiles){const ext=file.path.endsWith('.css')?'css':'js';const name='app-'+createHash('sha256').update(file.contents).digest('hex').slice(0,12)+'.'+ext;await writeFile(out+'/'+name,file.contents);assets[ext]=name;}
await writeFile(out+'/index.html',`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin-when-cross-origin"><title>Mercury · Pinterest — медиаплан и отчёты</title><meta name="description" content="План публикаций, задачи и отчёт о запуске Pinterest для Mercury Bureau."><style>html,body{margin:0}body{background:#f6f5f0}</style><link rel="stylesheet" href="/mercury/${assets.css}"><script type="module" src="/mercury/${assets.js}"></script></head><body><div id="root"></div><noscript>Для обновления медиаплана включите JavaScript.</noscript></body></html>`);
console.log(JSON.stringify({assets}));
