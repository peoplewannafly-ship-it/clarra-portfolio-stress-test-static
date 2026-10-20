import {approvedIds} from './approved-ids.mjs';
export type SharedRecord = {
  id: string;
  kind: 'pin' | 'task';
  updatedAt: string;
  body: Record<string, any>;
};

// Only the explicitly approved records and their public action summaries are shared.
const ids = approvedIds;
const commonFields = ['title', 'description', 'status', 'owner', 'nextAction'];
const pinFields = ['date', 'project', 'rubric', 'board', 'mediaType', 'alt', 'publishedAt'];
const taskFields = ['category', 'due'];
const allowedHosts = new Set(['mercury-bureau.com', 'www.mercury-bureau.com', 'ru.pinterest.com', 'www.pinterest.com', 'pinterest.com', 'disk.yandex.ru', 'cloud.mail.ru']);
function safeLink(value: unknown, image = false): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (image ? url.hostname === 'i.pinimg.com' : allowedHosts.has(url.hostname)) ? url.href : '';
  } catch { return ''; }
}

export type Activity = {id: string; recordId: string; kind: 'pin' | 'task'; at: string; title: string; status: string; detail: string; nextAction: string; publishedUrl: string};
const statuses = new Set(['План','К выполнению','В работе','Готов','Готово','В очереди','Опубликован','Пауза','Блокер']);
export function publishedLink(value: unknown): string {
  const link = safeLink(value);
  if (!link) return '';
  const url = new URL(link);
  return /^(?:ru\.|www\.)?pinterest\.com$/.test(url.hostname) && /^\/pin\/\d+\/?$/.test(url.pathname) ? link : '';
}
export function projectActivity(input: unknown, sourceRecords: unknown, previous: unknown = []): Activity[] {
  if (!Array.isArray(input) || !Array.isArray(sourceRecords)) throw Error('Invalid upstream history');
  const records = new Map(projectRecords(sourceRecords).map(r => [r.id, r]));
  const raw = new Map(sourceRecords.map(r => [r.id, r]));
  const output = new Map<string, Activity>();
  // Keep previously captured public summaries when the source's 30-row window advances.
  if (Array.isArray(previous)) for (const item of previous) {
    const r = records.get(item?.recordId);
    if (!r || !/^history-\d+$/.test(item?.id) || !Number.isFinite(Date.parse(item.at)) || !statuses.has(item.status)) continue;
    output.set(item.id, {id:item.id, recordId:r.id, kind:r.kind, at:item.at, title:String(item.title || '').slice(0,200), status:item.status, detail:String(item.detail || '').slice(0,1500), nextAction:String(item.nextAction || '').slice(0,1000), publishedUrl:item.status === 'Опубликован' ? publishedLink(item.publishedUrl) : ''});
  }
  for (const h of input) {
    const r = records.get(h?.record_id);
    if (!r || !Number.isSafeInteger(h.id) || h.id < 1 || !Number.isFinite(Date.parse(h.created_at)) || typeof h.action !== 'string') continue;
    const split = h.action.lastIndexOf(' · ');
    const title = h.action.slice(0,split).trim();
    const status = h.action.slice(split+3);
    if (split < 1 || title.length > 200 || !statuses.has(status)) continue;
    const id = `history-${h.id}`;
    if (output.has(id)) continue;
    const source = raw.get(r.id);
    const latest = source?.updatedAt === h.created_at;
    const explicitAction = latest && source.body.lastActionRevision === source.revision;
    output.set(id, {id,recordId:r.id,kind:r.kind,at:h.created_at,title,status,
      detail:explicitAction && typeof source.body.lastAction === 'string' ? source.body.lastAction.slice(0,1500) : '',
      nextAction:explicitAction ? r.body.nextAction.slice(0,1000) : '',
      publishedUrl:status === 'Опубликован' ? publishedLink(r.body.publishedUrl) : ''});
  }
  return [...output.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||Number(b.id.slice(8))-Number(a.id.slice(8))).slice(0,100);
}
export function projectRecords(input: unknown): SharedRecord[] {
  if (!Array.isArray(input)) throw Error('Invalid upstream data');
  const seen = new Set<string>();
  return input.filter(r => {
    if (!ids.has(r?.id) || seen.has(r.id) || r.kind !== (r.id.startsWith('MP') ? 'pin' : 'task') || !r.body || typeof r.body !== 'object') return false;
    seen.add(r.id); return true;
  }).map(r => {
    const body: Record<string, any> = {};
    for (const field of [...commonFields, ...(r.kind === 'pin' ? pinFields : taskFields)]) {
      body[field] = typeof r.body[field] === 'string' ? r.body[field].slice(0, 5000) : '';
    }
    if (r.kind === 'pin') {
      for (const field of ['publishedUrl', 'target', 'destination', 'source']) body[field] = safeLink(r.body[field]);
      body.mediaUrl = safeLink(r.body.mediaUrl, true);
      body.checks = Object.fromEntries(['media', 'copy', 'duplicate', 'link'].map(key => [key, r.body.checks?.[key] === true]));
    }
    return { id: r.id, kind: r.kind, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : '', body };
  });
}
