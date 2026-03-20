/* ══════════════════════════════════════════════════
   Timeout  –  timeout.js
   • Jeu : carré orange, score, miss, one-hit
   • Crosshair SVG custom : formes, couleur, taille…
   • Leaderboard localStorage
══════════════════════════════════════════════════ */

const DUREE_MAX    = 10;
const INTERVALLE   = 1000;
const TAILLE_CIBLE = 50;
const LS_KEY_LB_NORMAL   = 'timeout_lb_normal';
const LS_KEY_LB_HARDCORE = 'timeout_lb_hardcore';
const LS_KEY_CH          = 'timeout_crosshair';

/* ─── DOM JEU ─────────────────────────────────── */
const zone        = document.getElementById('zone');
const cible       = document.getElementById('cible');
const btnStart    = document.getElementById('btn-start');
const resultEl    = document.getElementById('result');
const timerBar    = document.getElementById('timer-bar');
const idleMsg     = document.getElementById('idle-msg');
const scoreVal    = document.getElementById('score-val');
const missVal     = document.getElementById('miss-val');
const pseudoWrap  = document.getElementById('pseudo-wrap');
const pseudoInput = document.getElementById('pseudo-input');
const btnSave     = document.getElementById('btn-save');

/* ─── DOM MODAL ───────────────────────────────── */
const btnOpenParams  = document.getElementById('btn-open-params');
const btnCloseParams = document.getElementById('btn-close-params');
const modalBackdrop  = document.getElementById('modal-backdrop');

function openModal()  { modalBackdrop.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal() { modalBackdrop.classList.remove('open'); document.body.style.overflow = ''; }

btnOpenParams.addEventListener('click', openModal);
btnCloseParams.addEventListener('click', closeModal);
// Clic sur le fond = ferme
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
// Echap = ferme
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ─── DOM LEADERBOARD ─────────────────────────── */
const lbTabs         = document.querySelectorAll('.lb-tab');
const lbPanels       = document.querySelectorAll('.lb-panel');
const lbListNormal   = document.getElementById('lb-list-normal');
const lbListHardcore = document.getElementById('lb-list-hardcore');
const lbEmptyNormal  = document.getElementById('lb-empty-normal');
const lbEmptyHardcore= document.getElementById('lb-empty-hardcore');
const btnClearLb     = document.getElementById('btn-clear-lb');

let activeTab = 'normal'; // onglet actif courant

lbTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    lbTabs.forEach(t  => t.classList.toggle('active',  t === tab));
    lbPanels.forEach(p => p.classList.toggle('active', p.id === `lb-panel-${activeTab}`));
  });
});

/* ─── DOM PARAMS ──────────────────────────────── */
const toggleOneHit  = document.getElementById('toggle-one-hit');
const oneHitStatus  = document.getElementById('one-hit-status');

/* ─── DOM CROSSHAIR ───────────────────────────── */
const chOverlay     = document.getElementById('crosshair-overlay');
const chPreviewSvg  = document.getElementById('ch-preview-svg');
const btnResetCh    = document.getElementById('btn-reset-ch');
const presetGrid    = document.getElementById('preset-grid');

const inp = {
  color:        document.getElementById('ch-color'),
  outlineColor: document.getElementById('ch-outline-color'),
  outline:      document.getElementById('ch-outline'),
  opacity:      document.getElementById('ch-opacity'),
  size:         document.getElementById('ch-size'),
  thick:        document.getElementById('ch-thick'),
  gap:          document.getElementById('ch-gap'),
  len:          document.getElementById('ch-len'),
  radius:       document.getElementById('ch-radius'),
  rotate:       document.getElementById('ch-rotate'),
};
const valEls = {
  opacity: document.getElementById('v-opacity'),
  size:    document.getElementById('v-size'),
  thick:   document.getElementById('v-thick'),
  gap:     document.getElementById('v-gap'),
  len:     document.getElementById('v-len'),
  radius:  document.getElementById('v-radius'),
  rotate:  document.getElementById('v-rotate'),
};

/* ════════════════════════════════════════════════
   CROSSHAIR CONFIG & PRESETS
════════════════════════════════════════════════ */
const DEFAULT_CH = {
  shapes:       ['cross', 'dot'],
  color:        '#00e676',
  outlineColor: '#000000',
  outline:      1,
  opacity:      100,
  size:         20,
  thick:        2,
  gap:          3,
  len:          8,
  radius:       10,
  rotate:       0,
};

