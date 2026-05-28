"use strict";
// ============================================================
//  Finder — finder-grid.js  (v2)
//  Icon / List / Column / Gallery views
//  Uses FinderIcons for proper file type icons
//  Supports music file open via music store
// ============================================================
class FinderGrid {
  constructor(cbs) {
    this.cbs      = cbs;
    this.fs       = window.__finderFS;
    this.mode     = "icons";
    this.selected = new Set();
    this.items    = [];
    this._renaming = null;
    this._ctxMenu  = null;
    this._clipboard = null;   // { op:"copy"|"cut", ids:[] }

    this.el = document.createElement("div");
    this.el.className = "ff-grid-wrap";
    this._bindDrop();
  }

  // ─────────────────────────────────────────────
  //  Load
  // ─────────────────────────────────────────────
  load(parentId, mode) {
    if (mode) this.mode = mode;
    this._parentId = parentId;
    this.items     = this.fs.getChildren(parentId);
    this.selected.clear();
    this._render();
  }

  loadSearch(results) {
    this._parentId = null;
    this.items     = results;
    this.selected.clear();
    this._render();
  }

  setMode(mode) {
    this.mode = mode;
    this._render();
  }

  // ─────────────────────────────────────────────
  //  Render dispatch
  // ─────────────────────────────────────────────
  _render() {
    this._closeCtx();
    this.el.innerHTML = "";
    if (!this.items.length) { this._renderEmpty(); return; }
    switch (this.mode) {
      case "list":    this._renderList();    break;
      case "columns": this._renderColumns(); break;
      case "gallery": this._renderGallery(); break;
      default:        this._renderIcons();   break;
    }
  }

  _renderEmpty() {
    const d = document.createElement("div");
    d.className = "ff-empty";
    d.innerHTML = `<div class="ff-empty-icon">📂</div><p>This folder is empty</p>`;
    this.el.appendChild(d);
  }

  // ─────────────────────────────────────────────
  //  Icon grid
  // ─────────────────────────────────────────────
  _renderIcons() {
    const grid = document.createElement("div");
    grid.className = "ff-icon-grid";
    this.items.forEach(node => grid.appendChild(this._makeIconItem(node)));
    this.el.appendChild(grid);
    this._bindGridClick(grid);
  }

  _makeIconItem(node) {
    const item = document.createElement("div");
    item.className = "ff-icon-item" + (this.selected.has(node.id) ? " selected" : "");
    item.dataset.id = node.id;

    const iconEl = window.__FinderIcons
      ? window.__FinderIcons.render(node, 56)
      : this._fallbackIcon(node, 56);

    const label = document.createElement("div");
    label.className = "ff-file-name";
    label.textContent = node.name;

    item.append(iconEl, label);
    this._bindItemEvents(item, node);
    return item;
  }

  // ─────────────────────────────────────────────
  //  Gallery
  // ─────────────────────────────────────────────
  _renderGallery() {
    const grid = document.createElement("div");
    grid.className = "ff-gallery";
    this.items.forEach(node => {
      const item = this._makeIconItem(node);
      // Larger icon for gallery
      item.querySelector(".ff-file-icon")?.remove();
      const bigIcon = window.__FinderIcons
        ? window.__FinderIcons.render(node, 90)
        : this._fallbackIcon(node, 90);
      item.prepend(bigIcon);
      grid.appendChild(item);
    });
    this.el.appendChild(grid);
    this._bindGridClick(grid);
  }

