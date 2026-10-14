import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.addInitScript(() => {
    try { localStorage.setItem("nightfall_intro_seen", "true"); } catch {}
  });

  const page = await context.newPage();
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const startBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar'), button:has-text('Campanha')").first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(500);
  }

  const stageBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar')").first();
  if (await stageBtn.isVisible()) {
    await stageBtn.click();
    await page.waitForTimeout(500);
  }

  // Inject a small helper in window to trigger death and pause/step
  await page.evaluate(() => {
    // Expose window.debugCampaign if possible or inspect canvas
  });

  const outDir = "screenshots/death_debug";
  fs.mkdirSync(outDir, { recursive: true });

  // Move right and attack
  for (let step = 0; step < 18; step++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(70);
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(40);
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(40);
  }
  await page.keyboard.up("KeyD");

  // Now capture 15 frames rapidly
  for (let f = 0; f < 15; f++) {
    await page.screenshot({ path: path.join(outDir, `frame_${f.toString().padStart(2, "0")}.png`) });
    await page.waitForTimeout(60);
  }

  console.log("Captured 15 frames of gameplay around death!");
  await browser.close();
}

main().catch(console.error);
