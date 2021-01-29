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

function gerarEmail() {
	let fruits = ['@gmail.com', '@outlook.com', '@bol.com.br']
	//funcao para gerar email aleatorio com partes do nome + cpf
	//examplo linha 1: marl_102813arauj@outloo.com

	return fruits[Math.floor(Math.random() * fruits.length)];
}