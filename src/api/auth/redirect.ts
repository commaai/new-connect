import storage from '~/utils/storage'

export const isSafeInternalPath = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')

export const saveRedirect = (path: string): void => {
  if (isSafeInternalPath(path)) {
    storage.setItem('postLoginRedirect', path)
  }
}

export const popRedirect = (): string | null => {
  const path = storage.getItem('postLoginRedirect')
  storage.removeItem('postLoginRedirect')
  return isSafeInternalPath(path) ? path : null
}
