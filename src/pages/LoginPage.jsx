import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import './LoginPage.css'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [nombre, setNombre] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { login, register, profile } = useAuth()
    const navigate = useNavigate()

    // Si ya está autenticado, redirigir (usando useEffect)
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
            let result
            if (isRegister) {
                result = await register(email, password, {
                    nombre,
                    rol: 'operativo',
                    nivel: 'operativo'
                })
            } else {
                result = await login(email, password)
            }

            if (result.success) {
                // La redirección se hará automáticamente por el contexto
                window.location.reload()
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Error inesperado. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Logo y título */}
                <div className="login-header">
                    <div className="login-logo">
                        <span className="login-logo-icon">📊</span>
                    </div>
                    <h1 className="login-title">Evaluación de Liderazgo</h1>
                    <p className="login-subtitle">ViñoPlastic</p>
                </div>

                {/* Formulario */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2 className="form-title">
                        {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                    </h2>

                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {isRegister && (
                        <Input
                            label="Nombre completo"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ingresa tu nombre"
                            required
                            icon="👤"
                        />
                    )}

                    <Input
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        required
                        autoComplete="email"
                        icon="📧"
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        icon="🔒"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        loading={loading}
                    >
                        {isRegister ? 'Registrarse' : 'Entrar'}
                    </Button>

                    <p className="login-toggle">
                        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                        <button
                            type="button"
                            className="login-toggle-btn"
                            onClick={() => {
                                setIsRegister(!isRegister)
                                setError('')
                            }}
                        >
                            {isRegister ? 'Inicia sesión' : 'Regístrate'}
                        </button>
                    </p>
                </form>

                {/* Footer */}
                <p className="login-footer">
                    Sistema confidencial de evaluación ascendente
                </p>
            </div>

            {/* Background decoration */}
            <div className="login-bg">
                <div className="login-bg-circle login-bg-circle-1"></div>
                <div className="login-bg-circle login-bg-circle-2"></div>
            </div>
        </div>
    )
}

export default LoginPage
