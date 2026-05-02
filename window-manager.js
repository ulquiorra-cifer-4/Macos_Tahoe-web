"use strict";
// ============================================================
//  macOS Tahoe — window-manager.ts  (no module exports)
//  Ported from Window.svelte + WindowsArea.svelte
// ============================================================
// ── z-index tracker ──
let _activeZ = 10;
const _wins = new Map();
let _activeId = null;
function _raise(state) {
    _activeZ += 2;
    state.zIndex = _activeZ;
    state.el.style.zIndex = String(state.zIndex);
    const allZ = [..._wins.values()].map(s => s.zIndex).filter(z => z > 0);
    if (allZ.length && Math.max(...allZ) > 500) {
        const lowest = Math.min(...[...new Set(allZ)]);
        _activeZ -= lowest;
        _wins.forEach(s => {
            if (s.zIndex >= lowest)
                s.zIndex -= lowest;
            s.el.style.zIndex = String(s.zIndex);
        });
    }
}
function _setActive(appId) {
    _wins.forEach((s, id) => {
        s.el.classList.toggle("active", id === appId);
        const tl = s.el.querySelector(".tl-lights");
        if (tl)
            tl.dataset.focused = id === appId ? "true" : "false";
        const tlContainer = s.el.querySelector(".tl-container");
        if (tlContainer)
            tlContainer.classList.toggle("unfocused", id !== appId);
    });
    _activeId = appId;
    const s = _wins.get(appId);
    if (s)
        _raise(s);
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
    return container;
}
// ── Drag ──
function _makeDraggable(el, handle, appId) {
    let sx = 0, sy = 0, sl = 0, st = 0;
    handle.addEventListener("mousedown", (e) => {
        if (e.button !== 0)
            return;
        if (_wins.get(appId)?.isMaximized)
            return;
        sx = e.clientX;
        sy = e.clientY;
        // Parse current translate
        const m = el.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        sl = m ? parseFloat(m[1]) : 0;
        st = m ? parseFloat(m[2]) : 0;
        e.preventDefault();
        _setActive(appId);
        const onMove = (e) => {
            const nx = sl + e.clientX - sx;
            const ny = Math.max(28, st + e.clientY - sy);
            el.style.transform = `translate(${nx}px, ${ny}px)`;
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });
}
// ── Dock hide/show ──
function _hideDock() {
    const dc = document.getElementById("dockContainer");
    if (!dc)
        return;
    dc.style.transition = "transform 0.32s cubic-bezier(0.4,0,0.2,1)";
    dc.style.transform = "translateY(120%)";
}
function _showDock() {
    const dc = document.getElementById("dockContainer");
    if (!dc)
        return;
    dc.style.transition = "transform 0.38s cubic-bezier(0.34,1.4,0.64,1)";
    dc.style.transform = "translateY(0%)";
}
// ── Maximize ──
function _maximize(el, appId, w, h) {
    const state = _wins.get(appId);
    el.style.transition = "width 0.3s ease, height 0.3s ease, transform 0.3s ease";
    if (!state.isMaximized) {
        state.prevTransform = el.style.transform;
        state.prevW = el.style.width;
        state.prevH = el.style.height;
        el.style.transform = "translate(0px, 28px)";
        el.style.width = "100vw";
        el.style.height = "calc(100vh - 28px)";
        state.isMaximized = true;
        _hideDock();
    }
    else {
        el.style.transform = state.prevTransform;
        el.style.width = state.prevW;
        el.style.height = state.prevH;
        state.isMaximized = false;
        _showDock();
    }
    setTimeout(() => { el.style.transition = ""; }, 320);
}
// ── Main: createWindow ──
function createWindow(cfg) {
    // Bring to front if already open
    if (_wins.has(cfg.appId)) {
        _setActive(cfg.appId);
        return;
    }
    const area = document.getElementById("windows-area");
    if (!area) {
        console.error("No #windows-area found");
        return;
    }
    const rx = (Math.random() - 0.5) * 200;
    const ry = (Math.random() - 0.5) * 80;
    const sx = window.innerWidth / 2 - cfg.width / 2 + rx;
    const sy = Math.max(48, window.innerHeight / 2 - cfg.height / 2 + ry);
    const win = document.createElement("section");
    win.className = "app-window";
    win.dataset.appId = cfg.appId;
    win.style.width = cfg.width + "px";
    win.style.height = cfg.height + "px";
    win.style.position = "absolute";
    const state = {
        el: win, isMaximized: false,
        prevTransform: "", prevW: "", prevH: "", zIndex: 0,
    };
    _wins.set(cfg.appId, state);
    function closeApp() {
        win.style.transition = "opacity 0.18s ease, transform 0.18s ease";
        win.style.opacity = "0";
        const m = win.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (m)
            win.style.transform = `translate(${m[1]}px, ${m[2]}px) scale(0.95)`;
        setTimeout(() => { win.remove(); _wins.delete(cfg.appId); }, 200);
    }
    // Traffic lights
    const tl = _buildTL(cfg.appId, closeApp, () => _maximize(win, cfg.appId, cfg.width, cfg.height));
    win.appendChild(tl);
    // Drag handle
    const handle = document.createElement("div");
    handle.className = "app-window-drag-handle";
    win.appendChild(handle);
    // App content
    const content = cfg.content({ el: win, close: closeApp });
    win.appendChild(content);
    win.addEventListener("mousedown", () => _setActive(cfg.appId));
    _makeDraggable(win, handle, cfg.appId);
    // Open animation
    win.style.opacity = "0";
    win.style.transform = `translate(${sx}px, ${sy}px) scale(0.94)`;
    area.appendChild(win);
    requestAnimationFrame(() => {
        win.style.transition = "opacity 0.22s ease, transform 0.25s cubic-bezier(0.34,1.4,0.64,1)";
        win.style.opacity = "1";
        win.style.transform = `translate(${sx}px, ${sy}px) scale(1)`;
        setTimeout(() => { win.style.transition = ""; }, 280);
        _setActive(cfg.appId);
    });
}
// Expose globally — no module system needed
window.__createWindow = createWindow;
