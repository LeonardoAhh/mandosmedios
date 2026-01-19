import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loader from '../ui/Loader'

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <Loader fullScreen message="Verificando sesión..." />
    }

    // No autenticado
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Esperando perfil
    if (!profile) {
        return <Loader fullScreen message="Cargando perfil..." />
    }

    // Verificar rol si es requerido
    if (requiredRole && profile.rol !== requiredRole) {
        // Redirigir según rol
        if (profile.rol === 'rh') {
            return <Navigate to="/rh" replace />
        } else {
            return <Navigate to="/encuestas" replace />
        }
    }

    return children
}

export default ProtectedRoute
