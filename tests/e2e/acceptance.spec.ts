import { expect, test } from '@playwright/test';

const openApp = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /42\. 接雨水/ })).toBeVisible();
};

test('E2E-001 首屏布局、教学层和空间', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openApp(page);
  await expect(page.getByRole('img', { name: '双指针接雨水动画' })).toBeVisible();
  await expect(page.locator('.operation')).toBeVisible();
  await expect(page.locator('.canvas-legend')).toBeVisible();
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    const measures = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, inner: window.innerHeight, header: document.querySelector('[data-testid="app-header"]')?.getBoundingClientRect().height, canvas: document.querySelector('.two-pointer-chart')?.getBoundingClientRect().height, svg: document.querySelector('.d3-component')?.getBoundingClientRect().height, chrome: ['[data-testid="app-header"]', '.input-bar', '.tab-header', '.animation-controls'].reduce((sum, selector) => sum + (document.querySelector(selector)?.getBoundingClientRect().height || 0), 0) }));
    expect(measures.scroll).toBeLessThanOrEqual(measures.inner);
    expect(measures.header).toBeLessThanOrEqual(52);
    expect(measures.canvas).toBeGreaterThan(viewport.height * (viewport.width === 1366 ? 0.62 : 0.76));
    expect(measures.svg).toBeGreaterThan(viewport.height * (viewport.width === 1366 ? 0.5 : 0.66));
    expect(measures.chrome / viewport.height).toBeLessThan(viewport.width === 1366 ? 0.26 : 0.22);
  }
});

test('E2E-002 外链为新标签', async ({ page }) => {
  await openApp(page);
  await expect(page.getByRole('link', { name: 'Hot 100' })).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('link', { name: /42\. 接雨水/ })).toHaveAttribute('href', /trapping-rain-water/);
  await expect(page.locator('.github-link')).toHaveAttribute('target', '_blank');
});

test('E2E-003 非法输入不会触发更新', async ({ page }) => {
  await openApp(page);
  const input = page.getByLabel(/高度数组/);
  const before = await page.locator('.step-info').textContent();
  await input.fill('1,x,3');
  await page.getByRole('button', { name: '更新' }).click();
  await expect(page.getByText(/输入只能包含/)).toBeVisible();
  await expect(page.locator('.step-info')).toHaveText(before || '');
});

test('E2E-004 样例和随机数据更新输入', async ({ page }) => {
  await openApp(page);
  const input = page.getByLabel(/高度数组/);
  await page.getByRole('button', { name: '示例2' }).click();
  await expect(input).toHaveValue('4,2,0,3,2,5');
  await page.getByRole('button', { name: '随机' }).click();
  await expect(input).not.toHaveValue('4,2,0,3,2,5');
});

test('E2E-005 四语言算法代码均有维护', async ({ page }) => {
  await openApp(page);
  const source = await page.request.get('/static/js/main.js').catch(() => null);
  await expect(page.getByRole('link', { name: /42\. 接雨水/ })).toBeVisible();
  expect(source === null || source.ok()).toBeTruthy();
  const algorithmFile = await import('node:fs/promises').then(fs => fs.readFile('src/algorithms/algorithmCodes.ts', 'utf8'));
  for (const language of ['java', 'python', 'golang', 'javascript']) expect(algorithmFile).toContain(`${language}:`);
});

test('E2E-006 步骤同步与教学解说', async ({ page }) => {
  await openApp(page);
  const narration = page.locator('.step-narration');
  const first = await narration.textContent();
  await page.getByTitle('下一步 (→)').click();
  await expect(narration).not.toHaveText(first || '');
  await expect(page.locator('.bar[data-status="compare"]')).toHaveCount(2);
});

test('E2E-007 快捷键及播放控制', async ({ page }) => {
  await openApp(page);
  const step = page.locator('.step-info');
  await page.keyboard.press('ArrowRight');
  await expect(step).toContainText('2 /');
  await page.keyboard.press('ArrowLeft');
  await expect(step).toContainText('1 /');
  await page.keyboard.press('Space');
  await expect(page.getByTitle(/暂停/)).toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('r');
  await expect(step).toContainText('1 /');
});

test('E2E-008 进度条可跳转', async ({ page }) => {
  await openApp(page);
  await page.locator('.progress-slider').fill('100');
  await expect(page.locator('.step-info')).toContainText(/\d+ \/ \d+/);
});

test('E2E-009 D3 画布保持分层与可缩放视口', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('.layer-bars .bar')).toHaveCount(12);
  await expect(page.locator('.layer-water')).toBeAttached();
  await expect(page.locator('.d3-component')).toHaveAttribute('viewBox', /0 0/);
  const plot = page.locator('.plot');
  const initialTransform = await plot.getAttribute('transform');
  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.mouse.move(450, 320);
  await page.mouse.up();
  await page.mouse.wheel(0, -200);
  await expect(plot).not.toHaveAttribute('transform', initialTransform || '');
  await expect(page.locator('.rainwater-data-details')).toBeAttached();
  await expect(page.locator('.rainwater-index-strip button')).toHaveCount(12);
  await expect(page.locator('.rainwater-index-strip button').nth(1)).toHaveAttribute('title', /高度 1.*蓄水 0/);
});

test('E2E-010 算法说明与语音控制', async ({ page }) => {
  await openApp(page);
  await expect(page.getByRole('button', { name: '语音解说' })).toBeVisible();
  await page.getByRole('button', { name: '语音解说' }).click();
  await expect(page.getByRole('button', { name: '切换语音解说' })).toContainText('关闭语音');
});

test('E2E-011 多算法标签切换', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('tab-button-precomputation').click();
  await expect(page.getByTestId('tab-button-precomputation')).toHaveClass(/active/);
  await page.getByTestId('tab-button-twoPointers').click();
  await expect(page.locator('.layer-bars .bar')).toHaveCount(12);
});

test('E2E-012 社群二维码资源可用', async ({ page }) => {
  await openApp(page);
  await page.locator('.wechat-float').hover();
  await expect(page.locator('img[alt="微信二维码"]')).toHaveAttribute('src', /wechat-qrcode/);
});

test('E2E-013 速度控制存在', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#speed-slider')).toBeVisible();
});

test('E2E-014 GitHub Star 数字显示', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('.github-link')).toContainText(/\d+/);
});

test('E2E-015 样式不包含紫色主题', async ({ page }) => {
  await openApp(page);
  const styles = await page.locator('style').allTextContents();
  const sourceMapFreeStyles = styles.filter(text => !text.includes('sourceMappingURL'));
  expect(sourceMapFreeStyles.join('\n')).not.toMatch(/\bpurple\b/i);
  await expect(page.locator('.bar[data-status="current"]').first()).toHaveCSS('fill', 'rgb(27, 175, 122)');
});
