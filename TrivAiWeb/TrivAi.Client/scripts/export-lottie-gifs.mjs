import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import gifenc from 'gifenc';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(clientRoot, '..');
const inputDir = path.resolve(projectRoot, 'LottieAnimations');
const outputDir = path.resolve(clientRoot, 'public', 'lottie-gifs');

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findChrome() {
  for (const candidate of chromeCandidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'No local Chrome/Edge executable found. Install Chrome or adjust the paths in scripts/export-lottie-gifs.mjs.',
  );
}

async function loadAnimationFiles() {
  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const files = await loadAnimationFiles();
  if (!files.length) {
    console.log(`No Lottie JSON files found in ${inputDir}`);
    return;
  }

  const lottiePath = path.resolve(clientRoot, 'node_modules', 'lottie-web', 'build', 'player', 'lottie.min.js');
  const chromePath = findChrome();

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    for (const file of files) {
      const inputPath = path.resolve(inputDir, file);
      const outputPath = path.resolve(outputDir, `${path.basename(file, '.json')}.gif`);
      const animationData = JSON.parse(await fs.readFile(inputPath, 'utf8'));
      const width = Number(animationData.w) || 512;
      const height = Number(animationData.h) || 512;
      const frameRate = Number(animationData.fr) || 30;
      const startFrame = Math.floor(Number(animationData.ip) || 0);
      const endFrame = Math.ceil(Number(animationData.op) || animationData.frames || 0);
      const frameDelay = Math.max(10, Math.round(1000 / frameRate));

      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.setContent(
        `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent;
      }
      #animation {
        width: ${width}px;
        height: ${height}px;
      }
    </style>
  </head>
  <body>
    <div id="animation"></div>
  </body>
</html>`,
      );
      await page.addScriptTag({ path: lottiePath });

      await page.evaluate(async (data) => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const container = document.getElementById('animation');
        const animation = window.lottie.loadAnimation({
          container,
          renderer: 'canvas',
          loop: false,
          autoplay: false,
          animationData: data,
        });

        await new Promise((resolve) => {
          const done = () => {
            animation.removeEventListener('DOMLoaded', done);
            resolve();
          };
          animation.addEventListener('DOMLoaded', done);
        });

        await nextFrame();

        const canvas = container.querySelector('canvas');
        if (!canvas) {
          throw new Error('Lottie canvas was not created.');
        }

        window.__renderFrame = async (frame) => {
          animation.goToAndStop(frame, true);
          await wait(0);
          await nextFrame();
          const width = Number(data.w) || canvas.width || 512;
          const height = Number(data.h) || canvas.height || 512;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          const imageData = context.getImageData(0, 0, width, height);
          return Array.from(imageData.data);
        };
        window.__cleanupAnimation = () => animation.destroy();
      }, animationData);

      const gif = GIFEncoder();

      for (let frame = startFrame; frame < endFrame; frame += 1) {
        const pixels = await page.evaluate((frameNumber) => window.__renderFrame(frameNumber), frame);
        const rgba = Uint8Array.from(pixels);
        const palette = quantize(rgba, 256, {
          format: 'rgba4444',
          oneBitAlpha: true,
        });
        const index = applyPalette(rgba, palette, 'rgba4444');
        const transparentIndex = palette.findIndex((color) => Array.isArray(color) && color.length === 4 && color[3] === 0);

        gif.writeFrame(index, width, height, {
          palette,
          delay: frameDelay,
          transparent: transparentIndex >= 0,
          transparentIndex: transparentIndex >= 0 ? transparentIndex : 0,
        });
      }

      gif.finish();

      await page.evaluate(() => {
        if (window.__cleanupAnimation) {
          window.__cleanupAnimation();
          window.__cleanupAnimation = null;
        }
        window.__renderFrame = null;
      });

      await fs.writeFile(outputPath, Buffer.from(gif.bytes()));
      console.log(`Wrote ${path.relative(clientRoot, outputPath)}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
