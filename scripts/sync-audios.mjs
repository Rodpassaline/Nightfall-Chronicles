import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicAudioDir = path.join(root, "public", "audio", "personagens");

if (!fs.existsSync(publicAudioDir)) {
  fs.mkdirSync(publicAudioDir, { recursive: true });
}

const possibleSourceDirs = [
  path.join(root, "Audios", "Personagens"),
  path.join(root, "Audios", "personagens"),
  path.join(root, "audios", "personagens"),
  path.join(root, "audio", "personagens"),
];

const enemyKeywords = ["zombie", "bat", "skeleton", "armored-skeleton", "red-skeleton", "knight", "gargoyle", "vampire"];

for (const dirPath of possibleSourceDirs) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".wav" || ext === ".mp3" || ext === ".ogg") {
        const src = path.join(dirPath, file);
        if (fs.statSync(src).isFile()) {
          const destExact = path.join(publicAudioDir, file);
          try {
            fs.copyFileSync(src, destExact);

            // Detect enemy keyword in filename and create clean canonical alias
            const lower = file.toLowerCase();
            for (const key of enemyKeywords) {
              if (lower.includes(key)) {
                const canonicalName = `${key}${ext}`;
                const destCanonical = path.join(publicAudioDir, canonicalName);
                fs.copyFileSync(src, destCanonical);
                break;
              }
            }
          } catch (err) {
            console.error(`[sync-audios] Erro ao copiar ${src}:`, err);
          }
        }
      }
    }
  }
}
