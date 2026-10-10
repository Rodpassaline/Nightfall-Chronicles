import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/scratch";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.click('button:has-text("Jogar"), button:has-text("Continuar")');
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Teleport player near the end of stage 1 where Petros and the portal are
  await page.evaluate(() => {
    window.__controlsTest.teleport(2550);
  });
  await page.waitForTimeout(800);

  // Defeat Petros
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(600);

  // Take screenshot of the Gothic Portal opening in scene!
  await page.screenshot({ path: path.join(outDir, "qa-portal-in-scene.png") });
  console.log("Saved qa-portal-in-scene.png");

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
