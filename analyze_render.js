const fs = require('fs');
const path = require('path');
const url = process.argv[2] || 'file:///C:/Users/skada/OneDrive/Documents/Portfolio/redesign/index.html';
const outScreenshot = path.join(process.cwd(), 'render_analysis_screenshot.png');

(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width:1366, height:900});
    // Allow local file access
    await page.goto(url, {waitUntil: 'networkidle2'});

    // capture full page screenshot
    await page.screenshot({path: outScreenshot, fullPage: true});

    // run heuristics in page context
    const findings = await page.evaluate(() => {
      const largeEmptyElements = [];
      const largeMargins = [];

      const all = Array.from(document.querySelectorAll('body *'));
      const isVisible = (el) => {
        const rc = el.getBoundingClientRect();
        return rc.width > 2 && rc.height > 2 && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
      };

      for (const el of all) {
        if (!isVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const text = (el.textContent || '').trim();
        const hasImg = el.querySelector('img, picture, svg') !== null;
        const bgImage = style.backgroundImage && style.backgroundImage !== 'none';

        // Large empty block heuristic
        if (rect.height >= 240 && text.length === 0 && !hasImg && !bgImage) {
          largeEmptyElements.push({
            tag: el.tagName.toLowerCase(),
            class: el.className || null,
            id: el.id || null,
            rect: {x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)},
            marginTop: parseFloat(style.marginTop),
            marginBottom: parseFloat(style.marginBottom)
          });
        }

        // Large margins heuristic
        const mt = parseFloat(style.marginTop) || 0;
        const mb = parseFloat(style.marginBottom) || 0;
        if (mt >= 48 || mb >= 48) {
          largeMargins.push({
            tag: el.tagName.toLowerCase(),
            class: el.className || null,
            id: el.id || null,
            rect: {x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)},
            marginTop: mt,
            marginBottom: mb
          });
        }
      }

      // page-level whitespace heuristics: large gaps between visible siblings in the flow
      const largeGaps = [];
      const visibleBlocks = Array.from(document.querySelectorAll('body *')).filter(isVisible).map(el => {
        const r = el.getBoundingClientRect();
        return {el, top: r.top, bottom: r.bottom, tag: el.tagName.toLowerCase(), className: el.className};
      }).sort((a,b)=>a.top-b.top);

      for (let i=1;i<visibleBlocks.length;i++){
        const prev = visibleBlocks[i-1];
        const cur = visibleBlocks[i];
        const gap = cur.top - prev.bottom;
        if (gap >= 80) {
          largeGaps.push({indexPrev: i-1, indexCur: i, gap: Math.round(gap), prev: {tag: prev.tag, class: prev.className}, cur: {tag: cur.tag, class: cur.className}});
        }
      }

      return {largeEmptyElements, largeMargins, largeGaps};
    });

    await browser.close();

    const out = {url, screenshot: outScreenshot, findings};
    const outJsonPath = path.join(process.cwd(), 'render_analysis_report.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(out, null, 2), 'utf8');
    console.log(`REPORT_PATH=${outJsonPath}`);
    console.log(`SCREENSHOT_PATH=${outScreenshot}`);
    console.log(JSON.stringify(findings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
