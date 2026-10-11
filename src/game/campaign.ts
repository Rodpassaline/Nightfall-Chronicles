import { GROUND_Y, levels, type ItemKind, type ItemSpawn, type Kind, type LevelDef, type PropKind } from "./levels";
import { tuning as T } from "./tuning";
import { sound } from "./audio";
import stageLayersManifest from "./stage-layers.json";

export type GameHud = {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;
  bossName: string;
  bossHp: number;
  bossMax: number;
  bossOn: boolean;
  toast: string;
  won: boolean;
  dead: boolean;
  title: string;
  dashReady: boolean;
  charge: number;
};

type Action = "left" | "right" | "jump" | "aimUp" | "aimDown" | "attack" | "dash" | "spell" | "guard";

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
  homeX: number;
  homeY: number;
  t: number;
  cd: number;
  wind: number;
  state: string;
  hurt: number;
  dead: boolean;
  lastSwing: number;
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
  vampire: "/sprites/vampire.png",
  gargoyle: "/sprites/gargoyle.png",
  bat: "/sprites/bat.png",
  skeleton: "/sprites/skeleton.png",
  armoredSkeleton: "/sprites/armored-skeleton.png",
  redSkeleton: "/sprites/red-skeleton.png",
  zombie: "/sprites/zombie.png",
  knight: "/sprites/knight.png",
  dracula: "/sprites/dracula.png",
  bossPetros: "/sprites/boss-petros.png",
  bossValerius: "/sprites/boss-valerius.png",
  bossSeraphine: "/sprites/boss-seraphine.png",
  bossNocturne: "/sprites/boss-nocturne.png",
  bossVeyne: "/sprites/boss-veyne.png",
  bossCalx: "/sprites/boss-calx.png",
  bossDracula: "/sprites/boss-dracula.png",
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
  gargoyle: "/sprites/gargoyle.png",
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

