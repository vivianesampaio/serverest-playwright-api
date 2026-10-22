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