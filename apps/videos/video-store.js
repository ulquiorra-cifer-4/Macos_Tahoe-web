"use strict";
// ============================================================
//  Video App — video-store.js
//  Catalogue of preloaded videos (videos/1.mp4 … 10.mp4)
//  + user-uploaded videos injected at runtime
// ============================================================

const VIDEO_STORAGE_KEY = "macos_video_v1";

// ── Preloaded videos (you upload 1.mp4–10.mp4 to videos/) ──
const PRELOADED_VIDEOS = [
  { id:"v1",  title:"Video 1",  file:"videos/1.mp4",  type:"preloaded", size:0 },
  { id:"v2",  title:"Video 2",  file:"videos/2.mp4",  type:"preloaded", size:0 },
  { id:"v3",  title:"Video 3",  file:"videos/3.mp4",  type:"preloaded", size:0 },
  { id:"v4",  title:"Video 4",  file:"videos/4.mp4",  type:"preloaded", size:0 },
  { id:"v5",  title:"Video 5",  file:"videos/5.mp4",  type:"preloaded", size:0 },
  { id:"v6",  title:"Video 6",  file:"videos/6.mp4",  type:"preloaded", size:0 },
  { id:"v7",  title:"Video 7",  file:"videos/7.mp4",  type:"preloaded", size:0 },
  { id:"v8",  title:"Video 8",  file:"videos/8.mp4",  type:"preloaded", size:0 },
  { id:"v9",  title:"Video 9",  file:"videos/9.mp4",  type:"preloaded", size:0 },
  { id:"v10", title:"Video 10", file:"videos/10.mp4", type:"preloaded", size:0 },
];

class VideoStore {
  constructor() {
    this.listeners    = [];
    this._userVideos  = this._loadUserVideos();
    this._currentId   = null;
    this._isPlaying   = false;
    this._volume      = 0.85;
    this._progress    = 0;   // 0-1
    this._duration    = 0;
    this._currentTime = 0;
    this._shuffle     = false;
    this._repeat      = false; // "none"|"one"|"all"
    this._showPlaylist= true;
  }

  // ── Persistence ──
  _loadUserVideos() {
    try {
      const raw = localStorage.getItem(VIDEO_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  _save() {
    try {
      // Only save metadata — not blob URLs (they expire on reload)
      const toSave = this._userVideos.map(v => ({
        ...v, src: v.src?.startsWith("blob:") ? null : v.src
      }));
      localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }

  // ── Subscriptions ──
  subscribe(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; }
  notify()      { this.listeners.forEach(fn => fn()); }

  // ── Catalogue ──
  getAllVideos() {
    return [...PRELOADED_VIDEOS, ...this._userVideos];
  }
  getVideo(id) {
    return this.getAllVideos().find(v => v.id === id) ?? null;
  }
  getVideoSrc(id) {
    const v = this.getVideo(id);
    if (!v) return null;
    return v.src ?? v.file ?? null;
  }

  // ── User upload ──
  addUserVideo(name, src, size) {
    const id = "uv_" + Date.now();
    const title = name.replace(/\.[^.]+$/, "");
    const video = { id, title, name, src, size, type:"user", addedAt: Date.now() };
    this._userVideos.unshift(video);
    this._save();
    this.notify();
    return video;
  }
  removeUserVideo(id) {
    this._userVideos = this._userVideos.filter(v => v.id !== id);
    this._save();
    if (this._currentId === id) { this._currentId = null; this._isPlaying = false; }
    this.notify();
  }

  // ── Playback state ──
  getCurrentVideo() { return this._currentId ? this.getVideo(this._currentId) : null; }
  get isPlaying()   { return this._isPlaying; }
  get volume()      { return this._volume; }
  get currentId()   { return this._currentId; }
  get showPlaylist(){ return this._showPlaylist; }
  get shuffle()     { return this._shuffle; }
  get repeat()      { return this._repeat; }

  play(id) {
    const v = this.getVideo(id);
    if (!v) return;
    this._currentId  = id;
    this._isPlaying  = true;
    this._progress   = 0;
    this._currentTime= 0;
    this.notify();
  }
  togglePlay() {
    if (!this._currentId) return;
    this._isPlaying = !this._isPlaying;
    this.notify();
  }
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    this.notify();
  }
  toggleShuffle() { this._shuffle = !this._shuffle; this.notify(); }
  toggleRepeat()  {
    const modes = ["none","all","one"];
    this._repeat = modes[(modes.indexOf(this._repeat)+1) % modes.length];
    this.notify();
  }
  togglePlaylist() { this._showPlaylist = !this._showPlaylist; this.notify(); }

  nextVideo() {
    const all = this.getAllVideos();
    if (!all.length) return;
    if (this._shuffle) {
      const idx = Math.floor(Math.random() * all.length);
      this.play(all[idx].id); return;
    }
    const idx = all.findIndex(v => v.id === this._currentId);
    const next = all[(idx + 1) % all.length];
    if (next) this.play(next.id);
  }
  prevVideo() {
    const all = this.getAllVideos();
    const idx = all.findIndex(v => v.id === this._currentId);
    const prev = all[Math.max(0, idx - 1)];
    if (prev) this.play(prev.id);
  }

  // Progress updated by player engine
  updateProgress(currentTime, duration) {
    this._currentTime = currentTime;
    this._duration    = duration;
    this._progress    = duration > 0 ? currentTime / duration : 0;
    // No full notify here — use custom event to avoid re-render loop
    window.dispatchEvent(new CustomEvent("vp-progress", {
      detail: { currentTime, duration, progress: this._progress }
    }));
  }

  formatTime(secs) {
    if (!secs || isNaN(secs)) return "0:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60).toString().padStart(2,"0");
    return h > 0 ? `${h}:${m.toString().padStart(2,"0")}:${s}` : `${m}:${s}`;
  }
}

window.__videoStore = window.__videoStore || new VideoStore();
 
