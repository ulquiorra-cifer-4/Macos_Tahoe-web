"use strict";
// ============================================================
//  macOS Tahoe — apps/trash.ts  (no module exports)
// ============================================================
const TRASH_ITEMS = [
    { name: "old-project.zip", size: "48.2 MB", date: "Apr 28, 2026", icon: "🗜️" },
    { name: "Screenshot 2026.png", size: "3.1 MB", date: "Apr 30, 2026", icon: "🖼️" },
    { name: "notes-backup.txt", size: "12 KB", date: "May 1, 2026", icon: "📄" },
    { name: "Untitled.dmg", size: "210 MB", date: "Apr 22, 2026", icon: "💿" },
];
function buildTrashApp(_win) {
    const root = document.createElement("div");
    root.className = "trash-app";
    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "finder-toolbar";
    const titleWrap = document.createElement("div");
    titleWrap.className = "finder-title";
    titleWrap.innerHTML = `<span class="finder-title-icon">🗑️</span><span class="finder-title-text">Trash</span>`;
    const emptyBtn = document.createElement("button");
    emptyBtn.className = "finder-btn empty-btn";
    emptyBtn.textContent = "Empty Trash";
    const actions = document.createElement("div");
    actions.className = "finder-actions";
    actions.appendChild(emptyBtn);
    toolbar.append(titleWrap, actions);
    // Sidebar
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
    // File list
    const main = document.createElement("div");
    main.className = "finder-main";
    const headers = document.createElement("div");
    headers.className = "file-list-header";
    headers.innerHTML = `
    <span class="col-name">Name</span>
    <span class="col-date">Date Deleted</span>
    <span class="col-size">Size</span>
  `;
    const listEl = document.createElement("div");
    listEl.className = "file-list";
    const countEl = document.createElement("span");
    countEl.className = "status-count";
    function renderItems() {
        listEl.innerHTML = "";
        countEl.textContent = TRASH_ITEMS.length + " items";
        if (TRASH_ITEMS.length === 0) {
            emptyBtn.disabled = true;
            emptyBtn.classList.add("disabled");
            listEl.innerHTML = `<div class="trash-empty-state"><div class="empty-icon">🗑️</div><div class="empty-label">Trash is Empty</div></div>`;
            return;
        }
        TRASH_ITEMS.forEach((_item, i) => {
            const item = TRASH_ITEMS[i];
            const row = document.createElement("div");
            row.className = "file-row";
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
    emptyBtn.addEventListener("click", () => {
        if (TRASH_ITEMS.length === 0)
            return;
        const rows = listEl.querySelectorAll(".file-row");
        rows.forEach((row, i) => {
            row.style.transition = `opacity 0.18s ease ${i * 45}ms, transform 0.18s ease ${i * 45}ms`;
            row.style.opacity = "0";
            row.style.transform = "translateX(16px)";
        });
        setTimeout(() => {
            TRASH_ITEMS.length = 0;
            renderItems();
        }, rows.length * 45 + 220);
    });
    renderItems();
    main.append(headers, listEl);
    // Status bar
    const statusBar = document.createElement("div");
    statusBar.className = "finder-statusbar";
    statusBar.appendChild(countEl);
    // Layout
    const body = document.createElement("div");
    body.className = "finder-body";
    body.append(sidebar, main);
    root.append(toolbar, body, statusBar);
    return root;
}
// ── Register globally ──
window.openTrashWindow = function () {
    window.__createWindow({
        appId: "trash",
        title: "Trash",
        width: 680,
        height: 460,
        content: buildTrashApp,
    });
};
