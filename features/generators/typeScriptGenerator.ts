import { Table } from '../../types';
import { GeneratorOptions, GeneratedCodeOutput } from './generatorTypes';

export class TypeScriptGenerator {
  public static generateInterface(table: Table, _options: GeneratorOptions = {}): GeneratedCodeOutput {
    const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
    const lines: string[] = [];

    lines.push(`export interface ${typeName} {`);
    for (const field of table.fields) {
      const isOptional = field.allowNull || field.isNullable;
      const tsType = this.mapSqlTypeToTs(field.type);
      lines.push(`  ${field.name}${isOptional ? '?' : ''}: ${tsType};`);
    }
    lines.push(`}`);

    return {
      fileName: `${typeName}.ts`,
      language: 'typescript',
      code: lines.join('\n'),
    };
  }

  private static mapSqlTypeToTs(sqlType: string): string {
    const lower = (sqlType || '').toLowerCase();
    if (lower.includes('int') || lower.includes('num') || lower.includes('dec') || lower.includes('float') || lower.includes('curr') || lower.includes('perc')) {
      return 'number';
    }
    if (lower.includes('bool')) {
      return 'boolean';
    }
    if (lower.includes('json') || lower.includes('blob')) {
      return 'any';
    }
    return 'string';
  }
}
