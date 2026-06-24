# Unified Storage API & Architecture Guide

This document defines the interface and data flow design of the persistence layer in **DB Studio Pro**, showcasing how the current **IndexedDB** solution can be seamlessly transitioned or augmented with external backends like **PostgreSQL**, **MySQL**, or standard relational REST/GraphQL APIs without breaking front-end contracts.

---

## 1. Core Architectural Strategy

To prevent coupling components directly to any specific storage engine, we employ the **Repository Pattern** and abstract all async data access operations behind clean, promise-based interfaces.

```
+--------------------------------------+
|          React Components /          |
|         useProjectStore (Zustand)    |
+--------------------------------------+
                   |
                   v (Unified API Methods)
+--------------------------------------+
|       storageService Interface       |
+--------------------------------------+
                   |
        +----------+----------+
        |                     |
        v (Current)           v (Future Expansion / Backend Integration)
+---------------+     +-------------------------------------------------+
|  IndexedDB    |     | REST / GraphQL API Proxies                      |
|  (Client-Side)|     | - POST /api/projects  -> MySQL / PostgreSQL     |
|  Local Cache  |     | - GET  /api/projects  -> SQL Server / SQLite    |
+---------------+     +-------------------------------------------------+
```

---

## 2. Standard API Interface Definitions

These types are declared as part of our global model layer. They guarantee type-safety regardless of the target engine.

```typescript
export interface Project {
  id: string;              // Primary key
  name: string;            // Project name
  description?: string;    // Optional meta info
  tables: TableSchema[];   // Relational design tables
  queries: Query[];        // Configured queries and visual filters
  forms: Form[];          // Drag-and-drop form specifications
  pages: CustomPage[];     // Custom Page layouts (including Repeater, Table, Dropdown components)
  createdAt: number;       // Epoch milliseconds
  lastModified: number;    // Epoch milliseconds
}
```

---

## 3. Storage Service Functions (API Contracts)

The storage operations are decoupled using standard async functions returning standard Promises:

### `getAllProjects()`
* **Signature**: `() => Promise<Project[]>`
* **Description**: Retrieves all saved projects sorted by modification date.
* **Migration path**:
  * *IndexedDB*: Queries the Object Store `projects` and sorts client-side.
  * *SQL/Backend*: `GET /api/projects` executing `SELECT * FROM projects ORDER BY lastModified DESC`.

### `getProjectById(id)`
* **Signature**: `(id: string) => Promise<Project | undefined>`
* **Description**: Fetches a single project structure by its primary key.
* **Migration path**:
  * *IndexedDB*: `store.get(id)`.
  * *SQL/Backend*: `GET /api/projects/:id` executing `SELECT * FROM projects WHERE id = ?`.

### `saveProjectToStorage(project)`
* **Signature**: `(project: Project) => Promise<void>`
* **Description**: Performs an upsert operation (inserts a new project or updates an existing one).
* **Migration path**:
  * *IndexedDB*: `store.put(project)`.
  * *SQL/Backend*: `POST /api/projects` executing `INSERT INTO ... ON DUPLICATE KEY UPDATE` (MySQL) or `INSERT ... ON CONFLICT (id) DO UPDATE` (PostgreSQL).

### `deleteProjectFromStorage(id)`
* **Signature**: `(id: string) => Promise<void>`
* **Description**: Deletes a project permanently.
* **Migration path**:
  * *IndexedDB*: `store.delete(id)`.
  * *SQL/Backend*: `DELETE /api/projects/:id` executing `DELETE FROM projects WHERE id = ?`.

---

## 4. DB Migration Schema Example (SQL DDL Equivalent)

If you migrate from **IndexedDB** to a relational database (**MySQL** / **PostgreSQL**), the schema maps to the following structured tables:

```sql
-- Projects main table
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at BIGINT NOT NULL,
    last_modified BIGINT NOT NULL,
    -- JSON blobs for complex designer configurations to maintain structure flexibility
    tables_json JSON,
    queries_json JSON,
    forms_json JSON,
    pages_json JSON
);

-- Index for fast sorting of active workspaces
CREATE INDEX idx_projects_last_modified ON projects(last_modified DESC);
```

By storing layouts and schemas as structured JSON columns inside PostgreSQL or MySQL, the React-side query and form designers require **exactly zero adjustments** when moving from client-side IndexedDB databases to secure full-scale cloud SQL servers.
