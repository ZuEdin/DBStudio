import { Table } from '../../types';

export interface GeneratorOptions {
  includeValidation?: boolean;
  includeComments?: boolean;
  exportFormat?: 'typescript' | 'zod' | 'json_schema' | 'openapi';
  camelCaseProperties?: boolean;
}

export interface GeneratedCodeOutput {
  fileName: string;
  language: string;
  code: string;
}
