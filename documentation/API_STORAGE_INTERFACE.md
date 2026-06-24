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

---

## 5. Expanded Component Interaction & Navigation APIs

The following schema extensions and runtime APIs have been added to support direct linking from standard table views to details-pages or custom layouts while dynamically forwarding key-value parameters.

### 5.1 Component Attribute Schema Additions

To support advanced interactions, components of type `table_view` support the following optional attributes within their `props` payload:

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `enableSelection` | `boolean` | Enables single-row click parameter selection and page navigation. |
| `selectionParamName` | `string` | The parameter name used to hold the selected record ID (defaults to `selectedId`). |
| `detailsPageId` | `string` | Optional target page ID to navigate to when a row is clicked or the "Details" button is pressed. |
| `enableCrudActions` | `boolean` | Displays "Details", "Bearbeiten", and "Löschen" buttons on table rows. |
| `createFormId` | `string` | Form ID bound to the "Neu hinzufügen" table button. |
| `editFormId` | `string` | Form ID bound to the row's "Bearbeiten" button. |

### 5.2 Dynamic Page Context & Navigation Contracts

Our client-side container exposes the `PageViewContext` to all live-rendered nodes. This context has been expanded to support payload forwarding during transitions:

```typescript
export const PageViewContext = createContext<{
  // Opens a custom form in a modal window with an optional preset mode
  openFormModal: (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void) => void;
  // Triggers a standardized confirmation popup
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  // Transition to a targeted page, resetting parameters or merging an initial state payload
  navigate: (pageId: string, initialParams?: Record<string, any>) => void;
}>({
  openFormModal: () => {},
  showConfirm: () => {},
  navigate: () => {}
});
```

### 5.3 FormView Preset Creation Mode

The `FormView` component supports an `initialMode` prop:

```typescript
interface FormViewProps {
  // ... existing props ...
  initialMode?: 'create' | 'edit' | 'view';
}
```

When `initialMode === 'create'`, the form automatically invokes its creation sequence without requiring the end-user to perform an initial record setup click. This parameter maps back to database-agnostic insert commands (`INSERT INTO ...`).

---

## 6. Role-Based Access Control (RBAC), Subpage Auto-Takeover & API Inspector APIs

To support multi-user levels (CRUD controls) and highly automated parameter consumption on detail sub-pages, the following database-agnostic schemas and APIs have been integrated.

### 6.1 Role-Based Access Control (RBAC) / Userlevels

To restrict visibility or actions dynamically based on user privilege levels, all custom components in `CustomPage` support an optional list of allowed roles:

```typescript
export interface PageComponentProps {
  // ... existing props ...
  allowedRoles?: string[]; // Array of user roles authorized to view this node (e.g., ['Admin', 'Manager'])
}
```

#### Client-Side Resolution Contract
During the live rendering pass inside `LiveNode`, the runtime context checks the simulated user role. If `allowedRoles` is defined and not empty, the component evaluates access:

$$\text{Visible} = (\text{allowedRoles} = \emptyset) \lor (\text{activeRole} \in \text{allowedRoles})$$

If evaluation fails, the element is completely unmounted, safeguarding transactional capabilities.

---

### 6.2 Page-Level Relationships & Parameter Auto-Takeover

To automate detail and subpage binding (avoiding verbose, manual data passing), pages support parent-child associations and formal parameter contracts:

```typescript
export interface CustomPage {
  id: string;
  name: string;
  isSubpage?: boolean;       // Marks page as a child detail/sub-view
  parentPageId?: string;     // References the parent CustomPage ID
  expectedParams?: string[]; // Formal declaration of parameters expected (e.g., ["customerId", "orderId"])
  layout: PageComponent;
}
```

#### 6.2.1 Automatic Parameter Takeover Algorithm
When embedding a child page via a `subpage_container`, the system automates matching name bindings. The parameters are passed down through nested React context provider stacks:

1. **Declared Match Takeover**: For each parameter $p \in \text{expectedParams}$:
   * If parent `pageParams[p]` exists, child parameters are populated automatically: $\text{childParams}[p] \leftarrow \text{parentParams}[p]$.
   * If local loop row `context[p]` exists, the child takes it over: $\text{childParams}[p] \leftarrow \text{context}[p]$.
2. **Explicit Mapping Overrides**: Explicit mappings declared on `parameterMappings` override auto-takeover where custom names differ. Placeholder variables formatted with double-curly braces (e.g. `{{id}}`) are dynamically evaluated in-flight from current context fields.

---

### 6.3 Sandbox API & Live Inspector Contracts

To accelerate full-stack API integration, the system exposes standardized mock endpoints matching native backends. Developers can inspect these endpoints in real time via the **API Inspector**:

#### 6.3.1 Get Table Data
* **Endpoint**: `GET /api/tables/:tableName`
* **Response Payload**: `Array<Record<string, any>>`
* **Mock Action**: Executes a client-side select retrieve.

#### 6.3.2 Get Query Output
* **Endpoint**: `GET /api/queries/:queryId`
* **Response Payload**: `Array<Record<string, any>>`
* **Mock Action**: Executes the configured join query with column alias maps.


