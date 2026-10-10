export type Solid = { x: number; y: number; w: number; h: number; oneWay?: boolean };

export type Kind =
  | "bat"
  | "gargoyle"
  | "vampire"
  | "skeleton"
  | "armoredSkeleton"
  | "redSkeleton"
  | "zombie"
  | "knight"
  | "dracula"
  | "bossPetros"
  | "bossValerius"
  | "bossSeraphine"
  | "bossNocturne"
  | "bossVeyne"
  | "bossCalx"
  | "bossDracula";

export type Spawn = {
  kind: Kind;
  x: number;
  y: number;
  hp: number;
  boss?: boolean;
  name?: string;
};

export type PropKind =
  | "house"
  | "ruin"
  | "column"
  | "marbleColumn"
  | "brokenColumn"
  | "hangingColumn"
  | "gladiatorStatue"
  | "sconceBlue"
  | "gargoyle"
  | "gate"
  | "fence"
  | "blockGrass"
  | "blockStone"
  | "candelabra"
  | "statue"
  | "pew"
  | "pewRight"
  | "altar"
  | "angel"
  | "angelTall"
  | "coffin"
  | "coffinOpen"
  | "tomb"
  | "cell"
  | "bookshelf"
  | "ladder"
  | "desk"
  | "globe"
  | "books"
  | "cauldronGreen"
  | "cauldronPurple"
  | "potions"
  | "alchemyTable"
  | "crystals"
  | "throne"
  | "shield"
  | "banner"
  | "stainedGlass"
  | "chains";

export type Prop = {
  kind: PropKind;
  x: number;
  y: number;
  layer?: "bg" | "main" | "fg";
};

export type ItemKind = "life" | "heal" | "mana";

export type ItemSpawn = {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
};

export type LevelDef = {
  id: number;
  title: string;
  place: string;
  bg: string;
  mid: string;
  width: number;
  solids: Solid[];
  pits: { x: number; w: number }[];
  props: Prop[];
  spawns: Spawn[];
  items: ItemSpawn[];
  door: { x: number; y: number };
  theme: "gates" | "gallery" | "chapel" | "catacombs" | "library" | "alchemy" | "throne";
};

export const GROUND_Y = 200;
const G = GROUND_Y;
const DEEP = 320;

// Continuous solid floor without deadly inescapable pit traps
function hallFloor(width: number): Solid[] {
  return [{ x: 0, y: G, w: width, h: DEEP }];
}

// Ornate Gothic jump-through platform (one-way: jump up from below, stand on top, drop down with S+W)
function platform(x: number, y: number, w: number): Solid {
  return { x, y, w, h: 10, oneWay: true };
}

// =========================================================================
// LEVEL 1: OS PORTÕES DO CASTELO (5400px - Graveyard, Castle Ramparts & Gatehouse)
// =========================================================================
const level1_solids: Solid[] = [
  ...hallFloor(5400),
  // Section 1: Graveyard stepped ramparts & walkways
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  platform(396, 145, 180),
  platform(640, 105, 180),
  platform(880, 145, 140),
  // Broken column stepping stone
  platform(1060, 120, 70),

  // Section 2: Outer Ramparts & Watchtower platforms
  { x: 1300, y: 185, w: 32, h: 15 },
  { x: 1332, y: 170, w: 32, h: 30 },
  platform(1364, 150, 160),
  platform(1580, 110, 160),
  platform(1820, 75, 180), // High watchtower perch with extra life
  platform(2080, 110, 160),
  platform(2300, 150, 140),

  // Section 3: Sunken Moat & Broken Rampart
  { x: 2540, y: 220, w: 30, h: DEEP },
  { x: 2570, y: 245, w: 600, h: DEEP }, // Sunken Moat
  { x: 3170, y: 220, w: 30, h: DEEP },
  platform(2660, 175, 80),
  platform(2900, 175, 80),
  platform(2540, 115, 160),
  platform(2780, 80, 180),
  platform(3040, 115, 160),

  // Section 4: Monumental Gatehouse Approach
  { x: 3450, y: 185, w: 32, h: 15 },
  { x: 3482, y: 170, w: 32, h: 30 },
  platform(3514, 150, 160),
  platform(3760, 110, 160),
  platform(4020, 75, 180), // Battlement mezzanine overlooking the gate
  platform(4280, 110, 160),
  platform(4520, 150, 150),

  // Section 5: Petros Boss Chamber
  platform(4880, 135, 180),
  platform(5140, 135, 180),
];

const level1_props: Prop[] = [
  // Section 1: Cemetery
  { kind: "tomb", x: 180, y: G, layer: "main" },
  { kind: "fence", x: 280, y: G, layer: "main" },
  { kind: "fence", x: 500, y: G + 15, layer: "fg" }, // Foreground fence with 2.5D parallax!
  { kind: "tomb", x: 740, y: G, layer: "main" },
  { kind: "gargoyle", x: 920, y: G, layer: "main" },
  { kind: "fence", x: 1040, y: G + 15, layer: "fg" },

  // Section 2: Ramparts
  { kind: "column", x: 1420, y: G, layer: "main" },
  { kind: "sconceBlue", x: 1420, y: 140, layer: "main" },
  { kind: "gargoyle", x: 1900, y: 75, layer: "main" },
  { kind: "column", x: 2160, y: G, layer: "main" },
  { kind: "sconceBlue", x: 2160, y: 140, layer: "main" },

  // Section 3: Sunken Moat
  { kind: "tomb", x: 2750, y: 245, layer: "main" },
  { kind: "fence", x: 2880, y: 245, layer: "main" },
  { kind: "brokenColumn", x: 3240, y: G, layer: "main" },

  // Section 4: Gatehouse with Monumental Castle Gate in background
  { kind: "gate", x: 4100, y: G, layer: "bg" }, // The monumental iron gate in recessed background arch!
  { kind: "gargoyle", x: 3880, y: G, layer: "main" },
  { kind: "gargoyle", x: 4320, y: G, layer: "main" },
  { kind: "column", x: 3780, y: G, layer: "main" },
  { kind: "sconceBlue", x: 3780, y: 140, layer: "main" },
  { kind: "column", x: 4420, y: G, layer: "main" },
  { kind: "sconceBlue", x: 4420, y: 140, layer: "main" },

  // Section 5: Petros Chamber
  { kind: "gargoyle", x: 4800, y: G, layer: "main" },
  { kind: "column", x: 5040, y: G, layer: "main" },
  { kind: "sconceBlue", x: 5040, y: 140, layer: "main" },
];

