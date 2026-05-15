// ============================================================
//  Icon Pack Manager — icon-pack-manager.ts
//  Loads icon packs from a separate repository URL,
//  applies them to dock icons with smooth crossfade
// ============================================================

interface IconPack {
  id:      string;
  name:    string;
  author?: string;
  version?:string;
  suffix:  string;       // e.g. "-blue"  → finder-blue.png
  color:   string;       // preview swatch color
  thumb?:  string;       // optional preview image URL
  baseUrl: string;       // resolved base URL for this pack's icons
  icons:   string[];     // list of icon base names available
}

const PACK_STORAGE_KEY  = "macos_icon_pack_v1";
const PACK_REPO_STORAGE = "macos_icon_pack_repo_v1";

// ── Hardcoded icon pack repository ──
const ICON_PACK_REPO_URL = "https://neelpatel112.github.io/Icons-pack-for-Macos-Tahoe-web";
const DOCK_ICON_NAMES = [
  "finder","launchpad","settings","safari","messages",
  "calendar","photos","reminders","notes","music",
  "appstore","notion","craft","trash",
];

// Built-in packs that don't need a remote repo
const BUILTIN_PACKS: IconPack[] = [
  {
    id: "default", name: "Default", suffix: "", color: "#8e8e93",
    baseUrl: "icons/", icons: DOCK_ICON_NAMES,
  },
  {
    id: "dark", name: "Dark", suffix: "-dark", color: "#1c1c1e",
    baseUrl: "dark-icons/", icons: DOCK_ICON_NAMES,
  },
];

class IconPackManager {
  private packs:      IconPack[]  = [...BUILTIN_PACKS];
  private activePack: IconPack    = BUILTIN_PACKS[0];
  private repoUrl:    string      = "";
  private panelEl:    HTMLElement | null = null;
  private listeners:  Array<() => void> = [];

  constructor() {
    this._loadSaved();
    // Auto-load from hardcoded repo on startup
    this.setRepoUrl(ICON_PACK_REPO_URL).catch(() => {
      // Silently fail — builtins still work
    });
  }

  // ── Load saved state ──
  private _loadSaved(): void {
    try {
      const savedPackId = localStorage.getItem(PACK_STORAGE_KEY);
      const savedRepo   = localStorage.getItem(PACK_REPO_STORAGE);
      if (savedRepo) this.repoUrl = savedRepo;

      // Apply saved pack after dock builds
      if (savedPackId && savedPackId !== "default") {
        // Try to apply after a short delay so dock icons are in DOM
        setTimeout(() => {
          const pack = this.packs.find(p => p.id === savedPackId);
          if (pack) this._applyPack(pack, false);
        }, 500);
      }
    } catch {}
  }

  subscribe(fn: () => void): void { this.listeners.push(fn); }
  private notify(): void { this.listeners.forEach(fn => fn()); }

  getPacks(): IconPack[]     { return this.packs; }
  getActivePack(): IconPack  { return this.activePack; }
  getRepoUrl(): string       { return this.repoUrl; }

