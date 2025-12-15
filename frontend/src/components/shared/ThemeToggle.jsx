import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle({ showLabel = false, variant = 'icon' }) {
  const { theme, setTheme, actualTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-blue-500' },
    { id: 'system', label: 'System', icon: Monitor, color: 'text-gray-500' },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  if (variant === 'simple') {
    return (
      <button
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <CurrentIcon className={`w-5 h-5 ${currentTheme.color}`} />
        {showLabel && (
          <span className="text-sm text-gray-700 dark:text-gray-300">{currentTheme.label}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    theme === t.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${t.color}`} />
                  <span className={`text-sm ${theme === t.id ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t.label}
                  </span>
                  {theme === t.id && (
                    <span className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Theme Settings Panel
export function ThemeSettings() {
  const { 
    theme, setTheme, 
    fontSize, setFontSize,
    reducedMotion, setReducedMotion,
    highContrast, setHighContrast
  } = useThemeStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </h3>
        
        {/* Theme Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun, preview: 'bg-white border-gray-200' },
              { id: 'dark', label: 'Dark', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
              { id: 'system', label: 'System', icon: Monitor, preview: 'bg-gradient-to-r from-white to-gray-900' },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === t.id 
                      ? 'border-blue-500 ring-2 ring-blue-500/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg mb-3 ${t.preview} border`} />
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Font Size</label>
        <div className="flex gap-2">
          {['small', 'normal', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                fontSize === size
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}`}>
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Accessibility</label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-400">Reduce motion</span>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`w-11 h-6 rounded-full transition-colors ${
              reducedMotion ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              reducedMotion ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-400">High contrast</span>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-11 h-6 rounded-full transition-colors ${
              highContrast ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              highContrast ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </label>
      </div>
    </div>
  );
}
