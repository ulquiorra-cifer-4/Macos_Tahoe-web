"use strict";
// ============================================================
//  macOS Tahoe Web Emulator — dock.ts
// ============================================================
// ── Cleaned icon list ──
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
const ICON_BASE = 60;
const ICON_MAX = 96;
const MAG_RADIUS = 120;
let mouseX = -9999;
let isOverDock = false;
const dock = document.getElementById("dock");
// ── Build ──
function buildDock() {
    dock.innerHTML = "";
    DOCK_ICONS.forEach((icon) => {
        if (icon.separator) {
            const sep = document.createElement("div");
            sep.className = "dock-separator";
            dock.appendChild(sep);
            return;
        }
        const wrap = document.createElement("div");
        wrap.className = "dock-icon-wrap" + (icon.running ? " running" : "");
        wrap.dataset.id = icon.id;
        const label = document.createElement("span");
        label.className = "dock-label";
        label.textContent = icon.label;
        const img = new Image();
        img.className = "dock-icon";
        img.alt = icon.label;
        img.draggable = false;
        applySize(img, ICON_BASE);
        img.onerror = () => img.replaceWith(makeEmoji(icon.emoji, ICON_BASE));
        img.src = icon.src;
        const dot = document.createElement("div");
        dot.className = "dock-dot";
        wrap.appendChild(label);
        wrap.appendChild(img);
        wrap.appendChild(dot);
        wrap.addEventListener("click", () => {
            if (wrap.classList.contains("bouncing"))
                return;
            wrap.classList.add("bouncing", "running");
            wrap.addEventListener("animationend", () => wrap.classList.remove("bouncing"), { once: true });
        });
        dock.appendChild(wrap);
    });
}
function makeEmoji(emoji, size) {
    const el = document.createElement("div");
    el.className = "dock-icon-emoji";
    applySize(el, size);
    el.style.fontSize = Math.round(size * 0.55) + "px";
    el.textContent = emoji;
    return el;
}
function applySize(el, size) {
    el.style.width = size + "px";
    el.style.height = size + "px";
}
// ── Magnification — ONLY when cursor is over the dock ──
function getSize(centerX) {
    const dist = Math.abs(mouseX - centerX);
    if (dist >= MAG_RADIUS)
        return ICON_BASE;
    const t = (Math.cos((dist / MAG_RADIUS) * Math.PI) + 1) / 2;
    return ICON_BASE + (ICON_MAX - ICON_BASE) * t;
}
function applyMag() {
    dock.querySelectorAll(".dock-icon-wrap").forEach((wrap) => {
        const el = wrap.querySelector(".dock-icon, .dock-icon-emoji");
        if (!el)
            return;
        const r = wrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const size = isOverDock ? getSize(cx) : ICON_BASE;
        applySize(el, size);
        el.style.fontSize = Math.round(size * 0.55) + "px";
        const lift = ((size - ICON_BASE) / (ICON_MAX - ICON_BASE)) * 14;
        el.style.transform = `translateY(-${lift}px)`;
    });
}
function resetMag() {
    dock.querySelectorAll(".dock-icon-wrap").forEach((wrap) => {
        const el = wrap.querySelector(".dock-icon, .dock-icon-emoji");
        if (!el)
            return;
        applySize(el, ICON_BASE);
        el.style.fontSize = Math.round(ICON_BASE * 0.55) + "px";
        el.style.transform = "translateY(0)";
    });
}
// Only listen on the dock — not on the whole document
dock.addEventListener("mouseenter", (e) => {
    isOverDock = true;
    mouseX = e.clientX;
    applyMag();
});
dock.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    applyMag();
});
dock.addEventListener("mouseleave", () => {
    isOverDock = false;
    mouseX = -9999;
    resetMag();
});
// ── Wallpaper — auto-load wallpaper.jpg ──
const wallpaperLayer = document.getElementById("wallpaperLayer");
(function loadWallpaper() {
    const probe = new Image();
    probe.onload = () => {
        wallpaperLayer.style.backgroundImage = "url(wallpaper.jpg)";
    };
    probe.onerror = () => {
        wallpaperLayer.style.background = "linear-gradient(155deg,#061224 0%,#0b2545 20%,#0e3d6e 40%,#1a5a8a 58%,#2c7bb0 72%,#4da0c8 84%,#89c8d8 93%,#d0ecd8 100%)";
    };
    probe.src = "wallpaper.jpg?" + Date.now();
})();
// ── Clock ──
function updateClock() {
    const el = document.getElementById("menuClock");
    if (!el)
        return;
    const now = new Date();
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    el.textContent = `${D[now.getDay()]} ${M[now.getMonth()]} ${now.getDate()}  ${(h % 12) || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}
updateClock();
setInterval(updateClock, 10000);
// ── Calendar ──
function buildCalendar() {
    const el = document.getElementById("calendarWidget");
    if (!el)
        return;
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth(), td = now.getDate();
    const MN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const firstDay = new Date(y, mo, 1).getDay();
    const dim = new Date(y, mo + 1, 0).getDate();
    const prev = new Date(y, mo, 0).getDate();
    let h = `<div class="cal-header">${MN[mo]}</div><div class="cal-grid">`;
    ["S", "M", "T", "W", "T", "F", "S"].forEach(d => { h += `<div class="cal-dow">${d}</div>`; });
    for (let i = 0; i < firstDay; i++)
        h += `<div class="cal-day other-month">${prev - firstDay + i + 1}</div>`;
    for (let d = 1; d <= dim; d++)
        h += `<div class="cal-day${d === td ? " today" : ""}">${d}</div>`;
    const tail = (firstDay + dim) % 7;
    if (tail > 0)
        for (let i = 1; i <= 7 - tail; i++)
            h += `<div class="cal-day other-month">${i}</div>`;
    el.innerHTML = h + "</div>";
}
// ── Drop icon onto dock ──
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
// ── Init ──
buildDock();
buildCalendar();
const msToMidnight = () => { const n = new Date(); return (86400 - n.getHours() * 3600 - n.getMinutes() * 60 - n.getSeconds()) * 1000; };
setTimeout(() => { buildCalendar(); setInterval(buildCalendar, 86400000); }, msToMidnight());
