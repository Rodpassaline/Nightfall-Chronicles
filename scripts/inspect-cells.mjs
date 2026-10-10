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

  fs.mkdirSync("screenshots/sprite-cells", { recursive: true });

  for (const s of sheets) {
    const fullPath = BRAIN + s.file;
    const b64 = fs.readFileSync(fullPath).toString("base64");
    
    const analysis = await page.evaluate(async ({ b64, name }) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });

      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const cellInfo = [];
      const cells = [
        { col: 0, row: 0, x: 0, y: 0 },
        { col: 1, row: 0, x: 512, y: 0 },
        { col: 0, row: 1, x: 0, y: 512 },
        { col: 1, row: 1, x: 512, y: 512 }
      ];

      for (let i = 0; i < 4; i++) {
        const c = cells[i];
        const idata = ctx.getImageData(c.x, c.y, 512, 512);
        const d = idata.data;
        
        // Find bounding box of non-white pixels
        // ignoring border (5px from edges)
        let minX = 512, maxX = 0, minY = 512, maxY = 0;
        let nonWhiteCount = 0;
        for (let y = 8; y < 504; y++) {
          for (let x = 8; x < 504; x++) {
            const idx = (y * 512 + x) * 4;
            const r = d[idx], g = d[idx+1], b = d[idx+2];
            // non-white test
            if (r < 235 || g < 235 || b < 235) {
              nonWhiteCount++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        cellInfo.push({ cell: i, minX, maxX, minY, maxY, nonWhiteCount });
      }
      return cellInfo;
    }, { b64, name: s.name });

    console.log(s.name, JSON.stringify(analysis));
  }

  await browser.close();
}

main().catch(console.error);
