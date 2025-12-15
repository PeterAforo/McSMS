import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: {
        school_name: 'McSMS Pro',
        school_logo: null,
        school_tagline: 'School Management System',
        school_abbreviation: '',
        school_address: '',
        school_phone: '',
        school_email: '',
        school_website: '',
        school_motto: ''
      },
      loading: false,
      lastFetched: null,

      // Fetch settings from API
      fetchSettings: async (force = false) => {
        const state = get();
        const now = Date.now();
        
        // Only fetch if forced or if last fetch was more than 5 seconds ago
        if (!force && state.lastFetched && (now - state.lastFetched) < 5000) {
          return state.settings;
        }

        set({ loading: true });
        
        try {
          // Add cache-busting parameter
          const response = await axios.get(`${API_BASE_URL}/public_settings.php?_t=${now}`);
          if (response.data.success && response.data.settings) {
            const newSettings = response.data.settings;
            console.log('Fetched settings:', newSettings); // Debug log
            set({ 
              settings: newSettings,
              lastFetched: now,
              loading: false
            });
            return newSettings;
          }
        } catch (error) {
          console.error('Failed to fetch school settings:', error);
        }
        
        set({ loading: false });
        return state.settings;
      },

      // Update settings locally (after saving to API)
      updateSettings: (newSettings) => {
        console.log('Updating settings locally:', newSettings); // Debug log
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          lastFetched: Date.now()
        }));
      },

      // Force refresh settings - clears cache and fetches fresh
      refreshSettings: async () => {
        console.log('Force refreshing settings...'); // Debug log
        // Clear the lastFetched to force a fresh fetch
        set({ lastFetched: null });
        return get().fetchSettings(true);
      },

      // Clear all cached settings
      clearCache: () => {
        set({ lastFetched: null });
      }
    }),
    {
      name: 'school-settings-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        lastFetched: state.lastFetched
      })
    }
  )
);
