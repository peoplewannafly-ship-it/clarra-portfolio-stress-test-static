'use client';
import { useEffect, useRef, useState } from 'react';
import type { SharedRecord } from './data';
import s from './mercury.module.css';

const editUrl = 'https://mercury-content-desk.peoplewannafly.chatgpt.site';
const outbound = { target: '_blank', rel: 'noopener noreferrer' };
const tabs = [['plan', 'Медиаплан'], ['tasks', 'Задачи'], ['reports', 'Отчёты']] as const;
type Tab = typeof tabs[number][0];
const statuses = ['Все статусы', 'План', 'В работе', 'Готов', 'В очереди', 'Опубликован', 'Пауза'];
function date(value: string, time = false) {
  if (!value) return 'Без даты';
  // Planned timestamps are wall-clock Moscow dates without an offset.
  const d = new Date(value.includes('T') ? value + (/(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? '' : '+03:00') : value + 'T12:00:00+03:00');
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Moscow', ...(time ? { hour: '2-digit', minute: '2-digit' } as const : {}) });
}
function Badge({ value }: { value: string }) {
  const color = ['Опубликован', 'Готово'].includes(value) ? s.green : ['Блокер', 'Пауза'].includes(value) ? s.red : ['В работе', 'В очереди'].includes(value) ? s.amber : s.gray;
  return <span className={`${s.badge} ${color}`}><span />{value}</span>;
}

export default function MercuryDesk() {
  const [records, setRecords] = useState<SharedRecord[]>([]);
  const [tab, setTab] = useState<Tab>('plan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Все статусы');
  const busy = useRef(false);
  async function refresh() {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch('/mercury/data.json', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw Error('Не удалось обновить данные доски. Попробуйте позже.');
      const data = await res.json() as { records: SharedRecord[]; checkedAt: string; error?: string };
      if (!res.ok || !Array.isArray(data.records)) throw Error(data.error || 'Не удалось загрузить план.');
      setRecords(data.records); setCheckedAt(data.checkedAt); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось обновить план.'); }
    finally { busy.current = false; setLoading(false); }
  }
  useEffect(() => {
    const readHash = () => { const h = location.hash; setTab(h.startsWith('#report') ? 'reports' : h === '#tasks' ? 'tasks' : 'plan'); };
    readHash(); void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    const visible = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('hashchange', readHash); document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); window.removeEventListener('hashchange', readHash); document.removeEventListener('visibilitychange', visible); };
  }, []);
  function selectTab(next: Tab) {
    setTab(next); setQuery(''); setStatus('Все статусы');
    history.replaceState(null, '', next === 'reports' ? '#report-2026-10-15' : next === 'tasks' ? '#tasks' : '#plan');
  }
  const pins = records.filter(r => r.kind === 'pin').sort((a, b) => a.body.date.localeCompare(b.body.date));
  const tasks = records.filter(r => r.kind === 'task');
  const visible = (tab === 'tasks' ? tasks : pins).filter(r => (status === 'Все статусы' || status === r.body.status) && `${r.id} ${r.body.title} ${r.body.project || ''}`.toLowerCase().includes(query.toLowerCase()));
  const done = pins.filter(r => r.body.status === 'Опубликован').length;
  function csv() {
    const rows = [['ID', 'Дата МСК', 'Проект', 'Заголовок', 'Описание', 'Доска', 'Статус', 'Ссылка с UTM', 'Публикация'], ...pins.map(r => [r.id, r.body.date, r.body.project, r.body.title, r.body.description, r.body.board, r.body.status, r.body.destination, r.body.publishedUrl])];
    const cell = (v: unknown) => { let t = String(v ?? ''); if (/^[=+@-]/.test(t)) t = "'" + t; return '"' + t.replaceAll('"', '""') + '"'; };
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'Mercury-Pinterest-15-21-Oct-2026.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className={s.desk}>
    <header className={s.header}><a href="/mercury/" className={s.brand}>MERCURY<span>BUREAU · CONTENT DESK</span></a><div className={s.headerLinks}><a href="https://mercury-bureau.com/" {...outbound}>Сайт студии ↗</a><a href={editUrl} {...outbound} className={s.editLink}>Редактировать план ↗</a></div></header>
    <main className={s.main}>
      <section className={s.hero}><div><p className={s.eyebrow}>PINTEREST / МОСКВА</p><h1>От интерьера<br />к первой заявке.</h1><p className={s.intro}>Публикации, задачи и фактический результат запуска —<br className={s.desktopBreak} /> в одном рабочем плане для команды Mercury.</p></div><div className={s.week}><span>ПЕРВАЯ НЕДЕЛЯ</span><strong>15—21</strong><p>октября 2026 · МСК</p><span className={s.live}><i />Общий просмотр</span></div></section>
      <section className={s.stats} aria-label="Текущие показатели плана">{[['В медиаплане', pins.length, 'тем на первую неделю'], ['Опубликовано', done, 'с прямой ссылкой на пин'], ['В очереди', pins.filter(r => r.body.status === 'В очереди').length, 'подтверждено в Pinterest'], ['Задач выполнено', tasks.filter(r => r.body.status === 'Готово').length, `из ${tasks.length || '—'} задач`]].map(([label, n, text], i) => <div key={String(label)} className={i === 1 ? s.statAccent : ''}><span>{label}</span><strong>{loading || (!records.length && error) ? '—' : String(n).padStart(2, '0')}</strong><small>{text}</small></div>)}</section>
      <div className={s.navRow}><nav aria-label="Разделы контент-плана">{tabs.map(([key, label]) => <button key={key} className={tab === key ? s.active : ''} aria-pressed={tab === key} onClick={() => selectTab(key)}>{label}{key === 'reports' && <span>01</span>}</button>)}</nav><div className={s.sync} aria-live="polite">{loading ? 'Загружаем данные…' : error ? 'Обновление недоступно' : `Данные на ${new Date(checkedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })} МСК`}<button onClick={() => void refresh()} aria-label="Обновить данные">↻</button></div></div>
      {checkedAt && Date.now()-Date.parse(checkedAt)>7200000 && !error && <div role="status" className={s.error}>Снимок данных старше двух часов. Сверьте последние изменения в рабочей доске.</div>}
      {error && <div role="alert" className={s.error}>{error} {records.length > 0 && 'Показана последняя успешно загруженная версия.'}<button onClick={() => void refresh()}>Повторить</button></div>}
      {tab === 'plan' && <><div className={s.notice}><b>Трафик → Mercury Bureau</b><p>Пин → страница проекта → заявка → звонок → встреча. Даты в плане не означают постановку в очередь: автопостинг пока не подключён.</p></div><div className={s.tools}><input aria-label="Поиск публикаций" placeholder="Найти тему или проект…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Статус публикации" value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(v => <option key={v}>{v}</option>)}</select><button onClick={csv} disabled={!pins.length}>↓ Выгрузить CSV</button></div><div className={s.pinGrid}>{visible.map(r => <Pin key={r.id} r={r} />)}</div>{!visible.length && <p className={s.empty}>{loading ? 'Загружаем медиаплан…' : error ? 'План появится после восстановления соединения.' : 'По выбранным условиям публикаций нет.'}</p>}<p className={s.note}>Регулярность старта: два пина 15 октября, затем по одному в день до 21 октября. У следующих шести тем ещё нужно выбрать и проверить изображения. Это план работы, не гарантия публикации.</p></>}
      {tab === 'tasks' && <><div className={s.sectionHeading}><div><p className={s.eyebrow}>ПОСТИМ · РЕДАКТИРУЕМ · ГЕНЕРИРУЕМ</p><h2>Что нужно довести до запуска</h2></div><p>Статусы обновляются из рабочей доски.</p></div><div className={s.tasks}>{tasks.map(r => <article key={r.id} className={s.task}><span className={s.taskId}>{r.id}</span><div><span className={s.kicker}>{r.body.category}</span><h3>{r.body.title}</h3><p>{r.body.description}</p><small>{r.body.owner || 'Не назначено'} · {date(r.body.due)}</small></div><Badge value={r.body.status} /></article>)}</div>{!tasks.length && <p className={s.empty}>{loading ? 'Загружаем задачи…' : 'Задачи временно недоступны. Попробуйте обновить данные.'}</p>}</>}
      {tab === 'reports' && <Report />}
      <footer className={s.footer}><span>Mercury Bureau × Clarra</span><p>Просмотр доступен по ссылке. Проверяем доску каждые 5 минут.<br />Изменения обычно появляются в течение 5–10 минут; время снимка указано выше.</p><a href={editUrl} {...outbound}>Открыть рабочую доску ↗</a></footer>
    </main>
  </div>;
}

