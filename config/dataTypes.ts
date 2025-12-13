
export interface DataTypeDefinition {
  label: string;
  hasLength?: boolean;
  defaultLength?: number;
  hasPrecision?: boolean;
  defaultPrecision?: number;
  defaultScale?: number;
  mappings: {
    csharp: {
      type: string;
      // Attributes are added above the property, e.g., [MaxLength(50)]
      attributes?: (val: { length?: number, precision?: number, scale?: number }) => string[];
    };
    sequelize: {
      // Function to generate the type string, e.g., "DataTypes.STRING(50)"
      type: (val: { length?: number, precision?: number, scale?: number }) => string;
    };
    typescript: string;
    sql: {
        type: (val: { length?: number, precision?: number, scale?: number }) => string;
    }
  };
}

export const DATA_TYPES: Record<string, DataTypeDefinition> = {
  INTEGER: {
    label: "Zahl (Integer)",
    mappings: {
      csharp: { type: "int" },
      sequelize: { type: () => "DataTypes.INTEGER" },
      typescript: "number",
      sql: { type: () => "INT" }
    }
  },
  VARCHAR: {
    label: "Kurzer Text (Varchar)",
    hasLength: true,
    defaultLength: 255,
    mappings: {
      csharp: { 
        type: "string",
        attributes: ({ length }) => length ? [`[MaxLength(${length})]`] : []
      },
      sequelize: { 
        type: ({ length }) => `DataTypes.STRING(${length || 255})` 
      },
      typescript: "string",
      sql: { type: ({ length }) => `VARCHAR(${length || 255})` }
    }
  },
  TEXT: {
    label: "Langer Text (Text)",
    mappings: {
      csharp: { type: "string" },
      sequelize: { type: () => "DataTypes.TEXT" },
      typescript: "string",
      sql: { type: () => "TEXT" }
    }
  },
  DECIMAL: {
    label: "Währung/Decimal",
    hasPrecision: true,
    defaultPrecision: 18,
    defaultScale: 2,
    mappings: {
      csharp: { 
        type: "decimal",
        attributes: ({ precision, scale }) => [`[Column(TypeName = "decimal(${precision || 18}, ${scale || 2})")]`]
      },
      sequelize: { 
        type: ({ precision, scale }) => `DataTypes.DECIMAL(${precision || 10}, ${scale || 2})` 
      },
      typescript: "number",
      sql: { type: ({ precision, scale }) => `DECIMAL(${precision || 18}, ${scale || 2})` }
    }
  },
  DOUBLE: {
    label: "Gleitkomma (Double)",
    mappings: {
      csharp: { type: "double" },
      sequelize: { type: () => "DataTypes.DOUBLE" },
      typescript: "number",
      sql: { type: () => "FLOAT" }
    }
  },
  BOOLEAN: {
    label: "Ja/Nein (Boolean)",
    mappings: {
      csharp: { type: "bool" },
      sequelize: { type: () => "DataTypes.BOOLEAN" },
      typescript: "boolean",
      sql: { type: () => "BIT" }
    }
  },
  DATE: {
    label: "Datum (DateOnly)",
    mappings: {
      csharp: { type: "DateTime" }, // .NET 6+ has DateOnly, but sticking to DateTime for wider compatibility in this demo
      sequelize: { type: () => "DataTypes.DATEONLY" },
      typescript: "Date",
      sql: { type: () => "DATE" }
    }
  },
  DATETIME: {
    label: "Datum & Zeit",
    mappings: {
      csharp: { type: "DateTime" },
      sequelize: { type: () => "DataTypes.DATE" },
      typescript: "Date",
      sql: { type: () => "DATETIME" }
    }
  }
};
