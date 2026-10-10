import { chromium } from "playwright";
import fs from "fs";

// Captures 2 views per stage (start + mid) at 1280x720 for visual review.
const OUT = process.argv[2] || "screenshots/review";
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("http://127.0.0.1:8080/");
  await page.evaluate(() =>
    localStorage.setItem("nightfall-campaign", JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] })),
  );
  await page.reload({ waitUntil: "networkidle" });

  const only = process.argv[3] ? process.argv[3].split(",").map(Number) : [1, 2, 3, 4, 5, 6, 7];
  for (const id of only) {
    const sair = page.getByRole("button", { name: "Sair" });
    if (await sair.isVisible().catch(() => false)) {
      await sair.click();
      await page.waitForTimeout(300);
    }
    const fases = page.getByRole("button", { name: "Fases" });
    if (await fases.isVisible().catch(() => false)) {
      await fases.click();
      await page.waitForTimeout(300);
    }
    await page.locator("button").filter({ hasText: `Fase ${id}` }).first().click();
    await page.waitForTimeout(1500);
    for (const [tag, x] of [["a", 420], ["b", 2400]]) {
      await page.evaluate((tx) => window.__controlsTest?.teleport(tx, 140), x);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/stage${id}-${tag}.png` });
    }
    console.log("captured stage", id);
  }
  console.log("errors:", errors.length, errors.slice(0, 5));
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
