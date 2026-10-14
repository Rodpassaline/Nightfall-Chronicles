import { chromium } from "playwright";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const b64 = fs.readFileSync("C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/aldric_death_spritesheet_1791978525887.jpg").toString("base64");
  const info = await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const borderPix = ctx.getImageData(0, 0, 1, 1).data;
    
    // Check pixels in frame 0 (x around 100-200, y around 200-350)
    const samples = [];
    for (let y = 200; y < 350; y += 20) {
      for (let x = 120; x < 200; x += 20) {
        const p = ctx.getImageData(x, y, 1, 1).data;
        samples.push({ x, y, rgb: [p[0], p[1], p[2], p[3]] });
      }
    }
    return {
      w: img.width, h: img.height,
      border: [borderPix[0], borderPix[1], borderPix[2]],
      samples
    };
  }, b64);
  console.log("Image info:", JSON.stringify(info, null, 2));
  await browser.close();
}

run();
