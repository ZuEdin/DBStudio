# Phase 1: Security, Authentifizierung & Rollen (RBAC)

Dies ist die **erste Entwicklungsphase**. Ohne ein definiertes Rollen- und Sicherheitssystem kann später keine geschützte Navigation aufgebaut werden. Diese Phase legt das Fundament für die App-Sicherheit, sowohl im Frontend als auch Backend.

## 1.1 Datenmodellierung (DB Studio Pro State)
*   **Userlevels / Roles**: Definition des Rollen-Modells im App-Kontext (z. B. `Admin`, `Editor`, `Reader`).
*   **AuthConfig State**: Speicherung, welche Art des Logins genutzt wird (SQL Datenbank oder Active Directory).

## 1.2 User Interface (Konfiguration im Studio)
Erweiterung des **Security Managers** (oder Environment-Settings in der Sidebar):
*   Ein UI-Menü, in dem der App-Ersteller die "App-Level-Rollen" definiert.
*   Bei der Auswahl "Active Directory": Bereitstellung einer Mapping-Tabelle zum Verknüpfen von App-Rollen mit physischen AD-Gruppen (z.B. `CN=AppAdmins`).

## 1.3 Backend Generatoren (Die Sicherheits-Schranke)
Das generierte Backend (Node.js, C#, etc.) erzwingt immer das tatsächliche Recht.
*   **Login Endpoints**: Code-Generierung für die `/api/auth/login` und `/register` Routen.
*   **AD-Integration (LDAP)**: Wenn Windows-Auth gewählt wird, baut der Generator eine LDAP-Binding-Logik (z.B. `activedirectory2` für Node.js), überprüft die Domain-Credentials und übersetzt die komplexen AD-Gruppen transparent in ein einfaches JSON-Web-Token (JWT) mit einem Role-Claim: `{ roles: ['Admin'] }`. So bleibt das Frontend LDAP-agnostisch.
*   **Route-Middleware**: Generierung generischer Authentifizierungs-Middlewares, die das Token checken (`restrictRoles(['Admin'])`).

## 1.4 Frontend Generatoren (Das Login-Erlebnis)
*   **Login View**: Ausrollen der automatisierten `Login.tsx` / `login.component.ts` auf Basis des gewählten Frameworks.
*   **Auth Service**: Aufbau eines globalen Services zur sicheren Verwaltung des JWTs und zum Bereitstellen von reaktiven States (bspw. `isLoggedIn`, `currentUserRoles`).

---
*Nächster Schritt (Phase 2): Darauf aufbauend konfigurieren wir den visuellen Drag & Drop Designer (siehe `02_PHASE_NAVIGATION_UND_MENUES.md`), in dem die hier erstellten Rollen den Menüpunkten zugewiesen werden.*
