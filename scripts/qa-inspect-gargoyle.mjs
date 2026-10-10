import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

  const b64 = fs.readFileSync("public/sprites/gargoyle.png").toString("base64");
  const html = `
    <html>
      <body style="margin:20px; background:#202030; color:white;">
        <h3>gargoyle.png</h3>
        <img src="data:image/png;base64,${b64}" style="border:1px solid #555;" />
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: "screenshots/inspect_gargoyle.png" });
  console.log("Saved screenshots/inspect_gargoyle.png");
  await browser.close();
}

main().catch(console.error);
