"use strict";
// ============================================================
//  macOS Tahoe — menubar.ts
// ============================================================
const MB = {
    activeMenu: '',
    actionCenterOpen: false,
    darkMode: false,
    doNotDisturb: false,
    wifi: true,
    bluetooth: true,
    airdrop: true,
    volume: 72,
    brightness: 85,
    accentColor: '#0a84ff',
    batteryPct: 78,
    nowPlaying: { title: 'Besties', artist: 'Black Country, New Road', playing: true },
};
// ── Menu definitions ──
const MENUS = {
    apple: {
        title: '',
        items: [
            { label: 'About This Mac', shortcut: '' },
            { sep: true },
            { label: 'System Settings…', shortcut: '' },
            { label: 'App Store…', shortcut: '', disabled: true },
            { sep: true },
            { label: 'Recent Items', shortcut: '', disabled: true },
            { sep: true },
            { label: 'Force Quit…', shortcut: '⌥⌘⎋' },
            { sep: true },
            { label: 'Sleep', shortcut: '' },
            { label: 'Restart…', shortcut: '' },
            { label: 'Shut Down…', shortcut: '' },
            { sep: true },
            { label: 'Lock Screen', shortcut: '⌃⌘Q' },
            { label: 'Log Out…', shortcut: '⇧⌘Q' },
        ],
    },
    finder: {
        title: 'Finder',
        items: [
            { label: 'About Finder', shortcut: '' },
            { sep: true },
            { label: 'Settings…', shortcut: '⌘,' },
            { sep: true },
            { label: 'Empty Trash…', shortcut: '⇧⌘⌫' },
            { sep: true },
            { label: 'Services', shortcut: '', disabled: true },
            { sep: true },
            { label: 'Hide Finder', shortcut: '⌘H' },
            { label: 'Hide Others', shortcut: '⌥⌘H' },
            { label: 'Show All', shortcut: '', disabled: true },
        ],
    },
    file: {
        title: 'File',
        items: [
            { label: 'New Finder Window', shortcut: '⌘N' },
            { label: 'New Folder', shortcut: '⇧⌘N' },
            { label: 'New Smart Folder', shortcut: '', disabled: true },
            { label: 'New Tab', shortcut: '⌘T' },
            { sep: true },
            { label: 'Open', shortcut: '⌘O', disabled: true },
            { label: 'Close Window', shortcut: '⌘W', disabled: true },
            { sep: true },
            { label: 'Get Info', shortcut: '⌘I', disabled: true },
            { sep: true },
            { label: 'Move to Trash', shortcut: '⌘⌫', disabled: true },
        ],
    },
    edit: {
        title: 'Edit',
        items: [
            { label: 'Undo', shortcut: '⌘Z', disabled: true },
            { label: 'Redo', shortcut: '⇧⌘Z', disabled: true },
            { sep: true },
            { label: 'Cut', shortcut: '⌘X', disabled: true },
            { label: 'Copy', shortcut: '⌘C', disabled: true },
            { label: 'Paste', shortcut: '⌘V', disabled: true },
            { label: 'Select All', shortcut: '⌘A', disabled: true },
            { sep: true },
            { label: 'Find', shortcut: '⌘F', disabled: true },
        ],
    },
    view: {
        title: 'View',
        items: [
            { label: 'as Icons', shortcut: '⌘1' },
            { label: 'as List', shortcut: '⌘2' },
            { label: 'as Columns', shortcut: '⌘3' },
            { label: 'as Gallery', shortcut: '⌘4' },
            { sep: true },
            { label: 'Show Tab Bar', shortcut: '⇧⌘T' },
            { label: 'Show Sidebar', shortcut: '⌥⌘S' },
            { label: 'Show Path Bar', shortcut: '⌥⌘P' },
            { sep: true },
            { label: 'Hide Toolbar', shortcut: '⌥⌘T' },
        ],
    },
    go: {
        title: 'Go',
        items: [
            { label: 'Back', shortcut: '⌘[', disabled: true },
            { label: 'Forward', shortcut: '⌘]', disabled: true },
            { sep: true },
            { label: 'Recents', shortcut: '⇧⌘F' },
            { label: 'Documents', shortcut: '⇧⌘O' },
            { label: 'Desktop', shortcut: '⇧⌘D' },
            { label: 'Downloads', shortcut: '⌥⌘L' },
            { label: 'Home', shortcut: '⇧⌘H' },
            { sep: true },
            { label: 'Applications', shortcut: '⇧⌘A' },
            { label: 'Utilities', shortcut: '⇧⌘U' },
        ],
    },
    window: {
        title: 'Window',
        items: [
            { label: 'Minimize', shortcut: '⌘M', disabled: true },
            { label: 'Zoom', shortcut: '', disabled: true },
            { sep: true },
            { label: 'Tile Window to Left', shortcut: '', disabled: true },
            { label: 'Tile Window to Right', shortcut: '', disabled: true },
            { sep: true },
            { label: 'Bring All to Front', shortcut: '', disabled: true },
        ],
    },
    help: {
        title: 'Help',
        items: [
            { label: 'macOS Help', shortcut: '⌘?' },
        ],
    },
    icons: {
        title: 'Icons',
        items: [
            { label: 'Browse Icon Packs', shortcut: '' },
            { label: 'Reset to Default', shortcut: '' },
            { sep: true },
            { label: 'Blue Pack', shortcut: '' },
            { label: 'Dark Pack', shortcut: '' },
        ],
    },
};
// ─────────────────────────────────────────────
//  Dark Mode — switches desktop class, dock icons, dock glass
// ─────────────────────────────────────────────
function applyDarkMode(dark) {
    const desktop = document.getElementById("desktop");
    desktop?.classList.toggle("dark-mode", dark);
    // ── Switch dock icon images ──
    document.querySelectorAll(".dock-item img").forEach(img => {
        const src = img.getAttribute("src") ?? "";
        if (dark) {
            // light → dark:  icons/finder.png  →  dark-icons/finder-dark.png
            const darkSrc = src.replace(/^icons\//, "dark-icons/").replace(/\.png$/, "-dark.png");
            _swapImg(img, darkSrc, src);
        }
        else {
            // dark → light:  dark-icons/finder-dark.png  →  icons/finder.png
            const lightSrc = src.replace(/^dark-icons\//, "icons/").replace(/-dark\.png$/, ".png");
            _swapImg(img, lightSrc, src);
        }
    });
    // ── Dock pill transparency ──
    const dock = document.getElementById("dock");
    if (dock) {
        dock.style.transition = "background 0.45s ease, box-shadow 0.45s ease, backdrop-filter 0.45s ease";
        if (dark) {
            dock.style.background = "rgba(30,30,34,0.35)";
            dock.style.backdropFilter = "blur(48px) saturate(120%) brightness(80%)";
            dock.style.webkitBackdropFilter = "blur(48px) saturate(120%) brightness(80%)";
            dock.style.boxShadow = "inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 0 0 0.5px rgba(0,0,0,0.6), rgba(0,0,0,0.5) 2px 5px 24px 8px";
        }
        else {
            dock.style.background = "rgba(255,255,255,0.25)";
            dock.style.backdropFilter = "blur(10px)";
            dock.style.webkitBackdropFilter = "blur(10px)";
            dock.style.boxShadow = "inset 0 0 0 0.2px rgba(255,255,255,0.7), 0 0 0 0.2px rgba(0,0,0,0.7), rgba(0,0,0,0.3) 2px 5px 19px 7px";
        }
        setTimeout(() => { dock.style.transition = ""; }, 480);
    }
}
function _swapImg(img, newSrc, fallback) {
    // Crossfade: fade out → swap → fade in
    img.style.transition = "opacity 0.22s ease";
    img.style.opacity = "0";
    setTimeout(() => {
        const probe = new Image();
        probe.onload = () => {
            img.src = newSrc;
            img.style.opacity = "1";
        };
        probe.onerror = () => {
            // Dark icon not found — keep original, restore opacity
            img.style.opacity = "1";
        };
        probe.src = newSrc;
    }, 200);
}
// ─────────────────────────────────────────────
//  Build Menu Bar
// ─────────────────────────────────────────────
function buildMenuBar() {
    const bar = document.getElementById("menuBar");
    if (!bar)
        return;
    bar.innerHTML = "";
    const left = document.createElement("div");
    left.className = "menu-left";
    Object.entries(MENUS).forEach(([id, cfg]) => {
        const wrap = document.createElement("div");
        wrap.className = "menu-wrap";
        wrap.style.position = "relative";
        const btn = document.createElement("button");
        btn.className = "menu-item" + (id === "finder" ? " active-app" : "") + (id === "apple" ? " apple-btn" : "");
        btn.dataset.menuId = id;
        if (id === "apple") {
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
        }
        else {
            btn.textContent = cfg.title;
        }
        btn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(id, wrap); });
        btn.addEventListener("mouseenter", () => { if (MB.activeMenu && MB.activeMenu !== id)
            toggleMenu(id, wrap); });
        const dropdown = buildDropdown(cfg.items);
        wrap.append(btn, dropdown);
        left.appendChild(wrap);
    });
    const right = document.createElement("div");
    right.className = "menu-right";
    // Battery icon — uses uploaded battery.png
    const batEl = document.createElement("span");
    batEl.className = "menu-status";
    batEl.innerHTML = `<img src="icons/battery.png" class="mb-status-icon" alt="Battery" id="mbBatteryIcon" /><span>${MB.batteryPct}%</span>`;
    // Wifi
    const wifiEl = document.createElement("span");
    wifiEl.className = "menu-status";
    wifiEl.id = "mbWifi";
    wifiEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>`;
    // Action center toggle — uses uploaded action-center.png
    const acBtn = document.createElement("button");
    acBtn.className = "menu-status ac-toggle";
    acBtn.id = "acToggleBtn";
    acBtn.innerHTML = `<img src="icons/action-center.png" class="mb-status-icon" alt="Control Centre" id="mbACIcon" />`;
    acBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleActionCenter(); });
    // Clock
    const clockBtn = document.createElement("button");
    clockBtn.className = "menu-status menu-clock";
    clockBtn.id = "menuClock";
    right.append(batEl, wifiEl, acBtn, clockBtn);
    bar.append(left, right);
    buildActionCenter();
    updateClock();
}
// ─────────────────────────────────────────────
//  Dropdown
// ─────────────────────────────────────────────
function buildDropdown(items) {
    const section = document.createElement("section");
    section.className = "menu-dropdown";
    items.forEach((item) => {
        if (item.sep) {
            const div = document.createElement("div");
            div.className = "menu-divider";
            section.appendChild(div);
            return;
        }
        const btn = document.createElement("button");
        btn.className = "menu-dropdown-item";
        if (item.disabled)
            btn.disabled = true;
        const label = document.createElement("span");
        label.textContent = item.label ?? "";
        const sc = document.createElement("span");
        sc.className = "menu-shortcut";
        sc.textContent = item.shortcut ?? "";
        btn.append(label, sc);
        // Wire special actions
        if (item.label === "Lock Screen") {
            btn.addEventListener("click", () => {
                closeAllMenus();
                setTimeout(() => {
                    if (typeof window.showLockScreen === "function") {
                        window.showLockScreen();
                    }
                }, 120);
            });
        }
        // Icons menu actions — hardcoded repo, no URL input needed
        if (item.label === "Browse Icon Packs") {
            btn.addEventListener("click", () => {
                closeAllMenus();
                setTimeout(() => {
                    if (typeof window.openIconPackPanel === "function") {
                        window.openIconPackPanel();
                    }
                }, 120);
            });
        }
        if (item.label === "Reset to Default") {
            btn.addEventListener("click", () => {
                closeAllMenus();
                window.__iconPackManager?.applyPack("default");
            });
        }
        if (item.label === "Blue Pack") {
            btn.addEventListener("click", () => {
                closeAllMenus();
                window.__iconPackManager?.applyPack("blue");
            });
        }
        if (item.label === "Dark Pack") {
            btn.addEventListener("click", () => {
                closeAllMenus();
                window.__iconPackManager?.applyPack("dark");
            });
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
//  Action Center — iOS-style layout
// ─────────────────────────────────────────────
function buildActionCenter() {
    document.getElementById("actionCenter")?.remove();
    const panel = document.createElement("div");
    panel.id = "actionCenter";
    panel.className = "ac-panel";
    panel.addEventListener("click", (e) => e.stopPropagation());
    panel.innerHTML = `
    <div class="ac-body">

      <!-- ROW 1: Wi-Fi pill (wide) + Now Playing (right) -->
      <div class="ac-row">
        <!-- Wi-Fi pill — wide, shows network name below -->
        <button class="ac-pill ac-pill-wide ac-on" id="acWifiBtn">
          <span class="ac-pill-icon" id="acWifiIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
          </span>
          <span class="ac-pill-text">
            <span class="ac-pill-title">Wi-Fi</span>
            <span class="ac-pill-sub" id="acWifiSub">Home</span>
          </span>
        </button>

        <!-- Now Playing card -->
        <div class="ac-now-playing" id="acNowPlaying">
          <div class="ac-np-art">🎵</div>
          <div class="ac-np-info">
            <div class="ac-np-title" id="acNpTitle">${MB.nowPlaying.title}</div>
            <div class="ac-np-artist" id="acNpArtist">${MB.nowPlaying.artist}</div>
          </div>
          <div class="ac-np-controls">
            <button class="ac-np-btn" id="acPrev">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="ac-np-btn ac-np-play" id="acPlay">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" id="acPlayIcon"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="ac-np-btn" id="acNext">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ROW 2: Bluetooth + AirDrop circles -->
      <div class="ac-row">
        <button class="ac-circle ac-on" id="acBTBtn">
          <span class="ac-circle-icon" id="acBTIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>
          </span>
          <span class="ac-circle-label">Bluetooth</span>
        </button>
        <button class="ac-circle ac-on" id="acAirdropBtn">
          <span class="ac-circle-icon" id="acAirdropIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8l7 4-7 4v-3.86l3.72-1.14L8 10.14V16z"/></svg>
          </span>
          <span class="ac-circle-label">AirDrop</span>
        </button>
        <!-- Focus pill — wide -->
        <button class="ac-pill ac-pill-focus" id="acFocusBtn">
          <span class="ac-pill-icon" id="acFocusIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          </span>
          <span class="ac-pill-text">
            <span class="ac-pill-title">Focus</span>
            <span class="ac-pill-sub" id="acFocusSub">Off</span>
          </span>
        </button>
      </div>

      <!-- ROW 3: Screen Mirroring + Display mode circles -->
      <div class="ac-row">
        <button class="ac-circle" id="acMirrorBtn">
          <span class="ac-circle-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-8-2v-4l4 2-4 2zM7 8h2v8H7z"/></svg>
          </span>
          <span class="ac-circle-label">Mirroring</span>
        </button>
        <button class="ac-circle" id="acDisplayBtn">
          <span class="ac-circle-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15c0-2.21 1.79-4 4-4s4 1.79 4 4"/></svg>
          </span>
          <span class="ac-circle-label">Display</span>
        </button>
        <button class="ac-circle" id="acDarkBtn">
          <span class="ac-circle-icon" id="acDarkIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 16a7 7 0 010-14v14z"/></svg>
          </span>
          <span class="ac-circle-label">Dark Mode</span>
        </button>
      </div>

      <!-- ROW 4: Display brightness slider -->
      <div class="ac-slider-card">
        <div class="ac-slider-header">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
          <span>Display</span>
        </div>
        <div class="ac-slider-track">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="opacity:.5"><circle cx="12" cy="12" r="5"/></svg>
          <input type="range" class="ac-slider-input" id="acBrightness" min="0" max="100" value="${MB.brightness}" />
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="opacity:.9"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
        </div>
      </div>

      <!-- ROW 5: Sound volume slider -->
      <div class="ac-slider-card">
        <div class="ac-slider-header">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <span>Sound</span>
        </div>
        <div class="ac-slider-track">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="opacity:.5"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
          <input type="range" class="ac-slider-input" id="acVolume" min="0" max="100" value="${MB.volume}" />
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="opacity:.9"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.97z"/></svg>
        </div>
      </div>

      <!-- ROW 6: Bottom utility circles -->
      <div class="ac-row ac-row-utilities">
        <button class="ac-util-circle" title="Icon Packs" id="acIconPacks">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        </button>
        <button class="ac-util-circle" id="acDarkModeUtil" title="Dark Mode">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 16a7 7 0 010-14v14z"/></svg>
        </button>
        <button class="ac-util-circle" title="Calculator">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
        </button>
        <button class="ac-util-circle" title="Timer">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
        </button>
        <button class="ac-util-circle" title="Screenshot">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/></svg>
        </button>
      </div>

      <!-- Edit Controls hint -->
      <div class="ac-edit-controls">Edit Controls</div>

    </div>
  `;
    document.getElementById("desktop")?.appendChild(panel);
    // ── Wire all controls ──
    // Wi-Fi
    document.getElementById("acWifiBtn")?.addEventListener("click", () => {
        MB.wifi = !MB.wifi;
        const btn = document.getElementById("acWifiBtn");
        btn?.classList.toggle("ac-on", MB.wifi);
        document.getElementById("acWifiSub").textContent = MB.wifi ? "Home" : "Off";
        document.getElementById("mbWifi").style.opacity = MB.wifi ? "1" : "0.35";
    });
    // Bluetooth
    document.getElementById("acBTBtn")?.addEventListener("click", () => {
        MB.bluetooth = !MB.bluetooth;
        document.getElementById("acBTBtn")?.classList.toggle("ac-on", MB.bluetooth);
    });
    // AirDrop
    document.getElementById("acAirdropBtn")?.addEventListener("click", () => {
        MB.airdrop = !MB.airdrop;
        document.getElementById("acAirdropBtn")?.classList.toggle("ac-on", MB.airdrop);
    });
    // Focus
    document.getElementById("acFocusBtn")?.addEventListener("click", () => {
        MB.doNotDisturb = !MB.doNotDisturb;
        document.getElementById("acFocusBtn")?.classList.toggle("ac-on", MB.doNotDisturb);
        document.getElementById("acFocusSub").textContent = MB.doNotDisturb ? "On" : "Off";
    });
    // Dark Mode — switches dock icons + dock transparency
    const darkToggle = () => {
        MB.darkMode = !MB.darkMode;
        applyDarkMode(MB.darkMode);
        document.getElementById("acDarkBtn")?.classList.toggle("ac-on", MB.darkMode);
        document.getElementById("acDarkModeUtil")?.classList.toggle("ac-util-on", MB.darkMode);
    };
    document.getElementById("acDarkBtn")?.addEventListener("click", darkToggle);
    document.getElementById("acDarkModeUtil")?.addEventListener("click", darkToggle);
    // Icon Packs button
    document.getElementById("acIconPacks")?.addEventListener("click", () => {
        toggleActionCenter();
        setTimeout(() => {
            if (typeof window.openIconPackPanel === "function") {
                window.openIconPackPanel();
            }
        }, 200);
    });
    // Brightness
    const briSlider = document.getElementById("acBrightness");
    briSlider?.addEventListener("input", () => {
        MB.brightness = +briSlider.value;
        const wl = document.getElementById("wallpaperLayer");
        if (wl)
            wl.style.filter = `brightness(${0.45 + MB.brightness / 100 * 0.65})`;
    });
    // Volume
    const volSlider = document.getElementById("acVolume");
    volSlider?.addEventListener("input", () => { MB.volume = +volSlider.value; });
    // Now Playing controls
    document.getElementById("acPlay")?.addEventListener("click", () => {
        MB.nowPlaying.playing = !MB.nowPlaying.playing;
        const icon = document.getElementById("acPlayIcon");
        if (icon)
            icon.innerHTML = MB.nowPlaying.playing
                ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
                : `<path d="M8 5v14l11-7z"/>`;
    });
    // Screenshot
    document.querySelector('[title="Screenshot"]')?.addEventListener("click", () => {
        document.getElementById("actionCenter")?.classList.remove("open");
        MB.actionCenterOpen = false;
        setTimeout(() => alert("Screenshot saved to Desktop! (demo)"), 300);
    });
}
function toggleActionCenter() {
    MB.actionCenterOpen = !MB.actionCenterOpen;
    const panel = document.getElementById("actionCenter");
    const btn = document.getElementById("acToggleBtn");
    if (!panel)
        return;
    panel.classList.toggle("open", MB.actionCenterOpen);
    btn?.classList.toggle("menu-active", MB.actionCenterOpen);
}
document.addEventListener("click", () => {
    if (!MB.actionCenterOpen)
        return;
    MB.actionCenterOpen = false;
    document.getElementById("actionCenter")?.classList.remove("open");
    document.getElementById("acToggleBtn")?.classList.remove("menu-active");
});
// ── Clock ──
function updateClock() {
    const el = document.getElementById("menuClock");
    if (!el)
        return;
    const now = new Date();
    const D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const h = now.getHours(), m = now.getMinutes().toString().padStart(2, "0");
    el.textContent = `${D[now.getDay()]} ${M[now.getMonth()]} ${now.getDate()}   ${(h % 12) || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}
buildMenuBar();
updateClock();
setInterval(updateClock, 15000);
