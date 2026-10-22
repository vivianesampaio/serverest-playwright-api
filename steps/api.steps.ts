import { expect, type APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createBdd } from 'playwright-bdd';
import { apiRequest } from './api-evidence';

const { Given, When, Then } = createBdd();

type UsuarioPayload = {
  nome: string;
  email?: string;
  password?: string;
  administrador: string;
};

type ProdutoPayload = {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
};

let authToken: string;
let respostaAPI: APIResponse;
let produtoIdArmazenado: string;
let carrinhoIdArmazenado: string;
let usuarioIdArmazenado: string | undefined;
let estoqueInicial: number;
let payloadUsuario: UsuarioPayload;
let payloadProduto: ProdutoPayload;
let emailUsuario: string;
let emailUsuarioAtualizado: string;
let senhaUsuario: string;
let emailDuplicado: string;
let emailCase: string;
let senhaCase: string;
const quantidadeNoCarrinho = 2;

function mensagemDaResposta(body: Record<string, unknown>): unknown {
  return body.message ?? Object.values(body)[0];
}

function emailUnico(prefixo: string): string {
  return `${prefixo}_${randomUUID()}@qa.com`;
}

function validarId(id: unknown): asserts id is string {
  expect(typeof id).toBe('string');
  expect(id).not.toBe('');
}

// Autenticação, produtos e carrinho
Given('que eu tenho credenciais de um usuário administrador válido', async ({ request }) => {
  emailUsuario = emailUnico('admin');
  senhaUsuario = 'teste123';
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Admin Teste',
      email: emailUsuario,
      password: senhaUsuario,
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
});

When('eu envio uma requisição para a rota de login', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailUsuario, password: senhaUsuario },
  });
});

Then('o código de status da resposta de login deve ser {int}', async ({}, statusCode: number) => {
  expect(respostaAPI.status()).toBe(statusCode);
});

Then('o token de autenticação deve ser retornado', async ({}) => {
  const body = await respostaAPI.json();
  expect(body).toHaveProperty('authorization');
  authToken = body.authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);
});

Given('que eu estou autenticado como administrador', async ({ request }) => {
  const email = emailUnico('admin_prod');
  const senha = 'teste123';
  const userResponse = await apiRequest(request, 'POST', '/usuarios', {
    data: { nome: 'Admin Prod', email, password: senha, administrador: 'true' },
  });
  expect(userResponse.status()).toBe(201);

  const loginResponse = await apiRequest(request, 'POST', '/login', {
    data: { email, password: senha },
  });
  expect(loginResponse.status()).toBe(200);
  authToken = (await loginResponse.json()).authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);
});

Given('que eu tenho os dados de um novo produto', async () => {
  payloadProduto = {
    nome: `Produto QA ${randomUUID()}`,
    preco: 150,
    descricao: 'Produto automatizado via BDD',
    quantidade: 10,
  };
});

When('eu envio uma requisição para cadastrar o produto', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/produtos', {
    headers: { Authorization: authToken },
    data: payloadProduto,
  });
});

Then('o código de status da resposta de produto deve ser {int}', async ({}, statusCode: number) => {
  expect(respostaAPI.status()).toBe(statusCode);
});

Then('a mensagem de produto deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
  if (respostaAPI.status() === 201) {
    validarId(body._id);
    produtoIdArmazenado = body._id;
  }
});

Then('o produto cadastrado deve ser recuperável com os dados enviados', async ({ request }) => {
  validarId(produtoIdArmazenado);
  const response = await apiRequest(request, 'GET', `/produtos/${produtoIdArmazenado}`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject(payloadProduto);
  expect(body._id).toBe(produtoIdArmazenado);
});

Given('que eu estou autenticado como administrador e possuo um produto cadastrado', async ({ request }) => {
  const email = emailUnico('admin_cart');
  const senha = 'teste123';
  const userResponse = await apiRequest(request, 'POST', '/usuarios', {
    data: { nome: 'Admin Cart', email, password: senha, administrador: 'true' },
  });
  expect(userResponse.status()).toBe(201);

  const loginResponse = await apiRequest(request, 'POST', '/login', {
    data: { email, password: senha },
  });
  expect(loginResponse.status()).toBe(200);
  authToken = (await loginResponse.json()).authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);

  estoqueInicial = 20;
  const productResponse = await apiRequest(request, 'POST', '/produtos', {
    headers: { Authorization: authToken },
    data: {
      nome: `Item Carrinho ${randomUUID()}`,
      preco: 50,
      descricao: 'Teste',
      quantidade: estoqueInicial,
    },
  });
  expect(productResponse.status()).toBe(201);
  const productBody = await productResponse.json();
  validarId(productBody._id);
  produtoIdArmazenado = productBody._id;
});

