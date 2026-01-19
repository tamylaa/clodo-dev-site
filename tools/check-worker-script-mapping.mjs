import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));

  const requests = [];
  page.on('request', r => requests.push({url: r.url(), method: r.method()}));
  const responses = [];
  page.on('response', r => responses.push({url: r.url(), status: r.status()}));

  try {
    const res = await page.goto('http://localhost:8000/workers-boilerplate', { waitUntil: 'networkidle' });
    console.log('Status:', res.status());

    // Wait a short time to allow init-preload mapping to run
    await page.waitForTimeout(1000);

    // Check whether any requests to un-hashed script path were made
    const unHashedRequests = requests.filter(r => r.url.includes('js/pages/workers-boilerplate.js'));
    const hashedRequests = requests.filter(r => r.url.match(/js\/workers-boilerplate\.[0-9a-f]+\.js/));

    console.log('Console messages (recent 20):');
    logs.slice(-20).forEach(l => console.log(l.type + ':', l.text));

    console.log('Un-hashed script requests:', unHashedRequests.length);
    unHashedRequests.forEach(r => console.log('  -', r.url));
    console.log('Hashed script requests:', hashedRequests.length);
    hashedRequests.forEach(r => console.log('  -', r.url));

    const notFound = responses.filter(r => r.status === 404);
    console.log('404 responses:', notFound.length);
    notFound.forEach(r => console.log('  -', r.url));

    const mappingLogs = logs.filter(l => l.text && l.text.includes('[init-preload] mapped script'));
    console.log('mapping log entries:', mappingLogs.length);
    mappingLogs.forEach(l => console.log('  -', l.text));

    if (unHashedRequests.length === 0 && (hashedRequests.length > 0 || mappingLogs.length > 0) && notFound.length === 0) {
      console.log('✅ Mapping worked: hashed script requested or runtime mapping applied, and no 404s.');
      process.exit(0);
    } else {
      console.error('❌ Mapping check failed; see output above');
      process.exit(2);
    }
  } catch (e) {
    console.error('Error running check:', e);
    process.exit(3);
  } finally {
    await browser.close();
  }
})();