import { Chat } from '../types/index';

const DB_NAME = 'DBStudioProChats';
const STORE_NAME = 'chats';
const DB_VERSION = 1;

const openChatsDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('IndexedDB error: ' + (event.target as any).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getLocalChats = async (): Promise<Chat[]> => {
  try {
    const db = await openChatsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const chats = request.result as Chat[];
        if (chats.length === 0) {
          // If completely empty, return seeded chats
          const seeded = getSeededChats();
          // Write seeded to storage asynchronously
          seeded.forEach(c => saveLocalChat(c));
          resolve(seeded);
        } else {
          resolve(chats);
        }
      };
      request.onerror = (e) => reject((e.target as any).error);
    });
  } catch (error) {
    console.warn('Could not read chats from IndexedDB, using fallback seed:', error);
    return getSeededChats();
  }
};

export const saveLocalChat = async (chat: Chat): Promise<void> => {
  try {
    const db = await openChatsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(chat);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  } catch (error) {
    console.error('Could not save chat to IndexedDB:', error);
  }
};

export const getSeededChats = (): Chat[] => {
  const now = Date.now();
  return [
    {
      id: 'c1', type: 'group', name: 'Projekt Team', participants: ['u1', 'u2', 'u3'], 
      messages: [
        { id: 'm1', senderId: 'u2', senderName: 'Sarah', text: 'Hat jemand die neue Tabelle gesehen?', timestamp: now - 3600000 },
        { id: 'm2', senderId: 'u3', senderName: 'Tom', text: 'Ja, sieht gut aus. Ich arbeite an der API.', timestamp: now - 3500000 }
      ], unreadCount: 0
    },
    {
      id: 'c2', type: 'private', name: 'Sarah Lee', participants: ['u1', 'u2'], isOnline: true,
      messages: [
        { id: 'm3', senderId: 'u2', senderName: 'Sarah', text: 'Kannst du den Deploy anstoßen?', timestamp: now - 100000 }
      ], unreadCount: 1
    },
    {
      id: 'c3', type: 'private', name: 'Tom H.', participants: ['u1', 'u3'], isOnline: false,
      messages: [], unreadCount: 0
    }
  ];
};