const level1_spawns: Spawn[] = [
  { kind: "zombie", x: 260, y: G, hp: 4 },
  { kind: "bat", x: 460, y: 75, hp: 2 },
  { kind: "skeleton", x: 580, y: 110, hp: 5 },
  { kind: "zombie", x: 860, y: G, hp: 4 },
  { kind: "bat", x: 1020, y: 65, hp: 2 },
  { kind: "knight", x: 1360, y: G, hp: 7 },
  { kind: "skeleton", x: 1740, y: 110, hp: 5 },
  { kind: "armoredSkeleton", x: 2020, y: G, hp: 8 },
  { kind: "bat", x: 2250, y: 55, hp: 2 },
  { kind: "knight", x: 2420, y: G, hp: 7 },
  { kind: "skeleton", x: 2880, y: 105, hp: 5 },
  { kind: "bat", x: 3120, y: 55, hp: 2 },
  { kind: "zombie", x: 3560, y: G, hp: 5 },
  { kind: "skeleton", x: 4050, y: 115, hp: 5 },
  { kind: "knight", x: 4500, y: G, hp: 8 },
  { kind: "bossPetros", x: 5080, y: G, hp: 26, boss: true, name: "Petros, Guardião de Pedra" },
];

const level1_items: ItemSpawn[] = [
  { id: 101, kind: "heal", x: 220, y: G - 28 },
  { id: 102, kind: "mana", x: 580, y: 82 },
  { id: 103, kind: "life", x: 1960, y: 47 },
  { id: 104, kind: "heal", x: 3100, y: 42 },
  { id: 105, kind: "mana", x: 4260, y: 52 },
  { id: 106, kind: "life", x: 5180, y: 107 },
];

// =========================================================================
// LEVEL 2: A GALERIA DE MÁRMORE (5600px - Marble Gallery & Imperial Colosseum)
// Authentic Castlevania: SOTN architecture with multi-tier verticality:
// Sunken Gladiator Arenas, Stepped Marble Stairs, Broken Column Stepping Stones,
// High Balconies, Hall of the Colossus, and Hanging Foreground Columns.
// =========================================================================
const level2_solids: Solid[] = [
  // SECTION 1: Entrance Colonnade & Balconies (x: 0 to 1180)
  { x: 0, y: G, w: 1190, h: DEEP },
  // Stepped marble stairs rising to Balcony Tier 1
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  { x: 396, y: 140, w: 44, h: 60 },
  platform(440, 140, 200),
  platform(680, 95, 180),
  // Broken column stepping stone
  platform(885, 115, 70),
  platform(990, 135, 180),

  // SECTION 2: The Sunken Gladiator Crypts (x: 1190 to 2110)
  // Stepped stairs descending into sunken arena pit (y = 255)
  { x: 1190, y: 215, w: 30, h: DEEP },
  { x: 1220, y: 235, w: 30, h: DEEP },
  { x: 1250, y: 255, w: 800, h: DEEP }, // Sunken Pit Floor
  // Stepped stairs climbing back up
  { x: 2050, y: 235, w: 30, h: DEEP },
  { x: 2080, y: 215, w: 30, h: DEEP },
  // Broken column perches inside the sunken pit
  platform(1445, 170, 70),
  platform(1785, 170, 70),
  // High catwalks spanning across the sunken pit
  platform(1320, 110, 160),
  platform(1560, 75, 180),
  platform(1820, 110, 160),

  // SECTION 3: The Hall of the Colossus (x: 2110 to 3710)
  { x: 2110, y: G, w: 1600, h: DEEP },
  // Broken column platforms flanking the Colossus
  platform(2745, 115, 70),
  platform(3085, 115, 70),
  // Elevated Royal Mezzanines
  platform(2400, 140, 160),
  platform(2620, 100, 150),
  platform(2880, 65, 140), // High observation deck right before statue head
  platform(3180, 100, 150),
  platform(3420, 140, 160),

  // SECTION 4: The Grand Colonnade & Stepped Gallery (x: 3710 to 4860)
  { x: 3710, y: G, w: 1150, h: DEEP },
  // Stepped marble tiers
  { x: 3750, y: 185, w: 32, h: 15 },
  { x: 3782, y: 170, w: 32, h: 30 },
  { x: 3814, y: 155, w: 32, h: 45 },
  { x: 3846, y: 140, w: 40, h: 60 },
  platform(3886, 140, 220),
  platform(4145, 115, 70), // Broken column
  platform(4280, 85, 180),
  platform(4485, 115, 70), // Broken column
  platform(4620, 140, 180),

  // SECTION 5: The Sanctuary of Valerius (Boss Arena) (x: 4860 to 5600)
  { x: 4860, y: G, w: 740, h: DEEP },
  platform(5020, 125, 140),
  platform(5280, 125, 140),
];

