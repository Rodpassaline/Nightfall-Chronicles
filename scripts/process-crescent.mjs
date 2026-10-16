import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC_FILE = path.join(BRAIN, "crescent_blade_wave_spritesheet_1792102912762.jpg");
const DEST_FILE = "public/sprites/crescent-slash.png";

async function main() {
  console.log("Processing crescent slash from:", SRC_FILE);
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
    srcC.width = img.naturalWidth;
    srcC.height = img.naturalHeight;
    const srcCtx = srcC.getContext("2d", { willReadFrequently: true });
    srcCtx.drawImage(img, 0, 0);

    const outC = document.createElement("canvas");
    outC.width = 512;
    outC.height = 512; // 2x2 grid of 256x256
    const outCtx = outC.getContext("2d");

    // Exact non-overlapping horizontal frames
    const frames = [
      { minX: 30, maxX: 275 },
      { minX: 310, maxX: 655 },
      { minX: 675, maxX: 1010 },
      { minX: 1012, maxX: 1350 },
    ];

    for (let f = 0; f < 4; f++) {
      const box = frames[f];
      const fw = box.maxX - box.minX;
      const fh = img.naturalHeight;

      const frameData = srcCtx.getImageData(box.minX, 0, fw, fh);
      const d = frameData.data;

      // Find vertical bounds
      let minY = fh, maxY = 0, actualMinX = fw, actualMaxX = 0;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const idx = (y * fw + x) * 4;
          const maxVal = Math.max(d[idx], d[idx + 1], d[idx + 2]);
          if (maxVal > 20) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            if (x < actualMinX) actualMinX = x;
            if (x > actualMaxX) actualMaxX = x;
          }
        }
      }

      if (actualMinX > actualMaxX || minY > maxY) continue;

      const croppedW = actualMaxX - actualMinX + 1;
      const croppedH = maxY - minY + 1;

      const singleC = document.createElement("canvas");
      singleC.width = croppedW;
      singleC.height = croppedH;
      const singleCtx = singleC.getContext("2d");
      const singleData = singleCtx.createImageData(croppedW, croppedH);
      const sd = singleData.data;

      for (let y = 0; y < croppedH; y++) {
        for (let x = 0; x < croppedW; x++) {
          const srcIdx = ((minY + y) * fw + (actualMinX + x)) * 4;
          const dstIdx = (y * croppedW + x) * 4;

          const r = d[srcIdx];
          const g = d[srcIdx + 1];
          const b = d[srcIdx + 2];
          const maxVal = Math.max(r, g, b);

          if (maxVal <= 18) {
            sd[dstIdx + 3] = 0;
          } else if (maxVal < 38) {
            const a = (maxVal - 18) / 20;
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

      // Target quadrant: cell 0 (row 0, col 0), cell 1 (row 0, col 1), cell 2 (row 1, col 0), cell 3 (row 1, col 1)
      const col = f % 2;
      const row = Math.floor(f / 2);
      const cellX = col * 256;
      const cellY = row * 256;

      const scale = Math.min(235 / croppedW, 235 / croppedH);
      const drawW = croppedW * scale;
      const drawH = croppedH * scale;
      const drawX = cellX + (256 - drawW) / 2;
      const drawY = cellY + (256 - drawH) / 2;

      outCtx.imageSmoothingEnabled = false;
      outCtx.drawImage(singleC, drawX, drawY, drawW, drawH);
    }

    return outC.toDataURL("image/png").split(",")[1];
  }, b64);

  fs.writeFileSync(DEST_FILE, Buffer.from(resultBase64, "base64"));
  fs.writeFileSync("screenshots/crescent_slash_refined.png", Buffer.from(resultBase64, "base64"));
  console.log("Refined crescent slash saved to:", DEST_FILE);
  await browser.close();
}

main().catch(console.error);
