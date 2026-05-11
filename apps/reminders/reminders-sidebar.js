"use strict";
// ============================================================
//  Reminders — reminders-sidebar.ts
// ============================================================
class RemindersSidebar {
    constructor(cbs) {
        this.active = "today";
        this.cbs = cbs;
        this.store = window.__remindersStore;
        this.el = document.createElement("div");
        this.el.className = "rem-sidebar";
        this._render();
        this.store.subscribe(() => this._render());
    }
    setActive(id) {
        this.active = id;
        this.el.querySelectorAll("[data-sid]").forEach(el => {
            el.classList.toggle("active", el.dataset.sid === id);
        });
    }
    _render() {
        this.el.innerHTML = "";
        // ── Search ──
        const search = document.createElement("div");
        search.className = "rem-search-wrap";
        search.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="opacity:.4;flex-shrink:0"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input type="text" placeholder="Search" class="rem-search-input" id="remSearchInput" />
    `;
        this.el.appendChild(search);
        const searchInput = search.querySelector("#remSearchInput");
        searchInput?.addEventListener("input", () => {
            const q = searchInput.value.trim();
            if (q) {
                this.cbs.onSelect("search:" + q);
            }
            else {
                this.cbs.onSelect(this.active);
            }
        });
        // ── Smart lists grid ──
        const grid = document.createElement("div");
        grid.className = "rem-smart-grid";
        const smarts = [
            { id: "today", label: "Today", icon: "calendar", color: "#0a84ff", count: this.store.countToday() },
            { id: "scheduled", label: "Scheduled", icon: "clock", color: "#ff6b35", count: this.store.countScheduled() },
            { id: "all", label: "All", icon: "tray", color: "#636366", count: this.store.countAll() },
            { id: "flagged", label: "Flagged", icon: "flag", color: "#ff9f0a", count: this.store.countFlagged() },
            { id: "completed", label: "Completed", icon: "checkmark", color: "#636366", count: this.store.countCompleted() },
        ];
        smarts.forEach(s => {
            const tile = document.createElement("button");
            tile.className = "rem-smart-tile" + (this.active === s.id ? " active" : "");
            tile.dataset.sid = s.id;
            tile.innerHTML = `
        <div class="rem-smart-icon" style="background:${s.color}20;color:${s.color}">
          ${this._smartIcon(s.icon, s.color)}
        </div>
        <div class="rem-smart-label">${s.label}</div>
        <div class="rem-smart-count" style="color:${s.color}">${s.count}</div>
      `;
            tile.addEventListener("click", () => { this.setActive(s.id); this.cbs.onSelect(s.id); });
            grid.appendChild(tile);
        });
        this.el.appendChild(grid);
        // ── My Lists ──
        const listsHeader = document.createElement("div");
        listsHeader.className = "rem-section-label";
        listsHeader.textContent = "My Lists";
        this.el.appendChild(listsHeader);
        const lists = this.store.getLists();
        lists.forEach((list) => {
            const item = document.createElement("button");
            item.className = "rem-list-item" + (this.active === list.id ? " active" : "");
            item.dataset.sid = list.id;
            const count = this.store.getListCount(list.id);
            item.innerHTML = `
        <span class="rem-list-icon" style="background:${list.color}">${this._listIcon(list.icon)}</span>
        <span class="rem-list-name">${list.name}</span>
        ${count > 0 ? `<span class="rem-list-count">${count}</span>` : ""}
      `;
            item.addEventListener("click", () => { this.setActive(list.id); this.cbs.onSelect(list.id); });
            item.addEventListener("contextmenu", (e) => { e.preventDefault(); this._listContextMenu(e, list); });
            this.el.appendChild(item);
        });
        // ── Add List ──
        const addList = document.createElement("button");
        addList.className = "rem-add-list-btn";
        addList.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
      Add List
    `;
        addList.addEventListener("click", () => this._createList());
        this.el.appendChild(addList);
    }
    _createList() {
        const name = prompt("List name:");
        if (!name?.trim())
            return;
        const colors = ["#0a84ff", "#ff453a", "#ff9f0a", "#30d158", "#bf5af2", "#ff375f", "#ffd60a", "#5ac8fa"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const list = this.store.createList(name.trim(), color, "list.bullet");
        this.setActive(list.id);
        this.cbs.onSelect(list.id);
    }
    _listContextMenu(e, list) {
        document.getElementById("rem-ctx")?.remove();
        const menu = document.createElement("div");
        menu.id = "rem-ctx";
        menu.className = "rem-context-menu";
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;
        menu.innerHTML = `
      <button class="rem-ctx-item" id="rcRename">Rename List</button>
      <div class="rem-ctx-sep"></div>
      <button class="rem-ctx-item rem-ctx-danger" id="rcDelete">Delete List</button>
    `;
        document.body.appendChild(menu);
        menu.querySelector("#rcRename")?.addEventListener("click", () => {
            menu.remove();
            const name = prompt("Rename list:", list.name);
            if (name?.trim())
                this.store.updateList(list.id, { name: name.trim() });
        });
        menu.querySelector("#rcDelete")?.addEventListener("click", () => {
            menu.remove();
            if (confirm(`Delete "${list.name}"?`))
                this.store.deleteList(list.id);
        });
        const close = (ev) => { if (!menu.contains(ev.target)) {
            menu.remove();
            document.removeEventListener("mousedown", close);
        } };
        setTimeout(() => document.addEventListener("mousedown", close), 50);
    }
    _smartIcon(name, color) {
        const s = `fill="${color}" width="18" height="18"`;
        const icons = {
            calendar: `<svg viewBox="0 0 24 24" ${s}><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>`,
            clock: `<svg viewBox="0 0 24 24" ${s}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
            tray: `<svg viewBox="0 0 24 24" ${s}><path d="M20 3H4v10l-2 3v1h20v-1l-2-3V3zm0 12H4l2-3V5h12v7l2 3zM7 17h10v1c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-1z"/></svg>`,
            flag: `<svg viewBox="0 0 24 24" ${s}><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`,
            checkmark: `<svg viewBox="0 0 24 24" ${s}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
        };
        return icons[name] ?? icons["tray"];
    }
    _listIcon(icon) {
        const iconMap = {
            "list.bullet": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
            "house": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
            "briefcase": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M20 6h-2.18c.07-.44.18-.87.18-1.33C18 3.19 16.81 2 15.33 2H8.67C7.19 2 6 3.19 6 4.67c0 .46.11.89.18 1.33H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM8.67 4h6.67C15.7 4 16 4.3 16 4.67c0 .37-.3.67-.67.67H8.67C8.3 5.33 8 5.03 8 4.67 8 4.3 8.3 4 8.67 4zM20 19H4V8h16v11z"/></svg>`,
            "cart": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.46 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
            "tent": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M12 2L2 19h20L12 2zm0 4l6.5 11h-4l-2.5-4-2.5 4h-4L12 6z"/></svg>`,
            "book": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`,
            "leaf": `<svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 6-8 6-.33.67-1.08 1.83-1.84 2.61C10.91 13.23 10.64 15 11 16c.8 1.96 3.97 1.52 5.29 2.35.99.61 1.71 2.29 1.71 4.65h2c0-3.26-1.38-5.67-3.6-6.96C14.6 14.98 13 14 13 12.5c0-1.24.62-2.26 1.4-3.18L16 8.8l1-0.8z"/></svg>`,
        };
        return iconMap[icon] ?? iconMap["list.bullet"];
    }
}
window.__RemindersSidebar = RemindersSidebar;
 
