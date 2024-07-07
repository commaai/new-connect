/**
 * Prefix to prevent conflicts with other apps writing to local storage in development.
 */
const STORAGE_PREFIX = 'connect:'

/**
 * Storage key type. Used to catch typos in the key name.
 */
type StorageKey = 'lastSelectedDongleId'

export default {
  getItem(key: StorageKey): string | null {
    return localStorage.getItem(STORAGE_PREFIX + key)
  },

  removeItem(key: StorageKey): void {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  setItem(key: StorageKey, value: string | null): void {
    if (value === null) {
      this.removeItem(key)
    } else {
      localStorage.setItem(STORAGE_PREFIX + key, value)
    }
  },
}
