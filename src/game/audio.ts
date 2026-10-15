/**
 * Nightfall Chronicles - Gothic Web Audio Engine
 * Provides authentic Castlevania-style procedural BGM (organ, bass, countermelody, chiptune percussion)
 * and rich layered SFX without external audio file dependencies.
 */

const NOTES: Record<string, number> = {
  // Octave 2
  C2: 65.41, "C#2": 69.30, Db2: 69.30, D2: 73.42, "D#2": 77.78, Eb2: 77.78,
  E2: 82.41, F2: 87.31, "F#2": 92.50, Gb2: 92.50, G2: 98.00, "G#2": 103.83,
  Ab2: 103.83, A2: 110.00, "A#2": 116.54, Bb2: 116.54, B2: 123.47,

  // Octave 3
  C3: 130.81, "C#3": 138.59, Db3: 138.59, D3: 146.83, "D#3": 155.56, Eb3: 155.56,
  E3: 164.81, F3: 174.61, "F#3": 185.00, Gb3: 185.00, G3: 196.00, "G#3": 207.65,
  Ab3: 207.65, A3: 220.00, "A#3": 233.08, Bb3: 233.08, B3: 246.94,

  // Octave 4
  C4: 261.63, "C#4": 277.18, Db4: 277.18, D4: 293.66, "D#4": 311.13, Eb4: 311.13,
  E4: 329.63, F4: 349.23, "F#4": 369.99, Gb4: 369.99, G4: 392.00, "G#4": 415.30,
  Ab4: 415.30, A4: 440.00, "A#4": 466.16, Bb4: 466.16, B4: 493.88,

  // Octave 5
  C5: 523.25, "C#5": 554.37, Db5: 554.37, D5: 587.33, "D#5": 622.25, Eb5: 622.25,
  E5: 659.25, F5: 698.46, "F#5": 739.99, Gb5: 739.99, G5: 783.99, "G#5": 830.61,
  Ab5: 830.61, A5: 880.00, "A#5": 932.33, Bb5: 932.33, B5: 987.77,

  // Octave 6
  C6: 1046.50, "C#6": 1108.73, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00,

  // Rests
  "-": 0, "0": 0,
};

export type TrackName =
  | "title"
  | "castle"
  | "boss"
  | "victory"
  | "gameover"
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "stage5"
  | "stage6"
  | "stage7"
  | "none";

export const STAGE_TRACK_URLS: Record<number, string> = {
  1: "/audio/stage-1.mp3",
  2: "/audio/stage-2.mp3",
  3: "/audio/stage-3.mp3",
  4: "/audio/stage-4.mp3",
  5: "/audio/stage-5.mp3",
  6: "/audio/stage-6.mp3",
  7: "/audio/stage-7.mp3", // Sinister horror (Fase 7 - Sala do Trono do Mestre Drácula)
};

type SfxKind =
  | "slash"
  | "slashHeavy"
  | "slice"
  | "chargeWind"
  | "chargeFire"
  | "spell"
  | "dash"
  | "jump"
  | "doubleJump"
  | "wallJump"
  | "pogo"
  | "hurt"
  | "enemyHurt"
  | "enemyDie"
  | "bossHurt"
  | "gateOpen"
  | "relic"
  | "itemLife"
  | "itemHeal"
  | "itemMana"
  | "revive"
  | "thunder"
  | "bell";

interface SequencePattern {
  bpm: number;
  lead: string[];       // 16th or 8th steps
  harmony?: string[];   // Counterpoint chords or intervals
  bass: string[];       // Bassline
  drums?: string[];     // Drum pattern: 'K'=Kick, 'S'=Snare, 'H'=HiHat, '-'=Rest
  stepDuration: 16 | 8; // Steps per measure (16 = sixteenth notes, 8 = eighth notes)
  loop: boolean;
}

// -------------------------------------------------------------
// MUSIC COMPOSITIONS (Castlevania-style Gothic Themes)
// -------------------------------------------------------------

