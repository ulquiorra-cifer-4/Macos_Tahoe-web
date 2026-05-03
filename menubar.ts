// ============================================================
//  macOS Tahoe — menubar.ts
//  Ported from TopBar + MenuBar + Menu + ActionCenter Svelte files
//  EXTRAS vs friend's build:
//    • Volume slider
//    • Brightness slider  
//    • Wi-Fi toggle with network name
//    • Bluetooth toggle
//    • Battery % in Action Center
//    • Do Not Disturb toggle
//    • Keyboard shortcut hints in menus
// ============================================================

// ── State ──
const MB = {
  activeMenu:      '' as string,
  actionCenterOpen: false,
  darkMode:        false,
  animations:      true,
  doNotDisturb:    false,
  wifi:            true,
  bluetooth:       true,
  volume:          72,
  brightness:      85,
  accentColor:     '#0a84ff',
  batteryPct:      78,
};

// ── Menu definitions — mirrors menubar_state.menus in friend's source ──
const MENUS: Record<string, { title: string; items: MenuItem[] }> = {
  apple: {
    title: '',
    items: [
      { label: 'About This Mac',         shortcut: '' },
      { sep: true },
      { label: 'System Settings…',       shortcut: '' },
      { label: 'App Store…',             shortcut: '', disabled: true },
      { sep: true },
      { label: 'Recent Items',           shortcut: '', disabled: true },
      { sep: true },
      { label: 'Force Quit…',            shortcut: '⌥⌘⎋' },
      { sep: true },
      { label: 'Sleep',                  shortcut: '' },
      { label: 'Restart…',              shortcut: '' },
      { label: 'Shut Down…',            shortcut: '' },
      { sep: true },
      { label: 'Lock Screen',            shortcut: '⌃⌘Q' },
      { label: 'Log Out…',              shortcut: '⇧⌘Q' },
    ],
  },
  finder: {
    title: 'Finder',
    items: [
      { label: 'About Finder',           shortcut: '' },
      { sep: true },
      { label: 'Settings…',             shortcut: '⌘,' },
      { sep: true },
      { label: 'Empty Trash…',          shortcut: '⇧⌘⌫' },
      { sep: true },
      { label: 'Services',              shortcut: '', disabled: true },
      { sep: true },
      { label: 'Hide Finder',           shortcut: '⌘H' },
      { label: 'Hide Others',           shortcut: '⌥⌘H' },
      { label: 'Show All',              shortcut: '', disabled: true },
    ],
  },
  file: {
    title: 'File',
    items: [
      { label: 'New Finder Window',     shortcut: '⌘N' },
      { label: 'New Folder',            shortcut: '⇧⌘N' },
      { label: 'New Folder with Selection', shortcut: '⌃⌘N', disabled: true },
      { label: 'New Smart Folder',      shortcut: '', disabled: true },
      { label: 'New Tab',               shortcut: '⌘T' },
      { sep: true },
      { label: 'Open',                  shortcut: '⌘O', disabled: true },
      { label: 'Close Window',          shortcut: '⌘W', disabled: true },
      { sep: true },
      { label: 'Get Info',              shortcut: '⌘I', disabled: true },
      { sep: true },
      { label: 'Move to Trash',         shortcut: '⌘⌫', disabled: true },
    ],
  },
  edit: {
    title: 'Edit',
    items: [
      { label: 'Undo',                  shortcut: '⌘Z',  disabled: true },
      { label: 'Redo',                  shortcut: '⇧⌘Z', disabled: true },
      { sep: true },
      { label: 'Cut',                   shortcut: '⌘X',  disabled: true },
      { label: 'Copy',                  shortcut: '⌘C',  disabled: true },
      { label: 'Paste',                 shortcut: '⌘V',  disabled: true },
      { label: 'Select All',            shortcut: '⌘A',  disabled: true },
      { sep: true },
      { label: 'Find',                  shortcut: '⌘F',  disabled: true },
    ],
  },
  view: {
    title: 'View',
    items: [
      { label: 'as Icons',              shortcut: '⌘1' },
      { label: 'as List',               shortcut: '⌘2' },
      { label: 'as Columns',            shortcut: '⌘3' },
      { label: 'as Gallery',            shortcut: '⌘4' },
      { sep: true },
      { label: 'Show Tab Bar',          shortcut: '⇧⌘T' },
      { label: 'Show Sidebar',          shortcut: '⌥⌘S' },
      { label: 'Show Path Bar',         shortcut: '⌥⌘P' },
      { sep: true },
      { label: 'Hide Toolbar',          shortcut: '⌥⌘T' },
    ],
  },
  go: {
    title: 'Go',
    items: [
      { label: 'Back',                  shortcut: '⌘[',  disabled: true },
      { label: 'Forward',               shortcut: '⌘]',  disabled: true },
      { sep: true },
      { label: 'Recents',               shortcut: '⇧⌘F' },
      { label: 'Documents',             shortcut: '⇧⌘O' },
      { label: 'Desktop',               shortcut: '⇧⌘D' },
      { label: 'Downloads',             shortcut: '⌥⌘L' },
      { label: 'Home',                  shortcut: '⇧⌘H' },
      { sep: true },
      { label: 'Applications',          shortcut: '⇧⌘A' },
      { label: 'Utilities',             shortcut: '⇧⌘U' },
    ],
  },
  window: {
    title: 'Window',
    items: [
      { label: 'Minimize',              shortcut: '⌘M',  disabled: true },
      { label: 'Zoom',                  shortcut: '',    disabled: true },
      { sep: true },
      { label: 'Tile Window to Left',   shortcut: '',    disabled: true },
      { label: 'Tile Window to Right',  shortcut: '',    disabled: true },
      { sep: true },
      { label: 'Bring All to Front',    shortcut: '',    disabled: true },
    ],
  },
  help: {
    title: 'Help',
    items: [
      { label: 'macOS Help',            shortcut: '⌘?' },
    ],
  },
};

