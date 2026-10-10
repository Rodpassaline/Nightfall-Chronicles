import { chromium } from "playwright";
import fs from "node:fs";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const SRC = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/.user_uploaded/media_1791580826220_4bf1a3f3.jpg";
  const b64 = fs.readFileSync(SRC).toString("base64");

  const layout = await page.evaluate(async (srcB64) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + srcB64; });
    return {
      w: img.naturalWidth,
      h: img.naturalHeight,
    };
  }, b64);

  console.log("Concept sheet dimensions:", layout);
  await browser.close();
}

run();
