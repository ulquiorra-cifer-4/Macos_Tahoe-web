"use strict";
// ============================================================
//  menubar-apple-functions.js
//  Implements all Apple menu actions:
//  • About This Mac  — full window with system info + user profile
//  • Force Quit      — closes all open app windows
//  • Sleep           — screen darkens, wakes on click/move
//  • Shut Down       — Apple logo + "Shutting down..." → black screen
// ============================================================

// ─────────────────────────────────────────────
//  ABOUT THIS MAC
// ─────────────────────────────────────────────
function openAboutThisMac() {
  // Don't open twice
  if (document.getElementById("aboutThisMacWin")) return;

  const overlay = document.createElement("div");
  overlay.id = "aboutThisMacWin";
  overlay.className = "atm-overlay";

  overlay.innerHTML = `
    <div class="atm-window">
      <!-- Traffic lights -->
      <div class="atm-tl">
        <button class="atm-tl-btn atm-close" id="atmClose" title="Close"></button>
        <button class="atm-tl-btn atm-min"   title="Minimize" style="pointer-events:none"></button>
        <button class="atm-tl-btn atm-max"   title="Maximize" style="pointer-events:none"></button>
      </div>

      <!-- Tab bar -->
      <div class="atm-tabs">
        <button class="atm-tab active" data-tab="system">Overview</button>
        <button class="atm-tab"        data-tab="user">User Profile</button>
      </div>

      <!-- ── SYSTEM TAB ── -->
      <div class="atm-panel" id="atmSystem">
        <div class="atm-mac-hero">
          <!-- MacBook SVG illustration -->
          <svg class="atm-macbook-svg" viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
            <!-- Screen body -->
            <rect x="30" y="8" width="160" height="100" rx="6" fill="#1d1d1f" stroke="#3a3a3c" stroke-width="1"/>
            <!-- Screen bezel -->
            <rect x="34" y="12" width="152" height="92" rx="3" fill="#0a0a0a"/>
            <!-- Wallpaper gradient on screen -->
            <defs>
              <linearGradient id="atmWall" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stop-color="#0b2545"/>
                <stop offset="50%"  stop-color="#1a5a8a"/>
                <stop offset="100%" stop-color="#89c8d8"/>
              </linearGradient>
            </defs>
            <rect x="34" y="12" width="152" height="92" rx="3" fill="url(#atmWall)"/>
            <!-- Apple logo on lid back -->
            <circle cx="110" cy="5" r="3" fill="#3a3a3c"/>
            <!-- Base / keyboard -->
            <path d="M20 110 Q20 108 30 108 L190 108 Q200 108 200 110 L205 118 Q206 120 110 120 Q14 120 15 118 Z" fill="#2a2a2c" stroke="#3a3a3c" stroke-width="0.5"/>
            <!-- Trackpad -->
            <rect x="88" y="112" width="44" height="6" rx="2" fill="#333"/>
          </svg>

          <div class="atm-mac-name">MacBook Pro</div>
          <div class="atm-mac-sub">macOS Tahoe Web — Version 26.0</div>
        </div>

        <div class="atm-specs-grid">
          <div class="atm-spec-row">
            <span class="atm-spec-label">Chip</span>
            <span class="atm-spec-val">Apple M4 Max</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">Memory</span>
            <span class="atm-spec-val">128 GB</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">Storage</span>
            <span class="atm-spec-val">4 TB SSD</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">Display</span>
            <span class="atm-spec-val">16.2-inch Liquid Retina XDR</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">Serial Number</span>
            <span class="atm-spec-val">C02ZT4HMD6N1</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">macOS</span>
            <span class="atm-spec-val">Tahoe 26.0 (Build 26A5295e)</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">GPU Cores</span>
            <span class="atm-spec-val">40-core GPU</span>
          </div>
          <div class="atm-spec-row">
            <span class="atm-spec-label">Battery</span>
            <span class="atm-spec-val">100% — Fully Charged</span>
          </div>
        </div>

        <div class="atm-footer-btn-row">
          <button class="atm-footer-btn">System Report…</button>
          <button class="atm-footer-btn">Software Update…</button>
        </div>
      </div>

      <!-- ── USER TAB ── -->
      <div class="atm-panel" id="atmUser" style="display:none">
        <div class="atm-user-avatar-section">
          <div class="atm-avatar-wrap" id="atmAvatarWrap">
            <img class="atm-avatar-img" id="atmAvatarImg" src="" alt="" style="display:none" />
            <div class="atm-avatar-initials" id="atmAvatarInitials">DR</div>
            <div class="atm-avatar-overlay" id="atmAvatarOverlay" title="Change photo">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4zm7.2-11.2h-2.56l-1.44-2H8.8L7.36 4H4.8A2.4 2.4 0 0 0 2.4 6.4v12A2.4 2.4 0 0 0 4.8 20.8h14.4a2.4 2.4 0 0 0 2.4-2.4v-12A2.4 2.4 0 0 0 19.2 4z"/></svg>
            </div>
          </div>
          <input type="file" id="atmAvatarInput" accept="image/*" style="display:none" />
          <div class="atm-avatar-hint">Click photo to change</div>
        </div>

        <div class="atm-user-fields">
          <div class="atm-field-row">
            <label class="atm-field-label">Full Name</label>
            <input class="atm-field-input" id="atmName" type="text" placeholder="Your Name" value="Danny Rico" />
          </div>
          <div class="atm-field-row">
            <label class="atm-field-label">Username</label>
            <input class="atm-field-input" id="atmUsername" type="text" placeholder="username" value="dannyrico1" />
          </div>
          <div class="atm-field-row">
            <label class="atm-field-label">Email</label>
            <input class="atm-field-input" id="atmEmail" type="email" placeholder="email@icloud.com" value="" />
          </div>
          <div class="atm-field-row">
            <label class="atm-field-label">Bio</label>
            <input class="atm-field-input" id="atmBio" type="text" placeholder="Short bio…" value="" />
          </div>
        </div>

        <div class="atm-footer-btn-row">
          <button class="atm-footer-btn atm-save-btn" id="atmSaveBtn">Save Changes</button>
          <span class="atm-save-status" id="atmSaveStatus"></span>
        </div>
      </div>

    </div>
  `;

  document.getElementById("desktop")?.appendChild(overlay);

  // ── Tab switching ──
  overlay.querySelectorAll(".atm-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      overlay.querySelectorAll(".atm-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      overlay.querySelectorAll(".atm-panel").forEach(p => p.style.display = "none");
      document.getElementById(`atm${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`)
              .style.display = "";
    });
  });

  // ── Close ──
  overlay.querySelector("#atmClose")?.addEventListener("click", () => {
    overlay.style.transition = "opacity 180ms ease";
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 190);
  });

  // ── Avatar upload ──
  const avatarWrap  = overlay.querySelector("#atmAvatarWrap");
  const avatarInput = overlay.querySelector("#atmAvatarInput");
  const avatarImg   = overlay.querySelector("#atmAvatarImg");
  const initials    = overlay.querySelector("#atmAvatarInitials");

  avatarWrap?.addEventListener("click", () => avatarInput?.click());
  avatarInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      avatarImg.src = ev.target.result;
      avatarImg.style.display = "block";
      initials.style.display  = "none";
      // Persist
      try { localStorage.setItem("macos_user_avatar", ev.target.result); } catch {}
    };
    reader.readAsDataURL(file);
  });

  // Load saved avatar
  const savedAvatar = localStorage.getItem("macos_user_avatar");
  if (savedAvatar) {
    avatarImg.src = savedAvatar;
    avatarImg.style.display = "block";
    initials.style.display  = "none";
  }

  // Load saved user info
  const savedUser = _loadUserProfile();
  if (savedUser.name)     overlay.querySelector("#atmName").value     = savedUser.name;
  if (savedUser.username) overlay.querySelector("#atmUsername").value = savedUser.username;
  if (savedUser.email)    overlay.querySelector("#atmEmail").value    = savedUser.email;
  if (savedUser.bio)      overlay.querySelector("#atmBio").value      = savedUser.bio;

  // Update initials from name
  function updateInitials() {
    const n = overlay.querySelector("#atmName").value.trim();
    const parts = n.split(" ").filter(Boolean);
    const ini = parts.length >= 2
      ? parts[0][0] + parts[parts.length-1][0]
      : (parts[0]?.[0] ?? "U");
    initials.textContent = ini.toUpperCase();
  }
  overlay.querySelector("#atmName")?.addEventListener("input", updateInitials);
  updateInitials();

  // Save
  overlay.querySelector("#atmSaveBtn")?.addEventListener("click", () => {
    const profile = {
      name:     overlay.querySelector("#atmName").value.trim(),
      username: overlay.querySelector("#atmUsername").value.trim(),
      email:    overlay.querySelector("#atmEmail").value.trim(),
      bio:      overlay.querySelector("#atmBio").value.trim(),
    };
    _saveUserProfile(profile);
    const status = overlay.querySelector("#atmSaveStatus");
    if (status) {
      status.textContent = "✓ Saved";
      status.style.color = "#34c759";
      setTimeout(() => { status.textContent = ""; }, 2000);
    }
  });

  // Entrance animation
  overlay.style.opacity = "0";
  requestAnimationFrame(() => {
    overlay.style.transition = "opacity 200ms ease";
    overlay.style.opacity = "1";
  });
}

