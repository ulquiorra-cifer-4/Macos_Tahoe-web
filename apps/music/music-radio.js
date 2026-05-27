"use strict";
// ============================================================
//  Music App — music-radio.js
//  Live radio stations with direct stream URLs.
//  All URLs verified from official station pages (2025-2026).
//  Uses HTML5 Audio — same engine as music-player.js.
// ============================================================

// ── Station catalogue ──
const RADIO_STATIONS = [
  {
    id:       "groove-salad",
    name:     "Groove Salad",
    tagline:  "Chilled ambient & downtempo beats",
    genre:    "Ambient · Chill",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-groove-salad.jpg",
    emoji:    "🥗",
    color:    "#1a3a2a",
    // Official SomaFM direct URL (from somafm.com/listen/sonoscustom.html)
    streamUrl: "https://ice.somafm.com/groovesalad",
    fallbacks: [
      "https://ice1.somafm.com/groovesalad-128-mp3",
      "https://ice2.somafm.com/groovesalad-128-mp3",
      "https://ice4.somafm.com/groovesalad-128-mp3",
    ],
  },
  {
    id:       "secret-agent",
    name:     "Secret Agent",
    tagline:  "Spy jazz, lounge & cinematic downtempo",
    genre:    "Lounge · Jazz",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-secret-agent.jpg",
    emoji:    "🕵️",
    color:    "#1a1a2e",
    streamUrl: "https://ice.somafm.com/secretagent",
    fallbacks: [
      "https://ice1.somafm.com/secretagent-128-mp3",
      "https://ice2.somafm.com/secretagent-128-mp3",
    ],
  },
  {
    id:       "drone-zone",
    name:     "Drone Zone",
    tagline:  "Atmospheric textures with minimal beats",
    genre:    "Ambient · Drone",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-drone-zone.jpg",
    emoji:    "🌌",
    color:    "#0a0a1e",
    streamUrl: "https://ice.somafm.com/dronezone",
    fallbacks: [
      "https://ice1.somafm.com/dronezone-128-mp3",
      "https://ice2.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    id:       "indie-pop",
    name:     "Indie Pop Rocks!",
    tagline:  "New & classic favorite indie pop tracks",
    genre:    "Indie Pop · Alternative",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-indie-pop.jpg",
    emoji:    "🎸",
    color:    "#2e1a3a",
    streamUrl: "https://ice.somafm.com/indiepop",
    fallbacks: [
      "https://ice1.somafm.com/indiepop-128-mp3",
      "https://ice2.somafm.com/indiepop-128-mp3",
    ],
  },
  {
    id:       "beat-blender",
    name:     "Beat Blender",
    tagline:  "Late night house, downtempo & blends",
    genre:    "House · EDM",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-beat-blender.jpg",
    emoji:    "🎛️",
    color:    "#0d1a2e",
    streamUrl: "https://ice.somafm.com/beatblender",
    fallbacks: [
      "https://ice1.somafm.com/beatblender-128-mp3",
      "https://ice2.somafm.com/beatblender-128-mp3",
    ],
  },
  {
    id:       "lush",
    name:     "Lush",
    tagline:  "Female-driven vocal downtempo",
    genre:    "Downtempo · Vocals",
    source:   "SomaFM · San Francisco",
    artwork:  "apps/music/artwork/radio-lush.jpg",
    emoji:    "🌸",
    color:    "#2e0d1a",
    streamUrl: "https://ice.somafm.com/lush",
    fallbacks: [
      "https://ice1.somafm.com/lush-128-mp3",
      "https://ice2.somafm.com/lush-128-mp3",
    ],
  },
  {
    id:       "kexp",
    name:     "KEXP 90.3",
    tagline:  "Where the music matters",
    genre:    "Indie · Alternative · New Music",
    source:   "KEXP · Seattle, WA",
    artwork:  "apps/music/artwork/radio-kexp.jpg",
    emoji:    "📻",
    color:    "#1a0d0d",
    // Official KEXP stream (kexp.org confirmed live stream URL)
    streamUrl: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
    fallbacks: [
      "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
    ],
  },
  {
    id:       "wnyc",
    name:     "WNYC 93.9 FM",
    tagline:  "New York Public Radio — news & talk",
    genre:    "News · Talk · Public Radio",
    source:   "WNYC · New York, NY",
    artwork:  "apps/music/artwork/radio-wnyc.jpg",
    emoji:    "🗽",
    color:    "#0d1a0d",
    // WNYC official stream via streamtheworld
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/WNYCFM.mp3",
    fallbacks: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/WNYCFM.mp3",
    ],
  },
  {
    id:       "wamc",
    name:     "WAMC Northeast",
    tagline:  "NPR news, information & culture",
    genre:    "News · NPR",
    source:   "WAMC · Albany, NY",
    artwork:  "apps/music/artwork/radio-wamc.jpg",
    emoji:    "📰",
    color:    "#1a1a0d",
    // Official WAMC stream (wamc.org/streaming confirmed)
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/WAMCFM.mp3",
    fallbacks: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/WAMCFM.mp3",
    ],
  },
  {
    id:       "jazz24",
    name:     "Jazz24",
    tagline:  "24/7 jazz, all styles, all eras",
    genre:    "Jazz",
    source:   "KNKX · Seattle, WA",
    artwork:  "apps/music/artwork/radio-jazz24.jpg",
    emoji:    "🎷",
    color:    "#1a0d2e",
    // Jazz24 official stream
    streamUrl: "https://live.str3am.com:2199/tunein/knkxjazz.pls",
    fallbacks: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/JAZZ24.mp3",
    ],
  },
];

