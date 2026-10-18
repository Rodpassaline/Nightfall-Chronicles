import { GROUND_Y, levels, type ItemKind, type ItemSpawn, type Kind, type LevelDef, type PropKind } from "./levels";
import { tuning as T } from "./tuning";
import { sound } from "./audio";
import stageLayersManifest from "./stage-layers.json";

export type GameHud = {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  special: number;
  specialReady: boolean;
  lives: number;
  bossName: string;
  bossHp: number;
  bossMax: number;
  bossOn: boolean;
  bossPhase?: number;
  bossTransforming?: boolean;
  toast: string;
  won: boolean;
  dead: boolean;
  title: string;
  dashReady: boolean;
  charge: number;
  sealsSolved?: number;
  sealsTotal?: number;
};

type Action = "left" | "right" | "jump" | "aimUp" | "aimDown" | "attack" | "dash" | "spell" | "guard" | "special";

type Body = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
  wall: -1 | 0 | 1;
};

type Enemy = Body & {
  id: number;
  kind: Kind;
  name: string;
  hp: number;
  max: number;
  facing: 1 | -1;
  boss: boolean;
  phase?: number;
  transformT?: number;
  homeX: number;
  homeY: number;
  t: number;
  cd: number;
  wind: number;
  state: string;
  hurt: number;
  dead: boolean;
  lastSwing: number;
  dying?: boolean;
  deathT?: number;
  deathDuration?: number;
  hoverT?: number;
  fired?: boolean;
  attackVariant?: number;
  emergeT?: number;
  emergeDuration?: number;
  emergeY?: number;
  alertSoundPlayed?: boolean;
};

type Shot = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  life: number;
  dmg: number;
  friendly: boolean;
  sprite: "spell" | "blood" | "slash";
  hits: number[];
  drawCenterY: number;
  frameLock: number;
  gravity?: number;
};

const CODE: Record<string, Action[]> = {
  KeyA: ["left"],
  ArrowLeft: ["left"],
  KeyD: ["right"],
  ArrowRight: ["right"],
  KeyW: ["jump"],
  Space: ["jump"],
  ArrowUp: ["jump", "aimUp"],
  KeyS: ["aimDown"],
  ArrowDown: ["aimDown"],
  KeyJ: ["attack"],
  KeyZ: ["attack"],
  KeyK: ["dash"],
  ShiftLeft: ["dash"],
  ShiftRight: ["dash"],
  KeyL: ["spell"],
  KeyF: ["spell"],
  KeyI: ["guard"],
  KeyC: ["guard"],
  KeyE: ["special"],
  KeyX: ["special"],
  KeyV: ["special"],
  KeyU: ["special"],
};

const SRC = {
  heroIdle: "/sprites/hero-idle.png",
  heroRun: "/sprites/hero-run.png",
  heroJump: "/sprites/hero-jump.png",
  heroAttack: "/sprites/hero-attack.png",
  heroCrouch: "/sprites/hero-crouch.png",
  heroCast: "/sprites/hero-cast.png",
  heroDash: "/sprites/hero-dash.png",
  heroGuard: "/sprites/hero-guard.png",
  heroDie: "/sprites/hero-die.png",
  heroSpecial: "/sprites/hero-special.png",
  crescentSlash: "/sprites/crescent-slash.png",
  vampire: "/sprites/vampire.png",
  vampireDie: "/sprites/vampire-die.png",
  gargoyle: "/sprites/gargoyle.png",
  gargoyleDie: "/sprites/gargoyle-die.png",
  bat: "/sprites/bat.png",
  batDie: "/sprites/bat-die.png",
  skeleton: "/sprites/skeleton.png",
  skeletonDie: "/sprites/skeleton-die.png",
  armoredSkeleton: "/sprites/armored-skeleton.png",
  armoredSkeletonDie: "/sprites/armored-skeleton-die.png",
  redSkeleton: "/sprites/red-skeleton.png",
  redSkeletonDie: "/sprites/red-skeleton-die.png",
  zombie: "/sprites/zombie.png",
  zombieDie: "/sprites/zombie-die.png",
  knight: "/sprites/knight.png",
  knightDie: "/sprites/knight-die.png",
  dracula: "/sprites/dracula.png",
  bossPetros: "/sprites/boss-petros.png",
  bossPetrosP2: "/sprites/boss-petros-p2.png",
  bossValerius: "/sprites/boss-valerius.png",
  bossValeriusP2: "/sprites/boss-valerius-p2.png",
  bossSeraphine: "/sprites/boss-seraphine.png",
  bossSeraphineP2: "/sprites/boss-seraphine-p2.png",
  bossNocturne: "/sprites/boss-nocturne.png",
  bossNocturneP2: "/sprites/boss-nocturne-p2.png",
  bossVeyne: "/sprites/boss-veyne.png",
  bossVeyneP2: "/sprites/boss-veyne-p2.png",
  bossCalx: "/sprites/boss-calx.png",
  bossCalxP2: "/sprites/boss-calx-p2.png",
  bossDracula: "/sprites/boss-dracula.png",
  bossDraculaP2: "/sprites/boss-dracula-p2.png",
  portalGate: "/sprites/portal-gate.png",
  slash: "/sprites/slash.png",
  spell: "/sprites/spell.png",
  blood: "/sprites/blood.png",
} as const;

const ITEM_SRC: Record<ItemKind, string> = {
  life: "/sprites/item-life.png",
  heal: "/sprites/item-heal.png",
  mana: "/sprites/item-mana.png",
};

type ActiveItem = {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  w: number;
  h: number;
  collected: boolean;
  bounceT: number;
};

const PROP_SRC: Record<PropKind, string> = {
  house: "/sprites/house.png",
  ruin: "/sprites/ruin.png",
  column: "/sprites/column.png",
  marbleColumn: "/sprites/marble-column-full.png",
  brokenColumn: "/sprites/marble-column-broken.png",
  hangingColumn: "/sprites/marble-column-hanging.png",
  gladiatorStatue: "/sprites/statue-gladiator.png",
  sconceBlue: "/sprites/sconce-blue.png",
  gargoyle: "/sprites/prop-gargoyle.png",
  gate: "/sprites/prop-gate.png",
  fence: "/sprites/prop-fence.png",
  blockGrass: "/sprites/prop-block-grass.png",
  blockStone: "/sprites/prop-block-stone.png",
  candelabra: "/sprites/prop-candelabra.png",
  statue: "/sprites/prop-statue.png",
  pew: "/sprites/prop-pew.png",
  pewRight: "/sprites/prop-pew-right.png",
  altar: "/sprites/prop-altar.png",
  angel: "/sprites/prop-angel.png",
  angelTall: "/sprites/prop-angel-tall.png",
  coffin: "/sprites/prop-coffin.png",
  coffinOpen: "/sprites/prop-coffin-open.png",
  tomb: "/sprites/prop-tomb.png",
  cell: "/sprites/prop-cell.png",
  bookshelf: "/sprites/prop-bookshelf.png",
  ladder: "/sprites/prop-ladder.png",
  desk: "/sprites/prop-desk.png",
  globe: "/sprites/prop-globe.png",
  books: "/sprites/prop-books.png",
  cauldronGreen: "/sprites/prop-cauldron-green.png",
  cauldronPurple: "/sprites/prop-cauldron-purple.png",
  potions: "/sprites/prop-potions.png",
  alchemyTable: "/sprites/prop-alchemy-table.png",
  crystals: "/sprites/prop-crystals.png",
  throne: "/sprites/prop-throne.png",
  shield: "/sprites/prop-shield.png",
  banner: "/sprites/prop-banner.png",
  stainedGlass: "/sprites/prop-stained-glass.png",
  chains: "/sprites/prop-chains.png",
};

const PROP_H: Record<PropKind, number> = {
  house: 146,
  ruin: 132,
  column: 160,
  marbleColumn: 190,
  brokenColumn: 120,
  hangingColumn: 150,
  gladiatorStatue: 180,
  sconceBlue: 52,
  gargoyle: 95,
  gate: 160,
  fence: 75,
  blockGrass: 46,
  blockStone: 46,
  candelabra: 85,
  statue: 95,
  pew: 65,
  pewRight: 65,
  altar: 95,
  angel: 140,
  angelTall: 165,
  coffin: 105,
  coffinOpen: 105,
  tomb: 95,
  cell: 130,
  bookshelf: 180,
  ladder: 150,
  desk: 75,
  globe: 70,
  books: 35,
  cauldronGreen: 85,
  cauldronPurple: 75,
  potions: 80,
  alchemyTable: 75,
  crystals: 55,
  throne: 145,
  shield: 55,
  banner: 150,
  stainedGlass: 175,
  chains: 140,
};

const FG_SRC = {
  pillar: "/sprites/fg-pillar.png",
  curtainLeft: "/sprites/fg-curtain-left.png",
  curtainRight: "/sprites/fg-curtain-right.png",
} as const;

type FgKey = keyof typeof FG_SRC;

type ArtKey = keyof typeof SRC;

const DRAW_H: Record<Kind | "hero", number> = {
  hero: 185,
  vampire: 112,
  skeleton: 104,
  armoredSkeleton: 110,
  redSkeleton: 104,
  zombie: 104,
  knight: 116,
  gargoyle: 112,
  bat: 46,
  dracula: 144,
  bossPetros: 146,
  bossValerius: 144,
  bossSeraphine: 138,
  bossNocturne: 146,
  bossVeyne: 142,
  bossCalx: 154,
  bossDracula: 148,
};

// Exact vertical offset so enemy feet touch the ground with 0px hovering
const FEET_OFF: Record<Kind, number> = {
  skeleton: 9,
  armoredSkeleton: 8,
  redSkeleton: 8,
  vampire: 10,
  gargoyle: 10,
  bat: 0,
  zombie: 4,
  knight: 2,
  dracula: 8,
  bossPetros: 11,
  bossValerius: 11,
  bossSeraphine: 3,
  bossNocturne: 0,
  bossVeyne: 4,
  bossCalx: 12,
  bossDracula: 8,
};

function getDeathSpriteKey(kind: Kind): ArtKey {
  switch (kind) {
    case "bat":
      return "batDie";
    case "zombie":
      return "zombieDie";
    case "skeleton":
      return "skeletonDie";
    case "armoredSkeleton":
      return "armoredSkeletonDie";
    case "redSkeleton":
      return "redSkeletonDie";
    case "knight":
      return "knightDie";
    case "gargoyle":
      return "gargoyleDie";
    case "vampire":
      return "vampireDie";
    case "bossPetros":
      return "gargoyleDie";
    case "bossValerius":
      return "knightDie";
    case "bossSeraphine":
      return "vampireDie";
    case "bossNocturne":
      return "skeletonDie";
    case "bossVeyne":
      return "vampireDie";
    case "bossCalx":
      return "gargoyleDie";
    case "bossDracula":
    case "dracula":
      return "vampireDie";
    default:
      return "skeletonDie";
  }
}

function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

// Cache-busting version token generated per page session to prevent Chrome from serving stale cached sprites
const ASSET_VERSION = Date.now().toString(36);

const IMAGE_CACHE = new Map<string, HTMLImageElement>();

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    if (typeof window === "undefined") {
      resolve({} as HTMLImageElement);
      return;
    }
    let img = IMAGE_CACHE.get(src);
    if (img && img.complete && img.naturalWidth > 0) {
      resolve(img);
      return;
    }
    if (!img) {
      img = new Image();
      IMAGE_CACHE.set(src, img);
      const versionedSrc = src.includes("?") ? src : `${src}?v=${ASSET_VERSION}`;
      img.src = versionedSrc;
    }
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
      return;
    }
    const onDone = () => {
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onDone);
      resolve(img);
    };
    img.addEventListener("load", onDone);
    img.addEventListener("error", onDone);
  });
}

// Background eager preloader for all game assets
export function preloadAllGameAssets() {
  if (typeof window === "undefined") return;
  for (const src of Object.values(SRC)) void preloadImage(src);
  for (const src of Object.values(PROP_SRC)) void preloadImage(src);
  for (const src of Object.values(ITEM_SRC)) void preloadImage(src);
  for (const src of Object.values(FG_SRC)) void preloadImage(src);
  void preloadImage("/art/parallax/sky.jpg");
  void preloadImage("/art/parallax/far.jpg");
  void preloadImage("/art/parallax/fog.png");
  for (let i = 1; i <= 7; i++) {
    void preloadImage(`/art/stage-${i}.jpg`);
    void preloadImage(`/art/stages/s${i}/back.jpg`);
    void preloadImage(`/art/stages/s${i}/floor.jpg`);
    void preloadImage(`/art/stages/s${i}/fg.png`);
  }
  void preloadImage("/art/stages/s1/mid.png");
}

if (typeof window !== "undefined") {
  setTimeout(preloadAllGameAssets, 50);
}

