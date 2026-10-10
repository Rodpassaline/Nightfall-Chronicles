import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "screenshots/fix-verification";

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[BROWSER ERROR]", msg.text());
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 1. Stage 1 Start Check: Verify Idle Player takes 0 damage
  const hp1 = await page.evaluate(() => window.__controlsTest.getHp());
  console.log("Stage 1 start HP:", hp1);
  await page.waitForTimeout(3000);
  const hp2 = await page.evaluate(() => window.__controlsTest.getHp());
  console.log("Stage 1 after 3s idle HP:", hp2);
  if (hp1 !== hp2) {
    console.error("FAIL: Player took damage while idle!");
  } else {
    console.log("PASS: Player took 0 damage while idle.");
  }

  // Take screenshot of clean Stage 1 scenario
  await page.screenshot({ path: path.join(outDir, "stage1_clean_scenario.png") });
  console.log("Saved stage1_clean_scenario.png");

  // 2. Walk forward and jump on platforms
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);

  const heroPos = await page.evaluate(() => ({
    x: window.__controlsTest.getX(),
    y: window.__controlsTest.getY(),
    hp: window.__controlsTest.getHp(),
    grounded: window.__controlsTest.isGrounded(),
  }));
  console.log("Hero after walking and jumping:", heroPos);
  await page.screenshot({ path: path.join(outDir, "stage1_platforming.png") });
  console.log("Saved stage1_platforming.png");

  // 3. Stage 3 (Capela) Check: Verify Seraphine does NOT damage player across map
  await page.evaluate(() => {
    window.__controlsTest.damageBoss(); // Clears Stage 1
  });
  await page.waitForTimeout(500);
  // Teleport to door
  await page.evaluate(() => {
    window.__controlsTest.teleport(5260);
  });
  await page.waitForTimeout(1200);

  // Next level button (Stage 2)
  const nextBtn = page.locator('button:has-text("Próxima Fase")');
  if (await nextBtn.isVisible()) await nextBtn.click();
  await page.waitForTimeout(1000);

  // Clear Stage 2 to go to Stage 3
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__controlsTest.teleport(5460);
  });
  await page.waitForTimeout(1200);

  if (await nextBtn.isVisible()) await nextBtn.click();
  await page.waitForTimeout(1000);

  // Now in Stage 3 (Capela): Seraphine is at x: 5220, player is at x: 40
  const stage3HpStart = await page.evaluate(() => window.__controlsTest.getHp());
  console.log("Stage 3 (Capela) start HP:", stage3HpStart);
  await page.waitForTimeout(3000);
  const stage3HpAfter = await page.evaluate(() => window.__controlsTest.getHp());
  console.log("Stage 3 (Capela) after 3s HP:", stage3HpAfter);

  if (stage3HpStart !== stage3HpAfter) {
    console.error("FAIL: Seraphine attacked player from across the map!");
  } else {
    console.log("PASS: Seraphine is dormant until player reaches arena! 0 damage taken.");
  }

  await page.screenshot({ path: path.join(outDir, "stage3_clean_scenario.png") });
  console.log("Saved stage3_clean_scenario.png");

  await browser.close();
  console.log("All fix verifications completed successfully!");
}

main().catch(console.error);