  // ── Set repository URL and load packs.json ──
  async setRepoUrl(url: string): Promise<void> {
    // Normalize — strip trailing slash
    const base = url.replace(/\/$/, "");
    this.repoUrl = base;
    localStorage.setItem(PACK_REPO_STORAGE, base);

    try {
      const res   = await fetch(`${base}/packs.json`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Array<{ id:string; name:string; color:string; suffix:string; thumb?:string; author?:string; version?:string }> = await res.json();

      // Load each pack's pack.json for icon list
      const remotePacks: IconPack[] = [];
      for (const meta of data) {
        if (meta.id === "default") continue; // skip default
        try {
          const packRes  = await fetch(`${base}/${meta.id}/pack.json`);
          const packData = packRes.ok ? await packRes.json() : {};
          remotePacks.push({
            id:      meta.id,
            name:    meta.name,
            suffix:  meta.suffix ?? `-${meta.id}`,
            color:   meta.color ?? "#8e8e93",
            thumb:   meta.thumb ? `${base}/${meta.thumb}` : undefined,
            author:  packData.author ?? meta.author,
            version: packData.version ?? meta.version,
            baseUrl: `${base}/${meta.id}/`,
            icons:   packData.icons ?? DOCK_ICON_NAMES,
          });
        } catch {}
      }

      // Merge: keep builtins, add remote
      this.packs = [...BUILTIN_PACKS, ...remotePacks];
      this.notify();

      // Re-render panel if open
      if (this.panelEl) this._renderPanelContent();

    } catch (err) {
      throw new Error(`Could not load packs.json from ${base}\n\nMake sure:\n1. The URL is correct\n2. CORS is enabled on the repo (GitHub Pages works great)\n3. packs.json exists at the root`);
    }
  }

  // ── Apply a pack to the dock ──
  applyPack(packId: string): void {
    const pack = this.packs.find(p => p.id === packId);
    if (!pack) return;
    this._applyPack(pack, true);
  }

  private _applyPack(pack: IconPack, save: boolean): void {
    this.activePack = pack;
    if (save) localStorage.setItem(PACK_STORAGE_KEY, pack.id);

    const dockItems = document.querySelectorAll<HTMLElement>(".dock-item");
    dockItems.forEach(item => {
      const iconId = item.dataset.id;
      if (!iconId) return;

      const imgEl = item.querySelector<HTMLImageElement>("img");
      if (!imgEl) return;

      if (pack.id === "default") {
        // Restore original
        this._swapIcon(imgEl, `icons/${iconId}.png`, `icons/${iconId}.png`);
        return;
      }

      // Check if this icon exists in the pack
      const iconName = pack.icons.includes(iconId) ? iconId : null;
      if (!iconName) return;

      const newSrc = `${pack.baseUrl}${iconId}${pack.suffix}.png`;
      const fallback = `icons/${iconId}.png`;
      this._swapIcon(imgEl, newSrc, fallback);
    });

    // Also update dock glass for themed packs
    this._applyDockTheme(pack);
    this.notify();
  }

  private _swapIcon(img: HTMLImageElement, newSrc: string, fallback: string): void {
    img.style.transition = "opacity 0.2s ease";
    img.style.opacity    = "0";
    setTimeout(() => {
      const probe = new Image();
      probe.onload = () => {
        img.src = newSrc;
        img.style.opacity = "1";
      };
      probe.onerror = () => {
        img.src = fallback;
        img.style.opacity = "1";
      };
      probe.src = newSrc;
    }, 180);
  }

  private _applyDockTheme(pack: IconPack): void {
    const dock = document.getElementById("dock");
    if (!dock) return;
    if (pack.id === "default") {
      dock.style.transition = "background 0.4s ease, box-shadow 0.4s ease";
      dock.style.background = "";
      dock.style.boxShadow  = "";
      setTimeout(() => { dock.style.transition = ""; }, 450);
    }
  }

  // ─────────────────────────────────────────────
  //  Panel UI — floating panel on desktop
  // ─────────────────────────────────────────────
  openPanel(): void {
    if (this.panelEl) { this.panelEl.remove(); this.panelEl = null; return; }
    this.panelEl = document.createElement("div");
    this.panelEl.className = "ipm-panel";
    this.panelEl.id        = "iconPackPanel";
    document.getElementById("desktop")?.appendChild(this.panelEl);
    this._renderPanelContent();

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.panelEl?.classList.add("open"));
    });
  }

  closePanel(): void {
    if (!this.panelEl) return;
    this.panelEl.classList.remove("open");
    setTimeout(() => { this.panelEl?.remove(); this.panelEl = null; }, 250);
  }

  private _renderPanelContent(): void {
    if (!this.panelEl) return;
    this.panelEl.innerHTML = `
      <div class="ipm-header">
        <div class="ipm-title">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
          Icon Packs
        </div>
        <button class="ipm-close" id="ipmClose">✕</button>
      </div>

      <!-- Loading indicator -->
      <div class="ipm-loading" id="ipmLoading" style="display:none">
        <div class="ipm-spinner"></div>
        <span>Loading packs…</span>
      </div>

      <!-- Pack grid -->
      <div class="ipm-packs-label">Choose a Pack</div>
      <div class="ipm-packs-grid" id="ipmPacksGrid"></div>

      <!-- Active pack info -->
      <div class="ipm-active-row">
        <span class="ipm-active-label">Active:</span>
        <span class="ipm-active-name" id="ipmActiveName">${this.activePack.name}</span>
        <button class="ipm-reset-btn" id="ipmReset">Reset</button>
      </div>
    `;

    this._renderPackGrid();

    this.panelEl.querySelector("#ipmClose")?.addEventListener("click", () => this.closePanel());
    this.panelEl.querySelector("#ipmReset")?.addEventListener("click", () => {
      this.applyPack("default");
      this._renderPackGrid();
      const nameEl = this.panelEl?.querySelector<HTMLElement>("#ipmActiveName");
      if (nameEl) nameEl.textContent = "Default";
    });
  }

  private _renderPackGrid(): void {
    const grid = this.panelEl?.querySelector<HTMLElement>("#ipmPacksGrid");
    if (!grid) return;
    grid.innerHTML = "";

    this.packs.forEach(pack => {
      const card = document.createElement("button");
      card.className = "ipm-pack-card" + (pack.id === this.activePack.id ? " active" : "");
      card.innerHTML = `
        <div class="ipm-pack-preview" style="background:${pack.color}22;border-color:${pack.id === this.activePack.id ? pack.color : "transparent"}">
          ${pack.thumb
            ? `<img src="${pack.thumb}" class="ipm-pack-thumb" alt="${pack.name}" />`
            : `<div class="ipm-pack-swatch" style="background:${pack.color}"></div>`
          }
          ${pack.id === this.activePack.id ? `<div class="ipm-pack-check">✓</div>` : ""}
        </div>
        <div class="ipm-pack-name">${pack.name}</div>
        ${pack.author ? `<div class="ipm-pack-author">by ${pack.author}</div>` : ""}
      `;

      card.addEventListener("click", () => {
        this.applyPack(pack.id);
        this._renderPackGrid();
        const nameEl = this.panelEl?.querySelector<HTMLElement>("#ipmActiveName");
        if (nameEl) nameEl.textContent = pack.name;
      });

      grid.appendChild(card);
    });
  }
}

// ── Singleton + global registration ──
const __iconPackManager = new IconPackManager();
(window as any).__iconPackManager = __iconPackManager;

// ── Open panel via dock right-click or settings ──
(window as any).openIconPackPanel = () => __iconPackManager.openPanel();
