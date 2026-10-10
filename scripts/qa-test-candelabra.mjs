import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();

  // Test chroma key / background removal on prop-candelabra.png
  const candB64 = fs.readFileSync("public/sprites/prop-candelabra.png").toString("base64");
  const result = await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = "data:image/png;base64," + b64; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const d = id.data;

    // Corner background color is around (40, 35, 45)
    // Flood fill from corners to make background transparent
    const visited = new Uint8Array(c.width * c.height);
    const queue = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]];
    for (const [x, y] of queue) visited[y * c.width + x] = 1;

    // Check if pixel is dark background (grey/blue wall)
    function isBg(idx) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      // Golden candles and brass stand have r > 100 or high contrast
      // Background is dark stone wall (r < 80, g < 80, b < 90)
      return (r < 75 && g < 75 && b < 85);
    }

    let head = 0;
    while (head < queue.length) {
      const [qx, qy] = queue[head++];
      const idx = (qy * c.width + qx) * 4;
      if (isBg(idx)) {
        d[idx + 3] = 0; // Transparent!
        const neighbors = [[qx+1, qy], [qx-1, qy], [qx, qy+1], [qx, qy-1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < c.width && ny >= 0 && ny < c.height) {
            const npos = ny * c.width + nx;
            if (!visited[npos]) {
              visited[npos] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    ctx.putImageData(id, 0, 0);
    return c.toDataURL("image/png");
  }, candB64);

  fs.writeFileSync("screenshots/test_clean_candelabra.png", Buffer.from(result.split(",")[1], "base64"));
  console.log("Saved screenshots/test_clean_candelabra.png");
  await browser.close();
}

main().catch(console.error);
