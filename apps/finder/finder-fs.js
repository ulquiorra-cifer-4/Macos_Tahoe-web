"use strict";
// ============================================================
//  Finder — finder-fs.js  (v2)
//  + music file support (.mp3, .m4a, .flac, .wav, .aac, .ogg)
//  + proper mime/type detection for all common extensions
//  + trash pipeline: deleted items go to trash store
// ============================================================

const FINDER_STORAGE_KEY = "macos_finder_fs_v2";
const TRASH_STORE_KEY    = "macos_trash_v1";

// ── Extension → type mapping ──
const EXT_TYPE_MAP = {
  // Images
  jpg:"image", jpeg:"image", png:"image", gif:"image",
  webp:"image", svg:"image", bmp:"image", ico:"image", tiff:"image",
  // Text / code
  txt:"text", md:"text", ts:"text", js:"text", html:"text",
  css:"text", json:"text", xml:"text", csv:"text", log:"text",
  py:"text", sh:"text", yaml:"text", yml:"text", toml:"text",
  // PDF
  pdf:"pdf",
  // Music
  mp3:"music", m4a:"music", flac:"music", wav:"music",
  aac:"music", ogg:"music", opus:"music", wma:"music",
  // Video
  mp4:"video", mov:"video", avi:"video", mkv:"video", webm:"video",
  // Archives
  zip:"archive", gz:"archive", tar:"archive", rar:"archive", "7z":"archive",
  // Apps / disk images
  dmg:"dmg", app:"app", pkg:"pkg",
  // Docs
  doc:"doc", docx:"doc", xls:"xls", xlsx:"xls",
  ppt:"ppt", pptx:"ppt", pages:"pages", numbers:"numbers", key:"keynote",
};

function getNodeType(name) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPE_MAP[ext] ?? "unknown";
}

// ── Icon name per type — matches icons/ directory ──
const TYPE_ICON = {
  folder:  "folder",
  image:   "file-image",
  text:    "file-text",
  pdf:     "file-pdf",
  music:   "file-music",
  video:   "file-video",
  archive: "file-archive",
  dmg:     "file-dmg",
  app:     "file-app",
  pkg:     "file-pkg",
  doc:     "file-doc",
  xls:     "file-xls",
  ppt:     "file-ppt",
  pages:   "file-pages",
  numbers: "file-numbers",
  keynote: "file-keynote",
  unknown: "file-generic",
};

// ── Emoji fallback per type (shown when PNG missing) ──
const TYPE_EMOJI = {
  folder:"📁", image:"🖼️", text:"📄", pdf:"📑",
  music:"🎵", video:"🎬", archive:"📦", dmg:"💿",
  app:"📱", pkg:"📦", doc:"📝", xls:"📊",
  ppt:"📊", pages:"📄", numbers:"📊", keynote:"📊",
  unknown:"📄",
};

