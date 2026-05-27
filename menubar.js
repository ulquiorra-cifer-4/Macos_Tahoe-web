"use strict";
// ============================================================
//  macOS Tahoe — menubar.js  (v2)
//  • Borderless transparent menubar — wallpaper shows through
//  • Slide-down entrance animation on desktop unlock
//  • Action Center: only working controls kept
//    (Dark Mode, Brightness, Volume, Now Playing with music app wiring)
//  • Music Now Playing syncs with window.__musicStore + __radioPlayer
// ============================================================

const MB = {
  activeMenu:       "",
  actionCenterOpen: false,
  darkMode:         false,
  doNotDisturb:     false,
  wifi:             true,
  volume:           72,
  brightness:       85,
  batteryPct:       78,
};

// ── Menu definitions ──
const MENUS = {
  apple: {
    title: "",
    items: [
      { label: "About This Mac",            shortcut: "" },
      { sep: true },
      { label: "System Settings…",          shortcut: "" },
      { sep: true },
      { label: "Force Quit…",               shortcut: "⌥⌘⎋" },
      { sep: true },
      { label: "Sleep",                     shortcut: "" },
      { label: "Restart…",                  shortcut: "" },
      { label: "Shut Down…",                shortcut: "" },
      { sep: true },
      { label: "Lock Screen",               shortcut: "⌃⌘Q" },
      { label: "Log Out…",                  shortcut: "⇧⌘Q" },
    ],
  },
  finder: {
    title: "Finder",
    items: [
      { label: "About Finder",              shortcut: "" },
      { sep: true },
      { label: "Settings…",                 shortcut: "⌘," },
      { sep: true },
      { label: "Empty Trash…",              shortcut: "⇧⌘⌫" },
      { sep: true },
      { label: "Hide Finder",               shortcut: "⌘H" },
      { label: "Hide Others",               shortcut: "⌥⌘H" },
    ],
  },
  file: {
    title: "File",
    items: [
      { label: "New Finder Window",         shortcut: "⌘N" },
      { label: "New Folder",                shortcut: "⇧⌘N" },
      { sep: true },
      { label: "Open",                      shortcut: "⌘O",  disabled: true },
      { label: "Close Window",              shortcut: "⌘W",  disabled: true },
      { sep: true },
      { label: "Move to Trash",             shortcut: "⌘⌫",  disabled: true },
    ],
  },
  edit: {
    title: "Edit",
    items: [
      { label: "Undo",                      shortcut: "⌘Z",  disabled: true },
      { label: "Redo",                      shortcut: "⇧⌘Z", disabled: true },
      { sep: true },
      { label: "Cut",                       shortcut: "⌘X",  disabled: true },
      { label: "Copy",                      shortcut: "⌘C",  disabled: true },
      { label: "Paste",                     shortcut: "⌘V",  disabled: true },
      { label: "Select All",                shortcut: "⌘A",  disabled: true },
    ],
  },
  view: {
    title: "View",
    items: [
      { label: "as Icons",                  shortcut: "⌘1" },
      { label: "as List",                   shortcut: "⌘2" },
      { label: "as Columns",               shortcut: "⌘3" },
      { sep: true },
      { label: "Show Tab Bar",              shortcut: "⇧⌘T" },
      { label: "Show Sidebar",              shortcut: "⌥⌘S" },
    ],
  },
  go: {
    title: "Go",
    items: [
      { label: "Back",                      shortcut: "⌘[",  disabled: true },
      { label: "Forward",                   shortcut: "⌘]",  disabled: true },
      { sep: true },
      { label: "Documents",                 shortcut: "⇧⌘O" },
      { label: "Desktop",                   shortcut: "⇧⌘D" },
      { label: "Downloads",                 shortcut: "⌥⌘L" },
      { label: "Home",                      shortcut: "⇧⌘H" },
      { sep: true },
      { label: "Applications",              shortcut: "⇧⌘A" },
    ],
  },
  window: {
    title: "Window",
    items: [
      { label: "Minimize",                  shortcut: "⌘M",  disabled: true },
      { label: "Zoom",                      shortcut: "",    disabled: true },
      { sep: true },
      { label: "Bring All to Front",        shortcut: "",    disabled: true },
    ],
  },
  help: {
    title: "Help",
    items: [
      { label: "macOS Help",                shortcut: "⌘?" },
    ],
  },
  icons: {
    title: "Icons",
    items: [
      { label: "Browse Icon Packs",         shortcut: "" },
      { label: "Reset to Default",          shortcut: "" },
      { sep: true },
      { label: "Blue Pack",                 shortcut: "" },
      { label: "Dark Pack",                 shortcut: "" },
    ],
  },
};