const TRACKS: Partial<Record<Exclude<TrackName, "none">, SequencePattern>> = {
  // Menu / Title: "Nocturne Prelude" - Dark gothic organ and solemn counterpoint (D Minor, 100 BPM)
  title: {
    bpm: 100,
    stepDuration: 8,
    loop: true,
    lead: [
      "D4", "F4", "A4", "D5", "C#5", "A4", "E4", "F4",
      "D4", "F4", "Bb4", "D5", "C5", "A4", "F4", "E4",
      "D4", "E4", "F4", "G4", "A4", "Bb4", "A4", "G4",
      "F4", "E4", "D4", "C#4", "D4", "-", "-", "-",
      "A4", "C5", "E5", "G5", "F5", "D5", "A4", "F4",
      "Bb4", "D5", "F5", "A5", "G5", "E5", "C#5", "A4",
      "D5", "C#5", "D5", "F5", "E5", "D5", "C#5", "A4",
      "D4", "F4", "A4", "D5", "D4", "-", "-", "-",
    ],
    harmony: [
      "A3", "-", "D4", "-", "E4", "-", "C#4", "-",
      "F3", "-", "Bb3", "-", "E4", "-", "C4", "-",
      "D3", "-", "F3", "-", "G3", "-", "E3", "-",
      "D3", "-", "A3", "-", "D4", "-", "-", "-",
      "F3", "-", "A3", "-", "D4", "-", "F4", "-",
      "G3", "-", "Bb3", "-", "E4", "-", "G4", "-",
      "F3", "-", "A3", "-", "G3", "-", "E3", "-",
      "D3", "-", "F3", "-", "D3", "-", "-", "-",
    ],
    bass: [
      "D2", "D2", "D2", "D2", "A2", "A2", "A2", "A2",
      "Bb2", "Bb2", "Bb2", "Bb2", "F2", "F2", "C3", "C3",
      "D2", "D2", "F2", "F2", "G2", "G2", "A2", "A2",
      "Bb2", "Bb2", "A2", "A2", "D2", "D2", "D2", "-",
      "F2", "F2", "A2", "A2", "D3", "D3", "F2", "F2",
      "G2", "G2", "Bb2", "Bb2", "A2", "A2", "C#3", "C#3",
      "Bb2", "Bb2", "G2", "G2", "A2", "A2", "A2", "A2",
      "D2", "D2", "F2", "F2", "D2", "-", "-", "-",
    ],
    drums: [
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "H", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "K", "H", "H", "S", "-", "-", "-",
    ],
  },

  // Stages 1-6: "Nightfall Stride" - Fast, driving gothic action anthem (D Minor, 136 BPM, 16th steps)
  castle: {
    bpm: 136,
    stepDuration: 16,
    loop: true,
    lead: [
      // Bar 1 - 2 (Main theme phrase A)
      "D4", "E4", "F4", "G4", "A4", "-", "D5", "-", "C#5", "-", "A4", "-", "F4", "G4", "A4", "-",
      "Bb4", "-", "A4", "-", "G4", "A4", "Bb4", "C5", "D5", "-", "C5", "-", "Bb4", "-", "A4", "-",
      // Bar 3 - 4 (Phrase B - virtuosic run)
      "F4", "G4", "A4", "Bb4", "C5", "-", "F5", "-", "E5", "-", "C5", "-", "A4", "Bb4", "C5", "-",
      "D5", "E5", "F5", "D5", "C#5", "D5", "E5", "C#5", "D5", "-", "A4", "-", "D4", "-", "-", "-",
      // Bar 5 - 6 (Climbing bridge)
      "D5", "-", "D5", "C5", "Bb4", "A4", "G4", "A4", "Bb4", "-", "D5", "-", "C5", "-", "A4", "-",
      "G4", "A4", "Bb4", "C5", "D5", "C5", "Bb4", "A4", "G4", "-", "Bb4", "-", "A4", "-", "F4", "-",
      // Bar 7 - 8 (Dramatic cadence to turnaround)
      "E4", "F4", "G4", "A4", "Bb4", "A4", "G4", "F4", "E4", "F4", "G4", "A4", "C#5", "-", "E5", "-",
      "D5", "-", "A4", "-", "F4", "-", "D4", "-", "D5", "-", "A4", "-", "D4", "-", "-", "-",
    ],
    harmony: [
      "A3", "-", "-", "-", "F4", "-", "-", "-", "E4", "-", "-", "-", "D4", "-", "-", "-",
      "G4", "-", "-", "-", "E4", "-", "-", "-", "F4", "-", "-", "-", "F4", "-", "E4", "-",
      "C4", "-", "-", "-", "A4", "-", "-", "-", "G4", "-", "-", "-", "F4", "-", "-", "-",
      "F4", "-", "-", "-", "E4", "-", "-", "-", "F4", "-", "E4", "-", "D4", "-", "-", "-",
      "F4", "-", "-", "-", "D4", "-", "-", "-", "G4", "-", "-", "-", "E4", "-", "-", "-",
      "D4", "-", "-", "-", "F4", "-", "-", "-", "E4", "-", "-", "-", "D4", "-", "-", "-",
      "C#4", "-", "-", "-", "E4", "-", "-", "-", "G4", "-", "-", "-", "A4", "-", "-", "-",
      "F4", "-", "-", "-", "D4", "-", "-", "-", "F4", "-", "-", "-", "D4", "-", "-", "-",
    ],
    bass: [
      // Driving 16th note arpeggiated bassline
      "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2", "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2",
      "G2", "G2", "D3", "G2", "Bb2", "G2", "D3", "G2", "F2", "F2", "C3", "F2", "A2", "F2", "C3", "F2",
      "F2", "F2", "C3", "F2", "A2", "F2", "C3", "F2", "C2", "C2", "G2", "C2", "E2", "C2", "G2", "C2",
      "Bb2", "Bb2", "F2", "Bb2", "A2", "A2", "E2", "A2", "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2",
      "Bb2", "Bb2", "F2", "Bb2", "D3", "Bb2", "F2", "Bb2", "C3", "C3", "G2", "C3", "E3", "C3", "G2", "C3",
      "G2", "G2", "D3", "G2", "Bb2", "G2", "D3", "G2", "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2",
      "A2", "A2", "E2", "A2", "C#3", "A2", "E2", "A2", "A2", "A2", "E2", "A2", "C#3", "A2", "E2", "A2",
      "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2", "D2", "A2", "F2", "A2", "D2", "-", "-", "-",
    ],
    drums: [
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "-", "H", "K", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "K", "H", "-", "S", "-", "H", "H",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "-", "H", "K", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "K", "H", "-", "S", "S", "H", "H",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "-", "H", "K", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "K", "H", "-", "S", "-", "H", "H",
      "K", "-", "H", "-", "S", "-", "H", "-", "K", "K", "H", "K", "S", "-", "H", "H",
      "K", "K", "H", "H", "S", "-", "H", "H", "K", "S", "K", "S", "K", "-", "-", "-",
    ],
  },

  // Boss / Dracula: "Throne of the Damned" - Intense 152 BPM gothic combat anthem with dissonant urgency
  boss: {
    bpm: 152,
    stepDuration: 16,
    loop: true,
    lead: [
      // Aggressive staccato riff with tritone accents
      "D5", "D5", "D5", "-", "Eb5", "-", "D5", "-", "C#5", "-", "Bb4", "-", "A4", "-", "G#4", "-",
      "A4", "Bb4", "C#5", "D5", "Eb5", "D5", "C#5", "Bb4", "A4", "-", "F4", "-", "D4", "-", "-", "-",
      "F5", "F5", "F5", "-", "Gb5", "-", "F5", "-", "E5", "-", "Db5", "-", "C5", "-", "B4", "-",
      "C5", "Db5", "E5", "F5", "Gb5", "F5", "E5", "Db5", "C5", "-", "Ab4", "-", "F4", "-", "-", "-",
      // Fast arpeggiated escalation
      "D5", "F5", "A5", "D6", "C#6", "A5", "F5", "E5", "D5", "F5", "A5", "D6", "Eb6", "D6", "C#6", "A5",
      "G5", "Bb5", "D6", "G6", "F#6", "D6", "Bb5", "A5", "G5", "Bb5", "D6", "G6", "Ab6", "G6", "F#6", "D6",
      // Culmination
      "A5", "-", "G#5", "-", "A5", "-", "Bb5", "-", "C#6", "-", "D6", "-", "Eb6", "-", "D6", "-",
      "C#6", "D6", "E6", "D6", "C#6", "Bb5", "A5", "G5", "F5", "E5", "D5", "C#5", "D5", "-", "-", "-",
    ],
    harmony: [
      "A4", "-", "-", "-", "Bb4", "-", "A4", "-", "G4", "-", "-", "-", "E4", "-", "-", "-",
      "F4", "-", "-", "-", "G4", "-", "-", "-", "F4", "-", "-", "-", "D4", "-", "-", "-",
      "C5", "-", "-", "-", "Db5", "-", "C5", "-", "Bb4", "-", "-", "-", "G4", "-", "-", "-",
      "Ab4", "-", "-", "-", "Bb4", "-", "-", "-", "Ab4", "-", "-", "-", "F4", "-", "-", "-",
      "A4", "-", "-", "-", "A4", "-", "-", "-", "A4", "-", "-", "-", "A4", "-", "-", "-",
      "Bb4", "-", "-", "-", "Bb4", "-", "-", "-", "Bb4", "-", "-", "-", "Bb4", "-", "-", "-",
      "E5", "-", "-", "-", "F5", "-", "-", "-", "G5", "-", "-", "-", "F5", "-", "-", "-",
      "E5", "-", "-", "-", "G4", "-", "-", "-", "F4", "-", "E4", "-", "D4", "-", "-", "-",
    ],
    bass: [
      "D2", "D2", "D2", "D2", "Eb2", "Eb2", "D2", "D2", "C#2", "C#2", "C#2", "C#2", "A1", "A1", "A1", "A1",
      "D2", "D2", "F2", "F2", "G2", "G2", "A2", "A2", "Bb2", "Bb2", "A2", "A2", "D2", "D2", "D2", "D2",
      "F2", "F2", "F2", "F2", "Gb2", "Gb2", "F2", "F2", "E2", "E2", "E2", "E2", "C2", "C2", "C2", "C2",
      "F2", "F2", "Ab2", "Ab2", "Bb2", "Bb2", "C3", "C3", "Db3", "Db3", "C3", "C3", "F2", "F2", "F2", "F2",
      "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2", "D2", "D2", "A2", "D2", "F2", "D2", "A2", "D2",
      "G2", "G2", "D3", "G2", "Bb2", "G2", "D3", "G2", "G2", "G2", "D3", "G2", "Bb2", "G2", "D3", "G2",
      "A2", "A2", "E2", "A2", "C#3", "A2", "E2", "A2", "Bb2", "Bb2", "F2", "Bb2", "G2", "G2", "D2", "G2",
      "A2", "A2", "A2", "A2", "A2", "A2", "A2", "A2", "D2", "A2", "F2", "A2", "D2", "-", "-", "-",
    ],
    drums: [
      "K", "-", "H", "K", "S", "-", "H", "K", "K", "-", "H", "K", "S", "-", "H", "H",
      "K", "-", "H", "K", "S", "-", "H", "K", "K", "K", "H", "H", "S", "S", "H", "H",
      "K", "-", "H", "K", "S", "-", "H", "K", "K", "-", "H", "K", "S", "-", "H", "H",
      "K", "-", "H", "K", "S", "-", "H", "K", "K", "K", "H", "H", "S", "S", "H", "H",
      "K", "K", "H", "K", "S", "-", "H", "K", "K", "K", "H", "K", "S", "-", "H", "H",
      "K", "K", "H", "K", "S", "-", "H", "K", "K", "K", "H", "K", "S", "-", "H", "H",
      "K", "-", "H", "K", "S", "-", "H", "K", "K", "-", "H", "K", "S", "-", "H", "H",
      "K", "K", "K", "K", "S", "S", "S", "S", "K", "S", "K", "S", "K", "-", "-", "-",
    ],
  },

  // Victory / Gate Open: "Dawn of Victory" - Triumphant royal cadence (D Major, 128 BPM)
  victory: {
    bpm: 128,
    stepDuration: 8,
    loop: false,
    lead: [
      "D4", "F#4", "A4", "D5", "C#5", "D5", "E5", "F#5",
      "G5", "F#5", "E5", "D5", "A4", "-", "D5", "-",
      "F#5", "E5", "D5", "C#5", "B4", "C#5", "D5", "E5",
      "D5", "-", "A4", "-", "D5", "-", "-", "-",
    ],
    harmony: [
      "A3", "-", "D4", "-", "E4", "-", "G4", "-",
      "B4", "-", "A4", "-", "F#4", "-", "F#4", "-",
      "D4", "-", "F#4", "-", "G4", "-", "B4", "-",
      "F#4", "-", "E4", "-", "F#4", "-", "-", "-",
    ],
    bass: [
      "D2", "D2", "F#2", "F#2", "G2", "G2", "A2", "A2",
      "B2", "B2", "A2", "A2", "D3", "D3", "D3", "-",
      "D2", "D2", "F#2", "F#2", "G2", "G2", "A2", "A2",
      "D2", "D2", "A2", "A2", "D2", "-", "-", "-",
    ],
    drums: [
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "-", "H", "-", "S", "-", "H", "-",
      "K", "K", "H", "H", "S", "-", "-", "-",
    ],
  },

  // Defeat / Game Over: "Requiem of the Hunter" - Dark mournful cadence
  gameover: {
    bpm: 80,
    stepDuration: 8,
    loop: false,
    lead: [
      "D4", "-", "F4", "-", "E4", "-", "C#4", "-",
      "D4", "-", "Bb3", "-", "A3", "-", "-", "-",
      "F3", "-", "G3", "-", "A3", "-", "F3", "-",
      "E3", "-", "C#3", "-", "D3", "-", "-", "-",
    ],
    harmony: [
      "A3", "-", "D4", "-", "C#4", "-", "A3", "-",
      "F3", "-", "G3", "-", "E3", "-", "-", "-",
      "D3", "-", "E3", "-", "F3", "-", "D3", "-",
      "C#3", "-", "A2", "-", "D3", "-", "-", "-",
    ],
    bass: [
      "D2", "D2", "Bb1", "Bb1", "A1", "A1", "A1", "A1",
      "Bb1", "Bb1", "G1", "G1", "A1", "A1", "-", "-",
      "D2", "D2", "C2", "C2", "F1", "F1", "Bb1", "Bb1",
      "A1", "A1", "A1", "A1", "D1", "-", "-", "-",
    ],
    drums: [
      "K", "-", "-", "-", "S", "-", "-", "-",
      "K", "-", "-", "-", "S", "-", "-", "-",
      "K", "-", "-", "-", "S", "-", "-", "-",
      "K", "-", "-", "-", "-", "-", "-", "-",
    ],
  },
};

