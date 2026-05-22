"use strict";
// ============================================================
//  Music App — music-store.js
//  Data layer: artists, albums, songs, playback state, playlists
//  All song audio loads from: apps/music/songs/<filename>.mp3
//  All artwork loads from:    apps/music/artwork/<filename>.jpg
// ============================================================

const MUSIC_STORAGE_KEY = "macos_music_v1";

// ── Colour palette for artist cards ──
const ARTIST_COLORS = {
  "kanye":   { from: "#1a1a2e", to: "#16213e", accent: "#e94560" },
  "drake":   { from: "#0f0c29", to: "#302b63", accent: "#c8a96e" },
  "bob":     { from: "#1b4332", to: "#2d6a4f", accent: "#ffd166" },
  "weeknd":  { from: "#1a0a0a", to: "#3d0000", accent: "#ff4d4d" },
  "selena":  { from: "#1a0533", to: "#4a0e5e", accent: "#e040fb" },
};

// ── Catalogue ──
const MUSIC_CATALOGUE = {
  artists: [
    {
      id: "kanye",
      name: "Kanye West",
      emoji: "👑",
      color: ARTIST_COLORS.kanye,
      bio: "Rapper, record producer and fashion designer from Chicago.",
      artwork: "kanye-artist.jpg",
      albums: ["donda", "mbdtf"],
    },
    {
      id: "drake",
      name: "Drake",
      emoji: "🦉",
      color: ARTIST_COLORS.drake,
      bio: "Canadian rapper, singer and songwriter from Toronto.",
      artwork: "drake-artist.jpg",
      albums: ["certified-lover-boy", "take-care"],
    },
    {
      id: "bob",
      name: "Bob Marley",
      emoji: "🌿",
      color: ARTIST_COLORS.bob,
      bio: "Jamaican singer and musician, pioneer of reggae.",
      artwork: "bob-artist.jpg",
      albums: ["exodus", "legend"],
    },
    {
      id: "weeknd",
      name: "The Weeknd",
      emoji: "🌙",
      color: ARTIST_COLORS.weeknd,
      bio: "Canadian singer and record producer from Toronto.",
      artwork: "weeknd-artist.jpg",
      albums: ["dawn-fm", "after-hours"],
    },
    {
      id: "selena",
      name: "Selena Gomez",
      emoji: "💜",
      color: ARTIST_COLORS.selena,
      bio: "American singer, actress and producer from Texas.",
      artwork: "selena-artist.jpg",
      albums: ["rare", "revival"],
    },
  ],

  albums: [
    // ── Kanye West ──
    {
      id: "donda",
      artistId: "kanye",
      title: "Donda",
      year: 2021,
      artwork: "donda.jpg",
      color: "#1a1a2e",
      songs: [
        { id: "donda-01", track: 1,  title: "Donda Chant",              duration: 181, file: "kanye-donda-chant.mp3" },
        { id: "donda-02", track: 2,  title: "Jail",                     duration: 261, file: "kanye-jail.mp3" },
        { id: "donda-03", track: 3,  title: "God Breathed",             duration: 249, file: "kanye-god-breathed.mp3" },
        { id: "donda-04", track: 4,  title: "Off the Grid",             duration: 330, file: "kanye-off-the-grid.mp3" },
        { id: "donda-05", track: 5,  title: "Hurricane",                duration: 218, file: "kanye-hurricane.mp3" },
        { id: "donda-06", track: 6,  title: "Praise God",               duration: 222, file: "kanye-praise-god.mp3" },
        { id: "donda-07", track: 7,  title: "Jonah",                    duration: 210, file: "kanye-jonah.mp3" },
        { id: "donda-08", track: 8,  title: "Ok Ok",                    duration: 177, file: "kanye-ok-ok.mp3" },
        { id: "donda-09", track: 9,  title: "Junya",                    duration: 174, file: "kanye-junya.mp3" },
        { id: "donda-10", track: 10, title: "Believe What I Say",       duration: 196, file: "kanye-believe-what-i-say.mp3" },
        { id: "donda-11", track: 11, title: "24",                       duration: 186, file: "kanye-24.mp3" },
        { id: "donda-12", track: 12, title: "Remote Control",           duration: 210, file: "kanye-remote-control.mp3" },
        { id: "donda-13", track: 13, title: "Moon",                     duration: 140, file: "kanye-moon.mp3" },
        { id: "donda-14", track: 14, title: "Heaven and Hell",          duration: 195, file: "kanye-heaven-and-hell.mp3" },
        { id: "donda-15", track: 15, title: "Donda",                    duration: 312, file: "kanye-donda.mp3" },
        { id: "donda-16", track: 16, title: "Pure Souls",               duration: 334, file: "kanye-pure-souls.mp3" },
        { id: "donda-17", track: 17, title: "Come to Life",             duration: 358, file: "kanye-come-to-life.mp3" },
        { id: "donda-18", track: 18, title: "No Child Left Behind",     duration: 175, file: "kanye-no-child-left-behind.mp3" },
      ],
    },
    {
      id: "mbdtf",
      artistId: "kanye",
      title: "My Beautiful Dark Twisted Fantasy",
      year: 2010,
      artwork: "mbdtf.jpg",
      color: "#1c0d0d",
      songs: [
        { id: "mbdtf-01", track: 1,  title: "Dark Fantasy",             duration: 260, file: "kanye-dark-fantasy.mp3" },
        { id: "mbdtf-02", track: 2,  title: "Gorgeous",                 duration: 340, file: "kanye-gorgeous.mp3" },
        { id: "mbdtf-03", track: 3,  title: "POWER",                    duration: 292, file: "kanye-power.mp3" },
        { id: "mbdtf-04", track: 4,  title: "All of the Lights (Interlude)", duration: 59, file: "kanye-all-of-the-lights-interlude.mp3" },
        { id: "mbdtf-05", track: 5,  title: "All of the Lights",        duration: 298, file: "kanye-all-of-the-lights.mp3" },
        { id: "mbdtf-06", track: 6,  title: "Monster",                  duration: 360, file: "kanye-monster.mp3" },
        { id: "mbdtf-07", track: 7,  title: "So Appalled",              duration: 383, file: "kanye-so-appalled.mp3" },
        { id: "mbdtf-08", track: 8,  title: "Devil in a New Dress",     duration: 340, file: "kanye-devil-in-a-new-dress.mp3" },
        { id: "mbdtf-09", track: 9,  title: "Runaway",                  duration: 549, file: "kanye-runaway.mp3" },
        { id: "mbdtf-10", track: 10, title: "Hell of a Life",           duration: 311, file: "kanye-hell-of-a-life.mp3" },
        { id: "mbdtf-11", track: 11, title: "Blame Game",               duration: 479, file: "kanye-blame-game.mp3" },
        { id: "mbdtf-12", track: 12, title: "Lost in the World",        duration: 255, file: "kanye-lost-in-the-world.mp3" },
        { id: "mbdtf-13", track: 13, title: "Who Will Survive in America", duration: 130, file: "kanye-who-will-survive.mp3" },
      ],
    },

    // ── Drake ──
    {
      id: "certified-lover-boy",
      artistId: "drake",
      title: "Certified Lover Boy",
      year: 2021,
      artwork: "clb.jpg",
      color: "#0f0c29",
      songs: [
        { id: "clb-01", track: 1,  title: "Champagne Poetry",           duration: 340, file: "drake-champagne-poetry.mp3" },
        { id: "clb-02", track: 2,  title: "TSU",                        duration: 205, file: "drake-tsu.mp3" },
        { id: "clb-03", track: 3,  title: "Way 2 Sexy",                 duration: 233, file: "drake-way-2-sexy.mp3" },
        { id: "clb-04", track: 4,  title: "TSU",                        duration: 200, file: "drake-pound-cake.mp3" },
        { id: "clb-05", track: 5,  title: "Pipe Down",                  duration: 262, file: "drake-pipe-down.mp3" },
        { id: "clb-06", track: 6,  title: "Wants and Needs",            duration: 191, file: "drake-wants-and-needs.mp3" },
        { id: "clb-07", track: 7,  title: "Loves Me Not",               duration: 253, file: "drake-loves-me-not.mp3" },
        { id: "clb-08", track: 8,  title: "In the Bible",               duration: 254, file: "drake-in-the-bible.mp3" },
        { id: "clb-09", track: 9,  title: "No Friends in the Industry", duration: 210, file: "drake-no-friends.mp3" },
        { id: "clb-10", track: 10, title: "Knife Talk",                 duration: 196, file: "drake-knife-talk.mp3" },
        { id: "clb-11", track: 11, title: "7am on Bridle Path",         duration: 291, file: "drake-7am-bridle-path.mp3" },
        { id: "clb-12", track: 12, title: "Fair Trade",                 duration: 255, file: "drake-fair-trade.mp3" },
        { id: "clb-13", track: 13, title: "The Remorse",                duration: 344, file: "drake-the-remorse.mp3" },
        { id: "clb-14", track: 14, title: "N 2 Deep",                   duration: 238, file: "drake-n-2-deep.mp3" },
        { id: "clb-15", track: 15, title: "Papi's Home",                duration: 187, file: "drake-papis-home.mp3" },
        { id: "clb-16", track: 16, title: "Girls Want Girls",           duration: 208, file: "drake-girls-want-girls.mp3" },
        { id: "clb-17", track: 17, title: "Love All",                   duration: 220, file: "drake-love-all.mp3" },
        { id: "clb-18", track: 18, title: "Race My Mind",               duration: 196, file: "drake-race-my-mind.mp3" },
        { id: "clb-19", track: 19, title: "Fountains",                  duration: 224, file: "drake-fountains.mp3" },
        { id: "clb-20", track: 20, title: "Get Along Better",           duration: 176, file: "drake-get-along-better.mp3" },
        { id: "clb-21", track: 21, title: "You Only Live Twice",        duration: 245, file: "drake-yolo.mp3" },
        { id: "clb-22", track: 22, title: "IMY2",                       duration: 217, file: "drake-imy2.mp3" },
        { id: "clb-23", track: 23, title: "Fucking Fans",               duration: 272, file: "drake-fucking-fans.mp3" },
      ],
    },
    {
      id: "take-care",
      artistId: "drake",
      title: "Take Care",
      year: 2011,
      artwork: "take-care.jpg",
      color: "#111827",
      songs: [
        { id: "tc-01", track: 1,  title: "Over My Dead Body",           duration: 266, file: "drake-over-my-dead-body.mp3" },
        { id: "tc-02", track: 2,  title: "Shot for Me",                 duration: 254, file: "drake-shot-for-me.mp3" },
        { id: "tc-03", track: 3,  title: "Headlines",                   duration: 224, file: "drake-headlines.mp3" },
        { id: "tc-04", track: 4,  title: "Crew Love",                   duration: 293, file: "drake-crew-love.mp3" },
        { id: "tc-05", track: 5,  title: "Take Care",                   duration: 255, file: "drake-take-care.mp3" },
        { id: "tc-06", track: 6,  title: "Marvins Room",                duration: 318, file: "drake-marvins-room.mp3" },
        { id: "tc-07", track: 7,  title: "Buried Alive Interlude",      duration: 232, file: "drake-buried-alive.mp3" },
        { id: "tc-08", track: 8,  title: "Under Ground Kings",          duration: 259, file: "drake-underground-kings.mp3" },
        { id: "tc-09", track: 9,  title: "We'll Be Fine",               duration: 261, file: "drake-well-be-fine.mp3" },
        { id: "tc-10", track: 10, title: "Make Me Proud",               duration: 225, file: "drake-make-me-proud.mp3" },
        { id: "tc-11", track: 11, title: "Lord Knows",                  duration: 300, file: "drake-lord-knows.mp3" },
        { id: "tc-12", track: 12, title: "Cameras / Good Ones Go",      duration: 298, file: "drake-cameras.mp3" },
        { id: "tc-13", track: 13, title: "Doing It Wrong",              duration: 285, file: "drake-doing-it-wrong.mp3" },
        { id: "tc-14", track: 14, title: "The Real Her",                duration: 249, file: "drake-the-real-her.mp3" },
        { id: "tc-15", track: 15, title: "Look What You've Done",       duration: 413, file: "drake-look-what-youve-done.mp3" },
        { id: "tc-16", track: 16, title: "HYFR",                        duration: 218, file: "drake-hyfr.mp3" },
        { id: "tc-17", track: 17, title: "Practice",                    duration: 199, file: "drake-practice.mp3" },
        { id: "tc-18", track: 18, title: "The Motto",                   duration: 196, file: "drake-the-motto.mp3" },
        { id: "tc-19", track: 19, title: "Hate Sleeping Alone",         duration: 228, file: "drake-hate-sleeping-alone.mp3" },
        { id: "tc-20", track: 20, title: "Look What You've Done (Bonus)", duration: 260, file: "drake-bonus.mp3" },
      ],
    },

    // ── Bob Marley ──
    {
      id: "exodus",
      artistId: "bob",
      title: "Exodus",
      year: 1977,
      artwork: "exodus.jpg",
      color: "#1b4332",
      songs: [
        { id: "ex-01", track: 1,  title: "Natural Mystic",              duration: 256, file: "bob-natural-mystic.mp3" },
        { id: "ex-02", track: 2,  title: "So Much Things to Say",       duration: 217, file: "bob-so-much-things.mp3" },
        { id: "ex-03", track: 3,  title: "Guiltiness",                  duration: 199, file: "bob-guiltiness.mp3" },
        { id: "ex-04", track: 4,  title: "The Heathen",                 duration: 230, file: "bob-the-heathen.mp3" },
        { id: "ex-05", track: 5,  title: "Exodus",                      duration: 466, file: "bob-exodus.mp3" },
        { id: "ex-06", track: 6,  title: "Jamming",                     duration: 223, file: "bob-jamming.mp3" },
        { id: "ex-07", track: 7,  title: "Waiting in Vain",             duration: 277, file: "bob-waiting-in-vain.mp3" },
        { id: "ex-08", track: 8,  title: "Turn Your Lights Down Low",   duration: 222, file: "bob-turn-your-lights.mp3" },
        { id: "ex-09", track: 9,  title: "Three Little Birds",          duration: 180, file: "bob-three-little-birds.mp3" },
        { id: "ex-10", track: 10, title: "One Love / People Get Ready", duration: 174, file: "bob-one-love.mp3" },
      ],
    },
    {
      id: "legend",
      artistId: "bob",
      title: "Legend",
      year: 1984,
      artwork: "legend.jpg",
      color: "#2d6a4f",
      songs: [
        { id: "lg-01", track: 1,  title: "Is This Love",                duration: 235, file: "bob-is-this-love.mp3" },
        { id: "lg-02", track: 2,  title: "No Woman, No Cry",            duration: 252, file: "bob-no-woman-no-cry.mp3" },
        { id: "lg-03", track: 3,  title: "Could You Be Loved",          duration: 237, file: "bob-could-you-be-loved.mp3" },
        { id: "lg-04", track: 4,  title: "Three Little Birds",          duration: 178, file: "bob-three-little-birds-2.mp3" },
        { id: "lg-05", track: 5,  title: "Buffalo Soldier",             duration: 260, file: "bob-buffalo-soldier.mp3" },
        { id: "lg-06", track: 6,  title: "Get Up Stand Up",             duration: 222, file: "bob-get-up-stand-up.mp3" },
        { id: "lg-07", track: 7,  title: "Stir It Up",                  duration: 226, file: "bob-stir-it-up.mp3" },
        { id: "lg-08", track: 8,  title: "Redemption Song",             duration: 227, file: "bob-redemption-song.mp3" },
        { id: "lg-09", track: 9,  title: "Satisfy My Soul",             duration: 240, file: "bob-satisfy-my-soul.mp3" },
        { id: "lg-10", track: 10, title: "Exodus",                      duration: 467, file: "bob-exodus-2.mp3" },
        { id: "lg-11", track: 11, title: "Jamming",                     duration: 222, file: "bob-jamming-2.mp3" },
        { id: "lg-12", track: 12, title: "Waiting in Vain",             duration: 279, file: "bob-waiting-in-vain-2.mp3" },
        { id: "lg-13", track: 13, title: "Punky Reggae Party",          duration: 378, file: "bob-punky-reggae-party.mp3" },
        { id: "lg-14", track: 14, title: "One Love / People Get Ready", duration: 175, file: "bob-one-love-2.mp3" },
      ],
    },

    // ── The Weeknd ──
    {
      id: "dawn-fm",
      artistId: "weeknd",
      title: "Dawn FM",
      year: 2022,
      artwork: "dawn-fm.jpg",
      color: "#1a0a0a",
      songs: [
        { id: "df-01", track: 1,  title: "Dawn FM",                     duration: 100, file: "weeknd-dawn-fm.mp3" },
        { id: "df-02", track: 2,  title: "Gasoline",                    duration: 215, file: "weeknd-gasoline.mp3" },
        { id: "df-03", track: 3,  title: "How Do I Make You Love Me?",  duration: 204, file: "weeknd-how-do-i-make-you.mp3" },
        { id: "df-04", track: 4,  title: "Take My Breath",              duration: 341, file: "weeknd-take-my-breath.mp3" },
        { id: "df-05", track: 5,  title: "Sacrifice",                   duration: 190, file: "weeknd-sacrifice.mp3" },
        { id: "df-06", track: 6,  title: "A Tale By Quincy",            duration: 71,  file: "weeknd-a-tale-by-quincy.mp3" },
        { id: "df-07", track: 7,  title: "Out of Time",                 duration: 215, file: "weeknd-out-of-time.mp3" },
        { id: "df-08", track: 8,  title: "Here We Go... Again",         duration: 259, file: "weeknd-here-we-go-again.mp3" },
        { id: "df-09", track: 9,  title: "Best Friends",                duration: 153, file: "weeknd-best-friends.mp3" },
        { id: "df-10", track: 10, title: "Is There Someone Else?",      duration: 197, file: "weeknd-is-there-someone-else.mp3" },
        { id: "df-11", track: 11, title: "Starving",                    duration: 155, file: "weeknd-starving.mp3" },
        { id: "df-12", track: 12, title: "Every Angel Is Terrifying",   duration: 76,  file: "weeknd-every-angel.mp3" },
        { id: "df-13", track: 13, title: "Don't Break My Heart",        duration: 214, file: "weeknd-dont-break-my-heart.mp3" },
        { id: "df-14", track: 14, title: "I Heard You're Married",      duration: 290, file: "weeknd-i-heard-youre-married.mp3" },
        { id: "df-15", track: 15, title: "Less Than Zero",              duration: 244, file: "weeknd-less-than-zero.mp3" },
        { id: "df-16", track: 16, title: "Phantom Regret by Jim",       duration: 223, file: "weeknd-phantom-regret.mp3" },
      ],
    },
    {
      id: "after-hours",
      artistId: "weeknd",
      title: "After Hours",
      year: 2020,
      artwork: "after-hours.jpg",
      color: "#1a0000",
      songs: [
        { id: "ah-01", track: 1,  title: "Alone Again",                 duration: 251, file: "weeknd-alone-again.mp3" },
        { id: "ah-02", track: 2,  title: "Too Late",                    duration: 237, file: "weeknd-too-late.mp3" },
        { id: "ah-03", track: 3,  title: "Hardest to Love",             duration: 213, file: "weeknd-hardest-to-love.mp3" },
        { id: "ah-04", track: 4,  title: "Scared to Live",              duration: 199, file: "weeknd-scared-to-live.mp3" },
        { id: "ah-05", track: 5,  title: "Snowchild",                   duration: 261, file: "weeknd-snowchild.mp3" },
        { id: "ah-06", track: 6,  title: "Escape from LA",              duration: 381, file: "weeknd-escape-from-la.mp3" },
        { id: "ah-07", track: 7,  title: "Heartless",                   duration: 198, file: "weeknd-heartless.mp3" },
        { id: "ah-08", track: 8,  title: "Faith",                       duration: 374, file: "weeknd-faith.mp3" },
        { id: "ah-09", track: 9,  title: "Blinding Lights",             duration: 200, file: "weeknd-blinding-lights.mp3" },
        { id: "ah-10", track: 10, title: "In Your Eyes",                duration: 237, file: "weeknd-in-your-eyes.mp3" },
        { id: "ah-11", track: 11, title: "Save Your Tears",             duration: 215, file: "weeknd-save-your-tears.mp3" },
        { id: "ah-12", track: 12, title: "Repeat After Me (Interlude)", duration: 225, file: "weeknd-repeat-after-me.mp3" },
        { id: "ah-13", track: 13, title: "After Hours",                 duration: 361, file: "weeknd-after-hours.mp3" },
      ],
    },

    // ── Selena Gomez ──
    {
      id: "rare",
      artistId: "selena",
      title: "Rare",
      year: 2020,
      artwork: "rare.jpg",
      color: "#1a0533",
      songs: [
        { id: "rr-01", track: 1,  title: "Rare",                        duration: 193, file: "selena-rare.mp3" },
        { id: "rr-02", track: 2,  title: "Dance Again",                 duration: 202, file: "selena-dance-again.mp3" },
        { id: "rr-03", track: 3,  title: "Look at Her Now",             duration: 173, file: "selena-look-at-her-now.mp3" },
        { id: "rr-04", track: 4,  title: "Lose You to Love Me",         duration: 215, file: "selena-lose-you-to-love-me.mp3" },
        { id: "rr-05", track: 5,  title: "Ring",                        duration: 185, file: "selena-ring.mp3" },
        { id: "rr-06", track: 6,  title: "Vulnerable",                  duration: 207, file: "selena-vulnerable.mp3" },
        { id: "rr-07", track: 7,  title: "People You Know",             duration: 197, file: "selena-people-you-know.mp3" },
        { id: "rr-08", track: 8,  title: "Let Me Get Me",               duration: 185, file: "selena-let-me-get-me.mp3" },
        { id: "rr-09", track: 9,  title: "Crowded Room",                duration: 211, file: "selena-crowded-room.mp3" },
        { id: "rr-10", track: 10, title: "Kinda Crazy",                 duration: 183, file: "selena-kinda-crazy.mp3" },
        { id: "rr-11", track: 11, title: "Fun",                         duration: 191, file: "selena-fun.mp3" },
        { id: "rr-12", track: 12, title: "A Sweeter Place",             duration: 225, file: "selena-a-sweeter-place.mp3" },
        { id: "rr-13", track: 13, title: "Cut You Off",                 duration: 196, file: "selena-cut-you-off.mp3" },
      ],
    },
    {
      id: "revival",
      artistId: "selena",
      title: "Revival",
      year: 2015,
      artwork: "revival.jpg",
      color: "#3d0063",
      songs: [
        { id: "rv-01", track: 1,  title: "Revival",                     duration: 87,  file: "selena-revival-intro.mp3" },
        { id: "rv-02", track: 2,  title: "Kill Em with Kindness",       duration: 184, file: "selena-kill-em.mp3" },
        { id: "rv-03", track: 3,  title: "Same Old Love",               duration: 226, file: "selena-same-old-love.mp3" },
        { id: "rv-04", track: 4,  title: "Hands to Myself",             duration: 200, file: "selena-hands-to-myself.mp3" },
        { id: "rv-05", track: 5,  title: "Good for You",                duration: 215, file: "selena-good-for-you.mp3" },
        { id: "rv-06", track: 6,  title: "Camouflage",                  duration: 205, file: "selena-camouflage.mp3" },
        { id: "rv-07", track: 7,  title: "Fetish",                      duration: 210, file: "selena-fetish.mp3" },
        { id: "rv-08", track: 8,  title: "Bad Liar",                    duration: 218, file: "selena-bad-liar.mp3" },
        { id: "rv-09", track: 9,  title: "Wolves",                      duration: 184, file: "selena-wolves.mp3" },
        { id: "rv-10", track: 10, title: "It Ain't Me",                 duration: 205, file: "selena-it-aint-me.mp3" },
        { id: "rv-11", track: 11, title: "Naturally",                   duration: 222, file: "selena-naturally.mp3" },
        { id: "rv-12", track: 12, title: "The Heart Wants What It Wants", duration: 231, file: "selena-heart-wants.mp3" },
        { id: "rv-13", track: 13, title: "Nobody",                      duration: 205, file: "selena-nobody.mp3" },
      ],
    },
  ],

  // ── One curated playlist ──
  playlists: [
    {
      id: "my-favourites",
      title: "Favourite Songs",
      description: "Your hand-picked favourites",
      artwork: null,
      songIds: [
        "mbdtf-09", // Runaway
        "ah-09",    // Blinding Lights
        "df-05",    // Sacrifice
        "tc-05",    // Take Care
        "ex-05",    // Exodus
        "lg-01",    // Is This Love
        "rv-05",    // Good for You
        "rr-04",    // Lose You to Love Me
        "clb-03",   // Way 2 Sexy
        "donda-05", // Hurricane
        "mbdtf-03", // POWER
        "ah-13",    // After Hours
      ],
    },
  ],
};

