"use strict";
// ============================================================
//  Music App — music-playbar.js  (v3)
//  • Glassy frosted pill design
//  • Cursor-reactive spring stretch physics (like the dock)
//  • Click art/title → expanded full player
// ============================================================

// ── Spring constants (same family as dock) ──
const MU_BASE_H    = 68;       // pill resting height px
const MU_MAX_LIFT  = 18;       // max upward lift at cursor centre
const MU_SPREAD    = 320;      // horizontal influence radius px
const MU_DAMPING   = 0.52;
const MU_STIFFNESS = 0.14;

class MusicPlaybar {
  constructor() {
    this.store  = window.__musicStore;
    this.player = window.__musicPlayer;
    this.expanded = false;

    // Spring state — one value: vertical lift of pill
    this._spring = { value: 0, target: 0, velocity: 0 };
    this._raf    = 0;
    this._mouseX = null;   // null = cursor not over bar

    this.el = document.createElement("div");
    this.el.className = "mu-pb-wrapper";

    this._buildPill();
    this._buildExpanded();
    this._bindProgress();
    this._bindCursorPhysics();
    this.store.subscribe(() => this._sync());
    this._sync();
  }

  // ─────────────────────────────────────────────
  //  CURSOR-REACTIVE SPRING PHYSICS
  // ─────────────────────────────────────────────
  _bindCursorPhysics() {
    const wrapper = this.el;

    wrapper.addEventListener("mouseenter", (e) => {
      this._mouseX = e.clientX;
      this._scheduleSpring();
    });
    wrapper.addEventListener("mousemove", (e) => {
      this._mouseX = e.clientX;
      this._scheduleSpring();
    });
    wrapper.addEventListener("mouseleave", () => {
      this._mouseX = null;
      this._spring.target = 0;
      this._scheduleSpring();
    });
  }

