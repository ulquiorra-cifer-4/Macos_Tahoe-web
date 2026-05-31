"use strict";
// ============================================================
//  Video App — video-app.js  (IINA-style)
//  Dark, minimal, floating OSC on hover
//  Left: playlist sidebar
//  Center: video + overlay controls
//  Bottom: full-width scrubber + transport
// ============================================================

class VideoApp {
  constructor() {
    this.store   = window.__videoStore;
    this.engine  = null;   // VideoPlayerEngine, created after DOM
    this._osc    = null;   // OSC timeout handle
    this._oscVisible = false;

    this.el = document.createElement("div");
    this.el.className = "vp-app";
    this._build();
    this._bindEvents();
    this.store.subscribe(() => this._sync());
    this._sync();
  }

  // ─────────────────────────────────────────────
  //  Layout
  // ─────────────────────────────────────────────
  _build() {
    this.el.innerHTML = `
      <!-- Sidebar (playlist) -->
      <div class="vp-sidebar" id="vpSidebar">
        <div class="vp-sb-header">
          <span class="vp-sb-title">Videos</span>
          <button class="vp-sb-add" id="vpAddBtn" title="Add video">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
        </div>
        <div class="vp-sb-list" id="vpSbList"></div>
        <!-- Hidden file input -->
        <input type="file" id="vpFileInput" accept="video/*,.mp4,.mov,.avi,.mkv,.webm" style="display:none" />
      </div>

      <!-- Main: video area -->
      <div class="vp-main" id="vpMain">

        <!-- Video element -->
        <video class="vp-video" id="vpVideo" preload="metadata" playsinline></video>

        <!-- Drop overlay (for drag-drop onto video area) -->
        <div class="vp-drop-overlay" id="vpDropOverlay">
          <div class="vp-drop-icon">🎬</div>
          <div class="vp-drop-label">Drop video to play</div>
        </div>

        <!-- Empty state (no video selected) -->
        <div class="vp-empty" id="vpEmpty">
          <div class="vp-empty-logo">
            <svg viewBox="0 0 80 80" width="72" height="72">
              <rect width="80" height="80" rx="18" fill="#1a1a1a"/>
              <path d="M28 22 L28 58 L58 40 Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div class="vp-empty-title">IINA</div>
          <div class="vp-empty-sub">Select a video from the playlist<br>or drop a file here</div>
          <button class="vp-open-btn" id="vpOpenBtn">Open File…</button>
        </div>

        <!-- Error state -->
        <div class="vp-error" id="vpError" style="display:none">
          <div class="vp-error-icon">⚠️</div>
          <div class="vp-error-text">Could not load video</div>
          <div class="vp-error-sub" id="vpErrorSub">File not found or unsupported format</div>
        </div>

        <!-- Loading spinner -->
        <div class="vp-spinner" id="vpSpinner" style="display:none">
          <div class="vp-spin-ring"></div>
        </div>

        <!-- OSC (on-screen controller) — fades in on mouse move -->
        <div class="vp-osc" id="vpOsc">

          <!-- Title bar -->
          <div class="vp-osc-top" id="vpOscTop">
            <div class="vp-osc-title" id="vpOscTitle">—</div>
            <div class="vp-osc-top-right">
              <button class="vp-osc-btn" id="vpToggleSidebar" title="Toggle Playlist">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
              </button>
            </div>
          </div>

          <!-- Bottom controls -->
          <div class="vp-osc-bottom">
            <!-- Scrubber -->
            <div class="vp-scrubber-wrap">
              <div class="vp-scrubber" id="vpScrubber">
                <div class="vp-scrub-track">
                  <div class="vp-scrub-buf"    id="vpScrubBuf"   style="width:0%"></div>
                  <div class="vp-scrub-fill"   id="vpScrubFill"  style="width:0%"></div>
                  <div class="vp-scrub-thumb"  id="vpScrubThumb" style="left:0%"></div>
                </div>
              </div>
              <div class="vp-time-row">
                <span class="vp-time" id="vpTimeCurr">0:00</span>
                <span class="vp-time" id="vpTimeDur">0:00</span>
              </div>
            </div>

            <!-- Transport row -->
            <div class="vp-transport">
              <div class="vp-transport-left">
                <!-- Shuffle -->
                <button class="vp-ctrl-btn vp-sm" id="vpShuffle" title="Shuffle">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                  </svg>
                </button>
                <!-- Prev -->
                <button class="vp-ctrl-btn" id="vpPrev" title="Previous">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <!-- Play/Pause -->
                <button class="vp-play-btn" id="vpPlay" title="Play/Pause">
                  <svg id="vpPlayIcon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <!-- Next -->
                <button class="vp-ctrl-btn" id="vpNext" title="Next">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <!-- Repeat -->
                <button class="vp-ctrl-btn vp-sm" id="vpRepeat" title="Repeat">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                </button>
              </div>

              <div class="vp-transport-right">
                <!-- Volume -->
                <button class="vp-ctrl-btn vp-sm" id="vpVolBtn" title="Volume">
                  <svg id="vpVolIcon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                </button>
                <div class="vp-vol-wrap">
                  <div class="vp-vol-slider" id="vpVolSlider">
                    <div class="vp-scrub-track">
                      <div class="vp-scrub-fill" id="vpVolFill"  style="width:85%"></div>
                      <div class="vp-scrub-thumb" id="vpVolThumb" style="left:85%"></div>
                    </div>
                  </div>
                </div>
                <!-- Fullscreen -->
                <button class="vp-ctrl-btn vp-sm" id="vpFullscreen" title="Fullscreen">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire engine after DOM is built
    const videoEl = this.el.querySelector("#vpVideo");
    this.engine   = new window.__VideoPlayerEngine(this.store, videoEl);

    this._renderPlaylist();
  }

  // ─────────────────────────────────────────────
  //  Playlist
  // ─────────────────────────────────────────────
  _renderPlaylist() {
    const list = this.el.querySelector("#vpSbList");
    if (!list) return;
    const videos = this.store.getAllVideos();
    list.innerHTML = "";

    if (!videos.length) {
      list.innerHTML = `<div class="vp-sb-empty">No videos yet.<br>Click + to add.</div>`;
      return;
    }

    videos.forEach(v => {
      const item = document.createElement("div");
      const active = v.id === this.store.currentId;
      item.className = "vp-sb-item" + (active ? " active" : "");
      item.dataset.id = v.id;

      const isUser = v.type === "user";
      const icon   = isUser ? "🎬" : "📹";

      item.innerHTML = `
        <span class="vp-sb-item-icon">${icon}</span>
        <div class="vp-sb-item-info">
          <div class="vp-sb-item-title">${v.title}</div>
          ${isUser ? `<div class="vp-sb-item-sub">Uploaded</div>` : `<div class="vp-sb-item-sub">${v.id.replace("v","Video ")}</div>`}
        </div>
        ${isUser ? `<button class="vp-sb-remove" data-id="${v.id}" title="Remove">✕</button>` : ""}
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".vp-sb-remove")) return;
        this.store.play(v.id);
      });
      item.querySelector(".vp-sb-remove")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.store.removeUserVideo(v.id);
      });

      list.appendChild(item);
    });
  }

  // ─────────────────────────────────────────────
  //  Events
  // ─────────────────────────────────────────────
  _bindEvents() {
    const el = this.el;

    // Play/Pause
    el.querySelector("#vpPlay")?.addEventListener("click", () => this.store.togglePlay());
    el.querySelector("#vpVideo")?.addEventListener("click", () => this.store.togglePlay());
    el.querySelector("#vpPrev")?.addEventListener("click", () => this.store.prevVideo());
    el.querySelector("#vpNext")?.addEventListener("click", () => this.store.nextVideo());
    el.querySelector("#vpShuffle")?.addEventListener("click", () => this.store.toggleShuffle());
    el.querySelector("#vpRepeat")?.addEventListener("click",  () => this.store.toggleRepeat());
    el.querySelector("#vpToggleSidebar")?.addEventListener("click", () => this.store.togglePlaylist());

    // Open file
    el.querySelector("#vpOpenBtn")?.addEventListener("click", () => el.querySelector("#vpFileInput")?.click());
    el.querySelector("#vpAddBtn")?.addEventListener("click",  () => el.querySelector("#vpFileInput")?.click());
    el.querySelector("#vpFileInput")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) this._importFile(file);
      e.target.value = "";
    });

    // Scrubber
    this._bindScrubber();
    this._bindVolume();

    // Fullscreen
    el.querySelector("#vpFullscreen")?.addEventListener("click", () => {
      const vid = el.querySelector("#vpVideo");
      if (vid.requestFullscreen) vid.requestFullscreen();
      else if (vid.webkitRequestFullscreen) vid.webkitRequestFullscreen();
    });

    // OSC show/hide on mouse move over main area
    const main = el.querySelector("#vpMain");
    main?.addEventListener("mousemove",  () => this._showOsc());
    main?.addEventListener("mouseleave", () => this._hideOsc(800));

    // Drag-drop onto video area
    main?.addEventListener("dragover",  (e) => { e.preventDefault(); el.querySelector("#vpDropOverlay").classList.add("active"); });
    main?.addEventListener("dragleave", ()  => { el.querySelector("#vpDropOverlay").classList.remove("active"); });
    main?.addEventListener("drop",      async (e) => {
      e.preventDefault();
      el.querySelector("#vpDropOverlay").classList.remove("active");
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith("video/")) this._importFile(file);
    });

    // Double-click → fullscreen
    el.querySelector("#vpVideo")?.addEventListener("dblclick", () => {
      const vid = el.querySelector("#vpVideo");
      if (vid.requestFullscreen) vid.requestFullscreen();
    });

    // Progress events from engine
    window.addEventListener("vp-progress", (e) => {
      const { currentTime, duration, progress } = e.detail;
      this._updateScrubber(progress);
      const currEl = this.el.querySelector("#vpTimeCurr");
      const durEl  = this.el.querySelector("#vpTimeDur");
      if (currEl) currEl.textContent = this.store.formatTime(currentTime);
      if (durEl)  durEl.textContent  = this.store.formatTime(duration);
      // Update buffer
      const bufEl = this.el.querySelector("#vpScrubBuf");
      if (bufEl && this.engine) bufEl.style.width = (this.engine.getBuffered() * 100) + "%";
    });

    // Error event
    window.addEventListener("vp-error", () => {
      const errEl = this.el.querySelector("#vpError");
      const emptyEl = this.el.querySelector("#vpEmpty");
      const vidEl   = this.el.querySelector("#vpVideo");
      if (errEl)   { errEl.style.display   = "flex"; }
      if (emptyEl) { emptyEl.style.display = "none"; }
      if (vidEl)   { vidEl.style.display   = "none"; }
    });
  }

  _bindScrubber() {
    const s = this.el.querySelector("#vpScrubber");
    if (!s) return;
    let drag = false;
    const seek = (e) => {
      const r = s.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.engine?.seekTo(p);
      this._updateScrubber(p);
    };
    s.addEventListener("mousedown",  (e) => { drag = true; seek(e); });
    document.addEventListener("mousemove", (e) => { if (drag) seek(e); });
    document.addEventListener("mouseup",   ()  => { drag = false; });
  }

  _bindVolume() {
    const s = this.el.querySelector("#vpVolSlider");
    if (!s) return;
    let drag = false;
    const set = (e) => {
      const r = s.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.store.setVolume(p);
    };
    s.addEventListener("mousedown",  (e) => { drag = true; set(e); });
    document.addEventListener("mousemove", (e) => { if (drag) set(e); });
    document.addEventListener("mouseup",   ()  => { drag = false; });
  }

  _updateScrubber(p) {
    const pct = p * 100;
    const fill  = this.el.querySelector("#vpScrubFill");
    const thumb = this.el.querySelector("#vpScrubThumb");
    if (fill)  fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
  }

  // ─────────────────────────────────────────────
  //  OSC auto-hide
  // ─────────────────────────────────────────────
  _showOsc() {
    const osc = this.el.querySelector("#vpOsc");
    const vid = this.el.querySelector("#vpVideo");
    if (osc) { osc.classList.add("visible"); this._oscVisible = true; }
    if (vid) vid.style.cursor = "default";
    clearTimeout(this._oscTimer);
    this._oscTimer = setTimeout(() => this._hideOsc(), 2800);
  }

  _hideOsc(delay = 0) {
    clearTimeout(this._oscTimer);
    this._oscTimer = setTimeout(() => {
      const osc = this.el.querySelector("#vpOsc");
      const vid = this.el.querySelector("#vpVideo");
      if (osc) { osc.classList.remove("visible"); this._oscVisible = false; }
      if (vid && this.store.isPlaying) vid.style.cursor = "none";
    }, delay);
  }

  // ─────────────────────────────────────────────
  //  File import
  // ─────────────────────────────────────────────
  async _importFile(file) {
    // Show spinner
    const spinner = this.el.querySelector("#vpSpinner");
    if (spinner) spinner.style.display = "flex";

    const src = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    if (spinner) spinner.style.display = "none";
    const video = this.store.addUserVideo(file.name, src, file.size);
    this.store.play(video.id);
  }

  // ─────────────────────────────────────────────
  //  Sync UI to store
  // ─────────────────────────────────────────────
  _sync() {
    const { isPlaying, currentId, volume, shuffle, repeat, showPlaylist } = this.store;
    const video = this.store.getCurrentVideo();

    // Playlist
    this._renderPlaylist();

    // Sidebar visibility
    const sidebar = this.el.querySelector("#vpSidebar");
    if (sidebar) sidebar.classList.toggle("hidden", !showPlaylist);

    // Empty / video visible
    const emptyEl = this.el.querySelector("#vpEmpty");
    const errEl   = this.el.querySelector("#vpError");
    const vidEl   = this.el.querySelector("#vpVideo");
    if (currentId) {
      if (emptyEl) emptyEl.style.display = "none";
      if (errEl)   errEl.style.display   = "none";
      if (vidEl)   vidEl.style.display   = "block";
      this._showOsc();
    } else {
      if (emptyEl) emptyEl.style.display = "flex";
      if (vidEl)   vidEl.style.display   = "none";
    }

    // OSC title
    const titleEl = this.el.querySelector("#vpOscTitle");
    if (titleEl) titleEl.textContent = video?.title ?? "—";

    // Play icon
    const playIcon = this.el.querySelector("#vpPlayIcon");
    if (playIcon) {
      playIcon.innerHTML = isPlaying
        ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
        : `<path d="M8 5v14l11-7z"/>`;
    }

    // Shuffle / repeat
    this.el.querySelector("#vpShuffle")?.classList.toggle("active", shuffle);
    const repBtn = this.el.querySelector("#vpRepeat");
    if (repBtn) {
      repBtn.classList.toggle("active", repeat !== "none");
      repBtn.querySelector(".vp-repeat-1")?.remove();
      if (repeat === "one") {
        const b = document.createElement("div");
        b.className = "vp-repeat-1"; b.textContent = "1";
        repBtn.appendChild(b);
      }
    }

    // Volume
    const volFill  = this.el.querySelector("#vpVolFill");
    const volThumb = this.el.querySelector("#vpVolThumb");
    if (volFill)  volFill.style.width = (volume * 100) + "%";
    if (volThumb) volThumb.style.left = (volume * 100) + "%";
  }
}

// ── Register global ──
window.openVideosWindow = function() {
  if (!window.__videoStore)       { console.error("[VideoApp] video-store.js not loaded"); return; }
  if (!window.__VideoPlayerEngine){ console.error("[VideoApp] video-player-engine.js not loaded"); return; }

  window.__createWindow({
    appId:  "videos",
    title:  "Videos",
    width:  980,
    height: 600,
    content: (_win) => {
      const app = new VideoApp();
      return app.el;
    },
  });
};

// Allow Finder/desktop to open a specific file in Videos
window.openVideoFile = function(src, name) {
  const store = window.__videoStore;
  if (!store) return;
  const video = store.addUserVideo(name || "Video", src, 0);
  if (typeof window.openVideosWindow === "function") window.openVideosWindow();
  setTimeout(() => store.play(video.id), 120);
};
 
