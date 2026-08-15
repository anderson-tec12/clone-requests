export const MAX_BODY_BYTES = 1_000_000;

export function truncateBody(body: string | null): {
  body: string | null;
  truncated: boolean;
} {
  if (body === null) return { body: null, truncated: false };

  const bytes = new TextEncoder().encode(body);
  if (bytes.length <= MAX_BODY_BYTES) {
    return { body, truncated: false };
  }

  return {
    body: new TextDecoder().decode(bytes.slice(0, MAX_BODY_BYTES)),
    truncated: true,
  };
}
