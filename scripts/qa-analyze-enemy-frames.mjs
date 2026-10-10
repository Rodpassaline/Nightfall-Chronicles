import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const enemySheets = [
    "zombie.png", "knight.png", "skeleton.png", "vampire.png",
    "boss-petros.png", "boss-valerius.png", "boss-veyne.png", "boss-calx.png", "boss-dracula.png"
  ];

  let rowsHtml = "";
  for (const name of enemySheets) {
    const p = "public/sprites/" + name;
    if (!fs.existsSync(p)) continue;
    const b64 = fs.readFileSync(p).toString("base64");
    
    // Split into 4 frames: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
    rowsHtml += `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:8px;">
        <div style="width:140px; font-weight:bold; font-size:12px;">${name}</div>
        <div style="display:flex; gap:12px;">
          <div style="text-align:center;">
            <div style="font-size:10px; color:#888;">F0 (top-left)</div>
            <div style="width:80px; height:80px; overflow:hidden; background:#222; display:flex; justify-content:center; align-items:center;">
              <img src="data:image/png;base64,${b64}" style="width:160px; height:160px; margin-top:0; margin-left:0; object-fit:none; object-position: 0 0;" />
            </div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:10px; color:#888;">F1 (top-right)</div>
            <div style="width:80px; height:80px; overflow:hidden; background:#222; display:flex; justify-content:center; align-items:center;">
              <img src="data:image/png;base64,${b64}" style="width:160px; height:160px; object-fit:none; object-position: -80px 0;" />
            </div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:10px; color:#888;">F2 (bot-left)</div>
            <div style="width:80px; height:80px; overflow:hidden; background:#222; display:flex; justify-content:center; align-items:center;">
              <img src="data:image/png;base64,${b64}" style="width:160px; height:160px; object-fit:none; object-position: 0 -80px;" />
            </div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:10px; color:#888;">F3 (bot-right)</div>
            <div style="width:80px; height:80px; overflow:hidden; background:#222; display:flex; justify-content:center; align-items:center;">
              <img src="data:image/png;base64,${b64}" style="width:160px; height:160px; object-fit:none; object-position: -80px -80px;" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const html = `
    <html>
      <body style="margin:20px; background:#101018; color:white; font-family:sans-serif;">
        <h2>Enemy Frame Analysis (2x2 Grid)</h2>
        ${rowsHtml}
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: "screenshots/enemy_frames_analysis.png", fullPage: true });
  console.log("Saved screenshots/enemy_frames_analysis.png");
  await browser.close();
}

main().catch(console.error);