// ─────────────────────────────────────────────
//  Dark Mode
// ─────────────────────────────────────────────
function applyDarkMode(dark) {
  const desktop = document.getElementById("desktop");
  desktop?.classList.toggle("dark-mode", dark);

  document.querySelectorAll(".dock-item img").forEach(img => {
    const src = img.getAttribute("src") ?? "";
    if (dark) {
      const darkSrc = src.replace(/^icons\//, "dark-icons/").replace(/\.png$/, "-dark.png");
      _swapImg(img, darkSrc, src);
    } else {
      const lightSrc = src.replace(/^dark-icons\//, "icons/").replace(/-dark\.png$/, ".png");
      _swapImg(img, lightSrc, src);
    }
  });

  const dock = document.getElementById("dock");
  if (dock) {
    dock.style.transition = "background 0.45s ease, box-shadow 0.45s ease";
    if (dark) {
      dock.style.background     = "rgba(30,30,34,0.35)";
      dock.style.backdropFilter = "blur(48px) saturate(120%) brightness(80%)";
      dock.style.webkitBackdropFilter = "blur(48px) saturate(120%) brightness(80%)";
      dock.style.boxShadow      = "inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 0 0 0.5px rgba(0,0,0,0.6), rgba(0,0,0,0.5) 2px 5px 24px 8px";
    } else {
      dock.style.background     = "rgba(255,255,255,0.25)";
      dock.style.backdropFilter = "blur(10px)";
      dock.style.webkitBackdropFilter = "blur(10px)";
      dock.style.boxShadow      = "inset 0 0 0 0.2px rgba(255,255,255,0.7), 0 0 0 0.2px rgba(0,0,0,0.7), rgba(0,0,0,0.3) 2px 5px 19px 7px";
    }
    setTimeout(() => { dock.style.transition = ""; }, 480);
  }
}

function _swapImg(img, newSrc, fallback) {
  img.style.transition = "opacity 0.22s ease";
  img.style.opacity    = "0";
  setTimeout(() => {
    const probe = new Image();
    probe.onload  = () => { img.src = newSrc; img.style.opacity = "1"; };
    probe.onerror = () => { img.style.opacity = "1"; };
    probe.src = newSrc;
  }, 200);
}

// ─────────────────────────────────────────────
//  Build Menu Bar
// ─────────────────────────────────────────────
function buildMenuBar() {
  const bar = document.getElementById("menuBar");
  if (!bar) return;
  bar.innerHTML = "";

  // ── Left: menus ──
  const left = document.createElement("div");
  left.className = "menu-left";

  Object.entries(MENUS).forEach(([id, cfg]) => {
    const wrap = document.createElement("div");
    wrap.className = "menu-wrap";
    wrap.style.position = "relative";

    const btn = document.createElement("button");
    btn.className = "menu-item" +
      (id === "finder" ? " active-app" : "") +
      (id === "apple"  ? " apple-btn"  : "");
    btn.dataset.menuId = id;

    if (id === "apple") {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
    } else {
      btn.textContent = cfg.title;
    }

    btn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(id, wrap); });
    btn.addEventListener("mouseenter", () => { if (MB.activeMenu && MB.activeMenu !== id) toggleMenu(id, wrap); });

    const dropdown = buildDropdown(cfg.items);
    wrap.append(btn, dropdown);
    left.appendChild(wrap);
  });

  // ── Right: status icons — no box, no border, pure transparent ──
  const right = document.createElement("div");
  right.className = "menu-right";

  // Battery
  const batEl = document.createElement("span");
  batEl.className = "menu-status";
  batEl.innerHTML = `<img src="icons/battery.png" class="mb-status-icon" alt="" onerror="this.style.display='none'" /><span>${MB.batteryPct}%</span>`;

  // Wi-Fi SVG
  const wifiEl = document.createElement("span");
  wifiEl.className = "menu-status";
  wifiEl.id = "mbWifi";
  wifiEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>`;

  // Search icon (Spotlight trigger)
  const searchBtn = document.createElement("button");
  searchBtn.className = "menu-status mb-icon-btn";
  searchBtn.title = "Spotlight";
  searchBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
  searchBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleSpotlight(); });

  // Control Centre button (toggle icon)
  const acBtn = document.createElement("button");
  acBtn.className = "menu-status mb-icon-btn ac-toggle";
  acBtn.id = "acToggleBtn";
  acBtn.title = "Control Centre";
  acBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <circle cx="6"  cy="6"  r="2.2"/>
      <circle cx="12" cy="6"  r="2.2"/>
      <circle cx="18" cy="6"  r="2.2"/>
      <circle cx="6"  cy="12" r="2.2"/>
      <circle cx="12" cy="12" r="2.2"/>
      <circle cx="18" cy="12" r="2.2"/>
      <circle cx="6"  cy="18" r="2.2"/>
      <circle cx="12" cy="18" r="2.2"/>
      <circle cx="18" cy="18" r="2.2"/>
    </svg>`;
  acBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleActionCenter(); });

  // Clock
  const clockBtn = document.createElement("button");
  clockBtn.className = "menu-status menu-clock";
  clockBtn.id = "menuClock";

  right.append(batEl, wifiEl, searchBtn, acBtn, clockBtn);
  bar.append(left, right);

  buildActionCenter();
  updateClock();

  // ── Entrance animation: slide items from top ──
  _animateMenuBarEntrance(bar);
}