const level2_props: Prop[] = [
  // Section 1: Entrance Colonnade
  { kind: "marbleColumn", x: 200, y: G, layer: "main" },
  { kind: "sconceBlue", x: 200, y: 135, layer: "main" },
  { kind: "hangingColumn", x: 560, y: 0, layer: "fg" },
  { kind: "marbleColumn", x: 680, y: G, layer: "main" },
  { kind: "sconceBlue", x: 680, y: 135, layer: "main" },
  { kind: "brokenColumn", x: 920, y: G, layer: "main" },
  { kind: "hangingColumn", x: 880, y: 0, layer: "fg" },

  // Section 2: The Sunken Gladiator Crypts
  { kind: "sconceBlue", x: 1360, y: 195, layer: "main" },
  { kind: "brokenColumn", x: 1480, y: 255, layer: "main" },
  { kind: "hangingColumn", x: 1420, y: 0, layer: "fg" },
  { kind: "brokenColumn", x: 1820, y: 255, layer: "main" },
  { kind: "sconceBlue", x: 1940, y: 195, layer: "main" },
  { kind: "hangingColumn", x: 1760, y: 0, layer: "fg" },

  // Section 3: The Hall of the Colossus
  { kind: "gladiatorStatue", x: 2950, y: G, layer: "bg" },
  { kind: "marbleColumn", x: 2600, y: G, layer: "main" },
  { kind: "sconceBlue", x: 2600, y: 135, layer: "main" },
  { kind: "brokenColumn", x: 2780, y: G, layer: "main" },
  { kind: "hangingColumn", x: 2750, y: 0, layer: "fg" },
  { kind: "brokenColumn", x: 3120, y: G, layer: "main" },
  { kind: "hangingColumn", x: 3150, y: 0, layer: "fg" },
  { kind: "marbleColumn", x: 3300, y: G, layer: "main" },
  { kind: "sconceBlue", x: 3300, y: 135, layer: "main" },

  // Section 4: The Grand Colonnade & Stepped Gallery
  { kind: "marbleColumn", x: 3960, y: G, layer: "main" },
  { kind: "sconceBlue", x: 3960, y: 135, layer: "main" },
  { kind: "hangingColumn", x: 4080, y: 0, layer: "fg" },
  { kind: "brokenColumn", x: 4180, y: G, layer: "main" },
  { kind: "marbleColumn", x: 4420, y: G, layer: "main" },
  { kind: "sconceBlue", x: 4420, y: 135, layer: "main" },
  { kind: "brokenColumn", x: 4520, y: G, layer: "main" },
  { kind: "hangingColumn", x: 4680, y: 0, layer: "fg" },

  // Section 5: The Sanctuary of Valerius (Boss Arena)
  { kind: "marbleColumn", x: 4940, y: G, layer: "main" },
  { kind: "sconceBlue", x: 4940, y: 135, layer: "main" },
  { kind: "hangingColumn", x: 5040, y: 0, layer: "fg" },
  { kind: "marbleColumn", x: 5160, y: G, layer: "main" },
  { kind: "sconceBlue", x: 5160, y: 135, layer: "main" },
  { kind: "marbleColumn", x: 5380, y: G, layer: "main" },
  { kind: "sconceBlue", x: 5380, y: 135, layer: "main" },
  { kind: "hangingColumn", x: 5480, y: 0, layer: "fg" },
];

const level2_spawns: Spawn[] = [
  // Section 1
  { kind: "armoredSkeleton", x: 480, y: G, hp: 8 },
  { kind: "bat", x: 620, y: 55, hp: 2 },
  { kind: "redSkeleton", x: 740, y: 95, hp: 6 },
  { kind: "armoredSkeleton", x: 1080, y: G, hp: 8 },

  // Section 2: Sunken Crypts & High Catwalks
  { kind: "armoredSkeleton", x: 1400, y: 255, hp: 9 },
  { kind: "redSkeleton", x: 1620, y: 75, hp: 6 },
  { kind: "armoredSkeleton", x: 1720, y: 255, hp: 9 },
  { kind: "bat", x: 1880, y: 55, hp: 2 },

  // Section 3: Hall of the Colossus
  { kind: "knight", x: 2480, y: G, hp: 8 },
  { kind: "redSkeleton", x: 2660, y: 100, hp: 6 },
  { kind: "armoredSkeleton", x: 2950, y: G, hp: 10 },
  { kind: "bat", x: 3020, y: 45, hp: 2 },
  { kind: "redSkeleton", x: 3220, y: 100, hp: 6 },
  { kind: "knight", x: 3500, y: G, hp: 8 },

  // Section 4: Stepped Gallery
  { kind: "vampire", x: 3950, y: 140, hp: 8 },
  { kind: "armoredSkeleton", x: 4120, y: G, hp: 9 },
  { kind: "bat", x: 4320, y: 55, hp: 2 },
  { kind: "redSkeleton", x: 4340, y: 85, hp: 6 },
  { kind: "armoredSkeleton", x: 4580, y: G, hp: 9 },

  // Section 5: Valerius Duel
  { kind: "bossValerius", x: 5240, y: G, hp: 32, boss: true, name: "Valerius, Cavaleiro de Sangue" },
];

const level2_items: ItemSpawn[] = [
  { id: 201, kind: "heal", x: 760, y: 65 },
  { id: 202, kind: "life", x: 1640, y: 220 }, // Extra life hidden in sunken crypt!
  { id: 203, kind: "heal", x: 1820, y: 135 },
  { id: 204, kind: "mana", x: 2920, y: 35 },
  { id: 205, kind: "heal", x: 2760, y: 85 },
  { id: 206, kind: "life", x: 4340, y: 55 }, // Extra life on high promenade
  { id: 207, kind: "heal", x: 4900, y: G - 28 },
  { id: 208, kind: "mana", x: 5060, y: 95 },
];

