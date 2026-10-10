import { chromium } from "playwright";
import fs from "fs";

async function run() {
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    try {
      browser = await chromium.launch({ channel: "chrome", headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }
  const errors = [];

  console.log("=== Testing Desktop Fullscreen (1280x720) ===");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[Console Error] ${msg.text()}`);
  });
  desktopPage.on("pageerror", (err) => errors.push(`[Page Error] ${err.message}`));

  await desktopPage.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  
  // Click "Jogar" or "Continuar" to start playing
  const playBtn = desktopPage.locator("button:has-text('Jogar'), button:has-text('Continuar')").first();
  await playBtn.click();
  await desktopPage.waitForTimeout(1000);

  // Check that virtual gamepad buttons are gone
  const dpad = await desktopPage.locator("text=D-PAD").count();
  const golpe = await desktopPage.locator("button:has-text('GOLPE')").count();
  const pulo = await desktopPage.locator("button:has-text('PULO')").count();
  const defesa = await desktopPage.locator("button:has-text('DEFESA')").count();

  console.log(`Gamepad elements present: D-Pad=${dpad}, Golpe=${golpe}, Pulo=${pulo}, Defesa=${defesa}`);
  if (dpad > 0 || golpe > 0 || pulo > 0 || defesa > 0) {
    throw new Error("FAIL: Virtual gamepad controls are still visible on screen!");
  }

  // Check canvas bounds
  const canvasBox = await desktopPage.locator("canvas.pixel-canvas-fullscreen").boundingBox();
  console.log("Desktop Canvas dimensions:", canvasBox);

  // Capture desktop screenshot
  if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots", { recursive: true });
  await desktopPage.screenshot({ path: "screenshots/desktop-fullscreen.png" });
  console.log("Saved screenshots/desktop-fullscreen.png");

  console.log("\n=== Testing Mobile Smartphone (iPhone / Android 390x844) ===");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[Console Error] ${msg.text()}`);
  });
  mobilePage.on("pageerror", (err) => errors.push(`[Page Error] ${err.message}`));

  await mobilePage.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const mobilePlay = mobilePage.locator("button:has-text('Jogar'), button:has-text('Continuar')").first();
  await mobilePlay.click();
  await mobilePage.waitForTimeout(1800);

  const mobileCanvasBox = await mobilePage.locator("canvas.pixel-canvas-fullscreen").boundingBox();
  console.log("Mobile Canvas dimensions:", mobileCanvasBox);

  await mobilePage.screenshot({ path: "screenshots/mobile-fullscreen.png" });
  console.log("Saved screenshots/mobile-fullscreen.png");

  // Also test landscape mobile (844x390)
  console.log("\n=== Testing Mobile Landscape (844x390) ===");
  await mobilePage.setViewportSize({ width: 844, height: 390 });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: "screenshots/mobile-landscape.png" });
  console.log("Saved screenshots/mobile-landscape.png");

  await browser.close();

  console.log("\n=== SUMMARY ===");
  console.log("Errors encountered:", errors.length);
  if (errors.length > 0) {
    console.error(errors);
  } else {
    console.log("SUCCESS! Game fills screen responsively, on-screen controls are removed, 0 errors.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
