import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicRootAudioDir = path.join(root, "public", "audio");
const publicAudioDir = path.join(publicRootAudioDir, "personagens");

if (!fs.existsSync(publicAudioDir)) {
  fs.mkdirSync(publicAudioDir, { recursive: true });
}

// 1. Sync game-wide themes (victory / gameover) from Audios/
const rootAudiosDirs = [path.join(root, "Audios"), path.join(root, "audios")];
for (const dir of rootAudiosDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const src = path.join(dir, file);
      if (fs.existsSync(src) && fs.statSync(src).isFile()) {
        const lower = file.toLowerCase();
        if ((lower.includes("hero") || lower.includes("epic hero")) && (lower.endsWith(".mp3") || lower.endsWith(".wav"))) {
          const dest = path.join(publicRootAudioDir, "victory.mp3");
          fs.copyFileSync(src, dest);
          console.log(`[sync-audios] Sincronizado tema de vitória: ${file} -> victory.mp3`);
        } else if ((lower.includes("cinematic") || lower.includes("epic_cinematic") || lower.includes("gameover")) && (lower.endsWith(".mp3") || lower.endsWith(".wav"))) {
          const dest = path.join(publicRootAudioDir, "gameover.mp3");
          fs.copyFileSync(src, dest);
          console.log(`[sync-audios] Sincronizado tema de gameover: ${file} -> gameover.mp3`);
        }
      }
    }
  }
}

// 2. Sync character alert audios from Audios/Personagens/
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