// =========================================================================
// LEVEL 3: A CAPELA SAGRADA (5500px - Cathedral Nave, Bell Tower & High Altar)
// =========================================================================
const level3_solids: Solid[] = [
  // Section 1: The Narthex & Cloister of Pews (x = 0 to 1200)
  { x: 0, y: G, w: 1200, h: DEEP },
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  platform(396, 145, 180),
  platform(640, 105, 180),
  platform(880, 145, 160),

  // Section 2: Confessional Sunken Crypt (x = 1200 to 2200)
  { x: 1200, y: 220, w: 30, h: DEEP },
  { x: 1230, y: 250, w: 700, h: DEEP }, // Sunken Confessional Crypt Floor
  { x: 1930, y: 220, w: 30, h: DEEP },
  platform(1380, 180, 80),
  platform(1660, 180, 80),
  // High cathedral catwalks spanning the crypt
  platform(1320, 115, 180),
  platform(1560, 75, 180),
  platform(1800, 115, 180),

  // Section 3: The Grand Nave of the Stained Glass (x = 2200 to 3600)
  { x: 1960, y: G, w: 1640, h: DEEP },
  platform(2360, 145, 160),
  platform(2600, 105, 170),
  platform(2880, 70, 180), // High perch facing colossal stained glass
  platform(3160, 105, 170),
  platform(3420, 145, 160),

  // Section 4: The Bell Tower & Angelic Galleries (x = 3600 to 4650)
  { x: 3600, y: G, w: 1050, h: DEEP },
  { x: 3680, y: 185, w: 32, h: 15 },
  { x: 3712, y: 170, w: 32, h: 30 },
  platform(3744, 150, 160),
  platform(3980, 110, 160),
  platform(4220, 75, 170), // Bell tower high terrace
  platform(4460, 120, 150),

  // Section 5: Seraphine's High Altar (x = 4650 to 5500)
  { x: 4650, y: G, w: 850, h: DEEP },
  // Stepped marble dais of the High Altar
  { x: 4940, y: 185, w: 32, h: 15 },
  { x: 4972, y: 170, w: 32, h: 30 },
  { x: 5004, y: 155, w: 400, h: 45 }, // Elevated Altar Dais!
  platform(4820, 130, 140),
  platform(5280, 115, 140),
];

const level3_props: Prop[] = [
  // Section 1: Narthex
  { kind: "pew", x: 220, y: G, layer: "main" },
  { kind: "candelabra", x: 340, y: G, layer: "main" },
  { kind: "pewRight", x: 520, y: G, layer: "main" },
  { kind: "angel", x: 780, y: G, layer: "main" },
  { kind: "candelabra", x: 980, y: G, layer: "main" },

  // Section 2: Sunken Confessional Crypt
  { kind: "pew", x: 1350, y: 250, layer: "main" },
  { kind: "angel", x: 1580, y: 250, layer: "main" },
  { kind: "pewRight", x: 1780, y: 250, layer: "main" },
  { kind: "candelabra", x: 1440, y: 115, layer: "main" },
  { kind: "candelabra", x: 1900, y: 115, layer: "main" },

  // Section 3: The Grand Nave with Colossal Stained Glass Windows in background arches
  { kind: "stainedGlass", x: 2600, y: G, layer: "bg" }, // Stained glass lancet window!
  { kind: "angelTall", x: 2900, y: G, layer: "bg" }, // Tall weeping angel statue in wall niche!
  { kind: "stainedGlass", x: 3200, y: G, layer: "bg" },
  { kind: "candelabra", x: 2420, y: G, layer: "main" },
  { kind: "pew", x: 2750, y: G, layer: "main" },
  { kind: "pewRight", x: 3050, y: G, layer: "main" },
  { kind: "candelabra", x: 3380, y: G, layer: "main" },

  // Section 4: Angelic Galleries
  { kind: "angel", x: 3820, y: G, layer: "main" },
  { kind: "candelabra", x: 4050, y: G, layer: "main" },
  { kind: "stainedGlass", x: 4250, y: G, layer: "bg" },
  { kind: "candelabra", x: 4500, y: G, layer: "main" },

  // Section 5: Seraphine High Altar
  { kind: "candelabra", x: 4900, y: G, layer: "main" },
  { kind: "altar", x: 5120, y: 155, layer: "main" }, // High Altar on elevated dais!
  { kind: "candelabra", x: 5260, y: 155, layer: "main" },
  { kind: "angelTall", x: 5380, y: G, layer: "bg" },
];

const level3_spawns: Spawn[] = [
  { kind: "zombie", x: 320, y: G, hp: 5 },
  { kind: "bat", x: 520, y: 75, hp: 2 },
  { kind: "skeleton", x: 620, y: 110, hp: 5 },
  { kind: "vampire", x: 960, y: G, hp: 7 },
  { kind: "bat", x: 1720, y: 65, hp: 2 },
  { kind: "skeleton", x: 1800, y: 105, hp: 6 },
  { kind: "knight", x: 2160, y: G, hp: 8 },
  { kind: "vampire", x: 2900, y: G, hp: 7 },
  { kind: "bat", x: 3220, y: 65, hp: 2 },
  { kind: "skeleton", x: 3260, y: 75, hp: 6 },
  { kind: "knight", x: 3600, y: G, hp: 8 },
  { kind: "vampire", x: 4320, y: G, hp: 8 },
  { kind: "skeleton", x: 4700, y: 110, hp: 6 },
  { kind: "bossSeraphine", x: 5220, y: G - 20, hp: 30, boss: true, name: "Seraphine, Sacerdotisa de Sangue" },
];

const level3_items: ItemSpawn[] = [
  { id: 301, kind: "heal", x: 260, y: G - 28 },
  { id: 302, kind: "mana", x: 860, y: 47 },
  { id: 303, kind: "life", x: 2040, y: 42 },
  { id: 304, kind: "heal", x: 3260, y: 47 },
  { id: 305, kind: "mana", x: 4480, y: 42 },
  { id: 306, kind: "life", x: 5380, y: 107 },
];

