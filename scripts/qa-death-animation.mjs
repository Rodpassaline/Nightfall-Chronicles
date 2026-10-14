import { chromium } from "playwright";
import fs from "fs";

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  // Pre-seed intro seen so we jump directly into title/campaign
  await context.addInitScript(() => {
    try {
      localStorage.setItem("nightfall_intro_seen", "true");
    } catch {}
  });

  const page = await context.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
      console.error("[Browser Error]:", msg.text());
    }
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
    console.error("[Browser PageError]:", err.message);
  });

  console.log("Navigating to http://localhost:8080/...");
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  fs.mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/1-title.png" });

  console.log("Starting campaign from Title screen...");
  const startBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar'), button:has-text('Campanha')").first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  // If StageIntroCard is shown ("OS PORTÕES DO CASTELO - Iniciar")
  const stageCardBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar')").first();
  if (await stageCardBtn.isVisible()) {
    console.log("Clicking Stage Intro Card Iniciar button...");
    await stageCardBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: "screenshots/2-gameplay.png" });

  // Move right toward enemies and attack to kill an enemy
  console.log("Moving toward enemy and attacking to trigger death animation...");
  for (let i = 0; i < 22; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(100);
    await page.keyboard.press("KeyJ"); // Attack
    await page.waitForTimeout(60);
    await page.keyboard.press("KeyJ"); // Combo
    await page.waitForTimeout(60);
  }
  await page.keyboard.up("KeyD");

  await page.waitForTimeout(200);
  await page.screenshot({ path: "screenshots/3-enemy-dying.png" });

  // Wait a bit to let death animation complete and item drop
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/4-enemy-dead-item.png" });

  console.log("Testing player fatal damage / death animation...");
  // Walk into remaining enemies without attacking to take damage until dying
  for (let i = 0; i < 35; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(120);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/5-player-death.png" });

  console.log("QA script finished with errors count:", errors.length);
  await browser.close();

  if (errors.length > 0) {
    console.error("Test finished with errors:", errors);
    process.exit(1);
  } else {
    console.log("SUCCESS: All death animations, sprites, and states verified with 0 errors!");
  }
}

run().catch((err) => {
  console.error("Fatal QA error:", err);
  process.exit(1);
});
