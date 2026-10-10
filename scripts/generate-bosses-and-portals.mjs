import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "public/sprites";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  const generatedSprites = await page.evaluate(() => {
    // Helper to generate a 256x256 canvas with 4 frames (2x2 grid, each 128x128)
    function createSheet(drawFrameFn) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;

      // 4 frames: (0,0), (1,0), (0,1), (1,1)
      const positions = [
        { col: 0, row: 0, frame: 0 },
        { col: 1, row: 0, frame: 1 },
        { col: 0, row: 1, frame: 2 },
        { col: 1, row: 1, frame: 3 },
      ];

      for (const pos of positions) {
        ctx.save();
        ctx.translate(pos.col * 128, pos.row * 128);
        drawFrameFn(ctx, pos.frame, 128, 128);
        ctx.restore();
      }

      return c.toDataURL("image/png");
    }

    // =========================================================================
    // 1. BOSS 1: Petros, Gárgula Colossal de Pedra (boss-petros.png)
    // =========================================================================
    const bossPetros = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126; // feet firmly on ground

      // Wings behind
      g.fillStyle = "#2c2a30";
      g.strokeStyle = "#1b1920";
      g.lineWidth = 2;
      g.beginPath();
      if (f === 1 || f === 3) {
        // Wings wide open
        g.moveTo(cx - 52, ground - 95);
        g.lineTo(cx - 30, ground - 60);
        g.lineTo(cx - 45, ground - 35);
        g.lineTo(cx - 15, ground - 50);
        g.lineTo(cx, ground - 65);
        g.lineTo(cx + 15, ground - 50);
        g.lineTo(cx + 45, ground - 35);
        g.lineTo(cx + 30, ground - 60);
        g.lineTo(cx + 52, ground - 95);
        g.closePath();
      } else {
        // Wings folded
        g.moveTo(cx - 34, ground - 75);
        g.lineTo(cx - 20, ground - 45);
        g.lineTo(cx - 28, ground - 25);
        g.lineTo(cx, ground - 55);
        g.lineTo(cx + 28, ground - 25);
        g.lineTo(cx + 20, ground - 45);
        g.lineTo(cx + 34, ground - 75);
        g.closePath();
      }
      g.fill();
      g.stroke();

      // Gargoyle stone body
      const bodyColor = f === 2 ? "#5a545e" : "#46414a";
      const stoneShade = "#2d2a30";
      const stoneHighlight = "#78727e";

      // Tail
      g.strokeStyle = "#38343c";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(cx + 10, ground - 25);
      g.quadraticCurveTo(cx + 40, ground - 15 + Math.sin(f * 2) * 8, cx + 32, ground - 5);
      g.stroke();

      // Legs / Talons (firmly on ground: y = 126)
      g.fillStyle = stoneShade;
      // Left leg
      g.fillRect(cx - 24, ground - 30, 14, 24);
      g.fillStyle = "#e2a23a"; // Golden rune claws
      g.fillRect(cx - 26, ground - 6, 18, 6);
      g.fillStyle = "#111";
      g.fillRect(cx - 27, ground - 2, 4, 2);
      g.fillRect(cx - 20, ground - 2, 4, 2);
      g.fillRect(cx - 13, ground - 2, 4, 2);

      // Right leg
      g.fillStyle = stoneShade;
      g.fillRect(cx + 10, ground - 30, 14, 24);
      g.fillStyle = "#e2a23a";
      g.fillRect(cx + 8, ground - 6, 18, 6);
      g.fillStyle = "#111";
      g.fillRect(cx + 7, ground - 2, 4, 2);
      g.fillRect(cx + 14, ground - 2, 4, 2);
      g.fillRect(cx + 21, ground - 2, 4, 2);

      // Torso
      g.fillStyle = bodyColor;
      g.beginPath();
      g.moveTo(cx - 20, ground - 28);
      g.lineTo(cx + 20, ground - 28);
      g.lineTo(cx + 26, ground - 68);
      g.lineTo(cx - 26, ground - 68);
      g.closePath();
      g.fill();

      // Chest stone runes (glowing red)
      g.fillStyle = "#ff3344";
      g.beginPath();
      g.arc(cx, ground - 50, 4, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#ff3344";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - 12, ground - 58);
      g.lineTo(cx, ground - 50);
      g.lineTo(cx + 12, ground - 58);
      g.moveTo(cx, ground - 50);
      g.lineTo(cx, ground - 38);
      g.stroke();

      // Arms & Claws
      g.fillStyle = bodyColor;
      if (f === 2) {
        // Smash down!
        g.fillRect(cx - 36, ground - 45, 14, 40);
        g.fillRect(cx + 22, ground - 45, 14, 40);
        // Ground shockwave
        g.fillStyle = "#ff2233";
        g.fillRect(cx - 45, ground - 4, 90, 4);
      } else {
        // Claws ready
        g.fillRect(cx - 34, ground - 64, 12, 32);
        g.fillRect(cx + 22, ground - 64, 12, 32);
        g.fillStyle = stoneHighlight;
        g.fillRect(cx - 36, ground - 34, 16, 8);
        g.fillRect(cx + 20, ground - 34, 16, 8);
      }

      // Head with Horns
      g.fillStyle = bodyColor;
      g.fillRect(cx - 18, ground - 88, 36, 24);
      // Horns
      g.fillStyle = "#1e1b22";
      g.beginPath();
      g.moveTo(cx - 16, ground - 88);
      g.lineTo(cx - 30, ground - 110);
      g.lineTo(cx - 10, ground - 90);
      g.moveTo(cx + 16, ground - 88);
      g.lineTo(cx + 30, ground - 110);
      g.lineTo(cx + 10, ground - 90);
      g.fill();

      // Snout / Jaws
      g.fillStyle = stoneShade;
      g.fillRect(cx - 12, ground - 74, 24, 12);
      // Glowing ruby eyes
      g.fillStyle = "#ff1744";
      g.shadowColor = "#ff1744";
      g.shadowBlur = 6;
      g.fillRect(cx - 10, ground - 82, 6, 4);
      g.fillRect(cx + 4, ground - 82, 6, 4);
      g.shadowBlur = 0;

      // Fangs
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 8, ground - 66, 3, 4);
      g.fillRect(cx + 5, ground - 66, 3, 4);
    });

    // =========================================================================
    // 2. BOSS 2: Valerius, o Cavaleiro Sombrio Vampírico (boss-valerius.png)
    // =========================================================================
    const bossValerius = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Crimson velvet cape billowing behind
      g.fillStyle = "#7a0c1e";
      g.beginPath();
      g.moveTo(cx - 18, ground - 78);
      g.quadraticCurveTo(cx - 35 - (f === 3 ? 15 : 0), ground - 40, cx - 38, ground - 8);
      g.lineTo(cx + 18, ground - 8);
      g.quadraticCurveTo(cx + 25, ground - 40, cx + 18, ground - 78);
      g.fill();
      g.fillStyle = "#9e152d"; // Velvet inner
      g.fillRect(cx - 16, ground - 72, 32, 60);

      // Heavy Gothic Plate Armor
      const armorDark = "#1c1b24";
      const armorMid = "#2e2c3b";
      const armorLight = "#49465e";
      const goldTrim = "#c99e32";

      // Greaves / Sabatons (Feet firmly on ground)
      g.fillStyle = armorDark;
      g.fillRect(cx - 16, ground - 36, 12, 32);
      g.fillRect(cx + 4, ground - 36, 12, 32);
      g.fillStyle = goldTrim;
      g.fillRect(cx - 18, ground - 8, 16, 8);
      g.fillRect(cx + 2, ground - 8, 16, 8);
      g.fillStyle = armorLight;
      g.fillRect(cx - 17, ground - 6, 14, 3);
      g.fillRect(cx + 3, ground - 6, 14, 3);

      // Cuirass (Torso)
      g.fillStyle = armorMid;
      g.fillRect(cx - 18, ground - 72, 36, 38);
      // Gold trims
      g.fillStyle = goldTrim;
      g.fillRect(cx - 18, ground - 72, 36, 4);
      g.fillRect(cx - 2, ground - 68, 4, 34);
      g.fillRect(cx - 14, ground - 48, 28, 3);
      // Bat crest on chest
      g.fillStyle = "#e53935";
      g.beginPath();
      g.arc(cx, ground - 58, 5, 0, Math.PI * 2);
      g.fill();

      // Greatshield on left arm
      if (f === 1) {
        // Shield guard stance
        g.fillStyle = "#111018";
        g.strokeStyle = goldTrim;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(cx - 36, ground - 80);
        g.lineTo(cx - 4, ground - 80);
        g.lineTo(cx - 8, ground - 20);
        g.lineTo(cx - 20, ground - 10);
        g.lineTo(cx - 32, ground - 20);
        g.closePath();
        g.fill();
        g.stroke();
        // Shield glowing bat sigil
        g.fillStyle = "#ff1744";
        g.fillRect(cx - 24, ground - 55, 8, 16);
      } else {
        // Side shield
        g.fillStyle = "#111018";
        g.strokeStyle = goldTrim;
        g.lineWidth = 2;
        g.fillRect(cx - 32, ground - 68, 14, 44);
        g.strokeRect(cx - 32, ground - 68, 14, 44);
      }

      // Greatsword
      if (f === 2) {
        // Slashing slash arc!
        g.save();
        g.strokeStyle = "#8e24aa";
        g.lineWidth = 6;
        g.shadowColor = "#d500f9";
        g.shadowBlur = 12;
        g.beginPath();
        g.arc(cx + 25, ground - 45, 36, -0.6 * Math.PI, 0.4 * Math.PI);
        g.stroke();
        g.restore();

        // Sword blade
        g.fillStyle = "#e0e0e0";
        g.fillRect(cx + 20, ground - 85, 8, 60);
      } else if (f === 3) {
        // Thrust forward
        g.fillStyle = "#e0e0e0";
        g.fillRect(cx + 16, ground - 52, 45, 8);
        g.fillStyle = "#9c27b0";
        g.fillRect(cx + 56, ground - 54, 12, 12);
      } else {
        // Resting sword
        g.fillStyle = "#e0e0e0";
        g.fillRect(cx + 18, ground - 82, 6, 55);
        g.fillStyle = goldTrim;
        g.fillRect(cx + 14, ground - 42, 14, 6);
      }

      // Helm with Bat Wings
      g.fillStyle = armorDark;
      g.fillRect(cx - 15, ground - 94, 30, 24);
      // Wing crests on helm
      g.fillStyle = goldTrim;
      g.beginPath();
      g.moveTo(cx - 15, ground - 90);
      g.lineTo(cx - 26, ground - 106);
      g.lineTo(cx - 12, ground - 94);
      g.moveTo(cx + 15, ground - 90);
      g.lineTo(cx + 26, ground - 106);
      g.lineTo(cx + 12, ground - 94);
      g.fill();

      // Visor slit glowing sinister crimson
      g.fillStyle = "#ff1744";
      g.shadowColor = "#ff1744";
      g.shadowBlur = 6;
      g.fillRect(cx - 10, ground - 84, 20, 3);
      g.shadowBlur = 0;
    });

    // =========================================================================
    // 3. BOSS 3: Seraphine, a Sacerdotisa de Sangue (boss-seraphine.png)
    // =========================================================================
    const bossSeraphine = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Teleport mist / blood roses on frame 3
      if (f === 3) {
        g.fillStyle = "rgba(183, 28, 28, 0.55)";
        for (let i = 0; i < 16; i++) {
          const rx = cx + Math.sin(i * 1.5) * 36;
          const ry = ground - 50 + Math.cos(i * 1.3) * 45;
          g.beginPath();
          g.arc(rx, ry, 6 + (i % 4), 0, Math.PI * 2);
          g.fill();
        }
      }

      // Flowing priestess gown (Crimson & Obsidian)
      g.fillStyle = "#4a0010";
      g.beginPath();
      g.moveTo(cx - 12, ground - 75);
      g.lineTo(cx + 12, ground - 75);
      g.lineTo(cx + 28, ground);
      g.lineTo(cx - 28, ground);
      g.closePath();
      g.fill();

      // Gold embroidery & Stole
      g.fillStyle = "#d4af37";
      g.fillRect(cx - 6, ground - 72, 12, 70);
      g.fillStyle = "#800020";
      g.fillRect(cx - 4, ground - 68, 8, 64);
      // Gold crosses
      g.fillStyle = "#ffd700";
      for (let y = ground - 60; y < ground - 10; y += 18) {
        g.fillRect(cx - 3, y, 6, 2);
        g.fillRect(cx - 1, y - 2, 2, 6);
      }

      // Torso / Corset
      g.fillStyle = "#1a0005";
      g.fillRect(cx - 12, ground - 75, 24, 26);
      g.fillStyle = "#ffd700";
      g.strokeRect(cx - 10, ground - 73, 20, 22);

      // Shoulders & Veil
      g.fillStyle = "#880e4f";
      g.beginPath();
      g.moveTo(cx - 20, ground - 75);
      g.lineTo(cx + 20, ground - 75);
      g.lineTo(cx + 15, ground - 35);
      g.lineTo(cx - 15, ground - 35);
      g.closePath();
      g.fill();

      // Face & Hair
      g.fillStyle = "#f5d0c5"; // Pale porcelain vampire skin
      g.fillRect(cx - 10, ground - 94, 20, 20);
      // Jet black raven hair
      g.fillStyle = "#121015";
      g.fillRect(cx - 13, ground - 100, 26, 12);
      g.fillRect(cx - 15, ground - 94, 5, 26);
      g.fillRect(cx + 10, ground - 94, 5, 26);

      // Ornate Blood Headdress / Crown
      g.fillStyle = "#d4af37";
      g.beginPath();
      g.moveTo(cx - 14, ground - 98);
      g.lineTo(cx - 6, ground - 112);
      g.lineTo(cx, ground - 102);
      g.lineTo(cx + 6, ground - 112);
      g.lineTo(cx + 14, ground - 98);
      g.fill();
      g.fillStyle = "#b71c1c";
      g.beginPath();
      g.arc(cx, ground - 104, 3, 0, Math.PI * 2);
      g.fill();

      // Glowing crimson eyes
      g.fillStyle = "#ff1744";
      g.fillRect(cx - 6, ground - 88, 4, 3);
      g.fillRect(cx + 2, ground - 88, 4, 3);

      // Blood Scepter (Staff)
      const staffX = f === 1 ? cx + 18 : cx + 22;
      g.fillStyle = "#d4af37";
      g.fillRect(staffX, ground - 105, 4, 105);
      // Ornate cross head on staff
      g.fillRect(staffX - 8, ground - 112, 20, 5);
      g.fillRect(staffX, ground - 122, 4, 22);
      // Floating crimson blood orb on top
      g.fillStyle = "#ff1744";
      g.shadowColor = "#ff1744";
      g.shadowBlur = 10;
      g.beginPath();
      g.arc(staffX + 2, ground - 116, 7, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;

      // Frame 2: Cast 3 blood projectiles
      if (f === 2) {
        g.fillStyle = "#ff1744";
        g.shadowColor = "#ff5252";
        g.shadowBlur = 8;
        [-24, 0, 24].forEach((offY, idx) => {
          g.beginPath();
          g.arc(cx - 35, ground - 60 + offY, 6, 0, Math.PI * 2);
          g.fill();
        });
        g.shadowBlur = 0;
      }
    });

    // =========================================================================
    // 4. BOSS 4: Nocturne, Lorde Vampiro Morcego Feral (boss-nocturne.png)
    // =========================================================================
    const bossNocturne = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Colossal bat wings
      const wingColor = "#1a1622";
      const wingRib = "#2f293d";
      g.fillStyle = wingColor;
      g.strokeStyle = wingRib;
      g.lineWidth = 3;

      const wingSpan = f === 0 ? 56 : f === 1 ? 52 : f === 2 ? 60 : 48;
      const wingUp = f === 2 ? ground - 105 : ground - 85;

      g.beginPath();
      // Left wing
      g.moveTo(cx, ground - 60);
      g.lineTo(cx - wingSpan, wingUp);
      g.lineTo(cx - wingSpan + 14, ground - 40);
      g.lineTo(cx - wingSpan + 28, ground - 25);
      g.lineTo(cx - 15, ground - 45);
      // Right wing
      g.lineTo(cx + 15, ground - 45);
      g.lineTo(cx + wingSpan - 28, ground - 25);
      g.lineTo(cx + wingSpan - 14, ground - 40);
      g.lineTo(cx + wingSpan, wingUp);
      g.closePath();
      g.fill();
      g.stroke();

      // Sonic Screech Waves on Frame 1
      if (f === 1) {
        g.strokeStyle = "rgba(255, 64, 129, 0.8)";
        g.lineWidth = 3;
        for (let r = 16; r <= 48; r += 14) {
          g.beginPath();
          g.arc(cx, ground - 75, r, -0.7 * Math.PI, 0.7 * Math.PI, true);
          g.stroke();
        }
      }

      // Muscular Feral Torso
      g.fillStyle = "#332d3d";
      g.beginPath();
      g.moveTo(cx - 18, ground - 72);
      g.lineTo(cx + 18, ground - 72);
      g.lineTo(cx + 14, ground - 30);
      g.lineTo(cx - 14, ground - 30);
      g.closePath();
      g.fill();
      // Muscle ribs
      g.fillStyle = "#4a4258";
      g.fillRect(cx - 10, ground - 65, 20, 4);
      g.fillRect(cx - 8, ground - 55, 16, 4);
      g.fillRect(cx - 6, ground - 45, 12, 4);

      // Claws / Talons (Firmly resting on ground: y = 126)
      g.fillStyle = "#1e1b24";
      g.fillRect(cx - 16, ground - 30, 10, 26);
      g.fillRect(cx + 6, ground - 30, 10, 26);
      // Sharp curved talons
      g.fillStyle = "#d1c4e9";
      g.fillRect(cx - 18, ground - 6, 14, 6);
      g.fillRect(cx + 4, ground - 6, 14, 6);
      g.fillStyle = "#111";
      g.fillRect(cx - 19, ground - 2, 4, 2);
      g.fillRect(cx - 12, ground - 2, 4, 2);
      g.fillRect(cx + 3, ground - 2, 4, 2);
      g.fillRect(cx + 10, ground - 2, 4, 2);

      // Demonic Bat Head & Huge Ears
      g.fillStyle = "#282330";
      g.fillRect(cx - 16, ground - 90, 32, 22);
      // Pointed ears
      g.fillStyle = "#3e354a";
      g.beginPath();
      g.moveTo(cx - 16, ground - 88);
      g.lineTo(cx - 28, ground - 114);
      g.lineTo(cx - 8, ground - 90);
      g.moveTo(cx + 16, ground - 88);
      g.lineTo(cx + 28, ground - 114);
      g.lineTo(cx + 8, ground - 90);
      g.fill();

      // Glowing feral golden eyes
      g.fillStyle = "#ffd600";
      g.shadowColor = "#ffab00";
      g.shadowBlur = 8;
      g.fillRect(cx - 10, ground - 84, 6, 4);
      g.fillRect(cx + 4, ground - 84, 6, 4);
      g.shadowBlur = 0;

      // Snout with huge vampire fangs
      g.fillStyle = "#17141c";
      g.fillRect(cx - 10, ground - 76, 20, 10);
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(cx - 8, ground - 74);
      g.lineTo(cx - 5, ground - 65);
      g.lineTo(cx - 2, ground - 74);
      g.moveTo(cx + 2, ground - 74);
      g.lineTo(cx + 5, ground - 65);
      g.lineTo(cx + 8, ground - 74);
      g.fill();
    });

    // =========================================================================
    // 5. BOSS 5: Lorde Veyne, o Arquivista Necromante (boss-veyne.png)
    // =========================================================================
    const bossVeyne = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Flowing Dark Robes (Obsidian & Arcane Violet)
      g.fillStyle = "#1e1428";
      g.beginPath();
      g.moveTo(cx - 14, ground - 78);
      g.lineTo(cx + 14, ground - 78);
      g.lineTo(cx + 26, ground);
      g.lineTo(cx - 26, ground);
      g.closePath();
      g.fill();

      // Arcane Rune Trim on Robes
      g.fillStyle = "#9c27b0";
      g.fillRect(cx - 24, ground - 10, 48, 6);
      g.fillStyle = "#e1bee7";
      for (let x = cx - 20; x < cx + 20; x += 10) {
        g.fillRect(x, ground - 9, 4, 4);
      }

      // Torso & Mantle
      g.fillStyle = "#311b92";
      g.fillRect(cx - 15, ground - 78, 30, 36);
      g.fillStyle = "#7b1fa2";
      g.fillRect(cx - 18, ground - 82, 36, 8);

      // Floating Ancient Grimoire
      const bookX = cx - 32;
      const bookY = ground - 60 + Math.sin(f * 2) * 4;
      g.fillStyle = "#4a148c"; // Leather cover
      g.fillRect(bookX, bookY, 18, 22);
      g.fillStyle = "#f5f5f5"; // Pages
      g.fillRect(bookX + 2, bookY + 2, 14, 18);
      g.fillStyle = "#ba68c8"; // Rune glow in book
      g.fillRect(bookX + 5, bookY + 6, 8, 10);

      // Deep Shadow Cowl / Hood
      g.fillStyle = "#12091f";
      g.beginPath();
      g.moveTo(cx - 16, ground - 78);
      g.lineTo(cx - 14, ground - 105);
      g.lineTo(cx, ground - 110);
      g.lineTo(cx + 14, ground - 105);
      g.lineTo(cx + 16, ground - 78);
      g.closePath();
      g.fill();

      // Pitch black void inside hood
      g.fillStyle = "#000000";
      g.fillRect(cx - 10, ground - 98, 20, 18);

      // Glowing spectral eyes (Cyan / Violet Arcane)
      g.fillStyle = "#00e5ff";
      g.shadowColor = "#00e5ff";
      g.shadowBlur = 8;
      g.fillRect(cx - 7, ground - 92, 4, 3);
      g.fillRect(cx + 3, ground - 92, 4, 3);
      g.shadowBlur = 0;

      // Arcane Conjuration (Frame 1 & 2: Flaming Arcane Skull)
      if (f === 1 || f === 2) {
        const skullX = cx + 28;
        const skullY = ground - 70;
        // Purple flame aura
        g.fillStyle = "rgba(171, 71, 188, 0.6)";
        g.beginPath();
        g.arc(skullX, skullY, 14, 0, Math.PI * 2);
        g.fill();
        // Skull
        g.fillStyle = "#e0e0e0";
        g.fillRect(skullX - 6, skullY - 8, 12, 10);
        g.fillRect(skullX - 4, skullY + 2, 8, 5);
        // Eye sockets
        g.fillStyle = "#00e5ff";
        g.fillRect(skullX - 4, skullY - 4, 3, 3);
        g.fillRect(skullX + 1, skullY - 4, 3, 3);
      }

      // Frame 3: Arcane Floor Seal
      if (f === 3) {
        g.strokeStyle = "#e040fb";
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(cx, ground - 2, 34, 8, 0, 0, Math.PI * 2);
        g.stroke();
      }
    });

    // =========================================================================
    // 6. BOSS 6: Calx, a Abominação Alquímica (boss-calx.png)
    // =========================================================================
    const bossCalx = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Giant Flesh Golem / Alchemical Colossus
      const skinColor = "#446850"; // Sickly embalmed moss/flesh
      const skinShade = "#273f30";
      const metalDark = "#37474f";
      const brassTrim = "#ffb300";

      // Heavy Iron Boots (Feet firmly grounded: y = 126)
      g.fillStyle = metalDark;
      g.fillRect(cx - 24, ground - 36, 18, 36);
      g.fillRect(cx + 6, ground - 36, 18, 36);
      g.fillStyle = brassTrim;
      g.fillRect(cx - 26, ground - 8, 22, 8);
      g.fillRect(cx + 4, ground - 8, 22, 8);
      // Rivets
      g.fillStyle = "#cfd8dc";
      g.fillRect(cx - 22, ground - 6, 2, 2);
      g.fillRect(cx - 10, ground - 6, 2, 2);
      g.fillRect(cx + 8, ground - 6, 2, 2);
      g.fillRect(cx + 20, ground - 6, 2, 2);

      // Colossal Torso with Grotesque Stitches
      g.fillStyle = skinColor;
      g.fillRect(cx - 26, ground - 82, 52, 48);
      g.fillStyle = skinShade;
      g.fillRect(cx - 26, ground - 82, 10, 48);
      // Stitches across torso
      g.strokeStyle = "#1b2a20";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - 18, ground - 75);
      g.lineTo(cx + 15, ground - 45);
      g.stroke();
      for (let s = -14; s < 14; s += 7) {
        g.beginPath();
        g.moveTo(cx + s - 3, ground - 60 + s * 0.8 - 4);
        g.lineTo(cx + s + 3, ground - 60 + s * 0.8 + 4);
        g.stroke();
      }

      // Alchemical Vats / Tubes on Back (bubbling green slime & lightning)
      g.fillStyle = "#1b5e20"; // Glass cylinder
      g.fillRect(cx - 22, ground - 105, 10, 26);
      g.fillRect(cx + 12, ground - 105, 10, 26);
      // Glowing green chemical fluid
      g.fillStyle = "#00e676";
      g.shadowColor = "#00e676";
      g.shadowBlur = 8;
      g.fillRect(cx - 20, ground - 100, 6, 18);
      g.fillRect(cx + 14, ground - 100, 6, 18);
      g.shadowBlur = 0;
      // Brass caps on tubes
      g.fillStyle = brassTrim;
      g.fillRect(cx - 24, ground - 108, 14, 5);
      g.fillRect(cx + 10, ground - 108, 14, 5);

      // Heavy Arms with Spiked Metal Gauntlets
      g.fillStyle = skinColor;
      if (f === 2) {
        // Ground smash
        g.fillRect(cx - 36, ground - 60, 16, 45);
        g.fillRect(cx + 20, ground - 60, 16, 45);
        g.fillStyle = metalDark;
        g.fillRect(cx - 40, ground - 20, 22, 20);
        g.fillRect(cx + 18, ground - 20, 22, 20);
        // Toxic green shockwave
        g.fillStyle = "#00e676";
        g.fillRect(cx - 52, ground - 4, 104, 4);
      } else if (f === 1) {
        // Holding alchemical flask
        g.fillRect(cx - 36, ground - 78, 14, 38);
        g.fillRect(cx + 22, ground - 78, 14, 38);
        // Toxic green flask
        g.fillStyle = "#76ff03";
        g.beginPath();
        g.arc(cx + 34, ground - 60, 8, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = brassTrim;
        g.fillRect(cx + 32, ground - 72, 4, 6);
      } else {
        // Idle / Walking
        g.fillRect(cx - 38, ground - 80, 16, 42);
        g.fillRect(cx + 22, ground - 80, 16, 42);
        g.fillStyle = metalDark;
        g.fillRect(cx - 40, ground - 44, 18, 18);
        g.fillRect(cx + 22, ground - 44, 18, 18);
      }

      // Massive Square Head with Electrodes
      g.fillStyle = skinColor;
      g.fillRect(cx - 18, ground - 104, 36, 24);
      // Copper electrodes on neck/temple
      g.fillStyle = "#ff6d00";
      g.fillRect(cx - 24, ground - 96, 6, 8);
      g.fillRect(cx + 18, ground - 96, 6, 8);
      // Lightning spark on electrodes
      g.fillStyle = "#00e5ff";
      g.fillRect(cx - 26, ground - 94, 3, 3);
      g.fillRect(cx + 23, ground - 94, 3, 3);

      // Metal jaw brace
      g.fillStyle = metalDark;
      g.fillRect(cx - 14, ground - 88, 28, 8);
      g.fillStyle = "#b0bec5";
      for (let j = cx - 10; j < cx + 10; j += 6) {
        g.fillRect(j, ground - 86, 3, 4);
      }

      // One glowing yellow chemical eye, one stitched shut
      g.fillStyle = "#ffea00";
      g.shadowColor = "#ffea00";
      g.shadowBlur = 6;
      g.fillRect(cx - 10, ground - 98, 6, 5);
      g.shadowBlur = 0;
      g.strokeStyle = "#1b2a20";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx + 4, ground - 98);
      g.lineTo(cx + 12, ground - 94);
      g.stroke();
    });

    // =========================================================================
    // 7. FINAL BOSS: Conde Drácula, Senhor Supremo (boss-dracula.png)
    // =========================================================================
    const bossDracula = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Frame 3: Awake Supreme Vampire Lord form (Massive Shadow Wings!)
      if (f === 3) {
        g.fillStyle = "#1a0814";
        g.strokeStyle = "#b71c1c";
        g.lineWidth = 3;
        g.beginPath();
        // Enormous demonic shadow wings
        g.moveTo(cx, ground - 65);
        g.lineTo(cx - 58, ground - 110);
        g.lineTo(cx - 42, ground - 50);
        g.lineTo(cx - 54, ground - 30);
        g.lineTo(cx - 20, ground - 45);
        g.lineTo(cx + 20, ground - 45);
        g.lineTo(cx + 54, ground - 30);
        g.lineTo(cx + 42, ground - 50);
        g.lineTo(cx + 58, ground - 110);
        g.closePath();
        g.fill();
        g.stroke();

        // Blood star aura
        g.fillStyle = "rgba(229, 57, 53, 0.45)";
        g.beginPath();
        g.arc(cx, ground - 60, 48, 0, Math.PI * 2);
        g.fill();
      }

      // Iconic Royal Cape (Jet Black outside, Rich Crimson Silk inside)
      if (f === 1 || f === 2) {
        // Cape flung wide open!
        g.fillStyle = "#8a0c20"; // Crimson silk interior
        g.beginPath();
        g.moveTo(cx - 45, ground - 88);
        g.lineTo(cx + 45, ground - 88);
        g.lineTo(cx + 38, ground);
        g.lineTo(cx - 38, ground);
        g.closePath();
        g.fill();
        g.fillStyle = "#110b14"; // Black trim
        g.fillRect(cx - 46, ground - 88, 4, 88);
        g.fillRect(cx + 42, ground - 88, 4, 88);
      } else {
        // Cloak wrapped elegantly around body
        g.fillStyle = "#120e18";
        g.beginPath();
        g.moveTo(cx - 18, ground - 86);
        g.lineTo(cx + 18, ground - 86);
        g.lineTo(cx + 26, ground);
        g.lineTo(cx - 26, ground);
        g.closePath();
        g.fill();
        // Crimson lining peek
        g.fillStyle = "#990f28";
        g.beginPath();
        g.moveTo(cx - 4, ground - 76);
        g.lineTo(cx + 4, ground - 76);
        g.lineTo(cx + 12, ground);
        g.lineTo(cx - 4, ground);
        g.closePath();
        g.fill();
      }

      // Aristocratic Gala Attire (Victorian Black Vest, White Cravat, Gold Brooch)
      g.fillStyle = "#1b1822";
      g.fillRect(cx - 14, ground - 76, 28, 42);
      // White ruffled cravat
      g.fillStyle = "#f5f5f5";
      g.beginPath();
      g.moveTo(cx - 6, ground - 76);
      g.lineTo(cx + 6, ground - 76);
      g.lineTo(cx + 4, ground - 60);
      g.lineTo(cx, ground - 56);
      g.lineTo(cx - 4, ground - 60);
      g.closePath();
      g.fill();
      // Gold Brooch with Blood Ruby
      g.fillStyle = "#ffd700";
      g.beginPath();
      g.arc(cx, ground - 68, 3.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#d50000";
      g.beginPath();
      g.arc(cx, ground - 68, 2, 0, Math.PI * 2);
      g.fill();

      // Aristocratic Trousers & Polished Boots (Firmly on ground: y = 126)
      g.fillStyle = "#0d0b10";
      g.fillRect(cx - 14, ground - 34, 11, 34);
      g.fillRect(cx + 3, ground - 34, 11, 34);
      g.fillStyle = "#ffd700";
      g.fillRect(cx - 15, ground - 8, 13, 8);
      g.fillRect(cx + 2, ground - 8, 13, 8);
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 14, ground - 6, 4, 2);
      g.fillRect(cx + 3, ground - 6, 4, 2);

      // High-Standing Dracula Collar
      g.fillStyle = "#8a0c20"; // Red lining
      g.beginPath();
      g.moveTo(cx - 18, ground - 76);
      g.lineTo(cx - 26, ground - 100);
      g.lineTo(cx - 10, ground - 84);
      g.moveTo(cx + 18, ground - 76);
      g.lineTo(cx + 26, ground - 100);
      g.lineTo(cx + 10, ground - 84);
      g.fill();
      g.fillStyle = "#120e18"; // Black outer
      g.stroke();

      // Pale Noble Vampire Face & Slicked Silver-Streaked Hair
      g.fillStyle = "#f8dcd6"; // Pale vampire skin
      g.fillRect(cx - 10, ground - 94, 20, 18);
      // Slicked black hair with white temples
      g.fillStyle = "#1a1820";
      g.fillRect(cx - 12, ground - 102, 24, 10);
      g.fillStyle = "#eceff1"; // Silver streaks
      g.fillRect(cx - 11, ground - 98, 4, 8);
      g.fillRect(cx + 7, ground - 98, 4, 8);

      // Piercing Ruby Red Eyes
      g.fillStyle = "#ff1744";
      g.shadowColor = "#ff1744";
      g.shadowBlur = 8;
      g.fillRect(cx - 6, ground - 88, 4, 3);
      g.fillRect(cx + 2, ground - 88, 4, 3);
      g.shadowBlur = 0;

      // Subtle Fangs & Sinister Grin
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 4, ground - 81, 2, 3);
      g.fillRect(cx + 2, ground - 81, 2, 3);

      // Frame 2: Iconic 3 Hellfire Fireballs cast!
      if (f === 2) {
        [-20, 0, 20].forEach((offY, idx) => {
          const ballX = cx - 38 - idx * 6;
          const ballY = ground - 58 + offY;
          // Outer flame
          g.fillStyle = "#ff3d00";
          g.shadowColor = "#ff9100";
          g.shadowBlur = 10;
          g.beginPath();
          g.arc(ballX, ballY, 8, 0, Math.PI * 2);
          g.fill();
          // Inner core
          g.fillStyle = "#ffff00";
          g.beginPath();
          g.arc(ballX + 2, ballY, 4, 0, Math.PI * 2);
          g.fill();
          g.shadowBlur = 0;
        });
      }
    });

    // =========================================================================
    // 8. NEW NPC: Zumbi / Carniçal das Criptas (zombie.png)
    // =========================================================================
    const zombie = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      const fleshColor = "#546e5a";
      const fleshDark = "#35473a";
      const clothColor = "#4e342e";
      const clothTear = "#3e2723";

      // Feet & Shuffling Legs (Firmly on ground: y = 126)
      g.fillStyle = fleshDark;
      const legOffset = f === 1 ? -4 : f === 3 ? 4 : 0;
      g.fillRect(cx - 10 + legOffset, ground - 30, 8, 28);
      g.fillRect(cx + 2 - legOffset, ground - 30, 8, 28);
      // Rotten bare feet
      g.fillStyle = fleshColor;
      g.fillRect(cx - 12 + legOffset, ground - 4, 11, 4);
      g.fillRect(cx + 1 - legOffset, ground - 4, 11, 4);

      // Tattered Trousers
      g.fillStyle = clothColor;
      g.fillRect(cx - 11, ground - 34, 22, 18);

      // Slumped Rotting Torso
      g.fillStyle = clothTear;
      g.fillRect(cx - 12, ground - 64, 24, 30);
      // Exposed ribs / decaying flesh
      g.fillStyle = fleshColor;
      g.fillRect(cx - 4, ground - 56, 12, 14);
      g.fillStyle = "#8d6e63"; // Bone
      g.fillRect(cx - 2, ground - 52, 8, 2);
      g.fillRect(cx - 2, ground - 48, 8, 2);

      // Outstretched Claws / Arms
      g.fillStyle = fleshColor;
      if (f === 2) {
        // Claw swipe
        g.fillRect(cx - 28, ground - 56, 26, 8);
        g.fillStyle = "#ffffff";
        g.fillRect(cx - 30, ground - 57, 4, 3);
      } else {
        // Shuffling arms
        g.fillRect(cx - 22, ground - 52, 18, 7);
        g.fillStyle = "#ffffff";
        g.fillRect(cx - 24, ground - 53, 3, 3);
      }

      // Decaying Head with Hollow Eye
      g.fillStyle = fleshColor;
      g.fillRect(cx - 10, ground - 82, 20, 18);
      // Tattered hair
      g.fillStyle = "#263238";
      g.fillRect(cx - 12, ground - 86, 22, 6);

      // One glowing yellow rotting eye, one dark cavity
      g.fillStyle = "#ffeb3b";
      g.fillRect(cx - 8, ground - 76, 4, 4);
      g.fillStyle = "#1a221c";
      g.fillRect(cx + 2, ground - 76, 4, 4);

      // Crooked open jaw
      g.fillStyle = "#2e1c14";
      g.fillRect(cx - 7, ground - 70, 14, 6);
      g.fillStyle = "#eeeeee";
      g.fillRect(cx - 5, ground - 68, 2, 2);
      g.fillRect(cx + 1, ground - 68, 2, 2);
    });

    // =========================================================================
    // 9. NEW NPC: Guarda Blindado / Soldado do Castelo (knight.png)
    // =========================================================================
    const knight = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      const ironDark = "#263238";
      const ironMid = "#37474f";
      const ironLight = "#607d8b";
      const goldAccent = "#ffb300";

      // Armored Greaves / Sabatons (Firmly on ground: y = 126)
      g.fillStyle = ironDark;
      const walk = f === 1 ? -3 : f === 3 ? 3 : 0;
      g.fillRect(cx - 12 + walk, ground - 32, 10, 30);
      g.fillRect(cx + 2 - walk, ground - 32, 10, 30);
      g.fillStyle = ironLight;
      g.fillRect(cx - 14 + walk, ground - 6, 13, 6);
      g.fillRect(cx + 1 - walk, ground - 6, 13, 6);

      // Chainmail & Plate Cuirass
      g.fillStyle = ironMid;
      g.fillRect(cx - 14, ground - 68, 28, 36);
      g.fillStyle = goldAccent;
      g.fillRect(cx - 14, ground - 68, 28, 3);
      g.fillRect(cx - 14, ground - 46, 28, 3);
      // Castlevania Cross Crest on Breastplate
      g.fillStyle = "#d32f2f";
      g.fillRect(cx - 2, ground - 62, 4, 12);
      g.fillRect(cx - 6, ground - 58, 12, 4);

      // Shield on left arm
      if (f === 3) {
        // Shield raise
        g.fillStyle = ironDark;
        g.strokeStyle = goldAccent;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx - 26, ground - 70);
        g.lineTo(cx - 4, ground - 70);
        g.lineTo(cx - 8, ground - 26);
        g.lineTo(cx - 15, ground - 18);
        g.lineTo(cx - 22, ground - 26);
        g.closePath();
        g.fill();
        g.stroke();
      } else {
        // Side shield
        g.fillStyle = ironDark;
        g.strokeStyle = goldAccent;
        g.lineWidth = 2;
        g.fillRect(cx - 24, ground - 62, 10, 34);
        g.strokeRect(cx - 24, ground - 62, 10, 34);
      }

      // Halberd / Spear Weapon on right arm
      if (f === 2) {
        // Spear thrust!
        g.fillStyle = "#795548"; // Shaft
        g.fillRect(cx + 4, ground - 50, 48, 4);
        g.fillStyle = "#eceff1"; // Steel spearhead
        g.beginPath();
        g.moveTo(cx + 52, ground - 55);
        g.lineTo(cx + 64, ground - 48);
        g.lineTo(cx + 52, ground - 41);
        g.closePath();
        g.fill();
      } else {
        // Spear held upright
        g.fillStyle = "#795548";
        g.fillRect(cx + 14, ground - 88, 4, 76);
        g.fillStyle = "#eceff1";
        g.beginPath();
        g.moveTo(cx + 12, ground - 88);
        g.lineTo(cx + 16, ground - 105);
        g.lineTo(cx + 20, ground - 88);
        g.closePath();
        g.fill();
      }

      // Great Helm
      g.fillStyle = ironMid;
      g.fillRect(cx - 11, ground - 90, 22, 22);
      g.fillStyle = ironLight;
      g.fillRect(cx - 12, ground - 92, 24, 4);
      // Red Feather Plume
      g.fillStyle = "#e53935";
      g.beginPath();
      g.moveTo(cx, ground - 92);
      g.quadraticCurveTo(cx - 10, ground - 106, cx - 18, ground - 100);
      g.lineTo(cx - 2, ground - 94);
      g.fill();

      // Visor slit with dark shadow & glowing red alert eye
      g.fillStyle = "#102027";
      g.fillRect(cx - 8, ground - 82, 16, 4);
      g.fillStyle = "#ff1744";
      g.fillRect(cx - 4, ground - 81, 4, 2);
    });

    // =========================================================================
    // 10. PORTAL: Portal Místico Gótico (portal-gate.png)
    // Materializa-se e abre após a queda de cada Boss!
    // =========================================================================
    const portalGate = createSheet((g, f, w, h) => {
      const cx = 64;
      const ground = 126;

      // Frame 0: Materializing/Sealed Gothic Arch
      // Frame 1: Runes activating & Glowing
      // Frame 2: Dimensional Vortex Opening
      // Frame 3: Fully Active Cosmic Crimson & Astral Portal!

      // Stone Pillars & Gothic Archway
      g.fillStyle = "#211c27";
      g.strokeStyle = "#383142";
      g.lineWidth = 2;

      // Left Pillar
      g.fillRect(cx - 40, ground - 105, 14, 105);
      g.strokeRect(cx - 40, ground - 105, 14, 105);
      // Right Pillar
      g.fillRect(cx + 26, ground - 105, 14, 105);
      g.strokeRect(cx + 26, ground - 105, 14, 105);

      // Pillar bases
      g.fillStyle = "#15111c";
      g.fillRect(cx - 44, ground - 12, 22, 12);
      g.fillRect(cx + 22, ground - 12, 22, 12);

      // Arch Cap / Keystones
      g.beginPath();
      g.moveTo(cx - 42, ground - 105);
      g.quadraticCurveTo(cx, ground - 126, cx + 42, ground - 105);
      g.lineTo(cx + 34, ground - 98);
      g.quadraticCurveTo(cx, ground - 116, cx - 34, ground - 98);
      g.closePath();
      g.fill();
      g.stroke();

      // Gargoyle / Bat Keystone Crest
      g.fillStyle = "#4a4258";
      g.beginPath();
      g.arc(cx, ground - 114, 8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = f > 0 ? "#ffd700" : "#757575";
      g.fillRect(cx - 3, ground - 116, 2, 2);
      g.fillRect(cx + 1, ground - 116, 2, 2);

      // Glowing Runes on Pillars
      if (f > 0) {
        const runeGlow = f === 1 ? "#ffd700" : "#ff1744";
        g.fillStyle = runeGlow;
        g.shadowColor = runeGlow;
        g.shadowBlur = 8;
        for (let ry = ground - 90; ry < ground - 20; ry += 16) {
          g.fillRect(cx - 35, ry, 4, 6);
          g.fillRect(cx + 31, ry, 4, 6);
        }
        g.shadowBlur = 0;
      }

      // Portal Interior Area:
      const innerW = 52;
      const innerH = 92;
      const innerX = cx - 26;
      const innerY = ground - innerH;

      if (f === 0) {
        // Sealed iron portcullis & stone wall
        g.fillStyle = "#18121f";
        g.fillRect(innerX, innerY, innerW, innerH);
        // Iron bars
        g.strokeStyle = "#455a64";
        g.lineWidth = 2;
        for (let bx = innerX + 6; bx < innerX + innerW; bx += 8) {
          g.beginPath();
          g.moveTo(bx, innerY);
          g.lineTo(bx, ground);
          g.stroke();
        }
        // Heavy lock
        g.fillStyle = "#d4af37";
        g.fillRect(cx - 6, ground - 48, 12, 14);
      } else if (f === 1) {
        // Runes awakening, iron portcullis dissolving in glowing cracks
        g.fillStyle = "#2a1524";
        g.fillRect(innerX, innerY, innerW, innerH);
        g.strokeStyle = "#ff3d00";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx, innerY + 10);
        g.lineTo(cx - 10, ground - 50);
        g.lineTo(cx + 15, ground - 30);
        g.lineTo(cx, ground);
        g.stroke();
      } else if (f === 2) {
        // Dimensional vortex spinning open!
        const grad = g.createRadialGradient(cx, ground - 50, 4, cx, ground - 50, 32);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.3, "rgba(213, 0, 249, 0.85)");
        grad.addColorStop(0.7, "rgba(213, 0, 0, 0.7)");
        grad.addColorStop(1, "rgba(20, 10, 30, 0.95)");
        g.fillStyle = grad;
        g.beginPath();
        g.ellipse(cx, ground - 50, 24, 42, 0, 0, Math.PI * 2);
        g.fill();

        // Spiral sparks
        g.fillStyle = "#ffffff";
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + 0.5;
          const spx = cx + Math.cos(ang) * 16;
          const spy = ground - 50 + Math.sin(ang) * 26;
          g.fillRect(spx - 1, spy - 1, 3, 3);
        }
      } else if (f === 3) {
        // Fully active cosmic crimson/astral dimensional rift!
        const grad = g.createRadialGradient(cx, ground - 50, 2, cx, ground - 50, 34);
        grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        grad.addColorStop(0.25, "rgba(0, 229, 255, 0.9)");
        grad.addColorStop(0.55, "rgba(124, 77, 255, 0.85)");
        grad.addColorStop(0.85, "rgba(255, 23, 68, 0.8)");
        grad.addColorStop(1, "rgba(10, 0, 20, 0.95)");

        g.fillStyle = grad;
        g.shadowColor = "#ff1744";
        g.shadowBlur = 14;
        g.beginPath();
        g.ellipse(cx, ground - 50, 25, 43, 0, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;

        // Swirling stellar particles
        g.fillStyle = "#ffffff";
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + 1.2;
          const spx = cx + Math.cos(ang) * 18;
          const spy = ground - 50 + Math.sin(ang) * 28;
          g.fillRect(spx - 1.5, spy - 1.5, 3, 3);
        }
      }
    });

    return {
      "boss-petros": bossPetros,
      "boss-valerius": bossValerius,
      "boss-seraphine": bossSeraphine,
      "boss-nocturne": bossNocturne,
      "boss-veyne": bossVeyne,
      "boss-calx": bossCalx,
      "boss-dracula": bossDracula,
      "zombie": zombie,
      "knight": knight,
      "portal-gate": portalGate,
    };
  });

  for (const [name, dataUrl] of Object.entries(generatedSprites)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const dest = path.join(outDir, `${name}.png`);
    fs.writeFileSync(dest, Buffer.from(base64Data, "base64"));
    console.log(`Generated: ${dest}`);
  }

  // Also update public/sprites/dracula.png to match the refined Dracula
  fs.copyFileSync(
    path.join(outDir, "boss-dracula.png"),
    path.join(outDir, "dracula.png")
  );
  console.log("Updated public/sprites/dracula.png with refined Dracula sheet!");

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
