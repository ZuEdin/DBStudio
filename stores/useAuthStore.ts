import { create } from 'zustand';
import { AuthState, User } from '../types';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  
  login: async (email, password) => {
    if (!email.trim() || !password.trim()) return false;
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        const user: User = {
          id: data.user?.id,
          name: data.user?.name,
          email: data.user?.email,
          role: data.user?.role === 'ADMIN' ? 'admin' : 'user',
          isAuthenticated: true
        };
        set({ user });
        return true;
      } else {
        console.error("Login failed:", await res.text());
        return false;
      }
    } catch (e) {
      console.error('Real backend login failed:', e);
      return false;
    }
  },

  register: async (email, password, name) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (res.ok) {
         return true;
      }
      return false;
    } catch(e) {
      console.error('Registration failed:', e);
      return false;
    }
  },

  logout: () => set({ user: null }),
  isAdmin: () => get().user?.role === 'admin'
}));
