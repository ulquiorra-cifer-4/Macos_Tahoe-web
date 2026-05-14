"use strict";
// ============================================================
//  Icon Pack Manager — icon-pack-manager.ts
//  Loads icon packs from a separate repository URL,
//  applies them to dock icons with smooth crossfade
// ============================================================
const PACK_STORAGE_KEY = "macos_icon_pack_v1";
const PACK_REPO_STORAGE = "macos_icon_pack_repo_v1";
// Default icon names in the dock
const DOCK_ICON_NAMES = [
    "finder", "launchpad", "settings", "safari", "messages",
    "calendar", "photos", "reminders", "notes", "music",
    "appstore", "notion", "craft", "trash",
];
// Built-in packs that don't need a remote repo
const BUILTIN_PACKS = [
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
    constructor() {
        this.packs = [...BUILTIN_PACKS];
        this.activePack = BUILTIN_PACKS[0];
        this.repoUrl = "";
        this.panelEl = null;
        this.listeners = [];
        this._loadSaved();
    }
    // ── Load saved state ──
    _loadSaved() {
        try {
            const savedPackId = localStorage.getItem(PACK_STORAGE_KEY);
            const savedRepo = localStorage.getItem(PACK_REPO_STORAGE);
            if (savedRepo)
                this.repoUrl = savedRepo;
            // Apply saved pack after dock builds
            if (savedPackId && savedPackId !== "default") {
                // Try to apply after a short delay so dock icons are in DOM
                setTimeout(() => {
                    const pack = this.packs.find(p => p.id === savedPackId);
                    if (pack)
                        this._applyPack(pack, false);
                }, 500);
            }
        }
        catch { }
    }
    subscribe(fn) { this.listeners.push(fn); }
    notify() { this.listeners.forEach(fn => fn()); }
    getPacks() { return this.packs; }
    getActivePack() { return this.activePack; }
    getRepoUrl() { return this.repoUrl; }
    // ── Set repository URL and load packs.json ──
    async setRepoUrl(url) {
        // Normalize — strip trailing slash
        const base = url.replace(/\/$/, "");
        this.repoUrl = base;
        localStorage.setItem(PACK_REPO_STORAGE, base);
        try {
            const res = await fetch(`${base}/packs.json`);
            if (!res.ok)
                throw new Error(`${res.status}`);
            const data = await res.json();
            // Load each pack's pack.json for icon list
            const remotePacks = [];
            for (const meta of data) {
                if (meta.id === "default")
                    continue; // skip default
                try {
                    const packRes = await fetch(`${base}/${meta.id}/pack.json`);
                    const packData = packRes.ok ? await packRes.json() : {};
                    remotePacks.push({
                        id: meta.id,
                        name: meta.name,
                        suffix: meta.suffix ?? `-${meta.id}`,
                        color: meta.color ?? "#8e8e93",
                        thumb: meta.thumb ? `${base}/${meta.thumb}` : undefined,
                        author: packData.author ?? meta.author,
                        version: packData.version ?? meta.version,
                        baseUrl: `${base}/${meta.id}/`,
                        icons: packData.icons ?? DOCK_ICON_NAMES,
                    });
                }
                catch { }
            }
            // Merge: keep builtins, add remote
            this.packs = [...BUILTIN_PACKS, ...remotePacks];
            this.notify();
            // Re-render panel if open
            if (this.panelEl)
                this._renderPanelContent();
        }
        catch (err) {
            throw new Error(`Could not load packs.json from ${base}\n\nMake sure:\n1. The URL is correct\n2. CORS is enabled on the repo (GitHub Pages works great)\n3. packs.json exists at the root`);
        }
    }
    // ── Apply a pack to the dock ──
    applyPack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (!pack)
            return;
        this._applyPack(pack, true);
    }
    _applyPack(pack, save) {
        this.activePack = pack;
        if (save)
            localStorage.setItem(PACK_STORAGE_KEY, pack.id);
        const dockItems = document.querySelectorAll(".dock-item");
        dockItems.forEach(item => {
            const iconId = item.dataset.id;
            if (!iconId)
                return;
            const imgEl = item.querySelector("img");
            if (!imgEl)
                return;
            if (pack.id === "default") {
                // Restore original
                this._swapIcon(imgEl, `icons/${iconId}.png`, `icons/${iconId}.png`);
                return;
            }
            // Check if this icon exists in the pack
            const iconName = pack.icons.includes(iconId) ? iconId : null;
            if (!iconName)
                return;
            const newSrc = `${pack.baseUrl}${iconId}${pack.suffix}.png`;
            const fallback = `icons/${iconId}.png`;
            this._swapIcon(imgEl, newSrc, fallback);
        });
        // Also update dock glass for themed packs
        this._applyDockTheme(pack);
        this.notify();
    }
    _swapIcon(img, newSrc, fallback) {
        img.style.transition = "opacity 0.2s ease";
        img.style.opacity = "0";
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
    _applyDockTheme(pack) {
        const dock = document.getElementById("dock");
        if (!dock)
            return;
        if (pack.id === "default") {
            dock.style.transition = "background 0.4s ease, box-shadow 0.4s ease";
            dock.style.background = "";
            dock.style.boxShadow = "";
            setTimeout(() => { dock.style.transition = ""; }, 450);
        }
    }
    // ─────────────────────────────────────────────
    //  Panel UI — floating panel on desktop
    // ─────────────────────────────────────────────
    openPanel() {
        if (this.panelEl) {
            this.panelEl.remove();
            this.panelEl = null;
            return;
        }
        this.panelEl = document.createElement("div");
        this.panelEl.className = "ipm-panel";
        this.panelEl.id = "iconPackPanel";
        document.getElementById("desktop")?.appendChild(this.panelEl);
        this._renderPanelContent();
        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => this.panelEl?.classList.add("open"));
        });
    }
    closePanel() {
        if (!this.panelEl)
            return;
        this.panelEl.classList.remove("open");
        setTimeout(() => { this.panelEl?.remove(); this.panelEl = null; }, 250);
    }
    _renderPanelContent() {
        if (!this.panelEl)
            return;
        this.panelEl.innerHTML = `
      <div class="ipm-header">
        <div class="ipm-title">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
          Icon Packs
        </div>
        <button class="ipm-close" id="ipmClose">✕</button>
      </div>

      <!-- Repo URL input -->
      <div class="ipm-repo-section">
        <label class="ipm-repo-label">Icon Pack Repository URL</label>
        <div class="ipm-repo-row">
          <input type="text" class="ipm-repo-input" id="ipmRepoUrl"
            placeholder="https://your-github-pages.io/macos-icon-packs"
            value="${this.repoUrl}" />
          <button class="ipm-repo-btn" id="ipmLoadRepo">Load</button>
        </div>
        <div class="ipm-repo-hint">
          Paste your GitHub Pages URL hosting the icon packs repo
        </div>
      </div>

      <!-- Pack grid -->
      <div class="ipm-packs-label">Available Packs</div>
      <div class="ipm-packs-grid" id="ipmPacksGrid"></div>

      <!-- Active pack info -->
      <div class="ipm-active-row" id="ipmActiveRow">
        <span class="ipm-active-label">Active:</span>
        <span class="ipm-active-name" id="ipmActiveName">${this.activePack.name}</span>
        <button class="ipm-reset-btn" id="ipmReset">Reset to Default</button>
      </div>
    `;
        this._renderPackGrid();
        // Events
        this.panelEl.querySelector("#ipmClose")?.addEventListener("click", () => this.closePanel());
        this.panelEl.querySelector("#ipmLoadRepo")?.addEventListener("click", async () => {
            const input = this.panelEl?.querySelector("#ipmRepoUrl");
            const url = input?.value.trim();
            if (!url)
                return;
            const btn = this.panelEl?.querySelector("#ipmLoadRepo");
            if (btn) {
                btn.textContent = "Loading…";
                btn.disabled = true;
            }
            try {
                await this.setRepoUrl(url);
                if (btn) {
                    btn.textContent = "✓ Loaded";
                }
                setTimeout(() => { if (btn) {
                    btn.textContent = "Load";
                    btn.disabled = false;
                } }, 2000);
            }
            catch (err) {
                if (btn) {
                    btn.textContent = "Load";
                    btn.disabled = false;
                }
                alert(err.message);
            }
        });
        this.panelEl.querySelector("#ipmReset")?.addEventListener("click", () => {
            this.applyPack("default");
            this._renderPackGrid();
            const nameEl = this.panelEl?.querySelector("#ipmActiveName");
            if (nameEl)
                nameEl.textContent = "Default";
        });
    }
    _renderPackGrid() {
        const grid = this.panelEl?.querySelector("#ipmPacksGrid");
        if (!grid)
            return;
        grid.innerHTML = "";
        this.packs.forEach(pack => {
            const card = document.createElement("button");
            card.className = "ipm-pack-card" + (pack.id === this.activePack.id ? " active" : "");
            card.innerHTML = `
        <div class="ipm-pack-preview" style="background:${pack.color}22;border-color:${pack.id === this.activePack.id ? pack.color : "transparent"}">
          ${pack.thumb
                ? `<img src="${pack.thumb}" class="ipm-pack-thumb" alt="${pack.name}" />`
                : `<div class="ipm-pack-swatch" style="background:${pack.color}"></div>`}
          ${pack.id === this.activePack.id ? `<div class="ipm-pack-check">✓</div>` : ""}
        </div>
        <div class="ipm-pack-name">${pack.name}</div>
        ${pack.author ? `<div class="ipm-pack-author">by ${pack.author}</div>` : ""}
      `;
            card.addEventListener("click", () => {
                this.applyPack(pack.id);
                this._renderPackGrid();
                const nameEl = this.panelEl?.querySelector("#ipmActiveName");
                if (nameEl)
                    nameEl.textContent = pack.name;
            });
            grid.appendChild(card);
        });
    }
}
// ── Singleton + global registration ──
const __iconPackManager = new IconPackManager();
window.__iconPackManager = __iconPackManager;
// ── Open panel via dock right-click or settings ──
window.openIconPackPanel = () => __iconPackManager.openPanel();