// =========================================================================
// LEVEL 4: AS CATACUMBAS (5800px - Torture Cells & Nocturne Abyssal Cavern)
// =========================================================================
const level4_solids: Solid[] = [
  // Section 1: Dungeon Cell Block (x = 0 to 1200)
  { x: 0, y: G, w: 1200, h: DEEP },
  { x: 320, y: 185, w: 32, h: 15 },
  { x: 352, y: 170, w: 32, h: 30 },
  platform(384, 145, 180),
  platform(640, 105, 180),
  platform(900, 145, 160),

  // Section 2: Sunken Sarcophagus Chasm (x = 1200 to 2250)
  { x: 1200, y: 220, w: 30, h: DEEP },
  { x: 1230, y: 255, w: 750, h: DEEP }, // Sunken Crypt Pit Floor (y = 255)
  { x: 1980, y: 220, w: 30, h: DEEP },
  // Sarcophagus stepping stones
  platform(1400, 180, 80),
  platform(1720, 180, 80),
  // Catwalks over the sunken chasm
  platform(1320, 115, 180),
  platform(1580, 75, 180),
  platform(1840, 115, 180),

  // Section 3: The Abyssal Ossuário (x = 2250 to 3650)
  { x: 2010, y: G, w: 1640, h: DEEP },
  platform(2380, 145, 160),
  platform(2640, 105, 170),
  platform(2920, 70, 180),
  platform(3200, 105, 170),
  platform(3460, 145, 160),

  // Section 4: The Chains Labyrinth (x = 3650 to 4750)
  { x: 3650, y: G, w: 1100, h: DEEP },
  { x: 3740, y: 185, w: 32, h: 15 },
  { x: 3772, y: 170, w: 32, h: 30 },
  platform(3804, 150, 160),
  platform(4050, 110, 160),
  platform(4300, 75, 170),
  platform(4550, 115, 160),

  // Section 5: Nocturne Abyssal Cavern (x = 4750 to 5800)
  { x: 4750, y: G, w: 1050, h: DEEP },
  platform(5040, 135, 180),
  platform(5320, 100, 180),
  platform(5560, 135, 180),
];

const level4_props: Prop[] = [
  // Section 1: Dungeon Cells & Chains
  { kind: "cell", x: 260, y: G, layer: "bg" }, // Recessed dungeon cell in background wall!
  { kind: "chains", x: 450, y: 0, layer: "fg" }, // Heavy hanging iron chains in foreground!
  { kind: "coffin", x: 620, y: G, layer: "main" },
  { kind: "cell", x: 920, y: G, layer: "bg" },
  { kind: "chains", x: 1080, y: 0, layer: "fg" },

  // Section 2: Sunken Sarcophagus Chasm
  { kind: "coffin", x: 1350, y: 255, layer: "main" },
  { kind: "tomb", x: 1600, y: 255, layer: "main" },
  { kind: "coffin", x: 1850, y: 255, layer: "main" },
  { kind: "chains", x: 1480, y: 0, layer: "fg" },
  { kind: "chains", x: 1750, y: 0, layer: "fg" },

  // Section 3: The Abyssal Ossuário
  { kind: "cell", x: 2450, y: G, layer: "bg" },
  { kind: "tomb", x: 2750, y: G, layer: "main" },
  { kind: "chains", x: 2950, y: 0, layer: "fg" },
  { kind: "coffin", x: 3150, y: G, layer: "main" },
  { kind: "cell", x: 3450, y: G, layer: "bg" },

  // Section 4: The Chains Labyrinth
  { kind: "chains", x: 3880, y: 0, layer: "fg" },
  { kind: "tomb", x: 4120, y: G, layer: "main" },
  { kind: "chains", x: 4350, y: 0, layer: "fg" },
  { kind: "coffin", x: 4600, y: G, layer: "main" },

  // Section 5: Nocturne Cavern
  { kind: "cell", x: 4950, y: G, layer: "bg" },
  { kind: "chains", x: 5200, y: 0, layer: "fg" },
  { kind: "tomb", x: 5450, y: G, layer: "main" },
  { kind: "chains", x: 5650, y: 0, layer: "fg" },
];

const level4_spawns: Spawn[] = [
  { kind: "zombie", x: 320, y: G, hp: 5 },
  { kind: "bat", x: 540, y: 75, hp: 2 },
  { kind: "skeleton", x: 640, y: 110, hp: 6 },
  { kind: "knight", x: 1040, y: G, hp: 8 },
  { kind: "bat", x: 1740, y: 65, hp: 2 },
  { kind: "skeleton", x: 1840, y: 105, hp: 6 },
  { kind: "zombie", x: 2240, y: G, hp: 5 },
  { kind: "bat", x: 2980, y: 65, hp: 2 },
  { kind: "skeleton", x: 3320, y: 75, hp: 6 },
  { kind: "knight", x: 3660, y: G, hp: 8 },
  { kind: "vampire", x: 4420, y: G, hp: 8 },
  { kind: "skeleton", x: 4820, y: 110, hp: 6 },
  { kind: "bossNocturne", x: 5400, y: 80, hp: 32, boss: true, name: "Nocturne, Lorde Morcego Feral" },
];

const level4_items: ItemSpawn[] = [
  { id: 401, kind: "heal", x: 240, y: G - 28 },
  { id: 402, kind: "mana", x: 880, y: 47 },
  { id: 403, kind: "life", x: 2080, y: 42 },
  { id: 404, kind: "heal", x: 3320, y: 47 },
  { id: 405, kind: "mana", x: 4580, y: 42 },
  { id: 406, kind: "life", x: 5560, y: 107 },
];

// =========================================================================
// LEVEL 5: A GRANDE BIBLIOTECA (5600px - Scriptorium & Lorde Veyne Sanctum)
// =========================================================================
const level5_solids: Solid[] = [
  // Section 1: Grand Scriptorium Entrance (x = 0 to 1200)
  { x: 0, y: G, w: 1200, h: DEEP },
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  platform(396, 145, 180),
  platform(640, 105, 180),
  platform(880, 145, 160),

  // Section 2: Sunken Reading Hall (x = 1200 to 2200)
  { x: 1200, y: 220, w: 30, h: DEEP },
  { x: 1230, y: 250, w: 700, h: DEEP }, // Sunken Reading Pit Floor (y = 250)
  { x: 1930, y: 220, w: 30, h: DEEP },
  platform(1380, 180, 80),
  platform(1660, 180, 80),
  // High library walkways spanning across the reading pit
  platform(1320, 115, 180),
  platform(1560, 75, 180),
  platform(1800, 115, 180),

  // Section 3: Tower of the Forbidden Grimoires (x = 2200 to 3650)
  { x: 1960, y: G, w: 1690, h: DEEP },
  platform(2360, 145, 160),
  platform(2600, 105, 170),
  platform(2880, 70, 180), // Bookcase top promenade
  platform(3160, 105, 170),
  platform(3420, 145, 160),

  // Section 4: Astronomical Rotunda (x = 3650 to 4700)
  { x: 3650, y: G, w: 1050, h: DEEP },
  { x: 3720, y: 185, w: 32, h: 15 },
  { x: 3752, y: 170, w: 32, h: 30 },
  platform(3784, 150, 160),
  platform(4020, 110, 160),
  platform(4260, 75, 170),
  platform(4500, 120, 150),

  // Section 5: Lorde Veyne's Scriptorium Sanctum (x = 4700 to 5600)
  { x: 4700, y: G, w: 900, h: DEEP },
  platform(4950, 135, 180),
  platform(5250, 105, 180),
  platform(5450, 135, 150),
];

