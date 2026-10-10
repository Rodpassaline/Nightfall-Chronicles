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
  x: bb.x + bb.width * 0.12,
  y: bb.y + bb.height * 0.35,
  width: bb.width * 0.35,
  height: bb.height * 0.55,
};

// 1. Idle
await p.screenshot({ path: "screenshots/game-idle.png", clip: heroClip });

// 2. Running frames
await p.keyboard.down("KeyD");
for (let i = 0; i < 4; i++) {
  await p.waitForTimeout(100);
  await p.screenshot({ path: `screenshots/game-run-${i}.png`, clip: heroClip });
}
await p.keyboard.up("KeyD");
await p.waitForTimeout(300);

// 3. Crouch
await p.keyboard.down("KeyS");
await p.waitForTimeout(150);
await p.screenshot({ path: "screenshots/game-crouch.png", clip: heroClip });
await p.keyboard.up("KeyS");
await p.waitForTimeout(200);

// 4. Guard
await p.keyboard.down("KeyC");
await p.waitForTimeout(150);
await p.screenshot({ path: "screenshots/game-guard.png", clip: heroClip });
await p.keyboard.up("KeyC");
await p.waitForTimeout(200);

await b.close();
console.log("All game screenshots captured.");
