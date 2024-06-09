export const getThemeId = (): string => {
  if (typeof document === 'undefined') return 'light'
  return document.body.getAttribute('data-theme') || 'light'
}