function _loadUserProfile() {
  try { return JSON.parse(localStorage.getItem("macos_user_profile") || "{}"); } catch { return {}; }
}
function _saveUserProfile(p) {
  try { localStorage.setItem("macos_user_profile", JSON.stringify(p)); } catch {}
}

// ─────────────────────────────────────────────
//  FORCE QUIT  — close all open windows
// ─────────────────────────────────────────────
function forceQuitAll() {
  // Get all .app-window elements and close them
  const wins = document.querySelectorAll(".app-window");
  if (!wins.length) return;

  wins.forEach((win, i) => {
    const delay = i * 60;
    setTimeout(() => {
      win.style.transition = "opacity 180ms ease, transform 180ms ease";
      win.style.opacity    = "0";
      win.style.transform  = (win.style.transform || "") + " scale(0.92)";
      setTimeout(() => win.remove(), 190);
    }, delay);
  });

  // Show brief toast
  _showToast("All apps force quit");
}

// ─────────────────────────────────────────────
//  SLEEP
// ─────────────────────────────────────────────
let _sleepEl = null;
function sleep() {
  if (_sleepEl) return;

  const overlay = document.createElement("div");
  overlay.id = "sleepOverlay";
  overlay.className = "sys-sleep-overlay";
  overlay.innerHTML = `<div class="sys-sleep-inner"></div>`;

  document.getElementById("desktop")?.appendChild(overlay);
  _sleepEl = overlay;

  // Fade to black
  requestAnimationFrame(() => {
    overlay.style.transition = "opacity 1.4s cubic-bezier(0.4,0,0.8,1)";
    overlay.style.opacity = "1";
  });

  // Wake on any interaction
  function wake(e) {
    if (!_sleepEl) return;
    _sleepEl.style.transition = "opacity 900ms ease";
    _sleepEl.style.opacity    = "0";
    setTimeout(() => {
      _sleepEl?.remove();
      _sleepEl = null;
    }, 950);
    document.removeEventListener("mousemove", wake);
    document.removeEventListener("mousedown", wake);
    document.removeEventListener("keydown",   wake);
  }

  // Small delay before listening so the click that triggered sleep doesn't instantly wake
  setTimeout(() => {
    document.addEventListener("mousemove", wake, { once: false });
    document.addEventListener("mousedown", wake, { once: true  });
    document.addEventListener("keydown",   wake, { once: true  });
  }, 1600);
}

