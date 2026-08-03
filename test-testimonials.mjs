import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewport({ width: 1440, height: 4000 });

    console.log('Navigating to testimonials page...');
    await page.goto('http://localhost:4173/testimonials.html', { waitUntil: 'networkidle0' });

    await new Promise(r => setTimeout(r, 2000));

    const artifactDir = join('C:', 'Users', 'seesi', '.gemini', 'antigravity', 'brain', '979a7d17-27af-4bcc-89a4-f9182bd3c535');
    const screenshotPath = join(artifactDir, 'testimonials-preview.webp');

    // Take full page screenshot
    await page.screenshot({ path: screenshotPath, type: 'webp', fullPage: true });
    console.log(`Saved screenshot to ${screenshotPath}`);

    await browser.close();
})();
