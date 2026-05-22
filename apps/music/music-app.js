"use strict";
// ============================================================
//  Music App — music-app.js
//  Assembles sidebar + content + playbar, registers global
// ============================================================

class MusicApp {
  constructor() {
    this.store = window.__musicStore;
    this.player = window.__musicPlayer;

    this.el = document.createElement("div");
    this.el.className = "mu-app";

    this._build();
    this.store.subscribe(() => this._onStoreChange());
  }

  _build() {
    // ── Sidebar ──
    this.sidebar = new MusicSidebar({
      onNavigate: (viewId, extra) => this._navigate(viewId, extra),
    });

    // ── Content ──
    this.content = new MusicContent({
      onPlaySong: (songId, queue) => {
        this.store.playSong(songId, queue);
      },
      onNavigate: (viewId, extra) => {
        this.sidebar.navigateTo(viewId);
        this._navigate(viewId, extra);
      },
    });

    // ── Playbar ──
    this.playbar = new MusicPlaybar();

    // ── Body (sidebar + content) ──
    const body = document.createElement("div");
    body.className = "mu-body";
    body.append(this.sidebar.el, this.content.el);

    this.el.append(body, this.playbar.el);

    // Show home by default
    this._navigate("home");
  }

  _navigate(viewId, extra = null) {
    if (viewId.startsWith("playlist:")) {
      const playlistId = viewId.replace("playlist:", "");
      this.content.showView("playlist", playlistId);
      return;
    }
    switch (viewId) {
      case "artist":        this.content.showView("artist", extra); break;
      case "album":         this.content.showView("album", extra);  break;
      default:              this.content.showView(viewId, extra);   break;
    }
  }

  _onStoreChange() {
    this.content.refresh();
  }
}

// ── Register window opener ──
window.openMusicWindow = function () {
  if (!window.__musicStore) {
    console.error("[MusicApp] music-store.js not loaded");
    return;
  }

  // Ensure player is initialized (store may have loaded after player script)
  if (!window.__musicPlayer) {
    window.__musicPlayer = new MusicPlayer(window.__musicStore);
  }

  window.__createWindow({
    appId: "music",
    title: "Music",
    width: 1060,
    height: 660,
    content: (_win) => {
      const app = new MusicApp();
      return app.el;
    },
  });
};
 
