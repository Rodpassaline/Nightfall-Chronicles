import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const sheets = [
  { name: "boss-petros", file: "boss_petros_sheet_1791603659957.jpg", floorY: null, removeText: false },
  { name: "boss-valerius", file: "boss_valerius_sheet_1791603728528.jpg", floorY: 470, removeText: true },
  { name: "boss-seraphine", file: "boss_seraphine_sheet_1791603747934.jpg", floorY: null, removeText: false },
  { name: "boss-nocturne", file: "boss_nocturne_sheet_1791603773184.jpg", floorY: null, removeText: false },
  { name: "boss-veyne", file: "boss_veyne_sheet_1791603807334.jpg", floorY: null, removeText: false },
  { name: "boss-calx", file: "boss_calx_sheet_1791603832365.jpg", floorY: 470, removeText: false },
  { name: "boss-dracula", file: "boss_dracula_sheet_1791603859890.jpg", floorY: null, removeText: true },
  { name: "knight", file: "enemy_knight_sheet_1791603889814.jpg", floorY: null, removeText: false },
  { name: "zombie", file: "enemy_zombie_sheet_1791603922334.jpg", floorY: null, removeText: false },
  { name: "portal-gate", file: "portal_gate_sheet_1791603958970.jpg", floorY: null, removeText: false },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  for (const s of sheets) {
    const fullPath = BRAIN + s.file;
    if (!fs.existsSync(fullPath)) {
      console.error("Missing file:", fullPath);
      continue;
    }
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

        // 1. Clear outer 8px borders of each 512x512 cell to remove grid divider artifacts
        for (let y = 0; y < 512; y++) {
          for (let x = 0; x < 512; x++) {
            if (x < 8 || x >= 504 || y < 8 || y >= 504) {
              const idx = (y * 512 + x) * 4;
              d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
            }
          }
        }

        // 2. Remove floor slab if specified
        const effFloorY = conf.name === "boss-calx" && cellIdx === 2 ? 430 : conf.floorY;
        if (effFloorY) {
          for (let y = effFloorY; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
              const idx = (y * 512 + x) * 4;
              d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
            }
          }
        }

        // 3. Remove text if specified
        if (conf.removeText) {
          for (let y = 0; y < 55; y++) {
            for (let x = 0; x < 512; x++) {
              // Special case for Valerius raising sword in cell 1:
              if (conf.name === "boss-valerius" && cellIdx === 1) {
                // The diagonal sword upper edge: anything above the sword is cleared!
                // Sword reaches from ~ (280, 100) to (430, 24)
                const swordTopY = 140 - ((x - 175) * 115) / 255;
                if (y < swordTopY - 2 || x < 330) {
                  const idx = (y * 512 + x) * 4;
                  d[idx] = 255; d[idx+1] = 255; d[idx+2] = 255; d[idx+3] = 255;
                }
                continue;
              }

              // Normal text region: clear y < 55
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
            d[i + 3] = 0; // Transparent background
          } else if (min > 215) {
            d[i + 3] = Math.round(((238 - min) / 23) * 255);
          } else if (min > 180 && max - min < 25) {
            d[i + 3] = Math.max(0, d[i + 3] - 80);
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
    const targetFile = `public/sprites/${s.name}.png`;
    fs.writeFileSync(targetFile, pngBuffer);
    console.log(`Saved ${targetFile} (${pngBuffer.length} bytes)`);

    if (s.name === "boss-dracula") {
      fs.writeFileSync("public/sprites/dracula.png", pngBuffer);
      console.log(`Saved public/sprites/dracula.png (${pngBuffer.length} bytes)`);
    }
  }

  await browser.close();
  console.log("All pixel-art sprites built and saved directly to public/sprites/!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