function Pin({ r }: { r: SharedRecord }) {
  const b = r.body;
  return <article className={s.pin}>
    <div className={s.pinVisual}>{b.mediaUrl ? <img src={b.mediaUrl} alt={b.alt || b.title} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <div className={s.placeholder}><span>{r.id.replace('MP', '')}</span><p>Визуал в подборе</p><small>{b.project}</small></div>}<span className={s.imageType}>{b.mediaType}</span></div>
    <div className={s.pinBody}><div className={s.pinMeta}><span>{r.id} · {date(b.date, true)} МСК</span><Badge value={b.status} /></div><p className={s.kicker}>{b.project}</p><h2>{b.title}</h2><p className={s.board}>{b.board}</p><div className={s.checks}>{[['media', 'Визуал'], ['copy', 'Текст'], ['duplicate', 'Дубли'], ['link', 'Ссылка']].map(([key, label]) => <span key={key} className={b.checks?.[key] ? s.checkDone : ''}>{b.checks?.[key] ? '✓' : '○'} {label}</span>)}</div><details><summary>Текст и ссылки <span>＋</span></summary><p className={s.description}>{b.description}</p><div className={s.detailLinks}>{b.destination && <a href={b.destination} {...outbound}>Целевая страница с UTM ↗</a>}{b.source && <a href={b.source} {...outbound}>Источник материала ↗</a>}</div></details>{b.publishedUrl ? <a href={b.publishedUrl} {...outbound} className={s.publishedLink}>Смотреть опубликованный пин <span>↗</span></a> : <div className={s.notPublished}>{b.status === 'В очереди' ? 'Есть подтверждение очереди Pinterest' : 'Публикация ещё не подтверждена'}</div>}</div>
  </article>;
}

