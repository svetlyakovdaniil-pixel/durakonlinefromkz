export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redirect to the custom login page (Google/Apple/Email) instead of Manus OAuth.
export const getLoginUrl = (returnPath?: string) => {
  const base = `${window.location.origin}/login`;
  if (returnPath) {
    return `${base}?returnPath=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
