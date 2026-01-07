import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Rotas que pertencem ao app (não à landing page)
const APP_ROUTES = [
  '/dashboard',
  '/admin',
  '/settings',
  '/video-analyzer',
  '/scene-generator',
  '/video-generator',
  '/voice-generator',
  '/viral-library',
  '/analysis-history',
  '/folders',
  '/channel-analyzer',
  '/monitored-channels',
  '/search-channels',
  '/explore-niche',
  '/plans-credits',
  '/srt-converter',
  '/payment-success',
  '/pending-approval',
  '/viral-agents',
  '/youtube-integration',
  '/analytics',
  '/prompts-images',
];

/**
 * Hook that redirects users from root domain to app subdomain
 * when accessing app routes in production.
 */
export const useAppDomainRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    // Only run in production
    if (import.meta.env.DEV) return;

    const hostname = window.location.hostname;
    const pathname = location.pathname;

    // Check if on root domain (not app subdomain)
    const isRootDomain = hostname.includes('canaisdarks.com.br') && !hostname.startsWith('app.');
    
    // Check if accessing an app route
    const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));

    // Redirect to app subdomain if on root domain accessing app routes
    if (isRootDomain && isAppRoute) {
      const appUrl = `https://app.canaisdarks.com.br${pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(appUrl);
    }
  }, [location.pathname]);
};
