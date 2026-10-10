import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "C:\\Users\\rodpa\\.gemini\\antigravity\\brain\\ca749cb1-0bbc-4c6a-810b-5903a41e7c31\\scratch";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  await page.locator("button:has-text('Fases')").first().click();
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Os Portões')").first().click();
  await page.waitForTimeout(1500);

  const canvas = page.locator("canvas");
  await canvas.click();

  // Walk forward a bit so the item at x: 210 is clearly visible floating
  console.log("Walking slightly forward to view item...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(outDir, "qa-item-floating.png") });
  console.log("Saved qa-item-floating.png");

  // Walk into the item to collect it
  console.log("Collecting heal elixir...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(800);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(outDir, "qa-item-collected.png") });
  console.log("Saved qa-item-collected.png");

  // Walk up stairs to collect life chalice on deck at x: 490
  console.log("Climbing stairs towards life chalice...");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyW");
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(outDir, "qa-life-chalice.png") });
  console.log("Saved qa-life-chalice.png");

  await browser.close();
  console.log("Item pickup test finished!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
