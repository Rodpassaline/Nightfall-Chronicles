import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.addInitScript(() => {
    localStorage.setItem("nightfall_intro_seen", "true");
  });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("http://localhost:8080");
  await page.waitForTimeout(1000);

  const startBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar'), button:has-text('Campanha')").first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  const stageCardBtn = page.locator("button:has-text('INICIAR'), button:has-text('Iniciar')").first();
  if (await stageCardBtn.isVisible()) await stageCardBtn.click();
  await page.waitForTimeout(1000);

  fs.mkdirSync("screenshots/verify_death", { recursive: true });

  console.log("1. Andando até o zumbi e atacando no chão...");
  for (let i = 0; i < 18; i++) {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(70);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(30);
  }

  // Attack zombie to kill it on the floor
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("KeyJ");
    await page.waitForTimeout(120);
  }

  // Capture frames of enemy dying on the floor
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(100);
    await page.screenshot({ path: `screenshots/verify_death/enemy_death_${i}.png` });
  }

  console.log("2. Deixando o esqueleto causar dano fatal no chão...");
  // Stand still in front of skeleton to receive fatal damage on the floor
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(200);
    await page.screenshot({ path: `screenshots/verify_death/player_death_${i}.png` });
  }

  await browser.close();
  console.log("Verificação concluída com", errors.length, "erros de console!");
}

main().catch(console.error);
