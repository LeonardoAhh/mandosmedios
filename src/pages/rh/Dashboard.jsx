import { useState, useEffect } from 'react'
import {
    getSurveys,
    getAllUsers,
    getResponsesBySurvey,
    NIVELES
} from '../../config/firebase'
import Card from '../../components/ui/Card'
import Semaforo from '../../components/ui/Semaforo'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalEncuestas: 0,
        encuestasActivas: 0,
        totalUsuarios: 0,
        totalRespuestas: 0,
        promedioGeneral: 0
    })
    const [alertas, setAlertas] = useState([])
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            // Cargar encuestas
            const surveysResult = await getSurveys()
            const surveys = surveysResult.success ? surveysResult.data : []

            // Cargar usuarios
            const usersResult = await getAllUsers()
            const users = usersResult.success ? usersResult.data : []

            // Cargar respuestas de todas las encuestas
            let totalRespuestas = 0
            let sumaPuntajes = 0
            let countPuntajes = 0
            const alertasTemp = []

            for (const survey of surveys.filter(s => s.activa)) {
                const responsesResult = await getResponsesBySurvey(survey.id)
                if (responsesResult.success) {
                    const responses = responsesResult.data
                    totalRespuestas += responses.length

                    // Calcular promedios
                    responses.forEach(resp => {
                        if (resp.respuestas) {
                            const valores = Object.values(resp.respuestas)
                            valores.forEach(v => {
                                sumaPuntajes += v
                                countPuntajes++
                            })

                            // Detectar alertas (promedios < 3)
                            const promedio = valores.reduce((a, b) => a + b, 0) / valores.length
                            if (promedio < 3) {
                                const evaluado = users.find(u => u.id === resp.evaluadoId)
                                if (evaluado && !alertasTemp.some(a => a.id === resp.evaluadoId)) {
                                    alertasTemp.push({
                                        id: resp.evaluadoId,
                                        nombre: evaluado.nombre,
                                        promedio,
                                        nivel: evaluado.nivel
                                    })
                                }
                            }
                        }
                    })
                }
            }

            const promedioGeneral = countPuntajes > 0 ? sumaPuntajes / countPuntajes : 0

            setStats({
                totalEncuestas: surveys.length,
                encuestasActivas: surveys.filter(s => s.activa).length,
                totalUsuarios: users.length,
                totalRespuestas,
                promedioGeneral
            })

            // Ordenar alertas por promedio más bajo y limitar a 5
            setAlertas(alertasTemp.sort((a, b) => a.promedio - b.promedio).slice(0, 5))

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        loadDashboardData(true)
    }

    if (loading) {
        return <Loader fullScreen message="Cargando dashboard..." />
    }

    return (
        <div className="rh-dashboard">
            {/* Header */}
            <header className="dash-header">
                <div className="dash-header-content">
                    <h1 className="dash-title">Dashboard</h1>
                    <p className="dash-subtitle">
                        Panel de control del sistema de evaluación de liderazgo
                    </p>
                </div>
                <button
                    className="dash-btn-refresh"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Actualizar datos"
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
                    <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
            </header>

            {/* KPIs principales */}
            <section className="dash-kpi-section">
                <div className="dash-kpi-card dash-kpi-clickable" onClick={() => navigate('/rh/encuestas')}>
                    <div className="dash-kpi-header">
                        <div className="dash-kpi-icon dash-kpi-icon-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="dash-kpi-badge">
                            {stats.encuestasActivas}/{stats.totalEncuestas}
                        </div>
                    </div>
                    <div className="dash-kpi-value">{stats.encuestasActivas}</div>
                    <div className="dash-kpi-label">Encuestas Activas</div>
                </div>

                <div className="dash-kpi-card dash-kpi-clickable" onClick={() => navigate('/rh/usuarios')}>
                    <div className="dash-kpi-header">
                        <div className="dash-kpi-icon dash-kpi-icon-purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="dash-kpi-value">{stats.totalUsuarios}</div>
                    <div className="dash-kpi-label">Usuarios Registrados</div>
                </div>

                <div className="dash-kpi-card">
                    <div className="dash-kpi-header">
                        <div className="dash-kpi-icon dash-kpi-icon-orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="dash-kpi-value">{stats.totalRespuestas}</div>
                    <div className="dash-kpi-label">Respuestas Recibidas</div>
                </div>

                <div className="dash-kpi-card dash-kpi-card-promedio">
                    <div className="dash-promedio-visual">
                        <Semaforo valor={stats.promedioGeneral} size="lg" showLabel={false} />
                    </div>
                    <div className="dash-kpi-value dash-promedio-value">
                        {stats.promedioGeneral.toFixed(1)}
                    </div>
                    <div className="dash-kpi-label">Promedio General</div>
                    <div className="dash-promedio-scale">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                    </div>
                </div>
            </section>

            {/* Acciones Rápidas */}
            <section className="dash-section">
                <h2 className="dash-section-title">Acciones Rápidas</h2>
                <div className="dash-actions-grid">
                    <button
                        className="dash-action-card"
                        onClick={() => navigate('/rh/encuestas/nueva')}
                    >
                        <div className="dash-action-icon dash-action-icon-blue">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="dash-action-label">Nueva Encuesta</span>
                        <span className="dash-action-description">Crear una nueva evaluación</span>
                    </button>

                    <button
                        className="dash-action-card"
                        onClick={() => navigate('/rh/usuarios/nuevo')}
                    >
                        <div className="dash-action-icon dash-action-icon-green">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M26 28v-3a5 5 0 0 0-5-5H11a5 5 0 0 0-5 5v3M16 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="dash-action-label">Agregar Usuario</span>
                        <span className="dash-action-description">Registrar nuevo usuario</span>
                    </button>

                    <button
                        className="dash-action-card"
                        onClick={() => navigate('/rh/reportes')}
                    >
                        <div className="dash-action-icon dash-action-icon-purple">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M26 26H6V6M10 22V16M14 22V12M18 22v-8M22 22v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="dash-action-label">Ver Reportes</span>
                        <span className="dash-action-description">Análisis y estadísticas</span>
                    </button>

                    <button
                        className="dash-action-card"
                        onClick={() => navigate('/rh/competencias')}
                    >
                        <div className="dash-action-icon dash-action-icon-orange">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M4 16l4 4 4-4M28 16l-4-4-4 4M16 4v24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="dash-action-label">Competencias</span>
                        <span className="dash-action-description">Gestionar preguntas</span>
                    </button>
                </div>
            </section>

            {/* Alertas de Liderazgo */}
            {alertas.length > 0 && (
                <section className="dash-section">
                    <div className="dash-section-header">
                        <h2 className="dash-section-title dash-title-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Alertas de Liderazgo
                        </h2>
                        <span className="dash-alert-count">{alertas.length}</span>
                    </div>

                    <div className="dash-alert-container">
                        <p className="dash-alert-intro">
                            Los siguientes líderes tienen evaluaciones por debajo del umbral aceptable (promedio &lt; 3.0)
                        </p>
                        <div className="dash-alert-list">
                            {alertas.map((alerta, index) => (
                                <div key={alerta.id} className="dash-alert-item">
                                    <div className="dash-alert-indicator">
                                        <span className="dash-alert-number">{index + 1}</span>
                                    </div>
                                    <div className="dash-alert-info">
                                        <div className="dash-alert-name">{alerta.nombre}</div>
                                        <div className="dash-alert-meta">
                                            {NIVELES.find(n => n.id === alerta.nivel)?.nombre || alerta.nivel}
                                        </div>
                                    </div>
                                    <div className="dash-alert-score">
                                        <Semaforo valor={alerta.promedio} size="sm" showLabel={false} />
                                        <span className="dash-alert-score-value">
                                            {alerta.promedio.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Sin alertas */}
            {alertas.length === 0 && stats.totalRespuestas > 0 && (
                <section className="dash-section">
                    <div className="dash-success-container">
                        <div className="dash-success-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="28" fill="#d1fae5" />
                                <path d="M20 32l8 8 16-16" stroke="#065f46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="dash-success-title">Todo en Orden</h3>
                        <p className="dash-success-text">
                            No hay alertas de liderazgo. Todas las evaluaciones están dentro del rango aceptable.
                        </p>
                    </div>
                </section>
            )}

            {/* Sin datos */}
            {stats.totalRespuestas === 0 && (
                <section className="dash-section">
                    <div className="dash-empty-container">
                        <div className="dash-empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="16" y="12" width="32" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="24" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="24" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="24" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="dash-empty-title">Sin Datos de Evaluación</h3>
                        <p className="dash-empty-text">
                            Aún no hay respuestas registradas. Crea una encuesta y compártela para comenzar a recopilar evaluaciones.
                        </p>
                        <button
                            className="dash-empty-btn"
                            onClick={() => navigate('/rh/encuestas/nueva')}
                        >
                            Crear Primera Encuesta
                        </button>
                    </div>
                </section>
            )}
        </div>
    )
}

export default Dashboard
