// ============================================================
//  Photos App — photos-grid.ts
//  Masonry photo grid with date groups, view modes, hover actions
// ============================================================

type PhotoViewMode = "all" | "months" | "years";
type FilterMode    = "all" | "favorites" | "videos" | "selfies" | "portraits" | "panoramas" | "livePhotos" | "bursts";

interface PhotoGridCallbacks {
  onPhotoOpen:     (id: number) => void;
  onFavoriteToggle:(id: number) => void;
  onSetWallpaper:  (src: string) => void;
  onPhotoSelect:   (ids: Set<number>) => void;
}

class PhotosGrid {
  el:              HTMLElement;
  private store:   any;
  private cbs:     PhotoGridCallbacks;
  private viewMode: PhotoViewMode = "all";
  private filter:   FilterMode    = "all";
  private selected: Set<number>   = new Set();
  private zoomLevel = 3; // 1=small … 5=large

  constructor(cbs: PhotoGridCallbacks) {
    this.store = (window as any).__photosStore;
    this.cbs   = cbs;
    this.el    = document.createElement("div");
    this.el.className = "ph-grid-wrap";
    this._render();
  }

  setViewMode(mode: PhotoViewMode): void { this.viewMode = mode; this._render(); }
  setFilter(filter: FilterMode): void    { this.filter   = filter; this._render(); }
  setZoom(level: number): void           { this.zoomLevel = Math.max(1, Math.min(5, level)); this._render(); }
  refresh(): void                        { this._render(); }

  showSearchResults(photos: any[]): void {
    this.el.innerHTML = "";
    if (!photos.length) {
      this.el.innerHTML = `<div class="ph-empty"><div class="ph-empty-icon">🔍</div><p>No results</p></div>`;
      return;
    }
    const group = document.createElement("div");
    group.className = "ph-group";
    group.innerHTML = `<div class="ph-group-header">Search Results · ${photos.length} photo${photos.length !== 1 ? "s" : ""}</div>`;
    const grid = this._makeGrid(photos);
    group.appendChild(grid);
    this.el.appendChild(group);
  }

  private _getPhotos(): any[] {
    let photos = this.store.getAll();
    switch (this.filter) {
      case "favorites":  photos = this.store.getFavorites(); break;
      case "videos":     photos = this.store.getByMediaType("video"); break;
      case "selfies":    photos = this.store.getByMediaType("selfie"); break;
      case "portraits":  photos = this.store.getByMediaType("portrait"); break;
      case "panoramas":  photos = this.store.getByMediaType("panorama"); break;
      case "livePhotos": photos = this.store.getByMediaType("livePhoto"); break;
      case "bursts":     photos = this.store.getByMediaType("burst"); break;
    }
    return photos;
  }

  private _render(): void {
    this.el.innerHTML = "";
    const photos = this._getPhotos();

    if (!photos.length) {
      this.el.innerHTML = `<div class="ph-empty"><div class="ph-empty-icon">📷</div><p>No Photos</p></div>`;
      return;
    }

    if (this.viewMode === "years") {
      this._renderYears(photos);
    } else if (this.viewMode === "months") {
      this._renderMonths(photos);
    } else {
      this._renderAll(photos);
    }
  }

  private _renderAll(photos: any[]): void {
    const groups = this.store.groupByDate(photos);
    groups.forEach((groupPhotos: any[], dateLabel: string) => {
      const group = document.createElement("div");
      group.className = "ph-group";

      const header = document.createElement("div");
      header.className = "ph-group-header";
      header.innerHTML = `
        <span class="ph-group-date">${dateLabel}</span>
        <span class="ph-group-count">${groupPhotos.length}</span>
      `;
      group.appendChild(header);
      group.appendChild(this._makeGrid(groupPhotos));
      this.el.appendChild(group);
    });
  }

  private _renderMonths(photos: any[]): void {
    const groups = this.store.groupByMonth(photos);
    groups.forEach((groupPhotos: any[], label: string) => {
      const group = document.createElement("div");
      group.className = "ph-group ph-group-month";

      const header = document.createElement("div");
      header.className = "ph-group-header ph-group-header-large";
      header.innerHTML = `<span class="ph-group-date">${label}</span><span class="ph-group-count">${groupPhotos.length}</span>`;
      group.appendChild(header);
      group.appendChild(this._makeGrid(groupPhotos));
      this.el.appendChild(group);
    });
  }

  private _renderYears(photos: any[]): void {
    const groups = this.store.groupByYear(photos);
    groups.forEach((groupPhotos: any[], year: string) => {
      const group = document.createElement("div");
      group.className = "ph-group ph-group-year";

      const header = document.createElement("div");
      header.className = "ph-group-header ph-group-header-xl";
      header.textContent = year;
      group.appendChild(header);

      // Year view: show large cover + smaller grid
      const yearGrid = document.createElement("div");
      yearGrid.className = "ph-year-grid";

      groupPhotos.slice(0, 12).forEach((photo: any) => {
        const cell = this._makePhotoCell(photo, "large");
        yearGrid.appendChild(cell);
      });

      group.appendChild(yearGrid);
      this.el.appendChild(group);
    });
  }

  private _makeGrid(photos: any[]): HTMLElement {
    const sizePx = this._zoomToPx();
    const grid = document.createElement("div");
    grid.className = "ph-masonry";
    grid.style.setProperty("--ph-size", sizePx + "px");

    photos.forEach((photo: any) => {
      const cell = this._makePhotoCell(photo, "normal");
      grid.appendChild(cell);
    });

    return grid;
  }

