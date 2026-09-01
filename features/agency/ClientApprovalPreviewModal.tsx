import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, MessageSquare, Send, Award, Table as TableIcon, Layers } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

interface ClientApprovalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  tableName: string;
  author: string;
  text: string;
  timestamp: string;
}

export const ClientApprovalPreviewModal: React.FC<ClientApprovalPreviewModalProps> = ({ isOpen, onClose }) => {
  const { tables, relationships, projectName } = useProjectStore();
  const { addToast } = useUIStore();

  const [selectedTable, setSelectedTable] = useState<string>(tables[0]?.name || '');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      tableName: tables[0]?.name || 'System',
      author: 'Kunde (Projektleiter)',
      text: 'Bitte noch ein Feld "Kostenstelle" ergänzen, ansonsten passt die Struktur sehr gut.',
      timestamp: 'Heute, 11:30',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [clientAuthor, setClientAuthor] = useState('Max Mustermann');
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTableObj = tables.find((t) => t.name === selectedTable) || tables[0];

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newC: Comment = {
      id: Date.now().toString(),
      tableName: selectedTable,
      author: clientAuthor || 'Kunde',
      text: newCommentText.trim(),
      timestamp: 'Gerade eben',
    };
    setComments([...comments, newC]);
    setNewCommentText('');
    addToast('Kommentar zum Datenmodell erfolgreich hinterlegt.', 'success');
  };

  const handleApprove = () => {
    setIsApproved(true);
    const dateStr = new Date().toLocaleString('de-DE');
    setApprovedAt(dateStr);
    addToast(`Datenmodell von ${clientAuthor || 'Kunde'} freigegeben!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Kunden-Abnahme-Modus (Client Read-Only)</h2>
                {isApproved && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle size={12} /> Model Freigegeben
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Schreibgeschützte Vorab-Präsentation für den Kunden mit Kommentier- &amp; Freigabefunktion
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tables */}
          <div className="w-64 bg-slate-950/60 border-r border-slate-800 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Tabellen ({tables.length})
            </div>
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                  selectedTable === t.name
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <TableIcon size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">{t.name}</span>
                </div>
                <span className="text-[10px] opacity-70 bg-black/20 px-1.5 py-0.5 rounded">
                  {t.fields?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Main Table Inspector */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-900 space-y-6">
            {activeTableObj ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Layers className="text-blue-400" /> Tabelle: {activeTableObj.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enthält {activeTableObj.fields?.length || 0} Felder und {activeTableObj.data?.length || 0} Beispiel-Datensätze.
                    </p>
                  </div>
                </div>

                {/* Fields Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold">
                      <tr>
                        <th className="px-4 py-3">Feldname</th>
                        <th className="px-4 py-3">Datentyp</th>
                        <th className="px-4 py-3">PK</th>
                        <th className="px-4 py-3">Pflichtfeld</th>
                        <th className="px-4 py-3">Eindeutig</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(activeTableObj.fields || []).map((f) => (
                        <tr key={f.id} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 font-bold text-white">{f.name}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/50 rounded font-mono text-[11px]">
                              {f.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">{f.isPrimaryKey ? '🔑 Ja' : '-'}</td>
                          <td className="px-4 py-2.5">
                            {f.allowNull === false || f.isNullable === false ? 'Ja' : 'Nein'}
                          </td>
                          <td className="px-4 py-2.5">{f.isUnique ? 'Ja' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-12">Keine Tabelle ausgewählt.</div>
            )}
          </div>

          {/* Right Feedback & Approval Panel */}
          <div className="w-80 bg-slate-950 border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
            {/* Feedback / Comments */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} className="text-amber-400" /> Kunden-Feedback
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-amber-300">{c.author}</span>
                      <span>{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200">{c.text}</p>
                    <span className="inline-block text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Anmerkung zu #{c.tableName}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add comment input */}
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  placeholder="Ihr Name (z.B. Kunde Max)"
                  value={clientAuthor}
                  onChange={(e) => setClientAuthor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
                <textarea
                  rows={2}
                  placeholder={`Anmerkung zu ${selectedTable}...`}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
                <button
                  onClick={handleAddComment}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <Send size={12} /> Kommentar absenden
                </button>
              </div>
            </div>

            {/* Approval Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-3 mt-4">
              {isApproved ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-center space-y-2">
                  <Award className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-xs font-black text-emerald-300">Offiziell Freigegeben</div>
                  <div className="text-[10px] text-emerald-400">
                    Freigabe erteilt am {approvedAt} von {clientAuthor}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleApprove}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle size={16} /> Datenmodell Jetzt Freigeben
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
