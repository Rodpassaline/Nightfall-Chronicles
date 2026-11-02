import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";

const rootDir = process.cwd();
const propsDir = path.join(rootDir, "public", "art", "props");

if (!fs.existsSync(propsDir)) {
  fs.mkdirSync(propsDir, { recursive: true });
}

/**
 * Flood-fills background starting from the 4 outer image edges.
 * Every pixel connected to an outer edge whose brightness or color distance
 * to the background color is within tolerance is marked as transparent (alpha = 0).
 */
export function removeBackgroundAndSavePng(rawRgba, width, height, destPngPath, options = {}) {
  const {
    maxBrightness = 38,       // anything darker than this connected to border becomes transparent
    colorDistTolerance = 45,  // Euclidean RGB distance to detected corner color
    smoothEdges = true,
    portalCutout = false      // if true, also flood fill from center lower area (the open portal)
  } = options;

  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  // Detect edge background color from corners
  const corners = [
    0, // top-left
    width - 1, // top-right
    (height - 1) * width, // bottom-left
    (height - 1) * width + width - 1 // bottom-right
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const c of corners) {
    const idx = c * 4;
    bgR += rawRgba[idx];
    bgG += rawRgba[idx + 1];
    bgB += rawRgba[idx + 2];
  }
  bgR = Math.round(bgR / corners.length);
  bgG = Math.round(bgG / corners.length);
  bgB = Math.round(bgB / corners.length);

  function isBg(idx) {
    const r = rawRgba[idx];
    const g = rawRgba[idx + 1];
    const b = rawRgba[idx + 2];
    const brightness = Math.max(r, g, b);
    if (brightness <= maxBrightness) return true;
    const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
    return dist <= colorDistTolerance;
  }

  // Seed with all edge pixels that qualify as background
  for (let x = 0; x < width; x++) {
    // Top row
    let idx = (0 * width + x) * 4;
    if (isBg(idx) && !visited[x]) {
      visited[x] = 1;
      queue[qTail++] = x;
    }
    // Bottom row
    const bIdx = (height - 1) * width + x;
    idx = bIdx * 4;
    if (isBg(idx) && !visited[bIdx]) {
      visited[bIdx] = 1;
      queue[qTail++] = bIdx;
    }
  }

  for (let y = 0; y < height; y++) {
    // Left col
    const lIdx = y * width;
    let idx = lIdx * 4;
    if (isBg(idx) && !visited[lIdx]) {
      visited[lIdx] = 1;
      queue[qTail++] = lIdx;
    }
    // Right col
    const rIdx = y * width + (width - 1);
    idx = rIdx * 4;
    if (isBg(idx) && !visited[rIdx]) {
      visited[rIdx] = 1;
      queue[qTail++] = rIdx;
    }
  }

  // If portalCutout, also seed from center-bottom (inside arch opening)
  if (portalCutout) {
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height * 0.75);
    const pIdx = cy * width + cx;
    if (isBg(pIdx * 4) && !visited[pIdx]) {
      visited[pIdx] = 1;
      queue[qTail++] = pIdx;
    }
  }

  // BFS Flood Fill
  while (qHead < qTail) {
    const cur = queue[qHead++];
    const cx = cur % width;
    const cy = Math.floor(cur / width);

    // Check 4 neighbors
    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < width - 1 ? cur + 1 : -1,
      cy > 0 ? cur - width : -1,
      cy < height - 1 ? cur + width : -1
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n] && isBg(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
  }

  // Create clean PNG with alpha
  const png = new PNG({ width, height });
  for (let i = 0; i < totalPixels; i++) {
    const sIdx = i * 4;
    if (visited[i]) {
      png.data[sIdx] = 0;
      png.data[sIdx + 1] = 0;
      png.data[sIdx + 2] = 0;
      png.data[sIdx + 3] = 0; // Transparent!
    } else {
      png.data[sIdx] = rawRgba[sIdx];
      png.data[sIdx + 1] = rawRgba[sIdx + 1];
      png.data[sIdx + 2] = rawRgba[sIdx + 2];
      png.data[sIdx + 3] = 255;
    }
  }

  // Optional 1px edge softening to eliminate harsh aliasing
  if (smoothEdges) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const idx = i * 4;
        if (png.data[idx + 3] > 0) {
          // Check how many neighbors are transparent
          let transCount = 0;
          if (png.data[((y - 1) * width + x) * 4 + 3] === 0) transCount++;
          if (png.data[((y + 1) * width + x) * 4 + 3] === 0) transCount++;
          if (png.data[(y * width + (x - 1)) * 4 + 3] === 0) transCount++;
          if (png.data[(y * width + (x + 1)) * 4 + 3] === 0) transCount++;
          if (transCount >= 2) {
            // Soften border pixel
            png.data[idx + 3] = 210;
          }
        }
      }
    }
  }

  const buf = PNG.sync.write(png);
  fs.writeFileSync(destPngPath, buf);
  console.log(`[PNG Processor] Salvo com sucesso: ${destPngPath} (${width}x${height})`);
}

export function convertFileToTransparentPng(srcPath, destPath, options = {}) {
  const buf = fs.readFileSync(srcPath);
  let rawRgba;
  let width, height;

  if (srcPath.endsWith(".jpg") || srcPath.endsWith(".jpeg")) {
    const decoded = jpeg.decode(buf, { useTArray: true });
    rawRgba = decoded.data;
    width = decoded.width;
    height = decoded.height;
  } else if (srcPath.endsWith(".png")) {
    const png = PNG.sync.read(buf);
    rawRgba = png.data;
    width = png.width;
    height = png.height;
  } else {
    throw new Error(`Formato desconhecido para ${srcPath}`);
  }

  removeBackgroundAndSavePng(rawRgba, width, height, destPath, options);
}
