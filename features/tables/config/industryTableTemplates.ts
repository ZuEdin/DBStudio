import { Table } from '../../../types';

export interface IndustryTemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: Table[];
}

export const INDUSTRY_TABLE_TEMPLATES: IndustryTemplateCategory[] = [
  {
    id: 'construction',
    name: '🏗️ Bau & Handwerk (VOB / GAEB)',
    description: 'Vorkonfigurierte Tabellen nach deutschen Bau-Standards',
    icon: 'Building2',
    templates: [
      {
        id: 'tpl_positions',
        name: 'tbl_positions',
        description: 'Leistungsverzeichnis-Positionen nach GAEB / VOB',
        fields: [
          { id: 'f1', name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false, comment: 'Eindeutige Positions-ID' },
          { id: 'f2', name: 'oz', type: 'ORDNUNGSZAHL', length: 30, allowNull: false, comment: 'Ordnungszahl (z.B. 01.02.0030)' },
          { id: 'f3', name: 'short_text', type: 'VARCHAR', length: 255, allowNull: false, comment: 'Kurztext der Leistung' },
          { id: 'f4', name: 'long_text', type: 'TEXT', allowNull: true, comment: 'Ausführlicher Langtext' },
          { id: 'f5', name: 'quantity', type: 'DECIMAL', precision: 12, scale: 3, defaultValue: '1.000', allowNull: false, comment: 'Menge' },
          { id: 'f6', name: 'unit', type: 'UNIT_MEASURE', defaultValue: 'm²', allowNull: false, comment: 'Mengeneinheit (m, m², m³, Stk...)' },
          { id: 'f7', name: 'unit_price', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false, comment: 'Einheitspreis (EP)' },
          { id: 'f8', name: 'total_price', type: 'CURRENCY', precision: 18, scale: 2, isCalculated: true, calculationFormula: '[quantity] * [unit_price]', allowNull: true, comment: 'Gesamtpreis (GB)' },
          { id: 'f9', name: 'vat_rate', type: 'PERCENTAGE', precision: 5, scale: 2, defaultValue: '19.00', allowNull: false, comment: 'Umsatzsteuersatz (%)' },
          { id: 'f10', name: 'is_active', type: 'BOOLEAN', defaultValue: 'true', allowNull: false, comment: 'Aktivstatus' },
        ],
      },
      {
        id: 'tpl_daily_reports',
        name: 'tbl_daily_reports',
        description: 'Bautagebuch & Tagesbericht zur VOB-konformen Dokumentation',
        fields: [
          { id: 'dr1', name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: 'dr2', name: 'report_date', type: 'DATE', allowNull: false, comment: 'Berichtsdatum' },
          { id: 'dr3', name: 'project_number', type: 'VARCHAR', length: 50, allowNull: false, comment: 'Projektnummer' },
          { id: 'dr4', name: 'weather_conditions', type: 'VARCHAR', length: 100, comment: 'Witterung (z.B. Sonnig, 18°C)' },
          { id: 'dr5', name: 'temperature_celsius', type: 'DECIMAL', precision: 4, scale: 1, comment: 'Temperatur in °C' },
          { id: 'dr6', name: 'workers_count', type: 'INTEGER', defaultValue: '1', allowNull: false, comment: 'Anzahl eingesetzte Arbeitskräfte' },
          { id: 'dr7', name: 'performed_work', type: 'TEXT', allowNull: false, comment: 'Ausgeführte Arbeiten' },
          { id: 'dr8', name: 'special_incidents', type: 'TEXT', comment: 'Besondere Vorkommnisse / Behinderungen' },
          { id: 'dr9', name: 'site_manager', type: 'VARCHAR', length: 100, comment: 'Bauleiter / Verantwortlicher' },
        ],
      },
      {
        id: 'tpl_defects',
        name: 'tbl_defects',
        description: 'Mängelmanagement & Gewährleistungsverfolgung',
        fields: [
          { id: 'df1', name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: 'df2', name: 'defect_number', type: 'VARCHAR', length: 30, allowNull: false, comment: 'Mangel-Nummer (z.B. M-2026-001)' },
          { id: 'df3', name: 'location', type: 'VARCHAR', length: 150, allowNull: false, comment: 'Ort / Geschoss / Raum' },
          { id: 'df4', name: 'description', type: 'TEXT', allowNull: false, comment: 'Mangelbeschreibung' },
          { id: 'df5', name: 'severity', type: 'ENUM', enumValues: ['LEICHT', 'MITTEL', 'SCHWER', 'ABNAHMEHINDERND'], defaultValue: 'MITTEL', allowNull: false },
          { id: 'df6', name: 'status', type: 'ENUM', enumValues: ['OFFEN', 'IN_BEARBEITUNG', 'BEHOBEN', 'FREIGEGEBEN'], defaultValue: 'OFFEN', allowNull: false },
          { id: 'df7', name: 'due_date', type: 'DATE', allowNull: false, comment: 'Frist zur Nachbesserung' },
          { id: 'df8', name: 'trade_contractor', type: 'VARCHAR', length: 100, comment: 'Verursachender Nachunternehmer' },
        ],
      },
    ],
  },
  {
    id: 'finance_crm',
    name: '💼 Finanzen & CRM',
    description: 'Kundenstammdaten, Abschlagsrechnungen und Zahlungsabwicklung',
    icon: 'Receipt',
    templates: [
      {
        id: 'tpl_customers',
        name: 'tbl_customers',
        description: 'Kunden- & Debitorenstammdaten mit IBAN/BIC',
        fields: [
          { id: 'c1', name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: 'c2', name: 'customer_number', type: 'VARCHAR', length: 30, allowNull: false, comment: 'Kundennummer' },
          { id: 'c3', name: 'company_name', type: 'VARCHAR', length: 200, allowNull: false, comment: 'Firmenname / Name' },
          { id: 'c4', name: 'contact_person', type: 'VARCHAR', length: 100, comment: 'Ansprechpartner' },
          { id: 'c5', name: 'email', type: 'EMAIL', length: 255, comment: 'E-Mail Adresse' },
          { id: 'c6', name: 'phone', type: 'PHONE', length: 50, comment: 'Telefonnummer' },
          { id: 'c7', name: 'street', type: 'VARCHAR', length: 150 },
          { id: 'c8', name: 'zip_city', type: 'VARCHAR', length: 100 },
          { id: 'c9', name: 'iban', type: 'IBAN', length: 34, comment: 'Bankverbindung' },
          { id: 'c10', name: 'bic', type: 'BIC', length: 11, comment: 'BIC / SWIFT' },
          { id: 'c11', name: 'vat_id', type: 'VARCHAR', length: 30, comment: 'Umsatzsteuer-ID (z.B. DE123456789)' },
          { id: 'c12', name: 'discount_percent', type: 'PERCENTAGE', defaultValue: '0.00', comment: 'Skonto-Prozentsatz' },
        ],
      },
      {
        id: 'tpl_invoices',
        name: 'tbl_invoices',
        description: 'VOB-konforme Abschlags- & Schlussrechnungen',
        fields: [
          { id: 'inv1', name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: 'inv2', name: 'invoice_number', type: 'VARCHAR', length: 50, allowNull: false, comment: 'Rechnungsnummer' },
          { id: 'inv3', name: 'invoice_type', type: 'ENUM', enumValues: ['ABSCHLAG', 'TEILSCHLUSS', 'SCHLUSSRECHNUNG', 'GUTSCHRIFT'], defaultValue: 'ABSCHLAG', allowNull: false },
          { id: 'inv4', name: 'invoice_date', type: 'DATE', allowNull: false },
          { id: 'inv5', name: 'due_date', type: 'DATE', allowNull: false },
          { id: 'inv6', name: 'net_amount', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false, comment: 'Nettobetrag' },
          { id: 'inv7', name: 'vat_amount', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false, comment: 'Umsatzsteuerbetrag' },
          { id: 'inv8', name: 'gross_amount', type: 'CURRENCY', precision: 18, scale: 2, isCalculated: true, calculationFormula: '[net_amount] + [vat_amount]', allowNull: false, comment: 'Bruttobetrag' },
          { id: 'inv9', name: 'security_retention', type: 'PERCENTAGE', defaultValue: '5.00', comment: 'Sicherheitseinbehalt VOB (%)' },
          { id: 'inv10', name: 'status', type: 'ENUM', enumValues: ['ENTWURF', 'VERSENDET', 'TEILBEZAHLT', 'BEZAHLT', 'STORNIERT'], defaultValue: 'ENTWURF', allowNull: false },
        ],
      },
    ],
  },
];
