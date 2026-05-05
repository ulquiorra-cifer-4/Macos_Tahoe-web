// ============================================================
//  Desktop Manager — desktop-manager.ts
//  • Renders all files from the "desktop" FS folder as icons
//  • Each icon is freely draggable with position persistence
//  • Rubber-band multi-select (click-drag on empty space)
//  • Cmd+C / Cmd+X / Cmd+V copy/cut/paste
//  • Drop from OS → imports file to desktop
//  • Drag icon into Finder window → moves to that folder
//  • Right-click context menu on icons + empty space
// ============================================================

interface DesktopIconPos { x: number; y: number; }

const DESKTOP_POS_KEY = "macos_desktop_positions_v1";
const GRID_SIZE = 16; // snap grid in px

class DesktopManager {
  private fs:        any;
  private container: HTMLElement;
  private iconsEl:   HTMLElement;
  private rubberEl:  HTMLElement;

  // Per-icon state
  private positions: Map<string, DesktopIconPos> = new Map();
  private selected:  Set<string> = new Set();
  private clipboard: { ids: string[]; cut: boolean } = { ids: [], cut: false };

  // Rubber band
  private rb = { active: false, sx: 0, sy: 0 };

  // Drag state
  private drag = {
    active:  false,
    nodeId:  "",
    offX:    0,
    offY:    0,
    startX:  0,
    startY:  0,
    ghost:   null as HTMLElement | null,
  };

  constructor() {
    this.fs = (window as any).__finderFS;
    this.container = document.getElementById("desktop")!;

    // Icons layer
    this.iconsEl = document.createElement("div");
    this.iconsEl.id = "desktopIcons";
    this.iconsEl.className = "dt-icons-layer";

    // Rubber band element
    this.rubberEl = document.createElement("div");
    this.rubberEl.className = "dt-rubber";
    this.rubberEl.style.display = "none";
    this.iconsEl.appendChild(this.rubberEl);

    // Insert before windows-area
    const winArea = document.getElementById("windows-area")!;
    this.container.insertBefore(this.iconsEl, winArea);

    this._loadPositions();
    this._render();
    this._bindDesktopEvents();
    this._bindKeyboard();

    // Subscribe to FS changes
    this.fs.subscribe(() => this._render());
  }

  // ─────────────────────────────────────────────
  //  Render all desktop icons
  // ─────────────────────────────────────────────
  private _render(): void {
    // Remove old icon elements (keep rubber band)
    this.iconsEl.querySelectorAll(".dt-icon").forEach(el => el.remove());

    const nodes = this.fs.getChildren("desktop");
    const dockH  = 90; // approx dock height
    const menuH  = 30;
    const W      = window.innerWidth;
    const H      = window.innerHeight;

    nodes.forEach((node: any, i: number) => {
      // Auto-assign position if none saved
      if (!this.positions.has(node.id)) {
        // Default: right-side column, top to bottom
        const col = Math.floor(i / Math.floor((H - menuH - dockH - 80) / 100));
        const row = i % Math.floor((H - menuH - dockH - 80) / 100);
        this.positions.set(node.id, {
          x: W - 100 - col * 110,
          y: menuH + 20 + row * 100,
        });
      }

      const pos  = this.positions.get(node.id)!;
      const icon = this._makeIcon(node, pos);
      this.iconsEl.appendChild(icon);
    });
  }

