import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const OUT_DIR = path.join(process.cwd(), "public/sprites");

// Exact target heights and baseline positions matching normal living sprites 1:1
const CONFIGS = [
  {
    key: "hero-die",
    file: "aldric_death_spritesheet_1791978525887.jpg",
    cellSize: 320,
    thresh: 14,
    targetStandingH: 185, // Full 1:1 scale matching living Aldric's body volume (shoulders 115px wide)
    targetBaselineY: 265, // EXACT match to hero-idle (maxY: 265, bottomPadding: 55px)
    standingFrame: 0,
  },
  {
    key: "zombie-die",
    file: "zombie_death_sequence_pure_black_1791978651862.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 236, // Exact 1:1 match to zombie.png
    targetBaselineY: 246,
    standingFrame: 0,
  },
  {
    key: "skeleton-die",
    file: "skeleton_death_animation_sequence_black_bg_1791978649103.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 224, // Matches living skeleton's large skull and ribcage
    targetBaselineY: 238,
    standingFrame: 0,
  },
  {
    key: "knight-die",
    file: "knight_death_spritesheet_black_bg_1791978644632.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 248, // Heavy armored warrior matching knight.png
    targetBaselineY: 252,
    standingFrame: 0,
  },
  {
    key: "armored-skeleton-die",
    file: "armored_skeleton_death_sequence_1791978733689.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 235, // Full brass armor & shield matching armored-skeleton.png
    targetBaselineY: 250,
    standingFrame: 0,
  },
  {
    key: "red-skeleton-die",
    file: "red_skeleton_death_sequence_1791978732640.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 205, // Broad cursed skeleton matching red-skeleton.png width
    targetBaselineY: 244,
    standingFrame: 0,
  },
  {
    key: "gargoyle-die",
    file: "gargoyle_death_sequence_1791978734312.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 248, // Massive stone demon matching gargoyle.png
    targetBaselineY: 252,
    standingFrame: 0,
  },
  {
    key: "vampire-die",
    file: "vampire_death_animation_spritesheet_fixed_1791978764963.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 204, // Noble vampire matching vampire.png
    targetBaselineY: 238,
    standingFrame: 0,
  },
  {
    key: "bat-die",
    file: "bat_death_animation_1791978624469.jpg",
    cellSize: 256,
    thresh: 14,
    targetStandingH: 174, // Aerial bat matching bat.png
    targetBaselineY: 240,
    standingFrame: 0,
    isAerial: true,
  },
];