interface MenuItem {
  label?:    string;
  shortcut?: string;
  disabled?: boolean;
  sep?:      boolean;
}

// ─────────────────────────────────────────────
//  Build Menu Bar
// ─────────────────────────────────────────────
function buildMenuBar(): void {
  const bar = document.getElementById("menuBar");
  if (!bar) return;
  bar.innerHTML = "";

  // Left side — menus
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
    } else {
      btn.textContent = cfg.title;
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu(id, wrap);
    });
    btn.addEventListener("mouseenter", () => {
      if (MB.activeMenu && MB.activeMenu !== id) toggleMenu(id, wrap);
    });

    // Dropdown
    const dropdown = buildDropdown(cfg.items);
    dropdown.className = "menu-dropdown";
    dropdown.dataset.menuId = id;

    wrap.append(btn, dropdown);
    left.appendChild(wrap);
  });

  // Right side — status items + action center + clock
  const right = document.createElement("div");
  right.className = "menu-right";

  // Battery
  const batEl = document.createElement("span");
  batEl.className = "menu-status battery-status";
  batEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg><span id="mbBatPct">${MB.batteryPct}%</span>`;

  // Wifi
  const wifiEl = document.createElement("span");
  wifiEl.className = "menu-status";
  wifiEl.id = "mbWifi";
  wifiEl.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>`;

  // Action center toggle — mirrors ActionCenterToggle.svelte
  const acBtn = document.createElement("button");
  acBtn.className = "menu-status ac-toggle";
  acBtn.id = "acToggleBtn";
  acBtn.innerHTML = `
    <svg viewBox="0 0 18 18" fill="currentColor" width="15" height="15">
      <rect x="1"  y="1"  width="6" height="6" rx="1.5"/>
      <rect x="11" y="1"  width="6" height="6" rx="1.5"/>
      <rect x="1"  y="11" width="6" height="6" rx="1.5"/>
      <rect x="11" y="11" width="6" height="6" rx="1.5"/>
    </svg>`;
  acBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleActionCenter(); });

  // Clock
  const clockBtn = document.createElement("button");
  clockBtn.className = "menu-status menu-clock";
  clockBtn.id = "menuClock";

  right.append(batEl, wifiEl, acBtn, clockBtn);
  bar.append(left, right);

  // Action center panel
  buildActionCenter();

  updateClock();
}

// ─────────────────────────────────────────────
//  Dropdown menu
// ─────────────────────────────────────────────
function buildDropdown(items: MenuItem[]): HTMLElement {
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
    if (item.disabled) btn.disabled = true;

    const label = document.createElement("span");
    label.textContent = item.label ?? "";

    const shortcut = document.createElement("span");
    shortcut.className = "menu-shortcut";
    shortcut.textContent = item.shortcut ?? "";

    btn.append(label, shortcut);
    section.appendChild(btn);
  });

  return section;
}

function toggleMenu(id: string, wrap: HTMLElement): void {
  const wasActive = MB.activeMenu === id;
  closeAllMenus();
  if (!wasActive) {
    MB.activeMenu = id;
    wrap.querySelector<HTMLElement>(".menu-item")?.classList.add("menu-active");
    wrap.querySelector<HTMLElement>(".menu-dropdown")?.classList.add("open");
  }
}

