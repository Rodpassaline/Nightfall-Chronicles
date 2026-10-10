import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.message);
    errors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("CONSOLE_ERROR:", msg.text());
      errors.push(msg.text());
    }
  });

  await page.goto("http://127.0.0.1:8080/");
  await page.evaluate(() => {
    localStorage.setItem(
      "nightfall-campaign",
      JSON.stringify({ unlocked: 7, cleared: [1, 2, 3, 4, 5, 6] })
    );
  });
  await page.reload({ waitUntil: "networkidle" });

  const stagesToTest = [
    { id: 1, name: "Portões", teleportX: 500, teleportY: 140, file: "screenshots/stage1-cemetery-gates.png" },
    { id: 1, name: "Portões-Gate", teleportX: 4100, teleportY: 140, file: "screenshots/stage1-monumental-gate.png" },
    { id: 3, name: "Capela-Nave", teleportX: 600, teleportY: 140, file: "screenshots/stage3-chapel-nave.png" },
    { id: 3, name: "Capela-Altar", teleportX: 5100, teleportY: 140, file: "screenshots/stage3-chapel-altar.png" },
    { id: 4, name: "Catacumbas-Cells", teleportX: 500, teleportY: 140, file: "screenshots/stage4-catacombs-cells.png" },
    { id: 4, name: "Catacumbas-Crypt", teleportX: 1600, teleportY: 200, file: "screenshots/stage4-catacombs-crypt.png" },
    { id: 5, name: "Biblioteca-Desk", teleportX: 600, teleportY: 140, file: "screenshots/stage5-library-desks.png" },
    { id: 5, name: "Biblioteca-Tower", teleportX: 2800, teleportY: 100, file: "screenshots/stage5-library-tower.png" },
    { id: 6, name: "Alquimia-Vats", teleportX: 600, teleportY: 140, file: "screenshots/stage6-alchemy-vats.png" },
    { id: 6, name: "Alquimia-Lab", teleportX: 2800, teleportY: 140, file: "screenshots/stage6-alchemy-lab.png" },
    { id: 7, name: "Trono-Hall", teleportX: 600, teleportY: 140, file: "screenshots/stage7-throne-hall.png" },
    { id: 7, name: "Trono-Dracula", teleportX: 4800, teleportY: 130, file: "screenshots/stage7-dracula-throne.png" },
  ];

  for (const st of stagesToTest) {
    console.log(`Testing Stage ${st.id} (${st.name})...`);
    // Enter Stage Select
    const sairBtn = page.getByRole("button", { name: "SAIR" });
    if (await sairBtn.isVisible()) {
      await sairBtn.click();
      await page.waitForTimeout(300);
    }
    const fasesBtn = page.getByRole("button", { name: "Fases" });
    if (await fasesBtn.isVisible()) {
      await fasesBtn.click();
      await page.waitForTimeout(400);
    }

    const stageBtn = page.locator("button").filter({ hasText: `Fase ${st.id}` }).first();
    await stageBtn.click();
    await page.waitForTimeout(1000);

    // Teleport player & camera to showcase location
    await page.evaluate(({ tx, ty }) => {
      if (window.__controlsTest) {
        window.__controlsTest.teleport(tx, ty);
      }
    }, { tx: st.teleportX, ty: st.teleportY });

    await page.waitForTimeout(600);
    await page.screenshot({ path: st.file });
    console.log(`Captured ${st.file}`);
  }

  console.log("ALL STAGES TESTED. Console errors count:", errors.length);
  await browser.close();
}

main().catch(console.error);
