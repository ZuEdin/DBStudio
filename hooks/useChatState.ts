
import { useState } from 'react';
import { Chat } from '../types/index';

export const useChatState = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [chats, setChats] = useState<Chat[]>([
      {
          id: 'c1', type: 'group', name: 'Projekt Team', participants: ['u1', 'u2', 'u3'], 
          messages: [
              { id: 'm1', senderId: 'u2', senderName: 'Sarah', text: 'Hat jemand die neue Tabelle gesehen?', timestamp: Date.now() - 3600000 },
              { id: 'm2', senderId: 'u3', senderName: 'Tom', text: 'Ja, sieht gut aus. Ich arbeite an der API.', timestamp: Date.now() - 3500000 }
          ], unreadCount: 0
      },
      {
          id: 'c2', type: 'private', name: 'Sarah Lee', participants: ['u1', 'u2'], isOnline: true,
          messages: [
              { id: 'm3', senderId: 'u2', senderName: 'Sarah', text: 'Kannst du den Deploy anstoßen?', timestamp: Date.now() - 100000 }
          ], unreadCount: 1
      },
      {
          id: 'c3', type: 'private', name: 'Tom H.', participants: ['u1', 'u3'], isOnline: false,
          messages: [], unreadCount: 0
      }
  ]);

  const handleSelectChat = (id: string | null) => {
      setActiveChatId(id);
  };

  const handleSendMessage = (chatId: string, text: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
              return {
                  ...chat,
                  messages: [...chat.messages, {
                      id: crypto.randomUUID(),
                      senderId: 'u1', 
                      senderName: 'Me',
                      text,
                      timestamp: Date.now()
                  }]
              };
          }
          return chat;
      }));
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