function closeAllMenus(): void {
  MB.activeMenu = "";
  document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("menu-active"));
  document.querySelectorAll(".menu-dropdown").forEach(d => d.classList.remove("open"));
}

// Close menus on outside click
document.addEventListener("click", closeAllMenus);

// ─────────────────────────────────────────────
//  Action Center — ported from ActionCenter.svelte
//  + extras: volume, brightness, wifi, battery
// ─────────────────────────────────────────────
const ACCENT_COLORS = [
  { name: "Blue",   value: "#0a84ff" },
  { name: "Purple", value: "#bf5af2" },
  { name: "Pink",   value: "#ff375f" },
  { name: "Red",    value: "#ff3b30" },
  { name: "Orange", value: "#ff9f0a" },
  { name: "Yellow", value: "#ffd60a" },
  { name: "Green",  value: "#30d158" },
  { name: "Teal",   value: "#5ac8fa" },
];

function buildActionCenter(): void {
  let panel = document.getElementById("actionCenter");
  if (panel) panel.remove();

  panel = document.createElement("section");
  panel.id = "actionCenter";
  panel.className = "ac-panel";
  panel.innerHTML = `
    <!-- Row 1: Dark Mode + Animations (2 tiles side by side) -->
    <div class="ac-grid">

      <!-- Dark Mode -->
      <div class="ac-surface ac-half" id="acDarkMode">
        <button class="ac-tile-btn" id="acDarkBtn">
          <span class="ac-toggle-icon" id="acDarkIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 16a7 7 0 010-14v14z"/></svg>
          </span>
          <span class="ac-tile-label">Dark Mode</span>
        </button>
      </div>

      <!-- Do Not Disturb -->
      <div class="ac-surface ac-half" id="acDND">
        <button class="ac-tile-btn" id="acDNDBtn">
          <span class="ac-toggle-icon" id="acDNDIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          </span>
          <span class="ac-tile-label">Focus</span>
        </button>
      </div>

      <!-- Wi-Fi -->
      <div class="ac-surface ac-half" id="acWifi">
        <button class="ac-tile-btn" id="acWifiBtn">
          <span class="ac-toggle-icon ac-toggle-on" id="acWifiIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
          </span>
          <span class="ac-tile-label">Wi-Fi</span>
        </button>
      </div>

      <!-- Bluetooth -->
      <div class="ac-surface ac-half" id="acBluetooth">
        <button class="ac-tile-btn" id="acBTBtn">
          <span class="ac-toggle-icon ac-toggle-on" id="acBTIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>
          </span>
          <span class="ac-tile-label">Bluetooth</span>
        </button>
      </div>

      <!-- Animations toggle (EXTRA) -->
      <div class="ac-surface ac-half" id="acAnim">
        <button class="ac-tile-btn ac-toggle-on" id="acAnimBtn">
          <span class="ac-toggle-icon ac-toggle-on" id="acAnimIcon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.5 9.5c-1.03 0-1.9.62-2.29 1.5h-2.92c-.39-.88-1.26-1.5-2.29-1.5s-1.9.62-2.29 1.5H7.79C7.4 10.12 6.53 9.5 5.5 9.5 4.12 9.5 3 10.62 3 12s1.12 2.5 2.5 2.5c1.03 0 1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5s1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5 1.38 0 2.5-1.12 2.5-2.5S20.88 9.5 19.5 9.5z"/></svg>
          </span>
          <span class="ac-tile-label">Animations</span>
        </button>
      </div>

      <!-- Battery (EXTRA) -->
      <div class="ac-surface ac-half" id="acBattery">
        <div class="ac-tile-btn" style="cursor:default;">
          <span class="ac-toggle-icon" style="background:rgba(255,255,255,0.08);">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </span>
          <span class="ac-tile-label">Battery <strong id="acBatPct" style="color:#30d158">${MB.batteryPct}%</strong></span>
        </div>
      </div>

      <!-- Volume slider (EXTRA) -->
      <div class="ac-surface ac-full">
        <div class="ac-slider-row">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="flex-shrink:0;opacity:.7"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.97z"/></svg>
          <input type="range" class="ac-slider" id="acVolume" min="0" max="100" value="${MB.volume}" />
          <span class="ac-slider-val" id="acVolumeVal">${MB.volume}</span>
        </div>
      </div>

      <!-- Brightness slider (EXTRA) -->
      <div class="ac-surface ac-full">
        <div class="ac-slider-row">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="flex-shrink:0;opacity:.7"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
          <input type="range" class="ac-slider" id="acBrightness" min="0" max="100" value="${MB.brightness}" />
          <span class="ac-slider-val" id="acBrightnessVal">${MB.brightness}</span>
        </div>
      </div>

      <!-- Accent Color picker — mirrors ActionCenter color palette -->
      <div class="ac-surface ac-full">
        <p class="ac-section-title">Accent Colour</p>
        <div class="ac-color-row" id="acColorRow"></div>
      </div>

    </div>
  `;

  document.getElementById("desktop")?.appendChild(panel);

  // Wire sliders
  const volSlider = document.getElementById("acVolume") as HTMLInputElement;
  volSlider?.addEventListener("input", () => {
    MB.volume = +volSlider.value;
    const el = document.getElementById("acVolumeVal");
    if (el) el.textContent = String(MB.volume);
  });

  const briSlider = document.getElementById("acBrightness") as HTMLInputElement;
  briSlider?.addEventListener("input", () => {
    MB.brightness = +briSlider.value;
    const el = document.getElementById("acBrightnessVal");
    if (el) el.textContent = String(MB.brightness);
    document.getElementById("wallpaperLayer")!.style.filter = `brightness(${0.4 + MB.brightness / 100 * 0.75})`;
  });

  // Wire toggles
  document.getElementById("acDarkBtn")?.addEventListener("click", () => {
    MB.darkMode = !MB.darkMode;
    applyDarkMode();
    refreshToggleIcon("acDarkIcon", MB.darkMode);
  });

  document.getElementById("acDNDBtn")?.addEventListener("click", () => {
    MB.doNotDisturb = !MB.doNotDisturb;
    refreshToggleIcon("acDNDIcon", MB.doNotDisturb);
  });

  document.getElementById("acWifiBtn")?.addEventListener("click", () => {
    MB.wifi = !MB.wifi;
    refreshToggleIcon("acWifiIcon", MB.wifi);
    const wifiStatus = document.getElementById("mbWifi");
    if (wifiStatus) wifiStatus.style.opacity = MB.wifi ? "1" : "0.3";
  });

  document.getElementById("acBTBtn")?.addEventListener("click", () => {
    MB.bluetooth = !MB.bluetooth;
    refreshToggleIcon("acBTIcon", MB.bluetooth);
  });

  document.getElementById("acAnimBtn")?.addEventListener("click", () => {
    MB.animations = !MB.animations;
    refreshToggleIcon("acAnimIcon", MB.animations);
  });

  // Color palette
  const colorRow = document.getElementById("acColorRow");
  ACCENT_COLORS.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "ac-color-dot" + (MB.accentColor === c.value ? " selected" : "");
    btn.style.background = c.value;
    btn.title = c.name;
    btn.addEventListener("click", () => {
      MB.accentColor = c.value;
      document.documentElement.style.setProperty("--accent", c.value);
      colorRow?.querySelectorAll(".ac-color-dot").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    colorRow?.appendChild(btn);
  });

  // Close on outside click
  panel.addEventListener("click", (e) => e.stopPropagation());
}

