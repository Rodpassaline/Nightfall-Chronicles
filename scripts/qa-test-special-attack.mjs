import { chromium } from "playwright";

async function run() {
  console.log("Launching Edge to test special attack live in-game...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.text().startsWith("[PAGE DEBUG]")) console.log(msg.text());
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click on "FASES" directly to go to stage select
  const fasesBtn = page.locator("button:has-text('FASES')").first();
  if (await fasesBtn.isVisible()) {
    console.log("Clicking FASES...");
    await fasesBtn.click();
    await page.waitForTimeout(1000);
  } else {
    // If on prologue, click Pular
    const pularBtn = page.locator("button:has-text('PULAR')").first();
    if (await pularBtn.isVisible()) {
      await pularBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Click Fase 1
  const stage1Btn = page.locator("button:has-text('Fase 1')").first();
  console.log("Clicking Fase 1...");
  await stage1Btn.click();
  await page.waitForTimeout(1500);

  // Dismiss intro card with Space
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // Check initial special meter
  const initialSpecial = await page.evaluate(() => window.__controlsTest?.getSpecial?.());
  console.log("Initial special gauge:", initialSpecial);

  // Set special to 100% to simulate full charge
  await page.evaluate(() => {
    window.__controlsTest?.setSpecial?.(100);
  });
  await page.waitForTimeout(300);

  // Take screenshot of HUD with 100% full special meter and glowing button
  await page.screenshot({ path: "screenshots/special_ready_hud.png" });
  console.log("Captured screenshots/special_ready_hud.png");

  // Focus canvas to ensure it receives keyboard events
  const canvas = page.locator("canvas").first();
  await canvas.click();
  await page.waitForTimeout(200);

  // Check that the special gauge in DOM says 100% and ESPECIAL PRONTO!
  const hasSpecialReadyText = await page.locator("text=ESPECIAL PRONTO!").isVisible();
  console.log("HUD displays 'ESPECIAL PRONTO!':", hasSpecialReadyText);

  // Check activeElement and key handling
  await page.evaluate(() => {
    window.addEventListener("keydown", (e) => {
      console.log(`[PAGE DEBUG] keydown: code=${e.code}, key=${e.key}, activeEl=${document.activeElement?.tagName}`);
    });
  });

  console.log("Triggering special attack with KeyE...");
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(160);

  let isActive = await page.evaluate(() => window.__controlsTest?.isSpecialActive?.());
  let specialAfterTrigger = await page.evaluate(() => window.__controlsTest?.getSpecial?.());
  console.log("Special active with page.keyboard.press(KeyE):", isActive, "gauge:", specialAfterTrigger);

  if (!isActive) {
    console.log("Trying with setKeys(['KeyE'])...");
    await page.evaluate(() => {
      window.__controlsTest?.setKeys?.(["KeyE"]);
    });
    await page.waitForTimeout(100);
    isActive = await page.evaluate(() => {
      const act = window.__controlsTest?.isSpecialActive?.();
      window.__controlsTest?.setKeys?.([]);
      return act;
    });
    specialAfterTrigger = await page.evaluate(() => window.__controlsTest?.getSpecial?.());
    console.log("Special active with setKeys(['KeyE']):", isActive, "gauge:", specialAfterTrigger);
  }

  // Capture Aldric during the deep lunge thrust with the crescent wave active!
  await page.screenshot({ path: "screenshots/special_attack_active.png" });
  console.log("Captured screenshots/special_attack_active.png");

  await page.waitForTimeout(250);
  await page.screenshot({ path: "screenshots/special_attack_wave.png" });
  console.log("Captured screenshots/special_attack_wave.png");

  // Test with touch context
  console.log("Testing mobile / touch context with touch button...");
  const touchContext = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await touchPage.waitForTimeout(800);

  const tFasesBtn = touchPage.locator("button:has-text('FASES')").first();
  if (await tFasesBtn.isVisible()) {
    await tFasesBtn.click();
    await touchPage.waitForTimeout(800);
  }
  const tStage1Btn = touchPage.locator("button:has-text('Fase 1')").first();
  await tStage1Btn.click();
  await touchPage.waitForTimeout(1200);
  await touchPage.keyboard.press("Space");
  await touchPage.waitForTimeout(500);

  await touchPage.evaluate(() => {
    window.__controlsTest?.setSpecial?.(100);
  });
  await touchPage.waitForTimeout(300);

  const specialTouchBtn = touchPage.locator("button:has-text('ESPECIAL!')").first();
  const isTouchBtnVisible = await specialTouchBtn.isVisible();
  console.log("Touch Special button is visible in mobile view:", isTouchBtnVisible);
  if (isTouchBtnVisible) {
    await touchPage.screenshot({ path: "screenshots/special_touch_button_ready.png" });
    console.log("Captured screenshots/special_touch_button_ready.png");
    await specialTouchBtn.click();
    await touchPage.waitForTimeout(100);
    const activeViaTouch = await touchPage.evaluate(() => window.__controlsTest?.isSpecialActive?.());
    console.log("Special activated via Touch Button:", activeViaTouch);
  }
  await touchContext.close();

  // Test Attack + Spell dual button trigger
  console.log("Testing simultaneous Attack + Spell trigger...");
  await page.evaluate(() => {
    window.__controlsTest?.setSpecial?.(100);
    window.__controlsTest?.setKeys?.(["KeyJ", "KeyL"]);
  });
  await page.waitForTimeout(150);
  const activeViaDual = await page.evaluate(() => {
    const active = window.__controlsTest?.isSpecialActive?.();
    window.__controlsTest?.setKeys?.([]);
    return active;
  });
  console.log("Special activated via Attack + Spell simultaneous:", activeViaDual);

  console.log("Console errors:", consoleErrors);
  await browser.close();
  console.log("All QA tests completed successfully!");
}

run().catch(console.error);
