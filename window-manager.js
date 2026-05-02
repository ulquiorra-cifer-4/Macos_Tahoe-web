"use strict";
// ============================================================
//  macOS Tahoe — window-manager.ts
//  Ported from Window.svelte + WindowsArea.svelte
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWindow = createWindow;
// ── Global z-index tracker (mirrors WindowsArea.svelte logic) ──
let activeZIndex = 10;
const windowStates = new Map();
function raiseWindow(state) {
    activeZIndex += 2;
    state.zIndex = activeZIndex;
    state.el.style.zIndex = String(state.zIndex);
    // Keep z-indices under 500 (mirrors the <50 guard in WindowsArea)
    const allZ = [...windowStates.values()].map(s => s.zIndex).filter(z => z > 0);
    if (allZ.length && Math.max(...allZ) > 500) {
        const lowest = Math.min(...new Set(allZ));
        activeZIndex -= lowest;
        windowStates.forEach(s => {
            if (s.zIndex >= lowest)
                s.zIndex -= lowest;
            s.el.style.zIndex = String(s.zIndex);
        });
    }
}
// ── Active window tracking ──
let activeAppId = null;
function setActive(appId) {
    // Unfocus all
    windowStates.forEach((s, id) => {
        s.el.classList.toggle("active", id === appId);
        s.el.querySelector(".tl-container")
            ?.classList.toggle("unfocused", id !== appId);
    });
    activeAppId = appId;
    const s = windowStates.get(appId);
    if (s)
        raiseWindow(s);
}
// ─────────────────────────────────────────────
//  Traffic Lights
// ─────────────────────────────────────────────
function buildTrafficLights(appId, onClose, onMaximize) {
    const container = document.createElement("div");
    container.className = "tl-container";
    const lights = document.createElement("div");
    lights.className = "tl-lights";
    // Close — red
    const close = document.createElement("button");
    close.className = "tl-btn tl-close";
    close.setAttribute("aria-label", "Close");
    close.innerHTML = `<svg viewBox="0 0 10 10" class="tl-icon"><path d="M3 3l4 4M7 3L3 7" stroke="rgba(0,0,0,0.5)" stroke-width="1.1" stroke-linecap="round"/></svg>`;
    close.addEventListener("click", (e) => { e.stopPropagation(); onClose(); });
    // Minimize — yellow
    const minimize = document.createElement("button");
    minimize.className = "tl-btn tl-minimize";
    minimize.setAttribute("aria-label", "Minimize");
    minimize.innerHTML = `<svg viewBox="0 0 10 10" class="tl-icon"><path d="M2 5h6" stroke="rgba(0,0,0,0.5)" stroke-width="1.1" stroke-linecap="round"/></svg>`;
    minimize.addEventListener("click", (e) => { e.stopPropagation(); /* minimize later */ });
    // Maximize — green
    const maximize = document.createElement("button");
    maximize.className = "tl-btn tl-maximize";
    maximize.setAttribute("aria-label", "Maximize");
    maximize.innerHTML = `<svg viewBox="0 0 10 10" class="tl-icon" style="transform:rotate(90deg)"><path d="M2 5h6M5 2l3 3-3 3" stroke="rgba(0,0,0,0.5)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    maximize.addEventListener("click", (e) => { e.stopPropagation(); onMaximize(); });
    lights.append(close, minimize, maximize);
    container.appendChild(lights);
    return container;
}
// ─────────────────────────────────────────────
//  Dragging (mirrors @neodrag bounds + handle)
// ─────────────────────────────────────────────
function makeDraggable(el, handle, appId) {
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let dragging = false;
    handle.addEventListener("mousedown", (e) => {
        if (e.button !== 0)
            return;
        const state = windowStates.get(appId);
        if (state?.isMaximized)
            return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = el.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        setActive(appId);
        e.preventDefault();
    });
    function onMove(e) {
        if (!dragging)
            return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // Bounds: top >= 28px (menu bar height)
        const newTop = Math.max(28, startTop + dy);
        const newLeft = startLeft + dx;
        el.style.transform = `translate(${newLeft}px, ${newTop}px)`;
    }
    function onUp() {
        dragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
    }
}
// ─────────────────────────────────────────────
//  Maximize / Restore (mirrors maximizeApp())
// ─────────────────────────────────────────────
function makeMaximize(el, appId, w, h) {
    const state = windowStates.get(appId);
    if (!state.isMaximized) {
        state.prevTransform = el.style.transform;
        state.prevW = el.style.width;
        state.prevH = el.style.height;
        el.style.transition = "width 0.3s ease, height 0.3s ease, transform 0.3s ease";
        el.style.transform = "translate(0px, 28px)";
        el.style.width = "100vw";
        el.style.height = "calc(100vh - 28px)";
        state.isMaximized = true;
    }
    else {
        el.style.transition = "width 0.3s ease, height 0.3s ease, transform 0.3s ease";
        el.style.transform = state.prevTransform;
        el.style.width = state.prevW;
        el.style.height = state.prevH;
        state.isMaximized = false;
    }
    setTimeout(() => { el.style.transition = ""; }, 320);
}
// ─────────────────────────────────────────────
//  Create Window  (main export)
// ─────────────────────────────────────────────
function createWindow(cfg) {
    // Don't double-open
    if (windowStates.has(cfg.appId)) {
        setActive(cfg.appId);
        return;
    }
    const area = document.getElementById("windows-area");
    // Random start position — mirrors rand_int(-600,600) in Window.svelte
    const randX = (Math.random() - 0.5) * 300;
    const randY = (Math.random() - 0.5) * 100;
    const startX = window.innerWidth / 2 - cfg.width / 2 + randX;
    const startY = window.innerHeight / 2 - cfg.height / 2 + randY;
    const clampedY = Math.max(28, startY);
    // Window element
    const win = document.createElement("section");
    win.className = "app-window active";
    win.dataset.appId = cfg.appId;
    win.style.width = cfg.width + "px";
    win.style.height = cfg.height + "px";
    win.style.transform = `translate(${startX}px, ${clampedY}px)`;
    // State entry
    const state = {
        el: win, isMaximized: false,
        prevTransform: "", prevW: "", prevH: "",
        zIndex: 0, isDragging: false,
    };
    windowStates.set(cfg.appId, state);
    // Close handler
    function closeApp() {
        win.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        win.style.opacity = "0";
        win.style.transform += " scale(0.96)";
        setTimeout(() => {
            win.remove();
            windowStates.delete(cfg.appId);
        }, 220);
    }
    // Traffic lights
    const tl = buildTrafficLights(cfg.appId, closeApp, () => makeMaximize(win, cfg.appId, cfg.width, cfg.height));
    win.appendChild(tl);
    // Drag handle — the title bar area
    const dragHandle = document.createElement("div");
    dragHandle.className = "app-window-drag-handle";
    win.appendChild(dragHandle);
    // App content
    const content = cfg.content({ el: win, close: closeApp });
    win.appendChild(content);
    // Focus on click
    win.addEventListener("mousedown", () => setActive(cfg.appId));
    // Drag
    makeDraggable(win, dragHandle, cfg.appId);
    // Open animation
    win.style.opacity = "0";
    win.style.transform = `translate(${startX}px, ${clampedY}px) scale(0.94)`;
    area.appendChild(win);
    requestAnimationFrame(() => {
        win.style.transition = "opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)";
        win.style.opacity = "1";
        win.style.transform = `translate(${startX}px, ${clampedY}px) scale(1)`;
        setTimeout(() => { win.style.transition = ""; }, 240);
    });
    setActive(cfg.appId);
}
// ── Expose to global scope for plain JS usage ──
window.__createWindow = createWindow;
