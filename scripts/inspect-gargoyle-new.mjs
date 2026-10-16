import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });

  const gargoyleB64 = fs.readFileSync("public/sprites/gargoyle.png").toString("base64");
  const petrosB64 = fs.readFileSync("public/sprites/boss-petros.png").toString("base64");

  const html = `
    <html>
      <body style="margin:20px; background:#181824; color:white; font-family:sans-serif;">
        <h2>Gargoyle New 256x256 vs Petros (Boss)</h2>
        <div style="display:flex; gap:30px;">
          <div>
            <h3>Gargoyle Enemy (public/sprites/gargoyle.png)</h3>
            <div style="display:grid; grid-template-columns: 128px 128px; gap:4px; background:#333; padding:4px; width:fit-content;">
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${gargoyleB64}" style="position:absolute; left:0; top:0;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${gargoyleB64}" style="position:absolute; left:-128px; top:0;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${gargoyleB64}" style="position:absolute; left:0; top:-128px;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${gargoyleB64}" style="position:absolute; left:-128px; top:-128px;" />
              </div>
            </div>
          </div>
          <div>
            <h3>Boss Petros (public/sprites/boss-petros.png)</h3>
            <div style="display:grid; grid-template-columns: 128px 128px; gap:4px; background:#333; padding:4px; width:fit-content;">
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${petrosB64}" style="position:absolute; left:0; top:0;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${petrosB64}" style="position:absolute; left:-128px; top:0;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${petrosB64}" style="position:absolute; left:0; top:-128px;" />
              </div>
              <div style="width:128px; height:128px; overflow:hidden; background:#222; position:relative;">
                <img src="data:image/png;base64,${petrosB64}" style="position:absolute; left:-128px; top:-128px;" />
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: "screenshots/inspect_gargoyle_new.png" });
  console.log("Saved screenshots/inspect_gargoyle_new.png");
  await browser.close();
}

main().catch(console.error);
