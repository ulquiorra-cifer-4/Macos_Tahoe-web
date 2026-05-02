"use strict";
// ============================================================
//  macOS Tahoe Web Emulator — dock.ts
//  Magnification engine ported 1:1 from friend's Svelte source
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
// ─────────────────────────────────────────────
//  Magnification — exact port from DockItem.svelte
// ─────────────────────────────────────────────
const BASE_WIDTH = 57.6;
const DIST_LIMIT = BASE_WIDTH * 6; // 345.6px — huge radius
const BEYOND = DIST_LIMIT + 1;
// 7-point interpolation table (from friend's source)
const DIST_INPUT = [
    -DIST_LIMIT,
    -DIST_LIMIT / 1.25,
    -DIST_LIMIT / 2,
    0,
    DIST_LIMIT / 2,
    DIST_LIMIT / 1.25,
    DIST_LIMIT,
];
const WIDTH_OUTPUT = [
    BASE_WIDTH,
    BASE_WIDTH * 1.1,
    BASE_WIDTH * 1.414,
    BASE_WIDTH * 2, // 115.2px at cursor center
    BASE_WIDTH * 1.414,
    BASE_WIDTH * 1.1,
    BASE_WIDTH,
];
/** Linear interpolation between two values */
function lerp(a, b, t) {
    return a + (b - a) * t;
}
/** Piecewise linear interpolation — matches popmotion's interpolate() */
function interpolate(distInput, widthOut, x) {
    if (x <= distInput[0])
        return widthOut[0];
    if (x >= distInput[distInput.length - 1])
        return widthOut[widthOut.length - 1];
    for (let i = 0; i < distInput.length - 1; i++) {
        if (x >= distInput[i] && x <= distInput[i + 1]) {
            const t = (x - distInput[i]) / (distInput[i + 1] - distInput[i]);
            return lerp(widthOut[i], widthOut[i + 1], t);
        }
    }
    return widthOut[0];
}
function getTargetWidth(dist) {
    if (Math.abs(dist) > DIST_LIMIT)
        return BASE_WIDTH;
    return interpolate(DIST_INPUT, WIDTH_OUTPUT, dist);
}
function makeSpring(initial) {
    return { value: initial, target: initial, velocity: 0 };
}
const DAMPING = 0.47;
const STIFFNESS = 0.12;
function tickSpring(s) {
    const force = -STIFFNESS * (s.value - s.target);
    s.velocity = (s.velocity + force) * (1 - DAMPING); // svelte spring formula
    s.value += s.velocity;
    // settled when velocity and displacement are tiny
    return Math.abs(s.velocity) < 0.01 && Math.abs(s.value - s.target) < 0.1;
}
const iconStates = [];
let mouseX = null;
// ─────────────────────────────────────────────
//  Animation loop per icon (exact rAF pattern from source)
// ─────────────────────────────────────────────
function animateIcon(state) {
    // Calculate target width from mouse distance
    let target = BASE_WIDTH;
    if (mouseX !== null) {
        const rect = state.imgEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const dist = mouseX - cx;
        target = getTargetWidth(dist);
    }
    state.spring.target = target;
    const settled = tickSpring(state.spring);
    // Apply width (height=auto via CSS, aspect ratio preserved)
    state.imgEl.style.width = state.spring.value + "px";
    if (!settled) {
        state.raf = requestAnimationFrame(() => animateIcon(state));
    }
}
function scheduleAll() {
    iconStates.forEach((state) => {
        cancelAnimationFrame(state.raf);
        state.raf = requestAnimationFrame(() => animateIcon(state));
    });
}
function resetAll() {
    mouseX = null;
    iconStates.forEach((state) => {
        state.spring.target = BASE_WIDTH;
        // let spring animate back
        state.raf = requestAnimationFrame(() => animateIcon(state));
    });
}
// ─────────────────────────────────────────────
//  Build Dock
// ─────────────────────────────────────────────
const dock = document.getElementById("dock");
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
        wrap.setAttribute("aria-label", icon.label);
        wrap.dataset.id = icon.id;
        // Tooltip
        const tooltip = document.createElement("p");
        tooltip.className = "dock-label";
        tooltip.textContent = icon.label;
        // Image — falls back to emoji div on error
        const img = new Image();
        img.alt = icon.label;
        img.draggable = false;
        img.style.width = BASE_WIDTH + "px";
        img.style.height = "auto";
        img.onerror = () => {
            const em = document.createElement("div");
            em.className = "dock-icon-emoji";
            em.textContent = icon.emoji;
            em.style.width = BASE_WIDTH + "px";
            em.style.height = BASE_WIDTH + "px";
            em.style.fontSize = Math.round(BASE_WIDTH * 0.52) + "px";
            img.replaceWith(em);
            state.imgEl = em;
        };
        img.src = icon.src;
        const imgWrap = document.createElement("span");
        imgWrap.appendChild(img);
        // Running dot
        const dot = document.createElement("div");
        dot.className = "dock-dot";
        wrap.appendChild(tooltip);
        wrap.appendChild(imgWrap);
        wrap.appendChild(dot);
        // Bounce on click
        wrap.addEventListener("click", () => {
            if (wrap.classList.contains("bouncing"))
                return;
            wrap.classList.add("bouncing", "running");
            wrap.addEventListener("animationend", () => wrap.classList.remove("bouncing"), { once: true });
        });
        dock.appendChild(wrap);
        const state = {
            wrap,
            imgEl: img,
            spring: makeSpring(BASE_WIDTH),
            raf: 0,
        };
        iconStates.push(state);
    });
}
// ─────────────────────────────────────────────
//  Mouse events — dock only
// ─────────────────────────────────────────────
dock.addEventListener("mouseenter", (e) => {
    mouseX = e.clientX;
    scheduleAll();
});
dock.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    scheduleAll();
});
dock.addEventListener("mouseleave", () => {
    resetAll();
});
// ─────────────────────────────────────────────
//  Wallpaper
// ─────────────────────────────────────────────
const wallpaperLayer = document.getElementById("wallpaperLayer");
(function () {
    const probe = new Image();
    probe.onload = () => { wallpaperLayer.style.backgroundImage = "url(wallpaper.jpg)"; };
    probe.onerror = () => {
        wallpaperLayer.style.background =
            "linear-gradient(155deg,#061224 0%,#0b2545 20%,#0e3d6e 40%,#1a5a8a 58%,#2c7bb0 72%,#4da0c8 84%,#89c8d8 93%,#d0ecd8 100%)";
    };
    probe.src = "wallpaper.jpg?" + Date.now();
})();
// ─────────────────────────────────────────────
//  Clock
// ─────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById("menuClock");
    if (!el)
        return;
    const now = new Date();
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const h = now.getHours(), m = now.getMinutes().toString().padStart(2, "0");
    el.textContent = `${D[now.getDay()]} ${M[now.getMonth()]} ${now.getDate()}  ${(h % 12) || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}
updateClock();
setInterval(updateClock, 10000);
// ─────────────────────────────────────────────
//  Calendar
// ─────────────────────────────────────────────
function buildCalendar() {
    const el = document.getElementById("calendarWidget");
    if (!el)
        return;
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth(), td = now.getDate();
    const MN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
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
// ─────────────────────────────────────────────
//  Drop icon onto dock
// ─────────────────────────────────────────────
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
// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
buildDock();
buildCalendar();
const msToMid = () => { const n = new Date(); return (86400 - n.getHours() * 3600 - n.getMinutes() * 60 - n.getSeconds()) * 1000; };
setTimeout(() => { buildCalendar(); setInterval(buildCalendar, 86400000); }, msToMid());
