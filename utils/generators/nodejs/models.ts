
import { Table, Relationship, BackendConfig, DbType } from '../../../types/index';
import { resolveType, isNullable, toPascalCase } from '../common';

export const generateSequelizeModels = (tables: Table[], relationships: Relationship[], config: BackendConfig): string => {
  let dialect = 'mssql';
  let sequelizeConstructor = '';
  
  if (config.dbType === DbType.MySQL) dialect = 'mysql';
  else if (config.dbType === DbType.SQLite) dialect = 'sqlite';

  if (dialect === 'sqlite') {
      const storage = config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'database.sqlite';
      sequelizeConstructor = `const sequelize = new Sequelize({ dialect: 'sqlite', storage: '${storage}' });`;
  } else {
      let db = 'database_name', user = 'user', pass = 'password', host = 'localhost';
      if (config.dbConnection.includes(';')) {
          config.dbConnection.split(';').forEach(p => {
              const [k, v] = p.split('=');
              if (!k || !v) return;
              const key = k.trim().toLowerCase();
              if (key === 'database' || key === 'initial catalog') db = v.trim();
              if (key === 'server' || key === 'data source') host = v.trim();
              if (key === 'user' || key === 'uid') user = v.trim();
              if (key === 'password' || key === 'pwd') pass = v.trim();
          });
      }
      sequelizeConstructor = `const sequelize = new Sequelize('${db}', '${user}', '${pass}', { host: '${host}', dialect: '${dialect}' });`;
  }

  let content = `const { Sequelize, DataTypes } = require('sequelize');\n${sequelizeConstructor}\nconst db = {};\n`;

  tables.forEach(table => {
    const modelName = toPascalCase(table.name);
    const fields = table.fields.map(f => {
      const type = resolveType(f, 'sequelize');
      const props = [`        type: ${type}`];
      if (f.isPrimaryKey) props.push('        primaryKey: true');
      if (f.isAutoIncrement) props.push('        autoIncrement: true');
      if (!isNullable(f)) props.push('        allowNull: false');
      return `    ${f.name}: {\n${props.join(',\n')}\n    }`;
    }).join(',\n');

    content += `\ndb.${modelName} = sequelize.define('${modelName}', {\n${fields}\n});\n`;
  });

  content += '\n// Relationships\n';
  relationships.forEach(rel => {
      const parent = tables.find(t => t.id === rel.fromTableId);
      const child = tables.find(t => t.id === rel.toTableId);
      const childField = child?.fields.find(f => f.id === rel.toFieldId);
      if (parent && child && childField) {
          const parentModel = toPascalCase(parent.name);
          const childModel = toPascalCase(child.name);
          if (rel.type === '1:n') {
              content += `db.${parentModel}.hasMany(db.${childModel}, { foreignKey: '${childField.name}' });\n`;
              content += `db.${childModel}.belongsTo(db.${parentModel}, { foreignKey: '${childField.name}' });\n`;
          } else {
              content += `db.${parentModel}.hasOne(db.${childModel}, { foreignKey: '${childField.name}' });\n`;
              content += `db.${childModel}.belongsTo(db.${parentModel}, { foreignKey: '${childField.name}' });\n`;
          }
      }
  });

  content += `\ndb.Sequelize = Sequelize;\ndb.sequelize = sequelize;\nmodule.exports = db;`;
  return content;
};
