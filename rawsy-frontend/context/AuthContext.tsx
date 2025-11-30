import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'manufacturer' | 'supplier' | 'admin';
  status: string;
  companyName?: string;
  tinNumber?: string;
  companyDescription?: string;
  businessLocation?: {
    address?: string;
    placeName?: string;
    contactName?: string;
    contactPhone?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  factoryLocation?: {
    address?: string;
    placeName?: string;
    contactName?: string;
    contactPhone?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await authService.getToken();
        const storedUser = await authService.getCurrentUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Optionally refresh user from backend
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(res.data.profile);
          await authService.updateStoredUser(res.data.profile);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        await authService.clearAuth();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const { user: loggedInUser, token: jwtToken } = await authService.login({ emailOrPhone, password });
      setUser(loggedInUser);
      setToken(jwtToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: any) => {
    try {
      const { user: registeredUser, token: jwtToken } = await authService.register(data);
      setUser(registeredUser);
      setToken(jwtToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.profile);
      await authService.updateStoredUser(res.data.profile);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
