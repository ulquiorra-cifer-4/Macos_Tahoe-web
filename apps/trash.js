"use strict";
// ============================================================
//  Trash App — trash.js  (v2)
//  • Reads from window.__trashStore (real pipeline)
//  • macOS-accurate design (matches finder.css patterns)
//  • Dark mode aware
//  • Restore + permanent delete
// ============================================================

function buildTrashApp(_win) {
  const trash = window.__trashStore;
  const fs    = window.__finderFS;
  const root  = document.createElement("div");
  root.className = "trash-app";

  // ── Toolbar ──
  const toolbar = document.createElement("div");
  toolbar.className = "trash-toolbar";
  toolbar.innerHTML = `
    <div class="trash-tb-left">
      <div class="trash-tb-title">
        <span class="trash-tb-icon">🗑️</span>
        <span>Trash</span>
      </div>
    </div>
    <div class="trash-tb-right">
      <button class="trash-tb-btn trash-empty-btn" id="trashEmptyBtn">Empty Trash</button>
    </div>
  `;

  // ── Sidebar ──
  const sidebar = document.createElement("div");
  sidebar.className = "trash-sidebar";
  sidebar.innerHTML = `
    <div class="trash-sb-label">Locations</div>
    <div class="trash-sb-item active">
      <span class="trash-sb-icon">🗑️</span>
      <span>Trash</span>
    </div>
    <div class="trash-sb-sep"></div>
    <div class="trash-sb-label">Favourites</div>
    <div class="trash-sb-item" data-open="finder">
      <span class="trash-sb-icon">🏠</span>
      <span>Home</span>
    </div>
    <div class="trash-sb-item" data-open="desktop">
      <span class="trash-sb-icon">🖥️</span>
      <span>Desktop</span>
    </div>
    <div class="trash-sb-item" data-open="documents">
      <span class="trash-sb-icon">📄</span>
      <span>Documents</span>
    </div>
    <div class="trash-sb-item" data-open="downloads">
      <span class="trash-sb-icon">⬇️</span>
      <span>Downloads</span>
    </div>
  `;

  // Sidebar nav
  sidebar.querySelectorAll(".trash-sb-item[data-open]").forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.open;
      if (typeof window.openFinderWindow === "function") {
        if (target !== "finder") window.__finderNavigateTo = target;
        window.openFinderWindow();
      }
    });
  });

  // ── Main content ──
  const main = document.createElement("div");
  main.className = "trash-main";

  // List header
  const header = document.createElement("div");
  header.className = "trash-list-header";
  header.innerHTML = `
    <span class="trash-col-name">Name</span>
    <span class="trash-col-date">Date Deleted</span>
    <span class="trash-col-size">Size</span>
    <span class="trash-col-orig">Original Location</span>
  `;

  const listWrap = document.createElement("div");
  listWrap.className = "trash-list-wrap";
  listWrap.id = "trashListWrap";

  main.append(header, listWrap);

  // ── Status bar ──
  const statusBar = document.createElement("div");
  statusBar.className = "trash-statusbar";
  statusBar.id = "trashStatus";

  // ── Layout ──
  const body = document.createElement("div");
  body.className = "trash-body";
  body.append(sidebar, main);
  root.append(toolbar, body, statusBar);

  // ── Render items ──
  function renderItems() {
    const items = trash ? trash.getItems() : [];
    const listEl = document.getElementById("trashListWrap");
    const statusEl = document.getElementById("trashStatus");
    const emptyBtn = document.getElementById("trashEmptyBtn");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = `
        <div class="trash-empty-state">
          <div class="trash-empty-icon">🗑️</div>
          <div class="trash-empty-title">Trash is Empty</div>
          <div class="trash-empty-sub">Items you delete will appear here</div>
        </div>
      `;
      if (statusEl) statusEl.textContent = "0 items";
      if (emptyBtn) emptyBtn.disabled = true;
      return;
    }

    if (emptyBtn) emptyBtn.disabled = false;

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "trash-list-row";
      row.dataset.id = item.id;

      const deleted  = new Date(item.deletedAt);
      const dateStr  = deleted.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
      const timeStr  = deleted.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
      const sizeStr  = fs ? fs.formatSize(item.size) : "--";
      const origLoc  = item.originalParentId
        ? (fs?.getNode(item.originalParentId)?.name ?? item.originalParentId)
        : "iCloud Drive";

      // Icon
      const iconEl = window.__FinderIcons
        ? window.__FinderIcons.renderSmall(item, 18)
        : _trashFallbackIcon(item);

      row.innerHTML = `
        <div class="trash-col-name">
          <span class="trash-item-icon"></span>
          <span class="trash-item-name">${item.name}</span>
        </div>
        <div class="trash-col-date">${dateStr}, ${timeStr}</div>
        <div class="trash-col-size">${item.type === "folder" ? "--" : sizeStr}</div>
        <div class="trash-col-orig">${origLoc}</div>
        <div class="trash-row-actions" id="trashRowActions_${item.id}">
          <button class="trash-action-btn trash-restore-btn" title="Put Back">↩ Put Back</button>
          <button class="trash-action-btn trash-delete-btn" title="Delete Immediately">🗑 Delete</button>
        </div>
      `;
      row.querySelector(".trash-item-icon")?.appendChild(iconEl);

      // Select
      row.addEventListener("click", (e) => {
        if (e.target.closest(".trash-action-btn")) return;
        listEl.querySelectorAll(".trash-list-row").forEach(r => r.classList.remove("selected"));
        row.classList.add("selected");
      });

      // Restore
      row.querySelector(".trash-restore-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const restored = trash.restore(item.id);
        if (restored && fs) {
          // Put back into FS
          const putBackParent = restored.originalParentId ?? null;
          const { deletedAt, originalParentId, ...fsNode } = restored;
          fs.nodes.set(fsNode.id, { ...fsNode, parentId: putBackParent });
          fs._save();
        }
        _animateRowOut(row, renderItems);
      });

      // Delete permanently
      row.querySelector(".trash-delete-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
          trash.remove(item.id);
          _animateRowOut(row, renderItems);
        }
      });

      listEl.appendChild(row);
    });

    const total = trash.getTotalSize();
    const sizeStr = fs ? fs.formatSize(total) : "";
    if (statusEl) statusEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}${sizeStr && sizeStr !== "--" ? " — "+sizeStr : ""}`;
  }

  // Empty trash
  document.getElementById("trashEmptyBtn")?.addEventListener("click", () => {
    const items = trash?.getItems() ?? [];
    if (!items.length) return;
    if (!confirm(`Permanently delete all ${items.length} item${items.length!==1?"s":""}? This cannot be undone.`)) return;

    const rows = document.querySelectorAll("#trashListWrap .trash-list-row");
    rows.forEach((row, i) => {
      row.style.transition = `opacity 180ms ease ${i*35}ms, transform 180ms ease ${i*35}ms`;
      row.style.opacity    = "0";
      row.style.transform  = "translateX(16px)";
    });
    setTimeout(() => {
      trash.empty();
      renderItems();
    }, rows.length * 35 + 220);
  });

  // Subscribe to trash store changes
  if (trash) {
    trash.subscribe(() => renderItems());
  }

  renderItems();
  return root;
}

function _trashFallbackIcon(item) {
  const div = document.createElement("div");
  const emojis = { folder:"📁", image:"🖼️", text:"📄", pdf:"📑", music:"🎵", video:"🎬", archive:"📦", dmg:"💿", unknown:"📄" };
  div.textContent = emojis[item.type] ?? "📄";
  div.style.fontSize = "16px";
  return div;
}

function _animateRowOut(row, callback) {
  row.style.transition = "opacity 160ms ease, transform 160ms ease, max-height 200ms ease 160ms";
  row.style.opacity    = "0";
  row.style.transform  = "translateX(20px)";
  row.style.overflow   = "hidden";
  setTimeout(() => { row.style.maxHeight = "0"; row.style.padding = "0"; }, 170);
  setTimeout(callback, 380);
}

// ── Register globally ──
window.openTrashWindow = function () {
  window.__createWindow({
    appId:   "trash",
    title:   "Trash",
    width:   740,
    height:  500,
    content: buildTrashApp,
  });
};
 
