"use strict";
// ============================================================
//  Reminders — reminders-store.ts
//  Data layer: tasks, lists, smart lists, persistence
// ============================================================
const STORE_KEY = "macos_reminders_v1";
// ── Seed data ──
const DEFAULT_LISTS = [
    { id: "reminders", name: "Reminders", color: "#0a84ff", icon: "list.bullet", smart: false },
    { id: "family", name: "Family", color: "#ff453a", icon: "house", smart: false },
    { id: "work", name: "Work", color: "#ff9f0a", icon: "briefcase", smart: false },
    { id: "groceries", name: "Groceries", color: "#30d158", icon: "cart", smart: false },
    { id: "camping", name: "Camping Trip", color: "#ffd60a", icon: "tent", smart: false },
    { id: "bookclub", name: "Book club", color: "#bf5af2", icon: "book", smart: false },
    { id: "garden", name: "Gardening", color: "#30d158", icon: "leaf", smart: false },
];
const REM_NOW = Date.now();
const REM_TODAY = new Date().toISOString().split("T")[0];
const REM_TOMORROW = new Date(now + 86400000).toISOString().split("T")[0];
const SEED_REMINDERS = [
    // Reminders list
    { id: "r1", listId: "reminders", title: "Laundry", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TOMORROW, dueTime: null, repeat: "weekly", tags: [], assignee: "Danny", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r2", listId: "reminders", title: "Bake macarons", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: "17:40", repeat: "never", tags: [], assignee: "Danny", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r3", listId: "reminders", title: "Clean the grill", notes: "", completed: false, flagged: false, priority: "none", dueDate: null, dueTime: null, repeat: "never", tags: [], assignee: "Danny", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r4", listId: "reminders", title: "Plan Italy trip", notes: "Need to confirm whether we should fly to Milan or Rome", completed: false, flagged: false, priority: "medium", dueDate: null, dueTime: null, repeat: "never", tags: [], assignee: "Danny", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    // Family
    { id: "r5", listId: "family", title: "File taxes", notes: "", completed: false, flagged: false, priority: "high", dueDate: REM_TODAY, dueTime: null, repeat: "never", tags: [], assignee: "Ashley", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r6", listId: "family", title: "School fees", notes: "", completed: false, flagged: true, priority: "high", dueDate: REM_TODAY, dueTime: null, repeat: "never", tags: [], assignee: "Ashley", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r7", listId: "family", title: "Dishes", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: "20:00", repeat: "daily", tags: [], assignee: "Ashley", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r8", listId: "family", title: "Pick up birthday cake for Sparky", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: null, repeat: "never", tags: [], assignee: "Ashley", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    // Work
    { id: "r9", listId: "work", title: "Vacuuming", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: null, repeat: "weekly", tags: [], assignee: "Olivia", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r10", listId: "work", title: "Water the plants", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: null, repeat: "weekly", tags: [], assignee: "Olivia", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r11", listId: "work", title: "Feed Sparky", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: "17:00", repeat: "daily", tags: [], assignee: "Olivia", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r12", listId: "work", title: "Make the bed", notes: "", completed: false, flagged: false, priority: "none", dueDate: REM_TOMORROW, dueTime: "08:00", repeat: "daily", tags: [], assignee: "Olivia", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    // Completed
    { id: "r13", listId: "reminders", title: "Buy groceries", notes: "", completed: true, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: null, repeat: "never", tags: [], assignee: "Danny", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
    { id: "r14", listId: "family", title: "Call dentist", notes: "", completed: true, flagged: false, priority: "none", dueDate: REM_TODAY, dueTime: null, repeat: "never", tags: [], assignee: "Ashley", subtasks: [], createdAt: REM_NOW, updatedAt: REM_NOW },
];
function loadStore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return { lists: DEFAULT_LISTS, reminders: SEED_REMINDERS };
}
function saveStore(data) {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
    }
    catch { }
}
class RemindersStore {
    constructor() {
        this.listeners = [];
        this.data = loadStore();
        if (!this.data.lists?.length)
            this.data.lists = DEFAULT_LISTS;
        if (!this.data.reminders?.length)
            this.data.reminders = SEED_REMINDERS;
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
    notify() { saveStore(this.data); this.listeners.forEach(fn => fn()); }
    // ── Lists ──
    getLists() { return this.data.lists; }
    getList(id) { return this.data.lists.find(l => l.id === id); }
    createList(name, color, icon) {
        const list = { id: "list_" + Date.now(), name, color, icon };
        this.data.lists.push(list);
        this.notify();
        return list;
    }
    updateList(id, changes) {
        const l = this.data.lists.find(l => l.id === id);
        if (l) {
            Object.assign(l, changes);
            this.notify();
        }
    }
    deleteList(id) {
        this.data.reminders = this.data.reminders.filter(r => r.listId !== id);
        this.data.lists = this.data.lists.filter(l => l.id !== id);
        this.notify();
    }
    // ── Reminders ──
    getAll() { return this.data.reminders; }
    getByList(listId) {
        return this.data.reminders.filter(r => r.listId === listId);
    }
    getToday() {
        const t = new Date().toISOString().split("T")[0];
        return this.data.reminders.filter(r => !r.completed && r.dueDate === t);
    }
    getScheduled() {
        return this.data.reminders.filter(r => !r.completed && r.dueDate);
    }
    getFlagged() {
        return this.data.reminders.filter(r => !r.completed && r.flagged);
    }
    getCompleted() {
        return this.data.reminders.filter(r => r.completed);
    }
    getAll_active() {
        return this.data.reminders.filter(r => !r.completed);
    }
    search(q) {
        const lq = q.toLowerCase();
        return this.data.reminders.filter(r => r.title.toLowerCase().includes(lq) || r.notes.toLowerCase().includes(lq));
    }
    getReminder(id) {
        return this.data.reminders.find(r => r.id === id);
    }
    create(listId, title = "") {
        const r = {
            id: "rem_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            listId, title, notes: "", completed: false, flagged: false,
            priority: "none", dueDate: null, dueTime: null, repeat: "never",
            tags: [], subtasks: [], createdAt: Date.now(), updatedAt: Date.now(),
        };
        this.data.reminders.unshift(r);
        this.notify();
        return r;
    }
    update(id, changes) {
        const r = this.data.reminders.find(r => r.id === id);
        if (r) {
            Object.assign(r, changes, { updatedAt: Date.now() });
            this.notify();
        }
    }
    toggleComplete(id) {
        const r = this.data.reminders.find(r => r.id === id);
        if (r) {
            r.completed = !r.completed;
            r.updatedAt = Date.now();
            this.notify();
        }
    }
    toggleFlag(id) {
        const r = this.data.reminders.find(r => r.id === id);
        if (r) {
            r.flagged = !r.flagged;
            r.updatedAt = Date.now();
            this.notify();
        }
    }
    delete(id) {
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.notify();
    }
    getListCount(listId) {
        return this.data.reminders.filter(r => !r.completed && r.listId === listId).length;
    }
    countToday() { return this.getToday().length; }
    countScheduled() { return this.getScheduled().length; }
    countFlagged() { return this.getFlagged().length; }
    countCompleted() { return this.getCompleted().length; }
    countAll() { return this.getAll_active().length; }
    // ── Format helpers ──
    formatDue(r) {
        if (!r.dueDate)
            return "";
        const today = new Date().toISOString().split("T")[0];
        const tom = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        let ds = r.dueDate === today ? "Today" : r.dueDate === tom ? "Tomorrow" : r.dueDate;
        if (r.dueTime) {
            const [h, m] = r.dueTime.split(":").map(Number);
            const ampm = h >= 12 ? "PM" : "AM";
            ds += `, ${(h % 12) || 12}:${String(m).padStart(2, "0")} ${ampm}`;
        }
        if (r.repeat && r.repeat !== "never") {
            const map = {
                daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly"
            };
            ds += `, ${map[r.repeat] ?? r.repeat}`;
        }
        return ds;
    }
    isOverdue(r) {
        if (!r.dueDate || r.completed)
            return false;
        return r.dueDate < new Date().toISOString().split("T")[0];
    }
}
window.__remindersStore = window.__remindersStore || new RemindersStore();
 
