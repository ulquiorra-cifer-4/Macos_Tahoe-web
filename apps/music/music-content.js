"use strict";
// ============================================================
//  Music App — music-content.js
//  Main content panel: renders each view (Home, Artists, Albums,
//  Songs, Playlists, Search, Artist/Album detail)
// ============================================================

class MusicContent {
  constructor({ onPlaySong, onNavigate }) {
    this.onPlaySong = onPlaySong;
    this.onNavigate = onNavigate;
    this.store = window.__musicStore;

    this.el = document.createElement("div");
    this.el.className = "mu-content";

    this._currentView = null;
    this._currentExtra = null;
  }

  showView(viewId, extra = null) {
    this._currentView = viewId;
    this._currentExtra = extra;
    this._render();
  }

  _render() {
    this.el.innerHTML = "";
    const v = this._currentView;
    const x = this._currentExtra;

    if (v === "home")             this._renderHome();
    else if (v === "new")         this._renderNew();
    else if (v === "radio")       this._renderRadio();
    else if (v === "recently-added") this._renderRecentlyAdded();
    else if (v === "artists")     this._renderArtists();
    else if (v === "artist")      this._renderArtistDetail(x);
    else if (v === "albums")      this._renderAlbums();
    else if (v === "album")       this._renderAlbumDetail(x);
    else if (v === "songs")       this._renderSongs();
    else if (v === "liked")       this._renderLiked();
    else if (v === "all-playlists") this._renderAllPlaylists();
    else if (v === "playlist")    this._renderPlaylistDetail(x);
    else if (v === "search")      this._renderSearch(x);
    else                          this._renderHome();
  }

