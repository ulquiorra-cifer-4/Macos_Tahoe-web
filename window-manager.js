"use strict";
// ============================================================
//  macOS Tahoe — window-manager.js  (v3)
//  Fixes:
//  • Restore always returns to EXACT saved position
//  • Minimize animation targets dock icon pixel-perfectly
//  • Dock jiggle on both minimize and restore
//  • Open animation springs from dock icon
// ============================================================

let _activeZ  = 10;
const _wins   = new Map();
let _activeId = null;

// ── z-index ──
function _raise(state) {
  _activeZ += 2;
  state.zIndex = _activeZ;
  state.el.style.zIndex = String(state.zIndex);
  const allZ = [..._wins.values()].map(s => s.zIndex).filter(z => z > 0);
  if (allZ.length && Math.max(...allZ) > 500) {
    const lowest = Math.min(...[...new Set(allZ)]);
    _activeZ -= lowest;
    _wins.forEach(s => {
      if (s.zIndex >= lowest) s.zIndex -= lowest;
      s.el.style.zIndex = String(s.zIndex);
    });
  }
}

function _setActive(appId) {
  _wins.forEach((s, id) => {
    s.el.classList.toggle("active", id === appId);
    const tl = s.el.querySelector(".tl-lights");
    if (tl) tl.dataset.focused = id === appId ? "true" : "false";
    const tlC = s.el.querySelector(".tl-container");
    if (tlC) tlC.classList.toggle("unfocused", id !== appId);
  });
  _activeId = appId;
  const s = _wins.get(appId);
  if (s) _raise(s);
}

// ── Dock helpers ──
function _hideDock() {
  const dc = document.getElementById("dockContainer");
  if (!dc) return;
  dc.style.transition = "transform 0.30s cubic-bezier(0.4,0,0.2,1)";
  dc.style.transform  = "translateY(120%)";
}
function _showDock() {
  const dc = document.getElementById("dockContainer");
  if (!dc) return;
  dc.style.transition = "transform 0.36s cubic-bezier(0.34,1.4,0.64,1)";
  dc.style.transform  = "translateY(0%)";
}

