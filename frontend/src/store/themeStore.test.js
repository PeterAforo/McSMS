import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({
      theme: 'light',
      actualTheme: 'light',
      sidebarCollapsed: false,
      fontSize: 'normal',
      reducedMotion: false,
      highContrast: false,
      dashboardWidgets: [
        { id: 'stats', name: 'Quick Stats', enabled: true, order: 0 },
        { id: 'calendar', name: 'Calendar', enabled: true, order: 1 },
      ],
    });
  });

  describe('initial state', () => {
    it('should have correct initial theme', () => {
      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.actualTheme).toBe('light');
    });

    it('should have sidebar not collapsed by default', () => {
      const state = useThemeStore.getState();
      expect(state.sidebarCollapsed).toBe(false);
    });

    it('should have normal font size by default', () => {
      const state = useThemeStore.getState();
      expect(state.fontSize).toBe('normal');
    });

    it('should have accessibility features disabled by default', () => {
      const state = useThemeStore.getState();
      expect(state.reducedMotion).toBe(false);
      expect(state.highContrast).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('dark');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
    });

    it('should set theme to light', () => {
      useThemeStore.setState({ theme: 'dark' });
      const { setTheme } = useThemeStore.getState();
      setTheme('light');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should set theme to system', () => {
      const { setTheme } = useThemeStore.getState();
      setTheme('system');

      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from collapsed to expanded', () => {
      useThemeStore.setState({ sidebarCollapsed: true });
      const { toggleSidebar } = useThemeStore.getState();
      toggleSidebar();

      const state = useThemeStore.getState();
      expect(state.sidebarCollapsed).toBe(false);
    });

    it('should toggle sidebar from expanded to collapsed', () => {
      const { toggleSidebar } = useThemeStore.getState();
      toggleSidebar();

      const state = useThemeStore.getState();
      expect(state.sidebarCollapsed).toBe(true);
    });
  });

  describe('updateWidget', () => {
    it('should update widget enabled status', () => {
      const { updateWidget } = useThemeStore.getState();
      updateWidget('stats', { enabled: false });

      const state = useThemeStore.getState();
      const statsWidget = state.dashboardWidgets.find(w => w.id === 'stats');
      expect(statsWidget.enabled).toBe(false);
    });

    it('should update widget order', () => {
      const { updateWidget } = useThemeStore.getState();
      updateWidget('calendar', { order: 5 });

      const state = useThemeStore.getState();
      const calendarWidget = state.dashboardWidgets.find(w => w.id === 'calendar');
      expect(calendarWidget.order).toBe(5);
    });
  });

  describe('reorderWidgets', () => {
    it('should reorder widgets', () => {
      const newOrder = [
        { id: 'calendar', name: 'Calendar', enabled: true, order: 0 },
        { id: 'stats', name: 'Quick Stats', enabled: true, order: 1 },
      ];

      const { reorderWidgets } = useThemeStore.getState();
      reorderWidgets(newOrder);

      const state = useThemeStore.getState();
      expect(state.dashboardWidgets[0].id).toBe('calendar');
      expect(state.dashboardWidgets[1].id).toBe('stats');
    });
  });

  describe('setFontSize', () => {
    it('should set font size to small', () => {
      const { setFontSize } = useThemeStore.getState();
      setFontSize('small');

      const state = useThemeStore.getState();
      expect(state.fontSize).toBe('small');
    });

    it('should set font size to large', () => {
      const { setFontSize } = useThemeStore.getState();
      setFontSize('large');

      const state = useThemeStore.getState();
      expect(state.fontSize).toBe('large');
    });
  });

  describe('accessibility settings', () => {
    it('should enable reduced motion', () => {
      const { setReducedMotion } = useThemeStore.getState();
      setReducedMotion(true);

      const state = useThemeStore.getState();
      expect(state.reducedMotion).toBe(true);
    });

    it('should enable high contrast', () => {
      const { setHighContrast } = useThemeStore.getState();
      setHighContrast(true);

      const state = useThemeStore.getState();
      expect(state.highContrast).toBe(true);
    });

    it('should disable reduced motion', () => {
      useThemeStore.setState({ reducedMotion: true });
      const { setReducedMotion } = useThemeStore.getState();
      setReducedMotion(false);

      const state = useThemeStore.getState();
      expect(state.reducedMotion).toBe(false);
    });
  });
});