const PRESETS = [
  { name: 'Classic',  cfg: { shapes:['cross','dot'],    color:'#00e676', outlineColor:'#000', outline:1,   opacity:100, size:20, thick:2, gap:3,  len:8,  radius:10, rotate:0   } },
  { name: 'Sniper',   cfg: { shapes:['cross'],           color:'#ffffff', outlineColor:'#000', outline:1,   opacity:80,  size:24, thick:1, gap:6,  len:12, radius:10, rotate:0   } },
  { name: 'Dot',      cfg: { shapes:['dot'],             color:'#ff2244', outlineColor:'#000', outline:1.5, opacity:100, size:6,  thick:2, gap:0,  len:6,  radius:6,  rotate:0   } },
  { name: 'Circle',   cfg: { shapes:['circle','dot'],    color:'#ffd600', outlineColor:'#000', outline:1,   opacity:90,  size:16, thick:2, gap:4,  len:6,  radius:12, rotate:0   } },
  { name: 'X',        cfg: { shapes:['cross'],           color:'#ff6b00', outlineColor:'#000', outline:1,   opacity:100, size:18, thick:3, gap:2,  len:8,  radius:10, rotate:45  } },
  { name: 'Diamond',  cfg: { shapes:['diamond'],         color:'#00cfff', outlineColor:'#000', outline:1,   opacity:100, size:20, thick:2, gap:3,  len:8,  radius:10, rotate:0   } },
  { name: 'T-Sight',  cfg: { shapes:['tee'],             color:'#ffffff', outlineColor:'#222', outline:1,   opacity:100, size:20, thick:2, gap:4,  len:10, radius:10, rotate:0   } },
  { name: 'Minimal',  cfg: { shapes:['cross'],           color:'#ffffff', outlineColor:'#000', outline:0,   opacity:60,  size:14, thick:1, gap:4,  len:5,  radius:10, rotate:0   } },
];

let chConfig = { ...DEFAULT_CH, shapes: [...DEFAULT_CH.shapes] };

/* ─── Build preset buttons ───────────────────── */
PRESETS.forEach(p => {
  const btn = document.createElement('button');
  btn.className   = 'preset-btn';
  btn.textContent = p.name;
  btn.addEventListener('click', () => { applyPreset(p.cfg); });
  presetGrid.appendChild(btn);
});

function applyPreset(cfg) {
  chConfig = { ...cfg, shapes: [...cfg.shapes] };
  syncUIFromConfig();
  saveCHConfig();
  buildCrosshair(chOverlay);
  buildCrosshair(chPreviewSvg);
}

/* ─── Shape toggle buttons ───────────────────── */
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const s = btn.dataset.shape;
    const idx = chConfig.shapes.indexOf(s);
    if (idx === -1) { chConfig.shapes.push(s); btn.classList.add('active'); }
    else            { chConfig.shapes.splice(idx, 1); btn.classList.remove('active'); }
    saveCHConfig();
    buildCrosshair(chOverlay);
    buildCrosshair(chPreviewSvg);
  });
});

/* ─── Sliders & color inputs ─────────────────── */
const sliderMap = [
  ['opacity', 'opacity', v => v + '%'],
  ['size',    'size',    v => v],
  ['thick',   'thick',   v => v],
  ['gap',     'gap',     v => v],
  ['len',     'len',     v => v],
  ['radius',  'radius',  v => v],
  ['rotate',  'rotate',  v => v + '°'],
];
sliderMap.forEach(([inpKey, cfgKey, fmt]) => {
  inp[inpKey].addEventListener('input', () => {
    const v = parseFloat(inp[inpKey].value);
    chConfig[cfgKey] = v;
    if (valEls[inpKey]) valEls[inpKey].textContent = fmt(v);
    saveCHConfig();
    buildCrosshair(chOverlay);
    buildCrosshair(chPreviewSvg);
  });
});
['color','outlineColor'].forEach(key => {
  inp[key === 'color' ? 'color' : 'outlineColor'].addEventListener('input', (e) => {
    chConfig[key] = e.target.value;
    saveCHConfig();
    buildCrosshair(chOverlay);
    buildCrosshair(chPreviewSvg);
  });
});
inp.outline.addEventListener('input', () => {
  chConfig.outline = parseFloat(inp.outline.value);
  saveCHConfig();
  buildCrosshair(chOverlay);
  buildCrosshair(chPreviewSvg);
});

/* ─── Reset ──────────────────────────────────── */
btnResetCh.addEventListener('click', () => {
  chConfig = { ...DEFAULT_CH, shapes: [...DEFAULT_CH.shapes] };
  syncUIFromConfig();
  saveCHConfig();
  buildCrosshair(chOverlay);
  buildCrosshair(chPreviewSvg);
});

