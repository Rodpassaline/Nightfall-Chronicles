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

  const outDir = "screenshots/zombie_death";
  fs.mkdirSync(outDir, { recursive: true });

  // Move right until x ~ 350
  for (let i = 0; i < 10; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(100);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(20);
  }

  // Attack 4 times to kill the first zombie
  console.log("Attacking zombie...");
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(100);
  }

  // Capture frames as zombie dies
  for (let f = 0; f < 16; f++) {
    await page.screenshot({ path: path.join(outDir, `zombie_die_${f.toString().padStart(2, "0")}.png`) });
    await page.waitForTimeout(50);
  }

  console.log("Captured zombie death frames!");
  await browser.close();
}

main().catch(console.error);
