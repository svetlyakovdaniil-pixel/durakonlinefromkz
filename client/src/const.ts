export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = (returnPath?: string) => {
  const base = `${window.location.origin}/login`;
  if (returnPath) {
    return `${base}?returnPath=${encodeURIComponent(returnPath)}`;
  }
  return base;
};
