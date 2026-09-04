/**
 * Consistent JSON response + error handling helpers for API routes.
 * Customer-facing error messages are always short and friendly — raw
 * exception messages/stack traces are never sent to the browser.
 */

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  })
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return json({ error: error.message }, { status: error.status })
  }
  // Never leak internal error detail to the client.
  // eslint-disable-next-line no-console
  console.error('[api] unhandled error:', error)
  return json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
