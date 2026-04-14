import http from 'k6/http';
import { sleep } from 'k6';

/**
 * request - Reusable, generic API request function for k6.
 * Decoupled from specific API logic to enable scalability and reuse.
 * 
 * @param method   - HTTP verb (GET, POST, PUT, DELETE)
 * @param endpoint - Endpoint relative to BASE_URL
 * @param payload  - Optional JSON payload
 * @param params   - Optional k6 request params (headers, tags)
 */
export function request(
  method: string, 
  endpoint: string, 
  payload: any = null, 
  params: any = {}
) {
  const baseUrl = __ENV.BASE_URL || 'https://petstore.swagger.io';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const maxRetries = params.maxRetries || 1;
  const retryDelay = params.retryDelay || 2; // seconds

  const requestParams = {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      ...params.headers,
    },
    tags: {
      ...params.tags,
      engine: 'generic-v1',
    },
  };

  let response: any;
  
  for (let i = 0; i < maxRetries; i++) {
    response = http.request(
      method, 
      url, 
      payload ? JSON.stringify(payload) : null, 
      requestParams
    );

    // If success (2xx), or not a retryable error (like 400), return immediately
    // Note: In Petstore, 404 is the typical "eventual consistency" error we want to retry
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    if (i < maxRetries - 1 && (response.status === 404 || response.status >= 500)) {
      console.warn(`[SQA-Warning] ${method} ${endpoint} returned ${response.status}. Retrying in ${retryDelay}s... (Attempt ${i + 1}/${maxRetries})`);
      sleep(retryDelay);
      continue;
    }

    // If we're here, it's either the last retry or a non-retryable status (like 401/403)
    break;
  }

  return response;
}
