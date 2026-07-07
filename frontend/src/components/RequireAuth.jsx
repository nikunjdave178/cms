import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ roles }) {
  const { token, hasRole } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />

  return <Outlet />
}
