export type ReferentialAction = 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  fromTable?: string;
  fromField?: string;
  toTable?: string;
  toField?: string;
  type: '1:1' | '1:n' | '1:N' | 'n:m' | 'N:M';
  joinType?: JoinType;
  comment?: string;
  referentialIntegrity?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}
