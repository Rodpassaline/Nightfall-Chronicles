import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const BOSS_JOBS = [
  {
    name: "Boss 1 Phase 2 (Petros Awakened)",
    src: path.join(BRAIN, "boss1_petros_awakened_spritesheet_1792283612369.jpg"),
    dest: "public/sprites/boss-petros-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 2 Phase 2 (Valerius Berserker)",
    src: path.join(BRAIN, "valerius_berserker_spritesheet_clean_1792283635971.jpg"),
    dest: "public/sprites/boss-valerius-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 3 Phase 2 (Seraphine Ascended)",
    src: path.join(BRAIN, "boss3_seraphine_ascended_spritesheet_1792283609194.jpg"),
    dest: "public/sprites/boss-seraphine-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 4 Phase 2 (Nocturne Mutated)",
    src: path.join(BRAIN, "boss4_nocturne_mutated_black_bg_1792283658020.jpg"),
    dest: "public/sprites/boss-nocturne-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 5 Phase 2 (Veyne Arch-Lich)",
    src: path.join(BRAIN, "boss5_phase2_arch_lich_spritesheet_1792283608544.jpg"),
    dest: "public/sprites/boss-veyne-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 6 Phase 2 (Calx Overdrive)",
    src: path.join(BRAIN, "boss6_calx_overdrive_spritesheet_1792283615067.jpg"),
    dest: "public/sprites/boss-calx-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
  {
    name: "Boss 7 Phase 3 (Dracula True Demon)",
    src: path.join(BRAIN, "dracula_true_demon_spritesheet_solid_black_1792283658937.jpg"),
    dest: "public/sprites/boss-dracula-p2.png",
    bgMode: "black",
    cropTop: 0,
    cropBottom: 0,
    margin: 0,
  },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  for (const job of BOSS_JOBS) {
    console.log(`Processing ${job.name}...`);
    const b64 = fs.readFileSync(job.src).toString("base64");

    const resultDataUrl = await page.evaluate(
      async ({ b64, bgMode, cropBottom, margin }) => {
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
        srcCtx.drawImage(srcImg, 0, 0, 1024, 1024);

        const outCanvas = document.createElement("canvas");
        outCanvas.width = 256;
        outCanvas.height = 256;
        const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });

        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 2; col++) {
            const cellX = col * 512;
            const cellY = row * 512;
            const cellData = srcCtx.getImageData(cellX, cellY, 512, 512);
            const d = cellData.data;

            // Clear margin or bottom text crop first
            const maxValidY = row === 1 && cropBottom > 0 ? 512 - cropBottom : 512 - margin;
            const minValidY = margin;
            const minValidX = margin;
            const maxValidX = 512 - margin;

            for (let y = 0; y < 512; y++) {
              for (let x = 0; x < 512; x++) {
                if (y < minValidY || y >= maxValidY || x < minValidX || x >= maxValidX) {
                  const idx = (y * 512 + x) * 4;
                  if (bgMode === "white") {
                    d[idx] = 255;
                    d[idx + 1] = 255;
                    d[idx + 2] = 255;
                  } else {
                    d[idx] = 0;
                    d[idx + 1] = 0;
                    d[idx + 2] = 0;
                  }
                }
              }
            }

            const isBg = new Uint8Array(512 * 512);
            const queue = [];

            const matchBg = (x, y) => {
              const idx = (y * 512 + x) * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              if (bgMode === "white") {
                return r >= 235 && g >= 235 && b >= 235;
              } else {
                return Math.max(r, g, b) <= 13;
              }
            };

            for (let x = 0; x < 512; x++) {
              if (matchBg(x, 0)) { isBg[0 * 512 + x] = 1; queue.push(x, 0); }
              if (matchBg(x, 511)) { isBg[511 * 512 + x] = 1; queue.push(x, 511); }
            }
            for (let y = 0; y < 512; y++) {
              if (!isBg[y * 512 + 0] && matchBg(0, y)) { isBg[y * 512 + 0] = 1; queue.push(0, y); }
              if (!isBg[y * 512 + 511] && matchBg(511, y)) { isBg[y * 512 + 511] = 1; queue.push(511, y); }
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
                  if (!isBg[np] && matchBg(nx, ny)) {
                    isBg[np] = 1;
                    queue.push(nx, ny);
                  }
                }
              }
            }

            // Connected components of foreground to strip small stray bleed near borders
            const compId = new Int32Array(512 * 512);
            const compSizes = [0];
            const compMinDistCenter = [999999];
            let nextComp = 1;

            for (let y = 0; y < 512; y++) {
              for (let x = 0; x < 512; x++) {
                const p = y * 512 + x;
                if (!isBg[p] && compId[p] === 0) {
                  const id = nextComp++;
                  let size = 0;
                  let minDist = 999999;
                  const cq = [x, y];
                  compId[p] = id;
                  let ch = 0;
                  while (ch < cq.length) {
                    const cx = cq[ch++];
                    const cy = cq[ch++];
                    size++;
                    const distC = Math.hypot(cx - 256, cy - 256);
                    if (distC < minDist) minDist = distC;
                    for (let dy = -2; dy <= 2; dy++) {
                      for (let dx = -2; dx <= 2; dx++) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        if (nx >= 0 && nx < 512 && ny >= 0 && ny < 512) {
                          const np = ny * 512 + nx;
                          if (!isBg[np] && compId[np] === 0) {
                            compId[np] = id;
                            cq.push(nx, ny);
                          }
                        }
                      }
                    }
                  }
                  compSizes.push(size);
                  compMinDistCenter.push(minDist);
                }
              }
            }

            // Find main character component size
            const maxCompSize = Math.max(1, ...compSizes);

            let minX = 512, maxX = 0, minY = 512, maxY = 0;
            for (let y = 0; y < 512; y++) {
              for (let x = 0; x < 512; x++) {
                const p = y * 512 + x;
                const idx = p * 4;
                const cid = compId[p];
                // Strip background OR disconnected edge bleed fragments (small components far from center)
                const isStrayBleed =
                  cid > 0 &&
                  compSizes[cid] < maxCompSize * 0.15 &&
                  compMinDistCenter[cid] > 175;

                if (isBg[p] || isStrayBleed) {
                  d[idx + 3] = 0;
                } else {
                  const r = d[idx], g = d[idx + 1], b = d[idx + 2];
                  const maxC = Math.max(r, g, b);
                  if (maxC <= 22) {
                    d[idx + 3] = Math.round(((maxC - 13) / 9) * 255);
                  }
                  if (d[idx + 3] > 35) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
            }

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = 512;
            tempCanvas.height = 512;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.putImageData(cellData, 0, 0);

            const targetX = col * 128;
            const targetY = row * 128;

            if (maxX > minX && maxY > minY) {
              const bw = maxX - minX + 1;
              const bh = maxY - minY + 1;
              const scale = Math.min(122 / bw, 122 / bh);
              const dw = Math.round(bw * scale);
              const dh = Math.round(bh * scale);
              const dx = targetX + Math.round((128 - dw) / 2);
              const dy = targetY + (126 - dh);

              outCtx.imageSmoothingEnabled = true;
              outCtx.imageSmoothingQuality = "high";
              outCtx.drawImage(tempCanvas, minX, minY, bw, bh, dx, dy, dw, dh);
            } else {
              outCtx.drawImage(tempCanvas, 0, 0, 512, 512, targetX, targetY, 128, 128);
            }
          }
        }

        return outCanvas.toDataURL("image/png");
      },
      { b64, bgMode: job.bgMode, cropBottom: job.cropBottom, margin: job.margin }
    );

    const buffer = Buffer.from(resultDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
    fs.writeFileSync(job.dest, buffer);
    console.log(`Saved ${job.dest} (${buffer.length} bytes)`);
  }

  await browser.close();
}

main().catch(console.error);
