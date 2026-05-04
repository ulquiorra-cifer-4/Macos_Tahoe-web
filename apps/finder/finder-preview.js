"use strict";
// ============================================================
//  Finder — finder-preview.ts
//  Right panel: Quick Look preview + file info
// ============================================================
class FinderPreview {
    constructor() {
        this.fs = window.__finderFS;
        this.el = document.createElement("div");
        this.el.className = "ff-preview";
        this._showEmpty();
    }
    show(nodeId) {
        const node = this.fs.getNode(nodeId);
        if (!node) {
            this._showEmpty();
            return;
        }
        this.el.innerHTML = "";
        // Preview area
        const previewArea = document.createElement("div");
        previewArea.className = "ff-pv-area";
        if (node.type === "image" && node.dataUrl) {
            const img = document.createElement("img");
            img.src = node.dataUrl;
            img.className = "ff-pv-img";
            previewArea.appendChild(img);
        }
        else if (node.type === "text" && node.content) {
            const pre = document.createElement("pre");
            pre.className = "ff-pv-text";
            pre.textContent = node.content.substring(0, 500) + (node.content.length > 500 ? "\n…" : "");
            previewArea.appendChild(pre);
        }
        else if (node.type === "folder") {
            const children = this.fs.getChildren(node.id);
            const folderIcon = document.createElement("div");
            folderIcon.className = "ff-pv-folder-icon";
            folderIcon.innerHTML = `
        <svg viewBox="0 0 80 64" width="80" height="64">
          <path d="M4 12 C4 9 6 8 9 8 L30 8 L34 13 L73 13 C76 13 78 15 78 18 L78 56 C78 59 76 61 73 61 L9 61 C6 61 4 59 4 56 Z" fill="#4CAAEE"/>
          <path d="M4 18 L78 18 L78 56 C78 59 76 61 73 61 L9 61 C6 61 4 59 4 56 Z" fill="#5BB8F5"/>
        </svg>
        <div class="ff-pv-folder-count">${children.length} item${children.length !== 1 ? "s" : ""}</div>
      `;
            previewArea.appendChild(folderIcon);
        }
        else {
            const genericIcon = document.createElement("div");
            genericIcon.className = "ff-pv-generic";
            genericIcon.innerHTML = this._genericIcon(node);
            previewArea.appendChild(genericIcon);
        }
        // Info section
        const info = document.createElement("div");
        info.className = "ff-pv-info";
        const date = new Date(node.modifiedAt);
        const created = new Date(node.createdAt);
        info.innerHTML = `
      <div class="ff-pv-name">${node.name}</div>
      <div class="ff-pv-meta-grid">
        <div class="ff-pv-meta-row">
          <span class="ff-pv-meta-label">Kind</span>
          <span class="ff-pv-meta-val">${this._kindString(node)}</span>
        </div>
        <div class="ff-pv-meta-row">
          <span class="ff-pv-meta-label">Size</span>
          <span class="ff-pv-meta-val">${node.type === "folder" ? this._folderSize(node.id) : this.fs.formatSize(node.size)}</span>
        </div>
        <div class="ff-pv-meta-row">
          <span class="ff-pv-meta-label">Created</span>
          <span class="ff-pv-meta-val">${created.toLocaleDateString()}</span>
        </div>
        <div class="ff-pv-meta-row">
          <span class="ff-pv-meta-label">Modified</span>
          <span class="ff-pv-meta-val">${date.toLocaleDateString()}</span>
        </div>
        ${node.iCloudSync ? `<div class="ff-pv-meta-row"><span class="ff-pv-meta-label">iCloud</span><span class="ff-pv-meta-val" style="color:#0a84ff">✓ Synced</span></div>` : ""}
      </div>
      ${node.tags?.length ? `<div class="ff-pv-tags">${node.tags.map((t) => `<span class="ff-pv-tag">${t}</span>`).join("")}</div>` : ""}
    `;
        this.el.append(previewArea, info);
    }
    clear() { this._showEmpty(); }
    _showEmpty() {
        this.el.innerHTML = `<div class="ff-pv-empty">
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" style="opacity:.2"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
      <p>Select a file to preview</p>
    </div>`;
    }
    _genericIcon(node) {
        return `<svg viewBox="0 0 44 56" width="64" height="82">
      <path d="M6 0 L32 0 L44 12 L44 52 C44 54.2 42.2 56 40 56 L6 56 C3.8 56 2 54.2 2 52 L2 4 C2 1.8 3.8 0 6 0 Z" fill="#8e8e93"/>
      <path d="M32 0 L32 12 L44 12 Z" fill="rgba(0,0,0,0.2)"/>
      <text x="22" y="36" text-anchor="middle" fill="white" font-size="8">${node.name.split(".").pop()?.toUpperCase().slice(0, 4) ?? "FILE"}</text>
    </svg>`;
    }
    _kindString(node) {
        const map = {
            folder: "Folder", text: "Plain Text Document",
            image: "JPEG Image", pdf: "PDF Document", unknown: "Document",
        };
        return map[node.type] ?? "Document";
    }
    _folderSize(folderId) {
        const children = this.fs.getChildren(folderId);
        const total = children.reduce((sum, n) => sum + n.size, 0);
        return this.fs.formatSize(total) + " on disk";
    }
}
window.__FinderPreview = FinderPreview;
