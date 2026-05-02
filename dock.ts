// ============================================================
//  macOS Tahoe Web Emulator — dock.ts
//  Real macOS dock: icons grow UP, pill only expands sideways
// ============================================================

interface DockIcon {
  id: string;
  label: string;
  src: string;
  emoji: string;
  running: boolean;
  separator?: boolean;
}

const DOCK_ICONS: DockIcon[] = [
  { id: "finder",    label: "Finder",          src: "icons/finder.png",    emoji: "🔵", running: true  },
  { id: "launchpad", label: "Launchpad",        src: "icons/launchpad.png", emoji: "🚀", running: false },
  { id: "settings",  label: "System Settings",  src: "icons/settings.png",  emoji: "⚙️", running: false },
  { id: "safari",    label: "Safari",           src: "icons/safari.png",    emoji: "🧭", running: false },
  { id: "messages",  label: "Messages",         src: "icons/messages.png",  emoji: "💬", running: true  },
  { id: "calendar",  label: "Calendar",         src: "icons/calendar.png",  emoji: "📅", running: false },
  { id: "photos",    label: "Photos",           src: "icons/photos.png",    emoji: "🌅", running: false },
  { id: "reminders", label: "Reminders",        src: "icons/reminders.png", emoji: "✅", running: false },
  { id: "notes",     label: "Notes",            src: "icons/notes.png",     emoji: "📝", running: false },
  { id: "music",     label: "Music",            src: "icons/music.png",     emoji: "🎵", running: false },
  { id: "appstore",  label: "App Store",        src: "icons/appstore.png",  emoji: "🅰️", running: false },
  { id: "_sep1",     label: "", src: "", emoji: "", running: false, separator: true },
  { id: "notion",    label: "Notion",           src: "icons/notion.png",    emoji: "N",  running: false },
  { id: "craft",     label: "Craft",            src: "icons/craft.png",     emoji: "✏️", running: false },
  { id: "_sep2",     label: "", src: "", emoji: "", running: false, separator: true },
  { id: "trash",     label: "Trash",            src: "icons/trash.png",     emoji: "🗑️", running: false },
];

// ── Magnification config ──
const BASE       = 46;
const MAX        = 74;
const RADIUS     = 150;
const MAX_LIFT   = 18;

let mouseX     = -9999;
let isOverDock = false;

const dock = document.getElementById("dock")!;

// ─────────────────────────────────────────────
//  Build Dock
// ─────────────────────────────────────────────
function buildDock(): void {
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
    sz(img, BASE);
    img.onerror = () => img.replaceWith(emojiEl(icon.emoji, BASE));
    img.src = icon.src;

    const dot = document.createElement("div");
    dot.className = "dock-dot";

    wrap.appendChild(label);
    wrap.appendChild(img);
    wrap.appendChild(dot);

    wrap.addEventListener("click", () => {
      if (wrap.classList.contains("bouncing")) return;
      wrap.classList.add("bouncing", "running");
      wrap.addEventListener("animationend", () => wrap.classList.remove("bouncing"), { once: true });
    });

    dock.appendChild(wrap);
  });
}

function emojiEl(emoji: string, size: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "dock-icon-emoji";
  sz(el, size);
  el.style.fontSize = Math.round(size * 0.52) + "px";
  el.textContent = emoji;
  return el;
}

function sz(el: HTMLElement, size: number): void {
  el.style.width  = size + "px";
  el.style.height = size + "px";
}

// ─────────────────────────────────────────────
//  Magnification — bell curve, icons lift UP
//  Dock pill grows only LEFT ↔ RIGHT
// ─────────────────────────────────────────────
function bellSize(dist: number): number {
  if (dist >= RADIUS) return BASE;
  // Smooth cosine bell — identical to Apple
  const t = (Math.cos((dist / RADIUS) * Math.PI) + 1) / 2;
  return BASE + (MAX - BASE) * t;
}

