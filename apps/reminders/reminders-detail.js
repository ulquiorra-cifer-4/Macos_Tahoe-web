"use strict";
// ============================================================
//  Reminders — reminders-detail.ts
//  Right panel: full task editor (date, time, repeat, priority, notes, subtasks)
// ============================================================
class RemindersDetail {
    constructor() {
        this.currentId = null;
        this.store = window.__remindersStore;
        this.el = document.createElement("div");
        this.el.className = "rem-detail";
        this._showEmpty();
    }
    show(id) {
        this.currentId = id;
        this._render(id);
    }
    hide() {
        this.currentId = null;
        this._showEmpty();
    }
    _showEmpty() {
        this.el.innerHTML = `<div class="rem-detail-empty">
      <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style="opacity:.2"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
      <p>Select a reminder to see details</p>
    </div>`;
    }
    _render(id) {
        const r = this.store.getReminder(id);
        if (!r) {
            this._showEmpty();
            return;
        }
        this.el.innerHTML = `
      <div class="rem-detail-inner">
        <div class="rem-detail-header">
          <button class="rem-detail-close" id="rdClose">✕</button>
        </div>

        <!-- Title -->
        <div class="rem-detail-row">
          <input class="rem-detail-title" id="rdTitle" value="${this._esc(r.title)}" placeholder="Title" />
        </div>

        <!-- Notes -->
        <div class="rem-detail-row">
          <textarea class="rem-detail-notes" id="rdNotes" placeholder="Add Note…">${this._esc(r.notes)}</textarea>
        </div>

        <!-- Detail fields -->
        <div class="rem-detail-fields">

          <!-- Due Date -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
              Date
            </div>
            <div class="rem-df-value">
              <input type="date" id="rdDate" value="${r.dueDate ?? ""}" class="rem-df-input" />
            </div>
          </div>

          <!-- Due Time -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
              Time
            </div>
            <div class="rem-df-value">
              <input type="time" id="rdTime" value="${r.dueTime ?? ""}" class="rem-df-input" />
            </div>
          </div>

          <!-- Repeat -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 016 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
              Repeat
            </div>
            <div class="rem-df-value">
              <select id="rdRepeat" class="rem-df-select">
                <option value="never"   ${r.repeat === "never" ? "selected" : ""}>Never</option>
                <option value="daily"   ${r.repeat === "daily" ? "selected" : ""}>Daily</option>
                <option value="weekly"  ${r.repeat === "weekly" ? "selected" : ""}>Weekly</option>
                <option value="monthly" ${r.repeat === "monthly" ? "selected" : ""}>Monthly</option>
                <option value="yearly"  ${r.repeat === "yearly" ? "selected" : ""}>Yearly</option>
              </select>
            </div>
          </div>

          <!-- Priority -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
              Priority
            </div>
            <div class="rem-df-value">
              <select id="rdPriority" class="rem-df-select">
                <option value="none"   ${r.priority === "none" ? "selected" : ""}>None</option>
                <option value="low"    ${r.priority === "low" ? "selected" : ""}>Low</option>
                <option value="medium" ${r.priority === "medium" ? "selected" : ""}>Medium</option>
                <option value="high"   ${r.priority === "high" ? "selected" : ""}>High</option>
              </select>
            </div>
          </div>

          <!-- Flag -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="${r.flagged ? "#ff9f0a" : "currentColor"}" width="14" height="14"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
              Flag
            </div>
            <div class="rem-df-value">
              <label class="rem-toggle">
                <input type="checkbox" id="rdFlag" ${r.flagged ? "checked" : ""} />
                <span class="rem-toggle-track"></span>
              </label>
            </div>
          </div>

          <!-- Assignee -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Assignee
            </div>
            <div class="rem-df-value">
              <input type="text" id="rdAssignee" value="${this._esc(r.assignee ?? "")}" placeholder="Name…" class="rem-df-input" />
            </div>
          </div>

          <!-- Tags -->
          <div class="rem-detail-field">
            <div class="rem-df-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/></svg>
              Tags
            </div>
            <div class="rem-df-value">
              <input type="text" id="rdTags" value="${r.tags?.join(", ") ?? ""}" placeholder="tag1, tag2…" class="rem-df-input" />
            </div>
          </div>

        </div>

        <!-- Subtasks -->
        <div class="rem-detail-subtasks-section">
          <div class="rem-detail-sub-header">
            <span>Subtasks</span>
            <button class="rem-detail-add-sub" id="rdAddSub">+ Add</button>
          </div>
          <div id="rdSubtasks" class="rem-detail-subtasks-list">
            ${(r.subtasks ?? []).map((s) => `
              <div class="rem-detail-subtask" data-subid="${s.id}">
                <input type="checkbox" class="rem-sub-check" ${s.completed ? "checked" : ""} data-subid="${s.id}" />
                <input type="text" class="rem-sub-title" value="${this._esc(s.title)}" data-subid="${s.id}" />
                <button class="rem-sub-del" data-subid="${s.id}">✕</button>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Delete button -->
        <button class="rem-detail-delete" id="rdDelete">Delete Reminder</button>
      </div>
    `;
        this._bindDetailEvents(r);
    }
    _bindDetailEvents(r) {
        const save = () => {
            this.store.update(r.id, {
                title: (this.el.querySelector("#rdTitle")?.value ?? r.title).trim() || r.title,
                notes: this.el.querySelector("#rdNotes")?.value ?? r.notes,
                dueDate: this.el.querySelector("#rdDate")?.value || null,
                dueTime: this.el.querySelector("#rdTime")?.value || null,
                repeat: this.el.querySelector("#rdRepeat")?.value ?? r.repeat,
                priority: this.el.querySelector("#rdPriority")?.value ?? r.priority,
                flagged: (this.el.querySelector("#rdFlag")?.checked) ?? r.flagged,
                assignee: (this.el.querySelector("#rdAssignee")?.value ?? "").trim() || undefined,
                tags: (this.el.querySelector("#rdTags")?.value ?? "").split(",").map((t) => t.trim()).filter(Boolean),
            });
        };
        // Auto-save on any input change
        ["#rdTitle", "#rdNotes", "#rdDate", "#rdTime", "#rdRepeat", "#rdPriority", "#rdFlag", "#rdAssignee", "#rdTags"]
            .forEach(sel => {
            const el = this.el.querySelector(sel);
            el?.addEventListener("change", save);
            el?.addEventListener("blur", save);
        });
        // Close
        this.el.querySelector("#rdClose")?.addEventListener("click", () => { save(); this.hide(); });
        // Delete
        this.el.querySelector("#rdDelete")?.addEventListener("click", () => {
            if (confirm("Delete this reminder?")) {
                this.store.delete(r.id);
                this.hide();
            }
        });
        // Subtask: add
        this.el.querySelector("#rdAddSub")?.addEventListener("click", () => {
            const sub = { id: "sub_" + Date.now(), title: "", completed: false };
            const subs = [...(r.subtasks ?? []), sub];
            this.store.update(r.id, { subtasks: subs });
            this.show(r.id);
        });
        // Subtask: checkbox toggle
        this.el.querySelectorAll(".rem-sub-check").forEach(cb => {
            cb.addEventListener("change", () => {
                const subId = cb.dataset.subid;
                const subs = (r.subtasks ?? []).map((s) => s.id === subId ? { ...s, completed: cb.checked } : s);
                this.store.update(r.id, { subtasks: subs });
            });
        });
        // Subtask: title change
        this.el.querySelectorAll(".rem-sub-title").forEach(inp => {
            inp.addEventListener("blur", () => {
                const subId = inp.dataset.subid;
                const subs = (r.subtasks ?? []).map((s) => s.id === subId ? { ...s, title: inp.value } : s);
                this.store.update(r.id, { subtasks: subs });
            });
        });
        // Subtask: delete
        this.el.querySelectorAll(".rem-sub-del").forEach(btn => {
            btn.addEventListener("click", () => {
                const subId = btn.dataset.subid;
                const subs = (r.subtasks ?? []).filter((s) => s.id !== subId);
                this.store.update(r.id, { subtasks: subs });
                this.show(r.id);
            });
        });
    }
    _esc(s) {
        return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
}
window.__RemindersDetail = RemindersDetail;
 
