import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(500);

  // Take screenshot at x=1540 in Stage 1 where column was placed
  await page.evaluate(() => {
    window.__controlsTest.teleport(1500);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/bug_column_stage1.png" });
  console.log("Saved screenshots/bug_column_stage1.png");

  // Teleport to Level 2
  await page.evaluate(() => {
    window.__controlsTest.setStage(2);
    window.__controlsTest.teleport(200);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/bug_column_stage2.png" });
  console.log("Saved screenshots/bug_column_stage2.png");

  await browser.close();
}

main().catch(console.error);