function applyMag(): void {
  dock.querySelectorAll<HTMLElement>(".dock-icon-wrap").forEach((wrap) => {
    const iconEl = wrap.querySelector<HTMLElement>(".dock-icon, .dock-icon-emoji");
    if (!iconEl) return;

    const r      = wrap.getBoundingClientRect();
    const cx     = r.left + r.width / 2;
    const dist   = Math.abs(mouseX - cx);
    const size   = isOverDock ? bellSize(dist) : BASE;
    const frac   = (size - BASE) / (MAX - BASE);   // 0..1

    // Size
    sz(iconEl, size);
    if (iconEl.classList.contains("dock-icon-emoji")) {
      iconEl.style.fontSize = Math.round(size * 0.52) + "px";
    }

    // Lift upward — translateY negative = up
    // Icons grow from their bottom edge upward naturally because
    // dock uses align-items:flex-end, so we add extra lift on top
    iconEl.style.transform = `translateY(-${frac * MAX_LIFT}px)`;
  });
}

function resetMag(): void {
  dock.querySelectorAll<HTMLElement>(".dock-icon-wrap").forEach((wrap) => {
    const iconEl = wrap.querySelector<HTMLElement>(".dock-icon, .dock-icon-emoji");
    if (!iconEl) return;
    sz(iconEl, BASE);
    if (iconEl.classList.contains("dock-icon-emoji")) {
      iconEl.style.fontSize = Math.round(BASE * 0.52) + "px";
    }
    iconEl.style.transform = "translateY(0)";
  });
}

// Only listen to mouse events ON the dock — never the full document
dock.addEventListener("mouseenter", (e: MouseEvent) => {
  isOverDock = true;
  mouseX = e.clientX;
  applyMag();
});
dock.addEventListener("mousemove", (e: MouseEvent) => {
  mouseX = e.clientX;
  applyMag();
});
dock.addEventListener("mouseleave", () => {
  isOverDock = false;
  mouseX = -9999;
  resetMag();
});

// ─────────────────────────────────────────────
//  Wallpaper — auto-load wallpaper.jpg
// ─────────────────────────────────────────────
const wallpaperLayer = document.getElementById("wallpaperLayer")!;

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
//  Menu Bar Clock
// ─────────────────────────────────────────────
function updateClock(): void {
  const el = document.getElementById("menuClock");
  if (!el) return;
  const now = new Date();
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const D = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const h = now.getHours(), m = now.getMinutes().toString().padStart(2,"0");
  el.textContent = `${D[now.getDay()]} ${M[now.getMonth()]} ${now.getDate()}  ${(h%12)||12}:${m} ${h>=12?"PM":"AM"}`;
}
updateClock();
setInterval(updateClock, 10_000);

// ─────────────────────────────────────────────
//  Calendar Widget
// ─────────────────────────────────────────────
function buildCalendar(): void {
  const el = document.getElementById("calendarWidget");
  if (!el) return;
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), td = now.getDate();
  const MN = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
              "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const fd  = new Date(y,mo,1).getDay();
  const dim = new Date(y,mo+1,0).getDate();
  const prv = new Date(y,mo,0).getDate();
  let h = `<div class="cal-header">${MN[mo]}</div><div class="cal-grid">`;
  ["S","M","T","W","T","F","S"].forEach(d => { h += `<div class="cal-dow">${d}</div>`; });
  for (let i=0;i<fd;i++)       h += `<div class="cal-day other-month">${prv-fd+i+1}</div>`;
  for (let d=1;d<=dim;d++)     h += `<div class="cal-day${d===td?" today":""}">${d}</div>`;
  const tail=(fd+dim)%7; if(tail>0) for(let i=1;i<=7-tail;i++) h+=`<div class="cal-day other-month">${i}</div>`;
  el.innerHTML = h + "</div>";
}

// ─────────────────────────────────────────────
//  Drop PNG onto dock to add live
// ─────────────────────────────────────────────
dock.addEventListener("dragover", (e: DragEvent) => e.preventDefault());
dock.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (!file?.type.startsWith("image/")) return;
  DOCK_ICONS.splice(DOCK_ICONS.length-3, 0, {
    id:"custom_"+Date.now(), label:file.name.replace(/\.[^.]+$/,""),
    src:URL.createObjectURL(file), emoji:"📦", running:false,
  });
  buildDock();
});

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
buildDock();
buildCalendar();
const msToMid=()=>{const n=new Date();return(86400-n.getHours()*3600-n.getMinutes()*60-n.getSeconds())*1000;};
setTimeout(()=>{buildCalendar();setInterval(buildCalendar,86_400_000);},msToMid());
