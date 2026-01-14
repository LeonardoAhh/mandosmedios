import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSurveys, getUsersByNivel, NIVELES } from '../../config/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './DashboardOperativo.css'

const Dashboard = () => {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState([])
    const [loading, setLoading] = useState(true)
    const [evaluados, setEvaluados] = useState([])
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

            // Obtener encuestas activas para el nivel del usuario
            const nivelConfig = NIVELES.find(n => n.id === profile.nivel)
            const nivelAEvaluar = nivelConfig?.evalua

            // Cargar TODAS las encuestas activas y filtrar en cliente
            const surveysResult = await getSurveys({ activa: true })

            if (surveysResult.success) {
                // Filtrar encuestas que coincidan con el nivel del usuario
                const filteredSurveys = surveysResult.data.filter(survey =>
                    survey.nivelEvaluador === profile.nivel
                )
                console.log('Encuestas encontradas:', surveysResult.data)
                console.log('Nivel usuario:', profile.nivel)
                console.log('Encuestas filtradas:', filteredSurveys)
                setSurveys(filteredSurveys)
            }

            if (nivelAEvaluar) {
                // Cargar posibles evaluados (mandos superiores)
                const evaluadosResult = await getUsersByNivel(nivelAEvaluar)
                if (evaluadosResult.success) {
                    setEvaluados(evaluadosResult.data)
                }
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

    if (loading) {
        return <Loader fullScreen message="Cargando encuestas..." />
    }

    const nivelConfig = NIVELES.find(n => n.id === profile?.nivel)
    const firstName = profile?.nombre?.split(' ')[0] || 'Usuario'

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
                    aria-label="Actualizar encuestas"
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

            {/* Encuestas Pendientes */}
            <section className="op-section">
                <div className="op-section-header">
                    <h2 className="op-section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Encuestas Pendientes
                    </h2>
                    {surveys.length > 0 && (
                        <span className="op-badge-count">{surveys.length}</span>
                    )}
                </div>

                {surveys.length === 0 ? (
                    <div className="op-empty-state">
                        <div className="op-empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="28" fill="#d1fae5" />
                                <path d="M20 32l8 8 16-16" stroke="#065f46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="op-empty-title">No hay encuestas pendientes</h3>
                        <p className="op-empty-text">
                            Estás al día con tus evaluaciones. Te notificaremos cuando haya nuevas evaluaciones disponibles.
                        </p>
                    </div>
                ) : (
                    <div className="op-surveys-grid">
                        {surveys.map((survey) => (
                            <div
                                key={survey.id}
                                className="op-survey-card"
                                onClick={() => navigate(`/encuestas/${survey.id}`)}
                            >
                                <div className="op-survey-header">
                                    <span className="op-survey-badge">Nueva</span>
                                    <div className="op-survey-meta-icons">
                                        <span className="op-survey-meta-item" title="Competencias a evaluar">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            {survey.competencias?.length || 10}
                                        </span>
                                        <span className="op-survey-meta-item" title="Tiempo estimado">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                                                <path d="M8 4v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            ~5 min
                                        </span>
                                    </div>
                                </div>

                                <h3 className="op-survey-title">{survey.titulo}</h3>
                                <p className="op-survey-description">{survey.descripcion}</p>

                                <button className="op-survey-btn">
                                    <span>Iniciar Evaluación</span>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Evaluación Directa (sin encuestas formales) */}
            {surveys.length === 0 && evaluados.length > 0 && (
                <section className="op-section">
                    <div className="op-section-header">
                        <h2 className="op-section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Evaluar a tu {
                                nivelConfig?.evalua === 'mando_medio' ? 'Mando Medio' :
                                    nivelConfig?.evalua === 'jefe_directo' ? 'Jefe Directo' :
                                        'Superior'
                            }
                        </h2>
                    </div>

                    <p className="op-section-description">
                        Puedes evaluar a tus superiores directos usando la evaluación estándar del sistema.
                    </p>

                    <div className="op-evaluados-grid">
                        {evaluados.map((evaluado) => (
                            <div
                                key={evaluado.id}
                                className="op-evaluado-card"
                                onClick={() => navigate(`/encuestas/evaluar/${evaluado.id}`)}
                            >
                                <div className="op-evaluado-avatar">
                                    {evaluado.nombre?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="op-evaluado-info">
                                    <span className="op-evaluado-name">{evaluado.nombre}</span>
                                    <span className="op-evaluado-role">
                                        {NIVELES.find(n => n.id === evaluado.nivel)?.nombre || evaluado.nivel}
                                    </span>
                                </div>
                                <div className="op-evaluado-arrow">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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
