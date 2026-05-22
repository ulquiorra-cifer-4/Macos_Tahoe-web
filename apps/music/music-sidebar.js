"use strict";
// ============================================================
//  Music App — music-sidebar.js
//  Left navigation panel: Search, Home, Radio, Library, Playlists
// ============================================================

class MusicSidebar {
  constructor({ onNavigate }) {
    this.onNavigate = onNavigate;
    this.activeId = "home";
    this.store = window.__musicStore;

    this.el = document.createElement("div");
    this.el.className = "mu-sidebar";
    this._build();

    this.store.subscribe(() => this._refreshPlaylists());
  }

  _build() {
    this.el.innerHTML = "";

    // ── Search bar ──
    const searchWrap = document.createElement("div");
    searchWrap.className = "mu-sidebar-search";
    searchWrap.innerHTML = `
      <svg class="mu-search-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
        <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input class="mu-search-input" type="text" placeholder="Search" />
    `;
    const searchInput = searchWrap.querySelector(".mu-search-input");
    searchInput.addEventListener("input", e => {
      const q = e.target.value.trim();
      if (q.length > 0) this._navigate("search", q);
    });
    searchInput.addEventListener("focus", () => this._navigate("search", searchInput.value));

    this.el.appendChild(searchWrap);

    // ── Nav items ──
    const navItems = [
      { id: "home",   icon: this._homeIcon(),   label: "Home"  },
      { id: "new",    icon: this._newIcon(),     label: "New"   },
      { id: "radio",  icon: this._radioIcon(),   label: "Radio" },
    ];

    const navEl = document.createElement("div");
    navEl.className = "mu-sidebar-section";
    navItems.forEach(item => {
      const btn = this._makeNavBtn(item.id, item.icon, item.label);
      navEl.appendChild(btn);
    });
    this.el.appendChild(navEl);

    // ── Library section ──
    const libLabel = document.createElement("div");
    libLabel.className = "mu-sidebar-label";
    libLabel.textContent = "Library";
    this.el.appendChild(libLabel);

    const libItems = [
      { id: "recently-added",  icon: this._recentIcon(),  label: "Recently Added" },
      { id: "artists",         icon: this._artistsIcon(), label: "Artists"        },
      { id: "albums",          icon: this._albumsIcon(),  label: "Albums"         },
      { id: "songs",           icon: this._songsIcon(),   label: "Songs"          },
    ];

    const libEl = document.createElement("div");
    libEl.className = "mu-sidebar-section";
    libItems.forEach(item => {
      const btn = this._makeNavBtn(item.id, item.icon, item.label);
      libEl.appendChild(btn);
    });
    this.el.appendChild(libEl);

    // ── Playlists section ──
    const plLabel = document.createElement("div");
    plLabel.className = "mu-sidebar-label";
    plLabel.textContent = "Playlists";
    this.el.appendChild(plLabel);

    this.playlistsEl = document.createElement("div");
    this.playlistsEl.className = "mu-sidebar-section";
    this._renderPlaylists();
    this.el.appendChild(this.playlistsEl);
  }

  _makeNavBtn(id, iconHtml, label) {
    const btn = document.createElement("button");
    btn.className = "mu-nav-btn" + (id === this.activeId ? " active" : "");
    btn.dataset.navId = id;
    btn.innerHTML = `<span class="mu-nav-icon">${iconHtml}</span><span class="mu-nav-label">${label}</span>`;
    btn.addEventListener("click", () => this._navigate(id));
    return btn;
  }

  _navigate(id, extra = null) {
    this.activeId = id;
    this._updateActive();
    this.onNavigate(id, extra);
  }

  _updateActive() {
    this.el.querySelectorAll(".mu-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.navId === this.activeId);
    });
  }

  _renderPlaylists() {
    this.playlistsEl.innerHTML = "";
    const playlists = this.store.getPlaylists();

    // "All Playlists" button
    const allBtn = document.createElement("button");
    allBtn.className = "mu-nav-btn" + (this.activeId === "all-playlists" ? " active" : "");
    allBtn.dataset.navId = "all-playlists";
    allBtn.innerHTML = `
      <span class="mu-nav-icon">${this._allPlaylistsIcon()}</span>
      <span class="mu-nav-label">All Playlists</span>
    `;
    allBtn.addEventListener("click", () => this._navigate("all-playlists"));
    this.playlistsEl.appendChild(allBtn);

    // "Favourite Songs" shortcut
    const favBtn = document.createElement("button");
    favBtn.className = "mu-nav-btn" + (this.activeId === "liked" ? " active" : "");
    favBtn.dataset.navId = "liked";
    favBtn.innerHTML = `
      <span class="mu-nav-icon">${this._heartIcon()}</span>
      <span class="mu-nav-label">Favourite Songs</span>
    `;
    favBtn.addEventListener("click", () => this._navigate("liked"));
    this.playlistsEl.appendChild(favBtn);

    // Each playlist
    playlists.forEach(pl => {
      const btn = document.createElement("button");
      btn.className = "mu-nav-btn mu-nav-playlist" + (this.activeId === `playlist:${pl.id}` ? " active" : "");
      btn.dataset.navId = `playlist:${pl.id}`;
      btn.innerHTML = `
        <span class="mu-nav-icon">${this._playlistIcon()}</span>
        <span class="mu-nav-label">${pl.title}</span>
      `;
      btn.addEventListener("click", () => this._navigate(`playlist:${pl.id}`));
      this.playlistsEl.appendChild(btn);
    });
  }

  _refreshPlaylists() {
    this._renderPlaylists();
    this._updateActive();
  }

  navigateTo(id) {
    this._navigate(id);
  }

  // ── SVG icons ──
  _homeIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`; }
  _newIcon()  { return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`; }
  _radioIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`; }
  _recentIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`; }
  _artistsIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`; }
  _albumsIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>`; }
  _songsIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`; }
  _allPlaylistsIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 6h16v2H4zm2 5h12v2H6zm3 5h6v2H9z"/></svg>`; }
  _heartIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`; }
  _playlistIcon(){ return `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>`; }
}
 
