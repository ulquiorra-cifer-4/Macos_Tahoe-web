"use strict";
// ============================================================
//  Music App — music-player.js
//  Audio engine: bridges MusicStore ↔ HTMLAudioElement
//  One global singleton, multiple app windows can subscribe.
// ============================================================

class MusicPlayer {
  constructor(store) {
    this.store = store;
    this.audio = new Audio();
    this.audio.preload = "auto";
    this._loadedSongId = null;
    this._raf = null;

    // Volume
    this.audio.volume = store.state.volume;

    // Wire audio events → store
    this.audio.addEventListener("ended", () => this._onEnded());
    this.audio.addEventListener("error", () => this._onError());
    this.audio.addEventListener("timeupdate", () => this._onTimeUpdate());
    this.audio.addEventListener("loadedmetadata", () => this._onMetadata());
    this.audio.addEventListener("canplay", () => {
      if (this.store.state.isPlaying) this.audio.play().catch(() => {});
    });

    // Subscribe to store state changes
    store.subscribe(() => this._syncToStore());
  }

  _syncToStore() {
    const { currentSongId, isPlaying, volume } = this.store.state;

    // Volume
    this.audio.volume = volume;

    if (!currentSongId) {
      this.audio.pause();
      return;
    }

    // Load new song if changed
    if (this._loadedSongId !== currentSongId) {
      this._loadedSongId = currentSongId;
      const url = this.store.getSongAudioUrl(currentSongId);
      this.audio.src = url;
      this.audio.load();
      // play() called from canplay event above
    } else {
      // Same song, just toggle play/pause
      if (isPlaying) {
        this.audio.play().catch(() => {});
      } else {
        this.audio.pause();
      }
    }
  }

  _onTimeUpdate() {
    const dur = this.audio.duration;
    if (!dur || isNaN(dur)) return;
    // Update store progress silently (no full notify to avoid loop)
    this.store.state.progress = this.audio.currentTime / dur;
    // Notify UI-only listeners by dispatching a custom event
    window.dispatchEvent(new CustomEvent("mu-progress", {
      detail: {
        currentTime: this.audio.currentTime,
        duration: dur,
        progress: this.store.state.progress,
      }
    }));
  }

  _onMetadata() {
    // Real duration now available
    window.dispatchEvent(new CustomEvent("mu-metadata", {
      detail: { duration: this.audio.duration }
    }));
  }

  _onEnded() {
    this.store.nextSong();
  }

  _onError() {
    // Song file not found — still allow UI to work, auto-advance
    console.warn("[MusicPlayer] audio error for", this._loadedSongId);
  }

  // Called by scrubber drag in UI
  seekTo(progress) {
    const dur = this.audio.duration;
    if (!dur || isNaN(dur)) return;
    this.audio.currentTime = progress * dur;
    this.store.state.progress = progress;
  }

  getCurrentTime() { return this.audio.currentTime || 0; }
  getDuration()    { return this.audio.duration || 0; }
}

// Singleton
window.__musicPlayer = window.__musicPlayer ||
  (window.__musicStore ? new MusicPlayer(window.__musicStore) : null);

// Lazy-init if store wasn't ready yet
if (!window.__musicPlayer && window.__musicStore) {
  window.__musicPlayer = new MusicPlayer(window.__musicStore);
}
 
