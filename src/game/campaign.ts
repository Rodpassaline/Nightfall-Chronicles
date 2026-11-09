import { GROUND_Y, levels, hordeArenaDef, getGroundYForLevel, type ItemKind, type ItemSpawn, type Kind, type LevelDef, type PropKind } from "./levels";
import { tuning as T } from "./tuning";
import { sound } from "./audio";
import stageLayersManifest from "./stage-layers.json";
import {
  CombatDirector,
  PlayerBehaviorTracker,
  ENEMY_COMBAT_CONFIG,
  resolvePlayerAttackProfile,
  evaluatePoiseImpact,
  evaluateAdaptiveTacticalAction,
  updateEnemyPoiseAndFsmTimers,
  setEnemyFsmState,
  getEnemyHurtbox,
  getPlayerHurtbox,
  resolveCombatBodyCollisions,
  type EnemyFsmState,
  type CombatRole,
  type AttackWindowPhase,
} from "./combat-system";

export type BossCinematicInfo = {
  active: boolean;
  phase: "speaking" | "roar_out";
  stageId: number;
  speaker: string;
  title: string;
  quote: string;
  portrait: string;
  bustIdle?: string;
  bustTalk?: string;
  themeColor?: string;
  timer: number;
  duration: number;
  charCount: number;
};

export const BOSS_METADATA: Record<
  number,
  {
    speaker: string;
    title: string;
    quote: string;
    portrait: string;
    bustIdle: string;
    bustTalk: string;
    themeColor: string;
  }
> = {
  1: {
    speaker: "Petros",
    title: "A Gárgula Colossal · Guardião dos Portões",
    quote: "Nenhum mortal cruzará os portões do Mestre!",
    portrait: "/portraits/boss-1.jpg",
    bustIdle: "/portraits/boss-1.jpg",
    bustTalk: "/portraits/boss-1.jpg",
    themeColor: "#f59e0b",
  },
  2: {
    speaker: "Valerius",
    title: "O Cavaleiro Imortal · Sentinela de Mármore",
    quote: "Sua jornada tola termina sob o fio desta lâmina!",
    portrait: "/portraits/boss-2.jpg",
    bustIdle: "/portraits/boss-2.jpg",
    bustTalk: "/portraits/boss-2.jpg",
    themeColor: "#ef4444",
  },
  3: {
    speaker: "Seraphine",
    title: "Sacerdotisa de Sangue · Claustro Desconsagrado",
    quote: "Seu sangue alimentará este santuário sagrado...",
    portrait: "/portraits/boss-3.jpg",
    bustIdle: "/portraits/boss-3.jpg",
    bustTalk: "/portraits/boss-3.jpg",
    themeColor: "#e11d48",
  },
  4: {
    speaker: "Nocturne",
    title: "O Morcego-Rei · Soberano das Catacumbas",
    quote: "Eu sinto o terror em sua carne nas trevas!",
    portrait: "/portraits/boss-4.jpg",
    bustIdle: "/portraits/boss-4.jpg",
    bustTalk: "/portraits/boss-4.jpg",
    themeColor: "#dc2626",
  },
  5: {
    speaker: "Lorde Veyne",
    title: "Arquivista das Sombras · Biblioteca Proibida",
    quote: "As sombras da biblioteca devorarão sua alma!",
    portrait: "/portraits/boss-5.jpg",
    bustIdle: "/portraits/boss-5.jpg",
    bustTalk: "/portraits/boss-5.jpg",
    themeColor: "#a855f7",
  },
  6: {
    speaker: "Calx",
    title: "A Aberração de Vidro · Alquimia Proibida",
    quote: "ROOOAAAR! O elixir eterno exige sacrifício!",
    portrait: "/portraits/boss-6.jpg",
    bustIdle: "/portraits/boss-6.jpg",
    bustTalk: "/portraits/boss-6.jpg",
    themeColor: "#22c55e",
  },
  7: {
    speaker: "Conde Drácula",
    title: "O Senhor Supremo das Trevas",
    quote: "O que é um homem senão uma miserável pilha de segredos?! Mas chega de conversa... Venha a mim!",
    portrait: "/portraits/boss-7.jpg",
    bustIdle: "/portraits/boss-7.jpg",
    bustTalk: "/portraits/boss-7.jpg",
    themeColor: "#ffd700",
  },
};

export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "campaign" | "horde";

