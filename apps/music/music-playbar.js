"use strict";
// ============================================================
//  Music App — music-playbar.js
//  Bottom player bar: artwork · title · controls · scrubber · volume
// ============================================================

class MusicPlaybar {
  constructor() {
    this.store = window.__musicStore;
    this.player = window.__musicPlayer;

    this.el = document.createElement("div");
    this.el.className = "mu-playbar";
    this._build();
    this._bindProgress();
    this.store.subscribe(() => this._sync());
    this._sync();
  }

  _build() {
    this.el.innerHTML = `
      <!-- Left: artwork + song info -->
      <div class="mu-pb-left">
        <div class="mu-pb-art-wrap">
          <img class="mu-pb-art" id="muPbArt" src="" alt="" />
          <div class="mu-pb-art-fallback" id="muPbArtFallback">🎵</div>
        </div>
        <div class="mu-pb-info">
          <div class="mu-pb-title" id="muPbTitle">Not Playing</div>
          <div class="mu-pb-artist" id="muPbArtist">—</div>
        </div>
        <button class="mu-pb-like" id="muPbLike" title="Like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      <!-- Center: transport + scrubber -->
      <div class="mu-pb-center">
        <div class="mu-pb-transport">
          <!-- Shuffle -->
          <button class="mu-pb-btn mu-pb-shuffle" id="muPbShuffle" title="Shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <!-- Prev -->
          <button class="mu-pb-btn mu-pb-prev" id="muPbPrev" title="Previous">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>
          <!-- Play/Pause -->
          <button class="mu-pb-play" id="muPbPlay" title="Play/Pause">
            <svg id="muPbPlayIcon" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <!-- Next -->
          <button class="mu-pb-btn mu-pb-next" id="muPbNext" title="Next">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <!-- Repeat -->
          <button class="mu-pb-btn mu-pb-repeat" id="muPbRepeat" title="Repeat">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        <!-- Scrubber -->
        <div class="mu-pb-scrubber-wrap">
          <span class="mu-pb-time" id="muPbCurrent">0:00</span>
          <div class="mu-pb-scrubber" id="muPbScrubber">
            <div class="mu-pb-track">
              <div class="mu-pb-fill" id="muPbFill" style="width:0%"></div>
              <div class="mu-pb-thumb" id="muPbThumb" style="left:0%"></div>
            </div>
          </div>
          <span class="mu-pb-time" id="muPbDuration">0:00</span>
        </div>
      </div>

      <!-- Right: volume + extra -->
      <div class="mu-pb-right">
        <button class="mu-pb-btn" id="muPbVolBtn" title="Volume">
          <svg id="muPbVolIcon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
        <div class="mu-pb-vol-wrap" id="muPbVolWrap">
          <div class="mu-pb-scrubber" id="muPbVolSlider">
            <div class="mu-pb-track">
              <div class="mu-pb-fill" id="muPbVolFill" style="width:80%"></div>
              <div class="mu-pb-thumb" id="muPbVolThumb" style="left:80%"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindButtons();
    this._bindScrubber();
    this._bindVolume();
  }

  _bindButtons() {
    this.el.querySelector("#muPbPlay")?.addEventListener("click", () => this.store.togglePlay());
    this.el.querySelector("#muPbPrev")?.addEventListener("click", () => this.store.prevSong());
    this.el.querySelector("#muPbNext")?.addEventListener("click", () => this.store.nextSong());
    this.el.querySelector("#muPbShuffle")?.addEventListener("click", () => this.store.toggleShuffle());
    this.el.querySelector("#muPbRepeat")?.addEventListener("click", () => this.store.cycleRepeat());
    this.el.querySelector("#muPbLike")?.addEventListener("click", () => {
      const song = this.store.getCurrentSong();
      if (song) this.store.toggleLike(song.id);
    });
  }

  _bindScrubber() {
    const scrubber = this.el.querySelector("#muPbScrubber");
    if (!scrubber) return;
    let dragging = false;
    const seek = (e) => {
      const rect = scrubber.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.player?.seekTo(pct);
      this._updateFill(pct);
    };
    scrubber.addEventListener("mousedown", (e) => { dragging = true; seek(e); });
    document.addEventListener("mousemove", (e) => { if (dragging) seek(e); });
    document.addEventListener("mouseup", () => { dragging = false; });
  }

  _bindVolume() {
    const slider = this.el.querySelector("#muPbVolSlider");
    if (!slider) return;
    let dragging = false;
    const setVol = (e) => {
      const rect = slider.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.store.setVolume(pct);
    };
    slider.addEventListener("mousedown", (e) => { dragging = true; setVol(e); });
    document.addEventListener("mousemove", (e) => { if (dragging) setVol(e); });
    document.addEventListener("mouseup", () => { dragging = false; });
  }

  _bindProgress() {
    window.addEventListener("mu-progress", (e) => {
      const { currentTime, duration, progress } = e.detail;
      this._updateFill(progress);
      this.el.querySelector("#muPbCurrent").textContent = this.store.formatDuration(currentTime);
      this.el.querySelector("#muPbDuration").textContent = this.store.formatDuration(duration);
    });
  }

  _updateFill(pct) {
    const p = pct * 100;
    const fill = this.el.querySelector("#muPbFill");
    const thumb = this.el.querySelector("#muPbThumb");
    if (fill)  fill.style.width  = p + "%";
    if (thumb) thumb.style.left  = p + "%";
  }

  _sync() {
    const { isPlaying, currentSongId, shuffle, repeat, volume } = this.store.state;
    const song = currentSongId ? this.store.getSong(currentSongId) : null;
    const album = song ? this.store.getAlbum(song.albumId) : null;

    // Art
    const artEl = this.el.querySelector("#muPbArt");
    const artFallback = this.el.querySelector("#muPbArtFallback");
    if (artEl && song) {
      const url = this.store.getArtworkUrl(song.albumId);
      artEl.src = url;
      artEl.style.display = "block";
      if (artFallback) artFallback.style.display = "none";
      artEl.onerror = () => {
        artEl.style.display = "none";
        if (artFallback) artFallback.style.display = "flex";
      };
    } else if (artEl) {
      artEl.style.display = "none";
      if (artFallback) artFallback.style.display = "flex";
    }

    // Title / artist
    const titleEl = this.el.querySelector("#muPbTitle");
    const artistEl = this.el.querySelector("#muPbArtist");
    if (titleEl) titleEl.textContent = song?.title ?? "Not Playing";
    if (artistEl) artistEl.textContent = song ? (this.store.getArtist(song.artistId)?.name ?? "") : "—";

    // Like button
    const likeBtn = this.el.querySelector("#muPbLike");
    if (likeBtn && song) {
      const liked = this.store.isLiked(song.id);
      likeBtn.classList.toggle("liked", liked);
      likeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      `;
    }

    // Play/pause icon
    const playIcon = this.el.querySelector("#muPbPlayIcon");
    if (playIcon) {
      playIcon.innerHTML = isPlaying
        ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`  // pause
        : `<path d="M8 5v14l11-7z"/>`;                    // play
    }

    // Shuffle
    this.el.querySelector("#muPbShuffle")?.classList.toggle("active", shuffle);

    // Repeat
    const repeatBtn = this.el.querySelector("#muPbRepeat");
    if (repeatBtn) {
      repeatBtn.classList.toggle("active", repeat !== "none");
      const badge = repeatBtn.querySelector(".mu-repeat-badge");
      if (repeat === "one") {
        if (!badge) {
          const b = document.createElement("div");
          b.className = "mu-repeat-badge";
          b.textContent = "1";
          repeatBtn.appendChild(b);
        }
      } else {
        badge?.remove();
      }
    }

    // Volume fill
    const volFill  = this.el.querySelector("#muPbVolFill");
    const volThumb = this.el.querySelector("#muPbVolThumb");
    if (volFill)  volFill.style.width = (volume * 100) + "%";
    if (volThumb) volThumb.style.left = (volume * 100) + "%";
  }
}
 
