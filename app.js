(() => {
  'use strict';

  const STORAGE = {
    sessions: 'mira.sessions.v1',
    config: 'mira.config.v1',
    profile: 'mira.profile.v1'
  };

  const MODES = { classic: 'Clásico', burst: 'Ráfaga', ranked: 'Ranked' };
  const SIZE_NAMES = { s: 'pequeño', m: 'medio', l: 'grande' };
  const SIZES = {
    s: { f: 0.02, min: 13, mult: 1.4 },
    m: { f: 0.03, min: 19, mult: 1.0 },
    l: { f: 0.043, min: 27, mult: 0.75 }
  };

  const THEMES = {
    pink: { pink: '#ff2ea6', rgb: '255 46 166', text: '#ffe6f4', muted: '#b98aa6', line: 'rgb(255 46 166 / .30)', soft: 'rgb(255 46 166 / .14)' },
    cyan: { pink: '#29d9ff', rgb: '41 217 255', text: '#e6fbff', muted: '#86b7c2', line: 'rgb(41 217 255 / .30)', soft: 'rgb(41 217 255 / .14)' },
    purple: { pink: '#a66cff', rgb: '166 108 255', text: '#f1eaff', muted: '#a995c7', line: 'rgb(166 108 255 / .30)', soft: 'rgb(166 108 255 / .14)' },
    lime: { pink: '#b7f34a', rgb: '183 243 74', text: '#f3ffe3', muted: '#a8b58d', line: 'rgb(183 243 74 / .30)', soft: 'rgb(183 243 74 / .14)' },
    amber: { pink: '#ffb52e', rgb: '255 181 46', text: '#fff4dd', muted: '#c2a77a', line: 'rgb(255 181 46 / .30)', soft: 'rgb(255 181 46 / .14)' }
  };

  const TIERS = [
    { min: 0, name: 'Bronce' },
    { min: 1000, name: 'Plata' },
    { min: 1150, name: 'Oro' },
    { min: 1300, name: 'Platino' },
    { min: 1450, name: 'Diamante' },
    { min: 1600, name: 'Esmeralda' },
    { min: 1750, name: 'Ruby' }
  ];

  const defaultConfig = {
    mode: 'classic',
    size: 'm',
    dur: 30,
    theme: 'pink',
    cursor: 'crosshair'
  };

  const state = {
    sessions: [],
    config: { ...defaultConfig },
    profile: { xp: 0, rating: 1000, wins: 0, losses: 0, draws: 0 },
    view: 'train',
    chartMetric: 'score',
    chartRange: 14,
    calMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDay: dayKey(new Date())
  };

  const game = {
    phase: 'idle',
    targets: [],
    fx: [],
    hits: 0,
    miss: 0,
    rtTotal: 0,
    raw: 0,
    last: null,
    startTs: 0,
    endTs: 0,
    bot: null,
    botRating: null,
    raf: 0
  };

  const ui = {
    tabs: [...document.querySelectorAll('.tab')],
    settings: document.getElementById('settings'),
    settingsPanel: document.getElementById('settings-panel'),
    openSettings: document.getElementById('open-settings'),
    profileRank: document.getElementById('p-rank'),
    profileLevel: document.getElementById('p-lvl'),
    xpBar: document.getElementById('p-xpbar'),
    score: document.getElementById('h-score'),
    botWrap: document.getElementById('h-bot-wrap'),
    botScore: document.getElementById('h-bot'),
    time: document.getElementById('h-time'),
    acc: document.getElementById('h-acc'),
    ovIdle: document.getElementById('ov-idle'),
    ovRes: document.getElementById('ov-res'),
    idleTitle: document.getElementById('idle-title'),
    idleSub: document.getElementById('idle-sub'),
    rankedNote: document.getElementById('ranked-note'),
    rankedLadder: document.getElementById('ranked-ladder'),
    today: document.getElementById('today'),
    calTitle: document.getElementById('cal-title'),
    calDays: document.getElementById('cal-days'),
    calDetail: document.getElementById('cal-detail'),
    chartBig: document.getElementById('ch-big'),
    chartCaption: document.getElementById('ch-caption'),
    chartSvg: document.getElementById('chart-svg'),
    chartTip: document.getElementById('tip'),
    chartEmpty: document.getElementById('chart-empty'),
    chartSR: document.getElementById('chart-sr'),
    ioStatus: document.getElementById('io-status'),
    canvas: document.getElementById('arena'),
    importFile: document.getElementById('import-file')
  };

  const ctx = ui.canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  let PINK = '#ff2ea6';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function dayKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function nf(value) {
    return Math.round(value).toLocaleString('es-ES');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function plural(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // no-op: browser storage may be unavailable
    }
  }

  function safeNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function normalizeConfig(raw = {}) {
    const merged = { ...defaultConfig, ...raw };
    const mode = ['classic', 'burst', 'ranked'].includes(merged.mode) ? merged.mode : 'classic';
    const size = ['s', 'm', 'l'].includes(merged.size) ? merged.size : 'm';
    const dur = [30, 60].includes(Number(merged.dur)) ? Number(merged.dur) : 30;
    const theme = ['pink', 'cyan', 'purple', 'lime', 'amber'].includes(merged.theme) ? merged.theme : 'pink';
    const cursor = ['crosshair', 'dot', 'ring', 'plus'].includes(merged.cursor) ? merged.cursor : 'crosshair';
    return { mode, size, dur, theme, cursor };
  }

  function normalizeProfile(raw = {}) {
    return {
      xp: safeNumber(raw.xp, 0),
      rating: safeNumber(raw.rating, 1000),
      wins: safeNumber(raw.wins, 0),
      losses: safeNumber(raw.losses, 0),
      draws: safeNumber(raw.draws, 0)
    };
  }

  function normalizeSessions(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(session => session && typeof session.t === 'number' && typeof session.d === 'string');
  }

  function xpForLevel(level) {
    return Math.round(48 * Math.pow(level, 1.28) + 18 * level);
  }

  function levelFromXp(xp) {
    let level = 1;
    let need = xpForLevel(level);
    let remaining = Math.max(0, xp);
    while (remaining >= need) {
      remaining -= need;
      level += 1;
      need = xpForLevel(level);
    }
    return { level, into: remaining, need };
  }

  function xpGain(session) {
    let base = Math.round((session.score || 0) / 9) + Math.round((session.hits || 0) * 0.85);
    if (session.mode === 'ranked') {
      base += session.result === 'win' ? 45 : session.result === 'draw' ? 22 : 12;
    }
    return Math.max(6, base);
  }

  function tierFor(rating) {
    let selected = TIERS[0];
    for (const tier of TIERS) {
      if (rating >= tier.min) selected = tier;
    }
    return selected;
  }

  function tierClass(name) {
    return (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function tierIcon(name) {
    const icons = {
      Bronce: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 50 15v18c0 13-8 22-18 26C22 55 14 46 14 33V15L32 5Z" fill="currentColor" opacity=".18"/><path d="M32 8 47 17v16c0 11-6.5 19-15 23-8.5-4-15-12-15-23V17L32 8Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="m22 24 10 10 11-15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      Plata: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 6 8 17 18 2-13.5 12 4 18L32 45l-16.5 10 4-18L6 25l18-2 8-17Z" fill="currentColor" opacity=".2"/><path d="m32 7 7.6 16.1 17.4 2-12.8 11.8 4.1 17.1L32 1l-11.3 7.1 4.1-17.1L6.9 25.1l17.4-2L32 7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
      Oro: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="currentColor" opacity=".18"/><path d="M20 25h24l-2 25H22l-2-25Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M24 25l8-13 8 13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      Platino: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4 55 17v30L32 60 9 47V17L32 4Z" fill="currentColor" opacity=".16"/><path d="M32 7 52 18v28L32 57 12 46V18L32 7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 40h24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      Diamante: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 5 13 9 12 17-25 28L7 31l12-17 13-9Z" fill="currentColor" opacity=".18"/><path d="m32 6 13 9 11 16-24 27L8 31l11-16 13-9Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
      Esmeralda: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 4 24 14v28L32 60 8 46V18L32 4Z" fill="currentColor" opacity=".18"/><path d="M32 7 52 19v26L32 57 12 45V19L32 7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M21 32h22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      Ruby: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 5 18 7 8 17-26 30L6 29l8-17 18-7Z" fill="currentColor" opacity=".2"/><path d="m32 6 17 7 7 16-24 29L8 29l7-16 17-7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || icons.Bronce;
  }

  function saveProfile() {
    saveJSON(STORAGE.profile, state.profile);
  }

  function syncProfileFromSessions() {
    const sorted = state.sessions.slice().sort((a, b) => a.t - b.t);
    let xp = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let rating = 1000;

    for (const session of sorted) {
      xp += xpGain(session);
      if (session.mode === 'ranked' && typeof session.ratingAfter === 'number') {
        rating = session.ratingAfter;
        if (session.result === 'win') wins += 1;
        else if (session.result === 'loss') losses += 1;
        else if (session.result === 'draw') draws += 1;
      }
    }

    state.profile = { xp, rating, wins, losses, draws };
    saveProfile();
  }

  function renderProfile() {
    const { level, into, need } = levelFromXp(state.profile.xp || 0);
    const tier = tierFor(state.profile.rating || 1000);
    ui.profileLevel.textContent = `Nv. ${level}`;
    ui.profileRank.innerHTML = `<span class="rank-icon ${tierClass(tier.name)}">${tierIcon(tier.name)}</span>${tier.name} · <b>${nf(state.profile.rating)}</b>`;
    const progress = need <= 0 ? 0 : Math.round((into / need) * 100);
    ui.xpBar.style.width = `${clamp(progress, 0, 100)}%`;
  }

  function applyAppearance() {
    const theme = THEMES[state.config.theme] || THEMES.pink;
    const root = document.documentElement;
    root.style.setProperty('--pink', theme.pink);
    root.style.setProperty('--pink-rgb', theme.rgb);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--line', theme.line);
    root.style.setProperty('--line-soft', theme.soft);
    const cursor = state.config.cursor === 'dot' || state.config.cursor === 'ring'
      ? state.config.cursor === 'ring'
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='7' fill='none' stroke='${theme.pink}' stroke-width='2'/%3E%3C/svg%3E") 14 14, crosshair`
        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='4' fill='${theme.pink}'/%3E%3C/svg%3E") 12 12, crosshair`
      : 'crosshair';
    root.style.setProperty('--cursor', cursor);
    PINK = theme.pink;

    document.querySelectorAll('.theme-swatch').forEach((item) => {
      const chip = item.closest('.chip');
      const value = chip && chip.dataset.v;
      item.style.color = THEMES[value]?.pink || theme.pink;
    });
  }

  function renderChipSelection() {
    document.querySelectorAll('.chip[data-k]').forEach((button) => {
      const key = button.dataset.k;
      const value = button.dataset.v;
      const active = key === 'theme' ? state.config.theme === value : key === 'cursor' ? state.config.cursor === value : key === 'mode' ? state.config.mode === value : key === 'size' ? state.config.size === value : key === 'dur' ? String(state.config.dur) === value : key === 'metric' ? state.chartMetric === value : String(state.chartRange) === value;
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setView(viewName) {
    state.view = viewName;
    const map = {
      train: document.getElementById('view-train'),
      cal: document.getElementById('view-cal'),
      charts: document.getElementById('view-charts')
    };

    Object.entries(map).forEach(([key, el]) => {
      const visible = key === viewName;
      el.hidden = !visible;
    });

    ui.tabs.forEach((tab) => {
      const selected = tab.dataset.view === viewName;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  function saveConfig() {
    saveJSON(STORAGE.config, state.config);
  }

  function handleChipClick(event) {
    const button = event.currentTarget;
    const key = button.dataset.k;
    const value = button.dataset.v;

    if (key === 'theme' || key === 'cursor' || key === 'mode' || key === 'size' || key === 'dur') {
      state.config[key] = key === 'dur' ? Number(value) : value;
      if (key === 'mode') {
        state.config.mode = value;
      }
      saveConfig();
      applyAppearance();
      renderIdleText();
      updateHud(performance.now());
    }

    if (key === 'metric') {
      state.chartMetric = value;
      renderChart();
    }

    if (key === 'range') {
      state.chartRange = Number(value);
      renderChart();
    }

    renderChipSelection();
  }

  function updateIdleText() {
    ui.idleTitle.textContent = COARSE ? 'Toca para empezar' : 'Haz clic para empezar';

    if (state.config.mode === 'ranked') {
      const tier = tierFor(state.profile.rating || 1000);
      ui.idleSub.textContent = `Ranked, contra un bot a tu nivel, tamaño ${SIZE_NAMES[state.config.size]}, ${state.config.dur} s`;
      ui.rankedNote.hidden = false;
      ui.rankedLadder.hidden = false;
      ui.rankedNote.innerHTML = `Tu rango actual es <b>${tier.name}</b> con <b>${nf(state.profile.rating)}</b> puntos. El bot se ajusta a tu nivel.`;
      renderRankLadder();
    } else {
      ui.idleSub.textContent = `${MODES[state.config.mode]}, tamaño ${SIZE_NAMES[state.config.size]}, ${state.config.dur} s`;
      ui.rankedNote.hidden = true;
      ui.rankedLadder.hidden = true;
    }

    ui.botWrap.hidden = state.config.mode !== 'ranked';
  }

  function renderRankLadder() {
    const current = tierFor(state.profile.rating || 1000);
    const rows = TIERS.map((tier, index) => {
      const next = TIERS[index + 1];
      const active = tier.name === current.name;
      const range = next ? `${nf(tier.min)}–${nf(next.min - 1)}` : `${nf(tier.min)}+`;
      return `<span class="rank-step${active ? ' active' : ''}" title="${tier.name}: ${range} puntos"><span class="rank-icon ${tierClass(tier.name)}">${tierIcon(tier.name)}</span><span>${tier.name}</span></span>`;
    }).join('');
    ui.rankedLadder.innerHTML = rows;
  }

  function getRadius() {
    const settings = SIZES[state.config.size] || SIZES.m;
    return Math.max(settings.min, W * settings.f);
  }

  function drawTarget(x, y, radiusValue, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = PINK;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = PINK;
    ctx.lineWidth = Math.max(2, radiusValue * 0.09);
    ctx.beginPath();
    ctx.arc(x, y, radiusValue, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.arc(x, y, radiusValue * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnTarget(now) {
    const radiusValue = getRadius();
    const padding = radiusValue + 10;
    for (let tries = 0; tries < 40; tries += 1) {
      const x = padding + Math.random() * Math.max(1, W - padding * 2);
      const y = padding + Math.random() * Math.max(1, H - padding * 2);
      const apart = game.targets.every(target => Math.hypot(target.x * W - x, target.y * H - y) > radiusValue * 3);
      const far = state.config.mode === 'burst' || !game.last || Math.hypot(game.last.x * W - x, game.last.y * H - y) > Math.min(W, H) * 0.25;
      if ((apart && far) || tries === 39) {
        game.targets.push({ x: x / W, y: y / H, born: now });
        return;
      }
    }
  }

  function draw(now) {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const radiusValue = getRadius();

    if (game.phase === 'idle') {
      drawTarget(W / 2, H * 0.4, radiusValue * 2.2, 1);
      return;
    }

    if (game.phase === 'countdown') {
      const elapsed = now - game.startTs;
      const count = Math.max(1, 3 - Math.floor(elapsed / 500));
      const alpha = RM ? 1 : 1 - (elapsed % 500) / 500 * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PINK;
      ctx.shadowColor = PINK;
      ctx.shadowBlur = 34;
      ctx.font = `600 ${Math.min(96, H * 0.28)}px Unbounded, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(count), W / 2, H / 2);
      ctx.restore();
      return;
    }

    if (game.phase === 'play') {
      for (const target of game.targets) {
        const t = RM ? 1 : Math.min(1, (now - target.born) / 140);
        const easing = 1 - Math.pow(1 - t, 3);
        drawTarget(target.x * W, target.y * H, radiusValue * (0.55 + 0.45 * easing), 0.35 + 0.65 * easing);
      }

      game.fx = game.fx.filter(item => now - item.t < 320);
      for (const fx of game.fx) {
        const k = (now - fx.t) / 320;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = PINK;
        ctx.lineWidth = 2;
        if (fx.kind === 'hit') {
          ctx.shadowColor = PINK;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.r * (1 + k * 0.9), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const size = 6;
          ctx.beginPath();
          ctx.moveTo(fx.x - size, fx.y - size); ctx.lineTo(fx.x + size, fx.y + size);
          ctx.moveTo(fx.x + size, fx.y - size); ctx.lineTo(fx.x - size, fx.y + size);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  function setText(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function botShown(now) {
    if (!game.bot) return 0;
    if (game.phase === 'done') return game.bot.score;
    if (game.phase !== 'play') return 0;
    const frac = clamp((now - game.startTs) / (state.config.dur * 1000), 0, 1);
    const wobble = Math.sin(frac * 23 + (game.bot.rt % 7)) * game.bot.score * 0.05 * (1 - frac);
    return Math.max(0, Math.round(game.bot.score * frac + wobble));
  }

  function updateHud(now) {
    const live = game.phase === 'play' || game.phase === 'done';
    const score = live ? Math.max(0, (game.raw * 60) / state.config.dur) : 0;
    setText(ui.score, nf(score));

    let left = state.config.dur;
    if (game.phase === 'play') left = Math.max(0, (game.endTs - now) / 1000);
    if (game.phase === 'done') left = 0;
    setText(ui.time, left.toFixed(1));

    const total = game.hits + game.miss;
    setText(ui.acc, total ? `${Math.round((game.hits / total) * 100)} %` : '–');

    ui.botWrap.hidden = state.config.mode !== 'ranked';
    if (state.config.mode === 'ranked') setText(ui.botScore, nf(botShown(now)));
  }

  function finishGame() {
    cancelAnimationFrame(game.raf);
    game.phase = 'done';

    const total = game.hits + game.miss;
    const accuracy = total ? (game.hits / total) * 100 : 0;
    const reaction = game.hits ? Math.round(game.rtTotal / game.hits) : 0;
    const score = Math.max(0, Math.round((game.raw * 60) / state.config.dur));

    const session = {
      t: Date.now(),
      d: dayKey(new Date()),
      mode: state.config.mode,
      size: state.config.size,
      dur: state.config.dur,
      hits: game.hits,
      miss: game.miss,
      acc: Number((accuracy).toFixed(1)),
      rt: reaction,
      score
    };

    let rankedInfo = null;
    if (state.config.mode === 'ranked' && game.bot) {
      const result = score > game.bot.score ? 'win' : score < game.bot.score ? 'loss' : 'draw';
      const before = state.profile.rating || 1000;
      const after = eloUpdate(before, game.botRating, result);
      session.result = result;
      session.botScore = game.bot.score;
      session.oppRating = Math.round(game.botRating);
      session.ratingBefore = before;
      session.ratingAfter = after;
      session.delta = after - before;
      rankedInfo = { result, bot: game.bot, before, after, delta: after - before };
    }

    let gained = 0;
    let levelAfter = null;
    let levelBefore = null;
    let leveledUp = false;

    if (total > 0) {
      levelBefore = levelFromXp(state.profile.xp).level;
      gained = xpGain(session);
      state.sessions.push(session);
      saveJSON(STORAGE.sessions, state.sessions);
      syncProfileFromSessions();
      levelAfter = levelFromXp(state.profile.xp).level;
      leveledUp = levelAfter > levelBefore;
    }

    ui.settings.removeAttribute('inert');
    draw(performance.now());
    updateHud(performance.now());
    renderProfile();
    showResults(session, total > 0, gained, levelAfter, leveledUp, rankedInfo);
    renderToday();
    renderCalendar();
    renderChart();
  }

  function showResults(session, saved, gained, levelAfter, leveledUp, ranked) {
    ui.ovIdle.hidden = true;
    ui.ovRes.hidden = false;

    let rankedBlock = '';
    if (ranked) {
      const label = ranked.result === 'win' ? 'Victoria' : ranked.result === 'draw' ? 'Empate' : 'Derrota';
      const tier = tierFor(ranked.after);
      const sign = ranked.delta > 0 ? '+' : '';
      rankedBlock = `
        <p class="res-badge">${label} contra el bot</p>
        <div class="res-vs">
          <span class="side"><span>Tú</span><span>${nf(session.score)}</span></span>
          <span class="mid">vs</span>
          <span class="side"><span>Bot</span><span>${nf(ranked.bot.score)}</span></span>
        </div>
        <p class="res-xp">${sign}${ranked.delta}&nbsp;Elo · ahora <b>${nf(ranked.after)}</b> (<span class="rank-icon ${tierClass(tier.name)}">${tierIcon(tier.name)}</span>${tier.name})</p>
      `;
    }

    ui.ovRes.innerHTML = `
      ${!ranked && leveledUp ? `<p class="res-badge">Subiste al nivel ${levelAfter}</p>` : ''}
      ${rankedBlock}
      <div class="res-score">${nf(session.score)}</div>
      <p class="res-unit">puntos</p>
      <dl class="res-stats">
        <div><dt>objetivos</dt><dd>${session.hits}</dd></div>
        <div><dt>precisión</dt><dd>${Math.round(session.acc)}&nbsp;%</dd></div>
        <div><dt>reacción</dt><dd>${session.hits ? `${session.rt}&nbsp;ms` : '–'}</dd></div>
        <div><dt>fallos</dt><dd>${session.miss}</dd></div>
      </dl>
      ${saved ? `<p class="res-xp">+${gained}&nbsp;XP${ranked && leveledUp ? ` · subiste al nivel ${levelAfter}` : ''}</p>` : ''}
      <div class="actions">
        <button class="btn primary" id="again" type="button" disabled>Jugar otra vez</button>
        <button class="btn" id="see-charts" type="button">Ver gráficas</button>
      </div>
      <p class="res-note">${saved ? 'Sesión guardada en tu calendario.' : 'No se guardó la sesión porque no hubo ningún clic.'}</p>
    `;

    const againButton = document.getElementById('again');
    againButton.addEventListener('click', startGame);
    document.getElementById('see-charts').addEventListener('click', () => setView('charts'));
    setTimeout(() => {
      if (game.phase === 'done' && againButton.isConnected) {
        againButton.disabled = false;
        againButton.focus();
      }
    }, 600);
  }

  function tick(now) {
    if (game.phase === 'countdown' && now - game.startTs >= 1500) {
      game.phase = 'play';
      game.startTs = now;
      game.endTs = now + state.config.dur * 1000;
      const count = state.config.mode === 'burst' ? 3 : 1;
      for (let i = 0; i < count; i += 1) spawnTarget(now);
    } else if (game.phase === 'play' && now >= game.endTs) {
      finishGame();
      return;
    }

    draw(now);
    updateHud(now);
    if (game.phase === 'countdown' || game.phase === 'play') {
      game.raf = requestAnimationFrame(tick);
    }
  }

  function startGame() {
    cancelAnimationFrame(game.raf);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    const bot = state.config.mode === 'ranked'
      ? (() => {
          const rating = clamp((state.profile.rating || 1000) + (Math.random() * 160 - 80), 300, 3000);
          return { rating, stats: botStats(rating, state.config.dur, state.config.size) };
        })()
      : null;

    Object.assign(game, {
      phase: 'countdown',
      targets: [],
      fx: [],
      hits: 0,
      miss: 0,
      rtTotal: 0,
      raw: 0,
      last: null,
      startTs: performance.now(),
      endTs: 0,
      bot: bot ? bot.stats : null,
      botRating: bot ? bot.rating : null
    });

    ui.ovIdle.hidden = true;
    ui.ovRes.hidden = true;
    ui.settings.setAttribute('inert', '');
    updateHud(game.startTs);
    game.raf = requestAnimationFrame(tick);
  }

  function cancelGame() {
    cancelAnimationFrame(game.raf);
    Object.assign(game, {
      phase: 'idle',
      targets: [],
      fx: [],
      hits: 0,
      miss: 0,
      rtTotal: 0,
      raw: 0,
      last: null,
      startTs: 0,
      endTs: 0,
      bot: null,
      botRating: null
    });
    ui.ovIdle.hidden = false;
    ui.ovRes.hidden = true;
    ui.settings.removeAttribute('inert');
    updateHud(performance.now());
    draw(performance.now());
  }

  function botStats(rating, dur, size) {
    const progress = clamp((rating - 700) / 1300, 0, 1);
    const acc = clamp(58 + progress * 38 + (Math.random() - 0.5) * 8, 45, 98);
    const rt = Math.round(clamp(760 - progress * 430 + (Math.random() - 0.5) * 60, 190, 820));
    const rate = 0.55 + progress * 0.9;
    const hits = Math.max(3, Math.round(rate * dur * (0.85 + Math.random() * 0.3)));
    const miss = Math.max(0, Math.round(hits * (100 / acc - 1)));
    return {
      hits,
      miss,
      acc: Math.round(acc * 10) / 10,
      rt,
      score: calcScore(hits, rt, miss, size, dur)
    };
  }

  function calcScore(hits, rt, miss, size, dur) {
    const bonus = Math.max(0, 1 - rt / 1200) * 100;
    const raw = hits * (100 + bonus) * (SIZES[size] || SIZES.m).mult - miss * 25;
    return Math.max(0, Math.round(raw * 60 / dur));
  }

  function eloUpdate(rating, oppRating, result) {
    const K = 48;
    const expected = 1 / (1 + Math.pow(10, (oppRating - rating) / 400));
    const r = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    return Math.max(0, Math.round(rating + K * (r - expected)));
  }

  function handleCanvasPointer(event) {
    if (game.phase !== 'play') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();

    const rect = ui.canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const now = performance.now();
    const radiusValue = getRadius() * 1.08;

    let hitIndex = -1;
    let bestDistance = Infinity;

    game.targets.forEach((target, index) => {
      const dx = target.x * W - px;
      const dy = target.y * H - py;
      const distance = Math.hypot(dx, dy);
      if (distance <= radiusValue && distance < bestDistance) {
        bestDistance = distance;
        hitIndex = index;
      }
    });

    if (hitIndex >= 0) {
      const target = game.targets[hitIndex];
      const rt = now - target.born;
      game.hits += 1;
      game.rtTotal += rt;
      game.raw += (100 + Math.max(0, 1 - rt / 1200) * 100) * (SIZES[state.config.size] || SIZES.m).mult;
      game.last = { x: target.x, y: target.y };
      if (!RM) game.fx.push({ kind: 'hit', x: target.x * W, y: target.y * H, r: getRadius(), t: now });
      game.targets.splice(hitIndex, 1);
      spawnTarget(now);
    } else {
      game.miss += 1;
      game.raw -= 25;
      if (!RM) game.fx.push({ kind: 'miss', x: px, y: py, t: now });
    }
  }

  function renderToday() {
    const groups = groupByDay();
    const dayList = groups.get(dayKey(new Date())) || [];
    let text = dayList.length
      ? `Hoy llevas ${plural(dayList.length, 'sesión', 'sesiones')} y tu mejor puntuación es ${nf(Math.max(...dayList.map(session => session.score)))}.`
      : 'Aún no has entrenado hoy.';
    const streakValue = currentStreak(groups);
    if (streakValue > 1) text += ` Racha de ${streakValue} días.`;
    ui.today.textContent = text;
  }

  function groupByDay() {
    const groups = new Map();
    for (const session of state.sessions) {
      if (!groups.has(session.d)) groups.set(session.d, []);
      groups.get(session.d).push(session);
    }
    return groups;
  }

  function currentStreak(groups) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!groups.has(dayKey(today))) {
      today.setDate(today.getDate() - 1);
    }
    let streak = 0;
    while (groups.has(dayKey(today))) {
      streak += 1;
      today.setDate(today.getDate() - 1);
    }
    return streak;
  }

  function renderCalendar() {
    const groups = groupByDay();
    const year = state.calMonth.getFullYear();
    const month = state.calMonth.getMonth();
    const monthName = new Intl.DateTimeFormat('es', { month: 'long' }).format(state.calMonth);
    ui.calTitle.textContent = `${monthName} ${year}`;

    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const todayKeyValue = dayKey(new Date());
    let html = '';

    for (let i = 0; i < offset; i += 1) html += '<span aria-hidden="true"></span>';

    for (let day = 1; day <= lastDay; day += 1) {
      const key = `${year}-${pad(month + 1)}-${pad(day)}`;
      const count = (groups.get(key) || []).length;
      const future = key > todayKeyValue;
      const label = `${day} de ${monthName}, ${count ? plural(count, 'sesión', 'sesiones') : 'sin sesiones'}`;
      html += `<button type="button" class="day${key === todayKeyValue ? ' today' : ''}" data-key="${key}" data-l="${Math.min(count, 4)}" aria-pressed="${key === state.selectedDay}" aria-label="${label}"${future ? ' disabled' : ''}>${day}</button>`;
    }

    ui.calDays.innerHTML = html;
    ui.calDays.querySelectorAll('.day').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedDay = button.dataset.key;
        renderCalendar();
        renderDayDetail();
      });
    });

    renderDayDetail();
  }

  function renderDayDetail() {
    const details = state.sessions.filter(session => session.d === state.selectedDay).sort((a, b) => b.t - a.t);
    if (!details.length) {
      ui.calDetail.innerHTML = `
        <h2>${new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(state.selectedDay))}</h2>
        <p class="muted">No hay sesiones registradas en este día.</p>
        <button class="btn primary" id="cal-go-train" type="button">Entrenar</button>
      `;
      const btn = document.getElementById('cal-go-train');
      if (btn) btn.addEventListener('click', () => setView('train'));
      return;
    }

    const total = details.reduce((sum, item) => sum + item.score, 0);
    const best = Math.max(...details.map(item => item.score));
    const avg = total / details.length;

    const list = details.map((session) => {
      const modeLabel = MODES[session.mode] || session.mode;
      const tag = session.result === 'win' ? '<span class="tag win">win</span>' : session.result === 'loss' ? '<span class="tag loss">loss</span>' : session.result ? '<span class="tag">draw</span>' : '';
      return `
        <li>
          <span class="t">${new Date(session.t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          <span class="s">${nf(session.score)}</span>
          ${tag}
          <span class="meta">${modeLabel} · ${session.hits} hits · ${Math.round(session.acc)}% · ${session.rt} ms</span>
        </li>
      `;
    }).join('');

    const formattedTitle = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(state.selectedDay));

    ui.calDetail.innerHTML = `
      <h2>${formattedTitle}</h2>
      <div class="facts">
        <div><span class="cap">Sesiones</span><b>${details.length}</b></div>
        <div><span class="cap">Puntuación media</span><b>${nf(avg)}</b></div>
        <div><span class="cap">Mejor</span><b>${nf(best)}</b></div>
      </div>
      <ul class="sess">${list}</ul>
      <button class="btn primary" id="cal-go-train" type="button">Entrenar</button>
    `;

    document.getElementById('cal-go-train').addEventListener('click', () => setView('train'));
  }

  function fromKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function renderChart() {
    const range = Number(state.chartRange) || 14;
    const metric = state.chartMetric || 'score';
    const now = new Date();
    const points = [];

    for (let index = range - 1; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      const key = dayKey(date);
      const daySessions = state.sessions.filter(session => session.d === key);
      const total = daySessions.length;
      let value = 0;
      if (total > 0) {
        if (metric === 'score') value = daySessions.reduce((sum, item) => sum + item.score, 0) / total;
        if (metric === 'acc') value = daySessions.reduce((sum, item) => sum + item.acc, 0) / total;
        if (metric === 'rt') value = daySessions.reduce((sum, item) => sum + item.rt, 0) / total;
        if (metric === 'hits') value = daySessions.reduce((sum, item) => sum + item.hits, 0) / total;
        if (metric === 'rating') value = Number(daySessions[daySessions.length - 1]?.ratingAfter || state.profile.rating || 1000);
      }
      points.push({ key, label: `${day.getDate()}`, value });
    }

    const values = points.map(point => point.value).filter(Number.isFinite);
    const max = values.length ? Math.max(...values) : 0;
    const min = values.length ? Math.min(...values) : 0;
    const rangeValue = Math.max(1, max - min);

    if (!values.length) {
      ui.chartSvg.innerHTML = '';
      ui.chartEmpty.hidden = false;
      ui.chartTip.hidden = true;
      ui.chartBig.textContent = '–';
      ui.chartCaption.textContent = 'Aún no hay sesiones para este período.';
      ui.chartSR.textContent = 'No hay sesiones';
      return;
    }

    ui.chartEmpty.hidden = true;
    const width = 760;
    const height = 260;
    const padLeft = 32;
    const padRight = 20;
    const padTop = 18;
    const padBottom = 30;

    const path = points.map((point, index) => {
      const x = padLeft + (index / Math.max(points.length - 1, 1)) * (width - padLeft - padRight);
      const y = padTop + (1 - (point.value - min) / rangeValue) * (height - padTop - padBottom);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const circles = points.map((point, index) => {
      const x = padLeft + (index / Math.max(points.length - 1, 1)) * (width - padLeft - padRight);
      const y = padTop + (1 - (point.value - min) / rangeValue) * (height - padTop - padBottom);
      return `<circle class="dot" cx="${x}" cy="${y}" r="4"></circle>`;
    }).join('');

    const yGuides = Array.from({ length: 4 }, (_, it) => {
      const y = padTop + (it / 3) * (height - padTop - padBottom);
      return `<line class="guide" x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}"></line>`;
    }).join('');

    const info = {
      score: { label: 'puntos', units: '', format: value => `${nf(value)}` },
      acc: { label: 'precisión', units: '%', format: value => `${Math.round(value)}%` },
      rt: { label: 'reacción', units: 'ms', format: value => `${Math.round(value)} ms` },
      hits: { label: 'objetivos', units: '', format: value => `${nf(value)}` },
      rating: { label: 'Elo', units: '', format: value => `${nf(value)}` }
    }[metric] || { label: 'puntos', units: '', format: value => `${nf(value)}` };

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const last = points[points.length - 1]?.value || 0;
    const delta = last - average;
    const deltaText = delta >= 0 ? '+' : '';
    ui.chartBig.innerHTML = `${info.format(average)}<small>${info.units}</small>`;
    ui.chartCaption.textContent = `${info.label} media en ${range} días · ${deltaText}${info.format(Math.abs(delta))} respecto a la media.`;
    ui.chartSR.textContent = `${metric} ${average}`;

    ui.chartSvg.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Gráfica de ${metric}">
        ${yGuides}
        <path class="line" d="${path}"></path>
        ${circles}
      </svg>
    `;
  }

  function handleKeyboard(event) {
    if (event.key === 'Escape' && (game.phase === 'play' || game.phase === 'countdown')) {
      cancelGame();
      return;
    }

    if (event.key === ' ' && state.view === 'train' && game.phase === 'idle') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (!['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tag || '')) {
        event.preventDefault();
        startGame();
      }
    }
  }

  function setStatus(message) {
    ui.ioStatus.textContent = message;
    setTimeout(() => {
      if (ui.ioStatus.textContent === message) ui.ioStatus.textContent = '';
    }, 2200);
  }

  function exportData() {
    const payload = JSON.stringify({ version: 1, sessions: state.sessions, profile: state.profile, config: state.config }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mira-export.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Datos exportados.');
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const nextSessions = normalizeSessions(parsed.sessions || parsed);
        if (!nextSessions.length && parsed.sessions !== undefined) {
          throw new Error('no sessions');
        }
        state.sessions = nextSessions;
        saveJSON(STORAGE.sessions, state.sessions);
        if (parsed.profile) state.profile = normalizeProfile(parsed.profile);
        if (parsed.config) state.config = normalizeConfig(parsed.config);
        applyAppearance();
        renderChipSelection();
        syncProfileFromSessions();
        renderProfile();
        renderToday();
        renderCalendar();
        renderChart();
        renderIdleText();
        setStatus('Datos importados correctamente.');
      } catch (_error) {
        setStatus('No se pudo importar el archivo.');
      }
    };
    reader.readAsText(file);
  }

  function loadSampleData() {
    const today = new Date();
    const samples = [];
    for (let day = 0; day < 18; day += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - day);
      const score = 120 + Math.round(Math.random() * 180) + (day % 4) * 20;
      const hits = 10 + Math.round(Math.random() * 10);
      const miss = 4 + Math.round(Math.random() * 6);
      const acc = clamp((hits / (hits + miss)) * 100, 0, 100);
      const rt = 350 + Math.round(Math.random() * 180);
      samples.push({
        t: date.getTime(),
        d: dayKey(date),
        mode: day % 5 === 0 ? 'ranked' : 'classic',
        size: ['s', 'm', 'l'][day % 3],
        dur: 30,
        hits,
        miss,
        acc: Number(acc.toFixed(1)),
        rt,
        score,
        result: day % 3 === 0 ? 'win' : day % 3 === 1 ? 'loss' : 'draw',
        ratingAfter: 1000 + (day * 14)
      });
    }
    state.sessions = samples;
    saveJSON(STORAGE.sessions, state.sessions);
    syncProfileFromSessions();
    renderProfile();
    renderToday();
    renderCalendar();
    renderChart();
    renderIdleText();
    setStatus('Datos de ejemplo cargados.');
  }

  function clearHistory() {
    const confirmed = window.confirm('¿Seguro que quieres borrar todo el historial?');
    if (!confirmed) return;
    state.sessions = [];
    state.profile = { xp: 0, rating: 1000, wins: 0, losses: 0, draws: 0 };
    localStorage.removeItem(STORAGE.sessions);
    localStorage.removeItem(STORAGE.profile);
    renderProfile();
    renderToday();
    renderCalendar();
    renderChart();
    renderIdleText();
    setStatus('Historial borrado.');
  }

  function init() {
    state.sessions = normalizeSessions(loadJSON(STORAGE.sessions, []));
    state.config = normalizeConfig(loadJSON(STORAGE.config, {}));
    state.profile = normalizeProfile(loadJSON(STORAGE.profile, {}));
    syncProfileFromSessions();

    ui.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setView(tab.dataset.view);
      });
    });

    document.querySelectorAll('.chip[data-k]').forEach((button) => {
      button.addEventListener('click', handleChipClick);
    });

    document.getElementById('open-settings').addEventListener('click', () => {
      const isHidden = ui.settingsPanel.hidden;
      ui.settingsPanel.hidden = !isHidden;
      ui.openSettings.setAttribute('aria-expanded', String(isHidden));
    });

    document.getElementById('cal-prev').addEventListener('click', () => {
      state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
      state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    document.getElementById('cal-today').addEventListener('click', () => {
      state.calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      state.selectedDay = dayKey(new Date());
      renderCalendar();
      renderDayDetail();
    });

    document.getElementById('empty-go').addEventListener('click', () => setView('train'));
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('click', () => ui.importFile.click());
    ui.importFile.addEventListener('change', (event) => importData(event.target.files[0]));
    document.getElementById('btn-sample').addEventListener('click', loadSampleData);
    document.getElementById('btn-clear').addEventListener('click', clearHistory);

    ui.ovIdle.addEventListener('click', startGame);
    ui.canvas.addEventListener('pointerdown', handleCanvasPointer);
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && (game.phase === 'play' || game.phase === 'countdown')) cancelGame();
    });

    new ResizeObserver(() => {
      const rect = ui.canvas.getBoundingClientRect();
      if (!rect.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      W = rect.width;
      H = rect.height;
      ui.canvas.width = Math.round(W * dpr);
      ui.canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }).observe(document.querySelector('.arena'));

    renderChipSelection();
    applyAppearance();
    renderProfile();
    renderIdleText();
    renderToday();
    renderCalendar();
    renderChart();
    updateHud(performance.now());
    draw(performance.now());
  }

  init();
})();























































































































































































































































































































































































