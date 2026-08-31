import { Table, Relationship, Field } from '../../../types/index';
import { MockDataConfig } from '../types/erDesignerTypes';

export class MockDataSynthesisService {
  private static FIRST_NAMES_DE = ['Maximilian', 'Alexander', 'Paul', 'Leon', 'Lukas', 'Felix', 'Jonas', 'Noah', 'Elias', 'Sophie', 'Marie', 'Maria', 'Emma', 'Hannah', 'Mia', 'Anna', 'Laura', 'Lena', 'Sarah', 'Julia'];
  private static LAST_NAMES_DE = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'];
  private static CITIES_DE = [
    { city: 'Berlin', zip: '10115', state: 'Berlin' },
    { city: 'Hamburg', zip: '20095', state: 'Hamburg' },
    { city: 'München', zip: '80331', state: 'Bayern' },
    { city: 'Köln', zip: '50667', state: 'Nordrhein-Westfalen' },
    { city: 'Frankfurt am Main', zip: '60311', state: 'Hessen' },
    { city: 'Stuttgart', zip: '70173', state: 'Baden-Württemberg' },
    { city: 'Düsseldorf', zip: '40213', state: 'Nordrhein-Westfalen' },
    { city: 'Leipzig', zip: '04109', state: 'Sachsen' },
    { city: 'Dortmund', zip: '44135', state: 'Nordrhein-Westfalen' },
    { city: 'Essen', zip: '45127', state: 'Nordrhein-Westfalen' },
    { city: 'Nürnberg', zip: '90403', state: 'Bayern' },
    { city: 'Hannover', zip: '30159', state: 'Niedersachsen' }
  ];
  private static STREETS_DE = ['Hauptstraße', 'Bahnhofstraße', 'Schulstraße', 'Gartenstraße', 'Dorfstraße', 'Birkenweg', 'Lindenstraße', 'Kirchweg', 'Waldstraße', 'Goethestraße', 'Schillerstraße', 'Poststraße'];
  private static COMPANIES_DE = ['TechNova Solutions GmbH', 'Alpine Dynamics AG', 'Rhein-Main Logistik e.K.', 'Nordlicht Consulting KG', 'Bavaria Digital Werk', 'Hanseatic Cloud Systems', 'Vanguard Dataworks UG', 'Kaiser & Partner Software'];
  private static DOMAINS = ['example.de', 'company.com', 'mail.de', 'web.de', 't-online.de', 'gmx.net', 'posteo.de'];

  /**
   * Generates graph-aware mock data preserving foreign key relationships
   */
  public static generateMockData(
    tables: Table[],
    relationships: Relationship[],
    config: MockDataConfig
  ): Record<string, any[]> {
    const generatedData: Record<string, any[]> = {};

    // 1. Topologically sort tables (Parents first, Children later)
    const sortedTableIds = this.topologicalSortTables(tables, relationships);

    // 2. Generate data table by table
    sortedTableIds.forEach(tableId => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const rowCount = config.rowCounts[table.id] || config.rowCounts['default'] || 10;
      const rows: any[] = [];

      // Find incoming relationships where this table is the child (toTableId === table.id)
      const incomingRels = relationships.filter(r => r.toTableId === table.id);

      for (let i = 1; i <= rowCount; i++) {
        const row: Record<string, any> = {};

        // Resolve Fields
        table.fields.forEach(field => {
          // Check if this field is a foreign key
          const fkRel = incomingRels.find(r => r.toFieldId === field.id);

          if (fkRel) {
            const parentRows = generatedData[fkRel.fromTableId] || [];
            const parentTable = tables.find(t => t.id === fkRel.fromTableId);
            const parentField = parentTable?.fields.find(f => f.id === fkRel.fromFieldId);

            if (parentRows.length > 0 && parentField) {
              // Pick a random existing parent row PK
              const randomParentRow = parentRows[Math.floor(Math.random() * parentRows.length)];
              row[field.name] = randomParentRow[parentField.name];
              return;
            }
          }

          // Otherwise generate synthetic field value
          row[field.name] = this.generateFieldValue(field, i, row);
        });

        rows.push(row);
      }

      generatedData[table.id] = rows;
    });

