// Builds layered, seamless parallax art for each stage into public/art/stages/s{n}/
//   back.jpg  – distant opaque layer (mirror-tiled, seamless)
//   mid.png   – architecture layer, magenta keyed to alpha (optional)
//   floor.jpg – ground/wall face texture (mirror-tiled)
//   fg.png    – near-black foreground framing, magenta keyed (optional)
// Image work runs inside headless Chrome's canvas (no native deps needed).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/art/stages");
const MANIFEST = path.join(ROOT, "src/game/stage-layers.json");

// find newest generated file whose name starts with prefix
function gen(prefix) {
  const files = fs.readdirSync(BRAIN).filter((f) => f.startsWith(prefix + "_") && /\.(jpg|png)$/.test(f));
  if (!files.length) return null;
  files.sort();
  return BRAIN + files[files.length - 1];
}
const old = (n) => path.join(ROOT, `public/art/stage-${n}.jpg`);

// floor recolour filters used until a bespoke floor exists for the stage
const FLOOR_FILTER = {
  1: "none",
  2: "grayscale(0.75) brightness(1.08) contrast(1.05)",
  3: "hue-rotate(55deg) saturate(0.65) brightness(0.88)",
  4: "brightness(0.8) saturate(0.75)",
  5: "sepia(0.75) hue-rotate(-12deg) saturate(1.05) brightness(0.82)",
  6: "hue-rotate(-45deg) saturate(0.7) brightness(0.85)",
  7: "sepia(0.55) hue-rotate(-48deg) saturate(1.7) brightness(0.68)",
};

function plan(n) {
  const back = gen(`s${n}_back`);
  const mid = gen(`s${n}_mid`);
  const floor = gen(`s${n}_floor`);
  const fg = gen(`s${n}_fg`);
  const interiorFg = gen("s3_fg");
  const exteriorFg = gen("s1_fg");
  return {
    n,
    back: back
      ? { file: back, crop: 0, mirror: true, filter: "none", bespoke: true }
      : { file: old(n), crop: 0.1, mirror: false, filter: "saturate(0.55) brightness(0.6) contrast(1.12)", bespoke: false },
    mid: mid ? { file: mid } : null,
    floor: floor ? { file: floor, filter: "none" } : { file: gen("s1_floor"), filter: FLOOR_FILTER[n] },
    fg: fg ? { file: fg } : { file: n === 1 || n === 4 ? exteriorFg : interiorFg },
  };
}

async function main() {
  const only = process.argv[2] ? process.argv[2].split(",").map(Number) : [1, 2, 3, 4, 5, 6, 7];
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};

  const b64 = (f) => "data:image/" + (f.endsWith(".png") ? "png" : "jpeg") + ";base64," + fs.readFileSync(f).toString("base64");

  for (const n of only) {
    const p = plan(n);
    const dir = path.join(OUT, `s${n}`);
    fs.mkdirSync(dir, { recursive: true });
    const job = {
      back: { src: b64(p.back.file), crop: p.back.crop, mirror: p.back.mirror, filter: p.back.filter, h: 300 },
      mid: p.mid ? { src: b64(p.mid.file), h: 250 } : null,
      floor: { src: b64(p.floor.file), filter: p.floor.filter, h: 112 },
      fg: p.fg?.file ? { src: b64(p.fg.file), h: 300 } : null,
    };
    const out = await page.evaluate(async (job) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = src;
        });
      const canvas = (w, h) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        return c;
      };
      // Chroma-key pure magenta to alpha with despill, at source resolution.
      function key(img) {
        const c = canvas(img.naturalWidth, img.naturalHeight);
        const x = c.getContext("2d");
        x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height);
        const a = d.data;
        for (let i = 0; i < a.length; i += 4) {
          const r = a[i], g = a[i + 1], b = a[i + 2];
          const m = Math.min(r, b) - g;
          if (r > 140 && b > 140 && m > 85) {
            a[i + 3] = 0;
          } else if (m > 30 && r > 90 && b > 90) {
            const t = Math.min(1, (m - 30) / 55);
            a[i + 3] = Math.round(255 * (1 - t));
            const cap = g + 18;
            a[i] = Math.min(r, cap);
            a[i + 2] = Math.min(b, cap);
          }
        }
        x.putImageData(d, 0, 0);
        return c;
      }
      // Scale to target height (high quality), optional crop/filter, optional mirror for seamless tiling.
      function fit(src, h, { crop = 0, filter = "none", mirror = true } = {}) {
        const sw = src.width || src.naturalWidth;
        const shFull = src.height || src.naturalHeight;
        const sy = Math.round(shFull * crop);
        const sh = shFull - sy;
        const w = Math.round((sw * h) / sh);
        const c = canvas(mirror ? w * 2 : w, h);
        const x = c.getContext("2d");
        x.imageSmoothingEnabled = true;
        x.imageSmoothingQuality = "high";
        x.filter = filter;
        x.drawImage(src, 0, sy, sw, sh, 0, 0, w, h);
        x.filter = "none";
        if (mirror) {
          x.save();
          x.translate(w * 2, 0);
          x.scale(-1, 1);
          x.drawImage(c, 0, 0, w, h, 0, 0, w, h);
          x.restore();
        }
        return c;
      }
      const res = {};
      const back = await load(job.back.src);
      res.back = fit(back, job.back.h, { crop: job.back.crop, mirror: job.back.mirror, filter: job.back.filter }).toDataURL("image/jpeg", 0.9);
      if (job.mid) res.mid = fit(key(await load(job.mid.src)), job.mid.h).toDataURL("image/png");
      res.floor = fit(await load(job.floor.src), job.floor.h, { filter: job.floor.filter }).toDataURL("image/jpeg", 0.92);
      if (job.fg) res.fg = fit(key(await load(job.fg.src)), job.fg.h).toDataURL("image/png");
      return res;
    }, job);
    const write = (name, url) => fs.writeFileSync(path.join(dir, name), Buffer.from(url.split(",")[1], "base64"));
    write("back.jpg", out.back);
    if (out.mid) write("mid.png", out.mid);
    else if (fs.existsSync(path.join(dir, "mid.png"))) fs.unlinkSync(path.join(dir, "mid.png"));
    write("floor.jpg", out.floor);
    if (out.fg) write("fg.png", out.fg);
    manifest[String(n)] = { mid: !!out.mid, fg: !!out.fg, bespokeBack: p.back.bespoke };
    console.log(`s${n}: back=${path.basename(p.back.file)} mid=${p.mid ? path.basename(p.mid.file) : "-"} floor=${path.basename(p.floor.file)} fg=${p.fg?.file ? path.basename(p.fg.file) : "-"}`);
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
