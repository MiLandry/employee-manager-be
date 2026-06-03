/** POST a GraphQL operation to the Hono app (for tests). */
export const gqlRequest = (
  app: { request: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response> },
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>,
): Response | Promise<Response> =>
  app.request('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  })