Given('que eu estou autenticado como administrador e possuo um produto cadastrado com estoque inicial', async ({ request }) => {
  const email = emailUnico('admin_estoque');
  const senha = 'teste123';
  const userResponse = await apiRequest(request, 'POST', '/usuarios', {
    data: { nome: 'Admin Estoque', email, password: senha, administrador: 'true' },
  });
  expect(userResponse.status()).toBe(201);

  const loginResponse = await apiRequest(request, 'POST', '/login', {
    data: { email, password: senha },
  });
  expect(loginResponse.status()).toBe(200);
  authToken = (await loginResponse.json()).authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);

  estoqueInicial = 20;
  const productResponse = await apiRequest(request, 'POST', '/produtos', {
    headers: { Authorization: authToken },
    data: {
      nome: `Item Estoque ${randomUUID()}`,
      preco: 100,
      descricao: 'Teste Estoque',
      quantidade: estoqueInicial,
    },
  });
  expect(productResponse.status()).toBe(201);
  const productBody = await productResponse.json();
  validarId(productBody._id);
  produtoIdArmazenado = productBody._id;
});

When('eu adiciono o produto ao carrinho', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/carrinhos', {
    headers: { Authorization: authToken },
    data: {
      produtos: [{ idProduto: produtoIdArmazenado, quantidade: quantidadeNoCarrinho }],
    },
  });
});

Then('o código de status da criação do carrinho deve ser {int}', async ({}, statusCode: number) => {
  expect(respostaAPI.status()).toBe(statusCode);
  if (statusCode === 201) {
    const body = await respostaAPI.json();
    expect(body.message).toBe('Cadastro realizado com sucesso');
    validarId(body._id);
    carrinhoIdArmazenado = body._id;
  }
});

Then('eu consigo listar os carrinhos cadastrados', async ({ request }) => {
  const response = await apiRequest(request, 'GET', '/carrinhos');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('quantidade');
  expect(Array.isArray(body.carrinhos)).toBe(true);
  expect(body.quantidade).toBeGreaterThan(0);
  const carrinho = body.carrinhos.find((item: { _id: string }) => item._id === carrinhoIdArmazenado);
  expect(carrinho).toBeDefined();
  expect(carrinho.produtos).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        idProduto: produtoIdArmazenado,
        quantidade: quantidadeNoCarrinho,
      }),
    ]),
  );
  expect(carrinho.quantidadeTotal).toBe(quantidadeNoCarrinho);
});

Then('eu consigo deletar o carrinho concluindo a compra', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'DELETE', '/carrinhos/concluir-compra', {
    headers: { Authorization: authToken },
  });
  expect(respostaAPI.status()).toBe(200);
  expect((await respostaAPI.json()).message).toBe('Registro excluído com sucesso');
});

Then('o carrinho não deve mais estar listado', async ({ request }) => {
  const response = await apiRequest(request, 'GET', '/carrinhos');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.carrinhos.some((item: { _id: string }) => item._id === carrinhoIdArmazenado)).toBe(false);
});

When('eu envio uma requisição para cancelar a compra do carrinho', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'DELETE', '/carrinhos/cancelar-compra', {
    headers: { Authorization: authToken },
  });
});

Then('o código de status do cancelamento deve ser {int}', async ({}, statusCode: number) => {
  expect(respostaAPI.status()).toBe(statusCode);
});

Then('a mensagem de cancelamento do carrinho deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
});

Then('o estoque do produto deve permanecer inalterado após o cancelamento', async ({ request }) => {
  const response = await apiRequest(request, 'GET', `/produtos/${produtoIdArmazenado}`, {
    headers: { Authorization: authToken },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).quantidade).toBe(estoqueInicial);
});

When('eu tento cadastrar um produto sem autenticação', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/produtos', { data: payloadProduto });
});

Then('a resposta deve indicar que a operação não foi autorizada', async ({}) => {
  expect([401, 403]).toContain(respostaAPI.status());
  const body = await respostaAPI.json();
  expect(typeof body.message).toBe('string');
  expect(body.message).toMatch(/token|autoriz|acesso/i);
});

