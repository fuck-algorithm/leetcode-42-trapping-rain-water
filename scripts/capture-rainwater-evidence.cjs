const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:48046', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'docs/evidence/round-2/initial-reduced-motion.png', fullPage: true });
  const caption = page.locator('.step-narration');
  await page.getByTitle('下一步 (→)').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/evidence/round-2/compare-step.png', fullPage: true });
  await page.getByTitle('下一步 (→)').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/evidence/round-2/process-step.png', fullPage: true });
  const checks = await page.evaluate(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    caption: document.querySelector('.step-narration')?.textContent,
    chart: document.querySelector('.two-pointer-chart')?.getBoundingClientRect().toJSON(),
    canvas: document.querySelector('.d3-component')?.getBoundingClientRect().toJSON(),
    viewport: { width: innerWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight },
    current: document.querySelectorAll('.bar[data-status="current"]').length,
    compare: document.querySelectorAll('.bar[data-status="compare"]').length,
  }));
  process.stdout.write(JSON.stringify(checks, null, 2));
  await browser.close();
})();
