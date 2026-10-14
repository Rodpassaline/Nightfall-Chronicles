import { tuning as T } from "./tuning";
import { sound } from "./audio";

export type HudSnap = {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  relics: number;
  relicsMax: number;
  bossHp: number;
  bossMax: number;
  bossName: string;
  bossOn: boolean;
  toast: string;
  won: boolean;
  dead: boolean;
  dashReady: boolean;
  charge: number;
  clears: number;
};

export type ControlsProbe = {
  getX: () => number;
  getFacing: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}

type Action = "left" | "right" | "jump" | "aimUp" | "aimDown" | "attack" | "dash" | "spell";

type Solid = { x: number; y: number; w: number; h: number; oneWay?: boolean };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
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
  kind: "wave" | "spell" | "bolt";
  hits: number[];
};

type Enemy = {
  id: number;
  kind: "bat" | "gargoyle" | "vampire" | "captain";
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  facing: 1 | -1;
  hurt: number;
  state: string;
  homeX: number;
  homeY: number;
  t: number;
  cd: number;
  wind: number;
  grounded: boolean;
  wall: -1 | 0 | 1;
  dead: boolean;
};

type Relic = { x: number; y: number; got: boolean };

const WORLD_W = 2300;
const GROUND = 232;

const solids: Solid[] = [
  { x: 0, y: GROUND, w: 640, h: 48 },
  { x: 730, y: GROUND, w: 1570, h: 48 },
  { x: 392, y: 78, w: 14, h: 110 },
  { x: 468, y: 78, w: 14, h: 110 },
  { x: 406, y: 72, w: 56, h: 8, oneWay: true },
  { x: 150, y: 186, w: 86, h: 8, oneWay: true },
  { x: 540, y: 170, w: 72, h: 8, oneWay: true },
  { x: 800, y: 178, w: 120, h: 8, oneWay: true },
  { x: 990, y: 132, w: 96, h: 8, oneWay: true },
  { x: 1160, y: 92, w: 108, h: 8, oneWay: true },
  { x: 1340, y: 164, w: 130, h: 8, oneWay: true },
  { x: 1560, y: 124, w: 88, h: 8, oneWay: true },
  { x: 1720, y: 180, w: 150, h: 8, oneWay: true },
  { x: 1960, y: 208, w: 48, h: 24 },
  { x: 2008, y: 184, w: 48, h: 48 },
  { x: 2056, y: 156, w: 220, h: 90 },
];

const torches = [
  { x: 70, y: 196 },
  { x: 250, y: 196 },
  { x: 560, y: 196 },
  { x: 860, y: 196 },
  { x: 1280, y: 196 },
  { x: 1680, y: 196 },
  { x: 2140, y: 128 },
];

const windows = [36, 240, 560, 980, 1400, 1780, 2120];
const DOOR = { x: 2212, y: 112, w: 26, h: 44 };

const CODE_ACTIONS: Record<string, Action[]> = {
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
};

function overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function mountArena(canvas: HTMLCanvasElement, onHud: (hud: HudSnap) => void) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D indisponível");
  const ctx: CanvasRenderingContext2D = context;
  ctx.imageSmoothingEnabled = false;
  canvas.width = T.viewW;
  canvas.height = T.viewH;

  const keys = new Set<string>();
  const injected = new Set<string>();
  const pointer = new Set<Action>();
  let alive = true;
  let raf = 0;
  let acc = 0;
  let last = performance.now();
  let time = 0;
  let camX = 0;
  let shake = 0;
  let flash = 0;
  let hitstop = 0;
  let nextId = 1;
  let clears = 0;
  try {
    clears = Number(JSON.parse(localStorage.getItem("nightfall-antechamber") || "{}").clears) || 0;
  } catch {
    clears = 0;
  }

  let audio: AudioContext | null = null;
  const particles: Particle[] = [];
  const shots: Shot[] = [];
  const ghosts: { x: number; y: number; facing: number; life: number }[] = [];
  const trail: { x: number; y: number; life: number }[] = [];

  const player = {
    x: 48,
    y: GROUND - 28,
    w: 14,
    h: 28,
    vx: 0,
    vy: 0,
    facing: 1 as 1 | -1,
    grounded: false,
    wall: 0 as -1 | 0 | 1,
    coyote: 0,
    buffer: 0,
    jumps: 1,
    dashT: 0,
    dashCd: 0,
    dashDir: 1 as 1 | -1,
    iframes: 0,
    hurtT: 0,
    hp: T.maxHp as number,
    mana: T.maxMana as number,
    attackT: 0,
    attackLock: 0,
    attackKind: "side" as "side" | "up" | "down" | "charge" | "crouch",
    crouching: false,
    combo: 0,
    comboWindow: 0,
    swingId: 0,
    holdT: 0,
    charge: "idle" as "idle" | "wind",
    dropT: 0,
    controlLock: 0,
    squash: 0,
    deadT: 0,
    won: false,
    dead: false,
    relics: 0,
    ghostT: 0,
    toast: "",
    toastT: 0,
    runPhase: 0,
  };

  let enemies: Enemy[] = [];
  let relics: Relic[] = [];
  let prev = new Set<Action>();

  function tone(freq: number, dur: number, type: OscillatorType, gain: number) {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  }

  function unlock() {
    if (audio) return;
    const AC = window.AudioContext;
    if (!AC) return;
    audio = new AC();
    void audio.resume();
  }

  function burst(x: number, y: number, n: number, color: string, speed: number, grav = 400) {
    for (let i = 0; i < n && particles.length < 240; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random());
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 20,
        life: 0.25 + Math.random() * 0.3,
        max: 0.45,
        color,
        size: 1 + (Math.random() > 0.7 ? 1 : 0),
        grav,
      });
    }
  }

  function spawnRoom() {
    player.x = 48;
    player.y = GROUND - player.h;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.grounded = true;
    player.wall = 0;
    player.coyote = T.coyote;
    player.buffer = 0;
    player.jumps = 1;
    player.dashT = 0;
    player.dashCd = 0;
    player.iframes = 0;
    player.hurtT = 0;
    player.hp = T.maxHp;
    player.mana = T.maxMana;
    player.attackT = 0;
    player.attackLock = 0;
    player.attackKind = "side";
    player.crouching = false;
    player.h = 28;
    player.combo = 0;
    player.comboWindow = 0;
    player.holdT = 0;
    player.charge = "idle";
    player.dropT = 0;
    player.controlLock = 0;
    player.squash = 0;
    player.deadT = 0;
    player.won = false;
    player.dead = false;
    player.relics = 0;
    player.toast = "Antecâmara do trono. O portão cede quando Morne cair.";
    player.toastT = 3.2;
    shots.length = 0;
    particles.length = 0;
    ghosts.length = 0;
    trail.length = 0;
    hitstop = 0;
    flash = 0;
    enemies = [
      makeEnemy("bat", 300, 108, 12, 10, 2),
      makeEnemy("bat", 1040, 86, 12, 10, 2),
      makeEnemy("gargoyle", 1190, 74, 22, 18, 5),
      makeEnemy("vampire", 1500, GROUND - 32, 16, 32, 6),
      makeEnemy("captain", 2120, 156 - 34, 18, 34, 16),
    ];
    relics = [
      { x: 424, y: 58, got: false },
      { x: 1204, y: 76, got: false },
      { x: 2148, y: 140, got: false },
    ];
    sound.playBgm("castle");
  }

  function makeEnemy(
    kind: Enemy["kind"],
    x: number,
    y: number,
    w: number,
    h: number,
    hp: number,
  ): Enemy {
    return {
      id: nextId++,
      kind,
      name: kind === "captain" ? "Capitão Morne" : kind,
      x,
      y,
      w,
      h,
      vx: 0,
      vy: 0,
      hp,
      max: hp,
      facing: -1,
      hurt: 0,
      state: kind === "gargoyle" ? "perch" : "idle",
      homeX: x,
      homeY: y,
      t: Math.random() * 4,
      cd: 0.6,
      wind: 0,
      grounded: false,
      wall: 0,
      dead: false,
    };
  }

  function actions(): Set<Action> {
    const set = new Set<Action>(pointer);
    const codes = new Set<string>([...keys, ...injected]);
    for (const code of codes) {
      const mapped = CODE_ACTIONS[code];
      if (mapped) for (const a of mapped) set.add(a);
    }
    return set;
  }

  function resolve(body: { x: number; y: number; w: number; h: number; vx: number; vy: number; grounded: boolean; wall: -1 | 0 | 1 }, dt: number, drop: boolean) {
    body.wall = 0;
    body.grounded = false;
    body.x += body.vx * dt;
    for (const s of solids) {
      if (s.oneWay || !overlap(body, s)) continue;
      if (body.vx > 0) {
        body.x = s.x - body.w;
        body.wall = 1;
      } else if (body.vx < 0) {
        body.x = s.x + s.w;
        body.wall = -1;
      } else {
        const penL = body.x + body.w - s.x;
        const penR = s.x + s.w - body.x;
        if (penL < penR) {
          body.x = s.x - body.w;
          body.wall = 1;
        } else {
          body.x = s.x + s.w;
          body.wall = -1;
        }
      }
      body.vx = 0;
    }
    const prevBottom = body.y + body.h;
    const prevTop = body.y;
    body.y += body.vy * dt;
    for (const s of solids) {
      if (!overlap(body, s)) continue;
      if (s.oneWay) {
        if (drop || body.vy < 0 || prevBottom > s.y + 0.8) continue;
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

  function hurtPlayer(dmg: number, fromX: number) {
    if (player.iframes > 0 || player.dead || player.won) return;
    player.hp -= dmg;
    player.iframes = T.hurtIFrames;
    player.hurtT = 0.18;
    player.vy = -150;
    player.vx = player.x + player.w / 2 < fromX ? -130 : 130;
    player.charge = "idle";
    player.attackT = 0;
    player.dashT = 0;
    hitstop = T.hitstopLight;
    flash = 0.35;
    shake = Math.max(shake, 5);
    tone(90, 0.18, "sawtooth", 0.04);
    burst(player.x + player.w / 2, player.y + 10, 8, "#e7d2c4", 80);
    if (player.hp <= 0) {
      player.hp = 0;
      player.dead = true;
      player.deadT = 1.15;
      player.toast = "A noite reclama você.";
      player.toastT = 1.2;
      sound.playBgm("gameover");
    }
  }

  function hurtEnemy(e: Enemy, dmg: number, pogo: boolean) {
    if (e.dead) return;
    const tagged = e as Enemy & { lastSwing?: number };
    if (tagged.lastSwing === player.swingId) return;
    tagged.lastSwing = player.swingId;
    e.hp -= dmg;
    e.hurt = 0.12;
    e.vx = player.facing * (pogo ? 40 : 90);
    e.vy = pogo ? 40 : -60;
    hitstop = dmg >= 3 ? T.hitstopHeavy : T.hitstopLight;
    shake = Math.max(shake, dmg >= 3 ? 4 : 2);
    tone(dmg >= 3 ? 180 : 240, 0.08, "square", 0.035);
    burst(e.x + e.w / 2, e.y + e.h / 2, dmg >= 3 ? 14 : 8, "#f2d7a2", 120, 200);
    burst(e.x + e.w / 2, e.y + e.h / 2, 5, "#8e2430", 70);
    if (pogo) {
      player.vy = -T.pogoV;
      player.jumps = 1;
      player.grounded = false;
      player.squash = 0.06;
    }
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      e.hurt = 0.4;
      burst(e.x + e.w / 2, e.y + e.h / 2, 16, "#c8c2cc", 140);
      if (e.kind === "captain") {
        player.toast = "Morne cai. O portão de ouro está aberto.";
        player.toastT = 3;
      }
    }
  }

  function beginSlash(aimUp: boolean, aimDown: boolean) {
    player.swingId++;
    const down = aimDown && !player.grounded && !player.crouching;
    const up = aimUp && !down;
    player.attackKind = down ? "down" : up ? "up" : player.crouching ? "crouch" : "side";
    if ((player.attackKind === "side" || player.attackKind === "crouch") && player.comboWindow > 0) player.combo = (player.combo + 1) % 3;
    else player.combo = 0;
    player.attackT = 0.20;
    player.attackLock = 0.20;
    player.comboWindow = 0;
    tone(180 + player.combo * 40, 0.06, "square", 0.03);
    burst(
      player.x + player.w / 2 + player.facing * 10,
      player.y + 12,
      4,
      "#fff4d2",
      70,
      0,
    );
  }

  function releaseCharge() {
    player.charge = "idle";
    player.swingId++;
    player.attackKind = "charge";
    player.attackT = 0.26;
    player.attackLock = 0.3;
    player.combo = 2;
    const dir = player.facing;
    shots.push({
      x: player.x + (dir > 0 ? player.w : -16),
      y: player.y + 8,
      w: 18,
      h: 10,
      vx: dir * 230,
      vy: 0,
      life: 0.42,
      dmg: T.chargeDamage,
      friendly: true,
      kind: "wave",
      hits: [],
    });
    tone(140, 0.12, "sawtooth", 0.04);
    shake = Math.max(shake, 3);
  }

  function castSpell(aimUp: boolean) {
    if (player.mana < T.spellCost) {
      player.toast = "Mana insuficiente.";
      player.toastT = 0.7;
      tone(80, 0.08, "square", 0.02);
      return;
    }
    player.mana -= T.spellCost;
    player.attackT = Math.max(player.attackT, 0.12);
    const dir = player.facing;
    shots.push({
      x: player.x + (dir > 0 ? player.w : -12),
      y: player.crouching ? player.y + player.h - 10 : player.y + 6,
      w: 12,
      h: 12,
      vx: aimUp ? dir * 40 : dir * 210,
      vy: aimUp ? -170 : 0,
      life: 0.5,
      dmg: T.spellDamage,
      friendly: true,
      kind: "spell",
      hits: [],
    });
    tone(640, 0.1, "sine", 0.04);
    burst(player.x + player.w / 2, player.y + 8, 6, "#d7ecff", 90, 0);
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
    player.squash = Math.max(0, player.squash - dt);
    if (!player.dead && !player.won) player.mana = Math.min(T.maxMana, player.mana + T.manaRegen * dt);

    if (player.dead) {
      player.deadT -= dt;
      player.vx = 0;
      player.vy += T.gravDown * dt;
      if (player.deadT <= 0) spawnRoom();
      return;
    }

    const aimUp = held.has("aimUp");
    const aimDown = held.has("aimDown");
    const left = held.has("left");
    const right = held.has("right");
    let dir = 0;
    if (left && !right) dir = -1;
    else if (right && !left) dir = 1;

    const wantsCrouch = (player.grounded || player.crouching) && aimDown && player.dashT <= 0 && player.dropT <= 0;
    player.crouching = wantsCrouch;
    const targetH = wantsCrouch ? 18 : 28;
    if (player.h !== targetH) {
      player.y += (player.h - targetH);
      player.h = targetH;
    }

    if (press.jump) player.buffer = T.jumpBuffer;
    else player.buffer = Math.max(0, player.buffer - dt);

    if (player.attackT > 0) player.attackT -= dt;
    if (player.attackT <= 0 && (player.attackKind === "side" || player.attackKind === "crouch") && player.attackLock > 0) {
      player.comboWindow = Math.max(player.comboWindow, 0.16);
    }

    const attackHeld = held.has("attack");
    if (attackHeld && player.charge !== "wind") player.holdT += dt;
    if (!attackHeld) {
      if (player.charge === "wind") releaseCharge();
      player.holdT = 0;
    }
    if (player.charge !== "wind" && attackHeld && player.holdT > 0.48 && player.attackLock <= 0 && player.hurtT <= 0) {
      player.charge = "wind";
    }

    if (!player.won && player.hurtT <= 0) {
      if (press.attack && player.charge !== "wind" && (player.attackLock <= 0 || player.comboWindow > 0)) {
        beginSlash(aimUp, aimDown);
      }
      if (press.spell && player.attackLock < 0.18) castSpell(aimUp);
      if (press.dash && player.dashCd <= 0 && player.dashT <= 0) {
        const d = (dir || player.facing) as 1 | -1;
        player.dashT = T.dashTime;
        player.dashCd = T.dashCooldown;
        player.dashDir = d;
        player.facing = d;
        player.crouching = false;
        player.iframes = Math.max(player.iframes, T.dashIFrames);
        player.charge = "idle";
        player.attackT = 0;
        player.vy = 0;
        player.ghostT = 0;
        tone(520, 0.08, "sine", 0.03);
      }
    }

    if (player.dashT > 0) {
      player.dashT -= dt;
      player.vx = player.dashDir * T.dashSpeed;
      player.vy = 0;
      player.ghostT -= dt;
      if (player.ghostT <= 0) {
        ghosts.push({ x: player.x, y: player.y, facing: player.facing, life: 0.16 });
        player.ghostT = 0.03;
      }
    } else {
      if (player.charge === "wind") {
        player.vx *= Math.max(0, 1 - 10 * dt);
        if (!player.grounded) player.vy = Math.min(player.vy + T.gravDown * dt * 0.35, 80);
      } else if (player.hurtT > 0) {
        player.vy = Math.min(player.vy + T.gravDown * dt, T.terminal);
      } else if (player.crouching) {
        player.vx = 0;
        if (dir !== 0 && player.controlLock <= 0) player.facing = dir as 1 | -1;
      } else {
        const accel = player.grounded ? T.accelGround : T.accelAir;
        const lock = player.controlLock > 0 ? 0.35 : 1;
        if (dir !== 0) {
          const isReversing = Math.sign(player.vx) !== 0 && Math.sign(player.vx) !== dir;
          const turnMultiplier = isReversing ? 1.85 : 1;
          player.vx += dir * accel * lock * turnMultiplier * dt;
          if (player.controlLock <= 0) player.facing = dir as 1 | -1;
        } else if (player.grounded) {
          const s = Math.sign(player.vx);
          player.vx -= s * T.friction * dt;
          if (Math.sign(player.vx) !== s) player.vx = 0;
        } else {
          const s = Math.sign(player.vx);
          player.vx -= s * 1600 * dt;
          if (Math.sign(player.vx) !== s) player.vx = 0;
        }
        const max = T.run;
        if (Math.abs(player.vx) > max) {
          const s = Math.sign(player.vx);
          player.vx -= s * 3200 * dt;
          if (Math.abs(player.vx) < max) player.vx = s * max;
        } else {
          player.vx = clamp(player.vx, -max, max);
        }
      }

      const touchingWall = player.wall !== 0 && !player.grounded;
      const wallSlide =
        touchingWall &&
        player.vy > 0 &&
        ((player.wall === 1 && right) || (player.wall === -1 && left));
      if (wallSlide) player.vy = Math.min(player.vy, T.wallSlide);

      if (player.buffer > 0 && player.grounded && aimDown) {
        player.dropT = 0.2;
        player.buffer = 0;
        player.vy = 30;
      } else if (player.buffer > 0 && (player.grounded || player.coyote > 0)) {
        player.vy = -T.jumpV;
        player.grounded = false;
        player.coyote = 0;
        player.buffer = 0;
        player.jumps = 1;
        tone(300, 0.05, "square", 0.02);
      } else if (player.buffer > 0 && touchingWall) {
        player.vx = -player.wall * T.wallJumpX;
        player.vy = -T.wallJumpY;
        player.facing = (-player.wall) as 1 | -1;
        player.jumps = 1;
        player.buffer = 0;
        player.controlLock = T.wallLock;
        player.coyote = 0;
        burst(player.x, player.y + player.h, 5, "#c8c2cc", 50);
      } else if (player.buffer > 0 && player.jumps > 0 && !player.grounded) {
        player.vy = -T.doubleJumpV;
        player.jumps = 0;
        player.buffer = 0;
        burst(player.x + 4, player.y + player.h, 6, "#d7ecff", 60, 0);
        tone(380, 0.05, "square", 0.02);
      }

      if (!held.has("jump") && player.vy < -120) {
        player.vy = Math.max(player.vy * Math.pow(0.84, dt * 60), -120);
      }

      let g: number = player.vy < 0 ? T.gravUp : T.gravDown;
      if (Math.abs(player.vy) < T.apexBand) g = T.gravApex;
      player.vy = Math.min(player.vy + g * dt, T.terminal);
    }

    const fall = player.vy;
    resolve(player, dt, player.dropT > 0);
    if (player.grounded) {
      player.coyote = T.coyote;
      player.jumps = 1;
      if (fall > 220) {
        player.squash = 0.08;
        burst(player.x + player.w / 2, player.y + player.h, 5, "#8a7d88", 40, 0);
      }
    } else player.coyote = Math.max(0, player.coyote - dt);

    if (player.dashT > 0 && player.wall !== 0) player.dashT = 0;
    player.x = clamp(player.x, 0, WORLD_W - player.w);
    if (player.y > 300) hurtPlayer(99, player.x);

    if (player.attackT > 0 && player.attackT < 0.16 && player.attackT > 0.05 && player.attackKind !== "charge") {
      const box = attackBox();
      if (box) {
        const tipX = player.facing > 0 ? box.x + box.w : box.x;
        const tipY = box.y + box.h / 2;
        trail.push({ x: tipX, y: tipY, life: 0.12 });
        for (const e of enemies) {
          if (!e.dead && overlap(box, e)) hurtEnemy(e, player.combo === 2 ? T.finisherDamage : T.slashDamage, player.attackKind === "down");
        }
      }
    }
    if (player.attackKind === "charge" && player.attackT > 0.12 && player.attackT < 0.2) {
      const box = {
        x: player.facing > 0 ? player.x + player.w : player.x - 28,
        y: player.y + 4,
        w: 28,
        h: 18,
      };
      for (const e of enemies) if (!e.dead && overlap(box, e)) hurtEnemy(e, T.chargeDamage, false);
    }

    const captain = enemies.find((e) => e.kind === "captain");
    const doorOpen = !!captain && captain.dead;
    if (!player.won && doorOpen && overlap(player, DOOR)) {
      player.won = true;
      player.toast = "O portão cede. A Sala do Trono espera na fase 7.";
      player.toastT = 6;
      try {
        const prevSave = JSON.parse(localStorage.getItem("nightfall-antechamber") || "{}") as { clears?: number };
        const total = (prevSave.clears || 0) + 1;
        clears = total;
        localStorage.setItem("nightfall-antechamber", JSON.stringify({ clears: total }));
      } catch {
        /* ignore quota */
      }
      sound.playSfx("gateOpen");
      sound.playBgm("victory");
    }

    for (const r of relics) {
      if (r.got) continue;
      if (Math.hypot(player.x + player.w / 2 - r.x, player.y + player.h / 2 - r.y) < 16) {
        r.got = true;
        player.relics += 1;
        player.toast = `Relíquia ${player.relics} de 3.`;
        player.toastT = 1.2;
        sound.playSfx("relic");
        burst(r.x, r.y, 8, "#e2a23a", 70, 0);
      }
    }

    if (Math.abs(player.vx) > 20 && player.grounded) player.runPhase += dt * 12;

    updateEnemies(dt);
    updateShots(dt);

    for (const g of ghosts) g.life -= dt;
    for (let i = ghosts.length - 1; i >= 0; i--) if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    for (const t of trail) t.life -= dt;
    for (let i = trail.length - 1; i >= 0; i--) if (trail[i].life <= 0) trail.splice(i, 1);
    for (const p of particles) {
      p.life -= dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);

    const focus = player.x + player.w / 2 + player.facing * 28;
    const center = camX + T.viewW / 2;
    const dz = 24;
    if (focus > center + dz) camX += (focus - center - dz) * Math.min(1, dt * 8);
    else if (focus < center - dz) camX += (focus - center + dz) * Math.min(1, dt * 8);
    camX = clamp(camX, 0, WORLD_W - T.viewW);
    shake = Math.max(0, shake - dt * 14);
    flash = Math.max(0, flash - dt);
  }

  function attackBox() {
    if (player.attackKind === "up") return { x: player.x - 6, y: player.y - 16, w: player.w + 12, h: 18 };
    if (player.attackKind === "down") return { x: player.x - 4, y: player.y + player.h - 2, w: player.w + 8, h: 14 };
    if (player.attackKind === "crouch") {
      const extra = player.combo * 4;
      return {
        x: player.facing > 0 ? player.x + player.w - 2 : player.x - 20 - extra,
        y: player.y + 4,
        w: 20 + extra,
        h: 12,
      };
    }
    const extra = player.combo * 4;
    return {
      x: player.facing > 0 ? player.x + player.w - 2 : player.x - 20 - extra,
      y: player.y + 6,
      w: 20 + extra,
      h: 14,
    };
  }

  function updateEnemies(dt: number) {
    for (const e of enemies) {
      e.t += dt;
      if (e.state === "slash") e.cd -= dt;
      else e.cd = Math.max(0, e.cd - dt);
      e.hurt = Math.max(0, e.hurt - dt);
      if (e.dead) continue;
      const dx = player.x + player.w / 2 - (e.x + e.w / 2);
      const dy = player.y + player.h / 2 - (e.y + e.h / 2);
      const dist = Math.hypot(dx, dy);
      e.facing = dx >= 0 ? 1 : -1;

      if (e.kind === "bat") {
        const hoverX = e.homeX + Math.sin(e.t * 2) * 36;
        const hoverY = e.homeY + Math.sin(e.t * 3.1) * 12;
        const headTop = player.y;
        if (e.cd > 0) {
          const cruiseY = headTop - 50 + Math.sin(e.t * 3) * 6;
          e.y += (cruiseY - e.y) * Math.min(1, dt * 4.5);
          e.x += -e.facing * 50 * dt;
        } else if (dist < 180) {
          const targetY = headTop - e.h - 1;
          e.x += (player.x - e.x) * Math.min(1, dt * 3.5);
          e.y += (targetY - e.y) * Math.min(1, dt * 4.5);
        } else {
          e.x += (hoverX - e.x) * Math.min(1, dt * 2.2);
          e.y += (hoverY - e.y) * Math.min(1, dt * 2.2);
        }
      } else if (e.kind === "gargoyle") {
        if (e.state === "perch" && dist < 150 && player.x > e.homeX - 220) {
          e.state = "dive";
          e.wind = 0.28;
        }
        if (e.state === "dive") {
          e.wind -= dt;
          if (e.wind <= 0) {
            e.vx = Math.sign(dx || -1) * 150;
            e.vy = 90;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            if (e.y + e.h > GROUND - 8 || e.wind < -0.7) e.state = "return";
          }
        } else if (e.state === "return" || e.state === "perch") {
          e.x += (e.homeX - e.x) * Math.min(1, dt * 2);
          e.y += (e.homeY - e.y) * Math.min(1, dt * 2);
          if (Math.hypot(e.homeX - e.x, e.homeY - e.y) < 4) e.state = "perch";
        }
      } else if (e.kind === "vampire") {
        if (e.wind > 0) {
          e.wind -= dt;
          e.vx = 0;
          if (e.wind <= 0) {
            e.state = "slash";
            e.cd = 0.15;
          }
        } else if (e.state === "slash") {
          if (e.cd <= -0.12) {
            e.state = "idle";
            e.cd = 0.7;
          } else if (e.cd <= 0) {
            const box = {
              x: e.facing > 0 ? e.x + e.w : e.x - 20,
              y: e.y + 6,
              w: 20,
              h: 16,
            };
            if (overlap(box, player)) hurtPlayer(1, e.x);
          }
        } else if (dist < 220 && dist > 34) {
          const dir = Math.sign(dx) || -1;
          const ahead = {
            x: e.x + (dir > 0 ? e.w + 1 : -6),
            y: e.y + e.h + 1,
            w: 4,
            h: 6,
          };
          const ground = solids.some((s) => !s.oneWay && overlap(ahead, s));
          e.vx = ground ? dir * 70 : 0;
          if (!ground) e.facing = (-dir) as 1 | -1;
        } else if (dist <= 34 && e.cd <= 0) {
          e.wind = 0.32;
          e.vx = 0;
          e.cd = 0.9;
        } else e.vx = 0;
        e.vy = Math.min(e.vy + T.gravDown * dt, T.terminal);
        resolve(e, dt, false);
        e.x = clamp(e.x, 1360, 1860);
      } else if (e.kind === "captain") {
        e.x = clamp(e.x, 2064, 2220);
        e.y = 156 - e.h;
        if (e.wind > 0) {
          e.wind -= dt;
          if (e.wind <= 0 && !player.dead) {
            shots.push({
              x: e.facing > 0 ? e.x + e.w : e.x - 10,
              y: e.y + 12,
              w: 10,
              h: 8,
              vx: e.facing * 130,
              vy: 18,
              life: 1.6,
              dmg: 1,
              friendly: false,
              kind: "bolt",
              hits: [],
            });
            tone(160, 0.08, "sawtooth", 0.03);
          }
        } else if (dist < 42 && e.cd <= 0) {
          e.state = "slash";
          e.cd = 0.85;
          e.wind = 0;
          const box = { x: e.facing > 0 ? e.x + e.w : e.x - 22, y: e.y + 8, w: 22, h: 16 };
          if (overlap(box, player)) hurtPlayer(1, e.x);
        } else if (dist < 240 && e.cd <= 0 && player.x > 1900) {
          e.wind = 0.4;
          e.cd = 1.6;
          e.state = "cast";
        }
      }

      if (!e.dead && e.kind !== "bat" && overlap(e, player) && e.hurt <= 0) hurtPlayer(1, e.x + e.w / 2);
      if (e.kind === "bat" && !e.dead) {
        const headTop = player.y;
        const pMid = player.x + player.w / 2;
        const eMid = e.x + e.w / 2;
        const minHoriz = (e.w + player.w) / 2;
        const horizDist = Math.abs(pMid - eMid);

        if (horizDist <= minHoriz + 5 && e.y + e.h >= headTop - 6 && e.y <= headTop + 14) {
          if (e.cd <= 0 && e.hurt <= 0) {
            hurtPlayer(1, e.x);
            e.cd = 0.95;
            e.vy = -140;
          }
        }

        // Physical solid exclusion for bat
        if (e.x + e.w > player.x && e.x < player.x + player.w && e.y + e.h > headTop) {
          e.y = headTop - e.h;
        }
        if (e.y + e.h > headTop && e.y < player.y + player.h) {
          if (eMid < pMid) {
            if (e.x + e.w > player.x) e.x = player.x - e.w;
          } else {
            if (e.x < player.x + player.w) e.x = player.x + player.w;
          }
        }
      }
    }
  }

  function updateShots(dt: number) {
    for (const s of shots) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.friendly) {
        for (const e of enemies) {
          if (e.dead || s.hits.includes(e.id) || !overlap(s, e)) continue;
          s.hits.push(e.id);
          const before = player.swingId;
          player.swingId++;
          hurtEnemy(e, s.dmg, false);
          player.swingId = before;
          if (s.kind !== "wave") s.life = 0;
        }
      } else if (overlap(s, player)) {
        hurtPlayer(s.dmg, s.x);
        s.life = 0;
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].life <= 0) shots.splice(i, 1);
  }

  function draw() {
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const cam = Math.round(camX);
    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
    ctx.clearRect(-8, -8, T.viewW + 16, T.viewH + 16);

    const sky = ctx.createLinearGradient(0, 0, 0, T.viewH);
    sky.addColorStop(0, "#140c18");
    sky.addColorStop(0.45, "#3a1424");
    sky.addColorStop(1, "#1a1218");
    ctx.fillStyle = sky;
    ctx.fillRect(-8, -8, T.viewW + 16, T.viewH + 16);

    const moonX = 390 - cam * 0.05;
    ctx.fillStyle = "#6a1824";
    ctx.beginPath();
    ctx.arc(moonX, 46, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e23b4a";
    ctx.beginPath();
    ctx.arc(moonX, 46, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb0a4";
    ctx.beginPath();
    ctx.arc(moonX - 7, 40, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#120c14";
    for (let i = -1; i < 8; i++) {
      const x = Math.round(i * 160 - cam * 0.15);
      ctx.fillRect(x, 78, 90, 160);
      ctx.fillStyle = "#1a1020";
      ctx.beginPath();
      ctx.arc(x + 45, 118, 28, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#120c14";
    }

    for (const wx of windows) {
      const x = Math.round(wx - cam * 0.42);
      if (x < -40 || x > T.viewW + 20) continue;
      ctx.fillStyle = "#241820";
      ctx.fillRect(x, 58, 34, 78);
      const panes = ["#3a6e9a", "#c4343a", "#e2a23a", "#2f6a4a"];
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 2; px++) {
          ctx.fillStyle = panes[(px + py + wx) % panes.length];
          ctx.globalAlpha = 0.85;
          ctx.fillRect(x + 4 + px * 14, 66 + py * 16, 12, 14);
          ctx.globalAlpha = 1;
        }
      }
      ctx.fillStyle = "#3a3040";
      ctx.fillRect(x + 16, 58, 2, 78);
    }

    ctx.fillStyle = "#2a2230";
    ctx.fillRect(Math.round(-cam), 150, WORLD_W, 90);

    for (const torch of torches) {
      const x = Math.round(torch.x - cam);
      const flick = 1 + Math.sin(time * 18 + torch.x) * 0.15;
      ctx.fillStyle = "#5a4030";
      ctx.fillRect(x, torch.y, 4, 16);
      ctx.fillStyle = "#e2a23a";
      ctx.fillRect(x - 1, torch.y - 6 * flick, 6, 7);
      ctx.fillStyle = "#fff1c9";
      ctx.fillRect(x + 1, torch.y - 4 * flick, 2, 3);
    }

    for (const s of solids) {
      const x = Math.round(s.x - cam);
      if (x > T.viewW + 8 || x + s.w < -8) continue;
      ctx.fillStyle = s.oneWay ? "#4a3b44" : "#322833";
      ctx.fillRect(x, s.y, s.w, s.h);
      ctx.fillStyle = s.oneWay ? "#e2a23a" : "#6a6270";
      ctx.fillRect(x, s.y, s.w, s.oneWay ? 2 : 2);
      if (!s.oneWay && s.h >= 20) {
        ctx.fillStyle = "#8e2430";
        ctx.fillRect(x + 4, s.y + 6, Math.max(0, s.w - 8), 6);
        ctx.fillStyle = "#241c28";
        for (let by = 8; by < s.h; by += 8) {
          const off = (Math.floor(s.y + by) / 8) % 2 ? 8 : 0;
          for (let bx = -off; bx < s.w; bx += 16) ctx.fillRect(x + bx, s.y + by, 1, 8);
        }
      }
    }

    ctx.fillStyle = "#2a0c14";
    ctx.fillRect(Math.round(640 - cam), GROUND, 90, 48);
    ctx.fillStyle = "#e23b4a";
    for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(646 - cam + i * 14), GROUND, 6, 6);

    const captain = enemies.find((e) => e.kind === "captain");
    const doorOpen = !!captain && captain.hp <= 0;
    const dx = Math.round(DOOR.x - cam);
    ctx.fillStyle = doorOpen ? "#e2a23a" : "#3a242c";
    ctx.fillRect(dx, DOOR.y, DOOR.w, DOOR.h);
    ctx.fillStyle = doorOpen ? "#fff1c9" : "#1a1014";
    ctx.fillRect(dx + 8, DOOR.y + 16, 8, 12);
    ctx.fillStyle = "#5a2840";
    ctx.fillRect(Math.round(2148 - cam), 116, 28, 28);
    ctx.fillRect(Math.round(2160 - cam), 104, 8, 16);

    for (const r of relics) {
      if (r.got) continue;
      const bob = Math.sin(time * 4 + r.x) * 2;
      const x = Math.round(r.x - cam);
      const y = Math.round(r.y + bob);
      ctx.fillStyle = "#e2a23a";
      ctx.fillRect(x - 3, y, 6, 2);
      ctx.fillRect(x - 2, y + 2, 4, 5);
      ctx.fillStyle = "#fff1c9";
      ctx.fillRect(x - 1, y + 3, 2, 2);
    }

    for (const s of shots) {
      ctx.fillStyle = s.kind === "bolt" ? "#c4343a" : s.kind === "spell" ? "#d7ecff" : "#ffe08a";
      ctx.fillRect(Math.round(s.x - cam), Math.round(s.y), s.w, s.h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(s.x - cam + 2), Math.round(s.y + 2), Math.max(2, s.w - 6), 2);
    }

    for (const g of ghosts) drawHero(g.x - cam, g.y, g.facing as 1 | -1, 0.35, true);

    for (const e of enemies) {
      if (e.dead && e.hurt <= 0) continue;
      drawEnemy(e);
    }

    const blink = player.iframes > 0 && Math.floor(time * 18) % 2 === 0 && player.hurtT <= 0;
    if (!blink && !(player.dead && Math.floor(time * 10) % 2 === 0)) {
      drawHero(player.x - cam, player.y, player.facing, 1, false);
    }

    if (trail.length > 1) {
      ctx.strokeStyle = "#fff6de";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(trail[0].x - cam), Math.round(trail[0].y));
      for (const t of trail) ctx.lineTo(Math.round(t.x - cam), Math.round(t.y));
      ctx.stroke();
      ctx.strokeStyle = "#7ec8ff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cam), Math.round(p.y), p.size, p.size);
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = "lighter";
    for (const torch of torches) {
      const x = torch.x - cam;
      const y = torch.y - 4;
      if (x < -80 || x > T.viewW + 80) continue;
      const rad = 58 + Math.sin(time * 18 + torch.x) * 4;
      const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
      g.addColorStop(0, "rgba(255, 176, 70, 0.33)");
      g.addColorStop(1, "rgba(255, 120, 40, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const moonGlow = ctx.createRadialGradient(moonX, 46, 10, moonX, 46, 120);
    moonGlow.addColorStop(0, "rgba(226, 59, 74, 0.18)");
    moonGlow.addColorStop(1, "rgba(226, 59, 74, 0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 120, -20, 240, 180);
    ctx.globalCompositeOperation = "source-over";

    const fog = ctx.createLinearGradient(0, 200, 0, T.viewH);
    fog.addColorStop(0, "rgba(180, 160, 170, 0)");
    fog.addColorStop(1, "rgba(180, 160, 170, 0.13)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 200, T.viewW, 70);

    const vig = ctx.createLinearGradient(0, 0, 0, T.viewH);
    vig.addColorStop(0, "rgba(0,0,0,0.28)");
    vig.addColorStop(0.2, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, T.viewW, T.viewH);

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,236,230,${flash * 0.35})`;
      ctx.fillRect(0, 0, T.viewW, T.viewH);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawHero(x: number, y: number, facing: 1 | -1, alpha: number, ghost: boolean) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x + player.w / 2), Math.round(y + player.h));
    if (player.squash > 0 && !ghost) ctx.scale(1.12, 0.88);
    else if (player.crouching && !ghost) ctx.scale(1.08, 0.68);
    ctx.scale(facing * 1.45, 1.45);
    const skin = ghost ? "#9fd0ff" : "#e6c2a2";
    const steel = ghost ? "#d7ecff" : "#d5dbe6";
    const steelDk = ghost ? "#7aa4c8" : "#8b93a6";
    const cloth = ghost ? "#16324a" : "#2a2030";
    const leg = !ghost && player.grounded && Math.abs(player.vx) > 30 ? Math.sin(player.runPhase) * 3 : 0;
    ctx.fillStyle = "#6a1c28";
    ctx.fillRect(-13, -26, 6, 20);
    ctx.fillStyle = cloth;
    ctx.fillRect(-12, -28, 8, 22);
    ctx.fillStyle = "#4a2c22";
    ctx.fillRect(-6, -10 + leg, 4, 10);
    ctx.fillRect(2, -10 - leg, 4, 10);
    ctx.fillStyle = "#2a211c";
    ctx.fillRect(-7, -4 + leg, 5, 4);
    ctx.fillRect(1, -4 - leg, 5, 4);
    ctx.fillStyle = steel;
    ctx.fillRect(-6, -22, 12, 12);
    ctx.fillStyle = steelDk;
    ctx.fillRect(-6, -16, 12, 3);
    ctx.fillStyle = "#6a3a22";
    ctx.fillRect(-6, -12, 12, 3);
    ctx.fillStyle = skin;
    ctx.fillRect(-4, -30, 8, 8);
    ctx.fillStyle = "#5c3418";
    ctx.fillRect(-5, -33, 10, 5);
    ctx.fillRect(-6, -30, 3, 5);
    ctx.fillStyle = "#1a1210";
    ctx.fillRect(2, -28, 2, 2);
    if (player.charge === "wind" && !ghost) {
      ctx.fillStyle = "#ffe08a";
      ctx.globalAlpha = 0.35 + Math.sin(time * 30) * 0.15;
      ctx.fillRect(-8, -24, 20, 20);
      ctx.globalAlpha = alpha;
    }
    drawSword(ghost);
    ctx.restore();
  }

  function drawSword(ghost: boolean) {
    ctx.save();
    ctx.translate(6, player.crouching ? -12 : -18);
    let ang = -0.4;
    if (!ghost && player.attackT > 0) {
      const u = 1 - player.attackT / 0.24;
      if (player.attackKind === "up") ang = -2.2 + u * 0.8;
      else if (player.attackKind === "down") ang = 0.6 + u * 1.1;
      else if (player.attackKind === "crouch") ang = -0.4 + u * 1.4;
      else ang = -1.1 + u * 2.3;
    } else if (!ghost && player.charge === "wind") ang = -2.2;
    ctx.rotate(ang);
    ctx.fillStyle = ghost ? "#d7ecff" : "#eef3fb";
    ctx.fillRect(0, -1, 16, 2);
    ctx.fillStyle = "#e2a23a";
    ctx.fillRect(-2, -2, 3, 4);
    if (!ghost && player.attackT > 0.05 && player.attackT < 0.16) {
      ctx.fillStyle = "#fff6de";
      ctx.fillRect(8, -6, 10, 10);
      ctx.fillStyle = "#7ec8ff";
      ctx.fillRect(12, -2, 8, 2);
    }
    ctx.restore();
  }

  function drawEnemy(e: Enemy) {
    const x = Math.round(e.x - camX);
    const y = Math.round(e.y);
    if (x < -40 || x > T.viewW + 40) return;
    ctx.save();
    ctx.translate(x + e.w / 2, y + e.h);
    ctx.scale(e.facing * 1.35, 1.35);
    const flashOn = e.hurt > 0 && Math.floor(time * 24) % 2 === 0;
    if (e.kind === "bat") {
      const wing = Math.sin(e.t * 18) * 4;
      ctx.fillStyle = flashOn ? "#fff" : "#3a1848";
      ctx.fillRect(-8, -10 - wing, 6, 4);
      ctx.fillRect(2, -10 - wing, 6, 4);
      ctx.fillStyle = flashOn ? "#fff" : "#6a2858";
      ctx.fillRect(-3, -8, 6, 5);
      ctx.fillStyle = "#e23b4a";
      ctx.fillRect(1, -7, 2, 2);
    } else if (e.kind === "gargoyle") {
      ctx.fillStyle = flashOn ? "#fff" : "#8a8794";
      ctx.fillRect(-8, -16, 14, 12);
      ctx.fillStyle = flashOn ? "#fff" : "#5e5a68";
      const spread = e.state === "dive" ? 10 : 6;
      ctx.fillRect(-16, -18, 8, spread);
      ctx.fillRect(6, -18, 8, spread);
      ctx.fillStyle = "#e23b4a";
      ctx.fillRect(2, -13, 2, 2);
      ctx.fillStyle = flashOn ? "#fff" : "#6e6a76";
      ctx.fillRect(-6, -6, 4, 6);
      ctx.fillRect(2, -6, 4, 6);
    } else {
      const cape = e.kind === "captain" ? "#1a0c14" : "#241820";
      ctx.fillStyle = flashOn ? "#fff" : "#6a1c28";
      ctx.fillRect(-12, -30, 5, 24);
      ctx.fillStyle = flashOn ? "#fff" : cape;
      ctx.fillRect(-11, -32, 8, 26);
      ctx.fillStyle = flashOn ? "#fff" : "#c4343a";
      ctx.fillRect(-4, -28, 8, 16);
      ctx.fillStyle = flashOn ? "#fff" : "#111";
      ctx.fillRect(-4, -18, 8, 10);
      ctx.fillStyle = flashOn ? "#fff" : "#e7d4c4";
      ctx.fillRect(-4, -40, 8, 9);
      ctx.fillStyle = "#1a0c10";
      ctx.fillRect(-5, -42, 10, 4);
      ctx.fillStyle = "#e23b4a";
      ctx.fillRect(1, -37, 2, 2);
      if (e.wind > 0) {
        ctx.fillStyle = "#ffe08a";
        ctx.fillRect(4, -24, 10, 2);
      }
      if (e.kind === "captain") {
        ctx.fillStyle = "#6a3078";
        ctx.globalAlpha = 0.45;
        ctx.fillRect(-14, -44, 26, 40);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    if (!e.dead && (e.kind === "captain" || e.hp < e.max)) {
      const bw = e.w + 6;
      ctx.fillStyle = "#1a1214";
      ctx.fillRect(x - 2, y - 6, bw, 3);
      ctx.fillStyle = e.kind === "captain" ? "#c4343a" : "#e2a23a";
      ctx.fillRect(x - 2, y - 6, Math.max(0, (bw * e.hp) / e.max), 3);
    }
  }

  function publish() {
    const captain = enemies.find((e) => e.kind === "captain");
    const bossOn = !!captain && (player.x > 1860 || captain.hp < captain.max) && !player.won;
    if (bossOn && !player.dead && !player.won && captain && !captain.dead && sound.getCurrentTrack() !== "boss") {
      sound.playBgm("boss");
    }
    onHud({
      hp: player.hp,
      maxHp: T.maxHp,
      mana: Math.round(player.mana),
      maxMana: T.maxMana,
      relics: player.relics,
      relicsMax: relics.length,
      bossHp: captain ? Math.max(0, captain.hp) : 0,
      bossMax: captain ? captain.max : 1,
      bossName: "Capitão Morne",
      bossOn,
      toast: player.toastT > 0 ? player.toast : "",
      won: player.won,
      dead: player.dead,
      dashReady: player.dashCd <= 0,
      charge: player.charge === "wind" ? 1 : clamp(player.holdT / 0.48, 0, 1),
      clears,
    });
  }

  let hudTick = 0;
  function frame(now: number) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
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
      if (hitstop > 0) {
        hitstop -= 1 / 60;
        for (const p of particles) p.life -= 1 / 240;
      } else {
        step(1 / 60, first ? press : { jump: false, attack: false, dash: false, spell: false }, held);
        first = false;
      }
      acc -= 1 / 60;
      steps++;
    }
    draw();
    hudTick++;
    if (hudTick % 4 === 0) publish();
    raf = requestAnimationFrame(frame);
  }

  spawnRoom();
  publish();
  raf = requestAnimationFrame(frame);

  let hot = false;
  const zone = canvas.closest("[data-arena]") ?? canvas;
  const markHot = () => {
    hot = true;
  };
  const markCold = () => {
    hot = false;
  };
  zone.addEventListener("pointerenter", markHot);
  zone.addEventListener("pointerleave", markCold);
  canvas.addEventListener("pointerdown", () => {
    hot = true;
    canvas.focus();
  });

  const onDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      keys.clear();
      hot = false;
      return;
    }
    if (!CODE_ACTIONS[e.code]) return;
    if (!hot && document.activeElement !== canvas) return;
    unlock();
    e.preventDefault();
    keys.add(e.code);
  };
  const onUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  const probe: ControlsProbe = {
    getX: () => player.x,
    getFacing: () => player.facing,
    getSpeed: () => player.vx,
    setKeys: (codes: string[]) => {
      injected.clear();
      for (const c of codes) injected.add(c);
    },
  };
  window.__controlsTest = probe;

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      zone.removeEventListener("pointerenter", markHot);
      zone.removeEventListener("pointerleave", markCold);
      if (window.__controlsTest === probe) delete window.__controlsTest;
    },
    setHeld(action: Action, down: boolean) {
      unlock();
      if (down) pointer.add(action);
      else pointer.delete(action);
    },
    reset() {
      spawnRoom();
      publish();
    },
    pressVirtual(action: Action, down: boolean) {
      unlock();
      if (down) pointer.add(action);
      else pointer.delete(action);
    },
  };
}

export type ArenaApi = ReturnType<typeof mountArena>;