const level5_props: Prop[] = [
  // Section 1: Scriptorium Entrance
  { kind: "bookshelf", x: 200, y: G, layer: "bg" },
  { kind: "desk", x: 380, y: G, layer: "main" },
  { kind: "books", x: 460, y: G, layer: "main" },
  { kind: "ladder", x: 620, y: G, layer: "main" },
  { kind: "globe", x: 800, y: G, layer: "main" },
  { kind: "bookshelf", x: 980, y: G, layer: "bg" },

  // Section 2: Sunken Reading Hall
  { kind: "desk", x: 1350, y: 250, layer: "main" },
  { kind: "books", x: 1440, y: 250, layer: "main" },
  { kind: "bookshelf", x: 1600, y: 250, layer: "bg" },
  { kind: "globe", x: 1800, y: 250, layer: "main" },
  { kind: "ladder", x: 1420, y: 115, layer: "main" },
  { kind: "ladder", x: 1900, y: 115, layer: "main" },

  // Section 3: Tower of the Forbidden Grimoires
  { kind: "bookshelf", x: 2400, y: G, layer: "bg" },
  { kind: "ladder", x: 2650, y: G, layer: "main" },
  { kind: "desk", x: 2850, y: G, layer: "main" },
  { kind: "bookshelf", x: 3100, y: G, layer: "bg" },
  { kind: "globe", x: 3350, y: G, layer: "main" },

  // Section 4: Astronomical Rotunda
  { kind: "bookshelf", x: 3800, y: G, layer: "bg" },
  { kind: "globe", x: 4050, y: G, layer: "main" },
  { kind: "desk", x: 4250, y: G, layer: "main" },
  { kind: "ladder", x: 4450, y: G, layer: "main" },

  // Section 5: Lorde Veyne's Sanctum
  { kind: "bookshelf", x: 4850, y: G, layer: "bg" },
  { kind: "desk", x: 5080, y: G, layer: "main" },
  { kind: "bookshelf", x: 5350, y: G, layer: "bg" },
  { kind: "books", x: 5450, y: G, layer: "main" },
];

const level5_spawns: Spawn[] = [
  { kind: "knight", x: 320, y: G, hp: 8 },
  { kind: "bat", x: 520, y: 75, hp: 2 },
  { kind: "skeleton", x: 640, y: 110, hp: 6 },
  { kind: "vampire", x: 980, y: G, hp: 8 },
  { kind: "skeleton", x: 1820, y: 105, hp: 6 },
  { kind: "knight", x: 2120, y: G, hp: 8 },
  { kind: "bat", x: 2400, y: 65, hp: 2 },
  { kind: "vampire", x: 2900, y: G, hp: 8 },
  { kind: "skeleton", x: 3280, y: 75, hp: 6 },
  { kind: "knight", x: 3600, y: G, hp: 9 },
  { kind: "bat", x: 4240, y: 65, hp: 2 },
  { kind: "vampire", x: 4560, y: G, hp: 8 },
  { kind: "skeleton", x: 4720, y: 110, hp: 6 },
  { kind: "bossVeyne", x: 5240, y: G - 20, hp: 32, boss: true, name: "Lorde Veyne, Arquivista das Sombras" },
];

const level5_items: ItemSpawn[] = [
  { id: 501, kind: "mana", x: 260, y: G - 28 },
  { id: 502, kind: "heal", x: 880, y: 47 },
  { id: 503, kind: "life", x: 2060, y: 42 },
  { id: 504, kind: "mana", x: 3280, y: 47 },
  { id: 505, kind: "heal", x: 4500, y: 42 },
  { id: 506, kind: "life", x: 5420, y: 107 },
];

// =========================================================================
// LEVEL 6: O LABORATÓRIO DE ALQUIMIA (5700px - Vats, Catwalks & Calx Arena)
// =========================================================================
const level6_solids: Solid[] = [
  // Section 1: Distillers & Reagent Entrance (x = 0 to 1200)
  { x: 0, y: G, w: 1200, h: DEEP },
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  platform(396, 145, 180),
  platform(640, 105, 180),
  platform(880, 145, 160),

  // Section 2: Sunken Chemical Decantation Vats (x = 1200 to 2200)
  { x: 1200, y: 220, w: 30, h: DEEP },
  { x: 1230, y: 250, w: 700, h: DEEP }, // Sunken Decantation Pit Floor (y = 250)
  { x: 1930, y: 220, w: 30, h: DEEP },
  platform(1380, 180, 80),
  platform(1660, 180, 80),
  // High metal pipe catwalks spanning across the bubbling vats
  platform(1320, 115, 180),
  platform(1560, 75, 180),
  platform(1800, 115, 180),

  // Section 3: The Great Transmutation Retort (x = 2200 to 3650)
  { x: 1960, y: G, w: 1690, h: DEEP },
  platform(2360, 145, 160),
  platform(2600, 105, 170),
  platform(2880, 70, 180), // Pipe high bridge
  platform(3160, 105, 170),
  platform(3420, 145, 160),

  // Section 4: Energised Crystal Gallery (x = 3650 to 4700)
  { x: 3650, y: G, w: 1050, h: DEEP },
  { x: 3720, y: 185, w: 32, h: 15 },
  { x: 3752, y: 170, w: 32, h: 30 },
  platform(3784, 150, 160),
  platform(4020, 110, 160),
  platform(4260, 75, 170),
  platform(4500, 120, 150),

  // Section 5: Calx Mutation Chamber (x = 4700 to 5700)
  { x: 4700, y: G, w: 1000, h: DEEP },
  platform(5000, 135, 180),
  platform(5300, 105, 180),
  platform(5520, 135, 160),
];

