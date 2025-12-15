import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Theme settings
      theme: 'light', // 'light', 'dark', 'system'
      actualTheme: 'light', // Resolved theme based on system preference
      
      // Dashboard widget settings
      dashboardWidgets: [
        { id: 'stats', name: 'Quick Stats', enabled: true, order: 0 },
        { id: 'calendar', name: 'Calendar', enabled: true, order: 1 },
        { id: 'notifications', name: 'Notifications', enabled: true, order: 2 },
        { id: 'attendance', name: 'Attendance Chart', enabled: true, order: 3 },
        { id: 'finance', name: 'Finance Overview', enabled: true, order: 4 },
        { id: 'recent', name: 'Recent Activity', enabled: true, order: 5 },
        { id: 'quickActions', name: 'Quick Actions', enabled: true, order: 6 },
        { id: 'weather', name: 'Weather', enabled: false, order: 7 },
      ],
      
      // Sidebar settings
      sidebarCollapsed: false,
      
      // Accessibility
      fontSize: 'normal', // 'small', 'normal', 'large'
      reducedMotion: false,
      highContrast: false,
      
      // Actions
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },
      
      applyTheme: () => {
        const { theme } = get();
        let actualTheme = theme;
        
        if (theme === 'system') {
          actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        set({ actualTheme });
        
        // Apply to document
        if (actualTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
          metaTheme.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#1e40af');
        }
      },
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      updateWidget: (widgetId, updates) => {
        set((state) => ({
          dashboardWidgets: state.dashboardWidgets.map(w => 
            w.id === widgetId ? { ...w, ...updates } : w
          )
        }));
      },
      
      reorderWidgets: (widgets) => set({ dashboardWidgets: widgets }),
      
      setFontSize: (fontSize) => {
        set({ fontSize });
        document.documentElement.style.fontSize = 
          fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
      },
      
      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion });
        if (reducedMotion) {
          document.documentElement.classList.add('reduce-motion');
        } else {
          document.documentElement.classList.remove('reduce-motion');
        }
      },
      
      setHighContrast: (highContrast) => {
        set({ highContrast });
        if (highContrast) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
      },
    }),
    {
      name: 'mcsms-theme',
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      store.applyTheme();
    }
  });
}
