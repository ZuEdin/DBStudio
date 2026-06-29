
import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '../types/index';
import { MessageSquare, Users, X, Send, ChevronLeft, MoreVertical, Circle, ClipboardList } from 'lucide-react';
import { useTicketState } from '../hooks/useTicketState';
import { TicketBoard } from './TicketBoard';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string | null) => void;
  onSendMessage: (chatId: string, text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, onClose, chats, activeChatId, onSelectChat, onSendMessage 
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);

  const ticketState = useTicketState();
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');

  useEffect(() => {
    if (activeChatId) {
        setActiveTab('chat');
        scrollToBottom();
    }
  }, [activeChatId, activeChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !activeChatId) return;
      onSendMessage(activeChatId, inputText);
      setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col fixed bottom-6 right-6 ${activeTab === 'chat' ? 'w-80' : 'w-[640px] md:w-[720px]'} h-[540px] bg-white border border-slate-300 shadow-2xl z-[9999] rounded-xl overflow-hidden shadow-black/20 transition-all duration-300`}>
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-3 flex justify-between items-center shrink-0 h-10">
            <div className="flex items-center gap-2">
                {activeChatId ? (
                    <button onClick={() => onSelectChat(null)} className="hover:bg-slate-700 p-1 rounded">
                        <ChevronLeft size={18}/>
                    </button>
                ) : (
                    activeTab === 'chat' ? <MessageSquare size={18}/> : <ClipboardList size={18}/>
                )}
                <span className="font-bold text-sm truncate">
                    {activeChat ? activeChat.name : (activeTab === 'chat' ? 'Team Chat' : 'Projekt-Tickets & Todos')}
                </span>
            </div>
            <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded text-slate-300 hover:text-white">
                <X size={18}/>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {!activeChatId && (
                <div className="flex bg-slate-100 border-b border-slate-200 shrink-0 p-1">
                    <button 
                        type="button"
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <MessageSquare size={14} />
                        Team Chat
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('tickets')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'tickets' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ClipboardList size={14} />
                        Tickets & Aufgaben
                    </button>
                </div>
            )}

            {activeTab === 'tickets' ? (
                <TicketBoard
                    tickets={ticketState.tickets}
                    allTicketsRaw={ticketState.allTicketsRaw}
                    onAddTicket={ticketState.addTicket}
                    onUpdateTicketStatus={ticketState.updateTicketStatus}
                    onDeleteTicket={ticketState.deleteTicket}
                    filterPriority={ticketState.filterPriority}
                    setFilterPriority={ticketState.setFilterPriority}
                    filterAssigned={ticketState.filterAssigned}
                    setFilterAssigned={ticketState.setFilterAssigned}
                    searchQuery={ticketState.searchQuery}
                    setSearchQuery={ticketState.setSearchQuery}
                />
            ) : !activeChatId ? (
                // Chat List
                <div className="flex-1 overflow-y-auto">
                    {/* Groups Section */}
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Gruppen</div>
                    {chats.filter(c => c.type === 'group').map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => onSelectChat(chat.id)}
                            className="px-4 py-3 hover:bg-white border-b border-slate-100 cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-semibold text-sm text-slate-800 truncate">{chat.name}</span>
                                    {chat.unreadCount ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span> : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Keine Nachrichten'}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Direct Messages Section */}
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-2">Direktnachrichten</div>
                    {chats.filter(c => c.type === 'private').map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => onSelectChat(chat.id)}
                            className="px-4 py-3 hover:bg-white border-b border-slate-100 cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 relative">
                                {chat.name.substring(0, 2).toUpperCase()}
                                {chat.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-50 rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-semibold text-sm text-slate-800 truncate">{chat.name}</span>
                                    {chat.unreadCount ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span> : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Starten Sie eine Unterhaltung'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Active Conversation
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeChat?.messages.map((msg) => {
                            const isMe = msg.senderId === 'u1'; // Hardcoded current user for demo
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 shadow-sm text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}`}>
                                        {!isMe && activeChat.type === 'group' && (
                                            <div className="text-[10px] font-bold text-slate-500 mb-1">{msg.senderName}</div>
                                        )}
                                        <div>{msg.text}</div>
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nachricht schreiben..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <Send size={16} className="ml-0.5"/>
                        </button>
                    </form>
                </>
            )}
        </div>
    </div>
  );
};
