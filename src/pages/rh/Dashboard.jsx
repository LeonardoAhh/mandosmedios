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
            listeners.push(
                onSnapshot(collection(db, 'users'), (snapshot) => {
                    setStats(prev => ({ ...prev, totalUsuarios: snapshot.size }))
                }, (err) => {
                    console.error('Error en listener de usuarios:', err)
                    setError('Error al cargar datos de usuarios')
                })
            )

            listeners.push(
                onSnapshot(collection(db, 'supervisores'), (snapshot) => {
                    setStats(prev => ({ ...prev, totalSupervisores: snapshot.size }))
                }, (err) => {
                    console.error('Error en listener de supervisores:', err)
                })
            )

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
                })
            )

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

    useEffect(() => {
        if (!error) return
        const timer = setTimeout(() => setError(null), 5000)
        return () => clearTimeout(timer)
    }, [error])

    const handleNavigate = useCallback((path) => {
        navigate(path)
    }, [navigate])

    const getNivelColor = (promedio) => {
        if (promedio >= 4.5) return '#16a34a'
        if (promedio >= 4.0) return '#3b82f6'
        if (promedio >= 3.0) return '#d97706'
        return '#dc2626'
    }

    if (loading) {
        return <Loader fullScreen message="Cargando dashboard..." />
    }

    return (
        <div className="dash-page">
            {/* Header */}
            <header className="dash-header">
                <div className="dash-header-info">
                    <h1 className="dash-title">Hola</h1>
                    <p className="dash-subtitle">Resumen de evaluaciones de liderazgo</p>
                </div>
                <div className="dash-header-status">
                    <span className="dash-status-dot"></span>
                    <span>En vivo</span>
                </div>
            </header>

            {/* Error */}
            {error && (
                <div className="dash-error">{error}</div>
            )}

            {/* Stats Grid */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card" onClick={() => handleNavigate('/rh/encuestas')}>
                    <div className="dash-stat-icon dash-stat-blue">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M8 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    </div>
                    <div className="dash-stat-content">
                        <span className="dash-stat-value">{stats.encuestasActivas}</span>
                        <span className="dash-stat-label">Encuestas activas</span>
                    </div>
                </div>

                <div className="dash-stat-card" onClick={() => handleNavigate('/rh/supervisores')}>
                    <div className="dash-stat-icon dash-stat-teal">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M16 18v-2a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    </div>
                    <div className="dash-stat-content">
                        <span className="dash-stat-value">{stats.totalSupervisores}</span>
                        <span className="dash-stat-label">Supervisores</span>
                    </div>
                </div>

                <div className="dash-stat-card" onClick={() => handleNavigate('/rh/usuarios')}>
                    <div className="dash-stat-icon dash-stat-purple">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M18 18v-2a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    </div>
                    <div className="dash-stat-content">
                        <span className="dash-stat-value">{stats.totalUsuarios}</span>
                        <span className="dash-stat-label">Usuarios</span>
                    </div>
                </div>

                <div className="dash-stat-card dash-stat-highlight">
                    <div className="dash-stat-icon dash-stat-orange">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M8 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 10v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    </div>
                    <div className="dash-stat-content">
                        <span className="dash-stat-value">{stats.totalRespuestas}</span>
                        <span className="dash-stat-label">Evaluaciones</span>
                    </div>
                </div>
            </div>

            {/* Promedio General */}
            <div className="dash-promedio-card">
                <div className="dash-promedio-visual">
                    <Semaforo valor={stats.promedioGeneral} size="lg" showLabel={false} />
                </div>
                <div className="dash-promedio-info">
                    <span className="dash-promedio-value" style={{ color: getNivelColor(stats.promedioGeneral) }}>
                        {stats.promedioGeneral.toFixed(1)}
                    </span>
                    <span className="dash-promedio-label">Promedio General</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-section">
                <h2 className="dash-section-title">Acciones</h2>
                <div className="dash-actions">
                    <button className="dash-action" onClick={() => handleNavigate('/rh/encuestas/nueva')}>
                        <div className="dash-action-icon dash-action-blue">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span>Nueva Encuesta</span>
                    </button>
                    <button className="dash-action" onClick={() => handleNavigate('/rh/usuarios')}>
                        <div className="dash-action-icon dash-action-green">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M15 16v-2a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M18 14v3M15 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span>Agregar Usuario</span>
                    </button>
                    <button className="dash-action" onClick={() => handleNavigate('/rh/reportes')}>
                        <div className="dash-action-icon dash-action-purple">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M18 18H2V2M5 14V10M9 14V6M13 14v-4M17 14v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span>Reportes</span>
                    </button>
                    <button className="dash-action" onClick={() => handleNavigate('/rh/reportes/final')}>
                        <div className="dash-action-icon dash-action-orange">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M7 7h6M7 10h4M7 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span>Resumen</span>
                    </button>
                </div>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
                <div className="dash-section">
                    <div className="dash-section-header">
                        <h2 className="dash-section-title">Alertas</h2>
                        <span className="dash-alert-badge">{alertas.length}</span>
                    </div>
                    <div className="dash-alerts">
                        {alertas.map((alerta, index) => (
                            <div key={alerta.id} className="dash-alert">
                                <div className="dash-alert-num">{index + 1}</div>
                                <div className="dash-alert-info">
                                    <span className="dash-alert-name">{alerta.nombre}</span>
                                    <span className="dash-alert-dept">{alerta.nivel}</span>
                                </div>
                                <div className="dash-alert-score" style={{ color: getNivelColor(alerta.promedio) }}>
                                    {alerta.promedio.toFixed(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Success State */}
            {alertas.length === 0 && stats.totalRespuestas > 0 && (
                <div className="dash-success">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="20" fill="#dcfce7"/>
                        <path d="M16 24l6 6 12-12" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>Todo en orden</p>
                </div>
            )}

            {/* Empty State */}
            {stats.totalRespuestas === 0 && (
                <div className="dash-empty">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="12" y="10" width="24" height="28" rx="2" stroke="#d4d4d8" strokeWidth="2"/>
                        <path d="M18 20h12M18 26h8" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Sin evaluaciones aún</p>
                    <span>Los operativos pueden evaluar desde su panel</span>
                </div>
            )}
        </div>
    )
}

export default Dashboard