// ─────────────────────────────────────────────
//  Entrance slide-down animation
// ─────────────────────────────────────────────
function _animateMenuBarEntrance(bar) {
  const items = bar.querySelectorAll(".menu-item, .menu-status, .mb-icon-btn, .menu-clock");
  items.forEach((el, i) => {
    el.style.opacity   = "0";
    el.style.transform = "translateY(-10px)";
    el.style.transition = "none";
    setTimeout(() => {
      el.style.transition = `opacity 320ms cubic-bezier(0.34,1.4,0.64,1) ${i * 28}ms,
                             transform 320ms cubic-bezier(0.34,1.4,0.64,1) ${i * 28}ms`;
      el.style.opacity   = "1";
      el.style.transform = "translateY(0)";
    }, 60);
  });
}

// Expose so lockscreen can trigger it on unlock
window.__animateMenuBar = function () {
  const bar = document.getElementById("menuBar");
  if (bar) _animateMenuBarEntrance(bar);
};

// ─────────────────────────────────────────────
//  Spotlight (minimal, triggers desktop search if available)
// ─────────────────────────────────────────────
let _spotlightOpen = false;
let _spotlightEl   = null;

function toggleSpotlight() {
  if (_spotlightOpen) {
    _spotlightEl?.remove();
    _spotlightEl = null;
    _spotlightOpen = false;
    return;
  }
  _spotlightOpen = true;

  const wrap = document.createElement("div");
  wrap.id = "mbSpotlight";
  wrap.className = "mb-spotlight";
  wrap.innerHTML = `
    <div class="mb-spotlight-bar">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="opacity:.5;flex-shrink:0">
        <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input class="mb-spotlight-input" type="text" placeholder="Spotlight Search" autofocus />
    </div>
  `;

  wrap.addEventListener("click", (e) => e.stopPropagation());
  document.getElementById("desktop")?.appendChild(wrap);
  _spotlightEl = wrap;
  wrap.querySelector("input")?.focus();

  // Close on Escape
  wrap.querySelector("input")?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleSpotlight();
  });
}

document.addEventListener("click", () => {
  if (_spotlightOpen) toggleSpotlight();
});

