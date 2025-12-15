import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Standardized StatCard component for consistent UI across all modules
 * Use this component for all dashboard statistics cards
 */
export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  change,
  changeType, // 'increase', 'decrease', 'neutral'
  color = 'blue',
  onClick,
  loading = false,
  className = ''
}) {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      text: 'text-red-600 dark:text-red-400'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
      text: 'text-pink-600 dark:text-pink-400'
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
      text: 'text-cyan-600 dark:text-cyan-400'
    }
  };

  const colorScheme = colors[color] || colors.blue;

  const changeColors = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400'
  };

  const ChangeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Minus;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600' : ''} ${className}`}
      onClick={onClick}
    >
      {loading ? (
        <div className="animate-pulse">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorScheme.icon}`}>
              {Icon && <Icon className="w-5 h-5" />}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${changeColors[changeType] || changeColors.neutral}`}>
                <ChangeIcon className="w-4 h-4" />
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subValue && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subValue}</p>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        </>
      )}
    </div>
  );
}

/**
 * Standardized DataCard for displaying detailed information
 */
export function DataCard({ 
  title, 
  subtitle,
  icon: Icon,
  children, 
  actions,
  className = '',
  loading = false,
  noPadding = false
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {loading ? (
        <div className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      ) : (
        <div className={noPadding ? '' : 'p-5'}>{children}</div>
      )}
    </div>
  );
}

/**
 * Standardized ListItem for consistent list displays
 */
export function ListItem({ 
  icon: Icon,
  iconColor = 'blue',
  title, 
  subtitle, 
  value, 
  valueColor,
  badge,
  badgeColor = 'gray',
  onClick,
  actions
}) {
  const iconColors = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600'
  };

  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  };

  const valueColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    default: 'text-gray-900 dark:text-white'
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[iconColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
        {value && (
          <span className={`font-semibold ${valueColors[valueColor] || valueColors.default}`}>
            {value}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}

/**
 * Standardized EmptyState for when no data is available
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {action && actionLabel && (
        <button onClick={action} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Standardized ProgressBar
 */
export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'blue',
  showLabel = true,
  size = 'md',
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const barColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500 dark:text-gray-400">{value}</span>
          <span className="text-gray-500 dark:text-gray-400">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${sizes[size]} ${barColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Standardized Badge component
 */
export function Badge({ 
  children, 
  color = 'gray',
  size = 'sm',
  dot = false
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  };

  const dotColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${colors[color]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}
