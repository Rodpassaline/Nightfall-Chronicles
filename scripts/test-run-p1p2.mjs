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
  const sat = (p) => Math.max(d[p*4], d[p*4+1], d[p*4+2]) - minC(p);

  const bg = new Uint8Array(W * H);
  const stack = [];
  const pushBg = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (bg[p] || minC(p) < 208) return;
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
    if (bg[s] || visited[s] || minC(s) < 210) continue;
    const comp = [s]; visited[s] = 1;
    let head = 0;
    while (head < comp.length) {
      const p = comp[head++];
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (!bg[np] && !visited[np] && minC(np) >= 208) { visited[np] = 1; comp.push(np); }
      }
    }
    if (comp.length >= 6) for (const p of comp) bg[p] = 1;
  }

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;

  for (const step of [
    { minTh: 115, lumTh: 125, maxSat: 48 },
    { minTh: 135, lumTh: 145, maxSat: 50 },
    { minTh: 155, lumTh: 165, maxSat: 55 },
  ]) {
    const toKill = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!alpha[p]) continue;
        const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
        if (isBorder && sat(p) < step.maxSat && (minC(p) > step.minTh || luma(p) > step.lumTh)) toKill.push(p);
      }
    }
    for (const p of toKill) alpha[p] = 0;
  }
  for (let p = 0; p < W * H; p++) d[p*4+3] = alpha[p];
  ctx.putImageData(imgData, 0, 0);

  function crop(sx, sy, sw, sh) {
    const fc = document.createElement("canvas");
    fc.width = sw; fc.height = sh;
    fc.getContext("2d").drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
    return fc;
  }

  // R1: 10, 700, 158, 142
  const r1 = crop(10, 700, 158, 142);
  // R2: 181, 700, 149, 144
  const r2 = crop(181, 700, 149, 144);
  // P1: 26, 46, 154, 167
  const p1 = crop(26, 46, 154, 167);
  // P2: 216, 46, 148, 170
  const p2 = crop(216, 46, 148, 170);

  // Scale P1 and P2 to match R1/R2 height (143px)
  const targetH = 143;
  function scaleCanvas(src, destH) {
    const k = destH / src.height;
    const sc = document.createElement("canvas");
    sc.width = Math.round(src.width * k);
    sc.height = destH;
    const sctx = sc.getContext("2d");
    sctx.imageSmoothingEnabled = false; // keep pixel art crisp
    sctx.drawImage(src, 0, 0, sc.width, sc.height);
    return sc;
  }

  const p1Scaled = scaleCanvas(p1, targetH);
  const p2Scaled = scaleCanvas(p2, targetH);

  // Preview on game floor
  const preview = document.createElement("canvas");
  preview.width = 720; preview.height = 200;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#140e1a";
  pctx.fillRect(0, 0, 720, 200);
  pctx.fillStyle = "#e2a23a";
  pctx.fillRect(0, 168, 720, 2);

  const framesList = [
    { name: "Frame 0: R1 (Right fwd)", c: r1 },
    { name: "Frame 1: R2 (Right pass)", c: r2 },
    { name: "Frame 2: P1 (Left fwd)", c: p1Scaled },
    { name: "Frame 3: P2 (Left pass)", c: p2Scaled },
  ];

  framesList.forEach((f, i) => {
    // Align feet to y = 168
    const footY = 168;
    const topY = footY - f.c.height;
    pctx.drawImage(f.c, i * 175 + 10, topY);
    pctx.fillStyle = "#fff";
    pctx.font = "12px sans-serif";
    pctx.fillText(f.name, i * 175 + 10, 188);
  });

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-run-p1p2-scaled.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-run-p1p2-scaled.png");
