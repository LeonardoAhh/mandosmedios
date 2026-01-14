import { useState, useEffect } from 'react'
import {
    getSurveys,
    getAllUsers,
    getResponsesByEvaluado,
    getCompetenciasByNivel,
    NIVELES
} from '../../config/firebase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Semaforo from '../../components/ui/Semaforo'
import Loader from '../../components/ui/Loader'
import './Reportes.css'

const Reportes = () => {
    const [loading, setLoading] = useState(true)
    const [evaluados, setEvaluados] = useState([])
    const [selectedEvaluado, setSelectedEvaluado] = useState(null)
    const [reportData, setReportData] = useState(null)
    const [filterNivel, setFilterNivel] = useState('all')

    useEffect(() => {
        loadEvaluados()
    }, [])

    const loadEvaluados = async () => {
        try {
            const usersResult = await getAllUsers()
            if (usersResult.success) {
                // Filtrar solo niveles que pueden ser evaluados
                const evaluables = usersResult.data.filter(u =>
                    ['mando_medio', 'jefe_directo', 'gerente'].includes(u.nivel)
                )
                setEvaluados(evaluables)
            }
        } catch (error) {
            console.error('Error loading evaluados:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadReport = async (evaluadoId) => {
        setLoading(true)
        try {
            const responsesResult = await getResponsesByEvaluado(evaluadoId)
            if (responsesResult.success) {
                const responses = responsesResult.data

                if (responses.length === 0) {
                    setReportData({
                        sinDatos: true,
                        evaluado: evaluados.find(e => e.id === evaluadoId)
                    })
                } else {
                    const evaluado = evaluados.find(e => e.id === evaluadoId)
                    // Determinar qué nivel evalúa a este evaluado
                    const nivelEvaluador = NIVELES.find(n => n.evalua === evaluado?.nivel)
                    const competencias = getCompetenciasByNivel(nivelEvaluador?.id || 'operativo')

                    // Calcular promedios por competencia
                    const promedios = {}
                    const comentarios = []

                    competencias.forEach(comp => {
                        const valores = responses
                            .map(r => r.respuestas?.[comp.id])
                            .filter(v => v !== undefined)

                        if (valores.length > 0) {
                            promedios[comp.id] = {
                                promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
                                respuestas: valores.length
                            }
                        }
                    })

                    responses.forEach(r => {
                        if (r.comentario && r.comentario.trim()) {
                            comentarios.push(r.comentario)
                        }
                    })

                    // Calcular promedio general
                    const todosPromedios = Object.values(promedios).map(p => p.promedio)
                    const promedioGeneral = todosPromedios.reduce((a, b) => a + b, 0) / todosPromedios.length

                    // Identificar fortalezas y oportunidades
                    const competenciasOrdenadas = Object.entries(promedios)
                        .map(([id, data]) => ({
                            ...competencias.find(c => c.id === id),
                            ...data
                        }))
                        .sort((a, b) => b.promedio - a.promedio)

                    const fortalezas = competenciasOrdenadas.slice(0, 3)
                    const oportunidades = competenciasOrdenadas.slice(-3).reverse()

                    setReportData({
                        evaluado,
                        totalRespuestas: responses.length,
                        promedioGeneral,
                        promedios,
                        fortalezas,
                        oportunidades,
                        comentarios: comentarios.slice(0, 5),
                        competencias
                    })
                }
            }
        } catch (error) {
            console.error('Error loading report:', error)
        } finally {
            setLoading(false)
        }
        setSelectedEvaluado(evaluadoId)
    }

    const filteredEvaluados = evaluados.filter(e =>
        filterNivel === 'all' || e.nivel === filterNivel
    )

    const renderRadarChart = () => {
        if (!reportData || !reportData.promedios || !reportData.competencias) return null

        const competencias = reportData.competencias.map(c => ({
            ...c,
            valor: reportData.promedios[c.id]?.promedio || 0
        }))

        return (
            <div className="rep-radar-container">
                <div className="rep-radar-grid">
                    {competencias.map((comp, i) => {
                        const porcentaje = (comp.valor / 5) * 100
                        const colorClass = comp.valor >= 4 ? 'success' : comp.valor >= 3 ? 'warning' : 'danger'

                        return (
                            <div key={comp.id} className="rep-radar-bar">
                                <div className="rep-radar-label">{comp.nombre}</div>
                                <div className="rep-radar-track">
                                    <div
                                        className={`rep-radar-fill rep-radar-fill-${colorClass}`}
                                        style={{ width: `${porcentaje}%` }}
                                    ></div>
                                </div>
                                <div className="rep-radar-value">{comp.valor.toFixed(1)}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (loading && !selectedEvaluado) {
        return <Loader fullScreen message="Cargando reportes..." />
    }

    return (
        <div className="reportes-page">
            {/* Header */}
            <header className="rep-header">
                <div className="rep-header-content">
                    <h1 className="rep-title">Reportes de Evaluación</h1>
                    <p className="rep-subtitle">
                        Resultados agregados y análisis de desempeño por evaluado
                    </p>
                </div>
            </header>

            <div className="rep-layout">
                {/* Sidebar - Lista de evaluados */}
                <aside className="rep-sidebar">
                    <div className="rep-sidebar-header">
                        <h3 className="rep-sidebar-title">Evaluados</h3>
                        <select
                            className="rep-filter-select"
                            value={filterNivel}
                            onChange={(e) => setFilterNivel(e.target.value)}
                        >
                            <option value="all">Todos los niveles</option>
                            {NIVELES.filter(n => ['mando_medio', 'jefe_directo', 'gerente'].includes(n.id))
                                .map(n => (
                                    <option key={n.id} value={n.id}>{n.nombre}</option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="rep-evaluados-list">
                        {filteredEvaluados.length === 0 ? (
                            <div className="rep-empty-list">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
                                    <path d="M24 16v12M24 32h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p>No hay evaluados en este nivel</p>
                            </div>
                        ) : (
                            filteredEvaluados.map((evaluado) => (
                                <button
                                    key={evaluado.id}
                                    className={`rep-evaluado-item ${selectedEvaluado === evaluado.id ? 'active' : ''}`}
                                    onClick={() => loadReport(evaluado.id)}
                                >
                                    <div className="rep-evaluado-avatar">
                                        {evaluado.nombre?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="rep-evaluado-info">
                                        <span className="rep-evaluado-name">{evaluado.nombre}</span>
                                        <span className="rep-evaluado-nivel">
                                            {NIVELES.find(n => n.id === evaluado.nivel)?.nombre}
                                        </span>
                                    </div>
                                    {selectedEvaluado === evaluado.id && (
                                        <div className="rep-selected-indicator">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content - Reporte */}
                <main className="rep-content">
                    {!selectedEvaluado ? (
                        <div className="rep-placeholder">
                            <div className="rep-placeholder-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
                                    <rect x="20" y="16" width="24" height="4" rx="2" fill="currentColor" />
                                    <rect x="20" y="26" width="24" height="4" rx="2" fill="currentColor" />
                                    <rect x="20" y="36" width="16" height="4" rx="2" fill="currentColor" />
                                </svg>
                            </div>
                            <h3 className="rep-placeholder-title">Selecciona un evaluado</h3>
                            <p className="rep-placeholder-text">
                                Elige a un líder de la lista para ver su reporte detallado de evaluación.
                            </p>
                        </div>
                    ) : loading ? (
                        <Loader message="Cargando reporte..." />
                    ) : reportData?.sinDatos ? (
                        <div className="rep-placeholder">
                            <div className="rep-placeholder-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="12" y="16" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M22 32h20M22 40h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M24 12l8-8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="rep-placeholder-title">Sin evaluaciones</h3>
                            <p className="rep-placeholder-text">
                                {reportData.evaluado?.nombre} aún no tiene evaluaciones registradas.
                            </p>
                        </div>
                    ) : (
                        <div className="rep-detail">
                            {/* Header del reporte */}
                            <div className="rep-header-card">
                                <div className="rep-evaluado-header">
                                    <div className="rep-evaluado-avatar-lg">
                                        {reportData.evaluado?.nombre?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="rep-evaluado-details">
                                        <h2 className="rep-evaluado-name-lg">{reportData.evaluado?.nombre}</h2>
                                        <p className="rep-evaluado-position">
                                            {NIVELES.find(n => n.id === reportData.evaluado?.nivel)?.nombre}
                                        </p>
                                        <div className="rep-evaluado-meta">
                                            <span className="rep-meta-item">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM5 12H3V6h2v6zM9 12H7V4h2v8zM13 12h-2V8h2v4z" fill="currentColor" />
                                                </svg>
                                                {reportData.totalRespuestas} evaluaciones
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="rep-promedio-card">
                                    <div className="rep-promedio-semaforo">
                                        <Semaforo valor={reportData.promedioGeneral} size="lg" showLabel={false} />
                                    </div>
                                    <div className="rep-promedio-value">{reportData.promedioGeneral.toFixed(1)}</div>
                                    <div className="rep-promedio-label">Promedio General</div>
                                </div>
                            </div>

                            {/* Gráfico de competencias */}
                            <div className="rep-chart-card">
                                <div className="rep-card-header">
                                    <h3 className="rep-card-title">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M18 18H2V2M6 14V10M10 14V6M14 14v-4M18 14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Resultados por Competencia
                                    </h3>
                                </div>
                                {renderRadarChart()}
                            </div>

                            {/* Fortalezas y Oportunidades */}
                            <div className="rep-insights-grid">
                                <div className="rep-insight-card rep-insight-success">
                                    <h3 className="rep-insight-title">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.2" />
                                            <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Fortalezas
                                    </h3>
                                    <ul className="rep-insight-list">
                                        {reportData.fortalezas.map((f) => (
                                            <li key={f.id} className="rep-insight-item">
                                                <span className="rep-insight-name">{f.nombre}</span>
                                                <div className="rep-insight-score">
                                                    <Semaforo valor={f.promedio} size="sm" showLabel={false} />
                                                    <span className="rep-insight-value">{f.promedio.toFixed(1)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rep-insight-card rep-insight-warning">
                                    <h3 className="rep-insight-title">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" fill="currentColor" opacity="0.2" />
                                            <path d="M10 7v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Áreas de Mejora
                                    </h3>
                                    <ul className="rep-insight-list">
                                        {reportData.oportunidades.map((o) => (
                                            <li key={o.id} className="rep-insight-item">
                                                <span className="rep-insight-name">{o.nombre}</span>
                                                <div className="rep-insight-score">
                                                    <Semaforo valor={o.promedio} size="sm" showLabel={false} />
                                                    <span className="rep-insight-value">{o.promedio.toFixed(1)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Comentarios */}
                            {reportData.comentarios.length > 0 && (
                                <div className="rep-comments-card">
                                    <div className="rep-card-header">
                                        <h3 className="rep-card-title">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M17 7v7a2 2 0 0 1-2 2H5l-4 4V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Comentarios Anónimos
                                        </h3>
                                        <span className="rep-comments-count">{reportData.comentarios.length}</span>
                                    </div>
                                    <ul className="rep-comments-list">
                                        {reportData.comentarios.map((comment, i) => (
                                            <li key={i} className="rep-comment-item">
                                                <div className="rep-comment-icon">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M14 5.33V10.67a1.33 1.33 0 0 1-1.33 1.33H4L1.33 14.67V2.67A1.33 1.33 0 0 1 2.67 1.33h10A1.33 1.33 0 0 1 14 2.67v2.66z" fill="currentColor" />
                                                    </svg>
                                                </div>
                                                <p className="rep-comment-text">"{comment}"</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Reportes
