import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setViewport({ width: 1440, height: 900 });
        await page.goto('http://localhost:3000/contact.html', { waitUntil: 'networkidle0' });

        console.log('Capturing Form 1: Book Appointment');
        await page.screenshot({ path: 'C:/Users/seesi/.gemini/antigravity/brain/979a7d17-27af-4bcc-89a4-f9182bd3c535/contact_tab_1.webp', type: 'webp' });

        // Click tab 3 (Treatment Info)
        await page.evaluate(() => document.getElementById('tab-treatment').click());
        await new Promise(r => setTimeout(r, 800));
        console.log('Capturing Form 3: Treatment Info');
        await page.screenshot({ path: 'C:/Users/seesi/.gemini/antigravity/brain/979a7d17-27af-4bcc-89a4-f9182bd3c535/contact_tab_3.webp', type: 'webp' });

        // Click tab 4 (Emergency)
        await page.evaluate(() => document.getElementById('tab-emergency').click());
        await new Promise(r => setTimeout(r, 800));
        console.log('Capturing Form 4: Emergency');
        await page.screenshot({ path: 'C:/Users/seesi/.gemini/antigravity/brain/979a7d17-27af-4bcc-89a4-f9182bd3c535/contact_tab_4.webp', type: 'webp' });

        await browser.close();
        console.log('Screenshots captured successfully for verification.');
    } catch (err) {
        console.error('Puppeteer Error Trace: ', err);
        import('fs').then(fs => fs.writeFileSync('puppeteer-error.txt', err.stack || err.toString()));
        process.exit(1);
    }
})();
