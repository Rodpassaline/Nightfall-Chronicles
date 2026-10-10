import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";

const sheets = [
  {
    src: BRAIN + "hero_run_sheet_1791500699732.jpg",
    dest: "public/sprites/hero-run.png",
    kind: "character",
  },
  {
    src: BRAIN + "hero_attack_sheet_1791500742122.jpg",
    dest: "public/sprites/hero-attack.png",
    kind: "character",
  },
  {
    src: BRAIN + "hero_crouch_actions_1791500766752.jpg",
    dest: "public/sprites/hero-crouch.png",
    kind: "character",
  },
  {
    src: BRAIN + "hero_jump_pogo_1791500793738.jpg",
    dest: "public/sprites/hero-jump.png",
    kind: "character",
  },
  {
    src: BRAIN + "hero_cast_sheet_1791500822848.jpg",
    dest: "public/sprites/hero-cast.png",
    kind: "character",
  },
  {
    src: BRAIN + "hollow_slash_sheet_1791500863595.jpg",
    dest: "public/sprites/slash.png",
    kind: "fx",
  },
];

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  for (const item of sheets) {
    if (!fs.existsSync(item.src)) {
      console.warn("Missing source file:", item.src);
      continue;
    }
    const b64 = fs.readFileSync(item.src).toString("base64");
    console.log("Processing", item.dest, "from", item.src);

    const dataUrl = await page.evaluate(async ({ b64, kind }) => {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = "data:image/jpeg;base64," + b64;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw downscaled to 256x256
      ctx.drawImage(img, 0, 0, 256, 256);

      const idata = ctx.getImageData(0, 0, 256, 256);
      const d = idata.data;

      // Sample corners to detect background color
      const corners = [
        [0, 0],
        [255, 0],
        [0, 255],
        [255, 255],
      ];
      let avgR = 0, avgG = 0, avgB = 0;
      for (const [cx, cy] of corners) {
        const idx = (cy * 256 + cx) * 4;
        avgR += d[idx];
        avgG += d[idx + 1];
        avgB += d[idx + 2];
      }
      avgR /= 4;
      avgG /= 4;
      avgB /= 4;

      const isWhiteBg = (avgR + avgG + avgB) / 3 > 180;
      console.log("Background detected:", isWhiteBg ? "WHITE" : "BLACK", { avgR, avgG, avgB });

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        if (kind === "character") {
          if (isWhiteBg) {
            // White background: key out pixels close to white
            const min = Math.min(r, g, b);
            if (min > 235) {
              d[i + 3] = 0;
            } else if (min > 215) {
              d[i + 3] = Math.round(((235 - min) / 20) * 255);
            }
          } else {
            // Black background: key out dark black background
            const max = Math.max(r, g, b);
            if (max < 16) {
              d[i + 3] = 0;
            } else if (max < 28) {
              d[i + 3] = Math.round(((max - 16) / 12) * 255);
            }
          }
        } else if (kind === "fx") {
          // Glow effect (slash): black becomes transparent, bright colors remain glowing
          const max = Math.max(r, g, b);
          if (max < 18) {
            d[i + 3] = 0;
          } else if (max < 45) {
            d[i + 3] = Math.round(((max - 18) / 27) * 255);
          }
        }
      }

      // Seam cleaning along 2x2 grid lines (x = 127..128, y = 127..128)
      for (let y = 0; y < 256; y++) {
        for (let x of [127, 128]) {
          const idx = (y * 256 + x) * 4;
          // If neighbors are transparent, clear seam artifact
          const leftIdx = (y * 256 + Math.max(0, x - 2)) * 4;
          const rightIdx = (y * 256 + Math.min(255, x + 2)) * 4;
          if (d[leftIdx + 3] === 0 && d[rightIdx + 3] === 0) {
            d[idx + 3] = 0;
          }
        }
      }
      for (let x = 0; x < 256; x++) {
        for (let y of [127, 128]) {
          const idx = (y * 256 + x) * 4;
          const topIdx = (Math.max(0, y - 2) * 256 + x) * 4;
          const botIdx = (Math.min(255, y + 2) * 256 + x) * 4;
          if (d[topIdx + 3] === 0 && d[botIdx + 3] === 0) {
            d[idx + 3] = 0;
          }
        }
      }

      ctx.putImageData(idata, 0, 0);
      return canvas.toDataURL("image/png");
    }, { b64, kind: item.kind });

    const pngBase64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(item.dest, Buffer.from(pngBase64, "base64"));
    console.log("Successfully wrote", item.dest, "size:", fs.statSync(item.dest).size, "bytes");
  }

  await browser.close();
  console.log("All sheets processed successfully!");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
