import { Form, Table, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

interface ExtractedField {
  fieldId: string;
  label: string;
}

interface ExtractedSubformField {
  name: string;
  label: string;
}

interface ExtractedSubform {
  id: string;
  title: string;
  tableName: string;
  childLinkFieldId: string;
  masterLinkFieldId: string;
  fields: ExtractedSubformField[];
}

interface LookupMatch {
  tableName: string;
  pkField: string;
  displayField: string;
}

const extractFieldsFromLayout = (element: any): ExtractedField[] => {
  if (!element) return [];
  const results: ExtractedField[] = [];

  if (element.type === 'field' && element.fieldId) {
    results.push({
      fieldId: element.fieldId,
      label: element.label || element.fieldId
    });
  }

  if (element.children && Array.isArray(element.children)) {
    for (const child of element.children) {
      results.push(...extractFieldsFromLayout(child));
    }
  }

  return results;
};

const getFormFields = (form: Form, targetTable?: Table): ExtractedField[] => {
  const fields: ExtractedField[] = [];
  const seen = new Set<string>();

  const addField = (fieldId: string, label?: string) => {
    if (fieldId && !seen.has(fieldId)) {
      seen.add(fieldId);
      fields.push({ fieldId, label: label || fieldId });
    }
  };

  if (form.fields && Array.isArray(form.fields) && form.fields.length > 0) {
    form.fields.forEach(f => addField(f.fieldId, f.label));
  }

  if (fields.length === 0 && form.layout) {
    const layoutFields = extractFieldsFromLayout(form.layout);
    layoutFields.forEach(f => addField(f.fieldId, f.label));
  }

  if (fields.length === 0 && targetTable && targetTable.fields && targetTable.fields.length > 0) {
    targetTable.fields.forEach(f => addField(f.name, f.name));
  }

  return fields;
};

const extractSubformsFromForm = (
  form: Form,
  forms: Form[],
  tables: Table[]
): ExtractedSubform[] => {
  const results: ExtractedSubform[] = [];
  const visitedKeys = new Set<string>();

  const masterTable = tables.find(t =>
    t.id === form.sourceId ||
    t.name === form.sourceId ||
    t.name.toLowerCase() === form.sourceId?.toLowerCase()
  );

  const addSubform = (
    subformDefId?: string,
    subformObj?: any,
    labelOverride?: string
  ) => {
    if (!subformDefId) return;

    let subFormDef = forms.find(f => f.id === subformDefId || f.name === subformDefId);
    let subTable = tables.find(t =>
      (subFormDef && (t.id === subFormDef.sourceId || t.name === subFormDef.sourceId)) ||
      t.id === subformDefId ||
      t.name === subformDefId
    );

    if (!subFormDef && subTable) {
      subFormDef = forms.find(f => f.sourceId === subTable!.id || f.sourceId === subTable!.name);
    }

    if (!subTable && !subFormDef) return;

    const subformKey = subFormDef?.id || subTable?.id || subformDefId;
    if (visitedKeys.has(subformKey)) return;
    visitedKeys.add(subformKey);

    const title = labelOverride || subFormDef?.name || subTable?.name || 'Unterformular';
    const tableName = subTable ? subTable.name : (subFormDef ? subFormDef.name : 'SubformItems');
    const fields: ExtractedSubformField[] = [];

    let childLinkFieldId = subformObj?.childLinkFieldId;
    if (subTable && childLinkFieldId) {
      const matchF = subTable.fields.find(f => f.id === childLinkFieldId || f.name === childLinkFieldId);
      if (matchF) childLinkFieldId = matchF.name;
    }
    if (!childLinkFieldId) {
      const masterNameLower = masterTable ? masterTable.name.toLowerCase() : 'master';
      const fkField = subTable?.fields.find(f =>
        f.name.toLowerCase() === `${masterNameLower}_id` ||
        (f as any).foreignKey?.targetTableId === masterTable?.id ||
        (f as any).foreignKey?.targetTableId === masterTable?.name ||
        f.name.toLowerCase().endsWith('_id')
      );
      childLinkFieldId = fkField ? fkField.name : `${masterNameLower}_id`;
    }

    let masterLinkFieldId = subformObj?.masterLinkFieldId;
    if (masterTable && masterLinkFieldId) {
      const matchF = masterTable.fields.find(f => f.id === masterLinkFieldId || f.name === masterLinkFieldId);
      if (matchF) masterLinkFieldId = matchF.name;
    }
    if (!masterLinkFieldId) {
      masterLinkFieldId = 'id';
    }

    if (subTable && subTable.fields && subTable.fields.length > 0) {
      subTable.fields.forEach(f => {
        const fName = f.name;
        if (!f.isPrimaryKey && fName !== childLinkFieldId) {
          fields.push({
            name: fName,
            label: fName
          });
        }
      });
    } else if (subFormDef) {
      const formFields = getFormFields(subFormDef, subTable);
      formFields.forEach(f => {
        if (f.fieldId !== childLinkFieldId) {
          fields.push({
            name: f.fieldId,
            label: f.label || f.fieldId
          });
        }
      });
    }

    if (fields.length === 0) {
      fields.push({ name: 'position', label: 'Position' });
      fields.push({ name: 'bezeichnung', label: 'Bezeichnung' });
      fields.push({ name: 'menge', label: 'Menge' });
      fields.push({ name: 'einzelpreis', label: 'Einzelpreis' });
      fields.push({ name: 'gesamtpreis', label: 'Gesamtpreis' });
    }

    results.push({
      id: subformKey,
      title,
      tableName,
      childLinkFieldId,
      masterLinkFieldId,
      fields
    });
  };

  const walkLayout = (element: any) => {
    if (!element) return;
    if (element.type === 'subform' && element.subform) {
      addSubform(element.subform.formId, element.subform, element.label);
    }
    if (element.children && Array.isArray(element.children)) {
      element.children.forEach(walkLayout);
    }
  };
  if (form.layout) {
    walkLayout(form.layout);
  }

  if (form.subform) {
    addSubform(form.subform.formId, form.subform);
  }

  if (results.length === 0 && masterTable) {
    const masterNameLower = masterTable.name.toLowerCase();

    tables.forEach(t => {
      if (t.id === masterTable.id) return;
      const tNameLower = t.name.toLowerCase();

      const matchesName =
        tNameLower.includes(masterNameLower) ||
        tNameLower.includes('position') ||
        tNameLower.includes('item') ||
        tNameLower.includes('detail');

      const hasFk = t.fields?.some(f =>
        (f as any).foreignKey?.targetTableId === masterTable.id ||
        (f as any).foreignKey?.targetTableId === masterTable.name ||
        f.name.toLowerCase() === `${masterNameLower}_id` ||
        f.name.toLowerCase() === 'rechnung_id' ||
        f.name.toLowerCase() === 'angebot_id' ||
        f.name.toLowerCase() === 'auftrag_id' ||
        f.name.toLowerCase() === 'gutschrift_id' ||
        f.name.toLowerCase() === 'mahnung_id'
      );

      if (matchesName || hasFk) {
        addSubform(t.id);
      }
    });

    forms.forEach(f => {
      if (f.id === form.id) return;
      const fNameLower = f.name.toLowerCase();
      if (
        fNameLower.includes(form.name.toLowerCase()) ||
        fNameLower.includes('position') ||
        fNameLower.includes('subform')
      ) {
        addSubform(f.id);
      }
    });
  }

  return results;
};

const findLookupForField = (fieldId: string, label: string, tables: Table[], currentTableName?: string): LookupMatch | null => {
  const cleanF = (fieldId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanL = (label || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const t of tables) {
    if (currentTableName && t.name.toLowerCase() === currentTableName.toLowerCase()) {
      continue;
    }
    const tNameLower = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let tSingular = tNameLower;
    if (tSingular.endsWith('en')) tSingular = tSingular.slice(0, -2);
    else if (tSingular.endsWith('e')) tSingular = tSingular.slice(0, -1);
    else if (tSingular.endsWith('s')) tSingular = tSingular.slice(0, -1);

    const matches =
      cleanF === tNameLower ||
      cleanL === tNameLower ||
      cleanF.includes(`${tNameLower}_id`) ||
      cleanF.includes(`${tNameLower}id`) ||
      cleanF.includes(`${tSingular}_id`) ||
      cleanF.includes(`${tSingular}id`) ||
      (tSingular.length >= 3 && (cleanF === tSingular || cleanL === tSingular));

    if (matches) {
      const pkField = t.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const displayField = t.fields.find(f => !f.isPrimaryKey && (
        f.name.toLowerCase().includes('name') ||
        f.name.toLowerCase().includes('bezeichnung') ||
        f.name.toLowerCase().includes('titel') ||
        f.name.toLowerCase().includes('firma') ||
        f.name.toLowerCase().includes('nummer') ||
        f.name.toLowerCase().includes('nr') ||
        f.name.toLowerCase().includes('beschreibung')
      ))?.name || t.fields.find(f => !f.isPrimaryKey)?.name || pkField;

      return { tableName: t.name, pkField, displayField };
    }
  }

  if (cleanF.includes('kunde') || cleanL.includes('kunde')) {
    const kTable = tables.find(t => t.name.toLowerCase().includes('kunde'));
    if (kTable) {
      const pkField = kTable.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const displayField = kTable.fields.find(f => !f.isPrimaryKey && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('firma')))?.name || kTable.fields[0]?.name || 'name';
      return { tableName: kTable.name, pkField, displayField };
    }
  }

  if (cleanF.includes('artikel') || cleanL.includes('artikel') || cleanF.includes('produkt') || cleanL.includes('produkt')) {
    const aTable = tables.find(t => t.name.toLowerCase().includes('artikel') || t.name.toLowerCase().includes('produkt'));
    if (aTable) {
      const pkField = aTable.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const displayField = aTable.fields.find(f => !f.isPrimaryKey && (f.name.toLowerCase().includes('bezeichnung') || f.name.toLowerCase().includes('name')))?.name || aTable.fields[0]?.name || 'bezeichnung';
      return { tableName: aTable.name, pkField, displayField };
    }
  }

  if (cleanF.includes('mitarbeiter') || cleanL.includes('mitarbeiter')) {
    const mTable = tables.find(t => t.name.toLowerCase().includes('mitarbeiter'));
    if (mTable) {
      const pkField = mTable.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const displayField = mTable.fields.find(f => !f.isPrimaryKey && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('vorname')))?.name || 'name';
      return { tableName: mTable.name, pkField, displayField };
    }
  }

  if (cleanF.includes('lieferant') || cleanL.includes('lieferant')) {
    const lTable = tables.find(t => t.name.toLowerCase().includes('lieferant'));
    if (lTable) {
      const pkField = lTable.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const displayField = lTable.fields.find(f => !f.isPrimaryKey && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('firma')))?.name || 'name';
      return { tableName: lTable.name, pkField, displayField };
    }
  }

  return null;
};

