import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  clearStoredToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
} from '../services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  successMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    businessName: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
  clearSuccessMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const response = await getCurrentUser(storedToken);
          setUser(response.data.user);
          setToken(storedToken);
        } catch {
          clearStoredToken();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    setUser(response.data.user);
    setToken(response.data.token);
    storeToken(response.data.token);
    setSuccessMessage('Signed in successfully.');
  }, []);

  const register = useCallback(async (payload: {
    name: string;
    email: string;
    phone?: string;
    businessName: string;
    password: string;
    confirmPassword: string;
  }) => {
    const response = await registerUser(payload);
    setUser(response.data.user);
    setToken(response.data.token);
    storeToken(response.data.token);
    setSuccessMessage('Account created successfully.');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredToken();
    setSuccessMessage(null);
  }, []);

  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        successMessage,
        login,
        register,
        logout,
        clearSuccessMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
