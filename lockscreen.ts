// ============================================================
//  Lock Screen — lockscreen.ts
//  Video background, live clock, Enter to unlock,
//  smooth slide-up animation revealing desktop
// ============================================================

class LockScreen {
  el:        HTMLElement;
  private   clockInterval: number = 0;
  private   isUnlocking = false;

  constructor() {
    this.el = document.createElement("div");
    this.el.id = "lockScreen";
    this.el.className = "ls-root";
    this._build();
    this._startClock();
    this._bindEvents();
  }

  // ── Mount into DOM ──
  mount(): void {
    document.getElementById("desktop")!.appendChild(this.el);
    // Slight delay so CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.el.classList.add("ls-visible");
      });
    });
  }

  // ── Show lock screen (from menu bar Lock Screen) ──
  show(): void {
    this.isUnlocking = false;
    this.el.classList.remove("ls-unlocking");
    this.el.classList.add("ls-visible");
    this.el.style.display = "";
    this._startClock();

    // Also hide dock + menubar
    const dock = document.getElementById("dockContainer");
    const menu = document.getElementById("menuBar");
    if (dock) { dock.style.transition = "transform 0.4s ease"; dock.style.transform = "translateY(120%)"; }
    if (menu) { menu.style.transition = "transform 0.3s ease, opacity 0.3s ease"; menu.style.transform = "translateY(-100%)"; menu.style.opacity = "0"; }
  }

  // ── Unlock with animation ──
  unlock(): void {
    if (this.isUnlocking) return;
    this.isUnlocking = true;

    // 1. Password dots fill
    this._flashDots();

    setTimeout(() => {
      // 2. Lock screen slides UP out of view
      this.el.classList.add("ls-unlocking");

      // 3. Simultaneously: dock slides up from bottom, menubar fades down from top
      const dock = document.getElementById("dockContainer");
      const menu = document.getElementById("menuBar");

      if (dock) {
        dock.style.transition = "transform 0.6s cubic-bezier(0.34,1.2,0.64,1)";
        dock.style.transform  = "translateY(0%)";
      }
      if (menu) {
        menu.style.transition = "transform 0.5s cubic-bezier(0.34,1.2,0.64,1), opacity 0.5s ease";
        menu.style.transform  = "translateY(0%)";
        menu.style.opacity    = "1";
      }

      // 4. After slide-up finishes, hide lock screen
      setTimeout(() => {
        this.el.style.display = "none";
        clearInterval(this.clockInterval);
        // Clean up transitions
        if (dock) { dock.style.transition = ""; }
        if (menu) { menu.style.transition = ""; }
      }, 700);

    }, 280);
  }

  // ─────────────────────────────────────────────
  //  Build DOM
  // ─────────────────────────────────────────────
  private _build(): void {
    this.el.innerHTML = `
      <!-- Video background -->
      <div class="ls-bg">
        <video
          id="lsVideo"
          class="ls-video"
          autoplay muted loop playsinline
          src="55.mp4"
        ></video>
        <!-- Fallback wallpaper if video fails -->
        <div class="ls-video-fallback" id="lsVideoFallback"></div>
      </div>

      <!-- Top-right status bar -->
      <div class="ls-statusbar">
        <span class="ls-sb-item" id="lsInputMethod">ABC</span>
        <span class="ls-sb-item">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </span>
        <span class="ls-sb-item">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
        </span>
      </div>

      <!-- Date & Clock -->
      <div class="ls-clock-wrap">
        <div class="ls-date" id="lsDate">Tue Jul 8</div>
        <div class="ls-time" id="lsTime">18:14</div>
      </div>

      <!-- User + unlock -->
      <div class="ls-user-wrap" id="lsUserWrap">
        <div class="ls-avatar-ring">
          <img class="ls-avatar" src="user.png" alt="User"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <div class="ls-avatar-fallback" style="display:none">Nx</div>
        </div>
        <div class="ls-username">Nx4real</div>
        <div class="ls-hint" id="lsHint">Touch ID or Enter Password</div>

        <!-- Password dots (just visual, enter unlocks) -->
        <div class="ls-dots" id="lsDots">
          <div class="ls-dot"></div>
          <div class="ls-dot"></div>
          <div class="ls-dot"></div>
          <div class="ls-dot"></div>
          <div class="ls-dot"></div>
          <div class="ls-dot"></div>
        </div>

        <!-- Enter button -->
        <button class="ls-enter-btn" id="lsEnterBtn" title="Press Enter to unlock">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    `;

    // Handle video load failure — show wallpaper as fallback
    const video = this.el.querySelector<HTMLVideoElement>("#lsVideo");
    const fallback = this.el.querySelector<HTMLElement>("#lsVideoFallback");

    video?.addEventListener("error", () => {
      if (video) video.style.display = "none";
      if (fallback) fallback.style.opacity = "1";
    });

    // If video can't play after 3s, show fallback
    setTimeout(() => {
      if (video && video.readyState === 0) {
        video.style.display = "none";
        if (fallback) fallback.style.opacity = "1";
      }
    }, 3000);
  }

  // ─────────────────────────────────────────────
  //  Clock
  // ─────────────────────────────────────────────
  private _startClock(): void {
    clearInterval(this.clockInterval);
    this._updateClock();
    this.clockInterval = window.setInterval(() => this._updateClock(), 1000);
  }

  private _updateClock(): void {
    const now  = new Date();
    const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const h    = now.getHours().toString().padStart(2, "0");
    const m    = now.getMinutes().toString().padStart(2, "0");
    const dateEl = this.el.querySelector<HTMLElement>("#lsDate");
    const timeEl = this.el.querySelector<HTMLElement>("#lsTime");
    if (dateEl) dateEl.textContent = `${DAYS[now.getDay()]} ${MONS[now.getMonth()]} ${now.getDate()}`;
    if (timeEl) timeEl.textContent = `${h}:${m}`;
  }

  // ─────────────────────────────────────────────
  //  Events
  // ─────────────────────────────────────────────
  private _bindEvents(): void {
    // Enter button click
    this.el.querySelector("#lsEnterBtn")?.addEventListener("click", () => this.unlock());

    // Any click on user area = show enter btn, wiggle hint
    this.el.querySelector("#lsUserWrap")?.addEventListener("click", () => {
      const btn = this.el.querySelector<HTMLElement>("#lsEnterBtn");
      if (btn) btn.classList.add("visible");
      const hint = this.el.querySelector<HTMLElement>("#lsHint");
      if (hint) hint.textContent = "Press Enter to unlock";
    });
  }

  // ─────────────────────────────────────────────
  //  Visual feedback before unlock
  // ─────────────────────────────────────────────
  private _flashDots(): void {
    const dots = this.el.querySelectorAll<HTMLElement>(".ls-dot");
    dots.forEach((dot, i) => {
      setTimeout(() => dot.classList.add("filled"), i * 40);
    });
  }
}

// ── Singleton ──
let _lockScreenInstance: LockScreen | null = null;

function getLockScreen(): LockScreen {
  if (!_lockScreenInstance) _lockScreenInstance = new LockScreen();
  return _lockScreenInstance;
}

// ── Init: show lock screen on page load ──
(function initLockScreen() {
  const ls = getLockScreen();
  ls.mount();

  // Hide dock + menu bar initially (lock screen covers them)
  const dock = document.getElementById("dockContainer");
  const menu = document.getElementById("menuBar");
  if (dock) dock.style.transform = "translateY(120%)";
  if (menu) { menu.style.transform = "translateY(-100%)"; menu.style.opacity = "0"; }

  // Global keyboard: Enter or Space = unlock
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const ls = getLockScreen();
    if (!document.getElementById("lockScreen") ||
        document.getElementById("lockScreen")!.style.display === "none") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ls.unlock();
    }
  });

  // Expose globally for menu bar Lock Screen item
  (window as any).showLockScreen = () => {
    const ls = getLockScreen();
    ls.show();
  };
})();
