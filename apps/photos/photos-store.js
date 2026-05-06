"use strict";
// ============================================================
//  Photos App — photos-store.ts
//  Data layer: photo library, albums, favorites, metadata
// ============================================================
const PHOTOS_STORE_KEY = "macos_photos_v1";
// ── Generate 50 photo entries pointing to photos/1.jpg … photos/50.jpg ──
function buildPhotoList() {
    const photos = [];
    // Date pools — spread across last 3 years
    const dates = [
        new Date("2024-07-26"), new Date("2024-07-26"), new Date("2024-07-26"),
        new Date("2024-07-26"), new Date("2024-07-26"), new Date("2024-07-26"),
        new Date("2024-06-14"), new Date("2024-06-14"), new Date("2024-06-14"),
        new Date("2024-05-03"), new Date("2024-05-03"), new Date("2024-05-03"),
        new Date("2024-03-18"), new Date("2024-03-18"), new Date("2024-03-18"),
        new Date("2024-01-09"), new Date("2024-01-09"), new Date("2024-01-09"),
        new Date("2023-11-22"), new Date("2023-11-22"), new Date("2023-11-22"),
        new Date("2023-09-05"), new Date("2023-09-05"), new Date("2023-09-05"),
        new Date("2023-07-04"), new Date("2023-07-04"), new Date("2023-07-04"),
        new Date("2023-05-19"), new Date("2023-05-19"), new Date("2023-05-19"),
        new Date("2023-02-14"), new Date("2023-02-14"), new Date("2023-02-14"),
        new Date("2022-12-25"), new Date("2022-12-25"), new Date("2022-12-25"),
        new Date("2022-10-31"), new Date("2022-10-31"), new Date("2022-10-31"),
        new Date("2022-08-20"), new Date("2022-08-20"), new Date("2022-08-20"),
        new Date("2022-06-15"), new Date("2022-06-15"), new Date("2022-06-15"),
        new Date("2022-04-10"), new Date("2022-04-10"), new Date("2022-04-10"),
        new Date("2022-01-01"), new Date("2022-01-01"), new Date("2022-01-01"),
    ];
    const locations = [
        "Zion National Park", "Bryce Canyon", "Grand Canyon",
        "Yosemite", "Joshua Tree", "Death Valley",
        "San Francisco", "Los Angeles", "New York",
        "Tokyo", "Paris", "London",
        "Sydney", "Bali", "Iceland",
        "Patagonia", "Machu Picchu", "Sahara Desert",
    ];
    const mediaTypes = [
        "photo", "photo", "photo", "photo", "photo",
        "selfie", "portrait", "panorama", "livePhoto", "burst",
    ];
    const aspectRatios = [
        [4, 3], [16, 9], [3, 2], [1, 1], [3, 4], [9, 16], [2, 3], [5, 4], [7, 5], [16, 10],
    ];
    for (let i = 1; i <= 50; i++) {
        const [w, h] = aspectRatios[(i - 1) % aspectRatios.length];
        photos.push({
            id: i,
            src: `photos/${i}.jpg`,
            thumb: `photos/${i}.jpg`,
            date: dates[(i - 1) % dates.length],
            favorite: i % 7 === 0, // every 7th photo is pre-favorited
            width: w,
            height: h,
            location: locations[(i - 1) % locations.length],
            tags: [],
            mediaType: mediaTypes[(i - 1) % mediaTypes.length],
            album: i <= 12 ? "Summer 2024" : i <= 24 ? "Travel" : i <= 36 ? "Nature" : undefined,
        });
    }
    return photos;
}
const ALBUMS = [
    { id: "summer24", name: "Summer 2024", cover: 1 },
    { id: "travel", name: "Travel", cover: 13 },
    { id: "nature", name: "Nature", cover: 25 },
    { id: "favorites", name: "Favorites", cover: 7 },
];
class PhotosStore {
    constructor() {
        this.listeners = [];
        this.photos = buildPhotoList();
        this._loadFavorites();
    }
    _loadFavorites() {
        try {
            const raw = localStorage.getItem(PHOTOS_STORE_KEY);
            if (!raw)
                return;
            const favIds = JSON.parse(raw);
            this.photos.forEach(p => { p.favorite = favIds.includes(p.id); });
        }
        catch { }
    }
    _saveFavorites() {
        try {
            const ids = this.photos.filter(p => p.favorite).map(p => p.id);
            localStorage.setItem(PHOTOS_STORE_KEY, JSON.stringify(ids));
        }
        catch { }
        this.listeners.forEach(fn => fn());
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }
    // ── Queries ──
    getAll() { return [...this.photos]; }
    getFavorites() { return this.photos.filter(p => p.favorite); }
    getAlbums() { return ALBUMS; }
    getAlbumPhotos(albumId) {
        const album = ALBUMS.find(a => a.id === albumId);
        if (!album)
            return [];
        return this.photos.filter(p => p.album === album.name);
    }
    getByMediaType(type) {
        return this.photos.filter(p => p.mediaType === type);
    }
    getByMonth(year, month) {
        return this.photos.filter(p => p.date.getFullYear() === year && p.date.getMonth() === month);
    }
    getByYear(year) {
        return this.photos.filter(p => p.date.getFullYear() === year);
    }
    groupByDate(photos) {
        const map = new Map();
        photos.forEach(p => {
            const key = p.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            if (!map.has(key))
                map.set(key, []);
            map.get(key).push(p);
        });
        // Sort groups newest first
        return new Map([...map.entries()].sort((a, b) => {
            const da = new Date(a[0]), db = new Date(b[0]);
            return db.getTime() - da.getTime();
        }));
    }
    groupByMonth(photos) {
        const map = new Map();
        photos.forEach(p => {
            const key = p.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            if (!map.has(key))
                map.set(key, []);
            map.get(key).push(p);
        });
        return new Map([...map.entries()].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()));
    }
    groupByYear(photos) {
        const map = new Map();
        photos.forEach(p => {
            const key = String(p.date.getFullYear());
            if (!map.has(key))
                map.set(key, []);
            map.get(key).push(p);
        });
        return new Map([...map.entries()].sort((a, b) => +b[0] - +a[0]));
    }
    // ── Mutations ──
    toggleFavorite(id) {
        const p = this.photos.find(p => p.id === id);
        if (p) {
            p.favorite = !p.favorite;
            this._saveFavorites();
        }
    }
    search(query) {
        const q = query.toLowerCase();
        return this.photos.filter(p => (p.location ?? "").toLowerCase().includes(q) ||
            p.tags.some(t => t.toLowerCase().includes(q)) ||
            p.mediaType.toLowerCase().includes(q) ||
            (p.album ?? "").toLowerCase().includes(q));
    }
    getPhoto(id) {
        return this.photos.find(p => p.id === id);
    }
    // ── FS integration: add photos from Finder ──
    importFromFS(fsNode) {
        if (!fsNode.dataUrl)
            return;
        const id = 1000 + this.photos.length;
        this.photos.unshift({
            id, src: fsNode.dataUrl, thumb: fsNode.dataUrl,
            date: new Date(fsNode.modifiedAt),
            favorite: false, width: 4, height: 3,
            tags: [], mediaType: "photo",
        });
        this._saveFavorites();
    }
}
window.__photosStore = window.__photosStore || new PhotosStore();