// -------------------------------------------------------------
// HIGH PERFORMANCE PRELOADED SFX AUDIO POOL
// -------------------------------------------------------------

class SfxAudioPool {
  private pool: HTMLAudioElement[] = [];
  private index = 0;

  constructor(src: string, size = 8) {
    if (typeof window !== "undefined") {
      try {
        for (let i = 0; i < size; i++) {
          const a = new Audio(src);
          a.preload = "auto";
          this.pool.push(a);
        }
      } catch {
        // Ignore audio creation errors in restricted environments
      }
    }
  }

  public play(volume: number, rate = 1.0) {
    if (typeof window === "undefined" || this.pool.length === 0 || volume <= 0) return;
    try {
      const a = this.pool[this.index];
      this.index = (this.index + 1) % this.pool.length;
      a.pause();
      a.currentTime = 0;
      a.volume = Math.max(0, Math.min(1, volume));
      a.playbackRate = rate;
      const p = a.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch {
      // Ignore
    }
  }
}

// -------------------------------------------------------------
// AUDIO ENGINE SINGLETON & SOUND SYNTHESIS
// -------------------------------------------------------------

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Dedicated instant-playback studio SFX pools
  private slashPool = new SfxAudioPool("/audio/sfx-slash.mp3", 8);
  private slicePool = new SfxAudioPool("/audio/sfx-slice.mp3", 8);
  private spellPool = new SfxAudioPool("/audio/sfx-spell.mp3", 8);

