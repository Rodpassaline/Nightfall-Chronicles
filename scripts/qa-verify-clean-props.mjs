import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });

  function b64(p) {
    return fs.readFileSync(p).toString("base64");
  }

  const html = `
    <html>
      <body style="margin:20px; background:#120e1a; color:white; font-family:sans-serif;">
        <h2>SOTN Assets Preview</h2>
        <div style="display:flex; gap:20px; align-items:flex-end; flex-wrap:wrap;">
          <div style="background:#221828; padding:8px; border-radius:6px;">
            <div style="font-size:11px; color:#aaa;">marble-column-full.png</div>
            <img src="data:image/png;base64,${b64("public/sprites/marble-column-full.png")}" style="height:260px;" />
          </div>
          <div style="background:#221828; padding:8px; border-radius:6px;">
            <div style="font-size:11px; color:#aaa;">marble-column-broken.png</div>
            <img src="data:image/png;base64,${b64("public/sprites/marble-column-broken.png")}" style="height:180px;" />
          </div>
          <div style="background:#221828; padding:8px; border-radius:6px;">
            <div style="font-size:11px; color:#aaa;">marble-column-hanging.png</div>
            <img src="data:image/png;base64,${b64("public/sprites/marble-column-hanging.png")}" style="height:220px;" />
          </div>
          <div style="background:#221828; padding:8px; border-radius:6px;">
            <div style="font-size:11px; color:#aaa;">statue-gladiator.png</div>
            <img src="data:image/png;base64,${b64("public/sprites/statue-gladiator.png")}" style="height:240px;" />
          </div>
          <div style="background:#221828; padding:8px; border-radius:6px;">
            <div style="font-size:11px; color:#aaa;">sconce-blue.png</div>
            <img src="data:image/png;base64,${b64("public/sprites/sconce-blue.png")}" style="height:100px;" />
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: "screenshots/inspect_clean_sotn_props.png" });
  console.log("Saved screenshots/inspect_clean_sotn_props.png");
  await browser.close();
}

main().catch(console.error);
