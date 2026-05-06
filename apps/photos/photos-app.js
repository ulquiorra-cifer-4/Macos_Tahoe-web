"use strict";
// ============================================================
//  Photos App — photos-app.ts
//  Assembles sidebar + toolbar + grid + lightbox
// ============================================================
class PhotosApp {
    constructor() {
        this.viewMode = "all";
        this.currentPhotos = [];
        this.selectedCount = 0;
        this.store = window.__photosStore;
        this.el = document.createElement("div");
        this.el.className = "photos-app";
        this._build();
        this.store.subscribe(() => {
            this.currentPhotos = this.store.getAll();
            this.grid.refresh();
        });
    }
    _build() {
        // ── Sidebar ──
        this.sidebar = new window.__PhotosSidebar({
            onSection: (section) => this._handleSection(section),
        });
        // ── Main area ──
        const main = document.createElement("div");
        main.className = "ph-main";
        // Toolbar
        const toolbar = this._buildToolbar();
        // Grid
        this.currentPhotos = this.store.getAll();
        this.grid = new window.__PhotosGrid({
            onPhotoOpen: (id) => this._openLightbox(id),
            onFavoriteToggle: (id) => this.store.toggleFavorite(id),
            onSetWallpaper: (src) => this._setWallpaper(src),
            onPhotoSelect: (ids) => {
                this.selectedCount = ids.size;
                this._updateStatus(ids.size);
            },
        });
        const gridScroll = document.createElement("div");
        gridScroll.className = "ph-grid-scroll";
        gridScroll.appendChild(this.grid.el);
        // Status bar
        const statusBar = document.createElement("div");
        statusBar.className = "ph-statusbar";
        statusBar.id = "phStatusBar";
        statusBar.textContent = `${this.currentPhotos.length} Photos`;
        main.append(toolbar, gridScroll, statusBar);
        // ── Lightbox ──
        this.lightbox = new window.__PhotosLightbox({
            onClose: () => { },
            onFavorite: (id) => this.store.toggleFavorite(id),
            onSetWallpaper: (src) => this._setWallpaper(src),
        });
        this.el.appendChild(this.lightbox.el);
        // ── Layout ──
        const body = document.createElement("div");
        body.className = "ph-body";
        body.append(this.sidebar.el, main);
        this.el.appendChild(body);
    }
    _buildToolbar() {
        const tb = document.createElement("div");
        tb.className = "ph-toolbar";
        // Left: zoom slider
        const left = document.createElement("div");
        left.className = "ph-tb-left";
        left.innerHTML = `
      <button class="ph-tb-btn" id="phZoomOut" title="Zoom Out">
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 13H5v-2h14v2z"/></svg>
      </button>
      <input type="range" class="ph-zoom-slider" id="phZoomSlider" min="1" max="5" value="3" step="1" />
      <button class="ph-tb-btn" id="phZoomIn" title="Zoom In">
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      </button>
    `;
        // Center: Years / Months / All Photos tabs
        const center = document.createElement("div");
        center.className = "ph-tb-center";
        center.innerHTML = `
      <div class="ph-view-tabs">
        <button class="ph-view-tab" data-mode="years">Years</button>
        <button class="ph-view-tab" data-mode="months">Months</button>
        <button class="ph-view-tab active" data-mode="all">All Photos</button>
      </div>
    `;
        // Right: info, share, like, etc.
        const right = document.createElement("div");
        right.className = "ph-tb-right";
        right.innerHTML = `
      <button class="ph-tb-btn" id="phInfo" title="Info">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </button>
      <button class="ph-tb-btn" id="phShare" title="Share">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
      </button>
      <button class="ph-tb-btn" id="phFavTb" title="Favourites">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <button class="ph-tb-btn" id="phGrid" title="Grid">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>
      </button>

      <!-- Filter By -->
      <div class="ph-filter-wrap" style="position:relative">
        <button class="ph-filter-btn" id="phFilterBtn">
          Filter By: <strong id="phFilterLabel">All Items</strong>
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <!-- Search -->
      <div class="ph-search-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="opacity:.4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" class="ph-search-input" id="phSearch" placeholder="Search" />
      </div>
    `;
        tb.append(left, center, right);
        // ── Wire toolbar ──
        requestAnimationFrame(() => {
            // Zoom
            document.getElementById("phZoomSlider")?.addEventListener("input", (e) => {
                this.grid.setZoom(+e.target.value);
            });
            document.getElementById("phZoomIn")?.addEventListener("click", () => {
                const sl = document.getElementById("phZoomSlider");
                sl.value = String(Math.min(5, +sl.value + 1));
                this.grid.setZoom(+sl.value);
            });
            document.getElementById("phZoomOut")?.addEventListener("click", () => {
                const sl = document.getElementById("phZoomSlider");
                sl.value = String(Math.max(1, +sl.value - 1));
                this.grid.setZoom(+sl.value);
            });
            // View tabs
            tb.querySelectorAll(".ph-view-tab").forEach(tab => {
                tab.addEventListener("click", () => {
                    tb.querySelectorAll(".ph-view-tab").forEach(t => t.classList.remove("active"));
                    tab.classList.add("active");
                    this.viewMode = tab.dataset.mode;
                    this.grid.setViewMode(this.viewMode);
                });
            });
            // Filter
            document.getElementById("phFilterBtn")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this._showFilterMenu(e);
            });
            // Search
            const searchInput = document.getElementById("phSearch");
            searchInput?.addEventListener("input", () => {
                const q = searchInput.value.trim();
                if (!q) {
                    this.grid.setViewMode(this.viewMode);
                }
                else {
                    const results = this.store.search(q);
                    this.grid.showSearchResults(results);
                    this._updateStatus(0, `${results.length} results`);
                }
            });
        });
        return tb;
    }
    _showFilterMenu(e) {
        document.getElementById("ph-filter-menu")?.remove();
        const btn = document.getElementById("phFilterBtn");
        const rect = btn.getBoundingClientRect();
        const menu = document.createElement("div");
        menu.id = "ph-filter-menu";
        menu.className = "ph-context-menu";
        menu.style.cssText = `position:fixed;right:${window.innerWidth - rect.right}px;top:${rect.bottom + 4}px;z-index:99999;min-width:160px`;
        const filters = [
            { label: "All Items", value: "all" },
            { label: "Favourites", value: "favorites" },
            { label: "Videos", value: "videos" },
            { label: "Selfies", value: "selfies" },
            { label: "Portraits", value: "portraits" },
            { label: "Panoramas", value: "panoramas" },
            { label: "Live Photos", value: "livePhotos" },
            { label: "Bursts", value: "bursts" },
        ];
        filters.forEach(f => {
            const item = document.createElement("button");
            item.className = "ph-ctx-item";
            item.textContent = f.label;
            item.addEventListener("click", () => {
                menu.remove();
                document.getElementById("phFilterLabel").textContent = f.label;
                this.grid.setFilter(f.value);
                this._updateStatus(0);
            });
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
        const close = (ev) => {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener("mousedown", close);
            }
        };
        setTimeout(() => document.addEventListener("mousedown", close), 50);
    }
    _handleSection(section) {
        if (typeof section === "object" && section.albumId) {
            const photos = this.store.getAlbumPhotos(section.albumId);
            this.grid.showSearchResults(photos);
            this._updateStatus(0, `${photos.length} photos`);
            return;
        }
        switch (section) {
            case "library":
                this.currentPhotos = this.store.getAll();
                this.grid.setFilter("all");
                this.grid.setViewMode(this.viewMode);
                this._updateStatus(0);
                break;
            case "favorites":
                this.grid.setFilter("favorites");
                this._updateStatus(0);
                break;
            case "recents": {
                const recent = this.store.getAll().slice(0, 20);
                this.grid.showSearchResults(recent);
                this._updateStatus(0, "Recently Saved");
                break;
            }
            case "videos":
                this.grid.setFilter("videos");
                break;
            case "selfies":
                this.grid.setFilter("selfies");
                break;
            case "portraits":
                this.grid.setFilter("portraits");
                break;
            case "panoramas":
                this.grid.setFilter("panoramas");
                break;
            case "livePhotos":
                this.grid.setFilter("livePhotos");
                break;
            case "bursts":
                this.grid.setFilter("bursts");
                break;
            default:
                this.currentPhotos = this.store.getAll();
                this.grid.setFilter("all");
                break;
        }
    }
    _openLightbox(id) {
        const photos = this.store.getAll();
        this.lightbox.open(id, photos);
    }
    _setWallpaper(src) {
        const wl = document.getElementById("wallpaperLayer");
        if (!wl)
            return;
        // If it's a file path, load as image
        if (!src.startsWith("data:")) {
            const img = new Image();
            img.onload = () => {
                wl.style.backgroundImage = `url(${src})`;
                wl.style.background = "";
                this._wallpaperToast();
            };
            img.onerror = () => alert("Could not load photo as wallpaper. Make sure the file exists in photos/");
            img.src = src;
        }
        else {
            wl.style.backgroundImage = `url(${src})`;
            this._wallpaperToast();
        }
    }
    _wallpaperToast() {
        document.getElementById("ph-wp-toast")?.remove();
        const toast = document.createElement("div");
        toast.id = "ph-wp-toast";
        toast.className = "dt-toast";
        toast.textContent = "Wallpaper set!";
        document.getElementById("desktop")?.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("visible"));
        setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 300); }, 1800);
    }
    _updateStatus(selectedCount, override) {
        const el = document.getElementById("phStatusBar");
        if (!el)
            return;
        if (override) {
            el.textContent = override;
            return;
        }
        if (selectedCount > 0) {
            el.textContent = `${selectedCount} Photo${selectedCount !== 1 ? "s" : ""} Selected`;
        }
        else {
            el.textContent = `${this.store.getAll().length} Photos`;
        }
    }
}
// ── Register globally ──
window.openPhotosWindow = function () {
    if (typeof window.__createWindow !== "function")
        return;
    window.__createWindow({
        appId: "photos",
        title: "Photos",
        width: 1020,
        height: 640,
        content: (_win) => {
            const app = new PhotosApp();
            return app.el;
        },
    });
};