// ── Radio Player (separate from music-player.js) ──
class RadioPlayer {
  constructor() {
    this.audio         = new Audio();
    this.audio.preload = "none";
    this.currentId     = null;
    this.isPlaying     = false;
    this.volume        = window.__musicStore?.state?.volume ?? 0.8;
    this.audio.volume  = this.volume;
    this._fallbackIdx  = 0;
    this.listeners     = [];

    this.audio.addEventListener("error",   () => this._tryFallback());
    this.audio.addEventListener("playing", () => { this.isPlaying = true;  this._notify(); });
    this.audio.addEventListener("pause",   () => { this.isPlaying = false; this._notify(); });
    this.audio.addEventListener("waiting", () => this._notify());
    this.audio.addEventListener("stalled", () => this._tryFallback());
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }
  _notify() { this.listeners.forEach(fn => fn()); }

  getStation()  { return RADIO_STATIONS.find(s => s.id === this.currentId) ?? null; }
  getStations() { return RADIO_STATIONS; }

  play(stationId) {
    const station = RADIO_STATIONS.find(s => s.id === stationId);
    if (!station) return;

    // Stop current
    this.audio.pause();
    this.audio.src = "";

    this.currentId    = stationId;
    this.isPlaying    = false;
    this._fallbackIdx = 0;
    this._currentStation = station;

    this._notify();
    this._loadStream(station.streamUrl);
  }

  _loadStream(url) {
    this.audio.src = url;
    this.audio.load();
    this.audio.play().catch(() => this._tryFallback());
  }

  _tryFallback() {
    const station = this._currentStation;
    if (!station) return;
    const fallbacks = station.fallbacks || [];
    if (this._fallbackIdx < fallbacks.length) {
      const url = fallbacks[this._fallbackIdx++];
      console.warn(`[RadioPlayer] Falling back to: ${url}`);
      this._loadStream(url);
    } else {
      console.error(`[RadioPlayer] All streams failed for ${station.name}`);
      this.isPlaying = false;
      this._notify();
    }
  }

  stop() {
    this.audio.pause();
    this.audio.src = "";
    this.currentId = null;
    this.isPlaying = false;
    this._notify();
  }

  togglePlay() {
    if (!this.currentId) return;
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(() => {});
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.volume;
    if (window.__musicStore) window.__musicStore.setVolume(this.volume);
    this._notify();
  }
}

// Singleton
window.__radioPlayer = window.__radioPlayer || new RadioPlayer();
