import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicVideoDir = path.join(root, "public", "video");

if (!fs.existsSync(publicVideoDir)) {
  fs.mkdirSync(publicVideoDir, { recursive: true });
}

const possibleSourceDirs = ["Vídeos", "videos", "video"];
let foundVideo = false;

for (const dirName of possibleSourceDirs) {
  const dirPath = path.join(root, dirName);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (file.endsWith(".mp4") || file.endsWith(".webm")) {
        const src = path.join(dirPath, file);
        const destIntro = path.join(publicVideoDir, "intro.mp4");
        const destExact = path.join(publicVideoDir, file);
        try {
          fs.copyFileSync(src, destIntro);
          fs.copyFileSync(src, destExact);
          foundVideo = true;
          console.log(`[sync-videos] Sincronizado: ${src} -> ${destIntro}`);
        } catch (err) {
          console.error(`[sync-videos] Erro ao copiar ${src}:`, err);
        }
      }
    }
  }
}

if (!foundVideo) {
  console.log("[sync-videos] Nenhum vídeo externo encontrado para sincronizar.");
}
