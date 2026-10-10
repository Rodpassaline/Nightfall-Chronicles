import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/scratch";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[PAGE ERROR]", msg.text());
    }
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Enter stages menu to pick stage or play stage 1
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take screenshot of player starting stage 1 with grounded enemies
  await page.screenshot({ path: path.join(outDir, "qa-boss-test-start.png") });
  console.log("Saved qa-boss-test-start.png");

  // Let's inspect the game state by simulating walking/moving or teleporting near the boss
  // We can use keyboard events: holding D to run right
  console.log("Holding D to walk right towards boss area...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(4000);
  await page.keyboard.up("KeyD");

  await page.screenshot({ path: path.join(outDir, "qa-walking-right.png") });
  console.log("Saved qa-walking-right.png");

  // Let's test entering Stage 7 (Dracula's throne room) via the stage select menu
  // Go back to stages menu
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const stagesBtn = page.locator('button:has-text("Fases")').first();
  if (await stagesBtn.isVisible()) {
    await stagesBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "qa-stage-select-menu.png") });
    console.log("Saved qa-stage-select-menu.png");
  }

  await browser.close();
  console.log("Boss test finished successfully!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