  private _makePhotoCell(photo: any, size: "normal" | "large"): HTMLElement {
    const cell = document.createElement("div");
    cell.className = "ph-cell" + (size === "large" ? " ph-cell-large" : "") +
      (this.selected.has(photo.id) ? " selected" : "");
    cell.dataset.id = String(photo.id);

    // Aspect ratio box
    const ratio = photo.height / photo.width;
    cell.style.setProperty("--ratio", String(ratio));

    // ── Lazy image — src set ONLY when cell enters viewport ──
    const img = document.createElement("img");
    img.className = "ph-img";
    img.decoding  = "async";                 // non-blocking decode
    img.alt       = photo.location ?? "";
    img.dataset.src = photo.thumb;           // store real src in data attr
    img.onerror   = () => {
      cell.classList.add("ph-placeholder");
      img.style.display = "none";
    };

    // IntersectionObserver — load only when visible
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const dataSrc = img.dataset.src;
        if (dataSrc) img.src = dataSrc;
        observer.unobserve(img);
      });
    }, { rootMargin: "200px" });   // start loading 200px before entering view
    obs.observe(img);

    // Hover overlay
    const overlay = document.createElement("div");
    overlay.className = "ph-overlay";

    // Favorite button
    const favBtn = document.createElement("button");
    favBtn.className = "ph-fav-btn" + (photo.favorite ? " active" : "");
    favBtn.title = photo.favorite ? "Remove from Favourites" : "Add to Favourites";
    favBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${photo.favorite ? "#ff375f" : "none"}" stroke="${photo.favorite ? "#ff375f" : "rgba(255,255,255,0.9)"}" stroke-width="1.5"/></svg>`;
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cbs.onFavoriteToggle(photo.id);
      this._render(); // re-render to update heart
    });

    // Selection circle
    const selCircle = document.createElement("button");
    selCircle.className = "ph-sel-circle" + (this.selected.has(photo.id) ? " checked" : "");
    selCircle.addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleSelect(photo.id);
    });

    overlay.append(favBtn, selCircle);

    // Media type badge
    if (photo.mediaType !== "photo") {
      const badge = document.createElement("div");
      badge.className = "ph-badge";
      badge.textContent = this._badgeLabel(photo.mediaType);
      cell.appendChild(badge);
    }

    cell.append(img, overlay);

    // Click = open lightbox
    cell.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".ph-fav-btn, .ph-sel-circle")) return;
      if (e.metaKey || e.ctrlKey) {
        this._toggleSelect(photo.id);
        return;
      }
      this.cbs.onPhotoOpen(photo.id);
    });

    // Right-click context menu
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this._showContextMenu(e as MouseEvent, photo);
    });

    return cell;
  }

  private _toggleSelect(id: number): void {
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
    this.el.querySelectorAll<HTMLElement>(`[data-id="${id}"]`).forEach(el => {
      el.classList.toggle("selected", this.selected.has(id));
      const circle = el.querySelector<HTMLElement>(".ph-sel-circle");
      if (circle) circle.classList.toggle("checked", this.selected.has(id));
    });
    this.cbs.onPhotoSelect(this.selected);
  }

  private _showContextMenu(e: MouseEvent, photo: any): void {
    document.getElementById("ph-ctx")?.remove();
    const menu = document.createElement("div");
    menu.id = "ph-ctx";
    menu.className = "ph-context-menu";
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;
    menu.innerHTML = `
      <button class="ph-ctx-item" id="phcOpen">Open</button>
      <button class="ph-ctx-item" id="phcFav">${photo.favorite ? "Remove Favourite" : "Add to Favourites"}</button>
      <button class="ph-ctx-item" id="phcWall">Set as Wallpaper</button>
      <div class="ph-ctx-sep"></div>
      <button class="ph-ctx-item" id="phcCopy">Copy Photo</button>
      <button class="ph-ctx-item" id="phcInfo">Get Info</button>
      <div class="ph-ctx-sep"></div>
      <button class="ph-ctx-item ph-ctx-danger" id="phcDel">Delete Photo</button>
    `;
    document.body.appendChild(menu);

    menu.querySelector("#phcOpen") ?.addEventListener("click", () => { menu.remove(); this.cbs.onPhotoOpen(photo.id); });
    menu.querySelector("#phcFav")  ?.addEventListener("click", () => { menu.remove(); this.cbs.onFavoriteToggle(photo.id); this._render(); });
    menu.querySelector("#phcWall") ?.addEventListener("click", () => { menu.remove(); this.cbs.onSetWallpaper(photo.src); });
    menu.querySelector("#phcInfo") ?.addEventListener("click", () => { menu.remove(); this._showInfo(photo); });
    menu.querySelector("#phcCopy") ?.addEventListener("click", () => { menu.remove(); });
    menu.querySelector("#phcDel")  ?.addEventListener("click", () => { menu.remove(); alert("Delete: " + photo.src + " (demo — file not removed from disk)"); });

    const close = (ev: MouseEvent) => {
      if (!menu.contains(ev.target as Node)) { menu.remove(); document.removeEventListener("mousedown", close); }
    };
    setTimeout(() => document.addEventListener("mousedown", close), 50);
  }

  private _showInfo(photo: any): void {
    const d = photo.date.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    alert(`Photo ${photo.id}\nDate: ${d}\nLocation: ${photo.location ?? "Unknown"}\nType: ${photo.mediaType}\n${photo.favorite ? "❤️ Favourite" : ""}`);
  }

  private _zoomToPx(): number {
    const sizes = [80, 120, 160, 220, 300];
    return sizes[this.zoomLevel - 1] ?? 160;
  }

  private _badgeLabel(type: string): string {
    const map: Record<string, string> = {
      video: "▶", selfie: "😊", panorama: "⬛", portrait: "⬜",
      livePhoto: "⬡", burst: "≡",
    };
    return map[type] ?? "";
  }
}

(window as any).__PhotosGrid = PhotosGrid;
