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

  fs.mkdirSync("screenshots/enemy_death_debug", { recursive: true });

  console.log("Aproximando do zumbi...");
  // Walk right toward the first zombie
  for (let i = 0; i < 15; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(60);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(20);
  }

  console.log("Atacando o zumbi para matar...");
  // Hit zombie until it dies, taking screenshots on every frame
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("KeyJ"); // Attack
    await page.waitForTimeout(40);
    await page.screenshot({ path: `screenshots/enemy_death_debug/hit_${String(i).padStart(2, "0")}.png` });
  }

  // Record 20 frames of death animation
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    await page.screenshot({ path: `screenshots/enemy_death_debug/die_${String(i).padStart(2, "0")}.png` });
  }

  await browser.close();
  console.log("Gravação de morte do inimigo concluída!");
}

main().catch(console.error);
