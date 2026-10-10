import { chromium } from "playwright";
import fs from "node:fs";

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const SRC = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/.user_uploaded/media_1791580826220_4bf1a3f3.jpg";
  const b64 = fs.readFileSync(SRC).toString("base64");

  const stagePanoramas = await page.evaluate(async (srcB64) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + srcB64; });
    const sheetCanvas = document.createElement("canvas");
    sheetCanvas.width = img.naturalWidth;
    sheetCanvas.height = img.naturalHeight;
    const sctx = sheetCanvas.getContext("2d");
    sctx.drawImage(img, 0, 0);

    // Precise coordinates for the 7 stages in media_1791580826220_4bf1a3f3.jpg (1024x1024)
    const stageBoxes = {
      // 1: Portões (The entire gate courtyard with cemetery walls)
      1: { x: 5, y: 75, w: 275, h: 142 },
      // 2: Galeria (Royal gallery with colonnade and portraits)
      2: { x: 505, y: 75, w: 500, h: 228 },
      // 3: Capela (Nave with vaulted arches and stained glass)
      3: { x: 5, y: 360, w: 495, h: 225 },
      // 4: Catacumbas (Dungeon vaults, sarcophagi, torches)
      4: { x: 505, y: 340, w: 500, h: 185 },
      // 5: Biblioteca (Towering bookshelves, mezzanine, arched window)
      5: { x: 5, y: 610, w: 495, h: 190 },
      // 6: Alquimia (Laboratory benches, cauldrons, potions)
      6: { x: 5, y: 825, w: 495, h: 190 },
      // 7: Sala do Trono (Throne, velvet drapery, arched window with moon)
      7: { x: 505, y: 745, w: 505, h: 270 },
    };

    /**
     * Creates a wide, seamless panorama from a room illustration.
     * Uses mirrored repetition or smooth cosine cross-fade at the seams so
     * that when the panorama tiles horizontally, there is ZERO seam or line!
     */
    function makeSeamlessPanorama(box, targetW = 1000, targetH = 270) {
      // 1. Extract raw room
      const raw = document.createElement("canvas");
      raw.width = box.w;
      raw.height = box.h;
      raw.getContext("2d").drawImage(sheetCanvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

      // 2. Build seamless double-width canvas (mirrored or crossfaded)
      // Mirroring A -> A_reversed creates a perfectly continuous architectural hall!
      const pan = document.createElement("canvas");
      pan.width = targetW;
      pan.height = targetH;
      const pctx = pan.getContext("2d");

      // Draw background base color
      pctx.fillStyle = "#100a14";
      pctx.fillRect(0, 0, targetW, targetH);

      // Repeat with smooth edge blending
      const segmentW = Math.round(targetW / 2);
      
      // Segment 1: Original scaled to fill height
      pctx.drawImage(raw, 0, 0, box.w, box.h, 0, 0, segmentW, targetH);
      
      // Segment 2: Mirrored horizontally to create a continuous symmetrical cathedral hall
      pctx.save();
      pctx.translate(targetW, 0);
      pctx.scale(-1, 1);
      pctx.drawImage(raw, 0, 0, box.w, box.h, 0, 0, segmentW, targetH);
      pctx.restore();

      // Soft vertical vignette at the very bottom so it blends into subterranean flagstones
      const bottomFade = pctx.createLinearGradient(0, targetH - 40, 0, targetH);
      bottomFade.addColorStop(0, "rgba(16, 10, 20, 0)");
      bottomFade.addColorStop(1, "rgba(16, 10, 20, 0.95)");
      pctx.fillStyle = bottomFade;
      pctx.fillRect(0, targetH - 40, targetW, 40);

      // Soft top fade into ceiling shadow
      const topFade = pctx.createLinearGradient(0, 0, 0, 24);
      topFade.addColorStop(0, "rgba(10, 6, 12, 0.85)");
      topFade.addColorStop(1, "rgba(10, 6, 12, 0)");
      pctx.fillStyle = topFade;
      pctx.fillRect(0, 0, targetW, 24);

      return pan.toDataURL("image/jpeg", 0.95);
    }

    const out = {};
    for (const [id, box] of Object.entries(stageBoxes)) {
      out[`stage-${id}`] = makeSeamlessPanorama(box, 1080, 270);
    }
    return out;
  }, b64);

  // Write seamless panoramas to public/art/ and public/art/parallax/
  for (const [name, url] of Object.entries(stagePanoramas)) {
    const data = Buffer.from(url.replace(/^data:image\/jpeg;base64,/, ""), "base64");
    fs.writeFileSync(`public/art/${name}.jpg`, data);
    const num = name.replace("stage-", "");
    fs.writeFileSync(`public/art/parallax/mid-${num}.jpg`, data);
    console.log(`Generated seamless panorama: ${name}.jpg (${data.length} bytes)`);
  }

  await browser.close();
  console.log("Seamless panorama generation complete!");
}

run().catch(console.error);
