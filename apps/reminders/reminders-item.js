"use strict";
// ============================================================
//  Reminders — reminders-item.ts
//  Single task row with checkbox, inline edit, actions
// ============================================================
class RemindersItem {
    constructor(reminderId, cbs) {
        this.id = reminderId;
        this.cbs = cbs;
        this.store = window.__remindersStore;
        this.el = document.createElement("div");
        this._render();
    }
    refresh() { this._render(); }
    _render() {
        const r = this.store.getReminder(this.id);
        if (!r) {
            this.el.innerHTML = "";
            return;
        }
        const dueStr = this.store.formatDue(r);
        const overdue = this.store.isOverdue(r);
        this.el.className = "rem-item" + (r.completed ? " completed" : "") + (r.flagged ? " flagged" : "");
        this.el.dataset.id = r.id;
        this.el.innerHTML = `
      <button class="rem-checkbox" data-id="${r.id}" title="${r.completed ? "Mark incomplete" : "Complete"}">
        ${r.completed
            ? `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.67l7.09-7.09 1.41 1.41L10 16.5z"/></svg>`
            : `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`}
      </button>

      <div class="rem-item-content">
        <div class="rem-item-title-row">
          ${r.priority === "high" ? `<span class="rem-priority rem-priority-high">!!!</span>` : ""}
          ${r.priority === "medium" ? `<span class="rem-priority rem-priority-med">!!</span>` : ""}
          ${r.priority === "low" ? `<span class="rem-priority rem-priority-low">!</span>` : ""}
          <span class="rem-item-title" data-id="${r.id}">${this._esc(r.title) || "<em>New Reminder</em>"}</span>
        </div>
        ${r.notes ? `<div class="rem-item-notes">${this._esc(r.notes)}</div>` : ""}
        ${dueStr ? `<div class="rem-item-due${overdue ? " overdue" : ""}">${dueStr}</div>` : ""}
        ${r.tags?.length ? `<div class="rem-item-tags">${r.tags.map((t) => `<span class="rem-tag">#${t}</span>`).join("")}</div>` : ""}
        ${r.imageUrl ? `<img src="${r.imageUrl}" class="rem-item-img" alt="" />` : ""}
        ${r.subtasks?.length ? this._renderSubtasks(r.subtasks) : ""}
      </div>

      <div class="rem-item-actions">
        <button class="rem-flag-btn${r.flagged ? " active" : ""}" data-id="${r.id}" title="${r.flagged ? "Remove Flag" : "Flag"}">
          <svg viewBox="0 0 24 24" fill="${r.flagged ? "#ff9f0a" : "none"}" stroke="${r.flagged ? "#ff9f0a" : "currentColor"}" stroke-width="1.5" width="13" height="13"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
        </button>
        <button class="rem-info-btn" data-id="${r.id}" title="Details">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </button>
      </div>
    `;
        // ── Events ──
        this.el.querySelector(".rem-checkbox")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this._animateComplete();
            setTimeout(() => this.cbs.onComplete(r.id), 300);
        });
        this.el.querySelector(".rem-flag-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.cbs.onFlag(r.id);
        });
        this.el.querySelector(".rem-info-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.cbs.onEdit(r.id);
        });
        // Inline title edit on double-click
        this.el.querySelector(".rem-item-title")?.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this._startInlineEdit(r);
        });
        // Right-click context
        this.el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this._contextMenu(e, r);
        });
    }
    _renderSubtasks(subtasks) {
        return `<div class="rem-subtasks">${subtasks.map(s => `<div class="rem-subtask${s.completed ? " done" : ""}">
        <span class="rem-subtask-dot"></span>${this._esc(s.title)}
      </div>`).join("")}</div>`;
    }
    _startInlineEdit(r) {
        const titleEl = this.el.querySelector(".rem-item-title");
        if (!titleEl)
            return;
        const input = document.createElement("input");
        input.className = "rem-inline-input";
        input.value = r.title;
        titleEl.replaceWith(input);
        input.focus();
        input.select();
        const commit = () => {
            const newTitle = input.value.trim() || r.title;
            this.cbs.onTitleChange(r.id, newTitle);
        };
        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter")
                commit();
            if (e.key === "Escape") {
                input.value = r.title;
                input.blur();
            }
        });
    }
    _animateComplete() {
        const cb = this.el.querySelector(".rem-checkbox");
        if (cb) {
            cb.style.transform = "scale(1.3)";
            setTimeout(() => { cb.style.transform = ""; }, 200);
        }
        this.el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        this.el.style.opacity = "0.4";
        this.el.style.transform = "translateX(6px)";
    }
    _contextMenu(e, r) {
        document.getElementById("rem-ctx")?.remove();
        const menu = document.createElement("div");
        menu.id = "rem-ctx";
        menu.className = "rem-context-menu";
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:99999`;
        menu.innerHTML = `
      <button class="rem-ctx-item" id="rciComplete">${r.completed ? "Mark Incomplete" : "Mark Complete"}</button>
      <button class="rem-ctx-item" id="rciFlag">${r.flagged ? "Remove Flag" : "Flag"}</button>
      <button class="rem-ctx-item" id="rciEdit">Get Info</button>
      <div class="rem-ctx-sep"></div>
      <button class="rem-ctx-item rem-ctx-danger" id="rciDelete">Delete</button>
    `;
        document.body.appendChild(menu);
        menu.querySelector("#rciComplete")?.addEventListener("click", () => { menu.remove(); this.cbs.onComplete(r.id); });
        menu.querySelector("#rciFlag")?.addEventListener("click", () => { menu.remove(); this.cbs.onFlag(r.id); });
        menu.querySelector("#rciEdit")?.addEventListener("click", () => { menu.remove(); this.cbs.onEdit(r.id); });
        menu.querySelector("#rciDelete")?.addEventListener("click", () => { menu.remove(); this.cbs.onDelete(r.id); });
        const close = (ev) => { if (!menu.contains(ev.target)) {
            menu.remove();
            document.removeEventListener("mousedown", close);
        } };
        setTimeout(() => document.addEventListener("mousedown", close), 50);
    }
    _esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}
window.__RemindersItem = RemindersItem;
 
