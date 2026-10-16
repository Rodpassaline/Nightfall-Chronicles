import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("PAGE CONSOLE ERROR:", msg.text());
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const startBtn = await page.$("button:has-text('Iniciar'), button:has-text('Jogar'), button:has-text('Start'), button");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(800);
  }

  // Inject player position to x = 850 (right before gargoyle at x = 950)
  await page.evaluate(() => {
    // In window or global scope, find the game canvas or keyboard
    // Let's press ArrowRight for several seconds to reach x = 950
  });

  for (let i = 0; i < 45; i++) {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(60);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(15);
  }

  // Screenshot as gargoyle appears on screen
  await page.screenshot({ path: "screenshots/qa_gargoyle_on_screen.png" });
  console.log("Saved screenshots/qa_gargoyle_on_screen.png");

  // Wait a moment for gargoyle to react (leap/hover/fire/dive)
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/qa_gargoyle_airborne.png" });
  console.log("Saved screenshots/qa_gargoyle_airborne.png");

  // Attack with Z
  await page.keyboard.press("KeyZ");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/qa_gargoyle_hit.png" });
  console.log("Saved screenshots/qa_gargoyle_hit.png");

  await browser.close();
}

main().catch(console.error);
