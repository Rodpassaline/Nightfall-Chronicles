import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SIZES = [
  { folder: "mipmap-mdpi", size: 48, fgSize: 108 },
  { folder: "mipmap-hdpi", size: 72, fgSize: 162 },
  { folder: "mipmap-xhdpi", size: 96, fgSize: 216 },
  { folder: "mipmap-xxhdpi", size: 144, fgSize: 324 },
  { folder: "mipmap-xxxhdpi", size: 192, fgSize: 432 },
];

async function generateIcons() {
  console.log("[android-icons] Gerando ícones nativos do Android para Nightfall Chronicles...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  const heroB64 = fs.readFileSync("public/art/hero.jpg").toString("base64");

  const icons = await page.evaluate(
    async ({ heroB64, sizes }) => {
      function loadImg(src) {
        return new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = src;
        });
      }

      const img = await loadImg("data:image/jpeg;base64," + heroB64);
      const out = {};

      for (const { folder, size, fgSize } of sizes) {
        // Square / rounded-rect icon
        const c1 = document.createElement("canvas");
        c1.width = size;
        c1.height = size;
        const ctx1 = c1.getContext("2d");

        // Center crop from hero.jpg
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) * 0.15;

        ctx1.fillStyle = "#09080c";
        ctx1.fillRect(0, 0, size, size);
        ctx1.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // Subtle gothic crimson/gold border
        ctx1.strokeStyle = "#c8a050";
        ctx1.lineWidth = Math.max(2, Math.round(size * 0.04));
        ctx1.strokeRect(ctx1.lineWidth / 2, ctx1.lineWidth / 2, size - ctx1.lineWidth, size - ctx1.lineWidth);

        // Round icon
        const cRound = document.createElement("canvas");
        cRound.width = size;
        cRound.height = size;
        const ctxR = cRound.getContext("2d");
        ctxR.save();
        ctxR.beginPath();
        ctxR.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctxR.closePath();
        ctxR.clip();
        ctxR.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        ctxR.strokeStyle = "#c8a050";
        ctxR.lineWidth = Math.max(2, Math.round(size * 0.05));
        ctxR.stroke();
        ctxR.restore();

        // Adaptive foreground icon
        const cFg = document.createElement("canvas");
        cFg.width = fgSize;
        cFg.height = fgSize;
        const ctxFg = cFg.getContext("2d");
        ctxFg.drawImage(img, sx, sy, minDim, minDim, 0, 0, fgSize, fgSize);

        out[folder] = {
          square: c1.toDataURL("image/png").split(",")[1],
          round: cRound.toDataURL("image/png").split(",")[1],
          foreground: cFg.toDataURL("image/png").split(",")[1],
        };
      }
      return out;
    },
    { heroB64, sizes: SIZES },
  );

  const resBase = path.join("android", "app", "src", "main", "res");
  for (const { folder } of SIZES) {
    const dir = path.join(resBase, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), Buffer.from(icons[folder].square, "base64"));
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), Buffer.from(icons[folder].round, "base64"));
    fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), Buffer.from(icons[folder].foreground, "base64"));
  }

  await browser.close();
  console.log("[android-icons] Todos os ícones do Android foram gerados com sucesso!");
}

generateIcons().catch(console.error);
