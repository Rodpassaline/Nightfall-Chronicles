import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "screenshots/bosses-qa";

const stages = [
  { id: 2, name: "valerius", teleX: 2360 },
  { id: 3, name: "seraphine", teleX: 2260 },
  { id: 4, name: "nocturne", teleX: 2380 },
  { id: 5, name: "veyne", teleX: 2400 },
  { id: 6, name: "calx", teleX: 2340 },
  { id: 7, name: "dracula", teleX: 1560 },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("nightfall-campaign", JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] }));
  });

  for (const st of stages) {
    console.log(`Testing Stage ${st.id}: ${st.name}...`);
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    // Click "Fases" button to open stages selector
    const mapBtn = page.locator('button:has-text("Fases")').first();
    await mapBtn.click();
    await page.waitForTimeout(300);

    // Click stage button e.g. "Fase 2"
    const stageBtn = page.locator(`button:has-text("Fase ${st.id}")`).first();
    await stageBtn.click();

    await page.waitForSelector("canvas", { timeout: 10000 });
    await page.waitForTimeout(800);

    // Teleport player near boss
    await page.evaluate((x) => {
      if (window.__controlsTest) {
        window.__controlsTest.teleport(x);
      }
    }, st.teleX);

    await page.waitForTimeout(1000);
    const shotPath = path.join(outDir, `stage${st.id}_${st.name}_combat.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved ${shotPath}`);
  }

  await browser.close();
  console.log("All boss combat screenshots captured successfully!");
}

main().catch(console.error);