// ─────────────────────────────────────────────
//  SHUT DOWN
// ─────────────────────────────────────────────
function shutDown() {
  const overlay = document.createElement("div");
  overlay.id = "shutdownOverlay";
  overlay.className = "sys-shutdown-overlay";
  overlay.innerHTML = `
    <div class="sys-sd-content">
      <svg class="sys-sd-apple" viewBox="0 0 24 24" fill="currentColor" width="52" height="52">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <div class="sys-sd-text">Shutting Down…</div>
      <div class="sys-sd-sub">Please wait</div>
    </div>
  `;

  document.getElementById("desktop")?.appendChild(overlay);

  // Phase 1: show content
  requestAnimationFrame(() => {
    overlay.style.transition = "opacity 600ms ease";
    overlay.style.opacity = "1";
  });

  // Phase 2: after 2.5s fade content, then go to full black
  setTimeout(() => {
    const content = overlay.querySelector(".sys-sd-content");
    if (content) {
      content.style.transition = "opacity 600ms ease";
      content.style.opacity    = "0";
    }
  }, 2500);

  // Phase 3: full black screen — system "off"
  setTimeout(() => {
    overlay.style.background = "#000";
    // Click to "reboot" (just removes the overlay)
    overlay.addEventListener("click", () => {
      overlay.style.transition = "opacity 800ms ease";
      overlay.style.opacity    = "0";
      setTimeout(() => overlay.remove(), 850);
    }, { once: true });

    const hint = document.createElement("div");
    hint.className = "sys-sd-hint";
    hint.textContent = "Click anywhere to restart";
    overlay.appendChild(hint);
    setTimeout(() => { hint.style.opacity = "1"; }, 200);
  }, 3400);
}

