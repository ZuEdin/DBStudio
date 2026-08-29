/**
 * Form Offline Drafts & Optimistic Locking Manager
 * Persists uncommitted field edits to local storage for offline resiliency.
 */

export interface FormDraft {
  formId: string;
  recordId: string;
  savedAt: string;
  data: Record<string, any>;
  isDirty: boolean;
}

const DRAFT_PREFIX = 'dbstudio_form_draft_';

export function saveFormDraft(formId: string, recordId: string, data: Record<string, any>): void {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    const draft: FormDraft = {
      formId,
      recordId: recordId || 'new',
      savedAt: new Date().toISOString(),
      data,
      isDirty: true,
    };
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    console.warn('Failed to save offline form draft to localStorage', e);
  }
}

export function loadFormDraft(formId: string, recordId: string): FormDraft | null {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearFormDraft(formId: string, recordId: string): void {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    localStorage.removeItem(key);
  } catch {}
}

export function hasOfflineDraft(formId: string, recordId: string): boolean {
  const draft = loadFormDraft(formId, recordId);
  return Boolean(draft && draft.isDirty);
}
