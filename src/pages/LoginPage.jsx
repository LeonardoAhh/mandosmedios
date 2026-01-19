import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserCurrentShift } from '../config/firebase'
import Button from '../components/ui/Button'
import './LoginPage.css'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showTurnoSelector, setShowTurnoSelector] = useState(false)
    const [turnoActual, setTurnoActual] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [tempUserData, setTempUserData] = useState(null)

    const { login, profile } = useAuth()
    const navigate = useNavigate()

    // Si ya está autenticado, redirigir
    useEffect(() => {
        if (profile) {
            navigate(profile.rol === 'rh' ? '/rh' : '/encuestas', { replace: true })
        }
    }, [profile, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(email, password)

            if (result.success) {
                // Si es operativo, mostrar selector de turno
                if (result.profile?.rol === 'operativo') {
                    setTempUserData(result.profile)
                    setTurnoActual(result.profile.turnoFijo || 1)
                    setShowTurnoSelector(true)
                    setLoading(false)
                } else {
                    // Si es RH, redirigir directamente
                    window.location.reload()
                }
            } else {
                setError(result.error)
                setLoading(false)
            }
        } catch (err) {
            setError('Error inesperado. Por favor intenta de nuevo.')
            setLoading(false)
        }
    }

    const handleTurnoSubmit = async () => {
        setLoading(true)
        try {
            // Actualizar turno actual del usuario
            await updateUserCurrentShift(tempUserData.id, turnoActual)
            window.location.reload()
        } catch (err) {
            setError('Error al actualizar turno')
            setLoading(false)
        }
    }

    // Selector de turno
    if (showTurnoSelector && tempUserData) {
        const maxTurnos = tempUserData.departamento === 'CALIDAD' ? 2 : 4
        const turnos = Array.from({ length: maxTurnos }, (_, i) => i + 1)

        return (
            <div className="login-page">
                <div className="login-bg">
                    <div className="login-bg-shape login-bg-shape-1"></div>
                    <div className="login-bg-shape login-bg-shape-2"></div>
                    <div className="login-bg-shape login-bg-shape-3"></div>
                </div>

                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <div className="login-logo">
                                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                    <rect width="56" height="56" rx="12" fill="url(#loginGradient)" />
                                    <path d="M28 18v20M18 28h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="loginGradient" x1="0" y1="0" x2="56" y2="56">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#2563eb" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <h1 className="login-title">Bienvenido, {tempUserData.nombre?.split(' ')[0]}</h1>
                            <p className="login-subtitle">Selecciona tu turno actual</p>
                        </div>

                        <div className="login-form">
                            <div className="form-header">
                                <h2 className="form-title">Turno de Trabajo</h2>
                                <p className="form-description">
                                    Departamento: {tempUserData.departamento}
                                </p>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="turno-selector">
                                {turnos.map(turno => (
                                    <button
                                        key={turno}
                                        type="button"
                                        className={`turno-btn ${turnoActual === turno ? 'active' : ''}`}
                                        onClick={() => setTurnoActual(turno)}
                                    >
                                        <div className="turno-label">Turno {turno}</div>
                                        {tempUserData.turnoFijo === turno && (
                                            <span className="turno-badge">Tu turno fijo</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <Button
                                type="button"
                                fullWidth
                                size="lg"
                                loading={loading}
                                disabled={loading}
                                onClick={handleTurnoSubmit}
                            >
                                Continuar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Formulario de login
    return (
        <div className="login-page">
            {/* Background decorativo */}
            <div className="login-bg">
                <div className="login-bg-shape login-bg-shape-1"></div>
                <div className="login-bg-shape login-bg-shape-2"></div>
                <div className="login-bg-shape login-bg-shape-3"></div>
            </div>

            {/* Contenedor principal */}
            <div className="login-container">
                <div className="login-card">
                    {/* Logo y Header */}
                    <div className="login-header">
                        <div className="login-logo">
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <rect width="56" height="56" rx="12" fill="url(#loginGradient)" />
                                <path d="M28 18v20M18 28h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="loginGradient" x1="0" y1="0" x2="56" y2="56">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h1 className="login-title">Evaluación de Liderazgo</h1>
                        <p className="login-subtitle">ViñoPlastic</p>
                    </div>

                    {/* Formulario */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-header">
                            <h2 className="form-title">Iniciar Sesión</h2>
                            <p className="form-description">
                                Ingresa tus credenciales para continuar
                            </p>
                        </div>

                        {error && (
                            <div className="login-error">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                    <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-fields">
                            <div className="form-group">
                                <label className="form-label">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M14 4L8 9L2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="operativo123@vinoplastic.local"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <rect x="4" y="7" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M6 7V5a2 2 0 1 1 4 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="8" cy="10.5" r="0.75" fill="currentColor" />
                                    </svg>
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={loading}
                            disabled={loading}
                        >
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </Button>

                        <div className="login-help-text">
                            Si no tienes credenciales, contacta a Recursos Humanos
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="login-footer">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="6" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M5 6V4a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="8" cy="10" r="0.75" fill="currentColor" />
                        </svg>
                        <span>Sistema confidencial de evaluación ascendente</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
