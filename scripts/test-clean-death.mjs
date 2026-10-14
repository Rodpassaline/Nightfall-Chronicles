import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.addInitScript(() => {
    localStorage.setItem("nightfall_intro_seen", "true");
  });

  await page.goto("http://localhost:8080");
  await page.waitForTimeout(1000);

  const startBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar'), button:has-text('Campanha')").first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  const stageCardBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar')").first();
  if (await stageCardBtn.isVisible()) await stageCardBtn.click();
  await page.waitForTimeout(1000);

  fs.mkdirSync("screenshots/clean_death_test", { recursive: true });

  console.log("Player walking on ground...");
  for (let i = 0; i < 10; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(80);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(30);
  }

  // Attack zombie
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(80);
  }

  // Wait for zombie death frames
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(70);
    await page.screenshot({ path: `screenshots/clean_death_test/zombie_die_${i}.png` });
  }

  console.log("Taking damage until death...");
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(100);
    await page.screenshot({ path: `screenshots/clean_death_test/player_die_${String(i).padStart(2, "0")}.png` });
  }

  await browser.close();
  console.log("Teste de morte limpa concluído!");
}

main().catch(console.error);