function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

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
      img.src = src;
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
  const injected = new Set<string>();
  const pointer = new Set<Action>();
  let alive = true;
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
  let enemies: Enemy[] = [];
  let items: ActiveItem[] = [];
  let clearedOnce = false;
  let bossIntroPlayed = false;

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
    jumps: 1,
    dashT: 0,
    dashCd: 0,
    dashDir: 1 as 1 | -1,
    iframes: 0,
    hurtT: 0,
    hp: T.maxHp as number,
    mana: T.maxMana as number,
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

  function makeEnemy(spawn: LevelDef["spawns"][number]): Enemy {
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
    const y = spawn.kind === "bat" ? floor - (spawn.boss ? 56 : 74) : floor - h;
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
      hp: spawn.hp,
      max: spawn.hp,
      facing: -1,
      boss: isBoss,
      homeX: spawn.x,
      homeY: y,
      t: Math.random() * 3,
      cd: 0.8,
      wind: 0,
      state: spawn.kind === "gargoyle" || spawn.kind === "bossPetros" ? "perch" : "idle",
      hurt: 0,
      dead: false,
      lastSwing: -1,
    };
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
    player.lives = 3;
    player.dead = false;
    player.won = false;
    player.iframes = 0;
    player.hurtT = 0;
    player.attackT = 0;
    player.castT = 0;
    player.castFired = false;
    player.dashT = 0;
    player.charge = "idle";
    player.toast = `${level.title}. Há escadas e ruínas adiante.`;
    player.toastT = 2.6;
    clearedOnce = false;
    bossIntroPlayed = false;
    sound.stopBossVoice();
    shots.length = 0;
    enemies = level.spawns.map(makeEnemy);
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
    initParticles();
    // Play stage-specific music track (Fase 1-7, com Fase 7 tocando Sinister Horror para o Mestre)
    sound.playStageBgm(level.id);
  }

  function actions() {
    const set = new Set<Action>(pointer);
    for (const code of new Set([...keys, ...injected])) {
      const mapped = CODE[code];
      if (mapped) for (const action of mapped) set.add(action);
    }
    return set;
  }

  function resolve(body: Body, dt: number, drop: boolean) {
    body.wall = 0;
    body.grounded = false;
    body.x += body.vx * dt;
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
    player.hp -= dmg;
    player.iframes = T.hurtIFrames;
    player.hurtT = 0.16;
    player.vy = -140;
    player.vx = player.x < fromX ? -120 : 120;
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
    if (player.hp <= 0) {
      if (player.lives > 1) {
        player.lives--;
        player.hp = T.maxHp;
        player.mana = Math.max(player.mana, 60);
        player.iframes = 3.2; // 3.2s invulnerability (flicker)
        player.hurtT = 0;
        player.vx = 0;
        player.vy = -70;
        player.dead = false;
        player.toast = `Ressuscitado no local! Vidas restantes: ${player.lives}`;
        player.toastT = 3.5;
        sound.playSfx("revive");
        shake = 6;

        // Push nearby enemies away to give breathing room
        for (const e of enemies) {
          if (!e.dead && Math.abs(e.x + e.w / 2 - (player.x + player.w / 2)) < 90) {
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
        player.dead = true;
        sound.stopBossVoice();
        player.toast = "Fim de jogo! Todas as 3 vidas foram perdidas.";
        player.toastT = 4.0;
        sound.playBgm("gameover");
      }
    }
  }

  function hurtEnemy(e: Enemy, dmg: number, pogo: boolean, hitSource: "slash" | "spell" = "slash") {
    if (e.dead || e.lastSwing === player.swingId) return;

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

    // Boss Valerius shield blocking front attacks
    if (e.kind === "bossValerius" && e.state === "shield" && !pogo) {
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

    // Knight shield deflection (reduces frontal dmg)
    if (e.kind === "knight" && e.state === "shield" && !pogo) {
      const isFrontal = (player.x - (e.x + e.w / 2)) * e.facing < 0;
      if (isFrontal) {
        dmg = Math.max(1, Math.floor(dmg / 2));
      }
    }

    e.lastSwing = player.swingId;
    e.hp -= dmg;

    // Hitstun duration and recovery delay (slows down enemy and prevents immediate counter-advance)
    const isHeavy = player.combo === 2 || hitSource === "spell" || pogo || dmg >= 2;
    e.hurt = e.boss ? (isHeavy ? 0.26 : 0.18) : (isHeavy ? 0.42 : 0.32);
    e.cd = Math.max(e.cd, e.boss ? 0.35 : 0.52);
    e.wind = 0; // Interrupt active windup on enemies
    if (!e.boss && e.state === "slash") e.state = "idle";

    // Dynamic recoil impulse (knocks the enemy back away from player strike)
    const knockDir = (e.x + e.w / 2) >= (player.x + player.w / 2) ? 1 : -1;
    const baseKnock = e.boss ? 42 : (e.kind === "armoredSkeleton" || e.kind === "knight") ? 85 : 125;
    const knockSpeed = isHeavy ? baseKnock * 1.35 : baseKnock;
    e.vx = knockDir * knockSpeed;
    if (!e.boss && e.grounded) {
      e.vy = -65; // Subtle recoil pop up off the floor
      e.grounded = false;
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
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      sound.playSfx("enemyDie");
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

        // Dramatic boss demise particles burst
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
      } else if (Math.random() < 0.28) {
        const roll = Math.random();
        const kind: ItemKind = roll < 0.12 ? "life" : roll < 0.55 ? "heal" : "mana";
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

  function step(dt: number, press: { jump: boolean; attack: boolean; dash: boolean; spell: boolean }, held: Set<Action>) {
    time += dt;
    player.toastT = Math.max(0, player.toastT - dt);
    player.iframes = Math.max(0, player.iframes - dt);
    player.hurtT = Math.max(0, player.hurtT - dt);
    player.dashCd = Math.max(0, player.dashCd - dt);
    player.attackLock = Math.max(0, player.attackLock - dt);
    player.comboWindow = Math.max(0, player.comboWindow - dt);
    player.dropT = Math.max(0, player.dropT - dt);
    player.controlLock = Math.max(0, player.controlLock - dt);
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
    player.guard = held.has("guard") && player.grounded && player.attackT <= 0 && player.castT <= 0 && player.dashT <= 0 && player.hurtT <= 0 && player.charge !== "wind";
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
    if (player.attackT > 0) player.attackT -= dt;
    if (player.attackT <= 0 && player.attackLock > 0 && player.castT <= 0) player.comboWindow = Math.max(player.comboWindow, 0.20);
    if (player.castT > 0) {
      const before = player.castT;
      player.castT = Math.max(0, player.castT - dt);
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

    const holding = held.has("attack");
    if (holding && player.charge !== "wind" && player.castT <= 0) player.holdT += dt;
    if (!holding) {
      if (player.charge === "wind") {
        player.charge = "idle";
        player.swingId++;
        player.attackT = 0.3;
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
        sound.playSfx("spell");
        sound.playSfx("slashHeavy");
      }
      player.holdT = 0;
    }
    if (player.castT <= 0 && player.charge !== "wind" && holding && player.holdT > 0.48 && player.attackLock <= 0) {
      player.charge = "wind";
      sound.playSfx("chargeWind");
    }

    if (player.hurtT <= 0) {
      if (press.attack && !player.guard && player.castT <= 0 && player.charge !== "wind" && (player.attackLock <= 0 || player.comboWindow > 0)) {
        player.swingId++;
        const down = aimDown && !player.grounded && !player.crouching;
        player.attackKind = down ? "down" : aimUp ? "up" : player.crouching ? "crouch" : "side";
        player.combo = (player.attackKind === "side" || player.attackKind === "crouch") && player.comboWindow > 0 ? (player.combo + 1) % 3 : 0;
        player.attackT = 0.20;
        player.attackLock = 0.20;
        player.comboWindow = 0;
        if (player.combo === 2) sound.playSfx("slashHeavy");
        else sound.playSfx("slash");
      }
      if (press.spell && !player.guard && player.castT <= 0) {
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
      if (press.dash && player.dashCd <= 0 && player.dashT <= 0) {
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
      if (player.charge === "wind") {
        player.vx *= Math.max(0, 1 - 10 * dt);
      } else if (player.castT > 0) {
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
      for (const e of enemies) if (!e.dead && overlap(box, e)) hurtEnemy(e, player.combo === 2 ? T.finisherDamage : T.slashDamage, player.attackKind === "down", "slash");

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
          player.hp = Math.min(T.maxHp, player.hp + 3);
          player.toast = "Elixir Carmesim! +3 HP restaurado.";
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
          player.mana = Math.min(T.maxMana, player.mana + 45);
          player.toast = "Éter Astral! +45 Mana restaurada.";
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
        for (const e of enemies) {
          if (e.dead || s.hits.includes(e.id) || !overlap(s, e)) continue;
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

    const dx = player.x + player.w / 2 - (e.x + e.w / 2);
    const dist = Math.abs(dx);
    e.facing = dx >= 0 ? 1 : -1;

    // =========================================================================
    // PROXIMITY ACTIVATION: Full-screen aggressive detection!
    // Enemies spot and hunt Aldric as soon as he is anywhere on screen or approaching.
    // =========================================================================
    const maxActiveDist = e.boss ? 620 : 480;
    if (dist > maxActiveDist) {
      e.vx = 0;
      if (e.kind !== "bat") {
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
      }
      return;
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
    // 1. BAT (Common flying predator - aggressive aerial swoop flight)
    // =========================================================================
    if (e.kind === "bat") {
      if (dist < 380) {
        // Fast predatory sine-wave swoop intercepting player
        const swoopSpeed = e.boss ? 135 : 105;
        e.vx = Math.sign(dx) * swoopSpeed;
        const wave = Math.sin(e.t * 5.6) * 32;
        const targetY = player.y - 12 + wave;
        e.y += (targetY - e.y) * Math.min(1, dt * 4.2);
        e.x += e.vx * dt;
      } else {
        const tx = e.homeX + Math.sin(e.t * 2.2) * 32;
        const ty = e.homeY + Math.sin(e.t * 3.4) * 10;
        e.x += (tx - e.x) * Math.min(1, dt * 2.0);
        e.y += (ty - e.y) * Math.min(1, dt * 2.0);
      }
      e.y = clamp(e.y, 16, GROUND_Y - 20);
    }
    // =========================================================================
    // 2. BOSS 1: Petros, Gárgula Colossal de Pedra (Os Portões)
    // =========================================================================
    else if (e.kind === "bossPetros") {
      const isEnraged = e.hp / e.max < 0.5;
      if (e.cd <= 0 && dist > 70 && e.state !== "dive") {
        // High leap and crushing dive smash
        e.state = "dive";
        e.vy = isEnraged ? -240 : -200;
        e.cd = isEnraged ? 1.4 : 1.9;
        sound.playBossAttack(1, 2); // Salto e impacto sísmico
      }
      if (e.state === "dive") {
        e.vx = Math.sign(dx) * (isEnraged ? 140 : 115);
        if (e.grounded || e.y >= e.homeY - 8) {
          e.state = "idle";
          e.vx = 0;
          shake = isEnraged ? 7 : 5;
          sound.playBossAttack(1, 2); // Impacto estrondoso de pedra no solo
          fire({ x: e.x - 20, y: e.y + e.h - 18, w: 16, h: 18, vx: -170, vy: 0, life: 1.2, dmg: 1, friendly: false, sprite: "spell" });
          fire({ x: e.x + e.w + 4, y: e.y + e.h - 18, w: 16, h: 18, vx: 170, vy: 0, life: 1.2, dmg: 1, friendly: false, sprite: "spell" });
          if (isEnraged) {
            for (let r = 0; r < 2; r++) {
              fire({
                x: e.x + (r === 0 ? -45 : 45) + (Math.random() - 0.5) * 30,
                y: -10,
                w: 16,
                h: 18,
                vx: (Math.random() - 0.5) * 20,
                vy: 200,
                life: 1.6,
                dmg: 1,
                friendly: false,
                sprite: "spell",
              });
            }
          }
        }
      } else {
        if (dist <= 56 && e.cd <= 0) {
          e.wind = 0.18;
          e.cd = 0.6;
          e.state = "slash";
          sound.playBossAttack(1, 1); // Ataque 1: Soco / Garra de pedra colossal
        }
        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * (isEnraged ? 60 : 45);
          if (e.wind <= 0) {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 38, y: e.y + 12, w: 42, h: 48 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "idle";
          }
        } else {
          // Relentless forward march into Aldric
          e.state = "idle";
          e.vx = Math.sign(dx) * (isEnraged ? 65 : 48);
        }
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 3. BOSS 2: Valerius, Cavaleiro Sombrio Vampírico (A Grande Galeria)
    // =========================================================================
    else if (e.kind === "bossValerius") {
      const isEnraged = e.hp / e.max < 0.5;
      if (dist <= 54 && e.cd <= 0) {
        e.state = "slash";
        e.wind = 0.15;
        e.cd = 0.5;
        sound.playBossAttack(2, 1); // Ataque 1: Investida com lâmina pesada
      }
      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (isEnraged ? 180 : 145);
        if (e.wind <= 0) {
          const box = { x: e.facing > 0 ? e.x + e.w : e.x - 42, y: e.y + 14, w: 48, h: 46 };
          if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
          sound.playBossAttack(2, 2); // Ataque 2: Onda de corte crescente sombrio
          // Dark crescent ground wave
          fire({
            x: e.x + (e.facing > 0 ? e.w : -24),
            y: e.y + e.h - 32,
            w: 24,
            h: 32,
            vx: e.facing * 190,
            vy: 0,
            life: 1.2,
            dmg: 1,
            friendly: false,
            sprite: "slash",
          });
          e.state = "shield";
        }
      } else {
        // Relentless disciplined shield advance
        e.state = "shield";
        e.vx = e.facing * (isEnraged ? 60 : 44);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 4. BOSS 3: Seraphine, Sacerdotisa de Sangue (A Capela Sagrada)
    // =========================================================================
    else if (e.kind === "bossSeraphine") {
      const isEnraged = e.hp / e.max < 0.5;
      e.y = e.homeY + Math.sin(e.t * 3.2) * 14;
      if (dist < 60) {
        // Immediate escape teleport and counter-barrage if player gets too close!
        if (e.cd <= 0.4) {
          e.x = clamp(player.x + (e.facing > 0 ? -120 : 120), e.homeX - 150, e.homeX + 150);
          sound.playBossAttack(3, 2); // Ataque 2: Teletransporte e explosão de sangue
          e.cd = isEnraged ? 0.9 : 1.2;
        }
      }
      if (e.cd <= 0) {
        e.cd = isEnraged ? 1.1 : 1.5;
        sound.playBossAttack(3, 1); // Ataque 1: Feitiço de magia de sangue (leque de orbes)
        // Fan of blood orbs fired towards player
        const orbCount = isEnraged ? 4 : 3;
        for (let i = 0; i < orbCount; i++) {
          const spreadY = (i - Math.floor(orbCount / 2)) * 32;
          fire({
            x: e.x + (e.facing > 0 ? e.w : -12),
            y: e.y + 20,
            w: 14,
            h: 14,
            vx: e.facing * (isEnraged ? 155 : 130),
            vy: spreadY,
            life: 1.8,
            dmg: 1,
            friendly: false,
            sprite: "blood",
          });
        }
      }
    }
    // =========================================================================
    // 5. BOSS 4: Nocturne, Lorde Morcego Feral (As Catacumbas)
    // =========================================================================
    else if (e.kind === "bossNocturne") {
      const isEnraged = e.hp / e.max < 0.5;
      const tx = player.x + Math.sin(e.t * 3.2) * 45;
      const ty = clamp(player.y - 32 + Math.cos(e.t * 3.8) * 30, 20, GROUND_Y - 40);
      e.x += (tx - e.x) * Math.min(1, dt * (isEnraged ? 3.6 : 2.8));
      e.y += (ty - e.y) * Math.min(1, dt * (isEnraged ? 3.6 : 2.8));
      if (dist <= 52 && e.cd <= 0.4) {
        sound.playBossAttack(4, 2); // Ataque 2: Rasante predatório de garras
      }
      if (e.cd <= 0) {
        e.cd = isEnraged ? 1.1 : 1.5;
        sound.playBossAttack(4, 1); // Ataque 1: Onda sônica / guincho estridente de morcegos
        // Sonic screech shockwave
        fire({
          x: e.x + (e.facing > 0 ? e.w : -16),
          y: e.y + e.h / 2 - 8,
          w: 22,
          h: 22,
          vx: e.facing * (isEnraged ? 190 : 160),
          vy: 0,
          life: 1.5,
          dmg: 1,
          friendly: false,
          sprite: "spell",
        });
      }
    }
    // =========================================================================
    // 6. BOSS 5: Lorde Veyne, Arquivista das Sombras (A Grande Biblioteca)
    // =========================================================================
    else if (e.kind === "bossVeyne") {
      const isEnraged = e.hp / e.max < 0.5;
      if (dist <= 52 && e.cd <= 0) {
        // Close range arcane burst
        e.cd = 0.55;
        e.state = "slash";
        e.wind = 0.16;
        sound.playBossAttack(5, 2); // Ataque 2: Explosão de magia sombria corpo a corpo
      } else if (dist > 52 && e.cd <= 0) {
        e.cd = isEnraged ? 1.0 : 1.4;
        e.state = "slash";
        e.wind = 0.25;
        sound.playBossAttack(5, 1); // Ataque 1: Projéteis de crânios arcanos flamejantes
        // Flaming arcane skulls
        fire({
          x: e.x + (e.facing > 0 ? e.w : -16),
          y: e.y + 14,
          w: 16,
          h: 16,
          vx: e.facing * (isEnraged ? 145 : 125),
          vy: -130,
          gravity: 320,
          life: 2.1,
          dmg: 1,
          friendly: false,
          sprite: "spell",
        });
        if (isEnraged) {
          fire({
            x: e.x + (e.facing > 0 ? e.w : -16),
            y: e.y + 14,
            w: 16,
            h: 16,
            vx: e.facing * 95,
            vy: -160,
            gravity: 320,
            life: 2.1,
            dmg: 1,
            friendly: false,
            sprite: "spell",
          });
        }
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * (isEnraged ? 45 : 30);
        if (e.wind <= 0) {
          if (dist <= 56) {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 38, y: e.y + 12, w: 42, h: 44 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "spell");
          }
          e.state = "idle";
        }
      } else {
        e.state = "idle";
        e.vx = Math.sign(dx) * (isEnraged ? 55 : 42);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 7. BOSS 6: Calx, Abominação Alquímica (O Laboratório de Alquimia)
    // =========================================================================
    else if (e.kind === "bossCalx") {
      const isEnraged = e.hp / e.max < 0.5;
      if (dist <= 56 && e.cd <= 0) {
        // Seismic Stomp & Cleave
        e.state = "smash";
        e.wind = 0.16;
        e.cd = isEnraged ? 0.9 : 1.3;
        shake = 6;
        sound.playBossAttack(6, 1); // Ataque 1: Pisotão sísmico e rugido da abominação
        if (player.grounded && dist < 90) {
          hurtPlayer(1, e.x, "slash");
        }
        fire({ x: e.x - 18, y: e.y + e.h - 16, w: 16, h: 16, vx: -160, vy: 0, life: 1.2, dmg: 1, friendly: false, sprite: "spell" });
        fire({ x: e.x + e.w + 4, y: e.y + e.h - 16, w: 16, h: 16, vx: 160, vy: 0, life: 1.2, dmg: 1, friendly: false, sprite: "spell" });
      } else if (dist > 56 && e.cd <= 0) {
        e.cd = isEnraged ? 1.2 : 1.6;
        sound.playBossAttack(6, 2); // Ataque 2: Lançamento de frascos químicos ácidos
        // Toxic alchemy flask
        fire({
          x: e.x + (e.facing > 0 ? e.w : -14),
          y: e.y + 12,
          w: 16,
          h: 16,
          vx: e.facing * (isEnraged ? 145 : 120),
          vy: -135,
          gravity: 350,
          life: 2.0,
          dmg: 1,
          friendly: false,
          sprite: "spell",
        });
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * 40;
        if (e.wind <= 0) e.state = "idle";
      } else {
        e.state = "idle";
        e.vx = Math.sign(dx) * (isEnraged ? 56 : 42);
      }
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }
    // =========================================================================
    // 8. FINAL BOSS: Conde Drácula (A Sala do Trono)
    // =========================================================================
    else if (e.kind === "bossDracula" || e.kind === "dracula") {
      const draculaPhase = e.hp / e.max > 0.66 ? 1 : e.hp / e.max > 0.33 ? 2 : 3;
      const hover = draculaPhase === 3 ? 10 : 0;
      e.y = e.homeY - hover;
      const minX = e.homeX - 110;
      const maxX = e.homeX + 90;

      if (dist <= 52 && e.cd <= 0) {
        // Immediate Demonic Vampire Claw Strike when player is near!
        e.state = "slash";
        e.wind = 0.12;
        e.cd = draculaPhase === 3 ? 0.35 : 0.5;
        sound.playBossAttack(7, 1); // Ataque 1: Garras demoníacas de sangue
      }

      if (e.wind > 0) {
        e.wind -= dt;
        e.vx = e.facing * 75;
        if (e.wind <= 0) {
          if (e.state === "slash") {
            const box = { x: e.facing > 0 ? e.x + e.w : e.x - 42, y: e.y + e.h - 70, w: 46, h: 48 };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "idle";
          } else {
            // Hellfire Volley fired forward
            sound.playBossAttack(7, 1); // Ataque 1: Fogo do Inferno
            const count = draculaPhase === 1 ? 3 : draculaPhase === 2 ? 4 : 5;
            for (let i = 0; i < count; i++) {
              const chest = e.y + e.h - 78;
              const spreadY = -25 + i * 20;
              fire({
                x: e.x + (e.facing > 0 ? e.w : -12),
                y: chest - 6,
                w: 16,
                h: 28,
                vx: e.facing * (130 + draculaPhase * 25),
                vy: spreadY,
                life: 2.1,
                dmg: 1,
                friendly: false,
                sprite: "blood",
                drawCenterY: chest,
              });
            }
            if (draculaPhase === 3) {
              shake = 5;
              sound.playBossAttack(7, 2); // Ataque 2: Chuva de meteoros carmesim
              for (let m = 0; m < 2; m++) {
                fire({
                  x: e.x + (m === 0 ? -50 : 50) + (Math.random() - 0.5) * 30,
                  y: -15,
                  w: 16,
                  h: 26,
                  vx: (Math.random() - 0.5) * 20,
                  vy: 200,
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
        // Teleport within throne arena
        e.x = clamp(player.x + (player.x < e.homeX ? 75 : -75), minX, maxX);
        sound.playBossAttack(7, 2); // Ataque 2: Teletransporte de fenda sombria
        e.wind = draculaPhase === 3 ? 0.22 : 0.32;
        e.cd = draculaPhase === 3 ? 0.8 : draculaPhase === 2 ? 1.05 : 1.35;
      } else {
        // Advances relentlessly
        e.vx = Math.sign(dx) * (draculaPhase === 3 ? 85 : draculaPhase === 2 ? 70 : 55);
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
        if (dist <= 52 && e.cd <= 0) {
          e.wind = 0.15;
          e.cd = 0.52;
          e.state = "slash";
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 55; // Gladius lunge forward!
          if (e.wind <= 0) {
            // Forward gladius lunge (reach 44px, 2 damage)
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 44,
              y: e.y + 10,
              w: 46,
              h: 34,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "shield";
          }
        } else {
          // Relentless disciplined shield march - NEVER stands still!
          e.state = "shield";
          e.vx = e.facing * 50;
        }
      }
      // -----------------------------------------------------------------------
      // B. RED SKELETON: Cursed Blood Bone Hurler & Vicious Close-Quarters Cleave
      // -----------------------------------------------------------------------
      else if (e.kind === "redSkeleton") {
        if (dist <= 52) {
          // Close quarters: Cursed bone cleave!
          if (e.cd <= 0) {
            e.state = "slash";
            e.wind = 0.12;
            e.cd = 0.42;
          }
        } else if (dist <= 400) {
          // Blood bone throw
          if (e.cd <= 0) {
            e.cd = 0.8;
            e.state = "slash";
            e.wind = 0.12;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 12,
              w: 14,
              h: 14,
              vx: e.facing * (125 + Math.random() * 30),
              vy: -155,
              gravity: 370,
              life: 2.2,
              dmg: 1,
              friendly: false,
              sprite: "spell",
            });
          }
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 40;
          if (e.wind <= 0) {
            if (dist <= 56) {
              const box = {
                x: e.facing > 0 ? e.x + e.w - 4 : e.x - 42,
                y: e.y + 8,
                w: 44,
                h: 36,
              };
              if (overlap(box, player)) hurtPlayer(1, e.x, "slash");
            }
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 56; // Relentless undead sprint
        }
      }
      // -----------------------------------------------------------------------
      // C. SKELETON: Parabolic Bone Volley & Close-Quarters Bone Dagger Thrust
      // -----------------------------------------------------------------------
      else if (e.kind === "skeleton") {
        if (dist <= 48) {
          // Close quarters: Lethal bone dagger thrust!
          if (e.cd <= 0) {
            e.state = "slash";
            e.wind = 0.14;
            e.cd = 0.5;
          }
        } else if (dist <= 380) {
          // Parabolic bone toss
          if (e.cd <= 0) {
            e.cd = 0.85;
            e.state = "slash";
            e.wind = 0.12;
            fire({
              x: e.x + (e.facing > 0 ? e.w : -12),
              y: e.y + 10,
              w: 14,
              h: 14,
              vx: e.facing * (115 + Math.random() * 30),
              vy: -145,
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
          e.vx = e.facing * 35; // Steps forward aggressively during attack
          if (e.wind <= 0) {
            if (dist <= 52) {
              const box = {
                x: e.facing > 0 ? e.x + e.w - 4 : e.x - 38,
                y: e.y + 10,
                w: 40,
                h: 34,
              };
              if (overlap(box, player)) hurtPlayer(1, e.x, "slash");
            }
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 52; // Always pursues Aldric!
        }
      }
      // -----------------------------------------------------------------------
      // D. KNIGHT: Tower Armor Guard & Heavy Halberd Cleave
      // -----------------------------------------------------------------------
      else if (e.kind === "knight") {
        if (dist <= 58 && e.cd <= 0) {
          e.wind = 0.18;
          e.cd = 0.55;
          e.state = "slash";
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 60; // Halberd thrust rush!
          if (e.wind <= 0) {
            // Extended halberd thrust (reach 52px, 2 damage)
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 52,
              y: e.y + 8,
              w: 54,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "shield";
          }
        } else {
          // Armored pursuit with halberd guard
          e.state = "shield";
          e.vx = e.facing * 48;
        }
      }
      // -----------------------------------------------------------------------
      // E. ZOMBIE: Shambling Predatory Sprint & Feral Claw Strike
      // -----------------------------------------------------------------------
      else if (e.kind === "zombie") {
        if (dist <= 46 && e.cd <= 0) {
          e.wind = 0.12;
          e.cd = 0.42;
          e.state = "slash";
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 45; // Feral leap into player!
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
          e.vx = e.facing * 62; // Shambling predatory sprint!
        }
      }
      // -----------------------------------------------------------------------
      // F. VAMPIRE: High-Speed Stalker, Shadow Claw Rush & Blood Orbs
      // -----------------------------------------------------------------------
      else if (e.kind === "vampire") {
        if (dist <= 54 && e.cd <= 0) {
          e.wind = 0.12;
          e.cd = 0.45;
          e.state = "slash";
        } else if (dist > 70 && dist <= 380 && e.cd <= 0) {
          e.cd = 0.95;
          fire({
            x: e.x,
            y: e.y + e.h - 60,
            w: 16,
            h: 28,
            vx: e.facing * 145,
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
          e.vx = e.facing * 115; // Rapid shadow rush
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 44,
              y: e.y + 8,
              w: 46,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(2, e.x, "slash");
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 88; // High speed stalker
        }
      }
      // -----------------------------------------------------------------------
      // G. GARGOYLE: Relentless Stone Chase & Heavy Stone Claw Swipe
      // -----------------------------------------------------------------------
      else {
        if (dist <= 50 && e.cd <= 0) {
          e.wind = 0.14;
          e.cd = 0.48;
          e.state = "slash";
        }

        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = e.facing * 65; // Stone dive
          if (e.wind <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w - 4 : e.x - 42,
              y: e.y + 8,
              w: 44,
              h: 36,
            };
            if (overlap(box, player)) hurtPlayer(1, e.x, "slash");
            e.state = "idle";
          }
        } else {
          e.state = "idle";
          e.vx = e.facing * 66; // Relentless stone chase
        }
      }

      // Apply gravity and resolve solid collision firmly to the floor
      e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
      resolve(e, dt, false);
    }

    // Touch contact damage (only when enemy is recovered from hitstun)
    if (!e.dead && e.hurt <= 0 && overlap(e, player)) hurtPlayer(1, e.x + e.w / 2, "slash");
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
      g.fillStyle = "#0c0812";
      g.fillRect(0, 0, T.viewW, T.viewH);

      // Gothic Stage Card Transition (no flat untextured boxes visible)
      g.save();
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#d4af37";
      g.font = "bold 13px Cinzel, serif";
      g.fillText(`FASE ${level.id} · ${level.title.toUpperCase()}`, T.viewW / 2, T.viewH / 2 - 8);
      g.fillStyle = "rgba(215, 205, 225, 0.7)";
      g.font = "9px Cinzel, serif";
      g.fillText(level.place, T.viewW / 2, T.viewH / 2 + 10);
      g.restore();
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
      if (e.dead) continue;
      if (e.hurt > 0 && Math.floor(time * 24) % 2 === 0) continue;
      let frame = 0;
      if (e.hurt > 0) {
        frame = 3;
      } else if (e.state === "slash" || e.wind > 0 || e.state === "smash") {
        frame = 2;
      } else if (e.state === "dive") {
        frame = 2;
      } else if (e.kind === "bat") {
        frame = Math.floor(e.t * 8) % 4;
      } else if (Math.abs(e.vx) > 3) {
        // Real walking animation: smoothly alternates stepping legs (frame 0 and 1)
        frame = Math.floor(time * 5.5) % 2;
      } else {
        frame = 0;
      }
      let tall = e.kind === "bat" && e.boss ? 92 : DRAW_H[e.kind];
      if ((e.kind === "dracula" || e.kind === "bossDracula") && e.hp / e.max <= 0.33) tall *= 1.25;
      const feet = e.y + e.h + (FEET_OFF[e.kind] ?? 0);
      blit(art[e.kind], frame, e.x + e.w / 2, feet, tall, e.facing);
    }

    const isInvulnerable = player.iframes > 0;
    if (isInvulnerable) {
      g.save();
      g.globalAlpha = Math.floor(time * 20) % 2 === 0 ? 0.45 : 0.85;
    }

    let sheet: ArtKey = "heroIdle";
    let frame = Math.floor(time * 3) % 4;
    if (player.dashT > 0) {
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
    } else if (player.attackT > 0 || player.charge === "wind") {
      if (player.attackKind === "crouch") {
        sheet = "heroCrouch";
        frame = player.charge === "wind" ? 1 : player.attackT > 0.1 ? 1 : 2;
      } else if (player.attackKind === "down" && !player.grounded) {
        sheet = "heroJump";
        frame = 3;
      } else {
        sheet = "heroAttack";
        if (player.charge === "wind") frame = 0;
        else if (player.attackKind === "up") frame = 1;
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
    // the 320px cells keep the boots 56px above the cell bottom, so push the cell down to the hitbox feet
    const heroFeet = player.y + player.h + (56 / 320) * DRAW_H.hero;
    blit(art[sheet], frame, player.x + player.w / 2, heroFeet, DRAW_H.hero, player.facing, 3);
    if (isInvulnerable) {
      g.restore();
    }
    if (player.charge === "wind") {
      const pulse = 0.5 + Math.sin(time * 9) * 0.2;
      const gx = player.x + player.w / 2 + player.facing * 6 - camX;
      const gy = player.y + player.h - 58 - camY;
      g.save();
      g.globalAlpha = pulse;
      const glow = g.createRadialGradient(gx, gy, 2, gx, gy, 34);
      glow.addColorStop(0, "rgba(255,200,110,0.9)");
      glow.addColorStop(1, "rgba(222,75,46,0)");
      g.fillStyle = glow;
      g.fillRect(gx - 34, gy - 34, 68, 68);
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
      if (level.id === 7) {
        if (sound.getCurrentTrack() !== "stage7") {
          sound.playStageBgm(7);
        }
      } else if (sound.getCurrentTrack() !== "boss") {
        sound.playBgm("boss");
      }
    }
    onHud({
      hp: player.hp,
      maxHp: T.maxHp,
      mana: Math.round(player.mana),
      maxMana: T.maxMana,
      lives: player.lives,
      bossName: boss?.name || "",
      bossHp: boss ? Math.max(0, boss.hp) : 0,
      bossMax: boss?.max || 1,
      bossOn,
      toast: player.toastT > 0 ? player.toast : "",
      won: player.won,
      dead: player.dead,
      title: level.title,
      dashReady: player.dashCd <= 0,
      charge: player.charge === "wind" ? 1 : Math.min(1, player.holdT / 0.48),
    });
  }

  function frame(now: number) {
    if (!alive) return;
    if (!readyToRender) {
      last = now;
      acc = 0;
      draw();
      raf = requestAnimationFrame(frame);
      return;
    }
    acc += Math.min(0.05, (now - last) / 1000);
    last = now;
    const held = actions();
    const press = {
      jump: held.has("jump") && !prev.has("jump"),
      attack: held.has("attack") && !prev.has("attack"),
      dash: held.has("dash") && !prev.has("dash"),
      spell: held.has("spell") && !prev.has("spell"),
    };
    prev = held;
    let first = true;
    let steps = 0;
    while (acc >= 1 / 60 && steps < 5) {
      if (hitstop > 0) hitstop -= 1 / 60;
      else {
        step(1 / 60, first ? press : { jump: false, attack: false, dash: false, spell: false }, held);
        first = false;
      }
      acc -= 1 / 60;
      steps++;
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
      if (down) pointer.add(action);
      else pointer.delete(action);
    },
    reset() {
      spawn();
      publish();
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
