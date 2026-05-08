"use strict";
// ============================================================
//  Reminders App — reminders-app.js
//  Assembles sidebar + reminder list into 2-column layout
// ============================================================
class RemindersApp {
    constructor() {
        this.activeListId = "today";
        this.editingNoteId = null;
        this.searchMode = false;
        this.store = window.__remindersStore;
        this.el = document.createElement("div");
        this.el.className = "reminders-app";
        this._build();
        this.store.subscribe(() => this._refresh());
    }

    // ── Build ──
    _build() {
        // Sidebar
        this.sidebarEl = document.createElement("div");
        this.sidebarEl.className = "rm-sidebar";
        this._renderSidebar();

        // Main area
        this.mainEl = document.createElement("div");
        this.mainEl.className = "rm-main";
        this._renderMain();

        this.el.appendChild(this.sidebarEl);
        this.el.appendChild(this.mainEl);
    }

    // ═════════════════════════════════════════════
    //  SIDEBAR
    // ═════════════════════════════════════════════
    _renderSidebar() {
        this.sidebarEl.innerHTML = "";

        // Header
        const header = document.createElement("div");
        header.className = "rm-sidebar-header";
        header.innerHTML = `<span class="rm-sidebar-title">Lists</span>`;
        this.sidebarEl.appendChild(header);

        // Smart lists group
        const smartLabel = document.createElement("div");
        smartLabel.className = "rm-list-group-label";
        smartLabel.textContent = "Reminders";
        this.sidebarEl.appendChild(smartLabel);

        const lists = this.store.getLists();
        // Smart lists first
        const smart = lists.filter(l => l.smartType);
        smart.forEach((l) => this._renderSidebarItem(l));

        // Custom lists
        const custom = this.store.getCustomLists();
        if (custom.length > 0) {
            const sep = document.createElement("div");
            sep.className = "rm-list-sep";
            this.sidebarEl.appendChild(sep);
            const customLabel = document.createElement("div");
            customLabel.className = "rm-list-group-label";
            customLabel.textContent = "My Lists";
            this.sidebarEl.appendChild(customLabel);
            custom.forEach((l) => this._renderSidebarItem({ ...l, smartType: null }));
        }

        // Add list button
        const addBtn = document.createElement("button");
        addBtn.className = "rm-add-list-btn";
        addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 4v8H4v2h8v8h2v-8h8v-2h-8V4z"/></svg> Add List`;
        addBtn.addEventListener("click", () => {
            const name = prompt("New list name:");
            if (name?.trim()) this.store.createList(name.trim());
        });
        this.sidebarEl.appendChild(addBtn);
    }