// ── Seed filesystem ──
function makeSeed() {
  const now = Date.now();
  return [
    { id:"desktop",    parentId:null, name:"Desktop",      type:"folder", size:0, createdAt:now, modifiedAt:now, iCloudSync:true },
    { id:"documents",  parentId:null, name:"Documents",    type:"folder", size:0, createdAt:now, modifiedAt:now, iCloudSync:true },
    { id:"receipts",   parentId:null, name:"Receipts",     type:"folder", size:0, createdAt:now, modifiedAt:now, iCloudSync:true, color:"#0a84ff" },
    { id:"downloads",  parentId:null, name:"Downloads",    type:"folder", size:0, createdAt:now, modifiedAt:now },
    { id:"apps_folder",parentId:null, name:"Applications", type:"folder", size:0, createdAt:now, modifiedAt:now },
    // Desktop files
    { id:"f1", parentId:"desktop", name:"BeverlyHills.jpeg", type:"image",   size:2048000, createdAt:now-86400000*5,  modifiedAt:now-86400000*5  },
    { id:"f2", parentId:"desktop", name:"Brunch.jpeg",       type:"image",   size:1840000, createdAt:now-86400000*3,  modifiedAt:now-86400000*3  },
    { id:"f3", parentId:"desktop", name:"Isolate.jpeg",      type:"image",   size:920000,  createdAt:now-86400000*2,  modifiedAt:now-86400000*2  },
    { id:"f4", parentId:"desktop", name:"JuneLake.jpeg",     type:"image",   size:3100000, createdAt:now-86400000*8,  modifiedAt:now-86400000*8  },
    { id:"f5", parentId:"desktop", name:"KidsLondon.jpeg",   type:"image",   size:2700000, createdAt:now-86400000*10, modifiedAt:now-86400000*10 },
    { id:"f6", parentId:"desktop", name:"LosAngeles.jpeg",   type:"image",   size:4100000, createdAt:now-86400000*12, modifiedAt:now-86400000*12 },
    { id:"f7", parentId:"desktop", name:"Purple.jpeg",       type:"image",   size:1200000, createdAt:now-86400000*1,  modifiedAt:now-86400000*1  },
    // Documents
    { id:"d1", parentId:"documents", name:"README.txt",          type:"text", size:1200, createdAt:now-86400000*30, modifiedAt:now-86400000*2,
      content:"# macOS Web Emulator\n\nThis is a web-based recreation of macOS.\n\n## Features\n- Dock with magnification\n- Window management\n- Notes app\n- Finder with virtual filesystem\n\nBuilt with TypeScript, HTML, CSS." },
    { id:"d2", parentId:"documents", name:"Project Notes.txt",   type:"text", size:860,  createdAt:now-86400000*14, modifiedAt:now-86400000*1,
      content:"Project Notes\n==============\n\nTODO:\n- [ ] Safari app\n- [ ] Calendar app\n- [ ] Settings app\n\nDone:\n- [x] Dock animation\n- [x] Window management\n- [x] Notes app\n- [x] Finder\n" },
    { id:"d3", parentId:"documents", name:"Ideas.txt",            type:"text", size:430,  createdAt:now-86400000*7,  modifiedAt:now-86400000*7,
      content:"Ideas for the project:\n\n1. Add more apps\n2. Improve animations\n3. Add file sharing\n4. Better search" },
    { id:"docs_sub", parentId:"documents", name:"Work", type:"folder", size:0, createdAt:now-86400000*20, modifiedAt:now-86400000*5 },
    // Downloads
    { id:"dl1", parentId:"downloads", name:"installer.dmg", type:"dmg",     size:52428800, createdAt:now-86400000*2, modifiedAt:now-86400000*2 },
    { id:"dl2", parentId:"downloads", name:"report.pdf",    type:"pdf",     size:1048576,  createdAt:now-86400000*4, modifiedAt:now-86400000*4 },
    { id:"dl3", parentId:"downloads", name:"archive.zip",   type:"archive", size:8388608,  createdAt:now-86400000*6, modifiedAt:now-86400000*6 },
  ];
}

