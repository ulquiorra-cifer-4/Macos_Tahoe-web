"use strict";
// ============================================================
//  Finder — finder-grid.ts
//  Main content area: icon, list, column, gallery views
// ============================================================
class FinderGrid {
    constructor(cbs) {
        this.mode = "icons";
        this.currentFolderId = null;
        this.selectedIds = new Set();
        this.nodes = [];
        this.cbs = cbs;
        this.fs = window.__finderFS;
        this.el = document.createElement("div");
        this.el.className = "ff-grid-wrap";
        this._setupDropZone();
    }
    // ── Load a folder ──
    load(folderId, mode) {
        this.currentFolderId = folderId;
        if (mode)
            this.mode = mode;
        this.selectedIds.clear();
        this.nodes = this.fs.getChildren(folderId);
        this._render();
    }
    loadSearch(results) {
        this.currentFolderId = null;
        this.selectedIds.clear();
        this.nodes = results;
        this._render();
    }
    setMode(mode) {
        this.mode = mode;
        this.nodes = this.currentFolderId !== null
            ? this.fs.getChildren(this.currentFolderId)
            : this.nodes;
        this._render();
    }
    // ── Render ──
    _render() {
        this.el.innerHTML = "";
        if (this.nodes.length === 0) {
            const empty = document.createElement("div");
            empty.className = "ff-empty";
            empty.innerHTML = `<div class="ff-empty-icon">📂</div><p>This folder is empty</p>`;
            this.el.appendChild(empty);
            return;
        }
        if (this.mode === "list") {
            this._renderList();
        }
        else if (this.mode === "columns") {
            this._renderColumns();
        }
        else {
            this._renderIcons(); // icons + gallery
        }
    }
    // ── Icon / Gallery view ──
    _renderIcons() {
        const grid = document.createElement("div");
        grid.className = this.mode === "gallery" ? "ff-gallery" : "ff-icon-grid";
        this.nodes.forEach(node => {
            const item = this._makeIconItem(node);
            grid.appendChild(item);
        });
        this.el.appendChild(grid);
        this._bindGridClick(grid);
    }
    _makeIconItem(node) {
        const item = document.createElement("div");
        item.className = "ff-icon-item" + (this.selectedIds.has(node.id) ? " selected" : "");
        item.dataset.nodeId = node.id;
        item.draggable = true;
        const iconEl = document.createElement("div");
        iconEl.className = "ff-file-icon";
        iconEl.innerHTML = this._renderIcon(node);
        const nameEl = document.createElement("div");
        nameEl.className = "ff-file-name";
        nameEl.textContent = node.name;
        item.append(iconEl, nameEl);
        // Double-click = open
        item.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this.cbs.onOpen(node.id);
        });
        // Single click = select
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            if (e.metaKey || e.ctrlKey) {
                this.selectedIds.has(node.id) ? this.selectedIds.delete(node.id) : this.selectedIds.add(node.id);
            }
            else {
                this.selectedIds.clear();
                this.selectedIds.add(node.id);
            }
            this._updateSelection();
            this.cbs.onSelect([...this.selectedIds]);
        });
        // Right-click context menu
        item.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.selectedIds.has(node.id)) {
                this.selectedIds.clear();
                this.selectedIds.add(node.id);
                this._updateSelection();
            }
            this._showContextMenu(e, node);
        });
        // Drag
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("nodeId", node.id);
            item.classList.add("dragging");
        });
        item.addEventListener("dragend", () => item.classList.remove("dragging"));
        // Drop (for folders)
        if (node.type === "folder") {
            item.addEventListener("dragover", (e) => { e.preventDefault(); item.classList.add("drag-over"); });
            item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
            item.addEventListener("drop", (e) => {
                e.preventDefault();
                item.classList.remove("drag-over");
                const srcId = e.dataTransfer.getData("nodeId");
                if (srcId && srcId !== node.id) {
                    this.fs.move(srcId, node.id);
                    this.load(this.currentFolderId);
                }
            });
        }
        return item;
    }
    // ── List view ──
    _renderList() {
        const table = document.createElement("div");
        table.className = "ff-list";
        // Header
        const header = document.createElement("div");
        header.className = "ff-list-header";
        header.innerHTML = `
      <span class="ff-lh-name">Name</span>
      <span class="ff-lh-date">Date Modified</span>
      <span class="ff-lh-size">Size</span>
      <span class="ff-lh-kind">Kind</span>
    `;
        table.appendChild(header);
        // Rows
        const body = document.createElement("div");
        body.className = "ff-list-body";
        this.nodes.forEach(node => {
            const row = document.createElement("div");
            row.className = "ff-list-row" + (this.selectedIds.has(node.id) ? " selected" : "");
            row.dataset.nodeId = node.id;
            const date = new Date(node.modifiedAt);
            const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
            row.innerHTML = `
        <span class="ff-lr-name">
          <span class="ff-lr-icon">${this._renderIcon(node, 16)}</span>
          <span class="ff-lr-label">${node.name}</span>
        </span>
        <span class="ff-lr-date">${dateStr}</span>
        <span class="ff-lr-size">${node.type === "folder" ? "--" : this.fs.formatSize(node.size)}</span>
        <span class="ff-lr-kind">${this._kindLabel(node)}</span>
      `;
            row.addEventListener("click", (e) => { e.stopPropagation(); this._selectRow(node.id, e); });
            row.addEventListener("dblclick", (e) => { e.stopPropagation(); this.cbs.onOpen(node.id); });
            row.addEventListener("contextmenu", (e) => { e.preventDefault(); this._showContextMenu(e, node); });
            body.appendChild(row);
        });
        table.appendChild(body);
        this.el.appendChild(table);
    }
    _selectRow(nodeId, e) {
        if (e.metaKey || e.ctrlKey) {
            this.selectedIds.has(nodeId) ? this.selectedIds.delete(nodeId) : this.selectedIds.add(nodeId);
        }
        else {
            this.selectedIds.clear();
            this.selectedIds.add(nodeId);
        }
        this._updateSelection();
        this.cbs.onSelect([...this.selectedIds]);
    }
    // ── Column view ──
    _renderColumns() {
        const wrap = document.createElement("div");
        wrap.className = "ff-columns";
        const col = document.createElement("div");
        col.className = "ff-column";
        this.nodes.forEach(node => {
            const row = document.createElement("div");
            row.className = "ff-col-row" + (this.selectedIds.has(node.id) ? " selected" : "");
            row.dataset.nodeId = node.id;
            row.innerHTML = `
        <span class="ff-col-icon">${this._renderIcon(node, 16)}</span>
        <span class="ff-col-name">${node.name}</span>
        ${node.type === "folder" ? `<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" class="ff-col-arrow"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>` : ""}
      `;
            row.addEventListener("click", () => {
                this.selectedIds.clear();
                this.selectedIds.add(node.id);
                this._updateSelection();
                if (node.type === "folder")
                    this.cbs.onOpen(node.id);
            });
            row.addEventListener("dblclick", () => this.cbs.onOpen(node.id));
            row.addEventListener("contextmenu", (e) => { e.preventDefault(); this._showContextMenu(e, node); });
            col.appendChild(row);
        });
        wrap.appendChild(col);
        this.el.appendChild(wrap);
    }
    // ── Context menu ──
    _showContextMenu(e, node) {
        document.getElementById("ff-ctx")?.remove();
        const menu = document.createElement("div");
        menu.id = "ff-ctx";
        menu.className = "ff-context-menu";
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;
        const isText = node.type === "text";
        menu.innerHTML = `
      <button class="ff-ctx-item" id="ffc-open">Open</button>
      ${isText ? `<button class="ff-ctx-item" id="ffc-notes">Open in Notes</button>` : ""}
      <div class="ff-ctx-sep"></div>
      <button class="ff-ctx-item" id="ffc-dup">Duplicate</button>
      <button class="ff-ctx-item" id="ffc-rename">Rename</button>
      <button class="ff-ctx-item" id="ffc-info">Get Info</button>
      <div class="ff-ctx-sep"></div>
      <button class="ff-ctx-item ff-ctx-danger" id="ffc-del">Move to Trash</button>
    `;
        document.body.appendChild(menu);
        menu.querySelector("#ffc-open")?.addEventListener("click", () => { menu.remove(); this.cbs.onOpen(node.id); });
        menu.querySelector("#ffc-notes")?.addEventListener("click", () => { menu.remove(); this.cbs.onOpenInNotes(node.id); });
        menu.querySelector("#ffc-dup")?.addEventListener("click", () => { menu.remove(); this.cbs.onDuplicate(node.id); this.load(this.currentFolderId); });
        menu.querySelector("#ffc-rename")?.addEventListener("click", () => { menu.remove(); this._startRename(node); });
        menu.querySelector("#ffc-info")?.addEventListener("click", () => { menu.remove(); this.cbs.onGetInfo(node.id); });
        menu.querySelector("#ffc-del")?.addEventListener("click", () => { menu.remove(); this.cbs.onDelete([node.id]); this.load(this.currentFolderId); });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }
    // ── Inline rename ──
    _startRename(node) {
        const item = this.el.querySelector(`[data-node-id="${node.id}"]`);
        if (!item)
            return;
        const nameEl = item.querySelector(".ff-file-name, .ff-lr-label, .ff-col-name");
        if (!nameEl)
            return;
        const original = node.name;
        const input = document.createElement("input");
        input.className = "ff-rename-input";
        input.value = original;
        nameEl.replaceWith(input);
        input.focus();
        input.select();
        const commit = () => {
            const newName = input.value.trim() || original;
            this.cbs.onRename(node.id, newName);
            this.load(this.currentFolderId);
        };
        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                commit();
            }
            if (e.key === "Escape") {
                input.value = original;
                input.blur();
            }
        });
    }
    // ── Context menu on empty space → new folder / file ──
    _bindGridClick(grid) {
        this.el.addEventListener("click", (e) => {
            if (e.target === this.el || e.target === grid) {
                this.selectedIds.clear();
                this._updateSelection();
            }
        });
        this.el.addEventListener("contextmenu", (e) => {
            const target = e.target;
            if (!target.closest("[data-node-id]")) {
                e.preventDefault();
                this._showEmptyContextMenu(e);
            }
        });
    }
    _showEmptyContextMenu(e) {
        document.getElementById("ff-ctx")?.remove();
        const menu = document.createElement("div");
        menu.id = "ff-ctx";
        menu.className = "ff-context-menu";
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;
        menu.innerHTML = `
      <button class="ff-ctx-item" id="ffc-empty-folder">New Folder</button>
      <button class="ff-ctx-item" id="ffc-empty-file">New Text File</button>
      <div class="ff-ctx-sep"></div>
      <button class="ff-ctx-item" id="ffc-paste-img">Import Image…</button>
    `;
        document.body.appendChild(menu);
        menu.querySelector("#ffc-empty-folder")?.addEventListener("click", () => { menu.remove(); this._newFolder(); });
        menu.querySelector("#ffc-empty-file")?.addEventListener("click", () => { menu.remove(); this._newFile(); });
        menu.querySelector("#ffc-paste-img")?.addEventListener("click", () => { menu.remove(); this._importImage(); });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }
    _newFolder() {
        const node = this.fs.createFolder(this.currentFolderId, "Untitled Folder");
        this.load(this.currentFolderId);
        requestAnimationFrame(() => this._startRename(node));
    }
    _newFile() {
        const node = this.fs.createTextFile(this.currentFolderId, "Untitled");
        this.load(this.currentFolderId);
        requestAnimationFrame(() => this._startRename(node));
    }
    _importImage() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = () => {
                this.fs.createImageFile(this.currentFolderId, file.name, reader.result, file.size);
                this.load(this.currentFolderId);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    // ── Drop zone (for external file drops) ──
    _setupDropZone() {
        this.el.addEventListener("dragover", (e) => { e.preventDefault(); this.el.classList.add("drag-active"); });
        this.el.addEventListener("dragleave", () => this.el.classList.remove("drag-active"));
        this.el.addEventListener("drop", (e) => {
            e.preventDefault();
            this.el.classList.remove("drag-active");
            const files = e.dataTransfer?.files;
            if (!files?.length)
                return;
            Array.from(files).forEach(file => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        this.fs.createImageFile(this.currentFolderId, file.name, reader.result, file.size);
                        this.load(this.currentFolderId);
                    };
                    reader.readAsDataURL(file);
                }
                else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        this.fs.createTextFile(this.currentFolderId, file.name, reader.result);
                        this.load(this.currentFolderId);
                    };
                    reader.readAsText(file);
                }
            });
        });
    }
    // ── Icon renderer ──
    _renderIcon(node, size = 56) {
        if (node.type === "folder") {
            return `<svg viewBox="0 0 56 44" width="${size}" height="${Math.round(size * 44 / 56)}">
        <path d="M4 8 C4 5.8 5.8 4 8 4 L22 4 L26 9 L50 9 C52.2 9 54 10.8 54 13 L54 38 C54 40.2 52.2 42 50 42 L8 42 C5.8 42 4 40.2 4 38 Z" fill="${node.color || "#4CAAEE"}"/>
        <path d="M4 13 L54 13 L54 38 C54 40.2 52.2 42 50 42 L8 42 C5.8 42 4 40.2 4 38 Z" fill="${node.color ? node.color : "#5BB8F5"}"/>
      </svg>`;
        }
        if (node.type === "image" && node.dataUrl) {
            return `<img src="${node.dataUrl}" class="ff-thumb" width="${size}" height="${size}" style="border-radius:6px;object-fit:cover" />`;
        }
        // Generic file icons by type
        const iconMap = {
            text: `<svg viewBox="0 0 44 56" width="${Math.round(size * 44 / 56)}" height="${size}"><path d="M6 0 L32 0 L44 12 L44 52 C44 54.2 42.2 56 40 56 L6 56 C3.8 56 2 54.2 2 52 L2 4 C2 1.8 3.8 0 6 0 Z" fill="#fff" stroke="#ddd" stroke-width="1.5"/><path d="M32 0 L32 12 L44 12 Z" fill="#eee"/><line x1="10" y1="20" x2="34" y2="20" stroke="#aaa" stroke-width="2"/><line x1="10" y1="27" x2="34" y2="27" stroke="#aaa" stroke-width="2"/><line x1="10" y1="34" x2="26" y2="34" stroke="#aaa" stroke-width="2"/></svg>`,
            pdf: `<svg viewBox="0 0 44 56" width="${Math.round(size * 44 / 56)}" height="${size}"><path d="M6 0 L32 0 L44 12 L44 52 C44 54.2 42.2 56 40 56 L6 56 C3.8 56 2 54.2 2 52 L2 4 C2 1.8 3.8 0 6 0 Z" fill="#ff3b30"/><path d="M32 0 L32 12 L44 12 Z" fill="rgba(0,0,0,0.2)"/><text x="22" y="36" text-anchor="middle" fill="white" font-size="10" font-weight="bold">PDF</text></svg>`,
            unknown: `<svg viewBox="0 0 44 56" width="${Math.round(size * 44 / 56)}" height="${size}"><path d="M6 0 L32 0 L44 12 L44 52 C44 54.2 42.2 56 40 56 L6 56 C3.8 56 2 54.2 2 52 L2 4 C2 1.8 3.8 0 6 0 Z" fill="#8e8e93"/><path d="M32 0 L32 12 L44 12 Z" fill="rgba(0,0,0,0.2)"/></svg>`,
        };
        const typeIcon = this.fs.getTypeIcon(node);
        return iconMap[typeIcon] ?? iconMap["unknown"];
    }
    _kindLabel(node) {
        if (node.type === "folder")
            return "Folder";
        const ext = node.name.split(".").pop()?.toUpperCase() ?? "File";
        return ext + " File";
    }
    _updateSelection() {
        this.el.querySelectorAll("[data-node-id]").forEach(el => {
            el.classList.toggle("selected", this.selectedIds.has(el.dataset.nodeId));
        });
    }
    getCurrentFolderId() { return this.currentFolderId; }
}
window.__FinderGrid = FinderGrid;
