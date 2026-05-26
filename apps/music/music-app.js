"use strict";
// ============================================================
//  Music App — music-app.js  (v2)
//  Topbar with search replaces sidebar search (fixes traffic-light overlap)
//  Assembles: topbar + sidebar + content + playbar-wrapper
// ============================================================

class MusicApp {
  constructor() {
    this.store  = window.__musicStore;
    this.player = window.__musicPlayer;

    this.el = document.createElement("div");
    this.el.className = "mu-app";

    this._build();
    this.store.subscribe(() => this._onStoreChange());
  }

  _build() {
    // ── Topbar (traffic lights clearance + search) ──
    const topbar = document.createElement("div");
    topbar.className = "mu-topbar";
    topbar.innerHTML = `
      <div class="mu-topbar-spacer"></div>
      <div class="mu-topbar-search-wrap">
        <svg class="mu-topbar-search-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input class="mu-topbar-search-input" type="text" placeholder="Search" id="muTopbarSearch" />
      </div>
    `;

    // Search wiring
    const searchInput = topbar.querySelector("#muTopbarSearch");
    let searchTimer = null;
    searchInput.addEventListener("input", e => {
      clearTimeout(searchTimer);
      const q = e.target.value.trim();
      searchTimer = setTimeout(() => {
        this.sidebar.navigateTo("search");
        this.content.showView("search", q);
      }, 180);
    });
    searchInput.addEventListener("focus", () => {
      this.sidebar.navigateTo("search");
      this.content.showView("search", searchInput.value.trim());
    });
    // Clear search when navigating away via sidebar
    this._clearSearch = () => { searchInput.value = ""; };

    // ── Sidebar ──
    this.sidebar = new MusicSidebar({
      onNavigate: (viewId, extra) => {
        if (viewId !== "search") this._clearSearch();
        this._navigate(viewId, extra);
      },
    });

    // ── Content ──
    this.content = new MusicContent({
      onPlaySong: (songId, queue) => this.store.playSong(songId, queue),
      onNavigate: (viewId, extra) => {
        if (viewId !== "search") this._clearSearch();
        this.sidebar.navigateTo(viewId);
        this._navigate(viewId, extra);
      },
    });

    // ── Playbar (pill + expanded) ──
    this.playbar = new MusicPlaybar();

    // ── Body row ──
    const body = document.createElement("div");
    body.className = "mu-body";
    body.append(this.sidebar.el, this.content.el);

    this.el.append(topbar, body, this.playbar.el);

    // Default view
    this._navigate("home");
  }

  _navigate(viewId, extra = null) {
    if (viewId.startsWith("playlist:")) {
      this.content.showView("playlist", viewId.replace("playlist:", ""));
      return;
    }
    switch (viewId) {
      case "artist": this.content.showView("artist", extra); break;
      case "album":  this.content.showView("album",  extra); break;
      default:       this.content.showView(viewId,   extra); break;
    }
  }

  _onStoreChange() {
    this.content.refresh();
  }
}

// ── Register global ──
window.openMusicWindow = function () {
  if (!window.__musicStore) { console.error("[MusicApp] music-store.js not loaded"); return; }
  if (!window.__musicPlayer) { window.__musicPlayer = new MusicPlayer(window.__musicStore); }

  window.__createWindow({
    appId:  "music",
    title:  "Music",
    width:  1060,
    height: 680,
    content: (_win) => {
      const app = new MusicApp();
      return app.el;
    },
  });
};
