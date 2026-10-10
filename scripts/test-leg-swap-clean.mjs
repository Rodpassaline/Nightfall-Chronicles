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

  // R1 box: minX: 10, minY: 700, maxX: 167, maxY: 841 (w: 158, h: 142)
  const r1Canvas = document.createElement("canvas");
  r1Canvas.width = 158; r1Canvas.height = 142;
  r1Canvas.getContext("2d").drawImage(c, 10, 700, 158, 142, 0, 0, 158, 142);

  // Create R1_alt by swapping the legs
  // In r1Canvas coordinates:
  // Hip/pelvis center is at x ~ 88, y ~ 78
  // Below y = 78:
  // Front leg: x in [80, 150], y in [78, 141]
  // Back leg: x in [30, 80], y in [78, 130]
  // Let's create an alternate frame
  const r1Alt = document.createElement("canvas");
  r1Alt.width = 158; r1Alt.height = 142;
  const actx = r1Alt.getContext("2d");
  // 1. Draw entire upper body & cape down to y = 80
  actx.drawImage(r1Canvas, 0, 0);

  // 2. Clear leg area below y = 80
  const r1Data = r1Canvas.getContext("2d").getImageData(0, 0, 158, 142);
  const altData = actx.getImageData(0, 0, 158, 142);

  // Clear legs below y = 80
  for (let y = 80; y < 142; y++) {
    for (let x = 30; x < 155; x++) {
      const idx = (y * 158 + x) * 4;
      altData.data[idx+3] = 0;
    }
  }

  // Hip pivot is around x = 84
  const hipX = 84;
  // Map front leg to back (darkened), and back leg to front (brightened)
  for (let y = 80; y < 142; y++) {
    for (let x = 30; x < 155; x++) {
      const srcIdx = (y * 158 + x) * 4;
      if (r1Data.data[srcIdx+3] === 0) continue;
      const r = r1Data.data[srcIdx], g = r1Data.data[srcIdx+1], b = r1Data.data[srcIdx+2];

      if (x >= hipX) {
        // Front leg -> move to back leg position!
        // In R1, front foot is at x ~ 125 (+41 from hip). Back foot is at x ~ 48 (-36 from hip).
        // Let's shift front leg backward by ~70px
        const destX = Math.round(hipX - (x - hipX) * 0.9);
        if (destX >= 0 && destX < 158) {
          const destIdx = (y * 158 + destX) * 4;
          // Darken to look like back leg in shadow
          altData.data[destIdx] = Math.round(r * 0.72);
          altData.data[destIdx+1] = Math.round(g * 0.72);
          altData.data[destIdx+2] = Math.round(b * 0.72);
          altData.data[destIdx+3] = 255;
        }
      } else {
        // Back leg -> move to front leg position!
        const destX = Math.round(hipX + (hipX - x) * 1.05);
        if (destX >= 0 && destX < 158) {
          const destIdx = (y * 158 + destX) * 4;
          // Brighten to look like front leg in key light
          altData.data[destIdx] = Math.min(255, Math.round(r * 1.3));
          altData.data[destIdx+1] = Math.min(255, Math.round(g * 1.3));
          altData.data[destIdx+2] = Math.min(255, Math.round(b * 1.3));
          altData.data[destIdx+3] = 255;
        }
      }
    }
  }
  actx.putImageData(altData, 0, 0);

  // Preview
  const preview = document.createElement("canvas");
  preview.width = 600; preview.height = 200;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#161020";
  pctx.fillRect(0, 0, 600, 200);
  pctx.fillStyle = "#e2a23a";
  pctx.fillRect(0, 160, 600, 2);

  pctx.drawImage(r1Canvas, 30, 18);
  pctx.drawImage(r1Alt, 250, 18);

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-leg-swap.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-leg-swap.png");