// ── Flatten all songs for O(1) lookup ──
const ALL_SONGS_MAP = new Map();
const ALL_ALBUMS_MAP = new Map();
const ALL_ARTISTS_MAP = new Map();

MUSIC_CATALOGUE.albums.forEach(album => {
  ALL_ALBUMS_MAP.set(album.id, album);
  album.songs.forEach(song => {
    ALL_SONGS_MAP.set(song.id, { ...song, albumId: album.id, artistId: album.artistId });
  });
});
MUSIC_CATALOGUE.artists.forEach(a => ALL_ARTISTS_MAP.set(a.id, a));

// ── Store ──
class MusicStore {
  constructor() {
    this.listeners = [];
    const saved = this._load();
    // Playback state (never persisted across sessions)
    this.state = {
      currentSongId: null,
      isPlaying: false,
      progress: 0,       // 0-1
      volume: 0.8,
      shuffle: false,
      repeat: "none",    // "none" | "one" | "all"
      queue: [],         // ordered song ids
      queueIndex: -1,
    };
    // Persisted prefs
    this.prefs = {
      likedSongs: new Set(saved.likedSongs || []),
      recentlyPlayed: saved.recentlyPlayed || [],   // song ids, max 20
      volume: saved.volume ?? 0.8,
    };
    this.state.volume = this.prefs.volume;
    // Playlists (mutable copy)
    this.playlists = JSON.parse(JSON.stringify(MUSIC_CATALOGUE.playlists));
    const savedPL = saved.playlistSongIds;
    if (savedPL) {
      this.playlists.forEach(pl => {
        if (savedPL[pl.id]) pl.songIds = savedPL[pl.id];
      });
    }
  }

