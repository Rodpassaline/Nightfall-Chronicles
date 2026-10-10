import { chromium } from "playwright";
import fs from "fs";

const BRAIN = "C:/Users/rodpa/.gemini/antigravity/brain/ca749cb1-0bbc-4c6a-810b-5903a41e7c31/";
const SRC = BRAIN + ".user_uploaded/media_1791574631581_7077f7dd.jpg";
const CELL = 320;
const COLS = 3;
const SHEET_W = CELL * COLS;
const SHEET_H = CELL * 2;
const BOTTOM_PAD = 56;

// Seeds of all frames in the user's reference sheet
const frames = {
  P1: [100, 130], P2: [285, 130], P3: [490, 120], P4: [690, 130],
  A1: [140, 310], A2: [340, 310], A3: [520, 310], A4: [715, 310], A5: [900, 310],
  C1: [75, 490], C2: [250, 490], C3: [395, 490],
  AA1: [570, 490], AA2: [710, 490], AA3: [880, 490],
  F1: [90, 625], F2: [250, 620], F3: [390, 620], F4: [580, 620], F5: [740, 620],
  R1: [90, 750], R2: [260, 750], R3: [430, 750],
  D1: [590, 750], D2: [760, 750], D3: [920, 750],
  M1: [80, 940], M2: [280, 940], M3: [480, 940], M4: [670, 940], M5: [870, 940],
};

const labels = [
  [0, 5, 80, 40], [0, 215, 110, 248], [0, 398, 140, 425], [490, 398, 720, 428],
  [0, 548, 110, 580], [0, 678, 110, 708], [520, 685, 595, 715], [0, 850, 295, 880],
];

const sheets = {
  "hero-idle": ["A5", "A5", "A5", "A5"],
  "hero-run": ["R1", "R2", "P1_run", "P2_run"],
  "hero-jump": ["P3", "P1", "P2", "P4"],
  "hero-attack": ["A4", "A3", "A1", "A2", "A5"],
  "hero-crouch": ["C1", "AA2", "AA3", "C3"],
  "hero-cast": ["M1", "M2", "M3", "M4", "M5"],
  "hero-guard": ["F1", "F2", "F3", "F4", "F5"],
  "hero-dash": ["D1", "D2", "D3", "D2"],
};

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();

