import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log('Capturing Desktop...');
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:5173/doctors.html', { waitUntil: 'networkidle2' });
    try {
        await page.waitForFunction(() => document.querySelectorAll('.doctor-card').length > 0, { timeout: 10000 });
        console.log('Doctors loaded.');
    } catch (e) {
        console.log('Doctors did not load in time.');
    }
    await page.screenshot({ path: 'desktop_doctors.png', fullPage: true });

    console.log('Capturing Mobile...');
    await page.setViewport({ width: 400, height: 800 });
    await page.goto('http://localhost:5173/doctors.html', { waitUntil: 'networkidle2' });
    try {
        await page.waitForFunction(() => document.querySelectorAll('.doctor-card').length > 0, { timeout: 10000 });
        console.log('Doctors loaded.');
    } catch (e) {
        console.log('Doctors did not load in time.');
    }
    await page.screenshot({ path: 'mobile_doctors.png', fullPage: true });

    console.log('Capturing Testimonials...');
    await page.goto('http://localhost:5173/testimonials.html', { waitUntil: 'networkidle2' });
    try {
        await page.waitForFunction(() => document.querySelectorAll('.testimonial-page-card').length > 0, { timeout: 10000 });
        await new Promise(r => setTimeout(r, 600)); // allow glassmorphism to render
        console.log('Testimonials loaded.');
    } catch (e) {
        console.log('Testimonials did not load in time.');
    }
    await page.screenshot({ path: 'testimonials_v6.png', fullPage: true });

    await browser.close();
    console.log('Screenshots saved successfully!');
})();