const isStatusField = (fieldId: string, label: string): boolean => {
  const cleanF = (fieldId || '').toLowerCase();
  const cleanL = (label || '').toLowerCase();
  return cleanF.includes('status') || cleanL.includes('status');
};

export const generateBlazorFormPages = (
  forms: Form[],
  tables: Table[],
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  forms.forEach(form => {
    const className = toPascalCase(form.name || 'CustomForm');
    const routeName = toCamelCase(form.name || 'customForm');
    const targetTable = tables.find(t => t.id === form.sourceId || t.name === form.sourceId || t.name.toLowerCase() === form.sourceId?.toLowerCase());
    const tableName = targetTable ? targetTable.name : 'Data';
    const pkField = targetTable ? (targetTable.fields.find(f => f.isPrimaryKey)?.name || 'id') : 'id';

    const effectiveFields = getFormFields(form, targetTable);
    const subforms = extractSubformsFromForm(form, forms, tables);

    const targetTableFields = targetTable ? targetTable.fields : [];
    const nonPkFields = targetTableFields.filter(tf => !tf.isPrimaryKey);

    const getCandidateKeysForField = (f: ExtractedField, idx: number): string[] => {
      const candidates = new Set<string>();
      if (f.fieldId) candidates.add(f.fieldId);
      if (f.label) candidates.add(f.label);

      if (targetTable) {
        const matched = targetTableFields.find(tf =>
          tf.id === f.fieldId ||
          tf.name === f.fieldId ||
          tf.name.toLowerCase() === f.fieldId.toLowerCase() ||
          tf.name.toLowerCase() === f.label.toLowerCase() ||
          tf.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === f.label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        );

        if (matched) {
          candidates.add(matched.id);
          candidates.add(matched.name);
        }

        if (targetTableFields[idx]) {
          candidates.add(targetTableFields[idx].id);
          candidates.add(targetTableFields[idx].name);
        }

        if (nonPkFields[idx]) {
          candidates.add(nonPkFields[idx].id);
          candidates.add(nonPkFields[idx].name);
        }
      }

      return Array.from(candidates);
    };

    const referencedTablesMap = new Map<string, LookupMatch>();
    effectiveFields.forEach(f => {
      const lk = findLookupForField(f.fieldId, f.label, tables, tableName);
      if (lk) referencedTablesMap.set(lk.tableName, lk);
    });

    subforms.forEach(sub => {
      sub.fields.forEach(sf => {
        const lk = findLookupForField(sf.name, sf.label, tables, sub.tableName);
        if (lk) referencedTablesMap.set(lk.tableName, lk);
      });
    });

    const primarySubform = subforms.length > 0 ? subforms[0] : null;
    const subformFields = primarySubform ? primarySubform.fields : [];

    const referencedTables = Array.from(referencedTablesMap.values());

    const fieldsMarkup = effectiveFields.map(f => {
      const fieldId = f.fieldId.replace(/"/g, '');
      const label = f.label || f.fieldId;
      const lookup = findLookupForField(fieldId, label, tables, tableName);

      if (isStatusField(fieldId, label)) {
        return `
            <div class="col-md-6">
                <label class="form-label small fw-semibold text-secondary">${label}</label>
                <select class="form-select form-select-sm" @bind='formData["${fieldId}"]'>
                    <option value="">-- Bitte Status auswählen --</option>
                    <option value="Entwurf">Entwurf</option>
                    <option value="Offen">Offen</option>
                    <option value="Angenommen">Angenommen</option>
                    <option value="Abgelehnt">Abgelehnt</option>
                    <option value="Erledigt">Erledigt</option>
                    <option value="Storniert">Storniert</option>
                </select>
            </div>`;
      }

      if (lookup) {
        const listProp = `${toCamelCase(lookup.tableName)}LookupList`;
        return `
            <div class="col-md-6">
                <label class="form-label small fw-semibold text-secondary">${label}</label>
                <select class="form-select form-select-sm" @bind='formData["${fieldId}"]'>
                    <option value="">-- Bitte ${lookup.tableName} auswählen --</option>
                    @if (${listProp} != null)
                    {
                        @foreach (var item in ${listProp})
                        {
                            var val = GetSubformValue(item, "${lookup.pkField}");
                            var txt = GetSubformValue(item, "${lookup.displayField}");
                            var disp = string.IsNullOrWhiteSpace(txt) ? $"ID: {val}" : $"{txt} (ID: {val})";
                            <option value="@val">@disp</option>
                        }
                    }
                </select>
            </div>`;
      }

      const cleanId = fieldId.toLowerCase();
      if (cleanId.includes('datum') || cleanId.includes('date') || cleanId.includes('bis')) {
        return `
            <div class="col-md-6">
                <label class="form-label small fw-semibold text-secondary">${label}</label>
                <input type="date" class="form-control form-control-sm" @bind='formData["${fieldId}"]' />
            </div>`;
      }

      return `
            <div class="col-md-6">
                <label class="form-label small fw-semibold text-secondary">${label}</label>
                <input type="text" class="form-control form-control-sm" @bind='formData["${fieldId}"]' />
            </div>`;
    }).join('\n');

    const subformFieldsMarkup = subformFields.map(sf => {
      const sfName = sf.name;
      const sfLabel = sf.label || sf.name;
      const lookup = findLookupForField(sfName, sfLabel, tables, primarySubform?.tableName);

      if (isStatusField(sfName, sfLabel)) {
        return `
                            <div class="col-6">
                                <label class="form-label small fw-semibold">${sfLabel}</label>
                                <select class="form-select form-select-sm" @bind='newSubformItem["${sfName}"]'>
                                    <option value="">-- Bitte Status auswählen --</option>
                                    <option value="Offen">Offen</option>
                                    <option value="Erledigt">Erledigt</option>
                                    <option value="Storniert">Storniert</option>
                                </select>
                            </div>`;
      }

      if (lookup) {
        const listProp = `${toCamelCase(lookup.tableName)}LookupList`;
        return `
                            <div class="col-6">
                                <label class="form-label small fw-semibold">${sfLabel}</label>
                                <select class="form-select form-select-sm" @onchange='@(e => OnSubformLookupSelected("${sfName}", e.Value?.ToString() ?? "", "${lookup.tableName}", "${lookup.pkField}"))'>
                                    <option value="">-- Bitte ${lookup.tableName} auswählen --</option>
                                    @if (${listProp} != null)
                                    {
                                        @foreach (var item in ${listProp})
                                        {
                                            var val = GetSubformValue(item, "${lookup.pkField}");
                                            var txt = GetSubformValue(item, "${lookup.displayField}");
                                            var disp = string.IsNullOrWhiteSpace(txt) ? $"ID: {val}" : $"{txt} (ID: {val})";
                                            <option value="@val" selected="@(newSubformItem.ContainsKey("${sfName}") && newSubformItem["${sfName}"] == val)">@disp</option>
                                        }
                                    }
                                </select>
                            </div>`;
      }

      return `
                            <div class="col-6">
                                <label class="form-label small fw-semibold">${sfLabel}</label>
                                <input type="text" class="form-control form-control-sm" @bind='newSubformItem["${sfName}"]' />
                            </div>`;
    }).join('\n');

    const content = `@page "/forms/${form.id}"
@page "/forms/${form.id}/{RecordId}"
@page "/${routeName}Form"
@page "/${routeName}Form/{RecordId}"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject NavigationManager Nav

<div class="container py-4">
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
            <div>
                <h4 class="fw-bold text-primary mb-1">
                    <i class="bi bi-file-earmark-text me-2"></i>${form.name}
                </h4>
                <p class="text-secondary small mb-0">Benutzerdefiniertes Formular (${tableName})</p>
            </div>
            <a href="/" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-arrow-left me-1"></i> Zurück
            </a>
        </div>
        <div class="card-body pt-0">
            <hr class="text-muted my-3" />
            <form @onsubmit="HandleSave">
                <div class="row g-3">
                    ${fieldsMarkup || `
                    <div class="col-12">
                        <p class="text-muted mb-0">Keine Formularfelder konfiguriert.</p>
                    </div>`}
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" class="btn btn-sm btn-outline-secondary" @onclick="ResetForm">Zurücksetzen</button>
                    <button type="submit" class="btn btn-sm btn-primary">
                        <i class="bi bi-save me-1"></i> Speichern
                    </button>
                </div>
            </form>
        </div>
    </div>

    ${subforms.map(sub => `
    <div class="card shadow-sm border-0 mt-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
            <div>
                <h5 class="fw-bold text-dark mb-1">
                    <i class="bi bi-list-nested me-2"></i>${sub.title}
                </h5>
                <p class="text-secondary small mb-0">Unterformular Datensätze (Verknüpft mit Hauptformular ID)</p>
            </div>
            <button type="button" class="btn btn-outline-primary btn-sm" @onclick="OpenAddSubformDialog">
                <i class="bi bi-plus-lg me-1"></i> Eintrag hinzufügen
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        ${sub.fields.map(f => `<th class="px-3">${f.label}</th>`).join('')}
                        <th class="text-end px-3">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    @if (subformItems != null && subformItems.Any())
                    {
                        @foreach (var item in subformItems)
                        {
                            <tr>
                                ${sub.fields.map(f => {
                                  const lk = findLookupForField(f.name, f.label, tables, sub.tableName);
                                  if (lk) {
                                    const listProp = `${toCamelCase(lk.tableName)}LookupList`;
                                    return `<td class="px-3">@GetLookupDisplay(${listProp}, GetSubformValue(item, "${f.name}"), "${lk.pkField}", "${lk.displayField}")</td>`;
                                  }
                                  return `<td class="px-3">@GetSubformValue(item, "${f.name}")</td>`;
                                }).join('')}
                                <td class="text-end px-3">
                                    <button type="button" class="btn btn-sm btn-link text-danger p-0 text-decoration-none" @onclick="() => RemoveSubformItem(item)">
                                        <i class="bi bi-trash"></i> Löschen
                                    </button>
                                </td>
                            </tr>
                        }
                    }
                    else
                    {
                        <tr>
                            <td colspan="${sub.fields.length + 1}" class="p-4 text-center text-muted fst-italic">Keine Einträge im Unterformular vorhanden.</td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    </div>
    `).join('\n')}

    @if (showSubformDialog)
    {
        <div class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);" @onclick="CloseSubformDialog">
            <div class="modal-dialog modal-dialog-centered" @onclick:stopPropagation="true">
                <div class="modal-content shadow">
                    <div class="modal-header bg-light py-2 d-flex justify-content-between align-items-center">
                        <h5 class="modal-title h6 mb-0">Subform-Eintrag hinzufügen</h5>
                        <button type="button" class="btn-close" @onclick="CloseSubformDialog" aria-label="Schließen"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            ${subformFieldsMarkup}
                        </div>
                    </div>
                    <div class="modal-footer bg-light py-2">
                        <button type="button" class="btn btn-sm btn-secondary" @onclick="CloseSubformDialog">Abbrechen</button>
                        <button type="button" class="btn btn-sm btn-primary" @onclick="SaveSubformItem">Hinzufügen</button>
                    </div>
                </div>
            </div>
        </div>
    }
</div>

@code {
    [Parameter] public string? RecordId { get; set; }

    private Dictionary<string, string> formData = new();
    private List<Dictionary<string, object>> subformItems = new();
    private Dictionary<string, string> newSubformItem = new();
    private bool showSubformDialog = false;

    ${referencedTables.map(t => `private List<Dictionary<string, object>> ${toCamelCase(t.tableName)}LookupList = new();`).join('\n    ')}

    protected override async Task OnInitializedAsync()
    {
        var keys = new[] { ${effectiveFields.map(f => `"${f.fieldId.replace(/"/g, '')}"`).join(', ')} };
        foreach (var k in keys)
        {
            if (!formData.ContainsKey(k)) formData[k] = "";
        }

        ${referencedTables.map(t => `
        var ${toCamelCase(t.tableName)}Data = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>("${t.tableName}");
        if (${toCamelCase(t.tableName)}Data != null)
        {
            ${toCamelCase(t.tableName)}LookupList = ${toCamelCase(t.tableName)}Data;
        }`).join('\n')}

        if (!string.IsNullOrEmpty(RecordId))
        {
            var existing = await StorageManager.CurrentService.GetById<Dictionary<string, object>>("${tableName}", RecordId);
            if (existing == null)
            {
                var allItems = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>("${tableName}");
                if (allItems != null && allItems.Count > 0)
                {
                    existing = allItems.FirstOrDefault(item => 
                        GetSubformValue(item, "id") == RecordId || 
                        GetSubformValue(item, "Id") == RecordId ||
                        GetSubformValue(item, "${pkField}") == RecordId
                    );
                }
            }

            if (existing != null)
            {
                foreach (var kvp in existing)
                {
                    if (kvp.Value != null)
                    {
                        var valStr = kvp.Value.ToString() ?? "";
                        formData[kvp.Key] = valStr;
                    }
                }

                ${effectiveFields.map((f, idx) => {
                  const fieldId = f.fieldId.replace(/"/g, '');
                  const candidates = getCandidateKeysForField(f, idx).map(c => `"${c.replace(/"/g, '')}"`).join(', ');
                  return `formData["${fieldId}"] = GetFieldValue(existing, "${fieldId}", "${f.label.replace(/"/g, '')}", new[] { ${candidates} }, ${idx});`;
                }).join('\n                ')}

                if (!formData.ContainsKey("id") || string.IsNullOrEmpty(formData["id"]))
                {
                    formData["id"] = RecordId;
                }
            }

            ${primarySubform ? `
            var allSubItems = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>("${primarySubform.tableName}");
            if (allSubItems != null && allSubItems.Count > 0)
            {
                subformItems = allSubItems.Where(item => 
                    GetSubformValue(item, "${primarySubform.childLinkFieldId}") == RecordId ||
                    GetSubformValue(item, "${tableName.toLowerCase()}_id") == RecordId ||
                    GetSubformValue(item, "master_id") == RecordId
                ).ToList();
            }
            ` : ''}
        }
        else if (!formData.ContainsKey("id") || string.IsNullOrEmpty(formData["id"]))
        {
            formData["id"] = Guid.NewGuid().ToString();
        }
    }

    private string GetFieldValue(Dictionary<string, object>? record, string fieldId, string label, string[] candidateKeys, int fieldIndex)
    {
        if (record == null) return "";

        if (record.TryGetValue(fieldId, out var v1) && v1 != null && !string.IsNullOrEmpty(v1.ToString()))
            return v1.ToString()!;

        foreach (var key in candidateKeys)
        {
            if (record.TryGetValue(key, out var v2) && v2 != null && !string.IsNullOrEmpty(v2.ToString()))
                return v2.ToString()!;
        }

        var normTargets = candidateKeys.Concat(new[] { fieldId, label })
            .Select(NormalizeKey)
            .Where(s => !string.IsNullOrEmpty(s))
            .ToHashSet();

        foreach (var kvp in record)
        {
            var normK = NormalizeKey(kvp.Key);
            if (normTargets.Contains(normK) && kvp.Value != null && !string.IsNullOrEmpty(kvp.Value.ToString()))
            {
                return kvp.Value.ToString()!;
            }
        }

        if (record.Count > fieldIndex)
        {
            var keysList = record.Keys.ToList();
            int targetIdx = fieldIndex;
            if (keysList.Count > targetIdx && (keysList[0].Equals("id", StringComparison.OrdinalIgnoreCase) || keysList[0].Equals("pk", StringComparison.OrdinalIgnoreCase)))
            {
                targetIdx = fieldIndex + 1;
            }
            if (targetIdx < keysList.Count)
            {
                var val = record[keysList[targetIdx]];
                if (val != null && !string.IsNullOrEmpty(val.ToString()))
                {
                    return val.ToString()!;
                }
            }
        }

        return "";
    }

    private string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        var clean = new string(key.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        if (clean.StartsWith("fld") && clean.Length > 3) clean = clean.Substring(3);
        if (clean.StartsWith("field") && clean.Length > 5) clean = clean.Substring(5);
        if (clean.StartsWith("f") && clean.Length > 1 && char.IsDigit(clean[1])) clean = clean.Substring(1);
        return clean;
    }

    private string GetSubformValue(Dictionary<string, object> item, string key)
    {
        if (item == null) return "";
        foreach (var kvp in item)
        {
            if (kvp.Key.Equals(key, StringComparison.OrdinalIgnoreCase) ||
                kvp.Key.Replace("_", "").Equals(key.Replace("_", ""), StringComparison.OrdinalIgnoreCase))
            {
                return kvp.Value?.ToString() ?? "";
            }
        }
        return "";
    }

    private string GetLookupDisplay(List<Dictionary<string, object>>? lookupList, string idValue, string pkField, string displayField)
    {
        if (string.IsNullOrEmpty(idValue)) return "-";
        if (lookupList == null || lookupList.Count == 0) return idValue;

        var found = lookupList.FirstOrDefault(item => 
            GetSubformValue(item, pkField) == idValue || 
            GetSubformValue(item, "id") == idValue ||
            GetSubformValue(item, "Id") == idValue
        );

        if (found != null)
        {
            var txt = GetSubformValue(found, displayField);
            if (!string.IsNullOrWhiteSpace(txt)) return $"{txt} (ID: {idValue})";
        }
        return idValue;
    }

    private void OpenAddSubformDialog()
    {
        var masterId = formData.ContainsKey("id") && !string.IsNullOrEmpty(formData["id"])
            ? formData["id"]
            : Guid.NewGuid().ToString();
        formData["id"] = masterId;

        newSubformItem = new Dictionary<string, string>();
        ${subformFields.map(f => `newSubformItem["${f.name}"] = "";`).join('\n        ')}

        ${primarySubform ? `newSubformItem["${primarySubform.childLinkFieldId}"] = masterId;` : ''}
        showSubformDialog = true;
        StateHasChanged();
    }

    private void CloseSubformDialog()
    {
        showSubformDialog = false;
        StateHasChanged();
    }

    private void OnSubformLookupSelected(string fieldName, string val, string tableName, string pkField)
    {
        newSubformItem[fieldName] = val;

        List<Dictionary<string, object>>? lookupList = null;
        ${referencedTables.map(t => `if (tableName.Equals("${t.tableName}", StringComparison.OrdinalIgnoreCase)) lookupList = ${toCamelCase(t.tableName)}LookupList;`).join('\n        ')}

        if (lookupList != null && !string.IsNullOrEmpty(val))
        {
            var matched = lookupList.FirstOrDefault(item => GetSubformValue(item, pkField) == val || GetSubformValue(item, "id") == val);
            if (matched != null)
            {
                foreach (var key in newSubformItem.Keys.ToList())
                {
                    if (key.Equals(fieldName, StringComparison.OrdinalIgnoreCase)) continue;
                    var foundVal = GetSubformValue(matched, key);
                    if (!string.IsNullOrEmpty(foundVal) && string.IsNullOrEmpty(newSubformItem[key]))
                    {
                        newSubformItem[key] = foundVal;
                    }
                }
            }
        }
        StateHasChanged();
    }

    private void SaveSubformItem()
    {
        var masterId = formData.ContainsKey("id") && !string.IsNullOrEmpty(formData["id"])
            ? formData["id"]
            : Guid.NewGuid().ToString();
        formData["id"] = masterId;

        var itemObj = new Dictionary<string, object>();
        foreach (var kvp in newSubformItem)
        {
            itemObj[kvp.Key] = kvp.Value;
        }

        ${primarySubform ? `
        itemObj["${primarySubform.childLinkFieldId}"] = masterId;
        ${primarySubform.childLinkFieldId !== `${tableName.toLowerCase()}_id` ? `itemObj["${tableName.toLowerCase()}_id"] = masterId;` : ''}
        ` : ''}

        if (!itemObj.ContainsKey("id") || string.IsNullOrEmpty(itemObj["id"]?.ToString()))
        {
            itemObj["id"] = Guid.NewGuid().ToString();
        }

        subformItems.Add(itemObj);
        showSubformDialog = false;
        StateHasChanged();
    }

    private void RemoveSubformItem(Dictionary<string, object> item)
    {
        subformItems.Remove(item);
    }

    private async Task HandleSave()
    {
        try
        {
            if (!formData.ContainsKey("id") || string.IsNullOrEmpty(formData["id"]))
            {
                formData["id"] = !string.IsNullOrEmpty(RecordId) ? RecordId : Guid.NewGuid().ToString();
            }
            var masterId = formData["id"];

            ${effectiveFields.map((f, idx) => {
              const fieldId = f.fieldId.replace(/"/g, '');
              const candidates = getCandidateKeysForField(f, idx);
              return `if (formData.TryGetValue("${fieldId}", out var val_${idx}))
            {
                ${candidates.map(c => `formData["${c.replace(/"/g, '')}"] = val_${idx};`).join('\n                ')}
            }`;
            }).join('\n            ')}

            if (!string.IsNullOrEmpty(RecordId))
            {
                await StorageManager.CurrentService.Update("${tableName}", RecordId, formData);
            }
            else
            {
                await StorageManager.CurrentService.Add("${tableName}", formData);
            }

            ${primarySubform ? `
            foreach (var subItem in subformItems)
            {
                subItem["${primarySubform.childLinkFieldId}"] = masterId;
                ${primarySubform.childLinkFieldId !== `${tableName.toLowerCase()}_id` ? `subItem["${tableName.toLowerCase()}_id"] = masterId;` : ''}
                if (subItem.TryGetValue("id", out var subId) && subId != null && !string.IsNullOrEmpty(subId.ToString()))
                {
                    await StorageManager.CurrentService.Update("${primarySubform.tableName}", subId.ToString()!, subItem);
                }
                else
                {
                    subItem["id"] = Guid.NewGuid().ToString();
                    await StorageManager.CurrentService.Add("${primarySubform.tableName}", subItem);
                }
            }
            ` : ''}

            Nav.NavigateTo("/");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Fehler beim Speichern: {ex.Message}");
        }
    }

    private void ResetForm()
    {
        foreach (var key in formData.Keys.ToList())
        {
            formData[key] = "";
        }
        subformItems.Clear();
    }
}
`;

    files.push({
      name: `${className}Form.razor`,
      path: `${root}/Pages/Forms/${className}Form.razor`,
      content,
      language: 'razor'
    });
  });

  return files;
};
