import { chromium } from "playwright";
import fs from "fs";

async function main() {
  fs.mkdirSync("screenshots/game-qa", { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log("Navigating to http://127.0.0.1:8080/ ...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click start game button if any or press enter/space
  await page.screenshot({ path: "screenshots/game-qa/01_title_screen.png" });

  // Start campaign
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // In Stage 1: take screenshot of hero & walking zombie on the ground
  await page.screenshot({ path: "screenshots/game-qa/02_stage1_ground_enemies.png" });

  // Walk forward towards enemies
  for (let i = 0; i < 15; i++) {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(100);
    await page.keyboard.up("ArrowRight");
  }
  await page.screenshot({ path: "screenshots/game-qa/03_stage1_zombie_encounter.png" });

  // Check stage 1 boss Petros and portal
  // We can evaluate directly on the canvas or simulate boss kill
  const stage1Results = await page.evaluate(async () => {
    // Check if canvas exists
    const c = document.querySelector("canvas");
    return {
      hasCanvas: !!c,
      width: c?.width,
      height: c?.height,
    };
  });
  console.log("Stage 1 test status:", stage1Results);

  await browser.close();
  console.log("Visual QA script finished!");
}

main().catch(console.error);
