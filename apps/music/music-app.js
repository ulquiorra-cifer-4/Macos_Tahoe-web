"use strict";
// ============================================================
//  Music App — music-app.js  (v3)
//  No topbar — window manager handles traffic lights natively.
//  Search lives in sidebar top (same as original Notes pattern).
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
    // ── Sidebar (has search inside at top) ──
    this.sidebar = new MusicSidebar({
      onNavigate: (viewId, extra) => this._navigate(viewId, extra),
    });

    // ── Content ──
    this.content = new MusicContent({
      onPlaySong: (songId, queue) => this.store.playSong(songId, queue),
      onNavigate: (viewId, extra) => {
        this.sidebar.navigateTo(viewId);
        this._navigate(viewId, extra);
      },
    });

    // ── Playbar (pill + expanded) ──
    this.playbar = new MusicPlaybar();

    // Wire radio player → playbar sync
    if (window.__radioPlayer) {
      window.__radioPlayer.subscribe(() => this.playbar._sync());
    }

    // ── Body row ──
    const body = document.createElement("div");
    body.className = "mu-body";
    body.append(this.sidebar.el, this.content.el);

    // No topbar — just body + playbar
    this.el.append(body, this.playbar.el);

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

  _onStoreChange() { this.content.refresh(); }
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