function Report() {
  return <article id="report-2026-10-15" className={s.report}>
    <header className={s.reportHead}><div><p className={s.eyebrow}>ОТЧЁТ О ЗАПУСКЕ · 01</p><h2>Первые публикации<br />и рабочая система.</h2><p>Зафиксировано по итогам работы 15 октября 2026 года.<br />Показатели этого отчёта относятся к этой дате.</p></div><time dateTime="2026-10-15">15.10<span>2026 · Москва</span></time></header>
    <div className={s.reportNumbers}><div><strong>02</strong><span>пина опубликованы</span></div><div><strong>02</strong><span>доски созданы</span></div><div><strong>06</strong><span>тем в плане дальше</span></div></div>
    <section className={s.reportBlock}><span className={s.reportIndex}>01</span><div><h3>Что сделано</h3><ul><li>Создан медиаплан на 15–21 октября: 8 публикаций, заголовки, описания, целевые ссылки и 12 задач по запуску.</li><li>Опубликованы два пина из портфолио на сайте Mercury. У каждого — ссылка на соответствующий проект с UTM-метками.</li><li>Созданы доски «Дизайн загородного дома | Mercury» и «Дизайн квартиры в Москве | Mercury». Первый пин перенесён на свою доску без повторной публикации.</li><li>Настроены сохранение карточек, статусы, история изменений, экспорт CSV и защита от одновременной перезаписи одной записи.</li><li>Добавлена общая страница на Clarra: медиаплан, задачи и этот датированный отчёт. Она получает актуальные данные из рабочей доски.</li></ul><div className={s.proofs}><a href="https://ru.pinterest.com/pin/451345193931140198/" {...outbound}><span>MP01 · ДОМ В ПОДМОСКОВЬЕ</span><b>Гостиная в тёмной палитре ↗</b></a><a href="https://ru.pinterest.com/pin/625718942027147882/" {...outbound}><span>MP02 · СЕРДЦЕ СТОЛИЦЫ</span><b>Гостиная с панорамными окнами ↗</b></a></div><p className={s.note}>У MP02 в редакторе был полный заголовок про гостиную. В опубликованном пине отображается название проекта «ЖК „Сердце столицы“».</p></div></section>
    <section className={s.reportBlock}><span className={s.reportIndex}>02</span><div><h3>Что подготовлено, но ещё не запущено</h3><p>Ещё шесть тем распределены по дням 16–21 октября. Для них нужно выбрать оригиналы из портфолио, проверить точные повторы и подготовить финальные изображения. Статус этих карточек — «План».</p><p>Для первых двух публикаций использованы изображения, импортированные с сайта. На следующем этапе нужны исходники лучшего качества: доступные превью были шириной около 504 пикселей.</p></div></section>
    <section className={s.reportBlock}><span className={s.reportIndex}>03</span><div><h3>Следующие действия</h3><ol><li><b>Контент:</b> отобрать оригиналы для MP03–MP08 и сверить их с опубликованным архивом.</li><li><b>Воронка:</b> проверить доставку заявок с сайта ответственному и настроить учёт переходов и целей.</li><li><b>Оформление:</b> завершить описания досок и обновить профиль под Mercury.</li><li><b>Автоматизация:</b> подключить планировщик и проверить полный цикл на одной публикации.</li><li><b>ИИ и архив:</b> после запуска реальных проектов подготовить два явно помеченных ИИ-концепта с проверкой дизайнера; добавить материалы Mail.ru после доступа к папке.</li></ol></div></section>
    <aside className={s.reportNote}><b>Фактический результат на 15.10.2026</b><p>Два пина опубликованы. Автопостинг и генерация изображений ещё не подключены. Полная сверка архива и содержимое Mail.ru не завершены. Доставка заявок и цели аналитики не проверены; подтверждённых данных о лидах пока нет.</p></aside>
  </article>;
}