  // ─────────────────────────────────────────────
  //  Build one icon element
  // ─────────────────────────────────────────────
  private _makeIcon(node: any, pos: DesktopIconPos): HTMLElement {
    const el = document.createElement("div");
    el.className = "dt-icon" + (this.selected.has(node.id) ? " selected" : "");
    el.dataset.nodeId = node.id;
    el.style.cssText = `left:${pos.x}px;top:${pos.y}px;`;

    el.innerHTML = `
      <div class="dt-icon-img">${this._iconSvg(node)}</div>
      <div class="dt-icon-label">${this._esc(node.name)}</div>
    `;

    // ── Single click = select ──
    el.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      if (!e.metaKey && !e.shiftKey && !this.selected.has(node.id)) {
        this.selected.clear();
      }
      this.selected.add(node.id);
      this._updateSelectionVisual();

      this._startIconDrag(e, node.id, el);
    });

    // ── Double-click = open ──
    el.addEventListener("dblclick", (e: MouseEvent) => {
      e.stopPropagation();
      this._openNode(node);
    });

    // ── Right-click = context menu ──
    el.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.selected.has(node.id)) {
        this.selected.clear();
        this.selected.add(node.id);
        this._updateSelectionVisual();
      }
      this._showIconContextMenu(e, node);
    });

    return el;
  }

  // ─────────────────────────────────────────────
  //  Icon dragging with ghost + spring snap
  // ─────────────────────────────────────────────
  private _startIconDrag(e: MouseEvent, nodeId: string, el: HTMLElement): void {
    const pos = this.positions.get(nodeId)!;
    this.drag = {
      active:  true,
      nodeId,
      offX:    e.clientX - pos.x,
      offY:    e.clientY - pos.y,
      startX:  e.clientX,
      startY:  e.clientY,
      ghost:   null,
    };

    const onMove = (e: MouseEvent) => {
      if (!this.drag.active) return;

      const dx = Math.abs(e.clientX - this.drag.startX);
      const dy = Math.abs(e.clientY - this.drag.startY);

      // Create ghost after 4px threshold
      if (!this.drag.ghost && (dx > 4 || dy > 4)) {
        this.drag.ghost = this._makeGhost(this.selected.size);
        this.iconsEl.appendChild(this.drag.ghost);
      }

      if (this.drag.ghost) {
        const nx = e.clientX - this.drag.offX;
        const ny = e.clientY - this.drag.offY;
        this.drag.ghost.style.left = nx + "px";
        this.drag.ghost.style.top  = ny + "px";
      }

      // Move all selected icons together
      const ddx = e.clientX - this.drag.startX;
      const ddy = e.clientY - this.drag.startY;

      this.selected.forEach(id => {
        const iconEl = this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
        if (!iconEl) return;
        const base = this.positions.get(id)!;
        iconEl.style.left = (base.x + ddx) + "px";
        iconEl.style.top  = (base.y + ddy) + "px";
        iconEl.classList.add("dragging");
      });

      // Highlight drop targets (Finder windows)
      this._highlightDropTargets(e.clientX, e.clientY);
    };

    const onUp = (e: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);

      this.drag.ghost?.remove();
      this.drag.ghost = null;

      const ddx = e.clientX - this.drag.startX;
      const ddy = e.clientY - this.drag.startY;
      const moved = Math.abs(ddx) > 4 || Math.abs(ddy) > 4;

      this._clearDropHighlights();

      if (moved) {
        // Check if dropped onto a Finder window open folder
        const dropTarget = this._getDropTarget(e.clientX, e.clientY);

        if (dropTarget) {
          // Move files into the target folder
          this.selected.forEach(id => {
            this.fs.move(id, dropTarget);
            this.positions.delete(id);
          });
          this.selected.clear();
          this._savePositions();
          this._render();
        } else {
          // Spring-snap to grid on desktop
          this.selected.forEach(id => {
            const base = this.positions.get(id)!;
            const nx   = Math.round((base.x + ddx) / GRID_SIZE) * GRID_SIZE;
            const ny   = Math.round((base.y + ddy) / GRID_SIZE) * GRID_SIZE;
            // Clamp inside desktop
            const clamped = this._clamp(nx, ny);
            this.positions.set(id, clamped);

            // Animate spring to snapped pos
            const iconEl = this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
            if (iconEl) {
              iconEl.classList.remove("dragging");
              iconEl.style.transition = "left 0.18s cubic-bezier(0.34,1.56,0.64,1), top 0.18s cubic-bezier(0.34,1.56,0.64,1)";
              iconEl.style.left = clamped.x + "px";
              iconEl.style.top  = clamped.y + "px";
              setTimeout(() => { iconEl.style.transition = ""; }, 200);
            }
          });
          this._savePositions();
        }
      } else {
        // Just a click — restore icon positions
        this.selected.forEach(id => {
          const iconEl = this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
          const pos    = this.positions.get(id)!;
          if (iconEl) { iconEl.style.left = pos.x + "px"; iconEl.style.top = pos.y + "px"; }
          iconEl?.classList.remove("dragging");
        });
      }

      this.drag.active = false;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }

  private _makeGhost(count: number): HTMLElement {
    const ghost = document.createElement("div");
    ghost.className = "dt-drag-ghost";
    ghost.innerHTML = count > 1
      ? `<div class="dt-ghost-badge">${count}</div>📂`
      : "📄";
    ghost.style.pointerEvents = "none";
    return ghost;
  }

  private _clamp(x: number, y: number): DesktopIconPos {
    const menuH = 28;
    const dockH = 100;
    const padW  = 10;
    return {
      x: Math.max(padW, Math.min(x, window.innerWidth  - 90 - padW)),
      y: Math.max(menuH + 8, Math.min(y, window.innerHeight - dockH - 90)),
    };
  }

  // ─────────────────────────────────────────────
  //  Rubber-band selection
  // ─────────────────────────────────────────────
  private _bindDesktopEvents(): void {
    this.iconsEl.addEventListener("mousedown", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only rubber-band on empty space clicks
      if (target.closest(".dt-icon") || target.closest(".app-window")) return;
      if (e.button !== 0) return;

      // Clear selection unless meta held
      if (!e.metaKey) {
        this.selected.clear();
        this._updateSelectionVisual();
      }

      this.rb = { active: true, sx: e.clientX, sy: e.clientY };
      this.rubberEl.style.cssText = `display:block;left:${e.clientX}px;top:${e.clientY}px;width:0;height:0`;

      const onMove = (e: MouseEvent) => {
        if (!this.rb.active) return;
        const x  = Math.min(e.clientX, this.rb.sx);
        const y  = Math.min(e.clientY, this.rb.sy);
        const w  = Math.abs(e.clientX - this.rb.sx);
        const h  = Math.abs(e.clientY - this.rb.sy);
        // Rubber-band visual
        this.rubberEl.style.left   = x + "px";
        this.rubberEl.style.top    = y + "px";
        this.rubberEl.style.width  = w + "px";
        this.rubberEl.style.height = h + "px";

        // Hit test all icons
        const rbRect = { x, y, w, h };
        this.iconsEl.querySelectorAll<HTMLElement>(".dt-icon").forEach(el => {
          const r   = el.getBoundingClientRect();
          const hit = r.left < rbRect.x + rbRect.w && r.right  > rbRect.x &&
                      r.top  < rbRect.y + rbRect.h && r.bottom > rbRect.y;
          const id  = el.dataset.nodeId!;
          if (hit) this.selected.add(id); else if (!e.metaKey) this.selected.delete(id);
        });
        this._updateSelectionVisual();
      };

      const onUp = () => {
        this.rb.active = false;
        this.rubberEl.style.display = "none";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });

    // Right-click on empty desktop
    this.iconsEl.addEventListener("contextmenu", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dt-icon")) return;
      e.preventDefault();
      this._showDesktopContextMenu(e);
    });

    // Click to deselect
    this.iconsEl.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dt-icon") && !target.closest(".app-window")) {
        this.selected.clear();
        this._updateSelectionVisual();
      }
    });

    // OS file drop onto desktop
    this.iconsEl.addEventListener("dragover", (e: DragEvent) => {
      e.preventDefault();
      this.iconsEl.classList.add("dt-drop-active");
    });
    this.iconsEl.addEventListener("dragleave", () => this.iconsEl.classList.remove("dt-drop-active"));
    this.iconsEl.addEventListener("drop",      (e: DragEvent) => {
      e.preventDefault();
      this.iconsEl.classList.remove("dt-drop-active");
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      const dropX = e.clientX - 40;
      const dropY = e.clientY - 40;
      Array.from(files).forEach((file, i) => {
        this._importFile(file, dropX + i * 110, dropY);
      });
    });
  }

  // ─────────────────────────────────────────────
  //  Keyboard: Cmd+C/X/V, Delete, Cmd+A
  // ─────────────────────────────────────────────
  private _bindKeyboard(): void {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      // Only handle when no input is focused
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "a") {
        e.preventDefault();
        this.fs.getChildren("desktop").forEach((n: any) => this.selected.add(n.id));
        this._updateSelectionVisual();
      }

      if (meta && e.key === "c") {
        e.preventDefault();
        this.clipboard = { ids: [...this.selected], cut: false };
        this._showClipboardFeedback("Copied");
      }

      if (meta && e.key === "x") {
        e.preventDefault();
        this.clipboard = { ids: [...this.selected], cut: true };
        // Dim cut icons
        this.selected.forEach(id => {
          this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.classList.add("dt-cut");
        });
        this._showClipboardFeedback("Cut");
      }

      if (meta && e.key === "v") {
        e.preventDefault();
        this._paste();
      }

      if (meta && e.key === "d") {
        e.preventDefault();
        this.selected.forEach(id => {
          this.fs.duplicate(id);
        });
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (this.selected.size > 0) {
          e.preventDefault();
          this._deleteSelected();
        }
      }

      // Escape = deselect
      if (e.key === "Escape") {
        this.selected.clear();
        this._updateSelectionVisual();
      }
    });
  }

  private _paste(): void {
    if (!this.clipboard.ids.length) return;

    this.clipboard.ids.forEach((id, i) => {
      const node = this.fs.getNode(id);
      if (!node) return;

      if (this.clipboard.cut) {
        // Move to desktop
        this.fs.move(id, "desktop");
        // Give it a new position near center
        const cx = window.innerWidth  / 2 - 40 + i * 110;
        const cy = window.innerHeight / 2 - 40;
        this.positions.set(id, this._clamp(cx, cy));
        this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.classList.remove("dt-cut");
      } else {
        // Duplicate
        const dup = this.fs.duplicate(id);
        if (dup) {
          const cx = window.innerWidth  / 2 - 40 + i * 110;
          const cy = window.innerHeight / 2 - 40;
          this.positions.set(dup.id, this._clamp(cx, cy));
        }
      }
    });

    if (this.clipboard.cut) this.clipboard = { ids: [], cut: false };
    this._savePositions();
    this._render();
  }

  private _deleteSelected(): void {
    if (!this.selected.size) return;
    this.selected.forEach(id => {
      this.positions.delete(id);
      this.fs.delete(id);
    });
    this.selected.clear();
    this._savePositions();
  }

  // ─────────────────────────────────────────────
  //  Context menus
  // ─────────────────────────────────────────────
  private _showIconContextMenu(e: MouseEvent, node: any): void {
    document.getElementById("dt-ctx")?.remove();
    const menu = document.createElement("div");
    menu.id = "dt-ctx";
    menu.className = "dt-context-menu";
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;`;
    menu.innerHTML = `
      <button class="dt-ctx-item" id="dtcOpen">Open</button>
      <button class="dt-ctx-item" id="dtcInfo">Get Info</button>
      <div class="dt-ctx-sep"></div>
      <button class="dt-ctx-item" id="dtcCopy">Copy <span class="dt-ctx-kbd">⌘C</span></button>
      <button class="dt-ctx-item" id="dtcCut">Cut <span class="dt-ctx-kbd">⌘X</span></button>
      <button class="dt-ctx-item" id="dtcDup">Duplicate <span class="dt-ctx-kbd">⌘D</span></button>
      <button class="dt-ctx-item" id="dtcRename">Rename</button>
      <div class="dt-ctx-sep"></div>
      <button class="dt-ctx-item dt-ctx-danger" id="dtcDelete">Move to Trash</button>
    `;
    document.body.appendChild(menu);

    menu.querySelector("#dtcOpen")  ?.addEventListener("click", () => { menu.remove(); this._openNode(node); });
    menu.querySelector("#dtcInfo")  ?.addEventListener("click", () => { menu.remove(); this._showInfo(node); });
    menu.querySelector("#dtcCopy")  ?.addEventListener("click", () => { menu.remove(); this.clipboard = { ids:[...this.selected], cut:false }; this._showClipboardFeedback("Copied"); });
    menu.querySelector("#dtcCut")   ?.addEventListener("click", () => { menu.remove(); this.clipboard = { ids:[...this.selected], cut:true };  this._showClipboardFeedback("Cut"); });
    menu.querySelector("#dtcDup")   ?.addEventListener("click", () => { menu.remove(); this.fs.duplicate(node.id); });
    menu.querySelector("#dtcRename")?.addEventListener("click", () => { menu.remove(); this._startRename(node.id); });
    menu.querySelector("#dtcDelete")?.addEventListener("click", () => { menu.remove(); this._deleteSelected(); });

    this._autoCloseMenu("dt-ctx");
  }

  private _showDesktopContextMenu(e: MouseEvent): void {
    document.getElementById("dt-ctx")?.remove();
    const menu = document.createElement("div");
    menu.id = "dt-ctx";
    menu.className = "dt-context-menu";
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;`;
    menu.innerHTML = `
      <button class="dt-ctx-item" id="dtcNewFolder">New Folder</button>
      <button class="dt-ctx-item" id="dtcNewFile">New Text File</button>
      <button class="dt-ctx-item" id="dtcImport">Import File…</button>
      <div class="dt-ctx-sep"></div>
      <button class="dt-ctx-item" id="dtcPaste" ${this.clipboard.ids.length ? "" : "disabled"}>
        Paste <span class="dt-ctx-kbd">⌘V</span>
      </button>
      <button class="dt-ctx-item" id="dtcSelAll">Select All <span class="dt-ctx-kbd">⌘A</span></button>
      <div class="dt-ctx-sep"></div>
      <button class="dt-ctx-item" id="dtcSortName">Sort by Name</button>
      <button class="dt-ctx-item" id="dtcSortDate">Sort by Date</button>
      <button class="dt-ctx-item" id="dtcCleanUp">Clean Up</button>
      <div class="dt-ctx-sep"></div>
      <button class="dt-ctx-item" id="dtcChangeBg">Change Wallpaper…</button>
    `;
    document.body.appendChild(menu);

    menu.querySelector("#dtcNewFolder")?.addEventListener("click", () => { menu.remove(); this._newFolder(e.clientX - 40, e.clientY - 40); });
    menu.querySelector("#dtcNewFile")  ?.addEventListener("click", () => { menu.remove(); this._newFile(e.clientX - 40, e.clientY - 40); });
    menu.querySelector("#dtcImport")   ?.addEventListener("click", () => { menu.remove(); this._triggerImport(e.clientX, e.clientY); });
    menu.querySelector("#dtcPaste")    ?.addEventListener("click", () => { menu.remove(); this._paste(); });
    menu.querySelector("#dtcSelAll")   ?.addEventListener("click", () => { menu.remove(); this.fs.getChildren("desktop").forEach((n: any) => this.selected.add(n.id)); this._updateSelectionVisual(); });
    menu.querySelector("#dtcSortName") ?.addEventListener("click", () => { menu.remove(); this._sortAndLayout("name"); });
    menu.querySelector("#dtcSortDate") ?.addEventListener("click", () => { menu.remove(); this._sortAndLayout("date"); });
    menu.querySelector("#dtcCleanUp")  ?.addEventListener("click", () => { menu.remove(); this._cleanUp(); });
    menu.querySelector("#dtcChangeBg") ?.addEventListener("click", () => { menu.remove(); this._changeBg(); });

    this._autoCloseMenu("dt-ctx");
  }

  private _autoCloseMenu(id: string): void {
    const close = (e: MouseEvent) => {
      const m = document.getElementById(id);
      if (m && !m.contains(e.target as Node)) { m.remove(); document.removeEventListener("mousedown", close); }
    };
    setTimeout(() => document.addEventListener("mousedown", close), 50);
  }

  // ─────────────────────────────────────────────
  //  File operations
  // ─────────────────────────────────────────────
  private _newFolder(x: number, y: number): void {
    const node = this.fs.createFolder("desktop", "Untitled Folder");
    this.positions.set(node.id, this._clamp(x, y));
    this._savePositions();
    this._render();
    requestAnimationFrame(() => this._startRename(node.id));
  }

  private _newFile(x: number, y: number): void {
    const node = this.fs.createTextFile("desktop", "Untitled");
    this.positions.set(node.id, this._clamp(x, y));
    this._savePositions();
    this._render();
    requestAnimationFrame(() => this._startRename(node.id));
  }

  private _triggerImport(dropX: number, dropY: number): void {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.txt,.md,.pdf,.js,.ts,.html,.css,.json";
    input.onchange = () => {
      Array.from(input.files ?? []).forEach((file, i) => {
        this._importFile(file, dropX + i * 110, dropY);
      });
    };
    input.click();
  }

  private _importFile(file: File, x: number, y: number): void {
    const pos = this._clamp(x, y);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const node = this.fs.createImageFile("desktop", file.name, reader.result as string, file.size);
        this.positions.set(node.id, pos);
        this._savePositions();
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const node = this.fs.createTextFile("desktop", file.name, reader.result as string);
        this.positions.set(node.id, pos);
        this._savePositions();
      };
      reader.readAsText(file);
    }
  }

  private _openNode(node: any): void {
    if (node.type === "folder") {
      // Open in Finder at that folder
      if (typeof (window as any).openFinderWindow === "function") {
        (window as any).__finderNavigateTo = node.id;
        (window as any).openFinderWindow();
      }
    } else if (node.type === "text") {
      if (typeof (window as any).openNotesWindow === "function") {
        const store = (window as any).__notesStore;
        let existing = store?.getNotes().find((n: any) => n.title === node.name);
        if (!existing && store) {
          existing = store.createNote("notes");
          store.updateNote(existing.id, {
            title: node.name,
            body: `<pre>${(node.content ?? "").replace(/</g,"&lt;")}</pre>`,
            plainText: node.content ?? "",
          });
        }
        (window as any).openNotesWindow();
      }
    } else if (node.type === "image" && node.dataUrl) {
      this._lightbox(node);
    }
  }

  private _lightbox(node: any): void {
    document.getElementById("dt-lightbox")?.remove();
    const lb = document.createElement("div");
    lb.id = "dt-lightbox";
    lb.className = "dt-lightbox";
    lb.innerHTML = `
      <div class="dt-lb-backdrop"></div>
      <div class="dt-lb-content">
        <button class="dt-lb-close">✕</button>
        <img src="${node.dataUrl}" class="dt-lb-img" />
        <div class="dt-lb-name">${node.name}</div>
      </div>
    `;
    document.getElementById("desktop")?.appendChild(lb);
    lb.querySelector(".dt-lb-backdrop")?.addEventListener("click", () => lb.remove());
    lb.querySelector(".dt-lb-close")   ?.addEventListener("click", () => lb.remove());
  }

  private _startRename(nodeId: string): void {
    const iconEl   = this.iconsEl.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`);
    const labelEl  = iconEl?.querySelector<HTMLElement>(".dt-icon-label");
    if (!labelEl || !iconEl) return;

    const original = labelEl.textContent ?? "";
    const input    = document.createElement("input");
    input.className = "dt-rename-input";
    input.value     = original;
    labelEl.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const newName = input.value.trim() || original;
      this.fs.rename(nodeId, newName);
    };
    input.addEventListener("blur",    commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")  commit();
      if (e.key === "Escape") { input.value = original; input.blur(); }
    });
  }

  private _showInfo(node: any): void {
    const d = new Date(node.modifiedAt);
    alert(`${node.name}\nType: ${node.type}\nSize: ${this.fs.formatSize(node.size)}\nModified: ${d.toLocaleString()}`);
  }

  private _sortAndLayout(by: "name" | "date"): void {
    const nodes = this.fs.getChildren("desktop");
    nodes.sort((a: any, b: any) => by === "name"
      ? a.name.localeCompare(b.name)
      : b.modifiedAt - a.modifiedAt
    );
    this._autoLayout(nodes);
  }

  private _cleanUp(): void {
    const nodes = this.fs.getChildren("desktop");
    this._autoLayout(nodes);
  }

  private _autoLayout(nodes: any[]): void {
    const menuH = 28, dockH = 100, pad = 20, iconH = 100, iconW = 100;
    const cols  = Math.floor((window.innerHeight - menuH - dockH - pad) / iconH);
    nodes.forEach((node: any, i: number) => {
      const col = Math.floor(i / cols);
      const row = i % cols;
      this.positions.set(node.id, {
        x: window.innerWidth - iconW - pad - col * (iconW + 10),
        y: menuH + pad + row * iconH,
      });
    });
    this._savePositions();
    this._render();
  }

  private _changeBg(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const wl  = document.getElementById("wallpaperLayer");
      if (wl) { wl.style.backgroundImage = `url(${url})`; wl.style.background = ""; }
    };
    input.click();
  }

  // ─────────────────────────────────────────────
  //  Drop target detection (Finder windows)
  // ─────────────────────────────────────────────
  private _getDropTarget(cx: number, cy: number): string | null {
    const wins = document.querySelectorAll<HTMLElement>(".app-window[data-app-id='finder']");
    for (const win of Array.from(wins)) {
      const r = win.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        return (window as any).__finderCurrentFolder ?? null;
      }
    }
    return null;
  }

  private _highlightDropTargets(cx: number, cy: number): void {
    document.querySelectorAll<HTMLElement>(".app-window[data-app-id='finder']").forEach(win => {
      const r    = win.getBoundingClientRect();
      const over = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      win.classList.toggle("dt-drop-target", over);
    });
  }

  private _clearDropHighlights(): void {
    document.querySelectorAll(".dt-drop-target").forEach(el => el.classList.remove("dt-drop-target"));
  }

  // ─────────────────────────────────────────────
  //  Clipboard feedback toast
  // ─────────────────────────────────────────────
  private _showClipboardFeedback(msg: string): void {
    document.getElementById("dt-toast")?.remove();
    const toast = document.createElement("div");
    toast.id = "dt-toast";
    toast.className = "dt-toast";
    toast.textContent = msg;
    document.getElementById("desktop")?.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 300); }, 1500);
  }

  // ─────────────────────────────────────────────
  //  Icon SVG renderer
  // ─────────────────────────────────────────────
  private _iconSvg(node: any): string {
    if (node.type === "folder") {
      return `<svg viewBox="0 0 56 44" width="56" height="44">
        <path d="M4 8C4 5.8 5.8 4 8 4L22 4L26 9L50 9C52.2 9 54 10.8 54 13L54 38C54 40.2 52.2 42 50 42L8 42C5.8 42 4 40.2 4 38Z" fill="${node.color || "#4CAAEE"}"/>
        <path d="M4 14L54 14L54 38C54 40.2 52.2 42 50 42L8 42C5.8 42 4 40.2 4 38Z" fill="${node.color ? node.color + "dd" : "#5BB8F5"}"/>
      </svg>`;
    }
    if (node.type === "image" && node.dataUrl) {
      return `<img src="${node.dataUrl}" style="width:56px;height:52px;object-fit:cover;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.35)" />`;
    }
    const ext = node.name.split(".").pop()?.toLowerCase() ?? "";
    const colorMap: Record<string, string> = {
      txt:"#fff", md:"#fff", js:"#f7df1e", ts:"#007acc",
      html:"#e34c26", css:"#264de4", json:"#5BA4CF",
      pdf:"#ff3b30", zip:"#8e8e93", dmg:"#8e8e93",
    };
    const bg = colorMap[ext] ?? "#e5e5ea";
    return `<svg viewBox="0 0 44 56" width="44" height="56">
      <path d="M6 0L30 0L44 14L44 52C44 54.2 42.2 56 40 56L6 56C3.8 56 2 54.2 2 52L2 4C2 1.8 3.8 0 6 0Z" fill="${bg}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>
      <path d="M30 0L30 14L44 14Z" fill="rgba(0,0,0,0.12)"/>
      <text x="22" y="36" text-anchor="middle" fill="${bg === "#fff" || bg === "#f7df1e" ? "#555" : "#fff"}" font-size="9" font-weight="600" font-family="system-ui">${ext.toUpperCase().slice(0,4)}</text>
    </svg>`;
  }

  private _esc(s: string): string {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // ─────────────────────────────────────────────
  //  Selection visual update
  // ─────────────────────────────────────────────
  private _updateSelectionVisual(): void {
    this.iconsEl.querySelectorAll<HTMLElement>(".dt-icon").forEach(el => {
      el.classList.toggle("selected", this.selected.has(el.dataset.nodeId!));
    });
  }

  // ─────────────────────────────────────────────
  //  Position persistence
  // ─────────────────────────────────────────────
  private _loadPositions(): void {
    try {
      const raw = localStorage.getItem(DESKTOP_POS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        Object.entries(obj).forEach(([id, pos]) => this.positions.set(id, pos as DesktopIconPos));
      }
    } catch {}
  }

  private _savePositions(): void {
    try {
      const obj: Record<string, DesktopIconPos> = {};
      this.positions.forEach((pos, id) => { obj[id] = pos; });
      localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(obj));
    } catch {}
  }
}

// Init desktop manager once DOM + FS is ready
(window as any).__initDesktopManager = function() {
  new DesktopManager();
};
