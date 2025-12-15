import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useSchoolSettings() {
  const { settings, loading, fetchSettings, refreshSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    // Always fetch fresh settings on mount (force=true to bypass cache)
    fetchSettings(true);
  }, []);

  return { 
    settings, 
    loading, 
    refreshSettings,
    updateSettings
  };
}
