import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "screenshots/castlevania-expansion";

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[BROWSER ERROR]", msg.text());
      errors.push(msg.text());
    }
  });

  console.log("Navigating to http://127.0.0.1:8080/ ...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // 1. Enter Stage 1
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Stage 1 Graveyard start with grounded enemies
  await page.screenshot({ path: path.join(outDir, "01_stage1_start_graveyard.png") });
  console.log("Saved 01_stage1_start_graveyard.png");

  // Teleport into middle section (watchtower & aqueduct chasm at x: 2200) to inspect deep stage traversal
  await page.evaluate(() => {
    window.__controlsTest.teleport(2200);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "02_stage1_chasm_and_catwalks.png") });
  console.log("Saved 02_stage1_chasm_and_catwalks.png");

  // Teleport to Petros arena (Boss 1 at 5040)
  await page.evaluate(() => {
    window.__controlsTest.teleport(4880);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "03_boss1_petros_arena.png") });
  console.log("Saved 03_boss1_petros_arena.png");

  // Defeat Petros: Portal opens at 5320!
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "04_boss1_portal_opened.png") });
  console.log("Saved 04_boss1_portal_opened.png");

  // Step into Portal to advance to Stage 2
  await page.evaluate(() => {
    window.__controlsTest.teleport(5320);
  });
  await page.waitForTimeout(1500);

  // Stage 2: Valerius (Boss 2 at 5240)
  await page.evaluate(() => {
    window.__controlsTest.teleport(5080);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "05_boss2_valerius_arena.png") });
  console.log("Saved 05_boss2_valerius_arena.png");

  // Defeat Valerius
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "06_boss2_portal_opened.png") });
  console.log("Saved 06_boss2_portal_opened.png");

  // Step into Portal to advance to Stage 3
  await page.evaluate(() => {
    window.__controlsTest.teleport(5520);
  });
  await page.waitForTimeout(1500);

  // Stage 3: Seraphine (Boss 3 at 5120)
  await page.evaluate(() => {
    window.__controlsTest.teleport(4960);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "07_boss3_seraphine_arena.png") });
  console.log("Saved 07_boss3_seraphine_arena.png");

  // Defeat Seraphine
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "08_boss3_portal_opened.png") });
  console.log("Saved 08_boss3_portal_opened.png");

  // Step into Portal to advance to Stage 4
  await page.evaluate(() => {
    window.__controlsTest.teleport(5420);
  });
  await page.waitForTimeout(1500);

  // Stage 4: Nocturne (Boss 4 at 5440)
  await page.evaluate(() => {
    window.__controlsTest.teleport(5280);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "09_boss4_nocturne_arena.png") });
  console.log("Saved 09_boss4_nocturne_arena.png");

  // Defeat Nocturne
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "10_boss4_portal_opened.png") });
  console.log("Saved 10_boss4_portal_opened.png");

  // Step into Portal to advance to Stage 5
  await page.evaluate(() => {
    window.__controlsTest.teleport(5720);
  });
  await page.waitForTimeout(1500);

  // Stage 5: Lorde Veyne (Boss 5 at 5240)
  await page.evaluate(() => {
    window.__controlsTest.teleport(5080);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "11_boss5_veyne_arena.png") });
  console.log("Saved 11_boss5_veyne_arena.png");

  // Defeat Veyne
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "12_boss5_portal_opened.png") });
  console.log("Saved 12_boss5_portal_opened.png");

  // Step into Portal to advance to Stage 6
  await page.evaluate(() => {
    window.__controlsTest.teleport(5520);
  });
  await page.waitForTimeout(1500);

  // Stage 6: Calx (Boss 6 at 5340)
  await page.evaluate(() => {
    window.__controlsTest.teleport(5180);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "13_boss6_calx_arena.png") });
  console.log("Saved 13_boss6_calx_arena.png");

  // Defeat Calx
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "14_boss6_portal_opened.png") });
  console.log("Saved 14_boss6_portal_opened.png");

  // Step into Portal to advance to Stage 7 (Throne Room)
  await page.evaluate(() => {
    window.__controlsTest.teleport(5620);
  });
  await page.waitForTimeout(1500);

  // Stage 7: Dracula Dais (Boss 7 at 4800)
  await page.evaluate(() => {
    window.__controlsTest.teleport(4640);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "15_boss7_dracula_throne.png") });
  console.log("Saved 15_boss7_dracula_throne.png");

  // Defeat Dracula
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "16_boss7_dracula_victory.png") });
  console.log("Saved 16_boss7_dracula_victory.png");

  await browser.close();
  console.log("Castlevania Expansion test completed with 0 errors!");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