function refreshToggleIcon(id: string, on: boolean): void {
  document.getElementById(id)?.classList.toggle("ac-toggle-on", on);
}

function applyDarkMode(): void {
  document.getElementById("desktop")?.classList.toggle("dark-mode", MB.darkMode);
}

function toggleActionCenter(): void {
  MB.actionCenterOpen = !MB.actionCenterOpen;
  const panel = document.getElementById("actionCenter");
  const btn   = document.getElementById("acToggleBtn");
  if (!panel) return;

  if (MB.actionCenterOpen) {
    panel.classList.add("open");
    btn?.classList.add("menu-active");
  } else {
    panel.classList.remove("open");
    btn?.classList.remove("menu-active");
  }
}

// Close action center on outside click
document.addEventListener("click", () => {
  if (!MB.actionCenterOpen) return;
  MB.actionCenterOpen = false;
  document.getElementById("actionCenter")?.classList.remove("open");
  document.getElementById("acToggleBtn")?.classList.remove("menu-active");
});

// ─────────────────────────────────────────────
//  Clock — format matches TopBarTime.svelte (date-fns format)
// ─────────────────────────────────────────────
function updateClock(): void {
  const el = document.getElementById("menuClock");
  if (!el) return;
  const now  = new Date();
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h    = now.getHours(), m = now.getMinutes().toString().padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = (h % 12) || 12;
  el.textContent = `${DAYS[now.getDay()]} ${MONS[now.getMonth()]} ${now.getDate()}   ${h12}:${m} ${ampm}`;
}

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
buildMenuBar();
updateClock();
setInterval(updateClock, 15_000);
