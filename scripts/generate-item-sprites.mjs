import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "public/sprites";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  const sprites = await page.evaluate(() => {
    // Helper to render onto a canvas and return PNG data URL
    function createPng(w, h, drawFn) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      drawFn(ctx, w, h);
      return c.toDataURL("image/png");
    }

    // 1. item-life.png (Cálice Sagrado / Vida Extra 1-UP)
    // 36x36 pixel art / gothic sprite
    const itemLife = createPng(36, 36, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const cx = 18;

      // Glow behind
      const glow = g.createRadialGradient(cx, 16, 2, cx, 16, 17);
      glow.addColorStop(0, "rgba(255, 215, 0, 0.45)");
      glow.addColorStop(0.5, "rgba(220, 20, 60, 0.25)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);

      // Winged halo on top
      g.fillStyle = "rgba(255, 230, 140, 0.85)";
      g.beginPath();
      g.moveTo(cx - 10, 8);
      g.quadraticCurveTo(cx - 5, 5, cx, 7);
      g.quadraticCurveTo(cx + 5, 5, cx + 10, 8);
      g.quadraticCurveTo(cx + 5, 9, cx, 8);
      g.quadraticCurveTo(cx - 5, 9, cx - 10, 8);
      g.fill();

      // Chalice bowl outline (gold)
      g.fillStyle = "#ffe066"; // Gold highlight
      g.beginPath();
      g.moveTo(cx - 9, 10);
      g.lineTo(cx + 9, 10);
      g.lineTo(cx + 8, 18);
      g.quadraticCurveTo(cx, 24, cx - 8, 18);
      g.closePath();
      g.fill();

      // Chalice inner shadow
      g.fillStyle = "#b8860b"; // Dark gold
      g.beginPath();
      g.moveTo(cx - 8, 11);
      g.lineTo(cx + 8, 11);
      g.lineTo(cx + 7, 18);
      g.quadraticCurveTo(cx, 23, cx - 7, 18);
      g.closePath();
      g.fill();

      // Chalice blood liquid
      g.fillStyle = "#dc2626"; // Crimson blood
      g.beginPath();
      g.ellipse(cx, 13, 6, 2.5, 0, 0, Math.PI * 2);
      g.fill();

      // Blood highlight
      g.fillStyle = "#fca5a5";
      g.beginPath();
      g.arc(cx - 2, 12.5, 1.2, 0, Math.PI * 2);
      g.fill();

      // Ruby in the center of chalice
      g.fillStyle = "#ef4444";
      g.beginPath();
      g.arc(cx, 17, 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 1, 16, 1, 1);

      // Stem (coluna do cálice)
      g.fillStyle = "#ffd700";
      g.fillRect(cx - 2, 22, 4, 6);
      g.fillStyle = "#996515";
      g.fillRect(cx + 1, 22, 1, 6);

      // Base
      g.fillStyle = "#ffe066";
      g.beginPath();
      g.ellipse(cx, 29, 7, 2.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#805500";
      g.beginPath();
      g.ellipse(cx, 30, 7, 1.5, 0, 0, Math.PI * 2);
      g.fill();

      // Rim gold trim
      g.strokeStyle = "#fff2a8";
      g.lineWidth = 1;
      g.strokeRect(cx - 9, 9, 18, 2);

      // Sparkles
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 7, 6, 2, 2);
      g.fillRect(cx + 8, 14, 1.5, 1.5);
    });

    // 2. item-heal.png (Elixir Carmesim / Poção de Vida)
    const itemHeal = createPng(36, 36, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const cx = 18;

      // Glow behind
      const glow = g.createRadialGradient(cx, 20, 2, cx, 20, 16);
      glow.addColorStop(0, "rgba(239, 68, 68, 0.45)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);

      // Cork stopper (rolha)
      g.fillStyle = "#a27b5c";
      g.fillRect(cx - 3, 7, 6, 4);
      g.fillStyle = "#5c3d28";
      g.fillRect(cx + 1, 7, 2, 4);

      // Bottle neck (vidro do gargalo)
      g.fillStyle = "#d1d5db";
      g.fillRect(cx - 4, 11, 8, 3);
      g.fillStyle = "#9ca3af";
      g.fillRect(cx - 4, 10, 8, 1);

      // Flask body (garrafa arredondada)
      g.fillStyle = "rgba(255, 255, 255, 0.25)";
      g.beginPath();
      g.arc(cx, 22, 9, 0, Math.PI * 2);
      g.fill();

      // Red potion fluid
      g.fillStyle = "#b91c1c";
      g.beginPath();
      g.arc(cx, 23, 7.5, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = "#ef4444";
      g.beginPath();
      g.arc(cx, 22, 6.5, 0, Math.PI * 2);
      g.fill();

      // Glass specular reflection / shine
      g.fillStyle = "rgba(255, 255, 255, 0.75)";
      g.beginPath();
      g.ellipse(cx - 4, 19, 2, 4, -0.4, 0, Math.PI * 2);
      g.fill();

      // Floating cross icon on flask
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 1, 21, 2, 6);
      g.fillRect(cx - 3, 23, 6, 2);

      // Bubbles
      g.fillStyle = "rgba(254, 202, 202, 0.9)";
      g.fillRect(cx + 2, 24, 1.5, 1.5);
      g.fillRect(cx - 2, 26, 1.2, 1.2);
    });

    // 3. item-mana.png (Éter Arcano / Frasco de Mana)
    const itemMana = createPng(36, 36, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const cx = 18;

      // Glow behind
      const glow = g.createRadialGradient(cx, 20, 2, cx, 20, 16);
      glow.addColorStop(0, "rgba(59, 130, 246, 0.5)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);

      // Silver stopper
      g.fillStyle = "#e2e8f0";
      g.beginPath();
      g.arc(cx, 8, 3, 0, Math.PI * 2);
      g.fill();

      // Neck
      g.fillStyle = "#94a3b8";
      g.fillRect(cx - 3, 11, 6, 3);

      // Potion flask body (diamond / teardrop flask)
      g.fillStyle = "#1e3a8a"; // Deep blue
      g.beginPath();
      g.moveTo(cx, 13);
      g.lineTo(cx + 8, 22);
      g.lineTo(cx, 30);
      g.lineTo(cx - 8, 22);
      g.closePath();
      g.fill();

      // Mana fluid core
      g.fillStyle = "#3b82f6"; // Bright cyan-blue
      g.beginPath();
      g.moveTo(cx, 15);
      g.lineTo(cx + 6, 22);
      g.lineTo(cx, 28);
      g.lineTo(cx - 6, 22);
      g.closePath();
      g.fill();

      // Magical inner core
      g.fillStyle = "#93c5fd";
      g.beginPath();
      g.arc(cx, 22, 2.5, 0, Math.PI * 2);
      g.fill();

      // Sparkle / Star highlight
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 4, 18, 2, 2);
      g.fillRect(cx + 3, 24, 1.5, 1.5);
      g.fillRect(cx - 1, 21, 2, 2);
    });

    return { itemLife, itemHeal, itemMana };
  });

  await browser.close();

  // Save files
  for (const [key, b64] of Object.entries(sprites)) {
    const raw = b64.replace(/^data:image\/png;base64,/, "");
    const fileName = key === "itemLife" ? "item-life.png" : key === "itemHeal" ? "item-heal.png" : "item-mana.png";
    const dest = path.join(outDir, fileName);
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    console.log(`Saved ${dest}`);
  }
}

run().catch(console.error);
