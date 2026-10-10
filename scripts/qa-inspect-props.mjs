import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  
  const propNames = [
    "prop-tomb.png", "prop-fence.png", "prop-gate.png", "prop-statue.png",
    "prop-candelabra.png", "prop-pew.png", "prop-altar.png", "prop-angel.png",
    "prop-bookshelf.png", "prop-ladder.png", "prop-alchemy-table.png"
  ];

  let imgsHtml = "";
  for (const name of propNames) {
    if (fs.existsSync("public/sprites/" + name)) {
      const b64 = fs.readFileSync("public/sprites/" + name).toString("base64");
      imgsHtml += `
        <div style="background:#222; padding:8px; border-radius:4px; text-align:center;">
          <div style="font-size:11px; margin-bottom:4px; color:#aaa;">${name}</div>
          <img src="data:image/png;base64,${b64}" style="max-height:100px; display:block; margin:0 auto; border:1px solid #555;" />
        </div>
      `;
    }
  }

  const html = `
    <html>
      <body style="margin:20px; background:#12121c; color:white; font-family:sans-serif;">
        <h2>Inspect Props</h2>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px;">
          ${imgsHtml}
        </div>
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.screenshot({ path: "screenshots/inspect_props.png" });
  console.log("Saved screenshots/inspect_props.png");
  await browser.close();
}

main().catch(console.error);
