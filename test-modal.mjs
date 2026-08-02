import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log('Loading page..');
        // Using npx serve that is now serving build output
        await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Opening modal...');
        await page.evaluate(() => {
            document.querySelector('[data-modal-open=\"appointment-modal\"]').click();
        });

        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: 'C:/Users/seesi/.gemini/antigravity/brain/979a7d17-27af-4bcc-89a4-f9182bd3c535/multi_tab_modal_preview.png' });
        console.log('Screenshot saved.');
    } catch (err) {
        console.error('PuppeteerError:', err);
    } finally {
        if (browser) await browser.close();
    }
})();
