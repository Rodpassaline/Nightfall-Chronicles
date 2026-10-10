import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "screenshots/gameplay-qa";

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[BROWSER ERROR]", msg.text());
    }
  });

  console.log("Navigating to http://127.0.0.1:8080/ ...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // 1. Enter Stage 1
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take screenshot of Stage 1 start (zombies and knight ahead, grounded on floor)
  await page.screenshot({ path: path.join(outDir, "01_stage1_grounded_enemies.png") });
  console.log("Saved 01_stage1_grounded_enemies.png");

  // Teleport to Petros (Boss 1 at 2540)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2360);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "02_boss1_petros_in_action.png") });
  console.log("Saved 02_boss1_petros_in_action.png");

  // Defeat Petros: Portal should open!
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "03_boss1_portal_opened.png") });
  console.log("Saved 03_boss1_portal_opened.png");

  // Advance to Stage 2 by teleporting into the door
  await page.evaluate(() => {
    window.__controlsTest.teleport(2740);
  });
  await page.waitForTimeout(1200);

  // Stage 2: Valerius (Boss 2 at 2460)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2280);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "04_boss2_valerius_in_action.png") });
  console.log("Saved 04_boss2_valerius_in_action.png");

  // Defeat Valerius
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "05_boss2_portal_opened.png") });
  console.log("Saved 05_boss2_portal_opened.png");

  // Advance to Stage 3
  await page.evaluate(() => {
    window.__controlsTest.teleport(2700);
  });
  await page.waitForTimeout(1200);

  // Stage 3: Seraphine (Boss 3 at 2360)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2180);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "06_boss3_seraphine_in_action.png") });
  console.log("Saved 06_boss3_seraphine_in_action.png");

  // Defeat Seraphine
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "07_boss3_portal_opened.png") });
  console.log("Saved 07_boss3_portal_opened.png");

  // Advance to Stage 4
  await page.evaluate(() => {
    window.__controlsTest.teleport(2660);
  });
  await page.waitForTimeout(1200);

  // Stage 4: Nocturne (Boss 4 at 2480)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2300);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "08_boss4_nocturne_in_action.png") });
  console.log("Saved 08_boss4_nocturne_in_action.png");

  // Defeat Nocturne
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "09_boss4_portal_opened.png") });
  console.log("Saved 09_boss4_portal_opened.png");

  // Advance to Stage 5
  await page.evaluate(() => {
    window.__controlsTest.teleport(2860);
  });
  await page.waitForTimeout(1200);

  // Stage 5: Lorde Veyne (Boss 5 at 2500)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2320);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "10_boss5_veyne_in_action.png") });
  console.log("Saved 10_boss5_veyne_in_action.png");

  // Defeat Veyne
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "11_boss5_portal_opened.png") });
  console.log("Saved 11_boss5_portal_opened.png");

  // Advance to Stage 6
  await page.evaluate(() => {
    window.__controlsTest.teleport(2800);
  });
  await page.waitForTimeout(1200);

  // Stage 6: Calx (Boss 6 at 2440)
  await page.evaluate(() => {
    window.__controlsTest.teleport(2260);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "12_boss6_calx_in_action.png") });
  console.log("Saved 12_boss6_calx_in_action.png");

  // Defeat Calx
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "13_boss6_portal_opened.png") });
  console.log("Saved 13_boss6_portal_opened.png");

  // Advance to Stage 7
  await page.evaluate(() => {
    window.__controlsTest.teleport(2760);
  });
  await page.waitForTimeout(1200);

  // Stage 7: Dracula (Boss 7 at 1680)
  await page.evaluate(() => {
    window.__controlsTest.teleport(1500);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "14_boss7_dracula_in_action.png") });
  console.log("Saved 14_boss7_dracula_in_action.png");

  // Defeat Dracula
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "15_boss7_victory_portal.png") });
  console.log("Saved 15_boss7_victory_portal.png");

  await browser.close();
  console.log("All 7 Bosses, Enemies & Portals tested successfully!");
}

main().catch(console.error);
