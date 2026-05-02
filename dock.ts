// ============================================================
//  macOS Tahoe Web Emulator — dock.ts  (compiled inline as JS)
//  Full magnification physics, spring animation, all interactions
// ============================================================

// ── Icon definitions — replace src with your uploaded PNG paths ──
const DOCK_ICONS: DockIcon[] = [
  { id: "finder",       label: "Finder",          src: "icons/finder.png",       emoji: "🔵", running: true  },
  { id: "launchpad",    label: "Launchpad",        src: "icons/launchpad.png",    emoji: "🚀", running: false },
  { id: "settings",     label: "System Settings",  src: "icons/settings.png",     emoji: "⚙️", running: false },
  { id: "safari",       label: "Safari",           src: "icons/safari.png",       emoji: "🧭", running: false },
  { id: "messages",     label: "Messages",         src: "icons/messages.png",     emoji: "💬", running: true  },
  { id: "calendar",     label: "Calendar",         src: "icons/calendar.png",     emoji: "📅", running: false },
  { id: "photos",       label: "Photos",           src: "icons/photos.png",       emoji: "🌅", running: false },
  { id: "photoshop",    label: "Photoshop",        src: "icons/photoshop.png",    emoji: "Ps", running: true  },
  { id: "lightroom",    label: "Lightroom",        src: "icons/lightroom.png",    emoji: "Lr", running: false },
  { id: "reminders",    label: "Reminders",        src: "icons/reminders.png",    emoji: "✅", running: false },
  { id: "notes",        label: "Notes",            src: "icons/notes.png",        emoji: "📝", running: false },
  { id: "music",        label: "Music",            src: "icons/music.png",        emoji: "🎵", running: false },
  { id: "appstore",     label: "App Store",        src: "icons/appstore.png",     emoji: "🅰️", running: false },
  // separator
  { id: "_sep1", label: "", src: "", emoji: "", running: false, separator: true },
  { id: "notion",       label: "Notion",           src: "icons/notion.png",       emoji: "N",  running: false },
  { id: "bezel",        label: "Bezel",            src: "icons/bezel.png",        emoji: "📱", running: false },
  { id: "craft",        label: "Craft",            src: "icons/craft.png",        emoji: "✏️", running: false },
  { id: "klack",        label: "Klack",            src: "icons/klack.png",        emoji: "⌨️", running: false },
  { id: "permute",      label: "Permute",          src: "icons/permute.png",      emoji: "🔄", running: false },
  { id: "reeder",       label: "Reeder",           src: "icons/reeder.png",       emoji: "📰", running: false },
  // separator
  { id: "_sep2", label: "", src: "", emoji: "", running: false, separator: true },
  { id: "trash",        label: "Trash",            src: "icons/trash.png",        emoji: "🗑️", running: false },
];

interface DockIcon {
  id: string;
  label: string;
  src: string;
  emoji: string;
  running: boolean;
  separator?: boolean;
}

// ── Magnification constants ──
const ICON_BASE   = 60;   // px — resting size
const ICON_MAX    = 96;   // px — max magnified size
const MAG_RADIUS  = 130;  // px — influence radius each side

// ── State ──
let mouseX = -9999;
let dockRect: DOMRect | null = null;

const dock = document.getElementById("dock")!;

// ─────────────────────────────────────────────
//  Build Dock
// ─────────────────────────────────────────────
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

    // Label tooltip
    const label = document.createElement("span");
    label.className = "dock-label";
    label.textContent = icon.label;

    // Icon element — try image first, fall back to emoji
    const img = document.createElement("img") as HTMLImageElement;
    img.className = "dock-icon";
    img.alt = icon.label;
    img.draggable = false;
    img.style.width  = ICON_BASE + "px";
    img.style.height = ICON_BASE + "px";

    // Try to load the PNG; on error show emoji fallback
    img.onerror = () => {
      img.replaceWith(makeEmoji(icon.emoji));
    };
    img.src = icon.src;

    // Running dot
    const dot = document.createElement("div");
    dot.className = "dock-dot";

    wrap.appendChild(label);
    wrap.appendChild(img);
    wrap.appendChild(dot);

    // Click → bounce + toggle running
    wrap.addEventListener("click", () => {
      if (wrap.classList.contains("bouncing")) return;
      wrap.classList.add("bouncing", "running");
      wrap.querySelector(".dock-dot")!.setAttribute("style","opacity:1");
      wrap.addEventListener("animationend", () => wrap.classList.remove("bouncing"), { once: true });
    });

    dock.appendChild(wrap);
  });
}

function makeEmoji(emoji: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "dock-icon-emoji";
  el.textContent = emoji;
  el.style.width  = ICON_BASE + "px";
  el.style.height = ICON_BASE + "px";
  el.style.fontSize = Math.round(ICON_BASE * 0.58) + "px";
  return el;
}

// ─────────────────────────────────────────────
//  Magnification Engine
// ─────────────────────────────────────────────
function getIconSize(iconCenterX: number, cursorX: number): number {
  const dist = Math.abs(cursorX - iconCenterX);
  if (dist > MAG_RADIUS) return ICON_BASE;
  // cosine bell curve — smooth Apple-style falloff
  const t = (Math.cos((dist / MAG_RADIUS) * Math.PI) + 1) / 2;
  return ICON_BASE + (ICON_MAX - ICON_BASE) * t;
}

