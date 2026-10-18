import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const GATE_SRC = path.join(BRAIN, "sealed_gothic_portcullis_gate_1792286808455.jpg");
const CRYSTAL_SRC = "public/sprites/prop-crystals.png";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  const gateB64 = fs.readFileSync(GATE_SRC).toString("base64");
  const crystalB64 = fs.readFileSync(CRYSTAL_SRC).toString("base64");

  const results = await page.evaluate(
    async ({ gateB64, crystalB64 }) => {
      function loadImage(src) {
        return new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = src;
        });
      }

      // 1. PROCESS SEALED GOTHIC PORTCULLIS GATE
      const gateImg = await loadImage("data:image/jpeg;base64," + gateB64);
      const gw = gateImg.naturalWidth;
      const gh = gateImg.naturalHeight;
      const gCanvas = document.createElement("canvas");
      gCanvas.width = gw;
      gCanvas.height = gh;
      const gCtx = gCanvas.getContext("2d", { willReadFrequently: true });
      gCtx.drawImage(gateImg, 0, 0);

      const gData = gCtx.getImageData(0, 0, gw, gh);
      const gd = gData.data;

      // Flood fill pure black background from borders AND internal portcullis grate gaps
      let minX = gw, maxX = 0, minY = gh, maxY = 0;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const idx = (y * gw + x) * 4;
          const r = gd[idx], g = gd[idx + 1], b = gd[idx + 2];
          const maxC = Math.max(r, g, b);
          // Key out pure black background (both outside and between the iron bars!)
          // while keeping dark stone & iron texture and glowing red aura
          if (maxC <= 12) {
            gd[idx + 3] = 0;
          } else if (maxC <= 24 && r < 22) {
            gd[idx + 3] = Math.round(((maxC - 12) / 12) * 255);
          }
          if (gd[idx + 3] > 35) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      gCtx.putImageData(gData, 0, 0);

      // Crop to exact content bounds and save high-res transparent sprite (160x280)
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const outGate = document.createElement("canvas");
      outGate.width = 160;
      outGate.height = 280;
      const outGateCtx = outGate.getContext("2d");
      outGateCtx.imageSmoothingEnabled = true;
      outGateCtx.imageSmoothingQuality = "high";
      outGateCtx.drawImage(gCanvas, minX, minY, bw, bh, 0, 0, 160, 280);

      // Separate Stationary Stone Archway Pillars & Top Arch from the Movable Inner Iron Portcullis Grate!
      const archCanvas = document.createElement("canvas");
      archCanvas.width = 160;
      archCanvas.height = 280;
      const archCtx = archCanvas.getContext("2d", { willReadFrequently: true });
      archCtx.drawImage(outGate, 0, 0);
      const archData = archCtx.getImageData(0, 0, 160, 280);

      const grateCanvas = document.createElement("canvas");
      grateCanvas.width = 160;
      grateCanvas.height = 280;
      const grateCtx = grateCanvas.getContext("2d", { willReadFrequently: true });
      grateCtx.drawImage(outGate, 0, 0);
      const grateData = grateCtx.getImageData(0, 0, 160, 280);

      for (let y = 0; y < 280; y++) {
        for (let x = 0; x < 160; x++) {
          const idx = (y * 160 + x) * 4;
          // The inner iron portcullis occupies x in [29, 130] and y >= 22 (below the stone arch curve)
          const archCurveY = 22 + Math.round(Math.pow((x - 80) / 52, 2) * 32);
          const isInnerGrate = x >= 29 && x <= 130 && y >= archCurveY;
          if (isInnerGrate) {
            archData.data[idx + 3] = 0; // Remove grate from stationary stone arch
          } else {
            grateData.data[idx + 3] = 0; // Remove stone arch from movable iron grate
          }
        }
      }
      archCtx.putImageData(archData, 0, 0);
      grateCtx.putImageData(grateData, 0, 0);

      // 2. CREATE ORNATE GOTHIC SEAL CRYSTAL ALTAR SPRITES (Locked Crimson & Unlocked Golden)
      const cryImg = await loadImage("data:image/png;base64," + crystalB64);

      function buildCrystalAltar(unlocked) {
        const c = document.createElement("canvas");
        c.width = 96;
        c.height = 128;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;

        // Recolor crystal cluster from cyan to either Blood Crimson (locked) or Holy Gold (unlocked)
        const tmp = document.createElement("canvas");
        tmp.width = cryImg.naturalWidth;
        tmp.height = cryImg.naturalHeight;
        const tctx = tmp.getContext("2d", { willReadFrequently: true });
        tctx.drawImage(cryImg, 0, 0);
        const cData = tctx.getImageData(0, 0, tmp.width, tmp.height);
        const cd = cData.data;

        for (let i = 0; i < cd.length; i += 4) {
          if (cd[i + 3] === 0) continue;
          const r = cd[i], g = cd[i + 1], b = cd[i + 2];
          const lum = (r * 0.25 + g * 0.45 + b * 0.3) / 255;
          if (!unlocked) {
            // Faceted Blood Ruby Crystal
            cd[i] = Math.min(255, Math.round(60 + lum * 240));
            cd[i + 1] = Math.min(255, Math.round(Math.pow(lum, 2.4) * 185));
            cd[i + 2] = Math.min(255, Math.round(Math.pow(lum, 2.0) * 210));
          } else {
            // Purified Golden-Amber Relic Crystal
            cd[i] = Math.min(255, Math.round(80 + lum * 225));
            cd[i + 1] = Math.min(255, Math.round(55 + Math.pow(lum, 1.3) * 215));
            cd[i + 2] = Math.min(255, Math.round(Math.pow(lum, 2.5) * 190));
          }
        }
        tctx.putImageData(cData, 0, 0);

        const drawPixelRect = (x, y, w, h, color) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, h);
        };

        // Pedestal stepped stone base
        drawPixelRect(14, 118, 68, 8, "#18181b");
        drawPixelRect(16, 118, 64, 2, "#3f3f46");
        drawPixelRect(20, 110, 56, 8, "#27272a");
        drawPixelRect(22, 110, 52, 2, "#52525b");
        // Pillar body with fluted gothic recesses
        drawPixelRect(26, 88, 44, 22, "#1f1f23");
        drawPixelRect(28, 90, 6, 18, "#3f3f46");
        drawPixelRect(62, 90, 6, 18, "#3f3f46");
        drawPixelRect(38, 90, 20, 18, "#141417");
        // Glowing rune engraving on pedestal chest
        const runeColor = unlocked ? "#fbbf24" : "#ff1744";
        drawPixelRect(42, 94, 12, 2, runeColor);
        drawPixelRect(47, 92, 2, 14, runeColor);
        drawPixelRect(44, 100, 8, 2, runeColor);
        // Upper altar crown molding
        drawPixelRect(18, 82, 60, 6, "#27272a");
        drawPixelRect(20, 82, 56, 2, "#71717a");
        drawPixelRect(22, 78, 52, 4, "#3f3f46");

        // Radial glow behind crystal
        const grad = ctx.createRadialGradient(48, 46, 4, 48, 46, 38);
        if (!unlocked) {
          grad.addColorStop(0, "rgba(255, 23, 68, 0.75)");
          grad.addColorStop(0.5, "rgba(185, 28, 28, 0.3)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          grad.addColorStop(0, "rgba(253, 224, 71, 0.75)");
          grad.addColorStop(0.5, "rgba(234, 179, 8, 0.3)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(8, 6, 80, 76);

        // Draw recolored crystal cluster perched above the gothic altar
        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 14, 10, 68, 70);

        return c.toDataURL("image/png");
      }

      return {
        gatePng: outGate.toDataURL("image/png"),
        archPng: archCanvas.toDataURL("image/png"),
        gratePng: grateCanvas.toDataURL("image/png"),
        crystalLockedPng: buildCrystalAltar(false),
        crystalUnlockedPng: buildCrystalAltar(true),
      };
    },
    { gateB64, crystalB64 }
  );

  const gateBuf = Buffer.from(results.gatePng.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync("public/sprites/seal-gate.png", gateBuf);
  console.log(`Saved public/sprites/seal-gate.png (${gateBuf.length} bytes)`);

  const archBuf = Buffer.from(results.archPng.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync("public/sprites/seal-gate-arch.png", archBuf);
  console.log(`Saved public/sprites/seal-gate-arch.png (${archBuf.length} bytes)`);

  const grateBuf = Buffer.from(results.gratePng.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync("public/sprites/seal-gate-grate.png", grateBuf);
  console.log(`Saved public/sprites/seal-gate-grate.png (${grateBuf.length} bytes)`);

  const lockedBuf = Buffer.from(results.crystalLockedPng.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync("public/sprites/seal-crystal.png", lockedBuf);
  console.log(`Saved public/sprites/seal-crystal.png (${lockedBuf.length} bytes)`);

  const unlockedBuf = Buffer.from(results.crystalUnlockedPng.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync("public/sprites/seal-crystal-open.png", unlockedBuf);
  console.log(`Saved public/sprites/seal-crystal-open.png (${unlockedBuf.length} bytes)`);

  await browser.close();
}

main().catch(console.error);
