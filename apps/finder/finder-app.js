"use strict";
// ============================================================
//  Finder App — finder-app.ts
//  Wires sidebar + toolbar + grid + preview
// ============================================================
class FinderApp {
    constructor() {
        // Navigation history
        this.history = [null];
        this.historyPos = 0;
        // Current state
        this.currentFolderId = null;
        this.currentTitle = "iCloud Drive";
        this.viewMode = "icons";
        this.showPreview = false;
        this.fs = window.__finderFS;
        this.el = document.createElement("div");
        this.el.className = "finder-app";
        this._build();
        this._navigateTo(null, "iCloud Drive"); // start at iCloud root
    }
    _build() {
        // ── Sidebar ──
        this.sidebar = new window.__FinderSidebar((loc) => {
            if (loc.virtual === "icloud" || loc.virtual === undefined && !loc.fsId) {
                this._navigateTo(null, loc.label);
            }
            else if (loc.fsId) {
                this._navigateTo(loc.fsId, loc.label);
            }
            else if (loc.virtual === "recents") {
                this._showRecents();
            }
        });
        // ── Toolbar ──
        this.toolbar = new window.__FinderToolbar({
            onBack: () => this._goBack(),
            onForward: () => this._goForward(),
            onViewChange: (m) => { this.viewMode = m; this.grid.setMode(m); },
            onSearch: (q) => {
                if (!q) {
                    this.grid.load(this.currentFolderId, this.viewMode);
                    _trackFinderFolder(this.currentFolderId);
                    return;
                }
                const results = this.fs.search(q);
                this.grid.loadSearch(results);
                this.toolbar.setTitle(`Search: "${q}"`, []);
            },
            onNewFolder: () => {
                const node = this.fs.createFolder(this.currentFolderId, "Untitled Folder");
                this.grid.load(this.currentFolderId);
                this._updateStatus();
            },
            onNewFile: () => {
                const node = this.fs.createTextFile(this.currentFolderId, "Untitled");
                this.grid.load(this.currentFolderId);
                this._updateStatus();
            },
            onShare: () => { },
            onGetInfo: () => { },
        });
        // ── Grid ──
        this.grid = new window.__FinderGrid({
            onOpen: (nodeId) => {
                const node = this.fs.getNode(nodeId);
                if (!node)
                    return;
                if (node.type === "folder") {
                    this._navigateTo(nodeId, node.name);
                }
                else if (node.type === "text") {
                    this._openTextInNotes(node);
                }
                else if (node.type === "image" && node.dataUrl) {
                    this._openImageViewer(node);
                }
                else {
                    alert(`Cannot open ${node.name} — unsupported file type`);
                }
            },
            onSelect: (ids) => {
                if (ids.length === 1) {
                    this.preview.show(ids[0]);
                    if (this.showPreview)
                        this._ensurePreviewVisible();
                }
                else {
                    this.preview.clear();
                }
                this._updateStatus(ids.length);
            },
            onRename: (id, name) => { this.fs.rename(id, name); this._updateStatus(); },
            onDelete: (ids) => { ids.forEach(id => this.fs.delete(id)); this._updateStatus(); },
            onDuplicate: (id) => { this.fs.duplicate(id); this._updateStatus(); },
            onGetInfo: (id) => { this._showInfoPanel(id); },
            onOpenInNotes: (id) => {
                const node = this.fs.getNode(id);
                if (node)
                    this._openTextInNotes(node);
            },
        });
        // ── Preview ──
        this.preview = new window.__FinderPreview();
        this.preview.el.style.display = "none";
        // ── Status bar ──
        this.statusEl = document.createElement("div");
        this.statusEl.className = "ff-statusbar";
        // ── Layout ──
        const body = document.createElement("div");
        body.className = "ff-body";
        body.append(this.sidebar.el, this._makeMainArea());
        this.el.append(this.toolbar.el, body, this.statusEl);
    }
    _makeMainArea() {
        const area = document.createElement("div");
        area.className = "ff-main-area";
        const contentWrap = document.createElement("div");
        contentWrap.className = "ff-content-wrap";
        contentWrap.id = "ffContentWrap";
        contentWrap.append(this.grid.el);
        // Preview toggle button in bottom-right of toolbar
        const pvToggle = document.createElement("button");
        pvToggle.className = "ff-pv-toggle";
        pvToggle.title = "Show Preview";
        pvToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
        pvToggle.addEventListener("click", () => {
            this.showPreview = !this.showPreview;
            pvToggle.classList.toggle("active", this.showPreview);
            if (this.showPreview) {
                contentWrap.appendChild(this.preview.el);
                this.preview.el.style.display = "";
            }
            else {
                this.preview.el.style.display = "none";
                this.preview.el.remove();
            }
        });
        this.toolbar.el.appendChild(pvToggle);
        area.appendChild(contentWrap);
        return area;
    }
    // ─────────────────────────────────────────────
    //  Navigation
    // ─────────────────────────────────────────────
    _navigateTo(folderId, title) {
        this.currentFolderId = folderId;
        this.currentTitle = title;
        // Trim forward history
        this.history = this.history.slice(0, this.historyPos + 1);
        this.history.push(folderId);
        this.historyPos = this.history.length - 1;
        this._renderCurrent();
    }
    _goBack() {
        if (this.historyPos <= 0)
            return;
        this.historyPos--;
        this.currentFolderId = this.history[this.historyPos];
        const node = this.currentFolderId ? this.fs.getNode(this.currentFolderId) : null;
        this.currentTitle = node?.name ?? "iCloud Drive";
        this._renderCurrent();
    }
    _goForward() {
        if (this.historyPos >= this.history.length - 1)
            return;
        this.historyPos++;
        this.currentFolderId = this.history[this.historyPos];
        const node = this.currentFolderId ? this.fs.getNode(this.currentFolderId) : null;
        this.currentTitle = node?.name ?? "iCloud Drive";
        this._renderCurrent();
    }
    _renderCurrent() {
        this.grid.load(this.currentFolderId, this.viewMode);
        _trackFinderFolder(this.currentFolderId);
        // Breadcrumb
        const path = this.fs.getPath(this.currentFolderId);
        const bc = ["iCloud Drive", ...path.map((n) => n.name)];
        this.toolbar.setTitle(this.currentTitle, bc);
        this.toolbar.setHistory(this.historyPos > 0, this.historyPos < this.history.length - 1);
        this._updateStatus();
        this.preview.clear();
    }
    _showRecents() {
        const all = this.fs.getChildren(null)
            .concat(["desktop", "documents", "downloads", "receipts"].flatMap((id) => this.fs.getChildren(id)))
            .filter((n) => n.type !== "folder")
            .sort((a, b) => b.modifiedAt - a.modifiedAt)
            .slice(0, 20);
        this.grid.loadSearch(all);
        this.toolbar.setTitle("Recents", ["Recents"]);
        this._updateStatus();
    }
    _updateStatus(selected = 0) {
        const items = this.fs.getChildren(this.currentFolderId);
        if (selected > 0) {
            this.statusEl.textContent = `${selected} item${selected !== 1 ? "s" : ""} selected`;
        }
        else {
            this.statusEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
        }
    }
    _ensurePreviewVisible() {
        const wrap = document.getElementById("ffContentWrap");
        if (wrap && !wrap.contains(this.preview.el)) {
            wrap.appendChild(this.preview.el);
            this.preview.el.style.display = "";
        }
    }
    // ─────────────────────────────────────────────
    //  Open text file in Notes app
    // ─────────────────────────────────────────────
    _openTextInNotes(node) {
        // Sync content into Notes store
        const notesStore = window.__notesStore;
        if (!notesStore) {
            alert("Notes app not loaded");
            return;
        }
        // Check if a note for this file already exists
        const allNotes = notesStore.getNotes();
        let existing = allNotes.find((n) => n.title === node.name);
        if (!existing) {
            existing = notesStore.createNote("notes");
            notesStore.updateNote(existing.id, {
                title: node.name,
                body: `<pre>${(node.content ?? "").replace(/</g, "&lt;")}</pre>`,
                plainText: node.content ?? "",
            });
        }
        // Open Notes window
        if (typeof window.openNotesWindow === "function") {
            window.openNotesWindow();
        }
    }
    // ─────────────────────────────────────────────
    //  Image viewer (inline lightbox)
    // ─────────────────────────────────────────────
    _openImageViewer(node) {
        const overlay = document.createElement("div");
        overlay.className = "ff-lightbox";
        overlay.innerHTML = `
      <div class="ff-lb-backdrop"></div>
      <div class="ff-lb-content">
        <button class="ff-lb-close">✕</button>
        <img src="${node.dataUrl}" class="ff-lb-img" alt="${node.name}" />
        <div class="ff-lb-name">${node.name}</div>
      </div>
    `;
        // Find the closest window element to append to
        const winEl = this.el.closest(".app-window") ?? document.getElementById("desktop");
        winEl?.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.querySelector(".ff-lb-close")?.addEventListener("click", close);
        overlay.querySelector(".ff-lb-backdrop")?.addEventListener("click", close);
        overlay.addEventListener("keydown", (e) => { if (e.key === "Escape")
            close(); });
    }
    // ─────────────────────────────────────────────
    //  Info panel
    // ─────────────────────────────────────────────
    _showInfoPanel(nodeId) {
        const node = this.fs.getNode(nodeId);
        if (!node)
            return;
        const date = new Date(node.modifiedAt);
        const created = new Date(node.createdAt);
        alert(`Info: ${node.name}\n` +
            `Kind: ${node.type}\n` +
            `Size: ${this.fs.formatSize(node.size)}\n` +
            `Created: ${created.toLocaleString()}\n` +
            `Modified: ${date.toLocaleString()}`);
    }
}
// ── Register globally ──
window.openFinderWindow = function () {
    // Check if instance exists AND its DOM element is still in the document
    const existing = window.__finderAppInstance;
    const winEl = existing?.el?.closest(".app-window");
    const isAlive = winEl && document.contains(winEl);
    if (isAlive) {
        // Window is open — just navigate if needed
        const navTo = window.__finderNavigateTo;
        if (navTo) {
            const node = window.__finderFS?.getNode(navTo);
            if (node)
                existing._navigateTo(navTo, node.name);
            window.__finderNavigateTo = null;
        }
        return;
    }
    // Clear stale instance before creating new one
    window.__finderAppInstance = null;
    window.__createWindow({
        appId: "finder",
        title: "Finder",
        width: 960,
        height: 580,
        content: (_win) => {
            const app = new FinderApp();
            window.__finderAppInstance = app;
            const navTo = window.__finderNavigateTo;
            if (navTo) {
                const node = window.__finderFS?.getNode(navTo);
                if (node)
                    setTimeout(() => app._navigateTo(navTo, node.name), 50);
                window.__finderNavigateTo = null;
            }
            return app.el;
        },
    });
};
// Expose current folder so desktop-manager can drop into it
function _trackFinderFolder(folderId) {
    window.__finderCurrentFolder = folderId;
}
