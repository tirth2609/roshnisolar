// contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For custom session storage
import { supabase } from '../lib/supabase'; // Your Supabase client
import { User, UserRole, AppUser } from '@/types/auth'; // Import the updated User type from types/auth.ts
import { isEnvConfigured } from '@/config/env';

// Define the shape of your AuthContext
interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  updateUser: (updatedUser: AppUser) => void; // For updating user details in context
  checkUserStatus: () => Promise<boolean>; // Check if current user is still active
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Key for storing user session in AsyncStorage
const USER_SESSION_KEY = 'user_session';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load session from AsyncStorage
  const loadSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (storedUser) {
        const parsedUser: AppUser = JSON.parse(storedUser);
        
        // Check if user is still active by validating with the server
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('is_active, role')
            .eq('id', parsedUser.id)
            .single();
          
          if (error || !data) {
            // User not found or error, clear session
            console.log('❌ User not found or error, clearing session');
            await AsyncStorage.removeItem(USER_SESSION_KEY);
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
          
          // FIXED: Super admins can access regardless of status
          if (!data.is_active && data.role !== 'super_admin') {
            // User is deactivated (and not super admin), clear session and show message
            console.log('❌ User is deactivated, clearing session');
            await AsyncStorage.removeItem(USER_SESSION_KEY);
            setUser(null);
            setIsAuthenticated(false);
            Alert.alert(
              'Account Deactivated',
              'Your account has been deactivated. Please contact your administrator.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          // User is active OR super admin, set session
          const updatedUser = {
            ...parsedUser,
            isActive: data.is_active || data.role === 'super_admin' // FIXED: Super admins always active
          };
          
          setUser(updatedUser);
          setIsAuthenticated(true);
          console.log('✅ Session loaded successfully:', updatedUser.email, 'Role:', updatedUser.role, 'Active:', updatedUser.isActive);
        } catch (validationError) {
          console.error('Failed to validate user status:', validationError);
          // If validation fails, clear session for security
          await AsyncStorage.removeItem(USER_SESSION_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Failed to load user session from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  // Custom signIn function using Supabase Edge Function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if environment is configured
      if (!isEnvConfigured()) {
        console.error('❌ Supabase environment not configured properly');
        return { success: false, error: 'Configuration error. Please check your environment setup.' };
      }
      
      // Use Supabase Edge Function for login
      const { data, error } = await supabase.functions.invoke('loginUser', {
        body: { email, password },
      });

      if (error) {
        console.error('❌ Edge Function login error:', error.message);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        // data.user will be the 'User' type (snake_case) from your types/auth.ts
        const dbUser: User = data.user;

        // Map the database User type to your frontend AppUser type (camelCase)
        const loggedInUser: AppUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          phone: dbUser.phone,
          isActive: dbUser.is_active, // Map snake_case to camelCase
          createdAt: dbUser.created_at, // Map snake_case to camelCase
          updatedAt: dbUser.updated_at, // Map snake_case to camelCase
          // Map other fields as needed
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(loggedInUser)); // Store user session
        return { success: true, error: null };
      } else {
        const errorMessage = data?.message || 'Invalid credentials';
        console.error('❌ Custom login failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (e: any) {
      console.error('❌ Network or unexpected login error:', e.message);
      return { success: false, error: 'Login failed due to a network error or unexpected issue.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Custom signOut function
  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clear session from AsyncStorage
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      
      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user details in context (e.g., after profile edit)
  const updateUser = (updatedUser: AppUser) => {
    setUser((prev: AppUser | null) => (prev ? { ...prev, ...updatedUser } : updatedUser));
    // Also update in AsyncStorage if you want persistence
    AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser)).catch(console.error);
  };

  // Check if current user is still active
  const checkUserStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('is_active, role')
        .eq('id', user.id)
        .single();
      
      if (error || !data) {
        // User not found, clear session
        await signOut();
        return false;
      }
      
      // FIXED: Super admins can access regardless of status
      if (!data.is_active && data.role !== 'super_admin') {
        // User is deactivated (and not super admin), clear session
        Alert.alert(
          'Account Deactivated',
          'Your account has been deactivated. Please contact your administrator.',
          [{ text: 'OK' }]
        );
        await signOut();
        return false;
      }
      
      // User is active OR super admin
      return true;
    } catch (error) {
      console.error('Error checking user status:', error);
      // If check fails, clear session for security
      await signOut();
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    logout: signOut, // Alias for signOut
    updateUser,
    checkUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};