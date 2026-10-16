import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Pre-seed localStorage so game skips prologue and enters gameplay directly
  await page.addInitScript(() => {
    localStorage.setItem("nightfall_intro_seen", "true");
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Click start game button
  const startBtn = await page.$("button:has-text('Iniciar Campanha'), button:has-text('Iniciar'), button:has-text('Jogar')");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  // Dismiss stage intro banner if present by pressing Space or Enter or clicking
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);

  // Frame 1: Initial spawn & stalk
  await page.screenshot({ path: "screenshots/gargoyle_live_1.png" });
  console.log("Captured gargoyle_live_1.png");

  // Move right slightly towards the gargoyle
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/gargoyle_live_2.png" });
  console.log("Captured gargoyle_live_2.png");

  // Wait for gargoyle to leap / hover
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/gargoyle_live_3.png" });
  console.log("Captured gargoyle_live_3.png");

  // Attack with Z
  await page.keyboard.press("KeyZ");
  await page.waitForTimeout(350);
  await page.screenshot({ path: "screenshots/gargoyle_live_4.png" });
  console.log("Captured gargoyle_live_4.png");

  await browser.close();
  console.log("Capture script finished successfully!");
}

main().catch(console.error);
