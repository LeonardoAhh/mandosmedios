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

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
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

            setAlertas(alertasTemp.slice(0, 5)) // Mostrar máximo 5 alertas

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <Loader fullScreen message="Cargando dashboard..." />
    }

    return (
        <div className="rh-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">Dashboard RH</h1>
                <p className="dashboard-subtitle">
                    Sistema de Evaluación Ascendente de Liderazgo
                </p>
            </header>

            {/* KPIs */}
            <section className="kpi-grid">
                <div className="kpi-card" onClick={() => navigate('/rh/encuestas')}>
                    <div className="kpi-icon kpi-icon-blue">📋</div>
                    <div className="kpi-value">{stats.encuestasActivas}</div>
                    <div className="kpi-label">Encuestas Activas</div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/rh/usuarios')}>
                    <div className="kpi-icon kpi-icon-purple">👥</div>
                    <div className="kpi-value">{stats.totalUsuarios}</div>
                    <div className="kpi-label">Usuarios</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon kpi-icon-orange">📝</div>
                    <div className="kpi-value">{stats.totalRespuestas}</div>
                    <div className="kpi-label">Respuestas</div>
                </div>

                <div className="kpi-card kpi-card-promedio">
                    <Semaforo valor={stats.promedioGeneral} size="lg" showLabel={false} />
                    <div className="kpi-value">{stats.promedioGeneral.toFixed(1)}</div>
                    <div className="kpi-label">Promedio General</div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
                <h2 className="section-title">Acciones Rápidas</h2>
                <div className="actions-grid">
                    <div className="action-card" onClick={() => navigate('/rh/encuestas/nueva')}>
                        <div className="action-icon">➕</div>
                        <span className="action-label">Nueva Encuesta</span>
                    </div>
                    <div className="action-card" onClick={() => navigate('/rh/usuarios/nuevo')}>
                        <div className="action-icon">👤</div>
                        <span className="action-label">Agregar Usuario</span>
                    </div>
                    <div className="action-card" onClick={() => navigate('/rh/reportes')}>
                        <div className="action-icon">📊</div>
                        <span className="action-label">Ver Reportes</span>
                    </div>
                </div>
            </section>

            {/* Alertas */}
            {alertas.length > 0 && (
                <section className="alerts-section">
                    <h2 className="section-title">⚠️ Alertas de Liderazgo</h2>
                    <div className="alert-card">
                        <p className="alerts-intro">
                            Los siguientes líderes tienen puntuaciones por debajo del umbral aceptable:
                        </p>
                        {alertas.map((alerta) => (
                            <div key={alerta.id} className="alert-item">
                                <div className="alert-indicator alert-indicator-danger"></div>
                                <div className="alert-text">
                                    <strong>{alerta.nombre}</strong>
                                    <span className="text-muted"> · {NIVELES.find(n => n.id === alerta.nivel)?.nombre}</span>
                                </div>
                                <div className="alert-value">
                                    {alerta.promedio.toFixed(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Sin alertas */}
            {alertas.length === 0 && stats.totalRespuestas > 0 && (
                <section className="alerts-section">
                    <div className="alert-card alert-card-success">
                        <div className="empty-alerts">
                            <div className="empty-icon">✅</div>
                            <p><strong>Todo en orden</strong></p>
                            <p className="text-muted">No hay alertas de liderazgo. Todas las evaluaciones están en rango aceptable.</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

export default Dashboard