const level6_props: Prop[] = [
  // Section 1: Reagent Entrance
  { kind: "potions", x: 220, y: G, layer: "main" },
  { kind: "cauldronGreen", x: 420, y: G, layer: "main" },
  { kind: "crystals", x: 620, y: G, layer: "main" },
  { kind: "alchemyTable", x: 800, y: G, layer: "main" },
  { kind: "potions", x: 1020, y: G, layer: "main" },

  // Section 2: Sunken Chemical Vats Pit
  { kind: "cauldronPurple", x: 1350, y: 250, layer: "main" },
  { kind: "potions", x: 1500, y: 250, layer: "main" },
  { kind: "cauldronGreen", x: 1650, y: 250, layer: "main" },
  { kind: "crystals", x: 1800, y: 250, layer: "main" },
  { kind: "crystals", x: 1560, y: 75, layer: "main" },

  // Section 3: Great Transmutation Retort
  { kind: "alchemyTable", x: 2350, y: G, layer: "main" },
  { kind: "potions", x: 2550, y: G, layer: "main" },
  { kind: "cauldronPurple", x: 2800, y: G, layer: "main" },
  { kind: "crystals", x: 3050, y: G, layer: "main" },
  { kind: "cauldronGreen", x: 3350, y: G, layer: "main" },

  // Section 4: Energised Crystal Gallery
  { kind: "crystals", x: 3800, y: G, layer: "main" },
  { kind: "potions", x: 4050, y: G, layer: "main" },
  { kind: "cauldronPurple", x: 4280, y: G, layer: "main" },
  { kind: "crystals", x: 4500, y: G, layer: "main" },

  // Section 5: Calx Mutation Chamber
  { kind: "cauldronGreen", x: 4850, y: G, layer: "main" },
  { kind: "crystals", x: 5100, y: G, layer: "main" },
  { kind: "cauldronPurple", x: 5350, y: G, layer: "main" },
  { kind: "potions", x: 5550, y: G, layer: "main" },
];

const level6_spawns: Spawn[] = [
  { kind: "zombie", x: 320, y: G, hp: 5 },
  { kind: "bat", x: 520, y: 75, hp: 2 },
  { kind: "skeleton", x: 640, y: 110, hp: 6 },
  { kind: "knight", x: 1020, y: G, hp: 8 },
  { kind: "armoredSkeleton", x: 1500, y: 250, hp: 9 }, // Guarding extra life in sunken chemical pit!
  { kind: "redSkeleton", x: 1560, y: 75, hp: 6 },
  { kind: "knight", x: 2120, y: G, hp: 9 },
  { kind: "bat", x: 2400, y: 65, hp: 2 },
  { kind: "vampire", x: 2900, y: G, hp: 8 },
  { kind: "skeleton", x: 3280, y: 75, hp: 6 },
  { kind: "knight", x: 3600, y: G, hp: 9 },
  { kind: "bat", x: 4240, y: 65, hp: 2 },
  { kind: "vampire", x: 4560, y: G, hp: 9 },
  { kind: "skeleton", x: 4720, y: 110, hp: 6 },
  { kind: "bossCalx", x: 5320, y: G, hp: 34, boss: true, name: "Calx, Abominação Alquímica" },
];

const level6_items: ItemSpawn[] = [
  { id: 601, kind: "heal", x: 260, y: G - 28 },
  { id: 602, kind: "mana", x: 880, y: 47 },
  { id: 603, kind: "life", x: 1650, y: 215 }, // Extra life inside sunken chemical pit!
  { id: 604, kind: "heal", x: 3280, y: 47 },
  { id: 605, kind: "mana", x: 4500, y: 42 },
  { id: 606, kind: "life", x: 5480, y: 107 },
];

// =========================================================================
// LEVEL 7: A SALA DO TRONO (5200px - Grand Staircase & Dracula's Throne)
// =========================================================================
const level7_solids: Solid[] = [
  // Section 1: Keep Ramparts & Guard of Honor (x = 0 to 1200)
  { x: 0, y: G, w: 1200, h: DEEP },
  { x: 300, y: 185, w: 32, h: 15 },
  { x: 332, y: 170, w: 32, h: 30 },
  { x: 364, y: 155, w: 32, h: 45 },
  platform(396, 145, 180),
  platform(640, 105, 180),
  platform(880, 145, 160),

  // Section 2: Imperial Sunken Mezzanine (x = 1200 to 2200)
  { x: 1200, y: 220, w: 30, h: DEEP },
  { x: 1230, y: 250, w: 700, h: DEEP }, // Sunken Honor Walkway (y = 250)
  { x: 1930, y: 220, w: 30, h: DEEP },
  platform(1380, 180, 80),
  platform(1660, 180, 80),
  // Elevated gold-trimmed marble balconies
  platform(1320, 115, 180),
  platform(1560, 75, 180),
  platform(1800, 115, 180),

  // Section 3: Red Carpet Grand Approach (x = 2200 to 3500)
  { x: 1960, y: G, w: 1540, h: DEEP },
  platform(2360, 145, 160),
  platform(2600, 105, 170),
  platform(2880, 70, 180),
  platform(3160, 105, 170),
  platform(3400, 145, 150),

  // Section 4: Cerimonial Ascending Staircase (x = 3500 to 4450)
  { x: 3500, y: G, w: 950, h: DEEP },
  { x: 3620, y: 185, w: 32, h: 15 },
  { x: 3652, y: 170, w: 32, h: 30 },
  platform(3684, 150, 160),
  platform(3920, 110, 160),
  platform(4160, 75, 170),
  platform(4380, 120, 150),

  // Section 5: Dracula Throne Dais (x = 4450 to 5200)
  { x: 4450, y: G, w: 750, h: DEEP },
  // The Monumental 4-Step Imperial Dais rising to the Throne
  { x: 4620, y: 185, w: 32, h: 15 },
  { x: 4652, y: 170, w: 32, h: 30 },
  { x: 4684, y: 155, w: 32, h: 45 },
  { x: 4716, y: 140, w: 380, h: 60 }, // Elevated Imperial Dais (y = 140)
  platform(4520, 125, 150),
  platform(5020, 110, 150),
];

