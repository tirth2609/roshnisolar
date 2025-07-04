import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  primary: string;
  primaryLight: string;
  surface: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  textTertiary: string;
  shadow: string;
  borderSecondary: string;
}

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme: Theme = {
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  surface: '#FFFFFF',
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  textTertiary: '#A0AEC0',
  shadow: 'rgba(0,0,0,0.15)',
  borderSecondary: '#CBD5E1',
};

const darkTheme: Theme = {
  primary: '#60A5FA',
  primaryLight: '#1E3A8A',
  surface: '#1F2937',
  background: '#111827',
  backgroundSecondary: '#1E293B',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textInverse: '#111827',
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  textTertiary: '#6B7280',
  shadow: 'rgba(0,0,0,0.7)',
  borderSecondary: '#334155',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 