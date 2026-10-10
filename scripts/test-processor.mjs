import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const sheets = [
  { name: "boss-petros", file: "boss_petros_sheet_1791603659957.jpg", floorY: null, removeText: false },
  { name: "boss-valerius", file: "boss_valerius_sheet_1791603728528.jpg", floorY: 485, removeText: true },
  { name: "boss-seraphine", file: "boss_seraphine_sheet_1791603747934.jpg", floorY: null, removeText: false },
  { name: "boss-nocturne", file: "boss_nocturne_sheet_1791603773184.jpg", floorY: null, removeText: false },
  { name: "boss-veyne", file: "boss_veyne_sheet_1791603807334.jpg", floorY: null, removeText: false },
  { name: "boss-calx", file: "boss_calx_sheet_1791603832365.jpg", floorY: 485, removeText: false },
  { name: "boss-dracula", file: "boss_dracula_sheet_1791603859890.jpg", floorY: null, removeText: true },
  { name: "knight", file: "enemy_knight_sheet_1791603889814.jpg", floorY: null, removeText: false },
  { name: "zombie", file: "enemy_zombie_sheet_1791603922334.jpg", floorY: null, removeText: false },
  { name: "portal-gate", file: "portal_gate_sheet_1791603958970.jpg", floorY: null, removeText: false },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  fs.mkdirSync("screenshots/processed-sheets", { recursive: true });

  for (const s of sheets) {
    const fullPath = BRAIN + s.file;
    const b64 = fs.readFileSync(fullPath).toString("base64");

    const processedDataUrl = await page.evaluate(async ({ b64, conf }) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });

      // Source 1024x1024
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = 1024;
      srcCanvas.height = 1024;
      const srcCtx = srcCanvas.getContext("2d");
      srcCtx.drawImage(img, 0, 0);

      // Target 256x256 (each cell is 128x128)
      const outCanvas = document.createElement("canvas");
      outCanvas.width = 256;
      outCanvas.height = 256;
      const outCtx = outCanvas.getContext("2d");

      for (let cellIdx = 0; cellIdx < 4; cellIdx++) {
        const cCol = cellIdx % 2;
        const cRow = Math.floor(cellIdx / 2);
        const cellX = cCol * 512;
        const cellY = cRow * 512;

        const cellData = srcCtx.getImageData(cellX, cellY, 512, 512);
        const d = cellData.data;

        // 1. Clear outer 6px borders of the 512x512 cell
        for (let y = 0; y < 512; y++) {
          for (let x = 0; x < 512; x++) {
            if (x < 6 || x >= 506 || y < 6 || y >= 506) {
              const idx = (y * 512 + x) * 4;
              d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
            }
          }
        }

        // 2. Remove floor slab if specified
        if (conf.floorY) {
          for (let y = conf.floorY; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
              const idx = (y * 512 + x) * 4;
              d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
            }
          }
        }

        // 3. Remove text if specified
        // Text is in top 60px. Clear isolated small dark clusters in y < 60
        if (conf.removeText) {
          for (let y = 0; y < 55; y++) {
            for (let x = 0; x < 512; x++) {
              // In Valerius frame 2 (cell 1), the raised sword is at x > 380
              // In Valerius frame 1, 3, 4, sword doesn't reach y < 55 at all
              if (conf.name === "boss-valerius" && cellIdx === 1 && x > 360) {
                // Keep the raised sword
                continue;
              }
              const idx = (y * 512 + x) * 4;
              d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
            }
          }
        }

        // 4. White Chroma Key & Defringe
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          const min = Math.min(r, g, b);
          const max = Math.max(r, g, b);
          
          if (min > 238) {
            d[i + 3] = 0; // Pure background
          } else if (min > 215) {
            // Edge smoothing
            d[i + 3] = Math.round(((238 - min) / 23) * 255);
          } else {
            // Defringe: if it's slightly washed by white background, recover tint
            if (min > 180 && max - min < 25) {
              // faint grey halo
              d[i + 3] = Math.max(0, d[i + 3] - 70);
            }
          }
        }

        // Create temporary canvas for this 512x512 cell
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 512;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.putImageData(cellData, 0, 0);

        // Draw downscaled to 128x128 in outCanvas
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = "high";
        outCtx.drawImage(tempCanvas, 0, 0, 512, 512, cCol * 128, cRow * 128, 128, 128);
      }

      return outCanvas.toDataURL("image/png");
    }, { b64, conf: s });

    const pngBuffer = Buffer.from(processedDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
    fs.writeFileSync(`screenshots/processed-sheets/${s.name}.png`, pngBuffer);
    console.log("Processed", s.name, "saved to screenshots/processed-sheets/");
  }

  await browser.close();
  console.log("All sheets processed!");
}

main().catch(console.error);
