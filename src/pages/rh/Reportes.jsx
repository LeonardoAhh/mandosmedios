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
                        comentarios: comentarios.slice(0, 5), // Máximo 5 comentarios
                        competencias // Incluir las competencias usadas
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

        // Simple radar visualization using CSS
        return (
            <div className="radar-container">
                <div className="radar-grid">
                    {competencias.map((comp, i) => {
                        const porcentaje = (comp.valor / 5) * 100
                        return (
                            <div key={comp.id} className="radar-bar">
                                <div className="radar-label">{comp.nombre}</div>
                                <div className="radar-track">
                                    <div
                                        className="radar-fill"
                                        style={{
                                            width: `${porcentaje}%`,
                                            backgroundColor: comp.valor >= 4 ? 'var(--success)' :
                                                comp.valor >= 3 ? 'var(--warning)' : 'var(--danger)'
                                        }}
                                    ></div>
                                </div>
                                <div className="radar-value">{comp.valor.toFixed(1)}</div>
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
            <header className="page-header">
                <div>
                    <h1 className="page-title">Reportes de Evaluación</h1>
                    <p className="page-subtitle">
                        Resultados agregados por evaluado
                    </p>
                </div>
            </header>

            <div className="reportes-layout">
                {/* Sidebar - Lista de evaluados */}
                <aside className="evaluados-sidebar">
                    <div className="sidebar-header">
                        <h3>Seleccionar Evaluado</h3>
                        <select
                            className="filter-select"
                            value={filterNivel}
                            onChange={(e) => setFilterNivel(e.target.value)}
                        >
                            <option value="all">Todos los niveles</option>
                            {NIVELES.filter(n => n.evalua === null || ['mando_medio', 'jefe_directo', 'gerente'].includes(n.id))
                                .map(n => (
                                    <option key={n.id} value={n.id}>{n.nombre}</option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="evaluados-list">
                        {filteredEvaluados.map((evaluado) => (
                            <button
                                key={evaluado.id}
                                className={`evaluado-item ${selectedEvaluado === evaluado.id ? 'active' : ''}`}
                                onClick={() => loadReport(evaluado.id)}
                            >
                                <div className="evaluado-avatar">
                                    {evaluado.nombre?.charAt(0) || '?'}
                                </div>
                                <div className="evaluado-info">
                                    <span className="evaluado-name">{evaluado.nombre}</span>
                                    <span className="evaluado-nivel">
                                        {NIVELES.find(n => n.id === evaluado.nivel)?.nombre}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content - Reporte */}
                <main className="reporte-content">
                    {!selectedEvaluado ? (
                        <Card className="placeholder-card">
                            <div className="placeholder">
                                <span>📊</span>
                                <h3>Selecciona un evaluado</h3>
                                <p>Elige a un líder de la lista para ver su reporte de evaluación.</p>
                            </div>
                        </Card>
                    ) : loading ? (
                        <Loader message="Cargando reporte..." />
                    ) : reportData?.sinDatos ? (
                        <Card>
                            <div className="placeholder">
                                <span>📭</span>
                                <h3>Sin evaluaciones</h3>
                                <p>{reportData.evaluado?.nombre} aún no tiene evaluaciones registradas.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="reporte-detail">
                            {/* Header del reporte */}
                            <Card className="reporte-header-card">
                                <div className="reporte-header">
                                    <div className="reporte-evaluado">
                                        <div className="evaluado-avatar-lg">
                                            {reportData.evaluado?.nombre?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2>{reportData.evaluado?.nombre}</h2>
                                            <p>{NIVELES.find(n => n.id === reportData.evaluado?.nivel)?.nombre}</p>
                                        </div>
                                    </div>
                                    <div className="reporte-stats">
                                        <Semaforo valor={reportData.promedioGeneral} size="lg" />
                                        <span className="stats-label">
                                            {reportData.totalRespuestas} evaluaciones
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Gráfico */}
                            <Card title="Resultados por Competencia" icon="📊">
                                {renderRadarChart()}
                            </Card>

                            {/* Fortalezas y Oportunidades */}
                            <div className="insights-grid">
                                <Card variant="success" className="insight-card">
                                    <h3>✅ Fortalezas</h3>
                                    <ul className="insight-list">
                                        {reportData.fortalezas.map((f) => (
                                            <li key={f.id}>
                                                <span className="insight-name">{f.nombre}</span>
                                                <Semaforo valor={f.promedio} size="sm" showLabel={false} />
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card variant="warning" className="insight-card">
                                    <h3>⚠️ Áreas de Mejora</h3>
                                    <ul className="insight-list">
                                        {reportData.oportunidades.map((o) => (
                                            <li key={o.id}>
                                                <span className="insight-name">{o.nombre}</span>
                                                <Semaforo valor={o.promedio} size="sm" showLabel={false} />
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            </div>

                            {/* Comentarios */}
                            {reportData.comentarios.length > 0 && (
                                <Card title="Comentarios (anónimos)" icon="💬">
                                    <ul className="comments-list">
                                        {reportData.comentarios.map((comment, i) => (
                                            <li key={i} className="comment-item">
                                                "{comment}"
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Reportes
