import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { useLocation } from 'wouter';

export function PerformanceMonitor() {
  const { trackPagePerformance, trackUserBehavior } = useAnalytics();
  const [location] = useLocation();

  useEffect(() => {
    // Track page performance when component mounts
    const trackPerformance = () => {
      if (typeof window === 'undefined' || !window.performance) return;

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        
        // Get paint metrics
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint')[0] as PerformanceEntry;
        
        // Get CLS (Cumulative Layout Shift)
        let cumulativeLayoutShift = 0;
        if ('PerformanceObserver' in window) {
          try {
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  cumulativeLayoutShift += (entry as any).value;
                }
              }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (e) {
            // CLS not supported
          }
        }

        trackPagePerformance({
          page: location,
          loadTime: Math.round(loadTime),
          domContentLoaded: Math.round(domContentLoaded),
          firstContentfulPaint: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : undefined,
          largestContentfulPaint: largestContentfulPaint ? Math.round(largestContentfulPaint.startTime) : undefined,
          cumulativeLayoutShift: Math.round(cumulativeLayoutShift * 1000) / 1000
        });
      }
    };

    // Track performance after a short delay to ensure all metrics are available
    const timeoutId = setTimeout(trackPerformance, 1000);

    return () => clearTimeout(timeoutId);
  }, [location, trackPagePerformance]);

  useEffect(() => {
    // Track user behavior on page load
    trackUserBehavior({
      action: 'page_load',
      page: location,
      element: 'document',
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    });
  }, [location, trackUserBehavior]);

  return null; // This component doesn't render anything
}

// Hook for tracking user interactions
export function useInteractionTracking() {
  const { trackUserBehavior } = useAnalytics();
  const [location] = useLocation();

  const trackClick = (element: string, value?: any) => {
    trackUserBehavior({
      action: 'click',
      page: location,
      element,
      value,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    });
  };

  const trackScroll = (percentage: number) => {
    trackUserBehavior({
      action: 'scroll',
      page: location,
      element: 'page',
      value: percentage,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    });
  };

  const trackFormInteraction = (formName: string, action: string, success: boolean) => {
    trackUserBehavior({
      action: `form_${action}`,
      page: location,
      element: formName,
      value: success ? 1 : 0,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    });
  };

  return {
    trackClick,
    trackScroll,
    trackFormInteraction
  };
}
