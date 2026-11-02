import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const sheets = [
  { id: 1, name: "Petros", file: "boss_petros_sheet_1791603659957.jpg" },
  { id: 2, name: "Valerius", file: "boss_valerius_sheet_1791603728528.jpg" },
  { id: 3, name: "Seraphine", file: "boss_seraphine_sheet_1791603747934.jpg" },
  { id: 4, name: "Nocturne", file: "boss_nocturne_sheet_1791603773184.jpg" },
  { id: 5, name: "Veyne", file: "boss_veyne_sheet_1791603807334.jpg" },
  { id: 6, name: "Calx", file: "boss_calx_sheet_1791603832365.jpg" },
  { id: 7, name: "Dracula", file: "boss_dracula_sheet_1791603859890.jpg" },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  const outDir = "public/portraits";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const item of sheets) {
    const fullPath = path.join(BRAIN, item.file);
    if (!fs.existsSync(fullPath)) {
      console.log("Missing:", fullPath);
      continue;
    }
    const b64 = fs.readFileSync(fullPath).toString("base64");

    const result = await page.evaluate(async ({ b64, id, name }) => {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = "data:image/jpeg;base64," + b64;
      });

      // We want to create two portraits:
      // 1. idle: Top-Left cell (0, 0 to 512, 512)
      // 2. talk: Top-Right cell (512, 0 to 1024, 512)
      function extractBust(sx, sy, sw, sh, outW, outH) {
        const c = document.createElement("canvas");
        c.width = outW;
        c.height = outH;
        const ctx = c.getContext("2d");

        // Fill subtle dark gothic radial vignette so transparent blending looks magnificent
        ctx.fillStyle = "#000000";
        // Draw the cropped region from 1024x1024
        // The characters are centered or in upper region of the 512x512 cell.
        // We crop the bust (head + torso), roughly top 70% of the cell
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

        // Remove pure black background if present (luminance thresholding with soft alpha edge)
        const idata = ctx.getImageData(0, 0, outW, outH);
        const d = idata.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 18) {
            d[i + 3] = 0; // transparent
          } else if (brightness < 38) {
            d[i + 3] = Math.round(((brightness - 18) / 20) * 255);
          }
        }
        ctx.putImageData(idata, 0, 0);

        return c.toDataURL("image/png");
      }

      // Cell 0: idle stance (sx: 0, sy: 0, sw: 512, sh: 512)
      // Focus on upper bust: sx: 40, sy: 20, sw: 430, sh: 460
      const idleUrl = extractBust(30, 15, 452, 470, 320, 332);
      // Cell 1: attack/roar stance (sx: 512 + 30, sy: 15, sw: 452, sh: 470)
      const talkUrl = extractBust(512 + 30, 15, 452, 470, 320, 332);

      return { idleUrl, talkUrl };
    }, { b64, id: item.id, name: item.name });

    const idleBuf = Buffer.from(result.idleUrl.replace(/^data:image\/png;base64,/, ""), "base64");
    const talkBuf = Buffer.from(result.talkUrl.replace(/^data:image\/png;base64,/, ""), "base64");

    fs.writeFileSync(path.join(outDir, `boss-${item.id}-idle.png`), idleBuf);
    fs.writeFileSync(path.join(outDir, `boss-${item.id}-talk.png`), talkBuf);

    console.log(`Extracted boss ${item.id} (${item.name}): idle=${idleBuf.length}b, talk=${talkBuf.length}b`);
  }

  await browser.close();
}

main().catch(console.error);
