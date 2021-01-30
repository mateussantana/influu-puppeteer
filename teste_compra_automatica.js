const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const CLIENTES_JSON_PATH = path.join(__dirname, 'assets', 'clientes.json');
const SCREENSHOT_PATH = path.join(__dirname, 'boleto.png');

var clientes = require(CLIENTES_JSON_PATH);
var enderecos = require('./assets/enderecos.json');

function gerarTelefone() {
	let numero = "";
	// DDD
	for (let i = 0; i < 2; i++)
		numero += Math.floor(Math.random() * 10 + 1).toString().charAt(0);
	// Prefixo celular
	numero += " 9";
	numero += Math.random() > 0.5 ? "9" : "8";
	// Restante do número
	for (let i = 0; i < 7; i++)
		numero += Math.floor(Math.random() * 10).toString().charAt(0);
	return numero;
}

function gerarEmail(nome, cpf) {
	let fruits = ['@gmail.com', '@outlook.com', '@bol.com.br'];
	let address = nome.substring(0, 4).replace(' ', '').toLowerCase();
	address += cpf.substring(0, 6);
	address += nome.substring(nome.length - 4).replace(' ', '').toLowerCase();
	return address + fruits[Math.floor(Math.random() * fruits.length)];
}

function writeJsonToFile(fileName, _array) {
	fs.writeFile(
		fileName,
		JSON.stringify(_array, null, 2),
		error => {
			if (error)
				console.log("Erro ao gerar arquivo json:\n", error);
		});
}

function getClienteSemBoleto(clientes) {
	for(let key in clientes) {
		if (clientes[key].boleto == undefined)
			return clientes[key];
	}
}

function getEnderecoAleatorio() {
	return enderecos[Math.floor(Math.random() * enderecos.length)];
}

(async () => {
	const cliente = getClienteSemBoleto(clientes);
	cliente.telefone = gerarTelefone();
	cliente.email = gerarEmail(cliente.nome, cliente.cpf);
	cliente.endereco = getEnderecoAleatorio();
	cliente.endereco.numero = Math.random().toString().substring(5, 3);
	cliente.boleto = "";

	// Acessa o site
	console.log(`Fazendo o pedido para: ${cliente.nome}`);
	console.log(`CPF: ${cliente.cpf} | E-mail: ${cliente.email} | Senha: ${cliente.senha}\n`);
    const browser = await puppeteer.launch({defaultViewport: null, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']});
    const page = await browser.newPage();
	await page.goto('https://www.lojadomecanico.com.br');
	
	// Clica no primeiro produto
	console.log('> Selecionando o primeiro produto...');
    let navigationPromise = page.waitForNavigation();
    await page.click('#js-day-offert .latest-deals-product .product-list li:first-child a', {delay: 100});
    await navigationPromise;

	// Adiciona mais uma unidade e clica em "comprar"
	console.log('> Adicionando mais uma unidade e clicando em comprar...');
    await page.click('#form-comprar-produto button.plus-product', {delay: 100});
    await page.waitForTimeout(100);
	await page.click('#btn-comprar-product', {delay: 100});
	await page.waitForFunction("document.getElementById('cart-popup-count').innerText > 0")
	await page.waitForTimeout(500);

	// Vai para o carrinho de compras
	console.log('> Direcionando ao carrinho de compras...');
	await page.goto('https://www.lojadomecanico.com.br/carrinho', {waitUntil: 'domcontentloaded'});
	await page.waitForSelector('a.btn-finalizar-pedido');

	// Clica em "finalizar pedido"
	navigationPromise = page.waitForNavigation();
	await page.click('a.btn-finalizar-pedido', {delay: 100});
	await navigationPromise;
	
	// Clica no botão "criar conta"
	console.log('> Clicando em "criar conta"...');
	navigationPromise = page.waitForNavigation();
	await page.click('#form-flux-login a:last-child');
	await navigationPromise;

	// Clica em "criar conta pessoal"
	navigationPromise = page.waitForNavigation();
	await page.click('a.standard-select:first-child');
	await navigationPromise;

	// Preenche o formulário
	console.log('> Preenchendo formulário de cadastro...');
	await page.type('input#nome', cliente.nome, { delay: 100 });
	await page.type('input#telefone', cliente.telefone, { delay: 100 });
	await page.type('input#email', cliente.email, { delay: 100 });
	await page.type('input#password', cliente.senha, { delay: 100 });
	
	// Clica no botão "criar cadastro"
	navigationPromise = page.waitForNavigation();
	await page.click('.btn-create[type=submit]');
	await navigationPromise;

	// // Preenche os dados do endereço
	console.log('> Preenchendo endereço...');
	await page.type('input#cep', cliente.endereco.cep, { delay: 100 });
	await page.type('input#numero', cliente.endereco.numero, { delay: 100 });
	await page.type('input#complemento', cliente.endereco.complemento, { delay: 100 });

	// // Clica no botão "continuar" (cadastro de endereço)
	navigationPromise = page.waitForNavigation();
	await page.click('.btn-submit-form[type=submit]');
	await navigationPromise;

	// Clica no botão "continuar" (confirmação de envio)
	console.log('> Confirmando envio...');
	navigationPromise = page.waitForNavigation();
	await page.click('div.same-day .btn-green[type=submit]');
	await navigationPromise;

	// Clica no botão "boleto" (confirmação de pagamento)
	console.log('> Clicando em gerar boleto...');
	navigationPromise = page.waitForNavigation();
	await page.click('div.padBoleto input[type=radio]');
	await navigationPromise;

	// // Preenche CPF para NF e clica em "continuar"
	console.log('> Preenchendo CPF para a nota fiscal...');
	await page.type('input#cpfnota', cliente.cpf, { delay: 100 });
	navigationPromise = page.waitForNavigation();
	await page.click('.btn-submit-form[type=submit]');
	await navigationPromise;

	// // Clica no botão "finalizar pedido"
	console.log('> Clicando em "finalizar pedido"...');
	navigationPromise = page.waitForNavigation();
	await page.click('#form-save-order .botaoFinalizarBoleto');
	await navigationPromise;

	// // Fechar popup e-bit
	await page.waitForSelector('span#btFechar');
	await page.click('span#btFechar');

	// Pega o número do boleto
	console.log('> Extraindo número do boleto...');
	let num_boleto = await page.evaluate(() => {
		return document.getElementById('lindig')
				.innerText
				.trim()
				.replaceAll('.', '')
				.replaceAll(' ', '');
	});
	cliente.boleto = num_boleto;
	console.log('> O número do boleto gerado é: ' + num_boleto);

	// Atualiza o json de clientes que já geraram boletos
	writeJsonToFile(CLIENTES_JSON_PATH, clientes);

	// Screenshot da tela
	console.log(`> Screenshot gerada em ${SCREENSHOT_PATH}`);
	await page.screenshot({path: SCREENSHOT_PATH});

    await browser.close();
    console.log('Finalizado!');
})();
