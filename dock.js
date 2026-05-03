"use strict";
// ============================================================
//  macOS Tahoe Web Emulator — dock.ts
// ============================================================
const DOCK_ICONS = [
    { id: "finder", label: "Finder", src: "icons/finder.png", emoji: "🔵", running: true },
    { id: "launchpad", label: "Launchpad", src: "icons/launchpad.png", emoji: "🚀", running: false },
    { id: "settings", label: "System Settings", src: "icons/settings.png", emoji: "⚙️", running: false },
    { id: "safari", label: "Safari", src: "icons/safari.png", emoji: "🧭", running: false },
    { id: "messages", label: "Messages", src: "icons/messages.png", emoji: "💬", running: true },
    { id: "calendar", label: "Calendar", src: "icons/calendar.png", emoji: "📅", running: false },
    { id: "photos", label: "Photos", src: "icons/photos.png", emoji: "🌅", running: false },
    { id: "reminders", label: "Reminders", src: "icons/reminders.png", emoji: "✅", running: false },
    { id: "notes", label: "Notes", src: "icons/notes.png", emoji: "📝", running: false },
    { id: "music", label: "Music", src: "icons/music.png", emoji: "🎵", running: false },
    { id: "appstore", label: "App Store", src: "icons/appstore.png", emoji: "🅰️", running: false },
    { id: "_sep1", label: "", src: "", emoji: "", running: false, separator: true },
    { id: "notion", label: "Notion", src: "icons/notion.png", emoji: "N", running: false },
    { id: "craft", label: "Craft", src: "icons/craft.png", emoji: "✏️", running: false },
    { id: "_sep2", label: "", src: "", emoji: "", running: false, separator: true },
    { id: "trash", label: "Trash", src: "icons/trash.png", emoji: "🗑️", running: false },
];
// ── Spring magnification constants (from friend's Svelte source) ──
const BASE_WIDTH = 57.6;
const DIST_LIMIT = BASE_WIDTH * 6;
const DIST_INPUT = [-DIST_LIMIT, -DIST_LIMIT / 1.25, -DIST_LIMIT / 2, 0, DIST_LIMIT / 2, DIST_LIMIT / 1.25, DIST_LIMIT];
const WIDTH_OUT = [BASE_WIDTH, BASE_WIDTH * 1.1, BASE_WIDTH * 1.414, BASE_WIDTH * 2, BASE_WIDTH * 1.414, BASE_WIDTH * 1.1, BASE_WIDTH];
const DAMPING = 0.47;
const STIFFNESS = 0.12;
let mouseX = null;
const iconStates = [];
const dock = document.getElementById("dock");
function lerp(a, b, t) { return a + (b - a) * t; }
function piecewiseInterp(x) {
    if (x <= DIST_INPUT[0])
        return WIDTH_OUT[0];
    if (x >= DIST_INPUT[DIST_INPUT.length - 1])
        return WIDTH_OUT[WIDTH_OUT.length - 1];
    for (let i = 0; i < DIST_INPUT.length - 1; i++) {
        if (x >= DIST_INPUT[i] && x <= DIST_INPUT[i + 1]) {
            const t = (x - DIST_INPUT[i]) / (DIST_INPUT[i + 1] - DIST_INPUT[i]);
            return lerp(WIDTH_OUT[i], WIDTH_OUT[i + 1], t);
        }
    }
    return WIDTH_OUT[0];
}
function tickSpring(s) {
    const force = -STIFFNESS * (s.value - s.target);
    s.velocity = (s.velocity + force) * (1 - DAMPING);
    s.value += s.velocity;
    return Math.abs(s.velocity) < 0.01 && Math.abs(s.value - s.target) < 0.1;
}
function animateIcon(state) {
    let target = BASE_WIDTH;
    if (mouseX !== null) {
        const rect = state.imgEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        target = piecewiseInterp(mouseX - cx);
    }
    state.spring.target = target;
    const settled = tickSpring(state.spring);
    state.imgEl.style.width = state.spring.value + "px";
    if (!settled)
        state.raf = requestAnimationFrame(() => animateIcon(state));
}
function scheduleAll() {
    iconStates.forEach(s => { cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(() => animateIcon(s)); });
}
function resetAll() {
    mouseX = null;
    iconStates.forEach(s => { s.spring.target = BASE_WIDTH; s.raf = requestAnimationFrame(() => animateIcon(s)); });
}
// ── Build ──
function buildDock() {
    dock.innerHTML = "";
    iconStates.length = 0;
    DOCK_ICONS.forEach((icon) => {
        if (icon.separator) {
            const sep = document.createElement("div");
            sep.className = "dock-separator";
            dock.appendChild(sep);
            return;
        }
        const wrap = document.createElement("button");
        wrap.className = "dock-item" + (icon.running ? " running" : "");
        wrap.dataset.id = icon.id;
        const tooltip = document.createElement("p");
        tooltip.className = "dock-label";
        tooltip.textContent = icon.label;
        const img = new Image();
        img.alt = icon.label;
        img.draggable = false;
        img.style.width = BASE_WIDTH + "px";
        img.style.height = "auto";
        const state = { wrap, imgEl: img, spring: { value: BASE_WIDTH, target: BASE_WIDTH, velocity: 0 }, raf: 0 };
        img.onerror = () => {
            const em = document.createElement("div");
            em.className = "dock-icon-emoji";
            em.textContent = icon.emoji;
            em.style.width = em.style.height = BASE_WIDTH + "px";
            em.style.fontSize = Math.round(BASE_WIDTH * 0.52) + "px";
            img.replaceWith(em);
            state.imgEl = em;
        };
        img.src = icon.src;
        const dot = document.createElement("div");
        dot.className = "dock-dot";
        wrap.append(tooltip, img, dot);
        wrap.addEventListener("click", () => {
            if (wrap.classList.contains("bouncing"))
                return;
            wrap.classList.add("bouncing", "running");
            wrap.addEventListener("animationend", () => wrap.classList.remove("bouncing"), { once: true });
            if (icon.id === "trash" && typeof window.openTrashWindow === "function") {
                window.openTrashWindow();
            }
            if (icon.id === "notes" && typeof window.openNotesWindow === "function") {
                window.openNotesWindow();
            }
        });
        dock.appendChild(wrap);
        iconStates.push(state);
    });
}
dock.addEventListener("mouseenter", (e) => { mouseX = e.clientX; scheduleAll(); });
dock.addEventListener("mousemove", (e) => { mouseX = e.clientX; scheduleAll(); });
dock.addEventListener("mouseleave", () => resetAll());
dock.addEventListener("dragover", (e) => e.preventDefault());
dock.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file?.type.startsWith("image/"))
        return;
    DOCK_ICONS.splice(DOCK_ICONS.length - 3, 0, {
        id: "custom_" + Date.now(), label: file.name.replace(/\.[^.]+$/, ""),
        src: URL.createObjectURL(file), emoji: "📦", running: false,
    });
    buildDock();
});
// ── Calendar ──
function buildCalendar() {
    const el = document.getElementById("calendarWidget");
    if (!el)
        return;
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth(), td = now.getDate();
    const MN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const fd = new Date(y, mo, 1).getDay();
    const dim = new Date(y, mo + 1, 0).getDate();
    const prv = new Date(y, mo, 0).getDate();
    let h = `<div class="cal-header">${MN[mo]}</div><div class="cal-grid">`;
    ["S", "M", "T", "W", "T", "F", "S"].forEach(d => { h += `<div class="cal-dow">${d}</div>`; });
    for (let i = 0; i < fd; i++)
        h += `<div class="cal-day other-month">${prv - fd + i + 1}</div>`;
    for (let d = 1; d <= dim; d++)
        h += `<div class="cal-day${d === td ? " today" : ""}">${d}</div>`;
    const tail = (fd + dim) % 7;
    if (tail > 0)
        for (let i = 1; i <= 7 - tail; i++)
            h += `<div class="cal-day other-month">${i}</div>`;
    el.innerHTML = h + "</div>";
}
// ── Wallpaper ──
(function () {
    const wl = document.getElementById("wallpaperLayer");
    const p = new Image();
    p.onload = () => { wl.style.backgroundImage = "url(wallpaper.jpg)"; };
    p.onerror = () => { wl.style.background = "linear-gradient(155deg,#061224 0%,#0b2545 20%,#0e3d6e 40%,#1a5a8a 58%,#2c7bb0 72%,#4da0c8 84%,#89c8d8 93%,#d0ecd8 100%)"; };
    p.src = "wallpaper.jpg?" + Date.now();
})();
// ── Init ──
buildDock();
buildCalendar();
const msToMid = () => { const n = new Date(); return (86400 - n.getHours() * 3600 - n.getMinutes() * 60 - n.getSeconds()) * 1000; };
setTimeout(() => { buildCalendar(); setInterval(buildCalendar, 86400000); }, msToMid());
