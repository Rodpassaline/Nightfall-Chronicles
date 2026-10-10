import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on("console", (msg) => {
    console.log("[BROWSER CONSOLE]", msg.type(), msg.text());
  });

  page.on("pageerror", (err) => {
    console.log("[BROWSER ERROR]", err);
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  console.log("Loaded title page");

  // Click Jogar
  const playBtn = await page.waitForSelector("button:has-text('Jogar')");
  await playBtn.click();
  console.log("Clicked Jogar");

  // Wait for canvas
  const canvas = await page.waitForSelector("canvas");
  console.log("Canvas ready");
  await page.waitForTimeout(600);

  // Focus canvas
  await canvas.click();

  const getProbe = () => page.evaluate(() => {
    const p = window.__controlsTest;
    if (!p) return null;
    return {
      x: p.getX(),
      y: p.getY(),
      rawY: p.getRawY(),
      h: p.getH(),
      vy: p.getVy(),
      speed: p.getSpeed(),
      grounded: p.isGrounded(),
      crouching: p.isCrouching(),
      attackKind: p.getAttackKind(),
      attackT: p.getAttackT(),
    };
  });

  console.log("Initial state:", await getProbe());
  await canvas.screenshot({ path: "scratch-standing.png" });

  // Press ArrowDown
  console.log("Holding ArrowDown...");
  await page.keyboard.down("ArrowDown");
  
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(50);
    const state = await getProbe();
    console.log(`Step ${i} holding ArrowDown:`, JSON.stringify(state));
    if (i === 4) {
      await canvas.screenshot({ path: "scratch-crouch-step4.png" });
    }
  }

  // Press KeyJ while holding ArrowDown
  console.log("Pressing KeyJ while holding ArrowDown...");
  await page.keyboard.down("KeyJ");
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(40);
    const state = await getProbe();
    console.log(`Step ${i} after KeyJ:`, JSON.stringify(state));
    if (i === 2) {
      await canvas.screenshot({ path: "scratch-crouch-attack.png" });
    }
  }
  await page.keyboard.up("KeyJ");

  await page.keyboard.up("ArrowDown");
  await browser.close();
  console.log("Test completed successfully!");
}

main().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