  // Dedicated boss attack SFX pools (2 signature attack sounds per boss across 7 stages)
  private bossAtkPools: Record<string, SfxAudioPool> = {
    "1-1": new SfxAudioPool("/audio/bosses/boss1-atk1.mp3", 4),
    "1-2": new SfxAudioPool("/audio/bosses/boss1-atk2.mp3", 4),
    "2-1": new SfxAudioPool("/audio/bosses/boss2-atk1.mp3", 4),
    "2-2": new SfxAudioPool("/audio/bosses/boss2-atk2.mp3", 4),
    "3-1": new SfxAudioPool("/audio/bosses/boss3-atk1.mp3", 4),
    "3-2": new SfxAudioPool("/audio/bosses/boss3-atk2.mp3", 4),
    "4-1": new SfxAudioPool("/audio/bosses/boss4-atk1.mp3", 4),
    "4-2": new SfxAudioPool("/audio/bosses/boss4-atk2.mp3", 4),
    "5-1": new SfxAudioPool("/audio/bosses/boss5-atk1.mp3", 4),
    "5-2": new SfxAudioPool("/audio/bosses/boss5-atk2.mp3", 4),
    "6-1": new SfxAudioPool("/audio/bosses/boss6-atk1.mp3", 4),
    "6-2": new SfxAudioPool("/audio/bosses/boss6-atk2.mp3", 4),
    "7-1": new SfxAudioPool("/audio/bosses/boss7-atk1.mp3", 4),
    "7-2": new SfxAudioPool("/audio/bosses/boss7-atk2.mp3", 4),
  };

  // Boss entrance speech elements cache & buffer decoding
  private bossVoices: Record<number, HTMLAudioElement> = {};
  private bossVoiceBuffers: Map<number, AudioBuffer> = new Map();
  private currentVoiceSource: AudioBufferSourceNode | null = null;
  private voiceGain: GainNode | null = null;
  private isDucking = false;
  private duckTimerId: number | null = null;
  private unduckFadeTimer: number | null = null;
  private interactionUnlocked = false;

  // Music sequencer state
  private currentTrackName: TrackName = "none";
  private isPlayingBgm = false;
  private nextStepTime = 0;
  private currentStep = 0;
  private timerId: number | null = null;
  private activeMusicNodes: AudioNode[] = [];

  // Studio MP3 Audio Element & SFX buffers
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioElementsCache: Map<string, HTMLAudioElement> = new Map();
  private slashBuffer: AudioBuffer | null = null;
  private spellBuffer: AudioBuffer | null = null;
  // Enemy / Character Alert and Voice Buffers (e.g. Zombie groan, etc.)
  private enemyAudioBuffers: Map<string, AudioBuffer> = new Map();
  private lastEnemySoundTimes: Map<string, number> = new Map();

  // Settings
  private muted = false;
  private musicVol = 0.65;
  private sfxVol = 0.85;

