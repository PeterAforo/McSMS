import { useState, useRef, useEffect } from 'react';

/**
 * Lazy Loading Image Component
 * Only loads images when they enter the viewport
 * Includes placeholder, error handling, and smooth transitions
 */
export default function LazyImage({ 
  src, 
  alt = '', 
  className = '', 
  placeholder = null,
  fallback = '/images/placeholder.png',
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Default placeholder - simple gray background with spinner
  const defaultPlaceholder = (
    <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center ${className}`}>
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Placeholder shown while loading */}
      {!isLoaded && (placeholder || defaultPlaceholder)}
      
      {/* Actual image - only starts loading when in view */}
      {isInView && (
        <img
          src={hasError ? fallback : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300 ease-in-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          style={{ position: isLoaded ? 'relative' : 'absolute', top: 0, left: 0 }}
        />
      )}
    </div>
  );
}

/**
 * Avatar variant with circular styling and initials fallback
 */
export function LazyAvatar({ 
  src, 
  name = '', 
  size = 'md',
  className = '' 
}) {
  const [hasError, setHasError] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!src || hasError) {
    return (
      <div 
        className={`
          ${sizes[size]} 
          ${getColorFromName(name)}
          rounded-full flex items-center justify-center text-white font-medium
          ${className}
        `}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover ${className}`}
      placeholder={
        <div className={`${sizes[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-medium`}>
          {getInitials(name)}
        </div>
      }
      fallback={null}
    />
  );
}

/**
 * Thumbnail variant for grid displays
 */
export function LazyThumbnail({ 
  src, 
  alt = '',
  aspectRatio = '16/9',
  className = '' 
}) {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
      style={{ aspectRatio }}
    >
      <LazyImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