    _renderSidebarItem(list) {
        const item = document.createElement("button");
        item.className = "rm-list-item" + (list.id === this.activeListId ? " active" : "");
        const count = this.store.getCountForList(list.id);
        const ct = count > 0 ? `<span class="rm-list-count">${count}</span>` : "";
        item.innerHTML = `
            <span class="rm-list-icon" style="background:${list.color}"></span>
            <span class="rm-list-name">${this._escHtml(list.name)}</span>
            ${ct}
        `;
        item.addEventListener("click", () => {
            this.activeListId = list.id;
            this.searchMode = false;
            this.editingNoteId = null;
            this._refreshSidebar();
            this._renderMain();
        });
        // Context menu for custom lists
        if (!list.smartType) {
            item.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                this._showListContextMenu(e, list);
            });
        }
        this.sidebarEl.appendChild(item);
    }

    _showListContextMenu(e, list) {
        document.getElementById("rm-ctx-menu")?.remove();
        const menu = document.createElement("div");
        menu.id = "rm-ctx-menu";
        menu.className = "rm-context-menu";
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.innerHTML = `
            <button class="rm-ctx-btn">Rename List</button>
            <button class="rm-ctx-btn rm-ctx-danger">Delete List</button>
        `;
        document.body.appendChild(menu);
        const items = menu.querySelectorAll(".rm-ctx-btn");
        items[0].addEventListener("click", () => {
            menu.remove();
            const name = prompt("Rename list:", list.name);
            if (name?.trim()) this.store.renameList(list.id, name.trim());
        });
        items[1].addEventListener("click", () => {
            menu.remove();
            if (confirm(`Delete "${list.name}" and all its reminders?`)) {
                this.store.deleteList(list.id);
                this.activeListId = "today";
                this._refresh();
            }
        });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }

    _refreshSidebar() {
        // Re-render sidebar but preserve scroll
        const scrollTop = this.sidebarEl.scrollTop;
        this._renderSidebar();
        this.sidebarEl.scrollTop = scrollTop;
    }

    // ═════════════════════════════════════════════
    //  MAIN AREA
    // ═════════════════════════════════════════════
    _renderMain() {
        this.mainEl.innerHTML = "";
        const list = this.store.getList(this.activeListId);
        const listName = list?.name || "Reminders";
        // Topbar
        const topBar = document.createElement("div");
        topBar.className = "rm-topbar";
        topBar.innerHTML = `
            <div class="rm-topbar-center">${this._escHtml(listName)}</div>
            <div class="rm-topbar-actions">
                <button class="rm-topbar-btn" title="Search" id="rmSearchBtn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                </button>
                <button class="rm-topbar-btn" title="New Reminder" id="rmNewReminder">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 4v8H4v2h8v8h2v-8h8v-2h-8V4z"/></svg>
                </button>
            </div>
        `;
        this.mainEl.appendChild(topBar);

        // Search input (hidden by default)
        if (this.searchMode) {
            const searchWrap = document.createElement("div");
            searchWrap.className = "rm-search-wrap";
            searchWrap.style.margin = "8px 12px 0";
            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.className = "rm-search-input";
            searchInput.placeholder = "Search reminders...";
            searchInput.value = this._searchQuery || "";
            searchInput.addEventListener("input", (e) => {
                this._searchQuery = e.target.value;
                this._renderReminderList();
            });
            searchWrap.appendChild(searchInput);
            this.mainEl.appendChild(searchWrap);
            // Auto focus
            requestAnimationFrame(() => searchInput.focus());
        }

        // Reminder list
        this.listBodyEl = document.createElement("div");
        this.listBodyEl.className = "rm-list-body";
        const scroll = document.createElement("div");
        scroll.className = "rm-list-scroll";

        // Quick add input
        if (!this.searchMode) {
            const quickAdd = document.createElement("div");
            quickAdd.className = "rm-quick-add";
            quickAdd.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="opacity:.5;vertical-align:middle;margin-right:4px"><path d="M12 4v8H4v2h8v8h2v-8h8v-2h-8V4z"/></svg> New Reminder`;
            quickAdd.addEventListener("click", () => {
                this._showAddForm();
            });
            scroll.appendChild(quickAdd);
        }

        scroll.appendChild(this._buildReminderList());
        this.listBodyEl.appendChild(scroll);
        this.mainEl.appendChild(this.listBodyEl);

        // Bind top bar
        topBar.querySelector("#rmSearchBtn")?.addEventListener("click", () => {
            this.searchMode = !this.searchMode;
            this._renderMain();
        });
        topBar.querySelector("#rmNewReminder")?.addEventListener("click", () => {
            this._showAddForm();
        });
    }

    _buildReminderList() {
        const container = document.createElement("div");
        const reminders = this.searchMode && this._searchQuery
            ? this.store.searchReminders(this._searchQuery).filter(r => !r.completed)
            : this.store.getReminders(this.activeListId);
        const completed = this.store.getCompletedReminders(this.activeListId);

        if (reminders.length === 0 && completed.length === 0 && !this.searchMode) {
            const empty = document.createElement("div");
            empty.className = "rm-empty-state";
            empty.innerHTML = `<div class="rm-empty-icon">✅</div><div>No Reminders</div>`;
            container.appendChild(empty);
            return container;
        }

        // Active reminders
        reminders.forEach(r => container.appendChild(this._renderReminder(r, false)));

        // Completed section
        if (completed.length > 0) {
            const sec = document.createElement("div");
            sec.className = "rm-section-header";
            sec.textContent = "Completed";
            container.appendChild(sec);
            completed.forEach(r => container.appendChild(this._renderReminder(r, true)));
        }

        return container;
    }

    _renderReminder(r, isCompleted) {
        const el = document.createElement("div");
        el.className = "rm-reminder-item";
        el.dataset.id = r.id;

        const priorityClass = `rm-priority-${r.priority}`;
        const isFlagged = r.flagged ? true : false;
        const dueInfo = this._formatDueDate(r.dueDate, r.dueTime);
        const tagsHtml = (r.tags || []).map(t => `<span class="rm-tag">${this._escHtml(t)}</span>`).join("");
        const listInfo = this.store.getList(r.listId);
        const listColor = listInfo?.color || "#8e8e93";

        el.innerHTML = `
            <div class="rm-checkbox ${isCompleted ? 'checked' : ''}" data-id="${r.id}">
                <svg viewBox="0 0 14 14" width="10" height="10"><path d="M3 7l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="rm-reminder-content">
                <div class="rm-reminder-header">
                    <span class="rm-reminder-title ${isCompleted ? 'completed' : ''}">${this._escHtml(r.title)}</span>
                    ${r.priority === "high" && !isCompleted ? `<span class="rm-priority rm-priority-high" title="High priority"></span>` : ""}
                    ${isFlagged ? `<svg class="rm-flag flagged" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2L3 19h18L12 2z"/></svg>` : ""}
                </div>
                ${r.notes && !isCompleted ? `<div class="rm-reminder-notes">${this._escHtml(r.notes)}</div>` : ""}
                <div class="rm-reminder-meta">
                    ${dueInfo ? `<span class="rm-due-date ${dueInfo.cls}">${dueInfo.text}</span>` : ""}
                    ${tagsHtml}
                    <span class="rm-list-label"><span class="rm-dot" style="background:${listColor}"></span>${this._escHtml(listInfo?.name || "Reminders")}</span>
                </div>
            </div>
        `;

        // Checkbox toggle
        const checkbox = el.querySelector(".rm-checkbox");
        checkbox.addEventListener("click", (e) => {
            e.stopPropagation();
            this.store.toggleComplete(r.id);
        });

        // Click to edit
        el.addEventListener("click", () => {
            this._editReminder(r.id);
        });

        // Context menu (right-click)
        el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this._showReminderContextMenu(e, r);
        });

        return el;
    }

    _showAddForm() {
        if (this._addFormActive) return;
        this._addFormActive = true;
        const scrollArea = this.listBodyEl.querySelector(".rm-list-scroll");
        if (!scrollArea) return;

        const form = document.createElement("div");
        form.className = "rm-add-form";
        form.innerHTML = `
            <input type="text" class="rm-input" id="rmAddTitle" placeholder="Title" autofocus />
            <textarea class="rm-input" id="rmAddNotes" rows="2" placeholder="Notes (optional)"></textarea>
            <div class="rm-input-row" style="justify-content:space-between">
                <div class="rm-priority-select">
                    <span style="font-size:11px;color:rgba(0,0,0,0.4)">Priority:</span>
                    <span class="rm-priority-btn rm-prio-high selected" data-prio="high" title="High"></span>
                    <span class="rm-priority-btn rm-prio-medium" data-prio="medium" title="Medium"></span>
                    <span class="rm-priority-btn rm-prio-low" data-prio="low" title="Low"></span>
                </div>
                <label><input type="checkbox" id="rmAddFlagged" style="margin-right:3px"/> Flag</label>
            </div>
            <div class="rm-date-row">
                <input type="date" id="rmAddDate" />
                <input type="time" id="rmAddTime" />
            </div>
            <div class="rm-form-actions">
                <button class="rm-form-submit" id="rmAddSubmit">Add</button>
                <button class="rm-form-cancel" id="rmAddCancel">Cancel</button>
            </div>
        `;

        const firstChild = scrollArea.querySelector(".rm-quick-add");
        if (firstChild) {
            scrollArea.insertBefore(form, firstChild.nextSibling);
        } else {
            scrollArea.insertBefore(form, scrollArea.firstChild);
        }

        // Priority selector
        let selectedPriority = "high";
        form.querySelectorAll(".rm-priority-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                form.querySelectorAll(".rm-priority-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedPriority = btn.dataset.prio;
            });
        });

        // Submit
        form.querySelector("#rmAddSubmit").addEventListener("click", () => {
            const title = form.querySelector("#rmAddTitle").value.trim();
            if (!title) return;
            const notes = form.querySelector("#rmAddNotes").value.trim();
            const dueDate = form.querySelector("#rmAddDate").value || null;
            const dueTime = form.querySelector("#rmAddTime").value || null;
            const flagged = form.querySelector("#rmAddFlagged").checked;
            this.store.createReminder(this.activeListId, { title, notes, dueDate, dueTime, priority: selectedPriority, flagged, tags: [] });
            this._addFormActive = false;
            this._renderReminderList();
        });

        // Cancel
        form.querySelector("#rmAddCancel").addEventListener("click", () => {
            this._addFormActive = false;
            form.remove();
        });

        // Enter shortcut
        form.querySelector("#rmAddTitle").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                form.querySelector("#rmAddSubmit").click();
            }
        });

        requestAnimationFrame(() => form.querySelector("#rmAddTitle").focus());
    }

    _editReminder(id) {
        if (this.editingNoteId === id) return;
        this.editingNoteId = id;
        const item = this.listBodyEl.querySelector(`.rm-reminder-item[data-id="${id}"]`);
        if (!item) return;

        const r = this.store.getReminder(id);
        if (!r) { this.editingNoteId = null; return; }

        const form = document.createElement("div");
        form.className = "rm-edit-form";
        form.innerHTML = `
            <input type="text" class="rm-input" id="rmEditTitle" value="${this._escHtml(r.title)}" />
            <textarea class="rm-input" id="rmEditNotes" rows="2" placeholder="Notes">${this._escHtml(r.notes || "")}</textarea>
            <div class="rm-form-actions">
                <button class="rm-form-submit" id="rmEditSave">Save</button>
                <button class="rm-form-cancel" id="rmEditCancel">Cancel</button>
            </div>
        `;
        item.replaceWith(form);

        form.querySelector("#rmEditSave").addEventListener("click", () => {
            const title = form.querySelector("#rmEditTitle").value.trim();
            const notes = form.querySelector("#rmEditNotes").value.trim();
            this.store.updateReminder(id, { title, notes });
            this.editingNoteId = null;
        });
        form.querySelector("#rmEditCancel").addEventListener("click", () => {
            this.editingNoteId = null;
            this._renderReminderList();
        });
        form.querySelector("#rmEditTitle").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                form.querySelector("#rmEditSave").click();
            }
        });

        form.querySelector("#rmEditTitle").focus();
    }

    _renderReminderList() {
        // Re-render the scroll area content without rebuilding the whole app
        const scrollArea = this.listBodyEl.querySelector(".rm-list-scroll");
        if (!scrollArea) return;
        // Remove all children except quick add if it exists
        const children = [...scrollArea.children];
        children.forEach(child => {
            if (child.className === "rm-quick-add") return;
            child.remove();
        });

        const reminders = this.searchMode && this._searchQuery
            ? this.store.searchReminders(this._searchQuery).filter(r => !r.completed)
            : this.store.getReminders(this.activeListId);
        const completed = this.store.getCompletedReminders(this.activeListId);

        // Quick add stays at top
        const quickAdd = scrollArea.querySelector(".rm-quick-add");

        // Active reminders
        reminders.forEach(r => {
            scrollArea.appendChild(this._renderReminder(r, false));
        });

        // Completed section
        if (completed.length > 0) {
            const sec = document.createElement("div");
            sec.className = "rm-section-header";
            sec.textContent = "Completed";
            scrollArea.appendChild(sec);
            completed.forEach(r => scrollArea.appendChild(this._renderReminder(r, true)));
        }

        if (reminders.length === 0 && completed.length === 0 && !this.searchMode) {
            const empty = document.createElement("div");
            empty.className = "rm-empty-state";
            empty.innerHTML = `<div class="rm-empty-icon">✅</div><div>No Reminders</div>`;
            scrollArea.appendChild(empty);
        }
    }

    // ═════════════════════════════════════════════
    //  CONTEXT MENU
    // ═════════════════════════════════════════════
    _showReminderContextMenu(e, r) {
        document.getElementById("rm-ctx-menu")?.remove();
        const menu = document.createElement("div");
        menu.id = "rm-ctx-menu";
        menu.className = "rm-context-menu";
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.innerHTML = `
            <button class="rm-ctx-btn">${r.flagged ? "Unflag" : "Flag"}</button>
            <button class="rm-ctx-btn">Edit</button>
            <div class="rm-ctx-sep"></div>
            <button class="rm-ctx-btn rm-ctx-danger">Delete</button>
        `;
        document.body.appendChild(menu);
        const items = menu.querySelectorAll(".rm-ctx-btn");
        let itemIdx = 0;
        items[itemIdx++].addEventListener("click", () => { menu.remove(); this.store.toggleFlag(r.id); });
        items[itemIdx++].addEventListener("click", () => { menu.remove(); this._editReminder(r.id); });
        items[itemIdx++].addEventListener("click", () => { menu.remove(); this.store.deleteReminder(r.id); });
        const close = () => { menu.remove(); document.removeEventListener("click", close); };
        setTimeout(() => document.addEventListener("click", close), 50);
    }

    // ═════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════
    _refresh() {
        this._refreshSidebar();
        this._renderReminderList();
    }

    _formatDueDate(dateStr, timeStr) {
        if (!dateStr) return null;
        const due = new Date(dateStr + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateText = "";
        if (due.toDateString() === today.toDateString()) dateText = "Today";
        else if (due.toDateString() === tomorrow.toDateString()) dateText = "Tomorrow";
        else if (due.toDateString() === yesterday.toDateString()) dateText = "Yesterday";
        else {
            const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            if (diff < 0) dateText = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            else if (diff <= 7) dateText = due.toLocaleDateString("en-US", { weekday: "short" });
            else dateText = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        const isOverdue = due < today;
        const isToday = due.toDateString() === today.toDateString();
        const isWithinWeek = !isOverdue && !isToday && due < new Date(today.getTime() + 7 * 864e5);

        let cls = "rm-due-future";
        if (isOverdue) cls = "rm-due-overdue";
        else if (isToday) cls = "rm-due-today";
        else if (isWithinWeek || dateText === "Tomorrow") cls = "rm-due-soon";

        const timePart = timeStr ? ` at ${timeStr}` : "";
        return { text: dateText + timePart, cls };
    }

    _escHtml(s) {
        return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

// ── Register globally ──
window.openRemindersWindow = function () {
    if (typeof window.__createWindow !== "function") return;
    window.__createWindow({
        appId: "reminders",
        title: "Reminders",
        width: 800,
        height: 580,
        content: (_win) => {
            if (!window.__remindersStore) {
                console.error("Reminders store not loaded");
                return document.createElement("div");
            }
            const app = new RemindersApp();
            return app.el;
        },
    });
};
