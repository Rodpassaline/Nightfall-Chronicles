import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:\\Users\\rodpa\\.gemini\\antigravity\\brain\\ca749cb1-0bbc-4c6a-810b-5903a41e7c31\\scratch";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Start Stage 1
  await page.locator("button:has-text('Fases')").first().click();
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Os Portões')").first().click();
  await page.waitForTimeout(1500);

  const canvas = page.locator("canvas");
  await canvas.click();

  // Walk forward to meet the skeleton and take hits
  console.log("Engaging skeleton...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2500);
  await page.keyboard.up("KeyD");

  // Wait for skeleton attacks to hit player until death 1 happens
  console.log("Waiting for first lethal strike...");
  let respawn1Detected = false;
  for (let s = 0; s < 25; s++) {
    await page.waitForTimeout(500);
    const toast = await page.locator("p.truncate").innerText();
    const livesText = await page.locator("text=VIDAS:").locator("..").innerText();
    console.log(`State at ${s * 0.5}s:`, { toast, livesText });
    if (livesText.includes("x2") || toast.includes("Ressuscitado")) {
      respawn1Detected = true;
      break;
    }
  }

  await page.screenshot({ path: path.join(outDir, "qa-death1-respawn.png") });
  console.log("Saved qa-death1-respawn.png, respawn 1 detected:", respawn1Detected);

  // Continue taking hits until death 2 and then Game Over
  console.log("Waiting for death 2...");
  let respawn2Detected = false;
  for (let s = 0; s < 25; s++) {
    await page.waitForTimeout(500);
    const livesText = await page.locator("text=VIDAS:").locator("..").innerText();
    if (livesText.includes("x1")) {
      respawn2Detected = true;
      break;
    }
  }
  await page.screenshot({ path: path.join(outDir, "qa-death2-respawn.png") });
  console.log("Saved qa-death2-respawn.png, respawn 2 detected:", respawn2Detected);

  // Continue taking hits until final death (Game Over)
  console.log("Waiting for final death (Game Over)...");
  let gameOverDetected = false;
  for (let s = 0; s < 30; s++) {
    await page.waitForTimeout(500);
    const gameOverModal = await page.locator("text=Game Over").count();
    if (gameOverModal > 0) {
      gameOverDetected = true;
      break;
    }
  }
  await page.screenshot({ path: path.join(outDir, "qa-gameover.png") });
  console.log("Saved qa-gameover.png, game over detected:", gameOverDetected);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