  constructor() {
    this.loadSettings();
    this.setupInteractionUnlock();
    if (typeof window !== "undefined") {
      for (let i = 1; i <= 7; i++) {
        try {
          const a = new Audio(`/audio/bosses/boss${i}-voice.mp3`);
          a.preload = "auto";
          this.bossVoices[i] = a;
        } catch {
          // Ignore
        }
      }
    }
  }

  public resumePlayback() {
    if (this.muted) return;
    const actx = this.init();
    if (actx && actx.state === "suspended") {
      void actx.resume().catch(() => {});
    }
    if (this.isPlayingBgm && this.currentAudioElement && this.currentAudioElement.paused && !this.muted) {
      void this.currentAudioElement.play().catch(() => {});
    }
  }

  private setupInteractionUnlock() {
    if (typeof window === "undefined") return;
    const unlock = () => {
      this.interactionUnlocked = true;
      this.resumePlayback();
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
  }

  private loadSettings() {
    // Sound ALWAYS starts enabled by default
    this.muted = false;
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("nightfall_audio_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.musicVol === "number") this.musicVol = Math.max(0, Math.min(1, parsed.musicVol));
        if (typeof parsed.sfxVol === "number") this.sfxVol = Math.max(0, Math.min(1, parsed.sfxVol));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveSettings() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "nightfall_audio_settings",
        JSON.stringify({ muted: this.muted, musicVol: this.musicVol, sfxVol: this.sfxVol })
      );
    } catch {
      // Ignore
    }
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    }

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;

    try {
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.voiceGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);

