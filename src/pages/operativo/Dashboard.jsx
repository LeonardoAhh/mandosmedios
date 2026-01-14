import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../config/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './DashboardOperativo.css'

const Dashboard = () => {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile) return

        const turno = profile.turnoActual || profile.turnoFijo || 1
        const departamento = profile.departamento || 'PRODUCCIÓN'

        // Listener en tiempo real para supervisores
        const supervisoresQuery = query(
            collection(db, 'supervisores'),
            where('department', '==', departamento),
            where('currentShift', '==', turno)
        )

        const unsubscribeSupervisores = onSnapshot(supervisoresQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setSupervisores(data)
            setLoading(false)
        }, (error) => {
            console.error('Error en listener de supervisores:', error)
            setLoading(false)
        })

        // Cleanup: cancelar listeners al desmontar
        return () => {
            unsubscribeSupervisores()
        }
    }, [profile])

    const handleEvaluar = (supervisor) => {
        navigate(`/encuestas/evaluar/${supervisor.id}`)
    }

    if (loading) {
        return <Loader fullScreen message="Cargando supervisores..." />
    }

    const firstName = profile?.nombre?.split(' ')[0] || 'Usuario'
    const turnoActual = profile?.turnoActual || profile?.turnoFijo || 1

    return (
        <div className="operativo-dashboard">
            {/* Header */}
            <header className="op-header">
                <div className="op-header-content">
                    <h1 className="op-title">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="op-subtitle">
                        Tu opinión es confidencial y ayuda a mejorar el liderazgo
                    </p>
                </div>
                <div className="op-live-indicator">
                    <span className="op-live-dot"></span>
                    En vivo
                </div>
            </header>

            {/* Info Banner - Turno y Departamento */}
            <div className="op-turno-banner">
                <div className="op-turno-info">
                    <div className="op-turno-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Turno {turnoActual}</span>
                    </div>
                    <div className="op-turno-divider"></div>
                    <div className="op-turno-item">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 7h14M3 7v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M3 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{profile?.departamento}</span>
                    </div>
                </div>
            </div>

            {/* Info Card - Confidencialidad */}
            <div className="op-info-banner">
                <div className="op-info-icon">
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
            <section className="op-section">
                <div className="op-section-header">
                    <h2 className="op-section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Supervisores a Evaluar
                    </h2>
                    {supervisores.length > 0 && (
                        <span className="op-badge-count">{supervisores.length}</span>
                    )}
                </div>

                {supervisores.length === 0 ? (
                    <div className="op-empty-state">
                        <div className="op-empty-icon">
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
                    <div className="op-supervisores-grid">
                        {supervisores.map((supervisor) => (
                            <div key={supervisor.id} className="op-supervisor-card">
                                <div className="op-supervisor-header">
                                    <div className="op-supervisor-avatar">
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
                                <button className="op-btn-evaluar" onClick={() => handleEvaluar(supervisor)}>
                                    Evaluar
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default Dashboard
