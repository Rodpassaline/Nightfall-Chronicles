import { chromium } from "playwright";

async function main() {
  console.log("Starting live browser QA to verify Gargoyle enemy rendering...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("PAGE CONSOLE ERROR:", msg.text());
  });

  // Navigate to dev server
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click start game button if present
  const startBtn = await page.$("button:has-text('Iniciar'), button:has-text('Jogar'), button:has-text('Start'), button");
  if (startBtn) {
    await startBtn.click();
    await page.waitForTimeout(800);
  }

  // Take screenshot of Stage 1 gameplay with gargoyle encounter
  await page.screenshot({ path: "screenshots/qa_gargoyle_gameplay_start.png" });

  // Move right towards the first gargoyle (x=950 in Stage 1)
  for (let i = 0; i < 20; i++) {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(100);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(50);
  }

  // Capture screenshot as player approaches the gargoyle
  await page.screenshot({ path: "screenshots/qa_gargoyle_encounter.png" });
  console.log("Saved screenshots/qa_gargoyle_encounter.png");

  // Attack with 'Z' key
  await page.keyboard.press("KeyZ");
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyZ");
  await page.waitForTimeout(300);

  await page.screenshot({ path: "screenshots/qa_gargoyle_combat.png" });
  console.log("Saved screenshots/qa_gargoyle_combat.png");

  await browser.close();
  console.log("Live QA finished!");
}

main().catch(console.error);
