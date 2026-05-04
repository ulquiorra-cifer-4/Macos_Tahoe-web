"use strict";
// ============================================================
//  Finder — finder-fs.ts
//  Virtual filesystem: folders, files, CRUD, localStorage
// ============================================================
const FINDER_STORAGE_KEY = "macos_finder_fs_v1";
// ── Seed filesystem ──
function makeSeed() {
    const now = Date.now();
    const nodes = [
        // iCloud Drive root items
        { id: "desktop", parentId: null, name: "Desktop", type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true },
        { id: "documents", parentId: null, name: "Documents", type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true },
        { id: "receipts", parentId: null, name: "Receipts", type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true, color: "#0a84ff" },
        { id: "downloads", parentId: null, name: "Downloads", type: "folder", size: 0, createdAt: now, modifiedAt: now },
        { id: "apps_folder", parentId: null, name: "Applications", type: "folder", size: 0, createdAt: now, modifiedAt: now },
        // Desktop files
        { id: "f1", parentId: "desktop", name: "BeverlyHills.jpeg", type: "image", size: 2048000, createdAt: now - 86400000 * 5, modifiedAt: now - 86400000 * 5 },
        { id: "f2", parentId: "desktop", name: "Brunch.jpeg", type: "image", size: 1840000, createdAt: now - 86400000 * 3, modifiedAt: now - 86400000 * 3 },
        { id: "f3", parentId: "desktop", name: "Isolate.jpeg", type: "image", size: 920000, createdAt: now - 86400000 * 2, modifiedAt: now - 86400000 * 2 },
        { id: "f4", parentId: "desktop", name: "JuneLake.jpeg", type: "image", size: 3100000, createdAt: now - 86400000 * 8, modifiedAt: now - 86400000 * 8 },
        { id: "f5", parentId: "desktop", name: "KidsLondon.jpeg", type: "image", size: 2700000, createdAt: now - 86400000 * 10, modifiedAt: now - 86400000 * 10 },
        { id: "f6", parentId: "desktop", name: "LosAngeles.jpeg", type: "image", size: 4100000, createdAt: now - 86400000 * 12, modifiedAt: now - 86400000 * 12 },
        { id: "f7", parentId: "desktop", name: "Purple.jpeg", type: "image", size: 1200000, createdAt: now - 86400000 * 1, modifiedAt: now - 86400000 * 1 },
        // Documents
        { id: "d1", parentId: "documents", name: "README.txt", type: "text", size: 1200, createdAt: now - 86400000 * 30, modifiedAt: now - 86400000 * 2,
            content: "# macOS Web Emulator\n\nThis is a web-based recreation of macOS.\n\n## Features\n- Dock with magnification\n- Window management\n- Notes app\n- Finder with virtual filesystem\n\nBuilt with TypeScript, HTML, CSS." },
        { id: "d2", parentId: "documents", name: "Project Notes.txt", type: "text", size: 860, createdAt: now - 86400000 * 14, modifiedAt: now - 86400000 * 1,
            content: "Project Notes\n==============\n\nTODO:\n- [ ] Safari app\n- [ ] Calendar app\n- [ ] Settings app\n\nDone:\n- [x] Dock animation\n- [x] Window management\n- [x] Notes app\n- [x] Finder\n" },
        { id: "d3", parentId: "documents", name: "Ideas.txt", type: "text", size: 430, createdAt: now - 86400000 * 7, modifiedAt: now - 86400000 * 7,
            content: "Ideas for the project:\n\n1. Add more apps\n2. Improve animations\n3. Add file sharing\n4. Better search" },
        { id: "docs_sub", parentId: "documents", name: "Work", type: "folder", size: 0, createdAt: now - 86400000 * 20, modifiedAt: now - 86400000 * 5 },
        // Downloads
        { id: "dl1", parentId: "downloads", name: "installer.dmg", type: "unknown", size: 52428800, createdAt: now - 86400000 * 2, modifiedAt: now - 86400000 * 2 },
        { id: "dl2", parentId: "downloads", name: "report.pdf", type: "pdf", size: 1048576, createdAt: now - 86400000 * 4, modifiedAt: now - 86400000 * 4 },
        { id: "dl3", parentId: "downloads", name: "archive.zip", type: "unknown", size: 8388608, createdAt: now - 86400000 * 6, modifiedAt: now - 86400000 * 6 },
    ];
    return nodes;
}
// ── Virtual FS ──
class FinderFS {
    constructor() {
        this.nodes = new Map();
        this.listeners = [];
        this._load();
    }
    _load() {
        try {
            const raw = localStorage.getItem(FINDER_STORAGE_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                arr.forEach(n => this.nodes.set(n.id, n));
                return;
            }
        }
        catch { }
        const seed = makeSeed();
        seed.forEach(n => this.nodes.set(n.id, n));
        this._save();
    }
    _save() {
        try {
            localStorage.setItem(FINDER_STORAGE_KEY, JSON.stringify([...this.nodes.values()]));
        }
        catch { }
        this.listeners.forEach(fn => fn());
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
    // ── Read ──
    getChildren(parentId) {
        return [...this.nodes.values()]
            .filter(n => n.parentId === parentId)
            .sort((a, b) => {
            // Folders first, then by name
            if (a.type === "folder" && b.type !== "folder")
                return -1;
            if (a.type !== "folder" && b.type === "folder")
                return 1;
            return a.name.localeCompare(b.name);
        });
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getPath(id) {
        const path = [];
        let current = id ? this.nodes.get(id) : undefined;
        while (current) {
            path.unshift(current);
            current = current.parentId ? this.nodes.get(current.parentId) : undefined;
        }
        return path;
    }
    search(query, parentId) {
        const q = query.toLowerCase();
        return [...this.nodes.values()].filter(n => n.name.toLowerCase().includes(q) &&
            (parentId === undefined || this._isDescendantOf(n.id, parentId)));
    }
    _isDescendantOf(id, ancestorId) {
        let n = this.nodes.get(id);
        while (n) {
            if (n.parentId === ancestorId)
                return true;
            n = n.parentId ? this.nodes.get(n.parentId) : undefined;
        }
        return false;
    }
    // ── Write ──
    createFolder(parentId, name) {
        const node = {
            id: "node_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            parentId, name, type: "folder", size: 0,
            createdAt: Date.now(), modifiedAt: Date.now(),
        };
        this.nodes.set(node.id, node);
        this._save();
        return node;
    }
    createTextFile(parentId, name, content = "") {
        const n = name.endsWith(".txt") ? name : name + ".txt";
        const node = {
            id: "node_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            parentId, name: n, type: "text", size: content.length,
            createdAt: Date.now(), modifiedAt: Date.now(), content,
        };
        this.nodes.set(node.id, node);
        this._save();
        return node;
    }
    createImageFile(parentId, name, dataUrl, size) {
        const node = {
            id: "node_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            parentId, name, type: "image", size, dataUrl,
            createdAt: Date.now(), modifiedAt: Date.now(),
        };
        this.nodes.set(node.id, node);
        this._save();
        return node;
    }
    updateContent(id, content) {
        const n = this.nodes.get(id);
        if (!n)
            return;
        n.content = content;
        n.size = content.length;
        n.modifiedAt = Date.now();
        this._save();
    }
    rename(id, newName) {
        const n = this.nodes.get(id);
        if (!n)
            return;
        n.name = newName;
        n.modifiedAt = Date.now();
        this._save();
    }
    move(id, newParentId) {
        const n = this.nodes.get(id);
        if (!n)
            return;
        n.parentId = newParentId;
        n.modifiedAt = Date.now();
        this._save();
    }
    delete(id) {
        // Delete recursively
        const children = this.getChildren(id);
        children.forEach(c => this.delete(c.id));
        this.nodes.delete(id);
        this._save();
    }
    duplicate(id) {
        const original = this.nodes.get(id);
        if (!original)
            return null;
        const node = {
            ...original,
            id: "node_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            name: this._dupName(original.name),
            createdAt: Date.now(), modifiedAt: Date.now(),
        };
        this.nodes.set(node.id, node);
        this._save();
        return node;
    }
    _dupName(name) {
        const dot = name.lastIndexOf(".");
        if (dot === -1)
            return name + " copy";
        return name.slice(0, dot) + " copy" + name.slice(dot);
    }
    formatSize(bytes) {
        if (bytes === 0)
            return "--";
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + " KB";
        if (bytes < 1024 * 1024 * 1024)
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }
    getTypeIcon(node) {
        if (node.type === "folder")
            return "folder";
        const ext = node.name.split(".").pop()?.toLowerCase() ?? "";
        if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
            return "image";
        if (["txt", "md", "ts", "js", "html", "css", "json"].includes(ext))
            return "text";
        if (ext === "pdf")
            return "pdf";
        if (["dmg", "app"].includes(ext))
            return "app";
        return "unknown";
    }
}
// Singleton
window.__finderFS = window.__finderFS || new FinderFS();
