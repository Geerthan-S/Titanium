const { chromium } = require('playwright');

(async () => {
    console.log('Starting headless browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // forward console logs for tracking
    page.on('console', msg => {
        if (msg.text().includes('Success') || msg.text().includes('Failed') || msg.text().includes('Processing')) {
            console.log('BROWSER:', msg.text());
        }
    });

    await page.goto('http://localhost:4321/generator.html');

    // click start button
    await page.click('#startBtn');

    console.log('Waiting for generation process to complete...');

    // wait for completion
    try {
        await page.waitForFunction(() => {
            const status = document.getElementById('status');
            return status && status.innerText.includes('Generation loop complete!');
        }, { timeout: 15 * 60 * 1000 }); // 15 mins
        console.log('Generation completed successfully!');
    } catch (e) {
        console.error('Timeout or error during generation:', e);
    }

    await browser.close();
})();
