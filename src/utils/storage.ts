/**
 * Prefix to prevent conflicts with other apps writing to local storage in development.
 */
const STORAGE_PREFIX = 'connect:'

/**
 * Storage key type. Used to catch typos in the key name.
 */
type StorageKey = 'lastSelectedDongleId' | 'postLoginRedirect'

export default {
  getItem(key: StorageKey): string | null {
    return localStorage.getItem(STORAGE_PREFIX + key)
  },

  setItem(key: StorageKey, value: string): void {
    localStorage.setItem(STORAGE_PREFIX + key, value)
  },

  removeItem(key: StorageKey): void {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },
}
