"use strict";
// ============================================================
//  Notes App — notes-app.ts
//  Assembles sidebar + note list + editor into 3-panel layout
// ============================================================
class NotesApp {
    constructor() {
        this.activeFolderId = "all";
        this.activeNoteId = null;
        this.searchMode = false;
        this.store = window.__notesStore;
        this.el = document.createElement("div");
        this.el.className = "notes-app";
        this._build();
        this.store.subscribe(() => this._refresh());
    }
    _build() {
        // ── Top toolbar (above all 3 panels) ──
        const topBar = document.createElement("div");
        topBar.className = "na-topbar";
        topBar.innerHTML = `
      <button class="na-topbar-btn" id="naSidebarToggle" title="Toggle Sidebar">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
      </button>
      <div class="na-topbar-center"></div>
      <div class="na-topbar-right">
        <button class="na-topbar-btn" id="naNewNote" title="New Note">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
      </div>
    `;
        // ── 3-panel body ──
        const body = document.createElement("div");
        body.className = "na-body";
        // Panel 1: Sidebar (folders)
        this.sidebarEl = document.createElement("div");
        this.sidebarEl.className = "na-sidebar";
        // Panel 2: Note list
        this.listEl = document.createElement("div");
        this.listEl.className = "na-list";
        // Panel 3: Editor
        this.editorPanelEl = document.createElement("div");
        this.editorPanelEl.className = "na-editor-panel";
        this.editor = new NotesEditor({
            onUpdate: (_html, _plain) => {
                // List re-renders on store notify
            },
        });
        this.editorPanelEl.appendChild(this.editor.el);
        body.append(this.sidebarEl, this.listEl, this.editorPanelEl);
        this.el.append(topBar, body);
        this._renderSidebar();
        this._renderList();
        this._bindTopBar();
    }
    // ─────────────────────────────────────────────
    //  Sidebar
    // ─────────────────────────────────────────────
    _renderSidebar() {
        this.sidebarEl.innerHTML = "";
        const header = document.createElement("div");
        header.className = "na-sidebar-header";
        header.innerHTML = `
      <span class="na-sidebar-title">iCloud</span>
      <button class="na-sidebar-add" id="naAddFolder" title="New Folder">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/></svg>
      </button>
    `;
        this.sidebarEl.appendChild(header);
        const folders = this.store.getFolders();
        // "All iCloud" always first
        const allFolder = folders.find((f) => f.id === "all");
        if (allFolder)
            this._renderFolderItem(allFolder);
        // iCloud group
        const groupLabel = document.createElement("div");
        groupLabel.className = "na-folder-group-label";
        groupLabel.textContent = "iCloud";
        this.sidebarEl.appendChild(groupLabel);
        folders.filter((f) => f.id !== "all" && f.id !== "deleted")
            .forEach((f) => this._renderFolderItem(f));
        // Deleted
        const del = folders.find((f) => f.id === "deleted");
        if (del) {
            const sep = document.createElement("div");
            sep.className = "na-folder-sep";
            this.sidebarEl.appendChild(sep);
            this._renderFolderItem(del);
        }
        // Add folder button
        document.getElementById("naAddFolder")?.addEventListener("click", () => {
            const name = prompt("Folder name:");
            if (name?.trim())
                this.store.createFolder(name.trim());
        });
    }
    _renderFolderItem(folder) {
        const item = document.createElement("button");
        item.className = "na-folder-item" + (folder.id === this.activeFolderId ? " active" : "");
        const count = this.store.getNoteCount(folder.id);
        const isTrash = folder.id === "deleted";
        item.innerHTML = `
      <span class="na-folder-icon" style="color:${isTrash ? "#8e8e93" : folder.color}">${folder.icon}</span>
      <span class="na-folder-name">${folder.name}</span>
      ${count > 0 ? `<span class="na-folder-count">${count}</span>` : ""}
    `;
        item.addEventListener("click", () => {
            this.activeFolderId = folder.id;
            this.activeNoteId = null;
            this.editor.loadNote(null);
            this._renderSidebar();
            this._renderList();
        });
        // Right-click context menu
        item.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this._showFolderContextMenu(e, folder);
        });
        this.sidebarEl.appendChild(item);
    }
    _showFolderContextMenu(e, folder) {
        document.getElementById("na-ctx-menu")?.remove();
        if (["all", "deleted"].includes(folder.id))
            return;
        const menu = document.createElement("div");
        menu.id = "na-ctx-menu";
        menu.className = "na-context-menu";
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.innerHTML = `
      <button class="na-ctx-item">Rename Folder</button>
      <div class="na-ctx-sep"></div>
      <button class="na-ctx-item na-ctx-danger">Delete Folder</button>
    `;
        document.body.appendChild(menu);
        const items = menu.querySelectorAll(".na-ctx-item");
        items[0].addEventListener("click", () => {
            menu.remove();
            const name = prompt("Rename folder:", folder.name);
            if (name?.trim())
                this.store.renameFolder(folder.id, name.trim());
        });
        items[1].addEventListener("click", () => {
            menu.remove();
            if (confirm(`Delete "${folder.name}" and all its notes?`)) {
                this.store.deleteFolder(folder.id);
                this.activeFolderId = "all";
                this._renderSidebar();
                this._renderList();
            }
        });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }
    // ─────────────────────────────────────────────
    //  Note List
    // ─────────────────────────────────────────────
    _renderList() {
        this.listEl.innerHTML = "";
        // List header
        const header = document.createElement("div");
        header.className = "na-list-header";
        const folder = this.store.getFolder(this.activeFolderId);
        const folderName = folder?.name ?? "Notes";
        const notes = this.searchMode
            ? this.store.searchNotes(this._getSearchQuery())
            : this.store.getNotes(this.activeFolderId);
        header.innerHTML = `
      <div class="na-list-title">${folderName}</div>
      <div class="na-list-count">${notes.length} note${notes.length !== 1 ? "s" : ""}</div>
      <div class="na-list-actions">
        <button class="na-list-btn" id="naListSort" title="Sort">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>
        </button>
        <button class="na-list-btn" id="naListMore" title="More">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>
    `;
        this.listEl.appendChild(header);
        // Note items grouped by year
        this.listBodyEl = document.createElement("div");
        this.listBodyEl.className = "na-list-body";
        if (notes.length === 0) {
            this.listBodyEl.innerHTML = `<div class="na-list-empty">No Notes</div>`;
        }
        else {
            // Group by year
            const groups = new Map();
            notes.forEach((note) => {
                const year = new Date(note.updatedAt).getFullYear().toString();
                if (!groups.has(year))
                    groups.set(year, []);
                groups.get(year).push(note);
            });
            // Sort years descending
            const sortedYears = [...groups.keys()].sort((a, b) => +b - +a);
            sortedYears.forEach(year => {
                const yearEl = document.createElement("div");
                yearEl.className = "na-year-header";
                yearEl.textContent = year;
                this.listBodyEl.appendChild(yearEl);
                groups.get(year).forEach((note) => this._renderNoteItem(note));
            });
        }
        this.listEl.appendChild(this.listBodyEl);
    }
    _renderNoteItem(note) {
        const item = document.createElement("button");
        item.className = "na-note-item" + (note.id === this.activeNoteId ? " active" : "");
        item.dataset.noteId = note.id;
        const date = this._formatDate(note.updatedAt);
        // Get preview image if note has one
        const tmpDiv = document.createElement("div");
        tmpDiv.innerHTML = note.body;
        const img = tmpDiv.querySelector("img");
        const thumbHtml = img
            ? `<img src="${img.src}" class="na-note-thumb" alt="" />`
            : "";
        // Preview text (strip HTML)
        const preview = note.plainText.substring(0, 80);
        item.innerHTML = `
      <div class="na-note-item-inner">
        <div class="na-note-item-main">
          <div class="na-note-item-header">
            ${note.pinned ? `<svg class="na-pin-icon" viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/></svg>` : ""}
            <span class="na-note-title">${this._escHtml(note.title)}</span>
          </div>
          <div class="na-note-meta">
            <span class="na-note-date">${date}</span>
            <span class="na-note-preview"> ${this._escHtml(preview)}</span>
          </div>
          <div class="na-note-folder-tag">
            <svg viewBox="0 0 24 24" fill="currentColor" width="9" height="9" style="opacity:.4"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            <span>${this._escHtml(this.store.getFolder(note.folderId)?.name ?? "Notes")}</span>
          </div>
        </div>
        ${thumbHtml ? `<div class="na-note-item-thumb">${thumbHtml}</div>` : ""}
      </div>
    `;
        item.addEventListener("click", () => this._openNote(note.id));
        // Right-click context
        item.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this._showNoteContextMenu(e, note);
        });
        this.listBodyEl.appendChild(item);
    }
    _openNote(noteId) {
        this.activeNoteId = noteId;
        const note = this.store.getNote(noteId);
        if (!note)
            return;
        // Re-render list to update active state
        this._renderList();
        // Load into editor
        this.editor.loadNote(note);
    }
    _showNoteContextMenu(e, note) {
        document.getElementById("na-ctx-menu")?.remove();
        const menu = document.createElement("div");
        menu.id = "na-ctx-menu";
        menu.className = "na-context-menu";
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.innerHTML = `
      <button class="na-ctx-item">${note.pinned ? "Unpin Note" : "Pin Note"}</button>
      <button class="na-ctx-item">Move to Folder…</button>
      <button class="na-ctx-item">Copy Link</button>
      <div class="na-ctx-sep"></div>
      <button class="na-ctx-item na-ctx-danger">Delete Note</button>
    `;
        document.body.appendChild(menu);
        const items = menu.querySelectorAll(".na-ctx-item");
        items[0].addEventListener("click", () => { menu.remove(); this.store.togglePin(note.id); });
        items[2].addEventListener("click", () => { menu.remove(); navigator.clipboard?.writeText(note.plainText); });
        items[3].addEventListener("click", () => {
            menu.remove();
            this.store.deleteNote(note.id);
            if (this.activeNoteId === note.id) {
                this.activeNoteId = null;
                this.editor.loadNote(null);
            }
        });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }
    // ─────────────────────────────────────────────
    //  Top bar bindings
    // ─────────────────────────────────────────────
    _bindTopBar() {
        // New note
        this.el.querySelector("#naNewNote")?.addEventListener("click", () => {
            const note = this.store.createNote(this.activeFolderId);
            this._renderList();
            this._openNote(note.id);
        });
        // Sidebar toggle
        this.el.querySelector("#naSidebarToggle")?.addEventListener("click", () => {
            this.sidebarEl.classList.toggle("hidden");
        });
    }
    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────
    _refresh() {
        this._renderSidebar();
        this._renderList();
    }
    _formatDate(ts) {
        const d = new Date(ts);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 86400) {
            return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        }
        const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    }
    _escHtml(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    _getSearchQuery() {
        return (this.editor.toolbar?.querySelector("#neSearchInput")?.value ?? "").trim();
    }
}
// ── Register globally ──
window.openNotesWindow = function () {
    window.__createWindow({
        appId: "notes",
        title: "Notes",
        width: 960,
        height: 580,
        content: (_win) => {
            // Ensure store exists
            if (!window.__notesStore) {
                console.error("Notes store not loaded");
                return document.createElement("div");
            }
            const app = new NotesApp();
            return app.el;
        },
    });
};
