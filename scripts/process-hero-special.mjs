import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC_FILE = path.join(BRAIN, "aldric_vale_crescent_thrust_spritesheet_1792103566163.jpg");
const DEST_FILE = "public/sprites/hero-special.png";

async function main() {
  console.log("Processing Aldric special attack sprites from:", SRC_FILE);
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  const b64 = fs.readFileSync(SRC_FILE).toString("base64");

  const resultBase64 = await page.evaluate(async (b64) => {
    function loadImg(src) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    const img = await loadImg("data:image/jpeg;base64," + b64);
    const srcC = document.createElement("canvas");
    srcC.width = 1024;
    srcC.height = 1024;
    const srcCtx = srcC.getContext("2d", { willReadFrequently: true });
    srcCtx.drawImage(img, 0, 0);

    const outC = document.createElement("canvas");
    outC.width = 640;
    outC.height = 640; // 2x2 grid of 320x320
    const outCtx = outC.getContext("2d");

    // 4 quadrants: (row 0, col 0), (row 0, col 1), (row 1, col 0), (row 1, col 1)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const qX = col * 512;
        const qY = row * 512;
        const qData = srcCtx.getImageData(qX, qY, 512, 512);
        const d = qData.data;

        // Find bounding box of character in this quadrant
        let minX = 512, maxX = 0, minY = 512, maxY = 0;
        for (let y = 0; y < 512; y++) {
          for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            const maxVal = Math.max(d[idx], d[idx + 1], d[idx + 2]);
            if (maxVal > 22) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (minX > maxX || minY > maxY) continue;

        const cw = maxX - minX + 1;
        const ch = maxY - minY + 1;

        const singleC = document.createElement("canvas");
        singleC.width = cw;
        singleC.height = ch;
        const singleCtx = singleC.getContext("2d");
        const singleData = singleCtx.createImageData(cw, ch);
        const sd = singleData.data;

        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const srcIdx = ((minY + y) * 512 + (minX + x)) * 4;
            const dstIdx = (y * cw + x) * 4;

            const r = d[srcIdx];
            const g = d[srcIdx + 1];
            const b = d[srcIdx + 2];
            const maxVal = Math.max(r, g, b);

            if (maxVal <= 18) {
              sd[dstIdx + 3] = 0;
            } else if (maxVal < 36) {
              const a = (maxVal - 18) / 18;
              sd[dstIdx] = r;
              sd[dstIdx + 1] = g;
              sd[dstIdx + 2] = b;
              sd[dstIdx + 3] = Math.round(a * 255);
            } else {
              sd[dstIdx] = r;
              sd[dstIdx + 1] = g;
              sd[dstIdx + 2] = b;
              sd[dstIdx + 3] = 255;
            }
          }
        }
        singleCtx.putImageData(singleData, 0, 0);

        // Target cell in 2x2 grid (cell size 320x320)
        const cellX = col * 320;
        const cellY = row * 320;

        // Aldric standard height scale (~170px high, with boots touching y=264 in the 320x320 cell)
        // In the slash release frame (row 1, col 0), the crescent arc extends high, so let's scale by body height
        let scale = 175 / ch;
        // For frames with large arcs (row 1, col 0 and row 1, col 1), let's ensure it doesn't exceed 250px height
        if (ch > 250) {
          scale = Math.min(scale, 240 / ch);
        }
        // Normalize body size to look consistent with hero-attack (~170px)
        if (row === 0 && col === 0) scale = 175 / ch;
        if (row === 0 && col === 1) scale = 165 / ch;
        if (row === 1 && col === 0) scale = 220 / ch;
        if (row === 1 && col === 1) scale = 180 / ch;

        const drawW = cw * scale;
        const drawH = ch * scale;
        const drawX = cellX + 160 - drawW * 0.45;
        const drawY = cellY + 264 - drawH; // Boots aligned at y = 264

        outCtx.imageSmoothingEnabled = false;
        outCtx.drawImage(singleC, drawX, drawY, drawW, drawH);
      }
    }

    return outC.toDataURL("image/png").split(",")[1];
  }, b64);

  fs.writeFileSync(DEST_FILE, Buffer.from(resultBase64, "base64"));
  fs.writeFileSync("screenshots/hero_special_refined.png", Buffer.from(resultBase64, "base64"));
  console.log("Refined Aldric special attack sheet saved to:", DEST_FILE);
  await browser.close();
}

main().catch(console.error);