// ── Dock icon jiggle (damped sine) ──
function _jiggle(appId) {
  const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
  if (!btn) return;
  const img = btn.querySelector("img, .dock-icon-emoji");
  if (!img) return;
  const T0 = performance.now();
  const DUR = 540;
  function tick(now) {
    const t = Math.min((now - T0) / DUR, 1);
    if (t >= 1) { img.style.transform = ""; return; }
    const decay = 1 - t;
    const a = Math.sin(t * Math.PI * 5.5) * 9 * decay;
    const y = Math.sin(t * Math.PI * 3)   * -5 * decay;
    img.style.transform = `rotate(${a}deg) translateY(${y}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Mini-badge on dock ──
function _addBadge(appId) {
  _removeBadge(appId);
  const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
  if (!btn) return;
  const d = document.createElement("div");
  d.className = "wm-mini-dot";
  d.dataset.appId = appId;
  btn.appendChild(d);
}
function _removeBadge(appId) {
  document.querySelectorAll(`.wm-mini-dot[data-app-id="${appId}"]`).forEach(d => d.remove());
}

// ── Read the translate(x,y) from a window element ──
function _getTx(win) {
  const m = win.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
}

// ── Screen centre of dock icon (absolute page coords) ──
function _dockCentre(appId) {
  const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
  if (!btn) {
    // Fallback: bottom-centre of viewport
    return { x: window.innerWidth / 2, y: window.innerHeight - 40 };
  }
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ── MINIMIZE ──
function _minimize(win, appId) {
  const state = _wins.get(appId);
  if (!state || state.isMinimized || state.isAnimating) return;
  state.isAnimating = true;

  // Save current translate NOW (before we touch anything)
  const saved = _getTx(win);
  state.savedTx = saved.x;
  state.savedTy = saved.y;

  // Where the dock icon is on screen
  const dock = _dockCentre(appId);

  // Window's current screen-space centre
  const wr   = win.getBoundingClientRect();
  const wcx  = wr.left + wr.width  / 2;
  const wcy  = wr.top  + wr.height / 2;

  // Delta from window centre → dock centre, in CSS translate space
  const ddx = dock.x - wcx;
  const ddy = dock.y - wcy;

  win.style.pointerEvents  = "none";
  win.style.transformOrigin = "center bottom";

  // Phase 1: quick squash
  win.style.transition = "transform 110ms cubic-bezier(0.4,0,1,1)";
  win.style.transform  = `translate(${saved.x}px,${saved.y}px) scale(1.05,0.88)`;

  setTimeout(() => {
    // Phase 2: fly to dock, vanish
    win.style.transition = [
      "transform 360ms cubic-bezier(0.55,0,0.85,0.5)",
      "opacity   300ms ease 50ms",
    ].join(", ");
    win.style.transform = `translate(${saved.x + ddx}px, ${saved.y + ddy}px) scale(0.08,0.08)`;
    win.style.opacity   = "0";
  }, 100);

  setTimeout(() => {
    // Hide & mark
    win.style.display    = "none";
    state.isMinimized    = true;
    state.isAnimating    = false;
    // Reset transform so restore starts clean
    win.style.transform  = `translate(${saved.x}px,${saved.y}px) scale(1)`;
    win.style.opacity    = "1";
    win.style.transition = "";
    win.style.transformOrigin = "";
    _addBadge(appId);
    _jiggle(appId);
  }, 480);
}

// ── RESTORE ──
function _restore(win, appId) {
  const state = _wins.get(appId);
  if (!state || !state.isMinimized || state.isAnimating) return;
  state.isAnimating = true;
  state.isMinimized = false;

  // savedTx/savedTy are the exact pre-minimize translate values
  const tx = state.savedTx ?? 0;
  const ty = state.savedTy ?? 0;

  const dock = _dockCentre(appId);

  // Screen-space window centre at rest position
  // We don't have getBoundingClientRect (hidden), so compute from translate + size
  const winW = parseFloat(win.style.width)  || 800;
  const winH = parseFloat(win.style.height) || 500;
  // The desktop element offset (should be 0,0 but be safe)
  const area = document.getElementById("windows-area");
  const ar   = area ? area.getBoundingClientRect() : { left: 0, top: 0 };
  const restCx = ar.left + tx + winW / 2;
  const restCy = ar.top  + ty + winH / 2;

  // Delta from dock → rest position
  const ddx = dock.x - restCx;
  const ddy = dock.y - restCy;

  // Set window to dock position silently
  win.style.transition = "none";
  win.style.transform  = `translate(${tx + ddx}px, ${ty + ddy}px) scale(0.08,0.08)`;
  win.style.opacity    = "0";
  win.style.display    = "";
  win.style.pointerEvents = "none";
  win.style.transformOrigin = "center bottom";

  // Double rAF to ensure display:'' has taken effect before transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      win.style.transition = [
        "transform 400ms cubic-bezier(0.34,1.45,0.64,1)",
        "opacity   240ms ease",
      ].join(", ");
      win.style.transform = `translate(${tx}px, ${ty}px) scale(1)`;
      win.style.opacity   = "1";
    });
  });

  setTimeout(() => {
    win.style.transition = "";
    win.style.transformOrigin = "";
    win.style.pointerEvents = "";
    state.isAnimating = false;
    _removeBadge(appId);
    _jiggle(appId);
    _setActive(appId);
  }, 440);
}

// ── Traffic Lights ──
function _buildTL(appId, onClose, onMaximize) {
  const container = document.createElement("div");
  container.className = "tl-container";

  const lights = document.createElement("div");
  lights.className = "tl-lights";

  const close = document.createElement("button");
  close.className = "tl-btn tl-close";
  close.setAttribute("aria-label", "Close");
  close.innerHTML = `<svg class="tl-icon" viewBox="0 0 10 10"><path d="M3 3l4 4M7 3L3 7" stroke="rgba(0,0,0,0.55)" stroke-width="1.2" stroke-linecap="round"/></svg>`;
  close.addEventListener("click", (e) => { e.stopPropagation(); onClose(); });

  const minimize = document.createElement("button");
  minimize.className = "tl-btn tl-minimize";
  minimize.setAttribute("aria-label", "Minimize");
  minimize.innerHTML = `<svg class="tl-icon" viewBox="0 0 10 10"><path d="M2 5h6" stroke="rgba(0,0,0,0.55)" stroke-width="1.2" stroke-linecap="round"/></svg>`;

  const maximize = document.createElement("button");
  maximize.className = "tl-btn tl-maximize";
  maximize.setAttribute("aria-label", "Maximize");
  maximize.innerHTML = `<svg class="tl-icon" viewBox="0 0 10 10" style="transform:rotate(90deg)"><path d="M5 2v6M2 5l3-3 3 3" stroke="rgba(0,0,0,0.55)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  maximize.addEventListener("click", (e) => { e.stopPropagation(); onMaximize(); });

  lights.append(close, minimize, maximize);
  container.appendChild(lights);
  return { container, minimizeBtn: minimize };
}

// ── Drag ──
function _makeDraggable(el, handle, appId) {
  let sx = 0, sy = 0, sl = 0, st = 0;
  handle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (_wins.get(appId)?.isMaximized) return;
    sx = e.clientX; sy = e.clientY;
    const { x, y } = _getTx(el);
    sl = x; st = y;
    e.preventDefault();
    _setActive(appId);
    const onMove = (e) => {
      const nx = sl + e.clientX - sx;
      const ny = Math.max(28, st + e.clientY - sy);
      el.style.transform = `translate(${nx}px, ${ny}px)`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  });
}