/* ─── Sync UI controls → chConfig ────────────── */
function syncUIFromConfig() {
  inp.color.value        = chConfig.color;
  inp.outlineColor.value = chConfig.outlineColor;
  inp.outline.value      = chConfig.outline;
  inp.opacity.value      = chConfig.opacity;
  inp.size.value         = chConfig.size;
  inp.thick.value        = chConfig.thick;
  inp.gap.value          = chConfig.gap;
  inp.len.value          = chConfig.len;
  inp.radius.value       = chConfig.radius;
  inp.rotate.value       = chConfig.rotate;

  valEls.opacity.textContent = chConfig.opacity + '%';
  valEls.size.textContent    = chConfig.size;
  valEls.thick.textContent   = chConfig.thick;
  valEls.gap.textContent     = chConfig.gap;
  valEls.len.textContent     = chConfig.len;
  valEls.radius.textContent  = chConfig.radius;
  valEls.rotate.textContent  = chConfig.rotate + '°';

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.classList.toggle('active', chConfig.shapes.includes(btn.dataset.shape));
  });
}

/* ─── Build SVG crosshair ────────────────────── */
function buildCrosshair(targetSvg) {
  const c    = chConfig;
  const col  = c.color;
  const oc   = c.outlineColor;
  const sw   = c.outline;
  const op   = c.opacity / 100;
  const rot  = c.rotate;
  const ns   = 'http://www.w3.org/2000/svg';

  // isPreview → taille fixe 80×80, sinon 1×1 (overflow:visible fait le reste)
  const isPreview = targetSvg === chPreviewSvg;
  const dim = isPreview ? 80 : 1;

  targetSvg.setAttribute('width',  dim);
  targetSvg.setAttribute('height', dim);
  targetSvg.setAttribute('viewBox', `${-dim/2} ${-dim/2} ${dim} ${dim}`);
  targetSvg.setAttribute('overflow', 'visible');

  // Vide
  while (targetSvg.firstChild) targetSvg.removeChild(targetSvg.firstChild);

  // Groupe racine avec opacité + rotation globale
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('opacity', op);
  g.setAttribute('transform', `rotate(${rot})`);
  targetSvg.appendChild(g);

  const paint = (el) => {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', col);
    el.setAttribute('stroke-width', c.thick);
    if (sw > 0) {
      el.setAttribute('paint-order', 'stroke');
      el.setAttribute('stroke', col);
      // On double l'élément pour le contour
    }
    g.appendChild(el);
    return el;
  };

  // Helper : crée un élément avec contour
  function addShape(tagName, attrs, isFilled = false) {
    // contour
    if (sw > 0) {
      const outline = document.createElementNS(ns, tagName);
      Object.entries(attrs).forEach(([k, v]) => outline.setAttribute(k, v));
      if (isFilled) {
        outline.setAttribute('fill', oc);
        outline.setAttribute('stroke', oc);
      } else {
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', oc);
      }
      outline.setAttribute('stroke-width', isFilled ? 0 : c.thick + sw * 2);
      outline.setAttribute('stroke-linecap', 'round');
      g.appendChild(outline);
    }
    // forme principale
    const el = document.createElementNS(ns, tagName);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (isFilled) {
      el.setAttribute('fill', col);
      el.setAttribute('stroke', 'none');
    } else {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', col);
      el.setAttribute('stroke-width', c.thick);
      el.setAttribute('stroke-linecap', 'round');
    }
    g.appendChild(el);
    return el;
  }

  const gap = c.gap;
  const len = c.len;
  const rad = c.radius;
  const sz  = c.size;

  c.shapes.forEach(shape => {
    switch (shape) {

      case 'cross':
        // haut
        addShape('line', { x1:0, y1:-(gap), x2:0, y2:-(gap+len) });
        // bas
        addShape('line', { x1:0, y1:gap,    x2:0, y2:(gap+len)  });
        // gauche
        addShape('line', { x1:-(gap), y1:0, x2:-(gap+len), y2:0 });
        // droite
        addShape('line', { x1:gap,    y1:0, x2:(gap+len),  y2:0 });
        break;

      case 'dot':
        addShape('circle', { cx:0, cy:0, r: c.thick + 1 }, true);
        break;

      case 'circle':
        addShape('circle', { cx:0, cy:0, r: rad });
        break;

      case 'square': {
        const half = sz / 2;
        addShape('rect', { x:-half, y:-half, width:sz, height:sz });
        break;
      }

      case 'diamond': {
        const h = sz / 2;
        addShape('polygon', { points: `0,${-h} ${h},0 0,${h} ${-h},0` });
        break;
      }

      case 'tee':
        // barre horizontale
        addShape('line', { x1:-(gap+len), y1:0, x2:(gap+len), y2:0 });
        // barre verticale vers le bas uniquement
        addShape('line', { x1:0, y1:gap, x2:0, y2:(gap+len) });
        break;
    }
  });
}

