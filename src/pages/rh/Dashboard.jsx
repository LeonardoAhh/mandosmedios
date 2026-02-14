import { useState, useEffect, useMemo, useCallback } from 'react'
import { db } from '../../config/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import Semaforo from '../../components/ui/Semaforo'
import Loader from '../../components/ui/Loader'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({
        totalEncuestas: 0,
        encuestasActivas: 0,
        totalUsuarios: 0,
        totalSupervisores: 0,
        totalRespuestas: 0,
        promedioGeneral: 0
    })
    const [alertas, setAlertas] = useState([])

    useEffect(() => {
        const listeners = []

        try {
            // Listener para usuarios
            listeners.push(
                onSnapshot(collection(db, 'users'), (snapshot) => {
                    setStats(prev => ({ ...prev, totalUsuarios: snapshot.size }))
                }, (err) => {
                    console.error('Error en listener de usuarios:', err)
                    setError('Error al cargar datos de usuarios')
                })
            )

            // Listener para supervisores
            listeners.push(
                onSnapshot(collection(db, 'supervisores'), (snapshot) => {
                    setStats(prev => ({ ...prev, totalSupervisores: snapshot.size }))
                }, (err) => {
                    console.error('Error en listener de supervisores:', err)
                    setError('Error al cargar datos de supervisores')
                })
            )

            // Listener para encuestas
            listeners.push(
                onSnapshot(collection(db, 'surveys'), (snapshot) => {
                    const surveys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    setStats(prev => ({
                        ...prev,
                        totalEncuestas: surveys.length,
                        encuestasActivas: surveys.filter(s => s.activa).length
                    }))
                }, (err) => {
                    console.error('Error en listener de encuestas:', err)
                    setError('Error al cargar datos de encuestas')
                })
            )

            // Listener para respuestas
            listeners.push(
                onSnapshot(collection(db, 'responses'), (snapshot) => {
                    const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                    let sumaPuntajes = 0
                    let countPuntajes = 0
                    const alertasMap = new Map()

                    responses.forEach(resp => {
                        if (resp.respuestas) {
                            const valores = Object.values(resp.respuestas).filter(v => typeof v === 'number')
                            valores.forEach(v => {
                                sumaPuntajes += v
                                countPuntajes++
                            })

                            if (valores.length > 0) {
                                const promedio = valores.reduce((a, b) => a + b, 0) / valores.length

                                if (promedio < 3 && resp.evaluadoId) {
                                    const current = alertasMap.get(resp.evaluadoId)
                                    if (!current || promedio < current.promedio) {
                                        alertasMap.set(resp.evaluadoId, {
                                            id: resp.evaluadoId,
                                            nombre: resp.evaluadoName || 'Sin nombre',
                                            promedio,
                                            nivel: resp.evaluadoDepartment || ''
                                        })
                                    }
                                }
                            }
                        }
                    })

                    const promedioGeneral = countPuntajes > 0 ? sumaPuntajes / countPuntajes : 0

                    setStats(prev => ({
                        ...prev,
                        totalRespuestas: responses.length,
                        promedioGeneral
                    }))

                    const alertasArr = Array.from(alertasMap.values())
                        .sort((a, b) => a.promedio - b.promedio)
                        .slice(0, 5)
                    setAlertas(alertasArr)

                    setLoading(false)
                }, (err) => {
                    console.error('Error en listener de respuestas:', err)
                    setError('Error al cargar datos de respuestas')
                    setLoading(false)
                })
            )
        } catch (err) {
            console.error('Error configurando listeners:', err)
            setError('Error al conectar con la base de datos')
            setLoading(false)
        }

        return () => {
            listeners.forEach(unsub => unsub())
        }
    }, [])

    // Limpiar error después de 5s
    useEffect(() => {
        if (!error) return
        const timer = setTimeout(() => setError(null), 5000)
        return () => clearTimeout(timer)
    }, [error])

    // Handlers memoizados
    const handleNavigate = useCallback((path) => {
        navigate(path)
    }, [navigate])

    // KPI items (memoizados)
    const kpiItems = useMemo(() => [
        {
            id: 'encuestas',
            path: '/rh/encuestas',
            value: stats.encuestasActivas,
            label: 'Encuestas Activas',
            badge: `${stats.encuestasActivas}/${stats.totalEncuestas}`,
            colorClass: 'dash-kpi-icon-blue',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'supervisores',
            path: '/rh/supervisores',
            value: stats.totalSupervisores,
            label: 'Supervisores',
            colorClass: 'dash-kpi-icon-teal',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'usuarios',
            path: '/rh/usuarios',
            value: stats.totalUsuarios,
            label: 'Usuarios',
            colorClass: 'dash-kpi-icon-purple',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'respuestas',
            value: stats.totalRespuestas,
            label: 'Respuestas Recibidas',
            colorClass: 'dash-kpi-icon-orange',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ], [stats])

    // Action items (estáticos)
    const actionItems = useMemo(() => [
        {
            id: 'nueva-encuesta',
            path: '/rh/encuestas/nueva',
            label: 'Nueva Encuesta',
            description: 'Crear una nueva evaluación',
            colorClass: 'dash-action-icon-blue',
            icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            )
        },
        {
            id: 'agregar-usuario',
            path: '/rh/usuarios',
            label: 'Agregar Usuario',
            description: 'Registrar nuevo operativo',
            colorClass: 'dash-action-icon-green',
            icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M26 28v-3a5 5 0 0 0-5-5H11a5 5 0 0 0-5 5v3M16 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'ver-reportes',
            path: '/rh/reportes',
            label: 'Ver Reportes',
            description: 'Análisis y estadísticas',
            colorClass: 'dash-action-icon-purple',
            icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M26 26H6V6M10 22V16M14 22V12M18 22v-8M22 22v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'supervisores',
            path: '/rh/supervisores',
            label: 'Supervisores',
            description: 'Gestionar turnos',
            colorClass: 'dash-action-icon-teal',
            icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M22 28v-3a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v3M13 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM28 28v-3a5 5 0 0 0-4-4.9M19 5.1a5 5 0 0 1 0 9.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ], [])

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
                <div className="dash-live-indicator" aria-live="polite" aria-label="Estado de conexión: en vivo">
                    <span className="dash-live-dot" aria-hidden="true" />
                    En vivo
                </div>
            </header>

            {/* Error banner */}
            {error && (
                <div className="dash-error-banner" role="alert">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="dash-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* KPIs principales */}
            <section className="dash-kpi-section" aria-label="Indicadores clave">
                {kpiItems.map((kpi) => {
                    const isClickable = !!kpi.path

                    return isClickable ? (
                        <button
                            key={kpi.id}
                            className="dash-kpi-card dash-kpi-clickable"
                            onClick={() => handleNavigate(kpi.path)}
                            aria-label={`${kpi.label}: ${kpi.value}. Ir a ${kpi.label}`}
                        >
                            <div className="dash-kpi-header">
                                <div className={`dash-kpi-icon ${kpi.colorClass}`}>
                                    {kpi.icon}
                                </div>
                                {kpi.badge && (
                                    <div className="dash-kpi-badge" aria-hidden="true">{kpi.badge}</div>
                                )}
                            </div>
                            <div className="dash-kpi-value">{kpi.value}</div>
                            <div className="dash-kpi-label">{kpi.label}</div>
                        </button>
                    ) : (
                        <div key={kpi.id} className="dash-kpi-card" aria-label={`${kpi.label}: ${kpi.value}`}>
                            <div className="dash-kpi-header">
                                <div className={`dash-kpi-icon ${kpi.colorClass}`}>
                                    {kpi.icon}
                                </div>
                            </div>
                            <div className="dash-kpi-value">{kpi.value}</div>
                            <div className="dash-kpi-label">{kpi.label}</div>
                        </div>
                    )
                })}

                {/* KPI Promedio especial */}
                <div className="dash-kpi-card dash-kpi-card-promedio" aria-label={`Promedio General: ${stats.promedioGeneral.toFixed(1)}`}>
                    <div className="dash-promedio-visual">
                        <Semaforo valor={stats.promedioGeneral} size="lg" showLabel={false} />
                    </div>
                    <div className="dash-kpi-value dash-promedio-value">
                        {stats.promedioGeneral.toFixed(1)}
                    </div>
                    <div className="dash-kpi-label">Promedio General</div>
                    <div className="dash-promedio-scale" aria-hidden="true">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                    </div>
                </div>
            </section>

            {/* Acciones Rápidas */}
            <section className="dash-section" aria-label="Acciones rápidas">
                <h2 className="dash-section-title">Acciones Rápidas</h2>
                <div className="dash-actions-grid">
                    {actionItems.map((action) => (
                        <button
                            key={action.id}
                            className="dash-action-card"
                            onClick={() => handleNavigate(action.path)}
                            aria-label={`${action.label}: ${action.description}`}
                        >
                            <div className={`dash-action-icon ${action.colorClass}`}>
                                {action.icon}
                            </div>
                            <span className="dash-action-label">{action.label}</span>
                            <span className="dash-action-description">{action.description}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Alertas de Liderazgo */}
            {alertas.length > 0 && (
                <section className="dash-section" aria-label="Alertas de liderazgo">
                    <div className="dash-section-header">
                        <h2 className="dash-section-title dash-title-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Alertas de Liderazgo
                        </h2>
                        <span className="dash-alert-count" aria-label={`${alertas.length} alertas`}>
                            {alertas.length}
                        </span>
                    </div>

                    <div className="dash-alert-container">
                        <p className="dash-alert-intro">
                            Los siguientes supervisores tienen evaluaciones por debajo del umbral aceptable (promedio &lt; 3.0)
                        </p>
                        <div className="dash-alert-list" role="list">
                            {alertas.map((alerta, index) => (
                                <div key={alerta.id} className="dash-alert-item" role="listitem">
                                    <div className="dash-alert-indicator" aria-hidden="true">
                                        <span className="dash-alert-number">{index + 1}</span>
                                    </div>
                                    <div className="dash-alert-info">
                                        <div className="dash-alert-name">{alerta.nombre}</div>
                                        <div className="dash-alert-meta">
                                            {alerta.nivel}
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
                    <div className="dash-success-container" role="status">
                        <div className="dash-success-icon" aria-hidden="true">
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
                    <div className="dash-empty-container" role="status">
                        <div className="dash-empty-icon" aria-hidden="true">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="16" y="12" width="32" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="24" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="24" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="24" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="dash-empty-title">Sin Datos de Evaluación</h3>
                        <p className="dash-empty-text">
                            Aún no hay respuestas registradas. Los operativos pueden evaluar supervisores desde su dashboard.
                        </p>
                    </div>
                </section>
            )}
        </div>
    )
}

export default Dashboard
