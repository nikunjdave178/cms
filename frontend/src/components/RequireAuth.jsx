import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MAIN_PATH } from '../constants/nav'

export default function RequireAuth({ roles }) {
  const { token, hasRole } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (roles && !hasRole(...roles)) return <Navigate to={MAIN_PATH} replace />

  return <Outlet />
}
