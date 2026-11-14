const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', headless:true});
  try {
    const directory = path.join(__dirname, 'screenshots');
    fs.mkdirSync(directory, {recursive:true});
    for (const [name, width, height] of [['desktop',1280,900], ['phone',390,844]]) {
      const context = await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'});
      const page = await context.newPage();
      let release;
      const gate = new Promise(resolve => release = resolve);
      await page.route('**/main.dart.js', async route => { await gate; await route.continue(); });
      await page.goto('http://127.0.0.1:5454', {waitUntil:'domcontentloaded'});
      await page.locator('#launch-screen img').waitFor({state:'visible'});
      await page.locator('#launch-screen img').evaluate(image => image.decode());
      const box = await page.locator('#launch-screen img').boundingBox();
      if (Math.abs(box.x + box.width / 2 - width / 2) > 1) throw new Error('Logo is not centered');
      await page.screenshot({path:path.join(directory,`${name}-launch.png`)});
      release();
      await page.locator('#launch-screen').waitFor({state:'detached',timeout:60000});
      await context.close();
      console.log(`${name}: logo visible during startup, removed on first Flutter frame`);
    }
    const page = await browser.newPage();
    await page.route('**/flutter_bootstrap.js', route => route.abort());
    await page.goto('http://127.0.0.1:5454', {waitUntil:'domcontentloaded'});
    await page.getByRole('button', {name:'Retry',exact:true}).waitFor();
    console.log('Startup failure: Retry action visible');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exit(1);});
