import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  console.log("Page loaded");

  const playBtn = await page.waitForSelector("button:has-text('Jogar'), button:has-text('Continuar')");
  await playBtn.click();
  console.log("Clicked Jogar");

  const canvas = await page.waitForSelector("canvas");
  await page.waitForTimeout(600);
  await canvas.click();

  const getProbe = () => page.evaluate(() => {
    const p = window.__controlsTest;
    if (!p) return null;
    return {
      x: Math.round(p.getX()),
      feetY: Math.round(p.getY()),
      y: Math.round(p.getRawY()),
      h: p.getH(),
      vy: Math.round(p.getVy()),
      vx: Math.round(p.getSpeed()),
      facing: p.getFacing(),
      grounded: p.isGrounded(),
      crouching: p.isCrouching(),
      attackKind: p.getAttackKind(),
      attackT: Number(p.getAttackT().toFixed(3)),
      castT: Number((p.getCastT?.() ?? 0).toFixed(3)),
      charging: Boolean(p.isCharging?.()),
    };
  });

  // 1. Standing Idle (x ~ 40)
  console.log("1. Testing Standing Idle...");
  console.log("Idle state:", await getProbe());
  await canvas.screenshot({ path: "screenshots/1-idle.png" });

  // 2. Crouch Idle (x ~ 40, open field)
  console.log("2. Testing Crouch Idle...");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(100);
  console.log("Crouch state:", await getProbe());
  await canvas.screenshot({ path: "screenshots/2-crouch-idle.png" });

  // 3. Crouch Attack (ArrowDown + KeyJ)
  console.log("3. Testing Crouch Attack...");
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(50);
  console.log("Crouch attack active:", await getProbe());
  await canvas.screenshot({ path: "screenshots/3-crouch-attack.png" });
  await page.keyboard.up("KeyJ");
  await page.waitForTimeout(250);

  // 4. Crouch Spell (ArrowDown + KeyL)
  console.log("4. Testing Crouch Spell...");
  await page.keyboard.down("KeyL");
  await page.waitForTimeout(50);
  console.log("Crouch spell active:", await getProbe());
  await canvas.screenshot({ path: "screenshots/4-crouch-spell.png" });
  await page.keyboard.up("KeyL");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowDown");
  await page.waitForTimeout(150);

  // 5. Standing Attack (KeyJ)
  console.log("5. Testing Standing Attack...");
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(60);
  console.log("Standing attack active:", await getProbe());
  await canvas.screenshot({ path: "screenshots/5-standing-attack.png" });
  await page.keyboard.up("KeyJ");
  await page.waitForTimeout(250);

  // 6. Running
  console.log("6. Testing Running...");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(80);
  console.log("Running active:", await getProbe());
  await canvas.screenshot({ path: "screenshots/6-running.png" });
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(150);

  // 7. Jump + Down-slash Pogo
  console.log("7. Testing Jump + Down-slash Pogo...");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(120);
  await page.keyboard.up("KeyW");
  await page.keyboard.down("ArrowDown");
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(40);
  console.log("Down-slash pogo active:", await getProbe());
  await canvas.screenshot({ path: "screenshots/7-down-pogo.png" });
  await page.keyboard.up("KeyJ");
  await page.keyboard.up("ArrowDown");

  await page.waitForTimeout(650);

  console.log("8. Testing Charged Attack...");
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(600);
  const chargeState = await getProbe();
  console.log("Charged attack active:", chargeState);
  if (!chargeState?.charging || chargeState.crouching || !chargeState.grounded) {
    throw new Error("Standing charged attack did not enter wind state");
  }
  await canvas.screenshot({ path: "screenshots/8-charged-attack.png" });
  await page.keyboard.up("KeyJ");

  await browser.close();
  console.log("Test suite completed successfully!");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