// ── Trash Store (separate from FS) ──
class TrashStore {
  constructor() {
    this.listeners = [];
    this._items = this._load();
  }
  _load() {
    try {
      const raw = localStorage.getItem(TRASH_STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  _save() {
    try { localStorage.setItem(TRASH_STORE_KEY, JSON.stringify(this._items)); } catch {}
    this.listeners.forEach(fn => fn());
  }
  subscribe(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; }
  getItems()    { return [...this._items].sort((a,b) => b.deletedAt - a.deletedAt); }
  getCount()    { return this._items.length; }
  getTotalSize(){ return this._items.reduce((s,i) => s + (i.size ?? 0), 0); }
  add(node) {
    this._items.push({ ...node, deletedAt: Date.now(), originalParentId: node.parentId });
    this._save();
  }
  restore(id) {
    const item = this._items.find(i => i.id === id);
    if (!item) return null;
    this._items = this._items.filter(i => i.id !== id);
    this._save();
    return item;
  }
  remove(id) {
    this._items = this._items.filter(i => i.id !== id);
    this._save();
  }
  empty() { this._items = []; this._save(); }
}

// ── Virtual FS ──
class FinderFS {
  constructor() {
    this.nodes     = new Map();
    this.listeners = [];
    this._load();
  }
  _load() {
    try {
      const raw = localStorage.getItem(FINDER_STORAGE_KEY);
      if (raw) { JSON.parse(raw).forEach(n => this.nodes.set(n.id, n)); return; }
    } catch {}
    makeSeed().forEach(n => this.nodes.set(n.id, n));
    this._save();
  }
  _save() {
    try { localStorage.setItem(FINDER_STORAGE_KEY, JSON.stringify([...this.nodes.values()])); } catch {}
    this.listeners.forEach(fn => fn());
  }
  subscribe(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; }

  // ── Read ──
  getChildren(parentId) {
    return [...this.nodes.values()]
      .filter(n => n.parentId === parentId)
      .sort((a,b) => {
        if (a.type==="folder" && b.type!=="folder") return -1;
        if (a.type!=="folder" && b.type==="folder") return  1;
        return a.name.localeCompare(b.name);
      });
  }
  getNode(id)   { return this.nodes.get(id); }
  getPath(id) {
    const path = []; let cur = id ? this.nodes.get(id) : undefined;
    while (cur) { path.unshift(cur); cur = cur.parentId ? this.nodes.get(cur.parentId) : undefined; }
    return path;
  }
  search(query, parentId) {
    const q = query.toLowerCase();
    return [...this.nodes.values()].filter(n =>
      n.name.toLowerCase().includes(q) &&
      (parentId === undefined || this._isDescendant(n.id, parentId))
    );
  }
  _isDescendant(id, ancestorId) {
    let n = this.nodes.get(id);
    while (n) { if (n.parentId === ancestorId) return true; n = n.parentId ? this.nodes.get(n.parentId) : undefined; }
    return false;
  }

  // ── Write ──
  createFolder(parentId, name) {
    const node = { id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      parentId, name, type:"folder", size:0, createdAt:Date.now(), modifiedAt:Date.now() };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  createTextFile(parentId, name, content="") {
    const n = name.endsWith(".txt") ? name : name+".txt";
    const node = { id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      parentId, name:n, type:"text", size:content.length, createdAt:Date.now(), modifiedAt:Date.now(), content };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  createImageFile(parentId, name, dataUrl, size) {
    const node = { id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      parentId, name, type:"image", size, dataUrl, createdAt:Date.now(), modifiedAt:Date.now() };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  createMusicFile(parentId, name, audioUrl, size) {
    const node = { id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      parentId, name, type:"music", size: size||0, audioUrl,
      createdAt:Date.now(), modifiedAt:Date.now() };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  createFile(parentId, name, dataUrl, size, content) {
    const type = getNodeType(name);
    const node = { id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      parentId, name, type, size:size||0, dataUrl, content,
      createdAt:Date.now(), modifiedAt:Date.now() };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  updateContent(id, content) {
    const n = this.nodes.get(id); if (!n) return;
    n.content=content; n.size=content.length; n.modifiedAt=Date.now(); this._save();
  }
  rename(id, newName) {
    const n = this.nodes.get(id); if (!n) return;
    n.name=newName; n.modifiedAt=Date.now(); this._save();
  }
  move(id, newParentId) {
    const n = this.nodes.get(id); if (!n) return;
    n.parentId=newParentId; n.modifiedAt=Date.now(); this._save();
  }
  // Send to trash pipeline
  delete(id) {
    const node = this.nodes.get(id);
    if (!node) return;
    // Move children to trash recursively
    const children = this.getChildren(id);
    children.forEach(c => this.delete(c.id));
    // Add to trash store
    const trash = window.__trashStore;
    if (trash) trash.add(node);
    this.nodes.delete(id);
    this._save();
  }
  // Permanent delete (from trash)
  permanentDelete(id) {
    const children = this.getChildren(id);
    children.forEach(c => this.permanentDelete(c.id));
    this.nodes.delete(id);
    this._save();
  }
  duplicate(id) {
    const orig = this.nodes.get(id); if (!orig) return null;
    const node = { ...orig,
      id:"node_"+Date.now()+"_"+Math.random().toString(36).slice(2),
      name:this._dupName(orig.name), createdAt:Date.now(), modifiedAt:Date.now() };
    this.nodes.set(node.id, node); this._save(); return node;
  }
  _dupName(name) {
    const dot = name.lastIndexOf(".");
    return dot === -1 ? name+" copy" : name.slice(0,dot)+" copy"+name.slice(dot);
  }

  // ── Helpers ──
  formatSize(bytes) {
    if (!bytes || bytes===0) return "--";
    if (bytes < 1024)           return bytes+" B";
    if (bytes < 1024*1024)      return (bytes/1024).toFixed(1)+" KB";
    if (bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(1)+" MB";
    return (bytes/(1024*1024*1024)).toFixed(2)+" GB";
  }
  getTypeIcon(node)  { return TYPE_ICON[node.type] ?? TYPE_ICON.unknown; }
  getTypeEmoji(node) { return TYPE_EMOJI[node.type] ?? "📄"; }
  getNodeType(name)  { return getNodeType(name); }
}

// ── Singletons ──
window.__finderFS   = window.__finderFS   || new FinderFS();
window.__trashStore = window.__trashStore || new TrashStore();
// expose helpers
window.__getTypeIcon  = (node) => TYPE_ICON[node.type]  ?? TYPE_ICON.unknown;
window.__getTypeEmoji = (node) => TYPE_EMOJI[node.type] ?? "📄";
window.__getNodeType  = getNodeType;
 
