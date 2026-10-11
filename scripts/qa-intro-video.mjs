import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log("1. Navegando para o jogo...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

  // Clear localStorage intro seen to simulate first time player
  await page.evaluate(() => {
    localStorage.removeItem("nightfall_intro_seen");
    localStorage.removeItem("nightfall_progress");
  });
  await page.reload({ waitUntil: "networkidle" });

  console.log("2. Verificando tela de título...");
  await page.waitForSelector("h1:has-text('Nightfall Chronicles')");
  await page.screenshot({ path: path.join(screenshotsDir, "qa-title-screen.png") });

  const startBtn = page.locator("button:has-text('Iniciar')");
  const prologoBtn = page.locator("button:has-text('Prólogo')");
  console.log("Botão Iniciar visível:", await startBtn.isVisible());
  console.log("Botão Prólogo visível:", await prologoBtn.isVisible());

  console.log("3. Clicando em 'Iniciar' pela primeira vez...");
  await startBtn.click();

  console.log("4. Aguardando vídeo de introdução...");
  const videoElem = page.locator("video");
  await videoElem.waitFor({ state: "visible", timeout: 8000 });
  const videoSrc = await videoElem.getAttribute("src");
  console.log("Vídeo exibido com src:", videoSrc);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-intro-video.png") });

  console.log("5. Clicando em 'Pular Introdução'...");
  const skipBtn = page.locator("button:has-text('Pular Introdução')");
  await skipBtn.click();

  console.log("6. Verificando transição para a primeira fase...");
  await page.waitForSelector("canvas[data-arena], [data-arena] canvas", { timeout: 10000 });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(screenshotsDir, "qa-stage-1-gameplay.png") });

  const introSeen = await page.evaluate(() => localStorage.getItem("nightfall_intro_seen"));
  console.log("nightfall_intro_seen no localStorage:", introSeen);

  console.log("7. Teste de vídeo e transição concluído com SUCESSO!");
  await browser.close();
}

run().catch((err) => {
  console.error("Falha no teste QA:", err);
  process.exit(1);
});
