import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

const REVIEW_DIR = resolve('.review-screenshots');
const BASE_URL = 'http://localhost:5173';

const pages = [
  { path: '/', name: 'home', description: 'Homepage' },
  { path: '/about.html', name: 'about', description: 'About page' },
  { path: '/treatments.html', name: 'treatments', description: 'Treatments listing' },
  { path: '/doctors.html', name: 'doctors', description: 'Doctors listing' },
  { path: '/testimonials.html', name: 'testimonials', description: 'Testimonials page' },
  { path: '/blog.html', name: 'blog', description: 'Blog listing' },
  { path: '/contact.html', name: 'contact', description: 'Contact page' },
  { path: '/admin/login.html', name: 'admin-login', description: 'Admin login' },
];

const findings = [];

async function reviewPage(browser, pageConfig) {
  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', error => errors.push(error.message));

  try {
    console.log(`\n=== Reviewing: ${pageConfig.description} (${pageConfig.path}) ===`);

    await page.setViewport({ width: 1920, height: 1080 });
    const response = await page.goto(`${BASE_URL}${pageConfig.path}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Take screenshot
    await mkdir(REVIEW_DIR, { recursive: true });
    await page.screenshot({
      path: resolve(REVIEW_DIR, `${pageConfig.name}-desktop.png`),
      fullPage: true
    });

    // Mobile screenshot
    await page.setViewport({ width: 375, height: 812 });
    await page.screenshot({
      path: resolve(REVIEW_DIR, `${pageConfig.name}-mobile.png`),
      fullPage: true
    });

    // Check response status
    const status = response.status();
    if (status !== 200) {
      findings.push({
        page: pageConfig.name,
        severity: 'high',
        category: 'Performance',
        issue: `HTTP ${status} response`
      });
    }

    // Check for console errors
    const criticalErrors = consoleMessages.filter(m => m.type === 'error');
    if (criticalErrors.length > 0) {
      findings.push({
        page: pageConfig.name,
        severity: 'high',
        category: 'JavaScript',
        issue: `${criticalErrors.length} console errors`,
        details: criticalErrors.slice(0, 3).map(e => e.text).join('; ')
      });
    }

    // Check for page errors
    if (errors.length > 0) {
      findings.push({
        page: pageConfig.name,
        severity: 'critical',
        category: 'JavaScript',
        issue: `${errors.length} page errors`,
        details: errors.slice(0, 3).join('; ')
      });
    }

    // Check basic accessibility
    const title = await page.title();
    if (!title || title.includes('Vite')) {
      findings.push({
        page: pageConfig.name,
        severity: 'medium',
        category: 'SEO/Accessibility',
        issue: 'Missing or default page title'
      });
    }

    // Check for missing alt text on images
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      findings.push({
        page: pageConfig.name,
        severity: 'medium',
        category: 'Accessibility',
        issue: `${imagesWithoutAlt} images missing alt text`
      });
    }

    // Check for placeholder content
    const bodyText = await page.evaluate(() => document.body.textContent);
    if (bodyText.includes('Lorem ipsum') || bodyText.includes('placeholder')) {
      findings.push({
        page: pageConfig.name,
        severity: 'medium',
        category: 'Content',
        issue: 'Contains placeholder text (Lorem ipsum or "placeholder")'
      });
    }

    // Check for broken links (href="#" that aren't anchors)
    const brokenLinks = await page.$$eval('a[href="#"]', links =>
      links.filter(link => !link.textContent.toLowerCase().includes('skip')).length
    );
    if (brokenLinks > 0) {
      findings.push({
        page: pageConfig.name,
        severity: 'low',
        category: 'UX',
        issue: `${brokenLinks} placeholder links (href="#")`
      });
    }

    console.log(`✓ ${pageConfig.name}: Screenshot captured, ${consoleMessages.length} console messages, ${errors.length} errors`);

  } catch (error) {
    findings.push({
      page: pageConfig.name,
      severity: 'critical',
      category: 'Loading',
      issue: `Failed to load: ${error.message}`
    });
    console.error(`✗ ${pageConfig.name}: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_pages: pages.length,
      total_findings: findings.length,
      by_severity: {
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length,
      },
      by_category: findings.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {})
    },
    findings: findings
  };

  await writeFile(
    resolve(REVIEW_DIR, 'review-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate markdown report
  let markdown = `# Website Review Report\n\n`;
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- Total pages reviewed: ${report.summary.total_pages}\n`;
  markdown += `- Total findings: ${report.summary.total_findings}\n\n`;
  markdown += `### By Severity\n\n`;
  markdown += `- 🔴 Critical: ${report.summary.by_severity.critical}\n`;
  markdown += `- 🟠 High: ${report.summary.by_severity.high}\n`;
  markdown += `- 🟡 Medium: ${report.summary.by_severity.medium}\n`;
  markdown += `- 🟢 Low: ${report.summary.by_severity.low}\n\n`;

  markdown += `## Findings by Page\n\n`;

  for (const pageConfig of pages) {
    const pageFindings = findings.filter(f => f.page === pageConfig.name);
    markdown += `### ${pageConfig.description}\n\n`;

    if (pageFindings.length === 0) {
      markdown += `✅ No issues found\n\n`;
    } else {
      for (const finding of pageFindings) {
        const icon = finding.severity === 'critical' ? '🔴' :
                    finding.severity === 'high' ? '🟠' :
                    finding.severity === 'medium' ? '🟡' : '🟢';
        markdown += `${icon} **${finding.category}**: ${finding.issue}\n`;
        if (finding.details) {
          markdown += `   - Details: ${finding.details}\n`;
        }
        markdown += `\n`;
      }
    }
  }

  await writeFile(resolve(REVIEW_DIR, 'review-report.md'), markdown);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`REVIEW COMPLETE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Screenshots saved to: ${REVIEW_DIR}`);
  console.log(`Report saved to: ${resolve(REVIEW_DIR, 'review-report.md')}`);
  console.log(`\nSummary:`);
  console.log(`  Critical: ${report.summary.by_severity.critical}`);
  console.log(`  High: ${report.summary.by_severity.high}`);
  console.log(`  Medium: ${report.summary.by_severity.medium}`);
  console.log(`  Low: ${report.summary.by_severity.low}`);
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const pageConfig of pages) {
    await reviewPage(browser, pageConfig);
  }

  await browser.close();
  await generateReport();
})();
