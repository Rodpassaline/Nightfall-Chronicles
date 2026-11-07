import type { Kind } from "./levels";
import { tuning as T } from "./tuning";

// ============================================================================
// FASE 2 — FINITE STATE MACHINE (FSM) STATES & COMBAT ROLES
// ============================================================================

export type EnemyFsmState =
  | "IDLE"
  | "APPROACH"
  | "OBSERVE"
  | "WINDUP"
  | "ATTACK"
  | "RECOVERY"
  | "DEFEND"
  | "DODGE"
  | "COUNTER"
  | "RETREAT"
  | "STUNNED"
  | "GUARD_BROKEN"
  | "DEAD";

export type AttackWindowPhase = "NONE" | "WINDUP" | "ACTIVE" | "RECOVERY";

export type CombatRole =
  | "PRIMARY_ATTACKER"
  | "COORDINATED_RANGED"
  | "FLANKER"
  | "REAR_GUARD";

export type EnemyArchetype =
  | "light"
  | "fast"
  | "ranged"
  | "defensive"
  | "heavy"
  | "assassin"
  | "aerial"
  | "boss";

export type NightfallEnemyClass =
  | "SKELETON_WARRIOR"   // Classe 1: Guerreiro Esqueleto (Combate equilibrado, bloqueia ataques repetitivos, recua se pressionado, contra-ataca aberturas)
  | "AGILE_PREDATOR"     // Classe 2: Criatura Ágil / Predador (Aproximação rápida, ataque curto, recuo automático hit-and-run após atacar)
  | "HEAVY_WARRIOR"      // Classe 3: Guerreiro Pesado (Alta postura/poise, ataques lentos telegrafados que quebram guarda passiva, recuperação longa)
  | "AERIAL_CREATURE"    // Classe 4: Criatura Aérea (Controle de altura acima do nível da espada, ataque em mergulho, janela vulnerável pós-mergulho)
  | "BOSS_STRATEGIST";   // Classe 5: Chefes em 3 Fases (Observação 100-66%, Pressão 65-34%, Desespero <=33%)

export function getNightfallEnemyClass(kind: Kind): NightfallEnemyClass {
  switch (kind) {
    case "skeleton":
    case "redSkeleton":
    case "armoredSkeleton":
      return "SKELETON_WARRIOR";
    case "zombie":
    case "vampire":
      return "AGILE_PREDATOR";
    case "knight":
      return "HEAVY_WARRIOR";
    case "bat":
    case "gargoyle":
      return "AERIAL_CREATURE";
    default:
      return "BOSS_STRATEGIST";
  }
}

export type PlayerAttackCategory = "LIGHT" | "NORMAL" | "HEAVY" | "SPECIAL";

export interface PlayerAttackProfile {
  id: string;
  category: PlayerAttackCategory;
  damage: number;
  poiseDamage: number;
  impactForce: number;
  interruptPower: number;
  canBreakGuard: boolean;
}

export const PLAYER_ATTACK_PROFILES: Record<string, PlayerAttackProfile> = {
  slashLight: {
    id: "slashLight",
    category: "LIGHT",
    damage: T.slashDamage,
    poiseDamage: 4.5,
    impactForce: 48,
    interruptPower: 1.0,
    canBreakGuard: false,
  },
  slashFinisher: {
    id: "slashFinisher",
    category: "NORMAL",
    damage: T.finisherDamage,
    poiseDamage: 11.0,
    impactForce: 95,
    interruptPower: 1.65,
    canBreakGuard: true,
  },
  slashPogo: {
    id: "slashPogo",
    category: "NORMAL",
    damage: T.slashDamage,
    poiseDamage: 9.0,
    impactForce: 72,
    interruptPower: 1.45,
    canBreakGuard: true,
  },
  quickSpell: {
    id: "quickSpell",
    category: "LIGHT",
    damage: T.spellDamage,
    poiseDamage: 5.5,
    impactForce: 42,
    interruptPower: 1.1,
    canBreakGuard: false,
  },
  chargedWave: {
    id: "chargedWave",
    category: "HEAVY",
    damage: T.chargeDamage,
    poiseDamage: 18.0,
    impactForce: 135,
    interruptPower: 2.5,
    canBreakGuard: true,
  },
  crescentSpecial: {
    id: "crescentSpecial",
    category: "SPECIAL",
    damage: 5,
    poiseDamage: 24.0,
    impactForce: 155,
    interruptPower: 3.0,
    canBreakGuard: true,
  },
};

export function resolvePlayerAttackProfile(
  dmg: number,
  pogo: boolean,
  hitSource: "slash" | "spell",
  comboStep: number,
  isSpecialActive: boolean,
): PlayerAttackProfile {
  if (isSpecialActive || dmg >= 5) return PLAYER_ATTACK_PROFILES.crescentSpecial;
  if (dmg >= T.chargeDamage) return PLAYER_ATTACK_PROFILES.chargedWave;
  if (pogo) return PLAYER_ATTACK_PROFILES.slashPogo;
  if (hitSource === "spell") return PLAYER_ATTACK_PROFILES.quickSpell;
  if (comboStep === 2 || dmg >= T.finisherDamage) return PLAYER_ATTACK_PROFILES.slashFinisher;
  return PLAYER_ATTACK_PROFILES.slashLight;
}

// ============================================================================
// FASE 10 — CENTRALIZED ENEMY COMBAT CONFIGURATION BY CLASS / ARCHETYPE
// ============================================================================

export interface EnemyCombatConfig {
  archetype: EnemyArchetype;
  attackRange: number;
  rangedAttackRange: number;
  preferredDistance: number;
  retreatDistance: number;
  moveSpeed: number;
  attackCooldown: number;
  windupDuration: number;
  activeDuration: number;
  recoveryDuration: number;
  maxPoise: number;
  impactResistance: number;      // 0.0 (none) to 0.85 (very high)
  poiseRegenDelay: number;       // seconds without hit before poise regenerates
  poiseRegenRate: number;        // poise recovered per second
  stunDuration: number;          // STUNNED duration
  guardBreakDuration: number;    // GUARD_BROKEN duration
  stunResistance: number;        // anti-stunlock immunity window after stun/counter
  interruptMultiplier: number;   // scales incoming poise damage
  blockChance: number;
  dodgeChance: number;
  counterChance: number;
  aggression: number;
  bodyInsetX: number;            // narrows physical BODY COLLIDER
  bodyInsetY: number;
  hurtboxExpandX: number;        // widens HURTBOX for clean blade hits without overlap
  hurtboxExpandY: number;
}