When('eu tento adicionar um produto inexistente ao carrinho', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/carrinhos', {
    headers: { Authorization: authToken },
    data: { produtos: [{ idProduto: 'idProdutoInexistente', quantidade: 1 }] },
  });
});

When('eu tento adicionar uma quantidade maior que o estoque ao carrinho', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/carrinhos', {
    headers: { Authorization: authToken },
    data: { produtos: [{ idProduto: produtoIdArmazenado, quantidade: estoqueInicial + 1 }] },
  });
});

When('eu tento adicionar uma quantidade zero ao carrinho', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/carrinhos', {
    headers: { Authorization: authToken },
    data: { produtos: [{ idProduto: produtoIdArmazenado, quantidade: 0 }] },
  });
});

Then('a resposta deve indicar que o produto não foi encontrado', async ({}) => {
  expect(respostaAPI.status()).toBe(400);
  expect((await respostaAPI.json()).message).toBe('Produto não encontrado');
});

Then('a quantidade do carrinho deve ser rejeitada pela validação', async ({}) => {
  expect(respostaAPI.status()).toBe(400);
  const body = await respostaAPI.json();
  expect(body['produtos[0].quantidade']).toBe('produtos[0].quantidade deve ser um número positivo');
});

Then('a resposta deve indicar que o estoque é insuficiente', async ({}) => {
  expect(respostaAPI.status()).toBe(400);
  expect((await respostaAPI.json()).message).toBe('Produto não possui quantidade suficiente');
});

Then('o estoque do produto deve continuar inalterado', async ({ request }) => {
  const response = await apiRequest(request, 'GET', `/produtos/${produtoIdArmazenado}`);
  expect(response.status()).toBe(200);
  expect((await response.json()).quantidade).toBe(estoqueInicial);
});

Then('o estoque do produto deve ser atualizado depois da compra', async ({ request }) => {
  const response = await apiRequest(request, 'GET', `/produtos/${produtoIdArmazenado}`, {
    headers: { Authorization: authToken },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).quantidade).toBe(estoqueInicial - quantidadeNoCarrinho);
});

When('eu utilizo o token obtido para cadastrar um novo produto', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/produtos', {
    headers: { Authorization: authToken },
    data: {
      nome: `Produto Integrado ${Date.now()}`,
      preco: 250,
      descricao: 'Validando integridade do token JWT',
      quantidade: 15,
    },
  });
});

// Gestão de usuários
Given('que eu tenho os dados de um novo usuário', async () => {
  usuarioIdArmazenado = undefined;
  payloadUsuario = {
    nome: 'Fulano BDD',
    email: emailUnico('bdd'),
    password: 'teste',
    administrador: 'true',
  };
});

When('eu enviar uma requisição para cadastrar o usuário', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/usuarios', { data: payloadUsuario });
});

Then('o código de status da resposta deve ser {int}', async ({}, statusCode: number) => {
  expect(respostaAPI.status()).toBe(statusCode);
});

Then('a mensagem deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
  if (respostaAPI.status() === 201) {
    validarId(body._id);
    usuarioIdArmazenado = body._id;
  }
});

Then('o usuário cadastrado deve ser recuperável com os dados enviados', async ({ request }) => {
  validarId(usuarioIdArmazenado);
  const response = await apiRequest(request, 'GET', `/usuarios/${usuarioIdArmazenado}`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    _id: usuarioIdArmazenado,
    nome: payloadUsuario.nome,
    email: payloadUsuario.email,
    administrador: payloadUsuario.administrador,
  });
});

Given('que eu tenho os dados de um novo usuário sem e-mail', async () => {
  payloadUsuario = {
    nome: 'Fulano Sem Email',
    password: 'teste',
    administrador: 'true',
  };
});

Given('que eu tenho os dados de um novo usuário sem senha', async () => {
  payloadUsuario = {
    nome: 'Fulano Sem Senha',
    email: emailUnico('sem_senha'),
    administrador: 'true',
  };
});

Given('que eu tenho os dados de um novo usuário com senha em branco', async () => {
  payloadUsuario = {
    nome: 'Fulano Senha Fraca',
    email: emailUnico('senha_fraca'),
    password: '',
    administrador: 'true',
  };
});

Given('que eu tenho os dados de um novo usuário com e-mail em branco', async () => {
  payloadUsuario = {
    nome: 'Fulano Email Vazio',
    email: '',
    password: 'teste',
    administrador: 'true',
  };
});

Given('que existe um usuário previamente cadastrado', async ({ request }) => {
  emailDuplicado = emailUnico('duplicado');
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Original',
      email: emailDuplicado,
      password: 'teste',
      administrador: 'false',
    },
  });
  expect(response.status()).toBe(201);
});

