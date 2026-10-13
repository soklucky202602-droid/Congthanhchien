/* VLI Horse V15.3: non-destructive geometry calibration for PC mount animation.
   Corrects scale/anchor uniformly for all 3 mount layers while retaining actual PC sprites.
   DOES NOT invent missing K33 art or replace original SPR artwork. */
(function () {
  "use strict";
  if (window.VLI_PC_HORSE_V153_READY) return;
  const PREFIX = 'vli_pc_k';
  const STORE = 'vli_pc_horse_v15_3_scales';
  const ACTION = '\u9a91\u9a6c\u7ad9\u7acb'; // PC RideStand
  const PARTS = ['\u9a6c\u524d','\u9a6c\u4e2d','\u9a6c\u540e'];
  const foot = [96,121.2];
  const computed = new Map();
  const custom = {};
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE) || '{}');
    if (saved && typeof saved === 'object') {
      for (const [k, val] of Object.entries(saved)) {
        const n = Number(val);
        if (+k >= 34 && +k <= 75 && Number.isFinite(n) && n >= .25 && n <= 1.5) custom[k] = n;
      }
    }
  } catch (_) { /* Offline/private storage may be disabled. */ }
  function save() {
    try { window.localStorage.setItem(STORE, JSON.stringify(custom)); } catch (_) {}
  }
  function boundsFor(row) {
    const atlas = window.VLI_PC_HORSE_SHEET_META || {};
    const mappings = window.VLI_PC_HORSE_PARTS || {};
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, num = 0;
    for (const part of PARTS) {
      const anim = mappings[part] && mappings[part][row];
      const key = anim && anim[ACTION];
      const m = key && atlas['m/' + key];
      if (!m || m.length < 6 || !m.slice(0, 6).every(Number.isFinite)) continue;
      const x = m[2], y = m[3], w = m[0], h = m[1];
      if (w <= 0 || h <= 0) continue;
      minX = Math.min(minX,x); minY = Math.min(minY,y);
      maxX = Math.max(maxX,x+w); maxY = Math.max(maxY,y+h);
      num++;
    }
    if (num !== 3) return null;
    return { x:minX, y:minY, width:maxX-minX, height:maxY-minY, layers:num };
  }
  function computedInfo(row) {
    if (computed.has(row)) return computed.get(row);
    const k = row - 300;
    const modelStatus = window.VLI_PC_HORSE_STATUS || {};
    if (k < 34 || k > 75 || !modelStatus[k] || !modelStatus[k].ridingPC) return null;
    const box = boundsFor(row);
    if (!box) return null;
    // All three sprites are scaled AROUND THE SAME FOOT ANCHOR; never scale a single layer alone.
    // 95 x 90 PC-equivalent pixels permits mounts to remain larger than common H5 horses.
    const raw = Math.min(1, 95 / box.width, 90 / box.height);
    const s = Math.max(.42, Math.min(1, raw));
    const result = { k, row, bounds: box, automaticScale: s, originalFoot:foot.slice() };
    computed.set(row, result);
    return result;
  }
  function geometry(row) {
    const i = computedInfo(row);
    if (!i) return null;
    const val = custom[i.k];
    return { k: i.k, row: i.row, scale: Number.isFinite(val) ? val : i.automaticScale,
             autoScale: i.automaticScale, bounds: i.bounds };
  }
  function setScale(k, value) {
    k = Number(k); value = Number(value);
    if (!Number.isInteger(k) || k < 34 || k > 75) return false;
    if (!Number.isFinite(value) || value < .25 || value > 1.5) return false;
    custom[k] = value; save(); return true;
  }
  function resetScale(k) {
    delete custom[k]; save();
  }
  window.VLI_PC_HORSE_GEOMETRY = geometry;
  window.VLI_PC_HORSE_SET_SCALE = setScale;
  window.VLI_PC_HORSE_RESET_SCALE = resetScale;
  window.VLI_PC_HORSE_V153_READY = true;
  window.VLI_PC_HORSE_V153_STATUS = {version:'15.3.0', maxWidth:95, maxHeight:90,
    missingOriginal:[33], notes:'SPR PC not modified; scales 3 riding layers uniformly; K33 still lacks PC sprite.'};
  let last = '';
  // A game running before the V15 atlas registration can retain a stale R.jx mount row.
  // Refresh only for newly added mounts, only when the row/riding state is stale.
  const sync = function () {
    try {
      if (typeof S === 'undefined' || typeof R === 'undefined' || !S || !R || !S.eq) return;
      const horse = S.eq.horse;
      const k = horse && horse.d === 10 ? Number(horse.k) : -1;
      if (!(k >= 33 && k <= 75)) { last = ''; return; }
      const mounted = !!R.mounted;
      const row = k >= 34 ? (window.VLI_PC_HORSE_EXACT_ROWS || {})[k] : null;
      const signature = [k,mounted,row,R.jx && R.jx.rows && R.jx.rows.horse].join('|');
      if (!mounted || !Number.isInteger(row)) { last = signature; return; }
      if (R.jx && R.jx.rows && R.jx.rows.horse === row) { last = signature; return; }
      // Keep retrying until JXLOOK and character setup are actually available.
      if (typeof jxSetup !== 'function') return;
      const next = jxSetup();
      if (!next || !next.rows || next.rows.horse !== row) return;
      R.jx = next;
      last = [k,mounted,row,row].join('|');
      if (typeof jxPreload === 'function') jxPreload();
    } catch (e) { console.warn('[VLI Horse V15.3] mount refresh:', e); }
  };
  if (typeof window.setInterval === 'function') window.setInterval(sync, 500);
  console.info('[VLI Horse V15.3] Scale/anchor calibration active for K34-K75; K33 PC art still missing.');
})();