// ─────────────────────────────────────────────
//  Dropdown
// ─────────────────────────────────────────────
function buildDropdown(items) {
  const section = document.createElement("section");
  section.className = "menu-dropdown";

  items.forEach(item => {
    if (item.sep) {
      const div = document.createElement("div");
      div.className = "menu-divider";
      section.appendChild(div);
      return;
    }
    const btn = document.createElement("button");
    btn.className = "menu-dropdown-item";
    if (item.disabled) btn.disabled = true;
    const label = document.createElement("span");
    label.textContent = item.label ?? "";
    const sc = document.createElement("span");
    sc.className = "menu-shortcut";
    sc.textContent = item.shortcut ?? "";
    btn.append(label, sc);

    if (item.label === "Lock Screen") {
      btn.addEventListener("click", () => {
        closeAllMenus();
        setTimeout(() => { if (typeof window.showLockScreen === "function") window.showLockScreen(); }, 120);
      });
    }
    if (item.label === "Browse Icon Packs") {
      btn.addEventListener("click", () => {
        closeAllMenus();
        setTimeout(() => { if (typeof window.openIconPackPanel === "function") window.openIconPackPanel(); }, 120);
      });
    }
    if (item.label === "Reset to Default") {
      btn.addEventListener("click", () => { closeAllMenus(); window.__iconPackManager?.applyPack("default"); });
    }
    if (item.label === "Blue Pack") {
      btn.addEventListener("click", () => { closeAllMenus(); window.__iconPackManager?.applyPack("blue"); });
    }
    if (item.label === "Dark Pack") {
      btn.addEventListener("click", () => { closeAllMenus(); window.__iconPackManager?.applyPack("dark"); });
    }

    section.appendChild(btn);
  });
  return section;
}

function toggleMenu(id, wrap) {
  const wasActive = MB.activeMenu === id;
  closeAllMenus();
  if (!wasActive) {
    MB.activeMenu = id;
    wrap.querySelector(".menu-item")?.classList.add("menu-active");
    wrap.querySelector(".menu-dropdown")?.classList.add("open");
  }
}

function closeAllMenus() {
  MB.activeMenu = "";
  document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("menu-active"));
  document.querySelectorAll(".menu-dropdown").forEach(d => d.classList.remove("open"));
}

document.addEventListener("click", closeAllMenus);

// ─────────────────────────────────────────────
//  Now Playing — reads live from music/radio store
// ─────────────────────────────────────────────
function getNowPlaying() {
  // Radio takes priority
  const radio = window.__radioPlayer;
  if (radio?.isPlaying && radio.currentId) {
    const st = radio.getStation();
    return {
      title:   st?.name    ?? "Radio",
      artist:  st?.tagline ?? "Live",
      playing: true,
      artUrl:  st?.artwork ?? null,
      emoji:   st?.emoji   ?? "📻",
      isRadio: true,
    };
  }
  // Music store
  const store = window.__musicStore;
  if (store?.state?.currentSongId) {
    const song   = store.getSong(store.state.currentSongId);
    const album  = song ? store.getAlbum(song.albumId)   : null;
    const artist = song ? store.getArtist(song.artistId) : null;
    return {
      title:   song?.title    ?? "Unknown",
      artist:  artist?.name   ?? "Unknown",
      playing: store.state.isPlaying,
      artUrl:  album ? store.getArtworkUrl(song.albumId) : null,
      emoji:   "🎵",
      isRadio: false,
    };
  }
  return null;
}

function updateNowPlayingUI() {
  const np = getNowPlaying();
  const card = document.getElementById("acNowPlaying");
  if (!card) return;

  if (!np) {
    card.classList.add("ac-np-empty");
    card.querySelector(".ac-np-title").textContent  = "Not Playing";
    card.querySelector(".ac-np-artist").textContent = "—";
    const art = card.querySelector(".ac-np-art");
    if (art) { art.innerHTML = "🎵"; art.style.backgroundImage = "none"; }
    return;
  }

  card.classList.remove("ac-np-empty");

  const titleEl  = card.querySelector(".ac-np-title");
  const artistEl = card.querySelector(".ac-np-artist");
  const art      = card.querySelector(".ac-np-art");
  const icon     = document.getElementById("acPlayIcon");

  if (titleEl)  titleEl.textContent  = np.title;
  if (artistEl) artistEl.textContent = np.artist;

  if (art) {
    if (np.artUrl) {
      art.style.backgroundImage = `url(${np.artUrl})`;
      art.style.backgroundSize  = "cover";
      art.style.backgroundPosition = "center";
      art.textContent = "";
    } else {
      art.style.backgroundImage = "none";
      art.textContent = np.emoji;
    }
  }

  if (icon) {
    icon.innerHTML = np.playing
      ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
      : `<path d="M8 5v14l11-7z"/>`;
  }
}

