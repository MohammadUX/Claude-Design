/* Fleeex driver details drawer. Shared by the Dashboard and the Planner page.
   Usage: FxDriver.open({ini,name,vehicle,base,phone,email,status:{text,tone},now,drivenH,trips,docs,alert,actions})
   tone: 'live' | 'bad' | 'warn' | 'muted' */
(function () {
  const css = `
.fxd-scrim{position:fixed;inset:0;z-index:120;background:rgba(6,5,4,.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;transition:opacity .2s ease}
.fxd-scrim.is-open{opacity:1}
.fxd{position:fixed;z-index:121;top:12px;right:12px;bottom:12px;width:min(440px,calc(100vw - 24px));display:flex;flex-direction:column;background:#151413;border:1px solid rgba(255,244,234,.1);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.6);color:#F2EFEB;font:14px/1.45 Inter,"SF Pro Text",system-ui,-apple-system,"Segoe UI",sans-serif;transform:translateX(calc(100% + 24px));transition:transform .26s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.fxd.is-open{transform:none}
@media (prefers-reduced-motion:reduce){.fxd,.fxd-scrim{transition:none}}
:where(.fxd) *{box-sizing:border-box}
:where(.fxd) button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.fxd :focus-visible{outline:2px solid #FF6A2B;outline-offset:2px;border-radius:8px}
.fxd .num{font-variant-numeric:tabular-nums}
.fxd-top{display:flex;align-items:center;gap:8px;padding:14px 14px 0 20px;color:#8A847E;font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase}
.fxd-top span{flex:1}
.fxd-ib{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:#A29D97}
.fxd-ib:hover{background:#272523;color:#F2EFEB}
.fxd-id{display:flex;align-items:center;gap:14px;padding:14px 20px 16px}
.fxd-av{position:relative;flex:none;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#272523;font-size:18px;font-weight:600;letter-spacing:.02em}
.fxd-av i{position:absolute;right:1px;bottom:1px;width:14px;height:14px;border-radius:50%;background:var(--t);box-shadow:0 0 0 3px #151413}
.fxd-name{font-size:20px;font-weight:500;letter-spacing:-.02em;line-height:1.2}
.fxd-veh{font-size:13px;color:#A29D97;margin-top:2px}
.fxd-status{display:inline-flex;align-items:center;gap:7px;margin-top:8px;padding:3px 10px 3px 8px;border-radius:999px;border:1px solid rgba(255,244,234,.12);font-size:12.5px;font-weight:500}
.fxd-status i{width:7px;height:7px;border-radius:50%;background:var(--t)}
.fxd-acts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 20px 16px}
.fxd-act:disabled{opacity:.45;cursor:default}
.fxd-act{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px 10px;border-radius:14px;background:#1C1B19;font-size:12px;font-weight:500;color:#C9C3BD}
.fxd-act svg{color:#F2EFEB}
.fxd-act:hover{background:#23211F;color:#F2EFEB}
.fxd-tabs{display:flex;gap:4px;padding:0 20px;border-bottom:1px solid rgba(255,244,234,.07)}
.fxd-tab{position:relative;padding:10px 10px 12px;font-size:13.5px;font-weight:500;color:#8A847E}
.fxd-tab b{font-weight:500;color:#6E6964;margin-left:4px}
.fxd-tab[aria-selected=true]{color:#F2EFEB}
.fxd-tab[aria-selected=true]::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;border-radius:2px;background:#F2EFEB}
.fxd-body{flex:1;overflow:auto;padding:18px 20px 20px;scrollbar-width:thin;scrollbar-color:#333 transparent}
.fxd-sec+.fxd-sec{margin-top:22px}
.fxd-h{margin:0 0 10px;font-size:11.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#8A847E}
.fxd-now{padding:14px 16px;border-radius:16px;background:#1C1B19}
.fxd-now .r{font-size:15.5px;font-weight:500}
.fxd-now .s{font-size:12.5px;color:#A29D97;margin-top:2px}
.fxd-now .s.bad{color:#E5484D}
.fxd-j{display:grid;grid-template-columns:auto minmax(40px,1fr) auto;gap:10px;align-items:center;margin-top:12px;font-size:12px;color:#A29D97}
.fxd-j .t{position:relative;height:4px;border-radius:999px;background:#2D2A27}
.fxd-j .t i{position:absolute;inset:0 auto 0 0;width:var(--p);border-radius:999px;background:#8A847E}
.fxd-j .t b{position:absolute;top:50%;left:var(--p);width:12px;height:12px;border-radius:50%;background:#F2EFEB;border:2px solid #1C1B19;transform:translate(-50%,-50%)}
.fxd-now .btn2{margin-top:12px}
.fxd-hours{display:flex;justify-content:space-between;align-items:baseline;font-size:13.5px;margin-bottom:8px}
.fxd-hours small{color:#8A847E;font-size:12px}
.fxd-bar{height:6px;border-radius:999px;background:#272523;overflow:hidden}
.fxd-bar i{display:block;height:100%;border-radius:999px;background:var(--c,#8A847E)}
.fxd-grid{display:grid;grid-template-columns:96px minmax(0,1fr);row-gap:2px;font-size:13.5px}
.fxd-grid dt{color:#8A847E;padding:8px 0}
.fxd-grid dd{margin:0;display:flex;align-items:center;gap:6px;min-width:0;padding:4px 0}
.fxd-grid dd span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:all}
.fxd-copy{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;color:#8A847E;flex:none}
.fxd-copy:hover{background:#272523;color:#F2EFEB}
.fxd-list{display:flex;flex-direction:column}
.fxd-trip{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 0;border-top:1px solid rgba(255,244,234,.07)}
.fxd-trip:first-child{border-top:0;padding-top:2px}
.fxd-trip .tm{font-size:12.5px;color:#A29D97}
.fxd-trip .rt{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fxd-trip .cl{font-size:12px;color:#8A847E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fxd-trip.done .rt,.fxd-trip.done .tm{color:#8A847E}
.fxd-st{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#C9C3BD;white-space:nowrap}
.fxd-st i{width:6px;height:6px;border-radius:50%;background:var(--t)}
.fxd-doc{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 0;border-top:1px solid rgba(255,244,234,.07)}
.fxd-doc:first-child{border-top:0;padding-top:2px}
.fxd-doc .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;border:1px solid rgba(255,244,234,.1);color:var(--t)}
.fxd-doc .nm{font-weight:500}
.fxd-doc .in{font-size:12px;color:#8A847E}
.fxd-doc .dt{text-align:right;font-size:12.5px}
.fxd-doc .dt small{display:block;color:var(--t);font-weight:500}
.fxd-empty{padding:18px 16px;border-radius:14px;background:#1C1B19;color:#A29D97;font-size:13px}
.fxd-foot{display:flex;gap:8px;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(255,244,234,.07);background:#151413}
.fxd-primary{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:12px;background:#FF6A2B!important;color:#fff!important;font-weight:600!important}
.fxd-primary:hover{background:#FF8750!important}
.btn2{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,244,234,.14)!important;font-size:13px;font-weight:500}
.btn2:hover{background:#272523!important}
.fxd-kbd{font-size:11px;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.35);border-radius:5px;padding:0 5px;margin-left:4px}
.fxd-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:130;background:#EDEBE8;color:#111;padding:10px 16px;border-radius:999px;font:500 13.5px Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}
`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const P = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.5 3.8-5 7-5s5.8 1.5 7 5"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/>'
  };
  const ic = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TONE = { live: '#4CAF6A', bad: '#E5484D', warn: '#E0A23A', muted: '#8A847E' };
  const tone = t => TONE[t] || TONE.muted;

  let scrim, panel, data, tab = 'overview', lastFocus = null;

  function say(msg) {
    if (typeof window.toast === 'function') return window.toast(msg);
    const t = document.createElement('div'); t.className = 'fxd-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }
  function copy(v) {
    try { navigator.clipboard.writeText(v).then(() => say('Copied ' + v), () => say(v)); } catch (e) { say(v); }
  }

  function ensure() {
    if (panel) return;
    scrim = document.createElement('div'); scrim.className = 'fxd-scrim'; scrim.hidden = true;
    panel = document.createElement('aside'); panel.className = 'fxd'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Driver details');
    document.body.append(scrim, panel);
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); close(); } }, true);
  }

  const overview = d => {
    const n = d.now;
    let now = '';
    if (n && n.route) {
      now = `<div class="fxd-now"><div class="r">${esc(n.route)}</div><div class="s ${n.late ? 'bad' : ''}">${esc(n.detail)}</div>
        ${n.progress != null ? `<div class="fxd-j num" style="--p:${Math.round(n.progress * 100)}%"><span>${esc(n.from)}</span><span class="t" data-tip="${Math.round(n.progress * 100)}% of the planned time has passed"><i></i><b></b></span><span>${esc(n.to)}</span></div>` : ''}</div>`;
    } else if (d.alert) {
      now = `<div class="fxd-now"><div class="r">${esc(d.alert.title)}</div><div class="s">${esc(d.alert.text)}</div>${d.alert.action ? `<button class="btn2" type="button" data-alert>${esc(d.alert.action)}</button>` : ''}</div>`;
    } else if (n) {
      now = `<div class="fxd-now"><div class="r">${esc(n.title)}</div><div class="s">${esc(n.detail || '')}</div></div>`;
    }
    const hours = d.drivenH == null ? '' : (() => {
      const h = d.drivenH, left = Math.max(0, 9 - h), pct = Math.min(100, h / 9 * 100), f = x => `${Math.floor(x)}h ${String(Math.round((x % 1) * 60)).padStart(2, '0')}m`;
      return `<section class="fxd-sec"><h3 class="fxd-h">Driving time today</h3><div class="fxd-hours num" data-tip="Daily driving limit\nEU rules allow 9 hours of driving a day, 10 hours twice a week."><span>${f(h)} driven</span><small>${f(left)} left of 9h</small></div><div class="fxd-bar"><i style="width:${pct}%;--c:${pct > 85 ? TONE.warn : TONE.muted}"></i></div></section>`;
    })();
    const row = (label, val, copyable) => val ? `<dt>${label}</dt><dd><span class="${label === 'Phone' ? 'num' : ''}">${esc(val)}</span>${copyable ? `<button class="fxd-copy" type="button" data-copy="${esc(val)}" data-tip="Copy ${label.toLowerCase()}" aria-label="Copy ${label.toLowerCase()}">${ic('copy', 14)}</button>` : ''}</dd>` : '';
    return `<section class="fxd-sec"><h3 class="fxd-h">Right now</h3>${now}</section>${hours}
      <section class="fxd-sec"><h3 class="fxd-h">Details</h3><dl class="fxd-grid">${row('Phone', d.phone, true)}${row('Email', d.email, true)}${row('Vehicle', d.vehicle)}${row('Home base', d.base)}</dl></section>`;
  };
  const tripsTab = d => d.trips.length
    ? `<div class="fxd-list">${d.trips.map(t => `<div class="fxd-trip ${t.tone === 'done' ? 'done' : ''}"><span class="tm num">${esc(t.time)}</span><div style="min-width:0"><div class="rt">${esc(t.route)}</div><div class="cl">${esc(t.client || '')}</div></div><span class="fxd-st" style="--t:${t.tone === 'done' ? '#57524D' : tone(t.tone)}"><i></i>${esc(t.status)}</span></div>`).join('')}</div>`
    : `<div class="fxd-empty">${esc(d.emptyTrips || 'No trips planned today.')}</div>`;
  const docsTab = d => `<div class="fxd-list">${d.docs.map(x => {
    const t = x.state === 'expired' ? 'bad' : x.state === 'expiring' ? 'warn' : 'muted';
    return `<div class="fxd-doc" style="--t:${tone(t)}" ${x.info ? `data-tip="${esc(x.label + '\n' + x.info)}" tabindex="0"` : ''}><span class="ic">${ic(x.icon || 'card', 17)}</span><div style="min-width:0"><div class="nm">${esc(x.label)}</div><div class="in">${esc(x.date)}</div></div><div class="dt"><small>${esc(x.when)}</small></div></div>`;
  }).join('')}</div>`;

  function render() {
    const d = data, issues = d.docs.filter(x => x.state !== 'ok').length;
    panel.innerHTML = `
      <div class="fxd-top"><span>Driver</span><button class="fxd-ib" type="button" data-profile data-tip="Open full profile" aria-label="Open full profile">${ic('ext', 17)}</button><button class="fxd-ib" type="button" data-close data-tip="Close (Esc)" aria-label="Close">${ic('x', 18)}</button></div>
      <div class="fxd-id"><span class="fxd-av" style="--t:${tone(d.status.tone)}">${esc(d.ini)}<i></i></span><div style="min-width:0"><div class="fxd-name">${esc(d.name)}</div><div class="fxd-veh">${esc(d.vehicle || '')}</div><span class="fxd-status" style="--t:${tone(d.status.tone)};color:${d.status.tone === 'bad' ? TONE.bad : '#C9C3BD'}"><i></i>${esc(d.status.text)}</span></div></div>
      <div class="fxd-acts">
        <button class="fxd-act" type="button" data-copy="${esc(d.phone || '')}" ${d.phone ? '' : 'disabled'}>${ic('phone', 18)}Copy phone</button>
        <button class="fxd-act" type="button" data-msg>${ic('msg', 18)}Message</button>
        <button class="fxd-act" type="button" data-add>${ic('plus', 18)}Add trip</button>
      </div>
      <div class="fxd-tabs" role="tablist">
        ${[['overview', 'Overview', ''], ['trips', 'Trips', d.trips.length], ['docs', 'Documents', issues ? issues : '']].map(([k, l, n]) => `<button class="fxd-tab" role="tab" type="button" data-tab="${k}" aria-selected="${tab === k}">${l}${n !== '' ? `<b class="num">${n}</b>` : ''}</button>`).join('')}
      </div>
      <div class="fxd-body">${tab === 'overview' ? overview(d) : tab === 'trips' ? tripsTab(d) : docsTab(d)}</div>
      <div class="fxd-foot"><button class="fxd-primary" type="button" data-profile>${ic('user', 16)}Open full profile</button></div>`;
    const A = d.actions || {};
    panel.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    panel.querySelectorAll('[data-profile]').forEach(b => b.onclick = () => (A.profile ? A.profile(d) : say('Driver profile page is not in this prototype yet')));
    panel.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => b.dataset.copy && copy(b.dataset.copy));
    panel.querySelector('[data-msg]').onclick = () => (A.message ? A.message(d) : say('Message draft opened for ' + d.name));
    panel.querySelector('[data-add]').onclick = () => (A.addTrip ? A.addTrip(d) : say('New trip form opened for ' + d.name));
    const al = panel.querySelector('[data-alert]'); if (al) al.onclick = () => { close(); A.alert && A.alert(d); };
    panel.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); panel.querySelector(`[data-tab="${tab}"]`).focus(); });
  }

  function open(d) {
    ensure(); data = d; tab = 'overview'; lastFocus = document.activeElement;
    render(); scrim.hidden = false; panel.hidden = false;
    requestAnimationFrame(() => { scrim.classList.add('is-open'); panel.classList.add('is-open'); panel.querySelector('[data-close]').focus(); });
  }
  function close() {
    if (!panel || panel.hidden) return;
    scrim.classList.remove('is-open'); panel.classList.remove('is-open');
    const done = () => { scrim.hidden = true; panel.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.FxDriver = { open, close };
})();
