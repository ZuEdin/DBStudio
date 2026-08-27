import { Table } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const getFKTableInfo = (targetTable: Table) => {
  const className = toPascalCase(targetTable.name);
  const camelName = toCamelCase(targetTable.name);
  const pkField = targetTable.fields.find(x => x.isPrimaryKey) || targetTable.fields[0];
  const pkProp = toPascalCase(pkField.name);
  const labelField = targetTable.fields.find(x => !x.isPrimaryKey && (
    x.name.toLowerCase().includes('name') ||
    x.name.toLowerCase().includes('bezeichnung') ||
    x.name.toLowerCase().includes('titel') ||
    x.name.toLowerCase().includes('firma') ||
    x.name.toLowerCase().includes('nummer') ||
    x.name.toLowerCase().includes('nr') ||
    x.name.toLowerCase().includes('beschreibung')
  )) || targetTable.fields.find(x => !x.isPrimaryKey && (x.type === 'VARCHAR' || x.type === 'TEXT' || x.type === 'CHAR' || x.type === 'EMAIL' || (x.type as string) === 'string')) || pkField;
  const labelProp = toPascalCase(labelField.name);
  return { className, camelName, pkProp, labelProp };
};
