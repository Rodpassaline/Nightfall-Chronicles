import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:\\Users\\rodpa\\.gemini\\antigravity\\brain\\ca749cb1-0bbc-4c6a-810b-5903a41e7c31\\scratch";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log("Navigating to app...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Start Phase 1
  await page.locator("button:has-text('Fases')").first().click();
  await page.waitForTimeout(600);
  await page.locator("button:has-text('Os Portões')").first().click();
  await page.waitForTimeout(1500);

  // 1. Initial screenshot: check HUD with 3 lives
  await page.screenshot({ path: path.join(outDir, "qa-lives-initial.png") });
  console.log("Saved qa-lives-initial.png (should show 3 lives in HUD)");

  const canvas = page.locator("canvas");
  await canvas.click();

  // Walk forward to find enemies and items
  console.log("Walking forward towards item and skeleton...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2000);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(500);

  // Take screenshot with item or gameplay in view
  await page.screenshot({ path: path.join(outDir, "qa-lives-gameplay.png") });
  console.log("Saved qa-lives-gameplay.png");

  // Let skeleton hit player until player dies once (first death with 3 lives)
  console.log("Waiting for player to take lethal damage to test resurrection...");
  // Let player get hit
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(700);
  }

  await page.screenshot({ path: path.join(outDir, "qa-lives-after-death.png") });
  console.log("Saved qa-lives-after-death.png (should show resurrected on the spot with 2 lives, full HP, no Game Over)");

  await browser.close();
  console.log("QA test complete!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
