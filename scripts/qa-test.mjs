import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:\\Users\\rodpa\\.gemini\\antigravity\\brain\\ca749cb1-0bbc-4c6a-810b-5903a41e7c31\\scratch";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("nightfall-campaign", JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] }));
  });
  await page.reload({ waitUntil: "networkidle" });

  // 1. Stage 1 (Portões)
  console.log("Navigating to Portões...");
  await page.locator("button:has-text('Fases')").first().click();
  await page.waitForTimeout(600);
  await page.locator("button:has-text('Os Portões')").first().click();
  await page.waitForTimeout(1500);

  const canvas = page.locator("canvas");
  await canvas.click();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1200);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "qa-stage1-portoes.png") });
  console.log("Saved qa-stage1-portoes.png");

  // 2. Stage 4 (Catacumbas)
  console.log("Navigating to Catacumbas...");
  await page.locator("button:has-text('Sair')").first().click();
  await page.waitForTimeout(600);
  await page.locator("button:has-text('Catacumbas')").first().click();
  await page.waitForTimeout(1500);

  await canvas.click();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1200);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "qa-stage4-catacumbas.png") });
  console.log("Saved qa-stage4-catacumbas.png");

  await browser.close();
}

run().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
