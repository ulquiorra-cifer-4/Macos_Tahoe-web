// ============================================================
//  macOS Tahoe — apps/trash.ts
//  Trash app window content
// ============================================================

import type { AppWindow } from "../window-manager.js";

// Fake trash items for demo
const TRASH_ITEMS = [
  { name: "old-project.zip",      size: "48.2 MB", date: "Apr 28, 2026", icon: "🗜️" },
  { name: "Screenshot 2026.png",  size: "3.1 MB",  date: "Apr 30, 2026", icon: "🖼️" },
  { name: "notes-backup.txt",     size: "12 KB",   date: "May 1, 2026",  icon: "📄" },
  { name: "Untitled.dmg",         size: "210 MB",  date: "Apr 22, 2026", icon: "💿" },
];

export function buildTrashApp(_win: AppWindow): HTMLElement {
  const root = document.createElement("div");
  root.className = "trash-app";

  // ── Toolbar ──
  const toolbar = document.createElement("div");
  toolbar.className = "finder-toolbar";

  const titleWrap = document.createElement("div");
  titleWrap.className = "finder-title";
  titleWrap.innerHTML = `<span class="finder-title-icon">🗑️</span><span class="finder-title-text">Trash</span>`;

  const actions = document.createElement("div");
  actions.className = "finder-actions";

  const emptyBtn = document.createElement("button");
  emptyBtn.className  = "finder-btn empty-btn";
  emptyBtn.textContent = "Empty Trash";
  emptyBtn.addEventListener("click", () => emptyTrash(listEl, emptyBtn, countEl));

  actions.appendChild(emptyBtn);
  toolbar.append(titleWrap, actions);

  // ── Sidebar ──
  const sidebar = document.createElement("div");
  sidebar.className = "finder-sidebar";
  sidebar.innerHTML = `
    <div class="sidebar-section-label">Locations</div>
    <div class="sidebar-item active"><span>🗑️</span> Trash</div>
    <div class="sidebar-section-label">Favourites</div>
    <div class="sidebar-item"><span>🏠</span> Home</div>
    <div class="sidebar-item"><span>🖥️</span> Desktop</div>
    <div class="sidebar-item"><span>📄</span> Documents</div>
    <div class="sidebar-item"><span>⬇️</span> Downloads</div>
  `;

  // ── File list ──
  const main = document.createElement("div");
  main.className = "finder-main";

  // Column headers
  const headers = document.createElement("div");
  headers.className = "file-list-header";
  headers.innerHTML = `
    <span class="col-name">Name</span>
    <span class="col-date">Date Deleted</span>
    <span class="col-size">Size</span>
  `;

  const listEl = document.createElement("div");
  listEl.className = "file-list";

  function renderItems() {
    listEl.innerHTML = "";
    if (TRASH_ITEMS.length === 0) {
      const empty = document.createElement("div");
      empty.className = "trash-empty-state";
      empty.innerHTML = `<div class="empty-icon">🗑️</div><div class="empty-label">Trash is Empty</div>`;
      listEl.appendChild(empty);
      return;
    }

    TRASH_ITEMS.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "file-row";
      row.dataset.index = String(i);
      row.innerHTML = `
        <span class="col-name"><span class="file-icon">${item.icon}</span>${item.name}</span>
        <span class="col-date">${item.date}</span>
        <span class="col-size">${item.size}</span>
      `;
      row.addEventListener("click", () => {
        listEl.querySelectorAll(".file-row").forEach(r => r.classList.remove("selected"));
        row.classList.add("selected");
      });
      listEl.appendChild(row);
    });
  }

  renderItems();
  main.append(headers, listEl);

  // ── Status bar ──
  const statusBar = document.createElement("div");
  statusBar.className = "finder-statusbar";
  const countEl = document.createElement("span");
  countEl.className = "status-count";
  countEl.textContent = `${TRASH_ITEMS.length} items`;
  statusBar.appendChild(countEl);

  // ── Layout ──
  const body = document.createElement("div");
  body.className = "finder-body";
  body.append(sidebar, main);

  root.append(toolbar, body, statusBar);
  return root;
}

function emptyTrash(listEl: HTMLElement, btn: HTMLButtonElement, countEl: HTMLElement) {
  if (TRASH_ITEMS.length === 0) return;

  // Animate rows out
  const rows = listEl.querySelectorAll<HTMLElement>(".file-row");
  rows.forEach((row, i) => {
    row.style.transition = `opacity 0.2s ease ${i * 40}ms, transform 0.2s ease ${i * 40}ms`;
    row.style.opacity    = "0";
    row.style.transform  = "translateX(20px)";
  });

  setTimeout(() => {
    TRASH_ITEMS.length = 0;
    listEl.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "trash-empty-state";
    empty.innerHTML = `<div class="empty-icon">🗑️</div><div class="empty-label">Trash is Empty</div>`;
    listEl.appendChild(empty);
    countEl.textContent = "0 items";
    btn.disabled = true;
    btn.classList.add("disabled");
  }, rows.length * 40 + 250);
}

// ── Register globally so dock.ts can call it ──
(window as any).openTrashWindow = function () {
  (window as any).__createWindow({
    appId:   "trash",
    title:   "Trash",
    width:   680,
    height:  460,
    content: buildTrashApp,
  });
};
