import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import type { User, LoginCredentials, RegisterCredentials, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: userData, isError } = useQuery(
    'currentUser',
    () => api.auth.me(),
    {
      enabled: !!token,
      retry: false,
      onSuccess: (response) => {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoading(false);
      },
      onError: () => {
        // Token is invalid
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setIsLoading(false);
      },
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    (credentials: LoginCredentials) => api.auth.login(credentials),
    {
      onSuccess: (response) => {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Giriş başarılı!');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Giriş başarısız';
        toast.error(message);
      },
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    (credentials: RegisterCredentials) => api.auth.register(credentials),
    {
      onSuccess: (response) => {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Kayıt başarılı!');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Kayıt başarısız';
        toast.error(message);
      },
    }
  );

  // Logout
  const logout = () => {
    try {
      api.auth.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      queryClient.clear();
      toast.success('Başarıyla çıkış yapıldı');
    }
  };

  // Update user
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Initialize loading state
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
    }
  }, [token]);

  // Auto-logout when token is invalid
  useEffect(() => {
    if (isError && token) {
      logout();
    }
  }, [isError, token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading: isLoading || loginMutation.isLoading || registerMutation.isLoading,
    isAuthenticated: !!user && !!token,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;