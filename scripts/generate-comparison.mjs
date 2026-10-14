import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

  await page.goto("http://localhost:8080");

  const comparisonDataUrl = await page.evaluate(async () => {
    function load(src) {
      return new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    const c = document.createElement("canvas");
    c.width = 1400;
    c.height = 1800;
    const g = c.getContext("2d");
    g.fillStyle = "#1e1e28";
    g.fillRect(0, 0, c.width, c.height);

    function blit(img, frame, cx, feet, height, facing = 1, cols = 2) {
      if (!img) return;
      const sw = img.width / cols;
      const sh = img.height / 2;
      const col = frame % cols;
      const row = Math.floor(frame / cols) % 2;
      const dw = height * (sw / sh);
      g.save();
      g.translate(cx, feet);
      g.scale(facing, 1);
      g.drawImage(img, col * sw, row * sh, sw, sh, -dw / 2, -height, dw, height);
      g.restore();
    }

    const KINDS = [
      { key: "hero", living: "/sprites/hero-idle.png", die: "/sprites/hero-die.png", h: 185, cols: 3, feetOff: (56/320)*185 },
      { key: "zombie", living: "/sprites/zombie.png", die: "/sprites/zombie-die.png", h: 104, cols: 2, feetOff: 4 },
      { key: "skeleton", living: "/sprites/skeleton.png", die: "/sprites/skeleton-die.png", h: 104, cols: 2, feetOff: 9 },
      { key: "knight", living: "/sprites/knight.png", die: "/sprites/knight-die.png", h: 116, cols: 2, feetOff: 2 },
      { key: "armoredSkeleton", living: "/sprites/armored-skeleton.png", die: "/sprites/armored-skeleton-die.png", h: 110, cols: 2, feetOff: 8 },
      { key: "redSkeleton", living: "/sprites/red-skeleton.png", die: "/sprites/red-skeleton-die.png", h: 104, cols: 2, feetOff: 8 },
      { key: "gargoyle", living: "/sprites/gargoyle.png", die: "/sprites/gargoyle-die.png", h: 112, cols: 2, feetOff: 10 },
      { key: "vampire", living: "/sprites/vampire.png", die: "/sprites/vampire-die.png", h: 112, cols: 2, feetOff: 10 },
      { key: "bat", living: "/sprites/bat.png", die: "/sprites/bat-die.png", h: 46, cols: 2, feetOff: 0 }
    ];

    let rowY = 160;
    g.font = "bold 20px monospace";
    g.fillStyle = "#ffffff";
    g.fillText("COMPARISON: LIVING (Frame 0) vs DEATH (Frames 0, 1, 2, 3)", 40, 50);

    for (const item of KINDS) {
      const livingImg = await load(item.living);
      const dieImg = await load(item.die);

      // Draw red ground line
      const groundY = rowY + 120;
      g.strokeStyle = "#ff4444";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(40, groundY);
      g.lineTo(1350, groundY);
      g.stroke();

      g.fillStyle = "#ffd700";
      g.font = "bold 16px monospace";
      g.fillText(item.key.toUpperCase(), 40, groundY - 130);

      // 1. Living Frame 0
      g.fillStyle = "#88ff88";
      g.fillText("Living 0", 180, groundY + 25);
      blit(livingImg, 0, 220, groundY + item.feetOff, item.h, 1, item.cols);

      // 2. Die Frame 0
      g.fillStyle = "#ffaaaa";
      g.fillText("Die 0", 420, groundY + 25);
      blit(dieImg, 0, 450, groundY + item.feetOff, item.h, 1, 2);

      // 3. Die Frame 1
      g.fillText("Die 1", 660, groundY + 25);
      blit(dieImg, 1, 690, groundY + item.feetOff, item.h, 1, 2);

      // 4. Die Frame 2
      g.fillText("Die 2", 900, groundY + 25);
      blit(dieImg, 2, 930, groundY + item.feetOff, item.h, 1, 2);

      // 5. Die Frame 3
      g.fillText("Die 3", 1140, groundY + 25);
      blit(dieImg, 3, 1170, groundY + item.feetOff, item.h, 1, 2);

      rowY += 180;
    }

    return c.toDataURL("image/png");
  });

  fs.mkdirSync("screenshots/comparison", { recursive: true });
  fs.writeFileSync(
    "screenshots/comparison/full_comparison.png",
    Buffer.from(comparisonDataUrl.split(",")[1], "base64")
  );

  await browser.close();
  console.log("Comparação completa gravada em screenshots/comparison/full_comparison.png");
}

main().catch(console.error);