/* ─── Suivi souris dans la zone ─────────────── */
zone.addEventListener('mousemove', (e) => {
  chOverlay.style.left = e.clientX + 'px';
  chOverlay.style.top  = e.clientY + 'px';
});
zone.addEventListener('mouseenter', () => { chOverlay.style.display = 'block'; });
zone.addEventListener('mouseleave', () => { chOverlay.style.display = 'none';  });

/* ─── Persist crosshair ──────────────────────── */
function saveCHConfig() {
  localStorage.setItem(LS_KEY_CH, JSON.stringify(chConfig));
}
function loadCHConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY_CH));
    if (saved) chConfig = { ...DEFAULT_CH, ...saved, shapes: saved.shapes || [...DEFAULT_CH.shapes] };
  } catch {}
}

/* ════════════════════════════════════════════════
   LEADERBOARD  (2 classements séparés)
════════════════════════════════════════════════ */
function lbKey(hardcore)  { return hardcore ? LS_KEY_LB_HARDCORE : LS_KEY_LB_NORMAL; }
function lbLoad(hardcore) { try { return JSON.parse(localStorage.getItem(lbKey(hardcore))) || []; } catch { return []; } }
function lbSave(data, hardcore) { localStorage.setItem(lbKey(hardcore), JSON.stringify(data)); }

function lbAdd(pseudo, sc, ms, hardcore) {
  const data = lbLoad(hardcore);
  data.push({ pseudo: pseudo.trim() || 'Anonyme', score: sc, misses: ms, date: Date.now() });
  data.sort((a, b) => b.score - a.score || a.misses - b.misses || a.date - b.date);
  lbSave(data.slice(0, 10), hardcore);
  renderLB(false);
  renderLB(true);
}

function lbClear() {
  lbSave([], activeTab === 'hardcore');
  renderLB(activeTab === 'hardcore');
}

