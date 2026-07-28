
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

export interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}
