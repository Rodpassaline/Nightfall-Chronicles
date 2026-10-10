import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const colB64 = fs.readFileSync("public/sprites/column.png").toString("base64");
  const propColB64 = fs.readFileSync("public/sprites/prop-column.png").toString("base64");
  const html = `
    <html>
      <body style="margin:20px; background:#181824; color:white; font-family:sans-serif; display:flex; gap:30px;">
        <div>
          <h3>column.png</h3>
          <img src="data:image/png;base64,${colB64}" style="height:350px; border:1px solid #444;" />
        </div>
        <div>
          <h3>prop-column.png (Current bugged prop)</h3>
          <img src="data:image/png;base64,${propColB64}" style="height:350px; border:1px solid #444;" />
        </div>
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: "screenshots/column_comparison.png" });
  console.log("Saved screenshots/column_comparison.png");
  await browser.close();
}

main().catch(console.error);
