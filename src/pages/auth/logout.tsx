import { Navigate } from 'solid-start'

import { signOut } from '~/api/auth/client'

export default function Logout() {
  signOut()
  return <Navigate href="/login" />
}
