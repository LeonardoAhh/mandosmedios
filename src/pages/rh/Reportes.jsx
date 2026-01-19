import { useState, useEffect } from 'react'
import {
    getAllSupervisores,
    getAllResponses,
    getCompetenciasDinamicas
} from '../../config/firebase'
import { CRITERIOS, agruparCompetenciasPorCriterio } from '../../config/criteriosEvaluacion'
import { generateSupervisorReport, generateConsolidatedReport } from '../../services/pdfService'
import Button from '../../components/ui/Button'
import Semaforo from '../../components/ui/Semaforo'
import Loader from '../../components/ui/Loader'
import './Reportes.css'

const Reportes = () => {
    const [loading, setLoading] = useState(true)
    const [supervisores, setSupervisores] = useState([])
    const [responses, setResponses] = useState([])
    const [selectedSupervisor, setSelectedSupervisor] = useState(null)
    const [reportData, setReportData] = useState(null)
    const [competencias, setCompetencias] = useState([])

    // Filtros
    const [filterDepartment, setFilterDepartment] = useState('all')
    const [filterShift, setFilterShift] = useState('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Cargar supervisores
            const supResult = await getAllSupervisores()
            if (supResult.success) {
                setSupervisores(supResult.data)
            }

            // Cargar todas las respuestas
            const respResult = await getAllResponses()
            if (respResult.success) {
                setResponses(respResult.data)
            }

            // Cargar competencias (nivel operativo evalúa mandos medios)
            const compResult = await getCompetenciasDinamicas('operativo')
            if (compResult.success) {
                setCompetencias(compResult.data)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadReport = (supervisorId) => {
        const supervisor = supervisores.find(s => s.id === supervisorId)
        const supervisorResponses = responses.filter(r => r.evaluadoId === supervisorId)

        if (supervisorResponses.length === 0) {
            setReportData({
                sinDatos: true,
                supervisor
            })
        } else {
            // Calcular promedios por competencia (pregunta individual)
            const promedios = {}

            competencias.forEach(comp => {
                const valores = supervisorResponses
                    .map(r => r.respuestas?.[comp.id])
                    .filter(v => v !== undefined && v !== null)

                if (valores.length > 0) {
                    promedios[comp.id] = {
                        promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
                        respuestas: valores.length
                    }
                }
            })

            // Agrupar por criterios (7 criterios en lugar de preguntas individuales)
            const criteriosAgrupados = agruparCompetenciasPorCriterio(competencias, promedios)

            // Extraer comentarios
            const comentarios = supervisorResponses
                .map(r => r.comentario)
                .filter(c => c && c.trim())

            // Calcular promedio general basado en criterios
            const promediosCriterios = Object.values(criteriosAgrupados).map(c => c.promedio)
            const promedioGeneral = promediosCriterios.length > 0
                ? promediosCriterios.reduce((a, b) => a + b, 0) / promediosCriterios.length
                : 0

            // Identificar fortalezas y oportunidades (ahora basado en criterios)
            const criteriosOrdenados = Object.values(criteriosAgrupados)
                .filter(c => c.promedio !== undefined)
                .sort((a, b) => b.promedio - a.promedio)

            const fortalezas = criteriosOrdenados.slice(0, 3).map(c => ({
                id: c.criterio.id,
                nombre: c.criterio.nombre,
                promedio: c.promedio
            }))
            const oportunidades = criteriosOrdenados.slice(-3).reverse().map(c => ({
                id: c.criterio.id,
                nombre: c.criterio.nombre,
                promedio: c.promedio
            }))

            // Estadísticas por turno
            const porTurno = {}
            supervisorResponses.forEach(r => {
                const turno = r.turno || 'Sin turno'
                if (!porTurno[turno]) porTurno[turno] = 0
                porTurno[turno]++
            })

            setReportData({
                supervisor,
                totalRespuestas: supervisorResponses.length,
                promedioGeneral,
                promedios, // Mantener promedios individuales por si se necesitan
                criteriosAgrupados, // Nuevo: promedios por criterio
                fortalezas,
                oportunidades,
                comentarios: comentarios.slice(0, 5),
                porTurno
            })
        }

        setSelectedSupervisor(supervisorId)
    }

    // Aplicar filtros
    const filteredSupervisores = supervisores.filter(s => {
        if (filterDepartment !== 'all' && s.department !== filterDepartment) return false
        if (filterShift !== 'all' && s.currentShift !== parseInt(filterShift)) return false
        return true
    })

    // Funciones de exportar PDF
    const handleExportPDF = () => {
        if (!reportData || reportData.sinDatos) return

        try {
            generateSupervisorReport({
                ...reportData,
                competencias
            })
        } catch (error) {
            console.error('Error generando PDF:', error)
            alert('Error al generar el PDF')
        }
    }

    const handleExportConsolidated = () => {
        try {
            generateConsolidatedReport(filteredSupervisores, responses, competencias)
        } catch (error) {
            console.error('Error generando PDF consolidado:', error)
            alert('Error al generar el PDF consolidado')
        }
    }

    const renderRadarChart = () => {
        if (!reportData || !reportData.criteriosAgrupados) return null

        const criteriosConValor = Object.values(reportData.criteriosAgrupados)
            .filter(c => c.promedio > 0)
            .sort((a, b) => b.promedio - a.promedio)

        if (criteriosConValor.length === 0) return <p>Sin datos de competencias</p>

        return (
            <div className="rep-radar-container">
                <div className="rep-radar-grid">
                    {criteriosConValor.map((item) => {
                        const porcentaje = (item.promedio / 5) * 100
                        const colorClass = item.promedio >= 4 ? 'success' : item.promedio >= 3 ? 'warning' : 'danger'

                        return (
                            <div key={item.criterio.id} className="rep-radar-bar">
                                <div className="rep-radar-label">
                                    <span className="rep-radar-icon">{item.criterio.icono}</span>
                                    {item.criterio.nombre}
                                </div>
                                <div className="rep-radar-track">
                                    <div
                                        className={`rep-radar-fill rep-radar-fill-${colorClass}`}
                                        style={{ width: `${porcentaje}%` }}
                                    ></div>
                                </div>
                                <div className="rep-radar-value">{item.promedio.toFixed(1)}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (loading) {
        return <Loader fullScreen message="Cargando reportes..." />
    }

    return (
        <div className="reportes-page">
            {/* Header */}
            <header className="rep-header">
                <div className="rep-header-content">
                    <h1 className="rep-title">Reportes de Evaluación</h1>
                    <p className="rep-subtitle">
                        Resultados de evaluaciones a supervisores por parte de operativos
                    </p>
                </div>
                <Button
                    onClick={handleExportConsolidated}
                    disabled={filteredSupervisores.length === 0}
                >
                    📥 Exportar Consolidado PDF
                </Button>
            </header>

            <div className="rep-layout">
                {/* Sidebar - Lista de supervisores */}
                <aside className="rep-sidebar">
                    <div className="rep-sidebar-header">
                        <h3 className="rep-sidebar-title">Supervisores</h3>

                        <div className="rep-filters">
                            <select
                                className="rep-filter-select"
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                            >
                                <option value="all">Todos los deptos</option>
                                <option value="PRODUCCIÓN">Producción</option>
                                <option value="CALIDAD">Calidad</option>
                            </select>

                            <select
                                className="rep-filter-select"
                                value={filterShift}
                                onChange={(e) => setFilterShift(e.target.value)}
                            >
                                <option value="all">Todos los turnos</option>
                                <option value="1">Turno 1</option>
                                <option value="2">Turno 2</option>
                                <option value="3">Turno 3</option>
                                <option value="4">Turno 4</option>
                            </select>
                        </div>
                    </div>

                    <div className="rep-evaluados-list">
                        {filteredSupervisores.length === 0 ? (
                            <div className="rep-empty-list">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
                                    <path d="M24 16v12M24 32h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p>No hay supervisores con estos filtros</p>
                            </div>
                        ) : (
                            filteredSupervisores.map((supervisor) => {
                                const respCount = responses.filter(r => r.evaluadoId === supervisor.id).length
                                return (
                                    <button
                                        key={supervisor.id}
                                        className={`rep-evaluado-item ${selectedSupervisor === supervisor.id ? 'active' : ''}`}
                                        onClick={() => loadReport(supervisor.id)}
                                    >
                                        <div className="rep-evaluado-avatar">
                                            {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="rep-evaluado-info">
                                            <span className="rep-evaluado-name">{supervisor.name}</span>
                                            <span className="rep-evaluado-nivel">
                                                {supervisor.department} · Turno {supervisor.currentShift}
                                            </span>
                                        </div>
                                        <span className="rep-response-count">{respCount}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </aside>

                {/* Main Content - Reporte */}
                <main className="rep-content">
                    {!selectedSupervisor ? (
                        <div className="rep-placeholder">
                            <div className="rep-placeholder-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
                                    <rect x="20" y="16" width="24" height="4" rx="2" fill="currentColor" />
                                    <rect x="20" y="26" width="24" height="4" rx="2" fill="currentColor" />
                                    <rect x="20" y="36" width="16" height="4" rx="2" fill="currentColor" />
                                </svg>
                            </div>
                            <h3 className="rep-placeholder-title">Selecciona un supervisor</h3>
                            <p className="rep-placeholder-text">
                                Elige a un supervisor de la lista para ver su reporte de evaluación.
                            </p>
                        </div>
                    ) : reportData?.sinDatos ? (
                        <div className="rep-placeholder">
                            <div className="rep-placeholder-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="12" y="16" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M22 32h20M22 40h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className="rep-placeholder-title">Sin evaluaciones</h3>
                            <p className="rep-placeholder-text">
                                {reportData.supervisor?.name} aún no tiene evaluaciones registradas.
                            </p>
                        </div>
                    ) : (
                        <div className="rep-detail">
                            {/* Header del reporte */}
                            <div className="rep-header-card">
                                <div className="rep-evaluado-header">
                                    <div className="rep-evaluado-avatar-lg">
                                        {reportData.supervisor?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="rep-evaluado-details">
                                        <h2 className="rep-evaluado-name-lg">{reportData.supervisor?.name}</h2>
                                        <p className="rep-evaluado-position">
                                            {reportData.supervisor?.position}
                                        </p>
                                        <div className="rep-evaluado-meta">
                                            <span className="rep-meta-item">
                                                {reportData.supervisor?.department} · Turno {reportData.supervisor?.currentShift}
                                            </span>
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
                                    <Button
                                        onClick={handleExportPDF}
                                        variant="secondary"
                                        style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}
                                    >
                                        📄 Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Estadísticas por turno */}
                            {Object.keys(reportData.porTurno || {}).length > 0 && (
                                <div className="rep-turnos-stats">
                                    <h4>Evaluaciones por turno:</h4>
                                    <div className="rep-turnos-grid">
                                        {Object.entries(reportData.porTurno).map(([turno, count]) => (
                                            <div key={turno} className="rep-turno-badge">
                                                <span className="rep-turno-label">Turno {turno}</span>
                                                <span className="rep-turno-count">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gráfico de competencias */}
                            <div className="rep-chart-card">
                                <div className="rep-card-header">
                                    <h3 className="rep-card-title">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M18 18H2V2M6 14V10M10 14V6M14 14v-4M18 14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Resultados por Criterio
                                    </h3>
                                </div>
                                {renderRadarChart()}
                            </div>

                            {/* Fortalezas y Oportunidades */}
                            {reportData.fortalezas?.length > 0 && (
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
                            )}

                            {/* Comentarios */}
                            {reportData.comentarios?.length > 0 && (
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
