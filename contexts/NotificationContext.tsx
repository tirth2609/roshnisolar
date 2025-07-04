import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  pushNotifications: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
}

interface NotificationContextType extends NotificationSettings {
  setPushNotifications: (value: boolean) => void;
  setEmailAlerts: (value: boolean) => void;
  setSmsAlerts: (value: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailAlerts: true,
    smsAlerts: false,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('notificationSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load notification settings from storage', error);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save notification settings to storage', error);
    }
  };

  const setPushNotifications = (value: boolean) => updateSetting('pushNotifications', value);
  const setEmailAlerts = (value: boolean) => updateSetting('emailAlerts', value);
  const setSmsAlerts = (value: boolean) => updateSetting('smsAlerts', value);

  return (
    <NotificationContext.Provider 
      value={{ 
        ...settings,
        setPushNotifications,
        setEmailAlerts,
        setSmsAlerts
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 