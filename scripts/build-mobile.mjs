import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const rootDir = process.cwd();
const indexHtmlPath = join(rootDir, "index.html");

const mobileIndexHtml = `<!DOCTYPE html>
<html lang="pt-BR" class="antialiased">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#100e12" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Nightfall Chronicles</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Literata:ital,opsz,wght@0,7..72,460;0,7..72,650;1,7..72,460&display=swap" />
  </head>
  <body class="bg-black text-fg overflow-x-hidden select-none">
    <div id="root"></div>
    <script type="module" src="/src/mobile-main.tsx"></script>
  </body>
</html>
`;

console.log("[build-mobile] Sincronizando áudios e vídeos...");
execSync("node scripts/sync-audios.mjs", { stdio: "inherit" });
execSync("node scripts/sync-videos.mjs", { stdio: "inherit" });

try {
  console.log("[build-mobile] Gerando bundle estático para Capacitor (dist-mobile)...");
  writeFileSync(indexHtmlPath, mobileIndexHtml, "utf-8");
  execSync("npx vite build --config vite.capacitor.config.ts", { stdio: "inherit" });
  console.log("[build-mobile] Bundle mobile concluído com sucesso em dist-mobile/!");
} finally {
  if (existsSync(indexHtmlPath)) {
    unlinkSync(indexHtmlPath);
  }
}
