import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const OUT_DIR = path.join(process.cwd(), "public/sprites");

const DEATH_SHEETS = [
  {
    key: "hero-die",
    file: "aldric_death_spritesheet_1791978525887.jpg",
    cellSize: 320,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "zombie-die",
    file: "zombie_death_sequence_pure_black_1791978651862.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "skeleton-die",
    file: "skeleton_death_animation_sequence_black_bg_1791978649103.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "knight-die",
    file: "knight_death_spritesheet_black_bg_1791978644632.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "bat-die",
    file: "bat_death_animation_1791978624469.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: false, // In midair
  },
  {
    key: "armored-skeleton-die",
    file: "armored_skeleton_death_sequence_1791978733689.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "red-skeleton-die",
    file: "red_skeleton_death_sequence_1791978732640.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "gargoyle-die",
    file: "gargoyle_death_sequence_1791978734312.jpg",
    cellSize: 256,
    thresh: 4,
    alignFeet: true,
  },
  {
    key: "vampire-die",
    file: "vampire_death_animation_spritesheet_fixed_1791978764963.jpg",
    cellSize: 256,
    thresh: 12,
    alignFeet: true,
  },
];

async function main() {
  console.log("Iniciando processamento dos spritesheets de morte...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  for (const item of DEATH_SHEETS) {
    const fullPath = path.join(BRAIN, item.file);
    if (!fs.existsSync(fullPath)) {
      console.error("Arquivo não encontrado:", fullPath);
      continue;
    }

    const b64 = fs.readFileSync(fullPath).toString("base64");
    console.log(`Processando ${item.key} de ${item.file}...`);

    const resultDataUrl = await page.evaluate(
      async ({ b64, cellSize, thresh, alignFeet }) => {
        function loadImage(src) {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          });
        }

        const srcImg = await loadImage("data:image/jpeg;base64," + b64);
        const srcW = srcImg.width;
        const srcH = srcImg.height;

        // Draw source to canvas to get pixel data
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = srcW;
        srcCanvas.height = srcH;
        const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
        srcCtx.drawImage(srcImg, 0, 0);

        const frameW = Math.floor(srcW / 4);
        const frameH = srcH;

        // Target output canvas is a 2x2 grid (width: 2 * cellSize, height: 2 * cellSize)
        const outCanvas = document.createElement("canvas");
        outCanvas.width = cellSize * 2;
        outCanvas.height = cellSize * 2;
        const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });

        // Process each of the 4 frames
        for (let frameIdx = 0; frameIdx < 4; frameIdx++) {
          const fx = frameIdx * frameW;
          const fy = 0;

          // Extract frame image data
          const frameData = srcCtx.getImageData(fx, fy, frameW, frameH);
          const d = frameData.data;

          // BFS flood fill from borders to only key connected background black pixels
          const isBg = new Uint8Array(frameW * frameH);
          const queue = [];

          const isDark = (x, y) => {
            const idx = (y * frameW + x) * 4;
            return Math.max(d[idx], d[idx + 1], d[idx + 2]) <= thresh;
          };

          // Seed all 4 outer borders of the frame
          for (let x = 0; x < frameW; x++) {
            if (isDark(x, 0)) { isBg[0 * frameW + x] = 1; queue.push(x, 0); }
            if (isDark(x, frameH - 1)) { isBg[(frameH - 1) * frameW + x] = 1; queue.push(x, frameH - 1); }
          }
          for (let y = 0; y < frameH; y++) {
            if (!isBg[y * frameW + 0] && isDark(0, y)) { isBg[y * frameW + 0] = 1; queue.push(0, y); }
            if (!isBg[y * frameW + (frameW - 1)] && isDark(frameW - 1, y)) { isBg[y * frameW + (frameW - 1)] = 1; queue.push(frameW - 1, y); }
          }

          // Flood fill
          let qHead = 0;
          while (qHead < queue.length) {
            const cx = queue[qHead++];
            const cy = queue[qHead++];

            const neighbors = [
              cx - 1, cy,
              cx + 1, cy,
              cx, cy - 1,
              cx, cy + 1,
            ];

            for (let i = 0; i < neighbors.length; i += 2) {
              const nx = neighbors[i];
              const ny = neighbors[i + 1];
              if (nx >= 0 && nx < frameW && ny >= 0 && ny < frameH) {
                const nPos = ny * frameW + nx;
                if (!isBg[nPos] && isDark(nx, ny)) {
                  isBg[nPos] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }

          // Find bounding box of actual character pixels (non-background)
          let minX = frameW, maxX = 0, minY = frameH, maxY = 0;
          let charPixelCount = 0;

          for (let y = 0; y < frameH; y++) {
            for (let x = 0; x < frameW; x++) {
              const p = y * frameW + x;
              if (!isBg[p]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                charPixelCount++;
              }
            }
          }

          if (charPixelCount === 0) {
            minX = 0; maxX = frameW - 1; minY = 0; maxY = frameH - 1;
          }

          // Apply transparency only to flood-filled background pixels
          for (let y = 0; y < frameH; y++) {
            for (let x = 0; x < frameW; x++) {
              const p = y * frameW + x;
              const idx = p * 4;
              if (isBg[p]) {
                d[idx + 3] = 0; // 100% transparent
              }
            }
          }

          // Create temporary canvas for the keyed frame
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = frameW;
          tempCanvas.height = frameH;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.putImageData(frameData, 0, 0);

          // Calculate destination cell in 2x2 grid
          // Cell 0: (0, 0), Cell 1: (1, 0), Cell 2: (0, 1), Cell 3: (1, 1)
          const gridCol = frameIdx % 2;
          const gridRow = Math.floor(frameIdx / 2);
          const cellDestX = gridCol * cellSize;
          const cellDestY = gridRow * cellSize;

          // Scale and position inside the cell:
          // Keep aspect ratio, scale to fit nicely (e.g. max 82% of cell height)
          const contentW = Math.max(1, maxX - minX + 1);
          const contentH = Math.max(1, maxY - minY + 1);

          const maxTargetH = cellSize * 0.78;
          const maxTargetW = cellSize * 0.82;
          const scale = Math.min(maxTargetW / contentW, maxTargetH / contentH, 1.0);

          const drawW = contentW * scale;
          const drawH = contentH * scale;

          // Center horizontally inside cell
          const drawX = cellDestX + (cellSize - drawW) / 2;

          // Vertical alignment: if alignFeet, place bottom near cell bottom (with 8px padding)
          // otherwise center vertically
          let drawY;
          if (alignFeet) {
            const bottomMargin = cellSize * 0.08;
            drawY = cellDestY + cellSize - bottomMargin - drawH;
          } else {
            drawY = cellDestY + (cellSize - drawH) / 2;
          }

          // Draw cropped & scaled character into destination cell
          outCtx.imageSmoothingEnabled = false;
          outCtx.drawImage(
            tempCanvas,
            minX, minY, contentW, contentH,
            Math.round(drawX), Math.round(drawY), Math.round(drawW), Math.round(drawH)
          );
        }

        return outCanvas.toDataURL("image/png");
      },
      {
        b64,
        cellSize: item.cellSize,
        thresh: item.thresh,
        alignFeet: item.alignFeet,
      }
    );

    const outBuffer = Buffer.from(resultDataUrl.split(",")[1], "base64");
    const outFileName = `${item.key}.png`;
    const outFilePath = path.join(OUT_DIR, outFileName);
    fs.writeFileSync(outFilePath, outBuffer);
    console.log(`Salvo: ${outFilePath} (${outBuffer.length} bytes)`);
  }

  await browser.close();
  console.log("Todos os 9 spritesheets de morte foram gerados com SUCESSO!");
}

main().catch((err) => {
  console.error("Erro ao construir sprites de morte:", err);
  process.exit(1);
});
