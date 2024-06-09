import { Navigate } from '@solidjs/router'

import { signOut } from '~/api/auth/client'

export default function Logout() {
  signOut()
  return <Navigate href="/login" />
}