  // ─────────────────────────────────────────────
  //  List view
  // ─────────────────────────────────────────────
  _renderList() {
    const wrap = document.createElement("div");
    wrap.className = "ff-list";

    const header = document.createElement("div");
    header.className = "ff-list-header";
    header.innerHTML = `
      <span>Name</span>
      <span>Date Modified</span>
      <span>Size</span>
      <span>Kind</span>
    `;
    wrap.appendChild(header);

    const body = document.createElement("div");
    body.className = "ff-list-body";
    this.items.forEach(node => {
      const row = document.createElement("div");
      row.className = "ff-list-row" + (this.selected.has(node.id) ? " selected" : "");
      row.dataset.id = node.id;

      const iconEl = window.__FinderIcons
        ? window.__FinderIcons.renderSmall(node, 16)
        : this._fallbackIcon(node, 16);

      const date = new Date(node.modifiedAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
      row.innerHTML = `
        <div class="ff-lr-name">
          <span class="ff-lr-icon"></span>
          <span class="ff-lr-label">${node.name}</span>
        </div>
        <div class="ff-lr-date">${date}</div>
        <div class="ff-lr-size">${node.type==="folder" ? "--" : this.fs.formatSize(node.size)}</div>
        <div class="ff-lr-kind">${this._kindLabel(node)}</div>
      `;
      row.querySelector(".ff-lr-icon")?.appendChild(iconEl);
      this._bindItemEvents(row, node);
      body.appendChild(row);
    });

    wrap.appendChild(body);
    this.el.appendChild(wrap);
  }

  // ─────────────────────────────────────────────
  //  Column view
  // ─────────────────────────────────────────────
  _renderColumns() {
    const cols = document.createElement("div");
    cols.className = "ff-columns";

    const col = document.createElement("div");
    col.className = "ff-column";

    this.items.forEach(node => {
      const row = document.createElement("div");
      row.className = "ff-col-row" + (this.selected.has(node.id) ? " selected" : "");
      row.dataset.id = node.id;

      const iconEl = window.__FinderIcons
        ? window.__FinderIcons.renderSmall(node, 16)
        : this._fallbackIcon(node, 16);

      row.innerHTML = `
        <span class="ff-col-icon"></span>
        <span class="ff-col-name">${node.name}</span>
        ${node.type==="folder" ? `<span class="ff-col-arrow"><svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></span>` : ""}
      `;
      row.querySelector(".ff-col-icon")?.appendChild(iconEl);
      this._bindItemEvents(row, node);
      col.appendChild(row);
    });

    cols.appendChild(col);
    this.el.appendChild(cols);
  }

  // ─────────────────────────────────────────────
  //  Item events
  // ─────────────────────────────────────────────
  _bindItemEvents(el, node) {
    let clickTimer = null;

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        if (this.selected.has(node.id)) this.selected.delete(node.id);
        else this.selected.add(node.id);
      } else {
        this.selected.clear();
        this.selected.add(node.id);
      }
      this._updateSelection();
      this.cbs.onSelect([...this.selected]);

      // Double-click detection
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        this.cbs.onOpen(node.id);
      } else {
        clickTimer = setTimeout(() => { clickTimer = null; }, 300);
      }
    });

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!this.selected.has(node.id)) {
        this.selected.clear(); this.selected.add(node.id);
        this._updateSelection();
        this.cbs.onSelect([...this.selected]);
      }
      this._showCtxMenu(e, node);
    });

    // Drag
    el.draggable = true;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", node.id);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
  }

  _bindGridClick(grid) {
    grid.addEventListener("click", (e) => {
      if (e.target === grid) {
        this.selected.clear();
        this._updateSelection();
        this.cbs.onSelect([]);
      }
    });
  }

  _updateSelection() {
    this.el.querySelectorAll("[data-id]").forEach(el => {
      el.classList.toggle("selected", this.selected.has(el.dataset.id));
    });
  }

  // ─────────────────────────────────────────────
  //  Context menu
  // ─────────────────────────────────────────────
  _showCtxMenu(e, node) {
    this._closeCtx();
    const menu = document.createElement("div");
    menu.className = "ff-context-menu";
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;

    const isFolder = node.type === "folder";
    const isText   = node.type === "text";
    const isMusic  = node.type === "music";
    const isImage  = node.type === "image";

    const items = [
      { label: "Open",             icon:"▶", action: () => this.cbs.onOpen(node.id) },
      ...(isText  ? [{ label:"Open in Notes", icon:"📝", action:() => this.cbs.onOpenInNotes(node.id) }] : []),
      ...(isMusic ? [{ label:"Play in Music", icon:"🎵", action:() => this._playInMusic(node) }] : []),
      ...(isImage ? [{ label:"Quick Look",    icon:"👁",  action:() => this.cbs.onOpen(node.id) }] : []),
      { sep: true },
      { label:"Get Info",       icon:"ℹ️",  action:() => this.cbs.onGetInfo(node.id) },
      { label:"Rename",         icon:"✏️",  action:() => this._startRename(node) },
      { label:"Duplicate",      icon:"⧉",  action:() => this.cbs.onDuplicate(node.id) },
      { sep: true },
      { label:"Copy",           icon:"📋",  action:() => this._clipboard = { op:"copy", ids:[node.id] } },
      { label:"Cut",            icon:"✂️",  action:() => { this._clipboard = { op:"cut", ids:[node.id] }; this._markCut(node.id); } },
      { sep: true },
      { label:"Move to Trash",  icon:"🗑️",  danger:true, action:() => {
        this.cbs.onDelete([node.id]);
        this.load(this._parentId, this.mode);
      }},
    ];

    items.forEach(it => {
      if (it.sep) { const s=document.createElement("div"); s.className="ff-ctx-sep"; menu.appendChild(s); return; }
      const btn = document.createElement("button");
      btn.className = "ff-ctx-item" + (it.danger ? " ff-ctx-danger" : "");
      btn.innerHTML = `<span style="font-size:12px;width:16px;text-align:center">${it.icon}</span> ${it.label}`;
      btn.addEventListener("click", () => { this._closeCtx(); it.action(); });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    this._ctxMenu = menu;

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  menu.style.left = (e.clientX - rect.width)  + "px";
    if (rect.bottom > window.innerHeight) menu.style.top  = (e.clientY - rect.height) + "px";

    const close = (ev) => {
      if (!menu.contains(ev.target)) { this._closeCtx(); document.removeEventListener("click", close); }
    };
    setTimeout(() => document.addEventListener("click", close), 10);
  }

  _closeCtx() {
    this._ctxMenu?.remove();
    this._ctxMenu = null;
  }

  _markCut(id) {
    this.el.querySelectorAll(`[data-id="${id}"]`).forEach(el => el.style.opacity="0.4");
  }

  // ─────────────────────────────────────────────
  //  Rename inline
  // ─────────────────────────────────────────────
  _startRename(node) {
    const labelEl = this.el.querySelector(`[data-id="${node.id}"] .ff-file-name`) ??
                    this.el.querySelector(`[data-id="${node.id}"] .ff-lr-label`)  ??
                    this.el.querySelector(`[data-id="${node.id}"] .ff-col-name`);
    if (!labelEl) return;

    const input = document.createElement("input");
    input.className = "ff-rename-input";
    input.value = node.name;
    labelEl.replaceWith(input);
    input.focus(); input.select();

    const commit = () => {
      const newName = input.value.trim() || node.name;
      this.cbs.onRename(node.id, newName);
      this.load(this._parentId, this.mode);
    };
    input.addEventListener("blur",  commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter")  { e.preventDefault(); commit(); }
      if (e.key === "Escape") { this.load(this._parentId, this.mode); }
    });
  }

  // ─────────────────────────────────────────────
  //  Music integration
  // ─────────────────────────────────────────────
  _playInMusic(node) {
    const store = window.__musicStore;
    if (!store || !node.audioUrl) return;
    // Add as a virtual song and play
    const virtualSong = {
      id:        "finder_" + node.id,
      albumId:   "finder_uploads",
      artistId:  "finder_uploads",
      title:     node.name.replace(/\.[^.]+$/,""),
      duration:  0,
      file:      node.audioUrl,
      track:     1,
    };
    // Inject into store map and play
    if (window.__musicStore._injectAndPlay) {
      window.__musicStore._injectAndPlay(virtualSong, node.audioUrl);
    } else {
      // Direct audio fallback
      const audio = window.__musicPlayer?.audio;
      if (audio) { audio.src = node.audioUrl; audio.play(); }
    }
    if (typeof window.openMusicWindow === "function") window.openMusicWindow();
  }

  // ─────────────────────────────────────────────
  //  Drop zone (file upload from OS)
  // ─────────────────────────────────────────────
  _bindDrop() {
    this.el.addEventListener("dragover", e => { e.preventDefault(); this.el.classList.add("drag-active"); });
    this.el.addEventListener("dragleave", ()=> this.el.classList.remove("drag-active"));
    this.el.addEventListener("drop", async (e) => {
      e.preventDefault(); this.el.classList.remove("drag-active");
      const files = [...(e.dataTransfer?.files ?? [])];
      for (const file of files) {
        await this._importFile(file);
      }
      this.load(this._parentId, this.mode);
    });
  }

  async _importFile(file) {
    const parentId = this._parentId;
    if (file.type.startsWith("image/")) {
      const dataUrl = await this._readAsDataURL(file);
      this.fs.createImageFile(parentId, file.name, dataUrl, file.size);
    } else if (file.type.startsWith("audio/") || /\.(mp3|m4a|flac|wav|aac|ogg)$/i.test(file.name)) {
      const dataUrl = await this._readAsDataURL(file);
      this.fs.createMusicFile(parentId, file.name, dataUrl, file.size);
    } else if (file.type === "text/plain" || /\.(txt|md|js|ts|json|css|html)$/i.test(file.name)) {
      const content = await this._readAsText(file);
      this.fs.createTextFile(parentId, file.name, content);
    } else {
      this.fs.createFile(parentId, file.name, null, file.size, null);
    }
  }

  _readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  _readAsText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = rej;
      r.readAsText(file);
    });
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  _kindLabel(node) {
    const map = {
      folder:"Folder", image:"Image", text:"Text", pdf:"PDF",
      music:"Audio",   video:"Video", archive:"Archive", dmg:"Disk Image",
      app:"Application", doc:"Document", xls:"Spreadsheet", ppt:"Presentation",
      unknown:"File",
    };
    return map[node.type] ?? "File";
  }

  _fallbackIcon(node, size) {
    const div = document.createElement("div");
    div.className = "ff-file-icon";
    div.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.65)}px`;
    const emojis = { folder:"📁", image:"🖼️", text:"📄", pdf:"📑", music:"🎵", video:"🎬", archive:"📦", dmg:"💿", unknown:"📄" };
    div.textContent = emojis[node.type] ?? "📄";
    return div;
  }
}

window.__FinderGrid = FinderGrid;
 
