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

  fs.mkdirSync("screenshots/death_debug", { recursive: true });

  console.log("Observando e gravando...");
  // Walk right toward enemy
  for (let i = 0; i < 40; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(100);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(50);

    await page.screenshot({ path: `screenshots/death_debug/frame_${String(i).padStart(2, "0")}.png` });
  }

  await browser.close();
  console.log("Gravação concluída!");
}

main().catch(console.error);
