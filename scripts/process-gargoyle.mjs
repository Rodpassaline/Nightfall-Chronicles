import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC_FILE = path.join(BRAIN, "gargoyle_spritesheet_1792066731614.jpg");
const DEST_FILE = "public/sprites/gargoyle.png";

async function main() {
  console.log("Processing gargoyle sprite sheet from:", SRC_FILE);
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  const b64 = fs.readFileSync(SRC_FILE).toString("base64");

  const resultDataUrl = await page.evaluate(async (b64) => {
    function loadImage(src) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    const srcImg = await loadImage("data:image/jpeg;base64," + b64);
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = 1024;
    srcCanvas.height = 1024;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    srcCtx.drawImage(srcImg, 0, 0);

    const outCanvas = document.createElement("canvas");
    outCanvas.width = 256;
    outCanvas.height = 256;
    const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });

    // Process each 512x512 cell in the 2x2 grid
    const thresh = 25; // black background threshold

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const cellX = col * 512;
        const cellY = row * 512;
        const cellData = srcCtx.getImageData(cellX, cellY, 512, 512);
        const d = cellData.data;

        // BFS flood fill from cell borders to mark background
        const isBg = new Uint8Array(512 * 512);
        const queue = [];

        const isDark = (x, y) => {
          const idx = (y * 512 + x) * 4;
          return Math.max(d[idx], d[idx + 1], d[idx + 2]) <= thresh;
        };

        for (let x = 0; x < 512; x++) {
          if (isDark(x, 0)) { isBg[0 * 512 + x] = 1; queue.push(x, 0); }
          if (isDark(x, 511)) { isBg[511 * 512 + x] = 1; queue.push(x, 511); }
        }
        for (let y = 0; y < 512; y++) {
          if (!isBg[y * 512 + 0] && isDark(0, y)) { isBg[y * 512 + 0] = 1; queue.push(0, y); }
          if (!isBg[y * 512 + 511] && isDark(511, y)) { isBg[y * 512 + 511] = 1; queue.push(511, y); }
        }

        let head = 0;
        while (head < queue.length) {
          const qx = queue[head++];
          const qy = queue[head++];
          const neighbors = [
            [qx + 1, qy],
            [qx - 1, qy],
            [qx, qy + 1],
            [qx, qy - 1],
          ];
          for (let i = 0; i < 4; i++) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];
            if (nx >= 0 && nx < 512 && ny >= 0 && ny < 512) {
              const np = ny * 512 + nx;
              if (!isBg[np] && isDark(nx, ny)) {
                isBg[np] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }

        // Find bounding box of character content
        let minX = 512, maxX = 0, minY = 512, maxY = 0;
        for (let y = 0; y < 512; y++) {
          for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            if (isBg[y * 512 + x]) {
              d[idx + 3] = 0; // Transparent
            } else {
              // Edge smoothing for dark border pixels
              const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
              if (maxC <= thresh + 15) {
                d[idx + 3] = Math.round(((maxC - thresh) / 15) * 255);
              }
              if (d[idx + 3] > 30) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        // Put transparent image data into temporary canvas
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 512;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.putImageData(cellData, 0, 0);

        // Target cell in 256x256 is 128x128
        const targetX = col * 128;
        const targetY = row * 128;

        // Downscale smoothly to 128x128
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = "high";
        outCtx.drawImage(tempCanvas, 0, 0, 512, 512, targetX, targetY, 128, 128);
      }
    }

    return outCanvas.toDataURL("image/png");
  }, b64);

  const buffer = Buffer.from(resultDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync(DEST_FILE, buffer);
  console.log(`Saved 256x256 transparent gargoyle spritesheet to ${DEST_FILE} (${buffer.length} bytes)`);

  await browser.close();
}

main().catch(console.error);
