import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/");

  const uploadedFile = "C:\\Users\\rodpa\\.gemini\\antigravity\\brain\\ca749cb1-0bbc-4c6a-810b-5903a41e7c31\\.user_uploaded\\uploaded_media_1791911485597.mp3";
  const buf = fs.readFileSync(uploadedFile);
  const base64 = buf.toString("base64");

  const outDir = path.join(process.cwd(), "public", "audio", "prologue");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const backupDir = path.join(process.cwd(), "Audios", "prologo");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const cuts = [
    { name: "act1", start: 1.7, end: 18.4 },
    { name: "act2", start: 21.0, end: 35.7 },
    { name: "act3", start: 38.2, end: 50.1 },
    { name: "act4", start: 52.5, end: 65.4 }
  ];

  const wavList = await page.evaluate(async ({ b64, cuts }) => {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const raw = atob(b64);
    const u8 = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
    const audioBuf = await actx.decodeAudioData(u8.buffer);

    const sr = audioBuf.sampleRate;
    const chData = audioBuf.getChannelData(0);

    function encodeWAV(samples, sampleRate) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);

      function writeString(offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      }

      writeString(0, "RIFF");
      view.setUint32(4, 36 + samples.length * 2, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, samples.length * 2, true);

      let offset = 44;
      for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }

      let binary = "";
      const bytes = new Uint8Array(buffer);
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }

    return cuts.map(cut => {
      const startSample = Math.floor(cut.start * sr);
      const endSample = Math.min(chData.length, Math.floor(cut.end * sr));
      const slice = chData.subarray(startSample, endSample);
      return {
        name: cut.name,
        duration: (slice.length / sr).toFixed(2),
        b64: encodeWAV(slice, sr)
      };
    });
  }, { b64: base64, cuts });

  for (const item of wavList) {
    const filePublic = path.join(outDir, `${item.name}.wav`);
    const fileBackup = path.join(backupDir, `${item.name}.wav`);
    const data = Buffer.from(item.b64, "base64");
    fs.writeFileSync(filePublic, data);
    fs.writeFileSync(fileBackup, data);
    console.log(`[OK] Salvo: ${item.name}.wav (${item.duration}s, ${data.length} bytes)`);
  }

  await browser.close();
}

run().catch(err => {
  console.error("Erro ao fatiar áudio:", err);
  process.exit(1);
});
