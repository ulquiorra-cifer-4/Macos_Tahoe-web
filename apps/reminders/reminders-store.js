"use strict";
// ============================================================
//  Reminders App — reminders-store.js
//  Data layer: lists, reminders, localStorage persistence
// ============================================================
const STORAGE_KEY = "macos_reminders_v1";
// ── Seed Data ──
const now = Date.now();
const todayStr = () => new Date().toISOString().slice(0, 10);
const tmrwStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
};
const lastWeekStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
};
const nextWeekStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
};
const SEED_LISTS = [
    { id: "today", name: "Today", color: "#007aff", smartType: "today" },
    { id: "scheduled", name: "Scheduled", color: "#ff9500", smartType: "scheduled" },
    { id: "flagged", name: "Flagged", color: "#ff3b30", smartType: "flagged" },
    { id: "completed", name: "Completed", color: "#8e8e93", smartType: "completed" },
    { id: "all", name: "All", color: "#5856d6", smartType: "all" },
    { id: "personal", name: "Personal", color: "#34c759" },
    { id: "work", name: "Work", color: "#007aff" },
    { id: "shopping", name: "Shopping", color: "#ff9500" },
];
const SEED_REMINDERS = [
    {
        id: "r1", listId: "work", title: "Submit project proposal",
        notes: "Include budget breakdown and timeline", dueDate: todayStr(), dueTime: "10:00",
        priority: "high", tags: ["urgent"], flagged: true, completed: false, completedAt: null,
        createdAt: now - 864e5, updatedAt: now - 3600e3,
    },
    {
        id: "r2", listId: "personal", title: "Buy mom's birthday gift",
        notes: "She likes artisanal chocolate or flowers", dueDate: nextWeekStr(), dueTime: null,
        priority: "medium", tags: ["family"], flagged: false, completed: false, completedAt: null,
        createdAt: now - 864e5 * 2, updatedAt: now - 864e5,
    },
    {
        id: "r3", listId: "shopping", title: "Groceries — milk, eggs, bread",
        notes: "Don't forget to check expiry dates", dueDate: tmrwStr(), dueTime: "17:00",
        priority: "low", tags: ["weekly"], flagged: false, completed: false, completedAt: null,
        createdAt: now - 864e5, updatedAt: now,
    },
    {
        id: "r4", listId: "work", title: "Weekly team standup",
        notes: "Review Q3 goals and blockers", dueDate: todayStr(), dueTime: "09:00",
        priority: "medium", tags: ["meeting"], flagged: false, completed: true, completedAt: now - 3600e3,
        createdAt: now - 864e5 * 2, updatedAt: now - 3600e3,
    },
    {
        id: "r5", listId: "personal", title: "Book dentist appointment",
        notes: "Dr. Smith on Oak Street", dueDate: tmrwStr(), dueTime: "14:00",
        priority: "medium", tags: ["health"], flagged: false, completed: false, completedAt: null,
        createdAt: now - 864e5 * 3, updatedAt: now - 864e5 * 2,
    },
    {
        id: "r6", listId: "work", title: "Review pull requests",
        notes: "Check the frontend refactor branch", dueDate: todayStr(), dueTime: null,
        priority: "high", tags: ["urgent"], flagged: true, completed: false, completedAt: null,
        createdAt: now - 864e5, updatedAt: now,
    },
    {
        id: "r7", listId: "shopping", title: "Get a new phone charger",
        notes: "USB-C, at least 20W", dueDate: tmrwStr(), dueTime: null,
        priority: "low", tags: [] , flagged: false, completed: true, completedAt: now - 864e5,
        createdAt: now - 864e5 * 4, updatedAt: now - 864e5,
    },
    {
        id: "r8", listId: "personal", title: "Car service due",
        notes: "Oil change + tire rotation", dueDate: nextWeekStr(), dueTime: null,
        priority: "medium", tags: ["car"], flagged: false, completed: false, completedAt: null,
        createdAt: now - 864e5 * 5, updatedAt: now - 864e5 * 3,
    },
    {
        id: "r9", listId: "work", title: "Update documentation",
        notes: "API docs for the new endpoints", dueDate: lastWeekStr(), dueTime: null,
        priority: "low", tags: ["docs"], flagged: false, completed: true, completedAt: now - 864e5 * 2,
        createdAt: now - 864e5 * 6, updatedAt: now - 864e5 * 2,
    },
    {
        id: "r10", listId: "personal", title: "Call the plumber",
        notes: "Leaky faucet in the kitchen", dueDate: tmrwStr(), dueTime: "18:00",
        priority: "high", tags: ["home"], flagged: true, completed: false, completedAt: null,
        createdAt: now - 864e5, updatedAt: now,
    },
];
// ── Helpers ──
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    // Seed
    return {
        lists: SEED_LISTS.filter(l => !l.smartType),
        reminders: SEED_REMINDERS,
    };
}
function save(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
}
// ── Store Class ──
class RemindersStore {
    constructor() {
        this.listeners = [];
        const loaded = load();
        this.data = {
            lists: loaded.lists || [],
            reminders: loaded.reminders || [],
        };
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
    notify() {
        save(this.data);
        this.listeners.forEach(fn => fn());
    }
    // ── Smart lists ──
    getSmartCount(type) {
        switch (type) {
            case "today":
                return this.data.reminders.filter(r => {
                    if (r.completed) return false;
                    const rd = new Date(r.dueDate + "T00:00:00");
                    const t = new Date();
                    return rd.getFullYear() === t.getFullYear() && rd.getMonth() === t.getMonth() && rd.getDate() === t.getDate();
                }).length;
            case "scheduled":
                return this.data.reminders.filter(r => !r.completed && r.dueDate).length;
            case "flagged":
                return this.data.reminders.filter(r => !r.completed && r.flagged).length;
            case "completed":
                return this.data.reminders.filter(r => r.completed).length;
            case "all":
                return this.data.reminders.filter(r => !r.completed).length;
            default:
                return 0;
        }
    }
    // ── Lists ──
    getLists() {
        const smart = [
            { id: "today", name: "Today", color: "#007aff", smartType: "today" },
            { id: "scheduled", name: "Scheduled", color: "#ff9500", smartType: "scheduled" },
            { id: "flagged", name: "Flagged", color: "#ff3b30", smartType: "flagged" },
            { id: "completed", name: "Completed", color: "#8e8e93", smartType: "completed" },
            { id: "all", name: "All", color: "#5856d6", smartType: "all" },
        ];
        return [...smart, ...this.data.lists.map(l => ({ ...l, smartType: null }))];
    }
    getCustomLists() {
        return this.data.lists;
    }
    createList(name, color) {
        const list = { id: "list_" + Date.now(), name: (name || "New List").trim(), color: color || "#007aff" };
        this.data.lists.push(list);
        this.notify();
        return list;
    }
    renameList(id, name) {
        const l = this.data.lists.find(l => l.id === id);
        if (l) { l.name = name.trim(); this.notify(); }
    }
    deleteList(id) {
        this.data.reminders = this.data.reminders.filter(r => r.listId !== id);
        this.data.lists = this.data.lists.filter(l => l.id !== id);
        this.notify();
    }
    getList(id) {
        if (["today","scheduled","flagged","completed","all"].includes(id)) {
            const found = this.getLists().find(l => l.id === id);
            return found || null;
        }
        return this.data.lists.find(l => l.id === id) || null;
    }
    // ── Reminders ──
    getReminders(listId) {
        let list;
        if (listId === "today") {
            const t = new Date();
            list = this.data.reminders.filter(r => {
                if (r.completed) return false;
                const rd = new Date(r.dueDate + "T00:00:00");
                return rd.getFullYear() === t.getFullYear() && rd.getMonth() === t.getMonth() && rd.getDate() === t.getDate();
            });
        } else if (listId === "scheduled") {
            list = this.data.reminders.filter(r => !r.completed && r.dueDate);
        } else if (listId === "flagged") {
            list = this.data.reminders.filter(r => !r.completed && r.flagged);
        } else if (listId === "completed") {
            list = this.data.reminders.filter(r => r.completed);
        } else if (listId === "all") {
            list = this.data.reminders.filter(r => !r.completed);
        } else {
            list = this.data.reminders.filter(r => r.listId === listId && !r.completed);
        }
        // Sort: flagged first, then by priority (high > medium > low), then by due date, then created
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return list.sort((a, b) => {
            if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
            const pa = priorityOrder[a.priority] ?? 2;
            const pb = priorityOrder[b.priority] ?? 2;
            if (pa !== pb) return pa - pb;
            if (a.dueDate && b.dueDate) {
                const dd = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                if (dd !== 0) return dd;
            }
            return a.createdAt - b.createdAt;
        });
    }
    getCompletedReminders(listId) {
        if (listId === "completed" || listId === "all") {
            return this.data.reminders.filter(r => r.completed);
        }
        if (listId === "today" || listId === "scheduled" || listId === "flagged") {
            return [];
        }
        return this.data.reminders.filter(r => r.listId === listId && r.completed);
    }
    createReminder(listId, data) {
        const nowMs = Date.now();
        const rem = {
            id: "r_" + nowMs,
            listId: listId === "all" || listId.startsWith("smart_") ? "personal" : listId,
            title: data.title || "New Reminder",
            notes: data.notes || "",
            dueDate: data.dueDate || null,
            dueTime: data.dueTime || null,
            priority: data.priority || "medium",
            tags: Array.isArray(data.tags) ? [...data.tags] : [],
            flagged: data.flagged || false,
            completed: false,
            completedAt: null,
            createdAt: nowMs,
            updatedAt: nowMs,
        };
        this.data.reminders.unshift(rem);
        this.notify();
        return rem;
    }
    updateReminder(id, changes) {
        const r = this.data.reminders.find(x => x.id === id);
        if (!r) return;
        Object.assign(r, changes, { updatedAt: Date.now() });
        this.notify();
    }
    deleteReminder(id) {
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.notify();
    }
    toggleComplete(id) {
        const r = this.data.reminders.find(x => x.id === id);
        if (!r) return;
        r.completed = !r.completed;
        r.completedAt = r.completed ? Date.now() : null;
        r.updatedAt = Date.now();
        this.notify();
    }
    toggleFlag(id) {
        const r = this.data.reminders.find(x => x.id === id);
        if (!r) return;
        r.flagged = !r.flagged;
        r.updatedAt = Date.now();
        this.notify();
    }
    moveToList(id, newListId) {
        const r = this.data.reminders.find(x => x.id === id);
        if (!r) return;
        r.listId = newListId;
        r.updatedAt = Date.now();
        this.notify();
    }
    searchReminders(query) {
        const q = query.toLowerCase().trim();
        return this.data.reminders.filter(r =>
            r.title.toLowerCase().includes(q) ||
            (r.notes || "").toLowerCase().includes(q) ||
            (r.tags || []).some(t => t.toLowerCase().includes(q))
        );
    }
    getReminder(id) {
        return this.data.reminders.find(r => r.id === id);
    }
    getCountForList(listId) {
        if (listId === "today") return this.getSmartCount("today");
        if (listId === "scheduled") return this.getSmartCount("scheduled");
        if (listId === "flagged") return this.getSmartCount("flagged");
        if (listId === "completed") return this.getSmartCount("completed");
        if (listId === "all") return this.getSmartCount("all");
        return this.data.reminders.filter(r => r.listId === listId && !r.completed).length;
    }
}
// Singleton
window.__remindersStore = window.__remindersStore || new RemindersStore();
