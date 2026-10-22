### **BUG-001: Comportamento inconsistente em requisições PUT para IDs inexistentes**
* **Endpoint:** `PUT /usuarios/{_id}`
* **Comportamento Documentado:** Caso o ID não seja encontrado, deve realizar novo cadastro retornando **HTTP 201 Created**.
* **Comportamento Atual (Inconsistente):** O endpoint apresenta comportamento não determinístico. Em execuções consecutivas ou dependendo do estado da massa de dados, o servidor responde com **HTTP 200** (tratando como alteração de um registro fantasma), ou com **HTTP 201** (criando o registro).
* **Impacto:** Quebra de contrato de API, prejudicando clientes que dependem do código de status HTTP correto para definir fluxos de pós-processamento (ex: auditoria, logs ou direcionamento de tela).

## Evidências no relatório Playwright

As chamadas HTTP feitas pelos passos BDD são anexadas ao relatório HTML como arquivos JSON por requisição. Cada evidência inclui método, rota, cabeçalhos não sensíveis, corpo enviado, status e corpo recebido, tipo de conteúdo e duração.

Campos com nomes como `password`, `authorization`, `token`, `secret`, `cookie` e `apiKey` são mascarados. Cabeçalhos de autorização são omitidos e parâmetros de query string não são incluídos.

Para gerar e consultar o relatório:

```bash
npm test
npm run test:report
```

No relatório, abra um cenário e consulte os anexos `Evidência API` para inspecionar as chamadas executadas, inclusive aquelas feitas durante a preparação dos dados do cenário.

## Executar cenários por tags

As tags Gherkin permitem selecionar grupos de cenários:

```bash
npm run test:smoke
npm run test:regression
npm run test:journeys
```

- `@smoke`: fluxos positivos essenciais, para uma verificação rápida da API.
- `@regressao`: todos os cenários funcionais das features, incluindo cenários de smoke.
- `@jornada-usuario` e `@jornada-compra`: fluxos de autenticação e compra de ponta a ponta.
- `@integracao`, `@validacao`, `@seguranca`, `@regra-negocio`, `@crud` e `@contrato`: classificações adicionais por objetivo do teste.

Os comandos geram os testes BDD antes de executar o Playwright. Para filtrar outra tag, use `npm test -- --grep @nome-da-tag`.