  // ── Subscriptions ──
  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }
  notify() {
    this._save();
    this.listeners.forEach(fn => fn());
  }

  // ── Catalogue accessors ──
  getArtists()              { return MUSIC_CATALOGUE.artists; }
  getArtist(id)             { return ALL_ARTISTS_MAP.get(id); }
  getAlbum(id)              { return ALL_ALBUMS_MAP.get(id); }
  getAlbumsForArtist(aId)   { return MUSIC_CATALOGUE.albums.filter(a => a.artistId === aId); }
  getAllAlbums()             { return MUSIC_CATALOGUE.albums; }
  getSong(id)               { return ALL_SONGS_MAP.get(id); }
  getAllSongs()              { return [...ALL_SONGS_MAP.values()]; }
  getAlbumSongs(albumId)    { return ALL_ALBUMS_MAP.get(albumId)?.songs.map(s => ALL_SONGS_MAP.get(s.id)).filter(Boolean) ?? []; }
  getPlaylists()            { return this.playlists; }
  getPlaylist(id)           { return this.playlists.find(p => p.id === id); }
  getPlaylistSongs(id)      {
    const pl = this.getPlaylist(id);
    if (!pl) return [];
    return pl.songIds.map(sid => ALL_SONGS_MAP.get(sid)).filter(Boolean);
  }
  getRecentlyAdded() {
    // All songs sorted by album year desc, top 20
    return [...ALL_SONGS_MAP.values()]
      .sort((a, b) => (ALL_ALBUMS_MAP.get(b.albumId)?.year ?? 0) - (ALL_ALBUMS_MAP.get(a.albumId)?.year ?? 0))
      .slice(0, 20);
  }
  getRecentlyPlayed() {
    return this.prefs.recentlyPlayed.map(id => ALL_SONGS_MAP.get(id)).filter(Boolean);
  }
  searchSongs(q) {
    const lq = q.toLowerCase();
    return [...ALL_SONGS_MAP.values()].filter(s =>
      s.title.toLowerCase().includes(lq) ||
      (ALL_ARTISTS_MAP.get(s.artistId)?.name.toLowerCase().includes(lq)) ||
      (ALL_ALBUMS_MAP.get(s.albumId)?.title.toLowerCase().includes(lq))
    );
  }

  // ── Likes ──
  isLiked(songId)    { return this.prefs.likedSongs.has(songId); }
  toggleLike(songId) {
    if (this.prefs.likedSongs.has(songId)) this.prefs.likedSongs.delete(songId);
    else this.prefs.likedSongs.add(songId);
    this.notify();
  }
  getLikedSongs() {
    return [...this.prefs.likedSongs].map(id => ALL_SONGS_MAP.get(id)).filter(Boolean);
  }

  // ── Playlist management ──
  addToPlaylist(playlistId, songId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (pl && !pl.songIds.includes(songId)) { pl.songIds.push(songId); this.notify(); }
  }
  removeFromPlaylist(playlistId, songId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (pl) { pl.songIds = pl.songIds.filter(id => id !== songId); this.notify(); }
  }

  // ── Playback ──
  playSong(songId, queueSongIds = null) {
    const song = ALL_SONGS_MAP.get(songId);
    if (!song) return;
    this.state.currentSongId = songId;
    this.state.isPlaying = true;
    this.state.progress = 0;
    // Build queue
    if (queueSongIds) {
      this.state.queue = queueSongIds;
      this.state.queueIndex = queueSongIds.indexOf(songId);
    } else {
      const albumSongs = ALL_ALBUMS_MAP.get(song.albumId)?.songs.map(s => s.id) ?? [songId];
      this.state.queue = albumSongs;
      this.state.queueIndex = albumSongs.indexOf(songId);
    }
    // Track recently played
    this.prefs.recentlyPlayed = [songId, ...this.prefs.recentlyPlayed.filter(id => id !== songId)].slice(0, 20);
    this.notify();
  }
  togglePlay() {
    if (!this.state.currentSongId) return;
    this.state.isPlaying = !this.state.isPlaying;
    this.notify();
  }
  nextSong() {
    const { queue, queueIndex, shuffle, repeat } = this.state;
    if (!queue.length) return;
    let next;
    if (repeat === "one") {
      next = queueIndex;
    } else if (shuffle) {
      next = Math.floor(Math.random() * queue.length);
    } else {
      next = queueIndex + 1;
      if (next >= queue.length) {
        if (repeat === "all") next = 0;
        else return;
      }
    }
    this.state.queueIndex = next;
    this.playSong(queue[next], queue);
  }
  prevSong() {
    const { queue, queueIndex } = this.state;
    if (!queue.length) return;
    const prev = Math.max(0, queueIndex - 1);
    this.state.queueIndex = prev;
    this.playSong(queue[prev], queue);
  }
  setProgress(val) { this.state.progress = Math.max(0, Math.min(1, val)); this.notify(); }
  setVolume(val)   { this.state.volume = Math.max(0, Math.min(1, val)); this.prefs.volume = this.state.volume; this.notify(); }
  toggleShuffle()  { this.state.shuffle = !this.state.shuffle; this.notify(); }
  cycleRepeat()    {
    const modes = ["none", "all", "one"];
    this.state.repeat = modes[(modes.indexOf(this.state.repeat) + 1) % modes.length];
    this.notify();
  }

  // ── Helpers ──
  getArtworkUrl(albumId) {
    const album = ALL_ALBUMS_MAP.get(albumId);
    if (!album) return null;
    return `apps/music/artwork/${album.artwork}`;
  }
  getArtistArtworkUrl(artistId) {
    const artist = ALL_ARTISTS_MAP.get(artistId);
    if (!artist) return null;
    return `apps/music/artwork/${artist.artwork}`;
  }
  getSongAudioUrl(songId) {
    const song = ALL_SONGS_MAP.get(songId);
    if (!song) return null;
    return `apps/music/songs/${song.file}`;
  }
  formatDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  getCurrentSong()  { return this.state.currentSongId ? ALL_SONGS_MAP.get(this.state.currentSongId) : null; }
  getCurrentAlbum() {
    const s = this.getCurrentSong();
    return s ? ALL_ALBUMS_MAP.get(s.albumId) : null;
  }

  // ── Persistence ──
  _load() {
    try {
      const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  _save() {
    try {
      const playlistSongIds = {};
      this.playlists.forEach(pl => { playlistSongIds[pl.id] = pl.songIds; });
      localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify({
        likedSongs: [...this.prefs.likedSongs],
        recentlyPlayed: this.prefs.recentlyPlayed,
        volume: this.prefs.volume,
        playlistSongIds,
      }));
    } catch {}
  }
}

// Singleton
window.__musicStore = window.__musicStore || new MusicStore();
 
