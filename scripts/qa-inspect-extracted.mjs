import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  function b64(p) {
    return fs.readFileSync(p).toString("base64");
  }

  const html = `
    <html>
      <body style="margin:20px; background:#181420; color:white; font-family:sans-serif;">
        <h2>Extracted SOTN Stage & Enemy Assets</h2>
        <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start;">
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Armored Skeleton (Blue Cuirass & Shield)</h4>
            <img src="data:image/png;base64,${b64("public/sprites/armored-skeleton.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Red Blood Skeleton</h4>
            <img src="data:image/png;base64,${b64("public/sprites/red-skeleton.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Marble Column</h4>
            <img src="data:image/png;base64,${b64("public/sprites/marble-column.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Broken Column</h4>
            <img src="data:image/png;base64,${b64("public/sprites/marble-column-broken.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Ceiling Pillar</h4>
            <img src="data:image/png;base64,${b64("public/sprites/marble-ceiling-pillar.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Gladiator Statue</h4>
            <img src="data:image/png;base64,${b64("public/sprites/statue-gladiator.png")}" style="height:180px; image-rendering:pixelated;" />
          </div>
          <div style="background:#221a2c; padding:10px; border-radius:6px; border:1px solid #443452;">
            <h4>Blue Flame Sconce</h4>
            <img src="data:image/png;base64,${b64("public/sprites/candelabra-blue.png")}" style="height:100px; image-rendering:pixelated;" />
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: "screenshots/inspect_extracted_sotn.png" });
  console.log("Saved screenshots/inspect_extracted_sotn.png");
  await browser.close();
}

main().catch(console.error);
