export const MESSAGE_PLACEHOLDER = '{{message}}';

export const SIMPLE_REQUEST_TEMPLATE = `{
  "message": "{{message}}"
}`;

function containsMessagePlaceholder(value: unknown): boolean {
  if (typeof value === 'string') return value.includes(MESSAGE_PLACEHOLDER);
  if (Array.isArray(value)) return value.some(containsMessagePlaceholder);
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsMessagePlaceholder);
  }
  return false;
}

export function getRequestTemplateError(template: string): string | null {
  if (!template.trim()) return 'Enter the JSON body your endpoint expects';
  if (template.length > 10_000) return 'Keep the request template under 10,000 characters';

  try {
    const parsed = JSON.parse(template);
    if (!containsMessagePlaceholder(parsed)) {
      return `Add ${MESSAGE_PLACEHOLDER} to the JSON value that should receive each question`;
    }
    return null;
  } catch {
    return 'Enter valid JSON';
  }
}
