import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const PILLARS_IMG = BRAIN + "sotn_marble_pillars_1791646953550.jpg";
const STATUE_IMG = BRAIN + "sotn_gladiator_statue_1791646995874.jpg";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  async function processCutouts(pillarsB64, statueB64) {
    return await page.evaluate(async ({ pillarsB64, statueB64 }) => {
      function loadImage(b64) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = "data:image/jpeg;base64," + b64;
        });
      }

      function cutAlpha(canvas, thresh = 22) {
        const ctx = canvas.getContext("2d");
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const m = Math.max(d[i], d[i+1], d[i+2]);
          if (m < thresh) {
            d[i+3] = 0;
          } else if (m < thresh + 15) {
            d[i+3] = Math.round(((m - thresh) / 15) * 255);
          }
        }
        ctx.putImageData(id, 0, 0);
        return canvas.toDataURL("image/png");
      }

      function crop(srcImg, x, y, w, h) {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(srcImg, x, y, w, h, 0, 0, w, h);
        return c;
      }

      const pillars = await loadImage(pillarsB64);
      const W = pillars.width, H = pillars.height;

      // 1. Full Column (left half top)
      const cFull = crop(pillars, Math.round(W * 0.14), 0, Math.round(W * 0.20), Math.round(H * 0.50));
      // 2. Broken Column Base (top right)
      const cBroken = crop(pillars, Math.round(W * 0.56), Math.round(H * 0.11), Math.round(W * 0.36), Math.round(H * 0.39));
      // 3. Hanging Ceiling Column (bottom left)
      const cHanging = crop(pillars, Math.round(W * 0.14), Math.round(H * 0.49), Math.round(W * 0.22), Math.round(H * 0.45));
      // 4. Blue Sconce (bottom right)
      const cSconce = crop(pillars, Math.round(W * 0.59), Math.round(H * 0.53), Math.round(W * 0.31), Math.round(H * 0.44));

      // 5. Gladiator Statue
      const statue = await loadImage(statueB64);
      const cStatue = crop(statue, 0, 0, statue.width, statue.height);

      return {
        colFull: cutAlpha(cFull, 24),
        colBroken: cutAlpha(cBroken, 24),
        colHanging: cutAlpha(cHanging, 24),
        sconce: cutAlpha(cSconce, 22),
        statue: cutAlpha(cStatue, 20)
      };
    }, { pillarsB64, statueB64 });
  }

  const pB64 = fs.readFileSync(PILLARS_IMG).toString("base64");
  const sB64 = fs.readFileSync(STATUE_IMG).toString("base64");

  const results = await processCutouts(pB64, sB64);

  fs.writeFileSync("public/sprites/marble-column-full.png", Buffer.from(results.colFull.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-column-broken.png", Buffer.from(results.colBroken.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/marble-column-hanging.png", Buffer.from(results.colHanging.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/sconce-blue.png", Buffer.from(results.sconce.split(",")[1], "base64"));
  fs.writeFileSync("public/sprites/statue-gladiator.png", Buffer.from(results.statue.split(",")[1], "base64"));

  console.log("Extracted and saved all individual SOTN assets cleanly!");
  await browser.close();
}

main().catch(console.error);
