/* =====================================================================================
   PandaFit · kit d'interface des consoles web (super admin, coach, espace RH) — 15.11.2026
   Demande de Dan : plus aucun élément « standard du navigateur ».
   - alert()  → petit message en haut de l'écran (ou fenêtre si le texte est long)
   - uiConfirm(texte) / uiPrompt(texte, défaut) → fenêtres maison (à utiliser avec await)
   - listes déroulantes, cases à cocher, boutons radio, choix de fichier, dates : dessinés par nous
   Chaque console garde ses couleurs (variables --primary, --text, --border… de sa page).
   Une liste déroulante qui doit rester native : attribut data-ui-native.
   ===================================================================================== */
(() => {
  const css = `
  :root { --ui-ink: var(--text, #17324d); --ui-dim: var(--text-dim, var(--dim, #5d7085)); --ui-line: var(--border, #dfe4dc);
          --ui-acc: var(--primary, #1c9a7c); --ui-field: var(--field, #fff); --ui-danger: #c8364a; }
  /* champs */
  input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; }
  input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"] { color-scheme: light; min-height: 46px; }
  input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator,
  input[type="datetime-local"]::-webkit-calendar-picker-indicator, input[type="month"]::-webkit-calendar-picker-indicator {
    cursor: pointer; opacity: .55; width: 18px; height: 18px; padding: 4px; border-radius: 6px;
  }
  input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover { opacity: 1; background-color: rgba(28,154,124,.12); }
  /* cases à cocher et boutons radio */
  input[type="checkbox"]:not(.ui-native), input[type="radio"]:not(.ui-native) {
    -webkit-appearance: none; appearance: none; width: 20px !important; height: 20px !important; min-width: 20px; flex: none;
    margin: 0 !important; padding: 0 !important; border: 1.5px solid #b9c2bd !important; background: #fff !important;
    border-radius: 6px; cursor: pointer; display: inline-grid; place-content: center; vertical-align: -4px;
    transition: background .12s, border-color .12s; box-shadow: none !important;
  }
  input[type="radio"]:not(.ui-native) { border-radius: 50%; }
  input[type="checkbox"]:not(.ui-native)::before {
    content: ""; width: 11px; height: 11px; transform: scale(0); transition: transform .12s;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); background: #fff;
  }
  input[type="radio"]:not(.ui-native)::before { content: ""; width: 9px; height: 9px; border-radius: 50%; transform: scale(0); transition: transform .12s; background: #fff; }
  input[type="checkbox"]:not(.ui-native):checked, input[type="radio"]:not(.ui-native):checked { background: var(--ui-acc) !important; border-color: var(--ui-acc) !important; }
  input[type="checkbox"]:not(.ui-native):checked::before, input[type="radio"]:not(.ui-native):checked::before { transform: scale(1); }
  input[type="checkbox"]:not(.ui-native):focus-visible, input[type="radio"]:not(.ui-native):focus-visible { outline: 3px solid rgba(28,154,124,.25); outline-offset: 1px; }
  input[type="checkbox"]:disabled, input[type="radio"]:disabled { opacity: .45; cursor: not-allowed; }

  /* liste déroulante maison */
  .ui-select-wrap { position: relative; display: block; min-width: 0; }
  .ui-select-wrap.inline { display: inline-block; vertical-align: middle; }
  .ui-select-btn {
    width: 100%; display: flex !important; align-items: center; gap: 10px; text-align: left; cursor: pointer;
    padding: 12px 14px !important; min-height: 46px; border-radius: 10px !important; border: 1px solid var(--ui-line) !important;
    background: var(--ui-field) !important; color: var(--ui-ink) !important; font: inherit !important; font-size: 14.5px !important; font-weight: 500 !important;
    box-shadow: 0 1px 2px rgba(23,50,77,.04); transition: border-color .12s, box-shadow .12s; margin: 0;
  }
  .ui-select-btn:hover { border-color: #b9c2bd !important; }
  .ui-select-btn:focus-visible, .ui-select-btn.open { outline: none; border-color: var(--ui-acc) !important; box-shadow: 0 0 0 3px rgba(28,154,124,.15); }
  .ui-select-btn .ui-select-txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ui-select-btn .ui-select-txt.placeholder { color: var(--ui-dim); }
  .ui-select-btn svg { flex: none; width: 16px; height: 16px; color: var(--ui-dim); transition: transform .15s; }
  .ui-select-btn.open svg { transform: rotate(180deg); }
  .ui-select-btn:disabled { opacity: .5; cursor: not-allowed; }
  .ui-pop {
    position: fixed; z-index: 10000; background: #fff; color: #17324d; border: 1px solid #dfe4dc; border-radius: 12px;
    box-shadow: 0 14px 40px rgba(23,50,77,.18), 0 2px 6px rgba(23,50,77,.08); padding: 6px; overflow-y: auto; max-height: 320px;
    font-family: inherit; font-size: 14px; animation: uiPopIn .12s ease-out;
  }
  @keyframes uiPopIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .ui-opt { padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; line-height: 1.3; }
  .ui-opt:hover, .ui-opt.hl { background: #eef3ef; }
  .ui-opt.sel { font-weight: 700; color: #12735c; }
  .ui-opt.sel::after { content: ""; margin-left: auto; width: 12px; height: 9px; flex: none; background: #1c9a7c; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
  .ui-opt.dis { opacity: .4; cursor: default; }
  .ui-optgroup { padding: 10px 12px 4px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #8796a3; }

  /* choix de fichier maison */
  .ui-file { display: flex; align-items: center; gap: 10px; min-width: 0; margin: 0 0 10px; }
  .ui-file-btn {
    flex: none; display: inline-flex !important; align-items: center; gap: 8px; padding: 10px 14px !important; border-radius: 10px !important;
    border: 1.5px dashed #b9c2bd !important; background: var(--ui-field) !important; color: var(--ui-ink) !important; font: inherit !important;
    font-size: 13.5px !important; font-weight: 700 !important; cursor: pointer; width: auto !important; margin: 0;
  }
  .ui-file-btn:hover { border-color: var(--ui-acc) !important; color: var(--ui-acc) !important; }
  .ui-file-btn svg { width: 16px; height: 16px; }
  .ui-file-name { font-size: 13px; color: var(--ui-dim); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ui-file-name.has { color: var(--ui-ink); font-weight: 600; }

  /* messages et fenêtres */
  .ui-toasts { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 10002; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; width: min(560px, calc(100vw - 32px)); }
  .ui-toast {
    pointer-events: auto; display: flex; align-items: flex-start; gap: 10px; background: #17324d; color: #fff; border-radius: 12px;
    padding: 12px 16px; font: 600 14px/1.4 inherit; font-family: inherit; box-shadow: 0 10px 30px rgba(23,50,77,.25); cursor: pointer;
    animation: uiToastIn .18s ease-out; max-width: 100%; white-space: pre-line;
  }
  .ui-toast.ok { background: #12735c; }
  .ui-toast.err { background: #b3263a; }
  .ui-toast svg { flex: none; width: 18px; height: 18px; margin-top: 1px; }
  .ui-toast.out { opacity: 0; transform: translateY(-6px); transition: all .2s; }
  @keyframes uiToastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  .ui-modal-back { position: fixed; inset: 0; z-index: 10001; background: rgba(15,30,45,.42); display: flex; align-items: center; justify-content: center; padding: 16px; animation: uiFade .15s; }
  @keyframes uiFade { from { opacity: 0; } to { opacity: 1; } }
  .ui-modal {
    background: #fff; color: #17324d; border-radius: 18px; width: min(460px, 100%); padding: 24px 24px 18px; font-family: inherit;
    box-shadow: 0 24px 70px rgba(15,30,45,.3); animation: uiPopIn .16s ease-out;
  }
  .ui-modal-ic { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #e2f3ee; color: #1c9a7c; margin-bottom: 14px; }
  .ui-modal-ic.danger { background: #fbe5e8; color: #c8364a; }
  .ui-modal-ic svg { width: 22px; height: 22px; }
  .ui-modal p { margin: 0; font-size: 15px; line-height: 1.5; white-space: pre-line; color: #17324d; font-weight: 500; }
  .ui-modal input { width: 100%; box-sizing: border-box; margin: 14px 0 0 !important; padding: 12px 14px !important; border-radius: 10px !important;
    border: 1px solid #cfd6d0 !important; background: #fff !important; color: #17324d !important; font: inherit !important; font-size: 15px !important; }
  .ui-modal input:focus { outline: none; border-color: #1c9a7c !important; box-shadow: 0 0 0 3px rgba(28,154,124,.15); }
  .ui-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  .ui-modal-actions button { width: auto !important; min-width: 96px; padding: 11px 18px !important; border-radius: 10px !important; font: inherit !important;
    font-weight: 700 !important; font-size: 14px !important; cursor: pointer; border: 1px solid transparent !important; margin: 0; }
  .ui-btn-cancel { background: #fff !important; color: #17324d !important; border-color: #dfe4dc !important; }
  .ui-btn-cancel:hover { background: #f3f5f1 !important; }
  .ui-btn-ok { background: #1c9a7c !important; color: #fff !important; }
  .ui-btn-ok:hover { background: #17876c !important; }
  .ui-btn-ok.danger { background: #c8364a !important; }
  .ui-btn-ok.danger:hover { background: #b02c3f !important; }

  /* calendrier et heure maison */
  .ui-cal { width: 304px; max-height: none !important; padding: 14px; }
  .ui-cal-head { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .ui-cal-title { flex: 1; text-align: center; font-weight: 800; font-size: 15px; text-transform: capitalize; color: #17324d; }
  .ui-cal-title-btn { display: flex; align-items: center; justify-content: center; gap: 4px; height: 34px; border: 0; background: transparent; border-radius: 9px;
    font-family: inherit; cursor: pointer; padding: 0 8px; }
  .ui-cal-title-btn:hover { background: #eef3ef; color: #12735c; }
  .ui-cal-title-btn svg { width: 15px; height: 15px; color: #8796a3; }
  .ui-cal-months { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .ui-cal-month { height: 48px; border-radius: 10px; border: 0; background: transparent; color: #17324d; font: inherit; font-size: 14px; font-weight: 700;
    cursor: pointer; text-transform: capitalize; }
  .ui-cal-month:hover { background: #eef3ef; }
  .ui-cal-month.today { box-shadow: inset 0 0 0 1.5px #1c9a7c; color: #12735c; }
  .ui-cal-month.sel { background: #1c9a7c; color: #fff; box-shadow: none; }
  .ui-cal-month:disabled { opacity: .3; cursor: not-allowed; background: transparent; }
  .ui-cal-nav { width: 34px; height: 34px; border-radius: 9px; border: 1px solid #e1e6df; background: #fff; color: #17324d; cursor: pointer;
    display: flex; align-items: center; justify-content: center; padding: 0; }
  .ui-cal-nav:hover { background: #f0f3ee; }
  .ui-cal-nav svg { width: 16px; height: 16px; }
  .ui-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .ui-cal-dow { font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #8796a3; text-align: center; padding: 4px 0 6px; }
  .ui-cal-day { height: 36px; border-radius: 9px; border: 0; background: transparent; color: #17324d; font: inherit; font-size: 13.5px; font-weight: 600;
    cursor: pointer; padding: 0; font-variant-numeric: tabular-nums; position: relative; }
  .ui-cal-day:hover { background: #eef3ef; }
  .ui-cal-day.out { color: #b4bec6; font-weight: 500; }
  .ui-cal-day.we { color: #5d7085; }
  .ui-cal-day.today { box-shadow: inset 0 0 0 1.5px #1c9a7c; color: #12735c; }
  .ui-cal-day.sel { background: #1c9a7c; color: #fff; box-shadow: none; }
  .ui-cal-day:disabled { opacity: .3; cursor: not-allowed; background: transparent; }
  .ui-cal-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eef1ec; }
  .ui-cal-link { background: none; border: 0; padding: 6px 8px; border-radius: 8px; color: #12735c; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  .ui-cal-link:hover { background: #eef3ef; }
  .ui-cal-link.muted { color: #5d7085; }
  .ui-time { display: flex; gap: 8px; align-items: stretch; }
  .ui-time-col { flex: 1; height: 168px; overflow-y: auto; border: 1px solid #eef1ec; border-radius: 10px; padding: 4px; position: relative; }
  .ui-time-col button { display: block; width: 100%; border: 0; background: transparent; border-radius: 7px; padding: 7px 0; font: inherit; font-size: 14px;
    font-weight: 600; color: #17324d; cursor: pointer; font-variant-numeric: tabular-nums; }
  .ui-time-col button:hover { background: #eef3ef; }
  .ui-time-col button.sel { background: #1c9a7c; color: #fff; }
  .ui-time-sep { display: flex; align-items: center; font-weight: 800; color: #8796a3; }
  .ui-time-lbl { font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #8796a3; margin: 12px 0 6px; }

  /* barres de défilement discrètes */
  * { scrollbar-width: thin; scrollbar-color: #c9d0ca transparent; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: #c9d0ca; border-radius: 99px; border: 3px solid transparent; background-clip: content-box; }
  ::-webkit-scrollbar-track { background: transparent; }
  `;
  const style = document.createElement('style');
  style.id = 'console-ui-css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  const ICON = {
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- messages (remplace alert) ---------- */
  let toastBox = null;
  function toast(msg, kind) {
    if (!toastBox || !toastBox.isConnected) { toastBox = document.createElement('div'); toastBox.className = 'ui-toasts'; document.body.appendChild(toastBox); }
    const el = document.createElement('div');
    el.className = 'ui-toast ' + (kind || '');
    el.innerHTML = (kind === 'err' ? ICON.warn : kind === 'ok' ? ICON.ok : ICON.info) + `<span>${esc(msg)}</span>`;
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 220); };
    el.addEventListener('click', close);
    toastBox.appendChild(el);
    setTimeout(close, kind === 'err' ? 8000 : 4500);
  }
  function kindOf(msg) {
    const m = String(msg);
    if (/^(erreur|impossible|échec|error)|n'a pas pu|a échoué|introuvable/i.test(m)) return 'err';
    if (/(enregistré|envoyé|copié|publié|créé|mis à jour|supprimé|ajouté|figée|c'est noté)/i.test(m)) return 'ok';
    return '';
  }
  function uiAlert(msg) {
    const m = String(msg ?? '');
    // un texte long ou sur plusieurs lignes (clé, lien, explication) reste affiché jusqu'au clic
    if (m.length > 110 || m.includes('\n')) return modal({ text: m, icon: kindOf(m) === 'err' ? 'warn' : 'info', danger: kindOf(m) === 'err', ok: 'OK', cancel: null });
    toast(m, kindOf(m));
    return Promise.resolve();
  }

  /* ---------- fenêtres (remplacent confirm / prompt) ---------- */
  function modal({ text, icon, danger, ok, cancel, input }) {
    return new Promise(resolve => {
      const prevFocus = document.activeElement;
      const back = document.createElement('div');
      back.className = 'ui-modal-back';
      back.innerHTML = `<div class="ui-modal" role="dialog" aria-modal="true">
        <div class="ui-modal-ic${danger ? ' danger' : ''}">${ICON[icon] || ICON.help}</div>
        <p>${esc(text)}</p>
        ${input ? `<input type="text" value="${esc(input.value ?? '')}">` : ''}
        <div class="ui-modal-actions">${cancel ? `<button type="button" class="ui-btn-cancel">${esc(cancel)}</button>` : ''}<button type="button" class="ui-btn-ok${danger ? ' danger' : ''}">${esc(ok)}</button></div>
      </div>`;
      const field = back.querySelector('input');
      const done = val => { back.remove(); document.removeEventListener('keydown', onKey, true); try { prevFocus?.focus?.(); } catch (e) {} resolve(val); };
      const yes = () => done(input ? field.value : true);
      const no = () => done(input ? null : false);
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel ? no() : yes(); }
        else if (e.key === 'Enter' && (input || document.activeElement?.closest('.ui-modal'))) { e.preventDefault(); e.stopPropagation(); yes(); }
      };
      back.querySelector('.ui-btn-ok').addEventListener('click', yes);
      back.querySelector('.ui-btn-cancel')?.addEventListener('click', no);
      back.addEventListener('mousedown', e => { if (e.target === back) cancel ? no() : yes(); });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(back);
      setTimeout(() => (field ? (field.focus(), field.select()) : back.querySelector('.ui-btn-ok').focus()), 30);
    });
  }
  const DANGER = /supprim|retirer|terminer|annuler cette|définitiv|renvoyer|clôturer|recharger/i;
  function uiConfirm(text, opts = {}) {
    const danger = opts.danger ?? DANGER.test(text);
    const okLabel = opts.ok || (/supprim/i.test(text) ? 'Supprimer' : /retirer/i.test(text) ? 'Retirer' : /terminer|clôturer/i.test(text) ? 'Terminer' : 'Confirmer');
    return modal({ text, icon: danger ? 'warn' : 'help', danger, ok: okLabel, cancel: opts.cancel || 'Annuler' });
  }
  function uiPrompt(text, value) {
    return modal({ text, icon: 'edit', ok: 'Valider', cancel: 'Annuler', input: { value: value ?? '' } });
  }
  window.uiAlert = uiAlert; window.uiConfirm = uiConfirm; window.uiPrompt = uiPrompt; window.uiToast = toast;
  window.alert = msg => { uiAlert(msg); };

  /* ---------- listes déroulantes maison ---------- */
  let openPop = null;
  function closePop() { if (openPop) { openPop.btn.classList.remove('open'); openPop.el.remove(); openPop = null; } }
  function optLabel(sel) {
    const o = sel.options[sel.selectedIndex];
    return o ? o.textContent : '';
  }
  function syncBtn(sel) {
    const btn = sel._uiBtn; if (!btn) return;
    const txt = btn.querySelector('.ui-select-txt');
    const o = sel.options[sel.selectedIndex];
    txt.textContent = optLabel(sel) || '—';
    txt.classList.toggle('placeholder', !o || o.value === '');
    btn.disabled = sel.disabled;
  }
  function openList(sel) {
    const btn = sel._uiBtn;
    if (openPop && openPop.sel === sel) { closePop(); return; }
    closePop();
    const pop = document.createElement('div');
    pop.className = 'ui-pop'; pop.setAttribute('role', 'listbox');
    const items = [];
    [...sel.children].forEach(ch => {
      const add = (o) => {
        const d = document.createElement('div');
        d.className = 'ui-opt' + (o.selected ? ' sel' : '') + (o.disabled ? ' dis' : '');
        d.textContent = o.textContent || '—';
        d.dataset.i = o.index;
        if (!o.disabled) items.push(d);
        pop.appendChild(d);
      };
      if (ch.tagName === 'OPTGROUP') {
        const g = document.createElement('div'); g.className = 'ui-optgroup'; g.textContent = ch.label; pop.appendChild(g);
        [...ch.children].forEach(add);
      } else if (ch.tagName === 'OPTION') add(ch);
    });
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.minWidth = r.width + 'px';
    pop.style.maxWidth = Math.max(r.width, Math.min(480, window.innerWidth - 24)) + 'px';
    const below = window.innerHeight - r.bottom - 8, above = r.top - 8;
    const h = Math.min(320, pop.scrollHeight);
    if (below < h && above > below) { pop.style.top = Math.max(8, r.top - Math.min(h, above) - 4) + 'px'; pop.style.maxHeight = Math.min(320, above) + 'px'; }
    else { pop.style.top = (r.bottom + 4) + 'px'; pop.style.maxHeight = Math.max(120, Math.min(320, below)) + 'px'; }
    pop.style.left = Math.min(r.left, window.innerWidth - pop.offsetWidth - 8) + 'px';
    btn.classList.add('open');
    let hl = items.findIndex(d => d.classList.contains('sel'));
    const setHl = i => { items.forEach(d => d.classList.remove('hl')); hl = i; if (items[i]) { items[i].classList.add('hl'); items[i].scrollIntoView({ block: 'nearest' }); } };
    setHl(Math.max(0, hl));
    const choose = d => {
      const i = Number(d.dataset.i);
      if (sel.selectedIndex !== i) {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncBtn(sel); closePop(); btn.focus();
    };
    pop.addEventListener('mousedown', e => e.preventDefault());
    pop.addEventListener('click', e => { const d = e.target.closest('.ui-opt'); if (d && !d.classList.contains('dis')) choose(d); });
    pop.addEventListener('mousemove', e => { const d = e.target.closest('.ui-opt'); const i = items.indexOf(d); if (i >= 0 && i !== hl) setHl(i); });
    openPop = { el: pop, btn, sel, items, get hl() { return hl; }, setHl, choose };
  }
  document.addEventListener('mousedown', e => { if (openPop && !openPop.el.contains(e.target) && !openPop.btn.contains(e.target)) closePop(); }, true);
  window.addEventListener('resize', closePop);
  document.addEventListener('scroll', e => { if (openPop && !openPop.el.contains(e.target)) closePop(); }, true);
  document.addEventListener('keydown', e => {
    if (!openPop) return;
    if (e.key === 'Escape') { e.preventDefault(); const b = openPop.btn; closePop(); b.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); openPop.setHl(Math.min(openPop.items.length - 1, openPop.hl + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); openPop.setHl(Math.max(0, openPop.hl - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const d = openPop.items[openPop.hl]; if (d) openPop.choose(d); }
  }, true);

  function enhanceSelect(sel) {
    if (sel._uiBtn || sel.multiple || sel.hasAttribute('data-ui-native') || Number(sel.size) > 1) return;
    const wrap = document.createElement('span');
    wrap.className = 'ui-select-wrap';
    // largeur : on reprend celle demandée à la liste (sinon pleine largeur, comme les champs des consoles)
    const st = sel.style;
    const w = st.width || (getComputedStyle(sel).width === 'auto' ? '' : '');
    if (st.width && st.width !== '100%') { wrap.style.width = st.width; if (/auto/.test(st.width)) wrap.classList.add('inline'); }
    if (st.flex) wrap.style.flex = st.flex;
    if (st.minWidth) wrap.style.minWidth = st.minWidth;
    if (st.maxWidth) wrap.style.maxWidth = st.maxWidth;
    if (st.marginBottom) wrap.style.marginBottom = st.marginBottom; else if (getComputedStyle(sel).marginBottom !== '0px') wrap.style.marginBottom = getComputedStyle(sel).marginBottom;
    if (st.marginTop) wrap.style.marginTop = st.marginTop;
    if (st.gridColumn) wrap.style.gridColumn = st.gridColumn;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ui-select-btn';
    if (sel.title) btn.title = sel.title;
    if (st.fontSize) btn.style.setProperty('font-size', st.fontSize, 'important');
    if (st.padding && /^(\d+px)( \d+px)?$/.test(st.padding) && parseInt(st.padding) < 10) btn.style.setProperty('padding', '7px 10px', 'important'), btn.style.minHeight = '34px';
    btn.innerHTML = `<span class="ui-select-txt"></span>${ICON.chev}`;
    btn.addEventListener('click', () => { syncBtn(sel); openList(sel); });
    btn.addEventListener('keydown', e => { if (!openPop && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); openList(sel); } });
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn);
    wrap.appendChild(sel);
    sel.style.display = 'none';
    sel._uiBtn = btn;
    sel.addEventListener('change', () => syncBtn(sel));
    // si le code change la valeur sans événement, on garde le bouton à jour
    new MutationObserver(() => syncBtn(sel)).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    syncBtn(sel);
  }
  // valeur changée par le code (sel.value = …) : on met le bouton à jour
  const vDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  const iDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  if (vDesc?.set) Object.defineProperty(HTMLSelectElement.prototype, 'value', { configurable: true, get() { return vDesc.get.call(this); }, set(v) { vDesc.set.call(this, v); if (this._uiBtn) syncBtn(this); } });
  if (iDesc?.set) Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', { configurable: true, get() { return iDesc.get.call(this); }, set(v) { iDesc.set.call(this, v); if (this._uiBtn) syncBtn(this); } });

  /* ---------- choix de fichier maison ---------- */
  function enhanceFile(inp) {
    if (inp._uiFile || inp.hasAttribute('data-ui-native')) return;
    const box = document.createElement('div');
    box.className = 'ui-file';
    const isImg = /image/.test(inp.accept || '');
    const isPdf = /pdf/.test(inp.accept || '');
    const label = inp.dataset.label || (inp.multiple ? 'Choisir des fichiers' : isImg ? 'Choisir une image' : isPdf ? 'Choisir un PDF' : 'Choisir un fichier');
    box.innerHTML = `<button type="button" class="ui-file-btn">${ICON.up}<span>${esc(label)}</span></button><span class="ui-file-name">Aucun fichier</span>`;
    const name = box.querySelector('.ui-file-name');
    box.querySelector('button').addEventListener('click', () => inp.click());
    const upd = () => {
      const f = [...(inp.files || [])];
      name.textContent = f.length ? (f.length > 1 ? `${f.length} fichiers` : f[0].name) : 'Aucun fichier';
      name.classList.toggle('has', !!f.length);
    };
    inp.addEventListener('change', upd);
    inp.parentNode.insertBefore(box, inp);
    box.appendChild(inp);
    inp.style.display = 'none';
    inp._uiFile = true;
    upd();
  }

  /* ---------- calendrier et heure maison (input date / datetime-local / time) ----------
     Le vrai champ reste dans la page (caché) avec sa valeur au format habituel : le code des consoles ne change pas. */
  const CAL = {
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  };
  const pad = n => String(n).padStart(2, '0');
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDay = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const lang = () => (document.documentElement.lang || 'fr') + '-CH';
  const protoVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function dateLabel(inp) {
    const v = protoVal.get.call(inp);
    if (!v) return '';
    if (inp.type === 'time') return v.slice(0, 5);
    const d = parseDay(v); if (!d) return v;
    const txt = d.toLocaleDateString(lang(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return inp.type === 'datetime-local' ? `${txt} · ${v.slice(11, 16)}` : txt;
  }
  function syncDate(inp) {
    const b = inp._uiDate; if (!b) return;
    const t = b.querySelector('.ui-select-txt'), lbl = dateLabel(inp);
    t.textContent = lbl || (inp.type === 'time' ? 'Choisir une heure' : 'Choisir une date');
    t.classList.toggle('placeholder', !lbl);
    b.disabled = inp.disabled;
  }
  function setDateVal(inp, v) {
    protoVal.set.call(inp, v);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    syncDate(inp);
  }
  function placePop(pop, btn) {
    const r = btn.getBoundingClientRect();
    const h = pop.offsetHeight, w = pop.offsetWidth;
    const below = window.innerHeight - r.bottom - 8;
    pop.style.top = (below < h && r.top > below ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  }
  function timeCols(cur, onPick) {
    const [hh, mm] = (cur || '').split(':').map(Number);
    const mins = []; for (let m = 0; m < 60; m += 5) mins.push(m);
    if (Number.isFinite(mm) && !mins.includes(mm)) { mins.push(mm); mins.sort((a, b) => a - b); }
    const wrap = document.createElement('div'); wrap.className = 'ui-time';
    wrap.innerHTML = `<div class="ui-time-col" data-k="h">${Array.from({ length: 24 }, (_, h) => `<button type="button" data-v="${h}" class="${h === hh ? 'sel' : ''}">${pad(h)}</button>`).join('')}</div>
      <div class="ui-time-sep">:</div>
      <div class="ui-time-col" data-k="m">${mins.map(m => `<button type="button" data-v="${m}" class="${m === mm ? 'sel' : ''}">${pad(m)}</button>`).join('')}</div>`;
    let h = Number.isFinite(hh) ? hh : null, m = Number.isFinite(mm) ? mm : null;
    wrap.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const col = b.parentElement; col.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
      if (col.dataset.k === 'h') { h = +b.dataset.v; if (m === null) { m = 0; wrap.querySelector('[data-k="m"] [data-v="0"]').classList.add('sel'); } }
      else { m = +b.dataset.v; if (h === null) { h = 9; wrap.querySelector('[data-k="h"] [data-v="9"]').classList.add('sel'); } }
      onPick(`${pad(h)}:${pad(m)}`, col.dataset.k);
    });
    setTimeout(() => wrap.querySelectorAll('.ui-time-col').forEach(c => { const s = c.querySelector('.sel'); if (s) c.scrollTop = s.offsetTop - c.clientHeight / 2 + s.offsetHeight / 2; else if (c.dataset.k === 'h') c.scrollTop = 8 * 31; }), 0);
    return wrap;
  }
  function openDate(inp) {
    const btn = inp._uiDate;
    if (openPop && openPop.sel === inp) { closePop(); return; }
    closePop();
    const type = inp.type, v = protoVal.get.call(inp);
    const pop = document.createElement('div');
    pop.className = 'ui-pop ui-cal';
    pop.addEventListener('mousedown', e => e.preventDefault());
    document.body.appendChild(pop);
    btn.classList.add('open');
    openPop = { el: pop, btn, sel: inp, items: [], hl: 0, setHl() {}, choose() {} };

    if (type === 'time') {
      pop.style.width = '220px';
      pop.appendChild(timeCols(v, (t, k) => { setDateVal(inp, t); if (k === 'm') { closePop(); btn.focus(); } }));
      placePop(pop, btn);
      return;
    }
    const min = parseDay(inp.min), max = parseDay(inp.max), today = new Date(); today.setHours(0, 0, 0, 0);
    let sel = parseDay(v), view = new Date((sel || today).getFullYear(), (sel || today).getMonth(), 1);
    let time = type === 'datetime-local' ? (v.slice(11, 16) || '09:00') : null;
    const commit = (day, close) => {
      if (!day) return;
      setDateVal(inp, type === 'datetime-local' ? `${isoDay(day)}T${time}` : isoDay(day));
      if (close) { closePop(); btn.focus(); }
    };
    let mode = 'days'; // 'days' = les jours du mois ; 'months' = les 12 mois (clic sur le titre), flèches = années
    const drawMonths = () => {
      const y = view.getFullYear();
      const cells = [...Array(12)].map((_, m) => {
        const a = new Date(y, m, 1), z = new Date(y, m + 1, 0);
        const off = (min && z < min) || (max && a > max);
        const cls = ['ui-cal-month', sel && sel.getFullYear() === y && sel.getMonth() === m ? 'sel' : '',
          today.getFullYear() === y && today.getMonth() === m ? 'today' : ''].filter(Boolean).join(' ');
        return `<button type="button" class="${cls}" data-m="${m}" ${off ? 'disabled' : ''}>${a.toLocaleDateString(lang(), { month: 'short' }).replace('.', '')}</button>`;
      }).join('');
      pop.innerHTML = `<div class="ui-cal-head"><button type="button" class="ui-cal-nav" data-year="-1" aria-label="Année précédente">${CAL.left}</button>
          <button type="button" class="ui-cal-title ui-cal-title-btn" data-mode="days">${y}</button>
          <button type="button" class="ui-cal-nav" data-year="1" aria-label="Année suivante">${CAL.right}</button></div>
        <div class="ui-cal-months">${cells}</div>
        <div class="ui-cal-foot"><button type="button" class="ui-cal-link" data-today>Aujourd'hui</button><button type="button" class="ui-cal-link muted" data-mode="days">Retour aux jours</button></div>`;
    };
    const draw = () => {
      if (mode === 'months') return drawMonths();
      const first = (view.getDay() + 6) % 7; // lundi en premier
      const start = new Date(view.getFullYear(), view.getMonth(), 1 - first);
      const dows = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang(), { weekday: 'short' }).replace('.', ''));
      let cells = '';
      for (let i = 0; i < 42; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const off = (min && d < min) || (max && d > max);
        const cls = ['ui-cal-day', d.getMonth() !== view.getMonth() ? 'out' : '', i % 7 >= 5 ? 'we' : '',
          +d === +today ? 'today' : '', sel && +d === +sel ? 'sel' : ''].filter(Boolean).join(' ');
        cells += `<button type="button" class="${cls}" data-d="${isoDay(d)}" ${off ? 'disabled' : ''}>${d.getDate()}</button>`;
      }
      pop.innerHTML = `<div class="ui-cal-head"><button type="button" class="ui-cal-nav" data-nav="-1" aria-label="Mois précédent">${CAL.left}</button>
          <button type="button" class="ui-cal-title ui-cal-title-btn" data-mode="months" title="Choisir le mois et l'année">${view.toLocaleDateString(lang(), { month: 'long', year: 'numeric' })}${ICON.chev}</button>
          <button type="button" class="ui-cal-nav" data-nav="1" aria-label="Mois suivant">${CAL.right}</button></div>
        <div class="ui-cal-grid">${dows.map(d => `<div class="ui-cal-dow">${d}</div>`).join('')}${cells}</div>
        ${type === 'datetime-local' ? '<div class="ui-time-lbl">Heure</div>' : ''}
        <div class="ui-cal-foot"><button type="button" class="ui-cal-link" data-today>Aujourd'hui</button>${inp.required ? '' : '<button type="button" class="ui-cal-link muted" data-clear>Effacer</button>'}</div>`;
      if (type === 'datetime-local') {
        pop.querySelector('.ui-time-lbl').after(timeCols(time, t => { time = t; if (sel) commit(sel, false); }));
      }
    };
    pop.addEventListener('click', e => {
      const nav = e.target.closest('[data-nav]');
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); draw(); return; }
      const yr = e.target.closest('[data-year]');
      if (yr) { view = new Date(view.getFullYear() + Number(yr.dataset.year), view.getMonth(), 1); draw(); return; }
      const md = e.target.closest('[data-mode]');
      if (md) { mode = md.dataset.mode; draw(); return; }
      const mo = e.target.closest('[data-m]');
      if (mo && !mo.disabled) { view = new Date(view.getFullYear(), Number(mo.dataset.m), 1); mode = 'days'; draw(); return; }
      const day = e.target.closest('[data-d]');
      if (day && !day.disabled) { sel = parseDay(day.dataset.d); commit(sel, type !== 'datetime-local'); if (type === 'datetime-local') draw(); return; }
      if (e.target.closest('[data-today]')) { mode = 'days'; sel = new Date(today); view = new Date(today.getFullYear(), today.getMonth(), 1); commit(sel, type !== 'datetime-local'); if (type === 'datetime-local') draw(); return; }
      if (e.target.closest('[data-clear]')) { setDateVal(inp, ''); closePop(); btn.focus(); }
    });
    draw();
    placePop(pop, btn);
  }
  function enhanceDate(inp) {
    if (inp._uiDate || inp.hasAttribute('data-ui-native')) return;
    const wrap = document.createElement('span');
    wrap.className = 'ui-select-wrap';
    const st = inp.style;
    if (st.width && st.width !== '100%') { wrap.style.width = st.width; if (/auto/.test(st.width)) wrap.classList.add('inline'); }
    if (st.flex) wrap.style.flex = st.flex;
    if (st.maxWidth) wrap.style.maxWidth = st.maxWidth;
    const mb = st.marginBottom || getComputedStyle(inp).marginBottom;
    if (mb && mb !== '0px') wrap.style.marginBottom = mb;
    if (st.margin) wrap.style.margin = st.margin;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ui-select-btn ui-date-btn';
    btn.innerHTML = `<span class="ui-select-txt"></span>${inp.type === 'time' ? CAL.clock : CAL.cal}`;
    btn.addEventListener('click', () => openDate(inp));
    btn.addEventListener('keydown', e => { if (!openPop && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDate(inp); } });
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(btn); wrap.appendChild(inp);
    inp.style.display = 'none';
    inp._uiDate = btn;
    // valeur changée par le code (inp.value = …) : le bouton suit
    Object.defineProperty(inp, 'value', { configurable: true, get() { return protoVal.get.call(this); }, set(x) { protoVal.set.call(this, x); syncDate(this); } });
    inp.addEventListener('change', () => syncDate(inp));
    new MutationObserver(() => syncDate(inp)).observe(inp, { attributes: true, attributeFilter: ['value', 'disabled', 'min', 'max'] });
    syncDate(inp);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('select').forEach(enhanceSelect);
    root.querySelectorAll('input[type="file"]').forEach(enhanceFile);
    root.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="time"]').forEach(enhanceDate);
  }
  let queued = false;
  const mo = new MutationObserver(() => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; scan(document.body); if (openPop && !openPop.btn.isConnected) closePop(); });
  });
  const start = () => { scan(document.body); mo.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