function updateMagnification() {
  if (!dockRect) dockRect = dock.getBoundingClientRect();

  const wraps = dock.querySelectorAll<HTMLElement>(".dock-icon-wrap");

  wraps.forEach((wrap) => {
    const iconEl = wrap.querySelector<HTMLElement>(".dock-icon, .dock-icon-emoji");
    if (!iconEl) return;

    const r = wrap.getBoundingClientRect();
    const centerX = r.left + r.width / 2;

    const size = mouseX < 0 ? ICON_BASE : getIconSize(centerX, mouseX);

    iconEl.style.width  = size + "px";
    iconEl.style.height = size + "px";
    iconEl.style.fontSize = Math.round(size * 0.58) + "px";

    // Subtle upward push proportional to size
    const lift = ((size - ICON_BASE) / (ICON_MAX - ICON_BASE)) * 10;
    iconEl.style.transform = `translateY(-${lift}px)`;
  });
}

// Track mouse over dock
document.addEventListener("mousemove", (e: MouseEvent) => {
  mouseX = e.clientX;
  dockRect = null; // invalidate cache on move
  updateMagnification();
});

// Reset when mouse leaves dock
dock.addEventListener("mouseleave", () => {
  mouseX = -9999;
  const wraps = dock.querySelectorAll<HTMLElement>(".dock-icon-wrap");
  wraps.forEach((wrap) => {
    const iconEl = wrap.querySelector<HTMLElement>(".dock-icon, .dock-icon-emoji");
    if (!iconEl) return;
    iconEl.style.width  = ICON_BASE + "px";
    iconEl.style.height = ICON_BASE + "px";
    iconEl.style.transform = "translateY(0)";
    iconEl.style.fontSize = Math.round(ICON_BASE * 0.58) + "px";
  });
});

// ─────────────────────────────────────────────
//  Wallpaper Upload
// ─────────────────────────────────────────────
const uploadScreen = document.getElementById("wallpaper-upload-screen")!;
const wallpaperLayer = document.getElementById("wallpaperLayer")!;
const uploadZone = document.getElementById("uploadZone")!;
const wallpaperInput = document.getElementById("wallpaperInput") as HTMLInputElement;
const skipBtn = document.getElementById("skipBtn")!;

// Default wallpaper — beautiful macOS Tahoe blue gradient
const DEFAULT_WALLPAPER = `linear-gradient(
  135deg,
  #0a1628 0%,
  #0d2a4a 18%,
  #0e3d6e 35%,
  #1a5a8a 50%,
  #2c7bb0 65%,
  #4da0c8 78%,
  #89c8d8 88%,
  #c8e8d0 95%,
  #e8f4d0 100%
)`;

function applyWallpaper(src: string, isGradient = false) {
  if (isGradient) {
    wallpaperLayer.style.background = src;
  } else {
    wallpaperLayer.style.backgroundImage = `url(${src})`;
  }
  wallpaperLayer.style.opacity = "1";
  uploadScreen.classList.remove("active");
}

uploadZone.addEventListener("click", () => wallpaperInput.click());

wallpaperInput.addEventListener("change", () => {
  const file = wallpaperInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  applyWallpaper(url);
});

// Drag & drop
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  applyWallpaper(URL.createObjectURL(file));
});

skipBtn.addEventListener("click", () => applyWallpaper(DEFAULT_WALLPAPER, true));

// ─────────────────────────────────────────────
//  Menu Bar Clock
// ─────────────────────────────────────────────
function updateClock() {
  const clock = document.getElementById("menuClock");
  if (!clock) return;
  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h % 12) || 12);
  clock.textContent = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}  ${h12}:${m} ${ampm}`;
}
updateClock();
setInterval(updateClock, 10_000);

// ─────────────────────────────────────────────
//  Calendar Widget
// ─────────────────────────────────────────────
function buildCalendar() {
  const el = document.getElementById("calendarWidget");
  if (!el) return;

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
                  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const DAYS   = ["S","M","T","W","T","F","S"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  let html = `<div class="cal-header">${MONTHS[month]}</div>
  <div class="cal-grid">`;

  DAYS.forEach(d => html += `<div class="cal-dow">${d}</div>`);

  // Prev month padding
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day other-month">${daysInPrev - firstDay + i + 1}</div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const cls = d === today ? " today" : "";
    html += `<div class="cal-day${cls}">${d}</div>`;
  }

  // Next month padding
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month">${i}</div>`;
  }

  html += `</div>`;
  el.innerHTML = html;
}

// ─────────────────────────────────────────────
//  Icon upload helper (drop onto dock)
// ─────────────────────────────────────────────
dock.addEventListener("dragover", (e: DragEvent) => e.preventDefault());
dock.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const url = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^.]+$/, "");

  // Add a new icon to the end (before trash/separator)
  const newIcon: DockIcon = {
    id: "custom_" + Date.now(),
    label: name,
    src: url,
    emoji: "📦",
    running: false,
  };
  DOCK_ICONS.splice(DOCK_ICONS.length - 2, 0, newIcon);
  buildDock();
});

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
buildDock();
buildCalendar();

// Refresh calendar at midnight
const msToMidnight = () => {
  const n = new Date();
  return (86400 - n.getHours()*3600 - n.getMinutes()*60 - n.getSeconds()) * 1000;
};
setTimeout(() => { buildCalendar(); setInterval(buildCalendar, 86_400_000); }, msToMidnight());

console.log("%cmacOS Tahoe Web Emulator", "font-size:18px;font-weight:bold;color:#0a84ff;");
console.log("%cDrop icon PNGs onto the dock to add them live!", "color:#30d158;");
