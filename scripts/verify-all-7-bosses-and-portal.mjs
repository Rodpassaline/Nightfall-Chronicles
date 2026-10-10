import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/scratch";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[PAGE ERROR]", msg.text());
    }
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // 1. Enter Stage 1
  const playBtn = page.locator('button:has-text("Jogar"), button:has-text("Continuar")').first();
  await playBtn.click();
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Teleport near Petros (Boss 1 at x: 2540)
  const boss1Info = await page.evaluate(async () => {
    const probe = window.__controlsTest;
    probe.teleport(2360);
    return {
      enemies: probe.getEnemies(),
    };
  });
  console.log("Stage 1 Enemies:", boss1Info.enemies.map(e => `${e.kind} (${e.name})`));

  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "qa-boss1-petros-alive.png") });
  console.log("Saved qa-boss1-petros-alive.png");

  // Defeat Petros and verify portal appearance!
  console.log("Defeating Petros...");
  await page.evaluate(() => {
    window.__controlsTest.damageBoss();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "qa-boss1-portal-open.png") });
  console.log("Saved qa-boss1-portal-open.png");

  // Step through portal to advance!
  console.log("Stepping into portal...");
  await page.evaluate(() => {
    window.__controlsTest.teleport(2740);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "qa-portal-advance.png") });
  console.log("Saved qa-portal-advance.png");

  // 2. Select and test Stage 2 (Valerius)
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.click('button:has-text("Fases")');
  await page.waitForTimeout(400);
  // Click stage 2 if unlocked, or start via direct state
  const stage2Btn = page.locator('button:has-text("Galeria")').first();
  if (await stage2Btn.isVisible()) {
    await stage2Btn.click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.__controlsTest.teleport(2320);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "qa-boss2-valerius.png") });
    console.log("Saved qa-boss2-valerius.png");
  }

  // 3. Test Stage 7 (Dracula)
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.click('button:has-text("Fases")');
  await page.waitForTimeout(400);
  const stage7Btn = page.locator('button:has-text("Sala do Trono")').first();
  if (await stage7Btn.isVisible()) {
    await stage7Btn.click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.__controlsTest.teleport(1480);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "qa-boss7-dracula.png") });
    console.log("Saved qa-boss7-dracula.png");
  }

  await browser.close();
  console.log("Boss verification test complete!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
