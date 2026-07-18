
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: async (email, password) => {
        // Simple demo logic: admin@demo.com is admin, anyone else is user
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (password === 'admin123' && email.includes('admin')) {
          const user: User = {
            id: 'admin-1',
            name: 'Administrator',
            email: email,
            role: 'admin',
            isAuthenticated: true
          };
          set({ user });
          return true;
        } else if (password === 'user123') {
           const user: User = {
            id: 'user-1',
            name: email.split('@')[0],
            email: email,
            role: 'user',
            isAuthenticated: true
          };
          set({ user });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'admin'
    }),
    {
      name: 'db-studio-auth'
    }
  )
);