When('eu tentar cadastrar outro usuário com o mesmo e-mail', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Impostor',
      email: emailDuplicado,
      password: 'outrasenha',
      administrador: 'false',
    },
  });
});

When('eu envio uma requisição para listar os usuários', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'GET', '/usuarios');
});

Given('que existe um usuário para localizar na listagem', async ({ request }) => {
  const email = emailUnico('listagem');
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Para Listagem',
      email,
      password: 'teste',
      administrador: 'false',
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  validarId(body._id);
  usuarioIdArmazenado = body._id;
  emailUsuario = email;
});

Then('a listagem deve retornar os usuários cadastrados', async ({}) => {
  const body = await respostaAPI.json();
  expect(body).toHaveProperty('quantidade');
  expect(body).toHaveProperty('usuarios');
  expect(Array.isArray(body.usuarios)).toBe(true);
  expect(body.quantidade).toBeGreaterThan(0);
  expect(body.usuarios).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        _id: usuarioIdArmazenado,
        email: emailUsuario,
      }),
    ]),
  );
});

Given('que eu tenho um usuário cadastrado para atualização', async ({ request }) => {
  const email = emailUnico('update');
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Para Atualizar',
      email,
      password: 'teste',
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  validarId(body._id);
  usuarioIdArmazenado = body._id;
});

When('eu envio uma requisição para atualizar os dados desse usuário', async ({ request }) => {
  const isUpdate = Boolean(usuarioIdArmazenado);
  const userId = usuarioIdArmazenado ?? 'idInexistenteMock999';
  if (isUpdate) {
    emailUsuarioAtualizado = emailUnico('atualizado');
  }
  const data = isUpdate
    ? {
        nome: 'Usuário Atualizado da Silva',
        email: emailUsuarioAtualizado,
        password: 'novasenha',
        administrador: 'false',
      }
    : payloadUsuario;
  respostaAPI = await apiRequest(request, 'PUT', `/usuarios/${userId}`, { data });
});

Then('a mensagem de atualização deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
});

Then('os dados do usuário devem refletir a atualização', async ({ request }) => {
  validarId(usuarioIdArmazenado);
  const response = await apiRequest(request, 'GET', `/usuarios/${usuarioIdArmazenado}`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    _id: usuarioIdArmazenado,
    nome: 'Usuário Atualizado da Silva',
    email: emailUsuarioAtualizado,
    administrador: 'false',
  });
});

Given('que eu tenho um usuário cadastrado para exclusão', async ({ request }) => {
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Para Deletar',
      email: emailUnico('delete'),
      password: 'teste',
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  validarId(body._id);
  usuarioIdArmazenado = body._id;
});

Given('que eu tenho um usuário com um carrinho cadastrado', async ({ request }) => {
  const email = emailUnico('usuario_com_carrinho');
  const password = 'teste123';
  const userResponse = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Com Carrinho',
      email,
      password,
      administrador: 'true',
    },
  });
  expect(userResponse.status()).toBe(201);
  const userBody = await userResponse.json();
  validarId(userBody._id);
  usuarioIdArmazenado = userBody._id;

  const loginResponse = await apiRequest(request, 'POST', '/login', {
    data: { email, password },
  });
  expect(loginResponse.status()).toBe(200);
  const authorization = (await loginResponse.json()).authorization;
  expect(authorization).toMatch(/^Bearer\s+\S+$/);

  const productResponse = await apiRequest(request, 'POST', '/produtos', {
    headers: { Authorization: authorization },
    data: {
      nome: `Produto Vinculado ${randomUUID()}`,
      preco: 25,
      descricao: 'Produto para validar exclusão de usuário com carrinho',
      quantidade: 5,
    },
  });
  expect(productResponse.status()).toBe(201);
  const productBody = await productResponse.json();
  validarId(productBody._id);

  const cartResponse = await apiRequest(request, 'POST', '/carrinhos', {
    headers: { Authorization: authorization },
    data: { produtos: [{ idProduto: productBody._id, quantidade: 1 }] },
  });
  expect(cartResponse.status()).toBe(201);
  const cartBody = await cartResponse.json();
  validarId(cartBody._id);
  carrinhoIdArmazenado = cartBody._id;
});

When('eu envio uma requisição para deletar esse usuário', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'DELETE', `/usuarios/${usuarioIdArmazenado}`);
});

