import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC = BRAIN + ".user_uploaded/media_1791574631581_7077f7dd.jpg";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const b64 = fs.readFileSync(SRC).toString("base64");

await page.evaluate(async (srcB64) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + srcB64; });
  const W = img.width, H = img.height;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  const minC = (p) => Math.min(d[p*4], d[p*4+1], d[p*4+2]);
  const luma = (p) => 0.299 * d[p*4] + 0.587 * d[p*4+1] + 0.114 * d[p*4+2];

  // 1. Flood fill outer background
  const bg = new Uint8Array(W * H);
  const stack = [];
  const pushBg = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (bg[p] || minC(p) < 210) return;
    bg[p] = 1; stack.push(p);
  };
  for (let x = 0; x < W; x++) { pushBg(x, 0); pushBg(x, H - 1); }
  for (let y = 0; y < H; y++) { pushBg(0, y); pushBg(W - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    pushBg(x + 1, y); pushBg(x - 1, y); pushBg(x, y + 1); pushBg(x, y - 1);
  }

  // 2. Clear any enclosed white pockets (> 8 pixels of pure white minC >= 215)
  const visited = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (bg[s] || visited[s] || minC(s) < 215) continue;
    const comp = [s];
    visited[s] = 1;
    let head = 0;
    while (head < comp.length) {
      const p = comp[head++];
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (!bg[np] && !visited[np] && minC(np) >= 210) {
          visited[np] = 1;
          comp.push(np);
        }
      }
    }
    // If pocket is larger than 6 pixels, it's white background paper trapped in holes (e.g. P2)
    if (comp.length >= 6) {
      for (const p of comp) bg[p] = 1;
    }
  }

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;

  // 3. Multi-pass aggressive defringe of border halo
  // Pass 1: any border pixel with minC > 115 or luma > 125
  // Pass 2: any border pixel with minC > 135 or luma > 145
  // Pass 3: any border pixel with minC > 160 or luma > 170
  const thresholds = [
    { min: 115, lum: 125 },
    { min: 130, lum: 140 },
    { min: 150, lum: 160 },
  ];

  for (const th of thresholds) {
    const toKill = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!alpha[p]) continue;
        const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
        if (isBorder && (minC(p) > th.min || luma(p) > th.lum)) {
          toKill.push(p);
        }
      }
    }
    for (const p of toKill) alpha[p] = 0;
  }

  // 4. Color decontamination:
  // For remaining border pixels, clamp their color towards adjacent interior pixels to eliminate white bleed
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (!alpha[p]) continue;
      const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
      if (!isBorder) continue;

      // Find best solid interior neighbor (neighbor whose 4-neighbors are all solid)
      let bestIn = -1, minLum = 999;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[ -1,-1],[1,-1],[-1,1],[1,1]]) {
        const np = (y + dy) * W + (x + dx);
        if (alpha[np]) {
          const l = luma(np);
          if (l < minLum) { minLum = l; bestIn = np; }
        }
      }
      if (bestIn >= 0 && luma(p) > minLum + 20) {
        // Clamp to darker interior tone to remove white flare
        d[p*4] = Math.min(d[p*4], d[bestIn*4] + 25);
        d[p*4+1] = Math.min(d[p*4+1], d[bestIn*4+1] + 25);
        d[p*4+2] = Math.min(d[p*4+2], d[bestIn*4+2] + 25);
      }
    }
  }

  // Apply alpha back to imageData
  for (let p = 0; p < W * H; p++) {
    d[p*4+3] = alpha[p];
  }
  ctx.putImageData(imgData, 0, 0);

  // Render comparison against dark game-like background
  const preview = document.createElement("canvas");
  preview.width = 960; preview.height = 360;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#0c0810"; // Very dark background like the game
  pctx.fillRect(0, 0, 960, 360);

  // Draw some key sprites: Idle (A5), Run (R1, R2), Jump (P1, P2), Guard (F3)
  const crops = [
    { name: "P1", sx: 25, sy: 40, sw: 150, sh: 160 },
    { name: "P2", sx: 205, sy: 40, sw: 150, sh: 160 },
    { name: "A5", sx: 800, sy: 220, sw: 150, sh: 160 },
    { name: "R1", sx: 20, sy: 685, sw: 150, sh: 160 },
    { name: "R2", sx: 185, sy: 685, sw: 150, sh: 160 },
    { name: "F3", sx: 310, sy: 540, sw: 150, sh: 160 },
  ];
  crops.forEach((cr, i) => {
    pctx.drawImage(c, cr.sx, cr.sy, cr.sw, cr.sh, i * 160, 20, cr.sw, cr.sh);
    pctx.fillStyle = "#fff";
    pctx.font = "14px sans-serif";
    pctx.fillText(cr.name, i * 160 + 50, 200);
  });

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-defringe-dark.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-defringe-dark.png");
