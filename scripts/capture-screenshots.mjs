/**
 * Regenera os PNGs do README a partir das fixtures HTML.
 *
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *   node scripts/capture-screenshots.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'screenshots');
const fixturesDir = path.join(outDir, 'fixtures');

const shots = [
  {
    src: path.join(fixturesDir, 'painel-vazio.html'),
    out: path.join(outDir, 'painel-vazio.png'),
    width: 420,
    height: 720,
  },
  {
    src: path.join(fixturesDir, 'filtros.html'),
    out: path.join(outDir, 'filtros.png'),
    width: 420,
    height: 720,
  },
  {
    src: path.join(fixturesDir, 'gravando.html'),
    out: path.join(outDir, 'gravando.png'),
    width: 420,
    height: 720,
  },
  {
    src: path.join(fixturesDir, 'lista-e-detalhe.html'),
    out: path.join(outDir, 'lista-e-detalhe.png'),
    width: 420,
    height: 980,
  },
  {
    src: path.join(root, 'test-page', 'index.html'),
    out: path.join(outDir, 'pagina-teste.png'),
    width: 900,
    height: 640,
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
    });
    await page.goto(pathToFileURL(shot.src).href, { waitUntil: 'load' });
    await page.screenshot({ path: shot.out, fullPage: false });
    await page.close();
    console.log(`wrote ${path.relative(root, shot.out)}`);
  }
} finally {
  await browser.close();
}