    return generatedData;
  }

  private static generateFieldValue(field: Field, index: number, currentRow: Record<string, any>): any {
    const name = field.name.toLowerCase();
    const type = field.type;

    if (field.isPrimaryKey) {
      if (type === 'UUID') {
        return crypto.randomUUID();
      }
      return index;
    }

    if (name.includes('email') || type === 'EMAIL') {
      const first = this.FIRST_NAMES_DE[Math.floor(Math.random() * this.FIRST_NAMES_DE.length)].toLowerCase();
      const last = this.LAST_NAMES_DE[Math.floor(Math.random() * this.LAST_NAMES_DE.length)].toLowerCase();
      const domain = this.DOMAINS[Math.floor(Math.random() * this.DOMAINS.length)];
      return `${first}.${last}${index}@${domain}`;
    }

    if (name.includes('vorname') || name.includes('firstname') || name === 'first_name') {
      return this.FIRST_NAMES_DE[Math.floor(Math.random() * this.FIRST_NAMES_DE.length)];
    }

    if (name.includes('nachname') || name.includes('lastname') || name === 'last_name' || name === 'name') {
      return this.LAST_NAMES_DE[Math.floor(Math.random() * this.LAST_NAMES_DE.length)];
    }

    if (name.includes('firma') || name.includes('company')) {
      return this.COMPANIES_DE[Math.floor(Math.random() * this.COMPANIES_DE.length)];
    }

    if (name.includes('strasse') || name.includes('street') || name.includes('adresse')) {
      const street = this.STREETS_DE[Math.floor(Math.random() * this.STREETS_DE.length)];
      const no = Math.floor(Math.random() * 120) + 1;
      return `${street} ${no}`;
    }

    if (name.includes('plz') || name.includes('zip')) {
      const cityObj = this.CITIES_DE[Math.floor(Math.random() * this.CITIES_DE.length)];
      return cityObj.zip;
    }

    if (name.includes('ort') || name.includes('city') || name.includes('stadt')) {
      const cityObj = this.CITIES_DE[Math.floor(Math.random() * this.CITIES_DE.length)];
      return cityObj.city;
    }

    if (name.includes('iban') || type === 'IBAN') {
      const randDigits = Math.floor(100000000000000000 + Math.random() * 900000000000000000);
      return `DE89370400440532${randDigits}`.substring(0, 22);
    }

    if (name.includes('telefon') || name.includes('phone') || type === 'PHONE') {
      const prefix = ['0170', '0171', '0175', '0151', '0160', '030', '089', '040'][Math.floor(Math.random() * 8)];
      const num = Math.floor(1000000 + Math.random() * 9000000);
      return `+49 ${prefix} ${num}`;
    }

    if (name.includes('status')) {
      const statuses = ['ENTWURF', 'OFFEN', 'IN_BEARBEITUNG', 'ABGESCHLOSSEN', 'STORNIERT', 'AKTIV'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }

    if (type === 'BOOLEAN') {
      return Math.random() > 0.3;
    }

    if (type === 'DATE') {
      const d = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 3600 * 1000));
      return d.toISOString().split('T')[0];
    }

    if (type === 'DATETIME' || type === 'TIMESTAMP') {
      const d = new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 3600 * 1000));
      return d.toISOString();
    }

    if (type === 'CURRENCY' || type === 'DECIMAL' || name.includes('preis') || name.includes('betrag') || name.includes('amount') || name.includes('summe')) {
      return parseFloat((Math.random() * 500 + 10).toFixed(2));
    }

    if (type === 'INTEGER' || type === 'INT' || type === 'BIGINT') {
      if (name.includes('menge') || name.includes('anzahl') || name.includes('quantity')) {
        return Math.floor(Math.random() * 20) + 1;
      }
      return Math.floor(Math.random() * 1000) + 1;
    }

    if (type === 'JSON') {
      return JSON.stringify({ metaKey: `val_${index}`, verified: true, tags: ['auto_gen', 'mock'] });
    }

    return `Wert ${index}`;
  }

  private static topologicalSortTables(tables: Table[], relationships: Relationship[]): string[] {
    const tableIds = tables.map(t => t.id);
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    tableIds.forEach(id => {
      inDegree[id] = 0;
      adjList[id] = [];
    });

    relationships.forEach(rel => {
      if (adjList[rel.fromTableId] && inDegree[rel.toTableId] !== undefined) {
        adjList[rel.fromTableId].push(rel.toTableId);
        inDegree[rel.toTableId]++;
      }
    });

    const queue = tableIds.filter(id => inDegree[id] === 0);
    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList[current] || [];
      neighbors.forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Append any tables in cycle or disconnected
    tableIds.forEach(id => {
      if (!result.includes(id)) {
        result.push(id);
      }
    });

    return result;
  }
}
