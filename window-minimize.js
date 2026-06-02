"use strict";
// ============================================================
//  window-minimize.js
//  Adds macOS-style minimize-to-dock animation to the yellow
//  traffic light button.
//
//  Strategy:
//  • Uses MutationObserver to detect every new .app-window
//  • Finds the yellow (middle) traffic-light button
//  • Intercepts its click → runs genie/squeeze animation
//    toward the dock icon position, then hides the window
//  • A small "restore" badge appears on the dock icon
//  • Clicking the dock icon again (or re-opening) restores it
//  • Dock icon jiggles on minimize
//
//  Works with ANY app — just load this script after window-manager.js
// ============================================================

(function () {

  // ── Spring jiggle for dock icon ──
  function jiggleDockIcon(appId) {
    const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
    if (!btn) return;
    const imgEl = btn.querySelector("img, .dock-icon-emoji");
    if (!imgEl) return;

    let t = 0;
    const DURATION = 600; // ms
    const start = performance.now();
    const orig  = parseFloat(imgEl.style.width) || 57.6;

    function tick(now) {
      t = now - start;
      if (t >= DURATION) {
        imgEl.style.transform = "rotate(0deg) translateY(0)";
        return;
      }
      const prog  = t / DURATION;
      // Damped sine wave: rotation + vertical bounce
      const angle = Math.sin(prog * Math.PI * 6) * 8 * (1 - prog);
      const lift  = Math.sin(prog * Math.PI * 4) * -6 * (1 - prog);
      imgEl.style.transform = `rotate(${angle}deg) translateY(${lift}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Get dock icon screen position ──
  function getDockIconRect(appId) {
    const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
    if (!btn) return null;
    return btn.getBoundingClientRect();
  }

  // ── Minimise animation ──
  function minimizeWindow(winEl, appId) {
    if (winEl.dataset.minimized === "1") return; // already minimizing

    winEl.dataset.minimized = "1";
    const winRect  = winEl.getBoundingClientRect();
    const dockRect = getDockIconRect(appId);

    // Target = centre of dock icon, or bottom-centre of screen as fallback
    const targetX = dockRect
      ? dockRect.left + dockRect.width  / 2
      : window.innerWidth / 2;
    const targetY = dockRect
      ? dockRect.top  + dockRect.height / 2
      : window.innerHeight - 60;

    // Offset from window origin to target
    const dx = targetX - (winRect.left + winRect.width  / 2);
    const dy = targetY - (winRect.top  + winRect.height / 2);

    // Lock position so it doesn't snap during transform
    winEl.style.transition = "none";
    winEl.style.transformOrigin = "center center";

    // Force a reflow
    winEl.getBoundingClientRect();

    // Animate: scale down to near-zero, translate toward dock, fade out
    winEl.style.transition = [
      "transform 340ms cubic-bezier(0.4, 0, 0.8, 0.6)",
      "opacity 300ms ease 60ms",
    ].join(", ");

    requestAnimationFrame(() => {
      winEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.05)`;
      winEl.style.opacity   = "0";
    });

    // After animation completes: hide window, add dock badge
    setTimeout(() => {
      winEl.style.display = "none";
      winEl.dataset.minimizedHidden = "1";
      _addDockBadge(appId);
      jiggleDockIcon(appId);
    }, 380);
  }

  // ── Restore animation ──
  function restoreWindow(winEl, appId) {
    if (winEl.dataset.minimizedHidden !== "1") return;

    // Reset transform instantly (off-screen starting point)
    winEl.style.transition = "none";
    const dockRect = getDockIconRect(appId);
    const winRect  = winEl.getBoundingClientRect();

    const startX = dockRect
      ? (dockRect.left + dockRect.width/2) - (winRect.left + winRect.width/2)
      : 0;
    const startY = dockRect
      ? (dockRect.top + dockRect.height/2) - (winRect.top + winRect.height/2)
      : 80;

    winEl.style.transform  = `translate(${startX}px, ${startY}px) scale(0.05)`;
    winEl.style.opacity    = "0";
    winEl.style.display    = "";

    delete winEl.dataset.minimized;
    delete winEl.dataset.minimizedHidden;

    winEl.getBoundingClientRect(); // reflow

    winEl.style.transition = [
      "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      "opacity 280ms ease",
    ].join(", ");

    requestAnimationFrame(() => {
      winEl.style.transform = "translate(0, 0) scale(1)";
      winEl.style.opacity   = "1";
    });

    setTimeout(() => {
      winEl.style.transition = "";
      winEl.style.transform  = "";
      winEl.style.opacity    = "";
      _removeDockBadge(appId);
      jiggleDockIcon(appId);
    }, 420);
  }

  // ── Dock minimized badge ──
  function _addDockBadge(appId) {
    _removeDockBadge(appId); // remove existing
    const btn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
    if (!btn) return;
    const badge = document.createElement("div");
    badge.className = "wm-minimized-badge";
    badge.dataset.appId = appId;
    badge.title = "Minimized — click to restore";
    btn.appendChild(badge);
  }

  function _removeDockBadge(appId) {
    document.querySelectorAll(`.wm-minimized-badge[data-app-id="${appId}"]`)
            .forEach(b => b.remove());
  }

  // ── Find yellow button in a window ──
  // Tries multiple strategies since we don't know the exact markup
  function findYellowBtn(winEl) {
    // Strategy 1: explicit class names used by many macOS web emulators
    const candidates = [
      winEl.querySelector(".btn-yellow"),
      winEl.querySelector(".traffic-yellow"),
      winEl.querySelector(".win-minimize"),
      winEl.querySelector('[title*="inimize"]'),
      winEl.querySelector('[aria-label*="inimize"]'),
      winEl.querySelector(".window-btn:nth-child(2)"),
      winEl.querySelector(".stoplight:nth-child(2)"),
      winEl.querySelector(".traffic-light:nth-child(2)"),
    ];
    for (const c of candidates) {
      if (c) return c;
    }
    // Strategy 2: second coloured circle in the top-left group
    const circles = winEl.querySelectorAll(
      "button[class*='btn'], button[class*='light'], button[class*='traffic'], button[class*='win-']"
    );
    if (circles.length >= 2) return circles[1];

    // Strategy 3: find all small round buttons near top-left, pick second
    const allBtns = [...winEl.querySelectorAll("button")];
    const topBtns = allBtns.filter(b => {
      const r = b.getBoundingClientRect();
      const wr = winEl.getBoundingClientRect();
      return r.top < wr.top + 60 && r.left < wr.left + 120 && r.width < 20 && r.height < 20;
    });
    return topBtns[1] ?? null;
  }

  // ── Wire one window ──
  function wireWindow(winEl) {
    if (winEl.dataset.wmMinWired) return; // already wired
    winEl.dataset.wmMinWired = "1";

    const appId = winEl.dataset.appId ?? winEl.dataset.app ?? "";

    // Wire yellow button
    const yellowBtn = findYellowBtn(winEl);
    if (yellowBtn) {
      // Clone+replace to strip existing listeners, then re-add
      const newBtn = yellowBtn.cloneNode(true);
      newBtn.style.background = "#f5a623"; // ensure yellow colour
      yellowBtn.parentNode?.replaceChild(newBtn, yellowBtn);

      newBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        minimizeWindow(winEl, appId);
      });
    }

    // Wire dock icon click → restore if minimized
    wireDockRestore(appId, winEl);
  }

  // ── Wire dock icon to restore minimized window ──
  function wireDockRestore(appId, winEl) {
    if (!appId) return;
    const dockBtn = document.querySelector(`#dock .dock-item[data-id="${appId}"]`);
    if (!dockBtn || dockBtn.dataset.wmRestoreWired) return;
    dockBtn.dataset.wmRestoreWired = "1";

    dockBtn.addEventListener("click", (e) => {
      // If window is minimized, restore it instead of opening a new one
      if (winEl.dataset.minimizedHidden === "1") {
        e.stopImmediatePropagation();
        restoreWindow(winEl, appId);
      }
      // Otherwise the normal dock click handler fires (opens app)
    }, true); // capture phase so it fires before dock's own handler
  }

  // ── Observe DOM for new .app-window elements ──
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        // Direct .app-window
        if (node.classList?.contains("app-window")) {
          // Small delay so the window is fully built
          setTimeout(() => wireWindow(node), 50);
        }
        // Nested .app-window (some managers wrap in a container)
        node.querySelectorAll?.(".app-window").forEach(w => {
          setTimeout(() => wireWindow(w), 50);
        });
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also wire any windows already in the DOM
  document.querySelectorAll(".app-window").forEach(w => wireWindow(w));

  // ── Expose globally so apps can call manually ──
  window.__minimizeWindow = minimizeWindow;
  window.__restoreWindow  = restoreWindow;
  window.__jiggleDockIcon = jiggleDockIcon;

})();
