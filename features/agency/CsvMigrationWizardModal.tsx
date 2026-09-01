import React, { useState } from 'react';
import { X, FileSpreadsheet, Wand2, ArrowRight, Check, Database, RefreshCw, Layers } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

interface CsvMigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvMigrationWizardModal: React.FC<CsvMigrationWizardModalProps> = ({ isOpen, onClose }) => {
  const { addTable } = useProjectStore();
  const { addToast } = useUIStore();

  const [rawText, setRawText] = useState(
    `Name,Adresse,E-Mail,Einkaufssumme,Registriert
Max Mustermann,Hauptstraße 12, 10115 Berlin,max@example.com,1250.50,01.03.2025
Erika Musterfrau,Bahnhofstr. 4, 80331 München,erika@example.com,890.00,15.02.2025
Max Mustermann,Hauptstraße 12, 10115 Berlin,max@example.com,1250.50,01.03.2025`
  );

  const [tableName, setTableName] = useState('Kunden_Import');
  const [splitName, setSplitName] = useState(true);
  const [splitAddress, setSplitAddress] = useState(true);
  const [deduplicate, setDeduplicate] = useState(true);

  if (!isOpen) return null;

  const parseAndNormalizeData = () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return { fields: [], rows: [] };

    const headers = lines[0].split(',').map((h) => h.trim());
    let parsedRows = lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim());
      const rowObj: Record<string, any> = {};
      headers.forEach((h, i) => {
        rowObj[h] = vals[i] || '';
      });
      return rowObj;
    });

    // Normalization 1: Deduplication
    if (deduplicate) {
      const seen = new Set();
      parsedRows = parsedRows.filter((r) => {
        const key = JSON.stringify(r);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Normalization 2: Split Name
    let finalFields = [...headers];
    if (splitName && headers.includes('Name')) {
      finalFields = finalFields.filter((f) => f !== 'Name');
      finalFields.unshift('Nachname');
      finalFields.unshift('Vorname');

      parsedRows = parsedRows.map((r) => {
        const full = r['Name'] || '';
        const parts = full.split(' ');
        const vorname = parts[0] || '';
        const nachname = parts.slice(1).join(' ') || '';
        delete r['Name'];
        return { Vorname: vorname, Nachname: nachname, ...r };
      });
    }

    // Normalization 3: Split Address
    if (splitAddress && headers.includes('Adresse')) {
      const addrIndex = finalFields.indexOf('Adresse');
      if (addrIndex !== -1) {
        finalFields.splice(addrIndex, 1, 'Strasse_Hausnr', 'PLZ_Ort');
      }

      parsedRows = parsedRows.map((r) => {
        const addr = r['Adresse'] || '';
        const parts = addr.split(',');
        const str = parts[0]?.trim() || '';
        const plzOrt = parts[1]?.trim() || '';
        delete r['Adresse'];
        return { ...r, Strasse_Hausnr: str, PLZ_Ort: plzOrt };
      });
    }

    return { fields: finalFields, rows: parsedRows };
  };

  const normalizedResult = parseAndNormalizeData();

  const handleImport = () => {
    const { fields, rows } = normalizedResult;
    if (!rows.length) {
      addToast('Keine Daten zum Importieren gefunden.', 'error');
      return;
    }

    const tableFields = [
      { id: 'f_id', name: 'id', type: 'AUTONUMBER' as any, isPrimaryKey: true, required: true },
      ...fields.map((f, i) => ({
        id: `f_${i}_${f}`,
        name: f.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        type: f.toLowerCase().includes('summe') || f.toLowerCase().includes('preis') ? ('CURRENCY' as any) : ('TEXT' as any),
      })),
    ];

    const newTable = {
      id: `tbl_${Date.now()}`,
      name: tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      fields: tableFields,
      data: rows.map((r, idx) => ({ id: idx + 1, ...r })),
    };

    addTable(newTable as any);
    addToast(`Tabelle "${newTable.name}" mit ${rows.length} bereinigten Datensätzen importiert!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Intelligenter CSV/Excel-Migration Wizard</h2>
              <p className="text-xs text-slate-400">
                Automatische Aufteilung unstrukturierter Kundendaten (Namen, Adressen) &amp; Dublettenbereinigung
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Input & Rules Column */}
          <div className="w-1/2 p-6 bg-slate-950 border-r border-slate-800 flex flex-col space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ziel-Tabellenname</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unstrukturierte Rohdaten (CSV)</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                className="w-full flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 resize-none"
              />
            </div>

            {/* Smart Normalization Options */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <Wand2 size={14} /> Normalisierungs-Regeln
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitName}
                  onChange={(e) => setSplitName(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                Namen trennen (`Name` &rarr; `Vorname`, `Nachname`)
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitAddress}
                  onChange={(e) => setSplitAddress(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                Adressen trennen (`Adresse` &rarr; `Strasse`, `PLZ/Ort`)
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                Identische Dubletten automatisch filtern
              </label>
            </div>
          </div>

          {/* Right Preview Column */}
          <div className="w-1/2 p-6 bg-slate-900 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Database size={14} className="text-emerald-400" /> Bereinigtes Vorschauergebnis ({normalizedResult.rows.length} Zeilen)
                </h3>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-auto p-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      {normalizedResult.fields.map((f, idx) => (
                        <th key={idx} className="p-2 border-b border-slate-800">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {normalizedResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        {normalizedResult.fields.map((f, fIdx) => (
                          <td key={fIdx} className="p-2 text-slate-200">
                            {row[f] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={handleImport}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Check size={16} /> Bereinigte Tabelle In Datenbank Übernehmen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
