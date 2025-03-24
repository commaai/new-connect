import { BASE_URL } from '../config'
import { getService } from './config'

function stringify(obj: Record<string, string>): string {
  return new URLSearchParams(obj).toString()
}

const GOOGLE_OAUTH_PARAMS = {
  type: 'web_server',
  client_id: '45471411055-ornt4svd2miog6dnopve7qtmh5mnu6id.apps.googleusercontent.com',
  redirect_uri: `${BASE_URL}/v2/auth/g/redirect/`,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/userinfo.email',
  prompt: 'select_account',
}
export function getGoogleAuthUrl(): string {
  const params = {
    ...GOOGLE_OAUTH_PARAMS,
    state: 'service,' + getService(),
  }
  return 'https://accounts.google.com/o/oauth2/auth?' + stringify(params)
}

const APPLE_OAUTH_PARAMS = {
  client_id: 'ai.comma.login',
  redirect_uri: `${BASE_URL}/v2/auth/a/redirect/`,
  response_type: 'code',
  response_mode: 'form_post',
  scope: 'name email',
}
export function getAppleAuthUrl(): string {
  const params = {
    ...APPLE_OAUTH_PARAMS,
    state: 'service,' + getService(),
  }
  return 'https://appleid.apple.com/auth/authorize?' + stringify(params)
}

const GITHUB_OAUTH_PARAMS = {
  client_id: '28c4ecb54bb7272cb5a4',
  redirect_uri: `${BASE_URL}/v2/auth/h/redirect/`,
  scope: 'read:user',
}
export function getGitHubAuthUrl(): string {
  const params = {
    ...GITHUB_OAUTH_PARAMS,
    state: 'service,' + getService(),
  }
  return 'https://github.com/login/oauth/authorize?' + stringify(params)
}