// ─────────────────────────────────────────────
//  Toast helper
// ─────────────────────────────────────────────
function _showToast(msg) {
  const t = document.createElement("div");
  t.className = "mb-sys-toast";
  t.textContent = msg;
  document.getElementById("desktop")?.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; });
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

// ─────────────────────────────────────────────
//  Patch buildDropdown to wire apple actions
// ─────────────────────────────────────────────
// Store original
const _origBuildDropdown = window._buildDropdownRef ?? buildDropdown;

// Override the item wiring inside buildDropdown by patching after menubar loads
(function patchAppleMenu() {
  // Wait for menuBar to be built then wire buttons
  function wire() {
    const bar = document.getElementById("menuBar");
    if (!bar) { setTimeout(wire, 100); return; }

    // Re-wire apple dropdown items by label
    const wireItem = (label, fn) => {
      bar.querySelectorAll(".menu-dropdown-item").forEach(btn => {
        const span = btn.querySelector("span");
        if (span?.textContent?.trim() === label) {
          // Clone to remove old listeners
          const newBtn = btn.cloneNode(true);
          btn.parentNode?.replaceChild(newBtn, btn);
          newBtn.addEventListener("click", () => {
            closeAllMenus?.();
            setTimeout(fn, 100);
          });
        }
      });
    };

    wireItem("About This Mac",  openAboutThisMac);
    wireItem("Force Quit…",     forceQuitAll);
    wireItem("Sleep",           sleep);
    wireItem("Shut Down…",      shutDown);
  }

  // Run after menubar.js has finished building
  if (document.readyState === "complete") {
    setTimeout(wire, 200);
  } else {
    window.addEventListener("load", () => setTimeout(wire, 200));
  }
})();

// Expose globally so they can be called from anywhere
window.__aboutThisMac = openAboutThisMac;
window.__forceQuit    = forceQuitAll;
window.__sleep        = sleep;
window.__shutDown     = shutDown;
