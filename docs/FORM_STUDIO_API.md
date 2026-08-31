# 📝 Formular-Studio & Subforms Enterprise API Documentation

Diese Dokumentation beschreibt die Schnittstellen, Datenstrukturen, IndexedDB-Sicherung und Event-Bus-Trigger des **Formular-Studios & Subforms (Enterprise-Level)**.

---

## 💾 1. IndexedDB Auto-Draft & Offline Persistence API
`features/forms/services/formDraftIndexedDB.ts`

Priorisierte lokale IndexedDB-Speicherung für Formularentwürfe, temporäre Änderungen und Unsaved-Changes Protection.

### Interfaces
```typescript
export interface FormDraft {
  id: string; // `${formId}_${recordId || 'new'}`
  formId: string;
  formName: string;
  recordId?: string | number;
  formData: Record<string, any>;
  lastSavedAt: number;
  isDirty: boolean;
}
```

### Methods
- `saveFormDraftToIndexedDB(formId, formName, formData, recordId?)`: Speichert/Aktualisiert den lokalen Entwurf in IndexedDB.
- `getFormDraftFromIndexedDB(formId, recordId?)`: Lädt den Entwurf eines Formulars.
- `clearFormDraftFromIndexedDB(formId, recordId?)`: Löscht den Entwurf nach erfolgreichem Speichern.
- `getAllFormDraftsFromIndexedDB()`: Ruft alle ausstehenden Formularentwürfe ab.

---

## 🧮 2. Rollup- & Berechnungs-Pipeline API
`features/forms/utils/formCalculationEngine.ts`

Bietet reaktive Berechnungen für mathematische Formeln und Subform-Aggregatfunktionen (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX`).

### Syntax Beispiel
```javascript
// Berechnet die Gesamtsumme aller Positionen im Unterformular
evaluateFormFormula("SUM(positionen.NettoBetrag) * 1.19", record, { subforms });

// Datumsdifferenz in Tagen
evaluateFormFormula("DATEDIF([StartDatum], [EndDatum], 'D')", record);
```

---

## ⚡ 3. Bedingte Logik & No-Code Rule Engine API
`features/forms/components/ConditionRulesBuilderModal.tsx` & `features/forms/utils/formConditionEvaluator.ts`

Steuert dynamische Sichtbarkeit, Schreibschutz, Pflichtfeld-Status und kaskadierende Werte.

### Structure
```typescript
export interface ConditionalRule {
  id: string;
  name: string;
  matchType: 'AND' | 'OR';
  conditions: {
    fieldId: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'not_empty' | 'empty';
    value: string;
  }[];
  actions: {
    targetElementId: string;
    effect: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
  }[];
}
```

---

## 🛡️ 4. Feld-RBAC & Datenmaskierung API
`features/forms/components/FieldRbacModal.tsx`

Feingranulare Zugriffskontrolle auf Feldebene nach Benutzerrolle (`admin`, `manager`, `kalkulator`, `bauleiter`, `mitarbeiter`, `gast`) sowie automatische Maskierung vertraulicher Felder (`••••`).

---

## 📦 5. Multi-Framework Code Exporter API
`features/forms/utils/formCodeExporter.ts`

Generiert sauberen Quellcode für die Weiterverarbeitung in externen Anwendungen:
- **React**: React Hook Form + Zod + Tailwind CSS
- **Vue 3**: Vue 3 + VeeValidate + Zod + Tailwind CSS
