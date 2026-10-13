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

  const startBtn = page.locator("button:has-text('Iniciar')");
  const prologoBtn = page.locator("button:has-text('Prólogo')");
  console.log("Botão Iniciar visível:", await startBtn.isVisible());
  console.log("Botão Prólogo visível:", await prologoBtn.isVisible());

  console.log("3. Clicando em 'Iniciar' pela primeira vez para ver o prólogo...");
  await startBtn.click();

  // Ato 1
  console.log("4. Verificando Ato 1 do Prólogo...");
  await page.waitForSelector("text='Ato 1 de 4'", { timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-prologue-clean-act1.png") });

  // Avançar para Ato 2
  console.log("5. Avançando para Ato 2...");
  const nextBtn = page.locator("button:has-text('Avançar'), button:has-text('Próximo')");
  await nextBtn.click();
  await page.waitForSelector("text='Ato 2 de 4'", { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-prologue-clean-act2.png") });

  // Avançar para Ato 3
  console.log("6. Avançando para Ato 3...");
  await nextBtn.click();
  await page.waitForSelector("text='Ato 3 de 4'", { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-prologue-clean-act3.png") });

  // Avançar para Ato 4
  console.log("7. Avançando para Ato 4...");
  await nextBtn.click();
  await page.waitForSelector("text='Ato 4 de 4'", { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-prologue-clean-act4.png") });

  // Clicar em "Entrar no Castelo"
  console.log("8. Clicando em 'Entrar no Castelo' para iniciar a Fase 1...");
  const enterBtn = page.locator("button:has-text('Entrar no Castelo')");
  await enterBtn.click();

  console.log("9. Aguardando canvas e HUD da Fase 1...");
  await page.waitForSelector("canvas[data-arena], [data-arena] canvas", { timeout: 10000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-prologue-to-stage1.png") });

  const introSeen = await page.evaluate(() => localStorage.getItem("nightfall_intro_seen"));
  console.log("nightfall_intro_seen no localStorage:", introSeen);

  console.log("10. Teste de prólogo e transição concluído com SUCESSO!");
  await browser.close();
}

run().catch((err) => {
  console.error("Falha no teste QA:", err);
  process.exit(1);
});
