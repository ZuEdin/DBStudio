export type ReferentialAction = 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  type: '1:1' | '1:n' | 'n:m';
  referentialIntegrity?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}
