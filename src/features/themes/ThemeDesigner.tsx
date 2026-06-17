import React, { useState } from 'react';
import { BackendConfig, WhitelabelConfig } from '../../types';
import { Palette, Type, Square, Layout, Smartphone, Mail, Moon, Sun, Monitor, CheckCircle, Save } from 'lucide-react';

interface ThemeDesignerProps {
    config: BackendConfig;
    onUpdateConfig: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ThemeDesigner: React.FC<ThemeDesignerProps> = ({ config, onUpdateConfig, showMessage }) => {
    const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'shapes' | 'darkmode' | 'email' | 'pwa'>('colors');
    
    // Ensure whitelabel exists
    const wl = config.whitelabel || {
        appName: 'My App', companyName: 'My Company', primaryColor: '#3b82f6', secondaryColor: '#1e293b', removeBranding: false
    };

    const updateWl = (key: keyof WhitelabelConfig, value: any) => {
        onUpdateConfig({
            ...config,
            whitelabel: {
                ...wl,
                [key]: value
            }
        });
    };

    const handleSave = () => {
        showMessage("Gespeichert", "Die Theme- & Branding-Einstellungen wurden gespeichert.", "success");
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Palette size={20} className="text-blue-500" /> Theme & Branding Designer
                    </h2>
                    <p className="text-xs text-slate-500">Gestalten Sie das White-Labeling, Farben, Schriften und das Dark Mode Verhalten der finalen Applikation.</p>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow text-sm font-semibold hover:bg-blue-700 transition">
                    <Save size={16} /> Speichern
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-2 space-y-1">
                    <button onClick={() => setActiveTab('colors')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'colors' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Palette size={16} /> Color System
                    </button>
                    <button onClick={() => setActiveTab('typography')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'typography' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Type size={16} /> Typografie & Text
                    </button>
                    <button onClick={() => setActiveTab('shapes')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'shapes' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Square size={16} /> Shapes & Elevation
                    </button>
                    <button onClick={() => setActiveTab('darkmode')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'darkmode' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Moon size={16} /> Dark Mode Settings
                    </button>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"></div>
                    <button onClick={() => setActiveTab('pwa')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'pwa' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Smartphone size={16} /> PWA & Web-Manifest
                    </button>
                    <button onClick={() => setActiveTab('email')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'email' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Mail size={16} /> E-Mail Templates
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {activeTab === 'colors' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Basis Farben (Brand Identity)</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Primary Color (Brand)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={wl.primaryColor || '#3b82f6'} onChange={e => updateWl('primaryColor', e.target.value)} className="w-10 h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                            <input type="text" value={wl.primaryColor || '#3b82f6'} onChange={e => updateWl('primaryColor', e.target.value)} className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Secondary Color (z.B. Sidebar)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={wl.secondaryColor || '#1e293b'} onChange={e => updateWl('secondaryColor', e.target.value)} className="w-10 h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                            <input type="text" value={wl.secondaryColor || '#1e293b'} onChange={e => updateWl('secondaryColor', e.target.value)} className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">Semantic Colors (Erweiterbare Farbpalette)</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Accent Color</label>
                                        <input type="color" value={wl.accentColor || '#8b5cf6'} onChange={e => updateWl('accentColor', e.target.value)} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Success Color</label>
                                        <input type="color" value={wl.successColor || '#10b981'} onChange={e => updateWl('successColor', e.target.value)} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Warning Color</label>
                                        <input type="color" value={wl.warningColor || '#f59e0b'} onChange={e => updateWl('warningColor', e.target.value)} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Error Color</label>
                                        <input type="color" value={wl.errorColor || '#ef4444'} onChange={e => updateWl('errorColor', e.target.value)} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'typography' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Typografie</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Font Family (Google Fonts)</label>
                                    <select value={wl.fontFamily || 'Inter'} onChange={e => updateWl('fontFamily', e.target.value)} className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white">
                                        <option value="Inter">Inter (Modern, System)</option>
                                        <option value="Roboto">Roboto (Android-like)</option>
                                        <option value="Open Sans">Open Sans (Freundlich)</option>
                                        <option value="Montserrat">Montserrat (Geometrisch)</option>
                                        <option value="Playfair Display">Playfair Display (Serife)</option>
                                    </select>
                                </div>
                                
                                <div className="p-6 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 mt-4 overflow-hidden">
                                    <div className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Live Preview</div>
                                    <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
                                    <h2 className="text-3xl font-semibold mb-2">Heading 2</h2>
                                    <h3 className="text-2xl font-medium mb-4">Heading 3</h3>
                                    <p className="text-base text-slate-600 dark:text-slate-300 mb-4">
                                        Dies ist ein Beispiel für den Fließtext der Applikation. Eine gute Typografie sorgt für Lesbarkeit und Professionalität in Datentabellen und Formularen.
                                    </p>
                                    <button className="px-4 py-2 rounded font-medium" style={{ backgroundColor: wl.primaryColor, color: '#fff' }}>Beispiel Button</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'shapes' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Shapes & Elevation</h3>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Border Radius (Ecken)</label>
                                        <select value={wl.borderRadius || 'md'} onChange={e => updateWl('borderRadius', e.target.value)} className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white">
                                            <option value="none">Scharfkantig (0px)</option>
                                            <option value="sm">Leicht abgerundet (4px)</option>
                                            <option value="md">Modern (8px)</option>
                                            <option value="lg">Soft (12px)</option>
                                            <option value="full">Pill-Shape (9999px)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Base Elevation (Container Schatten)</label>
                                        <select value={wl.elevation || 'sm'} onChange={e => updateWl('elevation', e.target.value)} className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white">
                                            <option value="none">Flat (Kein Schatten, nur Border)</option>
                                            <option value="sm">Light (Subtiler Schatten)</option>
                                            <option value="md">Standard Schatten</option>
                                            <option value="lg">Floating (Starker Schatten)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center min-h-[200px]">
                                    <div 
                                        className="bg-white dark:bg-slate-900 p-6 flex flex-col justify-center items-center transition-all duration-300"
                                        style={{
                                            borderRadius: wl.borderRadius === 'none' ? '0' : wl.borderRadius === 'sm' ? '0.25rem' : wl.borderRadius === 'md' ? '0.5rem' : wl.borderRadius === 'lg' ? '0.75rem' : '9999px',
                                            boxShadow: wl.elevation === 'none' ? 'none' : wl.elevation === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : wl.elevation === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                            border: wl.elevation === 'none' ? '1px solid #e2e8f0' : 'none'
                                        }}
                                    >
                                        <p className="font-semibold text-slate-800 dark:text-white">Beispiel Container</p>
                                        <p className="text-xs text-slate-500 mt-2">So sehen Forms & Karten aus.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'darkmode' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Dark Mode Overrides</h3>
                                <p className="text-xs text-slate-500">Wenn der Endanwender den Dark Mode aktiviert, können Sie hier alternative Farben für das Branding erzwingen (z.B. Neon statt Normal).</p>
                                
                                <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-700">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 mb-1">Dark Mode Primary Color</label>
                                            <input type="color" value={wl.darkModeColors?.primary || wl.primaryColor} onChange={e => updateWl('darkModeColors', { ...wl.darkModeColors, primary: e.target.value })} className="w-full h-10 p-1 bg-slate-800 border-none rounded cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 mb-1">Dark Mode Background</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={wl.darkModeColors?.background || '#0f172a'} onChange={e => updateWl('darkModeColors', { ...wl.darkModeColors, background: e.target.value })} className="w-10 h-10 p-1 bg-slate-800 border-none rounded cursor-pointer" />
                                                <input type="text" value={wl.darkModeColors?.background || '#0f172a'} onChange={e => updateWl('darkModeColors', { ...wl.darkModeColors, background: e.target.value })} className="w-full text-sm border p-2 rounded bg-slate-800 border-slate-700 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pwa' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Progressive Web App (PWA) Manifest</h3>
                                
                                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-start gap-3">
                                    <Monitor className="text-blue-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Mobile Ready & Installierbar</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 mt-1">Soll die Applikation auf Smartphones ("Zum Homescreen hinzufügen") direkt installierbar sein? Falls ja, erstellen wir PWA manifest.json und Service_Workers.</p>
                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                            <input type="checkbox" checked={wl.pwaConfiguration?.enabled || false} onChange={e => updateWl('pwaConfiguration', { ...wl.pwaConfiguration, enabled: e.target.checked })} className="rounded" />
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">PWA & Manifest-Generierung aktivieren</span>
                                        </label>
                                    </div>
                                </div>

                                {wl.pwaConfiguration?.enabled && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PWA Theme Color (Browser Kopfzeile)</label>
                                            <input type="color" value={wl.pwaConfiguration?.themeColor || wl.primaryColor} onChange={e => updateWl('pwaConfiguration', { ...wl.pwaConfiguration, themeColor: e.target.value })} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PWA Background Color (Splash Screen)</label>
                                            <input type="color" value={wl.pwaConfiguration?.backgroundColor || '#ffffff'} onChange={e => updateWl('pwaConfiguration', { ...wl.pwaConfiguration, backgroundColor: e.target.value })} className="w-full h-10 p-1 bg-white dark:bg-slate-800 border rounded cursor-pointer" />
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PWA App Icons (512x512)</label>
                                            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center text-center">
                                                <img src={wl.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/4/4e/Database_Icon.svg"} className="h-16 w-16 mb-2 object-contain" alt="App Icon" />
                                                <p className="text-xs text-slate-500">Das aktuell hochgeladene Logo wird vom Generator automatisch verkleinert (192x192, 512x512, Apple Touch Icon).</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Branded E-Mail Templates</h3>
                                <p className="text-xs text-slate-500">Diese E-Mail Templates werden beim generierten Backend (.NET / NodeJS) in HTML konvertiert und mit Ihrem definierten Primary Color / Branding verschickt.</p>
                                
                                <div className="space-y-4">
                                    {(wl.emailTemplates || []).length === 0 && (
                                        <div className="text-sm p-4 border border-dashed rounded-lg text-center text-slate-500">Keine E-Mail Templates definiert.</div>
                                    )}
                                    <button 
                                        onClick={() => {
                                            const templates = wl.emailTemplates || [];
                                            updateWl('emailTemplates', [...templates, { id: Date.now().toString(), name: 'Neu: Passwort Zurücksetzen', subject: 'Infos zu Ihrem Passwort', bodyHtml: '<h1>Willkommen bei {{appName}}</h1><p>Bitte klicken Sie hier...</p>' }]);
                                        }}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        + Standard Template (Passwort Zurücksetzen) hinzufügen
                                    </button>

                                    {(wl.emailTemplates || []).map((t: any, i: number) => (
                                        <div key={t.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> {t.name}</h4>
                                                <button onClick={() => updateWl('emailTemplates', (wl.emailTemplates||[]).filter(x => x.id !== t.id))} className="text-xs text-red-500 hover:underline">Löschen</button>
                                            </div>
                                            <label className="block text-xs text-slate-500 mb-1">Betreff</label>
                                            <input type="text" value={t.subject} onChange={e => {
                                                const list = [...(wl.emailTemplates||[])];
                                                list[i].subject = e.target.value;
                                                updateWl('emailTemplates', list);
                                            }} className="w-full text-sm border p-2 rounded mb-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white" />
                                            
                                            <label className="block text-xs text-slate-500 mb-1">Body HTML (Unterstützt Variablen)</label>
                                            <textarea rows={4} value={t.bodyHtml} onChange={e => {
                                                const list = [...(wl.emailTemplates||[])];
                                                list[i].bodyHtml = e.target.value;
                                                updateWl('emailTemplates', list);
                                            }} className="w-full text-xs font-mono border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"></textarea>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
