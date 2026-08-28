# Branchen-Schnittstellen (GAEB, DATANORM, ZUGFeRD) – Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Schnittstellen-Spezifikation, Parser/Generator-Konzepte & Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Übersicht der Baubranchen-Standards](#-1-übersicht-der-baubranchen-standards)
2. [📐 2. GAEB Datenaustausch (DA XML, GAEB 90, GAEB 2000)](#-2-gaeb-datenaustausch-da-xml-gaeb-90-gaeb-2000)
3. [📦 3. DATANORM 4.0 & 5.0 Großhandels-Kataloge](#-3-datanorm-40--50-großhandels-kataloge)
4. [💶 4. E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)](#-4-e-rechnung-zugferd-22--xrechnung-factur-x)
5. [🔄 5. Datenmapping & Import/Export Pipeline](#-5-datenmapping--importexport-pipeline)
6. [📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap](#-6-priorisierte-umsetzungs-checkliste--roadmap)

---

## 🟢 1. Übersicht der Baubranchen-Standards

- [ ] **GAEB (Gemeinsamer Ausschuss Elektronik im Bauwesen)**: Universeller Standard für Ausschreibungen und Angebote in Deutschland und Österreich.
- [ ] **DATANORM**: Dateiformat zum Einlesen von Artikelstammdaten und Einkaufspreisen von Baustoff-, Sanitär- und Elektrogroßhändlern.
- [ ] **ZUGFeRD / XRechnung**: Gesetzlicher Standard für elektronische Rechnungsstellung an öffentliche und B2B-Auftraggeber.

---

## 📐 2. GAEB Datenaustausch (DA XML, GAEB 90, GAEB 2000)

### 2.1 Unterstützte Phasen (Austauschphasen)
- [ ] **Phase 81 (X81 / D81 / P81)**: *Leistungsbeschreibung (Ausschreibung / Vorabzug)*.
- [ ] **Phase 82 (X82 / D82 / P82)**: *Kostenansatz (Kostenschätzung durch Planer)*.
- [ ] **Phase 83 (X83 / D83 / P83)**: *Angebotsaufforderung (Ausschreibung zur Bepreisung)*.
- [ ] **Phase 84 (X84 / D84 / P84)**: *Angebotsabgabe (Ausgefüllte Einheitspreise des Bauunternehmens)*.
- [ ] **Phase 86 (X86 / D86 / P86)**: *Auftragserteilung (Vergabe-LV mit Festpreisen)*.

### 2.2 Parser & Generator Architektur
- [ ] **GAEB DA XML 3.2 & 3.3 Engine**:
  - Validierung gegen offizielle XSD-Schemas des GAEB.
  - Hierarchische Rekursion: Projekt ➔ Gewerk ➔ Los ➔ Titel ➔ Untertitel ➔ Position.
  - Unterstützung für Langtexte (HTML, RTF, reiner Text) und Hinweistexte.
- [ ] **GAEB 90 / 2000 Legacy Parser**:
  - Feste Satzlängen (Spaltenformat) und Zeilenumbruch-Verarbeitung.

---

## 📦 3. DATANORM 4.0 & 5.0 Großhandels-Kataloge

### 3.1 Dateitypen & Satzarten
- [ ] **`DATANORM.001`**: Neuanlage von Artikelstammdaten (A-Satz, B-Satz).
- [ ] **`DATANORM.WRG`**: Warengruppendatei.
- [ ] **`DATANORM.RAB`**: Rabattgruppendatei für individuelle Firmenkonditionen.
- [ ] **`DATPREIS.001`**: Reine Preisänderungsdatei (P-Satz).

### 3.2 Parsing & Datenbank-Import
- [ ] **Streaming-Parser für Großdateien**:
  - Asynchrones Chunking (ermöglicht das Einlesen von Katalogen mit >100.000 Artikeln ohne UI-Blockade).
- [ ] **Kalkulationsaufschlag**:
  - Automatisches Berechnen von Verkaufspreisen basierend auf Rabattgruppe und Marge:  
    $\text{VK} = \text{Brutto-Listenpreis} \times (1 - \text{Rabatt}) \times (1 + \text{Aufschlag})$.

---

## 💶 4. E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)

### 4.1 Hybrid-Format & Profile
- [ ] **Profil "COMFORT" / "EXTENDED"**: Vollständige strukturierte Positionsdaten im XML.
- [ ] **Profil "MINIMUM" / "BASIC"**: Kopf- und Summenprüfung.
- [ ] **XRechnung-Profil (Profil CEN / EN 16931)**: Vollständige Konformität für Bundes- und Landesbehörden (Leitweg-ID).

### 4.2 PDF/A-3 Generierung
- [ ] Einbettung der `factur-x.xml` in den PDF-Dateianhang (Attachment).
- [ ] Validierung der Pflichtfelder:
  - Käuferreferenz (Leitweg-ID)
  - Bankverbindung (IBAN/BIC)
  - Steuernummern (USt-IdNr.)
  - Zahlungsziel & Skontofristen

---

## 🔄 5. Datenmapping & Import/Export Pipeline

```text
[GAEB / DATANORM / XML]
         │
         ▼ (Parser & Schema-Validierung)
[Standardisiertes Bau-AST / Zwischenformat]
         │
         ├──► [Tabellen-Import: tbl_positions / tbl_articles]
         └──► [Kalkulations-Engine (Calc-MFE)]
```

---

## 📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap

- [ ] **Phase 1: GAEB X83 / X84 XML Parser**:
  - [ ] XML-Schema Parser für GAEB DA XML 3.2.
  - [ ] Import in die Positionstabelle `tbl_positions`.
  - [ ] Export von ausgefüllten Angebotspreisen als `.X84`.
- [ ] **Phase 2: DATANORM 5.0 Importer**:
  - [ ] Satzarten A, B, P und WRG einlesen.
  - [ ] Batch-Insert in den Artikelstamm `tbl_articles`.
- [ ] **Phase 3: ZUGFeRD 2.2 / XRechnung Generator**:
  - [ ] XML-Generator basierend auf `tbl_invoices` Daten.
  - [ ] PDF/A-3 Konverter mit Attachment-Integration im Report Designer.
- [ ] **Phase 4: GAEB 90 Legacy Fallback**:
  - [ ] Textbasierter Spalten-Parser für historische D83/D84 Dateien.
