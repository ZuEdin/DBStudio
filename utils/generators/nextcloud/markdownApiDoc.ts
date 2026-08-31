import { Table, Query, Form, Report } from '../../../types/index';
import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generateNextcloudApiMarkdown = (
  config: NextcloudAppConfig,
  tables: Table[] = [],
  queries: Query[] = [],
  forms: Form[] = [],
  reports: Report[] = []
): string => {
  const appId = config.appId || 'dbs_custom_app';
  const appName = config.appName || 'DB Studio App';

  const tableDocs = tables.map(table => {
    const slug = table.name.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    const fields = table.fields || [];
    const pkCol = fields.find(c => c.isPrimaryKey)?.name || 'id';
    const nonPkCols = fields.filter(c => !c.isPrimaryKey);

    const samplePayload = nonPkCols.reduce((acc: any, col) => {
      if (col.type.includes('int')) acc[col.name] = 123;
      else if (col.type.includes('bool')) acc[col.name] = true;
      else if (col.type.includes('date')) acc[col.name] = '2026-08-31';
      else if (col.type.includes('float') || col.type.includes('currency')) acc[col.name] = 49.90;
      else acc[col.name] = `Beispiel ${col.name}`;
      return acc;
    }, {});

    return `### Tabelle: \`${table.name}\` (REST-Routen: \`/apps/${appId}/api/v1/${slug}\`)

#### 1. Alle Datensätze abrufen
- **Methode:** \`GET\`
- **URL:** \`/apps/${appId}/api/v1/${slug}\`
- **Query-Parameter:**
  - \`limit\` (int, optional, Default: 100)
  - \`offset\` (int, optional, Default: 0)
  - \`search\` (string, optional)
- **Response:** \`200 OK (JSON Array)\`
\`\`\`json
[
  {
    "${pkCol}": 1,
${nonPkCols.map(c => `    "${c.name}": ${JSON.stringify(samplePayload[c.name])}`).join(',\n')}
  }
]
\`\`\`

#### 2. Einzelnen Datensatz abrufen
- **Methode:** \`GET\`
- **URL:** \`/apps/${appId}/api/v1/${slug}/{id}\`
- **Response:** \`200 OK\` oder \`404 Not Found\`

#### 3. Neuen Datensatz erstellen
- **Methode:** \`POST\`
- **URL:** \`/apps/${appId}/api/v1/${slug}\`
- **Body:** \`application/json\`
\`\`\`json
${JSON.stringify(samplePayload, null, 2)}
\`\`\`
- **Response:** \`201 Created\`

#### 4. Datensatz aktualisieren
- **Methode:** \`PUT\`
- **URL:** \`/apps/${appId}/api/v1/${slug}/{id}\`
- **Body:** \`application/json\`
- **Response:** \`200 OK\`

#### 5. Datensatz löschen
- **Methode:** \`DELETE\`
- **URL:** \`/apps/${appId}/api/v1/${slug}/{id}\`
- **Response:** \`200 OK\` (\`{"success": true}\`)

#### 6. Batch-Insert
- **Methode:** \`POST\`
- **URL:** \`/apps/${appId}/api/v1/${slug}/batch\`
- **Body:** \`application/json\` (Array von Objekten)
- **Response:** \`201 Created\` (\`{"inserted": 10}\`)
`;
  }).join('\n---\n\n');

  return `# Nextcloud App REST API & Architektur-Spezifikation
**App:** ${appName} (\`${appId}\`)  
**Version:** ${config.version || '1.0.0'}  
**Lizenz:** ${config.license || 'AGPL-3.0-or-later'}  
**Generiert von:** DB Studio Pro  

---

## 1. Architektur-Übersicht

Diese Nextcloud-App basiert auf dem standardisierten **OCP App-Framework (Open Collaboration Platform)** und folgt dem MVC-Muster:

1. **Dependency Injection & Autowiring:**
   - Alle Controller fordern benötigte Services (\`IRequest\`, \`IDBConnection\`, \`IUserSession\`, Custom Services) im Konstruktor an.
   - Nextcloud instanziiert und injiziert diese vollautomatisch.

2. **Parameter Mapping:**
   - Parameter im HTTP POST/PUT Body (JSON) werden von Nextcloud automatisch auf die Funktionsargumente der Controller-Methoden gemappt.

3. **Multi-Datenbank-Kompatibilität (Doctrine DBAL):**
   - Der Service-Layer nutzt \`OCP\\DB\\QueryBuilder\\IQueryBuilder\`.
   - Unterstützt transparent **MySQL / MariaDB**, **PostgreSQL** und **SQLite**, ohne dass SQL-Anweisungen manuell umgeschrieben werden müssen.

4. **Automatische Schema-Migration:**
   - \`lib/Migration/VersionYYYYMMDD...php\` nutzt \`OCP\\DB\\ISchemaWrapper\`.
   - Bei Installation oder Update über \`occ app:enable ${appId}\` werden Tabellen, Spalten und Indizes idempotent angelegt.

---

## 2. Authentifizierung & Sicherheit

- **Intern (Nextcloud Web / Vue.js):**
  - Authentifizierung erfolgt transparent über die Nextcloud-Session mit CSRF-Token (automatisch über \`@nextcloud/axios\`).
- **Extern (REST API Clients / Mobile Apps / Webhooks):**
  - **HTTP Basic Auth** mit Nextcloud Benutzername & **App-Passwort** (empfohlen).
  - **Bearer Token / OAuth2** (wenn Nextcloud OAuth2-App aktiv ist).
- **Attribute:**
  - \`#[NoAdminRequired]\`: Gewöhnliche angemeldete Benutzer können auf die API zugreifen.
  ${config.enablePublicNoCSRF ? '- `#[NoCSRFRequired]`: Externe REST-Aufrufe ohne CSRF-Token erlaubt.\n' : ''}- \`#[CORS]\`: Erlaubt Cross-Origin Aufrufe, falls konfiguriert.

---

## 3. REST-API-Endpunkte

### System- & Meta-Endpunkte

#### Schema-Metadaten abrufen
- **GET** \`/apps/${appId}/api/v1/schema\`
- Liefert die Definition aller Tabellen, Spalten und Datentypen.

#### Health- & Status-Prüfung
- **GET** \`/apps/${appId}/api/v1/stats\`
- Liefert Status, Tabellenanzahl und DB-Präfix.

---

${tableDocs}

---

## 4. Installation & Deployment in Nextcloud

1. **Ordner kopieren:**
   - Entpacke das ZIP in das Nextcloud \`apps/\`-Verzeichnis:
     \`\`\`bash
     cd /var/www/nextcloud/apps/
     unzip ${appId}-v${config.version || '1.0.0'}.zip
     \`\`\`

2. **Rechte setzen:**
   \`\`\`bash
   chown -R www-data:www-data /var/www/nextcloud/apps/${appId}
   \`\`\`

3. **App aktivieren:**
   \`\`\`bash
   sudo -u www-data php /var/www/nextcloud/occ app:enable ${appId}
   \`\`\`

4. **Frontend-Build (optional bei Entwickler-Export):**
   \`\`\`bash
   npm install
   npm run build
   \`\`\`
`;
};
