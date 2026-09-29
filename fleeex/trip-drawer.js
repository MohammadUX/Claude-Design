/* Fleeex trip drawers. Needs driver-drawer.js (shared .fxd drawer styles). Matches the Figma "Trip drawer" set:
   Create · New trip (one form: crew & vehicles, when, route, details; missing route), Trip details (in transit, delayed, loading,
   assigned, needs a driver), End trip, Completed.
   API:
     FxTrip.details(trip, ctx)   trip = see normalise() below
     FxTrip.create(ctx)          ctx.drivers({sH,eH}), ctx.tractors, ctx.trailers, ctx.tractorOf(id), ctx.clients, ctx.clientHint, ctx.onCreate(data), ctx.preset
     FxTrip.close()                                                                                     */
(function () {
  const css = `
.fxt-hd{padding:8px 20px 16px}
.fxt-title{font-size:20px;font-weight:500;letter-spacing:-.02em;line-height:1.25}
.fxt-sub{font-size:13px;color:#A29D97;margin-top:3px}
.fxt-hd .fxd-status{margin-top:10px}
.fxt-body{flex:1;overflow:auto;padding:4px 20px 20px;display:flex;flex-direction:column;gap:20px;scrollbar-width:thin;scrollbar-color:#333 transparent}
.fxt-sec{display:flex;flex-direction:column;gap:10px}
.fxt-h{display:flex;justify-content:space-between;align-items:baseline;margin:0;font-size:11.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#8A847E}
.fxt-h small{font-size:12px;letter-spacing:0;text-transform:none;font-weight:400}
.fxt-card{padding:14px 16px;border-radius:16px;background:#1C1B19;display:flex;flex-direction:column;gap:2px}
.fxt-card .r{font-size:15.5px;font-weight:500;display:flex;align-items:center;gap:8px}
.fxt-card .s{font-size:12.5px;color:#A29D97}
.fxt-card .acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.fxt-pillbtn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,244,234,.14)!important;font-size:13px;font-weight:500}
.fxt-pillbtn:hover{background:#272523!important}
.fxt-stops{display:flex;flex-direction:column}
.fxt-stop{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:12px}
.fxt-rail{display:flex;flex-direction:column;align-items:center}
.fxt-rail i{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,244,234,.4);margin-top:3px;flex:none}
.fxt-rail i.done{background:#F2EFEB;border-color:#F2EFEB}
.fxt-rail b{flex:1;width:2px;background:rgba(255,244,234,.12);margin:4px 0}
.fxt-stop .k{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8A847E}
.fxt-stop .p{font-size:14px;font-weight:500}
.fxt-stop .a{font-size:12.5px;color:#A29D97;padding-bottom:14px}
.fxt-stop .w{font-size:12.5px;font-weight:500;color:#C9C3BD;white-space:nowrap}
.fxt-person{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,244,234,.07)!important;text-align:left;width:100%}
.fxt-person:hover{background:#1C1B19!important}
.fxt-av{position:relative;flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#272523;font-size:13px;font-weight:600}
.fxt-av i{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:var(--t);box-shadow:0 0 0 2px #151413}
.fxt-person .n{font-size:14px;font-weight:500}.fxt-person .d{font-size:12.5px;color:#A29D97}
.fxt-kv{display:grid;grid-template-columns:96px minmax(0,1fr);font-size:13.5px;row-gap:2px}
.fxt-kv dt{color:#8A847E;padding:7px 0}.fxt-kv dd{margin:0;padding:7px 0}
.fxt-doc{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;padding:6px 0}
.fxt-doc .ic{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,244,234,.12);display:grid;place-items:center;color:#C9C3BD}
.fxt-doc .n{font-size:13.5px;font-weight:500}.fxt-doc .d{font-size:12px;color:#8A847E}
.fxt-field{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}
.fxt-field>label{font-size:12.5px;font-weight:500;color:#C9C3BD}
.fxt-field>label em{font-style:normal;color:#FF6A2B;margin-left:3px}
.fxt-in{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:10px;background:#1C1B19;border:1px solid rgba(255,244,234,.12);color:#8A847E}
.fxt-in:focus-within{border-color:#FF6A2B;box-shadow:0 0 0 3px rgba(255,106,43,.25)}
.fxd .fxt-in :focus-visible{outline:none}
.fxt-in input,.fxt-in select,.fxt-in textarea{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;color:#F2EFEB;font:inherit;font-size:14px;appearance:none;-webkit-appearance:none}
.fxt-in select{cursor:pointer}.fxt-in select option{background:#1C1B19;color:#F2EFEB}
.fxt-in input::placeholder,.fxt-in textarea::placeholder{color:#8A847E}
.fxt-in.tall{height:auto;padding:10px 12px;align-items:flex-start}.fxt-in textarea{height:44px;resize:none}
.fxt-in input[type=date]::-webkit-calendar-picker-indicator,.fxt-in input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.7)}
.fxt-field.is-error .fxt-in{border-color:rgba(229,72,77,.8);box-shadow:none}
.fxt-err{display:flex;align-items:center;gap:5px;font-size:12px;color:#E5484D}
.fxt-hint{font-size:12px;color:#8A847E}
.fxt-row{display:flex;gap:12px}
.fxt-add{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:500;color:#C9C3BD;align-self:flex-start}
.fxt-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:12px 14px;border-radius:12px;background:#1C1B19}
.fxt-sum span{display:block;font-size:12px;color:#8A847E}.fxt-sum b{font-size:15px;font-weight:500}
.fxt-banner{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid rgba(229,72,77,.4);font-size:13px}
.fxt-banner svg{color:#E5484D;flex:none}
.fxt-opts{display:flex;flex-direction:column;gap:6px}
.fxt-opt{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,244,234,.07)!important;text-align:left;width:100%}
.fxt-opt:hover:not(:disabled){background:#1C1B19!important}
.fxt-opt[aria-checked=true]{border-color:#FF6A2B!important;background:rgba(241,90,36,.06)!important}
.fxt-opt:disabled{opacity:.55;cursor:not-allowed}
.fxt-radio{width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(255,244,234,.25);flex:none}
.fxt-opt[aria-checked=true] .fxt-radio{border:5px solid #FF6A2B}
.fxt-opt .t{flex:1;min-width:0}.fxt-opt .n{font-size:14px;font-weight:500}.fxt-opt .d{font-size:12.5px;color:#A29D97}
.fxt-opt .d.ok{color:#4CAF6A}.fxt-opt .d.bad{color:#E5484D}
.fxt-tag{font-size:11.5px;font-weight:500;color:#C9C3BD;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,244,234,.12);white-space:nowrap}
.fxt-review{border-radius:14px;background:#1C1B19;padding:4px 14px}
.fxt-review div{display:grid;grid-template-columns:70px minmax(0,1fr);gap:8px;padding:9px 0;border-bottom:1px solid rgba(255,244,234,.07);font-size:13.5px}
.fxt-review div:last-child{border-bottom:0}.fxt-review dt{color:#8A847E;font-size:13px}.fxt-review dd{margin:0}
.fxt-profit{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,244,234,.07)}
.fxt-profit span{font-size:13px;color:#A29D97}.fxt-profit small{display:block;font-size:12px;color:#8A847E}.fxt-profit b{font-size:20px;font-weight:500}
.fxt-seg{display:grid;grid-template-columns:repeat(4,1fr);padding:3px;border-radius:12px;background:#1C1B19;border:1px solid rgba(255,244,234,.07)}
.fxt-seg button{padding:8px 0;border-radius:9px;font-size:13px;font-weight:500;color:#8A847E}
.fxt-seg button[aria-pressed=true]{background:#272523;color:#F2EFEB}
.fxt-total{display:flex;justify-content:space-between;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,244,234,.07);font-size:14px}
.fxt-total span{font-size:13px;color:#A29D97}
.fxt-upload{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1px dashed rgba(255,244,234,.16);cursor:pointer}
.fxt-upload .n{font-size:13.5px;font-weight:500}.fxt-upload .d{font-size:12px;color:#8A847E}
.fxt-upload input{position:absolute;width:1px;height:1px;opacity:0}
.fxt-done{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:#1C1B19}
.fxt-check{width:36px;height:36px;border-radius:50%;border:1px solid rgba(76,175,106,.5);display:grid;place-items:center;color:#4CAF6A;flex:none}
.fxt-nums{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fxt-nums div{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,244,234,.07)}
.fxt-nums span{display:block;font-size:12px;color:#8A847E}.fxt-nums b{font-size:17px;font-weight:500}
.fxt-lines div{display:flex;justify-content:space-between;padding:7px 0;font-size:13.5px;color:#A29D97}
.fxt-lines div b{font-weight:400;color:#F2EFEB}
.fxt-lines div.tot{border-top:1px solid rgba(255,244,234,.07);padding-top:10px;color:#F2EFEB;font-weight:500}.fxt-lines div.tot b{font-weight:600}
.fxt-pay{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,244,234,.07);font-size:13.5px;font-weight:500}
.fxt-pay i{width:7px;height:7px;border-radius:50%;background:var(--t)}.fxt-pay span{flex:1}.fxt-pay small{font-size:12px;color:#8A847E;font-weight:400}
.fxt-foot{display:flex;gap:8px;align-items:center;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,244,234,.07)}
.fxt-foot .sp{flex:1}
.fxt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,244,234,.12)!important;font-size:14px;font-weight:500;white-space:nowrap}
.fxt-btn:hover{background:#1C1B19!important}
.fxt-btn.grow,.fxd-primary.grow{flex:1}
.fxt-foot .fxd-primary{flex:none;padding:0 16px}.fxt-foot .fxd-primary.grow{flex:1}
.fxt-foot .fxd-primary[aria-disabled=true]{opacity:.45}
.fxt-warn{color:#E5484D}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const P = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h0"/>', chev: '<path d="M9 6l6 6-6 6"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>', send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>', coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2A3 3 0 0 0 12 8c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-2.6-1.3M12 6.5v11"/>'
  };
  const ic = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (n, d = 0) => '€' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const TONE = { transit: '#4CAF6A', delayed: '#E5484D', loading: '#E0A23A', assigned: '#8A847E', completed: '#57524D', unassigned: '#F15A24' };
  const LABEL = { transit: 'In transit', loading: 'Loading', assigned: 'Assigned', completed: 'Completed', unassigned: 'Needs a driver' };

  /* ---- route estimates from city coordinates (road distance ≈ straight line × 1.3) */
  const CITY = { prato: [43.88, 11.1], florence: [43.77, 11.25], firenze: [43.77, 11.25], bologna: [44.49, 11.34], verona: [45.44, 10.99], milan: [45.46, 9.19], milano: [45.46, 9.19], rome: [41.9, 12.5], roma: [41.9, 12.5], naples: [40.85, 14.27], napoli: [40.85, 14.27], livorno: [43.55, 10.31], pisa: [43.72, 10.4], genoa: [44.41, 8.93], genova: [44.41, 8.93], turin: [45.07, 7.69], torino: [45.07, 7.69], parma: [44.8, 10.33], lucca: [43.84, 10.5], 'la spezia': [44.1, 9.82], siena: [43.32, 11.33], arezzo: [43.46, 11.88], perugia: [43.11, 12.39], empoli: [43.72, 10.95], piacenza: [45.05, 9.69], brescia: [45.54, 10.21], bolzano: [46.5, 11.35], trento: [46.07, 11.12], ancona: [43.62, 13.52], venezia: [45.44, 12.33], venice: [45.44, 12.33], trieste: [45.65, 13.78], ferrara: [44.84, 11.62], padova: [45.41, 11.88] };
  function cityOf(txt) { const t = (txt || '').toLowerCase(); let best = null; for (const k of Object.keys(CITY)) if (t.includes(k) && (!best || k.length > best.length)) best = k; return best; }
  const cap = s => s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '';
  function estimate(a, b) {
    const ca = cityOf(a), cb = cityOf(b); if (!ca || !cb) return null;
    const [la1, lo1] = CITY[ca], [la2, lo2] = CITY[cb], R = 6371, r = x => x * Math.PI / 180;
    const d = 2 * R * Math.asin(Math.sqrt(Math.sin(r(la2 - la1) / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2));
    const km = Math.max(15, Math.round(d * 1.3 / 5) * 5), hrs = km / 72;
    return { km, hrs, tolls: Math.round(km * 0.12), from: cap(ca), to: cap(cb) };
  }
  const dur = h => `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}m`;
  const toH = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h + m / 60; };
  const hm = h => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), M = Math.round((h - H) * 60); return String(H + (M === 60 ? 1 : 0)).padStart(2, '0') + ':' + String(M === 60 ? 0 : M).padStart(2, '0'); };

  let scrim, panel, onKey, onEsc = null;
  function say(msg) { if (typeof window.toast === 'function') return window.toast(msg); const t = document.createElement('div'); t.className = 'fxd-toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
  function ensure() {
    if (panel) return;
    scrim = document.createElement('div'); scrim.className = 'fxd-scrim'; scrim.hidden = true;
    panel = document.createElement('aside'); panel.className = 'fxd'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    document.body.append(scrim, panel); scrim.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); if (onEsc && onEsc()) return; close(); } }, true);
  }
  function show(label) {
    ensure(); if (window.FxDriver) window.FxDriver.close();
    panel.setAttribute('aria-label', label); scrim.hidden = false; panel.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add('is-open'); panel.classList.add('is-open'); });
  }
  function close() {
    if (!panel || panel.hidden) return;
    onEsc = null;
    scrim.classList.remove('is-open'); panel.classList.remove('is-open');
    const done = () => { scrim.hidden = true; panel.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 240);
  }
  const top = (eyebrow, ext) => `<div class="fxd-top"><span>${esc(eyebrow)}</span>${ext ? `<button class="fxd-ib" type="button" data-open data-tip="Open trip page" aria-label="Open trip page">${ic('ext', 17)}</button>` : ''}<button class="fxd-ib" type="button" data-close data-tip="Close (Esc)" aria-label="Close">${ic('x', 18)}</button></div>`;
  const head = (title, sub, pill) => `<div class="fxt-hd"><div class="fxt-title">${esc(title)}</div>${sub ? `<div class="fxt-sub">${esc(sub)}</div>` : ''}${pill ? `<span class="fxd-status" style="--t:${pill[1]};color:${pill[1] === TONE.delayed ? TONE.delayed : '#C9C3BD'}"><i></i>${esc(pill[0])}</span>` : ''}</div>`;
  const sec = (title, inner, extra) => `<section class="fxt-sec"><h3 class="fxt-h">${esc(title)}${extra ? `<small>${esc(extra)}</small>` : ''}</h3>${inner}</section>`;
  const journey = (from, to, p, col) => `<div class="fxd-j num" style="--p:${Math.round(p * 100)}%"><span>${esc(from)}</span><span class="t" data-tip="${Math.round(p * 100)}% of the planned time has passed"><i style="${col ? 'background:' + col : ''}"></i><b></b></span><span>${esc(to)}</span></div>`;
  const stops = list => `<div class="fxt-stops">${list.map((s, i) => `<div class="fxt-stop"><div class="fxt-rail"><i class="${s.done ? 'done' : ''}"></i>${i < list.length - 1 ? '<b></b>' : ''}</div><div><div class="k">${esc(s.kind)}</div><div class="p">${esc(s.place)}</div><div class="a">${esc(s.addr || '')}</div></div><div class="w" style="${s.bad ? 'color:#E5484D' : ''}">${esc(s.when || '')}</div></div>`).join('')}</div>`;
  const kv = rows => `<dl class="fxt-kv">${rows.filter(r => r[1]).map(([k, v, bad]) => `<dt>${esc(k)}</dt><dd class="${bad ? 'fxt-warn' : ''}">${esc(v)}</dd>`).join('')}</dl>`;
  const person = d => `<button class="fxt-person" type="button" data-driver="${esc(d.id || '')}"><span class="fxt-av" style="--t:${d.dot || '#8A847E'}">${esc(d.ini)}<i></i></span><span style="flex:1;min-width:0"><span class="n" style="display:block">${esc(d.name)}</span><span class="d" style="display:block">${esc(d.sub || '')}</span></span>${ic('chev', 16)}</button>`;
  const docs = list => list.map(d => `<div class="fxt-doc"><span class="ic">${ic('doc', 16)}</span><div><div class="n">${esc(d.name)}</div><div class="d">${esc(d.sub)}</div></div>${d.ok ? `<span style="color:#4CAF6A">${ic('check', 16)}</span>` : '<span class="fxt-hint">Waiting</span>'}</div>`).join('');
  const options = (list, sel) => `<div class="fxt-opts" role="radiogroup">${list.map(o => `<button class="fxt-opt" type="button" role="radio" data-opt="${esc(o.id)}" aria-checked="${o.id === sel}" ${o.ok ? '' : 'disabled'}><span class="fxt-radio"></span><span class="fxt-av" style="--t:${o.ok ? '#4CAF6A' : '#57524D'}">${esc(o.ini)}<i></i></span><span class="t"><span class="n" style="display:block">${esc(o.name)}</span><span class="d ${o.ok ? 'ok' : o.bad ? 'bad' : ''}" style="display:block">${esc(o.sub)}</span></span>${o.tag ? `<span class="fxt-tag">${esc(o.tag)}</span>` : ''}</button>`).join('')}</div>`;
  function wire(extra) {
    panel.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    if (extra) extra();
  }

  /* ====================== Trip details ====================== */
  function details(t, ctx = {}) {
    ensure();
    const A = ctx.actions || {};
    let sel = null, cancelArmed = false;
    const render = () => {
      const st = t.status, pill = st === 'delayed' ? [`Delayed ${t.delay} min`, TONE.delayed] : [LABEL[st], TONE[st]];
      if (st === 'completed') return completed(t, ctx);
      let body = '';
      if (st === 'unassigned') {
        body += `<div class="fxt-card"><div class="r">No driver or vehicle yet</div><div class="s">Assign one before ${esc(t.assignBy || 'departure')} so the driver has time to reach ${esc(t.from)}.</div></div>`;
        const opts = (ctx.driverOptions ? ctx.driverOptions(t) : []);
        if (!sel) { const best = opts.find(o => o.ok); sel = best ? best.id : null; }
        body += sec('Choose a driver', options(opts, sel), 'Free first');
      } else if (st === 'delayed') {
        body += `<div class="fxt-card"><div class="r"><span style="color:#E5484D;display:inline-flex">${ic('alert', 16)}</span>${t.delay} min late · new ETA ${esc(t.eta)}</div><div class="s">Planned arrival ${esc(t.e)}.${t.reason ? ' ' + esc(t.reason) : ''}</div>${t.progress != null ? journey(t.from, t.to, t.progress, '#E5484D') : ''}<div class="acts"><button class="fxt-pillbtn" type="button" data-notify>${ic('send', 14)}Notify client</button>${t.driver ? `<button class="fxt-pillbtn" type="button" data-call>${ic('msg', 14)}Call ${esc(t.driver.name.split(' ')[0])}</button>` : ''}</div></div>`;
      } else if (st === 'loading') {
        body += `<div class="fxt-card"><div class="r">Loading until ${esc(t.loadUntil)}</div><div class="s">${esc(t.loadNote || 'At the hub')} · then leaves for ${esc(t.to)}</div>${t.progress != null ? journey(t.from, t.to, t.progress) : ''}</div>`;
      } else if (st === 'transit') {
        body += `<div class="fxt-card"><div class="r">Arrives at ${esc(t.e)}</div><div class="s">${esc(t.remaining || '')}</div>${t.progress != null ? journey(t.from, t.to, t.progress) : ''}</div>`;
      } else {
        body += `<div class="fxt-card"><div class="r">Starts at ${esc(t.s)}</div><div class="s">${esc(t.date || '')} · arrives ${esc(t.e)}</div></div>`;
      }
      if (t.stops) body += sec('Stops', stops(t.stops));
      if (t.driver && st !== 'unassigned') body += sec('Driver & vehicle', person(t.driver));
      body += sec('Cargo & payment', kv([['Cargo', t.cargo], ['Price', t.price != null ? eur(t.price) : ''], ['Payment', t.payment], ...(t.next ? [['Next trip', t.next.text, t.next.bad]] : [])]));
      if (t.docs && t.docs.length) body += sec('Documents', docs(t.docs));
      let foot = '';
      if (st === 'unassigned') {
        const o = (ctx.driverOptions ? ctx.driverOptions(t) : []).find(x => x.id === sel);
        foot = `<button class="fxt-btn" type="button" data-cancel>${cancelArmed ? 'Confirm cancel' : 'Cancel trip'}</button><span class="sp"></span><button class="fxd-primary" type="button" data-assign ${o ? '' : 'aria-disabled="true"'}>${ic('check', 16)}${o ? 'Assign ' + esc(o.name) : 'Choose a driver'}</button>`;
      } else if (st === 'assigned') {
        foot = `<button class="fxt-btn grow" type="button" data-msg>${ic('msg', 16)}Message driver</button><button class="fxd-primary grow" type="button" data-edit>${ic('file', 16)}Edit trip</button>`;
      } else {
        foot = `<button class="fxt-btn grow" type="button" data-msg>${ic('msg', 16)}Message driver</button><button class="fxd-primary grow" type="button" data-end>${ic('flag', 16)}End trip</button>`;
      }
      panel.innerHTML = top('Trip · ' + t.id, true) + head(`${t.from} → ${t.to}`, `${t.client} · ${t.date} · ${t.s} – ${t.e}`, pill) + `<div class="fxt-body">${body}</div><div class="fxt-foot">${foot}</div>`;
      wire(() => {
        const q = s => panel.querySelector(s);
        panel.querySelectorAll('[data-open]').forEach(b => b.onclick = () => say('Trip page is not in this prototype yet'));
        panel.querySelectorAll('[data-driver]').forEach(b => b.onclick = () => { if (A.openDriver && b.dataset.driver) { close(); setTimeout(() => A.openDriver(b.dataset.driver), 60); } else say('Driver profile page is not in this prototype yet'); });
        panel.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => { sel = b.dataset.opt; render(); panel.querySelector(`[data-opt="${sel}"]`).focus(); });
        if (q('[data-notify]')) q('[data-notify]').onclick = () => say('Delay notice drafted for ' + t.client);
        if (q('[data-call]')) q('[data-call]').onclick = () => { const ph = t.driver.phone; try { navigator.clipboard.writeText(ph).then(() => say('Copied ' + ph), () => say(ph)); } catch (e) { say(ph); } };
        if (q('[data-msg]')) q('[data-msg]').onclick = () => say('Message draft opened for ' + (t.driver ? t.driver.name : 'the driver'));
        if (q('[data-edit]')) q('[data-edit]').onclick = () => say('Trip editing is not in this prototype yet');
        if (q('[data-end]')) q('[data-end]').onclick = () => endTrip(t, ctx);
        if (q('[data-assign]')) q('[data-assign]').onclick = () => { if (!sel) return; A.assign && A.assign(t, sel); close(); };
        if (q('[data-cancel]')) q('[data-cancel]').onclick = () => { if (!cancelArmed) { cancelArmed = true; render(); return; } A.cancel && A.cancel(t); close(); };
      });
    };
    render(); show('Trip ' + t.id);
    setTimeout(() => panel.querySelector('[data-close]').focus(), 30);
  }

  /* ====================== End trip ====================== */
  function endTrip(t, ctx) {
    ensure();
    const A = ctx.actions || {};
    const est = estimate(t.from, t.to) || { km: t.km || 150 };
    const v = { gross: t.price || 0, status: 'Invoice to send', fuel: 'Diesel', litres: Math.round(est.km / 2.1), ppl: 1.689, tolls: t.tolls != null ? t.tolls : Math.round(est.km * 0.12), file: '' };
    const render = () => {
      const total = v.litres * v.ppl;
      panel.innerHTML = top('End trip · ' + t.id, false) + head('Record earnings and costs', `${t.from} → ${t.to} · ${t.client}${t.driver ? '' : ''}`) + `<div class="fxt-body">
        ${sec('Earnings', `<div class="fxt-row"><div class="fxt-field"><label for="fxt-gross">Gross earnings<em>*</em></label><div class="fxt-in">€<input id="fxt-gross" inputmode="decimal" value="${v.gross.toFixed(2)}"></div></div><div class="fxt-field"><label for="fxt-pay">Payment status</label><div class="fxt-in"><select id="fxt-pay">${['Invoice to send', 'Invoiced', 'Paid'].map(o => `<option ${o === v.status ? 'selected' : ''}>${o}</option>`).join('')}</select>${ic('chev', 14).replace('M9 6l6 6-6 6', 'M6 9l6 6 6-6')}</div></div></div>`)}
        ${sec('Fuel', `<div class="fxt-seg" role="group" aria-label="Fuel type">${['Diesel', 'Petrol', 'LNG', 'Electric'].map(f => `<button type="button" data-fuel="${f}" aria-pressed="${v.fuel === f}">${f}</button>`).join('')}</div>
          <div class="fxt-row"><div class="fxt-field"><label for="fxt-l">Litres</label><div class="fxt-in"><input id="fxt-l" inputmode="decimal" value="${v.litres}">L</div></div><div class="fxt-field"><label for="fxt-ppl">Price per litre</label><div class="fxt-in">€<input id="fxt-ppl" inputmode="decimal" value="${v.ppl}"></div><span class="fxt-hint">Today’s average</span></div></div>
          <div class="fxt-total"><span>Total fuel cost</span><b class="num" data-total>${eur(total, 2)}</b></div>`)}
        ${sec('Tolls & extras', `<div class="fxt-field"><label for="fxt-tolls">Amount</label><div class="fxt-in">€<input id="fxt-tolls" inputmode="decimal" value="${v.tolls.toFixed(2)}"></div></div>`)}
        ${sec('Proof of delivery', `<label class="fxt-upload">${ic('upload', 18)}<span style="flex:1"><span class="n" style="display:block">${v.file ? esc(v.file) : 'Add signed delivery note'}</span><span class="d" style="display:block">${v.file ? 'Attached' : 'Photo or PDF · CMR already attached'}</span></span><input type="file" id="fxt-file" accept="image/*,application/pdf"></label>`)}
      </div><div class="fxt-foot"><button class="fxt-btn" type="button" data-back>Cancel</button><span class="sp"></span><button class="fxd-primary" type="button" data-confirm>${ic('check', 16)}Confirm &amp; close trip</button></div>`;
      wire(() => {
        const q = s => panel.querySelector(s), num = s => parseFloat(String(q(s).value).replace(',', '.')) || 0;
        const upd = () => { v.gross = num('#fxt-gross'); v.litres = num('#fxt-l'); v.ppl = num('#fxt-ppl'); v.tolls = num('#fxt-tolls'); v.status = q('#fxt-pay').value; q('[data-total]').textContent = eur(v.litres * v.ppl, 2); };
        ['#fxt-gross', '#fxt-l', '#fxt-ppl', '#fxt-tolls', '#fxt-pay'].forEach(s => q(s).addEventListener('input', upd));
        panel.querySelectorAll('[data-fuel]').forEach(b => b.onclick = () => { upd(); v.fuel = b.dataset.fuel; render(); });
        q('#fxt-file').onchange = e => { upd(); v.file = e.target.files[0] ? e.target.files[0].name : ''; render(); };
        q('[data-back]').onclick = () => details(t, ctx);
        q('[data-confirm]').onclick = () => { upd(); const result = { gross: v.gross, fuelCost: v.litres * v.ppl, litres: v.litres, ppl: v.ppl, fuelType: v.fuel, tolls: v.tolls, status: v.status, km: est.km, file: v.file };
          if (A.endTrip) { const updated = A.endTrip(t, result); if (updated) { details(updated, ctx); return; } } close(); };
        q('#fxt-gross').focus();
      });
    };
    render(); show('End trip ' + t.id);
  }

  /* ====================== Completed ====================== */
  function completed(t, ctx) {
    ensure();
    const A = ctx.actions || {}, c = t.result || {};
    const km = c.km || (estimate(t.from, t.to) || {}).km || 100, gross = c.gross != null ? c.gross : (t.price || 0);
    const fuel = c.fuelCost != null ? c.fuelCost : km / 2.1 * 1.689, tolls = c.tolls != null ? c.tolls : Math.round(km * 0.6), net = gross - fuel - tolls;
    const litres = c.litres || Math.round(km / 2.1), durH = t.durH || 0;
    const payTone = c.status === 'Paid' ? '#4CAF6A' : c.status === 'Invoiced' ? '#8A847E' : '#E0A23A';
    const payText = c.status === 'Paid' ? 'Paid' : c.status === 'Invoiced' ? 'Invoiced' : 'Not invoiced yet';
    panel.innerHTML = top('Trip · ' + t.id, true) + head(`${t.from} → ${t.to}`, `${t.client} · ${t.date} · ${t.s} – ${t.e}`, ['Completed', TONE.completed]) + `<div class="fxt-body">
      <div class="fxt-done"><span class="fxt-check">${ic('check', 18)}</span><div><div style="font-size:15.5px;font-weight:500">Delivered at ${esc(t.deliveredAt || t.e)}</div><div class="fxt-hint" style="font-size:12.5px;color:#A29D97">${esc(t.deliveredNote || 'Signed delivery note on file')}</div></div></div>
      <div class="fxt-nums num"><div><span>Gross earnings</span><b>${eur(gross)}</b></div><div><span>Net profit</span><b>${eur(net)}</b></div><div><span>Distance</span><b>${km} km</b></div><div><span>Duration</span><b>${durH ? dur(durH) : '—'}</b></div><div><span>Cost per km</span><b>${eur((fuel + tolls) / km, 2)}</b></div><div><span>Fuel efficiency</span><b>${(km / litres).toFixed(1)} km/L</b></div></div>
      ${sec('Breakdown', `<div class="fxt-lines num"><div>Gross earnings<b>+ ${eur(gross, 2)}</b></div><div>Fuel (${litres} L · ${esc(c.fuelType || 'Diesel')} · ${eur(c.ppl || 1.689, 3)}/L)<b>− ${eur(fuel, 2)}</b></div><div>Tolls &amp; extras<b>− ${eur(tolls, 2)}</b></div><div class="tot">Net profit<b>${eur(net, 2)}</b></div></div>`)}
      ${sec('Payment', `<div class="fxt-pay" style="--t:${payTone}"><i></i><span>${payText}</span><small>${c.status === 'Paid' ? 'Received' : 'Due 30 days after invoice'}</small></div>`)}
    </div><div class="fxt-foot"><button class="fxt-btn" type="button" data-dup data-tip="Duplicate trip" aria-label="Duplicate trip">${ic('copy', 16)}</button><button class="fxt-btn" type="button" data-pdf>${ic('file', 16)}Export PDF</button><button class="fxd-primary grow" type="button" data-invoice>${ic('coin', 16)}Create invoice</button></div>`;
    wire(() => {
      panel.querySelectorAll('[data-open]').forEach(b => b.onclick = () => say('Trip page is not in this prototype yet'));
      panel.querySelector('[data-dup]').onclick = () => { if (A.duplicate) { close(); setTimeout(() => A.duplicate(t), 60); } else say('Duplicate is not in this prototype yet'); };
      panel.querySelector('[data-pdf]').onclick = () => say('PDF export is not in this prototype yet');
      panel.querySelector('[data-invoice]').onclick = () => { A.invoice ? A.invoice(t) : say('Invoice draft created for ' + t.client); close(); };
    });
    show('Trip ' + t.id);
  }

  /* ====================== Create trip ======================
     One scrolling form, same as the Planner's own "New trip" panel:
     Crew & vehicles, When, Route (stops A…B), Details (client, status, notes). */
  const css2 = `
.fxc-head{display:flex;align-items:flex-start;gap:12px;padding:20px 20px 14px;border-bottom:1px solid rgba(255,244,234,.07)}
.fxc-head>div{flex:1;min-width:0}
.fxc-eyebrow{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8A847E}
.fxc-title{display:flex;align-items:center;gap:10px;margin:2px 0 2px;font-size:20px;font-weight:600;letter-spacing:-.01em}
.fxc-dirty{font-size:11.5px;font-weight:600;color:#E0A23A;background:rgba(224,162,58,.14);padding:2px 8px;border-radius:999px;letter-spacing:0}
.fxc-sub{font-size:13px;color:#C2BCB6}
.fxc-x{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,244,234,.12)!important;color:#C2BCB6}
.fxc-x:hover{background:#1C1B19!important;color:#F2EFEB}
.fxc-body{flex:1;overflow:auto;padding:16px 20px 24px;display:flex;flex-direction:column;gap:26px;scrollbar-width:thin;scrollbar-color:#3A3633 transparent}
.fxc-sec{display:flex;flex-direction:column;gap:12px}
.fxc-sec>h3{margin:0;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#8A847E}
.fxc-row{display:flex;gap:10px}
.fxc-f{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0;position:relative}
.fxc-f>label,.fxc-f>.lbl{font-size:13px;font-weight:500;color:#C2BCB6}
.fxc-f>label span,.fxc-f>.lbl span{font-weight:400;color:#8A847E}
.fxc-c{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border-radius:10px;background:#1C1B19;border:1px solid #3A3633!important;color:#F2EFEB;font:inherit;font-size:13px;width:100%;min-width:0;text-align:left}
.fxc-c svg{flex:none;color:#8A847E}
.fxc-c:focus-within,button.fxc-c:focus-visible,button.fxc-c[aria-expanded=true]{border-color:#FF6A2B!important;box-shadow:0 0 0 3px rgba(255,106,43,.22);outline:none}
.fxd .fxc-c :focus-visible{outline:none}
.fxc-c input,.fxc-c textarea{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;color:#F2EFEB;font:inherit;font-size:13px;color-scheme:dark}
.fxc-c input::placeholder,.fxc-c textarea::placeholder{color:#8A847E}
.fxc-c input[type=date]::-webkit-calendar-picker-indicator,.fxc-c input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.6);cursor:pointer}
.fxc-c.tall{height:auto;padding:10px 12px}.fxc-c textarea{height:58px;resize:vertical}
.fxc-c input[list]::-webkit-calendar-picker-indicator{display:none!important}
.fxc-c.sub{height:32px;background:transparent;font-size:12px}
.fxc-c.err{border-color:rgba(229,72,77,.9)!important}
.fxc-val{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fxc-val b{font-weight:500}.fxc-val small{font-size:12px;color:#8A847E;margin-left:6px}
.fxc-val.ph{color:#8A847E}
.fxc-help{margin:0;font-size:12px;color:#8A847E}.fxc-help.err{color:#E5484D}
.fxc-pop{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:5;background:#1C1B19;border:1px solid #3A3633;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.5);overflow:hidden}
.fxc-pop .fxc-c{border:0!important;border-bottom:1px solid #2D2A27!important;border-radius:0;box-shadow:none;background:transparent}
.fxc-list{max-height:300px;overflow:auto;padding:6px;scrollbar-width:thin;scrollbar-color:#3A3633 transparent}
.fxc-gh{display:flex;gap:6px;padding:8px 8px 4px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#8A847E}
.fxc-gh span{font-weight:500;letter-spacing:0}
.fxc-opt{display:flex;flex-direction:column;gap:1px;width:100%;padding:8px 10px;border-radius:8px;text-align:left;font-size:13px;color:#F2EFEB}
.fxc-opt small{font-size:12px;color:#8A847E}.fxc-opt small.bad{color:#E5484D}
.fxc-opt:hover,.fxc-opt.hi{background:#272523!important}
.fxc-opt[aria-selected=true]{box-shadow:inset 2px 0 0 #FF6A2B}
.fxc-opt.off{color:#A29D97}
.fxc-opt:disabled{opacity:.55;cursor:not-allowed;background:none!important}
.fxc-empty{padding:12px 10px;font-size:12.5px;color:#8A847E}
.fxc-stops{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.fxc-stop{display:grid;grid-template-columns:14px 26px minmax(0,1fr) auto;gap:10px;align-items:start}
.fxc-grip{color:#57524D;padding-top:12px;cursor:grab}
.fxc-mk{width:26px;height:26px;margin-top:7px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:600;background:rgba(162,157,151,.16);color:#A29D97}
.fxc-mk.dest{background:rgba(255,106,43,.12);color:#FF6A2B}
.fxc-sf{display:flex;flex-direction:column;gap:6px}
.fxc-sa{display:flex;gap:2px;padding-top:8px}
.fxc-ib{width:24px;height:24px;border-radius:6px;display:grid;place-items:center;color:#C2BCB6}
.fxc-ib:hover:not(:disabled){background:#272523!important}
.fxc-ib:disabled{opacity:.3;cursor:default}
.fxc-add{display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border-radius:999px;border:1px solid #2D2A27!important;font-size:13px;font-weight:500;color:#C2BCB6}
.fxc-add:hover{background:#1C1B19!important;color:#F2EFEB}
.fxc-status{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.fxc-st{display:flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:10px;border:1px solid #3A3633!important;font-size:13px;color:#C2BCB6}
.fxc-st svg{color:var(--s)}
.fxc-st:hover{background:#1C1B19!important}
.fxc-st[aria-checked=true]{border-color:var(--s)!important;background:var(--sb)!important;color:#F2EFEB;font-weight:600}
.fxc-foot{display:flex;gap:8px;align-items:center;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,244,234,.07)}
.fxc-foot .sp{flex:1}
.fxc-b{height:38px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid #3A3633!important;white-space:nowrap}
.fxc-b:hover{background:#1C1B19!important}
.fxc-b.sec{background:#272523!important}.fxc-b.sec:hover{background:#2D2A27!important}
.fxc-b.pri{background:#FF6A2B!important;border-color:#FF6A2B!important;color:#fff;font-weight:600}.fxc-b.pri:hover{background:#FF7A40!important}
`;
  { const s = document.createElement('style'); s.textContent = css2; document.head.appendChild(s); }
  Object.assign(P, {
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', down: '<path d="M6 9l6 6 6-6"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', dn: '<path d="M12 5v14M6 13l6 6 6-6"/>', bld: '<path d="M4 21V5l8-3v19M12 9h8v12M8 8h0M8 12h0M8 16h0M16 13h0M16 17h0"/>',
    draft: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>', ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', okc: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'
  });
  const STATUSES = [['draft', 'Draft', '#A29D97', 'draft'], ['assigned', 'Assigned', '#A29D97', 'cal'], ['transit', 'In transit', '#4CAF6A', 'send'], ['delayed', 'Delayed', '#E5484D', 'clock'], ['completed', 'Completed', '#8A847E', 'okc'], ['cancelled', 'Cancelled', '#8A847E', 'ban']];
  const CITIES = ['Prato', 'Firenze', 'Pisa', 'Livorno', 'Lucca', 'Empoli', 'Arezzo', 'Siena', 'La Spezia', 'Genova', 'Milano', 'Bologna', 'Verona', 'Parma', 'Piacenza', 'Modena', 'Brescia', 'Torino', 'Roma', 'Napoli', 'Perugia', 'Padova', 'Venezia', 'Trento', 'Bolzano', 'Rimini', 'Ancona'];
  const longDate = v => { const d = new Date(v + 'T12:00'); return isNaN(d) ? v : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', ''); };

  function create(ctx = {}) {
    ensure();
    const today = ctx.today || new Date().toISOString().slice(0, 10);
    const pre = ctx.preset || {};
    const d = { driver: pre.driver || '', tractor: pre.tractor || '', trailer: pre.trailer || '', date: pre.date || today, time: pre.time || '', endDate: '', endTime: '', client: pre.client || '', status: pre.driver ? 'assigned' : 'draft', notes: '', stops: [{ city: pre.from || '', addr: '' }, { city: pre.to || '', addr: '' }] };
    if (d.driver && !d.tractor && ctx.tractorOf) d.tractor = ctx.tractorOf(d.driver) || '';
    let dirty = false, open = null, q = '', tried = false;
    const win = () => { const s = d.time ? toH(d.time) : null; let e = d.endTime ? toH(d.endTime) : null; if (s != null && e == null) { const est = estimate(d.stops[0].city, d.stops[d.stops.length - 1].city); e = s + (est ? est.hrs + 1 / 3 : 3); } return { sH: s, eH: e }; };
    const drivers = () => (ctx.drivers ? ctx.drivers(win()) : []);
    const lists = {
      driver: () => { const all = drivers(); return [['Available', all.filter(o => o.ok)], ['Busy at that time', all.filter(o => !o.ok && !o.disabled)], ['Can’t drive', all.filter(o => o.disabled)]]; },
      tractor: () => [['Tractors', ctx.tractors || []]],
      trailer: () => [['Semi-trailers', ctx.trailers || []]],
      client: () => [['Clients', (ctx.clients || []).map(c => ({ id: c, name: c, sub: ctx.clientHint ? ctx.clientHint(c) : '' }))]]
    };
    const find = (k, id) => { for (const [, l] of lists[k]()) { const o = l.find(x => x.id === id); if (o) return o; } return null; };
    const SEL = {
      driver: { label: 'Driver', icon: 'user', ph: 'Unassigned — pick a driver', search: 'Search…' },
      tractor: { label: 'Tractor', icon: 'truck', ph: 'Tractor to assign', search: 'Search plate or model…' },
      trailer: { label: 'Semi-trailer', icon: 'box', ph: 'Trailer to assign', search: 'Search plate…' },
      client: { label: 'Client', icon: 'bld', ph: 'Select client', search: 'Search client…' }
    };
    function select(k) {
      const s = SEL[k], o = d[k] ? find(k, d[k]) : null;
      const val = o ? `<span class="fxc-val"><b>${esc(o.name)}</b>${o.meta ? `<small>${esc(o.meta)}</small>` : ''}</span>` : `<span class="fxc-val ph">${esc(s.ph)}</span>`;
      let pop = '';
      if (open === k) {
        const qq = q.toLowerCase();
        const groups = lists[k]().map(([g, l]) => [g, l.filter(x => !qq || (x.name + ' ' + (x.meta || '') + ' ' + (x.sub || '')).toLowerCase().includes(qq))]).filter(([, l]) => l.length);
        pop = `<div class="fxc-pop" role="presentation"><label class="fxc-c">${ic('search', 15)}<input data-q placeholder="${esc(s.search)}" value="${esc(q)}" aria-label="${esc(s.search)}"></label><div class="fxc-list" role="listbox" aria-label="${esc(s.label)}">${
          (d[k] ? `<button type="button" class="fxc-opt" role="option" data-pick="" aria-selected="false"><span>${k === 'driver' ? 'Leave unassigned' : 'Clear'}</span></button>` : '') +
          (groups.length ? groups.map(([g, l]) => `${groups.length > 1 || k === 'driver' ? `<div class="fxc-gh">${esc(g)}<span>${l.length}</span></div>` : ''}${l.map(x => `<button type="button" class="fxc-opt ${x.ok === false ? 'off' : ''}" role="option" data-pick="${esc(x.id)}" aria-selected="${x.id === d[k]}" ${x.disabled ? 'disabled aria-disabled="true"' : ''}><span>${esc(x.name)}</span>${x.sub || x.meta ? `<small class="${x.bad ? 'bad' : ''}">${esc(x.sub || x.meta)}</small>` : ''}</button>`).join('')}`).join('') : '<div class="fxc-empty">Nothing matches</div>')}</div></div>`;
      }
      return `<div class="fxc-f"><label for="fxc-${k}">${esc(s.label)}</label><button type="button" id="fxc-${k}" class="fxc-c" data-sel="${k}" aria-haspopup="listbox" aria-expanded="${open === k}">${ic(s.icon, 15)}${val}${ic('down', 15)}</button>${pop}</div>`;
    }
    const L = i => String.fromCharCode(65 + i);
    function render(focus) {
      const n = d.stops.length, routeErr = tried && (!d.stops[0].city.trim() || !d.stops[n - 1].city.trim());
      const w = win(); let help = 'No times: the trip sits in the “No time set” lane.';
      if (d.time) { const e = d.endTime || hm(w.eH); help = d.endTime ? `Leaves ${d.time}, arrives ${d.endTime}.` : `Arrival not set: estimated around ${e} from the route.`; }
      panel.innerHTML = `<header class="fxc-head"><div><div class="fxc-eyebrow">Create</div><h2 class="fxc-title">New trip${dirty ? '<span class="fxc-dirty">Unsaved changes</span>' : ''}</h2><div class="fxc-sub">${esc(longDate(d.date))}</div></div><button type="button" class="fxc-x" data-close data-tip="Close (Esc)" aria-label="Close panel">${ic('x', 16)}</button></header>
      <div class="fxc-body">
        <section class="fxc-sec"><h3>Crew &amp; vehicles</h3>${select('driver')}<div class="fxc-row">${select('tractor')}${select('trailer')}</div></section>
        <section class="fxc-sec"><h3>When</h3>
          <div class="fxc-row"><div class="fxc-f"><label for="fxc-date">Leaves on</label><label class="fxc-c">${ic('cal', 15)}<input id="fxc-date" type="date" data-k="date" value="${esc(d.date)}" required></label></div><div class="fxc-f"><label for="fxc-time">at <span>optional</span></label><label class="fxc-c"><input id="fxc-time" type="time" step="900" data-k="time" value="${esc(d.time)}"></label></div></div>
          <div class="fxc-row"><div class="fxc-f"><label for="fxc-edate">Arrives on <span>same day if empty</span></label><label class="fxc-c">${ic('cal', 15)}<input id="fxc-edate" type="date" data-k="endDate" min="${esc(d.date)}" value="${esc(d.endDate)}"></label></div><div class="fxc-f"><label for="fxc-etime">at <span>optional</span></label><label class="fxc-c"><input id="fxc-etime" type="time" step="900" data-k="endTime" value="${esc(d.endTime)}"></label></div></div>
          <p class="fxc-help" data-help>${esc(help)}</p></section>
        <section class="fxc-sec"><h3>Route</h3><ol class="fxc-stops">${d.stops.map((s, i) => { const kind = i === 0 ? 'Origin' : i === n - 1 ? 'Destination' : 'Stop ' + L(i); const bad = tried && (i === 0 || i === n - 1) && !s.city.trim();
          return `<li class="fxc-stop"><span class="fxc-grip" aria-hidden="true">${ic('grip', 14)}</span><span class="fxc-mk ${i === n - 1 ? 'dest' : ''}">${L(i)}</span><div class="fxc-sf"><label class="fxc-c ${bad ? 'err' : ''}"><input data-city="${i}" list="fxc-cities" placeholder="${i === 0 ? 'Origin city' : i === n - 1 ? 'Destination city' : 'Stop city'}" aria-label="${kind} city" value="${esc(s.city)}"></label><label class="fxc-c sub"><input data-addr="${i}" placeholder="Address (optional)" aria-label="${kind} address" value="${esc(s.addr)}"></label></div><div class="fxc-sa"><button type="button" class="fxc-ib" data-mv="${i},-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${kind} up">${ic('up', 14)}</button><button type="button" class="fxc-ib" data-mv="${i},1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${kind} down">${ic('dn', 14)}</button><button type="button" class="fxc-ib" data-rm="${i}" ${n <= 2 ? 'disabled' : ''} aria-label="Remove ${kind}">${ic('x', 14)}</button></div></li>`; }).join('')}</ol>
          ${routeErr ? '<p class="fxc-help err" role="alert">Add at least an origin and a destination</p>' : ''}
          <button type="button" class="fxc-add" data-addstop>${ic('plus', 14)}Add stop</button>
          <datalist id="fxc-cities">${CITIES.map(c => `<option value="${c}">`).join('')}</datalist></section>
        <section class="fxc-sec"><h3>Details</h3>${select('client')}
          <div class="fxc-f"><span class="lbl" id="fxc-stl">Status</span><div class="fxc-status" role="radiogroup" aria-labelledby="fxc-stl">${STATUSES.map(([k, l, c, i]) => `<button type="button" class="fxc-st" role="radio" data-st="${k}" aria-checked="${d.status === k}" style="--s:${c};--sb:${c}1F">${ic(i, 14)}${l}</button>`).join('')}</div></div>
          <div class="fxc-f"><label for="fxc-notes">Notes</label><label class="fxc-c tall"><textarea id="fxc-notes" data-k="notes" rows="3" placeholder="Loading instructions, references, contacts…">${esc(d.notes)}</textarea></label></div></section>
      </div>
      <footer class="fxc-foot"><span class="sp"></span><button type="button" class="fxc-b" data-close>Cancel</button><button type="button" class="fxc-b sec" data-save="draft">Save as draft</button><button type="button" class="fxc-b pri" data-save="create">Create trip</button></footer>`;
      wire();
      const f = focus && panel.querySelector(focus);
      if (f) { f.focus(); if (f.setSelectionRange && f.type === 'text') { const l = f.value.length; f.setSelectionRange(l, l); } }
    }
    const touch = () => { if (!dirty) { dirty = true; const t = panel.querySelector('.fxc-title'); if (t && !t.querySelector('.fxc-dirty')) t.insertAdjacentHTML('beforeend', '<span class="fxc-dirty">Unsaved changes</span>'); } };
    function wire() {
      const body = panel.querySelector('.fxc-body'), top0 = body.scrollTop;
      panel.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
      panel.querySelectorAll('[data-sel]').forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.sel; open = open === k ? null : k; q = ''; render(open ? '[data-q]' : '#fxc-' + k); panel.querySelector('.fxc-body').scrollTop = top0; });
      const qi = panel.querySelector('[data-q]');
      if (qi) {
        qi.oninput = () => { q = qi.value; const k = open; render('[data-q]'); panel.querySelector('.fxc-body').scrollTop = top0; };
        qi.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); const k = open; open = null; render('#fxc-' + k); } if (e.key === 'Enter') { const first = panel.querySelector('.fxc-opt[data-pick]:not([data-pick=""])'); if (first) first.click(); } };
      }
      panel.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
        const k = open, v = b.dataset.pick; d[k] = v; touch();
        if (k === 'driver') { if (v && ctx.tractorOf && !d.tractor) d.tractor = ctx.tractorOf(v) || ''; if (v && d.status === 'draft') d.status = 'assigned'; if (!v && d.status === 'assigned') d.status = 'draft'; }
        open = null; render('#fxc-' + k); panel.querySelector('.fxc-body').scrollTop = top0;
      });
      panel.querySelectorAll('[data-k]').forEach(i => i.oninput = () => {
        d[i.dataset.k] = i.value; touch();
        if (i.dataset.k === 'date') { panel.querySelector('.fxc-sub').textContent = longDate(d.date); panel.querySelector('#fxc-edate').min = d.date; }
        if (['time', 'endTime'].includes(i.dataset.k)) { const w = win(); panel.querySelector('[data-help]').textContent = !d.time ? 'No times: the trip sits in the “No time set” lane.' : d.endTime ? `Leaves ${d.time}, arrives ${d.endTime}.` : `Arrival not set: estimated around ${hm(w.eH)} from the route.`; }
      });
      panel.querySelectorAll('[data-city]').forEach(i => i.oninput = () => { d.stops[+i.dataset.city].city = i.value; touch(); if (tried && i.value.trim()) i.parentElement.classList.remove('err'); });
      panel.querySelectorAll('[data-addr]').forEach(i => i.oninput = () => { d.stops[+i.dataset.addr].addr = i.value; touch(); });
      panel.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { const [i, dir] = b.dataset.mv.split(',').map(Number); const s = d.stops; [s[i], s[i + dir]] = [s[i + dir], s[i]]; touch(); render(); panel.querySelector('.fxc-body').scrollTop = top0; });
      panel.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { d.stops.splice(+b.dataset.rm, 1); touch(); render(); panel.querySelector('.fxc-body').scrollTop = top0; });
      panel.querySelector('[data-addstop]').onclick = () => { d.stops.splice(d.stops.length - 1, 0, { city: '', addr: '' }); touch(); render(`[data-city="${d.stops.length - 2}"]`); panel.querySelector('.fxc-body').scrollTop = top0; };
      panel.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { d.status = b.dataset.st; touch(); panel.querySelectorAll('[data-st]').forEach(x => x.setAttribute('aria-checked', x === b)); });
      panel.querySelectorAll('[data-save]').forEach(b => b.onclick = () => {
        const n = d.stops.length;
        if (!d.stops[0].city.trim() || !d.stops[n - 1].city.trim()) { tried = true; open = null; render('[data-city="' + (d.stops[0].city.trim() ? n - 1 : 0) + '"]'); const r = panel.querySelector('.fxc-stops'); if (r) r.scrollIntoView({ block: 'center' }); return; }
        const w = win(), draft = b.dataset.save === 'draft';
        const data = Object.assign({}, d, { status: draft ? 'draft' : d.status, draft, from: d.stops[0].city.trim(), to: d.stops[n - 1].city.trim(), sH: w.sH, eH: w.eH });
        close(); if (ctx.onCreate) ctx.onCreate(data); else say(draft ? 'Draft saved' : 'Trip created');
      });
      panel.onclick = e => { if (open && !e.target.closest('.fxc-pop,[data-sel]')) { const k = open; open = null; render(); panel.querySelector('.fxc-body').scrollTop = top0; } };
    }
    onEsc = () => { if (open) { const k = open; open = null; render('#fxc-' + k); return true; } return false; };
    render(); show('New trip');
    setTimeout(() => { const f = panel.querySelector(d.stops[0].city ? '[data-city="1"]' : '#fxc-driver'); if (f && !d.stops[0].city && !d.driver) panel.querySelector('#fxc-driver').focus(); else if (f) f.focus(); }, 30);
  }

  window.FxTrip = { details, create, endTrip, close, estimate };
})();
