"use strict";
// ============================================================
//  Finder — finder-toolbar.ts
//  Top toolbar: back/fwd, view toggles, breadcrumb, search
// ============================================================
class FinderToolbar {
    constructor(cbs) {
        this.mode = "icons";
        this.historyLen = 0;
        this.historyPos = 0;
        this.cbs = cbs;
        this.el = document.createElement("div");
        this.el.className = "ff-toolbar";
        this._render();
    }
    setTitle(title, breadcrumb) {
        const titleEl = this.el.querySelector(".ff-tb-title");
        if (titleEl)
            titleEl.textContent = title;
        const bcEl = this.el.querySelector(".ff-breadcrumb");
        if (bcEl) {
            bcEl.innerHTML = breadcrumb.map((seg, i) => `<span class="ff-bc-seg${i === breadcrumb.length - 1 ? " active" : ""}">${seg}</span>`).join(`<span class="ff-bc-sep">›</span>`);
        }
    }
    setHistory(canBack, canForward) {
        this.el.querySelector(".ff-tb-back").disabled = !canBack;
        this.el.querySelector(".ff-tb-fwd").disabled = !canForward;
    }
    setViewMode(mode) {
        this.mode = mode;
        this.el.querySelectorAll(".ff-view-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === mode);
        });
    }
    _render() {
        this.el.innerHTML = `
      <!-- Left: back/fwd + title -->
      <div class="ff-tb-left">
        <button class="ff-tb-btn ff-tb-back" title="Back" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <button class="ff-tb-btn ff-tb-fwd" title="Forward" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
        <div class="ff-title-wrap">
          <div class="ff-tb-title">iCloud Drive</div>
          <div class="ff-breadcrumb"></div>
        </div>
      </div>

      <!-- Center: view mode toggles -->
      <div class="ff-tb-center">
        <div class="ff-view-group">
          <button class="ff-view-btn active" data-view="icons" title="Icon View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>
          </button>
          <button class="ff-view-btn" data-view="list" title="List View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          </button>
          <button class="ff-view-btn" data-view="columns" title="Column View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 18h17v-2H4v2zM4 13h17v-2H4v2zM3 6v2h18V6H3z"/></svg>
          </button>
          <button class="ff-view-btn" data-view="gallery" title="Gallery View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>
          </button>
        </div>
        <div class="ff-tb-divider"></div>
        <button class="ff-tb-btn" id="ffGroupBtn" title="Group By">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style="margin-left:1px"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <!-- Right: actions + search -->
      <div class="ff-tb-right">
        <button class="ff-tb-btn" id="ffShareBtn" title="Share">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
        </button>
        <button class="ff-tb-btn" id="ffTagBtn" title="Tags">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/></svg>
        </button>
        <button class="ff-tb-btn" id="ffMoreBtn" title="More options">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
        <button class="ff-tb-btn ff-search-btn" id="ffSearchToggle" title="Search">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <div class="ff-search-wrap" id="ffSearchWrap" style="display:none">
          <input type="text" class="ff-search-input" id="ffSearchInput" placeholder="Search" />
        </div>
      </div>
    `;
        // ── Wire events ──
        this.el.querySelector(".ff-tb-back")?.addEventListener("click", () => this.cbs.onBack());
        this.el.querySelector(".ff-tb-fwd")?.addEventListener("click", () => this.cbs.onForward());
        this.el.querySelectorAll(".ff-view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.view;
                this.setViewMode(mode);
                this.cbs.onViewChange(mode);
            });
        });
        document.getElementById("ffShareBtn")?.addEventListener("click", () => this.cbs.onShare());
        // More menu → new folder / new file
        document.getElementById("ffMoreBtn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this._showMoreMenu(e);
        });
        // Search toggle
        document.getElementById("ffSearchToggle")?.addEventListener("click", () => {
            const wrap = document.getElementById("ffSearchWrap");
            const visible = wrap.style.display !== "none";
            wrap.style.display = visible ? "none" : "flex";
            if (!visible) {
                const input = document.getElementById("ffSearchInput");
                input.focus();
                input.addEventListener("input", () => this.cbs.onSearch(input.value));
            }
            else {
                this.cbs.onSearch("");
            }
        });
    }
    _showMoreMenu(e) {
        document.getElementById("ff-more-menu")?.remove();
        const menu = document.createElement("div");
        menu.id = "ff-more-menu";
        menu.className = "ff-context-menu";
        menu.style.cssText = `position:fixed;left:${e.clientX - 120}px;top:${e.clientY + 8}px;z-index:99999`;
        menu.innerHTML = `
      <button class="ff-ctx-item" id="ffCtxNewFolder">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/></svg>
        New Folder
      </button>
      <button class="ff-ctx-item" id="ffCtxNewFile">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        New Text File
      </button>
      <div class="ff-ctx-sep"></div>
      <button class="ff-ctx-item" id="ffCtxGetInfo">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        Get Info
      </button>
    `;
        document.body.appendChild(menu);
        menu.querySelector("#ffCtxNewFolder")?.addEventListener("click", () => { menu.remove(); this.cbs.onNewFolder(); });
        menu.querySelector("#ffCtxNewFile")?.addEventListener("click", () => { menu.remove(); this.cbs.onNewFile(); });
        menu.querySelector("#ffCtxGetInfo")?.addEventListener("click", () => { menu.remove(); this.cbs.onGetInfo(); });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }
}
window.__FinderToolbar = FinderToolbar;
