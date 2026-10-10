import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "screenshots/fixes_verified";

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[BROWSER ERROR]", msg.text());
  });

  console.log("Navigating to http://127.0.0.1:8080/ ...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(600);

  // 1. Check Stage 1 start: Platform supporting columns & walking zombie
  await page.screenshot({ path: path.join(outDir, "01_stage1_connected_balcony_and_walk.png") });
  console.log("Saved 01_stage1_connected_balcony_and_walk.png");

  // 2. Check Stage 1 at x=1540 (where bugged column was previously located)
  await page.evaluate(() => {
    window.__controlsTest.teleport(1500);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "02_stage1_clean_column_pillar.png") });
  console.log("Saved 02_stage1_clean_column_pillar.png");

  // 3. Move forward to observe enemy walking animation
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(800);
  await page.keyboard.up("KeyD");
  await page.screenshot({ path: path.join(outDir, "03_stage1_knight_walking.png") });
  console.log("Saved 03_stage1_knight_walking.png");

  // 4. Check elevated balcony colonnade at x=520
  await page.evaluate(() => {
    window.__controlsTest.teleport(500);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "04_stage1_colonnade_architecture.png") });
  console.log("Saved 04_stage1_colonnade_architecture.png");

  // 5. Jump onto elevated balcony and check standing
  await page.keyboard.down("Space");
  await page.waitForTimeout(200);
  await page.keyboard.up("Space");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "05_standing_on_connected_balcony.png") });
  console.log("Saved 05_standing_on_connected_balcony.png");

  await browser.close();
  console.log("Verification finished successfully!");
}

main().catch(console.error);