  _scheduleSpring() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._tickSpring());
  }

  _tickSpring() {
    // Compute target lift based on cursor position within pill
    if (this._mouseX !== null) {
      const rect = this.pill.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const dist = Math.abs(this._mouseX - cx);
      const norm = Math.max(0, 1 - dist / MU_SPREAD);   // 0→1
      // Smooth bell curve: norm^2
      this._spring.target = MU_MAX_LIFT * norm * norm;
    } else {
      this._spring.target = 0;
    }

    // Tick spring
    const force      = -MU_STIFFNESS * (this._spring.value - this._spring.target);
    this._spring.velocity = (this._spring.velocity + force) * (1 - MU_DAMPING);
    this._spring.value   += this._spring.velocity;

    // Apply lift as translateY (negative = up)
    const lift = this._spring.value;
    this.pill.style.transform = `translateY(${-lift}px)`;

    // Scale the pill-inner slightly when lifted — gives a "pop" feel
    const scale = 1 + (lift / MU_MAX_LIFT) * 0.025;
    const inner = this.pill.querySelector(".mu-pill-inner");
    if (inner) inner.style.transform = `scaleY(${scale})`;

    // Keep animating until settled
    const settled = Math.abs(this._spring.velocity) < 0.05 &&
                    Math.abs(this._spring.value - this._spring.target) < 0.1;
    if (!settled) {
      this._raf = requestAnimationFrame(() => this._tickSpring());
    }
  }

  // ─────────────────────────────────────────────
  //  PILL
  // ─────────────────────────────────────────────
  _buildPill() {
    this.pill = document.createElement("div");
    this.pill.className = "mu-pill";
    this.pill.innerHTML = `
      <div class="mu-pill-inner">

        <!-- Left: art + info → click to expand -->
        <div class="mu-pill-left" id="muPillLeft">
          <div class="mu-pill-art-wrap">
            <img  class="mu-pill-art"      id="muPillArt"      src="" alt="" />
            <div  class="mu-pill-art-fall" id="muPillArtFall">🎵</div>
          </div>
          <div class="mu-pill-info">
            <div class="mu-pill-title"  id="muPillTitle">Not Playing</div>
            <div class="mu-pill-artist" id="muPillArtist">—</div>
          </div>
        </div>

        <!-- Centre: transport controls -->
        <div class="mu-pill-centre">
          <button class="mu-pill-btn mu-pill-shuffle" id="muPillShuffle" title="Shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button class="mu-pill-btn mu-pill-prev" id="muPillPrev" title="Previous">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button class="mu-pill-play" id="muPillPlay" title="Play/Pause">
            <svg id="muPillPlayIcon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button class="mu-pill-btn mu-pill-next" id="muPillNext" title="Next">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button class="mu-pill-btn mu-pill-repeat" id="muPillRepeat" title="Repeat">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        <!-- Right: scrubber + vol -->
        <div class="mu-pill-right">
          <span class="mu-pill-time" id="muPillCurr">0:00</span>
          <div class="mu-pill-scrubber" id="muPillScrub">
            <div class="mu-pill-track">
              <div class="mu-pill-fill"  id="muPillFill"  style="width:0%"></div>
              <div class="mu-pill-thumb" id="muPillThumb" style="left:0%"></div>
            </div>
          </div>
          <span class="mu-pill-time" id="muPillDur">0:00</span>
          <button class="mu-pill-btn mu-pill-vol-btn" title="Volume">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </button>
          <div class="mu-pill-vol-wrap">
            <div class="mu-pill-scrubber mu-pill-vol-slider" id="muPillVol">
              <div class="mu-pill-track">
                <div class="mu-pill-fill"  id="muPillVolFill"  style="width:80%"></div>
                <div class="mu-pill-thumb" id="muPillVolThumb" style="left:80%"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    this.pill.querySelector("#muPillLeft").addEventListener("click", () => this._openExpanded());
    this._bindPillButtons();
    this._bindPillScrubber();
    this._bindPillVolume();
    this.el.appendChild(this.pill);
  }

  _bindPillButtons() {
    this.pill.querySelector("#muPillPlay")?.addEventListener("click",    (e) => { e.stopPropagation(); this.store.togglePlay(); });
    this.pill.querySelector("#muPillPrev")?.addEventListener("click",    (e) => { e.stopPropagation(); this.store.prevSong(); });
    this.pill.querySelector("#muPillNext")?.addEventListener("click",    (e) => { e.stopPropagation(); this.store.nextSong(); });
    this.pill.querySelector("#muPillShuffle")?.addEventListener("click", (e) => { e.stopPropagation(); this.store.toggleShuffle(); });
    this.pill.querySelector("#muPillRepeat")?.addEventListener("click",  (e) => { e.stopPropagation(); this.store.cycleRepeat(); });
  }

  _bindPillScrubber() {
    const s = this.pill.querySelector("#muPillScrub");
    if (!s) return;
    let drag = false;
    const seek = (e) => {
      const r = s.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.player?.seekTo(p);
      this._setPillFill(p);
    };
    s.addEventListener("mousedown",  (e) => { e.stopPropagation(); drag = true; seek(e); });
    document.addEventListener("mousemove", (e) => { if (drag) seek(e); });
    document.addEventListener("mouseup",   () => { drag = false; });
  }

  _bindPillVolume() {
    const s = this.pill.querySelector("#muPillVol");
    if (!s) return;
    let drag = false;
    const set = (e) => {
      const r = s.getBoundingClientRect();
      this.store.setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
    };
    s.addEventListener("mousedown",  (e) => { e.stopPropagation(); drag = true; set(e); });
    document.addEventListener("mousemove", (e) => { if (drag) set(e); });
    document.addEventListener("mouseup",   () => { drag = false; });
  }

  _setPillFill(p) {
    const pct = p * 100;
    const fill  = this.pill.querySelector("#muPillFill");
    const thumb = this.pill.querySelector("#muPillThumb");
    if (fill)  fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
  }

  // ─────────────────────────────────────────────
  //  EXPANDED PLAYER
  // ─────────────────────────────────────────────
  _buildExpanded() {
    this.exp = document.createElement("div");
    this.exp.className = "mu-expanded";
    this.exp.innerHTML = `
      <div class="mu-exp-bg" id="muExpBg"></div>
      <div class="mu-exp-handle-row">
        <div class="mu-exp-handle"></div>
        <button class="mu-exp-close" id="muExpClose">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
      </div>
      <div class="mu-exp-art-wrap" id="muExpArtWrap">
        <img class="mu-exp-art" id="muExpArt" src="" alt="" />
        <div class="mu-exp-art-fall" id="muExpArtFall">🎵</div>
      </div>
      <div class="mu-exp-meta">
        <div class="mu-exp-meta-text">
          <div class="mu-exp-title"  id="muExpTitle">Not Playing</div>
          <div class="mu-exp-artist" id="muExpArtist">—</div>
        </div>
        <button class="mu-exp-like" id="muExpLike">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      <div class="mu-exp-scrub-wrap">
        <div class="mu-exp-scrubber" id="muExpScrub">
          <div class="mu-exp-track">
            <div class="mu-exp-fill"  id="muExpFill"  style="width:0%"></div>
            <div class="mu-exp-thumb" id="muExpThumb" style="left:0%"></div>
          </div>
        </div>
        <div class="mu-exp-times">
          <span id="muExpCurr">0:00</span>
          <span id="muExpDur">0:00</span>
        </div>
      </div>
      <div class="mu-exp-transport">
        <button class="mu-exp-btn mu-exp-shuffle" id="muExpShuffle">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>
        <button class="mu-exp-btn mu-exp-prev" id="muExpPrev">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button class="mu-exp-play" id="muExpPlay">
          <svg id="muExpPlayIcon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="mu-exp-btn mu-exp-next" id="muExpNext">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
        <button class="mu-exp-btn mu-exp-repeat" id="muExpRepeat">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        </button>
      </div>
      <div class="mu-exp-vol-row">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="opacity:0.45"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>
        <div class="mu-exp-scrubber mu-exp-vol-slider" id="muExpVol">
          <div class="mu-exp-track">
            <div class="mu-exp-fill"  id="muExpVolFill"  style="width:80%"></div>
            <div class="mu-exp-thumb" id="muExpVolThumb" style="left:80%"></div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="opacity:0.45">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </div>
    `;

    this.exp.querySelector("#muExpClose")?.addEventListener("click", () => this._closeExpanded());

    // Swipe/drag down to close
    let startY = 0;
    this.exp.addEventListener("mousedown", (e) => { startY = e.clientY; });
    this.exp.addEventListener("mouseup",   (e) => { if (e.clientY - startY > 55) this._closeExpanded(); });

    this._bindExpandedButtons();
    this._bindExpandedScrubber();
    this._bindExpandedVolume();
    this.el.appendChild(this.exp);
  }

  _bindExpandedButtons() {
    this.exp.querySelector("#muExpPlay")?.addEventListener("click",    () => this.store.togglePlay());
    this.exp.querySelector("#muExpPrev")?.addEventListener("click",    () => this.store.prevSong());
    this.exp.querySelector("#muExpNext")?.addEventListener("click",    () => this.store.nextSong());
    this.exp.querySelector("#muExpShuffle")?.addEventListener("click", () => this.store.toggleShuffle());
    this.exp.querySelector("#muExpRepeat")?.addEventListener("click",  () => this.store.cycleRepeat());
    this.exp.querySelector("#muExpLike")?.addEventListener("click",    () => {
      const s = this.store.getCurrentSong();
      if (s) this.store.toggleLike(s.id);
    });
  }

  _bindExpandedScrubber() {
    const s = this.exp.querySelector("#muExpScrub");
    if (!s) return;
    let drag = false;
    const seek = (e) => {
      const r = s.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.player?.seekTo(p);
      this._setExpFill(p);
    };
    s.addEventListener("mousedown",  (e) => { drag = true; seek(e); });
    document.addEventListener("mousemove", (e) => { if (drag) seek(e); });
    document.addEventListener("mouseup",   () => { drag = false; });
  }

  _bindExpandedVolume() {
    const s = this.exp.querySelector("#muExpVol");
    if (!s) return;
    let drag = false;
    const set = (e) => {
      const r = s.getBoundingClientRect();
      this.store.setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
    };
    s.addEventListener("mousedown",  (e) => { drag = true; set(e); });
    document.addEventListener("mousemove", (e) => { if (drag) set(e); });
    document.addEventListener("mouseup",   () => { drag = false; });
  }

  _setExpFill(p) {
    const pct = p * 100;
    const fill  = this.exp.querySelector("#muExpFill");
    const thumb = this.exp.querySelector("#muExpThumb");
    if (fill)  fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
  }

  // ─────────────────────────────────────────────
  //  OPEN / CLOSE
  // ─────────────────────────────────────────────
  _openExpanded() {
    if (!this.store.state.currentSongId) return;
    this.expanded = true;
    this.exp.classList.add("open");
    this.pill.classList.add("hidden");
  }

  _closeExpanded() {
    this.expanded = false;
    this.exp.classList.remove("open");
    this.pill.classList.remove("hidden");
  }

  // ─────────────────────────────────────────────
  //  PROGRESS
  // ─────────────────────────────────────────────
  _bindProgress() {
    window.addEventListener("mu-progress", (e) => {
      const { currentTime, duration, progress } = e.detail;
      this._setPillFill(progress);
      this._setExpFill(progress);
      const fmt = this.store.formatDuration.bind(this.store);
      const pc = this.pill.querySelector("#muPillCurr"); if (pc) pc.textContent = fmt(currentTime);
      const pd = this.pill.querySelector("#muPillDur");  if (pd) pd.textContent = fmt(duration);
      const ec = this.exp.querySelector("#muExpCurr");   if (ec) ec.textContent = fmt(currentTime);
      const ed = this.exp.querySelector("#muExpDur");    if (ed) ed.textContent = fmt(duration);
    });
  }

  // ─────────────────────────────────────────────
  //  SYNC
  // ─────────────────────────────────────────────
  _sync() {
    const { isPlaying, shuffle, repeat, volume, currentSongId } = this.store.state;
    const song   = currentSongId ? this.store.getSong(currentSongId) : null;
    const album  = song ? this.store.getAlbum(song.albumId)   : null;
    const artist = song ? this.store.getArtist(song.artistId) : null;
    const artUrl = song ? this.store.getArtworkUrl(song.albumId) : null;
    const liked  = song ? this.store.isLiked(song.id) : false;

    // ── pill art ──
    const pa = this.pill.querySelector("#muPillArt");
    const pf = this.pill.querySelector("#muPillArtFall");
    if (pa && artUrl) {
      pa.src = artUrl; pa.style.display = "block";
      if (pf) pf.style.display = "none";
      pa.onerror = () => { pa.style.display = "none"; if (pf) pf.style.display = "flex"; };
    } else if (pa) { pa.style.display = "none"; if (pf) pf.style.display = "flex"; }

    // ── pill text ──
    const pt = this.pill.querySelector("#muPillTitle");
    const par = this.pill.querySelector("#muPillArtist");
    if (pt)  pt.textContent  = song?.title  ?? "Not Playing";
    if (par) par.textContent = artist?.name ?? "—";

    // ── pill play icon ──
    const ppi = this.pill.querySelector("#muPillPlayIcon");
    if (ppi) ppi.innerHTML = isPlaying
      ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
      : `<path d="M8 5v14l11-7z"/>`;

    // ── pill shuffle / repeat ──
    this.pill.querySelector("#muPillShuffle")?.classList.toggle("active", shuffle);
    const pr = this.pill.querySelector("#muPillRepeat");
    if (pr) {
      pr.classList.toggle("active", repeat !== "none");
      pr.querySelector(".mu-repeat-1")?.remove();
      if (repeat === "one") {
        const b = document.createElement("div"); b.className = "mu-repeat-1"; b.textContent = "1"; pr.appendChild(b);
      }
    }

    // ── pill volume ──
    const vf = this.pill.querySelector("#muPillVolFill");  if (vf) vf.style.width = (volume*100)+"%";
    const vt = this.pill.querySelector("#muPillVolThumb"); if (vt) vt.style.left  = (volume*100)+"%";

    // ── expanded art ──
    const ea = this.exp.querySelector("#muExpArt");
    const ef = this.exp.querySelector("#muExpArtFall");
    if (ea && artUrl) {
      ea.src = artUrl; ea.style.display = "block";
      if (ef) ef.style.display = "none";
      ea.onerror = () => { ea.style.display = "none"; if (ef) ef.style.display = "flex"; };
    } else if (ea) { ea.style.display = "none"; if (ef) ef.style.display = "flex"; }

    // ── expanded bg (album color) ──
    const bg = this.exp.querySelector("#muExpBg");
    if (bg && album) {
      bg.style.background = `linear-gradient(160deg, ${album.color}ff 0%, ${album.color}99 50%, #0a0a0f 100%)`;
    }

    // ── expanded text ──
    const et = this.exp.querySelector("#muExpTitle");   if (et) et.textContent = song?.title  ?? "Not Playing";
    const ear = this.exp.querySelector("#muExpArtist"); if (ear) ear.textContent = artist?.name ?? "—";

    // ── expanded like ──
    const el = this.exp.querySelector("#muExpLike");
    if (el) {
      el.classList.toggle("liked", liked);
      el.innerHTML = `<svg viewBox="0 0 24 24" fill="${liked?"currentColor":"none"}" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }

    // ── expanded play icon ──
    const epi = this.exp.querySelector("#muExpPlayIcon");
    if (epi) epi.innerHTML = isPlaying
      ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
      : `<path d="M8 5v14l11-7z"/>`;

    // ── expanded shuffle/repeat ──
    this.exp.querySelector("#muExpShuffle")?.classList.toggle("active", shuffle);
    const er = this.exp.querySelector("#muExpRepeat");
    if (er) {
      er.classList.toggle("active", repeat !== "none");
      er.querySelector(".mu-repeat-1")?.remove();
      if (repeat === "one") {
        const b = document.createElement("div"); b.className = "mu-repeat-1"; b.textContent = "1"; er.appendChild(b);
      }
    }

    // ── expanded volume ──
    const evf = this.exp.querySelector("#muExpVolFill");  if (evf) evf.style.width = (volume*100)+"%";
    const evt = this.exp.querySelector("#muExpVolThumb"); if (evt) evt.style.left  = (volume*100)+"%";
  }
}
