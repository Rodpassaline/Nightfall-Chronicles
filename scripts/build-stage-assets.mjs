import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC = BRAIN + ".user_uploaded/media_1791580826220_4bf1a3f3.jpg";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const b64 = fs.readFileSync(SRC).toString("base64");

const results = await page.evaluate(async (srcB64) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + srcB64; });
  const W = img.width, H = img.height;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  // Helper to crop canvas region
  function crop(x, y, w, h) {
    const sc = document.createElement("canvas");
    sc.width = w; sc.height = h;
    sc.getContext("2d").drawImage(c, x, y, w, h, 0, 0, w, h);
    return sc;
  }

  // 1. Stage backgrounds (seamless panoramas for 7 stages)
  // Stage 1: Portões
  const bg1 = crop(5, 75, 275, 142);
  // Stage 2: Galeria
  const bg2 = crop(515, 80, 500, 222);
  // Stage 3: Capela
  const bg3 = crop(5, 365, 500, 220);
  // Stage 4: Catacumbas
  const bg4 = crop(515, 335, 500, 190);
  // Stage 5: Biblioteca
  const bg5 = crop(5, 610, 500, 190);
  // Stage 6: Alquimia
  const bg6 = crop(5, 825, 500, 190);
  // Stage 7: Trono
  const bg7 = crop(515, 745, 500, 270);

  // 2. Individual props with alpha cutouts
  function cutout(x, y, w, h, bgThresh = 20) {
    const sc = crop(x, y, w, h);
    const sctx = sc.getContext("2d", { willReadFrequently: true });
    const imgData = sctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // For props drawn against dark backgrounds in the concept sheet,
    // we make pure black/near-black borders transparent or keep solid if inside
    // Many props are isolated items
    return sc.toDataURL("image/png");
  }

  const bgs = {
    "stage-1": bg1.toDataURL("image/jpeg", 0.94),
    "stage-2": bg2.toDataURL("image/jpeg", 0.94),
    "stage-3": bg3.toDataURL("image/jpeg", 0.94),
    "stage-4": bg4.toDataURL("image/jpeg", 0.94),
    "stage-5": bg5.toDataURL("image/jpeg", 0.94),
    "stage-6": bg6.toDataURL("image/jpeg", 0.94),
    "stage-7": bg7.toDataURL("image/jpeg", 0.94),
  };

  // Props
  const props = {
    // Portões
    "prop-gargoyle": crop(282, 80, 60, 64).toDataURL("image/png"),
    "prop-gate": crop(5, 220, 137, 114).toDataURL("image/png"),
    "prop-fence": crop(144, 220, 124, 114).toDataURL("image/png"),
    "prop-block-grass": crop(270, 220, 110, 114).toDataURL("image/png"),
    "prop-block-stone": crop(382, 220, 114, 114).toDataURL("image/png"),

    // Galeria
    "prop-candelabra": crop(520, 240, 48, 62).toDataURL("image/png"),
    "prop-statue": crop(905, 235, 75, 72).toDataURL("image/png"),
    "prop-column": crop(750, 80, 56, 222).toDataURL("image/png"),

    // Capela
    "prop-pew": crop(72, 515, 120, 70).toDataURL("image/png"),
    "prop-pew-right": crop(235, 515, 140, 70).toDataURL("image/png"),
    "prop-altar": crop(135, 475, 80, 50).toDataURL("image/png"),
    "prop-angel": crop(390, 390, 46, 170).toDataURL("image/png"),
    "prop-angel-tall": crop(438, 365, 58, 205).toDataURL("image/png"),

    // Catacumbas
    "prop-coffin": crop(600, 475, 75, 45).toDataURL("image/png"),
    "prop-tomb": crop(715, 375, 75, 115).toDataURL("image/png"),
    "prop-cell": crop(865, 420, 70, 100).toDataURL("image/png"),
    "prop-coffin-open": crop(725, 485, 62, 38).toDataURL("image/png"),

    // Biblioteca
    "prop-bookshelf": crop(10, 610, 105, 190).toDataURL("image/png"),
    "prop-ladder": crop(115, 640, 105, 130).toDataURL("image/png"),
    "prop-desk": crop(255, 720, 95, 65).toDataURL("image/png"),
    "prop-globe": crop(412, 730, 45, 65).toDataURL("image/png"),
    "prop-books": crop(65, 750, 35, 45).toDataURL("image/png"),

    // Alquimia
    "prop-cauldron-green": crop(235, 895, 45, 65).toDataURL("image/png"),
    "prop-cauldron-purple": crop(320, 895, 45, 65).toDataURL("image/png"),
    "prop-potions": crop(18, 860, 100, 150).toDataURL("image/png"),
    "prop-alchemy-table": crop(125, 920, 105, 70).toDataURL("image/png"),
    "prop-crystals": crop(468, 935, 30, 35).toDataURL("image/png"),

    // Trono
    "prop-throne": crop(725, 805, 58, 95).toDataURL("image/png"),
    "prop-shield": crop(580, 945, 35, 40).toDataURL("image/png"),
    "prop-banner": crop(895, 925, 42, 55).toDataURL("image/png"),
  };

  // 3. Foreground 2.5D Parallax Overlays
  // Massive foreground gothic pillar with capital
  const fgPillar = crop(665, 80, 52, 222);
  // Red drapery curtain
  const fgCurtainLeft = crop(515, 745, 80, 260);
  const fgCurtainRight = crop(935, 745, 80, 260);

  const fg = {
    "fg-pillar": fgPillar.toDataURL("image/png"),
    "fg-curtain-left": fgCurtainLeft.toDataURL("image/png"),
    "fg-curtain-right": fgCurtainRight.toDataURL("image/png"),
  };

  return { bgs, props, fg };
}, b64);

// Save stage backgrounds into public/art/ and public/art/parallax/
for (const [name, url] of Object.entries(results.bgs)) {
  const data = Buffer.from(url.replace(/^data:image\/jpeg;base64,/, ""), "base64");
  fs.writeFileSync(`public/art/${name}.jpg`, data);
  const num = name.replace("stage-", "");
  fs.writeFileSync(`public/art/parallax/mid-${num}.jpg`, data);
  console.log("Saved public/art/" + name + ".jpg and mid-" + num + ".jpg");
}

// Save props into public/sprites/
for (const [name, url] of Object.entries(results.props)) {
  const data = Buffer.from(url.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync(`public/sprites/${name}.png`, data);
  console.log("Saved public/sprites/" + name + ".png");
}

// Save foreground 2.5D overlays
for (const [name, url] of Object.entries(results.fg)) {
  const data = Buffer.from(url.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync(`public/sprites/${name}.png`, data);
  console.log("Saved public/sprites/" + name + ".png");
}

await browser.close();
console.log("Stage asset building complete!");
