# Automação de APIs - ServeRest

Projeto de automação de testes da API pública [ServeRest](https://serverest.dev), desenvolvido como desafio técnico para uma posição de QA Pleno. O foco é validar a integração entre usuários, autenticação, produtos e carrinhos.

## Requisitos

- Node.js 22 ou superior (a mesma versão usada no GitHub Actions).
- npm.
- Acesso à internet para chamar `https://serverest.dev`.

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/vivianesampaio/serverest-playwright-api.git
cd serverest-playwright-api
npm ci
```

## Executar os testes

```bash
# Suíte completa
npm test

# Grupos selecionados por tags
npm run test:smoke
npm run test:journeys
npm run test:regression
```

O comando `npm test` gera os testes a partir das features Gherkin e executa o Playwright. `@regressao` está aplicada às features de usuários, login e compras; por isso, a regressão inclui todos os cenários dessas features.

Para executar cenários por outra tag:

```bash
npm run bdd:gen
npx playwright test --grep @validacao
```

## Stack e decisões técnicas

- **TypeScript** para os steps e configuração.
- **Playwright Test** para executar os testes e fazer asserções de API.
- **playwright-bdd** para conectar cenários Gherkin (`.feature`) a steps TypeScript.
- **GitHub Actions** para executar a suíte em pushes, pull requests e manualmente.
- A API testada é externa e pública; não há servidor da aplicação ou banco de dados local neste projeto.

Os dados dinâmicos, como e-mails, usam UUID para reduzir colisões entre cenários executados em paralelo. As chamadas feitas pelos steps usam um helper comum que anexa evidências das requisições e respostas ao relatório.

## Estrutura do projeto

```text
.
├── .github/workflows/api-tests.yml  # CI no GitHub Actions
├── features/
│   ├── compras.feature              # Produtos e carrinhos
│   ├── login.feature                # Autenticação
│   └── usuarios.feature             # CRUD e regras de usuários
├── steps/
│   ├── api.steps.ts                 # Definições dos steps BDD
│   └── api-evidence.ts              # Requisições e anexos de evidência
├── .gitignore
├── package.json
├── package-lock.json
└── playwright.config.ts
```

## Cenários automatizados

### Jornada principal e integração

- Cadastro de usuário e recuperação dos dados criados.
- Login válido, retorno do token e uso do token em endpoint protegido.
- Cadastro de produto e consulta posterior dos dados.
- Criação do carrinho, leitura dos itens e quantidades, conclusão da compra, remoção do carrinho e atualização do estoque.
- Cancelamento da compra, remoção do carrinho e confirmação de que o estoque foi reposto.

### Validações, autenticação e regras de negócio

- Cadastro de usuário sem e-mail, com e-mail em branco, sem senha ou com senha em branco.
- Tentativa de cadastro com e-mail duplicado.
- Login com senha incorreta, e-mail inexistente ou formato inválido.
- Cadastro de produto sem autenticação.
- Inclusão no carrinho de produto inexistente, quantidade zero ou quantidade acima do estoque.
- Exclusão de usuário com carrinho vinculado, verificando que a API bloqueia a operação e preserva usuário e carrinho.

### Operações de usuários

- Listagem que confirma a presença do usuário criado no cenário.
- Atualização com consulta posterior dos dados atualizados.
- Exclusão com consulta posterior que confirma que o usuário não existe mais.
- Comportamento de `PUT /usuarios/{_id}` para um ID inexistente, documentado como cenário de contrato.

## Priorização, riscos e escopo

### Cenários mais críticos

1. **Jornada de compra completa:** conecta autenticação, produto e carrinho e verifica o efeito de concluir a compra no estoque. Uma falha nesse encadeamento pode impedir a transação ou deixar os dados inconsistentes.
2. **Cancelamento da compra:** verifica se o carrinho é removido e se o estoque é restaurado, protegendo a consistência da regra de negócio.
3. **Autorização:** confirma que não é possível cadastrar produto sem token e que o token válido permite usar uma rota protegida.
4. **Integridade de usuário e carrinho:** verifica a regra que impede excluir um usuário com carrinho associado e assegura que os registros permanecem disponíveis após a rejeição.
5. **Validação de estoque e entrada:** garante que produto inexistente, quantidade zero e quantidade acima do estoque são rejeitados sem alterar o estoque.

### Riscos identificados

- **Dependência externa:** indisponibilidade, lentidão ou mudança de comportamento de `serverest.dev` pode falhar os testes sem que haja regressão no código de automação.
- **Ambiente compartilhado e persistência:** os testes criam registros na API pública. Um hook de encerramento cancela carrinhos e remove produtos e usuários criados; falhas nessa limpeza também falham o cenário, mas a API compartilhada ainda pode sofrer interferência externa.
- **Execução paralela:** UUID reduz colisões de e-mail e nome, mas não isola o serviço público nem elimina interferências causadas por dados ou indisponibilidade compartilhados.
- **Contrato sujeito a mudanças:** mensagens e códigos de status são verificações intencionais do contrato atual e podem precisar ser atualizados se a API mudar.
- **Evidência de comportamento de `PUT`:** o cenário de ID inexistente registra o comportamento esperado pelo contrato (criação com status 201). Qualquer alegação de inconsistência deve ser sustentada por execuções reproduzíveis e evidências anexadas, pois a suíte não deve tratar uma observação isolada como comportamento confirmado.
- **Segurança limitada ao escopo:** os cenários de autorização verificam casos básicos de acesso; não constituem auditoria de segurança nem teste de penetração.

### O que ficou fora do escopo

- Testes de interface, banco de dados ou código interno: o desafio solicita automação da API e não há acesso a esses componentes.
- Cobertura exaustiva de todos os campos, filtros, paginação e combinações de validação: priorizei o fluxo de negócio e as regras diretamente relacionadas aos endpoints pedidos.
- Testes destrutivos ou de segurança ofensiva em produção: não são necessários para demonstrar o contrato e o fluxo obrigatório.
- Testes de carga, estresse e volume: exigem metas de desempenho, autorização e ambiente controlado; a API pública compartilhada não é apropriada para esse tipo de teste.

## Evidências de execução

As chamadas feitas pelos steps são anexadas ao relatório Playwright como arquivos JSON. As evidências incluem método, rota, corpo da requisição, status e corpo da resposta, tipo de conteúdo e duração. Campos sensíveis como senha, token e autorização são mascarados; cabeçalhos de autorização não são incluídos.

Para gerar e abrir o relatório localmente:

```bash
npm test
npm run test:report
```

No GitHub, acesse **Actions**, abra a execução do workflow **API tests** e baixe o artifact `playwright-report`. O workflow tenta publicar o artifact mesmo quando os testes falham; ele fica retido por sete dias.

## Investigação: pagamento confirmado, pedido ausente em “Meus Pedidos”

### Primeira ação

Eu começaria delimitando um caso real e correlacionável com Produto e Backend: identificar uma transação afetada e reunir, de forma segura, o identificador do pagamento/pedido, usuário, ambiente e horários aproximados. Em seguida, compararia a linha do tempo dessa transação com uma transação bem-sucedida, consultando os logs disponíveis e o estado exposto pelas APIs. Não começaria presumindo que a falha está na tela nem solicitando uma mudança de código antes de localizar onde o fluxo divergiu.

### Hipótese inicial

Minha hipótese inicial seria uma falha ou atraso na integração assíncrona entre a confirmação do pagamento e a criação/atualização do pedido. Por exemplo: o pagamento é aprovado, mas o evento que deveria criar o pedido não é processado, chega com atraso ou falha ao atualizar o estado consumido por “Meus Pedidos”.

### Como reduziria a incerteza

1. Confirmaria se o pagamento foi aprovado e obteria o identificador de correlação da transação.
2. Procuraria o mesmo identificador nos logs de pagamento, processamento de pedido e consulta de “Meus Pedidos”, com Produto e Backend.
3. Determinaria se o pedido **não foi criado**, se foi criado com **estado incorreto/atrasado**, ou se existe mas a consulta/listagem não o retorna.
4. Compararia o resultado com uma transação bem-sucedida e verificaria horários, erros, retries e possíveis problemas de idempotência no processamento.
5. Com essa evidência, isolaria o ponto provável da falha e proporia um teste direcionado para reproduzir a transição afetada.

Essa abordagem reduz a incerteza antes de decidir se a investigação deve focar no processamento do pagamento, na criação do pedido ou na leitura exibida ao cliente.

## Tags e comandos

- `@smoke`: fluxos positivos essenciais para uma verificação rápida.
- `@regressao`: todos os cenários das features de compras, login e usuários.
- `@jornada-usuario` e `@jornada-compra`: fluxos de usuário/autenticação e compra de ponta a ponta.
- `@integracao`, `@validacao`, `@seguranca`, `@regra-negocio`, `@crud` e `@contrato`: classificações adicionais por objetivo.

```bash
npm run test:smoke
npm run test:journeys
npm run test:regression
```