  // ─────────────────────────────────────────────
  //  HOME
  // ─────────────────────────────────────────────
  _renderHome() {
    const scroll = this._scrollWrap();

    // Hero header
    const hero = document.createElement("div");
    hero.className = "mu-content-header";
    hero.innerHTML = `<h1 class="mu-page-title">Home</h1>`;
    scroll.appendChild(hero);

    // Featured row - artist cards
    const featSection = this._sectionHeader("Featured Artists", null);
    scroll.appendChild(featSection);

    const artistRow = document.createElement("div");
    artistRow.className = "mu-card-row";
    this.store.getArtists().forEach(artist => {
      artistRow.appendChild(this._makeArtistCard(artist));
    });
    scroll.appendChild(artistRow);

    // Recently played
    const recent = this.store.getRecentlyPlayed();
    if (recent.length > 0) {
      scroll.appendChild(this._sectionHeader("Recently Played", null));
      const songRow = document.createElement("div");
      songRow.className = "mu-song-list";
      recent.slice(0, 8).forEach((song, i) => {
        songRow.appendChild(this._makeSongRow(song, i, recent.map(s => s.id)));
      });
      scroll.appendChild(songRow);
    }

    // Hot albums
    scroll.appendChild(this._sectionHeader("Albums", () => this.onNavigate("albums")));
    const albumRow = document.createElement("div");
    albumRow.className = "mu-card-row";
    this.store.getAllAlbums().slice(0, 6).forEach(album => {
      albumRow.appendChild(this._makeAlbumCard(album));
    });
    scroll.appendChild(albumRow);

    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  NEW (browse new releases)
  // ─────────────────────────────────────────────
  _renderNew() {
    const scroll = this._scrollWrap();
    const hero = document.createElement("div");
    hero.className = "mu-content-header";
    hero.innerHTML = `<h1 class="mu-page-title">New</h1>`;
    scroll.appendChild(hero);

    // Large featured cards (like screenshot)
    scroll.appendChild(this._sectionHeader("New Soundtrack", null));
    const featRow = document.createElement("div");
    featRow.className = "mu-feat-row";
    this.store.getAllAlbums().slice(0, 4).forEach(album => {
      featRow.appendChild(this._makeFeaturedCard(album));
    });
    scroll.appendChild(featRow);

    // Latest Songs grid
    scroll.appendChild(this._sectionHeader("Latest Songs ›", () => this.onNavigate("songs")));
    const songGrid = document.createElement("div");
    songGrid.className = "mu-latest-grid";
    const latestSongs = this.store.getRecentlyAdded();
    latestSongs.slice(0, 9).forEach((song, i) => {
      songGrid.appendChild(this._makeLatestSongItem(song, i, latestSongs.map(s => s.id)));
    });
    scroll.appendChild(songGrid);

    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  RADIO (placeholder)
  // ─────────────────────────────────────────────
  _renderRadio() {
    const scroll = this._scrollWrap();
    scroll.innerHTML = `
      <div class="mu-content-header">
        <h1 class="mu-page-title">Radio</h1>
      </div>
      <div class="mu-empty-state">
        <div class="mu-empty-icon">📻</div>
        <div class="mu-empty-title">Radio Coming Soon</div>
        <div class="mu-empty-sub">Live radio stations will be available here.</div>
      </div>
    `;
    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  RECENTLY ADDED
  // ─────────────────────────────────────────────
  _renderRecentlyAdded() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Recently Added"));
    const songs = this.store.getRecentlyAdded();
    const ids = songs.map(s => s.id);
    const list = document.createElement("div");
    list.className = "mu-song-list";
    songs.forEach((song, i) => list.appendChild(this._makeSongRow(song, i, ids)));
    scroll.appendChild(list);
    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  ARTISTS GRID
  // ─────────────────────────────────────────────
  _renderArtists() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Artists"));
    const grid = document.createElement("div");
    grid.className = "mu-artists-grid";
    this.store.getArtists().forEach(artist => {
      grid.appendChild(this._makeArtistCard(artist, true));
    });
    scroll.appendChild(grid);
    this.el.appendChild(scroll);
  }

  _renderArtistDetail(artistId) {
    const artist = this.store.getArtist(artistId);
    if (!artist) return;
    const scroll = this._scrollWrap();

    // Artist hero
    const hero = document.createElement("div");
    hero.className = "mu-artist-hero";
    hero.style.background = `linear-gradient(135deg, ${artist.color.from} 0%, ${artist.color.to} 100%)`;

    const artUrl = this.store.getArtistArtworkUrl(artistId);
    hero.innerHTML = `
      <div class="mu-artist-hero-img-wrap">
        <img class="mu-artist-hero-img" src="${artUrl}" onerror="this.style.display='none';this.parentNode.innerHTML='<div class=\\"mu-artist-emoji\\">${artist.emoji}</div>'" />
      </div>
      <div class="mu-artist-hero-info">
        <div class="mu-artist-hero-label">ARTIST</div>
        <h1 class="mu-artist-hero-name">${artist.name}</h1>
        <p class="mu-artist-hero-bio">${artist.bio}</p>
        <button class="mu-play-btn mu-play-all" data-artist="${artistId}">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
          Play
        </button>
      </div>
    `;
    scroll.appendChild(hero);

    // Albums
    scroll.appendChild(this._sectionHeader("Albums", null));
    const albumRow = document.createElement("div");
    albumRow.className = "mu-card-row";
    this.store.getAlbumsForArtist(artistId).forEach(album => {
      albumRow.appendChild(this._makeAlbumCard(album));
    });
    scroll.appendChild(albumRow);

    // Top songs
    scroll.appendChild(this._sectionHeader("Top Songs", null));
    const allSongs = this.store.getAlbumsForArtist(artistId)
      .flatMap(a => this.store.getAlbumSongs(a.id));
    const ids = allSongs.map(s => s.id);
    const songList = document.createElement("div");
    songList.className = "mu-song-list";
    allSongs.slice(0, 10).forEach((song, i) => {
      songList.appendChild(this._makeSongRow(song, i, ids));
    });
    scroll.appendChild(songList);

    this.el.appendChild(scroll);

    // Play all
    hero.querySelector(".mu-play-all")?.addEventListener("click", () => {
      if (ids.length) this.onPlaySong(ids[0], ids);
    });
  }

  // ─────────────────────────────────────────────
  //  ALBUMS
  // ─────────────────────────────────────────────
  _renderAlbums() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Albums"));
    const grid = document.createElement("div");
    grid.className = "mu-albums-grid";
    this.store.getAllAlbums().forEach(album => {
      grid.appendChild(this._makeAlbumCard(album, true));
    });
    scroll.appendChild(grid);
    this.el.appendChild(scroll);
  }

  _renderAlbumDetail(albumId) {
    const album = this.store.getAlbum(albumId);
    if (!album) return;
    const artist = this.store.getArtist(album.artistId);
    const songs = this.store.getAlbumSongs(albumId);
    const ids = songs.map(s => s.id);
    const artUrl = this.store.getArtworkUrl(albumId);
    const scroll = this._scrollWrap();

    // Album hero
    const hero = document.createElement("div");
    hero.className = "mu-album-hero";
    hero.style.background = `linear-gradient(160deg, ${album.color}ee 0%, ${album.color}44 60%, transparent 100%)`;
    hero.innerHTML = `
      <img class="mu-album-hero-art" src="${artUrl}" onerror="this.src='';this.style.background='${album.color}';this.style.borderRadius='12px'" />
      <div class="mu-album-hero-info">
        <div class="mu-album-hero-type">Album</div>
        <h1 class="mu-album-hero-title">${album.title}</h1>
        <div class="mu-album-hero-meta">
          <span class="mu-album-artist-chip" data-artist="${album.artistId}">${artist?.name ?? ""}</span>
          &nbsp;·&nbsp; ${album.year} &nbsp;·&nbsp; ${songs.length} songs
        </div>
        <div class="mu-album-hero-actions">
          <button class="mu-play-btn mu-play-all-album">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            Play
          </button>
          <button class="mu-shuffle-btn mu-shuffle-album">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    `;
    scroll.appendChild(hero);

    // Song list
    const listWrap = document.createElement("div");
    listWrap.className = "mu-album-song-list";

    // Header row
    const listHeader = document.createElement("div");
    listHeader.className = "mu-song-list-header";
    listHeader.innerHTML = `
      <span class="mu-col-track">#</span>
      <span class="mu-col-title">Title</span>
      <span class="mu-col-dur">
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
      </span>
    `;
    listWrap.appendChild(listHeader);

    songs.forEach((song, i) => {
      listWrap.appendChild(this._makeAlbumSongRow(song, i, ids));
    });
    scroll.appendChild(listWrap);
    this.el.appendChild(scroll);

    // Events
    hero.querySelector(".mu-play-all-album")?.addEventListener("click", () => {
      if (ids.length) this.onPlaySong(ids[0], ids);
    });
    hero.querySelector(".mu-shuffle-album")?.addEventListener("click", () => {
      if (ids.length) {
        const shuffled = [...ids].sort(() => Math.random() - 0.5);
        this.onPlaySong(shuffled[0], shuffled);
      }
    });
    hero.querySelector(".mu-album-artist-chip")?.addEventListener("click", () => {
      this.onNavigate("artist", album.artistId);
    });
  }

  // ─────────────────────────────────────────────
  //  SONGS
  // ─────────────────────────────────────────────
  _renderSongs() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Songs"));
    const songs = this.store.getAllSongs()
      .sort((a, b) => a.title.localeCompare(b.title));
    const ids = songs.map(s => s.id);
    const list = document.createElement("div");
    list.className = "mu-song-list";
    songs.forEach((song, i) => list.appendChild(this._makeSongRow(song, i, ids)));
    scroll.appendChild(list);
    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  LIKED / FAVOURITES
  // ─────────────────────────────────────────────
  _renderLiked() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Favourite Songs"));
    const songs = this.store.getLikedSongs();
    const ids = songs.map(s => s.id);
    if (songs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mu-empty-state";
      empty.innerHTML = `<div class="mu-empty-icon">💜</div><div class="mu-empty-title">No favourites yet</div><div class="mu-empty-sub">Tap the heart on any song to add it here.</div>`;
      scroll.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "mu-song-list";
      songs.forEach((song, i) => list.appendChild(this._makeSongRow(song, i, ids)));
      scroll.appendChild(list);
    }
    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  PLAYLISTS
  // ─────────────────────────────────────────────
  _renderAllPlaylists() {
    const scroll = this._scrollWrap();
    scroll.appendChild(this._pageHeader("Playlists"));
    const grid = document.createElement("div");
    grid.className = "mu-card-row";
    this.store.getPlaylists().forEach(pl => {
      const card = document.createElement("div");
      card.className = "mu-album-card mu-clickable";
      card.innerHTML = `
        <div class="mu-album-card-art mu-playlist-art">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)" width="36" height="36"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>
        </div>
        <div class="mu-album-card-info">
          <div class="mu-album-card-title">${pl.title}</div>
          <div class="mu-album-card-sub">${pl.songIds.length} songs</div>
        </div>
      `;
      card.addEventListener("click", () => this.onNavigate("playlist", pl.id));
      grid.appendChild(card);
    });
    scroll.appendChild(grid);
    this.el.appendChild(scroll);
  }

  _renderPlaylistDetail(playlistId) {
    const pl = this.store.getPlaylist(playlistId);
    if (!pl) return;
    const songs = this.store.getPlaylistSongs(playlistId);
    const ids = songs.map(s => s.id);
    const scroll = this._scrollWrap();

    const hero = document.createElement("div");
    hero.className = "mu-album-hero";
    hero.style.background = "linear-gradient(160deg, #2c2c3e 0%, #1a1a2e 100%)";
    hero.innerHTML = `
      <div class="mu-playlist-hero-art">
        <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)" width="52" height="52"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>
      </div>
      <div class="mu-album-hero-info">
        <div class="mu-album-hero-type">Playlist</div>
        <h1 class="mu-album-hero-title">${pl.title}</h1>
        <div class="mu-album-hero-meta">${pl.description} &nbsp;·&nbsp; ${songs.length} songs</div>
        <div class="mu-album-hero-actions">
          <button class="mu-play-btn mu-play-pl">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            Play
          </button>
        </div>
      </div>
    `;
    scroll.appendChild(hero);

    const listWrap = document.createElement("div");
    listWrap.className = "mu-album-song-list";
    const listHeader = document.createElement("div");
    listHeader.className = "mu-song-list-header";
    listHeader.innerHTML = `<span class="mu-col-track">#</span><span class="mu-col-title">Title</span><span class="mu-col-dur"><svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg></span>`;
    listWrap.appendChild(listHeader);
    songs.forEach((song, i) => listWrap.appendChild(this._makeAlbumSongRow(song, i, ids)));
    scroll.appendChild(listWrap);
    this.el.appendChild(scroll);

    hero.querySelector(".mu-play-pl")?.addEventListener("click", () => {
      if (ids.length) this.onPlaySong(ids[0], ids);
    });
  }

  // ─────────────────────────────────────────────
  //  SEARCH
  // ─────────────────────────────────────────────
  _renderSearch(query) {
    const scroll = this._scrollWrap();
    const header = document.createElement("div");
    header.className = "mu-content-header";
    header.innerHTML = `<h1 class="mu-page-title">Search${query ? `: "${query}"` : ""}</h1>`;
    scroll.appendChild(header);

    if (!query || query.trim() === "") {
      // Show browse tiles
      scroll.appendChild(this._sectionHeader("Browse Categories", null));
      const tiles = document.createElement("div");
      tiles.className = "mu-browse-tiles";
      const cats = [
        { label: "Artists", id: "artists", color: "#1db954" },
        { label: "Albums",  id: "albums",  color: "#1d62b9" },
        { label: "Songs",   id: "songs",   color: "#e91e63" },
        { label: "Playlists", id: "all-playlists", color: "#ff9800" },
      ];
      cats.forEach(cat => {
        const tile = document.createElement("button");
        tile.className = "mu-browse-tile";
        tile.style.background = cat.color;
        tile.textContent = cat.label;
        tile.addEventListener("click", () => this.onNavigate(cat.id));
        tiles.appendChild(tile);
      });
      scroll.appendChild(tiles);
    } else {
      const results = this.store.searchSongs(query);
      const ids = results.map(s => s.id);
      if (results.length === 0) {
        const empty = document.createElement("div");
        empty.className = "mu-empty-state";
        empty.innerHTML = `<div class="mu-empty-icon">🔍</div><div class="mu-empty-title">No results for "${query}"</div>`;
        scroll.appendChild(empty);
      } else {
        scroll.appendChild(this._sectionHeader(`${results.length} Songs`, null));
        const list = document.createElement("div");
        list.className = "mu-song-list";
        results.forEach((song, i) => list.appendChild(this._makeSongRow(song, i, ids)));
        scroll.appendChild(list);
      }
    }
    this.el.appendChild(scroll);
  }

  // ─────────────────────────────────────────────
  //  CARD / ROW BUILDERS
  // ─────────────────────────────────────────────
  _makeArtistCard(artist, large = false) {
    const card = document.createElement("div");
    card.className = "mu-artist-card mu-clickable" + (large ? " mu-artist-card-lg" : "");
    const artUrl = this.store.getArtistArtworkUrl(artist.id);
    card.innerHTML = `
      <div class="mu-artist-card-img-wrap" style="background:linear-gradient(135deg,${artist.color.from},${artist.color.to})">
        <img class="mu-artist-card-img" src="${artUrl}"
          onerror="this.style.display='none';this.parentNode.querySelector('.mu-artist-emoji-fallback').style.display='flex'" />
        <div class="mu-artist-emoji-fallback" style="display:none">${artist.emoji}</div>
      </div>
      <div class="mu-artist-card-name">${artist.name}</div>
    `;
    card.addEventListener("click", () => this.onNavigate("artist", artist.id));
    return card;
  }

  _makeAlbumCard(album, large = false) {
    const artist = this.store.getArtist(album.artistId);
    const artUrl = this.store.getArtworkUrl(album.id);
    const card = document.createElement("div");
    card.className = "mu-album-card mu-clickable" + (large ? " mu-album-card-lg" : "");
    card.innerHTML = `
      <div class="mu-album-card-art-wrap">
        <img class="mu-album-card-art" src="${artUrl}"
          onerror="this.style.background='${album.color}';this.src=''" />
        <button class="mu-album-card-play" title="Play">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="mu-album-card-info">
        <div class="mu-album-card-title">${album.title}</div>
        <div class="mu-album-card-sub">${artist?.name ?? ""} · ${album.year}</div>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".mu-album-card-play")) {
        this.onNavigate("album", album.id);
      }
    });
    card.querySelector(".mu-album-card-play")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const songs = this.store.getAlbumSongs(album.id);
      const ids = songs.map(s => s.id);
      if (ids.length) this.onPlaySong(ids[0], ids);
    });
    return card;
  }

  _makeFeaturedCard(album) {
    const artist = this.store.getArtist(album.artistId);
    const artUrl = this.store.getArtworkUrl(album.id);
    const card = document.createElement("div");
    card.className = "mu-feat-card mu-clickable";
    card.innerHTML = `
      <img class="mu-feat-card-img" src="${artUrl}"
        onerror="this.style.background='${album.color}';this.src=''" />
      <div class="mu-feat-card-overlay">
        <div class="mu-feat-card-artist">${artist?.name ?? ""}</div>
        <div class="mu-feat-card-desc">${album.title}</div>
      </div>
    `;
    card.addEventListener("click", () => this.onNavigate("album", album.id));
    return card;
  }

  _makeLatestSongItem(song, index, allIds) {
    const album = this.store.getAlbum(song.albumId);
    const artist = this.store.getArtist(song.artistId);
    const artUrl = this.store.getArtworkUrl(song.albumId);
    const isPlaying = this.store.state.currentSongId === song.id && this.store.state.isPlaying;

    const item = document.createElement("div");
    item.className = "mu-latest-item mu-clickable" + (isPlaying ? " playing" : "");
    item.dataset.songId = song.id;
    item.innerHTML = `
      <img class="mu-latest-art" src="${artUrl}" onerror="this.style.background='${album?.color ?? '#333'}';this.src=''" />
      <div class="mu-latest-info">
        <div class="mu-latest-title">${song.title}</div>
        <div class="mu-latest-artist">${artist?.name ?? ""}</div>
      </div>
      <button class="mu-latest-more" title="More">···</button>
    `;
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".mu-latest-more")) this.onPlaySong(song.id, allIds);
    });
    return item;
  }

  _makeSongRow(song, index, allIds) {
    const album = this.store.getAlbum(song.albumId);
    const artist = this.store.getArtist(song.artistId);
    const artUrl = this.store.getArtworkUrl(song.albumId);
    const isPlaying = this.store.state.currentSongId === song.id;
    const liked = this.store.isLiked(song.id);

    const row = document.createElement("div");
    row.className = "mu-song-row mu-clickable" + (isPlaying ? " playing" : "");
    row.dataset.songId = song.id;
    row.innerHTML = `
      <img class="mu-song-row-art" src="${artUrl}" onerror="this.style.background='${album?.color ?? '#333'}';this.src=''" />
      <div class="mu-song-row-info">
        <div class="mu-song-row-title">${song.title}</div>
        <div class="mu-song-row-meta">${artist?.name ?? ""} — ${album?.title ?? ""}</div>
      </div>
      <button class="mu-song-like ${liked ? "liked" : ""}" title="${liked ? "Unlike" : "Like"}">
        <svg viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <div class="mu-song-row-dur">${this.store.formatDuration(song.duration)}</div>
    `;

    row.addEventListener("click", (e) => {
      if (!e.target.closest(".mu-song-like")) this.onPlaySong(song.id, allIds);
    });
    row.querySelector(".mu-song-like")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.store.toggleLike(song.id);
      this._render(); // re-render to update hearts
    });
    return row;
  }

  _makeAlbumSongRow(song, index, allIds) {
    const isPlaying = this.store.state.currentSongId === song.id;
    const liked = this.store.isLiked(song.id);

    const row = document.createElement("div");
    row.className = "mu-album-song-row mu-clickable" + (isPlaying ? " playing" : "");
    row.dataset.songId = song.id;
    row.innerHTML = `
      <span class="mu-col-track">${isPlaying ? "▶" : song.track}</span>
      <div class="mu-col-title">
        <span class="mu-asong-title ${isPlaying ? "playing" : ""}">${song.title}</span>
      </div>
      <button class="mu-song-like ${liked ? "liked" : ""}" title="${liked ? "Unlike" : "Like"}">
        <svg viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" width="13" height="13">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <span class="mu-col-dur">${this.store.formatDuration(song.duration)}</span>
    `;

    row.addEventListener("click", (e) => {
      if (!e.target.closest(".mu-song-like")) this.onPlaySong(song.id, allIds);
    });
    row.querySelector(".mu-song-like")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.store.toggleLike(song.id);
      this._render();
    });
    return row;
  }

  // ─────────────────────────────────────────────
  //  DOM helpers
  // ─────────────────────────────────────────────
  _scrollWrap() {
    const d = document.createElement("div");
    d.className = "mu-scroll";
    return d;
  }
  _pageHeader(title) {
    const d = document.createElement("div");
    d.className = "mu-content-header";
    d.innerHTML = `<h1 class="mu-page-title">${title}</h1>`;
    return d;
  }
  _sectionHeader(title, onMore) {
    const d = document.createElement("div");
    d.className = "mu-section-header";
    d.innerHTML = `
      <span class="mu-section-title">${title}</span>
      ${onMore ? `<button class="mu-see-all">See All</button>` : ""}
    `;
    if (onMore) d.querySelector(".mu-see-all")?.addEventListener("click", onMore);
    return d;
  }

  refresh() { this._render(); }
}
 
