"use strict";
// ============================================================
//  Notes App — notes-editor.ts
//  Rich text editor with full toolbar
// ============================================================
class NotesEditor {
    constructor(opts) {
        this.noteId = null;
        this.saveTimer = 0;
        this.opts = opts;
        this.el = document.createElement("div");
        this.el.className = "ne-container";
        this.toolbar = this._buildToolbar();
        this.editor = this._buildEditor();
        const wrap = document.createElement("div");
        wrap.className = "ne-editor-scroll";
        wrap.appendChild(this.editor);
        this.el.append(this.toolbar, wrap);
        this._bindToolbar();
    }
    // ── Load note into editor ──
    loadNote(note) {
        this.noteId = note?.id ?? null;
        if (!note) {
            this.editor.innerHTML = `<div class="ne-empty-state"><div class="ne-empty-icon">📝</div><p>Select a note or create a new one</p></div>`;
            this.editor.contentEditable = "false";
            this._setToolbarEnabled(false);
            return;
        }
        this.editor.contentEditable = "true";
        this.editor.innerHTML = note.body || "<p></p>";
        this._setToolbarEnabled(true);
        // Focus at end
        requestAnimationFrame(() => {
            this.editor.focus();
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this.editor);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        });
    }
    // ── Toolbar DOM ──
    _buildToolbar() {
        const tb = document.createElement("div");
        tb.className = "ne-toolbar";
        const groups = [
            [
                { title: "Format", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"/></svg>`, cmd: "fontSize", val: "" },
            ],
            [
                { title: "Bold", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>`, cmd: "bold" },
                { title: "Italic", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>`, cmd: "italic" },
                { title: "Underline", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>`, cmd: "underline" },
                { title: "Strikethrough", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 .49 3.9 1.28.77.65 1.46 1.73 1.46 3.24h-3.01c0-.31-.05-.59-.15-.85-.29-.86-1.2-1.28-2.25-1.28-1.86 0-2.34.92-2.34 1.67 0 .09.01.18.03.27H6.85v-.25zm5.15 8.92H8.99l-.03-.03H5.5v2.05h2.87l3.28 3.86-.3-5.88zM21 12v-2H3v2h9.62c1.15.45 2.07 1.17 2.07 2.26 0 1.38-1.28 1.88-2.57 1.88-1.14 0-2.08-.32-2.57-1H7.44c.44 2.19 2.31 3.74 5.18 3.74 3.36 0 5.38-1.63 5.38-4.22 0-1.12-.44-2.05-1.15-2.66H21z"/></svg>`, cmd: "strikethrough" },
            ],
            [
                { title: "Checklist", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`, cmd: "insertChecklist" },
                { title: "Bullet List", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>`, cmd: "insertUnorderedList" },
                { title: "Numbered", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>`, cmd: "insertOrderedList" },
                { title: "Table", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h15zm-8 14H5v-3h7v3zm0-5H5v-3h7v3zm8 5h-6v-3h6v3zm0-5h-6v-3h6v3z"/></svg>`, cmd: "insertTable" },
            ],
            [
                { title: "Attach", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>`, cmd: "insertAttachment" },
                { title: "Sketch", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg>`, cmd: "insertSketch" },
            ],
            [
                { title: "Share", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>`, cmd: "share" },
                { title: "More", icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`, cmd: "more" },
            ],
        ];
        groups.forEach((group, gi) => {
            if (gi > 0) {
                const div = document.createElement("div");
                div.className = "ne-tb-divider";
                tb.appendChild(div);
            }
            const grpEl = document.createElement("div");
            grpEl.className = "ne-tb-group";
            group.forEach(item => {
                const btn = document.createElement("button");
                btn.className = "ne-tb-btn";
                btn.title = item.title;
                btn.innerHTML = item.icon;
                btn.dataset.cmd = item.cmd;
                if (item.val !== undefined)
                    btn.dataset.val = item.val;
                grpEl.appendChild(btn);
            });
            tb.appendChild(grpEl);
        });
        // Search box (right side)
        const searchWrap = document.createElement("div");
        searchWrap.className = "ne-search-wrap";
        searchWrap.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="opacity:.4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input type="text" class="ne-search-input" placeholder="Search" id="neSearchInput" />
    `;
        tb.appendChild(searchWrap);
        return tb;
    }
    _buildEditor() {
        const ed = document.createElement("div");
        ed.className = "ne-editor";
        ed.contentEditable = "false";
        ed.spellcheck = true;
        ed.innerHTML = `<div class="ne-empty-state"><div class="ne-empty-icon">📝</div><p>Select a note or create a new one</p></div>`;
        ed.addEventListener("input", () => this._scheduleUpdate());
        ed.addEventListener("keydown", (e) => this._handleKeydown(e));
        ed.addEventListener("paste", (e) => this._handlePaste(e));
        return ed;
    }
    _bindToolbar() {
        this.toolbar.addEventListener("mousedown", (e) => {
            e.preventDefault(); // prevent editor blur
            const btn = e.target.closest(".ne-tb-btn");
            if (!btn)
                return;
            const cmd = btn.dataset.cmd;
            this._execCommand(cmd);
        });
        // Search
        const searchInput = this.toolbar.querySelector("#neSearchInput");
        searchInput?.addEventListener("input", () => {
            const q = searchInput.value.trim();
            this._highlight(q);
        });
    }
    _execCommand(cmd) {
        if (!this.noteId)
            return;
        switch (cmd) {
            case "bold":
                document.execCommand("bold");
                break;
            case "italic":
                document.execCommand("italic");
                break;
            case "underline":
                document.execCommand("underline");
                break;
            case "strikethrough":
                document.execCommand("strikethrough");
                break;
            case "insertUnorderedList":
                document.execCommand("insertUnorderedList");
                break;
            case "insertOrderedList":
                document.execCommand("insertOrderedList");
                break;
            case "insertChecklist":
                this._insertChecklist();
                break;
            case "insertTable":
                this._insertTable();
                break;
            case "insertAttachment":
                this._triggerAttachment();
                break;
            case "share":
                this._shareNote();
                break;
            default: break;
        }
        this._scheduleUpdate();
        this._refreshToolbarState();
    }
    _insertChecklist() {
        const li = document.createElement("div");
        li.className = "ne-checklist-item";
        li.innerHTML = `<input type="checkbox" class="ne-checkbox"><span contenteditable="true">&#8203;</span>`;
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(li);
            // Move cursor inside span
            const span = li.querySelector("span");
            range.setStart(span, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
    _insertTable() {
        const table = document.createElement("table");
        table.className = "ne-table";
        for (let r = 0; r < 3; r++) {
            const row = table.insertRow();
            for (let c = 0; c < 3; c++) {
                const cell = r === 0 ? document.createElement("th") : document.createElement("td");
                cell.contentEditable = "true";
                cell.innerHTML = "&#8203;";
                cell.className = "ne-td";
                row.appendChild(cell);
            }
        }
        document.execCommand("insertHTML", false, table.outerHTML);
        this._scheduleUpdate();
    }
    _triggerAttachment() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,.pdf,.txt,.md";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                if (file.type.startsWith("image/")) {
                    document.execCommand("insertHTML", false, `<img src="${dataUrl}" class="ne-img" alt="${file.name}" />`);
                }
                else {
                    document.execCommand("insertHTML", false, `<div class="ne-file-attach">📎 ${file.name}</div>`);
                }
                this._scheduleUpdate();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    _shareNote() {
        if (!this.noteId)
            return;
        const store = window.__notesStore;
        const note = store.getNote(this.noteId);
        if (!note)
            return;
        if (navigator.share) {
            navigator.share({ title: note.title, text: note.plainText });
        }
        else {
            navigator.clipboard?.writeText(note.plainText);
            // Visual feedback
            const btn = this.toolbar.querySelector('[data-cmd="share"]');
            if (btn) {
                btn.style.color = "#30d158";
                setTimeout(() => btn.style.color = "", 1000);
            }
        }
    }
    _handleKeydown(e) {
        // Enter in checklist item → new checklist item
        if (e.key === "Enter") {
            const sel = window.getSelection();
            if (sel && sel.anchorNode) {
                const item = sel.anchorNode.closest?.(".ne-checklist-item");
                if (item) {
                    e.preventDefault();
                    this._insertChecklist();
                    return;
                }
            }
        }
        // Tab → indent
        if (e.key === "Tab") {
            e.preventDefault();
            document.execCommand("insertText", false, "\t");
        }
    }
    _handlePaste(e) {
        // Strip rich formatting on paste, keep plain text
        const items = e.clipboardData?.items;
        if (!items)
            return;
        for (const item of Array.from(items)) {
            if (item.kind === "file" && item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = () => {
                    document.execCommand("insertHTML", false, `<img src="${reader.result}" class="ne-img" />`);
                    this._scheduleUpdate();
                };
                reader.readAsDataURL(file);
                return;
            }
        }
    }
    _scheduleUpdate() {
        clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => this._flush(), 600);
    }
    _flush() {
        if (!this.noteId)
            return;
        const html = this.editor.innerHTML;
        const plain = this.editor.innerText.trim();
        // Extract title from first line
        const firstLine = this.editor.querySelector("h1,h2,h3,p,div")?.textContent?.trim() ?? "Untitled";
        const title = firstLine.substring(0, 60) || "Untitled";
        this.opts.onUpdate(html, plain);
        const store = window.__notesStore;
        store.updateNote(this.noteId, { body: html, plainText: plain, title });
    }
    _refreshToolbarState() {
        const cmds = ["bold", "italic", "underline", "strikethrough", "insertUnorderedList", "insertOrderedList"];
        cmds.forEach(cmd => {
            const btn = this.toolbar.querySelector(`[data-cmd="${cmd}"]`);
            if (btn)
                btn.classList.toggle("active", document.queryCommandState(cmd));
        });
    }
    _highlight(query) {
        // Remove old highlights
        this.editor.querySelectorAll("mark.ne-highlight").forEach(m => {
            m.replaceWith(document.createTextNode(m.textContent || ""));
        });
        if (!query)
            return;
        // Simple text highlight
        const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while ((node = walker.nextNode()))
            nodes.push(node);
        nodes.forEach(textNode => {
            const idx = textNode.textContent?.toLowerCase().indexOf(query.toLowerCase()) ?? -1;
            if (idx === -1)
                return;
            const mark = document.createElement("mark");
            mark.className = "ne-highlight";
            const range = document.createRange();
            range.setStart(textNode, idx);
            range.setEnd(textNode, idx + query.length);
            range.surroundContents(mark);
        });
    }
    _setToolbarEnabled(on) {
        this.toolbar.querySelectorAll(".ne-tb-btn").forEach(btn => {
            btn.style.opacity = on ? "" : "0.35";
            btn.style.pointerEvents = on ? "" : "none";
        });
    }
}
