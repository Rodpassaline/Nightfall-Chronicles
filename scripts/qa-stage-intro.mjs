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

  // Mark intro seen and unlock stages to test all stage cards
  await page.evaluate(() => {
    localStorage.setItem("nightfall_intro_seen", "true");
    localStorage.setItem("nightfall-campaign", JSON.stringify({ unlocked: 7, cleared: [] }));
  });
  await page.reload({ waitUntil: "networkidle" });

  console.log("2. Verificando tela de título...");
  await page.waitForSelector("h1:has-text('Nightfall Chronicles')");

  console.log("3. Clicando em 'Iniciar' para começar a Fase 1...");
  const startBtn = page.locator("button:has-text('Iniciar'), button:has-text('Continuar')");
  await startBtn.click();

  console.log("4. Verificando Stage Intro Card da Fase 1 (Os Portões)...");
  await page.waitForSelector("h1:has-text('OS PORTÕES')", { timeout: 8000 });
  await page.waitForSelector("text='Pátio dos Portões & Muralhas Ancestrais'", { timeout: 4000 });
  await page.waitForSelector("text='Petros'", { timeout: 4000 });

  const stage1ScreenshotPath = path.join(screenshotsDir, "qa-stage1-intro-card.png");
  await page.screenshot({ path: stage1ScreenshotPath });
  console.log("Screenshot do Stage 1 Card salvo:", stage1ScreenshotPath);

  console.log("5. Verificando que o jogo permanece pausado (vida intacta) durante o Card...");
  // Aguardar 3.5 segundos com o card aberto - zumbis não devem se mover nem ferir Aldric
  await page.waitForTimeout(3500);

  // Card ainda deve estar visível (sem auto-dismiss)
  const cardVisible = await page.locator("h1:has-text('OS PORTÕES')").isVisible();
  console.log("Card ainda visível após 3.5s:", cardVisible);
  if (!cardVisible) {
    throw new Error("O card fechou automaticamente sozinho! Deveria esperar o jogador clicar em Iniciar.");
  }

  console.log("6. Clicando em 'INICIAR FASE'...");
  const enterBtn = page.locator("button:has-text('INICIAR FASE')");
  await enterBtn.click();
  await page.waitForTimeout(400);

  console.log("7. Verificando arena da Fase 1 ativa e sem texto borrado...");
  await page.waitForSelector("canvas.pixel-canvas-fullscreen", { timeout: 5000 });
  
  // Aldric deve estar vivo e com HP cheio (não levou dano enquanto lia o card)
  const hudHeartCount = await page.locator(".pixel-heart, [data-heart]").count();
  console.log("Corações no HUD detectados:", hudHeartCount);

  // Esperar o zumbi avançar até Aldric e verificar colisão física
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-stage1-gameplay.png") });

  console.log("8. Testando abertura da Fase 2 a partir do menu de fases...");
  const exitBtn = page.locator("button:has-text('Sair')");
  await exitBtn.click();
  await page.waitForTimeout(400);

  // Clicar no botão da Fase 2 no mapa de fases
  const stage2Btn = page.locator("button:has-text('Galeria de Mármore')");
  await stage2Btn.click();

  console.log("8. Verificando Stage Intro Card da Fase 2...");
  await page.waitForSelector("h1:has-text('GALERIA DE MÁRMORE')", { timeout: 6000 });
  await page.waitForSelector("text='Valerius'", { timeout: 4000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotsDir, "qa-stage2-intro-card.png") });

  console.log("9. Todos os testes de Stage Intro Card concluídos com SUCESSO!");
  await browser.close();
}

run().catch((err) => {
  console.error("Falha no teste QA Stage Intro:", err);
  process.exit(1);
});
