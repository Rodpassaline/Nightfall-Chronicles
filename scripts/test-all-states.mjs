import { chromium } from "playwright";

const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await (await p.waitForSelector("button:has-text('Jogar')")).click();
const c = await p.waitForSelector("canvas");
await p.waitForTimeout(600);
await c.click();

const bb = await c.boundingBox();
const heroClip = {
  x: bb.x + bb.width * 0.05,
  y: bb.y + bb.height * 0.35,
  width: bb.width * 0.45,
  height: bb.height * 0.55,
};

// 1. Standing attack
await p.keyboard.press("KeyJ");
await p.waitForTimeout(70);
await p.screenshot({ path: "screenshots/state-attack.png", clip: heroClip });
await p.waitForTimeout(300);

// 2. Cast magic
await p.keyboard.press("KeyL");
await p.waitForTimeout(100);
await p.screenshot({ path: "screenshots/state-cast.png", clip: heroClip });
await p.waitForTimeout(300);

// 3. Jump
await p.keyboard.press("Space");
await p.waitForTimeout(150);
await p.screenshot({ path: "screenshots/state-jump.png", clip: heroClip });
await p.waitForTimeout(500);

// 4. Crouch attack
await p.keyboard.down("KeyS");
await p.waitForTimeout(100);
await p.keyboard.press("KeyJ");
await p.waitForTimeout(70);
await p.screenshot({ path: "screenshots/state-crouch-attack.png", clip: heroClip });
await p.keyboard.up("KeyS");

await b.close();
console.log("Captured all combat and movement states.");