async function main() {
  console.log("Iniciando reconstrução dos spritesheets com escala e baseline idênticos aos personagens vivos...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  for (const cfg of CONFIGS) {
    const fullPath = path.join(BRAIN, cfg.file);
    if (!fs.existsSync(fullPath)) {
      console.error("Arquivo não encontrado:", fullPath);
      continue;
    }

    const b64 = fs.readFileSync(fullPath).toString("base64");
    console.log(`Processando ${cfg.key}...`);

    const resultDataUrl = await page.evaluate(
      async ({ b64, cellSize, thresh, targetStandingH, targetBaselineY, standingFrame, isAerial }) => {
        function loadImage(src) {
          return new Promise((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = src;
          });
        }

        const srcImg = await loadImage("data:image/jpeg;base64," + b64);
        const srcW = srcImg.width;
        const srcH = srcImg.height;

        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = srcW;
        srcCanvas.height = srcH;
        const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
        srcCtx.drawImage(srcImg, 0, 0);

        const frameW = Math.floor(srcW / 4);
        const frameH = srcH;

        // Extract and background-key each of the 4 frames using BFS border fill
        const keyedCanvases = [];
        const frameBoxes = [];

        for (let f = 0; f < 4; f++) {
          const fx = f * frameW;
          const frameData = srcCtx.getImageData(fx, 0, frameW, frameH);
          const d = frameData.data;

          const isBg = new Uint8Array(frameW * frameH);
          const queue = [];

          const isDark = (x, y) => {
            const idx = (y * frameW + x) * 4;
            return Math.max(d[idx], d[idx + 1], d[idx + 2]) <= thresh;
          };

          for (let x = 0; x < frameW; x++) {
            if (isDark(x, 0)) { isBg[0 * frameW + x] = 1; queue.push(x, 0); }
            if (isDark(x, frameH - 1)) { isBg[(frameH - 1) * frameW + x] = 1; queue.push(x, frameH - 1); }
          }
          for (let y = 0; y < frameH; y++) {
            if (!isBg[y * frameW + 0] && isDark(0, y)) { isBg[y * frameW + 0] = 1; queue.push(0, y); }
            if (!isBg[y * frameW + (frameW - 1)] && isDark(frameW - 1, y)) { isBg[y * frameW + (frameW - 1)] = 1; queue.push(frameW - 1, y); }
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
              if (nx >= 0 && nx < frameW && ny >= 0 && ny < frameH) {
                const np = ny * frameW + nx;
                if (!isBg[np] && isDark(nx, ny)) {
                  isBg[np] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }

          // Remove disconnected small islands (e.g. halberd tips or feet bleeding across slice boundaries)
          const compId = new Int32Array(frameW * frameH).fill(-1);
          const compSizes = [];
          let curId = 0;

          for (let y = 0; y < frameH; y++) {
            for (let x = 0; x < frameW; x++) {
              const p = y * frameW + x;
              if (isBg[p] || compId[p] !== -1) continue;

              let sz = 0;
              const q = [x, y];
              compId[p] = curId;

              let qHead = 0;
              while (qHead < q.length) {
                const cx = q[qHead++];
                const cy = q[qHead++];
                sz++;

                const nbs = [
                  [cx + 1, cy],
                  [cx - 1, cy],
                  [cx, cy + 1],
                  [cx, cy - 1],
                ];
                for (let i = 0; i < 4; i++) {
                  const nx = nbs[i][0];
                  const ny = nbs[i][1];
                  if (nx >= 0 && nx < frameW && ny >= 0 && ny < frameH) {
                    const np = ny * frameW + nx;
                    if (!isBg[np] && compId[np] === -1) {
                      compId[np] = curId;
                      q.push(nx, ny);
                    }
                  }
                }
              }
              compSizes.push(sz);
              curId++;
            }
          }

          // Largest component is the character
          let maxSz = 0, mainComp = -1;
          for (let i = 0; i < compSizes.length; i++) {
            if (compSizes[i] > maxSz) {
              maxSz = compSizes[i];
              mainComp = i;
            }
          }

          let minX = frameW, maxX = 0, minY = frameH, maxY = 0;
          let count = 0;
          for (let y = 0; y < frameH; y++) {
            for (let x = 0; x < frameW; x++) {
              const p = y * frameW + x;
              const idx = p * 4;
              // Keep pixel only if in a significant component (> 15% of mainComp)
              const id = compId[p];
              if (isBg[p] || id === -1 || (id !== mainComp && compSizes[id] < maxSz * 0.12)) {
                d[idx + 3] = 0; // transparent
              } else {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                count++;
              }
            }
          }

          if (count === 0) {
            minX = 0; maxX = frameW - 1; minY = 0; maxY = frameH - 1;
          }

          const temp = document.createElement("canvas");
          temp.width = frameW;
          temp.height = frameH;
          const tempCtx = temp.getContext("2d");
          tempCtx.putImageData(frameData, 0, 0);

          keyedCanvases.push(temp);
          frameBoxes.push({ minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });
        }

        const standingSourceH = frameBoxes[standingFrame].h;

        // UNIFORM SCALE: Calibrated so the character in death animation is 100% IDENTICAL
        // in body mass, shoulders, and head to the living character sprite (NO SHRINKING!):
        const uniformScale = targetStandingH / standingSourceH;

        // Output canvas: 2x2 grid
        const outCanvas = document.createElement("canvas");
        outCanvas.width = cellSize * 2;
        outCanvas.height = cellSize * 2;
        const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
        outCtx.imageSmoothingEnabled = false;

        for (let f = 0; f < 4; f++) {
          const b = frameBoxes[f];
          const col = f % 2;
          const row = Math.floor(f / 2);
          const cellX = col * cellSize;
          const cellY = row * cellSize;

          const scaledW = b.w * uniformScale;
          const scaledH = b.h * uniformScale;

          // Center horizontally in cell
          const destX = cellX + (cellSize - scaledW) / 2;

          let destY;
          if (isAerial) {
            // Aerial enemy (Bat): center vertically in the cell so it stays in mid-air
            destY = cellY + (cellSize - scaledH) / 2;
          } else {
            // GROUND CHARACTERS: Every single frame is anchored FIRMLY TO THE FLOOR!
            // The bottom of the character (feet in frame 0, knees in frame 1,
            // hands/torso in frame 2, flat body/rubble in frame 3) touches targetBaselineY.
            // NO MIDAIR COLLAPSING! NO ENCOLHIMENTO NO ALTO!
            destY = cellY + targetBaselineY - scaledH;
          }

          outCtx.save();
          outCtx.beginPath();
          outCtx.rect(cellX, cellY, cellSize, cellSize);
          outCtx.clip();
          outCtx.drawImage(
            keyedCanvases[f],
            b.minX, b.minY, b.w, b.h,
            Math.round(destX), Math.round(destY), Math.round(scaledW), Math.round(scaledH)
          );
          outCtx.restore();
        }

        return outCanvas.toDataURL("image/png");
      },
      {
        b64,
        cellSize: cfg.cellSize,
        thresh: cfg.thresh,
        targetStandingH: cfg.targetStandingH,
        targetBaselineY: cfg.targetBaselineY,
        standingFrame: cfg.standingFrame,
        isAerial: !!cfg.isAerial,
      }
    );

    const outBuffer = Buffer.from(resultDataUrl.split(",")[1], "base64");
    const outFilePath = path.join(OUT_DIR, `${cfg.key}.png`);
    fs.writeFileSync(outFilePath, outBuffer);
    console.log(`Perfeito (1:1 scale, chão cravado): ${cfg.key}.png salvo (${outBuffer.length} bytes)`);
  }

  await browser.close();
  console.log("Todos os spritesheets de morte reconstruídos com escala 1:1 e chão cravado!");
}

main().catch(console.error);
