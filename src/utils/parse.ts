export const parseUploadPath = (url: string) => {
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/')
  if (parsed.hostname === 'upload.commadotai.com') {
    return { route: parts[2], segment: parseInt(parts[3], 10), filename: parts[4], isFirehose: true }
  }
  return { route: parts[3], segment: parseInt(parts[4], 10), filename: parts[5], isFirehose: false }
}
