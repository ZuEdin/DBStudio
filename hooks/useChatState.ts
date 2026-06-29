
import { useState, useEffect } from 'react';
import { Chat } from '../types/index';
import { getLocalChats, saveLocalChat } from '../services/chatStorageService';

export const useChatState = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const loadChats = async () => {
      const data = await getLocalChats();
      setChats(data);
    };
    loadChats();
  }, []);

  const handleSelectChat = (id: string | null) => {
    setActiveChatId(id);
    if (id) {
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === id) {
            const next = { ...chat, unreadCount: 0 };
            saveLocalChat(next);
            return next;
          }
          return chat;
        });
        return updated;
      });
    }
  };

  const handleSendMessage = async (chatId: string, text: string) => {
    const chatToUpdate = chats.find(c => c.id === chatId);
    if (!chatToUpdate) return;

    const updatedChat: Chat = {
      ...chatToUpdate,
      messages: [...chatToUpdate.messages, {
        id: crypto.randomUUID(),
        senderId: 'u1',
        senderName: 'Me',
        text,
        timestamp: Date.now()
      }]
    };

    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    await saveLocalChat(updatedChat);
  };

  return {
    isChatOpen,
    setIsChatOpen,
    activeChatId,
    chats,
    handleSelectChat,
    handleSendMessage
  };
};
