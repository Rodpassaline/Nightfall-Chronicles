import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const IMG1 = BRAIN + "sotn_gates_catacombs_1791652880813.jpg";
const IMG2 = BRAIN + "sotn_chapel_throne_1791652908960.jpg";
const IMG3 = BRAIN + "sotn_library_alchemy_1791652939331.jpg";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/");

  const b1 = fs.readFileSync(IMG1).toString("base64");
  const b2 = fs.readFileSync(IMG2).toString("base64");
  const b3 = fs.readFileSync(IMG3).toString("base64");

  const results = await page.evaluate(async ({ b1, b2, b3 }) => {
    function load(b64) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = "data:image/jpeg;base64," + b64;
      });
    }

    // Flood-fill alpha removal from image borders (for dark backgrounds)
    function removeBgAndCrop(srcImg, rx, ry, rw, rh, thresh = 26) {
      const c = document.createElement("canvas");
      c.width = rw;
      c.height = rh;
      const ctx = c.getContext("2d");
      ctx.drawImage(srcImg, rx, ry, rw, rh, 0, 0, rw, rh);

      const id = ctx.getImageData(0, 0, rw, rh);
      const d = id.data;
      const W = rw, H = rh;

      const isBg = new Uint8Array(W * H);
      const queue = [];

      function isDark(x, y) {
        const idx = (y * W + x) * 4;
        const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
        return maxC < thresh;
      }

      for (let x = 0; x < W; x++) {
        if (isDark(x, 0)) { isBg[0 * W + x] = 1; queue.push(x, 0); }
        if (isDark(x, H - 1)) { isBg[(H - 1) * W + x] = 1; queue.push(x, H - 1); }
      }
      for (let y = 0; y < H; y++) {
        if (isDark(0, y)) { isBg[y * W + 0] = 1; queue.push(0, y); }
        if (isDark(W - 1, y)) { isBg[y * W + (W - 1)] = 1; queue.push(W - 1, y); }
      }

      let head = 0;
      while (head < queue.length) {
        const qx = queue[head++];
        const qy = queue[head++];
        const neighbors = [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const nidx = ny * W + nx;
            if (isBg[nidx] === 0 && isDark(nx, ny)) {
              isBg[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      let minX = W, minY = H, maxX = 0, maxY = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const bgFlag = isBg[y * W + x];
          const maxC = Math.max(d[idx], d[idx + 1], d[idx + 2]);
          if (bgFlag === 1) {
            d[idx + 3] = 0;
          } else if (maxC < thresh + 18) {
            const alpha = Math.round(((maxC - thresh) / 18) * 255);
            d[idx + 3] = Math.max(0, Math.min(255, alpha));
          } else {
            d[idx + 3] = 255;
          }
          if (d[idx + 3] > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      ctx.putImageData(id, 0, 0);

      if (minX <= maxX && minY <= maxY) {
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const outCanvas = document.createElement("canvas");
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        outCanvas.getContext("2d").drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        return outCanvas.toDataURL("image/png");
      }
      return c.toDataURL("image/png");
    }

    // Flood-fill alpha removal from image borders (for white backgrounds in Sheet 3)
    function removeWhiteBgAndCrop(srcImg, rx, ry, rw, rh, thresh = 220) {
      const c = document.createElement("canvas");
      c.width = rw;
      c.height = rh;
      const ctx = c.getContext("2d");
      ctx.drawImage(srcImg, rx, ry, rw, rh, 0, 0, rw, rh);

      const id = ctx.getImageData(0, 0, rw, rh);
      const d = id.data;
      const W = rw, H = rh;

      const isBg = new Uint8Array(W * H);
      const queue = [];

      function isWhite(x, y) {
        const idx = (y * W + x) * 4;
        const minC = Math.min(d[idx], d[idx + 1], d[idx + 2]);
        return minC > thresh;
      }

      for (let x = 0; x < W; x++) {
        if (isWhite(x, 0)) { isBg[0 * W + x] = 1; queue.push(x, 0); }
        if (isWhite(x, H - 1)) { isBg[(H - 1) * W + x] = 1; queue.push(x, H - 1); }
      }
      for (let y = 0; y < H; y++) {
        if (isWhite(0, y)) { isBg[y * W + 0] = 1; queue.push(0, y); }
        if (isWhite(W - 1, y)) { isBg[y * W + (W - 1)] = 1; queue.push(W - 1, y); }
      }

      let head = 0;
      while (head < queue.length) {
        const qx = queue[head++];
        const qy = queue[head++];
        const neighbors = [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const nidx = ny * W + nx;
            if (isBg[nidx] === 0 && isWhite(nx, ny)) {
              isBg[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      let minX = W, minY = H, maxX = 0, maxY = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const bgFlag = isBg[y * W + x];
          const minC = Math.min(d[idx], d[idx + 1], d[idx + 2]);
          if (bgFlag === 1) {
            d[idx + 3] = 0;
          } else if (minC > thresh - 20) {
            const alpha = Math.round(((thresh - minC) / 20) * 255);
            d[idx + 3] = Math.max(0, Math.min(255, alpha));
          } else {
            d[idx + 3] = 255;
          }
          if (d[idx + 3] > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      ctx.putImageData(id, 0, 0);

      if (minX <= maxX && minY <= maxY) {
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const outCanvas = document.createElement("canvas");
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        outCanvas.getContext("2d").drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        return outCanvas.toDataURL("image/png");
      }
      return c.toDataURL("image/png");
    }

    const img1 = await load(b1);
    const img2 = await load(b2);
    const img3 = await load(b3);

    const out = {};

    // --- SHEET 1: GATES & CATACOMBS ---
    out["prop-gate.png"] = removeBgAndCrop(img1, 0, 0, 500, 510, 26);
    out["prop-tomb.png"] = removeBgAndCrop(img1, 500, 0, 260, 300, 26);
    out["prop-fence.png"] = removeBgAndCrop(img1, 490, 280, 534, 230, 26);
    out["prop-gargoyle.png"] = removeBgAndCrop(img1, 0, 510, 250, 514, 26);
    out["prop-cell.png"] = removeBgAndCrop(img1, 245, 510, 335, 514, 26);
    out["prop-coffin.png"] = removeBgAndCrop(img1, 570, 500, 190, 420, 26);
    out["prop-chains.png"] = removeBgAndCrop(img1, 745, 510, 279, 420, 26);

    // --- SHEET 2: CHAPEL & THRONE ---
    out["prop-stained-glass.png"] = removeBgAndCrop(img2, 0, 0, 330, 510, 24);
    out["prop-altar.png"] = removeBgAndCrop(img2, 330, 20, 425, 400, 26);
    out["prop-angel.png"] = removeBgAndCrop(img2, 750, 20, 274, 430, 26);
    out["prop-pew.png"] = removeBgAndCrop(img2, 0, 515, 330, 255, 26);
    out["prop-pew-right.png"] = removeBgAndCrop(img2, 0, 765, 330, 255, 26);
    out["prop-candelabra.png"] = removeBgAndCrop(img2, 350, 590, 140, 430, 26);
    out["prop-throne.png"] = removeBgAndCrop(img2, 500, 490, 285, 530, 26);
    out["prop-banner.png"] = removeBgAndCrop(img2, 785, 450, 235, 560, 26);

    // --- SHEET 3: LIBRARY & ALCHEMY (White Background) ---
    out["prop-bookshelf.png"] = removeWhiteBgAndCrop(img3, 0, 0, 515, 650, 220);
    out["prop-ladder.png"] = removeWhiteBgAndCrop(img3, 515, 0, 230, 500, 220);
    out["prop-desk.png"] = removeWhiteBgAndCrop(img3, 710, 0, 314, 300, 220);
    out["prop-books.png"] = removeWhiteBgAndCrop(img3, 730, 60, 80, 80, 220);
    out["prop-globe.png"] = removeWhiteBgAndCrop(img3, 560, 500, 175, 270, 220);
    out["prop-cauldron-green.png"] = removeWhiteBgAndCrop(img3, 0, 650, 270, 374, 215);
    out["prop-cauldron-purple.png"] = removeWhiteBgAndCrop(img3, 300, 750, 210, 274, 215);
    out["prop-potions.png"] = removeWhiteBgAndCrop(img3, 540, 760, 255, 264, 220);
    out["prop-crystals.png"] = removeWhiteBgAndCrop(img3, 820, 820, 160, 180, 220);

    return out;
  }, { b1, b2, b3 });

  for (const [filename, dataUrl] of Object.entries(results)) {
    const buf = Buffer.from(dataUrl.split(",")[1], "base64");
    fs.writeFileSync("public/sprites/" + filename, buf);
    console.log("Saved public/sprites/" + filename, buf.length, "bytes");
  }

  // Also duplicate to alias filenames if needed
  if (fs.existsSync("public/sprites/prop-angel.png")) {
    fs.copyFileSync("public/sprites/prop-angel.png", "public/sprites/prop-angel-tall.png");
  }
  if (fs.existsSync("public/sprites/prop-coffin.png")) {
    fs.copyFileSync("public/sprites/prop-coffin.png", "public/sprites/prop-coffin-open.png");
  }
  if (fs.existsSync("public/sprites/prop-gargoyle.png")) {
    fs.copyFileSync("public/sprites/prop-gargoyle.png", "public/sprites/gargoyle.png");
  }

  console.log("ALL ASSETS EXTRACTED WITH CLEAN TRANSPARENT ALPHA CHANNELS!");
  await browser.close();
}

main().catch(console.error);