Then('a mensagem de exclusão deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
});

Then('o usuário excluído não deve mais ser encontrado', async ({ request }) => {
  validarId(usuarioIdArmazenado);
  const response = await apiRequest(request, 'GET', `/usuarios/${usuarioIdArmazenado}`);
  expect(response.status()).toBe(400);
  expect((await response.json()).message).toBe('Usuário não encontrado');
});

Then('o usuário deve permanecer cadastrado', async ({ request }) => {
  validarId(usuarioIdArmazenado);
  const response = await apiRequest(request, 'GET', `/usuarios/${usuarioIdArmazenado}`);
  expect(response.status()).toBe(200);
  expect((await response.json())._id).toBe(usuarioIdArmazenado);
});

Then('o carrinho vinculado ao usuário deve permanecer cadastrado', async ({ request }) => {
  const response = await apiRequest(request, 'GET', '/carrinhos');
  expect(response.status()).toBe(200);
  const body = await response.json();
  const cart = body.carrinhos.find((item: { _id: string }) => item._id === carrinhoIdArmazenado);
  expect(cart).toBeDefined();
  expect(cart.idUsuario).toBe(usuarioIdArmazenado);
});

// Login e validação de autenticação
Given('que eu tenho um usuário válido com e-mail e senha', async ({ request }) => {
  emailUsuario = emailUnico('login_valido');
  senhaUsuario = 'senha123';
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Para Login',
      email: emailUsuario,
      password: senhaUsuario,
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
});

When('eu enviar uma requisição de login com as credenciais corretas', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailUsuario, password: senhaUsuario },
  });
});

Then('a resposta deve conter um token de autenticação', async ({}) => {
  const body = await respostaAPI.json();
  expect(body).toHaveProperty('authorization');
  authToken = body.authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);
});

Given('que eu tenho um usuário cadastrado no sistema', async ({ request }) => {
  emailUsuario = emailUnico('usuario_base');
  senhaUsuario = 'senhaCorreta123';
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Base Login',
      email: emailUsuario,
      password: senhaUsuario,
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
});

When('eu enviar uma requisição de login com uma senha incorreta', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailUsuario, password: 'senhaErrada999' },
  });
});

Given('que eu informo um e-mail que não existe na base', async () => {
  emailUsuario = emailUnico('nao_existe');
  senhaUsuario = 'qualquerSenha';
});

When('eu enviar uma requisição de login com esse e-mail', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailUsuario, password: senhaUsuario },
  });
});

Then('a mensagem de erro de login deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(mensagemDaResposta(body)).toBe(mensagemEsperada);
});

When('eu enviar uma requisição de login com um e-mail em formato inválido {string}', async ({ request }, emailInvalido: string) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailInvalido, password: 'senha123' },
  });
});

Then('a mensagem de validação do e-mail deve ser {string}', async ({}, mensagemEsperada: string) => {
  const body = await respostaAPI.json();
  expect(body.email ?? body.message).toBe(mensagemEsperada);
});

Given('que eu tenho um usuário cadastrado com o e-mail {string}', async ({ request }, emailBase: string) => {
  emailCase = `case_${randomUUID()}_${emailBase}`;
  senhaCase = 'senhaSegura123';
  const response = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Usuário Case',
      email: emailCase,
      password: senhaCase,
      administrador: 'true',
    },
  });
  expect(response.status()).toBe(201);
});

When('eu enviar uma requisição de login com o e-mail totalmente em maiúsculo', async ({ request }) => {
  respostaAPI = await apiRequest(request, 'POST', '/login', {
    data: { email: emailCase.toUpperCase(), password: senhaCase },
  });
});

Then('a resposta deve conter um token de autenticação válido', async ({}) => {
  const body = await respostaAPI.json();
  expect(body).toHaveProperty('authorization');
  authToken = body.authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);
});

Given('que eu faço login com um usuário administrador válido', async ({ request }) => {
  const email = emailUnico('admin_token');
  const password = 'teste123';
  const userResponse = await apiRequest(request, 'POST', '/usuarios', {
    data: {
      nome: 'Admin Token',
      email,
      password,
      administrador: 'true',
    },
  });
  expect(userResponse.status()).toBe(201);

  const loginResponse = await apiRequest(request, 'POST', '/login', {
    data: { email, password },
  });
  expect(loginResponse.status()).toBe(200);
  authToken = (await loginResponse.json()).authorization;
  expect(authToken).toMatch(/^Bearer\s+\S+$/);
});
