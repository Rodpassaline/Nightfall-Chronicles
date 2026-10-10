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

  // Background removal + defringe
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  const minC = (p) => Math.min(d[p*4], d[p*4+1], d[p*4+2]);
  const luma = (p) => 0.299 * d[p*4] + 0.587 * d[p*4+1] + 0.114 * d[p*4+2];

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

  // Trapped pockets
  const visited = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (bg[s] || visited[s] || minC(s) < 215) continue;
    const comp = [s]; visited[s] = 1;
    let head = 0;
    while (head < comp.length) {
      const p = comp[head++];
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (!bg[np] && !visited[np] && minC(np) >= 210) { visited[np] = 1; comp.push(np); }
      }
    }
    if (comp.length >= 6) for (const p of comp) bg[p] = 1;
  }

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;

  for (const th of [{ min: 115, lum: 125 }, { min: 130, lum: 140 }, { min: 150, lum: 160 }]) {
    const toKill = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!alpha[p]) continue;
        const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
        if (isBorder && (minC(p) > th.min || luma(p) > th.lum)) toKill.push(p);
      }
    }
    for (const p of toKill) alpha[p] = 0;
  }
  for (let p = 0; p < W * H; p++) d[p*4+3] = alpha[p];
  ctx.putImageData(imgData, 0, 0);

  // Helper to extract a crop
  function cropFrame(sx, sy, sw, sh) {
    const fc = document.createElement("canvas");
    fc.width = sw; fc.height = sh;
    fc.getContext("2d").drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
    return fc;
  }

  // R1: 10, 700, 158, 142
  const r1 = cropFrame(10, 700, 158, 142);
  // R2: 181, 700, 149, 144
  const r2 = cropFrame(181, 700, 149, 144);

  // Build R1_alt
  function makeAlt(srcCanvas, hipX, legTopY) {
    const w = srcCanvas.width, h = srcCanvas.height;
    const altCanvas = document.createElement("canvas");
    altCanvas.width = w; altCanvas.height = h;
    const actx = altCanvas.getContext("2d");
    actx.drawImage(srcCanvas, 0, 0);

    const srcData = srcCanvas.getContext("2d").getImageData(0, 0, w, h);
    const altData = actx.getImageData(0, 0, w, h);

    // Clear leg area below legTopY
    for (let y = legTopY; y < h; y++) {
      for (let x = 30; x < w - 5; x++) {
        altData.data[(y * w + x) * 4 + 3] = 0;
      }
    }

    for (let y = legTopY; y < h; y++) {
      for (let x = 30; x < w - 5; x++) {
        const srcIdx = (y * w + x) * 4;
        if (srcData.data[srcIdx + 3] === 0) continue;
        const r = srcData.data[srcIdx], g = srcData.data[srcIdx+1], b = srcData.data[srcIdx+2];

        if (x >= hipX) {
          // Front leg -> move to back
          const destX = Math.round(hipX - (x - hipX) * 0.9);
          if (destX >= 0 && destX < w) {
            const destIdx = (y * w + destX) * 4;
            altData.data[destIdx] = Math.round(r * 0.72);
            altData.data[destIdx+1] = Math.round(g * 0.72);
            altData.data[destIdx+2] = Math.round(b * 0.72);
            altData.data[destIdx+3] = 255;
          }
        } else {
          // Back leg -> move to front
          const destX = Math.round(hipX + (hipX - x) * 1.05);
          if (destX >= 0 && destX < w) {
            const destIdx = (y * w + destX) * 4;
            altData.data[destIdx] = Math.min(255, Math.round(r * 1.3));
            altData.data[destIdx+1] = Math.min(255, Math.round(g * 1.3));
            altData.data[destIdx+2] = Math.min(255, Math.round(b * 1.3));
            altData.data[destIdx+3] = 255;
          }
        }
      }
    }
    actx.putImageData(altData, 0, 0);
    return altCanvas;
  }

  const r1Alt = makeAlt(r1, 84, 80);
  const r2Alt = makeAlt(r2, 78, 80);

  // Preview all 4 on game floor
  const preview = document.createElement("canvas");
  preview.width = 720; preview.height = 200;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#140e1a";
  pctx.fillRect(0, 0, 720, 200);
  pctx.fillStyle = "#e2a23a";
  pctx.fillRect(0, 165, 720, 2);

  const framesList = [
    { name: "Frame 0: R1 (Right fwd)", c: r1 },
    { name: "Frame 1: R2 (Right pass)", c: r2 },
    { name: "Frame 2: R1_alt (Left fwd)", c: r1Alt },
    { name: "Frame 3: R2_alt (Left pass)", c: r2Alt },
  ];

  framesList.forEach((f, i) => {
    pctx.drawImage(f.c, i * 175 + 10, 20);
    pctx.fillStyle = "#fff";
    pctx.font = "12px sans-serif";
    pctx.fillText(f.name, i * 175 + 10, 185);
  });

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-4frame-alternating.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-4frame-alternating.png");