// ── Maximize ──
function _maximize(el, appId) {
  const state = _wins.get(appId);
  if (!state) return;
  el.style.transition = "width 0.28s ease, height 0.28s ease, transform 0.28s ease";
  if (!state.isMaximized) {
    state.prevTransform = el.style.transform;
    state.prevW = el.style.width;
    state.prevH = el.style.height;
    el.style.transform = "translate(0px, 28px)";
    el.style.width     = "100vw";
    el.style.height    = "calc(100vh - 28px)";
    state.isMaximized  = true;
    _hideDock();
  } else {
    el.style.transform = state.prevTransform;
    el.style.width     = state.prevW;
    el.style.height    = state.prevH;
    state.isMaximized  = false;
    _showDock();
  }
  setTimeout(() => { el.style.transition = ""; }, 300);
}

// ── createWindow ──
function createWindow(cfg) {
  // Already open and not minimized → focus
  if (_wins.has(cfg.appId)) {
    const state = _wins.get(cfg.appId);
    if (state.isMinimized) {
      _restore(state.el, cfg.appId);
    } else {
      _setActive(cfg.appId);
    }
    return;
  }

  const area = document.getElementById("windows-area");
  if (!area) { console.error("No #windows-area"); return; }

  // Centred spawn with small random offset
  const rx = (Math.random() - 0.5) * 160;
  const ry = (Math.random() - 0.5) * 60;
  const tx = window.innerWidth  / 2 - cfg.width  / 2 + rx;
  const ty = Math.max(48, window.innerHeight / 2 - cfg.height / 2 + ry);

  const win = document.createElement("section");
  win.className     = "app-window";
  win.dataset.appId = cfg.appId;
  win.style.cssText = `width:${cfg.width}px;height:${cfg.height}px;position:absolute;`;

  const state = {
    el: win, isMaximized: false, isMinimized: false, isAnimating: false,
    prevTransform: "", prevW: "", prevH: "", zIndex: 0,
    savedTx: tx, savedTy: ty,
  };
  _wins.set(cfg.appId, state);

  function closeApp() {
    if (state.isMinimized) {
      _restore(win, cfg.appId);
      setTimeout(closeApp, 460);
      return;
    }
    if (state.isAnimating) return;
    const { x, y } = _getTx(win);
    win.style.transition = "opacity 0.15s ease, transform 0.15s ease";
    win.style.opacity    = "0";
    win.style.transform  = `translate(${x}px,${y}px) scale(0.93)`;
    setTimeout(() => {
      win.remove();
      _wins.delete(cfg.appId);
      _removeBadge(cfg.appId);
    }, 170);
  }

  // Traffic lights
  const { container: tlEl, minimizeBtn } = _buildTL(
    cfg.appId, closeApp, () => _maximize(win, cfg.appId)
  );
  minimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    _minimize(win, cfg.appId);
  });
  win.appendChild(tlEl);

  // Drag handle
  const handle = document.createElement("div");
  handle.className = "app-window-drag-handle";
  win.appendChild(handle);

  // App content
  const content = cfg.content({ el: win, close: closeApp });
  win.appendChild(content);

  win.addEventListener("mousedown", () => _setActive(cfg.appId));
  _makeDraggable(win, handle, cfg.appId);

  // Wire dock click → restore
  const dockBtn = document.querySelector(`#dock .dock-item[data-id="${cfg.appId}"]`);
  if (dockBtn) {
    dockBtn.addEventListener("click", (e) => {
      const s = _wins.get(cfg.appId);
      if (s?.isMinimized) {
        e.stopImmediatePropagation();
        _restore(win, cfg.appId);
      }
    }, true);
  }

  // ── Open animation: pop from dock ──
  const dock = _dockCentre(cfg.appId);
  const winCx = tx + cfg.width  / 2;
  const winCy = ty + cfg.height / 2;
  const area_r = area.getBoundingClientRect();
  // Dock position relative to window's final translate
  const odx = (dock.x - area_r.left) - winCx;
  const ody = (dock.y - area_r.top)  - winCy;

  win.style.opacity         = "0";
  win.style.transformOrigin = "center center";
  win.style.transform       = `translate(${tx + odx * 0.5}px, ${ty + ody * 0.5}px) scale(0.55)`;

  area.appendChild(win);

  requestAnimationFrame(() => {
    win.style.transition = "opacity 0.22s ease, transform 0.30s cubic-bezier(0.34,1.45,0.64,1)";
    win.style.opacity    = "1";
    win.style.transform  = `translate(${tx}px, ${ty}px) scale(1)`;
    setTimeout(() => {
      win.style.transition    = "";
      win.style.transformOrigin = "";
    }, 330);
    _setActive(cfg.appId);
  });
}

window.__createWindow = createWindow;
