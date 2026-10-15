export type SharedRecord = {
  id: string;
  kind: 'pin' | 'task';
  updatedAt: string;
  body: Record<string, any>;
};

// The shared view deliberately includes only the approved launch week.
// New/private records and edit history never become public automatically.
const ids = new Set([
  'MP01', 'MP02', 'MP03', 'MP04', 'MP05', 'MP06', 'MP07', 'MP08',
  'T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12',
]);
const commonFields = ['title', 'description', 'status', 'owner'];
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
