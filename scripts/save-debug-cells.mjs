import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const sheets = [
  { name: "petros", file: "boss_petros_sheet_1791603659957.jpg" },
  { name: "valerius", file: "boss_valerius_sheet_1791603728528.jpg" },
  { name: "seraphine", file: "boss_seraphine_sheet_1791603747934.jpg" },
  { name: "nocturne", file: "boss_nocturne_sheet_1791603773184.jpg" },
  { name: "veyne", file: "boss_veyne_sheet_1791603807334.jpg" },
  { name: "calx", file: "boss_calx_sheet_1791603832365.jpg" },
  { name: "dracula", file: "boss_dracula_sheet_1791603859890.jpg" },
  { name: "knight", file: "enemy_knight_sheet_1791603889814.jpg" },
  { name: "zombie", file: "enemy_zombie_sheet_1791603922334.jpg" },
  { name: "portal", file: "portal_gate_sheet_1791603958970.jpg" },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  fs.mkdirSync("screenshots/debug-cells", { recursive: true });

  for (const s of sheets) {
    const fullPath = BRAIN + s.file;
    const b64 = fs.readFileSync(fullPath).toString("base64");
    
    await page.setContent(`
      <style>body { background: #333; margin: 0; padding: 0; }</style>
      <canvas id="c" width="1024" height="1024"></canvas>
    `);

    const result = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });
      const c = document.getElementById("c");
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return true;
    }, b64);

    // Save individual 512x512 quadrants for visual check
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const clip = { x: col * 512, y: row * 512, width: 512, height: 512 };
        await page.screenshot({
          path: `screenshots/debug-cells/${s.name}_c${col}_r${row}.png`,
          clip
        });
      }
    }
    console.log("Saved cells for", s.name);
  }

  await browser.close();
  console.log("Done saving debug cells");
}

main().catch(console.error);
