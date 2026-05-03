"use strict";
// ============================================================
//  Notes App — notes-store.ts
//  Data layer: folders, notes, localStorage persistence
// ============================================================
// ── Default seed data ──
const SEED_FOLDERS = [
    { id: "all", name: "All iCloud", icon: "📁", color: "#f5a623", pinned: true },
    { id: "notes", name: "Notes", icon: "📁", color: "#8e8e93" },
    { id: "pets", name: "Perfect pets", icon: "📁", color: "#8e8e93" },
    { id: "quick", name: "Quick Notes", icon: "📁", color: "#8e8e93" },
    { id: "quotes", name: "Quotes", icon: "📁", color: "#8e8e93" },
    { id: "deleted", name: "Recently Deleted", icon: "🗑️", color: "#8e8e93" },
];
const now = Date.now();
const SEED_NOTES = [
    {
        id: "n1", folderId: "notes", pinned: true, tags: [],
        title: "Welcome to Notes",
        body: `<h2>Welcome to Notes 👋</h2><p>This is your macOS-style notes app. You can:</p><ul><li><strong>Bold</strong>, <em>italic</em>, <u>underline</u> text</li><li>Create checklists</li><li>Insert tables</li><li>Attach images</li><li>Organize with folders</li></ul><p>Start typing to create your first note!</p>`,
        plainText: "Welcome to Notes. This is your macOS-style notes app.",
        createdAt: now - 86400000 * 2, updatedAt: now - 3600000,
        attachments: [],
    },
    {
        id: "n2", folderId: "quotes", pinned: false, tags: [],
        title: "Interesting line of...",
        body: `<p>&gt;Modern me...</p><p>The most dangerous phrase in the language is "We've always done it this way." — Grace Hopper</p><p>The best way to predict the future is to invent it. — Alan Kay</p>`,
        plainText: ">Modern me... The most dangerous phrase in the language is We've always done it this way.",
        createdAt: now - 86400000 * 500, updatedAt: now - 86400000 * 500,
        attachments: [],
    },
    {
        id: "n3", folderId: "notes", pinned: false, tags: [],
        title: "Dictation test",
        body: `<p>Hello. This is a dictation test note. The quick brown fox jumps over the lazy dog.</p>`,
        plainText: "Hello. This is a dictation test note.",
        createdAt: now - 86400000 * 480, updatedAt: now - 86400000 * 480,
        attachments: [],
    },
    {
        id: "n4", folderId: "pets", pinned: false, tags: [],
        title: "some oth...",
        body: `<p>Some other pet notes here. My cat is the best cat in the world.</p>`,
        plainText: "Some other pet notes here.",
        createdAt: now - 86400000 * 300, updatedAt: now - 86400000 * 300,
        attachments: [],
    },
    {
        id: "n5", folderId: "pets", pinned: false, tags: [],
        title: "Mira",
        body: `<p>Re: Mira my black cat. She loves sitting on the couch.</p>`,
        plainText: "Re: Mira my black cat. She loves sitting on the couch.",
        createdAt: now - 86400000 * 300, updatedAt: now - 86400000 * 300,
        attachments: [],
    },
    {
        id: "n6", folderId: "quick", pinned: false, tags: [],
        title: "Quick note",
        body: `<p>Remember to buy groceries. Milk, eggs, bread, butter.</p>`,
        plainText: "Remember to buy groceries.",
        createdAt: now - 3600000 * 5, updatedAt: now - 3600000 * 2,
        attachments: [],
    },
];
// ── Storage ──
const STORAGE_KEY = "macos_notes_v1";
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return { folders: SEED_FOLDERS, notes: SEED_NOTES };
}
function save(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch { }
}
// ── Store class ──
class NotesStore {
    constructor() {
        this.listeners = [];
        this.data = load();
        // Ensure seed folders always exist
        if (!this.data.folders.length)
            this.data.folders = SEED_FOLDERS;
        if (!this.data.notes.length)
            this.data.notes = SEED_NOTES;
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
    notify() {
        save(this.data);
        this.listeners.forEach(fn => fn());
    }
    // ── Folders ──
    getFolders() { return this.data.folders; }
    getFolder(id) {
        return this.data.folders.find(f => f.id === id);
    }
    createFolder(name) {
        const folder = { id: "f_" + Date.now(), name, icon: "📁", color: "#8e8e93" };
        this.data.folders.push(folder);
        this.notify();
        return folder;
    }
    renameFolder(id, name) {
        const f = this.data.folders.find(f => f.id === id);
        if (f) {
            f.name = name;
            this.notify();
        }
    }
    deleteFolder(id) {
        this.data.notes = this.data.notes.filter(n => n.folderId !== id);
        this.data.folders = this.data.folders.filter(f => f.id !== id);
        this.notify();
    }
    // ── Notes ──
    getNotes(folderId) {
        const notes = folderId && folderId !== "all"
            ? this.data.notes.filter(n => n.folderId === folderId && n.folderId !== "deleted")
            : this.data.notes.filter(n => n.folderId !== "deleted");
        return notes.sort((a, b) => {
            if (a.pinned && !b.pinned)
                return -1;
            if (!a.pinned && b.pinned)
                return 1;
            return b.updatedAt - a.updatedAt;
        });
    }
    getNote(id) {
        return this.data.notes.find(n => n.id === id);
    }
    createNote(folderId) {
        const note = {
            id: "note_" + Date.now(),
            folderId: folderId === "all" ? "notes" : folderId,
            title: "New Note",
            body: "<p></p>",
            plainText: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
            tags: [],
            attachments: [],
        };
        this.data.notes.unshift(note);
        this.notify();
        return note;
    }
    updateNote(id, changes) {
        const note = this.data.notes.find(n => n.id === id);
        if (!note)
            return;
        Object.assign(note, changes, { updatedAt: Date.now() });
        this.notify();
    }
    deleteNote(id) {
        const note = this.data.notes.find(n => n.id === id);
        if (!note)
            return;
        if (note.folderId === "deleted") {
            this.data.notes = this.data.notes.filter(n => n.id !== id);
        }
        else {
            note.folderId = "deleted";
            note.updatedAt = Date.now();
        }
        this.notify();
    }
    togglePin(id) {
        const note = this.data.notes.find(n => n.id === id);
        if (note) {
            note.pinned = !note.pinned;
            this.notify();
        }
    }
    searchNotes(query) {
        const q = query.toLowerCase();
        return this.data.notes.filter(n => n.folderId !== "deleted" &&
            (n.title.toLowerCase().includes(q) || n.plainText.toLowerCase().includes(q)));
    }
    getNoteCount(folderId) {
        if (folderId === "all")
            return this.data.notes.filter(n => n.folderId !== "deleted").length;
        return this.data.notes.filter(n => n.folderId === folderId).length;
    }
}
// Singleton
window.__notesStore = window.__notesStore || new NotesStore();
