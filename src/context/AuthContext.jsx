import { createContext, useContext, useState, useEffect } from 'react'
import { auth, getUserProfile, loginUser, logoutUser, registerUser } from '../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                const result = await getUserProfile(firebaseUser.uid)
                if (result.success) {
                    setProfile(result.data)
                }
            } else {
                setUser(null)
                setProfile(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (email, password) => {
        setError(null)
        const result = await loginUser(email, password)
        if (result.success) {
            // Cargar perfil del usuario después del login
            const profileResult = await getUserProfile(result.user.uid)
            if (profileResult.success) {
                return { success: true, profile: profileResult.data }
            }
        } else {
            setError(result.error)
        }
        return result
    }

    // register - Solo para uso de RH
    const register = async (email, password, userData) => {
        setError(null)
        const result = await registerUser(email, password, userData)
        if (!result.success) {
            setError(result.error)
        }
        return result
    }

    const logout = async () => {
        setError(null)
        const result = await logoutUser()
        if (result.success) {
            setUser(null)
            setProfile(null)
        }
        return result
    }

    const isRH = () => profile?.rol === 'rh'
    const isOperativo = () => profile?.rol === 'operativo'

    const value = {
        user,
        profile,
        loading,
        error,
        login,
        register,
        logout,
        isRH,
        isOperativo
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
