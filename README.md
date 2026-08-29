# 🚀 DB Studio PRO & Local Bridge

**Von der alten Access-Datenbank zur modernen Multi-Stack-App in Rekordzeit.**
DB Studio PRO ist eine revolutionäre Rapid Application Development (RAD) Plattform, die es ermöglicht, datenbankgestützte Anwendungen und Enterprise-Architekturen visuell zu entwerfen. Was früher Monate an Entwicklungszeit erforderte, lösen Sie heute über eine intuitive Drag-and-Drop-Oberfläche – komplett ohne Vendor Lock-in und mit 100 % Datenhoheit.

---

### 📖 Projekt-Status & Philosophie
*   **Version:** DB Studio Pro v0.8.5 Beta • Local Bridge v0.9.2 Beta
*   **Status:** Vor-1.0 Entwicklungsphase (Pre-1.0) • *Be Honest*-Methode
*   **Entwickler:** Edin Zubovic (Solo-Entwickler, über 14 Monate kontinuierliche Entwicklungsarbeit)
*   **Architektur:** 100% Local-First Web-Suite (React/TypeScript) + Nativer Windows Host-Daemon (Node.js/C# OLEDB)

#### 📌 Die „Be Honest“-Methode
Softwareentwicklung ist ein stetiger Prozess der Evolution. DB Studio Pro verfolgt einen transparenten, ehrlichen Ansatz:
*   **Stabil & Zuverlässig:** Das relationale Schema-Design, Formulare mit N-Ebenen Subforms, der visuelle No-Code Query-Builder, Code-Generatoren für .NET 10 / Node.js / PHP / React sowie der native Windows-Daemon (Local Bridge) zur MS-Access-Transpilierung sind voll einsatzfähig.
*   **Kontinuierliche Optimierung:** Im täglichen Praxiseinsatz werden Randfälle und Treiberbesonderheiten (wie z. B. spezielle OLEDB-Datentypen in alten Access-MDBs) offen dokumentiert und schrittweise behoben.
*   **Kein Vendor Lock-in:** Alle generierten Quellcodes gehören zu 100% dem Entwickler und lassen sich vollständig außerhalb von DB Studio kompilieren. Keine Lizenzkosten.

---

## 🎯 Zielgruppen & Anwendungsfälle

### 💡 Für Kenner (IT-Admins, Projektmanager & Fachabteilungen)
Machen Sie sich unabhängig von langen IT-Warteschlangen und digitalisieren Sie Ihre Geschäftsprozesse selbst:
*   **Smart Legacy-Migration:** Überführen Sie alte MS Access-Datenbanken (.accdb/.mdb), Excel-Tabellen oder SharePoint-Listen durch intelligente Import-Wizards automatisch in moderne, relationale Strukturen.
*   **Visuelles Design:** Datenbanken (ER-Diagramme), UIs und Logik einfach per Drag & Drop erstellen.
*   **Visuelle Workflows:** Automatisieren Sie Prozesse, Daten-Validierungen und E-Mail-Versand – ganz ohne Code.
*   **Reports & Dashboards:** Generieren Sie mit dem Report-Wizard auf Knopfdruck interaktive Auswertungen und druckreife Berichte.
*   **Team Collaboration:** Arbeiten Sie in Echtzeit am selben Projekt (Live-Cursor, Chat, Kanban-Board).

### ⚙️ Für Profis (Software-Entwickler, Architekten & Agenturen)
DB Studio PRO ist kein geschlossener Baukasten, sondern ein mächtiger Multi-Stack-Codegenerator, der Boilerplate eliminiert:
*   **Multi-Stack Export-Engine:** Generieren Sie produktionsreifen Quellcode für:
    *   **Frontend:** React, Angular, Vue, HTML/CSS (mit Tailwind CSS)
    *   **Backend:** Node.js (Express), C# (.NET 10), Python, PHP (PDO), Laravel
    *   **Desktop & Mobile:** Electron, Tauri, .NET MAUI
    *   **ORMs:** Drizzle, Prisma, TypeORM
*   **Enterprise Security & Multi-Tenancy:** Out-of-the-Box Unterstützung für mandantenfähige Architekturen, feingranulare Rollenverteilung (RBAC) und Active Directory (AD) Integration.
*   **API-First:** Generieren Sie REST- oder GraphQL-APIs automatisch aus Ihrem Schema.
*   **CI/CD & DevOps-Ready:** Automatisch erstellte Dockerfiles, Infrastructure-as-Code und GitHub/GitLab-Actions.
*   **Grenzenlose Erweiterbarkeit:** Überschreiben Sie generierten Code, nutzen Sie eigene SQL-Skripte und binden Sie externe APIs nativ an.

---

## 🛠️ Das Kern-Arsenal (Plattform-Features)

| Bereich | Version | Reifegrad | Status | Beschreibung |
| :--- | :--- | :--- | :--- | :--- |
| **1. In-Browser Designer & UI** | v0.8.5 | **~85%** | Funktional (Feinschliff) | Visueller ER-Canvas & Schema-Designer, Drag-&-Drop Formular-Studio (1–4 Spalten & Subforms), No-Code SQL-Designer, Berichts-Druckengine & .dbsp Workflow. |
| **2. Code-Generierung** | v0.8.5 | **~80%** | Standard-Exporte aktiv | C# ASP.NET Core (.NET 10), Node.js Express, PHP 8.x PDO, React, Angular, SQL DDL. Deterministic AST- und String-Templating. |
| **3. DB Studio Local Bridge** | v0.9.2 | **~75%** | Beta-Betriebsbereit | Nativer Windows-Daemon für Access-Migration (.accdb/.mdb), OLEDB 64-Bit, Desktop-Installer Builder (Tauri/Electron), Topologischer Live Data-Sync, Git/FTP Deployer & PHP Relay (v2.0.0). |

---

## ⚡ Der native 4-Schritte-Workflow: MS Access zu DB Studio Pro

Die **DB Studio Local Bridge** fungiert als intelligentes Bindeglied zur Legacy-Migration:

1.  **Access-Datei ablegen:** Ziehen Sie eine beliebige `.accdb` oder `.mdb` Datei per Drag & Drop in die Bridge.
2.  **Live-Analyse & Transpiler:** Die Bridge analysiert Tabellen, Relationen und transpiliert Access-VBA-Abfragen (wie `NZ`, `IIF`, `Format`) in ANSI-SQL.
3.  **.dbsp herunterladen:** Klicken Sie auf den Download-Button, um die fertige native `.dbsp` Projektdatei (inklusive aller Daten & ER-Layout) zu erhalten.
4.  **In DB Studio Pro öffnen:** Laden Sie die `.dbsp` in DB Studio Pro. ER-Diagramm, Formulare und Abfragen sind sofort einsatzbereit!

---

## 🚀 Schnellstart & Installation nach Export

Beispiel für den Start eines exportierten Node.js / React Stacks:

```bash
# 1. Exportiertes ZIP-Archiv entpacken
unzip mein_db_studio_projekt.zip
cd mein_db_studio_projekt

# 2. Abhängigkeiten installieren
npm install

# 3. Datenbank-Schema (z.B. MySQL) importieren
mysql -u root -p meine_db < database/schema.sql

# 4. Backend-Server starten
npm run dev
