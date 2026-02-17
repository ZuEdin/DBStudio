
import React, { useState, useEffect } from 'react';
import { X, User, Search, Check, Loader2, ShieldAlert } from 'lucide-react';

interface AdUser {
    Username: string;
    DisplayName: string;
    Email: string;
    Department?: string;
    Groups?: string[];
}

interface UserPickerModalProps {
    initialTab?: 'me' | 'search';
    onSelect: (username: string, displayName: string) => void;
    onClose: () => void;
}

export const UserPickerModal: React.FC<UserPickerModalProps> = ({ initialTab = 'me', onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'search'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // WhoAmI State
    const [me, setMe] = useState<AdUser | null>(null);

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdUser[]>([]);

    useEffect(() => {
        if (activeTab === 'me') loadMe();
    }, [activeTab]);

    const loadMe = async () => {
        setLoading(true);
        setError(null);
        try {
            // Versuche Backend Call (Standard Port 5000 für .NET)
            // WICHTIG: credentials: 'include' ist notwendig für Windows Auth (Negotiate) Cross-Origin
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); 

            const res = await fetch('http://localhost:5000/api/ad/me', { 
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
                credentials: 'include' 
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                setMe(data);
            } else {
                throw new Error("Backend nicht erreichbar oder 401");
            }
        } catch (e) {
            console.warn("Backend API failed, using Mock data for Preview.", e);
            // Mock Data für Designer-Vorschau
            setMe({
                Username: 'preview.user',
                DisplayName: 'Preview User (Design Mode)',
                Email: 'user@local.design',
                Department: 'IT Development',
                Groups: ['Domain Users', 'Developers']
            });
            if ((e as Error).name !== 'AbortError') {
                setError("Backend nicht verbunden (Auth Fehler). Zeige Beispiel-Daten.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`http://localhost:5000/api/ad/search?q=${query}`, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                setResults(data);
            } else {
                throw new Error("Backend Error");
            }
        } catch (e) {
            // Mock Search
            setResults([
                { Username: 'm.muster', DisplayName: 'Max Mustermann', Email: 'max@firma.de', Department: 'Sales' },
                { Username: 'e.gabler', DisplayName: 'Erika Gabler', Email: 'erika@firma.de', Department: 'HR' },
                { Username: 't.test', DisplayName: 'Tom Test', Email: 'tom@firma.de', Department: 'IT' }
            ].filter(u => u.DisplayName.toLowerCase().includes(query.toLowerCase()) || u.Username.includes(query.toLowerCase())));
            
            setError("Backend nicht verbunden. Suche in Beispiel-Daten.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden flex flex-col h-[500px]">
                
                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                        <User className="text-blue-400" size={20}/> Benutzer auswählen
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('me')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'me' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Aktueller User (WhoAmI)
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'search' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Verzeichnis durchsuchen
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                            <Loader2 className="animate-spin text-blue-600" size={32}/>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded text-xs flex items-center gap-2">
                            <ShieldAlert size={16}/> {error}
                        </div>
                    )}

                    {activeTab === 'me' && me && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                                {me.DisplayName.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-800">{me.DisplayName}</h4>
                                <p className="text-slate-500 text-sm font-mono">{me.Username}</p>
                                <p className="text-slate-400 text-xs mt-1">{me.Email}</p>
                            </div>
                            <div className="bg-white border p-3 rounded w-full text-left text-xs text-slate-600 space-y-1">
                                <p><strong>Abteilung:</strong> {me.Department || '-'}</p>
                                <p><strong>Gruppen:</strong> {me.Groups?.join(', ') || '-'}</p>
                            </div>
                            <button 
                                onClick={() => onSelect(me.Username, me.DisplayName)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4"
                            >
                                <Check size={18}/> Als "{me.Username}" übernehmen
                            </button>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="h-full flex flex-col">
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Name oder Kürzel..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    autoFocus
                                />
                                <button onClick={handleSearch} className="bg-slate-700 text-white px-4 rounded hover:bg-slate-800">
                                    <Search size={18}/>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded bg-white">
                                {results.length > 0 ? results.map((u) => (
                                    <div key={u.Username} className="p-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex justify-between items-center group cursor-pointer" onClick={() => onSelect(u.Username, u.DisplayName)}>
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{u.DisplayName}</div>
                                            <div className="text-xs text-slate-500 font-mono">{u.Username}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400">{u.Department}</div>
                                            <button className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100">Wählen</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        {query ? 'Keine Treffer.' : 'Bitte Suchbegriff eingeben.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
