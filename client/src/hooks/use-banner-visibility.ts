import { useState, useEffect } from 'react';

interface BannerState {
  hasSeenToday: boolean;
  lastSeenDate: string;
}

const BANNER_STORAGE_KEY = 'diwali_banner_state';

export const useBannerVisibility = () => {
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    const checkBannerVisibility = () => {
      try {
        const stored = localStorage.getItem(BANNER_STORAGE_KEY);
        const today = new Date().toDateString();
        
        if (!stored) {
          // First time visitor - show banner
          setShouldShowBanner(true);
          return;
        }

        const bannerState: BannerState = JSON.parse(stored);
        
        // If last seen date is not today, show banner
        if (bannerState.lastSeenDate !== today) {
          setShouldShowBanner(true);
        } else {
          // Already seen today - don't show
          setShouldShowBanner(false);
        }
      } catch (error) {
        console.error('Error checking banner visibility:', error);
        // On error, show banner to be safe
        setShouldShowBanner(true);
      }
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(checkBannerVisibility, 500);
    return () => clearTimeout(timer);
  }, []);

  const markBannerAsSeen = () => {
    try {
      const today = new Date().toDateString();
      const bannerState: BannerState = {
        hasSeenToday: true,
        lastSeenDate: today
      };
      
      localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(bannerState));
      setShouldShowBanner(false);
    } catch (error) {
      console.error('Error saving banner state:', error);
    }
  };

  return {
    shouldShowBanner,
    markBannerAsSeen
  };
};