      try {
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-4, this.ctx.currentTime);
        comp.knee.setValueAtTime(18, this.ctx.currentTime);
        comp.ratio.setValueAtTime(8, this.ctx.currentTime);
        comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
        comp.release.setValueAtTime(0.12, this.ctx.currentTime);
        this.masterGain.connect(comp);
        comp.connect(this.ctx.destination);
      } catch {
        this.masterGain.connect(this.ctx.destination);
      }

      this.updateGains();
      this.createNoiseBuffer();
      this.loadSfxBuffers();
      this.loadBossVoiceBuffers();
      this.loadEnemyAudioBuffers();
    } catch {
      this.ctx = null;
    }

    return this.ctx;
  }

  private loadSfxBuffers() {
    if (!this.ctx || typeof window === "undefined" || this.slashBuffer) return;
    const loadBuf = async (url: string) => {
      try {
        const res = await fetch(url);
        const arrayBuf = await res.arrayBuffer();
        return await this.ctx!.decodeAudioData(arrayBuf);
      } catch {
        return null;
      }
    };
    void loadBuf("/audio/sfx-slash.mp3").then((buf) => {
      if (buf) this.slashBuffer = buf;
    });
    void loadBuf("/audio/sfx-spell.mp3").then((buf) => {
      if (buf) this.spellBuffer = buf;
    });
  }

  private loadBossVoiceBuffers() {
    if (!this.ctx || typeof window === "undefined") return;
    for (let i = 1; i <= 7; i++) {
      const stageId = i;
      if (this.bossVoiceBuffers.has(stageId)) continue;
      fetch(`/audio/bosses/boss${stageId}-voice.mp3`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((audioBuf) => {
          this.bossVoiceBuffers.set(stageId, audioBuf);
        })
        .catch(() => {
          // If decoding fails, HTMLAudioElement fallback will play it
        });
    }
  }

  private loadEnemyAudioBuffers() {
    if (!this.ctx || typeof window === "undefined") return;
    const candidates: Array<{ key: string; url: string }> = [
      { key: "zombie", url: "/audio/personagens/zombie.wav" },
      { key: "bat", url: "/audio/personagens/bat.mp3" },
      { key: "skeleton", url: "/audio/personagens/skeleton.mp3" },
      { key: "armoredSkeleton", url: "/audio/personagens/armoredSkeleton.mp3" },
      { key: "redSkeleton", url: "/audio/personagens/redSkeleton.mp3" },
      { key: "knight", url: "/audio/personagens/knight.mp3" },
      { key: "gargoyle", url: "/audio/personagens/gargoyle.mp3" },
      { key: "vampire", url: "/audio/personagens/vampire.mp3" },
    ];
    for (const { key, url } of candidates) {
      if (this.enemyAudioBuffers.has(key)) continue;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("not ok");
          return res.arrayBuffer();
        })
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((audioBuf) => {
          this.enemyAudioBuffers.set(key, audioBuf);
        })
        .catch(() => {
          // Ignore
        });
    }
  }

  private updateGains() {
    const effectiveMusicVol = this.muted ? 0 : this.isDucking ? this.musicVol * 0.10 : this.musicVol;
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = effectiveMusicVol;
    }
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const targetMaster = this.muted ? 0 : 1;
    this.masterGain.gain.setValueAtTime(targetMaster, now);
    this.musicGain.gain.setValueAtTime(effectiveMusicVol, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVol, now);
    if (this.voiceGain) {
      // Powerful amplification (2.2x SFX volume) for commanding boss voice presence
      this.voiceGain.gain.setValueAtTime(this.sfxVol * 2.2, now);
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateGains();
    this.saveSettings();
    if (!this.muted) {
      if (!this.ctx) {
        this.init();
      }
      this.resumePlayback();
    }
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    this.updateGains();
    this.saveSettings();
    if (!muted) {
      this.resumePlayback();
    }
  }

  public isMuted() {
    return this.muted;
  }

  public setMusicVolume(vol: number) {
    this.musicVol = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  public getMusicVolume() {
    return this.musicVol;
  }

  public getSfxVolume() {
    return this.sfxVol;
  }

  // -------------------------------------------------------------
  // AUDIO DUCKING (BACKGROUND MUSIC DROP DURING BOSS QUOTES)
  // -------------------------------------------------------------

  public duckMusic() {
    if (this.unduckFadeTimer !== null) {
      window.clearInterval(this.unduckFadeTimer);
      this.unduckFadeTimer = null;
    }
    this.isDucking = true;
    this.updateGains();
  }

  public unduckMusic() {
    if (!this.isDucking) return;
    this.isDucking = false;
    if (this.duckTimerId !== null) {
      window.clearTimeout(this.duckTimerId);
      this.duckTimerId = null;
    }
    if (this.unduckFadeTimer !== null) {
      window.clearInterval(this.unduckFadeTimer);
      this.unduckFadeTimer = null;
    }

    // Smooth restoration of HTMLAudioElement volume over 500ms
    if (this.currentAudioElement && !this.muted) {
      const targetVol = this.musicVol;
      const startVol = this.currentAudioElement.volume;
      const startTime = performance.now();
      const fadeDuration = 500;
      this.unduckFadeTimer = window.setInterval(() => {
        if (!this.currentAudioElement || this.isDucking) {
          if (this.unduckFadeTimer !== null) {
            window.clearInterval(this.unduckFadeTimer);
            this.unduckFadeTimer = null;
          }
          return;
        }
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / fadeDuration);
        this.currentAudioElement.volume = startVol + (targetVol - startVol) * progress;
        if (progress >= 1) {
          if (this.unduckFadeTimer !== null) {
            window.clearInterval(this.unduckFadeTimer);
            this.unduckFadeTimer = null;
          }
          this.updateGains();
        }
      }, 25);
    } else {
      this.updateGains();
    }

    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(this.muted ? 0 : this.musicVol, now + 0.5);
    }
  }

  // -------------------------------------------------------------
  // BOSS VOICE LINES & SIGNATURE ATTACK SFX
  // -------------------------------------------------------------

  public playBossVoice(stageNum: number) {
    if (this.muted || typeof window === "undefined") return;

    // Halt any previous boss voice playback
    this.stopBossVoice();

    // Duck music immediately so the quote is prominent and clear
    this.duckMusic();

    const actx = this.init();
    const buffer = this.bossVoiceBuffers.get(stageNum);

    // If decoded buffer is available in Web Audio API, play boosted through voiceGain (+120% boost!)
    if (actx && buffer && this.voiceGain) {
      try {
        const source = actx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        this.currentVoiceSource = source;

        source.onended = () => {
          if (this.currentVoiceSource === source) {
            this.currentVoiceSource = null;
            this.unduckMusic();
          }
        };

        source.start();

        const durationSec = (buffer.duration || 4.5) + 0.3;
        this.duckTimerId = window.setTimeout(() => {
          this.unduckMusic();
        }, durationSec * 1000);
        return;
      } catch (err) {
        console.warn("[audio] Buffer voice failed, fallback to Audio element:", err);
      }
    }

    // HTMLAudioElement fallback
    try {
      let a = this.bossVoices[stageNum];
      if (!a) {
        a = new Audio(`/audio/bosses/boss${stageNum}-voice.mp3`);
        a.preload = "auto";
        this.bossVoices[stageNum] = a;
      }
      a.pause();
      a.currentTime = 0;
      a.volume = 1.0;

      const onEnded = () => {
        a.removeEventListener("ended", onEnded);
        this.unduckMusic();
      };
      a.addEventListener("ended", onEnded, { once: true });

      const playPromise = a.play();
      if (playPromise) {
        playPromise.catch(() => {
          this.unduckMusic();
        });
      }

      this.duckTimerId = window.setTimeout(() => {
        this.unduckMusic();
      }, 5500);
    } catch {
      this.unduckMusic();
    }
  }

  public stopBossVoice(stageNum?: number) {
    if (typeof window === "undefined") return;

    if (this.currentVoiceSource) {
      try {
        this.currentVoiceSource.stop();
        this.currentVoiceSource.disconnect();
      } catch {
        // Ignore
      }
      this.currentVoiceSource = null;
    }

    if (stageNum && this.bossVoices[stageNum]) {
      this.bossVoices[stageNum].pause();
      this.bossVoices[stageNum].currentTime = 0;
    } else {
      for (const a of Object.values(this.bossVoices)) {
        a.pause();
        a.currentTime = 0;
      }
    }

    this.unduckMusic();
  }

  public playBossAttack(stageNum: number, attackIndex: 1 | 2 = 1) {
    if (this.muted) return;
    const pool = this.bossAtkPools[`${stageNum}-${attackIndex}`];
    if (pool) {
      pool.play(this.sfxVol, 0.96 + Math.random() * 0.08);
    }
  }

  // -------------------------------------------------------------
  // ENEMY / MONSTER SFX (ZOMBIES, BATS, SKELETONS, ETC.)
  // -------------------------------------------------------------

  public playEnemyAlert(kind: string) {
    if (this.muted || typeof window === "undefined") return;
    const now = performance.now();
    const lastTime = this.lastEnemySoundTimes.get(kind) ?? 0;
    // Throttle per enemy kind to keep soundscape crisp and avoid distortion
    const throttleMs =
      kind === "zombie" || kind === "vampire"
        ? 2200
        : kind === "knight"
          ? 2000
          : kind === "gargoyle"
            ? 1800
            : kind === "bat"
              ? 1200
              : 1600;
    if (now - lastTime < throttleMs) return;
    this.lastEnemySoundTimes.set(kind, now);

    const actx = this.init();
    const buf =
      this.enemyAudioBuffers.get(kind) ??
      (kind === "armoredSkeleton" || kind === "redSkeleton" ? this.enemyAudioBuffers.get("skeleton") : undefined);

    if (actx && buf && this.sfxGain) {
      try {
        const source = actx.createBufferSource();
        source.buffer = buf;
        // Subtle organic pitch variation (0.94x - 1.06x) for authentic natural variety
        source.playbackRate.value = 0.94 + Math.random() * 0.12;
        const gain = actx.createGain();
        const baseVol =
          kind === "knight"
            ? 0.80
            : kind === "vampire"
              ? 0.78
              : kind === "gargoyle" || kind === "zombie"
                ? 0.75
                : kind === "bat"
                  ? 0.70
                  : 0.72;
        gain.gain.setValueAtTime(baseVol, actx.currentTime);
        source.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
        return;
      } catch (err) {
        console.warn("[audio] Buffer enemy sound playback failed:", err);
      }
    }

    // HTMLAudioElement fallback
    const ext = kind === "zombie" ? "wav" : "mp3";
    try {
      const a = new Audio(`/audio/personagens/${kind}.${ext}`);
      a.volume = this.muted ? 0 : this.sfxVol * 0.75;
      a.playbackRate = 0.95 + Math.random() * 0.1;
      const p = a.play();
      if (p) p.catch(() => {});
      return;
    } catch {
      // Fallback
    }

    // Procedural Synth Fallback for enemies without custom audio files yet
    this.playProceduralEnemyAlert(kind);
  }

  private playProceduralEnemyAlert(kind: string) {
    const actx = this.init();
    if (!actx || !this.sfxGain) return;
    const now = actx.currentTime;

    if (kind === "bat") {
      // High-pitched predatory screech & fluttering chirp
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(2200, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.18);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (kind === "skeleton" || kind === "armoredSkeleton" || kind === "redSkeleton") {
      // Dry bone clatter rattling clicks
      [360, 480, 290].forEach((freq, idx) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.08);
      });
    } else if (kind === "knight") {
      // Heavy plate iron clang
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (kind === "gargoyle") {
      // Harsh demonic stone roar / screech
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(540, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  }

  // -------------------------------------------------------------
  // SFX GENERATOR
  // -------------------------------------------------------------

  public playSfx(kind: SfxKind) {
    if (this.muted) return;

    // Instantaneous authentic studio audio playback for weapons & magic
    if (kind === "slash") {
      this.slashPool.play(this.sfxVol, 0.98 + Math.random() * 0.05);
      return;
    }
    if (kind === "slashHeavy") {
      this.slashPool.play(Math.min(1, this.sfxVol * 1.25), 0.85);
      return;
    }
    if (kind === "slice") {
      this.slicePool.play(this.sfxVol, 0.96 + Math.random() * 0.08);
      return;
    }
    if (kind === "spell") {
      this.spellPool.play(this.sfxVol, 1.0);
      return;
    }

    const actx = this.init();
    if (!actx || !this.sfxGain) return;
    const now = actx.currentTime;

    switch (kind) {

      case "dash": {
        // Air dash swoosh
        if (this.noiseBuffer) {
          const noise = actx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = actx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.linearRampToValueAtTime(1600, now + 0.06);
          filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
          filter.Q.value = 2.5;
          const gain = actx.createGain();
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);
          noise.start(now);
          noise.stop(now + 0.15);
        }
        break;
      }

      case "jump": {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case "doubleJump": {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case "pogo": {
        // Pogo bounce - springy metallic impact
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case "hurt": {
        // Player damage taken
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case "enemyHurt": {
        // Hit enemy
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case "enemyDie": {
        // Enemy defeated / turning to dust
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case "bossHurt": {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case "gateOpen": {
        [392, 523, 659, 784].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
        break;
      }

      case "relic": {
        [523, 659, 784, 1046].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.22, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.3);
        });
        break;
      }

      case "itemLife": {
        // Triumphant gothic 1-UP chime: majestic major chord ascending to high bell
        [440, 554, 659, 880, 1108, 1320].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = idx >= 4 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.26, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.45);
        });
        break;
      }

      case "itemHeal": {
        // Soothing restorative healing chime
        [330, 440, 554, 660].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.2, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.35);
        });
        break;
      }

      case "itemMana": {
        // Shimmering mystical ethereal ether
        [587, 740, 880, 1175].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.18, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.3);
        });
        break;
      }

      case "revive": {
        // Deep resonant holy resurrection burst
        const gong = actx.createOscillator();
        const gongGain = actx.createGain();
        gong.type = "sawtooth";
        gong.frequency.setValueAtTime(130, now);
        gong.frequency.exponentialRampToValueAtTime(65, now + 0.6);
        gongGain.gain.setValueAtTime(0.35, now);
        gongGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        gong.connect(gongGain);
        gongGain.connect(this.sfxGain!);
        gong.start(now);
        gong.stop(now + 0.7);

        [220, 293, 370, 440, 587, 740].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.07);
          gain.gain.setValueAtTime(0.24, now + 0.1 + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + idx * 0.07 + 0.5);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + 0.1 + idx * 0.07);
          osc.stop(now + 0.1 + idx * 0.07 + 0.5);
        });
        break;
      }

      case "thunder": {
        // Deep rumbling thunder strike with lightning crackle
        if (this.noiseBuffer) {
          const noise = actx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = actx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(350, now);
          filter.frequency.exponentialRampToValueAtTime(70, now + 1.2);
          const gain = actx.createGain();
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain!);
          noise.start(now);
          noise.stop(now + 1.4);
        }
        // Sub-bass rumble
        const sub = actx.createOscillator();
        const subGain = actx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(90, now);
        sub.frequency.exponentialRampToValueAtTime(35, now + 1.0);
        subGain.gain.setValueAtTime(0.6, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        sub.connect(subGain);
        subGain.connect(this.sfxGain!);
        sub.start(now);
        sub.stop(now + 1.2);
        break;
      }

      case "bell": {
        // Ominous gothic church bell tolling (A2 partials)
        [110, 220, 330, 440, 587].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          const baseGain = 0.35 / (idx + 1);
          gain.gain.setValueAtTime(baseGain, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now);
          osc.stop(now + 2.5);
        });
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // MUSIC ENGINE (MP3 STREAMING & PROCEDURAL FALLBACK)
  // -------------------------------------------------------------

  public playStageBgm(stageId: number) {
    const id = Math.max(1, Math.min(7, stageId));
    this.playBgm(`stage${id}` as TrackName);
  }

  public playBgm(name: TrackName) {
    if (this.currentTrackName === name && this.isPlayingBgm) {
      if (this.currentAudioElement && this.currentAudioElement.paused && !this.muted) {
        this.currentAudioElement.play().catch(() => {});
      }
      return;
    }
    this.stopBgm();
    if (name === "none") return;

    this.currentTrackName = name;
    this.isPlayingBgm = true;

    // Check if this track is one of our 7 stage studio tracks
    let mp3Url: string | null = null;
    if (name.startsWith("stage")) {
      const stageNum = parseInt(name.replace("stage", ""), 10);
      if (stageNum >= 1 && stageNum <= 7) {
        mp3Url = STAGE_TRACK_URLS[stageNum];
      }
    } else if (name === "boss") {
      // Stage 6 epic horror battle track for standard boss battles
      mp3Url = "/audio/stage-6.mp3";
    } else if (name === "title") {
      // Studio Emblematic main theme for title and menu
      mp3Url = "/audio/title.mp3";
    }

    if (mp3Url && typeof window !== "undefined") {
      try {
        let audio = this.audioElementsCache.get(mp3Url);
        if (!audio) {
          audio = new Audio(mp3Url);
          audio.loop = true;
          audio.preload = "auto";
          this.audioElementsCache.set(mp3Url, audio);
        }
        audio.currentTime = 0;
        audio.volume = this.muted ? 0 : this.isDucking ? this.musicVol * 0.10 : this.musicVol;
        this.currentAudioElement = audio;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Browser autoplay gesture restriction - will resume on first user click
            console.debug("[audio] Autoplay prevented, waiting for interaction:", err);
          });
        }
        return;
      } catch (err) {
        console.warn("[audio] MP3 play fallback to synth:", err);
      }
    }

    // Procedural Synth fallback for title, victory, gameover or if MP3 fails
    const actx = this.init();
    if (!actx) return;

    this.currentStep = 0;
    this.nextStepTime = actx.currentTime + 0.05;
    this.scheduleLoop();
  }

  public getCurrentTrack(): TrackName {
    return this.currentTrackName;
  }

  public stopBgm() {
    this.isPlayingBgm = false;
    this.currentTrackName = "none";
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {
        // Ignore
      }
      this.currentAudioElement = null;
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    for (const node of this.activeMusicNodes) {
      try {
        (node as AudioScheduledSourceNode).stop?.();
        node.disconnect();
      } catch {
        // Ignore nodes already stopped
      }
    }
    this.activeMusicNodes = [];
  }

  private scheduleLoop = () => {
    if (!this.isPlayingBgm || !this.ctx || this.currentTrackName === "none") return;

    const pattern = TRACKS[this.currentTrackName];
    if (!pattern) return;

    const lookAhead = 0.25; // Schedule 250ms into the future
    const secondsPerBeat = 60 / pattern.bpm;
    const stepDurationSec = pattern.stepDuration === 16 ? secondsPerBeat / 4 : secondsPerBeat / 2;
    const totalSteps = pattern.lead.length;

    while (this.nextStepTime < this.ctx.currentTime + lookAhead) {
      this.scheduleStep(pattern, this.currentStep, this.nextStepTime, stepDurationSec);
      this.nextStepTime += stepDurationSec;
      this.currentStep++;

      if (this.currentStep >= totalSteps) {
        if (pattern.loop) {
          this.currentStep = 0;
        } else {
          this.isPlayingBgm = false;
          return;
        }
      }
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 75);
  };

  private scheduleStep(pattern: SequencePattern, stepIdx: number, time: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    // 1. LEAD / ORGAN CHANNEL
    const leadNote = pattern.lead[stepIdx];
    const leadFreq = NOTES[leadNote] || 0;
    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Organ / pulse timbre with mild lowpass filter
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(leadFreq, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(3200, leadFreq * 4), time);
      filter.Q.value = 1.8;

      const noteLen = dur * 0.92;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + noteLen);
      this.activeMusicNodes.push(osc);
    }

    // 2. HARMONY / COUNTERPOINT CHANNEL
    if (pattern.harmony) {
      const harmNote = pattern.harmony[stepIdx];
      const harmFreq = NOTES[harmNote] || 0;
      if (harmFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(harmFreq, time);

        const noteLen = dur * 0.88;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.13, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + noteLen);
        this.activeMusicNodes.push(osc);
      }
    }

    // 3. BASS CHANNEL
    const bassNote = pattern.bass[stepIdx];
    const bassFreq = NOTES[bassNote] || 0;
    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(bassFreq, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, time);

      const noteLen = dur * 0.85;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.24, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + noteLen);
      this.activeMusicNodes.push(osc);
    }

    // 4. DRUMS CHANNEL
    if (pattern.drums) {
      const drumHit = pattern.drums[stepIdx];
      if (drumHit === "K") {
        // Kick drum (pitch drop sine)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.09);
        this.activeMusicNodes.push(osc);
      } else if (drumHit === "S" && this.noiseBuffer) {
        // Snare drum (noise burst + pop)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1200, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(time);
        noise.stop(time + 0.12);
        this.activeMusicNodes.push(noise);
      } else if (drumHit === "H" && this.noiseBuffer) {
        // Hi-hat (short highpass noise)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7000, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(time);
        noise.stop(time + 0.04);
        this.activeMusicNodes.push(noise);
      }
    }

    // Cleanup finished nodes from array periodically
    if (this.activeMusicNodes.length > 80) {
      this.activeMusicNodes = this.activeMusicNodes.slice(-40);
    }
  }
}

export const sound = new SoundEngine();