// ─────────────────────────────────────────────
//  Action Center  (Control Centre)
// ─────────────────────────────────────────────
function buildActionCenter() {
  document.getElementById("actionCenter")?.remove();

  const panel = document.createElement("div");
  panel.id = "actionCenter";
  panel.className = "ac-panel";
  panel.addEventListener("click", e => e.stopPropagation());

  panel.innerHTML = `
    <div class="ac-body">

      <!-- ROW 1: Wi-Fi (wide) + Now Playing -->
      <div class="ac-row">
        <button class="ac-pill ac-pill-wide ac-on" id="acWifiBtn">
          <span class="ac-pill-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
          </span>
          <span class="ac-pill-text">
            <span class="ac-pill-title">Wi-Fi</span>
            <span class="ac-pill-sub" id="acWifiSub">Home</span>
          </span>
        </button>

        <div class="ac-now-playing" id="acNowPlaying">
          <div class="ac-np-art">🎵</div>
          <div class="ac-np-info">
            <div class="ac-np-title" id="acNpTitle">Not Playing</div>
            <div class="ac-np-artist" id="acNpArtist">—</div>
          </div>
          <div class="ac-np-controls">
            <button class="ac-np-btn" id="acPrev" title="Previous">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button class="ac-np-btn ac-np-play" id="acPlay" title="Play/Pause">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" id="acPlayIcon">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button class="ac-np-btn" id="acNext" title="Next">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ROW 2: Dark Mode toggle (wide) -->
      <div class="ac-row">
        <button class="ac-pill ac-pill-wide ${MB.darkMode ? "ac-on" : ""}" id="acDarkBtn">
          <span class="ac-pill-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 16a7 7 0 010-14v14z"/>
            </svg>
          </span>
          <span class="ac-pill-text">
            <span class="ac-pill-title">Dark Mode</span>
            <span class="ac-pill-sub" id="acDarkSub">${MB.darkMode ? "On" : "Off"}</span>
          </span>
        </button>

        <button class="ac-pill ac-pill-focus" id="acFocusBtn">
          <span class="ac-pill-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </span>
          <span class="ac-pill-text">
            <span class="ac-pill-title">Focus</span>
            <span class="ac-pill-sub" id="acFocusSub">Off</span>
          </span>
        </button>
      </div>

      <!-- ROW 3: Display brightness -->
      <div class="ac-slider-card">
        <div class="ac-slider-header">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
          <span>Display</span>
        </div>
        <div class="ac-slider-track">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="opacity:.4"><circle cx="12" cy="12" r="5"/></svg>
          <input type="range" class="ac-slider-input" id="acBrightness" min="0" max="100" value="${MB.brightness}" />
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="opacity:.85">
            <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        </div>
      </div>

      <!-- ROW 4: Sound volume -->
      <div class="ac-slider-card">
        <div class="ac-slider-header">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <span>Sound</span>
        </div>
        <div class="ac-slider-track">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="opacity:.4"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
          <input type="range" class="ac-slider-input" id="acVolume" min="0" max="100" value="${MB.volume}" />
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="opacity:.85">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>
      </div>

    </div>
  `;

  document.getElementById("desktop")?.appendChild(panel);

  // ── Wire controls ──

  // Wi-Fi
  document.getElementById("acWifiBtn")?.addEventListener("click", () => {
    MB.wifi = !MB.wifi;
    document.getElementById("acWifiBtn")?.classList.toggle("ac-on", MB.wifi);
    document.getElementById("acWifiSub").textContent = MB.wifi ? "Home" : "Off";
    document.getElementById("mbWifi").style.opacity  = MB.wifi ? "1" : "0.35";
  });

  // Dark Mode
  document.getElementById("acDarkBtn")?.addEventListener("click", () => {
    MB.darkMode = !MB.darkMode;
    applyDarkMode(MB.darkMode);
    document.getElementById("acDarkBtn")?.classList.toggle("ac-on", MB.darkMode);
    document.getElementById("acDarkSub").textContent = MB.darkMode ? "On" : "Off";
  });

  // Focus (cosmetic)
  document.getElementById("acFocusBtn")?.addEventListener("click", () => {
    MB.doNotDisturb = !MB.doNotDisturb;
    document.getElementById("acFocusBtn")?.classList.toggle("ac-on", MB.doNotDisturb);
    document.getElementById("acFocusSub").textContent = MB.doNotDisturb ? "On" : "Off";
  });

  // Brightness — adjusts wallpaper filter
  document.getElementById("acBrightness")?.addEventListener("input", (e) => {
    MB.brightness = +e.target.value;
    const wl = document.getElementById("wallpaperLayer");
    if (wl) wl.style.filter = `brightness(${0.45 + MB.brightness / 100 * 0.65})`;
  });

  // Volume — syncs with music store
  document.getElementById("acVolume")?.addEventListener("input", (e) => {
    MB.volume = +e.target.value;
    const v = MB.volume / 100;
    if (window.__musicStore)  window.__musicStore.setVolume(v);
    if (window.__radioPlayer) window.__radioPlayer.setVolume(v);
    if (window.__musicPlayer) window.__musicPlayer.audio.volume = v;
  });

  // Now Playing controls — music store & radio
  document.getElementById("acPlay")?.addEventListener("click", () => {
    if (window.__radioPlayer?.currentId) {
      window.__radioPlayer.togglePlay();
    } else if (window.__musicStore?.state?.currentSongId) {
      window.__musicStore.togglePlay();
    }
    updateNowPlayingUI();
  });

  document.getElementById("acPrev")?.addEventListener("click", () => {
    if (window.__musicStore?.state?.currentSongId) {
      window.__musicStore.prevSong();
      setTimeout(updateNowPlayingUI, 50);
    }
  });

  document.getElementById("acNext")?.addEventListener("click", () => {
    if (window.__radioPlayer?.currentId) {
      // Radio doesn't have next — just stop
      window.__radioPlayer.stop();
    } else if (window.__musicStore?.state?.currentSongId) {
      window.__musicStore.nextSong();
      setTimeout(updateNowPlayingUI, 50);
    }
    setTimeout(updateNowPlayingUI, 50);
  });

  // Subscribe to music store + radio player → live update NP card
  if (window.__musicStore) {
    window.__musicStore.subscribe(() => {
      if (document.getElementById("actionCenter")?.classList.contains("open")) {
        updateNowPlayingUI();
      }
    });
  }
  if (window.__radioPlayer) {
    window.__radioPlayer.subscribe(() => {
      if (document.getElementById("actionCenter")?.classList.contains("open")) {
        updateNowPlayingUI();
      }
    });
  }

  // Initial NP state
  updateNowPlayingUI();
}

function toggleActionCenter() {
  MB.actionCenterOpen = !MB.actionCenterOpen;
  const panel = document.getElementById("actionCenter");
  const btn   = document.getElementById("acToggleBtn");
  if (!panel) return;
  panel.classList.toggle("open", MB.actionCenterOpen);
  btn?.classList.toggle("menu-active", MB.actionCenterOpen);
  if (MB.actionCenterOpen) updateNowPlayingUI();
}

document.addEventListener("click", () => {
  if (!MB.actionCenterOpen) return;
  MB.actionCenterOpen = false;
  document.getElementById("actionCenter")?.classList.remove("open");
  document.getElementById("acToggleBtn")?.classList.remove("menu-active");
});

// ── Clock ──
function updateClock() {
  const el = document.getElementById("menuClock");
  if (!el) return;
  const now = new Date();
  const D = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h = now.getHours(), m = now.getMinutes().toString().padStart(2,"0");
  el.textContent = `${D[now.getDay()]} ${M[now.getMonth()]} ${now.getDate()}   ${(h%12)||12}:${m} ${h>=12?"PM":"AM"}`;
}

buildMenuBar();
updateClock();
setInterval(updateClock, 15_000);
