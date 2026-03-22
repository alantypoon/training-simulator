/**
 * Platform detection utility.
 * Detects whether the current device is mobile/touch-based.
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // Check touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check user agent for mobile-specific strings
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Check screen size as a secondary hint
  const smallScreen = window.innerWidth <= 1024 && window.innerHeight <= 1366;

  // A device is considered mobile if it has touch AND (mobile UA OR small screen)
  return hasTouch && (mobileUA || smallScreen);
}

// Cache the result since the platform doesn't change during a session
let _isMobile: boolean | null = null;

export function isMobile(): boolean {
  if (_isMobile === null) {
    _isMobile = isMobileDevice();
  }
  return _isMobile;
}
