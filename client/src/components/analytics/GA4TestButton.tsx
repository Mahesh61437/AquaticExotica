import React from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';

export function GA4TestButton() {
  const { trackPage, trackEvent } = useAnalytics();

  const testPageView = () => {
    console.log('🧪 Testing page view tracking...');
    trackPage('/test-page', 'Test Page');
  };

  const testEvent = () => {
    console.log('🧪 Testing event tracking...');
    trackEvent('test_event', {
      event_category: 'test',
      event_label: 'manual_test',
      value: 1,
    });
  };

  const testGA4Status = () => {
    console.log('🧪 GA4 Status Check:');
    console.log('- Window.gtag exists:', typeof window !== 'undefined' && typeof window.gtag === 'function');
    console.log('- DataLayer exists:', typeof window !== 'undefined' && Array.isArray(window.dataLayer));
    console.log('- DataLayer length:', typeof window !== 'undefined' ? window.dataLayer?.length : 'N/A');
    console.log('- DataLayer contents:', typeof window !== 'undefined' ? window.dataLayer : 'N/A');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">GA4 Test Panel</h3>
      <div className="space-y-2">
        <Button onClick={testPageView} size="sm" className="w-full">
          Test Page View
        </Button>
        <Button onClick={testEvent} size="sm" className="w-full">
          Test Event
        </Button>
        <Button onClick={testGA4Status} size="sm" className="w-full">
          Check GA4 Status
        </Button>
      </div>
    </div>
  );
}
