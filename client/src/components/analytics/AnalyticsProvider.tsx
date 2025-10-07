import React, { useEffect } from 'react';
import { initializeGA4, GA4_CONFIG } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize GA4 when the app loads
    console.log('🚀 Initializing GA4...');
    console.log('📊 Environment variables:', {
      VITE_GA4_MEASUREMENT_ID: import.meta.env.VITE_GA4_MEASUREMENT_ID,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      MODE: import.meta.env.MODE,
    });
    initializeGA4();
  }, []);

  // Show debug info in development
  useEffect(() => {
    console.log('🔍 Analytics Provider initialized');
    console.log('📊 GA4 Config:', {
      enabled: GA4_CONFIG.ENABLED,
      measurementId: GA4_CONFIG.MEASUREMENT_ID,
      debugMode: GA4_CONFIG.DEBUG_MODE,
    });
  }, []);

  return <>{children}</>;
}
