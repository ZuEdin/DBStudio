# Phase 2: Drag & Drop Navigation & Page Designer

Diese **zweite Entwicklungsphase** baut strikt auf den Rollen und Userlevels aus Phase 1 auf. Hier erstellen wir den visuellen Editor im DB Studio Pro, der bestimmt, wie die finale App strukturiert ist, wie das Rooting stattfindet und wer welche Menüpunkte sehen darf.

## 2.1 Visueller Editor (Das DB Studio Pro UI)
Ein neues "Navigation Designer" Tab im App-Builder:
*   **Werkzeugkasten (Links)**: Enthält alle generierbaren Komponenten (Tabellen, Formulare, Custom Pages).
*   **Menü-Baum (Mitte)**: Eine Hierarchie aus Ordnern und Links. Komponenten aus dem Werkzeugkasten werden per intelligentem Drag & Drop hier positioniert, gruppiert und strukturiert.
*   **Eigenschaften Inspector (Rechts)**: Legt Metadaten für das selektierte Menü-Element fest:
    *   Anzeigename (Titel im Frontend)
    *   Icon (z.B. Lucide Icons)
    *   **Sichtbarkeit & Rollen**: Ein Multiselect-Dropdown, das von den in *Phase 1* definierten Userlevels (Rollen) versorgt wird (z. B. "Diesen Reiter nur anzeigen für: `Admin`").

## 2.2 Der abstrakte Syntax-Baum (JSON State)
Die konfigurierte Drag & Drop Oberfläche generiert keinen direkten Code, sondern aktualisiert im Hintergrund ein framework-agnostisches hierarchisches JSON-Objekt (`appMenuConfig`).
Das strikte Entkoppeln erlaubt es dem Generator, dieses JSON plattformunabhängig (in Vue, Angular, React oder Native) zu übersetzen.

## 2.3 Code-Generierung (Aus dem Baum wird eine App)
Klickt der User auf "Generieren", iterieren die Transpiler über das JSON:

**Frontend Routing & Navigation Guards:**
*   **Router-Config**: Jede Unterseite wird als Route eingetragen und mit einem Metadatan-Tag (z.B. `data: { roles: ['Admin'] }` in Angular, `meta.requiresAuth` in Vue, oder `<ProtectedRoute allowedRoles={['Admin']}>` in React) maskiert.
*   **Sidebars / Layout**: Es wird eine dynamische Menü-Komponente (`Sidebar.tsx`, `Sidebar.vue`) generiert, in der Elemente mittels Conditional Rendering (`v-if` / `*ngIf` / `{isAuth && ...}`) bedingt gerendert werden. Loggt sich ein User ohne die Rolle "Admin" ein, wird der Navigationspunkt erst gar nicht in das DOM injiziert.

**Backend Endpoints:**
*   Da Frontend-Sicherheit manipulierbar ist, iteriert auch der Backend-Generator über das UI-Menü. Sperrt ein User im Drag & Drop Editor die Page "Gehalt" auf die AD-Gruppe "HR", so versieht der Backend-Generator die dazugehörige REST API (z.B. `/api/gehalt/`) automatisch mit der in Phase 1 erstellten Security-Middleware (HTTP 403 Forbidden Response bei falschen Tokens).

---
*Mit Abschluss der Phasen 1 und 2 ist DB Studio Pro in der Lage, hochgesicherte, rollenbasierte Enterprise-Applikationen (inkl. Active Directory Support) mit dynamischen Menüs völlig automatisiert auf Knopfdruck zu generieren.*
