/* MonitorCheck — application logic (vanilla JS, no dependencies).
 * All data stays in this browser (localStorage). Nothing is sent anywhere.
 */
(function () {
  'use strict';

  const DATA = window.MC_DATA;
  if (!DATA) return;

  const STORE_KEY = 'monitorcheck:v1';
  const MODELS_KEY = 'monitorcheck:models';
  const THEME_KEY = 'monitorcheck:theme';

  const STATUS = {
    untested: { label: 'Not tested', short: 'Not tested', icon: 'circle' },
    pass: { label: 'Pass', short: 'Pass', icon: 'check' },
    warn: { label: 'Warning', short: 'Warning', icon: 'alert' },
    fail: { label: 'Fail', short: 'Fail', icon: 'x' },
    na: { label: 'Not applicable', short: 'N/A', icon: 'minus' }
  };
  const SEV_LABEL = { low: ['Low', 'info'], medium: ['Medium', 'warn'], high: ['High', 'fail'], critical: ['Critical', 'fail'] };

  /* ------------------------------------------------------------------ storage */
  const storage = {
    get(key) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  function freshState() {
    return { v: 1, mode: 'full', info: {}, results: {}, open: { physical: true }, startedAt: Date.now(), updatedAt: Date.now() };
  }

  let state = Object.assign(freshState(), storage.get(STORE_KEY) || {});
  if (!state.results || typeof state.results !== 'object') state.results = {};
  if (!state.info || typeof state.info !== 'object') state.info = {};
  if (!state.open || typeof state.open !== 'object') state.open = {};
  if (state.mode !== 'quick' && state.mode !== 'full') state.mode = 'full';

  let modelStore = storage.get(MODELS_KEY) || {};
  if (!modelStore.overrides) modelStore.overrides = {};
  if (!Array.isArray(modelStore.custom)) modelStore.custom = [];

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    state.updatedAt = Date.now();
    if (!storage.set(STORE_KEY, state)) toast('Could not save — storage may be disabled in this browser.');
  }
  window.addEventListener('pagehide', saveNow);

  /* ------------------------------------------------------------------ helpers */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const ALL_CHECKS = [];
  DATA.steps.forEach((step) => step.checks.forEach((c) => { c.step = step; ALL_CHECKS.push(c); }));
  const CHECK_BY_ID = Object.fromEntries(ALL_CHECKS.map((c) => [c.id, c]));

  const inMode = (c) => state.mode === 'full' || !!c.q;
  const activeChecks = () => ALL_CHECKS.filter(inMode);
  const statusOf = (id) => {
    const r = state.results[id];
    const s = r && r.s;
    if (s === 'na' && !(CHECK_BY_ID[id] && CHECK_BY_ID[id].na)) return 'untested';
    return STATUS[s] ? s : 'untested';
  };
  const noteOf = (id) => (state.results[id] && state.results[id].n) || '';

  function fmtMinutes(sec) {
    if (sec <= 0) return '0 min';
    const m = Math.max(1, Math.round(sec / 60));
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + r + ' min' : '');
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function confirmDialog(message, okLabel) {
    const dlg = $('#confirm-dialog');
    if (!dlg || typeof dlg.showModal !== 'function') return Promise.resolve(window.confirm(message));
    $('#confirm-msg').textContent = message;
    $('#confirm-ok').textContent = okLabel || 'Delete';
    return new Promise((resolve) => {
      const onClose = () => { dlg.removeEventListener('close', onClose); resolve(dlg.returnValue === 'ok'); };
      dlg.returnValue = '';
      dlg.addEventListener('close', onClose);
      dlg.showModal();
      $('button[value="cancel"]', dlg).focus();
    });
  }

  /* ------------------------------------------------------------------ models */
  function allModels() {
    const presets = DATA.models.map((m) => {
      const o = modelStore.overrides[m.id];
      return Object.assign({}, m, o || {}, { kind: o ? 'edited' : 'official', id: m.id });
    });
    const custom = modelStore.custom.map((m) => Object.assign({}, m, { kind: 'custom' }));
    return presets.concat(custom);
  }
  const modelById = (id) => allModels().find((m) => m.id === id) || null;
  function saveModels() { storage.set(MODELS_KEY, modelStore); }

  /* ------------------------------------------------------------------ rendering: nav */
  function renderNav() {
    const items = [`<li data-target="dashboard"><a href="#dashboard"><span class="nav-num">${icon('dash')}</span><span class="nav-label">Inspection dashboard</span></a></li>`, '<li class="nav-sep" role="presentation"></li>'];
    DATA.steps.forEach((s) => {
      items.push(`<li data-target="step-${s.id}" data-step="${s.id}"><a href="#step-${s.id}"><span class="nav-num">${s.num}</span><span class="nav-label">${esc(s.title)}</span><span class="nav-count"></span></a></li>`);
    });
    items.push('<li class="nav-sep" role="presentation"></li>');
    items.push(`<li data-target="reference"><a href="#reference"><span class="nav-num">${icon('db')}</span><span class="nav-label">Reference models</span></a></li>`);
    items.push(`<li data-target="summary"><a href="#summary"><span class="nav-num">${icon('file')}</span><span class="nav-label">Recommendation</span></a></li>`);
    $('#nav-list').innerHTML = items.join('');
  }

  /* ------------------------------------------------------------------ rendering: steps */
  function linkCard(key) {
    const l = DATA.LINKS[key];
    const short = l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return `<div class="link-card">
      <div><strong>${esc(l.label)}</strong><span class="url">${esc(short)}</span><p>${esc(l.desc)}</p></div>
      <div class="link-actions">
        <a class="btn btn-primary" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${icon('external')}Open<span class="sr-only"> ${esc(l.label)} in a new tab</span></a>
        <button type="button" class="btn copy-btn" data-copy="${esc(l.url)}">${icon('copy')}Copy link</button>
      </div>
    </div>`;
  }

  function guideBlock(c) {
    const rows = [];
    if (c.what) rows.push(['What to inspect', c.what, '']);
    if (c.how) rows.push([c.img ? 'How to test' : 'How to inspect', c.how, '']);
    if (c.ok) rows.push(['What is normal', c.ok, 'g-ok']);
    if (c.bad) rows.push(['Unacceptable', c.bad, 'g-bad']);
    if (c.accept) rows.push(['Is it acceptable?', c.accept, 'g-acc']);
    if (c.rec) rows.push(['Recommendation', c.rec, 'g-bad']);
    if (c.why) rows.push(['Why it matters', c.why, 'g-why']);
    if (!rows.length) return '';
    const label = c.img ? 'How to test &amp; what to do' : 'How to check';
    return `<details class="more"><summary>${icon('chevron')}${label}</summary><dl class="guide-dl">${rows.map((r) => `<div class="${r[2]}"><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl></details>`;
  }

  function checkHTML(c) {
    const opts = ['untested', 'pass', 'warn', 'fail'].concat(c.na ? ['na'] : []);
    const badges = [];
    if (c.c) badges.push(`<span class="pill critical" title="A fail here means do not buy">${icon('shield')}Critical</span>`);
    if (c.sev) { const sv = SEV_LABEL[c.sev]; badges.push(`<span class="pill ${sv[1]} sev">Severity: ${sv[0]}</span>`); }
    if (c.q) badges.push(`<span class="pill quick">${icon('bolt')}Quick</span>`);
    const name = 's-' + c.id;
    const radios = opts.map((s) => `<label class="st st-${s}"><input type="radio" name="${name}" value="${s}" data-check="${c.id}"><span>${icon(STATUS[s].icon)}${STATUS[s].short}</span></label>`).join('');
    const defect = c.img ? `<div class="defect">
        <figure><img src="assets/img/${c.img}.svg" alt="Illustration: ${esc(c.t.toLowerCase())}" width="320" height="200" loading="lazy"></figure>
        <div><p class="defect-def"><strong>What it is:</strong> ${esc(c.def)}</p>${guideBlock(c)}</div>
      </div>` : guideBlock(c);
    const noteLabel = c.note === 'always' ? "Seller's answer / notes" : 'Notes about this problem (optional)';
    return `<article class="check" id="chk-${c.id}" data-check="${c.id}">
      <div class="check-head">
        <h3 class="check-title"><span class="t">${esc(c.t)}</span><span class="check-badges">${badges.join('')}</span></h3>
        <fieldset class="status-group" style="--n:${opts.length}"><legend>Result for: ${esc(c.t)}</legend>${radios}</fieldset>
      </div>
      ${defect}
      <div class="check-note" ${c.note === 'always' ? '' : 'hidden'}>
        <label for="note-${c.id}">${noteLabel}</label>
        <textarea id="note-${c.id}" data-note="${c.id}" rows="2" maxlength="1000" placeholder="${c.note === 'always' ? 'Write down what the seller said' : 'Where is it? How bad is it?'}"></textarea>
      </div>
    </article>`;
  }

  function stepHTML(step) {
    const links = (step.links || []).length ? `<div class="link-cards">${step.links.map(linkCard).join('')}</div>` : '';
    return `<section class="step" id="step-${step.id}" data-step="${step.id}" aria-labelledby="step-h-${step.id}">
      <h2 class="step-h" id="step-h-${step.id}">
        <button type="button" class="step-toggle" aria-expanded="false" aria-controls="step-body-${step.id}">
          <span class="step-num">${step.num}</span>
          <span class="step-titles">
            <span class="step-kicker">Step ${step.num}</span>
            <span class="step-title">${esc(step.title)}</span>
            <span class="step-meta"><span>${icon('clock')}<span class="step-time">${esc(step.time)}</span></span><span class="step-checks"></span></span>
          </span>
          <span class="step-count"></span>
          ${icon('chevron', 'chev')}
        </button>
      </h2>
      <div class="step-mini-bar" aria-hidden="true"><span></span></div>
      <div class="step-body" id="step-body-${step.id}" hidden>
        <p class="step-intro">${esc(step.intro)}</p>
        ${links}
        ${step.guide || ''}
        <h3 class="checklist-title">Checklist</h3>
        <div class="checklist">${step.checks.map(checkHTML).join('')}</div>
      </div>
    </section>`;
  }

  function renderSteps() {
    $('#steps').innerHTML = DATA.steps.map(stepHTML).join('');
    // restore check states & notes
    ALL_CHECKS.forEach((c) => {
      const s = statusOf(c.id);
      const input = $(`input[name="s-${c.id}"][value="${s}"]`);
      if (input) input.checked = true;
      const ta = $(`#note-${c.id}`);
      if (ta) ta.value = noteOf(c.id);
      updateCheckUI(c.id);
    });
    DATA.steps.forEach((s) => setStepOpen(s.id, !!state.open[s.id], true));
    initTabs();
    updateRefHints();
  }

  function updateCheckUI(id) {
    const el = $(`#chk-${id}`);
    if (!el) return;
    const s = statusOf(id);
    el.dataset.status = s;
    const c = CHECK_BY_ID[id];
    const note = $('.check-note', el);
    if (note && c.note !== 'always') note.hidden = !(s === 'fail' || s === 'warn' || noteOf(id));
  }

  function setStepOpen(stepId, open, silent) {
    const sec = $(`#step-${stepId}`);
    if (!sec) return;
    const btn = $('.step-toggle', sec);
    const body = $('.step-body', sec);
    btn.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    if (open) state.open[stepId] = true; else delete state.open[stepId];
    if (!silent) save();
  }

  function applyMode() {
    document.documentElement.dataset.mode = state.mode;
    $$('button[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    // show/hide checks & steps
    DATA.steps.forEach((step) => {
      const visible = step.checks.filter(inMode);
      const sec = $(`#step-${step.id}`);
      sec.hidden = visible.length === 0;
      step.checks.forEach((c) => { $(`#chk-${c.id}`).hidden = !inMode(c); });
      const navLi = $(`#nav-list li[data-step="${step.id}"]`);
      if (navLi) navLi.hidden = visible.length === 0;
      const secs = visible.reduce((a, c) => a + (c.sec || 30), 0);
      $('.step-time', sec).textContent = state.mode === 'quick' ? '~' + fmtMinutes(secs) : step.time;
      $('.step-checks', sec).textContent = visible.length + (visible.length === 1 ? ' check' : ' checks');
      // quick badges only make sense in full mode
      $$('.pill.quick', sec).forEach((p) => { p.hidden = state.mode !== 'full'; });
    });
    updateAll();
  }

  /* ------------------------------------------------------------------ stats & verdict */
  function computeStats() {
    const list = activeChecks();
    const st = { total: list.length, pass: 0, warn: 0, fail: 0, na: 0, untested: 0, remainingSec: 0 };
    list.forEach((c) => {
      const s = statusOf(c.id);
      st[s]++;
      if (s === 'untested') st.remainingSec += c.sec || 30;
    });
    st.done = st.total - st.untested;
    st.pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    return st;
  }

  function computeVerdict() {
    const list = activeChecks();
    const by = (s) => list.filter((c) => statusOf(c.id) === s);
    const fails = by('fail'), warns = by('warn'), untested = by('untested');
    const critFails = fails.filter((c) => c.c);
    const critWarns = warns.filter((c) => c.c);
    const reasons = [];
    let key;

    if (critFails.length) {
      key = 'fail';
      reasons.push(`${critFails.length} critical check${critFails.length > 1 ? 's' : ''} failed. A critical failure overrides the total score — this monitor is not recommended no matter how many other checks passed.`);
    } else if (fails.length >= 3) {
      key = 'fail';
      reasons.push(`${fails.length} checks failed. Several separate problems together make this monitor a poor purchase.`);
    } else if (list.length && untested.length === list.length) {
      key = 'incomplete';
      reasons.push('No checks have been recorded yet. Start with Step 1.');
    } else if (untested.length) {
      key = 'incomplete';
      reasons.push(`${untested.length} of ${list.length} checks have not been tested yet. A recommendation needs every check in this mode.`);
      const critLeft = untested.filter((c) => c.c).length;
      if (critLeft) reasons.push(`${critLeft} of the untested checks ${critLeft > 1 ? 'are' : 'is'} critical.`);
      if (fails.length || warns.length) reasons.push(`So far: ${fails.length} failed and ${warns.length} warning${warns.length === 1 ? '' : 's'}. These will lead to at least CAUTION.`);
    } else if (fails.length || warns.length) {
      key = 'caution';
      if (fails.length) reasons.push(`${fails.length} non-critical check${fails.length > 1 ? 's' : ''} failed. Ask for a lower price or a fix, and make sure you can return it.`);
      if (warns.length) reasons.push(`${warns.length} check${warns.length > 1 ? 's have' : ' has'} warnings worth investigating.`);
      if (critWarns.length) reasons.push(`${critWarns.length} critical check${critWarns.length > 1 ? 's have' : ' has'} a warning — look at ${critWarns.length > 1 ? 'them' : 'it'} again carefully before deciding.`);
    } else {
      key = 'pass';
      reasons.push('Every check in this mode passed or was not applicable, and no critical problems were found.');
    }

    if (state.mode === 'quick') {
      reasons.push('Quick Inspection Mode covers only the essential checks. If you have time, switch to Full Inspection Mode for a complete picture.');
    }
    const naCount = by('na').length;
    if (naCount) reasons.push(`${naCount} check${naCount > 1 ? 's were' : ' was'} marked not applicable and did not count against the monitor.`);

    // cross-checks against the selected reference model
    const ref = state.info.refId ? modelById(state.info.refId) : null;
    const adv = parseInt(state.info.refresh, 10);
    if (ref && ref.maxHz && adv && adv !== Number(ref.maxHz)) {
      reasons.push(`Note: the advertised refresh rate (${adv} Hz) differs from the reference specification for ${ref.brand} ${ref.model} (${ref.maxHz} Hz). Double-check the exact model.`);
    }

    const LABELS = {
      pass: ['PASS — Reasonable to purchase.', 'check'],
      caution: ['CAUTION — Investigate or negotiate.', 'alert'],
      fail: ['FAIL — Not recommended.', 'x'],
      incomplete: ['INCOMPLETE — More testing required.', 'circle']
    };
    return { key, label: LABELS[key][0], icon: LABELS[key][1], reasons, critFails, fails, warns, untested, list };
  }

  function updateAll() {
    const st = computeStats();
    // header bar
    const w = (n) => (st.total ? (n / st.total) * 100 : 0) + '%';
    $('.seg-pass').style.width = w(st.pass);
    $('.seg-warn').style.width = w(st.warn);
    $('.seg-fail').style.width = w(st.fail);
    $('.seg-na').style.width = w(st.na);
    const bar = $('#progress-bar');
    bar.setAttribute('aria-valuenow', String(st.pct));
    bar.setAttribute('aria-valuetext', `${st.pct}% complete, ${st.untested} remaining`);
    $('#progress-pct').textContent = st.pct + '%';
    $('#progress-left').textContent = st.untested + ' left';
    $('#progress-time').textContent = st.untested ? '~' + fmtMinutes(st.remainingSec) : 'done';
    $('#mini-pass').textContent = st.pass;
    $('#mini-warn').textContent = st.warn;
    $('#mini-fail').textContent = st.fail;
    // dashboard stats
    $('#st-total').textContent = st.total;
    $('#st-pass').textContent = st.pass;
    $('#st-fail').textContent = st.fail;
    $('#st-warn').textContent = st.warn;
    $('#st-left').textContent = st.untested;
    $('#st-pct').textContent = st.pct + '%';
    $('#stat-foot').textContent = `${state.mode === 'quick' ? 'Quick' : 'Full'} inspection · ${st.na} not applicable · estimated time remaining: ${st.untested ? fmtMinutes(st.remainingSec) : 'none'}`;

    // per-step status
    DATA.steps.forEach((step) => {
      const list = step.checks.filter(inMode);
      const counts = { pass: 0, warn: 0, fail: 0, na: 0, untested: 0 };
      list.forEach((c) => counts[statusOf(c.id)]++);
      const done = list.length - counts.untested;
      let s = 'untested';
      if (counts.fail) s = 'fail';
      else if (counts.warn) s = 'warn';
      else if (list.length && done === list.length) s = 'pass';
      const sec = $(`#step-${step.id}`);
      sec.dataset.state = s;
      $('.step-count', sec).textContent = `${done}/${list.length}`;
      $('.step-mini-bar span', sec).style.width = list.length ? (done / list.length) * 100 + '%' : '0';
      const li = $(`#nav-list li[data-step="${step.id}"]`);
      if (li) { li.dataset.state = s; $('.nav-count', li).textContent = `${done}/${list.length}`; }
    });

    renderVerdict();
  }

  function resultItem(c, showStatus) {
    const s = statusOf(c.id);
    const n = noteOf(c.id);
    return `<li>
      <a href="#chk-${c.id}" data-goto="${c.id}">${esc(c.t)}</a>
      <span class="meta">Step ${c.step.num}: ${esc(c.step.title)}${c.c ? ' · Critical' : ''}${showStatus ? ' · ' + STATUS[s].label : ''}</span>
      ${n ? `<span class="rnote">Note: ${esc(n)}</span>` : ''}
    </li>`;
  }

  function renderVerdict() {
    const v = computeVerdict();
    $('#verdict').className = 'verdict ' + v.key;
    $('#verdict').innerHTML = `<p class="verdict-label">${icon(v.icon)}${esc(v.label)}</p>
      <ul class="reasons">${v.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;

    const groups = [];
    if (v.critFails.length) groups.push(['Critical failures', 'shield', v.critFails, 'fail']);
    const otherFails = v.fails.filter((c) => !c.c);
    if (otherFails.length) groups.push(['Failed inspections', 'x', otherFails, 'fail']);
    if (v.warns.length) groups.push(['Warnings', 'alert', v.warns, 'warn']);
    if (v.untested.length) groups.push(['Incomplete — not tested yet', 'circle', v.untested, 'untested']);
    $('#verdict-details').innerHTML = groups.map((g) => `<div class="result-group">
        <h3><span class="pill ${g[3]}">${icon(g[1])}${g[2].length}</span>${esc(g[0])}</h3>
        <ul class="result-list">${g[2].map((c) => resultItem(c, false)).join('')}</ul>
      </div>`).join('');

    const badge = $('#nav-verdict');
    badge.hidden = false;
    badge.className = 'nav-badge ' + v.key;
  }

  /* ------------------------------------------------------------------ text summary & print */
  function infoRows() {
    const i = state.info;
    const ref = i.refId ? modelById(i.refId) : null;
    return [
      ['Brand', i.brand], ['Model', i.model],
      ['Reference model', ref ? `${ref.brand} ${ref.model}` : ''],
      ['Asking price', i.price ? '$' + Number(i.price).toFixed(2) + ' USD' : ''],
      ['Manufacturing date', i.mfgDate], ['Resolution', i.resolution],
      ['Advertised refresh rate', i.refresh ? i.refresh + ' Hz' : ''],
      ['Seller', i.seller], ['Warranty', i.warranty], ['Notes', i.notes]
    ];
  }

  function buildTextSummary() {
    const v = computeVerdict();
    const st = computeStats();
    const lines = [];
    lines.push('MONITORCHECK — INSPECTION SUMMARY');
    lines.push('Date: ' + new Date().toLocaleString());
    lines.push('Mode: ' + (state.mode === 'quick' ? 'Quick inspection' : 'Full inspection'));
    lines.push('');
    infoRows().forEach(([k, val]) => { if (val) lines.push(`${k}: ${val}`); });
    lines.push('');
    lines.push('RESULT: ' + v.label);
    v.reasons.forEach((r) => lines.push('- ' + r));
    lines.push('');
    lines.push(`Progress: ${st.done}/${st.total} checked (${st.pct}%) — ${st.pass} passed, ${st.warn} warnings, ${st.fail} failed, ${st.na} N/A, ${st.untested} not tested`);
    const section = (title, list) => {
      if (!list.length) return;
      lines.push('');
      lines.push(title.toUpperCase() + ':');
      list.forEach((c) => {
        const n = noteOf(c.id);
        lines.push(`- [Step ${c.step.num}] ${c.t}${n ? ' — ' + n : ''}`);
      });
    };
    section('Critical failures', v.critFails);
    section('Failed', v.fails.filter((c) => !c.c));
    section('Warnings', v.warns);
    section('Not tested', v.untested);
    const answers = v.list.filter((c) => c.note === 'always' && noteOf(c.id));
    if (answers.length) {
      lines.push('');
      lines.push('SELLER ANSWERS:');
      answers.forEach((c) => lines.push(`- ${c.t} ${noteOf(c.id)}`));
    }
    lines.push('');
    lines.push('Disclaimer: passing this inspection cannot guarantee future reliability.');
    return lines.join('\n');
  }

  function buildPrintReport() {
    const v = computeVerdict();
    const st = computeStats();
    const rows = infoRows().filter((r) => r[1]);
    let html = `<h1>MonitorCheck — Inspection report</h1>
      <p class="small">${esc(new Date().toLocaleString())} · ${state.mode === 'quick' ? 'Quick' : 'Full'} inspection · ${st.done}/${st.total} checked (${st.pct}%) · ${st.pass} passed · ${st.warn} warnings · ${st.fail} failed · ${st.na} N/A</p>`;
    if (rows.length) html += `<h2>Monitor details</h2><table><tbody>${rows.map((r) => `<tr><th style="width:30%">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`;
    html += `<div class="pv ${v.key}"><h2 style="margin-top:0">${esc(v.label)}</h2><ul>${v.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
    DATA.steps.forEach((step) => {
      const list = step.checks.filter(inMode);
      if (!list.length) return;
      html += `<h2>Step ${step.num}: ${esc(step.title)}</h2><table><thead><tr><th>Check</th><th style="width:16%">Result</th><th style="width:34%">Notes</th></tr></thead><tbody>`;
      list.forEach((c) => {
        const s = statusOf(c.id);
        html += `<tr><td>${esc(c.t)}${c.c ? ' <strong>(critical)</strong>' : ''}</td><td class="r-${s}">${STATUS[s].label}</td><td>${esc(noteOf(c.id))}</td></tr>`;
      });
      html += '</tbody></table>';
    });
    html += '<p class="small" style="margin-top:6mm"><strong>Disclaimer:</strong> passing this inspection cannot guarantee future reliability. Generated with MonitorCheck — all data stayed on this device.</p>';
    $('#print-report').innerHTML = html;
  }
  window.addEventListener('beforeprint', buildPrintReport);

  /* ------------------------------------------------------------------ info form */
  function renderRefSelect() {
    const sel = $('#f-ref');
    const cur = state.info.refId || '';
    sel.innerHTML = '<option value="">— Not selected —</option>' + allModels().map((m) => `<option value="${esc(m.id)}">${esc(m.brand)} ${esc(m.model)}${m.kind === 'custom' ? ' (custom)' : ''}</option>`).join('');
    sel.value = modelById(cur) ? cur : '';
  }

  function fillForm() {
    const f = $('#info-form');
    ['brand', 'model', 'price', 'mfgDate', 'resolution', 'refresh', 'seller', 'warranty', 'notes'].forEach((k) => {
      const el = f.elements[k];
      if (el) el.value = state.info[k] || '';
    });
    renderRefSelect();
    updateRefHints();
  }

  function applyReference(id) {
    const m = modelById(id);
    state.info.refId = m ? m.id : '';
    if (m) {
      // Fill empty fields only — never overwrite what the user typed.
      const f = $('#info-form');
      const set = (k, v) => { if (v && !state.info[k]) { state.info[k] = String(v); f.elements[k].value = String(v); } };
      set('brand', m.brand);
      set('model', m.model);
      set('resolution', m.res);
      set('refresh', m.maxHz);
    }
    save();
    renderRefSelect();
    updateRefHints();
    renderModels();
    updateAll();
  }

  function updateRefHints() {
    const m = state.info.refId ? modelById(state.info.refId) : null;
    const exp = $('#ref-expected');
    const pwr = $('#ref-power');
    const warn = $('#spec-warning');
    if (m) {
      exp.hidden = false;
      exp.innerHTML = `<strong>Expected for ${esc(m.brand)} ${esc(m.model)}:</strong> ${esc(m.resolution || 'Unknown')} · ${esc(m.refresh || 'Unknown')}`;
      pwr.hidden = false;
      pwr.innerHTML = `<strong>${esc(m.brand)} ${esc(m.model)} power supply:</strong> ${esc(m.power || 'Unknown')}.` +
        (m.external === false ? ' This model has a built-in power supply — mark the adapter-specific checks below as <strong>N/A</strong>.' : '');
    } else {
      exp.hidden = true;
      pwr.hidden = true;
    }
    const adv = parseInt(state.info.refresh, 10);
    if (m && m.maxHz && adv && adv !== Number(m.maxHz)) {
      warn.hidden = false;
      warn.textContent = `The advertised refresh rate (${adv} Hz) does not match the reference specification for ${m.brand} ${m.model} (${m.maxHz} Hz). Check the exact model number on the label.`;
    } else {
      warn.hidden = true;
    }
  }

  /* ------------------------------------------------------------------ reference models */
  function specValue(v) {
    return v ? esc(v) : '<span class="pill na">Unknown</span>';
  }

  function renderModels() {
    const sel = state.info.refId;
    $('#model-grid').innerHTML = allModels().map((m) => {
      const badge = m.kind === 'official' ? '<span class="pill pass">Official specs</span>' : m.kind === 'edited' ? '<span class="pill warn">Edited locally</span>' : '<span class="pill info">Custom</span>';
      const specs = DATA.SPEC_FIELDS.map(([k, label]) => `<div><dt>${label}</dt><dd>${specValue(m[k])}</dd></div>`).join('');
      const links = [];
      if (m.url) links.push(`<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${icon('external')}Official page</a>`);
      if (m.datasheet) links.push(`<a href="${esc(m.datasheet)}" target="_blank" rel="noopener noreferrer">${icon('file')}Datasheet (PDF)</a>`);
      const isSel = sel === m.id;
      const actions = [`<button type="button" class="btn btn-sm ${isSel ? '' : 'btn-primary'}" data-model-use="${esc(m.id)}" aria-pressed="${isSel}">${isSel ? icon('check') + 'Selected' : 'Use for this inspection'}</button>`,
        `<button type="button" class="btn btn-sm" data-model-edit="${esc(m.id)}">${icon('edit')}Edit</button>`];
      if (m.kind === 'edited') actions.push(`<button type="button" class="btn btn-sm" data-model-restore="${esc(m.id)}">${icon('reset')}Restore</button>`);
      if (m.kind === 'custom') actions.push(`<button type="button" class="btn btn-sm btn-danger" data-model-delete="${esc(m.id)}">${icon('trash')}Delete</button>`);
      return `<article class="model-card${isSel ? ' selected' : ''}">
        <div class="model-top"><div><div class="model-brand">${esc(m.brand)}</div><h3 class="model-name">${esc(m.model)}</h3></div>${badge}</div>
        <dl class="spec-list">${specs}</dl>
        ${m.notes ? `<p class="model-note">${esc(m.notes)}</p>` : ''}
        ${links.length ? `<div class="model-links">${links.join('')}</div>` : ''}
        <div class="model-actions">${actions.join('')}</div>
      </article>`;
    }).join('');
  }

  const MODEL_FORM_FIELDS = [['brand', 'Brand', true], ['model', 'Model name', true]].concat(DATA.SPEC_FIELDS.map(([k, l]) => [k, l, false]))
    .concat([['maxHz', 'Max refresh rate (number, Hz)', false], ['url', 'Official page URL', false], ['notes', 'Notes', false]]);

  let editingModel = null;
  function openModelDialog(id) {
    const dlg = $('#model-dialog');
    const m = id ? modelById(id) : null;
    editingModel = m ? m.id : null;
    $('#model-dialog-title').textContent = m ? `Edit ${m.brand} ${m.model}` : 'Add a monitor model';
    $('#model-fields').innerHTML = MODEL_FORM_FIELDS.map(([k, label, req]) => {
      const val = m && m[k] != null ? m[k] : '';
      const type = k === 'maxHz' ? 'number' : k === 'url' ? 'url' : 'text';
      const full = ['connectivity', 'power', 'notes', 'url'].includes(k) ? ' full' : '';
      const ro = m && m.kind !== 'custom' && (k === 'brand' || k === 'model') ? ' readonly' : '';
      return `<div class="field${full}"><label for="mf-${k}">${esc(label)}${req ? '' : ' <span class="muted">(optional)</span>'}</label><input id="mf-${k}" name="${k}" type="${type}" value="${esc(val)}"${req ? ' required' : ''}${ro}${type === 'number' ? ' min="1" max="1000" inputmode="numeric"' : ''} maxlength="300"></div>`;
    }).join('');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    const first = $('#model-fields input:not([readonly])');
    if (first) first.focus();
  }

  function saveModelFromForm() {
    const form = $('#model-form');
    const data = {};
    MODEL_FORM_FIELDS.forEach(([k]) => { data[k] = (form.elements[k].value || '').trim(); });
    if (!data.brand || !data.model) { toast('Brand and model name are required.'); return false; }
    if (data.url && !/^https?:\/\//i.test(data.url)) { toast('The URL must start with http:// or https://'); return false; }
    data.maxHz = data.maxHz ? parseInt(data.maxHz, 10) || '' : '';
    const preset = editingModel && DATA.models.find((m) => m.id === editingModel);
    if (preset) {
      const diff = {};
      MODEL_FORM_FIELDS.forEach(([k]) => { if (String(data[k] || '') !== String(preset[k] == null ? '' : preset[k])) diff[k] = data[k]; });
      if (Object.keys(diff).length) modelStore.overrides[preset.id] = diff; else delete modelStore.overrides[preset.id];
    } else if (editingModel) {
      const idx = modelStore.custom.findIndex((m) => m.id === editingModel);
      if (idx >= 0) modelStore.custom[idx] = Object.assign({ id: editingModel }, data);
    } else {
      modelStore.custom.push(Object.assign({ id: 'custom-' + Date.now().toString(36) }, data));
    }
    saveModels();
    renderModels();
    renderRefSelect();
    updateRefHints();
    toast('Model saved on this device.');
    return true;
  }

  /* ------------------------------------------------------------------ tabs */
  function initTabs() {
    $$('[data-tabs]').forEach((wrap) => {
      const tabs = $$('[role="tab"]', wrap);
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          $('#' + t.getAttribute('aria-controls')).hidden = !on;
        });
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', (e) => {
          let n = null;
          if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') n = tabs[0];
          if (e.key === 'End') n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n); n.focus(); }
        });
      });
      // default to Windows on Windows devices
      if (/Windows/i.test(navigator.userAgent || '')) { const w = tabs.find((t) => /windows/i.test(t.id)); if (w) select(w); }
    });
  }

  /* ------------------------------------------------------------------ theme */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
    const btn = $('#theme-toggle');
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b0e13' : '#f4f6f9');
  }

  /* ------------------------------------------------------------------ drawer (mobile) */
  const desktopMQ = window.matchMedia('(min-width: 1024px)');
  function openDrawer(open) {
    const sb = $('#sidebar');
    const btn = $('#open-steps');
    if (desktopMQ.matches) open = false;
    sb.classList.toggle('open', open);
    $('#backdrop').hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      sb.setAttribute('role', 'dialog');
      sb.setAttribute('aria-modal', 'true');
      const cur = $('#nav-list a[aria-current="true"]') || $('#nav-list a');
      if (cur) cur.focus();
    } else {
      sb.removeAttribute('role');
      sb.removeAttribute('aria-modal');
    }
  }

  /* ------------------------------------------------------------------ navigation helpers */
  function goTo(targetId, focusEl) {
    const stepMatch = /^step-(.+)$/.exec(targetId);
    if (stepMatch) setStepOpen(stepMatch[1], true);
    const chk = /^chk-(.+)$/.exec(targetId);
    if (chk && CHECK_BY_ID[chk[1]]) setStepOpen(CHECK_BY_ID[chk[1]].step.id, true);
    const el = document.getElementById(targetId);
    if (!el) return;
    if (el.hidden && CHECK_BY_ID[chk && chk[1]]) { // check hidden in quick mode → switch to full
      state.mode = 'full';
      applyMode();
      save();
    }
    el.scrollIntoView({ block: 'start' });
    const f = focusEl || (stepMatch ? $('.step-toggle', el) : el);
    if (f) {
      if (!f.matches('button, a, input, textarea, select') && !f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
      f.focus({ preventScroll: true });
    }
    if (history.replaceState) history.replaceState(null, '', '#' + targetId);
  }

  function updateTopbarHeight() {
    const h = $('#topbar').offsetHeight;
    document.documentElement.style.setProperty('--topbar-h', h + 'px');
  }

  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const targets = ['dashboard'].concat(DATA.steps.map((s) => 'step-' + s.id), ['reference', 'summary']).map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      if (!visible.size) return;
      // The active section is the last one whose top has passed just below the sticky header.
      const line = ($('#topbar').offsetHeight || 100) + 40;
      let best = null, bestTop = -Infinity, first = null, firstTop = Infinity;
      visible.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top <= line && top > bestTop) { best = el.id; bestTop = top; }
        if (top < firstTop) { first = el.id; firstTop = top; }
      });
      best = best || first;
      $$('#nav-list li').forEach((li) => { const a = $('a', li); if (a) a.setAttribute('aria-current', String(li.dataset.target === best)); });
      $$('.bottom-nav [data-nav]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === best)));
    }, { rootMargin: '-110px 0px -55% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ------------------------------------------------------------------ events */
  function bindEvents() {
    // status changes
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('input[type="radio"][data-check]')) {
        const id = t.dataset.check;
        const prev = state.results[id] || {};
        if (t.value === 'untested' && !prev.n) delete state.results[id];
        else state.results[id] = Object.assign({}, prev, { s: t.value });
        updateCheckUI(id);
        updateAll();
        save();
      }
    });

    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t.matches('textarea[data-note]')) {
        const id = t.dataset.note;
        const prev = state.results[id] || { s: 'untested' };
        state.results[id] = Object.assign({}, prev, { n: t.value });
        if (!t.value && (!prev.s || prev.s === 'untested')) delete state.results[id];
        save();
        clearTimeout(bindEvents.vt);
        bindEvents.vt = setTimeout(renderVerdict, 400);
      } else if (t.closest('#info-form') && t.name && t.name !== 'refId') {
        state.info[t.name] = t.value;
        save();
        if (t.name === 'refresh') updateRefHints();
      }
    });

    $('#f-ref').addEventListener('change', (e) => applyReference(e.target.value));
    $('#info-form').addEventListener('submit', (e) => e.preventDefault());

    // clicks (delegated)
    document.addEventListener('click', async (e) => {
      const t = e.target.closest('button, a');
      if (!t) return;

      if (t.matches('.step-toggle')) {
        const id = t.closest('.step').dataset.step;
        setStepOpen(id, t.getAttribute('aria-expanded') !== 'true');
        return;
      }
      if (t.matches('[data-mode]')) {
        state.mode = t.dataset.mode;
        applyMode();
        save();
        toast(state.mode === 'quick' ? 'Quick Inspection Mode — essential checks only' : 'Full Inspection Mode — every test');
        return;
      }
      if (t.matches('.copy-btn')) {
        const ok = await copyText(t.dataset.copy);
        toast(ok ? 'Copied to clipboard' : 'Copy failed — please copy manually');
        return;
      }
      if (t.id === 'theme-toggle') {
        setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        return;
      }
      if (t.id === 'btn-expand' || t.id === 'btn-collapse') {
        const open = t.id === 'btn-expand';
        DATA.steps.forEach((s) => setStepOpen(s.id, open, true));
        save();
        toast(open ? 'All sections expanded' : 'All sections collapsed');
        return;
      }
      if (t.id === 'btn-reset') {
        const has = Object.keys(state.results).length;
        if (!has) { toast('There are no results to reset.'); return; }
        if (await confirmDialog('This clears every check result and note. Your monitor details stay. This cannot be undone.', 'Reset results')) {
          state.results = {};
          saveNow();
          renderSteps();
          applyMode();
          toast('Results cleared');
        }
        return;
      }
      if (t.id === 'btn-new') {
        const has = Object.keys(state.results).length || Object.values(state.info).some(Boolean);
        if (has && !(await confirmDialog('Start a new inspection? All results, notes and monitor details will be deleted. Saved reference models are kept.', 'Delete and start new'))) return;
        const mode = state.mode;
        state = freshState();
        state.mode = mode;
        saveNow();
        fillForm();
        renderSteps();
        renderModels();
        applyMode();
        goTo('dashboard');
        toast('New inspection started');
        return;
      }
      if (t.id === 'btn-copy-summary') {
        const ok = await copyText(buildTextSummary());
        toast(ok ? 'Summary copied — paste it anywhere' : 'Copy failed in this browser');
        return;
      }
      if (t.id === 'btn-print') {
        buildPrintReport();
        window.print();
        return;
      }
      if (t.id === 'open-steps') { openDrawer(!$('#sidebar').classList.contains('open')); return; }
      if (t.id === 'sidebar-close') { openDrawer(false); $('#open-steps').focus(); return; }
      if (t.id === 'btn-add-model') { openModelDialog(null); return; }
      if (t.dataset.modelUse) {
        applyReference(state.info.refId === t.dataset.modelUse ? '' : t.dataset.modelUse);
        toast(state.info.refId ? 'Reference model selected' : 'Reference model cleared');
        return;
      }
      if (t.dataset.modelEdit) { openModelDialog(t.dataset.modelEdit); return; }
      if (t.dataset.modelRestore) {
        if (await confirmDialog('Restore the official specifications for this model? Your local edits will be removed.', 'Restore')) {
          delete modelStore.overrides[t.dataset.modelRestore];
          saveModels(); renderModels(); renderRefSelect(); updateRefHints();
          toast('Official specifications restored');
        }
        return;
      }
      if (t.dataset.modelDelete) {
        if (await confirmDialog('Delete this custom model from this device?', 'Delete')) {
          modelStore.custom = modelStore.custom.filter((m) => m.id !== t.dataset.modelDelete);
          if (state.info.refId === t.dataset.modelDelete) { state.info.refId = ''; save(); }
          saveModels(); renderModels(); renderRefSelect(); updateRefHints(); updateAll();
          toast('Model deleted');
        }
        return;
      }
      // in-page navigation
      if (t.matches('a[href^="#"]')) {
        const id = t.getAttribute('href').slice(1);
        if (!id || !document.getElementById(id)) return;
        e.preventDefault();
        openDrawer(false);
        goTo(id);
      }
    });

    $('#backdrop').addEventListener('click', () => openDrawer(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#sidebar').classList.contains('open')) { openDrawer(false); $('#open-steps').focus(); }
    });
    // Keep keyboard focus inside the open drawer
    $('#sidebar').addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !$('#sidebar').classList.contains('open')) return;
      const f = $$('#sidebar a, #sidebar button').filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    const onMQ = () => { if (desktopMQ.matches) openDrawer(false); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ); else if (desktopMQ.addListener) desktopMQ.addListener(onMQ);

    $('#model-dialog').addEventListener('close', () => { editingModel = null; });
    $('#model-cancel').addEventListener('click', () => $('#model-dialog').close('cancel'));
    $('#model-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!$('#model-form').reportValidity()) return;
      if (saveModelFromForm()) $('#model-dialog').close('save');
    });

    window.addEventListener('resize', updateTopbarHeight);
    // Sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { state = Object.assign(freshState(), JSON.parse(e.newValue)); } catch (err) { return; }
        fillForm(); renderSteps(); applyMode(); renderModels();
      }
    });
  }

  /* ------------------------------------------------------------------ init */
  function estimateModes() {
    const full = ALL_CHECKS.reduce((a, c) => a + (c.sec || 30), 0);
    const quick = ALL_CHECKS.filter((c) => c.q).reduce((a, c) => a + (c.sec || 30), 0);
    const fullEl = $('.mode-card[data-mode="full"] .muted');
    const quickEl = $('.mode-card[data-mode="quick"] .muted');
    if (fullEl) fullEl.textContent = `All ${ALL_CHECKS.length} checks in 10 steps · about ${fmtMinutes(full)}`;
    if (quickEl) quickEl.textContent = `${ALL_CHECKS.filter((c) => c.q).length} essential checks · about ${fmtMinutes(quick)}`;
  }

  function init() {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    renderNav();
    renderSteps();
    fillForm();
    renderModels();
    estimateModes();
    applyMode();
    bindEvents();
    updateTopbarHeight();
    initScrollSpy();
    // deep link support (e.g. index.html#step-pixels)
    const hash = location.hash.slice(1);
    if (hash && document.getElementById(hash)) setTimeout(() => goTo(hash), 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
