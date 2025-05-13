import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme configurations
const themes = {
  dark: {
    background: ['#1A0B3B', '#2E1A5C', '#4A2A8D'],
    containerBg: '#0A0A1E',
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: '#C4B5FD',
    textTertiary: '#A0E7E5',
    textMuted: '#D1D5DB',
  },
  light: {
    background: ['#E0E7FF', '#C7D2FE', '#A5B4FC'],
    containerBg: '#F5F7FA',
    glassBg: 'rgba(0, 0, 0, 0.05)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textTertiary: '#4F46E5',
    textMuted: '#6B7280',
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [theme, setTheme] = useState(themes.dark);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const isDark = savedTheme ? JSON.parse(savedTheme) : true;
        setIsDarkMode(isDark);
        setTheme(isDark ? themes.dark : themes.light);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newDarkModeState = !isDarkMode;
    setIsDarkMode(newDarkModeState);
    const newTheme = newDarkModeState ? themes.dark : themes.light;
    setTheme(newTheme);

    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newDarkModeState));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};