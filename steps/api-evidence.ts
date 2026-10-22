import { test, type APIRequestContext } from '@playwright/test';

type ApiMethod = 'DELETE' | 'GET' | 'POST' | 'PUT';
type ApiRequestOptions = Parameters<APIRequestContext['fetch']>[1];

function redactSensitiveData(value: unknown, key = ''): unknown {
  if (/password|authorization|token|secret|cookie|api[-_]?key/i.test(key)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (value !== null && typeof value === 'object') {
    if (value instanceof Uint8Array) {
      return '[conteúdo binário omitido]';
    }

    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactSensitiveData(childValue, childKey),
      ]),
    );
  }

  return value;
}

function summarizeForStep(value: unknown): string {
  const serialized = JSON.stringify(value) ?? String(value);
  return serialized.length > 400 ? `${serialized.slice(0, 397)}...` : serialized;
}

export async function apiRequest(
  request: APIRequestContext,
  method: ApiMethod,
  url: string,
  options: ApiRequestOptions = {},
) {
  const testInfo = test.info();
  const safeUrl = url.includes('?') ? `${url.split('?')[0]}?[parâmetros omitidos]` : url;

  return test.step(`API ${method} ${safeUrl}`, async () => {
    const startedAt = Date.now();
    const response = await request.fetch(url, { ...options, method });
    const responseBytes = await response.body();
    const responseText = new TextDecoder().decode(responseBytes);
    let responseBody: unknown = null;

    if (responseText) {
      try {
        responseBody = redactSensitiveData(JSON.parse(responseText));
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          throw error;
        }
        responseBody = '[corpo de resposta não JSON omitido]';
      }
    }

    const evidence = {
      method,
      url: safeUrl,
      requestHeaders: Object.fromEntries(
        Object.entries(options.headers ?? {}).filter(([name]) =>
          ['accept', 'content-type'].includes(name.toLowerCase()),
        ),
      ),
      requestBody: redactSensitiveData(options.data ?? null),
      response: {
        status: response.status(),
        statusText: response.statusText(),
        durationMs: Date.now() - startedAt,
        contentType: response.headers()['content-type'] ?? null,
        body: responseBody,
      },
    };

    await test.step(`Request body: ${summarizeForStep(evidence.requestBody)}`, async () => {});
    await test.step(
      `Response body: ${summarizeForStep(evidence.response.body)}`,
      async () => {},
    );

    await testInfo.attach(`Request + response — HTTP ${response.status()}`, {
      body: JSON.stringify(evidence, null, 2),
      contentType: 'application/json',
    });

    return response;
  });
}
