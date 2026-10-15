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

const mappingRules = [
  { match: ["zombie", "mortos-vivos"], canonical: ["zombie"] },
  { match: ["morcego", "bat"], canonical: ["bat"] },
  { match: ["bones", "skeleton", "esqueleto"], canonical: ["skeleton", "armoredSkeleton", "redSkeleton"] },
  { match: ["knight", "cavaleiro"], canonical: ["knight"] },
  { match: ["gargoyle", "gargula"], canonical: ["gargoyle"] },
  { match: ["vampire", "vampiro"], canonical: ["vampire"] },
];

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

            const lower = file.toLowerCase();
            for (const rule of mappingRules) {
              const matched = rule.match.some((m) => lower.includes(m));
              if (matched) {
                for (const can of rule.canonical) {
                  const destCanonical = path.join(publicAudioDir, `${can}${ext}`);
                  fs.copyFileSync(src, destCanonical);
                  console.log(`[sync-audios] Sincronizado: ${file} -> ${can}${ext}`);
                }
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
