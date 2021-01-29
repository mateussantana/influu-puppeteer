const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.goto('https://www.lojadomecanico.com.br');
    
    
    const navigationPromise = page.waitForNavigation({timeout: 10000});
    await page.click('#js-day-offert .latest-deals-product .product-list li:first-child a', {delay: 100});
    await navigationPromise;

    await page.click('#form-comprar-produto button.plus-product', {delay: 100});
    await page.waitForTimeout(100);
    await page.click('#btn-comprar-product', {delay: 100});

    
    await page.waitForTimeout(2000);
    await page.goto('https://www.lojadomecanico.com.br/carrinho', {waitUntil: 'domcontentloaded'});

    await page.screenshot({path: '/code/site.png'});

    await browser.close();
    console.log('finished');
})();