const { spawnChrome } = require('chrome-debugging-client');
const { writeFileSync } = require('fs');

const argv = require('yargs')
  .command(
    'capture [url] [-o]',
    'Capture the page at the current URL and output to a file.',
    yargs => {
      yargs.positional('url', {
        describe: 'URL to capture the screenshot of',
      });
    }
  )
  .option('output-file', {
    alias: 'o',
    type: 'string',
    default: `screenshot-${Date.now()}.png`,
    description: 'File to output screenshot to.',
  }).argv;

async function captureScreenshot(url, path) {
  const chrome = spawnChrome({ headless: true });

  try {
    const browser = chrome.connection;
    const { targetId } = await browser.send('Target.createTarget', {
      url: 'about:blank',
    });

    const page = await browser.attachToTarget(targetId);
    await page.send('Page.enable');

    await Promise.all([
      page.until('Page.loadEventFired'),
      page.send('Page.navigate', { url }),
    ]);

    const { data } = await page.send('Page.captureScreenshot');

    writeFileSync(path, data, 'base64');

    await chrome.close();
  } finally {
    await chrome.dispose();
  }

  console.log(`${url} written to ${path}`);
}

captureScreenshot(argv.url, argv.outputFile);
