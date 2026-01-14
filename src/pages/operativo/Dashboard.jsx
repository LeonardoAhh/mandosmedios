import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSupervisoresByDepartmentAndShift } from '../../config/firebase'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './DashboardOperativo.css'

const Dashboard = () => {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [supervisores, setSupervisores] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        loadData()
    }, [profile])

    const loadData = async (isRefresh = false) => {
        if (!profile) return

        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            // Cargar supervisores del turno actual y departamento del usuario
            const turno = profile.turnoActual || profile.turnoFijo || 1
            const departamento = profile.departamento || 'PRODUCCIÓN'

            console.log('Cargando supervisores:', { turno, departamento })

            const result = await getSupervisoresByDepartmentAndShift(departamento, turno)

            if (result.success) {
                console.log('Supervisores encontrados:', result.data)
                setSupervisores(result.data)
            } else {
                console.error('Error cargando supervisores:', result.error)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        loadData(true)
    }

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
                <button
                    className="op-btn-refresh"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Actualizar supervisores"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className={refreshing ? 'rotating' : ''}
                    >
                        <path d="M17.5 10a7.5 7.5 0 1 1-2.197-5.303M15 3v4.5h-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
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
                                <circle cx="32" cy="32" r="28" fill="#fef3c7" />
                                <path d="M32 20v12M32 40h.01" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="op-empty-title">No hay supervisores en tu turno</h3>
                        <p className="op-empty-text">
                            No encontramos supervisores asignados al turno {turnoActual} de {profile?.departamento}.
                            Si crees que esto es un error, contacta a Recursos Humanos.
                        </p>
                    </div>
                ) : (
                    <div className="op-supervisores-grid">
                        {supervisores.map((supervisor) => (
                            <div
                                key={supervisor.id}
                                className="op-supervisor-card"
                                onClick={() => handleEvaluar(supervisor)}
                            >
                                <div className="op-supervisor-avatar">
                                    {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="op-supervisor-info">
                                    <h3 className="op-supervisor-name">{supervisor.name}</h3>
                                    <p className="op-supervisor-position">{supervisor.position}</p>
                                </div>
                                <button className="op-supervisor-btn">
                                    <span>Evaluar</span>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Ayuda */}
            <section className="op-section">
                <div className="op-help-card">
                    <div className="op-help-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 16v.01M12 12a2 2 0 0 0-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2c0 1.5-2 1.5-2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="op-help-content">
                        <h3 className="op-help-title">¿Necesitas ayuda?</h3>
                        <p className="op-help-text">
                            Si tienes dudas sobre cómo completar una evaluación, contacta a tu departamento de RH.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Dashboard
