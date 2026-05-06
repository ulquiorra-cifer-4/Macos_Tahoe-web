"use strict";
// ============================================================
//  Photos App — photos-sidebar.ts
//  Left panel: Library, Collections, Albums, Media Types
// ============================================================
class PhotosSidebar {
    constructor(cbs) {
        this.active = "library";
        this.cbs = cbs;
        this.store = window.__photosStore;
        this.el = document.createElement("div");
        this.el.className = "ph-sidebar";
        this._render();
    }
    setActive(id) {
        this.active = id;
        this.el.querySelectorAll(".ph-sb-item").forEach(el => {
            el.classList.toggle("active", el.dataset.id === id);
        });
    }
    _render() {
        this.el.innerHTML = "";
        this._section("Photos", [
            { id: "library", label: "Library", icon: "library", section: "library" },
            { id: "favorites", label: "Favorites", icon: "heart", section: "favorites" },
            { id: "recents", label: "Recently Saved", icon: "recents", section: "recents" },
            { id: "map", label: "Map", icon: "map", section: "map" },
        ]);
        this._section("Collections", [
            { id: "days", label: "Days", icon: "days", section: "days" },
            { id: "people", label: "People & Pets", icon: "people", section: "people" },
            { id: "memories", label: "Memories", icon: "memories", section: "memories" },
            { id: "trips", label: "Trips", icon: "trips", section: "trips" },
            { id: "featured", label: "Featured Photos", icon: "featured", section: "featured" },
        ]);
        // Albums (expandable)
        this._albumsSection();
        // Media Types (expandable)
        this._mediaTypesSection();
        this._section("Utilities", [
            { id: "utilities", label: "Utilities", icon: "utilities", section: "utilities" },
            { id: "projects", label: "Projects", icon: "projects", section: "projects" },
        ]);
        this._section("Sharing", [
            { id: "shared", label: "Shared Albums", icon: "shared", section: "sharedAlbums" },
        ]);
    }
    _section(label, items) {
        const sec = document.createElement("div");
        sec.className = "ph-sb-section";
        const lbl = document.createElement("div");
        lbl.className = "ph-sb-label";
        lbl.textContent = label;
        sec.appendChild(lbl);
        items.forEach(item => {
            const el = this._makeItem(item.id, item.label, item.icon, item.section);
            sec.appendChild(el);
        });
        this.el.appendChild(sec);
    }
    _albumsSection() {
        const sec = document.createElement("div");
        sec.className = "ph-sb-section";
        const header = document.createElement("div");
        header.className = "ph-sb-collapsible";
        let expanded = true;
        header.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" class="ph-sb-chevron" id="albumChevron" style="transform:rotate(0deg);transition:transform .2s"><path d="M7 10l5 5 5-5z"/></svg>
      <span class="ph-sb-label" style="margin:0">Albums</span>
    `;
        header.style.cssText = "display:flex;align-items:center;gap:4px;padding:8px 14px 4px;cursor:pointer";
        header.addEventListener("click", () => {
            expanded = !expanded;
            albumList.style.display = expanded ? "" : "none";
            const chevron = document.getElementById("albumChevron");
            if (chevron)
                chevron.style.transform = `rotate(${expanded ? 0 : -90}deg)`;
        });
        sec.appendChild(header);
        const albumList = document.createElement("div");
        const albums = this.store.getAlbums();
        albums.forEach((album) => {
            const el = this._makeItem("album_" + album.id, album.name, "album", { albumId: album.id });
            el.style.paddingLeft = "24px";
            albumList.appendChild(el);
        });
        sec.appendChild(albumList);
        this.el.appendChild(sec);
    }
    _mediaTypesSection() {
        const sec = document.createElement("div");
        sec.className = "ph-sb-section";
        const header = document.createElement("div");
        let expanded = true;
        header.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" class="ph-sb-chevron" id="mediaChevron" style="transform:rotate(0deg);transition:transform .2s"><path d="M7 10l5 5 5-5z"/></svg>
      <span class="ph-sb-label" style="margin:0">Media Types</span>
    `;
        header.style.cssText = "display:flex;align-items:center;gap:4px;padding:8px 14px 4px;cursor:pointer";
        header.addEventListener("click", () => {
            expanded = !expanded;
            mediaList.style.display = expanded ? "" : "none";
            const chevron = document.getElementById("mediaChevron");
            if (chevron)
                chevron.style.transform = `rotate(${expanded ? 0 : -90}deg)`;
        });
        sec.appendChild(header);
        const mediaList = document.createElement("div");
        const types = [
            { id: "videos", label: "Videos", icon: "video" },
            { id: "selfies", label: "Selfies", icon: "selfie" },
            { id: "livePhotos", label: "Live Photos", icon: "live" },
            { id: "portraits", label: "Portrait", icon: "portrait" },
            { id: "panoramas", label: "Panoramas", icon: "panorama" },
            { id: "timelapse", label: "Time-lapse", icon: "timelapse" },
            { id: "slowmo", label: "Slo-mo", icon: "slowmo" },
            { id: "bursts", label: "Bursts", icon: "burst" },
            { id: "animated", label: "Animated", icon: "animated" },
        ];
        types.forEach(t => {
            const el = this._makeItem(t.id, t.label, t.icon, t.id);
            el.style.paddingLeft = "24px";
            mediaList.appendChild(el);
        });
        sec.appendChild(mediaList);
        this.el.appendChild(sec);
    }
    _makeItem(id, label, icon, section) {
        const el = document.createElement("button");
        el.className = "ph-sb-item" + (id === this.active ? " active" : "");
        el.dataset.id = id;
        el.innerHTML = `<span class="ph-sb-icon">${this._icon(icon)}</span><span class="ph-sb-name">${label}</span>`;
        el.addEventListener("click", () => { this.setActive(id); this.cbs.onSection(section); });
        return el;
    }
    _icon(name) {
        const icons = {
            library: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>`,
            heart: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
            recents: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
            map: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>`,
            days: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>`,
            people: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
            memories: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`,
            trips: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>`,
            featured: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14z"/></svg>`,
            album: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
            video: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`,
            selfie: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
            live: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><circle cx="12" cy="12" r="8"/></svg>`,
            portrait: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
            panorama: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 6.5c2.76 0 5 2.24 5 5 0 1.08-.32 2.09-.87 2.93L18.27 16.6c.98-1.33 1.6-2.96 1.7-4.6H22c-.1 2.36-1.05 4.56-2.59 6.24l1.3 1.16-1.31 1.48L17.79 19c-1.67 1.29-3.75 2-6 2s-4.38-.74-6.04-2.03l-1.62 1.44-1.31-1.47 1.3-1.16C2.59 16.12 1.1 13.11 1 9.87h2c.1 2.78 1.52 5.22 3.77 6.73l1.5-1.33C7.66 14.54 7 13.09 7 11.5c0-2.76 2.24-5 5-5m0-2c-3.86 0-7 3.14-7 7 0 1.9.76 3.62 1.99 4.9l-1.29 1.14 1.3 1.47L8.3 17.4C9.69 18.41 11.27 19 13 19c1.66 0 3.18-.55 4.42-1.48l1.28 1.13 1.3-1.47-1.29-1.14C19.94 14.77 20 13.43 20 11.5c0-3.86-3.14-7-7-7-.33 0-.67.02-1 .07V4h-2V4.57c-.34-.05-.67-.07-1-.07z"/></svg>`,
            timelapse: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`,
            slowmo: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
            burst: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>`,
            animated: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19.5 9.5c-1.03 0-1.9.62-2.29 1.5h-2.92c-.39-.88-1.26-1.5-2.29-1.5s-1.9.62-2.29 1.5H7.79C7.4 10.12 6.53 9.5 5.5 9.5 4.12 9.5 3 10.62 3 12s1.12 2.5 2.5 2.5c1.03 0 1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5s1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5 1.38 0 2.5-1.12 2.5-2.5S20.88 9.5 19.5 9.5z"/></svg>`,
            utilities: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,
            projects: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
            shared: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>`,
        };
        return icons[name] ?? icons["library"];
    }
}
window.__PhotosSidebar = PhotosSidebar;
