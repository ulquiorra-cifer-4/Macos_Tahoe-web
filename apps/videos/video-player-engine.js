"use strict";
// ============================================================
//  Video App — video-player-engine.js
//  Bridges VideoStore ↔ HTMLVideoElement
// ============================================================

class VideoPlayerEngine {
  constructor(store, videoEl) {
    this.store   = store;
    this.video   = videoEl;
    this._loadedId = null;

    this.video.addEventListener("ended",        () => this._onEnded());
    this.video.addEventListener("error",        () => this._onError());
    this.video.addEventListener("timeupdate",   () => this._onTimeUpdate());
    this.video.addEventListener("loadedmetadata",() => this._onMeta());
    this.video.addEventListener("canplay",      () => {
      if (this.store.isPlaying) this.video.play().catch(()=>{});
    });
    this.video.addEventListener("waiting",      () => {});

    this.video.volume = store.volume;

    store.subscribe(() => this._syncToStore());
  }

  _syncToStore() {
    const { currentId, isPlaying, volume } = this.store;
    this.video.volume = volume;

    if (!currentId) { this.video.pause(); this.video.src = ""; return; }

    if (this._loadedId !== currentId) {
      this._loadedId = currentId;
      const src = this.store.getVideoSrc(currentId);
      if (!src) return;
      this.video.src = src;
      this.video.load();
      // play() triggered by canplay
    } else {
      if (isPlaying) this.video.play().catch(()=>{});
      else           this.video.pause();
    }
  }

  _onTimeUpdate() {
    this.store.updateProgress(this.video.currentTime, this.video.duration);
  }
  _onMeta() {
    window.dispatchEvent(new CustomEvent("vp-meta", {
      detail: { duration: this.video.duration }
    }));
  }
  _onEnded() {
    const { repeat } = this.store;
    if (repeat === "one") { this.video.currentTime = 0; this.video.play().catch(()=>{}); }
    else                   this.store.nextVideo();
  }
  _onError() {
    console.warn("[VideoPlayerEngine] error loading", this._loadedId);
    // Show error state but don't crash
    window.dispatchEvent(new CustomEvent("vp-error", { detail: { id: this._loadedId } }));
  }

  seekTo(progress) {
    const dur = this.video.duration;
    if (!dur || isNaN(dur)) return;
    this.video.currentTime = progress * dur;
  }

  getCurrentTime() { return this.video.currentTime || 0; }
  getDuration()    { return this.video.duration    || 0; }
  getBuffered()    {
    // Returns 0-1 buffered fraction
    const buf = this.video.buffered;
    const dur = this.video.duration;
    if (!buf.length || !dur) return 0;
    return buf.end(buf.length - 1) / dur;
  }
}

window.__VideoPlayerEngine = VideoPlayerEngine;
 
