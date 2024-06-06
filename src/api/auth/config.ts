let service = 'localhost:3000'

export function getService() {
  if (typeof window !== 'undefined') {
    service = window.location.host
  }
  return service
}
