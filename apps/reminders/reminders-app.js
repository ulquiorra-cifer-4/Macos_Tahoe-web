"use strict";
// ============================================================
//  Reminders App — reminders-app.ts
//  Assembles sidebar + main list/kanban view + detail panel
// ============================================================
class RemindersApp {
    constructor() {
        this.viewMode = "list";
        this.currentSelection = "today";
        this.showCompleted = false;
        this.store = window.__remindersStore;
        this.el = document.createElement("div");
        this.el.className = "reminders-app";
        this._build();
        this.store.subscribe(() => this._refreshMain());
    }
    _build() {
        // Sidebar
        this.sidebar = new window.__RemindersSidebar({
            onSelect: (sel) => {
                this.currentSelection = sel;
                this._refreshMain();
            },
        });
        // Detail panel
        this.detail = new window.__RemindersDetail();
        // Main area
        this.mainEl = document.createElement("div");
        this.mainEl.className = "rem-main";
        // Layout
        const body = document.createElement("div");
        body.className = "rem-body";
        body.append(this.sidebar.el, this.mainEl, this.detail.el);
        this.el.appendChild(body);
        this._renderMain();
    }
    // ─────────────────────────────────────────────
    //  Main panel
    // ─────────────────────────────────────────────
    _renderMain() {
        this.mainEl.innerHTML = "";
        const reminders = this._getCurrentReminders();
        const info = this._getSelectionInfo();
        // ── Toolbar ──
        const toolbar = document.createElement("div");
        toolbar.className = "rem-toolbar";
        toolbar.innerHTML = `
      <div class="rem-tb-left">
        <div class="rem-list-header-title" style="color:${info.color}">${info.title}</div>
        ${info.subtitle ? `<div class="rem-list-subtitle">${info.subtitle}</div>` : ""}
      </div>
      <div class="rem-tb-right">
        <div class="rem-count-badge" style="color:${info.color}">${reminders.filter(r => !r.completed).length}</div>
        <div class="rem-tb-actions">
          <button class="rem-tb-btn ${this.viewMode === "list" ? "active" : ""}" data-view="list"   title="List View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          </button>
          <button class="rem-tb-btn ${this.viewMode === "column" ? "active" : ""}" data-view="column" title="Column View">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 3h5v18H3zm7 0h5v18h-5zm7 0h4v18h-4z"/></svg>
          </button>
          <button class="rem-tb-btn" id="remShowCompleted" title="${this.showCompleted ? "Hide Completed" : "Show Completed"}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </button>
        </div>
      </div>
    `;
        toolbar.querySelectorAll(".rem-tb-btn[data-view]").forEach(btn => {
            btn.addEventListener("click", () => {
                this.viewMode = btn.dataset.view;
                this._renderMain();
            });
        });
        toolbar.querySelector("#remShowCompleted")?.addEventListener("click", () => {
            this.showCompleted = !this.showCompleted;
            this._renderMain();
        });
        this.mainEl.appendChild(toolbar);
        // ── Content ──
        if (this.viewMode === "column") {
            this._renderKanban(reminders);
        }
        else {
            this._renderList(reminders);
        }
    }
    // ── List View ──
    _renderList(reminders) {
        const content = document.createElement("div");
        content.className = "rem-list-content";
        const active = reminders.filter(r => !r.completed);
        const completed = reminders.filter(r => r.completed);
        if (!active.length && !completed.length) {
            content.innerHTML = `<div class="rem-empty"><div class="rem-empty-icon">✓</div><p>No Reminders</p></div>`;
            this.mainEl.appendChild(content);
            this._bindAddBtn();
            return;
        }
        // Active reminders
        active.forEach(r => {
            const item = new window.__RemindersItem(r.id, {
                onComplete: (id) => this.store.toggleComplete(id),
                onFlag: (id) => this.store.toggleFlag(id),
                onDelete: (id) => this.store.delete(id),
                onEdit: (id) => { this.detail.show(id); },
                onTitleChange: (id, title) => this.store.update(id, { title }),
            });
            content.appendChild(item.el);
        });
        // Completed section
        if (this.showCompleted && completed.length) {
            const compHeader = document.createElement("div");
            compHeader.className = "rem-completed-header";
            compHeader.innerHTML = `
        <span>Completed</span>
        <span class="rem-completed-count">${completed.length}</span>
        <button class="rem-clear-btn" id="remClearAll">Clear</button>
      `;
            compHeader.querySelector("#remClearAll")?.addEventListener("click", () => {
                completed.forEach(r => this.store.delete(r.id));
            });
            content.appendChild(compHeader);
            completed.forEach(r => {
                const item = new window.__RemindersItem(r.id, {
                    onComplete: (id) => this.store.toggleComplete(id),
                    onFlag: (id) => this.store.toggleFlag(id),
                    onDelete: (id) => this.store.delete(id),
                    onEdit: (id) => this.detail.show(id),
                    onTitleChange: (id, title) => this.store.update(id, { title }),
                });
                content.appendChild(item.el);
            });
        }
        this.mainEl.appendChild(content);
        this._bindAddBtn();
    }
    // ── Kanban / Column View ──
    _renderKanban(reminders) {
        const board = document.createElement("div");
        board.className = "rem-kanban";
        // Group by assignee
        const groups = new Map();
        reminders.filter(r => !r.completed).forEach(r => {
            const key = r.assignee || "Unassigned";
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(r);
        });
        // If no assignees, put everything in one column
        if (groups.size === 0 || (groups.size === 1 && groups.has("Unassigned"))) {
            const allGroup = new Map([["All", reminders.filter(r => !r.completed)]]);
            allGroup.forEach((rems, name) => this._makeKanbanColumn(board, name, rems));
        }
        else {
            groups.forEach((rems, name) => this._makeKanbanColumn(board, name, rems));
        }
        this.mainEl.appendChild(board);
    }
    _makeKanbanColumn(board, name, reminders) {
        const col = document.createElement("div");
        col.className = "rem-kanban-col";
        const header = document.createElement("div");
        header.className = "rem-kanban-header";
        header.innerHTML = `
      <span class="rem-kanban-name">${name}</span>
      <button class="rem-kanban-more">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>
    `;
        col.appendChild(header);
        const cardList = document.createElement("div");
        cardList.className = "rem-kanban-cards";
        reminders.forEach(r => {
            const card = this._makeKanbanCard(r);
            cardList.appendChild(card);
        });
        // Add card button
        const addCard = document.createElement("button");
        addCard.className = "rem-kanban-add";
        addCard.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> New Reminder`;
        addCard.addEventListener("click", () => {
            const listId = this._getCurrentListId() ?? "reminders";
            const r = this.store.create(listId, "");
            this.store.update(r.id, { assignee: name === "All" ? undefined : name });
            this.detail.show(r.id);
        });
        col.append(cardList, addCard);
        board.appendChild(col);
    }
    _makeKanbanCard(r) {
        const card = document.createElement("div");
        card.className = "rem-kanban-card";
        const dueStr = this.store.formatDue(r);
        const overdue = this.store.isOverdue(r);
        card.innerHTML = `
      <div class="rem-kc-header">
        <button class="rem-kc-check" data-id="${r.id}">
          <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="8" fill="none" stroke="#8e8e93" stroke-width="1.5"/></svg>
        </button>
        ${r.flagged ? `<svg viewBox="0 0 24 24" fill="#ff9f0a" width="11" height="11"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>` : ""}
        <button class="rem-kc-more" data-id="${r.id}">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>
      <div class="rem-kc-title">${r.title || "<em style='opacity:.4'>New Reminder</em>"}</div>
      ${r.notes ? `<div class="rem-kc-notes">${r.notes.substring(0, 80)}${r.notes.length > 80 ? "…" : ""}</div>` : ""}
      ${dueStr ? `<div class="rem-kc-due${overdue ? " overdue" : ""}">${dueStr}</div>` : ""}
      ${r.imageUrl ? `<img src="${r.imageUrl}" class="rem-kc-img" alt="" />` : ""}
    `;
        card.querySelector(".rem-kc-check")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.store.toggleComplete(r.id);
        });
        card.querySelector(".rem-kc-more")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.detail.show(r.id);
        });
        card.addEventListener("dblclick", () => this.detail.show(r.id));
        return card;
    }
    // ── Add button (floating) ──
    _bindAddBtn() {
        const fab = document.createElement("button");
        fab.className = "rem-fab";
        fab.title = "New Reminder";
        fab.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
        fab.addEventListener("click", () => {
            const listId = this._getCurrentListId() ?? "reminders";
            const r = this.store.create(listId, "");
            this.detail.show(r.id);
        });
        this.mainEl.appendChild(fab);
    }
    // ── Helpers ──
    _refreshMain() { this._renderMain(); }
    _getCurrentReminders() {
        const sel = this.currentSelection;
        if (sel.startsWith("search:"))
            return this.store.search(sel.slice(7));
        switch (sel) {
            case "today": return this.store.getToday();
            case "scheduled": return this.store.getScheduled();
            case "all": return this.store.getAll_active();
            case "flagged": return this.store.getFlagged();
            case "completed": return this.store.getCompleted();
            default: return this.store.getByList(sel);
        }
    }
    _getCurrentListId() {
        const sel = this.currentSelection;
        if (["today", "scheduled", "all", "flagged", "completed"].includes(sel))
            return null;
        if (sel.startsWith("search:"))
            return null;
        return sel;
    }
    _getSelectionInfo() {
        const sel = this.currentSelection;
        const count = this._getCurrentReminders().filter(r => !r.completed).length;
        if (sel.startsWith("search:"))
            return { title: `"${sel.slice(7)}"`, subtitle: `${count} results`, color: "#636366" };
        switch (sel) {
            case "today": return { title: "Today", subtitle: `${count} Reminders`, color: "#0a84ff" };
            case "scheduled": return { title: "Scheduled", subtitle: `${count} Reminders`, color: "#ff6b35" };
            case "all": return { title: "All", subtitle: `${count} Reminders`, color: "#636366" };
            case "flagged": return { title: "Flagged", subtitle: `${count} Reminders`, color: "#ff9f0a" };
            case "completed": return { title: "Completed", subtitle: `${count} Completed`, color: "#636366" };
            default: {
                const list = this.store.getList(sel);
                return { title: list?.name ?? sel, subtitle: `${count} Reminders`, color: list?.color ?? "#0a84ff" };
            }
        }
    }
}
// ── Register globally ──
window.openRemindersWindow = function () {
    window.__createWindow({
        appId: "reminders",
        title: "Reminders",
        width: 900,
        height: 580,
        content: (_win) => {
            const app = new RemindersApp();
            return app.el;
        },
    });
};
 