export const ENEMY_COMBAT_CONFIG: Record<Kind, EnemyCombatConfig> = {
  bat: {
    archetype: "light",
    attackRange: 38,
    rangedAttackRange: 0,
    preferredDistance: 46,
    retreatDistance: 24,
    moveSpeed: 115,
    attackCooldown: 0.75,
    windupDuration: 0.18,
    activeDuration: 0.14,
    recoveryDuration: 0.35,
    maxPoise: 4,
    impactResistance: 0.0,
    poiseRegenDelay: 1.0,
    poiseRegenRate: 3.0,
    stunDuration: 0.28,
    guardBreakDuration: 0.4,
    stunResistance: 0.65,
    interruptMultiplier: 1.2,
    blockChance: 0.0,
    dodgeChance: 0.25,
    counterChance: 0.15,
    aggression: 0.7,
    bodyInsetX: 3,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 5,
  },
  zombie: {
    archetype: "fast",
    attackRange: 52,
    rangedAttackRange: 145, // leap range
    preferredDistance: 40,
    retreatDistance: 0,
    moveSpeed: 88,
    attackCooldown: 0.62,
    windupDuration: 0.24,
    activeDuration: 0.14,
    recoveryDuration: 0.32,
    maxPoise: 8,
    impactResistance: 0.15,
    poiseRegenDelay: 1.2,
    poiseRegenRate: 4.0,
    stunDuration: 0.32,
    guardBreakDuration: 0.5,
    stunResistance: 0.9,
    interruptMultiplier: 1.0,
    blockChance: 0.0,
    dodgeChance: 0.1,
    counterChance: 0.35,
    aggression: 0.85,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  skeleton: {
    archetype: "ranged",
    attackRange: 52,
    rangedAttackRange: 380,
    preferredDistance: 125,
    retreatDistance: 78,
    moveSpeed: 58,
    attackCooldown: 0.78,
    windupDuration: 0.24,
    activeDuration: 0.12,
    recoveryDuration: 0.28,
    maxPoise: 7,
    impactResistance: 0.1,
    poiseRegenDelay: 1.1,
    poiseRegenRate: 4.5,
    stunDuration: 0.30,
    guardBreakDuration: 0.45,
    stunResistance: 0.85,
    interruptMultiplier: 1.0,
    blockChance: 0.26,
    dodgeChance: 0.42,
    counterChance: 0.38,
    aggression: 0.6,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  redSkeleton: {
    archetype: "ranged",
    attackRange: 58,
    rangedAttackRange: 390,
    preferredDistance: 110,
    retreatDistance: 72,
    moveSpeed: 68,
    attackCooldown: 0.72,
    windupDuration: 0.22,
    activeDuration: 0.14,
    recoveryDuration: 0.26,
    maxPoise: 10,
    impactResistance: 0.22,
    poiseRegenDelay: 1.0,
    poiseRegenRate: 5.0,
    stunDuration: 0.28,
    guardBreakDuration: 0.45,
    stunResistance: 0.95,
    interruptMultiplier: 0.9,
    blockChance: 0.36,
    dodgeChance: 0.48,
    counterChance: 0.45,
    aggression: 0.75,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  armoredSkeleton: {
    archetype: "defensive",
    attackRange: 58,
    rangedAttackRange: 0,
    preferredDistance: 44,
    retreatDistance: 26,
    moveSpeed: 54,
    attackCooldown: 0.65,
    windupDuration: 0.25,
    activeDuration: 0.14,
    recoveryDuration: 0.30,
    maxPoise: 14,
    impactResistance: 0.42,
    poiseRegenDelay: 1.2,
    poiseRegenRate: 5.5,
    stunDuration: 0.35,
    guardBreakDuration: 0.68,
    stunResistance: 1.05,
    interruptMultiplier: 0.72,
    blockChance: 0.65,
    dodgeChance: 0.12,
    counterChance: 0.52,
    aggression: 0.68,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  knight: {
    archetype: "heavy",
    attackRange: 66,
    rangedAttackRange: 250, // charge range
    preferredDistance: 48,
    retreatDistance: 24,
    moveSpeed: 54,
    attackCooldown: 0.78,
    windupDuration: 0.34,
    activeDuration: 0.18,
    recoveryDuration: 0.46,
    maxPoise: 18,
    impactResistance: 0.52,
    poiseRegenDelay: 1.25,
    poiseRegenRate: 6.0,
    stunDuration: 0.38,
    guardBreakDuration: 0.72,
    stunResistance: 1.15,
    interruptMultiplier: 0.65,
    blockChance: 0.60,
    dodgeChance: 0.08,
    counterChance: 0.55,
    aggression: 0.78,
    bodyInsetX: 5,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  vampire: {
    archetype: "assassin",
    attackRange: 62,
    rangedAttackRange: 380,
    preferredDistance: 48,
    retreatDistance: 34,
    moveSpeed: 92,
    attackCooldown: 0.58,
    windupDuration: 0.22,
    activeDuration: 0.14,
    recoveryDuration: 0.25,
    maxPoise: 11,
    impactResistance: 0.28,
    poiseRegenDelay: 0.95,
    poiseRegenRate: 5.5,
    stunDuration: 0.28,
    guardBreakDuration: 0.50,
    stunResistance: 0.95,
    interruptMultiplier: 0.85,
    blockChance: 0.18,
    dodgeChance: 0.55,
    counterChance: 0.52,
    aggression: 0.82,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  gargoyle: {
    archetype: "aerial",
    attackRange: 58,
    rangedAttackRange: 280,
    preferredDistance: 52,
    retreatDistance: 38,
    moveSpeed: 72,
    attackCooldown: 0.62,
    windupDuration: 0.24,
    activeDuration: 0.15,
    recoveryDuration: 0.28,
    maxPoise: 12,
    impactResistance: 0.35,
    poiseRegenDelay: 1.0,
    poiseRegenRate: 5.0,
    stunDuration: 0.30,
    guardBreakDuration: 0.52,
    stunResistance: 1.0,
    interruptMultiplier: 0.8,
    blockChance: 0.15,
    dodgeChance: 0.58,
    counterChance: 0.48,
    aggression: 0.76,
    bodyInsetX: 4,
    bodyInsetY: 2,
    hurtboxExpandX: 6,
    hurtboxExpandY: 4,
  },
  bossPetros: {
    archetype: "boss",
    attackRange: 68,
    rangedAttackRange: 260,
    preferredDistance: 46,
    retreatDistance: 28,
    moveSpeed: 56,
    attackCooldown: 0.82,
    windupDuration: 0.30,
    activeDuration: 0.16,
    recoveryDuration: 0.46,
    maxPoise: 24,
    impactResistance: 0.55,
    poiseRegenDelay: 1.5,
    poiseRegenRate: 4.2,
    stunDuration: 0.65,
    guardBreakDuration: 0.75,
    stunResistance: 1.6,
    interruptMultiplier: 0.55,
    blockChance: 0.25,
    dodgeChance: 0.35,
    counterChance: 0.55,
    aggression: 0.85,
    bodyInsetX: 6,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossValerius: {
    archetype: "boss",
    attackRange: 66,
    rangedAttackRange: 240,
    preferredDistance: 46,
    retreatDistance: 28,
    moveSpeed: 58,
    attackCooldown: 0.76,
    windupDuration: 0.26,
    activeDuration: 0.15,
    recoveryDuration: 0.42,
    maxPoise: 22,
    impactResistance: 0.52,
    poiseRegenDelay: 1.4,
    poiseRegenRate: 4.5,
    stunDuration: 0.62,
    guardBreakDuration: 0.72,
    stunResistance: 1.5,
    interruptMultiplier: 0.58,
    blockChance: 0.62,
    dodgeChance: 0.32,
    counterChance: 0.62,
    aggression: 0.88,
    bodyInsetX: 6,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossSeraphine: {
    archetype: "boss",
    attackRange: 68,
    rangedAttackRange: 360,
    preferredDistance: 115,
    retreatDistance: 68,
    moveSpeed: 64,
    attackCooldown: 0.95,
    windupDuration: 0.24,
    activeDuration: 0.14,
    recoveryDuration: 0.44,
    maxPoise: 20,
    impactResistance: 0.45,
    poiseRegenDelay: 1.35,
    poiseRegenRate: 4.5,
    stunDuration: 0.60,
    guardBreakDuration: 0.68,
    stunResistance: 1.45,
    interruptMultiplier: 0.62,
    blockChance: 0.20,
    dodgeChance: 0.58,
    counterChance: 0.50,
    aggression: 0.84,
    bodyInsetX: 5,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossNocturne: {
    archetype: "boss",
    attackRange: 66,
    rangedAttackRange: 340,
    preferredDistance: 58,
    retreatDistance: 36,
    moveSpeed: 76,
    attackCooldown: 0.88,
    windupDuration: 0.24,
    activeDuration: 0.15,
    recoveryDuration: 0.40,
    maxPoise: 20,
    impactResistance: 0.45,
    poiseRegenDelay: 1.35,
    poiseRegenRate: 4.5,
    stunDuration: 0.58,
    guardBreakDuration: 0.65,
    stunResistance: 1.45,
    interruptMultiplier: 0.62,
    blockChance: 0.15,
    dodgeChance: 0.60,
    counterChance: 0.52,
    aggression: 0.86,
    bodyInsetX: 5,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossVeyne: {
    archetype: "boss",
    attackRange: 62,
    rangedAttackRange: 360,
    preferredDistance: 92,
    retreatDistance: 56,
    moveSpeed: 54,
    attackCooldown: 0.85,
    windupDuration: 0.25,
    activeDuration: 0.15,
    recoveryDuration: 0.42,
    maxPoise: 22,
    impactResistance: 0.48,
    poiseRegenDelay: 1.4,
    poiseRegenRate: 4.5,
    stunDuration: 0.60,
    guardBreakDuration: 0.68,
    stunResistance: 1.5,
    interruptMultiplier: 0.60,
    blockChance: 0.30,
    dodgeChance: 0.52,
    counterChance: 0.55,
    aggression: 0.85,
    bodyInsetX: 5,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossCalx: {
    archetype: "boss",
    attackRange: 68,
    rangedAttackRange: 340,
    preferredDistance: 52,
    retreatDistance: 30,
    moveSpeed: 56,
    attackCooldown: 0.88,
    windupDuration: 0.28,
    activeDuration: 0.16,
    recoveryDuration: 0.46,
    maxPoise: 26,
    impactResistance: 0.58,
    poiseRegenDelay: 1.5,
    poiseRegenRate: 4.2,
    stunDuration: 0.64,
    guardBreakDuration: 0.74,
    stunResistance: 1.65,
    interruptMultiplier: 0.52,
    blockChance: 0.28,
    dodgeChance: 0.28,
    counterChance: 0.58,
    aggression: 0.88,
    bodyInsetX: 6,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  bossDracula: {
    archetype: "boss",
    attackRange: 66,
    rangedAttackRange: 380,
    preferredDistance: 54,
    retreatDistance: 36,
    moveSpeed: 64,
    attackCooldown: 0.72,
    windupDuration: 0.24,
    activeDuration: 0.15,
    recoveryDuration: 0.38,
    maxPoise: 28,
    impactResistance: 0.60,
    poiseRegenDelay: 1.4,
    poiseRegenRate: 5.0,
    stunDuration: 0.58,
    guardBreakDuration: 0.68,
    stunResistance: 1.7,
    interruptMultiplier: 0.50,
    blockChance: 0.35,
    dodgeChance: 0.55,
    counterChance: 0.65,
    aggression: 0.94,
    bodyInsetX: 6,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
  dracula: {
    archetype: "boss",
    attackRange: 66,
    rangedAttackRange: 380,
    preferredDistance: 54,
    retreatDistance: 36,
    moveSpeed: 64,
    attackCooldown: 0.72,
    windupDuration: 0.24,
    activeDuration: 0.15,
    recoveryDuration: 0.38,
    maxPoise: 28,
    impactResistance: 0.60,
    poiseRegenDelay: 1.4,
    poiseRegenRate: 5.0,
    stunDuration: 0.58,
    guardBreakDuration: 0.68,
    stunResistance: 1.7,
    interruptMultiplier: 0.50,
    blockChance: 0.35,
    dodgeChance: 0.55,
    counterChance: 0.65,
    aggression: 0.94,
    bodyInsetX: 6,
    bodyInsetY: 3,
    hurtboxExpandX: 8,
    hurtboxExpandY: 5,
  },
};

// ============================================================================
// FASE 8 — SEPARATION OF BODY COLLIDER, HURTBOX, AND HITBOX
// ============================================================================

export interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Returns the physical BODY COLLIDER of an entity (narrower than the visual sprite),
 * ensuring characters never overlap visually while allowing clean weapon spacing.
 */
export function getBodyCollider(entity: RectBox, insetX = 3, insetY = 2): RectBox {
  const safeInsetX = Math.min(insetX, Math.floor(entity.w * 0.25));
  const safeInsetY = Math.min(insetY, Math.floor(entity.h * 0.15));
  return {
    x: entity.x + safeInsetX,
    y: entity.y + safeInsetY,
    w: Math.max(8, entity.w - safeInsetX * 2),
    h: Math.max(12, entity.h - safeInsetY),
  };
}

/**
 * Returns the HURTBOX of an enemy (wider than the physical body collider),
 * allowing Aldric's sword hitbox to strike enemies cleanly without body penetration.
 */
export function getEnemyHurtbox(enemy: RectBox & { kind: Kind }): RectBox {
  const cfg = ENEMY_COMBAT_CONFIG[enemy.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
  return {
    x: enemy.x - cfg.hurtboxExpandX,
    y: enemy.y - cfg.hurtboxExpandY,
    w: enemy.w + cfg.hurtboxExpandX * 2,
    h: enemy.h + cfg.hurtboxExpandY * 2,
  };
}

/**
 * Returns the HURTBOX of the player (slightly inset from the outer bounds for fair dodging).
 */
export function getPlayerHurtbox(player: RectBox): RectBox {
  return {
    x: player.x + 2,
    y: player.y + 2,
    w: Math.max(10, player.w - 4),
    h: Math.max(16, player.h - 3),
  };
}

export function rectsOverlap(a: RectBox, b: RectBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ============================================================================
// FASE 3 — COMBAT DIRECTOR (COLLECTIVE INITIATIVE & ROLE COORDINATION)
// ============================================================================

export interface CombatEntityView {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
  boss: boolean;
  dead: boolean;
  dying?: boolean;
  cd: number;
  wind: number;
  hurt: number;
  state: string;
  postAttackT?: number;
  fsmState?: EnemyFsmState;
  combatRole?: CombatRole;
  slotOffsetX?: number;
  attackPhase?: AttackWindowPhase;
  phaseTimer?: number;
  activeTimer?: number;
  impactShakeT?: number;
  hitPlayerThisAttack?: boolean;
  poise?: number;
  maxPoise?: number;
  poiseRegenTimer?: number;
  antiStunTimer?: number;
  consecutiveStuns?: number;
  blockCooldown?: number;
  dodgeCooldown?: number;
}

export class CombatDirector {
  public globalAttackStaggerTimer = 0;
  public activeMeleeAttackers = 0;
  public activeRangedAttackers = 0;

  public update(
    dt: number,
    player: RectBox & { facing: 1 | -1 },
    enemies: CombatEntityView[],
    difficulty: "easy" | "normal" | "hard",
    isHordeMode: boolean,
  ): void {
    this.globalAttackStaggerTimer = Math.max(0, this.globalAttackStaggerTimer - dt);

    const pCenterX = player.x + player.w / 2;
    const maxEngageDist = isHordeMode ? 640 : 285;

    // Collect living, active ground/aerial combat candidates near the player
    const engaged: { e: CombatEntityView; dist: number; side: 1 | -1; score: number }[] = [];
    this.activeMeleeAttackers = 0;
    this.activeRangedAttackers = 0;

    for (const e of enemies) {
      if (e.dead || e.dying || e.state === "emerge") continue;
      const eCenterX = e.x + e.w / 2;
      const dx = eCenterX - pCenterX;
      const dist = Math.abs(dx);
      if (dist > maxEngageDist && !e.boss) {
        e.combatRole = "REAR_GUARD";
        e.slotOffsetX = 0;
        continue;
      }

      const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
      const isCurrentlyAttacking =
        e.wind > 0 ||
        e.fsmState === "WINDUP" ||
        e.fsmState === "ATTACK" ||
        e.fsmState === "COUNTER" ||
        e.state === "slash" ||
        e.state === "charge" ||
        e.state === "dive" ||
        e.state === "leap";

      if (isCurrentlyAttacking && !e.boss) {
        if (cfg.archetype === "ranged") this.activeRangedAttackers++;
        else this.activeMeleeAttackers++;
      }

      // Initiative score: closer enemies, ready cooldowns, higher aggression, and currently attacking get priority
      const readyBonus = e.cd <= 0.08 ? 45 : Math.max(0, 20 - e.cd * 15);
      const activeBonus = isCurrentlyAttacking ? 80 : 0;
      const hurtPenalty = e.hurt > 0 || e.fsmState === "STUNNED" || e.fsmState === "GUARD_BROKEN" || e.fsmState === "RECOVERY" ? -90 : 0;
      const score = (300 - Math.min(300, dist)) * cfg.aggression + readyBonus + activeBonus + hurtPenalty;

      engaged.push({
        e,
        dist,
        side: dx >= 0 ? 1 : -1,
        score,
      });
    }

    // Sort by highest tactical initiative score
    engaged.sort((a, b) => b.score - a.score);

    const maxPrimaryAllowed = difficulty === "easy" ? 1 : difficulty === "hard" ? 2 : 1;
    let primaryAssigned = 0;
    let flankerAssigned = 0;
    let rangedAssigned = 0;

    // Track horizontal spacing slots on Left (-1) and Right (+1) of Aldric so enemies don't stack
    let leftSlotIndex = 0;
    let rightSlotIndex = 0;

    for (const item of engaged) {
      const { e } = item;
      const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;

      if (e.boss) {
        e.combatRole = "PRIMARY_ATTACKER";
        e.slotOffsetX = 0;
        continue;
      }

      // Assign tactical horizontal slot offset on each side of the player
      if (e.kind !== "bat") {
        if (item.side < 0) {
          e.slotOffsetX = leftSlotIndex * 24;
          leftSlotIndex++;
        } else {
          e.slotOffsetX = rightSlotIndex * 24;
          rightSlotIndex++;
        }
      } else {
        e.slotOffsetX = 0;
      }

      // Role assignment:
      // 1. Primary Attacker (Vanguard)
      if (primaryAssigned < maxPrimaryAllowed && e.hurt <= 0 && e.fsmState !== "RECOVERY") {
        e.combatRole = "PRIMARY_ATTACKER";
        primaryAssigned++;
      }
      // 2. Coordinated Ranged Support
      else if (cfg.archetype === "ranged" && rangedAssigned < 1 && e.hurt <= 0) {
        e.combatRole = "COORDINATED_RANGED";
        rangedAssigned++;
      }
      // 3. Flanker (Opportunist waiting to take over immediately when Primary finishes attack)
      else if (flankerAssigned < 1 && e.hurt <= 0) {
        e.combatRole = "FLANKER";
        flankerAssigned++;
      }
      // 4. Rear Guard (Holds perimeter, blocks or observes without crowding)
      else {
        e.combatRole = "REAR_GUARD";
      }
    }
  }

  /**
   * Determines whether an enemy is authorized by the CombatDirector to start an attack right now.
   */
  public requestAttackInitiative(
    e: CombatEntityView,
    dist: number,
    difficulty: "easy" | "normal" | "hard",
  ): boolean {
    if (e.boss) return true;
    if (e.fsmState === "COUNTER") return true; // Counter-attacks always have immediate authorization

    // Prevent two non-boss enemies from starting an attack on the exact same frame
    if (this.globalAttackStaggerTimer > 0 && dist > 54) {
      return false;
    }

    const maxTotalAttackers = difficulty === "easy" ? 2 : difficulty === "hard" ? 3 : 2;
    const currentTotal = this.activeMeleeAttackers + this.activeRangedAttackers;

    if (e.combatRole === "PRIMARY_ATTACKER") {
      if (currentTotal <= maxTotalAttackers) {
        this.globalAttackStaggerTimer = difficulty === "hard" ? 0.16 : 0.24;
        return true;
      }
    }

    if (e.combatRole === "COORDINATED_RANGED") {
      if (this.activeRangedAttackers < 1 && currentTotal < maxTotalAttackers) {
        this.globalAttackStaggerTimer = 0.28;
        return true;
      }
    }

    // Flanker can seize the initiative if within close melee strike range and Primary Attacker isn't mid-swing
    if (e.combatRole === "FLANKER" && this.activeMeleeAttackers === 0 && dist <= 72) {
      this.globalAttackStaggerTimer = 0.22;
      return true;
    }

    return false;
  }
}

// ============================================================================
// FASE 2 & FASE 5 — FSM CONTROLLER & 3-STAGE ATTACK WINDOWS (WINDUP -> ACTIVE -> RECOVERY)
// ============================================================================

/**
 * Validates FSM state transitions so contradictory states never overlap:
 * - DEAD cannot transition to any state.
 * - STUNNED / GUARD_BROKEN cannot transition to movement/attack while e.hurt > 0 unless force === true.
 * - Active ATTACK / COUNTER cannot be downgraded to IDLE / OBSERVE / APPROACH while activeTimer > 0 unless interrupted.
 */
export function setEnemyFsmState(
  e: CombatEntityView,
  nextState: EnemyFsmState,
  duration = 0,
  force = false,
): void {
  if (e.fsmState === "DEAD" && !force) return;

  if (!force && (e.fsmState === "STUNNED" || e.fsmState === "GUARD_BROKEN") && e.hurt > 0) {
    if (nextState !== "DEAD" && nextState !== "STUNNED" && nextState !== "GUARD_BROKEN") {
      return;
    }
  }

  if (
    !force &&
    (e.fsmState === "ATTACK" || e.fsmState === "COUNTER") &&
    (e.activeTimer ?? 0) > 0 &&
    (nextState === "IDLE" || nextState === "OBSERVE" || nextState === "APPROACH")
  ) {
    return;
  }

  const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
  e.fsmState = nextState;
  e.phaseTimer = duration;

  switch (nextState) {
    case "IDLE":
    case "OBSERVE":
    case "APPROACH":
      e.attackPhase = "NONE";
      e.activeTimer = 0;
      if (e.state !== "shield" && e.state !== "hover") {
        e.state = "idle";
      }
      break;
    case "DEFEND":
      e.attackPhase = "NONE";
      e.activeTimer = 0;
      e.state = "shield";
      break;
    case "WINDUP":
      e.attackPhase = "WINDUP";
      e.wind = duration;
      e.activeTimer = 0;
      e.hitPlayerThisAttack = false;
      if (e.state !== "charge" && e.state !== "leap" && e.state !== "dive" && e.state !== "smash") {
        e.state = "slash";
      }
      break;
    case "ATTACK":
    case "COUNTER":
      e.attackPhase = "ACTIVE";
      e.activeTimer = duration > 0 ? duration : cfg.activeDuration;
      if (e.state !== "charge" && e.state !== "leap" && e.state !== "dive" && e.state !== "smash") {
        e.state = "slash";
      }
      break;
    case "RECOVERY":
      e.attackPhase = "RECOVERY";
      e.wind = 0;
      e.activeTimer = 0;
      if (e.state !== "hover") {
        e.state = "idle";
      }
      break;
    case "DODGE":
    case "RETREAT":
      e.attackPhase = "NONE";
      e.wind = 0;
      e.activeTimer = 0;
      e.state = "retreat";
      break;
    case "STUNNED":
    case "GUARD_BROKEN":
      e.attackPhase = "NONE";
      e.wind = 0;
      e.activeTimer = 0;
      e.hurt = Math.max(e.hurt, duration);
      e.state = "idle";
      break;
    case "DEAD":
      e.attackPhase = "NONE";
      e.wind = 0;
      e.activeTimer = 0;
      e.state = "dying";
      break;
  }
}

/**
 * Updates the enemy's Poise regeneration, anti-stunlock timers, and FSM state timers each frame.
 */
export function updateEnemyPoiseAndFsmTimers(e: CombatEntityView, dt: number): void {
  const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
  if (e.maxPoise === undefined || e.maxPoise <= 0) {
    e.maxPoise = cfg.maxPoise;
    e.poise = cfg.maxPoise;
  }

  e.antiStunTimer = Math.max(0, (e.antiStunTimer ?? 0) - dt);
  e.blockCooldown = Math.max(0, (e.blockCooldown ?? 0) - dt);
  e.dodgeCooldown = Math.max(0, (e.dodgeCooldown ?? 0) - dt);
  e.poiseRegenTimer = Math.max(0, (e.poiseRegenTimer ?? 0) - dt);
  e.impactShakeT = Math.max(0, (e.impactShakeT ?? 0) - dt);
  e.activeTimer = Math.max(0, (e.activeTimer ?? 0) - dt);

  // Gradual Poise recovery after poiseRegenDelay without taking hits
  if ((e.poiseRegenTimer ?? 0) <= 0 && e.hurt <= 0 && !e.dead && !e.dying) {
    e.poise = Math.min(e.maxPoise, (e.poise ?? e.maxPoise) + cfg.poiseRegenRate * dt);
    if ((e.poise ?? 0) >= e.maxPoise * 0.8) {
      e.consecutiveStuns = 0;
    }
  }

  // Transition out of STUNNED / GUARD_BROKEN once hurt timer finishes
  if ((e.fsmState === "STUNNED" || e.fsmState === "GUARD_BROKEN") && e.hurt <= 0) {
    e.poise = e.maxPoise;
    e.antiStunTimer = Math.max(e.antiStunTimer ?? 0, cfg.stunResistance);
    setEnemyFsmState(e, "IDLE", 0, true);
  }
}

// ============================================================================
// FASE 4 — POISE, IMPACT RESISTANCE & INTERRUPTION EVALUATION
// ============================================================================

export interface PoiseEvaluationResult {
  interrupted: boolean;
  guardBroken: boolean;
  stunned: boolean;
  triggerTacticalCounter: boolean;
  recoilVelocity: number;
  recoilDuration: number;
  stunDuration: number;
}

export function evaluatePoiseImpact(
  e: CombatEntityView,
  attackProfile: PlayerAttackProfile,
  knockDir: 1 | -1,
  wasShieldingFront: boolean,
  difficulty: "easy" | "normal" | "hard",
): PoiseEvaluationResult {
  const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
  if (!e.maxPoise || e.maxPoise <= 0) {
    e.maxPoise = cfg.maxPoise;
    e.poise = cfg.maxPoise;
  }

  // Reset poise regeneration delay timer on impact
  e.poiseRegenTimer = cfg.poiseRegenDelay;

  const isCounterWindow = e.wind > 0 || e.fsmState === "WINDUP";
  const counterMult = isCounterWindow ? 1.2 : 1.0;
  const resistFactor = Math.max(0.15, 1.0 - cfg.impactResistance);

  // Effective poise damage scaled by attack profile, enemy interruptMultiplier, and impactResistance
  let poiseDelta =
    attackProfile.poiseDamage *
    attackProfile.interruptPower *
    cfg.interruptMultiplier *
    resistFactor *
    counterMult;

  // Anti-Stunlock protection: if enemy recently recovered from stun or counter, reduce poise damage
  const hasAntiStunArmor = (e.antiStunTimer ?? 0) > 0;
  if (hasAntiStunArmor && attackProfile.category === "LIGHT") {
    poiseDelta *= 0.25;
  } else if (hasAntiStunArmor) {
    poiseDelta *= 0.55;
  }

  // Apply poise damage and trigger visual impact shudder even if not interrupted
  e.poise = Math.max(0, (e.poise ?? e.maxPoise) - poiseDelta);
  e.impactShakeT = 0.14;

  // 1. Check Guard Break on shielding enemy hit by a Guard-Breaking attack (NORMAL finisher/pogo, HEAVY, SPECIAL)
  if (wasShieldingFront && attackProfile.canBreakGuard) {
    e.poise = e.maxPoise;
    e.consecutiveStuns = (e.consecutiveStuns ?? 0) + 1;
    e.antiStunTimer = cfg.guardBreakDuration + cfg.stunResistance;
    setEnemyFsmState(e, "GUARD_BROKEN", cfg.guardBreakDuration, true);
    return {
      interrupted: true,
      guardBroken: true,
      stunned: true,
      triggerTacticalCounter: false,
      recoilVelocity: knockDir * Math.min(145, attackProfile.impactForce * 1.15),
      recoilDuration: 0.22,
      stunDuration: cfg.guardBreakDuration,
    };
  }

  // 2. Check Full Poise Break -> GUARD_BROKEN (opens Contextual Execution window)
  if ((e.poise ?? 0) <= 0 && !hasAntiStunArmor) {
    const maxConsecutive = e.boss ? 1 : 2;
    const stuns = (e.consecutiveStuns ?? 0) + 1;
    e.consecutiveStuns = stuns;
    e.poise = e.maxPoise;

    // If enemy has already been stunned consecutively, trigger an immediate Anti-Stunlock Counter/Retreat instead of infinite stun!
    if (stuns > maxConsecutive) {
      e.consecutiveStuns = 0;
      e.antiStunTimer = cfg.stunResistance * 1.25;
      return {
        interrupted: false,
        guardBroken: false,
        stunned: false,
        triggerTacticalCounter: true,
        recoilVelocity: knockDir * 85,
        recoilDuration: 0.08,
        stunDuration: 0,
      };
    }

    const diffMult = difficulty === "easy" ? 1.15 : difficulty === "hard" ? 0.82 : 1.0;
    const stunDur = Math.max(cfg.stunDuration, cfg.guardBreakDuration) * diffMult;
    e.antiStunTimer = stunDur + cfg.stunResistance;
    const nextState: EnemyFsmState = e.kind === "bat" ? "STUNNED" : "GUARD_BROKEN";
    setEnemyFsmState(e, nextState, stunDur, true);

    return {
      interrupted: true,
      guardBroken: nextState === "GUARD_BROKEN",
      stunned: true,
      triggerTacticalCounter: false,
      recoilVelocity: knockDir * Math.min(140, attackProfile.impactForce * (e.boss ? 0.85 : 1.05)),
      recoilDuration: 0.18,
      stunDuration: stunDur,
    };
  }

  // 3. Poise > 0 (Not Stunned):
  // LIGHT attacks do NOT interrupt committed attacks (WINDUP/ATTACK) or heavy/boss enemies!
  // HEAVY / SPECIAL attacks can interrupt non-boss enemies even before poise hits 0.
  const isCommittedAttack =
    e.wind > 0 ||
    (e.activeTimer ?? 0) > 0 ||
    e.fsmState === "WINDUP" ||
    e.fsmState === "ATTACK" ||
    e.fsmState === "COUNTER" ||
    e.state === "charge" ||
    e.state === "leap" ||
    e.state === "dive";

  if (!e.boss && (attackProfile.category === "HEAVY" || attackProfile.category === "SPECIAL") && !hasAntiStunArmor) {
    setEnemyFsmState(e, "STUNNED", cfg.stunDuration * 0.75, true);
    e.antiStunTimer = cfg.stunResistance;
    return {
      interrupted: true,
      guardBroken: false,
      stunned: true,
      triggerTacticalCounter: false,
      recoilVelocity: knockDir * Math.min(135, attackProfile.impactForce),
      recoilDuration: 0.18,
      stunDuration: cfg.stunDuration * 0.75,
    };
  }

  if (isCommittedAttack) {
    // Enemy holds its poise during its attack windup/active phase — slight physical slide without canceling the attack!
    return {
      interrupted: false,
      guardBroken: false,
      stunned: false,
      triggerTacticalCounter: false,
      recoilVelocity: knockDir * Math.max(18, attackProfile.impactForce * (1 - cfg.impactResistance) * 0.45),
      recoilDuration: 0.05,
      stunDuration: 0,
    };
  }

  // Neutral hit with Poise remaining: light physical pushback to sword-tip spacing
  return {
    interrupted: false,
    guardBroken: false,
    stunned: false,
    triggerTacticalCounter: false,
    recoilVelocity: knockDir * Math.max(32, attackProfile.impactForce * (1 - cfg.impactResistance * 0.65)),
    recoilDuration: 0.09,
    stunDuration: 0,
  };
}

// ============================================================================
// FASE 8 — NON-OVERLAPPING PHYSICAL BODY COLLISION RESOLUTION
// ============================================================================

/**
 * Identifies whether an entity is currently an airborne / flying creature
 * that should NOT be subjected to ground-based horizontal body blocking.
 */
export function isAerialCreature(e: CombatEntityView): boolean {
  if (e.kind === "bat" || e.kind === "bossNocturne" || e.kind === "bossSeraphine") {
    return true;
  }
  if (
    e.kind === "gargoyle" &&
    (!e.grounded || e.state === "hover" || e.state === "dive" || e.state === "leap")
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves physical BODY COLLIDERS between Player and Enemies, and between Enemy pairs,
 * without oscillations, without blocking vertical jumps/platforming, and WITHOUT applying
 * unfair passive contact damage when an enemy is not executing an attack.
 */
export function resolveCombatBodyCollisions(
  player: RectBox & { vx: number; vy: number; grounded: boolean; dead: boolean; won: boolean; dying?: boolean; dashT: number; iframes: number },
  enemies: CombatEntityView[],
  stageW: number,
  dt: number,
): void {
  if (player.dead || player.dying || player.won) return;

  const pBody = getBodyCollider(player, 3, 2);
  const pMidX = pBody.x + pBody.w / 2;

  for (let i = 0; i < enemies.length; i++) {
    const e1 = enemies[i];
    if (e1.dead || e1.dying || e1.state === "emerge") continue;

    const cfg1 = ENEMY_COMBAT_CONFIG[e1.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
    const eBody1 = getBodyCollider(e1, cfg1.bodyInsetX, cfg1.bodyInsetY);
    const e1MidX = eBody1.x + eBody1.w / 2;
    const e1Aerial = isAerialCreature(e1);

    // 1. Player vs Enemy Physical Body Separation
    // Skip horizontal body blocking if the player is actively dashing through with i-frames
    const isPlayerPhasing = player.dashT > 0 && player.iframes > 0;
    if (!isPlayerPhasing) {
      if (!e1Aerial) {
        const vertOverlap = Math.min(pBody.y + pBody.h, eBody1.y + eBody1.h) - Math.max(pBody.y, eBody1.y);
        // Only separate horizontally when bodies are on the same vertical plane (preserves jumping over enemies)
        if (vertOverlap > 12) {
          // Minimum center-to-center distance between physical BODY COLLIDERS (+2px comfort buffer)
          const minCenterDist = (pBody.w + eBody1.w) / 2 + 2;
          const dx = e1MidX - pMidX;
          const absDx = Math.abs(dx);

          if (absDx < minCenterDist) {
            const overlapPx = minCenterDist - absDx;
            const dir = dx >= 0 ? 1 : -1;

            // Smoothly push the enemy out of the player's body space first (prevents enemy walking inside player)
            const enemyPush = e1.boss ? overlapPx * 0.45 : overlapPx * 0.82;
            const playerPush = overlapPx - enemyPush;

            e1.x = Math.max(12, Math.min(stageW - e1.w - 12, e1.x + dir * enemyPush));
            player.x = Math.max(0, Math.min(stageW - player.w, player.x - dir * playerPush));

            // Cancel inward velocities so there is zero oscillation/jitter
            if (dir > 0) {
              if (e1.vx < 0) e1.vx = 0;
              if (player.vx > 0) player.vx = 0;
            } else {
              if (e1.vx > 0) e1.vx = 0;
              if (player.vx < 0) player.vx = 0;
            }
          }
        }
      } else if (e1.kind === "bat") {
        // Aerial Bat vs Player Head Boundary
        const headTop = player.y;
        if (e1.x + e1.w > player.x && e1.x < player.x + player.w) {
          if (e1.y + e1.h > headTop && e1.y < headTop + 16) {
            e1.y = headTop - e1.h;
            if (e1.vy > 0) e1.vy = 0;
          }
        }
      }
    }

    // 2. Enemy vs Enemy Physical Body Separation (prevents enemies from merging into one sprite)
    for (let j = i + 1; j < enemies.length; j++) {
      const e2 = enemies[j];
      if (e2.dead || e2.dying || e2.state === "emerge") continue;
      const e2Aerial = isAerialCreature(e2);

      if (e1.kind === "bat" && e2.kind === "bat") {
        const bdx = (e2.x + e2.w / 2) - (e1.x + e1.w / 2);
        const bdy = (e2.y + e2.h / 2) - (e1.y + e1.h / 2);
        const bDist = Math.hypot(bdx, bdy);
        const minBatDist = 28;
        if (bDist < minBatDist && bDist > 0.01) {
          const push = (minBatDist - bDist) * 0.35;
          const nx = bdx / bDist;
          const ny = bdy / bDist;
          e2.x += nx * push;
          e2.y += ny * push;
          e1.x -= nx * push;
          e1.y -= ny * push;
        }
      } else if (!e1Aerial && !e2Aerial && !e1.boss && !e2.boss) {
        const vertOverlap = Math.min(e1.y + e1.h, e2.y + e2.h) - Math.max(e1.y, e2.y);
        if (vertOverlap > 14) {
          const cfg2 = ENEMY_COMBAT_CONFIG[e2.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
          const eBody2 = getBodyCollider(e2, cfg2.bodyInsetX, cfg2.bodyInsetY);
          const minEnemySep = (eBody1.w + eBody2.w) / 2 + 6;
          const delta = (eBody2.x + eBody2.w / 2) - (eBody1.x + eBody1.w / 2);
          const absDelta = Math.abs(delta);
          if (absDelta < minEnemySep) {
            const dir = delta === 0 ? (e2.id > e1.id ? 1 : -1) : Math.sign(delta);
            const push = (minEnemySep - absDelta) * Math.min(1, dt * 18);
            e2.x = Math.max(12, Math.min(stageW - e2.w - 12, e2.x + dir * push));
            e1.x = Math.max(12, Math.min(stageW - e1.w - 12, e1.x - dir * push));
          }
        }
      }
    }
  }
}

// ============================================================================
// FASE 6, FASE 7 & FASE 9 — ADAPTIVE PLAYER TRACKER, DEFENSE, DODGE & COUNTER AI
// ============================================================================

export interface AdaptiveModifiers {
  blockBonus: number;
  dodgeBonus: number;
  counterBonus: number;
  chaseSpeedMult: number;
  dodgeFreqScore: number;
  forceOffensiveInitiative: boolean;
  playerTelegraphingHeavy: boolean;
  playerJustFinishedCombo: boolean;
}

export class PlayerBehaviorTracker {
  public mashScore = 0;            // 0..1: rapid repeated attacks
  public heavyScore = 0;           // 0..1: frequent charged/heavy attacks
  public retreatScore = 0;         // 0..1: frequent backing away / kiting
  public dodgeScore = 0;           // 0..1: frequent dash/evade usage
  public recoveryPunishScore = 0;  // 0..1: hitting enemies during RECOVERY
  public passiveTime = 0;          // seconds player stayed idle/passive
  private lastAttackTime = -10;
  private prevPlayerX = 0;
  private prevAttackT = 0;
  private prevDashT = 0;
  public comboJustEndedTimer = 0;
  public observableChargeTime = 0; // tracks how long player has been visibly charging (human reaction delay)

  public reset(): void {
    this.mashScore = 0;
    this.heavyScore = 0;
    this.retreatScore = 0;
    this.dodgeScore = 0;
    this.recoveryPunishScore = 0;
    this.passiveTime = 0;
    this.lastAttackTime = -10;
    this.prevDashT = 0;
    this.comboJustEndedTimer = 0;
    this.observableChargeTime = 0;
  }

  public update(
    dt: number,
    time: number,
    player: {
      x: number;
      vx: number;
      facing: 1 | -1;
      attackT: number;
      holdT: number;
      charge: string;
      specialT: number;
      dashT: number;
      combo: number;
    },
    nearestEnemyX: number | null,
  ): void {
    // Natural decay of behavioral scores over ~4 seconds
    const decay = Math.max(0, 1 - dt * 0.28);
    this.mashScore *= decay;
    this.heavyScore *= decay;
    this.retreatScore *= decay;
    this.dodgeScore *= decay;
    this.recoveryPunishScore *= decay;
    this.comboJustEndedTimer = Math.max(0, this.comboJustEndedTimer - dt);

    // Detect newly started dash/dodge
    if (player.dashT > 0.08 && this.prevDashT <= 0.01) {
      this.dodgeScore = Math.min(1, this.dodgeScore + 0.34);
      this.passiveTime = 0;
    }
    this.prevDashT = player.dashT;

    // Detect newly started attack swing
    if (player.attackT > 0.14 && this.prevAttackT <= 0.02) {
      const interval = time - this.lastAttackTime;
      this.lastAttackTime = time;
      if (interval < 0.42) {
        this.mashScore = Math.min(1, this.mashScore + 0.28);
      } else {
        this.mashScore = Math.min(1, this.mashScore + 0.08);
      }
      this.passiveTime = 0;
    }

    // Detect end of a player attack swing (window for enemy counter-attack if player whiffed or finished 3rd hit)
    if (this.prevAttackT > 0.02 && player.attackT <= 0.02) {
      this.comboJustEndedTimer = player.combo === 2 ? 0.34 : 0.20;
    }
    this.prevAttackT = player.attackT;

    // Detect visible hold-to-charge or special usage (with 0.28s human perception delay!)
    if (player.holdT > 0.20 || player.charge === "wind") {
      this.observableChargeTime += dt;
      if (this.observableChargeTime >= 0.28) {
        this.heavyScore = Math.min(1, this.heavyScore + dt * 0.45);
      }
      this.passiveTime = 0;
    } else {
      this.observableChargeTime = 0;
    }

    if (player.specialT > 0) {
      this.heavyScore = Math.min(1, this.heavyScore + dt * 0.6);
      this.passiveTime = 0;
    }

    // Detect player retreating / kiting away from nearest enemy
    if (nearestEnemyX !== null) {
      const dirToEnemy = nearestEnemyX >= player.x ? 1 : -1;
      const movingAway = (player.x - this.prevPlayerX) * dirToEnemy < -0.4;
      if (movingAway) {
        this.retreatScore = Math.min(1, this.retreatScore + dt * (player.dashT > 0 ? 0.85 : 0.35));
        this.passiveTime = 0;
      }
    }

    // Detect player standing passive
    if (Math.abs(player.vx) < 8 && player.attackT <= 0 && player.holdT <= 0.1 && player.dashT <= 0) {
      this.passiveTime += dt;
    } else {
      this.passiveTime = Math.max(0, this.passiveTime - dt * 2);
    }

    this.prevPlayerX = player.x;
  }

  public recordHitOnEnemyInRecovery(): void {
    this.recoveryPunishScore = Math.min(1, this.recoveryPunishScore + 0.25);
  }

  public getModifiers(): AdaptiveModifiers {
    return {
      blockBonus: this.mashScore > 0.38 ? Math.min(0.35, (this.mashScore - 0.32) * 0.55) : 0,
      dodgeBonus: this.heavyScore > 0.32 ? Math.min(0.38, (this.heavyScore - 0.22) * 0.55) : 0,
      counterBonus:
        this.mashScore > 0.42 || this.recoveryPunishScore > 0.38 || this.dodgeScore > 0.45
          ? Math.min(0.38, Math.max(this.mashScore, this.recoveryPunishScore, this.dodgeScore) * 0.48)
          : 0,
      chaseSpeedMult: this.retreatScore > 0.42 ? 1.0 + Math.min(0.24, (this.retreatScore - 0.38) * 0.42) : 1.0,
      dodgeFreqScore: this.dodgeScore,
      forceOffensiveInitiative: this.passiveTime >= 1.25,
      // Only true after the player has been visibly glowing/charging for >= 0.32s (fair human reaction time)
      playerTelegraphingHeavy: this.observableChargeTime >= 0.32,
      playerJustFinishedCombo: this.comboJustEndedTimer > 0,
    };
  }
}

/**
 * Evaluates whether an enemy in neutral/observe/approach should proactively DODGE, DEFEND, or COUNTER
 * based on its NightfallEnemyClass, archetype config, cooldowns, arena bounds, and the player's adaptive behavior profile.
 */
export function evaluateAdaptiveTacticalAction(
  e: CombatEntityView & { facing: 1 | -1; attackVariant?: number },
  dist: number,
  stageW: number,
  mods: AdaptiveModifiers,
): "DODGE" | "DEFEND" | "COUNTER" | "NONE" {
  if (
    e.dead ||
    e.dying ||
    e.hurt > 0 ||
    e.wind > 0 ||
    (e.activeTimer ?? 0) > 0 ||
    (e.postAttackT ?? 0) > 0
  ) {
    return "NONE";
  }

  const cfg = ENEMY_COMBAT_CONFIG[e.kind] ?? ENEMY_COMBAT_CONFIG.skeleton;
  const enemyClass = getNightfallEnemyClass(e.kind);

  // 1. Adaptive Dodge when player visibly charges a Heavy Attack within threat range
  if (
    mods.playerTelegraphingHeavy &&
    dist <= 160 &&
    (e.dodgeCooldown ?? 0) <= 0 &&
    e.grounded &&
    cfg.dodgeChance > 0.12
  ) {
    const retreatDir = -e.facing;
    const targetX = e.x + retreatDir * 68;
    const hasArenaSpace = targetX > 36 && targetX < stageW - e.w - 36;
    const classDodgeBoost = enemyClass === "AGILE_PREDATOR" ? 0.15 : 0;
    if (hasArenaSpace && Math.random() < Math.min(0.82, cfg.dodgeChance + mods.dodgeBonus + classDodgeBoost)) {
      e.dodgeCooldown = e.boss ? 2.4 : 2.0;
      return "DODGE";
    }
  }

  // 2. Opportunistic Counter-Attack right as the player finishes a combo / whiffs at close range
  if (
    mods.playerJustFinishedCombo &&
    dist <= cfg.attackRange + 22 &&
    e.cd <= 0.25 &&
    Math.random() < Math.min(0.82, cfg.counterChance + mods.counterBonus)
  ) {
    return "COUNTER";
  }

  // 3. Adaptive Guard / Defend when player is mashing attacks at close-to-mid range
  // Applies to SKELETON_WARRIOR (Classe 1), HEAVY_WARRIOR (Classe 3), and defensive Bosses
  if (
    mods.blockBonus > 0.06 &&
    dist <= cfg.attackRange + 32 &&
    (e.blockCooldown ?? 0) <= 0 &&
    (enemyClass === "SKELETON_WARRIOR" ||
      enemyClass === "HEAVY_WARRIOR" ||
      cfg.archetype === "defensive" ||
      cfg.archetype === "heavy") &&
    Math.random() < Math.min(0.78, cfg.blockChance + mods.blockBonus)
  ) {
    return "DEFEND";
  }

  return "NONE";
}