const out = await page.evaluate(
  async ({ srcB64, frames, labels, sheets, CELL, SHEET_W, SHEET_H, COLS, BOTTOM_PAD }) => {
    const loadImg = async (b64) => {
      const img = new Image();
      await new Promise((r) => { img.onload = r; img.src = "data:image/jpeg;base64," + b64; });
      return img;
    };

    function extract(img, seeds, labelRects) {
      const W = img.width, H = img.height;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, W, H);
      const d = imgData.data;
      const minC = (p) => Math.min(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
      const luma = (p) => 0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2];
      const sat = (p) => Math.max(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]) - Math.min(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);

      // 1. Flood-fill outer background
      const bg = new Uint8Array(W * H);
      const stack = [];
      const push = (x, y) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const p = y * W + x;
        if (bg[p] || minC(p) < 208) return;
        bg[p] = 1; stack.push(p);
      };
      for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
      for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
      while (stack.length) {
        const p = stack.pop();
        const x = p % W, y = (p / W) | 0;
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
      }

      // 2. Clear trapped white background pockets (e.g., between legs/cape)
      const visited = new Uint8Array(W * H);
      for (let s = 0; s < W * H; s++) {
        if (bg[s] || visited[s] || minC(s) < 210) continue;
        const comp = [s]; visited[s] = 1;
        let head = 0;
        while (head < comp.length) {
          const p = comp[head++];
          const x = p % W, y = (p / W) | 0;
          for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const np = ny * W + nx;
            if (!bg[np] && !visited[np] && minC(np) >= 208) {
              visited[np] = 1; comp.push(np);
            }
          }
        }
        if (comp.length >= 6) {
          for (const p of comp) bg[p] = 1;
        }
      }

      const alpha = new Uint8Array(W * H);
      for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;

      // 3. Multi-pass defringe: aggressively erode white/light perimeter halo
      const defringeSteps = [
        { minTh: 115, lumTh: 125, maxSat: 48 },
        { minTh: 135, lumTh: 145, maxSat: 50 },
        { minTh: 155, lumTh: 165, maxSat: 55 },
      ];
      for (const step of defringeSteps) {
        const toKill = [];
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const p = y * W + x;
            if (!alpha[p]) continue;
            const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
            if (isBorder && sat(p) < step.maxSat && (minC(p) > step.minTh || luma(p) > step.lumTh)) {
              toKill.push(p);
            }
          }
        }
        for (const p of toKill) alpha[p] = 0;
      }

      // 4. Color decontamination: clamp edge RGB towards interior colors to kill residual white flare
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const p = y * W + x;
          if (!alpha[p]) continue;
          const isBorder = !alpha[p - 1] || !alpha[p + 1] || !alpha[p - W] || !alpha[p + W];
          if (!isBorder) continue;

          let bestIn = -1, minL = 999;
          for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) {
            const np = (y + dy) * W + (x + dx);
            if (alpha[np]) {
              const l = luma(np);
              if (l < minL) { minL = l; bestIn = np; }
            }
          }
          if (bestIn >= 0 && luma(p) > minL + 18 && sat(p) < 45) {
            d[p * 4] = Math.min(d[p * 4], d[bestIn * 4] + 20);
            d[p * 4 + 1] = Math.min(d[p * 4 + 1], d[bestIn * 4 + 1] + 20);
            d[p * 4 + 2] = Math.min(d[p * 4 + 2], d[bestIn * 4 + 2] + 20);
          }
        }
      }

      // 5. Component labeling and bounding boxes
      const label = new Int32Array(W * H).fill(-1);
      const comps = [];
      for (let s = 0; s < W * H; s++) {
        if (!alpha[s] || label[s] >= 0) continue;
        const k = comps.length;
        const cp = { minX: W, minY: H, maxX: 0, maxY: 0, n: 0, sx: 0, sy: 0 };
        const st = [s]; label[s] = k;
        while (st.length) {
          const p = st.pop();
          const x = p % W, y = (p / W) | 0;
          cp.n++; cp.sx += x; cp.sy += y;
          if (x < cp.minX) cp.minX = x; if (x > cp.maxX) cp.maxX = x;
          if (y < cp.minY) cp.minY = y; if (y > cp.maxY) cp.maxY = y;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const q = ny * W + nx;
            if (alpha[q] && label[q] < 0) { label[q] = k; st.push(q); }
          }
        }
        cp.cx = cp.sx / cp.n; cp.cy = cp.sy / cp.n;
        comps.push(cp);
      }

      const names = Object.keys(seeds);
      const owner = new Int32Array(comps.length).fill(-1);
      comps.forEach((cp, k) => {
        if (cp.n < 8) return;
        for (const [x0, y0, x1, y1] of labelRects) {
          if (cp.minX >= x0 - 4 && cp.maxX <= x1 + 4 && cp.minY >= y0 - 4 && cp.maxY <= y1 + 4 && cp.n < 4000) return;
        }
        let best = -1, bestD = 1e18;
        names.forEach((nm, i) => {
          const [sx, sy] = seeds[nm];
          const dx = Math.max(cp.minX - sx, 0, sx - cp.maxX);
          const dy = Math.max(cp.minY - sy, 0, sy - cp.maxY);
          const dd = Math.hypot(dx, dy) * 1000 + Math.hypot(cp.cx - sx, cp.cy - sy);
          if (dd < bestD) { bestD = dd; best = i; }
        });
        owner[k] = best;
      });

      const res = {};
      names.forEach((nm, i) => {
        let minX = W, minY = H, maxX = 0, maxY = 0, any = false;
        comps.forEach((cp, k) => {
          if (owner[k] !== i) return;
          any = true;
          minX = Math.min(minX, cp.minX); minY = Math.min(minY, cp.minY);
          maxX = Math.max(maxX, cp.maxX); maxY = Math.max(maxY, cp.maxY);
        });
        if (!any) { res[nm] = null; return; }
        const w = maxX - minX + 1, h = maxY - minY + 1;
        const fc = document.createElement("canvas");
        fc.width = w; fc.height = h;
        const fctx = fc.getContext("2d");
        const fd = fctx.createImageData(w, h);
        let bx = 0, bn = 0, by = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const p = (y + minY) * W + (x + minX);
          const k = label[p];
          if (k < 0 || owner[k] !== i) continue;
          const o = (y * w + x) * 4;
          const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2];
          fd.data[o] = r; fd.data[o + 1] = g; fd.data[o + 2] = b; fd.data[o + 3] = alpha[p];
          if (r > g && g > b && r - b >= 22 && g / r > 0.5 && r < 200) {
            bx += x; bn++; if (y > by) by = y;
          }
        }
        fctx.putImageData(fd, 0, 0);
        res[nm] = { canvas: fc, w, h, ax: bn ? bx / bn : w / 2, ay: bn ? by : h - 1 };
      });
      return res;
    }

    const fr = extract(await loadImg(srcB64), frames, labels);

    // Build alternating run frames P1_run and P2_run scaled to match R1/R2 height
    const runH = (fr.R1.h + fr.R2.h) / 2;
    function scaleFrame(f, targetH) {
      const k = targetH / f.h;
      const sc = document.createElement("canvas");
      sc.width = Math.round(f.w * k);
      sc.height = Math.round(targetH);
      const sctx = sc.getContext("2d");
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(f.canvas, 0, 0, sc.width, sc.height);
      return {
        canvas: sc,
        w: sc.width,
        h: sc.height,
        ax: f.ax * k,
        ay: f.ay * k,
      };
    }

    if (fr.P1) fr.P1_run = scaleFrame(fr.P1, runH);
    if (fr.P2) fr.P2_run = scaleFrame(fr.P2, runH);

    // Build all sprite sheets
    const result = {};
    for (const [sn, list] of Object.entries(sheets)) {
      const sc = document.createElement("canvas");
      sc.width = SHEET_W; sc.height = SHEET_H;
      const sctx = sc.getContext("2d");
      sctx.imageSmoothingEnabled = false;

      list.forEach((nm, idx) => {
        const f = fr[nm];
        if (!f) return;
        const cx = (idx % COLS) * CELL, cy = Math.floor(idx / COLS) * CELL;
        sctx.save();
        sctx.beginPath(); sctx.rect(cx, cy, CELL, CELL); sctx.clip();
        let sy = 1;
        if (sn === "hero-idle") sy = [1, 0.994, 0.986, 0.994][idx];
        const dx = Math.round(cx + CELL / 2 - f.ax);
        const bottom = cy + CELL - BOTTOM_PAD;
        sctx.translate(dx, bottom);
        sctx.scale(1, sy);
        sctx.drawImage(f.canvas, 0, -Math.round(f.ay) - 1);
        sctx.restore();
      });
      result[sn] = sc.toDataURL("image/png");
    }

    return { result, missing: Object.keys(fr).filter((n) => !fr[n]) };
  },
  {
    srcB64: fs.readFileSync(SRC).toString("base64"),
    frames, labels, sheets, CELL, SHEET_W, SHEET_H, COLS, BOTTOM_PAD,
  },
);

for (const [name, url] of Object.entries(out.result)) {
  fs.writeFileSync(`public/sprites/${name}.png`, Buffer.from(url.replace(/^data:image\/png;base64,/, ""), "base64"));
  console.log("wrote public/sprites/" + name + ".png");
}
console.log("Extraction complete. Missing:", out.missing);
await browser.close();
