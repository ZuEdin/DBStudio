import { Table, Relationship, Form, Report } from '../../types/index';

export interface DachBusinessTemplate {
  id: string;
  name: string;
  badge: string;
  category: 'Finanzen & Faktura' | 'DACH Standards' | 'Compliance & Recht' | 'Vertrieb & CRM';
  description: string;
  highlights: string[];
  tables: Table[];
  relationships: Relationship[];
  forms: Form[];
  reports?: Report[];
}

export const DACH_BUSINESS_TEMPLATES: DachBusinessTemplate[] = [
  {
    id: 'dach_invoice_vat',
    name: 'Rechnungswesen mit Positionstabelle & Live-MwSt-Rechner',
    badge: '19% / 7% DE & 8.1% CH',
    category: 'Finanzen & Faktura',
    description: 'Vollständige DACH-Rechnungsverwaltung mit 1:n Positionstabelle, automatischer Netto/Brutto-Berechnung, konfigurierbaren Steuersätzen (19% Regel, 7% ermäßigt, 0% steuerfrei, 8.1% CH Normalsatz) und Zahlungsstatus.',
    highlights: [
      'Master-Detail Rechnungsmaske mit Positions-Subform',
      'Automatischer Live-MwSt-Rechner mit Währungswahl (EUR / CHF)',
      '1:n Relation mit Kaskaden-Integrität',
      'Status-Tracking: Offen, Bezahlt, Mahnung, Storniert'
    ],
    tables: [
      {
        id: 'tbl_rechnungen',
        name: 'Rechnungen',
        description: 'Kopfdaten der Ausgangsrechnungen',
        fields: [
          { id: 'fld_rec_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_rec_nr', name: 'rechnungsnummer', type: 'VARCHAR', length: 50, allowNull: false },
          { id: 'fld_rec_kunde', name: 'kunde_name', type: 'VARCHAR', length: 150, allowNull: false },
          { id: 'fld_rec_datum', name: 'rechnungsdatum', type: 'DATE', allowNull: false },
          { id: 'fld_rec_faellig', name: 'faelligkeitsdatum', type: 'DATE' },
          { id: 'fld_rec_waehrung', name: 'waehrung', type: 'VARCHAR', length: 10 },
          { id: 'fld_rec_netto', name: 'summe_netto', type: 'DECIMAL' },
          { id: 'fld_rec_mwst', name: 'summe_mwst', type: 'DECIMAL' },
          { id: 'fld_rec_brutto', name: 'summe_gesamt_brutto', type: 'DECIMAL' },
          { id: 'fld_rec_status', name: 'status', type: 'VARCHAR', length: 30 },
          { id: 'fld_rec_bemerkung', name: 'bemerkung', type: 'TEXT' }
        ],
        data: [
          {
            id: 'REC-2026-001',
            rechnungsnummer: 'RE-2026-1001',
            kunde_name: 'Bavaria Industrie Bau GmbH',
            rechnungsdatum: '2026-03-01',
            faelligkeitsdatum: '2026-03-15',
            waehrung: 'EUR',
            summe_netto: 4500.00,
            summe_mwst: 855.00,
            summe_gesamt_brutto: 5355.00,
            status: 'Offen',
            bemerkung: 'Zahlbar innerhalb 14 Tagen mit 2% Skonto'
          },
          {
            id: 'REC-2026-002',
            rechnungsnummer: 'RE-2026-1002',
            kunde_name: 'AlpenTech Solutions AG (Zürich)',
            rechnungsdatum: '2026-02-20',
            faelligkeitsdatum: '2026-03-06',
            waehrung: 'CHF',
            summe_netto: 7800.00,
            summe_mwst: 631.80,
            summe_gesamt_brutto: 8431.80,
            status: 'Bezahlt',
            bemerkung: 'Schweizer MwSt. Satz 8.1%'
          }
        ]
      },
      {
        id: 'tbl_rechnungspositionen',
        name: 'Rechnungspositionen',
        description: 'Einzelpositionen der Ausgangsrechnungen',
        fields: [
          { id: 'fld_pos_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_pos_rec_id', name: 'rechnung_id', type: 'VARCHAR', length: 36, allowNull: false },
          { id: 'fld_pos_nr', name: 'pos_nr', type: 'INTEGER' },
          { id: 'fld_pos_bez', name: 'bezeichnung', type: 'VARCHAR', length: 255, allowNull: false },
          { id: 'fld_pos_menge', name: 'menge', type: 'DECIMAL' },
          { id: 'fld_pos_einheit', name: 'einheit', type: 'VARCHAR', length: 20 },
          { id: 'fld_pos_preis', name: 'einzelpreis_netto', type: 'DECIMAL' },
          { id: 'fld_pos_mwst_satz', name: 'mwst_satz_prozent', type: 'DECIMAL' },
          { id: 'fld_pos_gesamt_netto', name: 'gesamtpreis_netto', type: 'DECIMAL' },
          { id: 'fld_pos_gesamt_brutto', name: 'gesamtpreis_brutto', type: 'DECIMAL' }
        ],
        data: [
          {
            id: 'POS-1001-1',
            rechnung_id: 'REC-2026-001',
            pos_nr: 1,
            bezeichnung: 'Architektur- & Statikprüfung Bauabschnitt 1',
            menge: 1,
            einheit: 'Pauschale',
            einzelpreis_netto: 3500.00,
            mwst_satz_prozent: 19.00,
            gesamtpreis_netto: 3500.00,
            gesamtpreis_brutto: 4165.00
          },
          {
            id: 'POS-1001-2',
            rechnung_id: 'REC-2026-001',
            pos_nr: 2,
            bezeichnung: 'Baustellen-Dokumentation & Drohnenbefliegung',
            menge: 10,
            einheit: 'Stunden',
            einzelpreis_netto: 100.00,
            mwst_satz_prozent: 19.00,
            gesamtpreis_netto: 1000.00,
            gesamtpreis_brutto: 1190.00
          },
          {
            id: 'POS-1002-1',
            rechnung_id: 'REC-2026-002',
            pos_nr: 1,
            bezeichnung: 'Cloud Database Migration & Performance Tuning',
            menge: 26,
            einheit: 'Stunden',
            einzelpreis_netto: 300.00,
            mwst_satz_prozent: 8.10,
            gesamtpreis_netto: 7800.00,
            gesamtpreis_brutto: 8431.80
          }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_rec_pos',
        fromTableId: 'tbl_rechnungen',
        fromFieldId: 'fld_rec_id',
        toTableId: 'tbl_rechnungspositionen',
        toFieldId: 'fld_pos_rec_id',
        type: '1:n',
        joinType: 'INNER',
        referentialIntegrity: true
      }
    ],
    forms: [
      {
        id: 'frm_rechnungen_master',
        name: 'Rechnungsmaske (DACH)',
        sourceId: 'tbl_rechnungen',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_rec',
          type: 'container',
          width: 'full',
          children: [
            {
              id: 'c_header_info',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700',
              children: [
                { id: 'f_nr', type: 'field', fieldId: 'fld_rec_nr', label: 'Rechnungs-Nr.', width: 'full' },
                { id: 'f_kunde', type: 'field', fieldId: 'fld_rec_kunde', label: 'Empfänger / Kunde', width: 'full' },
                { id: 'f_status', type: 'field', fieldId: 'fld_rec_status', label: 'Bearbeitungsstatus', width: 'full' }
              ]
            },
            {
              id: 'c_dates_currency',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mt-3',
              children: [
                { id: 'f_dat', type: 'field', fieldId: 'fld_rec_datum', label: 'Rechnungsdatum', width: 'full' },
                { id: 'f_faellig', type: 'field', fieldId: 'fld_rec_faellig', label: 'Fälligkeitsdatum', width: 'full' },
                { id: 'f_curr', type: 'field', fieldId: 'fld_rec_waehrung', label: 'Währung', width: 'full' },
                { id: 'f_gesamt', type: 'field', fieldId: 'fld_rec_brutto', label: 'Gesamt Brutto', width: 'full' }
              ]
            },
            {
              id: 'subform_pos',
              type: 'subform',
              label: 'Rechnungspositionen (Netto, MwSt & Brutto)',
              width: 'full',
              subform: {
                formId: 'frm_pos_sub',
                masterLinkFieldId: 'fld_rec_id',
                childLinkFieldId: 'fld_pos_rec_id',
                canAdd: true,
                canEdit: true,
                canDelete: true
              }
            },
            {
              id: 'f_bemerkung',
              type: 'field',
              fieldId: 'fld_rec_bemerkung',
              label: 'Zahlungsbedingungen & Hinweise',
              width: 'full'
            }
          ]
        }
      },
      {
        id: 'frm_pos_sub',
        name: 'Position erfassen',
        sourceId: 'tbl_rechnungspositionen',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_pos',
          type: 'container',
          width: 'full',
          children: [
            { id: 'fp_posnr', type: 'field', fieldId: 'fld_pos_nr', label: 'Pos-Nr', width: '1/4' },
            { id: 'fp_bez', type: 'field', fieldId: 'fld_pos_bez', label: 'Artikel- / Leistungsbezeichnung', width: '3/4' },
            { id: 'fp_menge', type: 'field', fieldId: 'fld_pos_menge', label: 'Menge', width: '1/4' },
            { id: 'fp_einheit', type: 'field', fieldId: 'fld_pos_einheit', label: 'Einheit', width: '1/4' },
            { id: 'fp_preis', type: 'field', fieldId: 'fld_pos_preis', label: 'Einzelpreis Netto', width: '1/4' },
            { id: 'fp_mwst', type: 'field', fieldId: 'fld_pos_mwst_satz', label: 'MwSt % (19/7/8.1)', width: '1/4' },
            { id: 'fp_gnetto', type: 'field', fieldId: 'fld_pos_gesamt_netto', label: 'Gesamt Netto', width: '1/2' },
            { id: 'fp_gbrutto', type: 'field', fieldId: 'fld_pos_gesamt_brutto', label: 'Gesamt Brutto', width: '1/2' }
          ]
        }
      }
    ]
  },
  {
    id: 'dach_din5008_qr',
    name: 'DIN 5008 Briefkopf mit Schweizer QR-Rechnung & E-Rechnung',
    badge: 'DIN 5008 + QR-Bill',
    category: 'DACH Standards',
    description: 'Normkonformer Geschäftsbrief- & Rechnungs-Kopf nach DIN 5008 (Form A/B) mit Rücksendeangabe, Bezugszeichenblock, XRechnung/ZUGFeRD Leitweg-ID und Schweizer EPC QR-Zahlschein.',
    highlights: [
      'DIN 5008 Form A/B Konformität mit Sichtfenster-Präzision',
      'Schweizer QR-Bill Zahlschein & QR-Code Payload Generator',
      'E-Rechnungs Metadaten (Leitweg-ID, BT-10 Einkäufer-Referenz)',
      'Bankverbindungen mit IBAN/BIC Validierungsstruktur'
    ],
    tables: [
      {
        id: 'tbl_din5008_belege',
        name: 'DIN5008_Dokumente',
        description: 'Geschäftsbriefe und DIN 5008 Belege',
        fields: [
          { id: 'fld_din_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_din_absender', name: 'absenderzeile', type: 'VARCHAR', length: 255 },
          { id: 'fld_din_empfaenger', name: 'empfaenger_adresse', type: 'TEXT', allowNull: false },
          { id: 'fld_din_datum', name: 'datum', type: 'DATE', allowNull: false },
          { id: 'fld_din_zeichen', name: 'ihre_zeichen', type: 'VARCHAR', length: 50 },
          { id: 'fld_din_vorgang', name: 'vorgangs_nr', type: 'VARCHAR', length: 50 },
          { id: 'fld_din_leitweg', name: 'leitweg_id_xrechnung', type: 'VARCHAR', length: 50 },
          { id: 'fld_din_betreff', name: 'betreffzeile', type: 'VARCHAR', length: 200, allowNull: false },
          { id: 'fld_din_iban', name: 'iban', type: 'IBAN' },
          { id: 'fld_din_qr_ref', name: 'qr_referenznummer', type: 'VARCHAR', length: 27 },
          { id: 'fld_din_inhalt', name: 'brieftext', type: 'TEXT' }
        ],
        data: [
          {
            id: 'DIN-001',
            absenderzeile: 'AlpenTech DACH GmbH · Poststraße 14 · D-80331 München',
            empfaenger_adresse: 'Zürich Baupartner AG\nFrau Dr. Julia Meier\nBahnhofstrasse 100\nCH-8001 Zürich',
            datum: '2026-03-02',
            ihre_zeichen: 'PO-98214',
            vorgangs_nr: 'VG-2026-88',
            leitweg_id_xrechnung: '04011000-12345-67',
            betreffzeile: 'Auftragsbestätigung und DIN 5008 Abrechnung Projekt Alpha',
            iban: 'DE89370400440532013000',
            qr_referenznummer: '210000000003139471430009017',
            brieftext: 'Sehr geehrte Frau Dr. Meier,\n\nanbei erhalten Sie die normgerechte Aufstellung Ihres Projektes gemäß DIN 5008 und schweizer QR-Zahlteil.'
          }
        ]
      }
    ],
    relationships: [],
    forms: [
      {
        id: 'frm_din5008_editor',
        name: 'DIN 5008 Geschäftsbrief & QR-Maske',
        sourceId: 'tbl_din5008_belege',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_din',
          type: 'container',
          width: 'full',
          children: [
            { id: 'fd_abs', type: 'field', fieldId: 'fld_din_absender', label: 'Absenderzeile (DIN 5008 5mm Fenster)', width: 'full' },
            { id: 'fd_empf', type: 'field', fieldId: 'fld_din_empfaenger', label: 'Empfängeranschrift (Sichtfeld)', width: '1/2' },
            {
              id: 'c_bezug',
              type: 'container',
              className: 'grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200',
              children: [
                { id: 'fd_dat', type: 'field', fieldId: 'fld_din_datum', label: 'Datum', width: 'full' },
                { id: 'fd_zch', type: 'field', fieldId: 'fld_din_zeichen', label: 'Ihre Zeichen', width: 'full' },
                { id: 'fd_vg', type: 'field', fieldId: 'fld_din_vorgang', label: 'Vorgangs-Nr.', width: 'full' },
                { id: 'fd_ltw', type: 'field', fieldId: 'fld_din_leitweg', label: 'Leitweg-ID (XRechnung)', width: 'full' }
              ]
            },
            { id: 'fd_btf', type: 'field', fieldId: 'fld_din_betreff', label: 'Betreffzeile (Hervorgehoben)', width: 'full' },
            { id: 'fd_txt', type: 'field', fieldId: 'fld_din_inhalt', label: 'Schreiben / Dokumententext', width: 'full' },
            {
              id: 'c_qr',
              type: 'container',
              className: 'grid grid-cols-2 gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-300',
              children: [
                { id: 'fd_iban', type: 'field', fieldId: 'fld_din_iban', label: 'Zahlungs-IBAN', width: 'full' },
                { id: 'fd_qrr', type: 'field', fieldId: 'fld_din_qr_ref', label: 'Schweizer QR-Referenz (27-stellig)', width: 'full' }
              ]
            }
          ]
        }
      }
    ]
  },
  {
    id: 'dach_gdpr_compliance',
    name: 'DSGVO-Auskunftsbericht & Löschprotokoll (Art. 15 & 17)',
    badge: 'Art. 15 & 17 DSGVO',
    category: 'Compliance & Recht',
    description: 'Rechtssichere Verwaltung von Datenschutz-Auskunftsersuchen betroffener Personen nach Art. 15 DSGVO sowie Löschprotokolle mit Fristenverwaltung nach Art. 17 DSGVO.',
    highlights: [
      'Erfassung von Auskunfts- und Löschanfragen mit Fristen-Ampel',
      'Zuordnung zu Verarbeitungszwecken und Empfängerkategorien',
      'Rechtssicherer Export als DSGVO-Auskunftsbericht',
      'Audit-sicheres Löschzertifikat'
    ],
    tables: [
      {
        id: 'tbl_dsgvo_anfragen',
        name: 'DSGVO_Anfragen',
        description: 'Erfassung aller Betroffenen-Rechte nach Art. 15-21 DSGVO',
        fields: [
          { id: 'fld_ds_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_ds_name', name: 'betroffene_person', type: 'VARCHAR', length: 150, allowNull: false },
          { id: 'fld_ds_email', name: 'kontakt_email', type: 'EMAIL' },
          { id: 'fld_ds_typ', name: 'anfrage_typ', type: 'VARCHAR', length: 50, allowNull: false },
          { id: 'fld_ds_eingang', name: 'eingangsdatum', type: 'DATE', allowNull: false },
          { id: 'fld_ds_frist', name: 'frist_1_monat', type: 'DATE' },
          { id: 'fld_ds_status', name: 'status', type: 'VARCHAR', length: 30 },
          { id: 'fld_ds_kategorien', name: 'betroffene_datenkategorien', type: 'TEXT' },
          { id: 'fld_ds_loesch_grund', name: 'loeschung_rechtsgrundlage', type: 'VARCHAR', length: 100 },
          { id: 'fld_ds_beleg', name: 'loesch_protokoll_protokolliert', type: 'BOOLEAN' }
        ],
        data: [
          {
            id: 'DSGVO-2026-01',
            betroffene_person: 'Markus Weber',
            kontakt_email: 'm.weber@beispiel-gmbh.de',
            anfrage_typ: 'Art. 15 Auskunft',
            eingangsdatum: '2026-03-01',
            frist_1_monat: '2026-04-01',
            status: 'In Bearbeitung',
            betroffene_datenkategorien: 'Stammdaten, Bestellhistorie, IP-Logs',
            loeschung_rechtsgrundlage: '',
            loesch_protokoll_protokolliert: false
          }
        ]
      }
    ],
    relationships: [],
    forms: [
      {
        id: 'frm_dsgvo_manager',
        name: 'DSGVO Betroffenen-Rechte Assistent',
        sourceId: 'tbl_dsgvo_anfragen',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_dsgvo',
          type: 'container',
          width: 'full',
          children: [
            {
              id: 'c_ds_head',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-3 gap-3 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200',
              children: [
                { id: 'fds_person', type: 'field', fieldId: 'fld_ds_name', label: 'Betroffene Person', width: 'full' },
                { id: 'fds_mail', type: 'field', fieldId: 'fld_ds_email', label: 'Kontakt E-Mail', width: 'full' },
                { id: 'fds_typ', type: 'field', fieldId: 'fld_ds_typ', label: 'Art des Begehrens', width: 'full' }
              ]
            },
            {
              id: 'c_ds_deadlines',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-3 gap-3 mt-3',
              children: [
                { id: 'fds_eingang', type: 'field', fieldId: 'fld_ds_eingang', label: 'Eingangsdatum', width: 'full' },
                { id: 'fds_frist', type: 'field', fieldId: 'fld_ds_frist', label: 'Gesetzliche Frist (1 Monat)', width: 'full' },
                { id: 'fds_status', type: 'field', fieldId: 'fld_ds_status', label: 'Status Bearbeitung', width: 'full' }
              ]
            },
            { id: 'fds_kat', type: 'field', fieldId: 'fld_ds_kategorien', label: 'Betroffene Datenkategorien (Art. 15 Abs. 1b)', width: 'full' },
            { id: 'fds_grund', type: 'field', fieldId: 'fld_ds_loesch_grund', label: 'Rechtsgrundlage bei Löschung (Art. 17 Abs. 1)', width: 'full' },
            { id: 'fds_chk', type: 'field', fieldId: 'fld_ds_beleg', label: 'Audit-Löschprotokoll nachweisbar archiviert', width: 'full' }
          ]
        }
      }
    ]
  },
  {
    id: 'dach_b2b_crm',
    name: 'B2B Kundenstamm mit USt-IdNr, Handelsregister & Zahlungszielen',
    badge: 'USt-IdNr / UID / HRB',
    category: 'Vertrieb & CRM',
    description: 'Umfassende Firmenkunden-Verwaltung mit automatischen Feldern für USt-IdNr. (DE/AT) bzw. Unternehmens-Identifikationsnummer UID (CHE), Handelsregister-Eintrag, SEPA Lastschriftmandaten und Ansprechpartnern.',
    highlights: [
      'Valides DACH Firmenprofil (USt-IdNr, UID, HRB)',
      'SEPA-Lastschriftmandat & IBAN/BIC Hinterlegung',
      '1:n Relation zu Ansprechpartnern mit Hauptkontakt-Kennzeichnung',
      'Kreditlimit- und Zahlungszielüberwachung'
    ],
    tables: [
      {
        id: 'tbl_b2b_kunden',
        name: 'B2B_Kunden',
        description: 'Stammdaten der Firmenkunden (DACH)',
        fields: [
          { id: 'fld_knd_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_knd_firma', name: 'firmenname', type: 'VARCHAR', length: 150, allowNull: false },
          { id: 'fld_knd_rechtsform', name: 'rechtsform', type: 'VARCHAR', length: 30 },
          { id: 'fld_knd_ustid', name: 'ust_idnr', type: 'VARCHAR', length: 30 },
          { id: 'fld_knd_hrb', name: 'handelsregister_nr', type: 'VARCHAR', length: 50 },
          { id: 'fld_knd_iban', name: 'iban', type: 'IBAN' },
          { id: 'fld_knd_bic', name: 'bic', type: 'BIC' },
          { id: 'fld_knd_ziel', name: 'zahlungsziel_tage', type: 'INTEGER' },
          { id: 'fld_knd_limit', name: 'kreditlimit_eur', type: 'DECIMAL' },
          { id: 'fld_knd_status', name: 'kundenstatus', type: 'VARCHAR', length: 30 }
        ],
        data: [
          {
            id: 'KND-1001',
            firmenname: 'Bavaria Industrie Bau GmbH',
            rechtsform: 'GmbH',
            ust_idnr: 'DE312456789',
            handelsregister_nr: 'HRB 241908 München',
            iban: 'DE89370400440532013000',
            bic: 'BYLADEM1001',
            zahlungsziel_tage: 30,
            kreditlimit_eur: 50000.00,
            kundenstatus: 'A-Kunde (Premium)'
          }
        ]
      },
      {
        id: 'tbl_ansprechpartner',
        name: 'Ansprechpartner',
        description: 'Ansprechpartner der Firmenkunden',
        fields: [
          { id: 'fld_ap_id', name: 'id', type: 'VARCHAR', length: 36, isPrimaryKey: true },
          { id: 'fld_ap_kunde_id', name: 'kunde_id', type: 'VARCHAR', length: 36, allowNull: false },
          { id: 'fld_ap_anrede', name: 'anrede', type: 'VARCHAR', length: 20 },
          { id: 'fld_ap_vorname', name: 'vorname', type: 'VARCHAR', length: 80 },
          { id: 'fld_ap_nachname', name: 'nachname', type: 'VARCHAR', length: 80, allowNull: false },
          { id: 'fld_ap_funktion', name: 'funktion', type: 'VARCHAR', length: 100 },
          { id: 'fld_ap_email', name: 'email', type: 'EMAIL' },
          { id: 'fld_ap_telefon', name: 'telefon', type: 'VARCHAR', length: 50 },
          { id: 'fld_ap_haupt', name: 'ist_hauptkontakt', type: 'BOOLEAN' }
        ],
        data: [
          {
            id: 'AP-1001-1',
            kunde_id: 'KND-1001',
            anrede: 'Herr',
            vorname: 'Maximilian',
            nachname: 'Huber',
            funktion: 'Leiter Einkauf & Kalkulation',
            email: 'm.huber@bavaria-bau.de',
            telefon: '+49 89 123456-78',
            ist_hauptkontakt: true
          }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel_knd_ap',
        fromTableId: 'tbl_b2b_kunden',
        fromFieldId: 'fld_knd_id',
        toTableId: 'tbl_ansprechpartner',
        toFieldId: 'fld_ap_kunde_id',
        type: '1:n',
        joinType: 'INNER',
        referentialIntegrity: true
      }
    ],
    forms: [
      {
        id: 'frm_kunden_master',
        name: 'B2B Kundenstamm (DACH)',
        sourceId: 'tbl_b2b_kunden',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_knd',
          type: 'container',
          width: 'full',
          children: [
            {
              id: 'c_knd_base',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200',
              children: [
                { id: 'fk_firma', type: 'field', fieldId: 'fld_knd_firma', label: 'Firmenname', width: 'full' },
                { id: 'fk_rf', type: 'field', fieldId: 'fld_knd_rechtsform', label: 'Rechtsform (GmbH, AG, GmbH & Co. KG)', width: 'full' },
                { id: 'fk_st', type: 'field', fieldId: 'fld_knd_status', label: 'Kundenkategorie', width: 'full' }
              ]
            },
            {
              id: 'c_knd_tax',
              type: 'container',
              className: 'grid grid-cols-1 md:grid-cols-4 gap-3 mt-3',
              children: [
                { id: 'fk_uid', type: 'field', fieldId: 'fld_knd_ustid', label: 'USt-IdNr. / UID (CHE/AT/DE)', width: 'full' },
                { id: 'fk_hrb', type: 'field', fieldId: 'fld_knd_hrb', label: 'Handelsregister-Nr.', width: 'full' },
                { id: 'fk_ziel', type: 'field', fieldId: 'fld_knd_ziel', label: 'Zahlungsziel (Tage)', width: 'full' },
                { id: 'fk_limit', type: 'field', fieldId: 'fld_knd_limit', label: 'Kreditlimit (€)', width: 'full' }
              ]
            },
            {
              id: 'c_knd_bank',
              type: 'container',
              className: 'grid grid-cols-2 gap-3 mt-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200',
              children: [
                { id: 'fk_iban', type: 'field', fieldId: 'fld_knd_iban', label: 'SEPA IBAN', width: 'full' },
                { id: 'fk_bic', type: 'field', fieldId: 'fld_knd_bic', label: 'BIC / SWIFT', width: 'full' }
              ]
            },
            {
              id: 'subform_ap',
              type: 'subform',
              label: 'Ansprechpartner & Geschäftsführung',
              width: 'full',
              subform: {
                formId: 'frm_ap_sub',
                masterLinkFieldId: 'fld_knd_id',
                childLinkFieldId: 'fld_ap_kunde_id',
                canAdd: true,
                canEdit: true,
                canDelete: true
              }
            }
          ]
        }
      },
      {
        id: 'frm_ap_sub',
        name: 'Ansprechpartner erfassen',
        sourceId: 'tbl_ansprechpartner',
        sourceType: 'table',
        mode: 'edit',
        fields: [],
        layout: {
          id: 'root_ap',
          type: 'container',
          width: 'full',
          children: [
            { id: 'fa_anr', type: 'field', fieldId: 'fld_ap_anrede', label: 'Anrede', width: '1/4' },
            { id: 'fa_vn', type: 'field', fieldId: 'fld_ap_vorname', label: 'Vorname', width: '1/4' },
            { id: 'fa_nn', type: 'field', fieldId: 'fld_ap_nachname', label: 'Nachname', width: '1/2' },
            { id: 'fa_fkt', type: 'field', fieldId: 'fld_ap_funktion', label: 'Position / Abteilung', width: 'full' },
            { id: 'fa_em', type: 'field', fieldId: 'fld_ap_email', label: 'Geschäftliche E-Mail', width: '1/2' },
            { id: 'fa_tel', type: 'field', fieldId: 'fld_ap_telefon', label: 'Telefon / Durchwahl', width: '1/2' }
          ]
        }
      }
    ]
  }
];