function renderLB(hardcore) {
  const data    = lbLoad(hardcore);
  const list    = hardcore ? lbListHardcore  : lbListNormal;
  const empty   = hardcore ? lbEmptyHardcore : lbEmptyNormal;
  const medals  = ['gold','silver','bronze'];
  const tiers   = ['top1','top2','top3'];

  list.innerHTML = '';
  if (!data.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  data.forEach((e, i) => {
    const li = document.createElement('li');
    if (tiers[i]) li.classList.add(tiers[i]);
    li.innerHTML = `
      <span class="lb-rank ${medals[i]||''}">${i+1}</span>
      <span class="lb-pseudo">${e.pseudo}</span>
      <span class="lb-score">${e.score}</span>
      <span class="lb-miss">${e.misses}✗</span>`;
    list.appendChild(li);
  });
}

/* ════════════════════════════════════════════════
   JEU
════════════════════════════════════════════════ */
let intervalDeplacement = null, timeoutFin = null, intervalBarre = null;
let debut = null, score = 0, misses = 0, enCours = false;

function isOneHit() { return toggleOneHit.checked; }

toggleOneHit.addEventListener('change', () => {
  const on = isOneHit();
  oneHitStatus.textContent = on ? 'ON' : 'OFF';
  oneHitStatus.className   = 'toggle-status' + (on ? ' on' : '');
  zone.classList.toggle('one-hit-mode', on);
  if (!enCours) idleMsg.textContent = on ? '☠ ONE HIT – Un miss = PERDU' : 'Appuie sur START pour jouer';
});

function positionAleatoire() {
  return {
    x: Math.floor(Math.random() * (zone.clientWidth  - TAILLE_CIBLE)),
    y: Math.floor(Math.random() * (zone.clientHeight - TAILLE_CIBLE)),
  };
}
function deplacerCible() {
  const { x, y } = positionAleatoire();
  cible.style.left = x + 'px';
  cible.style.top  = y + 'px';
  cible.classList.remove('teleport');
  void cible.offsetWidth;
  cible.classList.add('teleport');
}
function afficherPopup(x, y, type) {
  const el = document.createElement('div');
  el.className = 'popup ' + type;
  el.textContent = type === 'hit' ? '+1' : 'MISS';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  zone.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
function stopperTimers() {
  clearInterval(intervalDeplacement);
  clearTimeout(timeoutFin);
  clearInterval(intervalBarre);
  intervalDeplacement = intervalBarre = timeoutFin = null;
}
function mettreAJourBarre() {
  const ratio = Math.max(0, 1 - (Date.now() - debut) / (DUREE_MAX * 1000));
  timerBar.style.width      = (ratio * 100) + '%';
  timerBar.style.background = ratio > 0.5 ? 'var(--accent)' : ratio > 0.25 ? 'var(--accent2)' : 'var(--red)';
}
function finDePartie(raison) {
  if (!enCours) return;
  enCours = false;
  stopperTimers();
  cible.style.display   = 'none';
  idleMsg.style.opacity = '1';
  timerBar.style.width  = '0%';
  timerBar.style.background = 'var(--red)';
  if (raison === 'miss') {
    resultEl.textContent = `☠ ONE HIT – PERDU !  Score : ${score}`;
    resultEl.className   = 'lose';
    idleMsg.textContent  = '☠ ONE HIT – Un miss = PERDU';
  } else {
    resultEl.textContent = `⏱ Temps écoulé ! Score : ${score}  •  ${misses} miss`;
    resultEl.className   = score > 0 ? 'win' : '';
    idleMsg.textContent  = isOneHit() ? '☠ ONE HIT – Un miss = PERDU' : 'Appuie sur START pour jouer';
  }
  pseudoWrap.style.display = 'flex';
  pseudoInput.focus();
}

zone.addEventListener('click', (e) => {
  if (!enCours || e.target === cible) return;
  misses++;
  missVal.textContent = misses;
  const r = zone.getBoundingClientRect();
  afficherPopup(e.clientX - r.left - 20, e.clientY - r.top - 20, 'miss');
  zone.classList.remove('flash-miss');
  void zone.offsetWidth;
  zone.classList.add('flash-miss');
  if (isOneHit()) finDePartie('miss');
});

cible.addEventListener('click', (e) => {
  if (!enCours) return;
  e.stopPropagation();
  score++;
  scoreVal.textContent = score;
  const r = zone.getBoundingClientRect();
  afficherPopup(e.clientX - r.left - 10, e.clientY - r.top - 20, 'hit');
  clearInterval(intervalDeplacement);
  deplacerCible();
  intervalDeplacement = setInterval(deplacerCible, INTERVALLE);
});

function enregistrerScore() {
  lbAdd(pseudoInput.value, score, misses, isOneHit());
  pseudoWrap.style.display = 'none';
  pseudoInput.value = '';
  btnStart.disabled = false;
  // Basculer automatiquement l'onglet sur le bon classement
  const targetTab = isOneHit() ? 'hardcore' : 'normal';
  lbTabs.forEach(t  => t.classList.toggle('active',  t.dataset.tab === targetTab));
  lbPanels.forEach(p => p.classList.toggle('active', p.id === `lb-panel-${targetTab}`));
  activeTab = targetTab;
}
btnSave.addEventListener('click', enregistrerScore);
pseudoInput.addEventListener('keydown', e => { if (e.key === 'Enter') enregistrerScore(); });

function demarrer() {
  score = misses = 0;
  scoreVal.textContent = missVal.textContent = '0';
  resultEl.textContent = '';
  resultEl.className   = '';
  timerBar.style.width = '100%';
  timerBar.style.background = 'var(--accent)';
  idleMsg.style.opacity    = '0';
  pseudoWrap.style.display = 'none';
  btnStart.disabled = true;
  enCours           = true;

  cible.style.display = 'block';
  deplacerCible();
  debut = Date.now();

  intervalDeplacement = setInterval(deplacerCible, INTERVALLE);
  timeoutFin          = setTimeout(() => finDePartie('temps'), DUREE_MAX * 1000);
  intervalBarre       = setInterval(mettreAJourBarre, 16);
}
btnStart.addEventListener('click', demarrer);
btnClearLb.addEventListener('click', () => {
  const label = activeTab === 'hardcore' ? 'Hardcore' : 'Normal';
  if (confirm(`Réinitialiser le classement ${label} ?`)) lbClear();
});

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
loadCHConfig();
syncUIFromConfig();
buildCrosshair(chOverlay);
buildCrosshair(chPreviewSvg);
renderLB(false);
renderLB(true);