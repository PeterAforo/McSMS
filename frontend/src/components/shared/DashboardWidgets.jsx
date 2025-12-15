import { useState, useEffect } from 'react';
import { 
  Settings, GripVertical, Eye, EyeOff, RotateCcw, X, Check,
  BarChart3, Calendar, Bell, Users, DollarSign, Activity,
  Zap, Cloud, TrendingUp, Clock, BookOpen, MessageSquare
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

// Widget definitions
const WIDGET_DEFINITIONS = {
  stats: {
    id: 'stats',
    name: 'Quick Stats',
    description: 'Overview of key metrics',
    icon: BarChart3,
    minWidth: 2,
    minHeight: 1,
    defaultSize: { w: 4, h: 1 }
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events and schedules',
    icon: Calendar,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Recent alerts and updates',
    icon: Bell,
    minWidth: 1,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  attendance: {
    id: 'attendance',
    name: 'Attendance Chart',
    description: 'Attendance statistics',
    icon: Users,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  finance: {
    id: 'finance',
    name: 'Finance Overview',
    description: 'Revenue and payments',
    icon: DollarSign,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  recent: {
    id: 'recent',
    name: 'Recent Activity',
    description: 'Latest actions and updates',
    icon: Activity,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  quickActions: {
    id: 'quickActions',
    name: 'Quick Actions',
    description: 'Frequently used actions',
    icon: Zap,
    minWidth: 1,
    minHeight: 1,
    defaultSize: { w: 2, h: 1 }
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather conditions',
    icon: Cloud,
    minWidth: 1,
    minHeight: 1,
    defaultSize: { w: 1, h: 1 }
  },
  performance: {
    id: 'performance',
    name: 'Performance',
    description: 'Academic performance trends',
    icon: TrendingUp,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  timetable: {
    id: 'timetable',
    name: 'Today\'s Schedule',
    description: 'Classes and events for today',
    icon: Clock,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  homework: {
    id: 'homework',
    name: 'Pending Homework',
    description: 'Assignments due soon',
    icon: BookOpen,
    minWidth: 2,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  },
  messages: {
    id: 'messages',
    name: 'Recent Messages',
    description: 'Latest messages',
    icon: MessageSquare,
    minWidth: 1,
    minHeight: 2,
    defaultSize: { w: 2, h: 2 }
  }
};

// Widget Customizer Modal
export function WidgetCustomizer({ isOpen, onClose }) {
  const { dashboardWidgets, updateWidget, reorderWidgets } = useThemeStore();
  const [localWidgets, setLocalWidgets] = useState([]);
  const [draggedWidget, setDraggedWidget] = useState(null);

  useEffect(() => {
    setLocalWidgets([...dashboardWidgets]);
  }, [dashboardWidgets, isOpen]);

  const handleToggle = (widgetId) => {
    setLocalWidgets(prev => 
      prev.map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
    );
  };

  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, widget) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget.id === widget.id) return;

    setLocalWidgets(prev => {
      const newWidgets = [...prev];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget.id);
      const targetIndex = newWidgets.findIndex(w => w.id === widget.id);
      
      newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedWidget);
      
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleSave = () => {
    reorderWidgets(localWidgets);
    onClose();
  };

  const handleReset = () => {
    const defaultWidgets = Object.values(WIDGET_DEFINITIONS).map((def, i) => ({
      id: def.id,
      name: def.name,
      enabled: ['stats', 'calendar', 'notifications', 'attendance', 'finance', 'recent', 'quickActions'].includes(def.id),
      order: i
    }));
    setLocalWidgets(defaultWidgets);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customize Dashboard</h2>
              <p className="text-sm text-gray-500">Drag to reorder, toggle to show/hide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Widgets List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-2">
            {localWidgets.map((widget) => {
              const def = WIDGET_DEFINITIONS[widget.id];
              if (!def) return null;
              const Icon = def.icon;

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget)}
                  onDragOver={(e) => handleDragOver(e, widget)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-move ${
                    widget.enabled 
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  } ${draggedWidget?.id === widget.id ? 'opacity-50' : ''}`}
                >
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    widget.enabled ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${widget.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${widget.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                      {def.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{def.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(widget.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      widget.enabled 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Widget Container Component
export function WidgetContainer({ children, title, icon: Icon, onRefresh, loading, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-gray-500" />}
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// Dashboard Customize Button
export function DashboardCustomizeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Customize
      </button>
      <WidgetCustomizer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Export widget definitions for use in dashboards
export { WIDGET_DEFINITIONS };
