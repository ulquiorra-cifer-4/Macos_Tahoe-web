"use strict";
// ============================================================
//  Photos App — photos-lightbox.ts
//  Full-screen photo viewer: zoom, pan, prev/next, info, share
// ============================================================
class PhotosLightbox {
    constructor(cbs) {
        this.photos = [];
        this.index = 0;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.panning = false;
        this.panStart = { x: 0, y: 0, px: 0, py: 0 };
        this.showInfo = false;
        this.store = window.__photosStore;
        this.cbs = cbs;
        this.el = document.createElement("div");
        this.el.className = "ph-lb";
        this.el.tabIndex = 0;
        this._buildShell();
        this._bindKeys();
    }
    open(photoId, allPhotos) {
        this.photos = allPhotos;
        this.index = allPhotos.findIndex(p => p.id === photoId);
        if (this.index === -1)
            this.index = 0;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.el.classList.add("open");
        this._loadCurrent();
        requestAnimationFrame(() => this.el.focus());
    }
    close() {
        this.el.classList.remove("open");
        this.cbs.onClose();
    }
    _buildShell() {
        this.el.innerHTML = `
      <!-- Backdrop -->
      <div class="ph-lb-backdrop" id="phLbBackdrop"></div>

      <!-- Top toolbar -->
      <div class="ph-lb-toolbar">
        <button class="ph-lb-btn" id="phLbClose" title="Close (Esc)">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
        <div class="ph-lb-toolbar-center">
          <span class="ph-lb-counter" id="phLbCounter">1 of 50</span>
        </div>
        <div class="ph-lb-toolbar-right">
          <button class="ph-lb-btn" id="phLbFav" title="Favourite">
            <svg viewBox="0 0 24 24" width="18" height="18" id="phLbFavIcon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="ph-lb-btn" id="phLbWall" title="Set as Wallpaper">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-8.5-4L9 11l-3 4h12l-3.5-4.5z"/></svg>
          </button>
          <button class="ph-lb-btn" id="phLbShare" title="Share">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </button>
          <button class="ph-lb-btn" id="phLbInfo" title="Info">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </button>
          <button class="ph-lb-btn" id="phLbZoomIn" title="Zoom In">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H8v-2H6V8h2V6h2v2h2v2z"/></svg>
          </button>
          <button class="ph-lb-btn" id="phLbZoomOut" title="Zoom Out">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>
          </button>
        </div>
      </div>

      <!-- Prev / Next arrows -->
      <button class="ph-lb-nav ph-lb-prev" id="phLbPrev">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      <button class="ph-lb-nav ph-lb-next" id="phLbNext">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
      </button>

      <!-- Main image area -->
      <div class="ph-lb-stage" id="phLbStage">
        <img class="ph-lb-img" id="phLbImg" alt="" />
      </div>

      <!-- Info panel -->
      <div class="ph-lb-info-panel" id="phLbInfoPanel">
        <div class="ph-lb-info-title" id="phLbInfoTitle">Photo Info</div>
        <div class="ph-lb-info-grid" id="phLbInfoGrid"></div>
      </div>

      <!-- Film strip at bottom -->
      <div class="ph-lb-strip" id="phLbStrip"></div>
    `;
        // Wire buttons
        this.el.querySelector("#phLbClose")?.addEventListener("click", () => this.close());
        this.el.querySelector("#phLbBackdrop")?.addEventListener("click", () => this.close());
        this.el.querySelector("#phLbPrev")?.addEventListener("click", () => this._prev());
        this.el.querySelector("#phLbNext")?.addEventListener("click", () => this._next());
        this.el.querySelector("#phLbZoomIn")?.addEventListener("click", () => this._zoomBy(0.5));
        this.el.querySelector("#phLbZoomOut")?.addEventListener("click", () => this._zoomBy(-0.5));
        this.el.querySelector("#phLbInfo")?.addEventListener("click", () => this._toggleInfo());
        this.el.querySelector("#phLbFav")?.addEventListener("click", () => {
            const p = this.photos[this.index];
            if (p) {
                this.cbs.onFavorite(p.id);
                this._updateFavIcon();
            }
        });
        this.el.querySelector("#phLbWall")?.addEventListener("click", () => {
            const p = this.photos[this.index];
            if (p)
                this.cbs.onSetWallpaper(p.src);
        });
        this.el.querySelector("#phLbShare")?.addEventListener("click", () => {
            const p = this.photos[this.index];
            if (p && navigator.share)
                navigator.share({ url: p.src });
            else
                navigator.clipboard?.writeText(window.location.href);
        });
        // Zoom wheel
        this.el.querySelector("#phLbStage")?.addEventListener("wheel", (e) => {
            const we = e;
            we.preventDefault();
            this._zoomBy(we.deltaY < 0 ? 0.2 : -0.2);
        }, { passive: false });
        // Pan
        this._bindPan();
    }
    _loadCurrent() {
        const photo = this.photos[this.index];
        if (!photo)
            return;
        const img = this.el.querySelector("#phLbImg");
        const counter = this.el.querySelector("#phLbCounter");
        const strip = this.el.querySelector("#phLbStrip");
        // Fade transition
        img.style.opacity = "0";
        img.style.transform = `translate(${this.panX}px,${this.panY}px) scale(${this.zoom})`;
        img.src = photo.src;
        img.onload = () => {
            img.style.transition = "opacity 0.2s ease, transform 0.25s cubic-bezier(0.34,1.4,0.64,1)";
            img.style.opacity = "1";
            img.style.transform = `translate(0px,0px) scale(1)`;
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            setTimeout(() => { img.style.transition = ""; }, 260);
        };
        img.onerror = () => { img.style.opacity = "1"; };
        counter.textContent = `${this.index + 1} of ${this.photos.length}`;
        // Prev/Next visibility
        const prev = this.el.querySelector("#phLbPrev");
        const next = this.el.querySelector("#phLbNext");
        prev.style.opacity = this.index > 0 ? "" : "0.2";
        prev.style.pointerEvents = this.index > 0 ? "" : "none";
        next.style.opacity = this.index < this.photos.length - 1 ? "" : "0.2";
        next.style.pointerEvents = this.index < this.photos.length - 1 ? "" : "none";
        this._updateFavIcon();
        this._updateInfoPanel(photo);
        this._buildStrip(strip);
    }
    _updateFavIcon() {
        const photo = this.photos[this.index];
        if (!photo)
            return;
        const icon = this.el.querySelector("#phLbFavIcon path");
        if (icon) {
            icon.setAttribute("fill", photo.favorite ? "#ff375f" : "none");
            icon.setAttribute("stroke", photo.favorite ? "#ff375f" : "currentColor");
        }
    }
    _updateInfoPanel(photo) {
        const grid = this.el.querySelector("#phLbInfoGrid");
        const d = photo.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        grid.innerHTML = `
      <div class="ph-info-row"><span>Date</span><span>${d}</span></div>
      <div class="ph-info-row"><span>Location</span><span>${photo.location ?? "Unknown"}</span></div>
      <div class="ph-info-row"><span>Type</span><span>${photo.mediaType}</span></div>
      <div class="ph-info-row"><span>File</span><span>${photo.src}</span></div>
      ${photo.favorite ? `<div class="ph-info-row"><span>❤️</span><span>Favourite</span></div>` : ""}
    `;
    }
    _buildStrip(strip) {
        strip.innerHTML = "";
        const start = Math.max(0, this.index - 5);
        const end = Math.min(this.photos.length - 1, this.index + 5);
        for (let i = start; i <= end; i++) {
            const p = this.photos[i];
            const thumb = document.createElement("div");
            thumb.className = "ph-strip-thumb" + (i === this.index ? " active" : "");
            thumb.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy" />`;
            thumb.addEventListener("click", () => { this.index = i; this._loadCurrent(); });
            strip.appendChild(thumb);
        }
    }
    _prev() {
        if (this.index > 0) {
            this.index--;
            this._loadCurrent();
        }
    }
    _next() {
        if (this.index < this.photos.length - 1) {
            this.index++;
            this._loadCurrent();
        }
    }
    _zoomBy(delta) {
        this.zoom = Math.max(0.5, Math.min(5, this.zoom + delta));
        const img = this.el.querySelector("#phLbImg");
        img.style.transition = "transform 0.15s ease";
        img.style.transform = `translate(${this.panX}px,${this.panY}px) scale(${this.zoom})`;
        setTimeout(() => { img.style.transition = ""; }, 160);
    }
    _bindPan() {
        const stage = this.el.querySelector("#phLbStage");
        stage.addEventListener("mousedown", (e) => {
            if (this.zoom <= 1)
                return;
            this.panning = true;
            this.panStart = { x: e.clientX, y: e.clientY, px: this.panX, py: this.panY };
            stage.style.cursor = "grabbing";
        });
        document.addEventListener("mousemove", (e) => {
            if (!this.panning)
                return;
            this.panX = this.panStart.px + (e.clientX - this.panStart.x);
            this.panY = this.panStart.py + (e.clientY - this.panStart.y);
            const img = this.el.querySelector("#phLbImg");
            img.style.transform = `translate(${this.panX}px,${this.panY}px) scale(${this.zoom})`;
        });
        document.addEventListener("mouseup", () => {
            this.panning = false;
            stage.style.cursor = "";
        });
    }
    _toggleInfo() {
        this.showInfo = !this.showInfo;
        this.el.querySelector("#phLbInfoPanel")?.classList.toggle("visible", this.showInfo);
        this.el.querySelector("#phLbInfo")?.classList.toggle("active", this.showInfo);
    }
    _bindKeys() {
        this.el.addEventListener("keydown", (e) => {
            if (!this.el.classList.contains("open"))
                return;
            switch (e.key) {
                case "ArrowLeft":
                    this._prev();
                    break;
                case "ArrowRight":
                    this._next();
                    break;
                case "Escape":
                    this.close();
                    break;
                case "+":
                case "=":
                    this._zoomBy(0.3);
                    break;
                case "-":
                    this._zoomBy(-0.3);
                    break;
                case "i":
                    this._toggleInfo();
                    break;
                case "f": {
                    const p = this.photos[this.index];
                    if (p) {
                        this.cbs.onFavorite(p.id);
                        this._updateFavIcon();
                    }
                    break;
                }
                case "w": {
                    const p = this.photos[this.index];
                    if (p)
                        this.cbs.onSetWallpaper(p.src);
                    break;
                }
            }
        });
    }
}
window.__PhotosLightbox = PhotosLightbox;