export interface DifficultyProfile {
  name: string;
  tagline: string;
  enemyHpMult: number;
  enemyDamageMult: number;
  enemyCooldownMult: number;
  specialGaugeMult: number;
  hordeBudgetMult: number;
  stageEnemyCountMult: number;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: {
    name: "Caçador Iniciante",
    tagline: "HP 1.0x, dano recebido 0.85x, recarga inimiga +35%, especial +25%",
    enemyHpMult: 1.0,
    enemyDamageMult: 0.85,
    enemyCooldownMult: 1.35,
    specialGaugeMult: 1.25,
    hordeBudgetMult: 0.8,
    stageEnemyCountMult: 1.0,
  },
  normal: {
    name: "Sangue Frio",
    tagline: "HP 1.55x, dano recebido 1.3x, +35% inimigos por fase, combate tático",
    enemyHpMult: 1.55,
    enemyDamageMult: 1.3,
    enemyCooldownMult: 1.0,
    specialGaugeMult: 1.0,
    hordeBudgetMult: 1.0,
    stageEnemyCountMult: 1.35,
  },
  hard: {
    name: "Pesadelo Noturno",
    tagline: "HP 2.2x, dano recebido 1.75x, +65% inimigos por fase, desafio implacável",
    enemyHpMult: 2.2,
    enemyDamageMult: 1.75,
    enemyCooldownMult: 0.75,
    specialGaugeMult: 0.85,
    hordeBudgetMult: 1.25,
    stageEnemyCountMult: 1.65,
  },
};

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
  bossPoise?: number;
  bossMaxPoise?: number;
  bossStaggered?: boolean;
  toast: string;
  won: boolean;
  dead: boolean;
  title: string;
  dashReady: boolean;
  charge: number;
  sealsSolved?: number;
  sealsTotal?: number;
  bossCinematic?: BossCinematicInfo | null;
  // Horde & Difficulty fields
  gameMode?: GameMode;
  difficulty?: Difficulty;
  hordeWave?: number;
  hordeRemaining?: number;
  hordeTotalInWave?: number;
  hordeKills?: number;
  hordeBestWave?: number;
  hordeUpgradeAvailable?: boolean;
  hordeUpgradeWave?: number;
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
  hurtFlash?: number;
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
  comboHits?: number;
  superArmor?: number;
  guardsSpawnedPhase2?: boolean;
  guardsSpawnedPhase2Hard?: boolean;
  phase2ShockwaveCd?: number;
  phase2DashCd?: number;
  poise?: number;
  maxPoise?: number;
  staggered?: boolean;
  recoilT?: number;
  recoilVx?: number;
  postAttackT?: number;
  // Etapa 2: FSM, CombatDirector, Attack Window & Poise fields
  fsmState?: EnemyFsmState;
  combatRole?: CombatRole;
  slotOffsetX?: number;
  attackPhase?: AttackWindowPhase;
  phaseTimer?: number;
  activeTimer?: number;
  impactShakeT?: number;
  hitPlayerThisAttack?: boolean;
  poiseRegenTimer?: number;
  antiStunTimer?: number;
  consecutiveStuns?: number;
  blockCooldown?: number;
  dodgeCooldown?: number;
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
  charged?: boolean;
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
  sealGate: "/sprites/seal-gate.png",
  sealGateArch: "/sprites/seal-gate-arch.png",
  sealGateGrate: "/sprites/seal-gate-grate.png",
  sealCrystal: "/sprites/seal-crystal.png",
  sealCrystalOpen: "/sprites/seal-crystal-open.png",
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
  chamberArch: "/art/props/chamber-arch.png",
  gothicStairsUp: "/art/props/gothic-stairs-up.png",
  gothicStairsDown: "/art/props/gothic-stairs-down.png",
  stonePlatform: "/art/props/stone-platform.png",
  stainedGlassWindow: "/art/props/stained-glass.png",
  gargoyleStatue: "/art/props/gargoyle-statue.png",
  chandelier: "/art/props/chandelier.png",
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
  chamberArch: 165,
  gothicStairsUp: 120,
  gothicStairsDown: 120,
  stonePlatform: 26,
  stainedGlassWindow: 145,
  gargoyleStatue: 85,
  chandelier: 95,
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
  options?: {
    gameMode?: GameMode;
    difficulty?: Difficulty;
  },
) {
  const gameMode: GameMode = options?.gameMode ?? "campaign";
  const difficulty: Difficulty = options?.difficulty ?? "normal";
  const diffProfile = DIFFICULTY_PROFILES[difficulty] ?? DIFFICULTY_PROFILES.normal;

  let level = (gameMode === "horde" ? hordeArenaDef : (levels.find((item) => item.id === levelId) ?? levels[0]));
  let stageW = level.width;
  const ctx =
    canvas.getContext("2d", { alpha: false }) ||
    canvas.getContext("2d");
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
  const stageThemeId = gameMode === "horde" ? 1 : level.id;
  const stageCfg = (stageLayersManifest as Record<string, { mid?: boolean; fg?: boolean }>)[String(stageThemeId)] || {};
  const plateSrc: Record<string, string> = {
    sky: "/art/parallax/sky.jpg",
    far: "/art/parallax/far.jpg",
    back: `/art/stages/s${stageThemeId}/back.jpg`,
    floor: `/art/stages/s${stageThemeId}/floor.jpg`,
    fog: "/art/parallax/fog.png",
  };
  if (stageCfg.mid) {
    plateSrc.mid = `/art/stages/s${stageThemeId}/mid.png`;
  }
  if (stageCfg.fg) {
    plateSrc.fg = `/art/stages/s${stageThemeId}/fg.png`;
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
  type DamageNumber = {
    id: number;
    text: string;
    x: number;
    y: number;
    vy: number;
    life: number;
    maxLife: number;
    isCrit: boolean;
    color: string;
  };
  const damageNumbers: DamageNumber[] = [];

  function pushDamageNumber(params: {
    text: string;
    x: number;
    y: number;
    vy: number;
    life: number;
    maxLife?: number;
    isCrit: boolean;
    color: string;
  }) {
    // ETAPA 3: Reduz o tempo de duração dos textos flutuantes em 30% (duram 70% do tempo)
    const life = params.life * 0.70;
    const maxLife = (params.maxLife ?? params.life) * 0.70;

    // ETAPA 3: Offset vertical inteligente para despoluir textos ("-21", "CONTRA", "EXECUÇÃO")
    // Se já houver um texto criado nos últimos 0.25s próximo na mesma posição (raio de 44px no X e 16px no Y),
    // posiciona o novo texto 18 pixels mais alto no eixo Y para nunca encavalar
    let spawnY = params.y;
    for (let attempts = 0; attempts < 5; attempts++) {
      const hasRecentOverlap = damageNumbers.some((existing) => {
        const timeSinceCreated = existing.maxLife - existing.life;
        const isRecent = timeSinceCreated < 0.25;
        const dx = Math.abs(existing.x - params.x);
        const dy = Math.abs(existing.y - spawnY);
        return isRecent && dx < 44 && dy < 16;
      });
      if (hasRecentOverlap) {
        spawnY -= 18;
      } else {
        break;
      }
    }

    damageNumbers.push({
      id: nextId++,
      text: params.text,
      x: params.x,
      y: spawnY,
      vy: params.vy,
      life,
      maxLife,
      isCrit: params.isCrit,
      color: params.color,
    });
  }

  type Afterimage = {
    sheet: ArtKey;
    frame: number;
    x: number;
    feet: number;
    facing: 1 | -1;
    life: number;
    maxLife: number;
    cols: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    offsetY?: number;
  };
  const afterimages: Afterimage[] = [];
  let dashAfterimageTimer = 0;
  let enemies: Enemy[] = [];
  let items: ActiveItem[] = [];
  const combatDirector = new CombatDirector();
  const playerTracker = new PlayerBehaviorTracker();
  let clearedOnce = false;
  let bossIntroPlayed = false;
  let bossEnragedAnnounced = false;
  let ambushTimer = 4.0;

  // Chamber Transitions & Gothic Typography Banner
  let currentChamberId = -1;
  let chamberTransitionTimer = 0;
  let chamberCooldownTimer = 0;
  let chamberNameBanner = "";
  let chamberNameTimer = 0;

  // Horde Mode State & Progression
  let hordeWave = 1;
  let hordeQueue: Kind[] = [];
  let hordeTotalInWave = 0;
  let hordeKills = 0;
  let hordeSpawnTimer = 0.5;
  let hordeWaveClearing = false;
  let hordeBetweenWavesTimer = 0;
  let hordeUpgradeAvailable = false;
  let hordeUpgradeWave = 0;
  let hordeBestWave = 0;
  let bladeDmgMultiplier = 1.0;
  let spellCdMultiplier = 1.0;
  let currentHordeStageId = 1;

  try {
    const rawBest = typeof window !== "undefined" ? localStorage.getItem("nightfall_horde_best") : null;
    hordeBestWave = rawBest ? parseInt(rawBest, 10) || 0 : 0;
  } catch {
    hordeBestWave = 0;
  }

  function getActiveSolids() {
    return level.solids;
  }

  function getActiveProps() {
    return level.props;
  }

  async function switchHordeStageTheme(targetStage: number) {
    currentHordeStageId = targetStage;
    const nextLevel = levels.find((item) => item.id === targetStage) ?? levels[0];
    if (gameMode === "horde") {
      level = hordeArenaDef;
      stageW = level.width;
    } else {
      level = nextLevel;
      stageW = level.width;
    }

    bg = await preloadImage(nextLevel.bg);
    plates.back = await preloadImage(`/art/stages/s${targetStage}/back.jpg`);
    plates.floor = await preloadImage(`/art/stages/s${targetStage}/floor.jpg`);

    const stageCfg = (stageLayersManifest as Record<string, { mid?: boolean; fg?: boolean }>)[String(targetStage)] || {};
    if (stageCfg.mid) {
      plates.mid = await preloadImage(`/art/stages/s${targetStage}/mid.png`);
    } else {
      delete plates.mid;
    }
    if (stageCfg.fg) {
      plates.fg = await preloadImage(`/art/stages/s${targetStage}/fg.png`);
    } else {
      delete plates.fg;
    }

    player.x = clamp(player.x, 60, stageW - 60);
    player.y = findFloorFor(player.x, player.y + player.h) - player.h;

    sound.playStageBgm(targetStage);
  }

  function buildHordeWaveQueue(wave: number): Kind[] {
    const baseCount = 5 + (wave - 1) * 3;
    const count = Math.max(4, Math.round(baseCount * diffProfile.hordeBudgetMult));
    const queue: Kind[] = [];

    for (let i = 0; i < count; i++) {
      if (wave === 1) {
        queue.push(Math.random() < 0.65 ? "zombie" : "skeleton");
      } else if (wave === 2) {
        const r = Math.random();
        queue.push(r < 0.4 ? "zombie" : r < 0.75 ? "skeleton" : "bat");
      } else if (wave === 3) {
        const r = Math.random();
        queue.push(r < 0.35 ? "skeleton" : r < 0.65 ? "armoredSkeleton" : r < 0.85 ? "zombie" : "bat");
      } else if (wave === 4) {
        const r = Math.random();
        queue.push(r < 0.3 ? "armoredSkeleton" : r < 0.6 ? "redSkeleton" : r < 0.8 ? "skeleton" : "bat");
      } else if (wave % 5 === 0) {
        if (i === 0) {
          queue.push("knight");
        } else if (i === 1) {
          queue.push("gargoyle");
        } else if (i === 2 && wave >= 10) {
          queue.push("vampire");
        } else {
          const pool: Kind[] = ["armoredSkeleton", "redSkeleton", "gargoyle", "knight", "bat"];
          queue.push(pool[Math.floor(Math.random() * pool.length)]);
        }
      } else {
        const pool: Kind[] = [
          "zombie",
          "skeleton",
          "armoredSkeleton",
          "redSkeleton",
          "bat",
          "gargoyle",
          "knight",
          "vampire",
        ];
        queue.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    return queue;
  }

  function spawnHordeEnemy(kind: Kind) {
    const fromLeft = Math.random() < 0.5;
    // Spawn from the Gothic Arch Portals on the elevated landings
    let sx = fromLeft ? 100 + Math.random() * 40 : 2460 - Math.random() * 40;

    // Avoid spawning directly on top of Aldric if he is on that landing
    if (Math.abs(player.x - sx) < 80) {
      sx = fromLeft ? 2460 - Math.random() * 40 : 100 + Math.random() * 40;
    }

    const groundFloor = getGroundY(sx);
    let sy = groundFloor;

    if (kind === "bat") {
      sy = groundFloor - 55 - Math.random() * 30;
    }

    const baseHpMap: Record<string, number> = {
      bat: 2,
      zombie: 4,
      skeleton: 5,
      redSkeleton: 6,
      gargoyle: 7,
      knight: 8,
      armoredSkeleton: 8,
      vampire: 9,
    };
    const baseHp = baseHpMap[kind] || 5;
    const waveFactor = 1 + (hordeWave - 1) * 0.03;
    const finalHp = Math.max(1, Math.round(baseHp * waveFactor * diffProfile.enemyHpMult));

    const e = makeEnemy({ kind, x: sx, y: sy, hp: finalHp }, false);
    e.facing = sx < (player.x + player.w / 2) ? 1 : -1;
    e.state = "idle";
    e.cd = 0;
    e.alertSoundPlayed = true;

    if (kind === "bat") {
      e.vx = e.facing * 110;
    } else if (kind === "armoredSkeleton") {
      e.state = "shield";
      e.vx = e.facing * 52;
    } else if (kind === "redSkeleton") {
      e.vx = e.facing * 68;
    } else if (kind === "knight") {
      e.vx = e.facing * 55;
    } else if (kind === "zombie") {
      e.vx = e.facing * 50;
    } else if (kind === "vampire") {
      e.vx = e.facing * 92;
    } else if (kind === "gargoyle") {
      e.vx = e.facing * 68;
    } else {
      e.vx = e.facing * 52;
    }

    enemies.push(e);
    sound.playEnemyAlert(kind);
  }

  function startHordeWave(wave: number) {
    hordeWave = wave;
    hordeQueue = buildHordeWaveQueue(wave);
    hordeTotalInWave = hordeQueue.length;
    hordeSpawnTimer = 0.4;
    hordeWaveClearing = false;
    hordeBetweenWavesTimer = 0;
    hordeUpgradeAvailable = false;

    const targetStage = ((Math.floor((wave - 1) / 3)) % 7) + 1;
    if (currentHordeStageId !== targetStage) {
      currentHordeStageId = targetStage;
      void switchHordeStageTheme(targetStage);
    }

    player.toast = `Onda ${wave} — Sobreviva à Horda Noturna!`;
    player.toastT = 2.4;
  }

  type BossCinematic = {
    active: boolean;
    phase: "idle" | "speaking" | "roar_out" | "done";
    stageId: number;
    speaker: string;
    title: string;
    quote: string;
    portrait: string;
    bustIdle: string;
    bustTalk: string;
    themeColor: string;
    timer: number;
    duration: number;
    charCount: number;
    letterboxProgress: number;
    targetCamX: number;
    targetCamY: number;
    bossObj: Enemy | null;
  };

  let bossCinematic: BossCinematic = {
    active: false,
    phase: "idle",
    stageId: level.id,
    speaker: "",
    title: "",
    quote: "",
    portrait: "",
    bustIdle: "",
    bustTalk: "",
    themeColor: "#ffd700",
    timer: 0,
    duration: 5.0,
    charCount: 0,
    letterboxProgress: 0,
    targetCamX: 0,
    targetCamY: 0,
    bossObj: null,
  };

  function startBossCinematic(boss: Enemy) {
    keys.clear();
    pointer.clear();
    injected.clear();
    keysDownThisFrame.clear();
    pointerDownThisFrame.clear();

    const meta = BOSS_METADATA[level.id] || {
      speaker: boss.name.split(",")[0],
      title: boss.name,
      quote: "Sua jornada termina aqui nas trevas!",
      portrait: `/portraits/boss-${level.id}.jpg`,
      bustIdle: `/portraits/boss-${level.id}.jpg`,
      bustTalk: `/portraits/boss-${level.id}.jpg`,
      themeColor: "#ffd700",
    };

    const dur = sound.getBossVoiceDuration(level.id);

    bossCinematic = {
      active: true,
      phase: "speaking",
      stageId: level.id,
      speaker: meta.speaker,
      title: meta.title,
      quote: meta.quote,
      portrait: meta.portrait,
      bustIdle: meta.bustIdle,
      bustTalk: meta.bustTalk,
      themeColor: meta.themeColor,
      timer: 0,
      duration: dur,
      charCount: 0,
      letterboxProgress: 0,
      targetCamX: clamp((player.x + boss.x) / 2 - T.viewW / 2, 0, Math.max(0, level.width - T.viewW)),
      targetCamY: clamp((player.y + boss.y) / 2 - 170, -160, 115),
      bossObj: boss,
    };

    // Freeze player in battle-ready stance facing boss
    player.vx = 0;
    player.attackT = 0;
    player.attackLock = 0;
    player.attackPhase = "NONE";
    player.attackTimer = 0;
    player.lungeApplied = false;
    player.nextAttackBuffered = false;
    player.attackHitboxActive = false;
    player.attackHitEnemies.clear();
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
    player.comboStep = 1;
    player.combo = 0;
    player.comboResetTimer = 0;
    player.isHeavyExecution = false;
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
    player.castT = 0;
    player.specialT = 0;
    player.dashT = 0;
    player.facing = boss.x > player.x ? 1 : -1;

    // Freeze boss facing player
    boss.vx = 0;
    boss.vy = 0;
    boss.hurt = 0;
    boss.wind = 0;
    boss.cd = Math.max(boss.cd, dur + 1.5);
    boss.state = "idle";
    boss.facing = player.x > boss.x ? 1 : -1;

    // Clear any active enemy projectiles so no unfair damage occurs
    for (const sh of shots) {
      if (!sh.friendly) sh.life = 0;
    }

    // Play voiced speech with ducked background music
    sound.playBossVoice(level.id, () => {
      if (bossCinematic.active && bossCinematic.phase === "speaking") {
        advanceBossCinematicToRoar();
      }
    });
  }

  function advanceBossCinematicToRoar() {
    if (!bossCinematic.active) return;
    bossCinematic.phase = "roar_out";
    bossCinematic.timer = 0;
    sound.playSfx("thunder");
    sound.playSfx("bossHurt");
    shake = 18;

    const b = bossCinematic.bossObj;
    if (b) {
      b.state = "idle";
      b.cd = 0.85;

      // Roar burst particles
      for (let i = 0; i < 30; i++) {
        const ang = (i / 30) * Math.PI * 2;
        const spd = 45 + Math.random() * 95;
        particles.push({
          x: b.x + b.w / 2,
          y: b.y + b.h / 2,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 30,
          size: 3 + Math.random() * 3,
          alpha: 1,
          maxAlpha: 1,
          color: level.id === 6 ? "#4ade80" : level.id === 5 ? "#a855f7" : level.id === 7 ? "#ffd700" : "#ff1744",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function skipBossCinematic() {
    if (!bossCinematic.active || bossCinematic.phase !== "speaking") return;
    if (bossCinematic.timer < 0.8) return;
    sound.stopBossVoice();
    advanceBossCinematicToRoar();
  }

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
    // ETAPA 1: Trava Absoluta de Estado e Timer Único Sequencial
    attackPhase: "NONE" as "NONE" | "STARTUP" | "ACTIVE" | "RECOVERY",
    attackTimer: 0,
    lungeApplied: false,
    attackHitboxActive: false,
    attackHitEnemies: new Set<number>(),
    // ETAPA 2 & 3 (Grimvalor combat feel): Timings e física coreografada
    nextAttackBuffered: false,
    attackStartupDur: 0.07,
    attackActiveDur: 0.09,
    attackRecoveryDur: 0.16,
    slamImpactTriggered: false,
    slamImpactTimer: 0,
    comboStep: 1 as 1 | 2 | 3,
    comboResetTimer: 0,
    isHeavyExecution: false,
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
    rgb?: [number, number, number];
    depth?: "mid" | "fg";
    pulse?: number;
    isAmbient?: boolean;
    gravity?: number;
    life?: number;
    maxLife?: number;
    rot?: number;
    rotSpd?: number;
    bounces?: number;
  };

  const particles: AmbientParticle[] = [];
  function initParticles() {
    particles.length = 0;
    const stageWidth = stageW || level.width || 4800;

    // Partículas de ambiente super discretas (1.5px a 2.8px, alpha 0.15 a 0.32, micro-poeira e fagulhas)
    const ambientCount = 32;
    for (let i = 0; i < ambientCount; i++) {
      const isFg = i % 3 === 0;
      const isEmber = i % 4 === 0;
      const color = isEmber ? "rgba(245, 158, 11, 0.30)" : "rgba(180, 195, 225, 0.22)";
      const vx = (Math.random() - 0.5) * 6; // lenta deriva horizontal
      const vy = -1.5 - Math.random() * 3.5; // suave ascensão

      particles.push({
        x: Math.random() * stageWidth,
        y: Math.random() * 280,
        vx,
        vy,
        size: isFg ? 2.2 + Math.random() * 0.6 : 1.5 + Math.random() * 0.7,
        alpha: 0.18 + Math.random() * 0.14,
        maxAlpha: 0.32,
        color,
        depth: isFg ? "fg" : "mid",
        pulse: Math.random() * Math.PI * 2,
        isAmbient: true,
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

  function getGroundY(x: number): number {
    return getGroundYForLevel(level, x);
  }

  function findFloorFor(x: number, fallbackY: number): number {
    let best = getGroundY(x);
    let bestDist = Math.abs(best - fallbackY);
    for (const s of getActiveSolids()) {
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

    // Balanced enemy & boss HP with difficulty profile scaling (+120% base HP for all Bosses)
    const stageFactor = 1 + (level.id - 1) * 0.04;
    const scaledHp = isBoss
      ? Math.max(1, Math.round(spawn.hp * (1.55 + (level.id - 1) * 0.08) * 2.2 * diffProfile.enemyHpMult))
      : spawn.kind === "bat"
        ? Math.max(1, Math.round(2 * diffProfile.enemyHpMult))
        : Math.max(1, Math.round(spawn.hp * stageFactor * diffProfile.enemyHpMult));

    const combatCfg = ENEMY_COMBAT_CONFIG[spawn.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
    const basePoise = isBoss
      ? Math.round(combatCfg.maxPoise * (difficulty === "easy" ? 0.85 : difficulty === "hard" ? 1.25 : 1.0))
      : combatCfg.maxPoise;

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
      hurtFlash: 0,
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
      comboHits: 0,
      superArmor: 0,
      guardsSpawnedPhase2: false,
      guardsSpawnedPhase2Hard: false,
      phase2ShockwaveCd: 3.0,
      phase2DashCd: 4.0,
      poise: basePoise,
      maxPoise: basePoise,
      staggered: false,
      recoilT: 0,
      recoilVx: 0,
      postAttackT: 0,
      fsmState: "IDLE",
      combatRole: "PRIMARY_ATTACKER",
      slotOffsetX: 0,
      attackPhase: "NONE",
      phaseTimer: 0,
      hitPlayerThisAttack: false,
      poiseRegenTimer: 0,
      antiStunTimer: 0,
      consecutiveStuns: 0,
      blockCooldown: 0,
      dodgeCooldown: 0,
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
    if (gameMode === "horde") return;

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

  function spawnBossGuards(boss: Enemy) {
    const arenaMinX = Math.max(80, level.width - 620);
    const arenaMaxX = Math.min(level.width - 60, level.width - 40);

    const guardKind: Kind =
      level.id === 1 ? "skeleton" :
      level.id === 2 ? "armoredSkeleton" :
      level.id === 3 ? "redSkeleton" :
      level.id === 4 ? "bat" :
      level.id === 5 ? "redSkeleton" :
      level.id === 6 ? "zombie" : "vampire";

    const baseHp = guardKind === "bat" ? 2 : 6;
    const g1 = makeEnemy({ kind: guardKind, x: arenaMinX + 30, y: GROUND_Y, hp: baseHp }, true);
    const g2 = makeEnemy({ kind: guardKind, x: arenaMaxX - 30, y: GROUND_Y, hp: baseHp }, true);
    g1.alertSoundPlayed = true;
    g2.alertSoundPlayed = true;
    enemies.push(g1, g2);
    sound.playEnemyAlert(guardKind);
    shake = Math.max(shake, 6);
  }

  // ===========================================================================
  // DEDICATED ATTACK INPUT CLASSIFIER ROUTINE (HOLD vs. MULTI-PRESS / TAP)
  // Accurately distinguishes whether the player is:
  // 1. Holding the Attack button ("HOLD_CHARGING"): Channels arcane energy in a
  //    steady blade stance (heroAttack frame 0) and unleashes Charged Magic
  //    without ever releasing early or swinging the sword mid-charge.
  // 2. Tapping or pressing multiple times ("TAP" / "MULTI_PRESS"): Executes
  //    responsive 3-hit sword combos without false magic charges.
  // ===========================================================================
  const attackRoutine = {
    wasPhysicallyHeld: false,
    holdDuration: 0,
    releaseGraceT: 0,
    timeSinceLastPress: 99,
    timeSinceLastRelease: 99,
    rapidPressCount: 0,
    multiPressComboWindow: 0,
    lockedUntilRelease: false,
    pendingTapSlash: false,
  };

  function spawn() {
    if (gameMode === "horde") {
      level = hordeArenaDef;
      stageW = level.width;
      player.x = 1300;
      player.y = getGroundY(1300) - STAND_H;
      camX = clamp(player.x - T.viewW / 2, 0, Math.max(0, stageW - T.viewW));
      camY = clamp(player.y + player.h - 180, -180, 140);
    } else {
      player.x = 60;
      player.y = getGroundY(60) - STAND_H;
      camX = 0;
      camY = clamp(player.y + player.h - 180, -180, 140);
    }
    player.h = STAND_H;
    player.vx = 0;
    player.vy = 0;
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
    player.attackPhase = "NONE";
    player.attackTimer = 0;
    player.lungeApplied = false;
    player.nextAttackBuffered = false;
    player.attackHitboxActive = false;
    player.attackHitEnemies.clear();
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
    player.comboStep = 1;
    player.combo = 0;
    player.comboResetTimer = 0;
    player.isHeavyExecution = false;
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
    player.castT = 0;
    player.castFired = false;
    player.dashT = 0;
    player.charge = "idle";
    player.holdT = 0;
    attackRoutine.wasPhysicallyHeld = false;
    attackRoutine.holdDuration = 0;
    attackRoutine.releaseGraceT = 0;
    attackRoutine.timeSinceLastPress = 99;
    attackRoutine.timeSinceLastRelease = 99;
    attackRoutine.rapidPressCount = 0;
    attackRoutine.multiPressComboWindow = 0;
    attackRoutine.lockedUntilRelease = false;
    attackRoutine.pendingTapSlash = false;
    player.toast = `${level.title}. Quebre os Cristais de Selo no alto para abrir os Portões!`;
    player.toastT = 3.2;
    clearedOnce = false;
    bossIntroPlayed = false;
    bossEnragedAnnounced = false;
    currentChamberId = -1;
    chamberTransitionTimer = 0;
    chamberCooldownTimer = 0;
    chamberNameBanner = "";
    chamberNameTimer = 0;
    bossCinematic = {
      active: false,
      phase: "idle",
      stageId: level.id,
      speaker: "",
      title: "",
      quote: "",
      portrait: "",
      bustIdle: "",
      bustTalk: "",
      themeColor: "#ffd700",
      timer: 0,
      duration: 5.0,
      charCount: 0,
      letterboxProgress: 0,
      targetCamX: 0,
      targetCamY: 0,
      bossObj: null,
    };
    ambushTimer = 24.0;
    sound.stopBossVoice();
    shots.length = 0;
    specialSlashes.length = 0;
    damageNumbers.length = 0;
    afterimages.length = 0;
    dashAfterimageTimer = 0;
    playerTracker.reset();

    if (gameMode === "horde") {
      player.toast = "Sobreviva à Horda Noturna!";
      player.toastT = 3.0;
      enemies = [];
      items = [];
      initParticles();
      currentHordeStageId = 1;
      void switchHordeStageTheme(1);
      startHordeWave(1);
    } else {
      const baseSpawns = level.spawns.filter((s) => !s.boss);
      const mult = diffProfile.stageEnemyCountMult ?? 1.0;
      const extraCount = Math.round(baseSpawns.length * Math.max(0, mult - 1.0));
      const combinedSpawns = [...level.spawns];

      if (extraCount > 0 && baseSpawns.length > 0) {
        for (let i = 0; i < extraCount; i++) {
          const sample = baseSpawns[i % baseSpawns.length];
          const dir = i % 2 === 0 ? 1 : -1;
          const offset = dir * (70 + (i * 29) % 75);
          const newX = clamp(sample.x + offset, 140, level.width - 680);
          combinedSpawns.push({
            ...sample,
            x: newX,
          });
        }
      }

      enemies = combinedSpawns.map((s) => makeEnemy(s));
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
    const wasGrounded = body.grounded;
    body.grounded = false;
    body.x += body.vx * dt;

    if (body.x < 10) {
      body.x = 10;
      body.wall = -1;
      body.vx = 0;
    } else if (body.x + body.w > stageW - 10) {
      body.x = stageW - 10 - body.w;
      body.wall = 1;
      body.vx = 0;
    }

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

    // Smooth slope/stairs tracking when already grounded on terrain
    const curGroundY = getGroundY(body.x + body.w / 2);
    const feetY = body.y + body.h;

    if (wasGrounded && Math.abs(feetY - curGroundY) <= 24) {
      body.y = curGroundY - body.h;
      body.vy = 0;
      body.grounded = true;
    }

    // Vertical displacement
    const prevBottom = body.y + body.h;
    body.y += body.vy * dt;

    // One-way jump-through platforms
    for (const s of getActiveSolids()) {
      if (!s.oneWay || !overlap(body, s)) continue;
      if (drop || body.vy < 0 || prevBottom > s.y + 12) continue;
      body.y = s.y - body.h;
      body.vy = 0;
      body.grounded = true;
    }

    // Landing on continuous terrain ground (slopes, stairs, upper hall, crypt, flat)
    const newGroundY = getGroundY(body.x + body.w / 2);
    if (body.vy >= 0 && body.y + body.h >= newGroundY) {
      body.y = newGroundY - body.h;
      body.vy = 0;
      body.grounded = true;
    }

    // Ground resting check on one-way platforms
    if (!body.grounded && body.vy >= 0) {
      for (const s of getActiveSolids()) {
        if (s.oneWay && body.x + body.w > s.x && body.x < s.x + s.w) {
          if (Math.abs(body.y + body.h - s.y) <= 3) {
            body.y = s.y - body.h;
            body.vy = 0;
            body.grounded = true;
            break;
          }
        }
      }
    }
  }

  function hurtPlayer(
    dmg: number,
    fromX: number,
    hitSource: "slash" | "spell" = "slash",
    isHeavyAttack = false,
  ) {
    if (player.iframes > 0 || player.dead || player.won) return;
    if (player.guard && (fromX - (player.x + player.w / 2)) * player.facing > -6) {
      const isPerfectParry = player.guardT <= 0.26;

      // Condição 3: Ataques pesados quebram a guarda PASSIVA, mas o Perfect Parry (guardT <= 0.26) continua funcionando integralmente!
      if (!isPerfectParry && isHeavyAttack) {
        player.guard = false;
        player.guardT = 0;
        player.controlLock = Math.max(player.controlLock, 0.34);
        player.iframes = Math.max(player.iframes, 0.45);
        player.hurtT = 0.14;
        player.vx = -player.facing * 165;
        player.vy = -85;
        hitstop = T.hitstopHeavy;
        shake = Math.max(shake, 6.5);
        sound.playSfx("slashHeavy");
        sound.playSfx("hurt");
        if (player.hp > 1) {
          player.hp -= 1;
        }
        player.toast = "💥 GUARDA PASSIVA QUEBRADA! Use APARAR PERFEITO no instante do golpe pesado!";
        player.toastT = 2.4;
        pushDamageNumber({
          text: "QUEBRA DE GUARDA! -1",
          x: player.x + player.w / 2,
          y: player.y - 8,
          vy: -42,
          life: 0.546,
          maxLife: 0.546,
          isCrit: true,
          color: "#f97316",
        });
        for (let i = 0; i < 14; i++) {
          particles.push({
            x: player.x + player.w / 2 + player.facing * 12,
            y: player.y + player.h / 2,
            vx: (Math.random() - 0.5) * 130,
            vy: (Math.random() - 0.5) * 100 - 20,
            size: 2.5,
            alpha: 1,
            maxAlpha: 1,
            color: i % 2 === 0 ? "#f97316" : "#ef4444",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
        return;
      }

      player.iframes = Math.max(player.iframes, isPerfectParry ? 0.38 : 0.22);
      player.vx = -player.facing * (isPerfectParry ? 85 : 125);
      player.guardFlash = isPerfectParry ? 0.30 : 0.18;
      hitstop = isPerfectParry ? T.hitstopHeavy : T.hitstopLight;
      shake = Math.max(shake, isPerfectParry ? 6 : 2.5);
      sound.playSfx(isPerfectParry ? "relic" : "slash");

      if (isPerfectParry) {
        player.mana = Math.min(T.maxMana, player.mana + 15);
        player.special = Math.min(100, player.special + 12);
        player.toast = "🛡️ APARAR PERFEITO! +15 Mana · Contra-ataque liberado!";
        player.toastT = 2.2;
        pushDamageNumber({
          text: "APARAR PERFEITO!",
          x: player.x + player.w / 2,
          y: player.y - 6,
          vy: -42,
          life: 0.525,
          maxLife: 0.525,
          isCrit: true,
          color: "#38bdf8",
        });
      }

      // Push back nearby attackers so they don't stay glued to Aldric after a block/parry
      for (const e of enemies) {
        if (e.dead || e.dying) continue;
        const eMid = e.x + e.w / 2;
        const pMid = player.x + player.w / 2;
        if (Math.abs(eMid - pMid) < 92 && (eMid - pMid) * player.facing >= -12) {
          const pushDir = eMid >= pMid ? 1 : -1;
          e.recoilT = isPerfectParry ? 0.42 : 0.25;
          e.recoilVx = pushDir * (isPerfectParry ? 155 : 95);
          e.vx = e.recoilVx;
          if (isPerfectParry) {
            e.wind = 0;
            e.activeTimer = 0;
            if (!e.boss) {
              e.hurt = 0.55;
              e.cd = Math.max(e.cd, 0.75);
              setEnemyFsmState(e, "GUARD_BROKEN", 0.55, true);
              e.staggered = true;
            } else {
              e.poise = Math.max(0, (e.poise ?? 14) - 6.0);
              e.cd = Math.max(e.cd, 0.50);
              if (e.poise <= 0) {
                const staggerDur = difficulty === "easy" ? 1.15 : difficulty === "hard" ? 0.75 : 0.95;
                e.staggered = true;
                e.poise = e.maxPoise ?? 14;
                e.hurt = staggerDur;
                e.state = "idle";
                setEnemyFsmState(e, "GUARD_BROKEN", staggerDur, true);
              }
            }
          }
        }
      }

      for (let i = 0; i < (isPerfectParry ? 18 : 8); i++) {
        particles.push({
          x: player.x + player.w / 2 + player.facing * 12,
          y: player.y + player.h / 2,
          vx: (Math.random() - 0.5) * 110,
          vy: (Math.random() - 0.5) * 90 - 15,
          size: isPerfectParry ? 2.8 : 2,
          alpha: 1,
          maxAlpha: 1,
          color: isPerfectParry ? (i % 2 === 0 ? "#fde047" : "#38bdf8") : "#cbd5e1",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
      return;
    }
    const effectiveDmg = Math.max(1, Math.round(dmg * diffProfile.enemyDamageMult));
    const isFatal = player.hp <= effectiveDmg;
    player.hp -= effectiveDmg;
    player.iframes = T.hurtIFrames;
    player.hurtT = 0.16;
    player.charge = "idle";
    player.holdT = 0;
    player.attackT = 0;
    player.attackLock = 0;
    player.attackPhase = "NONE";
    player.attackTimer = 0;
    player.lungeApplied = false;
    player.nextAttackBuffered = false;
    player.attackHitboxActive = false;
    player.attackHitEnemies.clear();
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
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
      sound.playSfx("playerDie");
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
        player.dead = true;
        if (gameMode === "horde") {
          try {
            const prevBest = parseInt(localStorage.getItem("nightfall_horde_best") || "0", 10) || 0;
            if (hordeWave > prevBest) {
              localStorage.setItem("nightfall_horde_best", String(hordeWave));
              hordeBestWave = hordeWave;
            }
          } catch {
            // ignore
          }
          player.toast = `Luar Ceifou Aldric! Onda alcançada: ${hordeWave}.`;
        } else {
          player.toast = "Aldric sucumbiu às sombras da noite...";
        }
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

    const knockDir = (e.x + e.w / 2) >= (player.x + player.w / 2) ? 1 : -1;
    const isCharged = dmg >= T.chargeDamage;
    const isSpecial = player.specialT > 0;
    const isGuardBreakMove = pogo || isCharged || isSpecial || player.combo === 2;

    // Classe 1 (Guerreiro Esqueleto — skeleton / redSkeleton) reactive blade parry when in DEFEND ("shield") state
    if ((e.kind === "skeleton" || e.kind === "redSkeleton") && e.state === "shield" && !isGuardBreakMove) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 75;
        e.recoilT = 0.16;
        e.recoilVx = knockDir * 62;
        e.vx = e.recoilVx;
        e.poise = Math.max(1, (e.poise ?? 8) - 2.5);
        e.comboHits = (e.comboHits ?? 0) + 1;
        e.blockCooldown = 1.65;
        pushDamageNumber({
          text: e.comboHits >= 2 ? "CONTRA-ATAQUE!" : "BLOQUEIO!",
          x: e.x + e.w / 2,
          y: e.y - 6,
          vy: -34,
          life: 0.385,
          maxLife: 0.385,
          isCrit: e.comboHits >= 2,
          color: e.comboHits >= 2 ? "#fde047" : "#93c5fd",
        });
        if (e.comboHits >= 2) {
          e.comboHits = 0;
          setEnemyFsmState(e, "COUNTER", 0.18, true);
          e.state = "slash";
          e.wind = 0.18;
          e.cd = 0.50;
        } else {
          setEnemyFsmState(e, "DODGE", 0.26, true);
          e.state = "retreat";
          e.vy = -115;
          e.vx = knockDir * 130;
          e.cd = 0.18;
        }
        shake = 2.2;
        return;
      }
    }

    // Armored Skeleton buckler shield deflection (broken by Pogo, Charged Wave, Special, or 3rd-hit Finisher!)
    if (e.kind === "armoredSkeleton" && e.state === "shield" && !isGuardBreakMove) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 85;
        e.recoilT = 0.18;
        e.recoilVx = knockDir * 68;
        e.vx = e.recoilVx;
        e.poise = Math.max(1, (e.poise ?? 14) - 2.5);
        e.comboHits = (e.comboHits ?? 0) + 1;
        pushDamageNumber({
          text: e.comboHits >= 2 ? "CONTRA-ATAQUE!" : "BLOQUEIO!",
          x: e.x + e.w / 2,
          y: e.y - 6,
          vy: -34,
          life: 0.385,
          maxLife: 0.385,
          isCrit: e.comboHits >= 2,
          color: e.comboHits >= 2 ? "#fde047" : "#93c5fd",
        });
        if (e.comboHits >= 2) {
          e.comboHits = 0;
          e.blockCooldown = 1.6;
          setEnemyFsmState(e, "COUNTER", 0.20);
          e.state = "slash";
          e.wind = 0.20;
          e.cd = 0.52;
        } else {
          e.cd = Math.max(e.cd, 0.28);
        }
        player.toast = "Escudo! Segure ATAQUE para Magia Carregada, finalize o Combo de 3 golpes ou Pule!";
        player.toastT = 1.8;
        shake = 2.5;
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

    // Boss Valerius shield blocking front basic attacks (Phase 1 only — shattered by Charged Magic, Finisher, or Pogo!)
    if (e.kind === "bossValerius" && (e.phase ?? 1) < 2 && e.state === "shield" && !isGuardBreakMove) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 90;
        e.recoilT = 0.16;
        e.recoilVx = knockDir * 64;
        e.vx = e.recoilVx;
        e.poise = Math.max(1, (e.poise ?? 22) - 2.5);
        e.comboHits = (e.comboHits ?? 0) + 1;
        pushDamageNumber({
          text: e.comboHits >= 2 ? "CONTRA-ATAQUE!" : "BLOQUEIO!",
          x: e.x + e.w / 2,
          y: e.y - 8,
          vy: -36,
          life: 0.42,
          maxLife: 0.42,
          isCrit: e.comboHits >= 2,
          color: e.comboHits >= 2 ? "#fde047" : "#93c5fd",
        });
        if (e.comboHits >= 2) {
          e.comboHits = 0;
          e.blockCooldown = 1.8;
          setEnemyFsmState(e, "COUNTER", 0.22);
          e.state = "slash";
          e.wind = 0.22;
          e.cd = 0.62;
          sound.playBossAttack(2, 1);
        }
        player.toast = "Escudo de Valerius! Use Magia Carregada (Segure Ataque), 3º golpe do Combo ou Pogo!";
        player.toastT = 2.0;
        shake = 3;
        return;
      }
    }

    // Knight tower shield deflection (shattered by Charged Magic, Finisher, or Pogo!)
    if (e.kind === "knight" && (e.state === "shield" || e.state === "charge") && !isGuardBreakMove) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        e.lastSwing = player.swingId;
        sound.playSfx("slash");
        player.vx = -player.facing * 95;
        e.recoilT = 0.20;
        e.recoilVx = knockDir * 72;
        e.vx = e.recoilVx;
        e.poise = Math.max(1, (e.poise ?? 18) - 2.5);
        e.comboHits = (e.comboHits ?? 0) + 1;
        pushDamageNumber({
          text: e.comboHits >= 2 ? "CONTRA-ATAQUE!" : "BLOQUEIO!",
          x: e.x + e.w / 2,
          y: e.y - 6,
          vy: -34,
          life: 0.385,
          maxLife: 0.385,
          isCrit: e.comboHits >= 2,
          color: e.comboHits >= 2 ? "#fde047" : "#93c5fd",
        });
        if (e.comboHits >= 2) {
          e.comboHits = 0;
          e.blockCooldown = 1.7;
          setEnemyFsmState(e, "COUNTER", 0.22);
          e.state = "slash";
          e.wind = 0.22;
          e.cd = 0.58;
        } else {
          e.cd = Math.max(e.cd, 0.30);
        }
        player.toast = "Escudo de Aço! Quebre com Magia Carregada (Segure Ataque) ou Golpe Descendente!";
        player.toastT = 1.8;
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

    // Track if player punished an enemy during its post-attack RECOVERY window
    if ((e.postAttackT ?? 0) > 0 || e.fsmState === "RECOVERY") {
      playerTracker.recordHitOnEnemyInRecovery();
    }

    // Boss is completely invulnerable during Phase 2 transformation
    if (e.boss && (e.transformT ?? 0) > 0) {
      return;
    }

    const wasShielding =
      (e.kind === "armoredSkeleton" ||
        e.kind === "knight" ||
        e.kind === "skeleton" ||
        e.kind === "redSkeleton" ||
        (e.kind === "bossValerius" && (e.phase ?? 1) < 2)) &&
      e.state === "shield" &&
      (player.x - (e.x + e.w / 2)) * e.facing < 0;

    const wasCounterHit = e.wind > 0;
    const isGuardBrokenWindow = (e.fsmState === "GUARD_BROKEN" || !!e.staggered) && e.hurt > 0;
    const isContextualExecution =
      isGuardBrokenWindow && (hitSource === "slash" || isCharged || isSpecial);

    let effectiveDmg = hitSource === "slash" ? Math.max(1, Math.round(dmg * bladeDmgMultiplier)) : dmg;
    if (isContextualExecution) {
      // Condição 4: Execução Contextual com balanceamento próprio — significativa em inimigos comuns (+60%),
      // mas justa/limitada em Chefes (+1 a +2 HP de bônus) para nunca eliminar chefes de forma desproporcional!
      if (e.boss) {
        const bossExecBonus = Math.min(2, Math.max(1, Math.round(effectiveDmg * 0.35)));
        effectiveDmg += bossExecBonus;
      } else {
        effectiveDmg = Math.max(effectiveDmg + 2, Math.ceil(effectiveDmg * 1.6));
      }

      // Recompensa tática da Execução Contextual + encerramento imediato da janela GUARD_BROKEN
      player.mana = Math.min(T.maxMana, player.mana + 12);
      player.special = Math.min(100, player.special + 8);
      player.isHeavyExecution = false;
      e.staggered = false;
      e.poise = e.maxPoise ?? 14;
      e.antiStunTimer = 1.45;
      e.hurt = 0.16;
      setEnemyFsmState(e, "RECOVERY", 0.28, true);
      sound.playSfx("relic");
      sound.playSfx("slashHeavy");
      player.toast = "⚔️ EXECUÇÃO CRÍTICA! +12 Mana · +8 Especial!";
      player.toastT = 2.1;

      for (let i = 0; i < 16; i++) {
        particles.push({
          x: e.x + e.w / 2 + (Math.random() - 0.5) * 18,
          y: e.y + e.h - Math.random() * e.h,
          vx: (Math.random() - 0.5) * 70,
          vy: -45 - Math.random() * 95,
          size: 2.6,
          alpha: 1,
          maxAlpha: 1,
          color: i % 2 === 0 ? "#fde047" : "#f97316",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    const isFatal = e.hp <= effectiveDmg;
    e.lastSwing = player.swingId;
    e.hp -= effectiveDmg;
    e.hurtFlash = 0.09;

    const isCrit =
      isCharged || isSpecial || isContextualExecution || player.combo === 2 || wasCounterHit;

    if (isCrit) {
      hitstop = Math.max(hitstop, isContextualExecution ? 0.08 : 0.055);
      shake = Math.max(shake, isContextualExecution ? 7.0 : 4.5);
    }

    // ETAPA 3: Peso na Execução / Contra-ataque
    // Quando uma Execução ou Contra-ataque acontecer, aumente a fase de RECOVERY
    // desse golpe específico para 0.45s para dar impacto cinematográfico.
    if ((isContextualExecution || wasCounterHit) && hitSource === "slash") {
      player.attackRecoveryDur = Math.max(player.attackRecoveryDur, 0.45);
      if (player.attackPhase === "ACTIVE" || player.attackPhase === "RECOVERY") {
        const recoveryEnd = player.attackStartupDur + player.attackActiveDur + player.attackRecoveryDur;
        player.attackT = Math.max(player.attackT, recoveryEnd - player.attackTimer);
      }
    }

    if (wasShielding && isGuardBreakMove) {
      e.state = "idle";
      pushDamageNumber({
        text: "GUARDA QUEBRADA!",
        x: e.x + e.w / 2,
        y: e.y - 10,
        vy: -42,
        life: 0.49,
        maxLife: 0.49,
        isCrit: true,
        color: "#38bdf8",
      });
    }

    pushDamageNumber({
      text: isContextualExecution
        ? `⚔️ EXECUÇÃO -${effectiveDmg}!`
        : wasCounterHit
          ? `CONTRA -${effectiveDmg}!`
          : isCrit
            ? `-${effectiveDmg}!`
            : `-${effectiveDmg}`,
      x: e.x + e.w / 2 + (Math.random() - 0.5) * 8,
      y: e.y + 2,
      vy: isContextualExecution ? -44 : -36,
      life: isContextualExecution ? 0.574 : 0.455,
      maxLife: isContextualExecution ? 0.574 : 0.455,
      isCrit,
      color: isContextualExecution ? "#f97316" : isCrit ? "#fde047" : "#ef4444",
    });

    if (isFatal) {
      if (gameMode === "horde") {
        hordeKills++;
      }
      e.hp = 0;
      e.dying = true;
      e.deathT = 0;
      e.deathDuration = e.boss ? 1.25 : 0.65;
      e.state = "dying";
      e.wind = 0;
      e.staggered = false;
      e.vx = knockDir * (e.boss ? 14 : 24);
      e.vy = 0; // ZERO vertical pop on fatal hit!
      if (e.kind !== "bat") e.grounded = true;
      sound.playSfx(e.boss ? "bossHurt" : "enemyDie");
      if (e.boss) sound.stopBossVoice();
      shake = Math.max(shake, e.boss ? 8 : 4);

      // Increase special meter on enemy kill (with difficulty multiplier)
      const gain = e.boss ? 40 : e.kind === "knight" || e.kind === "armoredSkeleton" || e.kind === "gargoyle" || e.kind === "vampire" ? 25 : 20;
      const adjustedGain = Math.max(1, Math.round(gain * diffProfile.specialGaugeMult));
      const wasFull = player.special >= 100;
      player.special = Math.min(100, player.special + adjustedGain);
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

    // Small Special gauge gain on landing active combat hits (rewards aggressive swordplay)
    player.special = Math.min(100, player.special + (isCharged ? 4 : player.combo === 2 ? 3 : 1.5));

    // Tactical spacing & Grimvalor micro-knockback on regular living enemies
    if (hitSource === "slash" && !pogo && !e.boss && e.hp > 0) {
      e.x = clamp(e.x + knockDir * 15, 12, stageW - e.w - 12);
      e.recoilT = Math.max(e.recoilT ?? 0, 0.14);
      e.recoilVx = knockDir * 160;
      e.vx = e.recoilVx;
      player.vx = 0;
    } else {
      const centerDist = Math.abs((e.x + e.w / 2) - (player.x + player.w / 2));
      const minSpacing = (e.w + player.w) / 2 + 12;
      if (hitSource === "slash" && !pogo && centerDist < minSpacing) {
        if (player.vx * knockDir > 0) {
          player.vx = -knockDir * 35;
        }
      }
    }

    if (isContextualExecution) {
      e.recoilT = 0.22;
      e.recoilVx = knockDir * (e.boss ? 95 : 135);
      e.vx = e.recoilVx;
      if (pogo) {
        player.vy = -T.pogoV;
        player.jumps = 1;
        player.grounded = false;
        sound.playSfx("pogo");
      }
      return;
    }

    const attackProfile = resolvePlayerAttackProfile(
      dmg,
      pogo,
      hitSource,
      player.combo,
      player.specialT > 0,
    );
    const poiseEval = evaluatePoiseImpact(
      e,
      attackProfile,
      knockDir,
      wasShielding,
      difficulty,
    );

    if (e.boss) {
      if (poiseEval.stunned || poiseEval.guardBroken) {
        // ⚡ POISE BREAK / BOSS STAGGER (Punish window for Contextual Execution, then Boss gains anti-stunlock armor & counters!)
        const staggerDur = poiseEval.stunDuration;
        e.staggered = true;
        e.superArmor = staggerDur + 1.35;
        e.hurt = staggerDur;
        e.wind = 0;
        e.activeTimer = 0;
        setEnemyFsmState(e, "GUARD_BROKEN", staggerDur, true);
        e.attackVariant = 0;
        e.cd = 0;
        e.postAttackT = 0;
        e.recoilT = poiseEval.recoilDuration;
        e.recoilVx = poiseEval.recoilVelocity;
        e.vx = e.recoilVx;

        hitstop = Math.max(hitstop, 0.075);
        shake = Math.max(shake, 8);
        sound.playSfx("thunder");
        sound.playSfx("bossHurt");
        player.toast = `⚡ POSTURA DE ${e.name.split(",")[0].toUpperCase()} QUEBRADA! Ataque para EXECUÇÃO CRÍTICA!`;
        player.toastT = 2.2;

        pushDamageNumber({
          text: "⚡ POSTURA QUEBRADA!",
          x: e.x + e.w / 2,
          y: e.y - 12,
          vy: -45,
          life: 0.63,
          maxLife: 0.63,
          isCrit: true,
          color: "#38bdf8",
        });

        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2;
          const spd = 45 + Math.random() * 85;
          particles.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 20,
            size: 2.5 + Math.random() * 2,
            alpha: 1,
            maxAlpha: 1,
            color: i % 2 === 0 ? "#38bdf8" : "#fde047",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
      } else if (e.wind <= 0 && e.state !== "dive") {
        e.comboHits = (e.comboHits ?? 0) + 1;
        if (e.comboHits >= 2 || poiseEval.triggerTacticalCounter) {
          e.comboHits = 0;
          e.superArmor = 0.95;
          e.recoilT = 0;
          e.postAttackT = 0;
          setEnemyFsmState(e, "COUNTER", 0.24);
          if (e.kind === "bossPetros") {
            e.state = "dive";
            e.vy = -245;
            e.vx = knockDir * 135;
            e.cd = 0.95;
            sound.playBossAttack(1, 2);
          } else if (e.kind === "bossValerius") {
            e.state = "slash";
            e.wind = 0.22;
            e.cd = 0.65;
            e.vx = knockDir * 110;
            sound.playBossAttack(2, 1);
          } else if (e.kind === "bossSeraphine") {
            e.x = clamp(player.x + (e.facing > 0 ? -130 : 130), e.homeX - 165, e.homeX + 165);
            e.cd = 0;
            sound.playBossAttack(3, 2);
          } else if (e.kind === "bossNocturne") {
            e.y = Math.max(24, e.y - 36);
            e.cd = 0;
          } else if (e.kind === "bossVeyne") {
            e.x = clamp(player.x + (player.x < e.homeX ? 115 : -115), e.homeX - 145, e.homeX + 145);
            e.cd = 0;
            sound.playBossAttack(5, 2);
          } else if (e.kind === "bossCalx") {
            e.state = "smash";
            e.attackVariant = 1;
            e.wind = 0.24;
            e.cd = 0.85;
            sound.playBossAttack(6, 1);
          } else if (e.kind === "bossDracula" || e.kind === "dracula") {
            const minX = e.homeX - 135;
            const maxX = e.homeX + 115;
            e.x = clamp(player.x + (player.x < e.homeX ? 96 : -96), minX, maxX);
            e.state = "idle";
            e.wind = 0.22;
            e.cd = 0.75;
            sound.playBossAttack(7, 2);
          }
        } else {
          e.recoilT = poiseEval.recoilDuration;
          e.recoilVx = poiseEval.recoilVelocity;
          e.vx = e.recoilVx;
        }
      }
    } else {
      // Regular Enemy Poise, Interruption & FSM Reaction
      if (poiseEval.stunned || poiseEval.guardBroken) {
        e.wind = 0;
        e.comboHits = 0;
        e.staggered = poiseEval.guardBroken;
        e.hurt = poiseEval.stunDuration;
        e.recoilT = poiseEval.recoilDuration;
        e.recoilVx = poiseEval.recoilVelocity;
        e.vx = e.recoilVx;
      } else if (poiseEval.triggerTacticalCounter || (e.wind <= 0 && (e.comboHits = (e.comboHits ?? 0) + 1) >= 2)) {
        e.comboHits = 0;
        e.hurt = 0;
        e.recoilT = 0;
        e.postAttackT = 0;
        e.superArmor = 0.85;

        if (e.kind === "skeleton" || e.kind === "redSkeleton") {
          setEnemyFsmState(e, "DODGE", 0.32);
          e.state = "retreat";
          e.vy = -135;
          e.vx = knockDir * 145;
          e.cd = 0.08;
        } else if (e.kind === "vampire") {
          setEnemyFsmState(e, "COUNTER", 0.20);
          e.vy = -105;
          e.vx = knockDir * 155;
          e.state = "slash";
          e.wind = 0.18;
          e.cd = 0.55;
          sound.playEnemyAlert("vampire");
        } else if (e.kind === "armoredSkeleton" || e.kind === "knight") {
          setEnemyFsmState(e, "COUNTER", 0.22);
          e.state = "slash";
          e.wind = 0.22;
          e.cd = 0.55;
          e.vx = e.facing * 45;
          sound.playSfx("slash");
        } else if (e.kind === "zombie") {
          setEnemyFsmState(e, "COUNTER", 0.24);
          e.state = "leap";
          e.vy = -130;
          e.vx = e.facing * 135;
          e.wind = 0.24;
          e.cd = 0.85;
          sound.playEnemyAlert("zombie");
        } else if (e.kind === "gargoyle") {
          setEnemyFsmState(e, "DODGE", 0.35);
          e.state = "leap";
          e.vy = -230;
          e.vx = knockDir * 95;
          e.cd = 0.20;
          sound.playSfx("jump");
        } else {
          e.hurt = 0.14;
          e.vx = knockDir * 110;
        }
      } else {
        // Poise held: apply physical slide without canceling committed attack
        e.recoilT = poiseEval.recoilDuration;
        e.recoilVx = poiseEval.recoilVelocity;
        if (e.wind <= 0) {
          e.vx = e.recoilVx;
        }
      }
    }

    if (e.kind !== "bat" && e.state !== "leap" && e.state !== "retreat" && !(e.kind === "gargoyle" && (e.state === "hover" || e.state === "dive")) && !(e.kind === "bossPetros" && e.state === "dive")) {
      e.vy = 0; // Pure horizontal recoil on the stone floor when not leaping/retreating!
      e.grounded = true;
    }
    if (e.kind === "gargoyle" && (e.state === "hover" || e.state === "dive")) {
      e.state = "hover";
      e.hoverT = 0;
      e.cd = 0.45;
      e.vx = knockDir * 95;
    }

    hitstop = dmg >= 3 || player.combo === 2 ? T.hitstopHeavy : T.hitstopLight;
    shake = Math.max(shake, isCharged ? 5 : player.combo === 2 ? 4 : 3);
    sound.playSfx(e.boss ? "bossHurt" : "enemyHurt");
    if (hitSource === "spell") {
      sound.playSfx("spell");
    } else {
      sound.playSfx(player.combo === 2 || isCharged ? "slashHeavy" : "slice");
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
    // =========================================================================
    // CINEMATIC BOSS ENCOUNTER:
    // Freeze battle while Boss speaks! Letterbox, camera tracking, and dialog.
    // Combat only begins once the speech finishes or player presses Skip!
    // =========================================================================
    if (bossCinematic.active) {
      time += dt;

      // Update gates & crystals animation
      for (const gate of sealGates) {
        if (gate.open && gate.openProgress < 1) {
          gate.openProgress = Math.min(1, gate.openProgress + dt * 1.4);
        }
      }
      for (const c of sealCrystals) {
        c.pulseT += dt * 3.5;
      }

      if (bossCinematic.phase === "speaking") {
        bossCinematic.timer += dt;
        bossCinematic.letterboxProgress = Math.min(1, bossCinematic.letterboxProgress + dt * 3.5);

        // Smooth camera glide to confrontation frame
        camX += (bossCinematic.targetCamX - camX) * Math.min(1, dt * 5.0);
        camY += (bossCinematic.targetCamY - camY) * Math.min(1, dt * 5.0);

        // Typewriter effect: reveal characters over duration
        const textDur = Math.max(2.2, bossCinematic.duration - 0.7);
        const charFraction = Math.min(1, bossCinematic.timer / textDur);
        bossCinematic.charCount = Math.floor(charFraction * bossCinematic.quote.length);

        // Keep player grounded and motionless
        player.vx = 0;
        if (!player.grounded) {
          player.vy = Math.min(player.vy + T.gravDown * dt, T.terminal);
          resolve(player, dt, false);
        } else {
          player.vy = 0;
        }

        const b = bossCinematic.bossObj;
        if (b && !b.dead) {
          b.vx = 0;
          b.state = "idle";
          b.facing = player.x > b.x ? 1 : -1;
          player.facing = b.x > player.x ? 1 : -1;

          // Menacing ambient aura particles during speech
          if (Math.random() < 0.35) {
            particles.push({
              x: b.x + Math.random() * b.w,
              y: b.y + b.h - 8,
              vx: (Math.random() - 0.5) * 20,
              vy: -20 - Math.random() * 30,
              size: 2 + Math.random() * 2,
              alpha: 0.8,
              maxAlpha: 0.8,
              color: level.id === 6 ? "#4ade80" : level.id === 5 ? "#a855f7" : "#ff1744",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        }

        // Freeze regular enemies in the arena
        for (const e of enemies) {
          if (!e.boss && !e.dead) {
            e.vx = 0;
            e.cd = Math.max(e.cd, 1.0);
          }
        }

        if (bossCinematic.timer >= bossCinematic.duration) {
          advanceBossCinematicToRoar();
        }

        return; // Suspend combat processing during speech!
      } else if (bossCinematic.phase === "roar_out") {
        bossCinematic.timer += dt;
        bossCinematic.letterboxProgress = Math.max(0, bossCinematic.letterboxProgress - dt * 2.8);
        shake = Math.max(shake, 14 * Math.max(0, 1 - bossCinematic.timer / 1.1));

        if (bossCinematic.timer >= 1.1) {
          bossCinematic.active = false;
          bossCinematic.phase = "done";
          bossCinematic.letterboxProgress = 0;
          if (level.id === 7) {
            sound.playStageBgm(7);
          } else {
            sound.playBgm("boss");
          }
          sound.unduckMusic();
          player.toast = "⚔️ A BATALHA COMEÇOU! DERROTE O SENHOR DO SALÃO!";
          player.toastT = 2.8;
          player.controlLock = 0;
          player.attackLock = 0;
          player.castT = 0;
          player.dashT = 0;
          player.specialT = 0;
          player.vx = 0;
          keys.clear();
          pointer.clear();
          injected.clear();
          publish();
        }

        const focus = player.x + player.w / 2 + player.facing * 28;
        const center = camX + T.viewW / 2;
        if (focus > center + 24) camX += (focus - center - 24) * Math.min(1, dt * 6);
        else if (focus < center - 24) camX += (focus - center + 24) * Math.min(1, dt * 6);
        camX = clamp(camX, 0, Math.max(0, level.width - T.viewW));
        return; // Suspend until roar finishes!
      }
    }

    time += dt;

    if (chamberCooldownTimer > 0) chamberCooldownTimer = Math.max(0, chamberCooldownTimer - dt);

    // Chamber Detection & Elegant Gothic Typography Banner
    if (level.chambers && level.chambers.length > 0) {
      const pMidX = player.x + player.w / 2;
      const activeChamber = level.chambers.find((c) => pMidX >= c.xStart && pMidX <= c.xEnd) || level.chambers[0];
      if (activeChamber && activeChamber.id !== currentChamberId) {
        if (currentChamberId === -1) {
          currentChamberId = activeChamber.id;
          chamberNameBanner = activeChamber.name;
          chamberNameTimer = 2.4;
          chamberCooldownTimer = 2.0;
        } else if (chamberCooldownTimer <= 0) {
          currentChamberId = activeChamber.id;
          chamberTransitionTimer = 0.22;
          sound.playSfx("gateOpen");
          chamberNameBanner = activeChamber.name;
          chamberNameTimer = 2.4;
          chamberCooldownTimer = 4.0;
        }
      }
    }
    if (chamberTransitionTimer > 0) chamberTransitionTimer = Math.max(0, chamberTransitionTimer - dt);
    if (chamberNameTimer > 0) chamberNameTimer = Math.max(0, chamberNameTimer - dt);
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
    if (press.dash) player.dashBuffer = 0.16;
    else player.dashBuffer = Math.max(0, player.dashBuffer - dt);
    if (press.spell) player.spellBuffer = 0.16;
    else player.spellBuffer = Math.max(0, player.spellBuffer - dt);

    const startSwordAttack = (step: 1 | 2 | 3) => {
      // Virar entre Golpes: se o jogador estiver pressionando o direcional oposto, atualize imediatamente
      if (dir !== 0) {
        player.facing = dir as 1 | -1;
      }
      player.attackPhase = "STARTUP";
      player.attackTimer = 0;
      player.lungeApplied = false;
      player.nextAttackBuffered = false;
      player.attackHitboxActive = false;
      player.attackHitEnemies.clear();
      player.slamImpactTriggered = false;
      player.slamImpactTimer = 0;

      const down = aimDown && !player.grounded && !player.crouching;
      player.attackKind = down ? "down" : aimUp ? "up" : player.crouching ? "crouch" : "side";
      // Combo de 3 golpes só vale para o corte lateral; os demais ataques sempre contam como Golpe 1
      const finalStep: 1 | 2 | 3 = player.attackKind === "side" ? step : 1;
      player.comboStep = finalStep;
      player.combo = finalStep - 1; // 0, 1 ou 2 (2 = golpe pesado/finalizador)
      player.comboResetTimer = 0.50;

      // Timings e física coreografada Grimvalor por golpe:
      if (finalStep === 1) {
        // GOLPE 1: Corte Veloz de Avanço (Slash Diagonal Descendente)
        // Duração total: 0.32s (Startup 0.07s, Active 0.09s, Recovery 0.16s)
        player.attackStartupDur = 0.07;
        player.attackActiveDur = 0.09;
        player.attackRecoveryDur = 0.16;
        if (player.grounded) player.vx = 0;
      } else if (finalStep === 2) {
        // GOLPE 2: Corte Ascendente Rápido (Uppercut Slash de Baixo para Cima)
        // Duração total: 0.31s (Startup 0.06s, Active 0.09s, Recovery 0.16s)
        player.attackStartupDur = 0.06;
        player.attackActiveDur = 0.09;
        player.attackRecoveryDur = 0.16;
        if (player.grounded) player.vx = 0;
      } else {
        // GOLPE 3: O Finalizador Grimvalor (Salto Acrobático e Mergulho Slam no Chão / Leap & Slam)
        // Duração total: 0.52s (Startup 0.12s, Active 0.12s, Recovery 0.28s)
        player.attackStartupDur = 0.12;
        player.attackActiveDur = 0.12;
        player.attackRecoveryDur = 0.28;
        // Salto rápido (vy = -420) e avanço horizontal
        if (player.grounded) {
          player.grounded = false;
          player.vy = -420;
        } else {
          player.vy = -420 * 0.75;
        }
        player.vx = player.facing * 360;
      }
      player.attackT = player.attackStartupDur + player.attackActiveDur + player.attackRecoveryDur;
      player.swingId++;

      sound.playSfx(finalStep === 3 ? "slashHeavy" : "slash");
    };

    // Próximo golpe da sequência (1 -> 2 -> 3 -> 1)
    // - Se estiver em andamento de ataque OU dentro da janela de 0.50s: avança 1 -> 2 -> 3 -> 1
    // - Fora da janela: reinicia em 1
    const nextComboStep = (): 1 | 2 | 3 => {
      const inCombo = player.attackPhase !== "NONE" || player.comboResetTimer > 0;
      if (!inCombo) return 1;
      return player.comboStep === 1 ? 2 : player.comboStep === 2 ? 3 : 1;
    };

    // =========================================================================
    // ETAPA 1, 2 & 3: MÁQUINA DE ESTADOS DO COMBO GRIMVALOR (CHOREOGRAPHED COMBAT)
    // - GOLPE 1: Startup 0.07s (-6° tilt), Active 0.09s (+10° tilt, step-in ~22px, freio seco), Recovery 0.16s (cancelável aos 70%)
    // - GOLPE 2: Startup 0.06s (offsetY +4px crouch), Active 0.09s (offsetY -3px, -8° tilt, uppercut slash, step-in ~18px), Recovery 0.16s (cancelável aos 70%)
    // - GOLPE 3: Startup 0.10s (salto explosivo + avanço aéreo 440px/s), Active 0.12s (slam down dive vy >= 460), Recovery 0.28s (impact squash 4 frames, shake 3px)
    // =========================================================================
    if (player.attackPhase !== "NONE") {
      // Input buffer: qualquer toque NOVO de ataque durante o golpe em andamento é registrado no buffer
      // (segurar o botão NÃO encadeia golpes — segurar é reservado para carregar o especial)
      if (press.attack) {
        player.nextAttackBuffered = true;
      }

      player.attackTimer += dt;
      if (player.slamImpactTimer > 0) {
        player.slamImpactTimer = Math.max(0, player.slamImpactTimer - dt);
      }

      const startupEnd = player.attackStartupDur;
      const activeEnd = startupEnd + player.attackActiveDur;
      const recoveryEnd = activeEnd + player.attackRecoveryDur;
      player.attackT = Math.max(0, recoveryEnd - player.attackTimer);

      if (player.attackTimer < startupEnd) {
        // --- STARTUP ---
        player.attackPhase = "STARTUP";
        player.attackHitboxActive = false;
        if (player.comboStep !== 3 && player.grounded) {
          player.vx = 0;
        }
      } else if (player.attackTimer < activeEnd) {
        // --- ACTIVE ---
        player.attackPhase = "ACTIVE";
        player.attackHitboxActive = true;

        if (!player.lungeApplied) {
          player.lungeApplied = true;
          if (player.attackKind === "side") {
            if (player.comboStep === 1) {
              player.vx = player.facing * 380; // Step-in ~22px com freio seco
            } else if (player.comboStep === 2) {
              player.vx = player.facing * 310; // Step-in ~18px
            } else if (player.comboStep === 3) {
              // Mergulho agressivo em queda rápida (Fast-Fall vy = +650)
              player.vy = 650;
            }
          }
        }

        if (player.attackKind === "side") {
          if (player.comboStep === 1 || player.comboStep === 2) {
            // Freio seco: vx *= 0.72 no Active
            player.vx *= Math.pow(0.72, dt * 60);
          } else if (player.comboStep === 3) {
            player.vy = Math.max(player.vy, 650);
            player.vx *= Math.pow(0.6, dt * 60);
          }
        }
      } else if (player.attackTimer < recoveryEnd) {
        // --- RECOVERY ---
        player.attackPhase = "RECOVERY";
        player.attackHitboxActive = false;
        if (player.grounded) player.vx = 0;

        // Golpe 3 landing trigger
        if (player.comboStep === 3 && player.grounded && !player.slamImpactTriggered) {
          player.slamImpactTriggered = true;
          player.slamImpactTimer = 0.15; // 0.15s de pose agachada/inclinada
          shake = Math.max(shake, 4); // tremor de tela
          sound.playSfx("pogo");
        }

        // Combo Fluido: Golpes 1 e 2 disparam o próximo golpe aos 70% do Recovery (somente com toque novo / buffer)
        const recRatio = (player.attackTimer - activeEnd) / player.attackRecoveryDur;
        const wantsNextCombo = press.attack || player.nextAttackBuffered;
        if (
          player.comboStep < 3 &&
          recRatio >= 0.70 &&
          wantsNextCombo &&
          !player.guard &&
          player.castT <= 0 &&
          player.hurtT <= 0
        ) {
          player.nextAttackBuffered = false;
          if (dir !== 0 && dir !== player.facing) {
            player.facing = dir as 1 | -1;
          }
          startSwordAttack(nextComboStep());
        }
      } else {
        // --- RECOVERY CONCLUÍDO (aos 100% de duração) ---
        const wantsNext = press.attack || player.nextAttackBuffered;
        player.attackPhase = "NONE";
        player.attackTimer = 0;
        player.attackT = 0;
        player.attackHitboxActive = false;
        player.lungeApplied = false;
        player.nextAttackBuffered = false;
        player.attackHitEnemies.clear();
        player.slamImpactTriggered = false;
        player.slamImpactTimer = 0;
        if (player.grounded) player.vx = 0;
        // Abre a janela de 0.50s para continuar o combo a partir do estado 'NONE'
        player.comboResetTimer = 0.50;

        if (wantsNext && !player.guard && player.castT <= 0 && player.hurtT <= 0) {
          player.nextAttackBuffered = false;
          if (dir !== 0 && dir !== player.facing) {
            player.facing = dir as 1 | -1;
          }
          startSwordAttack(nextComboStep());
        }
      }
    } else if (player.comboResetTimer > 0) {
      // Em 'NONE': passou mais de 0.50s sem atacar -> reseta o combo
      player.comboResetTimer = Math.max(0, player.comboResetTimer - dt);
      if (player.comboResetTimer <= 0) {
        player.comboStep = 1;
        player.combo = 0;
      }
    }
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

    // =========================================================================
    // DEDICATED ATTACK INPUT CLASSIFIER: HOLD-TO-CHARGE vs. MULTI-PRESS / TAP
    // 1. Captures whether the player is holding the Attack button continuously
    //    or tapping / pressing it repeatedly.
    // 2. When holding: Aldric remains steadily in the blade windup pose
    //    (heroAttack frame 0), charges arcane energy without swinging the sword
    //    mid-charge, and unleashes the Charged Magic Wave!
    // 3. When tapping or pressing multiple times: executes fast 3-hit sword
    //    combos without false magic triggers.
    // =========================================================================
    const rawAttackHeld = held.has("attack");
    if (rawAttackHeld) {
      attackRoutine.releaseGraceT = 0.06; // 60ms micro-drop immunity during charge
    } else {
      attackRoutine.releaseGraceT = Math.max(0, attackRoutine.releaseGraceT - dt);
    }
    const isPhysicallyHoldingAttack = rawAttackHeld || attackRoutine.releaseGraceT > 0;

    attackRoutine.timeSinceLastPress += dt;
    attackRoutine.timeSinceLastRelease += dt;

    const unleashChargedMagic = () => {
      player.holdT = 0;
      player.charge = "idle";
      player.swingId++;
      player.attackPhase = "ACTIVE";
      player.attackTimer = 0.07;
      player.attackStartupDur = 0.07;
      player.attackActiveDur = 0.14;
      player.attackRecoveryDur = 0.18;
      player.attackT = 0.32;
      player.attackLock = 0.30;
      player.castT = 0;
      player.comboStep = 1;
      player.comboResetTimer = 0.50;
      player.attackKind = player.crouching ? "crouch" : "side";
      const tip = swordPoint(0);
      fire({
        x: tip.x - 16,
        y: tip.y - 18,
        w: 48,
        h: 44,
        vx: player.facing * 340,
        vy: 0,
        life: 0.65,
        dmg: T.chargeDamage + 2,
        friendly: true,
        sprite: "slash",
        drawCenterY: tip.y,
        frameLock: 2,
        charged: true,
      });
      sound.playSfx("chargeFire");
      sound.playSfx("spell");
      sound.playSfx("slashHeavy");
      shake = Math.max(shake, 6);
      hitstop = Math.max(hitstop, 0.045);

      for (let i = 0; i < 20; i++) {
        const ang = (Math.random() - 0.5) * 1.4;
        const spd = 65 + Math.random() * 110;
        particles.push({
          x: tip.x,
          y: tip.y,
          vx: player.facing * Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 12,
          size: 2.2 + Math.random() * 2,
          alpha: 0.95,
          maxAlpha: 0.95,
          color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#fde047" : "#ffffff",
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };

    if (isPhysicallyHoldingAttack) {
      attackRoutine.wasPhysicallyHeld = true;
      if (player.castT <= 0 && player.specialT <= 0 && !player.guard && player.hurtT <= 0) {
        attackRoutine.holdDuration += dt;
        player.holdT = attackRoutine.holdDuration;

        // Emit converging arcane & golden energy particles while charging
        if (player.holdT > 0.12 && Math.random() < 0.78) {
          const focusX = player.x + player.w / 2 + player.facing * 12;
          const focusY = player.y + player.h - (player.crouching ? 24 : 52);
          const ang = Math.random() * Math.PI * 2;
          const rad = 22 + Math.random() * 18;
          const px = focusX + Math.cos(ang) * rad;
          const py = focusY + Math.sin(ang) * rad;
          particles.push({
            x: px,
            y: py,
            vx: (focusX - px) * 4.5,
            vy: (focusY - py) * 4.5 - 15,
            size: 2 + Math.random() * 1.8,
            alpha: 0.9,
            maxAlpha: 0.9,
            color: player.charge === "wind" ? (Math.random() > 0.45 ? "#fde047" : "#38bdf8") : "#60a5fa",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
            gravity: 0,
            life: 0.24,
            maxLife: 0.24,
          });
        }

        // Enter full Charged Energy Stance ("wind") at 0.36s and HOLD IT until the player releases the button!
        if (player.holdT >= 0.36 && player.charge !== "wind") {
          player.charge = "wind";
          sound.playSfx("chargeWind");
          for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            particles.push({
              x: player.x + player.w / 2 + player.facing * 10,
              y: player.y + player.h - 48,
              vx: Math.cos(ang) * 55,
              vy: Math.sin(ang) * 55 - 10,
              size: 2.4,
              alpha: 0.95,
              maxAlpha: 0.95,
              color: i % 2 === 0 ? "#fde047" : "#38bdf8",
              depth: "fg",
              pulse: Math.random() * Math.PI * 2,
            });
          }
        }
      }
    } else {
      // Physical release of the Attack button
      if (attackRoutine.wasPhysicallyHeld) {
        attackRoutine.wasPhysicallyHeld = false;
        attackRoutine.timeSinceLastRelease = 0;

        if (player.castT <= 0 && player.specialT <= 0 && player.hurtT <= 0 && !player.guard) {
          if (player.charge === "wind" || attackRoutine.holdDuration >= 0.36) {
            // Released after completing the charge -> Unleash Charged Magic Wave!
            unleashChargedMagic();
          }
        }
      }
      attackRoutine.holdDuration = 0;
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
    player.attackLock = 0;
    player.attackPhase = "NONE";
    player.attackTimer = 0;
    player.lungeApplied = false;
    player.nextAttackBuffered = false;
    player.attackHitboxActive = false;
    player.attackHitEnemies.clear();
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
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
      // =======================================================================
      // ETAPA 1 & 2: TRAVA ABSOLUTA DE INÍCIO DE ATAQUE
      // Um novo ataque SÓ PODE INICIAR se attackPhase === 'NONE'
      // E se o botão de ataque acabou de ser pressionado neste exato frame
      // (evento justPressed sem repeat — PROIBIDO atacar segurando o botão).
      // Se estiver em carga ou segurando para carregar, NÃO desfere golpe de espada!
      // =======================================================================
      const wantsAttack =
        (press.attack || player.nextAttackBuffered) &&
        player.attackPhase === "NONE" &&
        player.charge !== "wind" &&
        attackRoutine.holdDuration < 0.14 &&
        !player.guard &&
        player.castT <= 0 &&
        player.dashT <= 0 &&
        player.hurtT <= 0 &&
        !player.dead &&
        !player.dying;

      if (wantsAttack) {
        player.nextAttackBuffered = false;
        if (dir !== 0 && dir !== player.facing) {
          player.facing = dir as 1 | -1;
        }
        startSwordAttack(nextComboStep());
      }
      if ((press.spell || player.spellBuffer > 0) && !player.guard && player.castT <= 0) {
        player.spellBuffer = 0;
        if (player.mana < T.spellCost) {
          player.toast = "Mana insuficiente.";
          player.toastT = 0.6;
        } else {
          player.mana -= T.spellCost;
          player.castT = 0.28 * spellCdMultiplier;
          player.castFired = false;
          player.attackT = 0;
    player.attackLock = 0;
    player.attackPhase = "NONE";
    player.attackTimer = 0;
    player.lungeApplied = false;
    player.nextAttackBuffered = false;
    player.attackHitboxActive = false;
    player.attackHitEnemies.clear();
    player.slamImpactTriggered = false;
    player.slamImpactTimer = 0;
          player.attackLock = 0.28 * spellCdMultiplier;
          player.charge = "idle";
          player.holdT = 0;
          sound.playSfx("spell");
        }
      }
      // ETAPA 2: Dash bloqueado em STARTUP/ACTIVE. No RECOVERY, um toque NOVO de dash
      // cancela o recovery na hora (attackPhase = 'NONE', nextAttackBuffered = false).
      // Dash em buffer (apertado antes) só dispara quando o personagem já está livre.
      const canDashNow =
        player.dashCd <= 0 &&
        player.dashT <= 0 &&
        (player.attackPhase === "NONE" || (player.attackPhase === "RECOVERY" && press.dash));

      if ((press.dash || (player.dashBuffer > 0 && player.attackPhase === "NONE")) && canDashNow) {
        player.dashBuffer = 0;
        const d = (dir !== 0 ? dir : player.facing) as 1 | -1;
        player.dashT = T.dashTime;
        dashAfterimageTimer = 0; // Primeiro rastro imediato
        player.dashCd = T.dashCooldown;
        player.dashDir = d;
        player.facing = d;
        player.crouching = false;
        player.iframes = Math.max(player.iframes, T.dashIFrames);
        player.charge = "idle";
        player.attackT = 0;
        player.attackLock = 0;
        player.attackPhase = "NONE";
        player.attackTimer = 0;
        player.lungeApplied = false;
        player.nextAttackBuffered = false;
        player.attackHitboxActive = false;
        player.attackHitEnemies.clear();
        player.comboResetTimer = 0;
        player.comboStep = 1;
        player.combo = 0;
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
      dashAfterimageTimer -= dt;
      if (dashAfterimageTimer <= 0) {
        dashAfterimageTimer = 0.040; // 40ms (~2-3 afterimages durante o dash)
        const frame = Math.min(2, Math.floor(((T.dashTime - player.dashT) / T.dashTime) * 3));
        const heroFeet = player.y + player.h + (56 / 320) * DRAW_H.hero;
        afterimages.push({
          sheet: "heroDash",
          frame,
          x: player.x + player.w / 2,
          feet: heroFeet,
          facing: player.facing,
          life: 0.20,
          maxLife: 0.20,
          cols: 3,
          scaleX: 1.22,
          scaleY: 0.72,
          rotation: ((15 * Math.PI) / 180) * player.dashDir,
          offsetY: 6,
        });
      }
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
      } else if (player.attackPhase !== "NONE") {
        if (player.attackPhase === "RECOVERY" && player.grounded) {
          player.vx = 0;
        } else if (player.attackPhase === "STARTUP" && player.comboStep !== 3 && player.grounded) {
          player.vx = 0;
        } else if (player.attackKind !== "side" && player.grounded) {
          player.vx = 0;
        }
      } else {
        // Movimento normal livre apenas quando attackPhase === "NONE" (ou no ar)
        const accel = player.grounded ? T.accelGround : T.accelAir;
        const lock = player.controlLock > 0 ? 0.35 : 1;
        if (dir !== 0) {
          const isReversing = Math.sign(player.vx) !== 0 && Math.sign(player.vx) !== dir;
          const turnMultiplier = isReversing ? 1.35 : 1;
          player.vx += dir * accel * lock * turnMultiplier * dt;
          if (player.controlLock <= 0 && player.attackPhase === "NONE") {
            player.facing = dir as 1 | -1;
          }
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
      } else if (player.buffer > 0 && (player.grounded || player.coyote > 0) && player.attackPhase === "NONE") {
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
      const isLeapSlam = player.attackPhase !== "NONE" && player.attackKind === "side" && player.comboStep === 3;
      if (!held.has("jump") && player.vy < -120 && !isLeapSlam) {
        player.vy = Math.max(player.vy * Math.pow(0.84, dt * 60), -120);
      }
      let grav: number = player.vy < 0 ? T.gravUp : T.gravDown;
      if (Math.abs(player.vy) < T.apexBand) grav = T.gravApex;
      if (player.castT > 0 && !player.grounded) grav *= 0.7;
      player.vy = Math.min(player.vy + grav * dt, T.terminal);
    }

    // TRAVA FINAL DE FÍSICA: garante estabilidade e fidelidade das fases
    if (player.attackPhase === "RECOVERY" && player.grounded) {
      player.vx = 0;
    } else if (player.attackPhase === "STARTUP" && player.comboStep !== 3 && player.grounded) {
      player.vx = 0;
    } else if (player.attackPhase !== "NONE" && player.attackKind !== "side" && player.grounded) {
      player.vx = 0;
    }
    resolve(player, dt, player.dropT > 0);
    if (player.grounded) {
      player.coyote = T.coyote;
      player.jumps = 1;
      // Golpe 3: impacto com o chão (no mergulho do ACTIVE ou no RECOVERY) aplica poeira nos pés, screen shake e squash de 0.15s
      if (
        player.attackKind === "side" &&
        player.comboStep === 3 &&
        !player.slamImpactTriggered &&
        (player.attackPhase === "RECOVERY" || (player.attackPhase === "ACTIVE" && player.lungeApplied))
      ) {
        player.slamImpactTriggered = true;
        player.slamImpactTimer = 0.15;
        shake = Math.max(shake, 4);
        player.vx = 0;
        sound.playSfx("pogo");
        const pFeetY = player.y + player.h;
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: player.x + player.w / 2 + (Math.random() - 0.5) * 16,
            y: pFeetY - 2,
            vx: (i % 2 === 0 ? 1 : -1) * (30 + Math.random() * 80),
            vy: -20 - Math.random() * 35,
            size: 2 + Math.random() * 2.5,
            alpha: 0.85,
            maxAlpha: 0.85,
            color: i % 2 === 0 ? "#cbd5e1" : "#94a3b8",
            depth: "fg",
            pulse: Math.random() * Math.PI * 2,
          });
        }
        // Pousou no meio do mergulho: o RECOVERY de 0.28s começa a contar a partir do impacto
        if (player.attackPhase === "ACTIVE") {
          player.attackTimer = player.attackStartupDur + player.attackActiveDur;
          player.attackPhase = "RECOVERY";
          player.attackHitboxActive = false;
        }
      }
    } else player.coyote = Math.max(0, player.coyote - dt);
    if (player.dashT > 0 && player.wall !== 0) player.dashT = 0;
    player.x = clamp(player.x, 0, stageW - player.w);

    // Anti-Clipping Soft Collision: Impede que o avanço do ataque (step-in) atravesse o meio do corpo do inimigo
    if (player.attackPhase !== "NONE" && player.dashT <= 0 && !player.dead && !player.dying) {
      const pMidX = player.x + player.w / 2;
      for (const e of enemies) {
        if (e.dead || e.dying || e.state === "emerge" || e.kind === "bat") continue;
        const eMidX = e.x + e.w / 2;
        const minCenterDist = (player.w + e.w) / 2 + 3;
        const dx = eMidX - pMidX;
        const absDx = Math.abs(dx);
        const vertOverlap = Math.min(player.y + player.h, e.y + e.h) - Math.max(player.y, e.y);
        if (vertOverlap > 10 && absDx < minCenterDist) {
          const dir = dx >= 0 ? 1 : -1;
          if (player.vx * dir > 0) {
            player.vx = 0;
          }
          player.x = clamp(eMidX - dir * minCenterDist - player.w / 2, 0, stageW - player.w);
        }
      }
    }
    if (player.y > 420) {
      hurtPlayer(2, player.x);
      player.y = GROUND_Y - STAND_H;
      player.vy = -60;
    }

    const feetNow = player.y + player.h;
    const sideSwing = player.attackHitboxActive;
    if (sideSwing) {
      const isFinisher = player.comboStep === 3;
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
                  x: player.facing > 0 ? player.x + player.w - 4 : player.x - (isFinisher ? 66 : 56),
                  y: feetNow - (isFinisher ? 96 : 86),
                  w: isFinisher ? 72 : 60,
                  h: isFinisher ? 82 : 68,
                };
      for (const e of enemies) {
        if (!e.dead && !e.dying && !player.attackHitEnemies.has(e.id) && overlap(box, getEnemyHurtbox(e))) {
          player.attackHitEnemies.add(e.id);
          hurtEnemy(e, isFinisher ? T.finisherDamage : T.slashDamage, player.attackKind === "down", "slash");
        }
      }

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

    // Update PlayerBehaviorTracker (sliding window adaptive combat reading)
    let nearestEnemyX: number | null = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (e.dead || e.dying) continue;
      const d = Math.abs((e.x + e.w / 2) - (player.x + player.w / 2));
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemyX = e.x + e.w / 2;
      }
    }
    playerTracker.update(dt, time, player, nearestEnemyX);

    // CombatDirector coordinates initiative, attack slots, and flanking spacing before enemies update
    combatDirector.update(dt, player, enemies, difficulty, gameMode === "horde");

    for (const e of enemies) updateEnemy(e, dt);

    // Non-overlapping physical BODY COLLIDER separation (preserves jumping/platforming, zero unfair passive contact damage)
    resolveCombatBodyCollisions(player, enemies, stageW, dt);

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

      // Fine magic trail emanating from origin towards front
      if ((s.sprite === "spell" || s.sprite === "blood" || s.charged) && Math.random() < (s.charged ? 0.75 : 0.45)) {
        const pColor = s.charged
          ? (Math.random() > 0.45 ? "#fde047" : "#38bdf8")
          : s.sprite === "blood"
            ? "#ff2a2a"
            : (s.friendly ? "#00e5ff" : "#b388ff");
        particles.push({
          x: s.x + (s.vx > 0 ? 0 : s.w),
          y: s.y + s.h / 2 + (Math.random() - 0.5) * (s.charged ? 14 : 6),
          vx: -s.vx * 0.12 + (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: (s.charged ? 2.2 : 1.5) + Math.random() * 1.5,
          alpha: 0.9,
          maxAlpha: 0.9,
          color: pColor,
          depth: "fg",
          pulse: Math.random() * Math.PI * 2,
        });
      }

      if (s.friendly) {
        // Charged Magic Wave evaporates enemy projectiles in its path!
        if (s.charged) {
          for (const sh of shots) {
            if (!sh.friendly && sh.life > 0 && overlap(s, sh)) {
              sh.life = 0;
            }
          }
        }
        for (const c of sealCrystals) {
          if (!c.activated && overlap(s, c)) {
            player.swingId++;
            activateCrystal(c);
          }
        }
        for (const e of enemies) {
          if (e.dead || e.dying || s.hits.includes(e.id) || !overlap(s, getEnemyHurtbox(e))) continue;
          s.hits.push(e.id);
          player.swingId++;
          hurtEnemy(e, s.dmg, false, s.sprite === "spell" || s.charged ? "spell" : "slash");
          if (s.sprite !== "slash" && !s.charged) s.life = 0;
        }
      } else if (overlap(s, getPlayerHurtbox(player))) {
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
          // INSTANT ONE-SHOT KILL (9999 DMG) against ALL regular enemies,
          // capped at strictly 15% max HP against Bosses!
          const maxBossSpecialDmg = Math.max(8, Math.round(e.max * 0.15));
          const specialDmg = e.boss ? maxBossSpecialDmg : 9999;
          const isFatal = e.hp <= specialDmg;
          e.hp -= specialDmg;
          e.hurtFlash = 0.08;
          shake = Math.max(shake, 5);
          hitstop = Math.max(hitstop, 0.055);
          sound.playSfx(e.boss ? "bossHurt" : "slice");

          pushDamageNumber({
            text: e.boss ? `-${specialDmg}!` : `CRÍTICO!`,
            x: e.x + e.w / 2,
            y: e.y + 2,
            vy: -40,
            life: 0.42,
            maxLife: 0.42,
            isCrit: true,
            color: "#fde047",
          });

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
            if (e.boss) sound.stopBossVoice();

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

    if (gameMode === "campaign") {
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
    } else if (gameMode === "horde") {
      // Controlled spawn queue & wave progression in Horde Mode
      if (!player.dead && !player.won && !hordeUpgradeAvailable) {
        const activeCount = enemies.filter((e) => !e.dead && !e.dying).length;
        const maxActive = difficulty === "easy" ? 3 : difficulty === "hard" ? 5 : 4;

        hordeSpawnTimer -= dt;
        if (hordeSpawnTimer <= 0 && activeCount < maxActive && hordeQueue.length > 0) {
          hordeSpawnTimer = 0.8; // 800ms spawn delay between queued enemies
          const nextKind = hordeQueue.shift()!;
          spawnHordeEnemy(nextKind);
        }

        // Wave finished check
        if (hordeQueue.length === 0 && activeCount === 0 && !hordeWaveClearing) {
          hordeWaveClearing = true;
          sound.playSfx("relic");
          player.toast = `Onda ${hordeWave} Concluída!`;
          player.toastT = 2.4;
          player.mana = Math.min(T.maxMana, player.mana + 30);

          if (player.hp < T.maxHp) {
            items.push({
              id: nextId++,
              kind: Math.random() < 0.65 ? "heal" : "mana",
              x: clamp(player.x + (Math.random() - 0.5) * 80, 40, stageW - 40),
              y: player.y,
              w: 24,
              h: 24,
              collected: false,
              bounceT: 0,
            });
          }

          if (hordeWave % 5 === 0) {
            hordeUpgradeAvailable = true;
            hordeUpgradeWave = hordeWave;
          } else {
            hordeBetweenWavesTimer = 2.2;
          }
        }

        if (hordeWaveClearing && !hordeUpgradeAvailable) {
          hordeBetweenWavesTimer -= dt;
          if (hordeBetweenWavesTimer <= 0) {
            startHordeWave(hordeWave + 1);
          }
        }
      }
    }

    // Prune dead enemies if list grows to maintain high performance
    if (enemies.length > 70) {
      enemies = enemies.filter((e) => !e.dead || e.boss);
    }

    // Update dash afterimages ("Rastro Fantasma")
    for (let i = afterimages.length - 1; i >= 0; i--) {
      afterimages[i].life -= dt;
      if (afterimages[i].life <= 0) {
        afterimages.splice(i, 1);
      }
    }

    // Update floating damage numbers
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const dn = damageNumbers[i];
      dn.life -= dt;
      dn.y += dn.vy * dt;
      dn.vy *= Math.max(0, 1 - 2.5 * dt);
      if (dn.life <= 0) {
        damageNumbers.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.isAmbient) {
        // Partícula ambiente: suave flutuação contínua
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.pulse = (p.pulse ?? 0) + dt * 2.0;
        if (p.y < -15) {
          p.y = 310;
          p.x = Math.random() * stageW;
        } else if (p.y > 320) {
          p.y = 0;
          p.x = Math.random() * stageW;
        }
        if (p.x < -20) p.x += stageW + 40;
        else if (p.x > stageW + 20) p.x -= (stageW + 40);
      } else {
        // Destroços dos mortos e fragmentos de combate: física realista com gravidade, rotação e quique leve
        const grav = p.gravity ?? 380;
        p.vy += grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.max(0, 1 - 0.85 * dt); // resistência do ar
        p.rot = (p.rot ?? 0) + (p.rotSpd ?? 7) * dt;

        // Colisão com o chão e quique leve
        const floorY = findFloorFor(p.x, p.y);
        if (p.y >= floorY - 1) {
          p.y = floorY - 1;
          const b = p.bounces ?? 1;
          if (b > 0 && Math.abs(p.vy) > 30) {
            p.vy = -p.vy * 0.35; // quique com perda de 65% da energia
            p.vx *= 0.65;
            p.bounces = b - 1;
          } else {
            p.vy = 0;
            p.vx *= 0.4;
          }
        }

        // Tempo de vida e atenuação suave de alpha
        if (p.life === undefined) {
          p.life = 0.85 + Math.random() * 0.35; // 0.85s a 1.2s de vida
          p.maxLife = p.life;
          p.rotSpd = (Math.random() - 0.5) * 14;
          p.bounces = 1;
        }
        p.life -= dt;
        const maxL = p.maxLife || 1.0;
        p.alpha = Math.max(0, (p.life / maxL) * (p.maxAlpha ?? 1.0));

        if (p.life <= 0 || p.alpha <= 0.02) {
          particles.splice(i, 1);
        }
      }
    }

    const focus = player.x + player.w / 2 + player.facing * 28;
    const center = camX + T.viewW / 2;
    if (focus > center + 24) camX += (focus - center - 24) * Math.min(1, dt * 8);
    else if (focus < center - 24) camX += (focus - center + 24) * Math.min(1, dt * 8);
    camX = clamp(camX, 0, Math.max(0, stageW - T.viewW));
    const aimY = clamp(player.y + player.h - 180, -180, 140);
    camY += (aimY - camY) * Math.min(1, dt * 5.5);
    shake = Math.max(0, shake - dt * 14);
  }

  function canEnemyAttack(e: Enemy): boolean {
    const distToPlayer = Math.abs((player.x + player.w / 2) - (e.x + e.w / 2));
    return combatDirector.requestAttackInitiative(e, distToPlayer, difficulty);
  }

  function getTacticalMoveVx(e: Enemy, dist: number, dx: number, chaseSpeed: number, idealDist?: number): number {
    if ((e.recoilT ?? 0) > 0) {
      return e.recoilVx ?? 0;
    }
    const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
    const roleSlot = e.boss ? 0 : (e.slotOffsetX ?? 0);
    const baseStop = idealDist ?? cfg.preferredDistance ?? ((e.w + player.w) / 2 + (e.boss ? 10 : 6));
    const minStop = baseStop + roleSlot;

    // Rear Guard holds perimeter or observes without crowding the Primary Attacker
    if (!e.boss && e.combatRole === "REAR_GUARD") {
      const guardDist = minStop + 26;
      if (dist > guardDist + 14) {
        setEnemyFsmState(e, "APPROACH");
        return Math.sign(dx) * (chaseSpeed * 0.72);
      }
      if (dist < guardDist - 10) {
        setEnemyFsmState(e, "RETREAT");
        return -Math.sign(dx) * (chaseSpeed * 0.65);
      }
      setEnemyFsmState(e, cfg.archetype === "defensive" || cfg.archetype === "heavy" ? "DEFEND" : "OBSERVE");
      return 0;
    }

    if ((e.postAttackT ?? 0) > 0) {
      setEnemyFsmState(e, "RECOVERY", e.postAttackT);
      return dist < minStop - 4 ? -Math.sign(dx) * Math.min(55, chaseSpeed * 0.75) : 0;
    }
    const adaptiveMods = playerTracker.getModifiers();
    const effectiveSpeed = chaseSpeed * adaptiveMods.chaseSpeedMult;
    if (dist > minStop + 4) {
      setEnemyFsmState(e, "APPROACH");
      return Math.sign(dx) * effectiveSpeed;
    }
    if (dist < minStop - 8 && e.cd > 0) {
      setEnemyFsmState(e, "RETREAT");
      return -Math.sign(dx) * Math.min(55, chaseSpeed * 0.7);
    }
    setEnemyFsmState(e, cfg.archetype === "defensive" || cfg.archetype === "heavy" ? "DEFEND" : "OBSERVE");
    return 0;
  }

  function updateEnemy(e: Enemy, dt: number) {
    e.t += dt;
    e.hurt = Math.max(0, e.hurt - dt);
    if (e.hurt <= 0 && e.staggered) {
      e.staggered = false;
    }
    e.hurtFlash = Math.max(0, (e.hurtFlash ?? 0) - dt);
    e.superArmor = Math.max(0, (e.superArmor ?? 0) - dt);
    e.postAttackT = Math.max(0, (e.postAttackT ?? 0) - dt);
    e.cd = Math.max(0, e.cd - dt / diffProfile.enemyCooldownMult);
    if (e.dead) {
      e.fsmState = "DEAD";
      return;
    }

    updateEnemyPoiseAndFsmTimers(e, dt);

    // Anti-stacking horizontal separation between nearby living ground enemies (25px - 35px)
    if (!e.boss && e.kind !== "bat" && !e.dead && !e.dying && e.hurt <= 0) {
      for (const other of enemies) {
        if (other === e || other.dead || other.dying || other.boss || other.kind === "bat") continue;
        const edx = (e.x + e.w / 2) - (other.x + other.w / 2);
        const distBetween = Math.abs(edx);
        const minSep = 30;
        if (distBetween < minSep) {
          const pushDir = edx === 0 ? (e.id > other.id ? 1 : -1) : Math.sign(edx);
          const sepForce = (minSep - distBetween) * 45;
          e.vx += pushDir * sepForce * dt;
        }
      }
    }

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
    // BOSS 3-PHASE STRATEGIC TRANSFORMATION SYSTEM (Etapa 9 / Condições 2 e 5):
    // Fase 1 — Observação (100% a 66% HP)
    // Fase 2 — Pressão    (65% a 34% HP)
    // Fase 3 — Desespero  (<= 33% HP)
    // =========================================================================
    if (e.boss && !e.dead && !e.dying) {
      const curPhase = e.phase ?? 1;
      const isDracula = e.kind === "bossDracula" || e.kind === "dracula";
      const hpRatio = e.hp / e.max;
      let targetPhase = curPhase;
      if (hpRatio <= 0.33 && curPhase < 3) {
        targetPhase = 3;
      } else if (hpRatio <= 0.65 && curPhase < 2) {
        targetPhase = 2;
      }

      // Reinforcements on Hard mode at <= 25% HP
      if (difficulty === "hard" && hpRatio <= 0.25 && !e.guardsSpawnedPhase2Hard) {
        e.guardsSpawnedPhase2Hard = true;
        spawnBossGuards(e);
        player.toast = "⚠️ REFORÇOS DAS TREVAS! O Chefe convocou seus guardas de elite!";
        player.toastT = 2.8;
      }

      if (targetPhase > curPhase) {
        e.phase = targetPhase;
        e.transformT = targetPhase === 3 && !isDracula ? 0.75 : 1.0; // Invulnerability roar
        e.hurt = 0;
        e.wind = 0;
        e.activeTimer = 0;
        e.vx = 0;
        e.vy = 0;
        e.cd = 0.95;
        e.state = "transform";
        bossEnragedAnnounced = true;
        shake = Math.max(shake, targetPhase === 3 ? 18 : 15);
        hitstop = Math.max(hitstop, 0.06);
        sound.playSfx("thunder");
        sound.playSfx("bossHurt");

        if (targetPhase === 2 && !e.guardsSpawnedPhase2) {
          e.guardsSpawnedPhase2 = true;
          spawnBossGuards(e);
        }

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

        // Update Boss Title & Toast Announcement per Boss Phase (2: Pressão, 3: Desespero)
        if (targetPhase === 2) {
          if (e.kind === "bossPetros") {
            e.name = "Petros Desperto, Titã de Magma";
            player.toast = "🌋 FASE II (PRESSÃO): O núcleo de magma de Petros rachou a rocha! Cuidado com a chuva vulcânica!";
          } else if (e.kind === "bossValerius") {
            e.name = "Valerius, Berserker das Asas de Sangue";
            player.toast = "🩸 FASE II (PRESSÃO): Valerius descartou o escudo e despertou suas asas demoníacas!";
          } else if (e.kind === "bossSeraphine") {
            e.name = "Seraphine, Serafim Carmesim de Seis Asas";
            player.toast = "👑 FASE II (PRESSÃO): Seraphine ascendeu à forma de Serafim de Sangue! Lanças divinas caem do céu!";
          } else if (e.kind === "bossNocturne") {
            e.name = "Nocturne, Fera Strigoi Abissal";
            player.toast = "🦇 FASE II (PRESSÃO): Nocturne sofreu mutação em Strigoi de Quatro Asas! Ondas sônicas triplas!";
          } else if (e.kind === "bossVeyne") {
            e.name = "Lorde Veyne, Arquilich Soberano do Vazio";
            player.toast = "💀 FASE II (PRESSÃO): Veyne rasgou o véu mortal e revelou sua forma de Arquilich!";
          } else if (e.kind === "bossCalx") {
            e.name = "Calx, Behemoth de Sobrecarga Mutagênica";
            player.toast = "🧪 FASE II (PRESSÃO): Os tanques de Calx explodiram em cristais tóxicos gigantes!";
          } else if (isDracula) {
            e.name = "Conde Drácula, Senhor das Trevas";
            player.toast = "🔥 FASE II (PRESSÃO): Drácula libera o Fogo do Inferno Carmesim e Esferas do Vazio!";
          }
        } else if (targetPhase === 3) {
          if (e.kind === "bossPetros") {
            player.toast = "🔥 FASE III (DESESPERO): Petros entra em Cataclismo Sísmico! Chuva quádrupla de magma!";
          } else if (e.kind === "bossValerius") {
            player.toast = "⚔️ FASE III (DESESPERO): Valerius usa Passo Sombrio e Golpes Quebra-Guarda!";
          } else if (e.kind === "bossSeraphine") {
            player.toast = "🩸 FASE III (DESESPERO): Santuário Carmesim! Minas duplas de sangue e tempestade celeste!";
          } else if (e.kind === "bossNocturne") {
            player.toast = "🌑 FASE III (DESESPERO): Eclipse Predatório! Rasantes supersônicos e ondas quádruplas!";
          } else if (e.kind === "bossVeyne") {
            player.toast = "⚡ FASE III (DESESPERO): Convergência do Vazio! Lanças duplas e teletransporte ofensivo!";
          } else if (e.kind === "bossCalx") {
            player.toast = "☣️ FASE III (DESESPERO): Reação Alquímica em Cadeia! Bombardeio ácido total!";
          } else if (isDracula) {
            e.name = "Drácula, Demônio Primordial Supremo";
            player.toast = "👿 FASE III (FORMA DEMONÍACA VERDADEIRA): Drácula assumiu sua forma colossal de Demônio Alado!";
          }
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
    // In Horde Mode, aggro is infinite (Infinity) - enemies continuously chase Aldric!
    // =========================================================================
    const maxActiveDist = gameMode === "horde" ? Infinity : (e.boss ? 620 : 215);
    if (dist > maxActiveDist) {
      e.vx = 0;
      if (e.kind !== "bat") {
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
      return;
    }

    // Territorial Leash & Simultaneous Attacker Cap for regular ground enemies:
    // Only applied in Campaign mode so enemies guard their areas.
    // In Horde mode, enemies are relentless and all attack Aldric!
    if (gameMode !== "horde" && !e.boss && e.kind !== "bat" && e.hurt <= 0 && e.wind <= 0) {
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
      if (e.kind === "bat" || e.kind === "bossNocturne" || e.kind === "bossSeraphine") {
        e.vx *= Math.max(0, 1 - 8 * dt);
        e.vy *= Math.max(0, 1 - 7 * dt);
        e.x = clamp(e.x + e.vx * dt, 16, stageW - e.w - 16);
        e.y = clamp(e.y + e.vy * dt, 16, GROUND_Y - 20);
      } else {
        e.vx *= Math.max(0, 1 - 9 * dt);
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
      return; // Suspends chasing and attacking while reeling from hit / stagger
    }

    // =========================================================================
    // BLADE IMPACT RECOIL DECAY (NEVER BLOCKS ENEMY OR BOSS AI!):
    // Decays physical pushback velocity while allowing full AI & counter-attacks.
    // =========================================================================
    if ((e.recoilT ?? 0) > 0) {
      e.recoilT = Math.max(0, (e.recoilT ?? 0) - dt);
      e.recoilVx = (e.recoilVx ?? 0) * Math.max(0, 1 - 10 * dt);
    }

    const postPauseDur =
      (ENEMY_COMBAT_CONFIG[e.kind]?.recoveryDuration ?? 0.25) *
      (difficulty === "easy" ? 1.25 : difficulty === "hard" ? 0.78 : 1.0);

    // =========================================================================
    // FASE 6 & FASE 7: ADAPTIVE DODGE, DEFEND & COUNTER-ATTACK DECISION
    // =========================================================================
    const adaptiveMods = playerTracker.getModifiers();
    if (adaptiveMods.forceOffensiveInitiative && e.cd > 0.15) {
      e.cd = Math.max(0.10, e.cd - dt * 1.5);
    }

    if (e.kind !== "bat" && e.wind <= 0 && (e.postAttackT ?? 0) <= 0 && e.state !== "dive" && e.state !== "leap" && e.state !== "hover" && e.state !== "retreat") {
      const tacticalChoice = evaluateAdaptiveTacticalAction(e, dist, stageW, adaptiveMods);
      if (tacticalChoice === "DODGE") {
        setEnemyFsmState(e, "DODGE", 0.30);
        pushDamageNumber({
          text: "ESQUIVA!",
          x: e.x + e.w / 2,
          y: e.y - 6,
          vy: -35,
          life: 0.385,
          maxLife: 0.385,
          isCrit: false,
          color: "#38bdf8",
        });
        if (e.kind === "gargoyle") {
          e.state = "leap";
          e.vy = -225;
          e.vx = -e.facing * 90;
          e.cd = 0.22;
          sound.playSfx("jump");
        } else if (e.kind === "bossSeraphine" || e.kind === "bossVeyne" || e.kind === "bossDracula") {
          e.x = clamp(player.x + (e.facing > 0 ? -120 : 120), e.homeX - 145, e.homeX + 145);
          e.cd = 0.25;
        } else {
          e.state = "retreat";
          e.vy = -125;
          e.vx = -e.facing * 135;
          e.cd = 0.18;
        }
      } else if (tacticalChoice === "COUNTER") {
        setEnemyFsmState(e, "COUNTER", 0.20);
        e.state = "slash";
        e.wind = 0.20;
        e.cd = (ENEMY_COMBAT_CONFIG[e.kind]?.attackCooldown ?? 0.65) * 0.85;
        pushDamageNumber({
          text: "CONTRA-ATAQUE!",
          x: e.x + e.w / 2,
          y: e.y - 8,
          vy: -38,
          life: 0.42,
          maxLife: 0.42,
          isCrit: true,
          color: "#fde047",
        });
      } else if (tacticalChoice === "DEFEND") {
        setEnemyFsmState(e, "DEFEND", 0.42);
        e.state = "shield";
        e.blockCooldown = 1.5;
        pushDamageNumber({
          text: "DEFESA!",
          x: e.x + e.w / 2,
          y: e.y - 6,
          vy: -32,
          life: 0.35,
          maxLife: 0.35,
          isCrit: false,
          color: "#93c5fd",
        });
      }
    }

    // =========================================================================
    // 1. BAT (Classe 4: Criatura Aérea — Controle de altitude e mergulhos rápidos)
    // =========================================================================
    if (e.kind === "bat") {
      const headTop = player.y;

      if (e.cd > 0) {
        // Recovery / Ascending state after attack or recoil: climbs back rapidly to flight height
        const cruiseY = headTop - 56 + Math.sin(e.t * 3.8) * 8;
        e.y += (cruiseY - e.y) * Math.min(1, dt * 6.0);
        e.vx = -e.facing * 75;
        e.x += e.vx * dt;
      } else if (dist < (gameMode === "horde" ? Infinity : 400)) {
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
            e.cd = 0.65; // Post-dive vulnerability & ascent cooldown
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
    // UNIVERSAL PHASE 2 & 3 BOSS MECHANICS (Ground Shockwave & Shadow Rush Combo)
    // =========================================================================
    else if (e.boss && (e.phase ?? 1) >= 2 && !e.dead && !e.dying && (e.transformT ?? 0) <= 0 && (e.attackVariant === 98 || e.attackVariant === 99 || ((e.phase2ShockwaveCd ?? 0) <= 0 && e.cd <= 0 && e.state === "idle" && dist > 50) || ((e.phase2DashCd ?? 0) <= 0 && e.cd <= 0 && e.state === "idle" && dist > 75 && dist < 320))) {
      const isDesperation = (e.phase ?? 1) >= 3;
      e.phase2ShockwaveCd = Math.max(0, (e.phase2ShockwaveCd ?? 3.0) - dt);
      e.phase2DashCd = Math.max(0, (e.phase2DashCd ?? 4.0) - dt);

      // 1. Ground Shockwave Attack (forces player to jump [W] or dodge [K])
      if (e.cd <= 0 && (e.phase2ShockwaveCd ?? 0) <= 0 && e.state === "idle" && dist > 50) {
        e.state = "slash";
        e.wind = isDesperation ? 0.34 : 0.40;
        e.cd = isDesperation ? 1.15 : 1.35;
        e.phase2ShockwaveCd = difficulty === "hard" ? 2.8 : 4.2;
        e.attackVariant = 99;
        sound.playSfx("slashHeavy");
      }
      // 2. Double Combo / Shadow Dash Rush across arena
      else if (e.cd <= 0 && (e.phase2DashCd ?? 0) <= 0 && e.state === "idle" && dist > 75 && dist < 320) {
        e.state = "slash";
        e.wind = isDesperation ? 0.34 : 0.40;
        e.cd = isDesperation ? 1.25 : 1.5;
        e.phase2DashCd = difficulty === "hard" ? 3.2 : 4.8;
        e.attackVariant = 98;
        sound.playSfx("dash");
      }

      if (e.attackVariant === 99) {
        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = 0;
          if (e.wind <= 0) {
            shake = Math.max(shake, 6);
            sound.playSfx("thunder");
            fire({
              x: e.x + (e.facing > 0 ? e.w + 4 : -28),
              y: GROUND_Y - 22,
              w: 24,
              h: 22,
              vx: e.facing * (isDesperation ? 285 : 260),
              vy: 0,
              life: 1.6,
              dmg: 1,
              friendly: false,
              sprite: "slash",
            });
            if (isDesperation) {
              // Phase 3 Desperation: Bidirectional Ground Shockwave!
              fire({
                x: e.x + (e.facing > 0 ? -28 : e.w + 4),
                y: GROUND_Y - 22,
                w: 24,
                h: 22,
                vx: -e.facing * 240,
                vy: 0,
                life: 1.4,
                dmg: 1,
                friendly: false,
                sprite: "slash",
              });
            }
            e.state = "idle";
            e.attackVariant = 0;
            e.postAttackT = postPauseDur;
          }
        }
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      } else if (e.attackVariant === 98) {
        if (e.wind > 0) {
          e.wind -= dt;
          // Plants feet during first 60% of warning telegraph, then dashes forward!
          e.vx = e.wind > 0.16 ? 0 : (dist > (e.w + player.w) / 2 + 6 ? e.facing * (isDesperation ? 295 : 270) : 0);
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 48,
              y: e.y + 6,
              w: 52,
              h: 46,
            };
            if (overlap(box, getPlayerHurtbox(player))) {
              hurtPlayer(2, e.x, "slash", true); // Heavy attack: crushes passive guard, rewards Perfect Parry!
            }
            shake = Math.max(shake, 4);
            sound.playSfx("slashHeavy");
            e.state = "idle";
            e.attackVariant = 0;
            e.cd = 0.45;
            e.postAttackT = postPauseDur;
          }
        }
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
    }
    // =========================================================================
    // 2. BOSS 1: Petros, Gárgula Colossal -> F1: Observação | F2: Pressão | F3: Desespero
    // =========================================================================
    else if (e.kind === "bossPetros") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      if (e.cd <= 0 && dist > 85 && e.state !== "dive") {
        // High demon leap and crushing dive smash
        e.state = "dive";
        e.vy = isDesperation ? -300 : isEnraged ? -285 : -220;
        e.cd = isDesperation ? 0.95 : isEnraged ? 1.15 : 1.65;
        sound.playBossAttack(1, 2); // Salto e impacto sísmico
      }
      if (e.state === "dive") {
        // Target a spot slightly in front of Aldric rather than landing inside his hitbox
        const targetDist = (e.w + player.w) / 2 + 12;
        e.vx = dist > targetDist ? Math.sign(dx) * (isDesperation ? 168 : isEnraged ? 150 : 115) : 0;
        if (e.grounded || e.y >= e.homeY - 8) {
          e.state = "idle";
          e.vx = 0;
          e.postAttackT = isDesperation ? postPauseDur * 0.72 : postPauseDur;
          shake = isDesperation ? 11 : isEnraged ? 9 : 6;
          sound.playBossAttack(1, 2); // Impacto estrondoso de pedra/magma no solo
          const shockSpeed = isDesperation ? 235 : isEnraged ? 215 : 175;
          fire({ x: e.x - 20, y: e.y + e.h - 18, w: 16, h: 18, vx: -shockSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
          fire({ x: e.x + e.w + 4, y: e.y + e.h - 18, w: 16, h: 18, vx: shockSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
          if (isEnraged) {
            // Phase 2 (3 meteors) / Phase 3 Desperation (4 cross-angled volcanic meteors + immediate claw follow-up if close!)
            const meteorCount = isDesperation ? 4 : 3;
            for (let r = 0; r < meteorCount; r++) {
              fire({
                x: player.x + (r - (meteorCount - 1) / 2) * 52 + (Math.random() - 0.5) * 18,
                y: -10,
                w: 16,
                h: 20,
                vx: (Math.random() - 0.5) * 35,
                vy: isDesperation ? 255 : 235,
                life: 1.8,
                dmg: 1,
                friendly: false,
                sprite: "blood",
              });
            }
            if (isDesperation && dist <= 78) {
              // Phase 3 Strategic Change: Chains landing slam directly into a fast magma claw sweep!
              e.state = "slash";
              e.wind = 0.22;
              e.cd = 0.60;
              e.postAttackT = 0;
            }
          }
        }
      } else {
        if (dist <= 68 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
          e.wind = isDesperation ? 0.21 : isEnraged ? 0.24 : 0.30;
          e.cd = isDesperation ? 0.56 : isEnraged ? 0.65 : 0.82;
          e.state = "slash";
          sound.playBossAttack(1, 1); // Ataque 1: Garra / Sopro de magma colossal
        }
        if (e.wind > 0) {
          e.wind -= dt;
          const minStep = (e.w + player.w) / 2 + 10;
          e.vx = e.wind <= 0.08 && dist > minStep ? e.facing * (isDesperation ? 90 : isEnraged ? 75 : 50) : 0;
          if (e.wind <= 0) {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 46, y: e.y + 12, w: 50, h: 52 };
            if (overlap(box, getPlayerHurtbox(player))) hurtPlayer(2, e.x, "slash", true);
            if (isEnraged) {
              // Phase 2 & 3 Molten Fire-Breath Wave!
              fire({
                x: e.x + (e.facing > 0 ? e.w + 6 : -24),
                y: e.y + 16,
                w: 22,
                h: 24,
                vx: e.facing * (isDesperation ? 225 : 205),
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
                vx: e.facing * (isDesperation ? 195 : 175),
                vy: 15,
                life: 1.1,
                dmg: 1,
                friendly: false,
                sprite: "slash",
              });
            }
            e.state = "idle";
            e.postAttackT = postPauseDur;
          }
        } else {
          e.state = "idle";
          e.vx = getTacticalMoveVx(e, dist, dx, isDesperation ? 88 : isEnraged ? 78 : 54, 44);
        }
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 3. BOSS 2: Valerius -> F1: Observação (Escudo) | F2: Pressão | F3: Desespero (Passo Sombrio)
    // =========================================================================
    else if (e.kind === "bossValerius") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      if (isDesperation && dist > 95 && dist < 260 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.state !== "slash") {
        // Phase 3 Strategic Feint: Shadow-Step Reposition right to sword range before heavy cleave!
        e.x = clamp(player.x - e.facing * 52, e.homeX - 165, e.homeX + 165);
        e.facing = player.x + player.w / 2 >= e.x + e.w / 2 ? 1 : -1;
        e.state = "slash";
        e.wind = 0.24;
        e.cd = 0.78;
        sound.playSfx("dash");
        sound.playBossAttack(2, 1);
      } else if (isEnraged && dist > 85 && dist < 240 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.state !== "slash") {
        e.state = "slash";
        e.wind = 0.28;
        e.cd = 0.92;
        sound.playBossAttack(2, 1);
      } else if (dist <= 66 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        e.state = "slash";
        e.wind = isDesperation ? 0.20 : isEnraged ? 0.22 : 0.28;
        e.cd = isDesperation ? 0.55 : isEnraged ? 0.62 : 0.78;
        sound.playBossAttack(2, 1); // Ataque 1: Investida com lâmina pesada
      }
      if (e.wind > 0) {
        e.wind -= dt;
        const minStep = (e.w + player.w) / 2 + 10;
        e.vx = e.wind <= 0.09 && dist > minStep ? e.facing * (isDesperation ? 205 : isEnraged ? 185 : 135) : 0;
        if (e.wind <= 0) {
          const box = { x: e.facing > 0 ? e.x + e.w : e.x - 46, y: e.y + 12, w: 52, h: 48 };
          if (overlap(box, getPlayerHurtbox(player))) hurtPlayer(2, e.x, "slash", true); // Heavy blade cleave
          sound.playBossAttack(2, 2); // Ataque 2: Onda de corte crescente sombrio
          fire({
            x: e.x + (e.facing > 0 ? e.w : -24),
            y: e.y + e.h - 32,
            w: 24,
            h: 32,
            vx: e.facing * (isDesperation ? 255 : isEnraged ? 235 : 190),
            vy: 0,
            life: 1.2,
            dmg: 1,
            friendly: false,
            sprite: "slash",
          });
          if (isEnraged) {
            // Twin Blood Crescent Wave + Skyward Blood-Judgment Lightning Pillars!
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
            const pillarCount = isDesperation ? 2 : 1;
            for (let p = 0; p < pillarCount; p++) {
              fire({
                x: player.x + (p === 0 ? 0 : e.facing * 52) + (Math.random() - 0.5) * 24,
                y: -12,
                w: 16,
                h: 28,
                vx: 0,
                vy: 255,
                life: 1.5,
                dmg: 1,
                friendly: false,
                sprite: "blood",
              });
            }
          }
          e.state = isEnraged ? "idle" : "shield";
          e.postAttackT = postPauseDur;
        }
      } else {
        e.state = isEnraged ? "idle" : "shield";
        e.vx = getTacticalMoveVx(e, dist, dx, isDesperation ? 90 : isEnraged ? 80 : 52, 44);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 4. BOSS 3: Seraphine -> F1: Observação | F2: Pressão | F3: Desespero (Santuário Carmesim)
    // =========================================================================
    else if (e.kind === "bossSeraphine") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      const hoverFreq = isDesperation ? 5.2 : isEnraged ? 4.6 : 3.2;
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
          if (isDesperation) {
            // Phase 3 Strategic Change: Leaves a twin blood trap at midpoint on teleport!
            fire({
              x: (oldX + e.x) / 2,
              y: oldY + 12,
              w: 20,
              h: 20,
              vx: 0,
              vy: 0,
              life: 1.0,
              dmg: 1,
              friendly: false,
              sprite: "blood",
            });
          }
          e.cd = isDesperation ? 0.58 : isEnraged ? 0.72 : 1.1;
        }
      }
      if (e.cd <= 0) {
        e.cd = isDesperation ? 0.72 : isEnraged ? 0.85 : 1.35;
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
            vx: e.facing * (isDesperation ? 205 : isEnraged ? 185 : 135),
            vy: spreadY,
            life: 1.8,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
        }
        if (isEnraged) {
          const spearCount = isDesperation ? 4 : 3;
          for (let l = 0; l < spearCount; l++) {
            fire({
              x: player.x + (l - (spearCount - 1) / 2) * 46 + (Math.random() - 0.5) * 16,
              y: -10,
              w: 12,
              h: 26,
              vx: 0,
              vy: isDesperation ? 255 : 235,
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
    // 5. BOSS 4: Nocturne -> F1: Observação | F2: Pressão | F3: Desespero (Eclipse Predatório)
    // =========================================================================
    else if (e.kind === "bossNocturne") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      const flyFreq = isDesperation ? 4.4 : isEnraged ? 3.8 : 2.8;
      // Orbit at tactical flanking distance and swoop in for claw strikes
      const orbitSide = Math.sin(e.t * (isDesperation ? 1.85 : 1.4)) >= 0 ? 1 : -1;
      const tx = clamp(player.x + orbitSide * (isDesperation ? 48 : isEnraged ? 54 : 62) + Math.sin(e.t * flyFreq) * 28, e.homeX - 180, e.homeX + 180);
      const ty = clamp(player.y - 36 + Math.cos(e.t * (flyFreq + 0.6)) * 22, 20, GROUND_Y - 46);
      e.x += (tx - e.x) * Math.min(1, dt * (isDesperation ? 4.2 : isEnraged ? 3.6 : 2.6));
      e.y += (ty - e.y) * Math.min(1, dt * (isDesperation ? 4.2 : isEnraged ? 3.6 : 2.6));

      if (dist <= 66 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        e.state = "slash";
        e.wind = isDesperation ? 0.20 : 0.24;
        e.cd = isDesperation ? 0.58 : isEnraged ? 0.72 : 0.98;
        sound.playBossAttack(4, 2); // Ataque 2: Rasante predatório de garras duplas carmesim
      } else if (e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        e.cd = isDesperation ? 0.74 : isEnraged ? 0.88 : 1.25;
        e.state = "smash";
        e.wind = 0.22;
        sound.playBossAttack(4, 1); // Ataque 1: Supernova sônica abissal
        const sonicCount = isDesperation ? 4 : isEnraged ? 3 : 1;
        for (let s = 0; s < sonicCount; s++) {
          const vy = (s - (sonicCount - 1) / 2) * 38;
          fire({
            x: e.x + (e.facing > 0 ? e.w : -16),
            y: e.y + e.h / 2 - 8,
            w: 22,
            h: 22,
            vx: e.facing * (isDesperation ? 240 : isEnraged ? 220 : 165),
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
        if (e.wind <= 0) {
          if (e.state === "slash") {
            const clawBox = { x: e.x - 14, y: e.y + 4, w: e.w + 28, h: e.h + 16 };
            if (overlap(clawBox, getPlayerHurtbox(player))) {
              hurtPlayer(2, e.x, "slash");
            }
            if (isDesperation) {
              // Phase 3 Hit-and-Run Ascent after claw strike
              e.y = Math.max(22, e.y - 38);
            }
          }
          e.state = "idle";
          e.postAttackT = postPauseDur;
        }
      }
    }
    // =========================================================================
    // 6. BOSS 5: Lorde Veyne -> F1: Observação | F2: Pressão | F3: Desespero (Convergência do Vazio)
    // =========================================================================
    else if (e.kind === "bossVeyne") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      if (dist <= 62 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        // Close range bone vortex barrier & panic blink
        e.cd = isDesperation ? 0.54 : isEnraged ? 0.62 : 0.82;
        e.state = "slash";
        e.wind = isDesperation ? 0.18 : isEnraged ? 0.20 : 0.26;
        sound.playBossAttack(5, 2); // Ataque 2: Vórtice de ossos e caveiras arcanas
      } else if (dist > 62 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        e.cd = isDesperation ? 0.68 : isEnraged ? 0.82 : 1.25;
        e.state = "slash";
        e.wind = isDesperation ? 0.18 : isEnraged ? 0.20 : 0.26;
        sound.playBossAttack(5, 1); // Ataque 1: Crânios flamejantes + relâmpagos do vazio
        const skullCount = isDesperation ? 4 : isEnraged ? 3 : 1;
        for (let k = 0; k < skullCount; k++) {
          const vx = e.facing * (isEnraged ? (105 + k * 34) : 130);
          const vy = -120 - k * 28;
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
            vx: e.facing * (isDesperation ? 230 : 205),
            vy: 0,
            life: 1.3,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
          if (isDesperation) {
            // Phase 3 Strategic Change: Upper Void Spear preventing mindless jump-ins!
            fire({
              x: e.x + (e.facing > 0 ? e.w : -20),
              y: e.y + 12,
              w: 22,
              h: 18,
              vx: e.facing * 195,
              vy: 0,
              life: 1.3,
              dmg: 1,
              friendly: false,
              sprite: "blood",
            });
          }
        }
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = 0;
        if (e.wind <= 0) {
          const box = { x: e.facing > 0 ? e.x + e.w : e.x - 44, y: e.y + 8, w: 48, h: 48 };
          if (overlap(box, getPlayerHurtbox(player))) hurtPlayer(2, e.x, "spell");
          if (isEnraged && dist < (isDesperation ? 70 : 52)) {
            e.x = clamp(player.x + (player.x < e.homeX ? 115 : -115), e.homeX - 145, e.homeX + 145);
          }
          e.state = "idle";
          e.postAttackT = postPauseDur;
        }
      } else {
        e.state = "idle";
        e.vx = getTacticalMoveVx(e, dist, dx, isDesperation ? 80 : isEnraged ? 70 : 48, 46);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 7. BOSS 6: Calx -> F1: Observação | F2: Pressão | F3: Desespero (Reação Alquímica)
    // =========================================================================
    else if (e.kind === "bossCalx") {
      const bossPhase = e.phase ?? 1;
      const isEnraged = bossPhase >= 2;
      const isDesperation = bossPhase >= 3;
      if (dist <= 68 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        // Seismic Double-Claw Crystal Slam & Toxic Shockwave (telegraphed!)
        e.state = "smash";
        e.attackVariant = 1;
        e.wind = isDesperation ? 0.21 : isEnraged ? 0.24 : 0.30;
        e.cd = isDesperation ? 0.68 : isEnraged ? 0.80 : 1.15;
        sound.playBossAttack(6, 1); // Ataque 1: Pisotão sísmico de cristais tóxicos
      } else if (dist > 68 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        e.cd = isDesperation ? 0.74 : isEnraged ? 0.90 : 1.35;
        e.state = "slash";
        e.attackVariant = 2;
        e.wind = 0.24;
        sound.playBossAttack(6, 2); // Ataque 2: Bombardeio de frascos mutagênicos voláteis
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = 0;
        if (e.wind <= 0) {
          if (e.attackVariant === 1) {
            shake = isDesperation ? 11 : isEnraged ? 9 : 6;
            if (player.grounded && dist < 88) {
              hurtPlayer(1, e.x, "slash", true); // Heavy crystal slam
            }
            const waveSpeed = isDesperation ? 230 : isEnraged ? 205 : 160;
            fire({ x: e.x - 18, y: e.y + e.h - 16, w: 16, h: 16, vx: -waveSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
            fire({ x: e.x + e.w + 4, y: e.y + e.h - 16, w: 16, h: 16, vx: waveSpeed, vy: 0, life: 1.3, dmg: 1, friendly: false, sprite: "spell" });
            if (isEnraged) {
              const dropCount = isDesperation ? 4 : 3;
              for (let a = 0; a < dropCount; a++) {
                fire({
                  x: player.x + (a - (dropCount - 1) / 2) * 44 + (Math.random() - 0.5) * 18,
                  y: -10,
                  w: 14,
                  h: 20,
                  vx: 0,
                  vy: isDesperation ? 255 : 235,
                  life: 1.7,
                  dmg: 1,
                  friendly: false,
                  sprite: "spell",
                });
              }
            }
          } else {
            const flaskCount = isDesperation ? 4 : isEnraged ? 3 : 1;
            for (let f = 0; f < flaskCount; f++) {
              const vx = e.facing * (isEnraged ? (95 + f * 36) : 125);
              const vy = -115 - f * 24;
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
          e.state = "idle";
          e.postAttackT = postPauseDur;
        }
      } else {
        e.state = "idle";
        e.vx = getTacticalMoveVx(e, dist, dx, isDesperation ? 82 : isEnraged ? 72 : 48, 46);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 8. FINAL BOSS: Conde Drácula -> F1: Observação | F2: Pressão | F3: Demônio Primordial
    // =========================================================================
    else if (e.kind === "bossDracula" || e.kind === "dracula") {
      const draculaPhase = e.phase ?? 1;
      const hover = draculaPhase === 3 ? 14 + Math.sin(e.t * 4.2) * 8 : 0;
      e.y = e.homeY - hover;
      const minX = e.homeX - 135;
      const maxX = e.homeX + 115;

      if (dist <= 64 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0) {
        // Telegraphed Demonic Vampire Claw Strike when player is near!
        e.state = "slash";
        e.wind = draculaPhase === 3 ? 0.20 : 0.25;
        e.cd = draculaPhase === 3 ? 0.55 : 0.72;
        sound.playBossAttack(7, 1); // Ataque 1: Garras demoníacas de sangue
      }

      if (e.wind > 0) {
        e.wind -= dt;
        const minStep = (e.w + player.w) / 2 + 10;
        e.vx = e.state === "slash" && e.wind <= 0.08 && dist > minStep ? e.facing * (draculaPhase === 3 ? 105 : 75) : 0;
        e.x = clamp(e.x + e.vx * dt, minX, maxX);
        if (e.wind <= 0) {
          if (e.state === "slash") {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 48, y: e.y + e.h - 74, w: 54, h: 52 };
            if (overlap(box, getPlayerHurtbox(player))) hurtPlayer(2, e.x, "slash", draculaPhase >= 2);
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
            e.postAttackT = postPauseDur;
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
            e.postAttackT = postPauseDur;
          }
        }
      } else if (e.cd <= 0 && dist > 64 && (e.postAttackT ?? 0) <= 0) {
        // Teleport within throne arena with dark rift sound
        e.x = clamp(player.x + (player.x < e.homeX ? 92 : -92), minX, maxX);
        sound.playBossAttack(7, 2); // Ataque 2: Teletransporte de fenda sombria
        e.wind = draculaPhase === 3 ? 0.22 : draculaPhase === 2 ? 0.28 : 0.34;
        e.cd = draculaPhase === 3 ? 0.72 : draculaPhase === 2 ? 0.95 : 1.25;
      } else {
        e.vx = getTacticalMoveVx(e, dist, dx, draculaPhase === 3 ? 85 : draculaPhase === 2 ? 68 : 54, 54);
        e.x = clamp(e.x + e.vx * dt, minX, maxX);
      }
    }
    // =========================================================================
    // 9. REGULAR GROUND ENEMIES (Armored Skeleton, Red Skeleton, Skeleton, Knight, Zombie, Vampire, Gargoyle)
    // =========================================================================
    else {
      const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;

      // -----------------------------------------------------------------------
      // A. ARMORED SKELETON (Classe 1: Guerreiro Esqueleto — Escudo + Estocada Gladius)
      // -----------------------------------------------------------------------
      if (e.kind === "armoredSkeleton") {
        if (dist <= 58 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0) {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.wind = cfg.windupDuration;
            e.cd = cfg.attackCooldown;
            e.state = "slash";
          }
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.wind <= 0.12 && dist > (e.w + player.w) / 2 + 2 ? e.facing * 75 : 0;
          if (e.wind <= 0) {
            setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
            e.state = "slash";
          }
        } else if ((e.activeTimer ?? 0) > 0) {
          e.vx = 0;
          e.state = "slash";
          const box = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 46,
            y: e.y + 8,
            w: 50,
            h: 38,
          };
          if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(2, e.x, "slash");
          }
          if ((e.activeTimer ?? 0) <= dt) {
            e.state = "shield";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else {
          e.state = "shield";
          e.vx = getTacticalMoveVx(e, dist, dx, 54, (e.w + player.w) / 2 + 4);
        }
      }
      // -----------------------------------------------------------------------
      // B. RED SKELETON (Classe 1: Guerreiro Esqueleto — Combate Equilibrado, Bloqueio & Recuo)
      // -----------------------------------------------------------------------
      else if (e.kind === "redSkeleton") {
        if (e.state === "retreat") {
          e.vx = -e.facing * 120;
          if (e.grounded && e.vy >= 0) {
            e.state = "slash";
            e.attackVariant = 1;
            setEnemyFsmState(e, "WINDUP", 0.14);
            e.wind = 0.14;
            e.cd = 0.75;
          }
        } else if (dist <= 60 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0) {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            e.attackVariant = 0;
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.state = "slash";
            e.wind = cfg.windupDuration;
            e.cd = cfg.attackCooldown;
          }
        } else if (dist <= 400 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0) {
          if (!canEnemyAttack(e)) {
            e.cd = 0.22;
          } else {
            e.cd = 0.95;
            e.attackVariant = 1;
            setEnemyFsmState(e, "WINDUP", 0.26);
            e.state = "slash";
            e.wind = 0.26;
          }
        }

        if (e.state !== "retreat") {
          if (e.wind > 0) {
            e.wind -= dt;
            e.vx = e.attackVariant === 0 && e.wind <= 0.12 && dist > (e.w + player.w) / 2 + 2 ? e.facing * 75 : 0;
            if (e.wind <= 0) {
              if (e.attackVariant === 0) {
                setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
                e.state = "slash";
              } else {
                fire({
                  x: e.x + (e.facing > 0 ? e.w : -12),
                  y: e.y + 10,
                  w: 14,
                  h: 14,
                  vx: e.facing * (125 + Math.random() * 20),
                  vy: -175,
                  gravity: 370,
                  life: 2.2,
                  dmg: 1,
                  friendly: false,
                  sprite: "spell",
                });
                fire({
                  x: e.x + (e.facing > 0 ? e.w : -12),
                  y: e.y + 16,
                  w: 14,
                  h: 14,
                  vx: e.facing * (160 + Math.random() * 25),
                  vy: -75,
                  gravity: 200,
                  life: 2.0,
                  dmg: 1,
                  friendly: false,
                  sprite: "spell",
                });
                e.state = "idle";
                e.postAttackT = postPauseDur;
                setEnemyFsmState(e, "RECOVERY", postPauseDur);
              }
            }
          } else if ((e.activeTimer ?? 0) > 0) {
            e.vx = 0;
            e.state = "slash";
            const box = {
              x: e.facing > 0 ? e.x + e.w - 6 : e.x - 48,
              y: e.y + 8,
              w: 52,
              h: 38,
            };
            if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
              e.hitPlayerThisAttack = true;
              hurtPlayer(2, e.x, "slash");
            }
            if ((e.activeTimer ?? 0) <= dt) {
              e.state = "idle";
              e.postAttackT = postPauseDur;
              setEnemyFsmState(e, "RECOVERY", postPauseDur);
            }
          } else {
            if (e.fsmState !== "DEFEND") e.state = "idle";
            e.vx = getTacticalMoveVx(e, dist, dx, 68, (e.w + player.w) / 2 + 4);
          }
        }
      }
      // -----------------------------------------------------------------------
      // C. SKELETON (Classe 1: Guerreiro Esqueleto — Recuo Tático & Salva de Ossos)
      // -----------------------------------------------------------------------
      else if (e.kind === "skeleton") {
        if (dist <= 52 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "retreat") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            e.attackVariant = 2; // melee stab
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.state = "slash";
            e.wind = cfg.windupDuration;
            e.cd = 0.58;
          }
        } else if (dist < 82 && e.grounded && e.cd <= 0.20 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "slash" && e.state !== "retreat") {
          setEnemyFsmState(e, "RETREAT", 0.30);
          e.state = "retreat";
          e.vy = -130;
          e.vx = -e.facing * 115;
          e.cd = 0.45;
        } else if (dist <= 390 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "retreat") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.22;
          } else {
            e.attackVariant = ((e.attackVariant ?? 0) + 1) % 2;
            setEnemyFsmState(e, "WINDUP", 0.26);
            e.state = "slash";
            e.wind = 0.26;
            e.cd = e.attackVariant === 0 ? 0.82 : 0.72;
          }
        }

        if (e.state === "retreat") {
          e.vx = -e.facing * 110;
          if (e.grounded && e.vy >= 0) {
            // Immediately counter-fire a skimming bone upon landing from backflip!
            e.attackVariant = 1;
            setEnemyFsmState(e, "WINDUP", 0.14);
            e.state = "slash";
            e.wind = 0.14;
            e.cd = 0.65;
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.attackVariant === 2 && e.wind <= 0.12 && dist > (e.w + player.w) / 2 + 2 ? e.facing * 65 : 0;
          if (e.wind <= 0) {
            if (e.attackVariant === 2) {
              setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
              e.state = "slash";
            } else {
              if (e.attackVariant === 0) {
                fire({
                  x: e.x + (e.facing > 0 ? e.w : -12),
                  y: e.y + 10,
                  w: 14,
                  h: 14,
                  vx: e.facing * (105 + Math.random() * 25),
                  vy: -175,
                  gravity: 360,
                  life: 2.1,
                  dmg: 1,
                  friendly: false,
                  sprite: "spell",
                });
              } else {
                fire({
                  x: e.x + (e.facing > 0 ? e.w : -12),
                  y: e.y + 14,
                  w: 14,
                  h: 14,
                  vx: e.facing * 180,
                  vy: -35,
                  gravity: 110,
                  life: 1.8,
                  dmg: 1,
                  friendly: false,
                  sprite: "spell",
                });
              }
              e.state = "idle";
              e.postAttackT = postPauseDur;
              setEnemyFsmState(e, "RECOVERY", postPauseDur);
            }
          }
        } else if ((e.activeTimer ?? 0) > 0) {
          e.vx = 0;
          e.state = "slash";
          const box = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 42,
            y: e.y + 8,
            w: 46,
            h: 36,
          };
          if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(1, e.x, "slash");
          }
          if ((e.activeTimer ?? 0) <= dt) {
            e.state = "idle";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else {
          if (e.fsmState !== "DEFEND") e.state = "idle";
          e.vx = getTacticalMoveVx(e, dist, dx, 55, (e.w + player.w) / 2 + 4);
        }
      }
      // -----------------------------------------------------------------------
      // D. KNIGHT (Classe 3: Guerreiro Pesado — Alta Postura, Golpes Pesados Quebra-Guarda & Recuperação Longa)
      // -----------------------------------------------------------------------
      else if (e.kind === "knight") {
        if (dist > 78 && dist < 260 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.grounded && e.state !== "charge") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.20;
          } else {
            e.state = "charge";
            e.hitPlayerThisAttack = false;
            setEnemyFsmState(e, "ATTACK", 0.68);
            e.wind = 0.68; // Charge duration
            e.cd = 1.45;
            sound.playEnemyAlert("knight");
          }
        } else if (dist <= 66 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "charge") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.wind = cfg.windupDuration; // Telegraphed heavy halberd startup
            e.cd = cfg.attackCooldown;
            e.state = "slash";
          }
        }

        if (e.state === "charge") {
          e.wind -= dt;
          e.vx = dist > (e.w + player.w) / 2 + 2 ? e.facing * 165 : 0;
          const chargeBox = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 38,
            y: e.y + 6,
            w: 46,
            h: 40,
          };
          if (!e.hitPlayerThisAttack && overlap(chargeBox, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(2, e.x, "slash", true); // Heavy attack: crushes passive guard, parriable by Perfect Parry!
            e.wind = 0;
          }
          if (e.wind <= 0) {
            e.state = "shield";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.wind <= 0.12 && dist > (e.w + player.w) / 2 + 2 ? e.facing * 75 : 0;
          if (e.wind <= 0) {
            setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
            e.state = "slash";
          }
        } else if ((e.activeTimer ?? 0) > 0) {
          e.vx = 0;
          e.state = "slash";
          const box = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 54,
            y: e.y + 6,
            w: 58,
            h: 38,
          };
          if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(2, e.x, "slash", true); // Heavy halberd cleave: crushes passive guard, parriable by Perfect Parry!
          }
          if ((e.activeTimer ?? 0) <= dt) {
            e.state = "shield";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else {
          e.state = "shield";
          e.vx = getTacticalMoveVx(e, dist, dx, 54, (e.w + player.w) / 2 + 4);
        }
      }
      // -----------------------------------------------------------------------
      // E. ZOMBIE (Classe 2: Criatura Ágil / Predador — Investida Rápida & Recuo Hit-and-Run)
      // -----------------------------------------------------------------------
      else if (e.kind === "zombie") {
        if (e.state === "retreat") {
          e.vx = -e.facing * 105;
          if (e.grounded && e.vy >= 0) {
            e.state = "idle";
            e.postAttackT = postPauseDur * 0.7;
            setEnemyFsmState(e, "RECOVERY", postPauseDur * 0.7);
          }
        } else if (dist >= 62 && dist <= 145 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.grounded && e.state !== "leap") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            e.state = "leap";
            e.hitPlayerThisAttack = false;
            setEnemyFsmState(e, "ATTACK", 0.28);
            e.vy = -140;
            e.vx = e.facing * 140;
            e.wind = 0.28;
            e.cd = 0.95;
            sound.playEnemyAlert("zombie");
          }
        } else if (dist <= 52 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "leap") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.16;
          } else {
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.wind = cfg.windupDuration; // Fast ravenous claw swipe
            e.cd = cfg.attackCooldown;
            e.state = "slash";
          }
        }

        if (e.state === "leap") {
          e.vx = dist > (e.w + player.w) / 2 + 2 ? e.facing * 135 : 0;
          const clawBox = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 36,
            y: e.y + 8,
            w: 40,
            h: 38,
          };
          if (!e.hitPlayerThisAttack && overlap(clawBox, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(1, e.x, "slash");
          }
          if (e.grounded && e.vy >= 0) {
            e.state = "idle";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else if (e.state !== "retreat") {
          if (e.wind > 0) {
            e.wind -= dt;
            const minStop = (e.w + player.w) / 2 + 2;
            e.vx = e.wind <= 0.12 && dist > minStop ? e.facing * 70 : 0;
            if (e.wind <= 0) {
              setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
              e.state = "slash";
            }
          } else if ((e.activeTimer ?? 0) > 0) {
            e.vx = 0;
            e.state = "slash";
            const box = {
              x: e.facing > 0 ? e.x + e.w - 6 : e.x - 40,
              y: e.y + 8,
              w: 44,
              h: 38,
            };
            if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
              e.hitPlayerThisAttack = true;
              hurtPlayer(1, e.x, "slash");
            }
            if ((e.activeTimer ?? 0) <= dt) {
              // Classe 2 (Predador Ágil): Recuo automático Hit-and-Run após atacar!
              if (e.grounded && Math.random() < 0.65) {
                setEnemyFsmState(e, "RETREAT", 0.24);
                e.state = "retreat";
                e.vy = -90;
                e.vx = -e.facing * 105;
              } else {
                e.state = "idle";
                e.postAttackT = postPauseDur;
                setEnemyFsmState(e, "RECOVERY", postPauseDur);
              }
            }
          } else {
            e.state = "idle";
            const sprintSpeed = dist < 220 ? 94 : 52;
            e.vx = getTacticalMoveVx(e, dist, dx, sprintSpeed, (e.w + player.w) / 2 + 3);
          }
        }
      }
      // -----------------------------------------------------------------------
      // F. VAMPIRE (Classe 2: Criatura Ágil / Predador — Garra Sombria, Hit-and-Run & Orbes de Sangue)
      // -----------------------------------------------------------------------
      else if (e.kind === "vampire") {
        if (e.state === "retreat") {
          e.vx = -e.facing * 130;
          if (e.grounded && e.vy >= 0) {
            e.state = "idle";
            e.postAttackT = postPauseDur * 0.7;
            setEnemyFsmState(e, "RECOVERY", postPauseDur * 0.7);
          }
        } else if (dist <= 62 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0) {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            e.attackVariant = 0; // Melee shadow claw
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.wind = cfg.windupDuration;
            e.cd = cfg.attackCooldown;
            e.state = "slash";
            sound.playEnemyAlert("vampire");
          }
        } else if (dist > 62 && dist <= 390 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0) {
          if (!canEnemyAttack(e)) {
            e.cd = 0.20;
          } else {
            e.attackVariant = 1; // Ranged blood orb
            setEnemyFsmState(e, "WINDUP", 0.26);
            e.state = "slash";
            e.wind = 0.26;
            e.cd = 0.88;
          }
        }

        if (e.state !== "retreat") {
          if (e.wind > 0) {
            e.wind -= dt;
            const minStop = (e.w + player.w) / 2 + 2;
            e.vx = e.attackVariant === 0 && e.wind <= 0.12 && dist > minStop ? e.facing * 95 : 0;
            if (e.wind <= 0) {
              if (e.attackVariant === 0 && dist <= 76) {
                setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
                e.state = "slash";
              } else {
                fire({
                  x: e.x,
                  y: e.y + e.h - 60,
                  w: 16,
                  h: 28,
                  vx: e.facing * 165,
                  vy: 4,
                  life: 1.6,
                  dmg: 1,
                  friendly: false,
                  sprite: "blood",
                  drawCenterY: e.y + e.h - 54,
                });
                e.state = "idle";
                e.postAttackT = postPauseDur;
                setEnemyFsmState(e, "RECOVERY", postPauseDur);
              }
            }
          } else if ((e.activeTimer ?? 0) > 0) {
            e.vx = 0;
            e.state = "slash";
            const box = {
              x: e.facing > 0 ? e.x + e.w - 6 : e.x - 48,
              y: e.y + 8,
              w: 52,
              h: 38,
            };
            if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
              e.hitPlayerThisAttack = true;
              hurtPlayer(2, e.x, "slash");
            }
            if ((e.activeTimer ?? 0) <= dt) {
              // Classe 2 (Predador Ágil): Recua automaticamente após atacar (Hit-and-Run)!
              if (e.grounded && Math.random() < 0.72) {
                setEnemyFsmState(e, "RETREAT", 0.24);
                e.state = "retreat";
                e.vy = -105;
                e.vx = -e.facing * 130;
              } else {
                e.state = "idle";
                e.postAttackT = postPauseDur;
                setEnemyFsmState(e, "RECOVERY", postPauseDur);
              }
            }
          } else {
            e.state = "idle";
            e.vx = getTacticalMoveVx(e, dist, dx, 92, (e.w + player.w) / 2 + 4);
          }
        }
      }
      // -----------------------------------------------------------------------
      // G. GARGOYLE (Classe 4: Criatura Aérea — Controle de Altitude, Mergulho & Vulnerabilidade Pós-Mergulho)
      // -----------------------------------------------------------------------
      else {
        // Red Arremer Evasion: If player attacks nearby OR gets too close on ground, demon leap into air!
        const playerThreat = (player.attackT > 0 && dist < 115) || (dist < 85 && e.cd <= 0.15);
        if (playerThreat && e.grounded && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state !== "leap" && e.state !== "hover" && e.state !== "dive") {
          setEnemyFsmState(e, "DODGE", 0.25);
          e.state = "leap";
          e.vy = -230;
          e.vx = -e.facing * 80;
          e.cd = 0.25;
          sound.playSfx("jump");
        } else if (dist <= 58 && e.cd <= 0 && (e.postAttackT ?? 0) <= 0 && e.wind <= 0 && (e.activeTimer ?? 0) <= 0 && e.state === "idle") {
          if (!canEnemyAttack(e)) {
            e.cd = 0.18;
          } else {
            setEnemyFsmState(e, "WINDUP", cfg.windupDuration);
            e.wind = cfg.windupDuration;
            e.cd = cfg.attackCooldown;
            e.state = "slash";
          }
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
          e.vx = Math.sign(dx) * 42; // Drifts towards player
          e.facing = dx >= 0 ? 1 : -1;

          // Spit hellfire orb
          if ((e.hoverT ?? 0) >= 0.28 && !e.fired) {
            e.fired = true;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -14),
              y: e.y + 16,
              w: 16,
              h: 16,
              vx: e.facing * 175,
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
          if ((e.hoverT ?? 0) >= 0.70) {
            e.state = "dive";
            e.hitPlayerThisAttack = false;
            setEnemyFsmState(e, "ATTACK", 0.45);
            e.vx = Math.sign(dx) * 185;
            e.vy = 265;
            sound.playEnemyAlert("gargoyle");
          }
        } else if (e.state === "dive") {
          // Swooping dive-bomb claw attack
          e.vx = Math.sign(dx) * 185;
          e.vy = 265;
          // Claw attack hitbox during dive (single-hit per dive!)
          const diveBox = {
            x: e.x - 4,
            y: e.y,
            w: e.w + 8,
            h: e.h + 6,
          };
          if (!e.hitPlayerThisAttack && overlap(diveBox, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(2, e.x, "slash");
          }
          if (e.grounded) {
            // Slam into stone floor with screenshake & post-dive vulnerability window!
            e.state = "idle";
            e.cd = 0.56;
            e.postAttackT = postPauseDur * 1.25;
            setEnemyFsmState(e, "RECOVERY", postPauseDur * 1.25);
            e.vx = 0;
            shake = Math.max(shake, 3.5);
            sound.playSfx("slashHeavy");
          }
        } else if (e.wind > 0) {
          e.wind -= dt;
          const minStop = (e.w + player.w) / 2 + 2;
          e.vx = e.wind <= 0.12 && dist > minStop ? e.facing * 80 : 0;
          if (e.wind <= 0) {
            setEnemyFsmState(e, "ATTACK", cfg.activeDuration);
            e.state = "slash";
          }
        } else if ((e.activeTimer ?? 0) > 0) {
          e.vx = 0;
          e.state = "slash";
          const box = {
            x: e.facing > 0 ? e.x + e.w - 6 : e.x - 46,
            y: e.y + 8,
            w: 50,
            h: 38,
          };
          if (!e.hitPlayerThisAttack && overlap(box, getPlayerHurtbox(player))) {
            e.hitPlayerThisAttack = true;
            hurtPlayer(2, e.x, "slash"); // Stone claw swipe deals 2 DMG
          }
          if ((e.activeTimer ?? 0) <= dt) {
            e.state = "idle";
            e.postAttackT = postPauseDur;
            setEnemyFsmState(e, "RECOVERY", postPauseDur);
          }
        } else {
          e.state = "idle";
          e.vx = getTacticalMoveVx(e, dist, dx, 70, (e.w + player.w) / 2 + 4);
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

    // Aerial Bat dive attack check (ground body separation is handled centrally by resolveCombatBodyCollisions)
    if (!e.dead && !e.dying && e.kind === "bat" && !player.dead && !player.dying) {
      const pCenterX = player.x + player.w / 2;
      const eCenterX = e.x + e.w / 2;
      const horizDist = Math.abs(pCenterX - eCenterX);
      const minHorizDist = (e.w + player.w) / 2;
      const headTop = player.y;

      const nearHeadHoriz = horizDist <= minHorizDist + 6;
      const nearHeadVert = e.y + e.h >= headTop - 6 && e.y <= headTop + 14;

      if (nearHeadHoriz && nearHeadVert) {
        if (e.cd <= 0 && e.hurt <= 0) {
          hurtPlayer(1, eCenterX, "slash");
          sound.playSfx("slice");
          shake = Math.max(shake, 1.5);
          e.cd = 0.95;
          e.vy = -160;
          e.vx = -e.facing * 75;
        }
      }
    }
  }

  // ===========================================================================
  // ETAPA 2: Arco branco do combo reaproveitando a arte ORIGINAL do heroAttack (frame 1).
  // O arco branco está desenhado dentro do próprio frame 1, então separamos seus pixels
  // em uma camada própria (uma única vez, em cache) para:
  //  - Golpe 2: espelhar SOMENTE o arco verticalmente (scaleY = -1), mantendo o corpo intacto
  //  - Golpe 3: sobrepor o mesmo arco na pose do ataque aéreo (heroJump)
  // Nenhuma arte nova é criada: os pixels são exatamente os do sprite original.
  // ===========================================================================
  let comboArcSheets: {
    bodyOnly: HTMLCanvasElement;
    arcOnly: HTMLCanvasElement;
    arcFlipped: HTMLCanvasElement;
    flipped: HTMLCanvasElement;
  } | null = null;
  let comboArcSheetsFailed = false;

  function getComboArcSheets() {
    if (comboArcSheets || comboArcSheetsFailed) return comboArcSheets;
    const img = art.heroAttack;
    if (!img || !img.complete || img.naturalWidth <= 0) return null;
    try {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const cw = Math.floor(W / 3);
      const ch = Math.floor(H / 2);
      const k = cw / 320; // escala relativa à célula de referência 320x320
      const cellX = cw; // frame 1 = coluna 1, linha 0

      const src = document.createElement("canvas");
      src.width = cw;
      src.height = ch;
      const sctx = src.getContext("2d");
      if (!sctx) throw new Error("no ctx");
      sctx.drawImage(img, cellX, 0, cw, ch, 0, 0, cw, ch);
      const data = sctx.getImageData(0, 0, cw, ch);
      const body = sctx.createImageData(cw, ch);
      const arc = sctx.createImageData(cw, ch);

      const yTop = 100 * k;
      const yBot = 235 * k;
      const xMain = 186 * k; // à direita disso (entre yTop e yBot) só existe o arco
      const xTail = 160 * k; // cauda inferior do arco cruza a frente da perna
      const yTail = 196 * k;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          const r = data.data[i];
          const gg = data.data[i + 1];
          const b = data.data[i + 2];
          const a = data.data[i + 3];
          let isArc = false;
          const lum = (r + gg + b) / 3;
          const arcColor = lum > 95 && gg > 75 && (r - gg) < 60;
          if (a > 0 && y >= yTop && y <= yBot) {
            if (x >= xMain) {
              isArc = true;
            } else if (y >= yTail && x >= 70 * k) {
              isArc = arcColor;
            } else if (x >= 168 * k && y >= 103 * k && y <= 135 * k) {
              isArc = arcColor;
            }
          }
          const dst = isArc ? arc : body;
          dst.data[i] = r;
          dst.data[i + 1] = gg;
          dst.data[i + 2] = b;
          dst.data[i + 3] = a;
        }
      }

      const bodyCv = document.createElement("canvas");
      bodyCv.width = cw;
      bodyCv.height = ch;
      bodyCv.getContext("2d")!.putImageData(body, 0, 0);
      const arcCv = document.createElement("canvas");
      arcCv.width = cw;
      arcCv.height = ch;
      arcCv.getContext("2d")!.putImageData(arc, 0, 0);

      // Folha contendo apenas o corpo de Aldric no frame 1 (sem o arco branco):
      const bodyOnly = document.createElement("canvas");
      bodyOnly.width = W;
      bodyOnly.height = H;
      const bctx = bodyOnly.getContext("2d")!;
      bctx.imageSmoothingEnabled = false;
      bctx.drawImage(img, 0, 0);
      bctx.clearRect(cellX, 0, cw, ch);
      bctx.drawImage(bodyCv, cellX, 0);

      // Folha com o frame 1 tendo apenas o arco espelhado verticalmente (Golpe 2)
      const flipped = document.createElement("canvas");
      flipped.width = W;
      flipped.height = H;
      const fctx = flipped.getContext("2d")!;
      fctx.imageSmoothingEnabled = false;
      fctx.drawImage(img, 0, 0);
      fctx.clearRect(cellX, 0, cw, ch);
      fctx.drawImage(bodyCv, cellX, 0);
      const axis = (yTop + yBot) / 2;
      fctx.save();
      fctx.translate(0, axis * 2);
      fctx.scale(1, -1);
      fctx.drawImage(arcCv, cellX, 0);
      fctx.restore();

      // Folha contendo apenas o arco no frame 1 (sobreposição dos Golpes 1 e 3)
      const arcOnly = document.createElement("canvas");
      arcOnly.width = W;
      arcOnly.height = H;
      const actx = arcOnly.getContext("2d")!;
      actx.imageSmoothingEnabled = false;
      actx.drawImage(arcCv, cellX, 0);

      // Folha contendo apenas o arco invertido verticalmente em torno do seu centro
      const arcFlipped = document.createElement("canvas");
      arcFlipped.width = W;
      arcFlipped.height = H;
      const afctx = arcFlipped.getContext("2d")!;
      afctx.imageSmoothingEnabled = false;
      afctx.save();
      afctx.translate(0, axis * 2);
      afctx.scale(1, -1);
      afctx.drawImage(arcCv, cellX, 0);
      afctx.restore();

      comboArcSheets = { bodyOnly, arcOnly, arcFlipped, flipped };
    } catch {
      comboArcSheetsFailed = true; // fallback: usa o sprite original sem espelhar
    }
    return comboArcSheets;
  }

  function blit(img: HTMLImageElement | HTMLCanvasElement | undefined, frame: number, cx: number, feet: number, height: number, facing: number, cols = 2) {
    const ready = !!img && ("naturalWidth" in img ? img.complete && img.naturalWidth > 0 : img.width > 0);
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

  const filteredPropCache = new Map<string, HTMLCanvasElement>();

  function getFilteredProp(img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement {
    if (!img || !img.complete || img.naturalWidth <= 0) return img;
    const key = img.src || img.currentSrc;
    if (key && filteredPropCache.has(key)) {
      return filteredPropCache.get(key)!;
    }
    try {
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const offCtx = off.getContext("2d");
      if (offCtx) {
        offCtx.filter = "brightness(0.65) contrast(1.12) saturate(0.75)";
        offCtx.drawImage(img, 0, 0);
        if (key) filteredPropCache.set(key, off);
        return off;
      }
    } catch {
      // fallback
    }
    return img;
  }

  function blitStill(
    img: HTMLImageElement | undefined,
    cx: number,
    feet: number,
    height: number,
    facing = 1
  ) {
    if (!img || !img.complete || img.naturalWidth <= 0) return;
    const sx = Math.round(cx - camX);
    const dw = height * (img.naturalWidth / img.naturalHeight);
    // Viewport Frustum Culling
    if (sx + dw / 2 < -32 || sx - dw / 2 > T.viewW + 32) return;
    const sy = Math.round(feet - camY);
    if (sy - height > T.viewH + 32 || sy < -32) return;

    const isNewGothicProp =
      img === propsArt.chamberArch ||
      img === propsArt.chandelier ||
      img === propsArt.gargoyleStatue ||
      img === propsArt.stainedGlassWindow ||
      img === propsArt.stonePlatform ||
      img === propsArt.gothicStairsUp ||
      img === propsArt.gothicStairsDown;

    const source = isNewGothicProp ? img : getFilteredProp(img);

    g.save();
    g.translate(sx, sy);
    if (facing !== 1) {
      g.scale(facing, 1);
    }
    g.drawImage(source, -dw / 2, -height, dw, height);
    g.restore();
  }

  function drawSlashArc(
    arcImg: HTMLImageElement | HTMLCanvasElement | undefined,
    cx: number,
    feet: number,
    facing: number,
    rotDeg: number,
    scaleX: number,
    scaleY: number,
    offsetX = 0,
    offsetY = 0,
    height = DRAW_H.hero,
    glow = false
  ) {
    if (!arcImg) return;
    const ready = "naturalWidth" in arcImg ? arcImg.complete && arcImg.naturalWidth > 0 : arcImg.width > 0;
    if (!ready) return;

    const cols = 3;
    const sw = arcImg.width / cols;
    const sh = arcImg.height / 2;
    const col = 1;
    const row = 0;
    const dw = height * (sw / sh);

    g.save();
    const pivotX = Math.round(cx - camX + offsetX * facing);
    const pivotY = Math.round(feet - camY - height * 0.48 + offsetY);
    g.translate(pivotX, pivotY);
    g.scale(facing, 1);
    if (rotDeg !== 0) {
      g.rotate((rotDeg * Math.PI) / 180);
    }
    if (scaleX !== 1 || scaleY !== 1) {
      g.scale(scaleX, scaleY);
    }

    if (glow) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.shadowColor = "#ffffff";
      g.shadowBlur = 12;
      g.drawImage(arcImg, col * sw, row * sh, sw, sh, -dw / 2, -height * 0.52, dw, height);
      g.restore();
    }

    g.drawImage(arcImg, col * sw, row * sh, sw, sh, -dw / 2, -height * 0.52, dw, height);
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

  function drawParticle(p: AmbientParticle, px: number, py: number) {
    if (p.alpha <= 0.01) return;

    if (p.isAmbient) {
      // Partícula de ambiente super discreta (micro-poeira ou fagulha distante, 1.5px a 2.8px)
      const a = Math.min(0.32, Math.max(0.12, p.alpha * (0.65 + 0.35 * Math.sin(p.pulse ?? 0))));
      const r = Math.max(1, Math.min(2.8, p.size));
      g.save();
      g.fillStyle = p.color;
      g.globalAlpha = a;
      g.beginPath();
      g.arc(px, py, r, 0, Math.PI * 2);
      g.fill();
      g.restore();
      return;
    }

    // Destroços dos mortos e fragmentos de combate: pequenos estilhaços nítidos / losangos (2px a 4.5px)
    const s = Math.max(1.8, Math.min(4.5, p.size));
    const a = Math.min(0.85, Math.max(0.35, p.alpha));
    const hs = s * 0.55;

    g.save();
    g.translate(px, py);
    if (p.rot !== undefined) {
      g.rotate(p.rot);
    } else {
      g.rotate(0.785); // 45 graus
    }
    g.fillStyle = p.color;
    g.globalAlpha = a;

    // Losango nítido / fragmento irregular (sem borrões gigantes nem quadrados chapados)
    g.beginPath();
    g.moveTo(0, -s);
    g.lineTo(hs, 0);
    g.lineTo(0, s);
    g.lineTo(-hs, 0);
    g.closePath();
    g.fill();

    // Micro-brilho especular central em faíscas maiores
    if (s >= 2.5 && a > 0.45) {
      g.fillStyle = "rgba(255, 255, 255, 0.4)";
      g.fillRect(-0.5, -0.5, 1, 1);
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

    // Midground Ambient Dust Particles (depth === "mid", scrolling at 0.7x)
    for (const p of particles) {
      if (!p.isAmbient || p.depth !== "mid") continue;
      const px = Math.round(p.x - camX * 0.7);
      const py = Math.round(p.y - camY * 0.7);
      if (px < -15 || px > T.viewW + 15 || py < -15 || py > T.viewH + 15) continue;
      drawParticle(p, px, py);
    }

    // Background Architectural Props (Recessed Colossal Gladiator Statues, Arches, Stained Glass)
    for (const prop of getActiveProps()) {
      if (prop.kind === "gothicStairsUp" || prop.kind === "gothicStairsDown") continue;
      if (prop.layer === "bg") {
        const h = PROP_H[prop.kind] ?? 120;
        const isWallOrCeiling =
          prop.kind === "chandelier" ||
          prop.kind === "stainedGlassWindow" ||
          prop.kind === "stainedGlass" ||
          prop.kind === "hangingColumn" ||
          prop.kind === "chains" ||
          prop.kind === "sconceBlue";

        let feetY = prop.y;
        if (!isWallOrCeiling) {
          const ground = findFloorFor(prop.x, prop.y);
          if (Math.abs(prop.y - ground) <= 24 || prop.y >= GROUND_Y - 10) {
            feetY = ground;
          }
        } else if (prop.kind === "chandelier" || prop.kind === "hangingColumn" || prop.kind === "chains") {
          feetY = prop.y + h;
        }
        blitStill(propsArt[prop.kind], prop.x, feetY, h);
      }
    }

    // Terrain Segments (Gothic Stairs & Continuous Elevated Foundations)
    if (level.terrainSegments && level.terrainSegments.length > 0) {
      for (const seg of level.terrainSegments) {
        const sx = Math.round(seg.xStart - camX);
        const sw = seg.xEnd - seg.xStart;
        if (sx + sw < -20 || sx > T.viewW + 20) continue;

        const syStart = Math.round(seg.yStart - camY);
        const syEnd = Math.round(seg.yEnd - camY);
        const syTop = Math.min(syStart, syEnd);
        const syBottom = Math.max(syStart, syEnd);

        if (seg.type === "stairs_up") {
          // Foundation masonry fill below stair slope down to screen bottom
          g.fillStyle = "#100e18";
          g.beginPath();
          g.moveTo(sx, syStart);
          g.lineTo(sx + sw, syEnd);
          g.lineTo(sx + sw, T.viewH + 40);
          g.lineTo(sx, T.viewH + 40);
          g.closePath();
          g.fill();

          // Subtle horizontal mortar grooves in foundation
          g.fillStyle = "rgba(22, 18, 32, 0.6)";
          for (let yLine = syBottom + 12; yLine < T.viewH + 40; yLine += 14) {
            g.fillRect(sx, yLine, sw, 1);
          }

          // Gothic Stairs Up Sprite (rendered directly for maximum performance and zero flicker)
          const stairsImg = propsArt.gothicStairsUp;
          if (stairsImg && stairsImg.complete && stairsImg.naturalWidth > 0) {
            g.drawImage(stairsImg, sx, syTop - 6, sw, (syBottom - syTop) + 26);
          } else {
            // Procedural stepped stones fallback
            const numSteps = Math.max(4, Math.round(sw / 22));
            const stepW = sw / numSteps;
            const stepH = (syBottom - syTop) / numSteps;
            for (let i = 0; i < numSteps; i++) {
              const stepX = sx + i * stepW;
              const stepY = syStart - i * stepH;
              g.fillStyle = "#221d30";
              g.fillRect(stepX, stepY, stepW + 1, stepH + 40);
              g.fillStyle = "rgba(180, 195, 235, 0.35)";
              g.fillRect(stepX, stepY, stepW, 1);
            }
          }
        } else if (seg.type === "stairs_down") {
          // Foundation masonry fill below slope
          g.fillStyle = "#100e18";
          g.beginPath();
          g.moveTo(sx, syStart);
          g.lineTo(sx + sw, syEnd);
          g.lineTo(sx + sw, T.viewH + 40);
          g.lineTo(sx, T.viewH + 40);
          g.closePath();
          g.fill();

          // Horizontal mortar lines
          g.fillStyle = "rgba(22, 18, 32, 0.6)";
          for (let yLine = syBottom + 12; yLine < T.viewH + 40; yLine += 14) {
            g.fillRect(sx, yLine, sw, 1);
          }

          // Gothic Stairs Down Sprite (rendered directly)
          const stairsImg = propsArt.gothicStairsDown;
          if (stairsImg && stairsImg.complete && stairsImg.naturalWidth > 0) {
            g.drawImage(stairsImg, sx, syTop - 6, sw, (syBottom - syTop) + 26);
          } else {
            // Procedural stepped stones fallback
            const numSteps = Math.max(4, Math.round(sw / 22));
            const stepW = sw / numSteps;
            const stepH = (syBottom - syTop) / numSteps;
            for (let i = 0; i < numSteps; i++) {
              const stepX = sx + i * stepW;
              const stepY = syStart + i * stepH;
              g.fillStyle = "#221d30";
              g.fillRect(stepX, stepY, stepW + 1, stepH + 40);
              g.fillStyle = "rgba(180, 195, 235, 0.35)";
              g.fillRect(stepX, stepY, stepW, 1);
            }
          }
        } else if (seg.type === "upper_hall") {
          // Elevated Upper Hall subterranean foundation masonry down to screen bottom
          // (The floor surface itself is rendered by getActiveSolids to prevent duplicate draw calls)
          g.fillStyle = "#100e18";
          g.fillRect(sx, syStart + 16, sw, T.viewH + 40 - (syStart + 16));

          g.fillStyle = "rgba(20, 16, 28, 0.7)";
          for (let yLine = syStart + 18; yLine < T.viewH + 40; yLine += 14) {
            g.fillRect(sx, yLine, sw, 1);
          }
        } else if (seg.type === "crypt") {
          // Sunken Crypt subterranean foundation down to screen bottom
          g.fillStyle = "#0c0a14";
          g.fillRect(sx, syStart + 16, sw, T.viewH + 40 - (syStart + 16));
        }
      }
    }

    for (const s of getActiveSolids()) {
      const sx = Math.round(s.x - camX);
      const sy = Math.round(s.y - camY);
      if (sx > T.viewW + 12 || sx + s.w < -12 || sy > T.viewH + 12 || sy + s.h < -12) continue;

      if (s.oneWay) {
        // Render with stone-platform.png if loaded, otherwise fallback to procedural stone blocks
        const platImg = propsArt.stonePlatform;
        const platH = 26;
        if (platImg && platImg.complete && platImg.naturalWidth > 0) {
          // 1. Soft Ambient Drop Shadow beneath the platform
          const shadowGrad = g.createLinearGradient(0, sy + 12, 0, sy + 28);
          shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
          shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.fillStyle = shadowGrad;
          g.fillRect(sx - 3, sy + 12, s.w + 6, 16);

          // 2. Stone Platform Sprite (rendered directly, crisp and flicker-free)
          g.drawImage(platImg, sx, sy - 2, s.w, platH);
          continue;
        }

        // 1. Soft Ambient Drop Shadow beneath the platform
        const shadowGrad = g.createLinearGradient(0, sy + platH, 0, sy + platH + 18);
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        g.fillStyle = shadowGrad;
        g.fillRect(sx - 3, sy + platH, s.w + 6, 18);

        // 2. Gothic Architectural Stone Corbels & Arches beneath the platform
        const corbelW = 8;
        const corbelH = 9;
        const corbelPoints: number[] = [sx + 2];
        if (s.w >= 36) corbelPoints.push(sx + s.w - corbelW - 2);
        if (s.w >= 80) {
          const step = (s.w - 24) / Math.floor((s.w - 24) / 40);
          for (let nx = 20; nx <= s.w - 28; nx += step) {
            corbelPoints.push(Math.round(sx + nx));
          }
        }
        corbelPoints.sort((a, b) => a - b);

        // Gothic shallow arches between corbel brackets
        for (let ci = 0; ci < corbelPoints.length - 1; ci++) {
          const c1 = corbelPoints[ci] + corbelW;
          const c2 = corbelPoints[ci + 1];
          if (c2 - c1 > 10) {
            const archMid = (c1 + c2) / 2;
            g.fillStyle = "rgba(10, 8, 16, 0.9)";
            g.beginPath();
            g.moveTo(c1, sy + platH);
            g.quadraticCurveTo(archMid, sy + platH + 5, c2, sy + platH);
            g.lineTo(c2, sy + platH + 2);
            g.quadraticCurveTo(archMid, sy + platH + 7, c1, sy + platH + 2);
            g.closePath();
            g.fill();
          }
        }

        // Corbels (mísulas de pedra talhada)
        for (const cx of corbelPoints) {
          // Dark bracket shadow
          g.fillStyle = "#0a0812";
          g.fillRect(cx - 1, sy + platH, corbelW + 2, corbelH + 1);
          // Main corbel stone body
          g.fillStyle = "#1e1a2b";
          g.fillRect(cx, sy + platH, corbelW, 4);
          g.fillStyle = "#252035";
          g.fillRect(cx + 1, sy + platH + 4, corbelW - 2, 3);
          g.fillStyle = "#161320";
          g.fillRect(cx + 2, sy + platH + 7, corbelW - 4, 2);
          // Highlight on corbel left edge
          g.fillStyle = "rgba(150, 170, 220, 0.25)";
          g.fillRect(cx, sy + platH, 1, 4);
          g.fillRect(cx + 1, sy + platH + 4, 1, 3);
        }

        // Hanging dark purple creepers/vines beneath platform
        const vineSeed = Math.abs(Math.sin(s.x * 12.9898 + s.y * 78.233));
        const numVines = Math.max(1, Math.floor(s.w / 45));
        for (let vi = 0; vi < numVines; vi++) {
          const vOffset = 14 + (vi * (s.w - 28)) / numVines + ((vineSeed * 37 + vi * 17) % 8);
          const vx = sx + Math.round(vOffset);
          const vLen = 6 + Math.round(((vineSeed * 53 + vi * 23) % 9));
          // Stem
          g.strokeStyle = "#1e1328";
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(vx, sy + platH);
          g.quadraticCurveTo(vx + ((vi % 2 === 0) ? 2 : -2), sy + platH + vLen * 0.5, vx + ((vi % 2 === 0) ? 1 : -1), sy + platH + vLen);
          g.stroke();
          // Small purple leafy clusters
          g.fillStyle = "rgba(75, 40, 95, 0.85)";
          g.fillRect(vx - 1, sy + platH + vLen - 2, 3, 2);
          g.fillStyle = "rgba(100, 50, 125, 0.65)";
          g.fillRect(vx, sy + platH + vLen, 2, 2);
        }

        // 3. Divided Carved Stone Blocks (#1c1926 to #282436 with dark joints #0d0b14)
        const blockTones = ["#1c1926", "#242032", "#282436", "#201c2b"];
        let curX = 0;
        let blockIdx = 0;
        while (curX < s.w) {
          const bw = Math.min(s.w - curX, 22 + ((curX * 7 + s.x) % 9));
          const bx = sx + curX;
          const tone = blockTones[(blockIdx + Math.floor(s.x / 40)) % blockTones.length];

          // Stone block fill
          g.fillStyle = tone;
          g.fillRect(bx, sy + 1, bw, platH - 1);

          // Sub-surface weathered gradient (darker near bottom)
          const blockGrad = g.createLinearGradient(0, sy + 1, 0, sy + platH);
          blockGrad.addColorStop(0, "rgba(255, 255, 255, 0.04)");
          blockGrad.addColorStop(0.5, "rgba(0, 0, 0, 0)");
          blockGrad.addColorStop(1, "rgba(8, 6, 14, 0.45)");
          g.fillStyle = blockGrad;
          g.fillRect(bx, sy + 1, bw, platH - 1);

          // Dark mortar joint between blocks
          if (curX > 0) {
            g.fillStyle = "#0d0b14";
            g.fillRect(bx, sy, 1.5, platH);
            // Subtle edge bevel on left side of stone block
            g.fillStyle = "rgba(150, 170, 220, 0.15)";
            g.fillRect(bx + 1.5, sy + 1, 1, platH - 2);
          }

          // Stepped ancient slab surface (broken lunar edge, NOT continuous white line)
          const irreg = (blockIdx % 3 === 1) ? 0.5 : 0;
          g.fillStyle = "rgba(150, 170, 220, 0.35)"; // pale blue/purple lunar glow
          g.fillRect(bx + 1, sy + irreg, bw - 2, 1);
          g.fillStyle = "rgba(180, 195, 235, 0.18)";
          g.fillRect(bx + 2, sy + irreg + 1, bw - 4, 1);

          // Dark shadow groove right under the top slab rim
          g.fillStyle = "#0c0a14";
          g.fillRect(bx, sy + 2, bw, 1);

          curX += bw;
          blockIdx++;
        }

        // Subtle dark bottom rim
        g.fillStyle = "#0a0812";
        g.fillRect(sx, sy + platH - 1, s.w, 1);
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
    for (const prop of getActiveProps()) {
      if (prop.kind === "gothicStairsUp" || prop.kind === "gothicStairsDown") continue;
      if (!prop.layer || prop.layer === "main") {
        const h = PROP_H[prop.kind] ?? 120;
        const isHanging = prop.kind === "hangingColumn" || prop.kind === "chains";
        let feetY = prop.y;
        if (!isHanging) {
          const ground = findFloorFor(prop.x, prop.y);
          if (Math.abs(prop.y - ground) <= 24 || prop.y >= GROUND_Y - 10) {
            feetY = ground;
          }
        } else {
          feetY = prop.y + h;
        }
        blitStill(propsArt[prop.kind], prop.x, feetY, h);
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
    // RENDER GOTHIC SEAL PUZZLES (Realistic Seal Crystal Altars & Gargoyle Portcullis Gates)
    // =========================================================================
    for (const c of sealCrystals) {
      const sx = Math.round(c.x - camX);
      const sy = Math.round(c.y - camY);
      if (sx < -80 || sx > T.viewW + 80) continue;

      const cx = sx + Math.round(c.w / 2);
      const baseBot = sy + c.h;

      // 1. Subtle Atmospheric Beacon Pillar (helps player spot elevated puzzle altars from the floor)
      g.save();
      const beamGrad = g.createLinearGradient(0, baseBot - 90, 0, baseBot);
      if (c.activated) {
        beamGrad.addColorStop(0, "rgba(250, 204, 21, 0)");
        beamGrad.addColorStop(1, "rgba(250, 204, 21, 0.22)");
      } else {
        beamGrad.addColorStop(0, "rgba(255, 23, 68, 0)");
        beamGrad.addColorStop(1, "rgba(255, 23, 68, 0.28)");
      }
      g.fillStyle = beamGrad;
      g.fillRect(cx - 12, baseBot - 90, 24, 90);

      // 2. Realistic Pixel-Art Gothic Seal Crystal Altar Sprite
      const cImg = c.activated ? art.sealCrystalOpen : art.sealCrystal;
      const drawW = 46;
      const drawH = 60;
      const bob = c.activated ? 0 : Math.sin(c.pulseT) * 1.5;
      if (cImg && cImg.complete && cImg.naturalWidth > 0) {
        g.drawImage(cImg, Math.round(cx - drawW / 2), Math.round(baseBot - drawH + bob), drawW, drawH);
      } else {
        g.fillStyle = c.activated ? "#fde047" : "#ff1744";
        g.fillRect(cx - 8, baseBot - 36, 16, 36);
      }

      // 3. Crisp Gothic Label Badge above Altar
      g.font = "bold 7px monospace";
      g.textAlign = "center";
      g.fillStyle = "rgba(9, 9, 11, 0.85)";
      const labelTxt = c.activated ? `${c.label} PURIFICADO` : `${c.label} [GOLPEIE]`;
      const tw = g.measureText(labelTxt).width + 8;
      g.fillRect(Math.round(cx - tw / 2), sy - 18, Math.round(tw), 11);
      g.strokeStyle = c.activated ? "rgba(250, 204, 21, 0.65)" : "rgba(244, 63, 94, 0.7)";
      g.lineWidth = 1;
      g.strokeRect(Math.round(cx - tw / 2), sy - 18, Math.round(tw), 11);
      g.fillStyle = c.activated ? "#fde047" : "#fecdd3";
      g.fillText(labelTxt, cx, sy - 10);
      g.restore();
    }

    // Render Realistic Gothic Gargoyle Stone Archway & Forged Iron Portcullis Gates
    for (const gate of sealGates) {
      const centerX = Math.round(gate.x + gate.w / 2 - camX);
      if (centerX < -110 || centerX > T.viewW + 110) continue;

      const groundScreenY = Math.round(gate.h - camY);
      const gateDrawW = 132;
      const gateDrawH = Math.max(248, gate.h + 12);
      const drawX = Math.round(centerX - gateDrawW / 2);
      const archTopY = groundScreenY - gateDrawH + 6;

      g.save();

      // 1. Movable Inner Forged-Iron Portcullis Grate & Demonic Blood Crest (slides up inside the stone arch when unlocked!)
      if (gate.openProgress < 1) {
        const liftPx = Math.round(gate.openProgress * (gateDrawH - 36));
        const grateImg = art.sealGateGrate || art.sealGate;
        // Clip so the rising portcullis retracts cleanly into the upper stone vault
        g.save();
        g.beginPath();
        g.rect(drawX, Math.max(0, archTopY + 14), gateDrawW, gateDrawH);
        g.clip();

        // Pulsing crimson aura behind the demonic blood seal crest while locked
        if (!gate.open) {
          const crestY = archTopY + Math.round(gateDrawH * 0.49) - liftPx;
          const pulseR = 36 + Math.sin(time * 5) * 6;
          const sealGlow = g.createRadialGradient(centerX, crestY, 4, centerX, crestY, pulseR);
          sealGlow.addColorStop(0, "rgba(255, 23, 68, 0.65)");
          sealGlow.addColorStop(0.55, "rgba(185, 28, 28, 0.28)");
          sealGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.fillStyle = sealGlow;
          g.fillRect(centerX - pulseR, crestY - pulseR, pulseR * 2, pulseR * 2);
        }

        if (grateImg && grateImg.complete && grateImg.naturalWidth > 0) {
          g.drawImage(grateImg, drawX, archTopY - liftPx, gateDrawW, gateDrawH);
        }
        g.restore();
      }

      // 2. Stationary Carved Stone Gargoyle Archway Frame (stays anchored in the castle corridor even after opening!)
      const archImg = art.sealGateArch || art.sealGate;
      if (archImg && archImg.complete && archImg.naturalWidth > 0) {
        g.drawImage(archImg, drawX, archTopY, gateDrawW, gateDrawH);
      }

      // 3. Subtle Gothic Seal Status Plaque when locked
      if (!gate.open) {
        const gateCrystals = sealCrystals.filter((c) => c.gateId === gate.id);
        const broken = gateCrystals.filter((c) => c.activated).length;
        const badgeY = Math.min(groundScreenY - 38, Math.max(44, archTopY + Math.round(gateDrawH * 0.24)));
        g.fillStyle = "rgba(9, 9, 11, 0.88)";
        g.fillRect(centerX - 34, badgeY - 10, 68, 13);
        g.strokeStyle = "rgba(225, 29, 72, 0.85)";
        g.lineWidth = 1;
        g.strokeRect(centerX - 34, badgeY - 10, 68, 13);
        g.font = "bold 7.5px monospace";
        g.textAlign = "center";
        g.fillStyle = "#fda4af";
        g.fillText(`SELOS ${broken}/${gateCrystals.length}`, centerX, badgeY - 1);
      }
      g.restore();
    }

    const bosses = enemies.filter((e) => e.boss);
    const open = bosses.length > 0 && bosses.every((e) => e.dead);

    // Magical Gothic Portal - only appears when the stage Boss is defeated!
    if (open && gameMode === "campaign") {
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
      if (s.sprite === "slash") {
        const frameLock = s.frameLock >= 0 ? s.frameLock : 2;
        const root = SLASH_ROOT[frameLock] || SLASH_ROOT[2];
        const facing = s.vx >= 0 ? 1 : -1;
        if (s.charged) {
          // Charged Super Magic Wave: Larger radiant blade wave + inner arcane spell core + golden/cyan halo!
          const cx = Math.round(s.x + s.w / 2 - camX);
          const cy = Math.round(s.drawCenterY - camY);
          g.save();
          g.globalAlpha = 0.68;
          const auraR = 34;
          const cGlow = g.createRadialGradient(cx + facing * 10, cy, 4, cx + facing * 6, cy, auraR);
          cGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          cGlow.addColorStop(0.4, "rgba(250, 204, 21, 0.78)");
          cGlow.addColorStop(0.75, "rgba(56, 189, 248, 0.45)");
          cGlow.addColorStop(1, "rgba(30, 58, 138, 0)");
          g.fillStyle = cGlow;
          g.fillRect(cx - auraR, cy - auraR, auraR * 2, auraR * 2);
          g.restore();

          blitRoot(img, frameLock, s.x + s.w / 2, s.drawCenterY, 76, facing, root.x, root.y);
          const spellFrame = Math.floor(time * 14) % 4;
          blit(art.spell, spellFrame, s.x + s.w / 2 + facing * 6, s.drawCenterY + 18, 36, facing);
        } else {
          blitRoot(img, frameLock, s.x + s.w / 2, s.drawCenterY, 60, facing, root.x, root.y);
        }
      } else {
        const frame = Math.floor(time * 12) % 4;
        const height = 28;
        const facing = s.vx > 0 ? 1 : s.vx < 0 ? -1 : player.facing;
        
        // Aim angle tilt if shooting with vertical speed (e.g. aiming up)
        if (Math.abs(s.vy) > 35) {
          const angle = Math.atan2(s.vy, Math.abs(s.vx));
          g.save();
          g.translate(Math.round(s.x + s.w / 2 - camX), Math.round(s.y + s.h / 2 - camY));
          g.scale(facing, 1);
          g.rotate(angle);
          if (img && img.complete && img.naturalWidth > 0) {
            const sw = img.width / 2;
            const sh = img.height / 2;
            const col = frame % 2;
            const row = Math.floor(frame / 2) % 2;
            g.drawImage(img, col * sw, row * sh, sw, sh, -height / 2, -height / 2, height, height);
          }
          g.restore();
        } else {
          blit(img, frame, s.x + s.w / 2, s.y + s.h / 2 + height / 2, height, facing);
        }

        // Concentrated glow at the thick front of the magic projectile
        const headX = Math.round(s.x + s.w / 2 + facing * 8 - camX);
        const headY = Math.round(s.y + s.h / 2 - camY);
        g.save();
        g.globalAlpha = 0.42;
        const glowR = s.sprite === "blood" ? 20 : 18;
        const mGlow = g.createRadialGradient(headX, headY, 2, headX, headY, glowR);
        if (s.sprite === "blood") {
          mGlow.addColorStop(0, "rgba(255, 60, 60, 0.85)");
          mGlow.addColorStop(1, "rgba(180, 0, 0, 0)");
        } else {
          mGlow.addColorStop(0, s.friendly ? "rgba(180, 225, 255, 0.85)" : "rgba(225, 90, 255, 0.85)");
          mGlow.addColorStop(1, "rgba(100, 40, 240, 0)");
        }
        g.fillStyle = mGlow;
        g.fillRect(headX - glowR, headY - glowR, glowR * 2, glowR * 2);
        g.restore();
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
      } else if (
        e.state === "slash" ||
        e.wind > 0 ||
        (e.activeTimer ?? 0) > 0 ||
        e.state === "smash" ||
        e.state === "charge"
      ) {
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
      const impactShakeX = (e.impactShakeT ?? 0) > 0 ? Math.sin(time * 78) * 2.5 : 0;
      const drawCenterX = e.x + e.w / 2 + impactShakeX;

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
        g.globalAlpha = (curPhase >= 3 ? 0.56 : 0.42) + Math.sin(time * (curPhase >= 3 ? 14 : 9)) * 0.18;
        g.fillStyle = auraColor;
        g.beginPath();
        g.ellipse(bx, by, e.w * (curPhase >= 3 ? 1.25 : 1.05), curPhase >= 3 ? 13 : 11, 0, 0, Math.PI * 2);
        g.fill();
        if (curPhase >= 3) {
          g.strokeStyle = "rgba(253, 224, 71, 0.85)";
          g.lineWidth = 1.6;
          g.beginPath();
          g.ellipse(bx, by, e.w * 1.38 + Math.sin(time * 16) * 4, 14, 0, 0, Math.PI * 2);
          g.stroke();
        }
        g.restore();
      }
      if (e.state === "emerge") {
        const floorY = (e.emergeY ?? (e.y - e.h)) + e.h;
        const groundScreenY = Math.round(floorY - camY);
        g.save();
        if ((e.hurtFlash ?? 0) > 0) {
          g.globalCompositeOperation = "lighter";
        }
        g.beginPath();
        g.rect(Math.round(e.x - camX - 40), 0, e.w + 80, groundScreenY);
        g.clip();
        blit(art[spriteKey], frame, drawCenterX, feet, tall, e.facing);
        g.restore();

        // Draw cracked stone mound / dust puff at emergence point
        const sx = Math.round(e.x + e.w / 2 - camX);
        const sy = groundScreenY;
        g.fillStyle = "#3f3f46";
        g.fillRect(sx - 16, sy - 2, 32, 3);
        g.fillStyle = "#71717a";
        g.fillRect(sx - 10, sy - 3, 20, 2);
      } else {
        // Elliptical contact shadow under grounded enemy
        if (e.grounded && e.kind !== "bat" && e.state !== "emerge") {
          const eCenterX = Math.round(e.x + e.w / 2 - camX);
          const eFeetY = Math.round(feet - camY);
          g.save();
          g.fillStyle = "rgba(0, 0, 0, 0.7)";
          g.beginPath();
          g.ellipse(eCenterX, eFeetY, Math.max(12, e.w * 0.55), 3.5, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }

        if ((e.hurtFlash ?? 0) > 0) {
          g.save();
          g.globalCompositeOperation = "lighter";
          blit(art[spriteKey], frame, drawCenterX, feet, tall, e.facing);
          g.restore();
        } else {
          blit(art[spriteKey], frame, drawCenterX, feet, tall, e.facing);
        }
      }

      // Attack telegraph warning indicator (! for WINDUP, ⚡ for COUNTER)
      if (e.wind > 0 && !e.dead && !e.dying) {
        const ex = Math.round(e.x + e.w / 2 - camX);
        const ey = Math.round(e.y - camY - 14);
        const isCounterWindup = e.fsmState === "COUNTER";
        g.save();
        const pulse = 0.65 + Math.sin(time * 24) * 0.35;
        g.fillStyle = isCounterWindup
          ? `rgba(250, 204, 21, ${pulse * 0.65})`
          : `rgba(225, 29, 72, ${pulse * 0.55})`;
        g.beginPath();
        g.arc(ex, ey, 9, 0, Math.PI * 2);
        g.fill();
        g.font = "bold 13px 'Cinzel', serif, monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "rgba(0, 0, 0, 0.9)";
        g.fillText(isCounterWindup ? "⚡" : "!", ex + 1, ey + 1);
        g.fillStyle = isCounterWindup ? "#fef08a" : "#ffffff";
        g.fillText(isCounterWindup ? "⚡" : "!", ex, ey);
        g.restore();
      }

      // Stagger / Guard Broken / Contextual Execution indicator above Enemies & Bosses
      if ((e.staggered || e.fsmState === "STUNNED" || e.fsmState === "GUARD_BROKEN") && e.hurt > 0 && !e.dead && !e.dying) {
        const ex = Math.round(e.x + e.w / 2 - camX);
        const ey = Math.round(e.y - camY - 16);
        g.save();
        for (let i = 0; i < 3; i++) {
          const ang = time * 8 + i * ((Math.PI * 2) / 3);
          const sx = ex + Math.cos(ang) * 14;
          const sy = ey + Math.sin(ang) * 4;
          g.fillStyle = i % 2 === 0 ? "#fde047" : "#f97316";
          g.fillRect(Math.round(sx - 1.5), Math.round(sy - 1.5), 3, 3);
        }
        g.font = "bold 7.5px monospace";
        g.textAlign = "center";
        g.fillStyle = "rgba(0, 0, 0, 0.9)";
        const statusText =
          e.fsmState === "GUARD_BROKEN" || e.staggered
            ? "⚔️ EXECUÇÃO! [ATAQUE]"
            : "⚡ VULNERÁVEL!";
        g.fillText(statusText, ex + 1, ey - 7);
        g.fillStyle = "#fde047";
        g.fillText(statusText, ex, ey - 8);
        g.restore();
      }
    }

    // Render Dash Afterimages ("Rastro Fantasma / Afterimages")
    for (const ai of afterimages) {
      const alpha = Math.max(0, ai.life / ai.maxLife) * 0.45;
      if (alpha <= 0.02) continue;
      g.save();
      g.globalAlpha = alpha;
      g.globalCompositeOperation = "screen";
      if (ai.rotation || (ai.scaleX && ai.scaleX !== 1) || (ai.scaleY && ai.scaleY !== 1) || ai.offsetY) {
        const pivotX = Math.round(ai.x - camX);
        const pivotY = Math.round(ai.feet - camY);
        g.translate(pivotX, pivotY + (ai.offsetY ?? 0));
        g.scale(ai.scaleX ?? 1, ai.scaleY ?? 1);
        g.rotate(ai.rotation ?? 0);
        g.translate(-pivotX, -pivotY);
      }
      blit(art[ai.sheet], ai.frame, ai.x, ai.feet, DRAW_H.hero, ai.facing, ai.cols);
      g.restore();
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
    } else if (player.attackPhase !== "NONE") {
      if (player.attackKind === "crouch") {
        sheet = "heroCrouch";
        frame = player.attackPhase === "STARTUP" ? 1 : player.attackPhase === "ACTIVE" ? 2 : 1;
      } else if (player.attackKind === "down" && !player.grounded) {
        sheet = "heroJump";
        frame = 3;
      } else if (player.attackKind === "side" && player.comboStep === 3) {
        // GOLPE 3 (pesado, de cima para baixo): reaproveita as poses do ataque aéreo
        sheet = "heroJump";
        frame = player.attackPhase === "STARTUP" ? 0 : 3; // espada erguida -> espada cravada para baixo
      } else {
        sheet = "heroAttack";
        if (player.attackKind === "up") {
          frame = 1;
        } else if (player.attackPhase === "STARTUP") {
          frame = 0; // Pose de antecipação (startup)
        } else if (player.attackPhase === "ACTIVE") {
          frame = 1; // Pose ativa do golpe (active - corte branco)
        } else {
          frame = 3; // Pose de recuperação (recovery - plantado no chão)
        }
      }
    } else if (
      player.charge === "wind" ||
      (player.holdT > 0.08 &&
        player.castT <= 0 &&
        player.specialT <= 0 &&
        !player.guard &&
        player.hurtT <= 0)
    ) {
      // Steady, rock-solid hold-to-charge & windup power stance!
      // Holds sword raised cleanly in heroAttack frame 0 without trembling or arm-flapping.
      if (player.crouching) {
        sheet = "heroCrouch";
        frame = 1;
      } else if (Math.abs(player.vx) > 15 && player.grounded) {
        sheet = "heroRun";
        frame = Math.floor(time * 10) % 4;
      } else {
        sheet = "heroAttack";
        frame = 0;
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
    // Elliptical contact shadow under Aldric
    if (player.grounded) {
      const pCenterX = Math.round(player.x + player.w / 2 - camX);
      const pFeetY = Math.round(player.y + player.h - camY);
      g.save();
      g.fillStyle = "rgba(0, 0, 0, 0.7)";
      g.beginPath();
      g.ellipse(pCenterX, pFeetY, 15, 3.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // Hold-to-Charge Energy Aura & Converging Runic Circle (Active while holding Attack!)
    if ((player.holdT > 0.14 || player.charge === "wind") && !player.dead && !player.dying) {
      const chargeRatio = player.charge === "wind" ? 1 : Math.min(1, (player.holdT - 0.14) / 0.22);
      const gx = Math.round(player.x + player.w / 2 - camX);
      const gy = Math.round(player.y + player.h / 2 - camY);
      const gFeet = Math.round(player.y + player.h - camY);
      g.save();

      // 1. Pulsing ground runic ring under Aldric's boots
      const ringRx = 16 + chargeRatio * 12 + Math.sin(time * 18) * 3;
      g.strokeStyle = player.charge === "wind" ? "rgba(250, 204, 21, 0.85)" : "rgba(56, 189, 248, 0.65)";
      g.lineWidth = player.charge === "wind" ? 2 : 1.2;
      g.beginPath();
      g.ellipse(gx, gFeet - 1, ringRx, 4.5, 0, 0, Math.PI * 2);
      g.stroke();

      // 2. Core solar/arcane radial glow around Aldric and his blade
      const auraR = Math.round(24 + chargeRatio * 20 + Math.sin(time * 12) * 3);
      g.globalAlpha = 0.35 + chargeRatio * 0.4;
      const cGlow = g.createRadialGradient(gx, gy, 3, gx, gy, auraR);
      if (player.charge === "wind") {
        cGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        cGlow.addColorStop(0.38, "rgba(250, 204, 21, 0.75)");
        cGlow.addColorStop(0.72, "rgba(56, 189, 248, 0.45)");
        cGlow.addColorStop(1, "rgba(30, 58, 138, 0)");
      } else {
        cGlow.addColorStop(0, "rgba(224, 242, 254, 0.8)");
        cGlow.addColorStop(0.5, "rgba(56, 189, 248, 0.45)");
        cGlow.addColorStop(1, "rgba(30, 58, 138, 0)");
      }
      g.fillStyle = cGlow;
      g.fillRect(gx - auraR, gy - auraR, auraR * 2, auraR * 2);

      // 3. Orbiting runic energy sparks spiraling into the blade
      const sparkCount = player.charge === "wind" ? 6 : 4;
      for (let i = 0; i < sparkCount; i++) {
        const ang = time * (player.charge === "wind" ? 9 : 6) + i * ((Math.PI * 2) / sparkCount);
        const orbitR = player.charge === "wind" ? 15 + Math.sin(time * 10 + i) * 3 : 24 - chargeRatio * 8;
        const sx = gx + Math.cos(ang) * orbitR;
        const sy = gy + Math.sin(ang) * (orbitR * 0.75);
        g.globalAlpha = 0.85;
        g.fillStyle = i % 2 === 0 ? "#fde047" : "#38bdf8";
        g.fillRect(Math.round(sx - 1.5), Math.round(sy - 1.5), 3, 3);
      }
      g.restore();
    }

    // the 320px cells keep the boots 56px above the cell bottom
    const heroFeet = player.y + player.h + (56 / 320) * DRAW_H.hero;
    const heroDrawX = player.x + player.w / 2; // Sem nenhum deslocamento de posição X/Y!

    // =========================================================================
    // ANIMAÇÃO PROCEDURAL VIA CÓDIGO (Juice & Game Feel estilo Grimvalor)
    // Transformações de matriz/canvas: rotação, escala, squash & stretch e offset
    // =========================================================================
    let heroRotation = 0;
    let heroScaleX = 1.0;
    let heroScaleY = 1.0;
    let heroOffsetY = 0;

    if (player.dashT > 0) {
      // Silhueta estilo Grimvalor durante o dash (mergulho rasante e dinâmico)
      heroScaleY = 0.72;
      heroScaleX = 1.22;
      heroOffsetY = 6;
      heroRotation = ((15 * Math.PI) / 180) * (player.dashDir || player.facing);
    } else if (player.attackPhase !== "NONE" && player.attackKind === "side") {
      const step = player.comboStep;
      const phase = player.attackPhase;
      const t = player.attackTimer;

      if (step === 1) {
        // GOLPE 1: Corte Veloz de Avanço (Slash Diagonal Descendente)
        // Startup (0.07s): Incline levemente para trás (-6 graus), scaleX = 0.95, scaleY = 1.05
        // Active (0.09s): Incline agressivamente para frente (+10 graus), scaleX = 1.08, scaleY = 0.94
        // Recovery (0.16s): Retorne suavemente (lerp) rotation para 0 e escala para 1.0
        if (phase === "STARTUP") {
          heroRotation = (-6 * Math.PI) / 180 * player.facing;
          heroScaleX = 0.95;
          heroScaleY = 1.05;
        } else if (phase === "ACTIVE") {
          heroRotation = (10 * Math.PI) / 180 * player.facing;
          heroScaleX = 1.08;
          heroScaleY = 0.94;
        } else if (phase === "RECOVERY") {
          const recT = clamp((t - (player.attackStartupDur + player.attackActiveDur)) / player.attackRecoveryDur, 0, 1);
          heroRotation = (10 * Math.PI) / 180 * player.facing * (1 - recT);
          heroScaleX = 1.08 + (1.0 - 1.08) * recT;
          heroScaleY = 0.94 + (1.0 - 0.94) * recT;
        }
      } else if (step === 2) {
        // GOLPE 2: Corte Ascendente Rápido (Uppercut Slash de Baixo para Cima)
        // Startup (0.06s): Abaixe o sprite em Y (offsetY = +4px) e achate levemente (scaleY = 0.90)
        // Active (0.09s): Estique o corpo para cima (scaleX = 0.95, scaleY = 1.08, offsetY = -3px) e incline para trás (-8 graus)
        // Recovery (0.16s): Retorne suavemente (lerp) para a postura neutra
        if (phase === "STARTUP") {
          heroScaleY = 0.90;
          heroOffsetY = 4;
        } else if (phase === "ACTIVE") {
          heroRotation = (-8 * Math.PI) / 180 * player.facing;
          heroScaleX = 0.95;
          heroScaleY = 1.08;
          heroOffsetY = -3;
        } else if (phase === "RECOVERY") {
          const recT = clamp((t - (player.attackStartupDur + player.attackActiveDur)) / player.attackRecoveryDur, 0, 1);
          heroRotation = (-8 * Math.PI) / 180 * player.facing * (1 - recT);
          heroScaleX = 0.95 + (1.0 - 0.95) * recT;
          heroScaleY = 1.08 + (1.0 - 1.08) * recT;
          heroOffsetY = -3 * (1 - recT);
        }
      } else if (step === 3) {
        // GOLPE 3: O Finalizador Grimvalor (Salto Acrobático e Mergulho Slam no Chão / Leap & Slam)
        // Startup (0.12s): Salto (heroJump frame 0) inclinado para trás (-18 graus)
        // Active (0.12s): Mergulho rápido (heroJump frame 3) inclinado agressivamente para frente (+22 graus)
        // Recovery (0.28s): Ao aterrissar no chão, pose agachada/inclinada (scaleY = 0.88, scaleX = 1.12, offsetY = 3, rotation = +6 graus) por 0.15s
        if (phase === "STARTUP") {
          heroRotation = (-18 * Math.PI) / 180 * player.facing;
        } else if (phase === "ACTIVE") {
          heroRotation = (22 * Math.PI) / 180 * player.facing;
        } else if (phase === "RECOVERY") {
          if (player.slamImpactTimer > 0) {
            heroScaleX = 1.12;
            heroScaleY = 0.88;
            heroOffsetY = 3;
            heroRotation = ((6 * Math.PI) / 180) * player.facing;
          } else {
            const impactDur = 0.15;
            const recT = clamp((t - (player.attackStartupDur + player.attackActiveDur + impactDur)) / Math.max(0.01, player.attackRecoveryDur - impactDur), 0, 1);
            heroScaleX = 1.12 + (1.0 - 1.12) * recT;
            heroScaleY = 0.88 + (1.0 - 0.88) * recT;
            heroOffsetY = 3 * (1 - recT);
            heroRotation = ((6 * Math.PI) / 180) * player.facing * (1 - recT);
          }
        }
      }
    } else if (player.attackPhase === "STARTUP") {
      heroRotation = (-6 * Math.PI) / 180 * player.facing;
    }

    const hasTransforms = heroRotation !== 0 || heroScaleX !== 1 || heroScaleY !== 1 || heroOffsetY !== 0;
    if (hasTransforms) {
      g.save();
      const pivotX = Math.round(heroDrawX - camX);
      const pivotY = Math.round(heroFeet - camY);
      g.translate(pivotX, pivotY + heroOffsetY);
      g.scale(heroScaleX, heroScaleY);
      g.rotate(heroRotation);
      g.translate(-pivotX, -pivotY);
    }

    let heroImg: HTMLImageElement | HTMLCanvasElement | undefined = art[sheet];
    const comboArcs = player.attackPhase === "ACTIVE" && player.attackKind === "side" ? getComboArcSheets() : null;
    if (comboArcs && sheet === "heroAttack" && frame === 1) {
      // Aldric renderizado SEM o arco branco (o arco é desenhado separadamente com sua própria geometria)
      heroImg = comboArcs.bodyOnly;
    }
    blit(heroImg, frame, heroDrawX, heroFeet, DRAW_H.hero, player.facing, heroCols);

    if (hasTransforms) {
      g.restore();
    }

    if (isInvulnerable) {
      g.restore();
    }

    // Slash Arc Visual Effect: Geometria e orientação procedural do corte branco
    if (player.attackPhase === "ACTIVE" && player.castT <= 0) {
      if (player.attackKind === "side" && comboArcs) {
        if (player.comboStep === 1) {
          // Golpe 1: Esticado horizontalmente na altura do peito com brilho nítido (corte veloz frontal)
          drawSlashArc(comboArcs.arcOnly, heroDrawX, heroFeet, player.facing, 6, 1.25, 0.65, 12, -12, DRAW_H.hero, true);
        } else if (player.comboStep === 2) {
          // Golpe 2: Arco invertido verticalmente (scaleY = -1.0), inclinado para cima (-20°) com brilho intenso
          drawSlashArc(comboArcs.arcOnly, heroDrawX, heroFeet, player.facing, -20, 1.15, -1.0, 10, -4, DRAW_H.hero, true);
        } else if (player.comboStep === 3) {
          // Golpe 3: Arco gigante completo de cima até o chão (escala 1.35x), orientado a 32° acompanhando o mergulho
          drawSlashArc(comboArcs.arcOnly, heroDrawX, heroFeet, player.facing, 32, 1.35, 1.35, 8, 14, DRAW_H.hero, true);
        }
      } else if (player.attackKind === "down" && !player.grounded) {
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

      // Core radial light around the leading crest of the crescent
      const cx = Math.round(drawX + s.facing * 22 - camX);
      const cy = Math.round(s.y + s.h / 2 - camY);
      g.save();
      g.globalAlpha = 0.65;
      const cGlow = g.createRadialGradient(cx, cy, 6, cx, cy, 70);
      cGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      cGlow.addColorStop(0.4, "rgba(255, 23, 68, 0.7)");
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

    // Combat Debris & Enemy Shard Fragments (1:1 with camera world space)
    for (const p of particles) {
      if (p.isAmbient) continue;
      const px = Math.round(p.x - camX);
      const py = Math.round(p.y - camY);
      if (px < -15 || px > T.viewW + 15 || py < -15 || py > T.viewH + 15) continue;
      drawParticle(p, px, py);
    }

    // 4. Foreground Atmospheric 2.5D Depth:
    // Stage Foreground Architectural Framing (gnarled branches, arches, vaulting, scrolling at 1.16x)
    if (plates.fg) {
      drawStrip(plates.fg, 1.16, 0, 1, -12, T.viewH + 24, 0.92, 0.12);
    }

    // Foreground Pillars and Hanging Ceiling Columns (passing in front of actors)
    for (const prop of getActiveProps()) {
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

    // Foreground Ambient Dust (depth === "fg", scrolling at 1.25x)
    for (const p of particles) {
      if (!p.isAmbient || p.depth !== "fg") continue;
      const px = Math.round(p.x - camX * 1.25);
      const py = Math.round(p.y - camY * 1.25);
      if (px < -15 || px > T.viewW + 15 || py < -15 || py > T.viewH + 15) continue;
      drawParticle(p, px, py);
    }

    // 4.5. Floating Damage Numbers ("Dano Flutuante")
    for (const dn of damageNumbers) {
      const alpha = Math.min(1, dn.life / (dn.maxLife * 0.35));
      if (alpha <= 0.02) continue;
      const sx = Math.round(dn.x - camX);
      const sy = Math.round(dn.y - camY);
      g.save();
      g.globalAlpha = alpha;
      g.textAlign = "center";
      g.textBaseline = "middle";
      if (dn.isCrit) {
        g.font = "bold 13px 'Cinzel', serif, monospace";
        g.fillStyle = "rgba(0, 0, 0, 0.95)";
        g.fillText(dn.text, sx + 1, sy + 1);
        g.fillStyle = "#ff0044";
        g.fillText(dn.text, sx - 1, sy);
        g.fillStyle = dn.color;
        g.fillText(dn.text, sx, sy);
      } else {
        g.font = "bold 10px monospace";
        g.fillStyle = "rgba(0, 0, 0, 0.9)";
        g.fillText(dn.text, sx + 1, sy + 1);
        g.fillStyle = dn.color;
        g.fillText(dn.text, sx, sy);
      }
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

    // Chamber Transition Vignette Curtain (200ms smooth edge-only vignette, never pitch black)
    if (chamberTransitionTimer > 0) {
      const p = chamberTransitionTimer / 0.22;
      const a = Math.sin(p * Math.PI) * 0.42;
      g.save();
      const cx = T.viewW / 2;
      const cy = T.viewH / 2;
      const rMax = Math.hypot(cx, cy);
      const vigGrad = g.createRadialGradient(cx, cy, T.viewW * 0.28, cx, cy, rMax);
      vigGrad.addColorStop(0, "rgba(6, 4, 12, 0)");
      vigGrad.addColorStop(0.65, `rgba(6, 4, 12, ${a * 0.5})`);
      vigGrad.addColorStop(1, `rgba(6, 4, 12, ${a})`);
      g.fillStyle = vigGrad;
      g.fillRect(0, 0, T.viewW, T.viewH);
      g.restore();
    }

    // Elegant Gothic Typography Chamber Banner (Classic Symphony of the Night style)
    if (chamberNameTimer > 0 && chamberNameBanner) {
      const fadeIn = Math.min(1, (2.4 - chamberNameTimer) / 0.4);
      const fadeOut = Math.min(1, chamberNameTimer / 0.5);
      const bAlpha = Math.min(fadeIn, fadeOut);
      if (bAlpha > 0.02) {
        g.save();
        g.globalAlpha = bAlpha;
        const cx = T.viewW / 2;
        const cy = 46;

        // Elegant ribbon backing
        const grad = g.createLinearGradient(cx - 170, cy, cx + 170, cy);
        grad.addColorStop(0, "rgba(8, 6, 16, 0)");
        grad.addColorStop(0.2, "rgba(12, 10, 24, 0.85)");
        grad.addColorStop(0.5, "rgba(16, 14, 30, 0.95)");
        grad.addColorStop(0.8, "rgba(12, 10, 24, 0.85)");
        grad.addColorStop(1, "rgba(8, 6, 16, 0)");
        g.fillStyle = grad;
        g.fillRect(cx - 170, cy - 20, 340, 40);

        // Moonlight filigree lines above and below
        const lineGrad = g.createLinearGradient(cx - 130, cy, cx + 130, cy);
        lineGrad.addColorStop(0, "rgba(150, 170, 220, 0)");
        lineGrad.addColorStop(0.5, "rgba(210, 190, 255, 0.7)");
        lineGrad.addColorStop(1, "rgba(150, 170, 220, 0)");
        g.strokeStyle = lineGrad;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(cx - 130, cy - 18);
        g.lineTo(cx + 130, cy - 18);
        g.moveTo(cx - 130, cy + 18);
        g.lineTo(cx + 130, cy + 18);
        g.stroke();

        // Chamber Name Text
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = "bold 13px 'Cinzel', serif, 'Georgia', serif";
        // Drop shadow
        g.fillStyle = "rgba(0, 0, 0, 0.95)";
        g.fillText(chamberNameBanner, cx + 1, cy + 1);
        // Silver/Moonlight typography
        g.fillStyle = "#e6e0f8";
        g.fillText(chamberNameBanner, cx, cy);
        g.restore();
      }
    }

    // =========================================================================
    // CINEMATIC WIDESCREEN LETTERBOX BARS (Castlevania SOTN Boss Presentation)
    // =========================================================================
    if (bossCinematic.letterboxProgress > 0) {
      const barH = Math.round(36 * bossCinematic.letterboxProgress);
      g.save();
      g.fillStyle = "#000000";
      // Top anamorphic black bar
      g.fillRect(0, 0, T.viewW, barH);
      // Bottom anamorphic black bar
      g.fillRect(0, T.viewH - barH, T.viewW, barH);

      // Ornate Gold Trim filigree lines
      g.fillStyle = "rgba(212, 175, 55, 0.85)";
      g.fillRect(0, barH - 1, T.viewW, 1);
      g.fillRect(0, T.viewH - barH, T.viewW, 1);

      // Inner Crimson bloodline
      g.fillStyle = "rgba(225, 29, 72, 0.65)";
      g.fillRect(0, barH - 2, T.viewW, 1);
      g.fillRect(0, T.viewH - barH + 1, T.viewW, 1);

      // Dramatic "BATALHA INICIADA!" splash during roar_out
      if (bossCinematic.phase === "roar_out") {
        g.font = "bold 13px serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "#000000";
        g.fillText("⚔️ O SENHOR DO SALÃO DESPERTOU! ⚔️", T.viewW / 2 + 1, barH + 19);
        g.fillStyle = "#ffd700";
        g.fillText("⚔️ O SENHOR DO SALÃO DESPERTOU! ⚔️", T.viewW / 2, barH + 18);
        g.font = "bold 8px monospace";
        g.fillStyle = "#000000";
        g.fillText("PREPARE-SE PARA A BATALHA!", T.viewW / 2 + 1, barH + 33);
        g.fillStyle = "#ffffff";
        g.fillText("PREPARE-SE PARA A BATALHA!", T.viewW / 2, barH + 32);
      }
      g.restore();
    }
  }

  let lastHudKey = "";

  function publish() {
    const boss = enemies.find((e) => e.boss && !e.dead) || enemies.find((e) => e.boss);
    const bossInSight = !!boss && (boss.x < camX + T.viewW + 24 && boss.x + boss.w > camX - 32);
    const bossOn = !!boss && (boss.boss && (bossInSight || player.x > boss.homeX - 460 || boss.hp < boss.max));
    if (bossOn && !player.dead && !player.won && boss && !boss.dead) {
      if (!bossIntroPlayed && !bossCinematic.active) {
        bossIntroPlayed = true;
        startBossCinematic(boss);
      }
      if (bossIntroPlayed && !bossEnragedAnnounced && boss.hp / boss.max < 0.5) {
        bossEnragedAnnounced = true;
        sound.playSfx("bossHurt");
        shake = Math.max(shake, 8);
        player.toast = `⚠️ ${boss.name.split(',')[0]} ENTROU EM FÚRIA! Padrões letais acelerados!`;
        player.toastT = 3.0;
      }
      if (!bossCinematic.active) {
        if (level.id === 7) {
          if (sound.getCurrentTrack() !== "stage7") {
            sound.playStageBgm(7);
          }
        } else if (sound.getCurrentTrack() !== "boss") {
          sound.playBgm("boss");
        }
      }
    }
    const sealsSolved = sealCrystals.filter((c) => c.activated).length;
    const sealsTotal = sealCrystals.length;

    // Mobile Performance: Quantize charge into 10% steps (0.0, 0.1, ... 1.0)
    // to prevent continuous React render churn during hold-to-charge
    const chargeVal = player.charge === "wind" ? 1 : Math.round(Math.min(1, player.holdT / 0.36) * 10) / 10;
    const hudHp = player.hp;
    const hudMana = Math.round(player.mana);
    const hudSpecial = Math.round(player.special);
    const hudBossHp = boss ? Math.max(0, boss.hp) : 0;
    const hudBossPoise = boss ? Math.max(0, Math.round(boss.poise ?? 0)) : 0;
    const hudBossMaxPoise = boss ? Math.max(1, Math.round(boss.maxPoise ?? 14)) : 14;
    const hudBossStaggered = !!(boss && boss.staggered && boss.hurt > 0);
    const hudBossOn = bossOn && !bossCinematic.active && gameMode !== "horde";
    const hudToast = player.toastT > 0 ? player.toast : "";
    const hudHordeRem = gameMode === "horde" ? hordeQueue.length + enemies.filter((e) => !e.dead && !e.dying).length : 0;
    const cinActive = bossCinematic.active;
    const cinChar = cinActive ? bossCinematic.charCount : 0;
    const cinPhase = cinActive ? bossCinematic.phase : "";

    const currentKey = `${hudHp}_${hudMana}_${hudSpecial}_${player.lives}_${hudBossHp}_${hudBossPoise}_${hudBossStaggered}_${hudBossOn}_${hudToast}_${player.won}_${player.dead}_${player.dashCd <= 0}_${chargeVal}_${sealsSolved}_${cinActive}_${cinChar}_${cinPhase}_${hordeWave}_${hudHordeRem}_${hordeKills}_${hordeUpgradeAvailable}`;

    if (currentKey === lastHudKey) {
      return;
    }
    lastHudKey = currentKey;

    onHud({
      hp: hudHp,
      maxHp: T.maxHp,
      mana: hudMana,
      maxMana: T.maxMana,
      special: hudSpecial,
      specialReady: hudSpecial >= 100,
      lives: player.lives,
      bossName: boss?.name || "",
      bossHp: hudBossHp,
      bossMax: boss?.max || 1,
      bossOn: hudBossOn,
      bossPhase: boss?.phase ?? 1,
      bossTransforming: (boss?.transformT ?? 0) > 0,
      bossPoise: hudBossPoise,
      bossMaxPoise: hudBossMaxPoise,
      bossStaggered: hudBossStaggered,
      toast: hudToast,
      won: player.won,
      dead: player.dead,
      title: gameMode === "horde" ? `Onda ${hordeWave}` : level.title,
      dashReady: player.dashCd <= 0,
      charge: chargeVal,
      sealsSolved,
      sealsTotal,
      bossCinematic: bossCinematic.active ? {
        active: true,
        phase: bossCinematic.phase === "roar_out" ? "roar_out" : "speaking",
        stageId: level.id,
        speaker: bossCinematic.speaker,
        title: bossCinematic.title,
        quote: bossCinematic.quote,
        portrait: bossCinematic.portrait,
        bustIdle: bossCinematic.bustIdle,
        bustTalk: bossCinematic.bustTalk,
        themeColor: bossCinematic.themeColor,
        timer: bossCinematic.timer,
        duration: bossCinematic.duration,
        charCount: bossCinematic.charCount,
      } : null,
      gameMode,
      difficulty,
      hordeWave,
      hordeRemaining: hudHordeRem,
      hordeTotalInWave,
      hordeKills,
      hordeBestWave,
      hordeUpgradeAvailable,
      hordeUpgradeWave,
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
    const delta = (now - last) / 1000;
    last = now;
    // Mobile Frame Pacing: Clamp accumulator to max 50ms (prevents spiral of death)
    acc = Math.min(0.05, acc + Math.min(0.05, delta));
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
    const wantsBossIntro = gameMode === "campaign" && !!bossObj && !bossIntroPlayed && (bossObj.x < camX + T.viewW + 24 || player.x > bossObj.homeX - 460 || bossObj.hp < bossObj.max);
    if (wantsBossIntro && !bossCinematic.active && !player.dead && !player.won) {
      bossIntroPlayed = true;
      startBossCinematic(bossObj);
    }
    if (steps > 0 && (wantsBossIntro || bossCinematic.active || Math.floor(time * 60) % 4 === 0)) publish();
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
    if (bossCinematic.active && bossCinematic.phase === "speaking") {
      if ((e.code === "Space" || e.code === "Enter" || e.code === "Escape") && bossCinematic.timer >= 1.0) {
        skipBossCinematic();
      }
      return;
    }
    if (e.code === "Escape") {
      keys.clear();
      hot = false;
      return;
    }
    if (!CODE[e.code]) return;
    if (!hot && document.activeElement !== canvas) return;
    e.preventDefault();
    // Ignore OS keyboard auto-repeat so holding Attack NEVER fires fake rising-edge presses!
    if (e.repeat || keys.has(e.code)) return;
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
    getAttackPhase: () => player.attackPhase,
    getComboStep: () => player.comboStep,
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
      filteredPropCache.clear();
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
      if (bossCinematic.active) {
        if (!down) {
          pointer.delete(action);
        }
        return;
      }
      if (down) {
        // Only register rising-edge press if action was not already held down
        if (!pointer.has(action)) {
          pointerDownThisFrame.add(action);
        }
        pointer.add(action);
      } else {
        pointer.delete(action);
      }
    },
    skipBossIntro() {
      skipBossCinematic();
    },
    reset() {
      if (gameMode === "horde") {
        hordeWave = 1;
        hordeKills = 0;
        bladeDmgMultiplier = 1.0;
        spellCdMultiplier = 1.0;
        currentHordeStageId = 1;
        void switchHordeStageTheme(1);
      } else {
        sound.playStageBgm(level.id);
      }
      spawn();
      publish();
    },
    chooseBlessing(type: "hp" | "blade" | "magic") {
      if (type === "hp") {
        player.hp = Math.min(T.maxHp, player.hp + Math.round(T.maxHp * 0.5));
        player.toast = "Cálice Carmesim: +50% HP Restaurado!";
        player.toastT = 2.8;
      } else if (type === "blade") {
        bladeDmgMultiplier += 0.15;
        player.toast = `Fio de Prata: Dano de Lâmina +15%!`;
        player.toastT = 2.8;
      } else if (type === "magic") {
        player.special = 100;
        spellCdMultiplier = Math.max(0.4, spellCdMultiplier * 0.85);
        player.toast = "Essência Arcana: Especial Cheio e Recarga -15%!";
        player.toastT = 2.8;
      }
      hordeUpgradeAvailable = false;
      sound.playSfx("relic");
      startHordeWave(hordeWave + 1);
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
