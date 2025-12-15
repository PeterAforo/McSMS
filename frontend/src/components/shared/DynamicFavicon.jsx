import { useEffect } from 'react';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { API_BASE_URL } from '../../config';

/**
 * DynamicFavicon Component
 * Updates the browser favicon, page title, and PWA manifest based on school settings
 */
export default function DynamicFavicon() {
  const { settings } = useSchoolSettings();

  useEffect(() => {
    // Update favicon
    if (settings.school_logo) {
      const logoUrl = settings.school_logo.startsWith('http') 
        ? settings.school_logo 
        : `${API_BASE_URL.replace('/backend/api', '')}${settings.school_logo}`;
      
      // Update or create favicon link
      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.type = 'image/png';
      favicon.href = logoUrl;

      // Also update apple-touch-icon
      let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = logoUrl;
    }

    // Update page title
    if (settings.school_name) {
      document.title = `${settings.school_name} - School Management System`;
      
      // Update meta tags for PWA
      let metaAppTitle = document.querySelector("meta[name='apple-mobile-web-app-title']");
      if (metaAppTitle) {
        metaAppTitle.content = settings.school_name;
      }
      
      let metaDescription = document.querySelector("meta[name='description']");
      if (metaDescription) {
        metaDescription.content = `${settings.school_name} - ${settings.school_tagline || 'School Management System'}`;
      }
    }

    // Update theme color if primary color is set
    if (settings.primary_color) {
      let metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        metaThemeColor.content = settings.primary_color;
      }
    }

    // Update manifest link to use dynamic manifest
    let manifestLink = document.querySelector("link[rel='manifest']");
    if (manifestLink) {
      // Add cache-busting parameter to force refresh
      const manifestUrl = `${API_BASE_URL}/manifest.php?v=${Date.now()}`;
      manifestLink.href = manifestUrl;
    }

  }, [settings.school_logo, settings.school_name, settings.school_tagline, settings.primary_color]);

  // This component doesn't render anything
  return null;
}
