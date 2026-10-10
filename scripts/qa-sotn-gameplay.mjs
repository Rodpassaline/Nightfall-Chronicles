import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

async function run() {
  if (!existsSync("screenshots")) mkdirSync("screenshots", { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.message);
    errors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("CONSOLE_ERROR:", msg.text());
      errors.push(msg.text());
    }
  });

  console.log("Navigating to http://127.0.0.1:8080/ ...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Unlock all levels in localStorage
  await page.evaluate(() => {
    localStorage.setItem(
      "nightfall-campaign",
      JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] })
    );
  });

  // Reload to pick up unlocked progress
  await page.reload({ waitUntil: "networkidle" });

  // Click "Fases" button
  console.log("Entering stage selection...");
  const fasesBtn = page.getByRole("button", { name: "Fases" });
  await fasesBtn.click();
  await page.waitForTimeout(500);

  // Click Stage 2: "Galeria de Mármore"
  console.log("Selecting Stage 2: Galeria de Mármore...");
  const stage2Btn = page.locator("button:has-text('Galeria de Mármore')").first();
  await stage2Btn.click();
  await page.waitForTimeout(1000);

  // Check canvas mounted
  const canvas = page.locator("canvas");
  await canvas.waitFor({ state: "visible" });
  console.log("Canvas mounted. Capturing Entrance Colonnade screenshot...");

  // Wait 1.5s for art and initial render
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/sotn-stage2-entrance.png" });

  // Move player right into Section 1 to duel Armored Skeleton and encounter Red Skeleton
  console.log("Walking right towards Armored Skeleton...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2000);
  await page.keyboard.up("KeyD");

  // Attack Armored Skeleton from front to trigger shield deflection
  console.log("Attacking Armored Skeleton with horizontal slash...");
  await page.keyboard.press("KeyJ");
  await page.waitForTimeout(120);
  await page.keyboard.press("KeyJ");
  await page.waitForTimeout(300);

  await page.screenshot({ path: "screenshots/sotn-stage2-combat.png" });

  // Now inspect the Sunken Gladiator Crypts (x = 1600, sunken floor y = 255)
  console.log("Positioning inside Sunken Gladiator Crypts (x = 1600)...");
  const hook1 = await page.evaluate(() => {
    if (window.__controlsTest) {
      window.__controlsTest.teleport(1600, 205);
      return true;
    }
    return false;
  });
  console.log("Teleport to crypt executed:", hook1);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/sotn-stage2-sunken-crypt.png" });

  // Now inspect the Hall of the Colossus (x = 2950, statue base)
  console.log("Positioning inside Hall of the Colossus (x = 2950)...");
  const hook2 = await page.evaluate(() => {
    if (window.__controlsTest) {
      window.__controlsTest.teleport(2950, 150);
      return true;
    }
    return false;
  });
  console.log("Teleport to colossus executed:", hook2);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/sotn-stage2-colossus-hall.png" });

  console.log("Captured all gameplay screenshots successfully!");
  console.log("Total errors:", errors.length);

  await browser.close();
}

run().catch((err) => {
  console.error("FATAL QA ERROR:", err);
  process.exit(1);
});
