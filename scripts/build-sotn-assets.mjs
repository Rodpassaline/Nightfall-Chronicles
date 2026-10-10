import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SOTN_STAGE = BRAIN + "sotn_marble_colosseum_1791646474101.jpg";
const ARMORED_SKEL = BRAIN + "enemy_armored_skeleton_1791646512272.jpg";
const RED_SKEL = BRAIN + "enemy_red_skeleton_1791646550037.jpg";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  // Helper to process black background into transparent alpha
  async function makeTransparentPng(filePath, bgThresh = 28) {
    const b64 = fs.readFileSync(filePath).toString("base64");
    return await page.evaluate(async ({ b64, bgThresh }) => {
      const img = new Image();
      await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Black background removal
        const maxC = Math.max(r, g, b);
        if (maxC < bgThresh) {
          d[i + 3] = 0;
        } else if (maxC < bgThresh + 16) {
          d[i + 3] = Math.round(((maxC - bgThresh) / 16) * 255);
        }
      }
      ctx.putImageData(id, 0, 0);
      return c.toDataURL("image/png");
    }, { b64, bgThresh });
  }

  // 1. Process Armored Skeleton
  console.log("Processing Armored Skeleton...");
  const armPng = await makeTransparentPng(ARMORED_SKEL, 24);
  fs.writeFileSync("public/sprites/armored-skeleton.png", Buffer.from(armPng.split(",")[1], "base64"));
  console.log("Saved public/sprites/armored-skeleton.png");

  // 2. Process Red Skeleton
  console.log("Processing Red Skeleton...");
  const redPng = await makeTransparentPng(RED_SKEL, 24);
  fs.writeFileSync("public/sprites/red-skeleton.png", Buffer.from(redPng.split(",")[1], "base64"));
  console.log("Saved public/sprites/red-skeleton.png");

  // 3. Process SOTN Stage Assets
  console.log("Processing SOTN Stage Assets...");
  const stageB64 = fs.readFileSync(SOTN_STAGE).toString("base64");
  const extracted = await page.evaluate(async (stageB64) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + stageB64; });
    const W = img.width, H = img.height;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);

    function crop(x, y, w, h) {
      const sc = document.createElement("canvas");
      sc.width = w; sc.height = h;
      sc.getContext("2d").drawImage(c, x, y, w, h, 0, 0, w, h);
      return sc;
    }

    function cropTransparent(x, y, w, h, thresh = 25) {
      const sc = crop(x, y, w, h);
      const sctx = sc.getContext("2d");
      const id = sctx.getImageData(0, 0, w, h);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.max(d[i], d[i+1], d[i+2]) < thresh) d[i+3] = 0;
      }
      sctx.putImageData(id, 0, 0);
      return sc.toDataURL("image/png");
    }

    // A. Colosseum Background (panoramic hall)
    // Scale full backdrop without characters to 1024x576
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = 1024; bgCanvas.height = 576;
    bgCanvas.getContext("2d").drawImage(img, 0, 0, W, H, 0, 0, 1024, 576);

    // B. Standing fluted marble column (golden/cream) - around x=560, y=340, w=80, h=360
    const colTall = cropTransparent(Math.round(W * 0.55), Math.round(H * 0.56), Math.round(W * 0.08), Math.round(H * 0.32));

    // C. Broken marble column on floor - around x=170, y=580
    const colBroken = cropTransparent(Math.round(W * 0.17), Math.round(H * 0.58), Math.round(W * 0.075), Math.round(H * 0.28));

    // D. Hanging broken column from ceiling - around x=680, y=100
    const colCeiling = cropTransparent(Math.round(W * 0.67), Math.round(H * 0.10), Math.round(W * 0.07), Math.round(H * 0.26));

    // E. Giant gladiator statue - center arch around x=420, y=270, w=170, h=240
    const statue = cropTransparent(Math.round(W * 0.42), Math.round(H * 0.27), Math.round(W * 0.17), Math.round(H * 0.44), 15);

    // F. Blue spirit candelabra wall sconce - around x=315, y=360
    const candelabra = cropTransparent(Math.round(W * 0.315), Math.round(H * 0.36), Math.round(W * 0.035), Math.round(H * 0.08), 20);

    // G. Fluted marble balustrade segment - around floor or platform edge
    const balustrade = crop(Math.round(W * 0.43), Math.round(H * 0.74), Math.round(W * 0.18), Math.round(H * 0.13));

    return {
      bg: bgCanvas.toDataURL("image/jpeg", 0.92),
      colTall,
      colBroken,
      colCeiling,
      statue,
      candelabra,
      balustrade: balustrade.toDataURL("image/png")
    };
  }, stageB64);

  fs.writeFileSync("public/art/parallax/colosseum-bg.jpg", Buffer.from(extracted.bg.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-column.png", Buffer.from(extracted.colTall.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-column-broken.png", Buffer.from(extracted.colBroken.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-ceiling-pillar.png", Buffer.from(extracted.colCeiling.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/statue-gladiator.png", Buffer.from(extracted.statue.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/candelabra-blue.png", Buffer.from(extracted.candelabra.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-balustrade.png", Buffer.from(extracted.balustrade.split(",")[1], "base64"));

  console.log("All stage assets extracted successfully!");
  await browser.close();
}

main().catch(console.error);
