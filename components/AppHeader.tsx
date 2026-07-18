
import React, { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { CollaborationBar } from './CollaborationBar';
import { cloudService } from '../services/cloudService';
import { Cloud, GitBranch, MessageSquare, Sun, Moon, Download, Edit2, User, Settings, Shield } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useConfigStore } from '../stores/useConfigStore';
import { Chat } from '../types/index';
import { useTicketState } from '../hooks/useTicketState';

interface AppHeaderProps {
  onAction?: (action: string, payload?: any) => void;
  chats?: Chat[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onAction, chats }) => {
  const { t } = useTranslation();
  const store = useProjectStore();
  const ui = useUIStore();
  const ticketState = useTicketState();
  const { user, isAdmin } = useAuthStore();
  const { config } = useConfigStore();
  
  const totalUnreadChatCount = chats ? chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0;
  const todoTicketsCount = ticketState.allTicketsRaw ? ticketState.allTicketsRaw.filter(t => t.status === 'todo').length : 0;
  const totalUnread = totalUnreadChatCount + todoTicketsCount;
  
  const { projectName, backendConfig } = store;
  const { darkMode, toggleDarkMode, isChatOpen, setIsChatOpen, setFormActionTrigger } = ui;

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  // Mock Data: In a real app, this would come from a Context/Store connected to Websockets
  const collaborators = cloudService.getCollaborators('mock-id');

  const onExport = () => {
      if (onAction) {
          onAction('project_backup');
      } else {
          setFormActionTrigger({ action: 'backend_export', timestamp: Date.now() });
      }
  };

  const onOpenSettings = () => {
    setIsChatOpen(true);
    // The ChatPanel will handle switching to settings tab if user is admin
  };

  return (
    <div className="bg-slate-800 text-white text-xs px-2 py-1 flex justify-between items-center select-none shrink-0 print:hidden h-10 border-b border-slate-700">
        <div className="flex items-center gap-4">
            <span className="font-bold flex items-center gap-2">
                <Cloud size={14} className="text-blue-400 font-bold shrink-0" />
                <span>{t('app.name')}</span>
                <span className="opacity-50">/</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        if (tempName.trim() && tempName !== projectName) {
                          await store.renameProject(tempName);
                        }
                        setIsEditing(false);
                      } else if (e.key === 'Escape') {
                        setIsEditing(false);
                      }
                    }}
                    onBlur={async () => {
                      if (tempName.trim() && tempName !== projectName) {
                        await store.renameProject(tempName);
                      }
                      setIsEditing(false);
                    }}
                    className="bg-slate-700 text-white font-semibold px-2 py-0.5 rounded outline-none border border-blue-500 text-xs w-40"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="hover:bg-slate-700/50 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 group transition-colors"
                    onDoubleClick={() => {
                      setTempName(projectName);
                      setIsEditing(true);
                    }}
                    title="Doppelklick zum Umbenennen"
                  >
                    {projectName}
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>
                )}
            </span>
            
            {/* Status Pills */}
            <div className="flex items-center gap-2">
                <div className="bg-slate-700 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-slate-600/50">
                    <GitBranch size={10} className="text-green-400"/>
                    <span className="text-slate-300">main</span>
                </div>
                
                {config.mode === 'DEMO' ? (
                  <div className="bg-amber-900/30 text-amber-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-amber-500/30">
                      <span>DEMO</span>
                  </div>
                ) : (
                  <div className="bg-blue-900/30 text-blue-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-blue-500/30">
                      <span>REGISTERED</span>
                  </div>
                )}

                {config.storage === 'server' && (
                  <div className="bg-emerald-900/30 text-emerald-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-emerald-500/30">
                      <span>REMOTE-DB</span>
                  </div>
                )}
            </div>
        </div>

        <div className="flex items-center">
            {/* User Profile */}
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${user?.isAuthenticated ? 'bg-slate-700/50 border border-slate-600/50' : ''} mr-2`}>
                {user?.isAuthenticated ? (
                   <>
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <span className="text-slate-300 font-medium">{user.name}</span>
                    {isAdmin() && <Shield size={10} className="text-amber-400" title="Administrator" />}
                   </>
                ) : (
                   <button 
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold"
                   >
                     <User size={14} />
                     <span>Anmelden</span>
                   </button>
                )}
            </div>

            <CollaborationBar collaborators={collaborators} />
            
            {/* Chat & Tickets Toggle */}
            {user?.isAuthenticated && (
                <div className="ml-2 mr-1 relative">
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-1.5 rounded transition-colors flex items-center gap-1.5 relative ${isChatOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title="Team Chat & Tickets / Aufgaben"
                    >
                        <div className="relative">
                            <MessageSquare size={16} />
                            {totalUnread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-slate-800">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Chat & Tickets</span>
                    </button>
                </div>
            )}

            {/* Admin Settings Cog */}
            {isAdmin() && (
              <div className="mr-1">
                <button 
                    onClick={onOpenSettings}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="System-Einstellungen"
                >
                    <Settings size={16} />
                </button>
              </div>
            )}

            {/* Dark / Light Mode Toggle */}
            <div className="mr-2">
                <button 
                    onClick={toggleDarkMode}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
                </button>
            </div>

            <div className="h-4 w-px bg-slate-600 mx-1"></div>
            <LanguageSelector />
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <button 
                onClick={onExport} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-700/50 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/30 hover:border-blue-400/50 font-semibold"
            >
                <Download size={14} />
                {t('app.save_backup')}
            </button>
        </div>
    </div>
  );
};
