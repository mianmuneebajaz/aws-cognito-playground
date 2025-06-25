import { CognitoConfig } from '../types';

const STORAGE_KEY = 'cognito-debug-configs';

export const saveConfigurations = (configs: CognitoConfig[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    return true;
  } catch (error) {
    console.error('Failed to save configurations:', error);
    return false;
  }
};

export const loadConfigurations = (): CognitoConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load configurations:', error);
    return [];
  }
};

export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};