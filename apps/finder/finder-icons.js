"use strict";
// ============================================================
//  Finder — finder-icons.js
//  Renders proper file/folder icons using icons/ directory PNGs
//  with emoji fallback when PNG is missing.
//  Call: FingerIcons.render(node) → HTMLElement (60x60)
// ============================================================

const FinderIcons = (() => {

  // Map type → icon filename in icons/ directory
  const ICON_FILES = {
    folder:  "folder.png",
    image:   "file-image.png",
    text:    "file-text.png",
    pdf:     "file-pdf.png",
    music:   "file-music.png",
    video:   "file-video.png",
    archive: "file-archive.png",
    dmg:     "file-dmg.png",
    app:     "file-app.png",
    pkg:     "file-pkg.png",
    doc:     "file-doc.png",
    xls:     "file-xls.png",
    ppt:     "file-ppt.png",
    pages:   "file-pages.png",
    numbers: "file-numbers.png",
    keynote: "file-keynote.png",
    unknown: "file-generic.png",
  };

  // Emoji fallback
  const EMOJI_FALLBACK = {
    folder:"📁", image:"🖼️", text:"📄", pdf:"📑",
    music:"🎵", video:"🎬", archive:"📦", dmg:"💿",
    app:"📱", pkg:"📦", doc:"📝", xls:"📊",
    ppt:"📊", pages:"📄", numbers:"📊", keynote:"📊",
    unknown:"📄",
  };

  // Color accent per type (for the emoji box)
  const TYPE_COLOR = {
    folder:"#4CAAEE", image:"#34C759", text:"#8E8E93", pdf:"#FF3B30",
    music:"#FF2D55",  video:"#AF52DE", archive:"#FF9500", dmg:"#636366",
    app:"#007AFF",    pkg:"#FF9500",   doc:"#007AFF",     xls:"#34C759",
    ppt:"#FF6B00",    pages:"#007AFF", numbers:"#34C759", keynote:"#FF6B00",
    unknown:"#8E8E93",
  };

  // Rendered icon size
  const SIZE = 60;

  /**
   * Render an icon element for a FS node.
   * If node has a dataUrl (image), shows thumbnail.
   * Otherwise shows icon PNG or emoji fallback.
   * @param {object} node - FS node
   * @param {number} [size=60]
   * @returns {HTMLElement}
   */
  function render(node, size = SIZE) {
    const wrap = document.createElement("div");
    wrap.className = "ff-file-icon";
    wrap.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;`;

    // Thumbnail for images
    if (node.type === "image" && node.dataUrl) {
      const img = document.createElement("img");
      img.src = node.dataUrl;
      img.className = "ff-thumb";
      img.style.cssText = `width:${size}px;height:${size}px;object-fit:cover;border-radius:6px;`;
      wrap.appendChild(img);
      return wrap;
    }

    const type  = node.type ?? "unknown";
    const fname = ICON_FILES[type] ?? ICON_FILES.unknown;
    const path  = `icons/${fname}`;

    const img = document.createElement("img");
    img.alt    = type;
    img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;`;

    img.onerror = () => {
      // Fallback: colored emoji box
      img.remove();
      const fb = _makeEmojiFallback(type, size);
      wrap.appendChild(fb);
    };
    img.src = path;
    wrap.appendChild(img);
    return wrap;
  }

  function _makeEmojiFallback(type, size) {
    const div = document.createElement("div");
    const color = TYPE_COLOR[type] ?? "#8E8E93";
    const emoji = EMOJI_FALLBACK[type] ?? "📄";
    div.style.cssText = `
      width:${size}px;height:${size}px;
      background:${color}22;
      border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size*0.52)}px;
      border: 1.5px solid ${color}44;
    `;
    div.textContent = emoji;
    return div;
  }

  /**
   * Render a small inline icon (for list / column views).
   * Returns an HTMLElement 16×16.
   */
  function renderSmall(node, size = 18) {
    return render(node, size);
  }

  return { render, renderSmall };
})();

window.__FinderIcons = FinderIcons;
 
