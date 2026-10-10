import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/scratch";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Unlock all stages in localStorage
  await page.evaluate(() => {
    localStorage.setItem("nightfall-campaign", JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] }));
  });

  // Reload to pick up unlocked progress
  await page.reload({ waitUntil: "networkidle" });

  // Click "Fases"
  await page.click('button:has-text("Fases")');
  await page.waitForTimeout(400);

  // Click Stage 7 "Sala do Trono"
  const stage7Btn = page.locator('button:has-text("Sala do Trono")').first();
  await stage7Btn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Teleport to Dracula's Throne Dais (x: 1540)
  await page.evaluate(() => {
    window.__controlsTest.teleport(1500);
  });
  await page.waitForTimeout(1200);

  // Take screenshot of Dracula in the Throne Room!
  await page.screenshot({ path: path.join(outDir, "qa-dracula-throne.png") });
  console.log("Saved qa-dracula-throne.png");

  // Defeat Dracula and see the final victory
  console.log("Defeating Dracula...");
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "qa-dracula-defeated.png") });
  console.log("Saved qa-dracula-defeated.png");

  await browser.close();
  console.log("Dracula test complete!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
