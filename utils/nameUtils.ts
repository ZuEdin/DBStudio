/**
 * Name sanitization and unique naming utilities.
 */

export function sanitizeProjectName(name?: string): string {
  if (!name || typeof name !== 'string') return 'MyProject';
  const trimmed = name.trim();
  if (!trimmed) return 'MyProject';
  const sanitized = trimmed
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'MyProject';
}

export function getUniqueName(base: string, existingNames: string[] | Set<string>): string {
  const set = Array.isArray(existingNames) ? new Set(existingNames) : existingNames;
  if (!set.has(base)) return base;

  let counter = 1;
  let candidate = `${base} ${counter}`;
  while (set.has(candidate)) {
    counter++;
    candidate = `${base} ${counter}`;
  }
  return candidate;
}
