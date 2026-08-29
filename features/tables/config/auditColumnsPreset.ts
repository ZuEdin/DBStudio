import { Field } from '../../../types';

export interface AuditFieldsConfig {
  includeCreated: boolean;
  includeUpdated: boolean;
  includeSoftDelete: boolean;
  includeRowVersion: boolean;
  prefix?: string;
}

export function generateEnterpriseAuditFields(config: AuditFieldsConfig = {
  includeCreated: true,
  includeUpdated: true,
  includeSoftDelete: true,
  includeRowVersion: true
}): Field[] {
  const fields: Field[] = [];
  const p = config.prefix || '';

  if (config.includeCreated) {
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}CreatedAt`,
      type: 'DATETIME',
      allowNull: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      comment: 'Zeitpunkt der Erstellung (Audit)',
      inlineEditable: false,
    });
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}CreatedBy`,
      type: 'VARCHAR',
      length: 100,
      allowNull: true,
      comment: 'Ersteller / Benutzer-ID (Audit)',
      inlineEditable: false,
    });
  }

  if (config.includeUpdated) {
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}UpdatedAt`,
      type: 'DATETIME',
      allowNull: true,
      comment: 'Zeitpunkt der letzten Änderung (Audit)',
      inlineEditable: false,
    });
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}UpdatedBy`,
      type: 'VARCHAR',
      length: 100,
      allowNull: true,
      comment: 'Letzter Bearbeiter (Audit)',
      inlineEditable: false,
    });
  }

  if (config.includeSoftDelete) {
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}IsDeleted`,
      type: 'BOOLEAN',
      allowNull: false,
      defaultValue: 'false',
      comment: 'Soft-Delete Kennzeichen (DSGVO / GoBD konform)',
      isSoftDelete: true,
      inlineEditable: false,
    });
  }

  if (config.includeRowVersion) {
    fields.push({
      id: crypto.randomUUID(),
      name: `${p}RowVersion`,
      type: 'INTEGER',
      allowNull: false,
      defaultValue: '1',
      comment: 'Optimistic Locking Versionszähler',
      isRowVersion: true,
      inlineEditable: false,
    });
  }

  return fields;
}
