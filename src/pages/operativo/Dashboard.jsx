import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db, hasEvaluated } from '../../config/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './DashboardOperativo.css'

const Dashboard = () => {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [supervisores, setSupervisores] = useState([])
    const [evaluatedSupervisors, setEvaluatedSupervisors] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!profile) return

        const turno = profile.turnoActual || profile.turnoFijo || 1
        const departamento = profile.departamento || 'PRODUCCIÓN'

        const supervisoresQuery = query(
            collection(db, 'supervisores'),
            where('department', '==', departamento),
            where('currentShift', '==', turno)
        )

        const unsubscribeSupervisores = onSnapshot(supervisoresQuery, async (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setSupervisores(data)

            if (profile?.id) {
                const evaluated = new Set()
                for (const sup of data) {
                    try {
                        const result = await hasEvaluated(profile.id, sup.id)
                        if (result.hasEvaluated) {
                            evaluated.add(sup.id)
                        }
                    } catch (err) {
                        console.error('Error verificando evaluación:', err)
                    }
                }
                setEvaluatedSupervisors(evaluated)
            }

            setLoading(false)
        }, (err) => {
            console.error('Error en listener de supervisores:', err)
            setError('Error al cargar supervisores. Intenta recargar la página.')
            setLoading(false)
        })

        return () => {
            unsubscribeSupervisores()
        }
    }, [profile])

    // Auto-dismiss error después de 6 segundos
    useEffect(() => {
        if (!error) return
        const timer = setTimeout(() => setError(null), 6000)
        return () => clearTimeout(timer)
    }, [error])

    const handleEvaluar = useCallback((supervisor) => {
        navigate(`/encuestas/evaluar/${supervisor.id}`)
    }, [navigate])

    if (loading) {
        return <Loader fullScreen message="Cargando supervisores..." />
    }

    const firstName = profile?.nombre?.split(' ')[0] || 'Usuario'
    const turnoActual = profile?.turnoActual || profile?.turnoFijo || 1

    return (
        <div className="operativo-dashboard">
            {/* Error Banner */}
            {error && (
                <div className="op-error-banner" role="alert">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="op-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* Header */}
            <header className="op-header" aria-label="Encabezado del dashboard">
                <div className="op-header-content">
                    <h1 className="op-title">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="op-subtitle">
                        Tu opinión es confidencial y ayuda a mejorar el liderazgo
                    </p>
                </div>
                <div className="op-live-indicator" aria-live="polite" aria-label="Estado de conexión: en vivo">
                    <span className="op-live-dot" aria-hidden="true"></span>
                    En vivo
                </div>
            </header>

            {/* Info Banner - Turno y Departamento */}
            <div className="op-turno-banner" role="status" aria-label={`Turno ${turnoActual}, ${profile?.departamento}`}>
                <div className="op-turno-info">
                    <div className="op-turno-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Turno {turnoActual}</span>
                    </div>
                    <div className="op-turno-divider" aria-hidden="true"></div>
                    <div className="op-turno-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M3 7h14M3 7v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M3 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{profile?.departamento}</span>
                    </div>
                </div>
            </div>

            {/* Info Card - Confidencialidad */}
            <div className="op-info-banner">
                <div className="op-info-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                </div>
                <div className="op-info-content">
                    <h3 className="op-info-title">100% Anónimo y Confidencial</h3>
                    <p className="op-info-text">
                        Tus respuestas no pueden ser rastreadas. Responde con honestidad para ayudar a mejorar el liderazgo.
                    </p>
                </div>
            </div>

            {/* Lista de Supervisores */}
            <section className="op-section" aria-label="Supervisores a evaluar">
                <div className="op-section-header">
                    <h2 className="op-section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Supervisores a Evaluar
                    </h2>
                    {supervisores.length > 0 && (
                        <span className="op-badge-count" aria-label={`${supervisores.length} supervisores`}>{supervisores.length}</span>
                    )}
                </div>

                {supervisores.length === 0 ? (
                    <div className="op-empty-state">
                        <div className="op-empty-icon" aria-hidden="true">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
                                <path d="M32 45v-8M32 29a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="op-empty-title">Sin supervisores en tu turno</h3>
                        <p className="op-empty-text">
                            No hay supervisores asignados al Turno {turnoActual} de {profile?.departamento}.
                        </p>
                    </div>
                ) : (
                    <div className="op-supervisores-grid" role="list">
                        {supervisores.map((supervisor) => {
                            const alreadyEvaluated = evaluatedSupervisors.has(supervisor.id)
                            return (
                                <div key={supervisor.id} className="op-supervisor-card" role="listitem">
                                    <div className="op-supervisor-header">
                                        <div className="op-supervisor-avatar" aria-hidden="true">
                                            {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="op-supervisor-info">
                                            <h3 className="op-supervisor-name">{supervisor.name}</h3>
                                            <p className="op-supervisor-position">{supervisor.position}</p>
                                        </div>
                                    </div>
                                    <div className="op-supervisor-meta">
                                        <span className="op-supervisor-dept">{supervisor.department}</span>
                                    </div>
                                    {alreadyEvaluated ? (
                                        <div className="op-evaluated-badge" aria-label={`${supervisor.name} ya fue evaluado`}>
                                            ✅ Ya evaluado
                                        </div>
                                    ) : (
                                        <button
                                            className="op-btn-evaluar"
                                            onClick={() => handleEvaluar(supervisor)}
                                            aria-label={`Evaluar a ${supervisor.name}`}
                                        >
                                            Evaluar
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

export default Dashboard
