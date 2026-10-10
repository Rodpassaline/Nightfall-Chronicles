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

  // Clear background
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
  for (let p = 0; p < W * H; p++) {
    if (bg[p]) { d.data[p*4+3] = 0; }
  }
  ctx.putImageData(d, 0, 0);

  // Now create test preview canvas
  const preview = document.createElement("canvas");
  preview.width = 800; preview.height = 400;
  const pctx = preview.getContext("2d");
  pctx.fillStyle = "#201824"; // dark background to test contrast
  pctx.fillRect(0, 0, 800, 400);

  // Draw R1, R2, R3
  pctx.drawImage(c, 10, 680, 160, 160, 20, 20, 160, 160); // R1
  pctx.drawImage(c, 180, 680, 160, 160, 180, 20, 160, 160); // R2
  pctx.drawImage(c, 345, 680, 160, 160, 340, 20, 160, 160); // R3

  // Test Alt 1: Swap legs of R1
  // In R1: upper body is y 0..72. Leg split is around x 62.
  // Left leg: x 25..62, y 70..130
  // Right leg: x 62..110, y 70..155
  // We can construct an alternate by taking the upper body of R1 and:
  // Option A: flip the leg slice horizontally around hip center
  const alt1 = document.createElement("canvas");
  alt1.width = 160; alt1.height = 160;
  const actx1 = alt1.getContext("2d");
  // Upper body
  actx1.drawImage(c, 10, 680, 160, 75, 0, 0, 160, 75);
  // Legs from R1
  // Draw left leg shifted forward to right side, shaded lighter
  // Draw right leg shifted backward to left side, shaded darker
  // Let's do pixel manipulation for the leg area:
  const legData = ctx.getImageData(10, 755, 160, 85);
  const altLegData = actx1.createImageData(160, 85);

  // Analyze legs:
  // Foreground leg is x: 55..110, background leg is x: 20..55
  // If we shift the foreground leg backward (x -= 40) and darken it:
  // And shift background leg forward (x += 40) and brighten it:
  for (let y = 0; y < 85; y++) {
    for (let x = 0; x < 160; x++) {
      const srcIdx = (y * 160 + x) * 4;
      if (legData.data[srcIdx + 3] === 0) continue;
      const r = legData.data[srcIdx], g = legData.data[srcIdx+1], b = legData.data[srcIdx+2];

      if (x < 58) {
        // Background leg -> move forward into foreground!
        const destX = x + 38;
        if (destX < 160) {
          const destIdx = (y * 160 + destX) * 4;
          // Brighten slightly (move from shadow into light)
          altLegData.data[destIdx] = Math.min(255, r * 1.25);
          altLegData.data[destIdx+1] = Math.min(255, g * 1.25);
          altLegData.data[destIdx+2] = Math.min(255, b * 1.25);
          altLegData.data[destIdx+3] = 255;
        }
      } else {
        // Foreground leg -> move backward into background!
        const destX = x - 42;
        if (destX >= 0) {
          const destIdx = (y * 160 + destX) * 4;
          // Darken slightly (into shadow)
          altLegData.data[destIdx] = r * 0.75;
          altLegData.data[destIdx+1] = g * 0.75;
          altLegData.data[destIdx+2] = b * 0.75;
          altLegData.data[destIdx+3] = 255;
        }
      }
    }
  }
  actx1.putImageData(altLegData, 0, 75);
  pctx.drawImage(alt1, 500, 20);

  // Test Alt 2: from R2 (passing pose)
  const alt2 = document.createElement("canvas");
  alt2.width = 160; alt2.height = 160;
  const actx2 = alt2.getContext("2d");
  actx2.drawImage(c, 180, 680, 160, 75, 0, 0, 160, 75);
  const legData2 = ctx.getImageData(180, 755, 160, 85);
  const altLegData2 = actx2.createImageData(160, 85);
  for (let y = 0; y < 85; y++) {
    for (let x = 0; x < 160; x++) {
      const srcIdx = (y * 160 + x) * 4;
      if (legData2.data[srcIdx + 3] === 0) continue;
      const r = legData2.data[srcIdx], g = legData2.data[srcIdx+1], b = legData2.data[srcIdx+2];
      if (x < 55) {
        // Background lifted leg -> move to foreground!
        const destX = x + 30;
        if (destX < 160) {
          const destIdx = (y * 160 + destX) * 4;
          altLegData2.data[destIdx] = Math.min(255, r * 1.25);
          altLegData2.data[destIdx+1] = Math.min(255, g * 1.25);
          altLegData2.data[destIdx+2] = Math.min(255, b * 1.25);
          altLegData2.data[destIdx+3] = 255;
        }
      } else {
        // Foreground planted leg -> move to background!
        const destX = x - 30;
        if (destX >= 0) {
          const destIdx = (y * 160 + destX) * 4;
          altLegData2.data[destIdx] = r * 0.75;
          altLegData2.data[destIdx+1] = g * 0.75;
          altLegData2.data[destIdx+2] = b * 0.75;
          altLegData2.data[destIdx+3] = 255;
        }
      }
    }
  }
  actx2.putImageData(altLegData2, 0, 75);
  pctx.drawImage(alt2, 20, 200);

  window._preview = preview.toDataURL("image/png");
}, b64);

const out = await page.evaluate(() => window._preview);
fs.writeFileSync("screenshots/test-legs.png", Buffer.from(out.replace(/^data:image\/png;base64,/, ""), "base64"));
await browser.close();
console.log("Saved screenshots/test-legs.png");
