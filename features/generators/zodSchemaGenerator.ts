import { Table } from '../../types';
import { GeneratedCodeOutput } from './generatorTypes';

export class ZodSchemaGenerator {
  public static generateZodSchema(table: Table): GeneratedCodeOutput {
    const schemaName = `${table.name.charAt(0).toLowerCase() + table.name.slice(1)}Schema`;
    const lines: string[] = [];

    lines.push(`import { z } from 'zod';\n`);
    lines.push(`export const ${schemaName} = z.object({`);

    for (const field of table.fields) {
      let zodValidator = 'z.string()';
      const lower = (field.type || '').toLowerCase();

      if (lower.includes('int') || lower.includes('num') || lower.includes('dec') || lower.includes('curr') || lower.includes('perc')) {
        zodValidator = 'z.number()';
      } else if (lower.includes('bool')) {
        zodValidator = 'z.boolean()';
      } else if (lower.includes('date')) {
        zodValidator = 'z.string().datetime().or(z.date())';
      }

      if (field.allowNull || field.isNullable) {
        zodValidator += '.optional()';
      }

      lines.push(`  ${field.name}: ${zodValidator},`);
    }

    lines.push(`});\n`);
    lines.push(`export type ${table.name.charAt(0).toUpperCase() + table.name.slice(1)} = z.infer<typeof ${schemaName}>;`);

    return {
      fileName: `${table.name}Validation.ts`,
      language: 'typescript',
      code: lines.join('\n'),
    };
  }
}