const level7_props: Prop[] = [
  // Section 1: Guard of Honor
  { kind: "marbleColumn", x: 220, y: G, layer: "main" },
  { kind: "banner", x: 400, y: G, layer: "main" },
  { kind: "candelabra", x: 580, y: G, layer: "main" },
  { kind: "marbleColumn", x: 800, y: G, layer: "main" },
  { kind: "banner", x: 1020, y: G, layer: "main" },

  // Section 2: Sunken Mezzanine
  { kind: "banner", x: 1350, y: 250, layer: "main" },
  { kind: "candelabra", x: 1550, y: 250, layer: "main" },
  { kind: "banner", x: 1750, y: 250, layer: "main" },
  { kind: "candelabra", x: 1560, y: 75, layer: "main" },

  // Section 3: Red Carpet Grand Approach
  { kind: "marbleColumn", x: 2350, y: G, layer: "main" },
  { kind: "banner", x: 2600, y: G, layer: "main" },
  { kind: "candelabra", x: 2850, y: G, layer: "main" },
  { kind: "marbleColumn", x: 3100, y: G, layer: "main" },
  { kind: "banner", x: 3350, y: G, layer: "main" },

  // Section 4: Cerimonial Staircase
  { kind: "banner", x: 3750, y: G, layer: "main" },
  { kind: "candelabra", x: 4000, y: G, layer: "main" },
  { kind: "marbleColumn", x: 4250, y: G, layer: "main" },

  // Section 5: The Throne Dais
  { kind: "stainedGlass", x: 4850, y: G, layer: "bg" }, // Blood Moon Lancet Stained Glass behind the throne!
  { kind: "banner", x: 4680, y: 140, layer: "main" },
  { kind: "candelabra", x: 4760, y: 140, layer: "main" },
  { kind: "throne", x: 4860, y: 140, layer: "main" }, // DRACULA'S ROYAL VELVET THRONE!
  { kind: "candelabra", x: 4960, y: 140, layer: "main" },
  { kind: "banner", x: 5040, y: 140, layer: "main" },
];

const level7_spawns: Spawn[] = [
  { kind: "knight", x: 340, y: G, hp: 8 },
  { kind: "bat", x: 540, y: 75, hp: 2 },
  { kind: "vampire", x: 680, y: G, hp: 8 },
  { kind: "skeleton", x: 880, y: 75, hp: 6 },
  { kind: "knight", x: 1180, y: G, hp: 9 },
  { kind: "vampire", x: 1820, y: G, hp: 8 },
  { kind: "knight", x: 2180, y: G, hp: 9 },
  { kind: "bat", x: 2420, y: 65, hp: 2 },
  { kind: "vampire", x: 3000, y: G, hp: 9 },
  { kind: "skeleton", x: 3280, y: 75, hp: 6 },
  { kind: "knight", x: 3660, y: G, hp: 10 },
  { kind: "vampire", x: 4260, y: G, hp: 9 },
  { kind: "bossDracula", x: 4780, y: G, hp: 55, boss: true, name: "Conde Drácula, Senhor das Trevas" },
];

const level7_items: ItemSpawn[] = [
  { id: 701, kind: "heal", x: 260, y: G - 28 },
  { id: 702, kind: "mana", x: 880, y: 47 },
  { id: 703, kind: "life", x: 2060, y: 42 },
  { id: 704, kind: "heal", x: 3280, y: 47 },
  { id: 705, kind: "mana", x: 4500, y: 42 },
  { id: 706, kind: "life", x: 4940, y: 97 },
];

function stage(
  id: number,
  title: string,
  place: string,
  width: number,
  solids: Solid[],
  props: Prop[],
  spawns: Spawn[],
  items: ItemSpawn[],
  door: { x: number; y: number },
  theme: LevelDef["theme"],
  customBg?: string,
): LevelDef {
  return {
    id,
    title,
    place,
    bg: customBg || `/art/stage-${id}.jpg`,
    mid: `/art/parallax/mid-${id}.jpg`,
    width,
    solids,
    pits: [],
    props,
    spawns,
    items,
    door,
    theme,
  };
}

export const levels: LevelDef[] = [
  stage(1, "Os Portões", "Pátio dos Portões & Muralhas", 5400, level1_solids, level1_props, level1_spawns, level1_items, { x: 5260, y: G - 64 }, "gates"),
  stage(2, "Galeria de Mármore", "Coliseu Imperial & Galeria de Mármore", 5600, level2_solids, level2_props, level2_spawns, level2_items, { x: 5460, y: G - 64 }, "gallery", "/art/parallax/colosseum-bg.jpg"),
  stage(3, "Capela", "Claustro dos Vitrais & Altar Sagrado", 5500, level3_solids, level3_props, level3_spawns, level3_items, { x: 5360, y: G - 64 }, "chapel"),
  stage(4, "Catacumbas", "Masmorras Subterrâneas & Criptas", 5800, level4_solids, level4_props, level4_spawns, level4_items, { x: 5640, y: G - 64 }, "catacombs"),
  stage(5, "Biblioteca", "Torre dos Tomos & Arquivos Proibidos", 5600, level5_solids, level5_props, level5_spawns, level5_items, { x: 5460, y: G - 64 }, "library"),
  stage(6, "Alquimia", "Câmara das Transmutações & Caldeirões", 5700, level6_solids, level6_props, level6_spawns, level6_items, { x: 5560, y: G - 64 }, "alchemy"),
  stage(7, "Sala do Trono", "O Santuário do Último Mestre", 5200, level7_solids, level7_props, level7_spawns, level7_items, { x: 5060, y: G - 64 }, "throne"),
];
