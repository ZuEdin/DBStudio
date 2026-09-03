# Datenbank-Vorlagen im JSON-Format (Raw GitHub User Content)

Dieser Ordner enthält reine, standalone JSON-Datenbank-Schemas und -Vorlagen. Sie sind **nicht** fest in den Quellcode der Anwendung eingebunden, sondern können über GitHub (z. B. via `raw.githubusercontent.com`) gehostet und remote abgerufen werden.

---

## 📂 Enthaltene Schemas

| Datei | Titel | Kategorie | Tabellen | Features (Forms, Reports, Pages, Queries) |
|---|---|---|---|---|
| `crm_sales_pipeline.json` | **CRM & Vertriebs-Pipeline** | CRM & Vertrieb | Unternehmen, Kontakte, Deals, Aktivitäten | Master-Detail Formulare mit Subforms, Umsatzprognose-Report, Pipeline 360° Dashboard mit KPIs, Filter-Queries |
| `project_task_management.json` | **Projekt- & Aufgabenmanagement** | Projektmanagement | Projekte, Meilensteine, Aufgaben, Zeiterfassung | Projektsteuerungs-Formular mit Task-Subform, Budget-Audit-Report, Scrum/Kanban Cockpit mit KPIs, Prio-Queries |
| `helpdesk_ticketing.json` | **IT-Helpdesk & Kundensupport** | Support & Service | Kunden, Tickets, Nachrichten/Verlauf | Ticketbearbeitung mit Konversations-Subform, SLA-Monatsbericht, Support Command Center Dashboard, Eskalations-Queries |
| `inventory_warehouse.json` | **Warenwirtschaft & Lagerbestand** | Handel & Logistik | Lagerstandorte, Artikel, Lagerbestand, Buchungen | Artikelstammblatt mit Lagerplatz-Subform, Inventur- & Lagerwertbericht, Lager-Cockpit Dashboard, Mindestmengen-Queries |
| `fleet_logistics.json` | **Fuhrpark & Fahrzeug-Disposition** | Mobilität & Fuhrpark | Fahrzeuge, Fahrer, Fahrtenbuch/Touren | Kfz-Stammblatt mit Fahrtenbuch-Subform, HU/AU-Prüfbericht, Fuhrpark-Leitstand Dashboard, Verfügbarkeits-Queries |
| `hr_employee_management.json` | **HR & Personalverwaltung** | HR & Personal | Abteilungen, Mitarbeiter, Urlaubsanträge | Personalakte mit Urlaubsantrags-Subform, Abwesenheits- & Urlaubsübersicht, HR-Cockpit Dashboard, Freigabe-Queries |
| `event_management.json` | **Event- & Konferenz-Management** | Community & Events | Veranstaltungen, Referenten, Sessions, Anmeldungen | Event-Planung mit Session-Subform, Teilnehmer- & Ticket-Report, Konferenz-Leitstand Dashboard, Agenda-Queries |
| `all_templates_bundle.json` | **Gesamt-Bundle (Alle 7 Vorlagen)** | Multi-Domain | Alle Domains | Vollständiges Bundle mit allen Tabellen, Relationen, Forms, Reports, Pages und Queries |
| `registry.json` | **Registry Index** | Metadaten | Index | Übersicht aller Vorlagen mit Dateireferenzen |

---

## 🌐 Verwendung mit `raw.githubusercontent.com`

Sobald dieses Repository auf GitHub liegt, erreichst du die Dateien direkt über die Raw-URL:

### 1. Einzelne Vorlage importieren
```text
https://raw.githubusercontent.com/<DEIN_GITHUB_USER>/<DEIN_REPO>/main/database-schemas-json/crm_sales_pipeline.json
```

### 2. Als externen Vorlagen-Provider in DBStudio hinterlegen
In DBStudio unter **Einstellungen > Vorlagen-Anbieter > Neuen Provider hinzufügen**:
* **Name:** Community Vorlagen (GitHub)
* **Feed-URL:**
  ```text
  https://raw.githubusercontent.com/<DEIN_GITHUB_USER>/<DEIN_REPO>/main/database-schemas-json/all_templates_bundle.json
  ```
DBStudio lädt die Schemas dann live herunter und stellt sie im Vorlagen-Katalog bereit.
