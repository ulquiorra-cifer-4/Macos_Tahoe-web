# macOS Tahoe — Web Emulator

A pixel-perfect, fully interactive recreation of macOS Tahoe built with **TypeScript**, **HTML**, and **CSS** — no frameworks, no dependencies at runtime. Every component is hand-crafted from scratch.

---

## 📸 Preview

> A complete macOS desktop experience running entirely in the browser — dock with spring physics magnification, draggable windows with traffic lights, a working Notes app, Finder with a virtual filesystem, Photos app with a full library, and a fully interactive desktop.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (only needed for TypeScript compilation)
- A local HTTP server (required — `file://` won't work due to `fetch()` calls)

### Install & Run

```bash
# Install TypeScript (one-time)
npm install

# Serve the project
npx serve .
# or
python3 -m http.server 8080
# or use VS Code Live Server
```

Then open **`http://localhost:3000`** (or whatever port your server uses).

### Recompile TypeScript (after editing `.ts` files)

```bash
npx tsc
# Watch mode
npx tsc --watch
```

---

## 📁 Project Structure

```
macos-web/
│
├── index.html                  # Entry point — loads all scripts & styles
├── styles.css                  # Global styles: menu bar, action center, dock
├── desktop.css                 # Desktop icon layer, rubber-band, drag ghost
├── tsconfig.json               # TypeScript compiler config
│
├── wallpaper.jpg               # Default wallpaper (replace with your own)
│
├── icons/                      # Dock app icons (PNG format)
│   ├── finder.png
│   ├── safari.png
│   ├── messages.png
│   ├── calendar.png
│   ├── photos.png
│   ├── reminders.png
│   ├── notes.png
│   ├── music.png
│   ├── appstore.png
│   ├── notion.png
│   ├── craft.png
│   ├── trash.png
│   ├── launchpad.png
│   ├── settings.png
│   ├── battery.png             # Menu bar battery icon
│   └── action-center.png      # Menu bar action center icon
│
├── dark-icons/                 # Dark mode variants (same names + "-dark")
│   ├── finder-dark.png
│   ├── safari-dark.png
│   └── ...                     # All dock icons with -dark suffix
│
├── photos/                     # Photo library for Photos app
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...                     # Up to 50.jpg (add more by editing photos-store.ts)
│
├── cursor.svg                  # Custom macOS-style cursor
│
├── dock.ts / dock.js           # Dock: spring physics, magnification, icons
├── window-manager.ts / .js     # Window system: drag, resize, maximize, z-index
├── menubar.ts / .js            # Menu bar: menus, dropdowns, action center
├── desktop-manager.ts / .js    # Desktop: draggable icons, rubber-band, clipboard
│
└── apps/
    ├── trash.ts / .js
    │
    ├── notes/
    │   ├── notes-store.ts/.js  # Data layer: notes, folders, localStorage
    │   ├── notes-editor.ts/.js # Rich text editor with full toolbar
    │   ├── notes-app.ts/.js    # 3-panel layout assembly
    │   └── notes.css
    │
    ├── finder/
    │   ├── finder-fs.ts/.js    # Virtual filesystem: CRUD, localStorage
    │   ├── finder-sidebar.ts/.js
    │   ├── finder-toolbar.ts/.js
    │   ├── finder-grid.ts/.js  # Icon / List / Column / Gallery views
    │   ├── finder-preview.ts/.js
    │   ├── finder-app.ts/.js
    │   └── finder.css
    │
    └── photos/
        ├── photos-store.ts/.js  # 50-photo library, albums, favorites
        ├── photos-sidebar.ts/.js
        ├── photos-grid.ts/.js   # Masonry grid, lazy loading, view modes
        ├── photos-lightbox.ts/.js
        ├── photos-app.ts/.js
        └── photos.css
```

---

## ✨ Features

### 🖥️ Desktop
- **Draggable icons** — freely position files and folders anywhere on the desktop
- **Rubber-band multi-select** — click-drag lasso with live hit-testing
- **Spring-snap to grid** — icons snap with a spring animation (`cubic-bezier(0.34, 1.56, 0.64, 1)`) on release
- **Keyboard shortcuts** — `Cmd+A`, `Cmd+C`, `Cmd+X`, `Cmd+V`, `Cmd+D`, `Delete`, `Escape`
- **Right-click context menu** — New Folder, New Text File, Import File, Sort by Name/Date, Clean Up, Change Wallpaper
- **OS file drag & drop** — drag real files from your computer directly onto the desktop
- **Wallpaper persistence** — user's chosen wallpaper saves to `localStorage` and survives page refresh

### 🚀 Dock
- **Spring physics magnification** — ported 1:1 from real macOS source (cosine bell curve + spring `damping: 0.47`, `stiffness: 0.12`, 7-point interpolation table at `baseWidth × 6 = 345.6px` radius)
- **Per-icon rAF spring loop** — each icon runs its own `requestAnimationFrame` physics
- **Running dots** below active apps
- **Bounce animation** on click
- **Dark mode** — dock glass becomes more transparent with smooth 450ms CSS transition

### 🪟 Window Manager
- **Freely draggable** via title bar (respects 28px menu bar boundary)
- **Maximize / restore** with smooth 300ms ease
- **Dock auto-hides** with spring animation when any window goes fullscreen
- **Z-index management** — clicked window always raises to front, indices capped at 500
- **Traffic lights** — red `#ff5f56` / yellow `#ffbd2e` / green `#27c93f`, icons appear on group hover, grey when unfocused
- **Open/close animations** — scale + opacity spring

### 📋 Menu Bar
- **Apple menu** — Sleep, Restart, Shut Down, Lock Screen, Log Out, Force Quit
- **Finder / File / Edit / View / Go / Window / Help** with keyboard shortcut hints on every item
- **Hover switching** — hover between open menus without clicking
- **Live clock** — updates every 15s in `EEE MMM dd h:mm aa` format
- **Battery** + **Wi-Fi** status icons (PNG from `icons/`)

### 🎛️ Action Center
- **Wi-Fi** — toggles with network name subtitle, dims menu bar icon when off
- **Bluetooth** + **AirDrop** toggles
- **Focus** (Do Not Disturb) toggle
- **Dark Mode** — switches desktop class, swaps dock icons, animates dock glass
- **Brightness slider** — adjusts wallpaper `filter: brightness()` in real time
- **Volume slider**
- **Now Playing widget** — title, artist, play/pause/skip
- **8 accent colors** — changes `--accent` CSS variable globally
- **Spring open/close** (`cubic-bezier(0.34, 1.4, 0.64, 1)`)

### 📝 Notes App
- **3-panel layout** — Folders sidebar + Note list + Rich text editor
- **Rich text** — bold, italic, underline, strikethrough, bullet/numbered/checklist, table, image attach, sketch
- **Inline rename** for folders and notes
- **Grouped by year** in note list with pinned notes at top
- **Live search with highlight** — highlights matching text yellow inside the editor
- **Image paste** — paste or drop images directly into notes
- **localStorage persistence** — all notes and folders survive refresh
- **Dark mode** full support

### 🗂️ Finder
- **Virtual filesystem** — full tree with CRUD: create, rename, move, duplicate, delete (recursive)
- **4 view modes** — Icons, List, Columns, Gallery
- **Navigation history** — back/forward with full history stack
- **Breadcrumb** — click any segment to navigate
- **Drag & drop** — drag files between folders, from desktop into Finder and vice versa
- **Right-click context** — Open, Open in Notes, Duplicate, Rename (inline edit), Get Info, Move to Trash
- **Empty space context** — New Folder, New Text File, Import Image
- **Quick Look preview** — image preview, text preview, folder count, metadata
- **Live search** across all files
- **Open text files in Notes** — syncs content to Notes store, opens Notes window

### 📷 Photos App
- **50-photo library** — loads `photos/1.jpg` … `photos/50.jpg`
- **3 view modes** — All Photos (grouped by date), Months, Years
- **5 zoom levels** — slider adjusts cell size from 80px to 300px
- **IntersectionObserver lazy loading** — only decodes photos as they scroll into view (`rootMargin: 200px`), `decoding="async"` off main thread
- **Masonry grid** — respects each photo's aspect ratio
- **Favorites** — ❤️ on hover, persists to `localStorage`
- **Multi-select** — `Cmd+click` or selection circle
- **Filter By** — All, Favourites, Videos, Selfies, Portraits, Panoramas, Live Photos, Bursts
- **Full sidebar** — Library, Collections, Albums (3 pre-made), Media Types (9 types)
- **Lightbox** — keyboard nav (`←` `→` `Esc`), scroll/button zoom, click-drag pan, info panel, film strip, `F` favourite, `W` wallpaper, `I` info
- **Set as Wallpaper** — fetches photo, converts to data URL, applies to desktop, persists to `localStorage`

---

## ⌨️ Keyboard Shortcuts

### Desktop
| Shortcut | Action |
|---|---|
| `Cmd+A` | Select all desktop icons |
| `Cmd+C` | Copy selected |
| `Cmd+X` | Cut selected |
| `Cmd+V` | Paste |
| `Cmd+D` | Duplicate selected |
| `Delete` | Move to trash |
| `Escape` | Deselect all |

### Photos Lightbox
| Key | Action |
|---|---|
| `←` / `→` | Previous / Next photo |
| `Esc` | Close |
| `+` / `-` | Zoom in / out |
| `F` | Toggle favourite |
| `W` | Set as wallpaper |
| `I` | Toggle info panel |

---

## 🎨 Customisation

### Wallpaper
Replace `wallpaper.jpg` in the root with any image. It loads automatically. Users can also set wallpaper from the Photos app or the desktop right-click menu — this persists to `localStorage`.

### Dock Icons
Place 512×512 PNG icons in `icons/` with these exact filenames: `finder.png`, `launchpad.png`, `settings.png`, `safari.png`, `messages.png`, `calendar.png`, `photos.png`, `reminders.png`, `notes.png`, `music.png`, `appstore.png`, `notion.png`, `craft.png`, `trash.png`

### Dark Mode Icons
Place dark variants in `dark-icons/` with `-dark` suffix added before the extension: `finder-dark.png`, `safari-dark.png`, etc. Falls back silently to the light icon if the dark version is missing.

### Menu Bar Icons
`icons/battery.png` and `icons/action-center.png` — white/light coloured PNGs recommended (CSS `filter: brightness(0) invert(1)` is applied).

### Custom Cursor
Place `cursor.svg` in the root. Applied globally via CSS `cursor: url('cursor.svg') 0 0, auto`.

### Photos Library
Add images as `photos/1.jpg` → `photos/50.jpg`. To add more than 50, open `apps/photos/photos-store.ts`, change the loop limit in `buildPhotoList()` and add date/location entries.

### Accent Color
Default is `#0a84ff` (macOS blue). Change via the Action Center color picker, or edit `--accent` in `styles.css`.

---

## 🏗️ Architecture

The project compiles with `module: "None"` — no ES modules, no bundler. All classes live in global scope and `window.*` is used for cross-module communication. Scripts load in dependency order via plain `<script>` tags.

**Each app follows this pattern:**

```
*-store.ts   →  data layer, localStorage, pub/sub
*-sidebar.ts →  left panel component
*-grid.ts    →  main content area
*-app.ts     →  assembles panels, calls __createWindow()
*.css        →  scoped app styles
```

**Window registration pattern:**
```typescript
(window as any).openMyAppWindow = function(): void {
  (window as any).__createWindow({
    appId:   "myapp",
    title:   "My App",
    width:   800,
    height:  500,
    content: (_win) => {
      // return the app's root HTMLElement
    },
  });
};
```

---

## 🛠️ Tech Stack

| | Technology |
|---|---|
| Language | TypeScript 5 |
| Runtime | Vanilla JS (ES2020) — zero runtime deps |
| Styles | Plain CSS (variables, backdrop-filter, grid, flex) |
| Storage | `localStorage` |
| Images | `IntersectionObserver` + `decoding="async"` |
| Fonts | `-apple-system`, SF Pro Text |
| Build | `tsc` only — no webpack, no vite, no rollup |
| Server | Any static file server |

---

## 📄 License

MIT — build on it, fork it, ship it.

---

*Built pixel by pixel. Cooked hard.* 🍎
