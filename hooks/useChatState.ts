
import { useState, useEffect } from 'react';
import { Chat, ChatMessage } from '../types/index';
import { getLocalChats, saveLocalChat } from '../services/chatStorageService';
import { useUIStore } from '../stores/useUIStore';
import { useAuthStore } from '../stores/useAuthStore';

export const useChatState = () => {
  const ui = useUIStore();
  const { user } = useAuthStore();
  const { isChatOpen, setIsChatOpen } = ui;
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Fetch registered team members from Backend or Fallback
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await fetch('/api/team/members');
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        } else {
          throw new Error('Not ok');
        }
      } catch (e) {
        // Fallback team members
        setTeamMembers([
          { email: "zuboedin@gmail.com", role: "Administrator", name: "Zubeyr", source: "Lokal" },
          { email: "sarah.web@firma.de", role: "Entwicklerin", name: "Sarah Müller", source: "AD / Active Directory" },
          { email: "tom.db@firma.de", role: "Architekt", name: "Tom Schmidt", source: "AD / Active Directory" }
        ]);
      }
    };

    fetchTeamMembers();

    // Re-trigger fetch when chat panel opens or changes
    if (isChatOpen) {
      const interval = setInterval(fetchTeamMembers, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen]);

  // Synchronize available chats with actual team members dynamically
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    const syncChatsWithTeam = async () => {
      const storedChats = await getLocalChats();
      const currentMeEmail = user.email.toLowerCase();

      // 1. Group Chat ID 'c1' (Team-Kollaboration)
      const existingGroup = storedChats.find(c => c.id === 'c1');
      const groupParticipants = teamMembers.map(m => m.email.toLowerCase());
      
      const updatedGroupChat: Chat = {
        id: 'c1',
        type: 'group',
        name: 'Projekt-Team-Kollaboration',
        participants: groupParticipants,
        messages: existingGroup ? existingGroup.messages : [
          {
            id: 'init_msg',
            senderId: 'system',
            senderName: 'System',
            text: 'Willkommen im teaminternen Kanal! Alle Änderungen am Schema werden hier in Echtzeit protokolliert.',
            timestamp: Date.now() - 3600000
          }
        ],
        unreadCount: existingGroup ? (existingGroup.unreadCount || 0) : 0
      };

      await saveLocalChat(updatedGroupChat);

      // 2. Private Chats with other actual team members
      const updatedPrivateChats: Chat[] = [];
      for (const member of teamMembers) {
        const memberEmail = member.email.toLowerCase();
        if (memberEmail === currentMeEmail) continue; // Skip myself

        const privateChatId = `private_${memberEmail}`;
        const existingPrivate = storedChats.find(c => c.id === privateChatId);

        const newPrivateChat: Chat = {
          id: privateChatId,
          type: 'private',
          name: member.name,
          participants: [currentMeEmail, memberEmail],
          isOnline: member.source.includes('AD') || member.email === 'zuboedin@gmail.com',
          messages: existingPrivate ? existingPrivate.messages : [],
          unreadCount: existingPrivate ? (existingPrivate.unreadCount || 0) : 0
        };

        await saveLocalChat(newPrivateChat);
        updatedPrivateChats.push(newPrivateChat);
      }

      setChats([updatedGroupChat, ...updatedPrivateChats]);
    };

    if (teamMembers.length > 0) {
      syncChatsWithTeam();
    }
  }, [teamMembers, user]);

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
        senderId: user?.id || 'u1',
        senderName: user?.name || 'Ich',
        text,
        timestamp: Date.now()
      }]
    };

    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
    await saveLocalChat(updatedChat);
  };

  const sendSystemMessage = async (chatId: string, text: string, senderId = 'system', senderName = 'System') => {
    setChats(prev => {
      const chatToUpdate = prev.find(c => c.id === chatId);
      if (!chatToUpdate) return prev;

      const isCurrentlyActive = isChatOpen && activeChatId === chatId;
      const updatedChat: Chat = {
        ...chatToUpdate,
        unreadCount: isCurrentlyActive ? 0 : (chatToUpdate.unreadCount || 0) + 1,
        messages: [...chatToUpdate.messages, {
          id: crypto.randomUUID(),
          senderId,
          senderName,
          text,
          timestamp: Date.now()
        }]
      };
      saveLocalChat(updatedChat);
      return prev.map(c => c.id === chatId ? updatedChat : c);
    });
  };

  return {
    isChatOpen,
    setIsChatOpen,
    activeChatId,
    chats,
    handleSelectChat,
    handleSendMessage,
    sendSystemMessage
  };
};
