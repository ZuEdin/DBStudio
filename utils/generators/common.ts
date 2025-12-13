
import { Field } from '../../types/index';
import { DATA_TYPES } from '../../config/dataTypes';

export const isNullable = (field: Field) => field.allowNull !== false && !field.isPrimaryKey;

export const resolveType = (field: Field, language: 'csharp' | 'sequelize' | 'typescript' | 'sql') => {
    const config = DATA_TYPES[field.type];
    if (!config) return 'string'; 

    const mapping = config.mappings[language];
    if (typeof mapping === 'string') return mapping;
    
    const typeGen = (mapping as any).type;
    
    if (typeof typeGen === 'function') {
        return typeGen({ length: field.length, precision: field.precision, scale: field.scale });
    }
    return typeGen;
};
