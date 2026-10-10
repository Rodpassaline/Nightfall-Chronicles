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

  // Background removal on reference
  const d = ctx.getImageData(0, 0, W, H);
  const minC = (p) => Math.min(d.data[p*4], d.data[p*4+1], d.data[p*4+2]);
  const bg = new Uint8Array(W * H);
  const stack = [0];
  bg[0] = 1;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const np = ny * W + nx;
      if (!bg[np] && minC(np) >= 210) { bg[np] = 1; stack.push(np); }
    }
  }
  for (let p = 0; p < W * H; p++) if (bg[p]) d.data[p*4+3] = 0;
  ctx.putImageData(d, 0, 0);

  // P1: [100, 130], P2: [285, 130]
  // R1: [90, 750], R2: [260, 750], R3: [430, 750]
  const preview = document.createElement("canvas");
  preview.width = 900; preview.height = 240;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#1b1422";
  pctx.fillRect(0, 0, 900, 240);

  // Draw ground line
  pctx.fillStyle = "#e2a23a";
  pctx.fillRect(0, 190, 900, 4);

  // Sequences to test:
  // Seq A: R1, R2, P1, P2
  const frames = [
    { name: "R1 (Right fwd)", sx: 20, sy: 685, sw: 150, sh: 160, alignY: 190 },
    { name: "R2 (Right pass)", sx: 185, sy: 685, sw: 150, sh: 160, alignY: 190 },
    { name: "P1 (Left fwd)", sx: 25, sy: 45, sw: 150, sh: 160, alignY: 190 },
    { name: "P2 (Left pass)", sx: 205, sy: 45, sw: 150, sh: 160, alignY: 190 },
  ];

  frames.forEach((f, i) => {
    pctx.drawImage(c, f.sx, f.sy, f.sw, f.sh, i * 220 + 20, 30, 150, 160);
    pctx.fillStyle = "#fff";
    pctx.font = "14px sans-serif";
    pctx.fillText(f.name, i * 220 + 30, 220);
  });

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-run-4frame.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-run-4frame.png");
