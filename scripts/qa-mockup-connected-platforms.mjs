import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Test rendering of platform with column supports on canvas
  const colB64 = fs.readFileSync("public/sprites/column.png").toString("base64");
  const bgB64 = fs.readFileSync("public/sprites/house.png").toString("base64"); // sample bg

  const html = `
    <html>
      <body style="margin:0; background:#000; overflow:hidden;">
        <canvas id="c" width="640" height="360" style="width:1280px; height:720px; image-rendering:pixelated;"></canvas>
        <script>
          const canvas = document.getElementById("c");
          const g = canvas.getContext("2d");
          const colImg = new Image();
          colImg.src = "data:image/png;base64,${colB64}";

          colImg.onload = () => {
            // Draw background
            g.fillStyle = "#141018";
            g.fillRect(0, 0, 640, 360);

            const GROUND_Y = 240;

            // Function to draw connected gothic platform with supporting columns
            function drawConnectedBalcony(x, y, w) {
              const platH = 12;
              const colW = 28;
              const groundY = GROUND_Y;
              const spanH = groundY - (y + platH);

              // 1. Draw supporting columns from floor up to platform bottom
              if (spanH > 10) {
                const pillarPositions = w >= 110 ? [x + 18, x + w - 18] : [x + w / 2];
                for (const px of pillarPositions) {
                  // Draw column shaft & capital
                  g.drawImage(colImg, 0, 0, colImg.naturalWidth, colImg.naturalHeight, px - colW / 2, y + platH, colW, spanH);
                }

                // 2. Gothic Arch Vault connecting the pillars beneath the platform
                if (pillarPositions.length === 2) {
                  const left = pillarPositions[0];
                  const right = pillarPositions[1];
                  g.save();
                  g.fillStyle = "rgba(18, 12, 20, 0.75)";
                  g.beginPath();
                  g.moveTo(left, y + platH + 18);
                  g.quadraticCurveTo((left + right) / 2, y + platH + 2, right, y + platH + 18);
                  g.lineTo(right, y + platH);
                  g.lineTo(left, y + platH);
                  g.closePath();
                  g.fill();

                  // Arch decorative rib
                  g.strokeStyle = "#4a3a42";
                  g.lineWidth = 2;
                  g.beginPath();
                  g.moveTo(left, y + platH + 18);
                  g.quadraticCurveTo((left + right) / 2, y + platH + 2, right, y + platH + 18);
                  g.stroke();
                  g.restore();
                }
              }

              // 3. Balcony stone body
              g.fillStyle = "#2c1d24";
              g.fillRect(x, y, w, platH);

              // Trim and gothic accents
              g.fillStyle = "#ffeaa7";
              g.fillRect(x, y, w, 1);
              g.fillStyle = "#e2a23a";
              g.fillRect(x, y + 1, w, 2);
              g.fillStyle = "#7a2a22";
              g.fillRect(x, y + 3, w, 1);
              g.fillStyle = "#150e12";
              g.fillRect(x, y + platH - 1, w, 1);

              // Carved stone corbels under the edge
              g.fillStyle = "#45323a";
              g.fillRect(x + 2, y + platH, 8, 4);
              g.fillRect(x + w - 10, y + platH, 8, 4);
              for (let nx = 16; nx < w - 16; nx += 20) {
                g.fillRect(x + nx, y + platH, 4, 3);
              }
            }

            // Draw ground floor
            g.fillStyle = "#1e1620";
            g.fillRect(0, GROUND_Y, 640, 120);
            g.fillStyle = "#5a4a48";
            g.fillRect(0, GROUND_Y, 640, 6);
            g.fillStyle = "#e2a23a";
            g.fillRect(0, GROUND_Y, 640, 1);

            // Test 3 connected balconies
            drawConnectedBalcony(60, 170, 150);
            drawConnectedBalcony(240, 120, 160);
            drawConnectedBalcony(430, 160, 150);
          };
        </script>
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/connected_platform_mockup.png" });
  console.log("Saved screenshots/connected_platform_mockup.png");
  await browser.close();
}

main().catch(console.error);