export function mountCampaign(
  canvas: HTMLCanvasElement,
  levelId: number,
  onHud: (hud: GameHud) => void,
) {
  const level = levels.find((item) => item.id === levelId) ?? levels[0];
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const g: CanvasRenderingContext2D = ctx;
  g.imageSmoothingEnabled = false;
  canvas.width = T.viewW;
  canvas.height = T.viewH;

  const art: Partial<Record<ArtKey, HTMLImageElement>> = {};
  const propsArt: Partial<Record<PropKind, HTMLImageElement>> = {};
  const itemArt: Partial<Record<ItemKind, HTMLImageElement>> = {};
  const fgArt: Partial<Record<FgKey, HTMLImageElement>> = {};
  let bg: HTMLImageElement | null = null;
  const plates: Partial<Record<"sky" | "far" | "back" | "mid" | "floor" | "fog" | "fg", HTMLImageElement>> = {};
  const stageCfg = (stageLayersManifest as Record<string, { mid?: boolean; fg?: boolean }>)[String(level.id)] || {};
  const plateSrc: Record<string, string> = {
    sky: "/art/parallax/sky.jpg",
    far: "/art/parallax/far.jpg",
    back: `/art/stages/s${level.id}/back.jpg`,
    floor: `/art/stages/s${level.id}/floor.jpg`,
    fog: "/art/parallax/fog.png",
  };
  if (stageCfg.mid) {
    plateSrc.mid = `/art/stages/s${level.id}/mid.png`;
  }
  if (stageCfg.fg) {
    plateSrc.fg = `/art/stages/s${level.id}/fg.png`;
  }

  let readyToRender = false;
  const loadPromise = Promise.all([
    ...Object.entries(SRC).map(async ([key, src]) => {
      art[key as ArtKey] = await preloadImage(src);
    }),
    ...Object.entries(PROP_SRC).map(async ([key, src]) => {
      propsArt[key as PropKind] = await preloadImage(src);
    }),
    ...Object.entries(ITEM_SRC).map(async ([key, src]) => {
      itemArt[key as ItemKind] = await preloadImage(src);
    }),
    ...Object.entries(FG_SRC).map(async ([key, src]) => {
      fgArt[key as FgKey] = await preloadImage(src);
    }),
    (async () => {
      bg = await preloadImage(level.bg);
    })(),
    ...Object.entries(plateSrc).map(async ([key, src]) => {
      plates[key as keyof typeof plates] = await preloadImage(src);
    }),
  ]);

  void loadPromise.then(() => {
    readyToRender = true;
  });

  const keys = new Set<string>();
  const keysDownThisFrame = new Set<string>();
  const injected = new Set<string>();
  const pointer = new Set<Action>();
  const pointerDownThisFrame = new Set<Action>();
  let alive = true;
  let paused = false;
  let raf = 0;
  let acc = 0;
  let last = performance.now();
  let time = 0;
  let camX = 0;
  let camY = 0;
  let shake = 0;
  let hitstop = 0;
  let nextId = 1;
  let prev = new Set<Action>();
  const shots: Shot[] = [];
  type SpecialSlash = {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    facing: 1 | -1;
    life: number;
    maxLife: number;
    hitEnemies: Set<number>;
  };
  const specialSlashes: SpecialSlash[] = [];
  let enemies: Enemy[] = [];
  let items: ActiveItem[] = [];
  let clearedOnce = false;
  let bossIntroPlayed = false;
  let bossEnragedAnnounced = false;
  let ambushTimer = 4.0;

  const STAND_H = 50;
  const CROUCH_H = 30;

  const player = {
    x: 40,
    y: GROUND_Y - STAND_H,
    w: 18,
    h: STAND_H,
    vx: 0,
    vy: 0,
    facing: 1 as 1 | -1,
    grounded: true,
    wall: 0 as -1 | 0 | 1,
    coyote: T.coyote as number,
    buffer: 0,
    attackBuffer: 0,
    dashBuffer: 0,
    spellBuffer: 0,
    jumps: 1,
    dashT: 0,
    dashCd: 0,
    dashDir: 1 as 1 | -1,
    iframes: 0,
    hurtT: 0,
    hp: T.maxHp as number,
    mana: T.maxMana as number,
    special: 0,
    specialT: 0,
    specialDuration: 0.85,
    lives: 3,
    attackT: 0,
    attackLock: 0,
    castT: 0,
    castFired: false,
    guard: false,
    guardT: 0,
    guardFlash: 0,
    attackKind: "side" as "side" | "up" | "down" | "crouch",
    combo: 0,
    comboWindow: 0,
    swingId: 0,
    holdT: 0,
    charge: "idle" as "idle" | "wind",
    dropT: 0,
    controlLock: 0,
    crouching: false,
    dead: false,
    dying: false,
    deathT: 0,
    deathDuration: 1.05,
    willRevive: false,
    won: false,
    toast: `${level.title}. ${level.place}.`,
    toastT: 2.8,
  };

  type AmbientParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    maxAlpha: number;
    color: string;
    depth: "mid" | "fg";
    pulse: number;
  };

  const particles: AmbientParticle[] = [];
  function initParticles() {
    particles.length = 0;
    const count = 52;
    for (let i = 0; i < count; i++) {
      const isFg = i % 3 === 0;
      let color = "#e2a23a";
      let vy = -8;
      const vx = (Math.random() - 0.5) * 12;
      if (level.theme === "library") {
        color = Math.random() > 0.4 ? "#f6d365" : "#fda085";
        vy = -5 - Math.random() * 8;
      } else if (level.theme === "catacombs") {
        color = Math.random() > 0.5 ? "#00f5d4" : "#48cae4";
        vy = Math.random() > 0.3 ? 20 + Math.random() * 30 : -6;
      } else if (level.theme === "alchemy") {
        color = Math.random() > 0.5 ? "#2ec4b6" : "#b5179e";
        vy = -16 - Math.random() * 18;
      } else if (level.theme === "chapel") {
        color = Math.random() > 0.3 ? "#fff1c9" : "#e2a23a";
        vy = -6 - Math.random() * 8;
      } else if (level.theme === "throne") {
        color = Math.random() > 0.3 ? "#ef233c" : "#ffb703";
        vy = -10 - Math.random() * 12;
      } else {
        color = Math.random() > 0.5 ? "#ff7b00" : "#d00000";
        vy = -10 - Math.random() * 12;
      }

      particles.push({
        x: Math.random() * level.width,
        y: Math.random() * 300,
        vx,
        vy,
        size: isFg ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.5,
        maxAlpha: isFg ? 0.85 : 0.6,
        color,
        depth: isFg ? "fg" : "mid",
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  initParticles();

  function tone(freq: number, dur: number) {
    const AC = window.AudioContext;
    if (!AC) return;
    const actx = (tone as { ctx?: AudioContext }).ctx ?? new AC();
    (tone as { ctx?: AudioContext }).ctx = actx;
    void actx.resume();
    const o = actx.createOscillator();
    const gain = actx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    gain.gain.value = 0.03;
    gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(gain);
    gain.connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + dur);
  }

  function findFloorFor(x: number, fallbackY: number): number {
    let best = fallbackY;
    let bestDist = Infinity;
    for (const s of level.solids) {
      if (x >= s.x && x <= s.x + s.w) {
        const dist = Math.abs(s.y - fallbackY);
        if (dist < bestDist && (s.y >= fallbackY - 50 || !s.oneWay)) {
          best = s.y;
          bestDist = dist;
        }
      }
    }
    return best;
  }

  function makeEnemy(spawn: LevelDef["spawns"][number], isEmerging = false): Enemy {
    const isBoss = !!spawn.boss;
    const h =
      spawn.kind === "bat"
        ? 18
        : spawn.kind === "zombie"
          ? 64
          : spawn.kind === "skeleton"
            ? 68
            : spawn.kind === "armoredSkeleton"
              ? 70
              : spawn.kind === "redSkeleton"
                ? 68
                : spawn.kind === "knight"
                  ? 76
                  : spawn.kind === "gargoyle"
                    ? 64
                    : spawn.kind === "vampire"
                      ? 72
                      : spawn.kind === "bossPetros"
                        ? 86
                        : spawn.kind === "bossValerius"
                          ? 84
                          : spawn.kind === "bossSeraphine"
                            ? 80
                            : spawn.kind === "bossNocturne"
                              ? 82
                              : spawn.kind === "bossVeyne"
                                ? 82
                                : spawn.kind === "bossCalx"
                                  ? 92
                                  : spawn.kind === "bossDracula" || spawn.kind === "dracula"
                                    ? 88
                                    : 72;

    const w =
      spawn.kind === "bat"
        ? 28
        : spawn.kind === "bossCalx"
          ? 44
          : spawn.kind === "bossPetros" || spawn.kind === "bossNocturne"
            ? 42
            : spawn.kind === "bossValerius" || spawn.kind === "knight"
              ? 30
              : spawn.kind === "armoredSkeleton"
                ? 26
                : spawn.kind === "redSkeleton"
                  ? 24
                  : spawn.kind === "bossDracula" || spawn.kind === "dracula"
                    ? 36
                    : 24;

    const approxFloor = spawn.y > 0 ? spawn.y : GROUND_Y;
    const floor = spawn.kind === "bat" ? approxFloor : findFloorFor(spawn.x + w / 2, approxFloor);
    const finalY = spawn.kind === "bat" ? floor - (spawn.boss ? 56 : 74) : floor - h;
    const y = isEmerging ? floor : finalY;

    // Balanced enemy & boss HP: regular enemies die in a fair 3-5 hit combo (and 1-shot to Special!), while Bosses provide an epic duel
    const stageFactor = 1 + (level.id - 1) * 0.04;
    const scaledHp = isBoss
      ? Math.round(spawn.hp * (1.55 + (level.id - 1) * 0.08))
      : spawn.kind === "bat"
        ? 2
        : Math.round(spawn.hp * stageFactor);

    return {
      id: nextId++,
      kind: spawn.kind,
      name: spawn.name || spawn.kind,
      x: spawn.x,
      y,
      w,
      h,
      vx: 0,
      vy: 0,
      grounded: spawn.kind !== "bat",
      wall: 0,
      hp: scaledHp,
      max: scaledHp,
      facing: -1,
      boss: isBoss,
      phase: 1,
      transformT: 0,
      homeX: spawn.x,
      homeY: finalY,
      t: Math.random() * 3,
      cd: isEmerging ? 0.45 : 0.75,
      wind: 0,
      state: isEmerging
        ? "emerge"
        : spawn.kind === "gargoyle" || spawn.kind === "bossPetros"
          ? "perch"
          : "idle",
      hurt: 0,
      dead: false,
      dying: false,
      deathT: 0,
      deathDuration: 0.6,
      lastSwing: -1,
      hoverT: 0,
      fired: false,
      attackVariant: 0,
      emergeT: 0,
      emergeDuration: 0.58,
      emergeY: finalY,
      alertSoundPlayed: false,
    };
  }

  // =========================================================================
  // GOTHIC SEAL PUZZLE SYSTEM (Sealed Iron Portcullis & Runic Blood Crystals)
  // =========================================================================
  type SealCrystal = {
    id: number;
    gateId: number;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    activated: boolean;
    pulseT: number;
    lastSwing: number;
  };

  type SealGate = {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    open: boolean;
    openProgress: number; // 0 = closed, 1 = fully raised into ceiling
    warnCooldown: number;
  };

  let sealCrystals: SealCrystal[] = [];
  let sealGates: SealGate[] = [];

  function initStagePuzzles() {
    sealCrystals = [];
    sealGates = [];

    // Stage-specific coordinates aligned with elevated platforms in each stage
    const gate1X = level.id === 1 ? 2480 : level.id === 2 ? 2150 : level.id === 7 ? 2100 : 2180;
    const gate2X = level.id === 1 ? 4720 : level.id === 2 ? 4840 : level.id === 7 ? 4460 : 4660;

    const c1X = level.id === 2 ? 750 : 710;
    const c1HintY = level.id === 2 ? 95 : 105;

    const c2X = level.id === 1 ? 1890 : 1630;
    const c2HintY = 75;

    const c3X = level.id === 1 ? 2850 : level.id === 2 ? 2930 : 2950;
    const c3HintY = level.id === 1 ? 80 : level.id === 2 ? 65 : 70;

    const c4X = level.id === 1 ? 4090 : level.id === 2 ? 4350 : level.id === 7 ? 4230 : 4310;
    const c4HintY = level.id === 2 ? 85 : 75;

    sealGates = [
      { id: 1, x: gate1X, y: 0, w: 22, h: GROUND_Y, open: false, openProgress: 0, warnCooldown: 0 },
      { id: 2, x: gate2X, y: 0, w: 22, h: GROUND_Y, open: false, openProgress: 0, warnCooldown: 0 },
    ];

    const rawCrystals = [
      { id: 1, gateId: 1, label: "SELO I", x: c1X, hintY: c1HintY },
      { id: 2, gateId: 1, label: "SELO II", x: c2X, hintY: c2HintY },
      { id: 3, gateId: 2, label: "SELO III", x: c3X, hintY: c3HintY },
      { id: 4, gateId: 2, label: "SELO IV", x: c4X, hintY: c4HintY },
    ];

    for (const rc of rawCrystals) {
      const floorY = findFloorFor(rc.x + 12, rc.hintY);
      const ch = 42;
      sealCrystals.push({
        id: rc.id,
        gateId: rc.gateId,
        label: rc.label,
        x: rc.x,
        y: floorY - ch,
        w: 24,
        h: ch,
        activated: false,
        pulseT: Math.random() * Math.PI * 2,
        lastSwing: -1,
      });
    }
  }

  function activateCrystal(c: SealCrystal) {
    if (c.activated || c.lastSwing === player.swingId) return;
    c.lastSwing = player.swingId;
    c.activated = true;
    sound.playSfx("relic");
    sound.playSfx("itemHeal");
    sound.playSfx("slice");
    shake = Math.max(shake, 7);
    hitstop = Math.max(hitstop, 0.04);

    // Reward player with +1 HP heal, +25 Mana, and +25% Special charge for solving the platforming seal!
    player.hp = Math.min(T.maxHp, player.hp + 1);
    player.mana = Math.min(T.maxMana, player.mana + 25);
    const wasFull = player.special >= 100;
    player.special = Math.min(100, player.special + 25);
    if (!wasFull && player.special >= 100) {
      sound.playSfx("relic");
    }

    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const spd = 40 + Math.random() * 75;
      particles.push({
        x: c.x + c.w / 2,
        y: c.y + c.h / 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        size: 2.5 + Math.random() * 2,
        alpha: 1,
        maxAlpha: 1,
        color: i % 2 === 0 ? "#ffd700" : "#ff1744",
        depth: "fg",
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const gateCrystals = sealCrystals.filter((item) => item.gateId === c.gateId);
    const solvedCount = gateCrystals.filter((item) => item.activated).length;
    const gate = sealGates.find((gItem) => gItem.id === c.gateId);
    if (gate && solvedCount >= gateCrystals.length) {
      gate.open = true;
      sound.playSfx("gateOpen");
      shake = Math.max(shake, 10);
      player.toast = `⛓️ ${c.label} quebrado (+1 HP)! O Portão de Ferro Selado se ergueu!`;
      player.toastT = 3.6;
    } else {
      player.toast = `🔮 ${c.label} quebrado (+1 HP · ${solvedCount}/${gateCrystals.length})! Quebre o próximo Cristal no alto!`;
      player.toastT = 3.4;
    }
  }

  function spawn() {
    player.x = Math.round(T.viewW / 2 - player.w / 2); // Start exactly in the center of the screen
    player.h = STAND_H;
    player.y = GROUND_Y - STAND_H;
    player.vx = 0;
    player.vy = 0;
    camX = 0;
    camY = 0;
    player.facing = 1;
    player.crouching = false;
    player.hp = T.maxHp;
    player.mana = T.maxMana;
    player.special = 0;
    player.specialT = 0;
    player.lives = 3;
    player.dead = false;
    player.dying = false;
    player.deathT = 0;
    player.deathDuration = 1.05;
    player.willRevive = false;
    player.won = false;
    player.iframes = 0;
    player.hurtT = 0;
    player.attackT = 0;
    player.attackLock = 0;
    player.castT = 0;
    player.castFired = false;
    player.dashT = 0;
    player.charge = "idle";
    player.holdT = 0;
    player.toast = `${level.title}. Quebre os Cristais de Selo no alto para abrir os Portões!`;
    player.toastT = 3.2;
    clearedOnce = false;
    bossIntroPlayed = false;
    bossEnragedAnnounced = false;
    ambushTimer = 24.0;
    sound.stopBossVoice();
    shots.length = 0;
    specialSlashes.length = 0;
    enemies = level.spawns.map((s) => makeEnemy(s));
    items = level.items.map((it) => ({
      id: it.id,
      kind: it.kind,
      x: it.x,
      y: it.y,
      w: 24,
      h: 24,
      collected: false,
      bounceT: Math.random() * Math.PI * 2,
    }));
    initStagePuzzles();
    initParticles();
    // Play stage-specific music track (Fase 1-7, com Fase 7 tocando Sinister Horror para o Mestre)
    sound.playStageBgm(level.id);
  }

  function actions() {
    const set = new Set<Action>([...pointer, ...pointerDownThisFrame]);
    for (const code of new Set([...keys, ...injected, ...keysDownThisFrame])) {
      const mapped = CODE[code];
      if (mapped) for (const action of mapped) set.add(action);
    }
    return set;
  }

  function resolve(body: Body, dt: number, drop: boolean) {
    body.wall = 0;
    body.grounded = false;
    body.x += body.vx * dt;
    // Collide with locked Gothic Seal Gates (blocks both player and enemies so foes behind a gate cannot phase through)
    for (const gate of sealGates) {
      if (gate.open) continue;
      if (overlap(body, gate)) {
        if (body.vx > 0 || body.x + body.w / 2 < gate.x + gate.w / 2) {
          body.x = gate.x - body.w;
          body.wall = 1;
        } else {
          body.x = gate.x + gate.w;
          body.wall = -1;
        }
        body.vx = 0;
        if (body === player && gate.warnCooldown <= 0) {
          gate.warnCooldown = 2.2;
          const gateCrystals = sealCrystals.filter((c) => c.gateId === gate.id);
          const missing = gateCrystals.find((c) => !c.activated);
          const broken = gateCrystals.filter((c) => c.activated).length;
          const distM = missing ? Math.max(1, Math.round(Math.abs(player.x - missing.x) / 18)) : 0;
          sound.playSfx("slash");
          player.toast = `🔒 Portão Selado (${broken}/${gateCrystals.length})! Volte ${distM}m e quebre o ${missing?.label || "Cristal"} nas plataformas!`;
          player.toastT = 3.0;
        }
      }
    }
    for (const s of level.solids) {
      if (s.oneWay || !overlap(body, s)) continue;
      const feet = body.y + body.h;
      const rise = feet - s.y;
      if (rise > 0 && rise <= 16 && body.vy >= 0) {
        body.y -= rise;
        body.vy = 0;
        body.grounded = true;
        continue;
      }
      if (body.vx > 0) {
        body.x = s.x - body.w;
        body.wall = 1;
      } else if (body.vx < 0) {
        body.x = s.x + s.w;
        body.wall = -1;
      }
      body.vx = 0;
    }
    const prevBottom = body.y + body.h;
    const prevTop = body.y;
    body.y += body.vy * dt;
    for (const s of level.solids) {
      if (!overlap(body, s)) continue;
      if (s.oneWay) {
        if (drop || body.vy < 0 || prevBottom > s.y + 1) continue;
        body.y = s.y - body.h;
        body.vy = 0;
        body.grounded = true;
        continue;
      }
      if (body.vy >= 0 && prevBottom <= s.y + 1) {
        body.y = s.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else if (body.vy < 0 && prevTop >= s.y + s.h - 1) {
        body.y = s.y + s.h;
        body.vy = 0;
      } else if (body.y + body.h / 2 < s.y + s.h / 2) {
        body.y = s.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else {
        body.y = s.y + s.h;
        body.vy = 0;
      }
    }
    // Ground resting check: if resting directly on top of a solid surface, maintain grounded
    if (!body.grounded && body.vy >= 0) {
      for (const s of level.solids) {
        if (body.x + body.w > s.x && body.x < s.x + s.w) {
          if (Math.abs(body.y + body.h - s.y) <= 2.5) {
            body.y = s.y - body.h;
            body.vy = 0;
            body.grounded = true;
            break;
          }
        }
      }
    }
  }

  function hurtPlayer(dmg: number, fromX: number, hitSource: "slash" | "spell" = "slash") {
    if (player.iframes > 0 || player.dead || player.won) return;
    if (player.guard && (fromX - (player.x + player.w / 2)) * player.facing > -6) {
      player.iframes = Math.max(player.iframes, 0.18);
      player.vx = -player.facing * 130;
      player.guardFlash = 0.18;
      hitstop = T.hitstopLight;
      shake = Math.max(shake, 2);
      sound.playSfx("slash");
      return;
    }
    const isFatal = player.hp <= dmg;
    player.hp -= dmg;
    player.iframes = T.hurtIFrames;
    player.hurtT = 0.16;
    player.charge = "idle";
    player.attackT = 0;
    if (player.castT > 0 && !player.castFired) player.mana = Math.min(T.maxMana, player.mana + T.spellCost);
    player.castT = 0;
    player.castFired = false;
    player.dashT = 0;
    hitstop = T.hitstopLight;
    shake = 5;
    sound.playSfx("hurt");
    if (hitSource === "spell") {
      sound.playSfx("spell");
    } else {
      sound.playSfx("slice");
    }

    if (isFatal) {
      player.hp = 0;
      player.dying = true;
      player.deathT = 0;
      player.deathDuration = 1.15;
      player.controlLock = 999;
      player.h = STAND_H;
      player.crouching = false;
      player.vx = player.facing * -20;
      player.vy = 0; // ZERO vertical pop on fatal hit!
      player.grounded = true;
      player.willRevive = player.lives > 1;
      shake = 6;
      if (!player.willRevive) {
        player.toast = "Aldric sucumbiu às sombras da noite...";
        player.toastT = 4.0;
      }
    } else {
      player.vy = -120;
      player.vx = player.x < fromX ? -110 : 110;
    }
  }

  function hurtEnemy(e: Enemy, dmg: number, pogo: boolean, hitSource: "slash" | "spell" = "slash") {
    if (e.dead || e.dying || e.lastSwing === player.swingId) return;
    if (e.state === "emerge" && (e.emergeT ?? 0) < 0.22) return;
    if (e.boss && (e.transformT ?? 0) > 0) return;

    // Armored Skeleton buckler shield deflection (frontal horizontal attacks)
    if (e.kind === "armoredSkeleton" && !pogo) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 105;
        player.toast = "Bloqueado pelo Escudo! Pule e use Golpe Descendente!";
        player.toastT = 1.6;
        shake = 3;
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: e.x + (e.facing > 0 ? e.w : 0),
            y: e.y + e.h / 2,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 60,
            size: 2,
            alpha: 1,
            maxAlpha: 1,
            color: "#60a5fa",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
        return;
      }
    }

    // Boss Valerius shield blocking front attacks (Phase 1 only — in Phase 2 Berserker he discards his shield for a giant two-handed greatsword!)
    if (e.kind === "bossValerius" && (e.phase ?? 1) < 2 && e.state === "shield" && !pogo) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 110;
        player.toast = "Escudo de Valerius bloqueou o golpe! Ataque por cima ou pelas costas!";
        player.toastT = 1.8;
        shake = 3;
        return;
      }
    }

    // Knight tower shield complete deflection (frontal horizontal attacks)
    if (e.kind === "knight" && (e.state === "shield" || e.state === "charge") && !pogo) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 120;
        player.toast = "Escudo de Aço! Pule e use Golpe Descendente ou ataque por trás!";
        player.toastT = 1.6;
        shake = 3;
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: e.x + (e.facing > 0 ? e.w : 0),
            y: e.y + e.h / 2,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 60,
            size: 2,
            alpha: 1,
            maxAlpha: 1,
            color: "#94a3b8",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
        return;
      }
    }

    const isFatal = e.hp <= dmg;
    const knockDir = (e.x + e.w / 2) >= (player.x + player.w / 2) ? 1 : -1;
    e.lastSwing = player.swingId;
    e.hp -= dmg;

    if (isFatal) {
      e.hp = 0;
      e.dying = true;
      e.deathT = 0;
      e.deathDuration = e.boss ? 1.25 : 0.65;
      e.state = "dying";
      e.wind = 0;
      e.vx = knockDir * (e.boss ? 10 : 16);
      e.vy = 0; // ZERO vertical pop on fatal hit!
      if (e.kind !== "bat") e.grounded = true;
      sound.playSfx(e.boss ? "bossHurt" : "enemyDie");
      shake = Math.max(shake, e.boss ? 8 : 4);

      // Increase special meter on enemy kill (4 to 5 kills fills the 100% Special bar!)
      const gain = e.boss ? 40 : e.kind === "knight" || e.kind === "armoredSkeleton" || e.kind === "gargoyle" || e.kind === "vampire" ? 25 : 20;
      const wasFull = player.special >= 100;
      player.special = Math.min(100, player.special + gain);
      if (!wasFull && player.special >= 100) {
        player.toast = "⚔️ GOLPE CRESCENTE PRONTO! [E] ou [Ataque + Magia]";
        player.toastT = 3.2;
        sound.playSfx("relic");
      }

      // Thematic death burst particles for all enemies
      const burstCount = e.boss ? 36 : 16;
      for (let i = 0; i < burstCount; i++) {
        const angle = (i / burstCount) * Math.PI * 2;
        const spd = 35 + Math.random() * (e.boss ? 85 : 50);
        let pColor = "#ff1744";
        if (e.kind === "skeleton" || e.kind === "armoredSkeleton") pColor = i % 2 === 0 ? "#e2e8f0" : "#94a3b8";
        else if (e.kind === "redSkeleton") pColor = i % 2 === 0 ? "#ef4444" : "#7f1d1d";
        else if (e.kind === "zombie") pColor = i % 2 === 0 ? "#4ade80" : "#15803d";
        else if (e.kind === "knight") pColor = i % 2 === 0 ? "#64748b" : "#cbd5e1";
        else if (e.kind === "bat") pColor = i % 2 === 0 ? "#b91c1c" : "#1e1b4b";
        else if (e.kind === "gargoyle") pColor = i % 2 === 0 ? "#78716c" : "#44403c";
        else if (e.kind === "vampire" || e.boss) pColor = i % 2 === 0 ? "#ffd700" : "#ff1744";

        particles.push({
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 20,
          size: 2 + Math.random() * 2,
          alpha: 1,
          maxAlpha: 1,
          color: pColor,
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
      return; // Do not apply non-fatal recoil or hitstun
    }

    // Hitstun duration and recovery delay (responsive stagger when Aldric hits an enemy)
    const isHeavy = player.combo === 2 || hitSource === "spell" || pogo || dmg >= 2;
    e.hurt = e.boss ? (isHeavy ? 0.22 : 0.16) : (isHeavy ? 0.38 : 0.30);
    e.cd = Math.max(e.cd, e.boss ? 0.32 : 0.48);
    e.wind = 0; // Interrupt active windup on enemies
    if (!e.boss && e.state === "slash") e.state = "idle";

    // Dynamic recoil impulse (knocks the enemy back horizontally along the stone floor)
    const baseKnock = e.boss ? 36 : (e.kind === "armoredSkeleton" || e.kind === "knight") ? 75 : 108;
    const knockSpeed = isHeavy ? baseKnock * 1.3 : baseKnock;
    e.vx = knockDir * knockSpeed;
    if (e.kind !== "bat" && !(e.kind === "gargoyle" && (e.state === "hover" || e.state === "dive"))) {
      e.vy = 0; // Pure horizontal recoil on the stone floor, never pop up into the air!
      e.grounded = true;
    }
    if (e.kind === "gargoyle" && (e.state === "hover" || e.state === "dive")) {
      e.state = "hover";
      e.hoverT = 0;
      e.cd = 0.40;
    }

    hitstop = dmg >= 3 ? T.hitstopHeavy : T.hitstopLight;
    shake = Math.max(shake, 3);
    sound.playSfx(e.boss ? "bossHurt" : "enemyHurt");
    if (hitSource === "spell") {
      sound.playSfx("spell");
    } else {
      sound.playSfx(player.combo === 2 ? "slashHeavy" : "slice");
    }
    if (pogo) {
      player.vy = -T.pogoV;
      player.jumps = 1;
      player.grounded = false;
      sound.playSfx("pogo");
    }
  }

  function fire(partial: Omit<Shot, "hits" | "drawCenterY" | "frameLock"> & { drawCenterY?: number; frameLock?: number }) {
    shots.push({
      ...partial,
      hits: [],
      drawCenterY: partial.drawCenterY ?? partial.y + partial.h / 2,
      frameLock: partial.frameLock ?? -1,
    });
  }

  const SLASH_ROOT = [
    { x: 59, y: 68 },
    { x: 63, y: 71 },
    { x: 16, y: 63 },
    { x: 38, y: 34 },
  ];

  function cellLocal(px: number, py: number, height: number) {
    return { dx: ((px - 64) / 128) * height, up: ((128 - py) / 128) * height };
  }

  function swordPoint(_frame: number) {
    return {
      x: player.x + player.w / 2 + player.facing * 40,
      y: player.y + player.h - (player.crouching ? 20 : 60),
    };
  }

  function handPoint() {
    if (player.crouching) {
      return {
        x: player.x + player.w / 2 + player.facing * 34,
        y: player.y + player.h - 22,
      };
    }
    return {
      x: player.x + player.w / 2 + player.facing * 56,
      y: player.y + player.h - 58,
    };
  }

  function blitRoot(
    img: HTMLImageElement | undefined,
    frame: number,
    worldX: number,
    worldY: number,
    height: number,
    facing: number,
    anchorX: number,
    anchorY: number,
  ) {
    const o = cellLocal(anchorX, anchorY, height);
    blit(img, frame, worldX - facing * o.dx, worldY + o.up, height, facing);
  }

  function step(dt: number, press: { jump: boolean; attack: boolean; dash: boolean; spell: boolean; special?: boolean }, held: Set<Action>) {
    time += dt;
    player.toastT = Math.max(0, (player.toastT || 0) - dt);
    player.iframes = Math.max(0, (player.iframes || 0) - dt);
    player.hurtT = Math.max(0, (player.hurtT || 0) - dt);
    player.dashCd = Math.max(0, (player.dashCd || 0) - dt);
    player.attackLock = Math.max(0, Math.min(0.9, (player.attackLock || 0) - dt));
    player.comboWindow = Math.max(0, (player.comboWindow || 0) - dt);
    player.dropT = Math.max(0, (player.dropT || 0) - dt);
    if (!player.dying) {
      player.controlLock = Math.max(0, Math.min(0.5, (player.controlLock || 0) - dt));
    }
    if (player.specialT > 0) {
      player.specialT = Math.max(0, Math.min(0.9, player.specialT - dt));
      player.iframes = Math.max(player.iframes, 0.25);
    }
    // Never allow charge="wind" to persist and freeze the character!
    if (player.charge === "wind") {
      player.charge = "idle";
    }

    // Update Gothic Seal Gates & Crystals
    for (const gate of sealGates) {
      gate.warnCooldown = Math.max(0, gate.warnCooldown - dt);
      if (gate.open && gate.openProgress < 1) {
        gate.openProgress = Math.min(1, gate.openProgress + dt * 1.4);
      }
    }
    for (const c of sealCrystals) {
      c.pulseT += dt * 3.5;
    }

    if (player.dying) {
      player.vx *= Math.max(0, 1 - 8 * dt);
      if (!player.grounded) {
        // If killed while in midair (e.g. jumping): drop rapidly straight down to the floor, do NOT advance collapse animation in midair!
        player.vy = Math.min(player.vy + T.gravDown * 1.6 * dt, T.terminal);
        resolve(player, dt, false);
      } else {
        // Firmly on the floor: zero vertical velocity and advance ground collapse animation
        player.vy = 0;
        player.deathT += dt;
        resolve(player, dt, false);
      }

      if (player.deathT >= player.deathDuration) {
        if (player.willRevive) {
          player.lives--;
          player.hp = T.maxHp;
          player.mana = Math.max(player.mana, 60);
          player.iframes = 3.2; // 3.2s invulnerability (flicker)
          player.hurtT = 0;
          player.vx = 0;
          player.vy = -70;
          player.dying = false;
          player.dead = false;
          player.controlLock = 0;
          player.toast = `Ressuscitado! Sangue ancestral desperta! Vidas restantes: ${player.lives}`;
          player.toastT = 3.5;
          sound.playSfx("revive");
          shake = 6;

          // Push nearby enemies away to give breathing room
          for (const e of enemies) {
            if (!e.dead && !e.dying && Math.abs(e.x + e.w / 2 - (player.x + player.w / 2)) < 90) {
              e.vx = e.x > player.x ? 150 : -150;
              e.hurt = 0.45;
            }
          }

          // Radiant resurrection burst particles
          for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            const spd = 40 + Math.random() * 80;
            particles.push({
              x: player.x + player.w / 2,
              y: player.y + player.h / 2,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 20,
              size: 2.5 + Math.random() * 2,
              alpha: 1,
              maxAlpha: 1,
              color: i % 2 === 0 ? "#ffd700" : "#ff4d6d",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        } else {
          player.lives = 0;
          player.hp = 0;
          player.dying = false;
          player.dead = true;
          sound.stopBossVoice();
          player.toast = "Fim de jogo! Todas as 3 vidas foram perdidas.";
          player.toastT = 4.0;
          sound.playBgm("gameover");
        }
      }
      return;
    }

    if (!player.dead && !player.won) player.mana = Math.min(T.maxMana, player.mana + T.manaRegen * dt);
    if (player.dead || player.won) return;

    const left = held.has("left");
    const right = held.has("right");
    const aimUp = held.has("aimUp");
    const aimDown = held.has("aimDown");
    let dir = 0;
    if (left && !right) dir = -1;
    else if (right && !left) dir = 1;

    player.guardFlash = Math.max(0, player.guardFlash - dt);
    player.guard = held.has("guard") && player.grounded && player.attackT <= 0 && player.castT <= 0 && player.dashT <= 0 && player.hurtT <= 0;
    player.guardT = player.guard ? player.guardT + dt : 0;
    const wantsCrouch = (player.grounded || player.crouching) && aimDown && !player.guard && player.dashT <= 0 && player.dropT <= 0;
    player.crouching = wantsCrouch;
    const targetH = wantsCrouch ? CROUCH_H : STAND_H;
    if (player.h !== targetH) {
      player.y += (player.h - targetH);
      player.h = targetH;
    }

    if (press.jump) player.buffer = T.jumpBuffer;
    else player.buffer = Math.max(0, player.buffer - dt);
    if (press.attack) player.attackBuffer = 0.22;
    else player.attackBuffer = Math.max(0, player.attackBuffer - dt);
    if (press.dash) player.dashBuffer = 0.16;
    else player.dashBuffer = Math.max(0, player.dashBuffer - dt);
    if (press.spell) player.spellBuffer = 0.16;
    else player.spellBuffer = Math.max(0, player.spellBuffer - dt);

    if (player.attackT > 0) {
      player.attackT = Math.max(0, Math.min(0.35, player.attackT - dt));
      if (player.attackT <= 0.06 && player.castT <= 0) {
        player.comboWindow = Math.max(player.comboWindow, 0.24);
      }
    }
    if (player.attackT <= 0 && player.attackLock > 0 && player.castT <= 0) player.comboWindow = Math.max(player.comboWindow, 0.24);
    if (player.castT > 0) {
      const before = player.castT;
      player.castT = Math.max(0, Math.min(0.35, player.castT - dt));
      if (!player.castFired && before > 0.14 && player.castT <= 0.14) {
        player.castFired = true;
        const hand = handPoint();
        const crouch = player.crouching;
        fire({
          x: hand.x - 8,
          y: hand.y - 12,
          w: 16,
          h: 24,
          vx: crouch ? player.facing * 260 : aimUp ? player.facing * 60 : player.facing * 260,
          vy: crouch ? 0 : aimUp ? -210 : -4,
          life: 0.65,
          dmg: T.spellDamage,
          friendly: true,
          sprite: "spell",
          drawCenterY: hand.y,
        });
      }
    }

    // Charged Slash / Auto-Combo when holding Attack:
    // Never freezes Aldric in a "wind" pose! Instead, holding Attack for 0.55s automatically unleashes the Charged Wave and resets holdT.
    const holding = held.has("attack");
    if (holding && player.castT <= 0 && player.specialT <= 0) {
      player.holdT += dt;
      if (player.holdT >= 0.55 && player.attackLock <= 0) {
        player.holdT = 0;
        player.charge = "idle";
        player.swingId++;
        player.attackT = 0.24;
        player.attackLock = 0.22;
        player.attackKind = player.crouching ? "crouch" : "side";
        const tip = swordPoint(0);
        fire({
          x: tip.x - 11,
          y: tip.y - 12,
          w: 22,
          h: 24,
          vx: player.facing * 250,
          vy: 0,
          life: 0.36,
          dmg: T.chargeDamage,
          friendly: true,
          sprite: "slash",
          drawCenterY: tip.y,
          frameLock: 2,
        });
        sound.playSfx("chargeFire");
        sound.playSfx("slashHeavy");
        // Release stuck touch/pointer state if any so it never loops endlessly without user input
        pointer.delete("attack");
      }
    } else {
      player.holdT = 0;
      player.charge = "idle";
    }

    // Special Attack Trigger ("Golpe Crescente"):
    // Activated by pressing the dedicated Special button [E, X, V, U] OR pressing Attack + Magic simultaneously
    // when the special meter is full (>= 100)
    const wantsSpecial = (
      press.special ||
      held.has("special") ||
      ((press.attack || held.has("attack")) && (press.spell || held.has("spell")))
    ) && player.special >= 100 && player.specialT <= 0 && player.hurtT <= 0 && !player.guard;

    if (wantsSpecial) {
      player.special = 0;
      player.specialT = 0.85;
      player.specialDuration = 0.85;
      player.iframes = Math.max(player.iframes, 0.95);
      player.attackT = 0;
      player.attackLock = 0.85;
      player.attackBuffer = 0;
      player.castT = 0;
      player.dashT = 0;
      player.charge = "idle";
      player.holdT = 0;
      player.vx = 0;
      player.vy = 0;
      hitstop = 0.06;
      shake = 14;
      sound.playSfx("special");

      // Spawn Crescent Blade Wave forward!
      specialSlashes.push({
        id: nextId++,
        x: player.x + (player.facing > 0 ? player.w + 12 : -164),
        y: player.y - 40,
        w: 152,
        h: 132,
        vx: player.facing * 360,
        facing: player.facing,
        life: 0.70,
        maxLife: 0.70,
        hitEnemies: new Set(),
      });

      // Burst of red and white sparks around Aldric
      for (let i = 0; i < 32; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 90;
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 20,
          size: 2.5 + Math.random() * 2.5,
          alpha: 1,
          maxAlpha: 1,
          color: i % 2 === 0 ? "#ff1744" : "#ffffff",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    if (player.specialT > 0) {
      player.vx = 0;
      if (player.grounded) player.vy = 0;
    } else if (player.hurtT <= 0) {
      if ((press.attack || player.attackBuffer > 0) && !player.guard && player.castT <= 0 && (player.attackLock <= 0 || player.comboWindow > 0)) {
        player.attackBuffer = 0;
        player.swingId++;
        const down = aimDown && !player.grounded && !player.crouching;
        player.attackKind = down ? "down" : aimUp ? "up" : player.crouching ? "crouch" : "side";
        player.combo = (player.attackKind === "side" || player.attackKind === "crouch") && player.comboWindow > 0 ? (player.combo + 1) % 3 : 0;
        player.attackT = 0.20;
        player.attackLock = 0.18;
        player.comboWindow = 0;
        if (player.combo === 2) sound.playSfx("slashHeavy");
        else sound.playSfx("slash");
      }
      if ((press.spell || player.spellBuffer > 0) && !player.guard && player.castT <= 0) {
        player.spellBuffer = 0;
        if (player.mana < T.spellCost) {
          player.toast = "Mana insuficiente.";
          player.toastT = 0.6;
        } else {
          player.mana -= T.spellCost;
          player.castT = 0.28;
          player.castFired = false;
          player.attackT = 0;
          player.attackLock = 0.28;
          player.charge = "idle";
          player.holdT = 0;
          sound.playSfx("spell");
        }
      }
      if ((press.dash || player.dashBuffer > 0) && player.dashCd <= 0 && player.dashT <= 0) {
        player.dashBuffer = 0;
        const d = (dir !== 0 ? dir : player.facing) as 1 | -1;
        player.dashT = T.dashTime;
        player.dashCd = T.dashCooldown;
        player.dashDir = d;
        player.facing = d;
        player.crouching = false;
        player.iframes = Math.max(player.iframes, T.dashIFrames);
        player.charge = "idle";
        player.attackT = 0;
        if (player.castT > 0 && !player.castFired) player.mana = Math.min(T.maxMana, player.mana + T.spellCost);
        player.castT = 0;
        player.castFired = false;
        player.vy = 0;
        sound.playSfx("dash");
      }
    }

    if (player.dashT > 0) {
      player.dashT -= dt;
      player.vx = player.dashDir * T.dashSpeed;
      player.vy = 0;
    } else {
      if (player.castT > 0) {
        if (player.grounded) {
          player.vx *= Math.max(0, 1 - 4 * dt);
        } else {
          player.vx *= Math.max(0, 1 - 1.2 * dt);
        }
      } else if (player.guard) {
        player.vx *= Math.max(0, 1 - 14 * dt);
        if (dir !== 0 && player.controlLock <= 0) player.facing = dir as 1 | -1;
      } else if (player.crouching) {
        player.vx = 0;
        if (dir !== 0 && player.controlLock <= 0) player.facing = dir as 1 | -1;
      } else {
        const accel = player.grounded ? T.accelGround : T.accelAir;
        const lock = player.controlLock > 0 ? 0.35 : 1;
        if (dir !== 0) {
          const isReversing = Math.sign(player.vx) !== 0 && Math.sign(player.vx) !== dir;
          const turnMultiplier = isReversing ? 1.35 : 1;
          player.vx += dir * accel * lock * turnMultiplier * dt;
          if (player.controlLock <= 0) player.facing = dir as 1 | -1;
        } else if (player.grounded) {
          const s = Math.sign(player.vx);
          player.vx -= s * T.friction * dt;
          if (Math.sign(player.vx) !== s) player.vx = 0;
        } else {
          const s = Math.sign(player.vx);
          player.vx -= s * 900 * dt;
          if (Math.sign(player.vx) !== s) player.vx = 0;
        }
        const max = T.run;
        if (Math.abs(player.vx) > max) {
          const s = Math.sign(player.vx);
          player.vx -= s * 1400 * dt;
          if (Math.abs(player.vx) < max) player.vx = s * max;
        } else {
          player.vx = clamp(player.vx, -max, max);
        }
      }

      const touchingWall = player.wall !== 0 && !player.grounded;
      const slide = touchingWall && player.vy > 0 && ((player.wall === 1 && right) || (player.wall === -1 && left));
      if (slide) player.vy = Math.min(player.vy, T.wallSlide);

      if (player.buffer > 0 && player.grounded && aimDown) {
        player.dropT = 0.2;
        player.buffer = 0;
        player.vy = 40;
      } else if (player.buffer > 0 && (player.grounded || player.coyote > 0)) {
        player.vy = -T.jumpV;
        player.grounded = false;
        player.coyote = 0;
        player.buffer = 0;
        player.jumps = 1;
        sound.playSfx("jump");
      } else if (player.buffer > 0 && touchingWall) {
        player.vx = -player.wall * T.wallJumpX;
        player.vy = -T.wallJumpY;
        player.facing = (-player.wall) as 1 | -1;
        player.jumps = 1;
        player.buffer = 0;
        player.controlLock = T.wallLock;
        sound.playSfx("wallJump");
      } else if (player.buffer > 0 && player.jumps > 0 && !player.grounded) {
        player.vy = -T.doubleJumpV;
        player.jumps = 0;
        player.buffer = 0;
        sound.playSfx("doubleJump");
      }
      if (!held.has("jump") && player.vy < -120) {
        player.vy = Math.max(player.vy * Math.pow(0.84, dt * 60), -120);
      }
      let grav: number = player.vy < 0 ? T.gravUp : T.gravDown;
      if (Math.abs(player.vy) < T.apexBand) grav = T.gravApex;
      if (player.castT > 0 && !player.grounded) grav *= 0.7;
      player.vy = Math.min(player.vy + grav * dt, T.terminal);
    }

    resolve(player, dt, player.dropT > 0);
    if (player.grounded) {
      player.coyote = T.coyote;
      player.jumps = 1;
    } else player.coyote = Math.max(0, player.coyote - dt);
    if (player.dashT > 0 && player.wall !== 0) player.dashT = 0;
    player.x = clamp(player.x, 0, level.width - player.w);
    if (player.y > 420) {
      hurtPlayer(2, player.x);
      player.y = GROUND_Y - STAND_H;
      player.vy = -60;
    }

    const feetNow = player.y + player.h;
    const sideSwing = player.attackKind === "up" ? player.attackT > 0.06 && player.attackT < 0.18 : player.attackT > 0.04 && player.attackT < 0.16;
    if (sideSwing) {
      const box =
        player.attackKind === "up"
          ? { x: player.x - 10, y: feetNow - 128, w: player.w + 20, h: 40 }
          : player.attackKind === "down"
            ? { x: player.x - 6, y: feetNow - 6, w: player.w + 12, h: 22 }
            : player.attackKind === "crouch"
              ? {
                  x: player.facing > 0 ? player.x + player.w - 4 : player.x - 56,
                  y: feetNow - 38,
                  w: 60,
                  h: 38,
                }
              : {
                  x: player.facing > 0 ? player.x + player.w - 4 : player.x - 56,
                  y: feetNow - 86,
                  w: 60,
                  h: 68,
                };
      for (const e of enemies) if (!e.dead && !e.dying && overlap(box, e)) hurtEnemy(e, player.combo === 2 ? T.finisherDamage : T.slashDamage, player.attackKind === "down", "slash");

      // Shatter Gothic Seal Crystals with Sword Strike (or Downward Pogo)!
      for (const c of sealCrystals) {
        if (!c.activated && overlap(box, c)) {
          activateCrystal(c);
          if (player.attackKind === "down") {
            player.vy = -T.pogoV;
            player.jumps = 1;
            player.grounded = false;
          }
        }
      }

      // Castlevania weapon strike parry: slash enemy projectiles out of the air!
      for (const s of shots) {
        if (!s.friendly && s.life > 0 && overlap(box, s)) {
          s.life = 0;
          sound.playSfx("slash");
          shake = Math.max(shake, 2);
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: s.x + s.w / 2,
              y: s.y + s.h / 2,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              size: 2,
              alpha: 1,
              maxAlpha: 1,
              color: "#ffd700",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        }
      }
    }

    for (const e of enemies) updateEnemy(e, dt);

    // =========================================================================
    // PHYSICAL SOLID BODY RESOLUTION:
    // Enemies and player cannot occupy the same space or clip behind each other!
    // =========================================================================
    if (!player.dead && !player.won) {
      for (let i = 0; i < enemies.length; i++) {
        const e1 = enemies[i];
        if (e1.dead || e1.dying) continue;

        if (e1.kind !== "bat") {
          // Player vs Ground Enemy horizontal solid body separation
          const pTop = player.y;
          const pBot = player.y + player.h;
          const eTop = e1.y;
          const eBot = e1.y + e1.h;
          const vert = Math.min(pBot, eBot) - Math.max(pTop, eTop);

          // Only block when at the same ground elevation (allows jumping/pogoing over)
          if (vert > 12) {
            const eMid = e1.x + e1.w / 2;
            const pMid = player.x + player.w / 2;
            const minD = (e1.w + player.w) / 2;
            const dist = Math.abs(pMid - eMid);

            if (dist < minD) {
              if (eMid < pMid) {
                // Enemy on the LEFT of player
                e1.x = player.x - e1.w;
                if (e1.vx > 0) e1.vx = 0;
                if (player.vx < 0) player.vx = 0;
              } else {
                // Enemy on the RIGHT of player
                e1.x = player.x + player.w;
                if (e1.vx < 0) e1.vx = 0;
                if (player.vx > 0) player.vx = 0;
              }
            }
          }
        } else {
          // Player vs Aerial Enemy (Bat) solid body resolution:
          // Bats swoop at the head, but MUST NEVER occupy the same space as Aldric!
          const headTop = player.y;
          const pMid = player.x + player.w / 2;
          const eMid = e1.x + e1.w / 2;

          // 1. Head top boundary: bat cannot penetrate below the top of Aldric's head
          if (e1.x + e1.w > player.x && e1.x < player.x + player.w) {
            if (e1.y + e1.h > headTop) {
              e1.y = headTop - e1.h;
              if (e1.vy > 0) e1.vy = 0;
            }
          }

          // 2. Horizontal body boundary: bat cannot penetrate inside Aldric's torso
          if (e1.y + e1.h > headTop && e1.y < player.y + player.h) {
            if (eMid < pMid) {
              if (e1.x + e1.w > player.x) {
                e1.x = player.x - e1.w;
                if (e1.vx > 0) e1.vx = 0;
              }
            } else {
              if (e1.x < player.x + player.w) {
                e1.x = player.x + player.w;
                if (e1.vx < 0) e1.vx = 0;
              }
            }
          }
        }

        // Soft spacing between enemy pairs so they don't merge into a single sprite
        for (let j = i + 1; j < enemies.length; j++) {
          const e2 = enemies[j];
          if (e2.dead || e2.dying) continue;

          if (e1.kind === "bat" && e2.kind === "bat") {
            // Aerial flock spacing between bats
            const bdx = (e2.x + e2.w / 2) - (e1.x + e1.w / 2);
            const bdy = (e2.y + e2.h / 2) - (e1.y + e1.h / 2);
            const bDist = Math.hypot(bdx, bdy);
            const minBatDist = 28;
            if (bDist < minBatDist && bDist > 0) {
              const push = (minBatDist - bDist) * 0.3;
              const nx = bdx / bDist;
              const ny = bdy / bDist;
              e2.x += nx * push;
              e2.y += ny * push;
              e1.x -= nx * push;
              e1.y -= ny * push;
            }
          } else if (e1.kind !== "bat" && e2.kind !== "bat") {
            // Ground enemy spacing
            if (Math.abs(e1.y - e2.y) < 18) {
              const e1Mid = e1.x + e1.w / 2;
              const e2Mid = e2.x + e2.w / 2;
              const spacing = (e1.w + e2.w) / 2;
              const delta = e2Mid - e1Mid;
              if (Math.abs(delta) < spacing && Math.abs(delta) > 0) {
                const push = (spacing - Math.abs(delta)) * 0.25;
                const dir = delta > 0 ? 1 : -1;
                e2.x += dir * push;
                e1.x -= dir * push;
              }
            }
          }
        }
      }
    }

    // Collect items
    for (const it of items) {
      if (it.collected) continue;
      const box = { x: it.x, y: it.y, w: it.w, h: it.h };
      if (overlap(player, box)) {
        it.collected = true;
        if (it.kind === "life") {
          player.lives++;
          player.toast = `+1 VIDA EXTRA! Total: ${player.lives} vidas`;
          player.toastT = 3.2;
          sound.playSfx("itemLife");
          for (let i = 0; i < 24; i++) {
            particles.push({
              x: it.x + 12,
              y: it.y + 12,
              vx: (Math.random() - 0.5) * 80,
              vy: -40 - Math.random() * 60,
              size: 2 + Math.random() * 2,
              alpha: 1,
              maxAlpha: 1,
              color: "#ffd700",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        } else if (it.kind === "heal") {
          player.hp = Math.min(T.maxHp, player.hp + 1);
          player.toast = "Elixir Carmesim! +1 HP restaurado.";
          player.toastT = 2.2;
          sound.playSfx("itemHeal");
          for (let i = 0; i < 16; i++) {
            particles.push({
              x: it.x + 12,
              y: it.y + 12,
              vx: (Math.random() - 0.5) * 60,
              vy: -30 - Math.random() * 40,
              size: 2 + Math.random() * 2,
              alpha: 1,
              maxAlpha: 1,
              color: "#ef4444",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        } else if (it.kind === "mana") {
          player.mana = Math.min(T.maxMana, player.mana + 35);
          player.toast = "Éter Astral! +35 Mana restaurada.";
          player.toastT = 2.2;
          sound.playSfx("itemMana");
          for (let i = 0; i < 16; i++) {
            particles.push({
              x: it.x + 12,
              y: it.y + 12,
              vx: (Math.random() - 0.5) * 60,
              vy: -30 - Math.random() * 40,
              size: 2 + Math.random() * 2,
              alpha: 1,
              maxAlpha: 1,
              color: "#3b82f6",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        }
      }
    }
    for (const s of shots) {
      s.life -= dt;
      if (s.gravity) s.vy += s.gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.drawCenterY += s.vy * dt;
      if (s.friendly) {
        for (const c of sealCrystals) {
          if (!c.activated && overlap(s, c)) {
            player.swingId++;
            activateCrystal(c);
          }
        }
        for (const e of enemies) {
          if (e.dead || e.dying || s.hits.includes(e.id) || !overlap(s, e)) continue;
          s.hits.push(e.id);
          player.swingId++;
          hurtEnemy(e, s.dmg, false, s.sprite === "spell" ? "spell" : "slash");
          if (s.sprite !== "slash") s.life = 0;
        }
      } else if (overlap(s, player)) {
        hurtPlayer(s.dmg, s.x, s.sprite === "spell" ? "spell" : "slash");
        s.life = 0;
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].life <= 0) shots.splice(i, 1);

    // Update and collide Special Slashes ("Golpe Crescente")
    for (let i = specialSlashes.length - 1; i >= 0; i--) {
      const s = specialSlashes[i];
      s.life -= dt;
      s.x += s.vx * dt;

      // Trail ambient crimson sparks
      if (Math.random() < 0.6) {
        particles.push({
          x: s.x + Math.random() * s.w,
          y: s.y + Math.random() * s.h,
          vx: -s.vx * 0.15 + (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40 - 15,
          size: 2 + Math.random() * 2,
          alpha: 1,
          maxAlpha: 1,
          color: Math.random() > 0.3 ? "#ff1744" : "#ffffff",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }

      // Evaporate any enemy projectiles in the path of the Crescent Blade Wave!
      for (const sh of shots) {
        if (!sh.friendly && sh.life > 0 && overlap(s, sh)) {
          sh.life = 0;
        }
      }

      // Shatter Gothic Seal Crystals touched by the Crescent Wave
      for (const c of sealCrystals) {
        if (!c.activated && overlap(s, c)) {
          player.swingId++;
          activateCrystal(c);
        }
      }

      for (const e of enemies) {
        if (e.dead || e.dying || (e.boss && (e.transformT ?? 0) > 0) || s.hitEnemies.has(e.id)) continue;
        if (s.x < e.x + e.w && s.x + s.w > e.x && s.y < e.y + e.h && s.y + s.h > e.y) {
          s.hitEnemies.add(e.id);
          player.swingId++;
          e.lastSwing = player.swingId;
          // INSTANT ONE-SHOT KILL (9999 DMG) against ALL regular enemies (clears the path completely!),
          // and deals a heavy ~28% max HP chunk to Bosses!
          const specialDmg = e.boss ? Math.max(12, Math.round(e.max * 0.28)) : 9999;
          const isFatal = e.hp <= specialDmg;
          e.hp -= specialDmg;
          shake = Math.max(shake, 9);
          hitstop = Math.max(hitstop, 0.04);
          sound.playSfx(e.boss ? "bossHurt" : "slice");

          if (isFatal) {
            e.hp = 0;
            e.dying = true;
            e.deathT = 0;
            e.deathDuration = e.boss ? 1.25 : 0.65;
            e.state = "dying";
            e.wind = 0;
            e.vx = s.facing * (e.boss ? 12 : 18);
            e.vy = 0;
            if (e.kind !== "bat") e.grounded = true;
            sound.playSfx(e.boss ? "bossHurt" : "enemyDie");

            const burstCount = e.boss ? 36 : 18;
            for (let b = 0; b < burstCount; b++) {
              const angle = (b / burstCount) * Math.PI * 2;
              const spd = 40 + Math.random() * (e.boss ? 90 : 60);
              particles.push({
                x: e.x + e.w / 2,
                y: e.y + e.h / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 20,
                size: 2.5 + Math.random() * 2,
                alpha: 1,
                maxAlpha: 1,
                color: b % 2 === 0 ? "#ff1744" : "#ffffff",
                depth: "fg",
                pulse: Math.random() * Math.PI * 2,
              });
            }
          } else {
            e.hurt = e.boss ? 0.28 : 0.42;
            e.vx = s.facing * (e.boss ? 45 : 95);
          }
        }
      }

      if (s.life <= 0) specialSlashes.splice(i, 1);
    }

    const bosses = enemies.filter((e) => e.boss);
    const open = bosses.length > 0 && bosses.every((e) => e.dead);
    const portal = { x: level.door.x - 16, y: level.door.y - 12, w: 60, h: 88 };
    if (open && overlap(player, portal) && !clearedOnce) {
      clearedOnce = true;
      player.won = true;
      player.toast =
        level.id === 7
          ? "Drácula caiu! O Castelo desmorona e a noite eterna recua!"
          : "Portal Atravessado! Rumo ao próximo salão!";
      player.toastT = 4.5;
      sound.playSfx("gateOpen");
      sound.playBgm("victory");
    }

    // Controlled Ambush System: Only spawns a lone scout when the screen is completely empty of enemies
    // and never swarms the player while fighting or solving Seal Puzzles!
    const bossChamberX = level.width - 650;
    const inBossArena = player.x > bossChamberX;
    const nearGate = sealGates.some((g) => !g.open && Math.abs(player.x - gateX(g)) < 220);
    function gateX(g: SealGate) { return g.x; }
    if (!player.dead && !player.won && !inBossArena && !nearGate) {
      ambushTimer -= dt;
      if (ambushTimer <= 0) {
        ambushTimer = 24.0 + Math.random() * 8.0;
        const nearbyEnemies = enemies.filter((e) => !e.dead && !e.dying && Math.abs(e.x - player.x) < 420).length;
        if (nearbyEnemies === 0) {
          const roll = Math.random();
          if (roll < 0.65) {
            const dir = player.facing;
            const spawnDist = dir * (165 + Math.random() * 60);
            const sx = clamp(player.x + spawnDist, 120, bossChamberX - 80);
            const floor = findFloorFor(sx, GROUND_Y);
            const spawnKind: Kind = level.theme === "gallery" || level.theme === "chapel" ? "skeleton" : "zombie";
            const newEnemy = makeEnemy({ kind: spawnKind, x: sx, y: floor, hp: 4 }, true);
            newEnemy.alertSoundPlayed = true;
            enemies.push(newEnemy);
            sound.playEnemyAlert(spawnKind);
          } else {
            const fromRight = player.facing > 0;
            const bx = fromRight ? camX + T.viewW + 25 : camX - 25;
            const by = player.y - 60 - Math.random() * 25;
            const batEnemy = makeEnemy({ kind: "bat", x: bx, y: by, hp: 2 }, false);
            batEnemy.facing = fromRight ? -1 : 1;
            batEnemy.vx = (fromRight ? -1 : 1) * 110;
            batEnemy.alertSoundPlayed = true;
            enemies.push(batEnemy);
            sound.playEnemyAlert("bat");
          }
        }
      }
    }

    // Prune dead enemies if list grows to maintain high performance
    if (enemies.length > 70) {
      enemies = enemies.filter((e) => !e.dead || e.boss);
    }

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.pulse += dt * 2.5;
      if (p.y < -10) {
        p.y = 310;
        p.x = Math.random() * level.width;
      } else if (p.y > 320) {
        p.y = 0;
        p.x = Math.random() * level.width;
      }
      if (p.x < 0) p.x += level.width;
      else if (p.x > level.width) p.x -= level.width;
    }

    const focus = player.x + player.w / 2 + player.facing * 28;
    const center = camX + T.viewW / 2;
    if (focus > center + 24) camX += (focus - center - 24) * Math.min(1, dt * 8);
    else if (focus < center - 24) camX += (focus - center + 24) * Math.min(1, dt * 8);
    camX = clamp(camX, 0, Math.max(0, level.width - T.viewW));
    const aimY = clamp(player.y + player.h - 180, -160, 115);
    camY += (aimY - camY) * Math.min(1, dt * 5.5);
    shake = Math.max(0, shake - dt * 14);
  }

  function updateEnemy(e: Enemy, dt: number) {
    e.t += dt;
    e.hurt = Math.max(0, e.hurt - dt);
    e.cd = Math.max(0, e.cd - dt);
    if (e.dead) return;

    if (e.state === "emerge") {
      e.emergeT = (e.emergeT ?? 0) + dt;
      const dur = e.emergeDuration ?? 0.58;
      const progress = Math.min(1, e.emergeT / dur);
      const floorY = e.emergeY ?? (e.y - e.h);
      e.y = floorY + e.h * (1 - progress);
      e.vx = 0;
      e.vy = 0;
      e.grounded = true;

      // Debris and dust particles around emergence spot
      if (Math.random() < 0.45) {
        particles.push({
          x: e.x + Math.random() * e.w,
          y: floorY + e.h,
          vx: (Math.random() - 0.5) * 45,
          vy: -25 - Math.random() * 40,
          size: 2 + Math.random() * 2,
          alpha: 1,
          maxAlpha: 1,
          color: level.theme === "catacombs" ? "#22c55e" : level.theme === "chapel" ? "#e2a23a" : "#78716c",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }

      if (progress >= 1) {
        e.y = floorY;
        e.state = "idle";
        e.cd = 0.35;
      }
      return; // Suspends AI until fully emerged!
    }

    if (e.dying) {
      e.vx *= Math.max(0, 1 - 8 * dt);
      if (e.kind === "bat") {
        e.vy = 0; // Aerial bat hovers in place as it turns to smoke and embers
        e.deathT = (e.deathT ?? 0) + dt;
      } else {
        if (!e.grounded) {
          // If in midair: plummet quickly to the floor, do NOT collapse in midair!
          e.vy = Math.min(e.vy + T.gravDown * 1.6 * dt, T.terminal);
          resolve(e, dt, false);
        } else {
          // Firmly grounded on the stone floor: advance collapse animation!
          e.vy = 0;
          e.deathT = (e.deathT ?? 0) + dt;
          resolve(e, dt, false);
        }
      }

      // Continuous subtle dissolution particles during death animation
      if (Math.random() < 0.4) {
        let pColor = "#ff1744";
        if (e.kind === "skeleton" || e.kind === "armoredSkeleton") pColor = "#cbd5e1";
        else if (e.kind === "redSkeleton") pColor = "#dc2626";
        else if (e.kind === "zombie") pColor = "#22c55e";
        else if (e.kind === "knight") pColor = "#94a3b8";
        else if (e.kind === "bat") pColor = "#991b1b";
        else if (e.kind === "gargoyle") pColor = "#78716c";
        else if (e.kind === "vampire" || e.boss) pColor = Math.random() > 0.5 ? "#fbbf24" : "#e11d48";

        particles.push({
          x: e.x + Math.random() * e.w,
          y: e.y + e.h,
          vx: (Math.random() - 0.5) * 35,
          vy: -20 - Math.random() * 30,
          size: 1.5 + Math.random() * 1.5,
          alpha: 0.9,
          maxAlpha: 0.9,
          color: pColor,
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }

      if ((e.deathT ?? 0) >= (e.deathDuration ?? 0.65)) {
        e.dead = true;
        e.dying = false;

        // When death animation finishes, drop boss rewards or normal item drops!
        if (e.boss) {
          sound.stopBossVoice();
          player.toast = `${e.name} derrotado! O Portal Dimensional se abriu!`;
          player.toastT = 4.0;
          sound.playSfx("gateOpen");
          shake = 8;
          items.push({
            id: nextId++,
            kind: "life",
            x: e.x + e.w / 2 - 12,
            y: e.y + e.h - 32,
            w: 24,
            h: 24,
            collected: false,
            bounceT: 0,
          });

          // Dramatic final boss demise particles burst
          for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const spd = 60 + Math.random() * 110;
            particles.push({
              x: e.x + e.w / 2,
              y: e.y + e.h / 2,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 30,
              size: 3 + Math.random() * 2.5,
              alpha: 1,
              maxAlpha: 1,
              color: i % 3 === 0 ? "#ff1744" : i % 3 === 1 ? "#ffd700" : "#d500f9",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        } else if (Math.random() < 0.22) {
          const roll = Math.random();
          const kind: ItemKind = roll < 0.08 ? "life" : roll < 0.62 ? "heal" : "mana";
          items.push({
            id: nextId++,
            kind,
            x: e.x + e.w / 2 - 12,
            y: e.y + e.h - 28,
            w: 24,
            h: 24,
            collected: false,
            bounceT: 0,
          });
        }
      }
      return;
    }

    // =========================================================================
    // BOSS PHASE TRANSFORMATION & MUTATION SYSTEM:
    // Bosses 1–6 mutate into Phase 2 at <= 55% HP.
    // Final Boss Dracula transitions to Phase 2 at <= 68% HP and mutates into his
    // colossal Winged True Demon Form (Phase 3) at <= 38% HP!
    // =========================================================================
    if (e.boss && !e.dead && !e.dying) {
      const curPhase = e.phase ?? 1;
      const isDracula = e.kind === "bossDracula" || e.kind === "dracula";
      const hpRatio = e.hp / e.max;
      let targetPhase = curPhase;
      if (isDracula) {
        if (hpRatio <= 0.38 && curPhase < 3) targetPhase = 3;
        else if (hpRatio <= 0.68 && curPhase < 2) targetPhase = 2;
      } else {
        if (hpRatio <= 0.55 && curPhase < 2) targetPhase = 2;
      }

      if (targetPhase > curPhase) {
        e.phase = targetPhase;
        e.transformT = 1.15;
        e.hurt = 0;
        e.wind = 0;
        e.vx = 0;
        e.vy = 0;
        e.cd = 1.25;
        e.state = "transform";
        bossEnragedAnnounced = true;
        shake = Math.max(shake, 14);
        hitstop = Math.max(hitstop, 0.06);
        sound.playSfx("thunder");
        sound.playSfx("bossHurt");
        sound.playBossVoice(level.id);

        // Clear enemy projectiles and push Aldric back safely with a shockwave (no cheap damage!)
        for (const sh of shots) {
          if (!sh.friendly) sh.life = 0;
        }
        const pushDir = (player.x + player.w / 2) < (e.x + e.w / 2) ? -1 : 1;
        if (Math.abs((player.x + player.w / 2) - (e.x + e.w / 2)) < 140) {
          player.vx = pushDir * 190;
          player.vy = -95;
          player.iframes = Math.max(player.iframes, 0.85);
        }

        // Update Boss Title & Toast Announcement per Boss Mutation
        if (e.kind === "bossPetros") {
          e.name = "Petros Desperto, Titã de Magma";
          player.toast = "🌋 FASE II: O núcleo de magma de Petros rachou a rocha! Cuidado com a chuva vulcânica!";
        } else if (e.kind === "bossValerius") {
          e.name = "Valerius, Berserker das Asas de Sangue";
          player.toast = "🩸 FASE II: Valerius descartou o escudo e despertou suas asas demoníacas e espada colossal!";
        } else if (e.kind === "bossSeraphine") {
          e.name = "Seraphine, Serafim Carmesim de Seis Asas";
          player.toast = "👑 FASE II: Seraphine ascendeu à forma de Serafim de Sangue! Lanças divinas caem do céu!";
        } else if (e.kind === "bossNocturne") {
          e.name = "Nocturne, Fera Strigoi Abissal";
          player.toast = "🦇 FASE II: Nocturne sofreu mutação em Strigoi de Quatro Asas! Ondas sônicas triplas!";
        } else if (e.kind === "bossVeyne") {
          e.name = "Lorde Veyne, Arquilich Soberano do Vazio";
          player.toast = "💀 FASE II: Veyne rasgou o véu mortal e revelou sua forma de Arquilich! Tempestade arcana!";
        } else if (e.kind === "bossCalx") {
          e.name = "Calx, Behemoth de Sobrecarga Mutagênica";
          player.toast = "🧪 FASE II: Os tanques de Calx explodiram em cristais tóxicos gigantes! Fúria mutagênica!";
        } else if (isDracula && targetPhase === 2) {
          e.name = "Conde Drácula, Senhor das Trevas";
          player.toast = "🔥 FASE II: Drácula libera o Fogo do Inferno Carmesim e Esferas do Vazio!";
        } else if (isDracula && targetPhase === 3) {
          e.name = "Drácula, Demônio Primordial Supremo";
          player.toast = "👿 FORMA DEMONÍACA VERDADEIRA! Drácula assumiu sua forma colossal de Demônio Alado!";
        }
        player.toastT = 4.2;

        // Massive radial burst of mutation particles
        const mColor1 =
          e.kind === "bossCalx" ? "#4ade80" :
          e.kind === "bossVeyne" ? "#38bdf8" :
          e.kind === "bossPetros" ? "#fb923c" : "#ff1744";
        const mColor2 =
          e.kind === "bossCalx" ? "#a855f7" :
          e.kind === "bossVeyne" ? "#c084fc" : "#ffd700";

        for (let i = 0; i < 44; i++) {
          const ang = (i / 44) * Math.PI * 2;
          const spd = 55 + Math.random() * 115;
          particles.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 25,
            size: 3 + Math.random() * 2.5,
            alpha: 1,
            maxAlpha: 1,
            color: i % 2 === 0 ? mColor1 : mColor2,
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
      }

      if ((e.transformT ?? 0) > 0) {
        e.transformT = Math.max(0, (e.transformT ?? 0) - dt);
        e.vx = 0;
        e.vy = 0;
        shake = Math.max(shake, 4);
        // Continuous ascending energy pillar particles during transformation roar
        if (Math.random() < 0.75) {
          particles.push({
            x: e.x + (Math.random() - 0.2) * (e.w * 1.4),
            y: e.y + e.h,
            vx: (Math.random() - 0.5) * 30,
            vy: -90 - Math.random() * 80,
            size: 2.5 + Math.random() * 2.5,
            alpha: 1,
            maxAlpha: 1,
            color: Math.random() > 0.4 ? "#ff1744" : "#ffd700",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
        if ((e.transformT ?? 0) <= 0) {
          e.state = "idle";
          e.cd = 0.25;
        }
        return; // Suspends normal boss movement while roaring/transforming
      }
    }

    const dx = player.x + player.w / 2 - (e.x + e.w / 2);
    const dist = Math.abs(dx);
    e.facing = dx >= 0 ? 1 : -1;

    // =========================================================================
    // PROXIMITY ACTIVATION & CROWD CONTROL (Anti-Swarm):
    // Regular enemies only wake up when visibly on-screen (~215px), never rushing
    // from off-screen or ganging up in huge packs!
    // =========================================================================
    const maxActiveDist = e.boss ? 620 : 215;
    if (dist > maxActiveDist) {
      e.vx = 0;
      if (e.kind !== "bat") {
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
      return;
    }

    // Territorial Leash & Simultaneous Attacker Cap for regular ground enemies:
    // Prevents more than 2 ground enemies from dogpiling Aldric at the exact same time!
    if (!e.boss && e.kind !== "bat" && e.hurt <= 0 && e.wind <= 0) {
      const distFromHome = e.x - e.homeX;
      if (Math.abs(distFromHome) > 250 && dist > 115) {
        e.facing = distFromHome > 0 ? -1 : 1;
        e.vx = e.facing * 45;
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
        return;
      }
      if (dist > 95) {
        let closerAttackers = 0;
        for (const other of enemies) {
          if (other === e || other.dead || other.dying || other.boss || other.kind === "bat") continue;
          const odist = Math.abs((player.x + player.w / 2) - (other.x + other.w / 2));
          if (odist < dist && odist < 145) {
            closerAttackers++;
          }
        }
        if (closerAttackers >= 2) {
          e.vx = 0;
          e.state = e.kind === "armoredSkeleton" || e.kind === "knight" ? "shield" : "idle";
          e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
          resolve(e, dt, false);
          return;
        }
      }
    }

    // =========================================================================
    // ENEMY PRESENCE AUDIO: Trigger voice/groan/shriek when entering camera view!
    // =========================================================================
    const inScreen = e.x >= camX - 40 && e.x <= camX + T.viewW + 40;
    if (inScreen && !e.alertSoundPlayed && !e.dead && !e.dying) {
      e.alertSoundPlayed = true;
      if (!e.boss) {
        sound.playEnemyAlert(e.kind);
      }
    }

    // =========================================================================
    // HITSTUN & RECOIL: When struck, the enemy reels backward and cannot advance!
    // Decelerates smoothly with knockback friction; chase & attack are delayed.
    // =========================================================================
    if (e.hurt > 0) {
      if (e.kind === "bat") {
        e.vx *= Math.max(0, 1 - 9 * dt);
        e.vy *= Math.max(0, 1 - 7 * dt);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.y = clamp(e.y, 16, GROUND_Y - 20);
      } else {
        e.vx *= Math.max(0, 1 - 10 * dt);
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
      return; // Suspends chasing and attacking while reeling from hit
    }

    // =========================================================================
    // 1. BAT (Hunting formation: undulating sine-wave flight & rapid head dives)
    // =========================================================================
    if (e.kind === "bat") {
      const headTop = player.y;

      if (e.cd > 0) {
        // Recovery / Ascending state after attack or recoil: climbs back rapidly to flight height
        const cruiseY = headTop - 56 + Math.sin(e.t * 3.8) * 8;
        e.y += (cruiseY - e.y) * Math.min(1, dt * 6.0);
        e.vx = -e.facing * 75;
        e.x += e.vx * dt;
      } else if (dist < 400) {
        if (dist > 160) {
          // Approach at cruising altitude with undulating sinusoidal wave trajectory
          const wave = Math.sin(e.t * 5.2) * 22;
          const cruiseY = headTop - 48 + wave;
          e.y += (cruiseY - e.y) * Math.min(1, dt * 5.0);
          e.vx = Math.sign(dx) * 110;
          e.x += e.vx * dt;
        } else {
          // Predatory dive targeting Aldric's head perimeter!
          const swoopSpeed = e.boss ? 165 : 150;
          const headTargetY = headTop - e.h - 1;
          e.y += (headTargetY - e.y) * Math.min(1, dt * 7.0);
          e.vx = Math.sign(dx) * swoopSpeed;
          e.x += e.vx * dt;
          if (dist < 110 && e.cd <= 0) {
            sound.playEnemyAlert("bat");
          }
          if (dist < 36 && e.cd <= 0) {
            e.cd = 0.65; // Faster recovery cooldown
          }
        }
      } else {
        // Idling around perch/home coordinates with sinusoidal patrol
        const tx = e.homeX + Math.sin(e.t * 2.8) * 45;
        const ty = e.homeY + Math.sin(e.t * 4.0) * 16;
        e.x += (tx - e.x) * Math.min(1, dt * 2.5);
        e.y += (ty - e.y) * Math.min(1, dt * 2.5);
      }
      e.y = clamp(e.y, 16, GROUND_Y - 22);
    }
    // =========================================================================
    // 2. BOSS 1: Petros, Gárgula Colossal de Pedra -> Fase 2: Titã de Magma (Os Portões)
    // =========================================================================
    else if (e.kind === "bossPetros") {
      const isEnraged = (e.phase ?? 1) >= 2;
      if (e.cd <= 0 && dist > 65 && e.state !== "dive") {
        // High demon leap and crushing dive smash
        e.state = "dive";
        e.vy = isEnraged ? -285 : -220;
        e.cd = isEnraged ? 1.0 : 1.6;
        sound.playBossAttack(1, 2); // Salto e impacto sísmico
      }
      if (e.state === "dive") {
        e.vx = Math.sign(dx) * (isEnraged ? 165 : 125);
        if (e.grounded || e.y >= e.homeY - 8) {
          e.state = "idle";
          e.vx = 0;
          shake = isEnraged ? 9 : 6;
          sound.playBossAttack(1, 2); // Impacto estrondoso de pedra/magma no solo
          const shockSpeed = isEnraged ? 215 : 175;
          fire({ x: e.x - 20, y: e.y + e.h - 18, w: 16, h: 18, vx: -shockSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
          fire({ x: e.x + e.w + 4, y: e.y + e.h - 18, w: 16, h: 18, vx: shockSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
          if (isEnraged) {
            // Phase 2 Volcanic Eruption: Triple falling magma meteors + horizontal fire breath!
            for (let r = 0; r < 3; r++) {
              fire({
                x: player.x + (r - 1) * 55 + (Math.random() - 0.5) * 20,
                y: -10,
                w: 16,
                h: 20,
                vx: (Math.random() - 0.5) * 30,
                vy: 235,
                life: 1.8,
                dmg: 1,
                friendly: false,
                sprite: "blood",
              });
            }
          }
        }
      } else {
        if (dist <= 65 && e.cd <= 0) {
          e.wind = isEnraged ? 0.11 : 0.14;
          e.cd = isEnraged ? 0.48 : 0.58;
          e.state = "slash";
          sound.playBossAttack(1, 1); // Ataque 1: Garra / Sopro de magma colossal
        }
        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * (isEnraged ? 85 : 55);
          if (e.wind <= 0) {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 46, y: e.y + 12, w: 50, h: 52 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            if (isEnraged) {
              // Phase 2 Molten Fire-Breath Wave!
              fire({
                x: e.x + (e.facing > 0 ? e.w + 6 : -24),
                y: e.y + 16,
                w: 22,
                h: 24,
                vx: e.facing * 205,
                vy: -12,
                life: 1.1,
                dmg: 1,
                friendly: false,
                sprite: "blood",
              });
              fire({
                x: e.x + (e.facing > 0 ? e.w + 6 : -24),
                y: e.y + 28,
                w: 20,
                h: 22,
                vx: e.facing * 175,
                vy: 15,
                life: 1.1,
                dmg: 1,
                friendly: false,
                sprite: "slash",
              });
            }
            e.state = "idle";
          }
        } else {
          // Relentless forward march into Aldric
          e.state = "idle";
          e.vx = Math.sign(dx) * (isEnraged ? 82 : 54);
        }
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 3. BOSS 2: Valerius, Cavaleiro Sombrio -> Fase 2: Berserker das Asas de Sangue
    // =========================================================================
    else if (e.kind === "bossValerius") {
      const isEnraged = (e.phase ?? 1) >= 2;
      if (isEnraged && dist > 70 && dist < 240 && e.cd <= 0 && e.state !== "slash") {
        e.state = "slash";
        e.wind = 0.20;
        e.cd = 0.80;
        e.vx = e.facing * 255; // Winged Demon Knight shadow-dash charge!
        sound.playBossAttack(2, 1);
      } else if (dist <= 62 && e.cd <= 0) {
        e.state = "slash";
        e.wind = isEnraged ? 0.10 : 0.14;
        e.cd = isEnraged ? 0.40 : 0.48;
        sound.playBossAttack(2, 1); // Ataque 1: Investida com lâmina pesada
      }
      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (isEnraged ? 215 : 160);
        if (e.wind <= 0) {
          const box = { x: e.facing > 0 ? e.x + e.w : e.x - 46, y: e.y + 12, w: 52, h: 48 };
          if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
          sound.playBossAttack(2, 2); // Ataque 2: Onda de corte crescente sombrio
          fire({
            x: e.x + (e.facing > 0 ? e.w : -24),
            y: e.y + e.h - 32,
            w: 24,
            h: 32,
            vx: e.facing * (isEnraged ? 235 : 190),
            vy: 0,
            life: 1.2,
            dmg: 1,
            friendly: false,
            sprite: "slash",
          });
          if (isEnraged) {
            // Twin Blood Crescent Wave + Skyward Blood-Judgment Lightning Pillar!
            fire({
              x: e.x + (e.facing > 0 ? e.w : -24),
              y: e.y + e.h - 46,
              w: 22,
              h: 28,
              vx: e.facing * 195,
              vy: -55,
              life: 1.3,
              dmg: 1,
              friendly: false,
              sprite: "slash",
            });
            fire({
              x: player.x + (Math.random() - 0.5) * 30,
              y: -12,
              w: 16,
              h: 28,
              vx: 0,
              vy: 250,
              life: 1.5,
              dmg: 1,
              friendly: false,
              sprite: "blood",
            });
          }
          e.state = isEnraged ? "idle" : "shield";
        }
      } else {
        e.state = isEnraged ? "idle" : "shield";
        e.vx = e.facing * (isEnraged ? 85 : 50);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 4. BOSS 3: Seraphine -> Fase 2: Serafim Carmesim de Seis Asas (A Capela Sagrada)
    // =========================================================================
    else if (e.kind === "bossSeraphine") {
      const isEnraged = (e.phase ?? 1) >= 2;
      const hoverFreq = isEnraged ? 4.6 : 3.2;
      e.y = e.homeY + Math.sin(e.t * hoverFreq) * (isEnraged ? 20 : 14);
      if (dist < 68) {
        if (e.cd <= 0.45) {
          const oldX = e.x;
          const oldY = e.y;
          e.x = clamp(player.x + (e.facing > 0 ? -135 : 135), e.homeX - 165, e.homeX + 165);
          e.state = "hover";
          sound.playBossAttack(3, 2); // Ataque 2: Teletransporte ciclone de asas de sangue
          fire({
            x: oldX + 10,
            y: oldY + 16,
            w: 22,
            h: 22,
            vx: 0,
            vy: 0,
            life: 0.9,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
          e.cd = isEnraged ? 0.72 : 1.1;
        }
      }
      if (e.cd <= 0) {
        e.cd = isEnraged ? 0.85 : 1.35;
        e.state = "slash";
        e.wind = 0.22;
        sound.playBossAttack(3, 1); // Ataque 1: Tempestade de lanças e orbes de sangue
        const orbCount = isEnraged ? 5 : 3;
        for (let i = 0; i < orbCount; i++) {
          const spreadY = (i - Math.floor(orbCount / 2)) * (isEnraged ? 34 : 28);
          fire({
            x: e.x + (e.facing > 0 ? e.w : -12),
            y: e.y + 20,
            w: 14,
            h: 14,
            vx: e.facing * (isEnraged ? 185 : 135),
            vy: spreadY,
            life: 1.8,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
        }
        if (isEnraged) {
          for (let l = 0; l < 3; l++) {
            fire({
              x: player.x + (l - 1) * 48 + (Math.random() - 0.5) * 18,
              y: -10,
              w: 12,
              h: 26,
              vx: 0,
              vy: 235,
              life: 1.6,
              dmg: 1,
              friendly: false,
              sprite: "blood",
            });
          }
        }
      }
      if (e.wind > 0) {
        e.wind = Math.max(0, e.wind - dt);
        if (e.wind <= 0) e.state = "idle";
      }
    }
    // =========================================================================
    // 5. BOSS 4: Nocturne -> Fase 2: Fera Strigoi Abissal de Quatro Asas (As Catacumbas)
    // =========================================================================
    else if (e.kind === "bossNocturne") {
      const isEnraged = (e.phase ?? 1) >= 2;
      const flyFreq = isEnraged ? 4.4 : 3.2;
      const tx = player.x + Math.sin(e.t * flyFreq) * (isEnraged ? 58 : 45);
      const ty = clamp(player.y - 32 + Math.cos(e.t * (flyFreq + 0.6)) * 32, 20, GROUND_Y - 40);
      e.x += (tx - e.x) * Math.min(1, dt * (isEnraged ? 4.6 : 3.0));
      e.y += (ty - e.y) * Math.min(1, dt * (isEnraged ? 4.6 : 3.0));

      if (dist <= 58 && e.cd <= 0.4) {
        e.state = "slash";
        e.wind = 0.18;
        sound.playBossAttack(4, 2); // Ataque 2: Rasante predatório de garras duplas carmesim
        const clawBox = { x: e.x - 14, y: e.y + 6, w: e.w + 28, h: e.h + 14 };
        if (overlap(clawBox, player) && e.hurt <= 0) {
          hurtPlayer(2, e.x, "slash");
        }
      }
      if (e.cd <= 0) {
        e.cd = isEnraged ? 0.88 : 1.3;
        e.state = "smash";
        e.wind = 0.22;
        sound.playBossAttack(4, 1); // Ataque 1: Supernova sônica abissal
        const sonicCount = isEnraged ? 3 : 1;
        for (let s = 0; s < sonicCount; s++) {
          const vy = (s - Math.floor(sonicCount / 2)) * 42;
          fire({
            x: e.x + (e.facing > 0 ? e.w : -16),
            y: e.y + e.h / 2 - 8,
            w: 22,
            h: 22,
            vx: e.facing * (isEnraged ? 220 : 165),
            vy,
            life: 1.5,
            dmg: 1,
            friendly: false,
            sprite: isEnraged && s === 1 ? "slash" : "spell",
          });
        }
      }
      if (e.wind > 0) {
        e.wind = Math.max(0, e.wind - dt);
        if (e.wind <= 0) e.state = "idle";
      }
    }
    // =========================================================================
    // 6. BOSS 5: Lorde Veyne -> Fase 2: Arquilich Soberano do Vazio (A Grande Biblioteca)
    // =========================================================================
    else if (e.kind === "bossVeyne") {
      const isEnraged = (e.phase ?? 1) >= 2;
      if (dist <= 54 && e.cd <= 0) {
        // Close range bone vortex barrier & panic blink
        e.cd = isEnraged ? 0.45 : 0.55;
        e.state = "slash";
        e.wind = isEnraged ? 0.10 : 0.15;
        sound.playBossAttack(5, 2); // Ataque 2: Vórtice de ossos e caveiras arcanas
      } else if (dist > 54 && e.cd <= 0) {
        e.cd = isEnraged ? 0.78 : 1.25;
        e.state = "slash";
        e.wind = isEnraged ? 0.16 : 0.24;
        sound.playBossAttack(5, 1); // Ataque 1: Crânios flamejantes + relâmpagos do vazio
        const skullCount = isEnraged ? 3 : 1;
        for (let k = 0; k < skullCount; k++) {
          const vx = e.facing * (isEnraged ? (110 + k * 38) : 130);
          const vy = -120 - k * 30;
          fire({
            x: e.x + (e.facing > 0 ? e.w : -16),
            y: e.y + 14,
            w: 16,
            h: 16,
            vx,
            vy,
            gravity: 330,
            life: 2.2,
            dmg: 1,
            friendly: false,
            sprite: "spell",
          });
        }
        if (isEnraged) {
          // Direct void lightning spear!
          fire({
            x: e.x + (e.facing > 0 ? e.w : -20),
            y: e.y + e.h - 22,
            w: 22,
            h: 18,
            vx: e.facing * 205,
            vy: 0,
            life: 1.3,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
        }
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (isEnraged ? 65 : 35);
        if (e.wind <= 0) {
          if (dist <= 58) {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 42, y: e.y + 10, w: 46, h: 46 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "spell");
          }
          if (isEnraged && dist < 52) {
            e.x = clamp(player.x + (player.x < e.homeX ? 115 : -115), e.homeX - 145, e.homeX + 145);
          }
          e.state = "idle";
        }
      } else {
        e.state = "idle";
        e.vx = Math.sign(dx) * (isEnraged ? 74 : 45);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 7. BOSS 6: Calx -> Fase 2: Behemoth de Sobrecarga Mutagênica (Laboratório de Alquimia)
    // =========================================================================
    else if (e.kind === "bossCalx") {
      const isEnraged = (e.phase ?? 1) >= 2;
      if (dist <= 64 && e.cd <= 0) {
        // Seismic Double-Claw Crystal Slam & Toxic Shockwave
        e.state = "smash";
        e.wind = isEnraged ? 0.10 : 0.15;
        e.cd = isEnraged ? 0.72 : 1.15;
        shake = isEnraged ? 9 : 6;
        sound.playBossAttack(6, 1); // Ataque 1: Pisotão sísmico de cristais tóxicos
        if (player.grounded && dist < 110) {
          hurtPlayer(1, e.x, "slash");
        }
        const waveSpeed = isEnraged ? 205 : 160;
        fire({ x: e.x - 18, y: e.y + e.h - 16, w: 16, h: 16, vx: -waveSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
        fire({ x: e.x + e.w + 4, y: e.y + e.h - 16, w: 16, h: 16, vx: waveSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
        if (isEnraged) {
          for (let a = 0; a < 3; a++) {
            fire({
              x: player.x + (a - 1) * 45 + (Math.random() - 0.5) * 20,
              y: -10,
              w: 14,
              h: 20,
              vx: 0,
              vy: 235,
              life: 1.7,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
          }
        }
      } else if (dist > 64 && e.cd <= 0) {
        e.cd = isEnraged ? 0.90 : 1.45;
        e.state = "slash";
        e.wind = 0.20;
        sound.playBossAttack(6, 2); // Ataque 2: Bombardeio de frascos mutagênicos voláteis
        const flaskCount = isEnraged ? 3 : 1;
        for (let f = 0; f < flaskCount; f++) {
          const vx = e.facing * (isEnraged ? (105 + f * 38) : 125);
          const vy = -115 - f * 25;
          fire({
            x: e.x + (e.facing > 0 ? e.w : -14),
            y: e.y + 12,
            w: 16,
            h: 16,
            vx,
            vy,
            gravity: 360,
            life: 2.1,
            dmg: 1,
            friendly: false,
            sprite: "spell",
          });
        }
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (isEnraged ? 68 : 40);
        if (e.wind <= 0) e.state = "idle";
      } else {
        e.state = "idle";
        e.vx = Math.sign(dx) * (isEnraged ? 76 : 46);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 8. FINAL BOSS: Conde Drácula -> Fase 2: Senhor das Trevas -> Fase 3: Demônio Primordial Supremo
    // =========================================================================
    else if (e.kind === "bossDracula" || e.kind === "dracula") {
      const draculaPhase = e.phase ?? 1;
      const hover = draculaPhase === 3 ? 14 + Math.sin(e.t * 4.2) * 8 : 0;
      e.y = e.homeY - hover;
      const minX = e.homeX - 135;
      const maxX = e.homeX + 115;

      if (dist <= 60 && e.cd <= 0) {
        // Immediate Demonic Vampire Claw Strike when player is near!
        e.state = "slash";
        e.wind = draculaPhase === 3 ? 0.08 : 0.11;
        e.cd = draculaPhase === 3 ? 0.30 : 0.45;
        sound.playBossAttack(7, 1); // Ataque 1: Garras demoníacas de sangue
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (draculaPhase === 3 ? 120 : 80);
        if (e.wind <= 0) {
          if (e.state === "slash") {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 48, y: e.y + e.h - 74, w: 54, h: 52 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            if (draculaPhase === 3) {
              // True Demon Form: Unleashes a demonic crescent shockwave on claw slash!
              fire({
                x: e.x + (e.facing > 0 ? e.w : -24),
                y: e.y + e.h - 44,
                w: 24,
                h: 32,
                vx: e.facing * 230,
                vy: 0,
                life: 1.2,
                dmg: 1,
                friendly: false,
                sprite: "slash",
              });
            }
            e.state = "idle";
          } else {
            // Hellfire Volley fired forward
            sound.playBossAttack(7, 1); // Ataque 1: Fogo do Inferno
            const count = draculaPhase === 1 ? 3 : draculaPhase === 2 ? 5 : 6;
            for (let i = 0; i < count; i++) {
              const chest = e.y + e.h - 78;
              const spreadY = -35 + i * (draculaPhase === 3 ? 16 : 18);
              fire({
                x: e.x + (e.facing > 0 ? e.w : -12),
                y: chest - 6,
                w: 16,
                h: 28,
                vx: e.facing * (145 + draculaPhase * 28),
                vy: spreadY,
                life: 2.2,
                dmg: 1,
                friendly: false,
                sprite: "blood",
                drawCenterY: chest,
              });
            }
            if (draculaPhase >= 2) {
              // Phase 2 & 3: Dark Void Sphere fired toward Aldric
              fire({
                x: e.x + (e.facing > 0 ? e.w : -16),
                y: player.y + 10,
                w: 18,
                h: 22,
                vx: e.facing * (draculaPhase === 3 ? 215 : 185),
                vy: 0,
                life: 1.8,
                dmg: 1,
                friendly: false,
                sprite: "spell",
              });
            }
            if (draculaPhase === 3) {
              shake = 7;
              sound.playBossAttack(7, 2); // Ataque 2: Chuva de meteoros do Apocalipse Carmesim
              for (let m = 0; m < 4; m++) {
                fire({
                  x: player.x + (m - 1.5) * 48 + (Math.random() - 0.5) * 22,
                  y: -15,
                  w: 16,
                  h: 26,
                  vx: (Math.random() - 0.5) * 20,
                  vy: 245,
                  life: 1.7,
                  dmg: 1,
                  friendly: false,
                  sprite: "blood",
                });
              }
            }
            e.state = "idle";
          }
        }
      } else if (e.cd <= 0 && dist > 55) {
        // Teleport within throne arena with dark rift sound
        e.x = clamp(player.x + (player.x < e.homeX ? 85 : -85), minX, maxX);
        sound.playBossAttack(7, 2); // Ataque 2: Teletransporte de fenda sombria
        e.wind = draculaPhase === 3 ? 0.16 : draculaPhase === 2 ? 0.24 : 0.30;
        e.cd = draculaPhase === 3 ? 0.58 : draculaPhase === 2 ? 0.85 : 1.15;
      } else {
        // Advances relentlessly
        e.vx = Math.sign(dx) * (draculaPhase === 3 ? 98 : draculaPhase === 2 ? 75 : 58);
        e.x = clamp(e.x + e.vx * dt, minX, maxX);
      }
    }
    // =========================================================================
    // 9. REGULAR GROUND ENEMIES (Armored Skeleton, Red Skeleton, Skeleton, Knight, Zombie, Vampire, Gargoyle)
    // =========================================================================
    else {
      // -----------------------------------------------------------------------
      // A. ARMORED SKELETON: Frontal Brass Shield Guard & Lethal Gladius Thrust
      // -----------------------------------------------------------------------
      if (e.kind === "armoredSkeleton") {
        if (dist <= 54 && e.cd <= 0) {
          e.wind = 0.15;
          e.cd = 0.52;
          e.state = "slash";
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 60; // Gladius lunge forward!
          if (e.wind <= 0) {
            // Forward gladius lunge (reach 46px, 2 damage)
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 46,
              y: e.y + 10,
              w: 48,
              h: 34,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "shield";
          }
        } else {
          // Relentless disciplined shield march - NEVER stands still!
          e.state = "shield";
          e.vx = e.facing * 52;
        }
      }
      // -----------------------------------------------------------------------
      // B. RED SKELETON: Cursed Double Bone Volley & Vicious Blood Cleave
      // -----------------------------------------------------------------------
      else if (e.kind === "redSkeleton") {
        if (dist <= 56) {
          // Close quarters: Cursed blood cleave lunge!
          if (e.cd <= 0) {
            e.state = "slash";
            e.wind = 0.14;
            e.cd = 0.45;
          }
        } else if (dist <= 400) {
          // Cursed double bone volley: fires two cursed bones (high artillery arc + direct shot)
          if (e.cd <= 0) {
            e.cd = 0.92;
            e.state = "slash";
            e.wind = 0.14;
            // Bone 1: High artillery lob
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 10,
              w: 14,
              h: 14,
              vx: e.facing * (120 + Math.random() * 20),
              vy: -175,
              gravity: 370,
              life: 2.2,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
            // Bone 2: Direct blood bone dart
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 16,
              w: 14,
              h: 14,
              vx: e.facing * (155 + Math.random() * 25),
              vy: -75,
              gravity: 200,
              life: 2.0,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
          }
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 75; // Blood cleave lunge
          if (e.wind <= 0) {
            if (dist <= 58) {
              const box = {
                x: e.facing > 0 ? e.x + e.w - 4 : e.x - 46,
                y: e.y + 8,
                w: 48,
                h: 36,
              };
              if (overlap(box, player)) hurtPlayer(2, e.x, "slash"); // Cleave deals 2 DMG!
            }
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 68; // Relentless cursed sprint
        }
      }
      // -----------------------------------------------------------------------
      // C. SKELETON: Tactical Sniper Recoil & Alternating Artillery/Skimming Bone Volley
      // -----------------------------------------------------------------------
      else if (e.kind === "skeleton") {
        // Tactical Evasive Hop: Hops backward if Aldric approaches within melee reach!
        if (dist < 88 && e.grounded && e.cd <= 0.25 && e.state !== "slash") {
          e.state = "retreat";
          e.vy = -130;
          e.vx = -e.facing * 95;
          e.cd = 0.55;
        } else if (dist <= 48 && e.cd <= 0) {
          // Close quarters emergency bone dagger stab
          e.state = "slash";
          e.wind = 0.12;
          e.cd = 0.48;
        } else if (dist <= 390 && e.cd <= 0) {
          // Alternating tactical bone volleys
          e.attackVariant = ((e.attackVariant ?? 0) + 1) % 2;
          e.state = "slash";
          e.wind = 0.12;

          if (e.attackVariant === 0) {
            // Variant 0: High parabolic lobbed artillery bone
            e.cd = 0.85;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 10,
              w: 14,
              h: 14,
              vx: e.facing * (100 + Math.random() * 25),
              vy: -175,
              gravity: 360,
              life: 2.1,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
          } else {
            // Variant 1: Fast skimming horizontal bone spear
            e.cd = 0.75;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 14,
              w: 14,
              h: 14,
              vx: e.facing * 175,
              vy: -35,
              gravity: 110,
              life: 1.8,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
          }
        }

        if (e.state === "retreat") {
          e.vx = -e.facing * 90;
          if (e.grounded && e.vy >= 0) {
            e.state = "idle";
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 40;
          if (e.wind <= 0) {
            if (dist <= 52) {
              const box = {
                x: e.facing > 0 ? e.x + e.w - 4 : e.x - 40,
                y: e.y + 10,
                w: 42,
                h: 34,
              };
              if (overlap(box, player)) hurtPlayer(1, e.x, "slash");
            }
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 52; // Pursues Aldric
        }
      }
      // -----------------------------------------------------------------------
      // D. KNIGHT: Tower Shield Deflection, Heavy Halberd Cleave & Armored Halberd Charge
      // -----------------------------------------------------------------------
      else if (e.kind === "knight") {
        // Armored Charge: Initiates a thunderous forward rush when at medium range!
        if (dist > 80 && dist < 260 && e.cd <= 0 && e.grounded && e.state !== "charge") {
          e.state = "charge";
          e.wind = 0.75; // Charge duration
          e.cd = 1.75;
          sound.playEnemyAlert("knight"); // Authentic heavy plate armor clank!
        } else if (dist <= 62 && e.cd <= 0 && e.state !== "charge") {
          // Close-quarters heavy halberd cleave
          e.wind = 0.20;
          e.cd = 0.60;
          e.state = "slash";
        }

        if (e.state === "charge") {
          e.wind -= dt;
          e.vx = e.facing * 155; // Thunderous charge forward!
          // Check collision with player during charge
          const chargeBox = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 36,
            y: e.y + 6,
            w: 44,
            h: 40,
          };
          if (overlap(chargeBox, player)) {
            hurtPlayer(2, e.x, "slash");
          }
          if (e.wind <= 0) {
            e.state = "shield";
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 65; // Halberd thrust rush
          if (e.wind <= 0) {
            // Extended halberd thrust (reach 54px, 2 damage)
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 54,
              y: e.y + 8,
              w: 56,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "shield";
          }
        } else {
          // Armored march with tower shield raised
          e.state = "shield";
          const minStop = (e.w + player.w) / 2 + 8;
          e.vx = dist > minStop ? e.facing * 50 : 0;
        }
      }
      // -----------------------------------------------------------------------
      // E. ZOMBIE: GnG Hungry Ghoul Sprint & Sudden Leaping Claw Strike
      // -----------------------------------------------------------------------
      else if (e.kind === "zombie") {
        // Sudden feral leap when approaching Aldric
        if (dist >= 65 && dist <= 140 && e.cd <= 0 && e.grounded && e.state !== "leap") {
          e.state = "leap";
          e.vy = -140;
          e.vx = e.facing * 135;
          e.cd = 1.15;
          sound.playEnemyAlert("zombie");
        } else if (dist <= 48 && e.cd <= 0 && e.state !== "leap") {
          e.wind = 0.12;
          e.cd = 0.44;
          e.state = "slash";
        }

        if (e.state === "leap") {
          e.vx = e.facing * 130;
          // Claw attack while airborne
          const clawBox = {
            x: e.facing > 0 ? e.x + e.w - 4 : e.x - 34,
            y: e.y + 8,
            w: 36,
            h: 36,
          };
          if (overlap(clawBox, player)) {
            hurtPlayer(1, e.x, "slash");
          }
          if (e.grounded && e.vy >= 0) {
            e.state = "idle";
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          const minStop = (e.w + player.w) / 2 + 2;
          e.vx = dist > minStop ? e.facing * 55 : 0;
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 38,
              y: e.y + 10,
              w: 40,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(1, e.x, "slash");
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          const minStop = (e.w + player.w) / 2 + 4;
          // GnG fast sprint when Aldric is near, slow shamble when far
          const sprintSpeed = dist < 220 ? 95 : 48;
          e.vx = dist > minStop ? e.facing * sprintSpeed : 0;
        }
      }
      // -----------------------------------------------------------------------
      // F. VAMPIRE: High-Speed Stalker, Shadow Claw Rush & Blood Orbs
      // -----------------------------------------------------------------------
      else if (e.kind === "vampire") {
        if (dist <= 56 && e.cd <= 0) {
          e.wind = 0.12;
          e.cd = 0.45;
          e.state = "slash";
          sound.playEnemyAlert("vampire");
        } else if (dist > 70 && dist <= 390 && e.cd <= 0) {
          e.cd = 0.90;
          fire({
            x: e.x,
            y: e.y + e.h - 60,
            w: 16,
            h: 28,
            vx: e.facing * 155,
            vy: 4,
            life: 1.6,
            dmg: 1,
            friendly: false,
            sprite: "blood",
            drawCenterY: e.y + e.h - 54,
          });
        }

        if (e.wind > 0) {
          e.wind -= dt;
          const minStop = (e.w + player.w) / 2 + 3;
          e.vx = dist > minStop ? e.facing * 120 : 0;
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 46,
              y: e.y + 8,
              w: 48,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          const minStop = (e.w + player.w) / 2 + 6;
          e.vx = dist > minStop ? e.facing * 92 : 0;
        }
      }
      // -----------------------------------------------------------------------
      // G. GARGOYLE: Red Arremer Demon Leap, Mid-Air Hover & Predatory Dive-Bomb
      // -----------------------------------------------------------------------
      else {
        // Red Arremer Evasion: If player attacks nearby OR gets too close on ground, demon leap into air!
        const playerThreat = (player.attackT > 0 && dist < 120) || (dist < 92);
        if (playerThreat && e.grounded && e.cd <= 0 && e.state !== "leap" && e.state !== "hover" && e.state !== "dive") {
          e.state = "leap";
          e.vy = -230;
          e.vx = -e.facing * 80;
          e.cd = 0.3;
          sound.playSfx("jump");
        } else if (dist <= 52 && e.cd <= 0 && e.state === "idle") {
          e.wind = 0.16;
          e.cd = 0.52;
          e.state = "slash";
        }

        if (e.state === "leap") {
          // Ascending from demon leap - transition to mid-air hover near apex
          if (e.vy >= -40 || e.y <= player.y - 65) {
            e.state = "hover";
            e.hoverT = 0;
            e.fired = false;
            e.vy = 0;
            e.vx = 0;
          }
        } else if (e.state === "hover") {
          // Mid-air hover: flaps wings defying gravity
          e.hoverT = (e.hoverT ?? 0) + dt;
          e.vy = Math.sin(e.t * 6.5) * 16; // Flapping bob
          e.vx = Math.sign(dx) * 35; // Drifts towards player
          e.facing = dx >= 0 ? 1 : -1;

          // Spit hellfire orb
          if ((e.hoverT ?? 0) >= 0.35 && !e.fired) {
            e.fired = true;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -14),
              y: e.y + 16,
              w: 16,
              h: 16,
              vx: e.facing * 165,
              vy: Math.max(-50, Math.min(100, (player.y - e.y) * 1.2)),
              gravity: 80,
              life: 2.0,
              dmg: 1,
              friendly: false,
              sprite: "blood",
            });
            sound.playSfx("spell");
          }

          // Predatory dive-bomb attack!
          if ((e.hoverT ?? 0) >= 0.82) {
            e.state = "dive";
            e.vx = Math.sign(dx) * 175;
            e.vy = 260;
            sound.playEnemyAlert("gargoyle");
          }
        } else if (e.state === "dive") {
          // Swooping dive-bomb claw attack
          e.vx = Math.sign(dx) * 175;
          e.vy = 260;
          // Claw attack hitbox during dive
          const diveBox = {
            x: e.x - 4,
            y: e.y,
            w: e.w + 8,
            h: e.h + 6,
          };
          if (overlap(diveBox, player)) {
            hurtPlayer(2, e.x, "slash");
          }
          if (e.grounded) {
            // Slam into stone floor with screenshake!
            e.state = "idle";
            e.cd = 0.65;
            e.vx = 0;
            shake = Math.max(shake, 3.5);
            sound.playSfx("slashHeavy");
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          const minStop = (e.w + player.w) / 2 + 3;
          e.vx = dist > minStop ? e.facing * 70 : 0;
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 44,
              y: e.y + 8,
              w: 46,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash"); // Stone claw swipe deals 2 DMG
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          const minStop = (e.w + player.w) / 2 + 6;
          e.vx = dist > minStop ? e.facing * 68 : 0;
        }
      }

      // Apply gravity and resolve solid collision firmly to the floor
      if (e.kind === "gargoyle" && e.state === "hover") {
        // Gargoyle mid-air hover flaps wings defying ground gravity!
        resolve(e, dt, false);
      } else {
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
    }

    // =========================================================================
    // PHYSICAL SOLID BODY RESOLUTION BETWEEN ENEMY AND ALDRIC:
    // Enemies must NOT penetrate Aldric's body space or slip behind him!
    // They deal contact damage, but stay in front of the player.
    // =========================================================================
    if (!e.dead && !e.dying && !player.dead && !player.dying && e.kind !== "bat") {
      const pTop = player.y;
      const pBot = player.y + player.h;
      const eTop = e.y;
      const eBot = e.y + e.h;
      const vertOverlap = Math.min(pBot, eBot) - Math.max(pTop, eTop);

      // Only block horizontally when at the same ground elevation (allows jumping/pogoing over)
      if (vertOverlap > 12) {
        const eCenterX = e.x + e.w / 2;
        const pCenterX = player.x + player.w / 2;
        const minDistance = (e.w + player.w) / 2;
        const distToPlayer = Math.abs(pCenterX - eCenterX);

        if (distToPlayer < minDistance) {
          // Touch contact damage
          if (e.hurt <= 0) {
            const heavyContact = e.boss || e.kind === "knight" || e.kind === "gargoyle";
            hurtPlayer(heavyContact ? 2 : 1, eCenterX, "slash");
          }

          if (eCenterX < pCenterX) {
            // Enemy is on the LEFT of player: clamp enemy to player's left edge
            e.x = player.x - e.w;
            if (e.vx > 0) e.vx = 0;
            if (player.vx < 0) player.vx = 0;
          } else {
            // Enemy is on the RIGHT of player: clamp enemy to player's right edge
            e.x = player.x + player.w;
            if (e.vx < 0) e.vx = 0;
            if (player.vx > 0) player.vx = 0;
          }
        }
      }
    } else if (!e.dead && !e.dying && e.kind === "bat" && !player.dead && !player.dying) {
      const pCenterX = player.x + player.w / 2;
      const eCenterX = e.x + e.w / 2;
      const horizDist = Math.abs(pCenterX - eCenterX);
      const minHorizDist = (e.w + player.w) / 2;
      const headTop = player.y;

      // Check if bat is close to Aldric's head perimeter to deliver its attack
      const nearHeadHoriz = horizDist <= minHorizDist + 6;
      const nearHeadVert = e.y + e.h >= headTop - 6 && e.y <= headTop + 14;

      if (nearHeadHoriz && nearHeadVert) {
        if (e.cd <= 0 && e.hurt <= 0) {
          hurtPlayer(1, eCenterX, "slash");
          sound.playSfx("slice");
          shake = Math.max(shake, 1.5);
          e.cd = 0.95; // Recovery cooldown before next dive
          e.vy = -160; // Upward flap
          e.vx = -e.facing * 75; // Flap away
        }
      }

      // STRICT SOLID EXCLUSION: The bat must NEVER occupy the same space as Aldric!
      // 1. Vertical head clamp: bat cannot penetrate below the top of Aldric's head
      if (e.x + e.w > player.x && e.x < player.x + player.w) {
        if (e.y + e.h > headTop) {
          e.y = headTop - e.h;
          if (e.vy > 0) e.vy = 0;
        }
      }

      // 2. Horizontal body clamp: bat cannot penetrate into Aldric's torso from either side
      if (e.y + e.h > headTop && e.y < player.y + player.h) {
        if (eCenterX < pCenterX) {
          if (e.x + e.w > player.x) {
            e.x = player.x - e.w;
            if (e.vx > 0) e.vx = 0;
          }
        } else {
          if (e.x < player.x + player.w) {
            e.x = player.x + player.w;
            if (e.vx < 0) e.vx = 0;
          }
        }
      }
    }
  }

  function blit(img: HTMLImageElement | undefined, frame: number, cx: number, feet: number, height: number, facing: number, cols = 2) {
    const ready = !!img && img.complete && img.naturalWidth > 0;
    g.save();
    g.translate(Math.round(cx - camX), Math.round(feet - camY));
    g.scale(facing, 1);
    if (!ready || !img) {
      g.fillStyle = "#e2a23a";
      g.fillRect(-height * 0.18, -height, height * 0.36, height);
      g.restore();
      return;
    }
    const sw = img.width / cols;
    const sh = img.height / 2;
    const col = frame % cols;
    const row = Math.floor(frame / cols) % 2;
    const dw = height * (sw / sh);
    g.drawImage(img, col * sw, row * sh, sw, sh, -dw / 2, -height, dw, height);
    g.restore();
  }

  function blitStill(img: HTMLImageElement | undefined, cx: number, feet: number, height: number, facing = 1) {
    const ready = !!img && img.complete && img.naturalWidth > 0;
    g.save();
    g.translate(Math.round(cx - camX), Math.round(feet - camY));
    g.scale(facing, 1);
    if (!ready || !img) {
      g.fillStyle = "#3a2a32";
      g.fillRect(-height * 0.22, -height, height * 0.44, height);
      g.restore();
      return;
    }
    const dw = height * (img.naturalWidth / img.naturalHeight);
    g.drawImage(img, -dw / 2, -height, dw, height);
    g.restore();
  }

  function drawStrip(
    img: HTMLImageElement | undefined,
    factor: number,
    srcTop: number,
    srcSpan: number,
    destY: number,
    destH: number,
    alpha = 1,
    yFactor = factor,
  ) {
    if (!img || !img.complete || img.naturalWidth === 0 || destH <= 0) return;
    const sy = Math.max(0, Math.round(srcTop * img.naturalHeight));
    const sh = Math.max(1, Math.round(srcSpan * img.naturalHeight));
    const scale = destH / sh;
    const dw = img.naturalWidth * scale;
    // Mathematically safe modulo ensuring x starts seamlessly aligned
    const offset = ((camX * factor) % dw + dw) % dw;
    let x = -offset;
    const screenY = destY - camY * yFactor;
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalAlpha = alpha;
    while (x < T.viewW) {
      g.drawImage(
        img,
        0,
        sy,
        img.naturalWidth,
        sh,
        Math.floor(x),
        Math.round(screenY),
        Math.ceil(dw) + 1,
        Math.ceil(destH)
      );
      x += dw;
    }
    g.restore();
  }

  function draw() {
    if (!readyToRender) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#0a060f";
      g.fillRect(0, 0, T.viewW, T.viewH);
      return;
    }

    const ox = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    g.setTransform(1, 0, 0, 1, ox, 0);
    g.fillStyle = "#100814";
    g.fillRect(-4, -4, T.viewW + 8, T.viewH + 8);
    // 1. Deep Parallax Background Planes:
    const isOutdoor = level.theme === "gates" || level.theme === "gallery";

    if (isOutdoor) {
      // Distant nocturnal sky & moon (almost stationary)
      drawStrip(plates.sky, 0.03, 0, 1, -20, T.viewH + 40, 1, 0.02);
      // Distant castle spires / mountain silhouette
      drawStrip(plates.far, 0.08, 0, 1, -20, T.viewH + 40, 0.85, 0.05);
    } else {
      // Atmospheric dark gothic foundation for interior stages
      g.fillStyle = "#08050c";
      g.fillRect(0, 0, T.viewW, T.viewH);
    }

    // Stage Architectural Back Panorama (seamless mirrored layer, 0.22x parallax scroll)
    const backImg = plates.back || bg;
    if (backImg) {
      drawStrip(backImg, 0.22, 0, 1, -20, T.viewH + 40, 1, 0.08);
    }

    // Middle Architectural Layer (cemetery arches, gargoyles, iron fences with transparent openings)
    // Scrolling at 0.44x: moves realistically between the back panorama and the play plane
    if (plates.mid) {
      drawStrip(plates.mid, 0.44, 0, 1, -16, T.viewH + 32, 1, 0.12);
    }

    if (level.theme === "chapel") {
      g.save();
      g.fillStyle = "rgba(255, 240, 190, 0.07)";
      for (let lx = -100; lx < level.width; lx += 320) {
        const sx = Math.round(lx - camX * 0.45);
        if (sx < -200 || sx > T.viewW + 200) continue;
        g.beginPath();
        g.moveTo(sx + 40, -10);
        g.lineTo(sx + 130, -10);
        g.lineTo(sx + 250, T.viewH + 20);
        g.lineTo(sx + 110, T.viewH + 20);
        g.closePath();
        g.fill();
      }
      g.restore();
    }

    for (const p of particles) {
      if (p.depth !== "mid") continue;
      const px = Math.round(p.x - camX * 0.7);
      const py = Math.round(p.y - camY * 0.7);
      if (px < -10 || px > T.viewW + 10 || py < -10 || py > T.viewH + 10) continue;
      const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
      g.fillStyle = p.color;
      g.globalAlpha = a;
      g.fillRect(px, py, p.size, p.size);
    }
    g.globalAlpha = 1;

    // Background Architectural Props (Recessed Colossal Gladiator Statues, Arches, Stained Glass)
    for (const prop of level.props) {
      if (prop.layer === "bg") {
        const h = PROP_H[prop.kind] ?? 120;
        const sx = Math.round(prop.x - camX);
        const sy = Math.round(prop.y - camY);

        if (prop.kind === "gladiatorStatue") {
          g.save();
          g.fillStyle = "rgba(8, 6, 12, 0.55)";
          g.beginPath();
          g.arc(sx, sy - h * 0.65, h * 0.44, Math.PI, 0);
          g.lineTo(sx + h * 0.44, sy);
          g.lineTo(sx - h * 0.44, sy);
          g.closePath();
          g.fill();
          g.strokeStyle = "#382933";
          g.lineWidth = 3;
          g.stroke();
          g.restore();
        } else if (prop.kind === "stainedGlass") {
          // Cathedral stained glass lancet arch niche with divine light glow
          g.save();
          g.fillStyle = "rgba(5, 4, 10, 0.65)";
          g.beginPath();
          g.arc(sx, sy - h * 0.68, h * 0.4, Math.PI, 0);
          g.lineTo(sx + h * 0.4, sy);
          g.lineTo(sx - h * 0.4, sy);
          g.closePath();
          g.fill();
          g.strokeStyle = "#4a3c46";
          g.lineWidth = 4;
          g.stroke();

          // Soft radiant light beam through stained glass
          const glassGlow = g.createRadialGradient(sx, sy - h * 0.5, 10, sx, sy - h * 0.5, h * 0.7);
          glassGlow.addColorStop(0, "rgba(59, 130, 246, 0.22)");
          glassGlow.addColorStop(0.5, "rgba(217, 70, 239, 0.12)");
          glassGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.fillStyle = glassGlow;
          g.fillRect(sx - h * 0.7, sy - h * 0.9, h * 1.4, h * 1.2);
          g.restore();
        } else if (prop.kind === "cell") {
          // Dark recessed dungeon cell chamber in background
          g.save();
          g.fillStyle = "rgba(4, 3, 6, 0.75)";
          g.fillRect(sx - 48, sy - h + 10, 96, h - 8);
          g.strokeStyle = "#27272a";
          g.lineWidth = 2;
          g.strokeRect(sx - 48, sy - h + 10, 96, h - 8);
          g.restore();
        } else if (prop.kind === "angel" || prop.kind === "angelTall") {
          // Cathedral wall niche arch
          g.save();
          g.fillStyle = "rgba(6, 4, 8, 0.6)";
          g.beginPath();
          g.arc(sx, sy - h * 0.68, h * 0.35, Math.PI, 0);
          g.lineTo(sx + h * 0.35, sy);
          g.lineTo(sx - h * 0.35, sy);
          g.closePath();
          g.fill();
          g.strokeStyle = "#3f303a";
          g.lineWidth = 2;
          g.stroke();
          g.restore();
        }
        blitStill(propsArt[prop.kind], prop.x, prop.y, h);
      }
    }

    for (const s of level.solids) {
      const sx = Math.round(s.x - camX);
      const sy = Math.round(s.y - camY);
      if (sx > T.viewW + 12 || sx + s.w < -12 || sy > T.viewH + 12 || sy + s.h < -12) continue;

      if (s.oneWay) {
        const platH = 10;
        const theme = level.theme;
        // Gothic Castlevania SOTN Stone & Metal Palettes (Dark, atmospheric, zero neon)
        let slabMain = "#1a1e28";
        let slabDark = "#10131c";
        let edgeHighlight = "rgba(180, 200, 220, 0.55)";
        let edgeGroove = "#090c12";
        let corbelColor = "#262e3d";
        let corbelShadow = "#0a0d14";
        let seamColor = "rgba(0, 0, 0, 0.45)";

        if (theme === "chapel") {
          slabMain = "#1c1726";
          slabDark = "#120e1a";
          edgeHighlight = "rgba(210, 195, 230, 0.55)";
          edgeGroove = "#0a0711";
          corbelColor = "#302640";
          corbelShadow = "#090610";
        } else if (theme === "throne") {
          slabMain = "#1c0d16";
          slabDark = "#11070e";
          edgeHighlight = "rgba(230, 165, 185, 0.5)";
          edgeGroove = "#0a0308";
          corbelColor = "#38192b";
          corbelShadow = "#090306";
        } else if (theme === "library") {
          slabMain = "#1e140e";
          slabDark = "#130b08";
          edgeHighlight = "rgba(215, 180, 150, 0.5)";
          edgeGroove = "#0b0604";
          corbelColor = "#362217";
          corbelShadow = "#0a0503";
        } else if (theme === "alchemy") {
          slabMain = "#141a18";
          slabDark = "#0c1210";
          edgeHighlight = "rgba(170, 210, 195, 0.5)";
          edgeGroove = "#070c0a";
          corbelColor = "#22332c";
          corbelShadow = "#050a08";
        } else if (theme === "catacombs") {
          slabMain = "#121922";
          slabDark = "#0a1017";
          edgeHighlight = "rgba(160, 190, 215, 0.5)";
          edgeGroove = "#060a10";
          corbelColor = "#1e2938";
          corbelShadow = "#05090f";
        } else if (theme === "gallery") {
          slabMain = "#1f1c24";
          slabDark = "#141118";
          edgeHighlight = "rgba(215, 205, 225, 0.55)";
          edgeGroove = "#0b0910";
          corbelColor = "#322b3b";
          corbelShadow = "#0a080f";
        }

        // 1. Soft Ambient Drop Shadow beneath the platform
        const shadowGrad = g.createLinearGradient(0, sy + platH, 0, sy + platH + 12);
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.65)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = shadowGrad;
        g.fillRect(sx - 2, sy + platH, s.w + 4, 12);

        // 2. Main Stone Slab Body
        g.fillStyle = slabMain;
        g.fillRect(sx, sy, s.w, platH);
        g.fillStyle = slabDark;
        g.fillRect(sx, sy + 3, s.w, platH - 3);

        // 3. Chiseled Stone Edge (Fine 1px top highlight + subtle 1px sub-tone + dark shadow groove)
        g.fillStyle = edgeHighlight;
        g.fillRect(sx, sy, s.w, 1);
        g.fillStyle = "rgba(255, 255, 255, 0.08)";
        g.fillRect(sx, sy + 1, s.w, 1);
        g.fillStyle = edgeGroove;
        g.fillRect(sx, sy + 2, s.w, 1);
        g.fillStyle = "rgba(0, 0, 0, 0.7)";
        g.fillRect(sx, sy + platH - 1, s.w, 1);

        // 4. Subtle Interlocking Masonry Seams (chiseled joints every 24px)
        g.fillStyle = seamColor;
        for (let nx = 18; nx < s.w - 10; nx += 24) {
          g.fillRect(sx + nx, sy + 1, 1, platH - 2);
          g.fillStyle = "rgba(255, 255, 255, 0.06)";
          g.fillRect(sx + nx + 1, sy + 1, 1, platH - 2);
          g.fillStyle = seamColor;
        }

        // 5. Gothic Architectural Stone Corbels (brackets supporting the ledge)
        const corbelW = 7;
        const corbelH = 7;
        const drawCorbel = (cx: number) => {
          g.fillStyle = corbelShadow;
          g.fillRect(cx, sy + platH, corbelW + 1, corbelH);
          g.fillStyle = corbelColor;
          g.fillRect(cx, sy + platH, corbelW, 3);
          g.fillRect(cx + 1, sy + platH + 3, corbelW - 2, 2);
          g.fillRect(cx + 2, sy + platH + 5, corbelW - 4, 2);
          g.fillStyle = edgeHighlight;
          g.fillRect(cx, sy + platH, 1, 3);
          g.fillRect(cx + 1, sy + platH + 3, 1, 2);
        };

        drawCorbel(sx + 2);
        if (s.w >= 36) {
          drawCorbel(sx + s.w - corbelW - 2);
        }
        if (s.w >= 80) {
          for (let nx = 32; nx <= s.w - 32; nx += 36) {
            drawCorbel(sx + nx);
          }
        }
      } else if (s.y === GROUND_Y) {
        g.save();
        g.beginPath();
        g.rect(sx, sy, s.w, s.h);
        g.clip();
        if (plates.floor && plates.floor.complete && plates.floor.naturalWidth > 0) {
          const floorH = plates.floor.naturalHeight || 112;
          const dw = plates.floor.naturalWidth;
          const fx0 = -(((camX) % dw + dw) % dw);
          let fx = fx0;
          while (fx < sx + s.w + 10) {
            if (fx + dw > sx - 10) {
              g.drawImage(plates.floor, Math.round(fx), Math.round(sy), dw, floorH);
            }
            fx += dw;
          }
          if (s.h > floorH) {
            g.fillStyle = "#0c0812";
            g.fillRect(sx, sy + floorH, s.w, s.h - floorH);
          }
        } else {
          g.fillStyle = "#1e1822";
          g.fillRect(sx, sy, s.w, s.h);
        }
        // Authentic Castlevania Flagstone Edge
        g.fillStyle = "rgba(255, 255, 255, 0.16)";
        g.fillRect(sx, sy, s.w, 1);
        g.fillStyle = "rgba(0, 0, 0, 0.55)";
        g.fillRect(sx, sy + 1, s.w, 1);
        const depthGrad = g.createLinearGradient(0, sy + 2, 0, sy + 24);
        depthGrad.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        depthGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = depthGrad;
        g.fillRect(sx, sy + 2, s.w, 22);
        g.restore();
      } else {
        const isDungeon = s.y > GROUND_Y;

        // 1. If elevated block, cast ambient drop shadow beneath
        if (s.y + s.h < GROUND_Y) {
          const shadowGrad = g.createLinearGradient(0, sy + s.h, 0, sy + s.h + 10);
          shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.6)");
          shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.fillStyle = shadowGrad;
          g.fillRect(sx - 1, sy + s.h, s.w + 2, 10);
        }

        g.save();
        g.beginPath();
        g.rect(sx, sy, s.w, s.h);
        g.clip();

        // 2. Stone masonry texture
        if (plates.floor && plates.floor.complete && plates.floor.naturalWidth > 0) {
          const floorH = plates.floor.naturalHeight || 112;
          const dw = plates.floor.naturalWidth;
          const fx0 = -(((camX) % dw + dw) % dw);
          let fx = fx0;
          while (fx < sx + s.w + 10) {
            if (fx + dw > sx - 10) {
              g.drawImage(plates.floor, Math.round(fx), Math.round(sy), dw, floorH);
            }
            fx += dw;
          }
          if (isDungeon) {
            g.fillStyle = "rgba(10, 6, 16, 0.48)";
            g.fillRect(sx, sy, s.w, s.h);
          }
        } else {
          g.fillStyle = isDungeon ? "#120e18" : "#1a1622";
          g.fillRect(sx, sy, s.w, s.h);
        }

        // 3. Chiseled Stone Edges (top highlight, side shadows)
        g.fillStyle = "rgba(255, 255, 255, 0.18)";
        g.fillRect(sx, sy, s.w, 1);
        g.fillStyle = "rgba(0, 0, 0, 0.5)";
        g.fillRect(sx, sy + 1, s.w, 1);
        g.fillStyle = "rgba(255, 255, 255, 0.08)";
        g.fillRect(sx, sy + 1, 1, s.h - 1);
        g.fillStyle = "rgba(0, 0, 0, 0.45)";
        g.fillRect(sx + s.w - 1, sy + 1, 1, s.h - 1);
        g.fillStyle = "rgba(0, 0, 0, 0.6)";
        g.fillRect(sx, sy + s.h - 1, s.w, 1);

        // 4. Subtle gothic stone block courses
        if (s.h >= 18) {
          g.fillStyle = "rgba(0, 0, 0, 0.35)";
          for (let row = 16; row < s.h; row += 16) {
            g.fillRect(sx, sy + row, s.w, 1);
          }
        }
        g.restore();
      }
    }

    // Main Gameplay Plane Props (Columns, broken pillars, sconces, altars, cauldrons)
    for (const prop of level.props) {
      if (!prop.layer || prop.layer === "main") {
        const h = PROP_H[prop.kind] ?? 120;
        blitStill(propsArt[prop.kind], prop.x, prop.y, h);

        const sx = Math.round(prop.x - camX);
        const sy = Math.round(prop.y - camY);

        if (prop.kind === "sconceBlue") {
          const fx = sx;
          const fy = Math.round(sy - h + 18);
          const glow = g.createRadialGradient(fx, fy, 2, fx, fy, 48);
          glow.addColorStop(0, "rgba(59, 130, 246, 0.48)");
          glow.addColorStop(0.5, "rgba(147, 197, 253, 0.2)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 48, fy - 48, 96, 96);
          for (let i = 0; i < 2; i++) {
            const ox = Math.sin(time * 8 + i * 2) * 4;
            const oy = Math.cos(time * 6 + i * 3) * 3;
            g.fillStyle = i === 0 ? "#93c5fd" : "#38bdf8";
            g.fillRect(fx + ox - 1, fy + oy - 1, 3, 3);
          }
          g.restore();
        } else if (prop.kind === "candelabra") {
          // Warm candlelight glow with 3 flickering candle flames
          const fx = sx;
          const fy = Math.round(sy - h + 18);
          const glow = g.createRadialGradient(fx, fy, 2, fx, fy, 46);
          glow.addColorStop(0, "rgba(251, 191, 36, 0.42)");
          glow.addColorStop(0.5, "rgba(245, 158, 11, 0.18)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 46, fy - 46, 92, 92);
          for (let i = 0; i < 3; i++) {
            const ox = (i - 1) * 9 + Math.sin(time * 9 + i * 2) * 1.5;
            const oy = Math.cos(time * 7 + i * 3) * 1.5;
            g.fillStyle = i === 1 ? "#fef08a" : "#f59e0b";
            g.fillRect(fx + ox - 1, fy + oy - 1, 2.5, 2.5);
          }
          g.restore();
        } else if (prop.kind === "cauldronGreen") {
          // Acidic bubbling green vapor and bubbling droplets
          const fx = sx;
          const fy = Math.round(sy - h * 0.6);
          const glow = g.createRadialGradient(fx, fy, 4, fx, fy, 52);
          glow.addColorStop(0, "rgba(34, 197, 94, 0.48)");
          glow.addColorStop(0.5, "rgba(74, 222, 128, 0.2)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 52, fy - 52, 104, 104);
          for (let i = 0; i < 4; i++) {
            const bubbleT = (time * 2 + i * 0.7) % 2;
            const bx = fx + Math.sin(i * 3 + time * 3) * 12;
            const by = fy - bubbleT * 22;
            g.fillStyle = "rgba(134, 239, 172, " + Math.max(0, 1 - bubbleT / 2) + ")";
            g.fillRect(bx - 1.5, by - 1.5, 3, 3);
          }
          g.restore();
        } else if (prop.kind === "cauldronPurple") {
          // Mystical purple transmutation steam
          const fx = sx;
          const fy = Math.round(sy - h * 0.6);
          const glow = g.createRadialGradient(fx, fy, 4, fx, fy, 48);
          glow.addColorStop(0, "rgba(168, 85, 247, 0.45)");
          glow.addColorStop(0.5, "rgba(192, 132, 252, 0.18)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 48, fy - 48, 96, 96);
          for (let i = 0; i < 3; i++) {
            const bubbleT = (time * 2.2 + i * 0.8) % 2;
            const bx = fx + Math.cos(i * 2 + time * 2.5) * 10;
            const by = fy - bubbleT * 20;
            g.fillStyle = "rgba(216, 180, 254, " + Math.max(0, 1 - bubbleT / 2) + ")";
            g.fillRect(bx - 1.5, by - 1.5, 3, 3);
          }
          g.restore();
        } else if (prop.kind === "crystals") {
          // Pulsing arcane mana crystal illumination
          const fx = sx;
          const fy = Math.round(sy - h * 0.5);
          const pulse = 0.7 + 0.3 * Math.sin(time * 4);
          const glow = g.createRadialGradient(fx, fy, 2, fx, fy, 42 * pulse);
          glow.addColorStop(0, "rgba(56, 189, 248, 0.55)");
          glow.addColorStop(0.5, "rgba(147, 197, 253, 0.22)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 42, fy - 42, 84, 84);
          for (let i = 0; i < 2; i++) {
            const ang = time * 2.5 + i * Math.PI;
            const ox = Math.cos(ang) * 14;
            const oy = Math.sin(ang) * 10;
            g.fillStyle = "#e0f2fe";
            g.fillRect(fx + ox - 1, fy + oy - 1, 2, 2);
          }
          g.restore();
        } else if (prop.kind === "throne") {
          // Ominous royal crimson aura on Dracula's seat
          const fx = sx;
          const fy = Math.round(sy - h * 0.5);
          const glow = g.createRadialGradient(fx, fy, 4, fx, fy, 64);
          glow.addColorStop(0, "rgba(225, 29, 72, 0.35)");
          glow.addColorStop(0.6, "rgba(136, 19, 55, 0.15)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.save();
          g.fillStyle = glow;
          g.fillRect(fx - 64, fy - 64, 128, 128);
          g.restore();
        }
      }
    }

    // Collectible Items (Life chalices, Health elixirs, Mana flasks)
    for (const it of items) {
      if (it.collected) continue;
      const sx = Math.round(it.x - camX);
      const floatY = Math.round(it.y - camY + Math.sin(time * 3.5 + it.bounceT) * 4);
      if (sx < -40 || sx > T.viewW + 40 || floatY < -40 || floatY > T.viewH + 40) continue;

      // Magical glowing halo
      const glow = g.createRadialGradient(sx + 12, floatY + 12, 2, sx + 12, floatY + 12, 18);
      const glowColor =
        it.kind === "life"
          ? "rgba(255, 215, 0, 0.45)"
          : it.kind === "heal"
          ? "rgba(239, 68, 68, 0.4)"
          : "rgba(59, 130, 246, 0.45)";
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = glow;
      g.fillRect(sx - 8, floatY - 8, 40, 40);

      // Sprite
      const img = itemArt[it.kind];
      if (img && img.complete && img.naturalWidth > 0) {
        g.drawImage(img, sx, floatY, 24, 24);
      }
    }

    // =========================================================================
    // RENDER GOTHIC SEAL PUZZLES (Runic Blood Crystals & Iron Portcullis Gates)
    // =========================================================================
    for (const c of sealCrystals) {
      const sx = Math.round(c.x - camX);
      const sy = Math.round(c.y - camY);
      if (sx < -60 || sx > T.viewW + 60) continue;

      const cx = sx + Math.round(c.w / 2);
      const baseBot = sy + c.h;

      // 1. Vertical Beacon Pillar (helps player spot elevated puzzle crystals from the floor)
      g.save();
      const beamGrad = g.createLinearGradient(0, baseBot - 95, 0, baseBot);
      if (c.activated) {
        beamGrad.addColorStop(0, "rgba(250, 204, 21, 0)");
        beamGrad.addColorStop(1, "rgba(250, 204, 21, 0.25)");
      } else {
        beamGrad.addColorStop(0, "rgba(255, 23, 68, 0)");
        beamGrad.addColorStop(1, "rgba(255, 23, 68, 0.32)");
      }
      g.fillStyle = beamGrad;
      g.fillRect(cx - 8, baseBot - 95, 16, 95);

      // 2. Ornate Gothic Stone Altar Base
      g.fillStyle = "#18181b";
      g.fillRect(cx - 11, baseBot - 12, 22, 12);
      g.fillStyle = "#27272a";
      g.fillRect(cx - 8, baseBot - 16, 16, 5);
      g.fillStyle = c.activated ? "#eab308" : "#e11d48";
      g.fillRect(cx - 6, baseBot - 10, 12, 2);

      // 3. Levitating Diamond Seal Crystal
      const bob = Math.sin(c.pulseT) * 3.5;
      const gemY = Math.round(sy + 12 + bob);

      const halo = g.createRadialGradient(cx, gemY, 2, cx, gemY, 24);
      if (c.activated) {
        halo.addColorStop(0, "rgba(254, 240, 138, 0.85)");
        halo.addColorStop(0.5, "rgba(234, 179, 8, 0.35)");
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        halo.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        halo.addColorStop(0.35, "rgba(255, 23, 68, 0.75)");
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      g.fillStyle = halo;
      g.fillRect(cx - 24, gemY - 24, 48, 48);

      // Diamond polygon
      g.beginPath();
      g.moveTo(cx, gemY - 10);
      g.lineTo(cx + 7, gemY);
      g.lineTo(cx, gemY + 10);
      g.lineTo(cx - 7, gemY);
      g.closePath();
      g.fillStyle = c.activated ? "#fde047" : "#ff1744";
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = "#ffffff";
      g.stroke();

      // Label above crystal
      g.font = "bold 7px monospace";
      g.textAlign = "center";
      g.fillStyle = c.activated ? "#fde047" : "#fecdd3";
      g.fillText(c.activated ? `${c.label} OK` : `${c.label} [GOLPEIE]`, cx, sy - 4);
      g.restore();
    }

    // Render Gothic Sealed Iron Portcullis Gates
    for (const gate of sealGates) {
      if (gate.openProgress >= 1) continue;
      const sx = Math.round(gate.x - camX);
      if (sx < -60 || sx > T.viewW + 60) continue;

      const liftY = Math.round(gate.openProgress * gate.h);
      const curH = gate.h - liftY;
      if (curH <= 0) continue;

      g.save();
      // Dark stone archway frame
      g.fillStyle = "#09090b";
      g.fillRect(sx - 2, 0, gate.w + 4, curH);

      // Vertical wrought-iron bars
      g.fillStyle = "#3f3f46";
      for (let bx = sx + 2; bx < sx + gate.w - 2; bx += 5) {
        g.fillRect(bx, 0, 3, curH - 4);
        // Iron spike tip at bottom
        g.fillStyle = "#71717a";
        g.fillRect(bx + 1, curH - 4, 1, 4);
        g.fillStyle = "#3f3f46";
      }

      // Horizontal riveted iron crossbeams
      for (let by = 28; by < curH - 12; by += 36) {
        g.fillStyle = "#27272a";
        g.fillRect(sx - 1, by, gate.w + 2, 6);
        g.fillStyle = "#ef4444";
        g.fillRect(sx + 3, by + 2, gate.w - 6, 2);
      }

      // Glowing Crimson Rune Lock Emblem at eye level
      if (!gate.open) {
        const lockY = Math.min(curH - 30, 145);
        const lockGlow = g.createRadialGradient(sx + gate.w / 2, lockY, 2, sx + gate.w / 2, lockY, 28);
        lockGlow.addColorStop(0, "rgba(255, 23, 68, 0.75)");
        lockGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = lockGlow;
        g.fillRect(sx - 18, lockY - 28, gate.w + 36, 56);

        const gateCrystals = sealCrystals.filter((c) => c.gateId === gate.id);
        const broken = gateCrystals.filter((c) => c.activated).length;
        g.fillStyle = "rgba(0, 0, 0, 0.85)";
        g.fillRect(sx - 24, lockY - 26, gate.w + 48, 14);
        g.strokeStyle = "#ef4444";
        g.lineWidth = 1;
        g.strokeRect(sx - 24, lockY - 26, gate.w + 48, 14);
        g.font = "bold 7px monospace";
        g.textAlign = "center";
        g.fillStyle = "#fda4af";
        g.fillText(`SELOS ${broken}/${gateCrystals.length}`, sx + gate.w / 2, lockY - 16);
      }
      g.restore();
    }

    const bosses = enemies.filter((e) => e.boss);
    const open = bosses.length > 0 && bosses.every((e) => e.dead);

    // Magical Gothic Portal - only appears when the stage Boss is defeated!
    if (open) {
      const worldPortalX = level.door.x + 18;
      const worldPortalFeet = level.door.y + 64;
      const screenX = Math.round(worldPortalX - camX);
      const screenFeet = Math.round(worldPortalFeet - camY);

      // Radiant portal ground aura
      const aura = g.createRadialGradient(screenX, screenFeet - 2, 4, screenX, screenFeet - 2, 48);
      aura.addColorStop(0, "rgba(220, 38, 38, 0.65)");
      aura.addColorStop(0.45, "rgba(168, 85, 247, 0.45)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = aura;
      g.fillRect(screenX - 48, screenFeet - 24, 96, 36);

      // Pulsating dimensional opening animation frames (1 = awakening, 2 = vortex opening, 3 = active rift)
      const pFrame = (Math.floor(time * 5) % 3) + 1;
      const portalImg = art.portalGate;
      if (portalImg && portalImg.complete && portalImg.naturalWidth > 0) {
        blit(portalImg, pFrame, worldPortalX, worldPortalFeet, 108, 1);
      } else {
        g.fillStyle = "#ff1744";
        g.fillRect(screenX - 18, screenFeet - 64, 36, 64);
      }

      // Swirling astral sparks rotating around the dimensional rift
      for (let i = 0; i < 6; i++) {
        const ang = time * 3.8 + i * (Math.PI / 3);
        const sx = screenX + Math.cos(ang) * 18;
        const sy = screenFeet - 46 + Math.sin(ang) * 28;
        g.fillStyle = i % 2 === 0 ? "#00e5ff" : "#ffd700";
        g.fillRect(sx - 1, sy - 1, 3, 3);
      }
    }

    for (const s of shots) {
      const img = art[s.sprite];
      if (s.sprite === "slash" && s.frameLock >= 0) {
        const root = SLASH_ROOT[s.frameLock];
        const facing = s.vx >= 0 ? 1 : -1;
        blitRoot(img, s.frameLock, s.x + s.w / 2, s.drawCenterY, 60, facing, root.x, root.y);
      } else {
        const frame = Math.floor(time * 12) % 4;
        const height = s.sprite === "slash" ? 42 : 28;
        const facing = s.vx > 0 ? 1 : s.vx < 0 ? -1 : player.facing;
        blit(img, frame, s.x + s.w / 2, s.y + s.h / 2 + height / 2, height, facing);
      }
    }

    for (const e of enemies) {
      if (e.dead && !e.dying) continue;
      if (e.hurt > 0 && Math.floor(time * 24) % 2 === 0) continue;

      let spriteKey: ArtKey = e.kind;
      const curPhase = e.phase ?? 1;
      if (e.boss && !e.dying) {
        if (e.kind === "bossPetros" && curPhase >= 2) spriteKey = "bossPetrosP2";
        else if (e.kind === "bossValerius" && curPhase >= 2) spriteKey = "bossValeriusP2";
        else if (e.kind === "bossSeraphine" && curPhase >= 2) spriteKey = "bossSeraphineP2";
        else if (e.kind === "bossNocturne" && curPhase >= 2) spriteKey = "bossNocturneP2";
        else if (e.kind === "bossVeyne" && curPhase >= 2) spriteKey = "bossVeyneP2";
        else if (e.kind === "bossCalx" && curPhase >= 2) spriteKey = "bossCalxP2";
        else if ((e.kind === "bossDracula" || e.kind === "dracula") && curPhase >= 3) spriteKey = "bossDraculaP2";
      }

      let frame = 0;

      if (e.dying) {
        spriteKey = getDeathSpriteKey(e.kind);
        if (e.kind !== "bat" && !e.grounded) {
          frame = 0; // Upright stagger pose while falling to the floor
        } else {
          const progress = Math.min(0.999, (e.deathT ?? 0) / (e.deathDuration ?? 0.65));
          frame = Math.min(3, Math.floor(progress * 4));
        }
      } else if ((e.transformT ?? 0) > 0) {
        // Dramatic roar/ascension pose during phase mutation!
        frame = Math.floor(time * 10) % 2 === 0 ? 1 : 3;
      } else if (e.hurt > 0) {
        frame = 3;
      } else if (e.state === "slash" || e.wind > 0 || e.state === "smash" || e.state === "charge") {
        frame = 2;
      } else if (e.state === "dive" || e.state === "leap") {
        frame = 2;
      } else if (e.state === "hover") {
        frame = Math.floor(e.t * 8) % 2 === 0 ? 0 : 2; // Wings flapping during hover
      } else if (e.kind === "bat") {
        frame = Math.floor(e.t * 8) % 4;
      } else if (Math.abs(e.vx) > 3) {
        // Real walking animation: smoothly alternates stepping legs (frame 0 and 1)
        frame = Math.floor(time * 5.5) % 2;
      } else {
        frame = 0;
      }

      let tall = e.kind === "bat" ? (e.boss ? 92 : DRAW_H[e.kind]) : DRAW_H[e.kind];
      // Boss physical growth / mutation scale in Phase 2 and Phase 3!
      if (e.boss && curPhase >= 2) {
        if (e.kind === "bossDracula" || e.kind === "dracula") {
          tall *= curPhase >= 3 ? 1.32 : 1.12;
        } else {
          tall *= 1.24;
        }
      }
      if (e.boss && (e.transformT ?? 0) > 0) {
        tall *= 1 + Math.sin(time * 28) * 0.08;
      }
      if (e.boss && e.dying) tall *= 1.15;

      const isP2Sprite = spriteKey !== e.kind && !e.dying;
      const feet = e.y + e.h + (isP2Sprite ? 3 : (FEET_OFF[e.kind] ?? 0));

      // Transformation energy pillar & shockwave ring when boss is mutating!
      if (e.boss && (e.transformT ?? 0) > 0) {
        const bx = Math.round(e.x + e.w / 2 - camX);
        const by = Math.round(feet - camY);
        g.save();
        const pillarGrad = g.createLinearGradient(bx - 42, 0, bx + 42, 0);
        pillarGrad.addColorStop(0, "rgba(255, 23, 68, 0)");
        pillarGrad.addColorStop(0.3, "rgba(255, 23, 68, 0.55)");
        pillarGrad.addColorStop(0.5, "rgba(255, 240, 150, 0.85)");
        pillarGrad.addColorStop(0.7, "rgba(255, 23, 68, 0.55)");
        pillarGrad.addColorStop(1, "rgba(255, 23, 68, 0)");
        g.fillStyle = pillarGrad;
        g.fillRect(bx - 42, 0, 84, by + 4);

        // Expanding shockwave ring
        const prog = 1 - (e.transformT ?? 0) / 1.15;
        const ringR = 16 + prog * 135;
        g.strokeStyle = `rgba(255, 215, 0, ${Math.max(0, 1 - prog)})`;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(bx, by - tall * 0.45, ringR, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }

      if (e.boss && curPhase >= 2 && !e.dead && !e.dying) {
        const bx = Math.round(e.x + e.w / 2 - camX);
        const by = Math.round(feet - camY - 2);
        const auraColor =
          e.kind === "bossCalx" ? "#22c55e" :
          e.kind === "bossVeyne" ? "#a855f7" :
          e.kind === "bossPetros" ? "#f97316" : "#ef4444";
        g.save();
        g.globalAlpha = 0.42 + Math.sin(time * 9) * 0.18;
        g.fillStyle = auraColor;
        g.beginPath();
        g.ellipse(bx, by, e.w * 1.05, 11, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      if (e.state === "emerge") {
        const floorY = (e.emergeY ?? (e.y - e.h)) + e.h;
        const groundScreenY = Math.round(floorY - camY);
        g.save();
        g.beginPath();
        g.rect(Math.round(e.x - camX - 40), 0, e.w + 80, groundScreenY);
        g.clip();
        blit(art[spriteKey], frame, e.x + e.w / 2, feet, tall, e.facing);
        g.restore();

        // Draw cracked stone mound / dust puff at emergence point
        const sx = Math.round(e.x + e.w / 2 - camX);
        const sy = groundScreenY;
        g.fillStyle = "#3f3f46";
        g.fillRect(sx - 16, sy - 2, 32, 3);
        g.fillStyle = "#71717a";
        g.fillRect(sx - 10, sy - 3, 20, 2);
      } else {
        blit(art[spriteKey], frame, e.x + e.w / 2, feet, tall, e.facing);
      }
    }

    const isInvulnerable = player.iframes > 0;
    if (isInvulnerable) {
      g.save();
      g.globalAlpha = Math.floor(time * 20) % 2 === 0 ? 0.45 : 0.85;
    }

    let sheet: ArtKey = "heroIdle";
    let frame = Math.floor(time * 3) % 4;
    let heroCols = 3;

    if (player.dying) {
      sheet = "heroDie";
      heroCols = 2;
      if (!player.grounded) {
        frame = 0; // Upright stagger pose while falling to the floor
      } else {
        const progress = Math.min(0.999, player.deathT / player.deathDuration);
        frame = Math.min(3, Math.floor(progress * 4));
      }
    } else if (player.dead) {
      sheet = "heroDie";
      heroCols = 2;
      frame = 3; // Slumped flat on ground in defeat
    } else if (player.specialT > 0) {
      sheet = "heroSpecial";
      heroCols = 2;
      const progress = 1 - Math.max(0, player.specialT / player.specialDuration);
      if (progress < 0.22) frame = 0;      // Windup stance with glowing broadsword
      else if (progress < 0.52) frame = 1; // Deep lunge forward thrust with billowing crimson cape
      else if (progress < 0.78) frame = 2; // Peak crescent release with winged cape flare
      else frame = 3;                      // Recovery flourish sweeping runic blade
    } else if (player.dashT > 0) {
      sheet = "heroDash";
      frame = Math.min(2, Math.floor(((T.dashTime - player.dashT) / T.dashTime) * 3));
    } else if (player.guard) {
      sheet = "heroGuard";
      frame = player.guardT < 0.06 ? 0 : player.guardT < 0.12 ? 1 : player.guardT < 0.18 ? 2 : player.guardFlash > 0 ? 4 : 3;
    } else if (player.castT > 0) {
      if (player.crouching) {
        sheet = "heroCrouch";
        frame = 3;
      } else {
        sheet = "heroCast";
        frame = Math.min(4, Math.floor((1 - player.castT / 0.28) * 5));
      }
    } else if (player.attackT > 0) {
      if (player.attackKind === "crouch") {
        sheet = "heroCrouch";
        frame = player.attackT > 0.1 ? 1 : 2;
      } else if (player.attackKind === "down" && !player.grounded) {
        sheet = "heroJump";
        frame = 3;
      } else {
        sheet = "heroAttack";
        if (player.attackKind === "up") frame = 1;
        else frame = Math.min(4, Math.floor((1 - player.attackT / 0.2) * 5));
      }
    } else if (!player.grounded) {
      sheet = "heroJump";
      frame = player.vy < -60 ? 1 : Math.abs(player.vy) <= 60 ? 0 : 2;
    } else if (player.crouching) {
      sheet = "heroCrouch";
      frame = 0;
    } else if (Math.abs(player.vx) > 10) {
      sheet = "heroRun";
      frame = Math.floor(time * 10) % 4;
    }
    // the 320px cells keep the boots 56px above the cell bottom
    const heroFeet = player.y + player.h + (56 / 320) * DRAW_H.hero;
    blit(art[sheet], frame, player.x + player.w / 2, heroFeet, DRAW_H.hero, player.facing, heroCols);
    if (isInvulnerable) {
      g.restore();
    }
    if (player.attackT > 0 && player.castT <= 0) {
      if (player.attackKind === "down") {
        const slashX = player.x + player.w / 2;
        const slashY = player.y + player.h + 26;
        blit(art.slash, 3, slashX, slashY, 40, player.facing);
      } else if (player.attackKind === "up") {
        const slashX = player.x + player.w / 2 + player.facing * 8;
        const slashY = player.y + 4;
        blit(art.slash, 0, slashX, slashY, 56, player.facing);
      }
    }

    // Render Special Crescent Slashes ("Golpe Crescente")
    for (const s of specialSlashes) {
      const progress = 1 - Math.max(0, s.life / s.maxLife);
      const sFrame = Math.min(3, Math.floor(progress * 4));
      const drawX = s.x + s.w / 2;
      const drawY = s.y + s.h;
      blit(art.crescentSlash, sFrame, drawX, drawY, s.h, s.facing, 2);

      // Core radial light around the crescent
      const cx = Math.round(drawX - camX);
      const cy = Math.round(s.y + s.h / 2 - camY);
      g.save();
      g.globalAlpha = 0.55;
      const cGlow = g.createRadialGradient(cx, cy, 6, cx, cy, 70);
      cGlow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      cGlow.addColorStop(0.4, "rgba(255, 23, 68, 0.65)");
      cGlow.addColorStop(1, "rgba(200, 0, 0, 0)");
      g.fillStyle = cGlow;
      g.fillRect(cx - 70, cy - 70, 140, 140);
      g.restore();
    }

    if (player.specialT > 0) {
      const gx = Math.round(player.x + player.w / 2 - camX);
      const gy = Math.round(player.y + player.h / 2 - camY);
      g.save();
      g.globalAlpha = 0.6 + Math.sin(time * 24) * 0.25;
      const glow = g.createRadialGradient(gx, gy, 4, gx, gy, 56);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      glow.addColorStop(0.3, "rgba(255, 23, 68, 0.75)");
      glow.addColorStop(0.7, "rgba(180, 0, 30, 0.35)");
      glow.addColorStop(1, "rgba(100, 0, 0, 0)");
      g.fillStyle = glow;
      g.fillRect(gx - 56, gy - 56, 112, 112);
      g.restore();
    }

    // 4. Foreground Atmospheric 2.5D Depth:
    // Stage Foreground Architectural Framing (gnarled branches, arches, vaulting, scrolling at 1.16x)
    if (plates.fg) {
      drawStrip(plates.fg, 1.16, 0, 1, -12, T.viewH + 24, 0.92, 0.12);
    }

    // Foreground Pillars and Hanging Ceiling Columns (passing in front of actors)
    for (const prop of level.props) {
      if (prop.layer === "fg") {
        const h = PROP_H[prop.kind] ?? 150;
        let feet = prop.y;
        if ((prop.kind === "hangingColumn" || prop.kind === "chains") && prop.y <= 60) {
          feet = prop.y + h;
        }
        // Foreground 2.5D parallax (slightly faster scroll than main plane)
        const fgX = prop.x - (camX * 0.12);
        blitStill(propsArt[prop.kind], fgX, feet, h);
      }
    }

    // Soft rolling floor mist
    drawStrip(plates.fog, 1.15, 0.2, 0.6, GROUND_Y - 22, 58, 0.35, 1.1);

    // Foreground Ambient Particles (depth === "fg", scrolling at 1.25x)
    for (const p of particles) {
      if (p.depth !== "fg") continue;
      const px = Math.round(p.x - camX * 1.25);
      const py = Math.round(p.y - camY * 1.25);
      if (px < -10 || px > T.viewW + 10 || py < -10 || py > T.viewH + 10) continue;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      g.save();
      g.fillStyle = p.color;
      g.globalAlpha = a;
      g.shadowColor = p.color;
      g.shadowBlur = 4;
      g.fillRect(px, py, p.size, p.size);
      g.restore();
    }

    // 5. Gothic Atmospheric Lighting & Vignette Post-Process
    const theme = level.theme;
    let tintColor = "rgba(18, 12, 30, 0.08)";
    if (theme === "chapel") tintColor = "rgba(40, 14, 58, 0.09)";
    else if (theme === "throne") tintColor = "rgba(52, 8, 20, 0.10)";
    else if (theme === "alchemy") tintColor = "rgba(10, 32, 22, 0.07)";
    else if (theme === "catacombs") tintColor = "rgba(8, 22, 38, 0.08)";
    else if (theme === "library") tintColor = "rgba(35, 20, 10, 0.07)";
    else if (theme === "gates") tintColor = "rgba(10, 20, 35, 0.07)";
    g.fillStyle = tintColor;
    g.fillRect(0, 0, T.viewW, T.viewH);

    // Radial Gothic Vignette (fades corners to deep shadow)
    const cx = T.viewW / 2;
    const cy = T.viewH / 2;
    const rMax = Math.hypot(cx, cy);
    const radVig = g.createRadialGradient(cx, cy, T.viewW * 0.32, cx, cy, rMax);
    radVig.addColorStop(0, "rgba(0, 0, 0, 0)");
    radVig.addColorStop(0.65, "rgba(4, 2, 8, 0.22)");
    radVig.addColorStop(1, "rgba(4, 2, 8, 0.58)");
    g.fillStyle = radVig;
    g.fillRect(0, 0, T.viewW, T.viewH);

    // Subtle top & bottom letterbox edge shading
    const edgeVig = g.createLinearGradient(0, 0, 0, T.viewH);
    edgeVig.addColorStop(0, "rgba(0, 0, 0, 0.28)");
    edgeVig.addColorStop(0.12, "rgba(0, 0, 0, 0)");
    edgeVig.addColorStop(0.88, "rgba(0, 0, 0, 0)");
    edgeVig.addColorStop(1, "rgba(0, 0, 0, 0.32)");
    g.fillStyle = edgeVig;
    g.fillRect(0, 0, T.viewW, T.viewH);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  function publish() {
    const boss = enemies.find((e) => e.boss && !e.dead) || enemies.find((e) => e.boss);
    const bossInSight = !!boss && (boss.x < camX + T.viewW + 24 && boss.x + boss.w > camX - 32);
    const bossOn = !!boss && (boss.boss && (bossInSight || player.x > boss.homeX - 460 || boss.hp < boss.max));
    if (bossOn && !player.dead && !player.won && boss && !boss.dead) {
      if (!bossIntroPlayed) {
        bossIntroPlayed = true;
        sound.playBossVoice(level.id);
        const quotes: Record<number, string> = {
          1: "Petros: 'Nenhum mortal cruzará os portões do Mestre!'",
          2: "Valerius: 'Sua jornada tola termina sob o fio desta lâmina!'",
          3: "Seraphine: 'Seu sangue alimentará este santuário sagrado...'",
          4: "Nocturne: 'Eu sinto o terror em sua carne nas trevas!'",
          5: "Lorde Veyne: 'As sombras da biblioteca devorarão sua alma!'",
          6: "Calx: 'ROOOAAAR! O elixir eterno exige sacrifício!'",
          7: "Conde Drácula: 'O que é um homem senão uma miserável pilha de segredos?!'",
        };
        player.toast = quotes[level.id] || `${boss.name} ergue-se nas trevas!`;
        player.toastT = 4.2;
      }
      if (bossIntroPlayed && !bossEnragedAnnounced && boss.hp / boss.max < 0.5) {
        bossEnragedAnnounced = true;
        sound.playSfx("bossHurt");
        shake = Math.max(shake, 8);
        player.toast = `⚠️ ${boss.name.split(',')[0]} ENTROU EM FÚRIA! Padrões letais acelerados!`;
        player.toastT = 3.0;
      }
      if (level.id === 7) {
        if (sound.getCurrentTrack() !== "stage7") {
          sound.playStageBgm(7);
        }
      } else if (sound.getCurrentTrack() !== "boss") {
        sound.playBgm("boss");
      }
    }
    const sealsSolved = sealCrystals.filter((c) => c.activated).length;
    const sealsTotal = sealCrystals.length;
    onHud({
      hp: player.hp,
      maxHp: T.maxHp,
      mana: Math.round(player.mana),
      maxMana: T.maxMana,
      special: Math.round(player.special),
      specialReady: player.special >= 100,
      lives: player.lives,
      bossName: boss?.name || "",
      bossHp: boss ? Math.max(0, boss.hp) : 0,
      bossMax: boss?.max || 1,
      bossOn,
      bossPhase: boss?.phase ?? 1,
      bossTransforming: (boss?.transformT ?? 0) > 0,
      toast: player.toastT > 0 ? player.toast : "",
      won: player.won,
      dead: player.dead,
      title: level.title,
      dashReady: player.dashCd <= 0,
      charge: Math.min(1, player.holdT / 0.55),
      sealsSolved,
      sealsTotal,
    });
  }

  function frame(now: number) {
    if (!alive) return;
    if (!readyToRender || paused) {
      last = now;
      acc = 0;
      draw();
      raf = requestAnimationFrame(frame);
      return;
    }
    acc += Math.min(0.05, (now - last) / 1000);
    last = now;
    const held = actions();
    const hasKeyAction = (act: Action) => {
      for (const code of keysDownThisFrame) {
        if (CODE[code]?.includes(act)) return true;
      }
      return false;
    };
    const press = {
      jump: pointerDownThisFrame.has("jump") || hasKeyAction("jump") || (held.has("jump") && !prev.has("jump")),
      attack: pointerDownThisFrame.has("attack") || hasKeyAction("attack") || (held.has("attack") && !prev.has("attack")),
      dash: pointerDownThisFrame.has("dash") || hasKeyAction("dash") || (held.has("dash") && !prev.has("dash")),
      spell: pointerDownThisFrame.has("spell") || hasKeyAction("spell") || (held.has("spell") && !prev.has("spell")),
      special: pointerDownThisFrame.has("special") || hasKeyAction("special") || (held.has("special") && !prev.has("special")),
    };
    let consumedInput = false;
    let steps = 0;
    while (acc >= 1 / 60 && steps < 5) {
      if (hitstop > 0) hitstop -= 1 / 60;
      else {
        step(1 / 60, !consumedInput ? press : { jump: false, attack: false, dash: false, spell: false, special: false }, held);
        consumedInput = true;
      }
      acc -= 1 / 60;
      steps++;
    }
    if (consumedInput) {
      prev = held;
      keysDownThisFrame.clear();
      pointerDownThisFrame.clear();
    }
    draw();
    const bossObj = enemies.find((e) => e.boss && !e.dead);
    const wantsBossIntro = !!bossObj && !bossIntroPlayed && (bossObj.x < camX + T.viewW + 24 || player.x > bossObj.homeX - 460 || bossObj.hp < bossObj.max);
    if (steps > 0 && (wantsBossIntro || Math.floor(time * 60) % 4 === 0)) publish();
    raf = requestAnimationFrame(frame);
  }

  spawn();
  publish();
  raf = requestAnimationFrame(frame);

  let hot = true;
  const zone = canvas.closest("[data-arena]") ?? canvas;
  const markHot = () => {
    hot = true;
  };
  const markCold = () => {
    hot = false;
  };
  zone.addEventListener("pointerenter", markHot);
  zone.addEventListener("pointerleave", markCold);
  const onDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      keys.clear();
      hot = false;
      return;
    }
    if (!CODE[e.code]) return;
    if (!hot && document.activeElement !== canvas) return;
    e.preventDefault();
    keys.add(e.code);
    keysDownThisFrame.add(e.code);
  };
  const onUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  const probe = {
    getX: () => player.x,
    getY: () => player.y + player.h,
    getRawY: () => player.y,
    getH: () => player.h,
    getVy: () => player.vy,
    getFacing: () => player.facing,
    getSpeed: () => player.vx,
    isGrounded: () => player.grounded,
    isCrouching: () => player.crouching,
    getAttackKind: () => player.attackKind,
    getAttackT: () => player.attackT,
    getCastT: () => player.castT,
    isCharging: () => player.charge === "wind",
    setKeys: (codes: string[]) => {
      injected.clear();
      for (const code of codes) injected.add(code);
    },
    teleport: (x: number, y?: number) => {
      player.x = x;
      if (y !== undefined) player.y = y;
      camX = clamp(player.x - T.viewW / 2, 0, Math.max(0, level.width - T.viewW));
      camY = clamp(player.y + player.h - 180, -160, 115);
    },
    getEnemies: () =>
      enemies.map((e) => ({
        kind: e.kind,
        name: e.name,
        hp: e.hp,
        max: e.max,
        x: e.x,
        y: e.y,
        dead: e.dead,
        boss: e.boss,
      })),
    damageBoss: (dmg?: number) => {
      const b = enemies.find((e) => e.boss);
      if (b) hurtEnemy(b, dmg ?? b.hp, false);
    },
    getHp: () => player.hp,
    getLives: () => player.lives,
    getSpecial: () => player.special,
    setSpecial: (v: number) => { player.special = v; },
    isSpecialActive: () => player.specialT > 0,
    isDead: () => player.dead,
  };
  window.__controlsTest = probe;

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      sound.stopBgm();
      sound.stopBossVoice();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      zone.removeEventListener("pointerenter", markHot);
      zone.removeEventListener("pointerleave", markCold);
      if (window.__controlsTest === probe) delete window.__controlsTest;
    },
    setHeld(action: Action, down: boolean) {
      if (down) {
        pointer.add(action);
        pointerDownThisFrame.add(action);
      } else {
        pointer.delete(action);
      }
    },
    reset() {
      sound.playStageBgm(level.id);
      spawn();
      publish();
    },
    setPaused(p: boolean) {
      paused = p;
      if (!p) {
        last = performance.now();
        acc = 0;
      }
    },
    isPaused() {
      return paused;
    },
  };
}

export type CampaignApi = ReturnType<typeof mountCampaign>;

const SAVE_KEY = "nightfall-campaign";

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") as { unlocked?: number; cleared?: number[] };
    return {
      unlocked: clamp(raw.unlocked || 1, 1, 7),
      cleared: Array.isArray(raw.cleared) ? raw.cleared.filter((n) => n >= 1 && n <= 7) : [],
    };
  } catch {
    return { unlocked: 1, cleared: [] as number[] };
  }
}

export function saveClear(id: number) {
  const prev = loadProgress();
  const cleared = prev.cleared.includes(id) ? prev.cleared : [...prev.cleared, id];
  const unlocked = Math.max(prev.unlocked, Math.min(7, id + 1));
  localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked, cleared }));
  return { unlocked, cleared };
}
