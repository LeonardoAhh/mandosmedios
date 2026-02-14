import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    getAllSupervisores,
    getAllResponses,
    getCompetenciasDinamicas
} from '../../config/firebase'
import { agruparCompetenciasPorCriterio } from '../../config/criteriosEvaluacion'
import { generateSupervisorReport, generateConsolidatedReport } from '../../services/pdfService'
import Button from '../../components/ui/Button'
import Semaforo from '../../components/ui/Semaforo'
import Loader from '../../components/ui/Loader'
import './Reportes.css'

// =====================
// SUBCOMPONENTES
// =====================

/** Barra de progreso con accesibilidad para el gráfico de criterios */
const RadarChart = ({ criteriosAgrupados }) => {
    const criteriosConValor = useMemo(() =>
        Object.values(criteriosAgrupados)
            .filter(c => c.promedio > 0)
            .sort((a, b) => b.promedio - a.promedio),
        [criteriosAgrupados]
    )

    if (criteriosConValor.length === 0) {
        return <p className="rep-no-data">Sin datos de competencias</p>
    }

    return (
        <div className="rep-radar-container" role="group" aria-label="Resultados por criterio de evaluación">
            <div className="rep-radar-grid">
                {criteriosConValor.map((item) => {
                    const porcentaje = (item.promedio / 5) * 100
                    const colorClass = item.promedio >= 4 ? 'success' : item.promedio >= 3 ? 'warning' : 'danger'

                    return (
                        <div key={item.criterio.id} className="rep-radar-bar">
                            <div className="rep-radar-label">
                                <span className="rep-radar-icon" aria-hidden="true">{item.criterio.icono}</span>
                                {item.criterio.nombre}
                            </div>
                            <div
                                className="rep-radar-track"
                                role="progressbar"
                                aria-valuenow={item.promedio.toFixed(1)}
                                aria-valuemin="0"
                                aria-valuemax="5"
                                aria-label={`${item.criterio.nombre}: ${item.promedio.toFixed(1)} de 5`}
                            >
                                <div
                                    className={`rep-radar-fill rep-radar-fill-${colorClass} rep-radar-fill-animate`}
                                    style={{ '--target-width': `${porcentaje}%` }}
                                />
                            </div>
                            <div className="rep-radar-value" aria-hidden="true">
                                {item.promedio.toFixed(1)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/** Grid de fortalezas y áreas de mejora */
const InsightsGrid = ({ fortalezas, oportunidades }) => {
    if (!fortalezas?.length) return null

    return (
        <div className="rep-insights-grid">
            <div className="rep-insight-card rep-insight-success" role="region" aria-label="Fortalezas">
                <h3 className="rep-insight-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.2" />
                        <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Fortalezas
                </h3>
                <ul className="rep-insight-list">
                    {fortalezas.map((f) => (
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

            <div className="rep-insight-card rep-insight-warning" role="region" aria-label="Áreas de mejora">
                <h3 className="rep-insight-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" fill="currentColor" opacity="0.2" />
                        <path d="M10 7v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Áreas de Mejora
                </h3>
                <ul className="rep-insight-list">
                    {oportunidades.map((o) => (
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
    )
}

/** Sección de comentarios anónimos */
const CommentsSection = ({ comentarios }) => {
    if (!comentarios?.length) return null

    return (
        <section className="rep-comments-card" aria-label="Comentarios anónimos">
            <div className="rep-card-header">
                <h3 className="rep-card-title">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M17 7v7a2 2 0 0 1-2 2H5l-4 4V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Comentarios Anónimos
                </h3>
                <span className="rep-comments-count" aria-label={`${comentarios.length} comentarios`}>
                    {comentarios.length}
                </span>
            </div>
            <ul className="rep-comments-list">
                {comentarios.map((comment, i) => (
                    <li key={i} className="rep-comment-item">
                        <div className="rep-comment-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 5.33V10.67a1.33 1.33 0 0 1-1.33 1.33H4L1.33 14.67V2.67A1.33 1.33 0 0 1 2.67 1.33h10A1.33 1.33 0 0 1 14 2.67v2.66z" fill="currentColor" />
                            </svg>
                        </div>
                        <p className="rep-comment-text">"{comment}"</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

// =====================
// COMPONENTE PRINCIPAL
// =====================

const Reportes = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [supervisores, setSupervisores] = useState([])
    const [responses, setResponses] = useState([])
    const [selectedSupervisor, setSelectedSupervisor] = useState(null)
    const [competencias, setCompetencias] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [pdfError, setPdfError] = useState(null)

    // Filtros
    const [filterDepartment, setFilterDepartment] = useState('all')
    const [filterShift, setFilterShift] = useState('all')

    useEffect(() => {
        loadData()
    }, [])

    // Limpiar errores de PDF después de 5 segundos
    useEffect(() => {
        if (!pdfError) return
        const timer = setTimeout(() => setPdfError(null), 5000)
        return () => clearTimeout(timer)
    }, [pdfError])

    const loadData = async () => {
        try {
            setError(null)

            const [supResult, respResult, compResult] = await Promise.all([
                getAllSupervisores(),
                getAllResponses(),
                getCompetenciasDinamicas('operativo')
            ])

            if (supResult.success) setSupervisores(supResult.data)
            if (respResult.success) setResponses(respResult.data)
            if (compResult.success) setCompetencias(compResult.data)

            // Si alguna llamada falló, mostrar error pero no bloquear la UI
            const errores = [
                !supResult.success && 'supervisores',
                !respResult.success && 'respuestas',
                !compResult.success && 'competencias'
            ].filter(Boolean)

            if (errores.length > 0) {
                setError(`Error cargando: ${errores.join(', ')}`)
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError('Error al cargar los datos. Intenta recargar la página.')
        } finally {
            setLoading(false)
        }
    }

    // Pre-computar Map de conteo de respuestas por supervisor (evita O(n) por item)
    const responseCountMap = useMemo(() => {
        const map = new Map()
        responses.forEach(r => {
            map.set(r.evaluadoId, (map.get(r.evaluadoId) || 0) + 1)
        })
        return map
    }, [responses])

    // Filtrar supervisores con useMemo
    const filteredSupervisores = useMemo(() =>
        supervisores.filter(s => {
            if (filterDepartment !== 'all' && s.department !== filterDepartment) return false
            if (filterShift !== 'all' && s.currentShift !== parseInt(filterShift)) return false
            return true
        }),
        [supervisores, filterDepartment, filterShift]
    )

    // Departamentos únicos para filtro dinámico
    const departments = useMemo(() =>
        [...new Set(supervisores.map(s => s.department).filter(Boolean))].sort(),
        [supervisores]
    )

    // Calcular reporte con useMemo basado en el supervisor seleccionado
    const reportData = useMemo(() => {
        if (!selectedSupervisor) return null

        const supervisor = supervisores.find(s => s.id === selectedSupervisor)
        const supervisorResponses = responses.filter(r => r.evaluadoId === selectedSupervisor)

        if (supervisorResponses.length === 0) {
            return { sinDatos: true, supervisor }
        }

        // Calcular promedios por competencia
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

        // Agrupar por criterios
        const criteriosAgrupados = agruparCompetenciasPorCriterio(competencias, promedios)

        // Comentarios
        const comentarios = supervisorResponses
            .map(r => r.comentario)
            .filter(c => c && c.trim())

        // Promedio general
        const promediosCriterios = Object.values(criteriosAgrupados).map(c => c.promedio)
        const promedioGeneral = promediosCriterios.length > 0
            ? promediosCriterios.reduce((a, b) => a + b, 0) / promediosCriterios.length
            : 0

        // Fortalezas y oportunidades
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

        return {
            supervisor,
            totalRespuestas: supervisorResponses.length,
            promedioGeneral,
            promedios,
            criteriosAgrupados,
            fortalezas,
            oportunidades,
            comentarios: comentarios.slice(0, 5),
            porTurno
        }
    }, [selectedSupervisor, supervisores, responses, competencias])

    // Handlers memoizados
    const handleSelectSupervisor = useCallback((supervisorId) => {
        setSelectedSupervisor(supervisorId)
        setSidebarOpen(false) // Cerrar sidebar en móvil al seleccionar
        setPdfError(null)
    }, [])

    const handleExportPDF = useCallback(() => {
        if (!reportData || reportData.sinDatos) return

        try {
            generateSupervisorReport({ ...reportData, competencias })
        } catch (err) {
            console.error('Error generando PDF:', err)
            setPdfError('Error al generar el PDF. Intenta de nuevo.')
        }
    }, [reportData, competencias])

    const handleExportConsolidated = useCallback(() => {
        try {
            generateConsolidatedReport(filteredSupervisores, responses, competencias)
        } catch (err) {
            console.error('Error generando PDF consolidado:', err)
            setPdfError('Error al generar el PDF consolidado. Intenta de nuevo.')
        }
    }, [filteredSupervisores, responses, competencias])

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    // Total de evaluaciones
    const totalEvaluaciones = responses.length

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
                    <div className="rep-header-stats">
                        <span className="rep-stat-badge">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            {filteredSupervisores.length} supervisores
                        </span>
                        <span className="rep-stat-badge">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM5 12H3V6h2v6zM9 12H7V4h2v8zM13 12h-2V8h2v4z" fill="currentColor" />
                            </svg>
                            {totalEvaluaciones} evaluaciones
                        </span>
                    </div>
                </div>
                <div className="rep-header-actions">
                    <Button
                        onClick={handleExportConsolidated}
                        disabled={filteredSupervisores.length === 0}
                    >
                        📥 Exportar Consolidado PDF
                    </Button>
                    {/* Toggle sidebar en móvil */}
                    <button
                        className="rep-sidebar-toggle"
                        onClick={toggleSidebar}
                        aria-expanded={sidebarOpen}
                        aria-controls="rep-sidebar"
                        aria-label={sidebarOpen ? 'Cerrar lista de supervisores' : 'Abrir lista de supervisores'}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Supervisores</span>
                    </button>
                </div>
            </header>

            {/* Error global */}
            {error && (
                <div className="rep-error-banner" role="alert">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="rep-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* Error de PDF (toast inline) */}
            {pdfError && (
                <div className="rep-error-banner rep-error-banner-warning" role="alert">
                    <span>{pdfError}</span>
                    <button onClick={() => setPdfError(null)} className="rep-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            <div className="rep-layout">
                {/* Sidebar - Lista de supervisores */}
                <aside
                    id="rep-sidebar"
                    className={`rep-sidebar ${sidebarOpen ? 'rep-sidebar-open' : ''}`}
                    aria-label="Lista de supervisores"
                >
                    <div className="rep-sidebar-header">
                        <div className="rep-sidebar-title-row">
                            <h3 className="rep-sidebar-title">Supervisores</h3>
                            <button
                                className="rep-sidebar-close"
                                onClick={toggleSidebar}
                                aria-label="Cerrar panel de supervisores"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="rep-filters" role="group" aria-label="Filtros de supervisores">
                            <div className="rep-filter-group">
                                <label htmlFor="filter-department" className="rep-filter-label">
                                    Departamento
                                </label>
                                <select
                                    id="filter-department"
                                    className="rep-filter-select"
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                >
                                    <option value="all">Todos los deptos</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="rep-filter-group">
                                <label htmlFor="filter-shift" className="rep-filter-label">
                                    Turno
                                </label>
                                <select
                                    id="filter-shift"
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
                    </div>

                    <div className="rep-evaluados-list" role="listbox" aria-label="Seleccionar supervisor">
                        {filteredSupervisores.length === 0 ? (
                            <div className="rep-empty-list">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
                                    <path d="M24 16v12M24 32h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p>No hay supervisores con estos filtros</p>
                            </div>
                        ) : (
                            filteredSupervisores.map((supervisor) => {
                                const respCount = responseCountMap.get(supervisor.id) || 0
                                const isActive = selectedSupervisor === supervisor.id

                                return (
                                    <button
                                        key={supervisor.id}
                                        role="option"
                                        aria-selected={isActive}
                                        className={`rep-evaluado-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleSelectSupervisor(supervisor.id)}
                                    >
                                        <div className="rep-evaluado-avatar" aria-hidden="true">
                                            {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="rep-evaluado-info">
                                            <span className="rep-evaluado-name">{supervisor.name}</span>
                                            <span className="rep-evaluado-nivel">
                                                {supervisor.department} · Turno {supervisor.currentShift}
                                            </span>
                                        </div>
                                        <span
                                            className="rep-response-count"
                                            aria-label={`${respCount} evaluaciones`}
                                        >
                                            {respCount}
                                        </span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </aside>

                {/* Overlay para cerrar sidebar en móvil */}
                {sidebarOpen && (
                    <div
                        className="rep-sidebar-overlay"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    />
                )}

                {/* Main Content - Reporte */}
                <main className="rep-content" aria-live="polite" aria-label="Detalle del reporte">
                    {!selectedSupervisor ? (
                        <div className="rep-placeholder">
                            <div className="rep-placeholder-icon" aria-hidden="true">
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
                        <div className="rep-placeholder animate-fadeIn">
                            <div className="rep-placeholder-icon" aria-hidden="true">
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
                    ) : reportData ? (
                        <div className="rep-detail animate-fadeIn" key={selectedSupervisor}>
                            {/* Header del reporte */}
                            <div className="rep-header-card">
                                <div className="rep-evaluado-header">
                                    <div className="rep-evaluado-avatar-lg" aria-hidden="true">
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
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                                        size="sm"
                                    >
                                        📄 Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Estadísticas por turno */}
                            {Object.keys(reportData.porTurno || {}).length > 0 && (
                                <section className="rep-turnos-stats" aria-label="Evaluaciones por turno">
                                    <h4>Evaluaciones por turno:</h4>
                                    <div className="rep-turnos-grid">
                                        {Object.entries(reportData.porTurno).map(([turno, count]) => (
                                            <div key={turno} className="rep-turno-badge">
                                                <span className="rep-turno-label">Turno {turno}</span>
                                                <span className="rep-turno-count">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Gráfico de competencias */}
                            <section className="rep-chart-card" aria-label="Gráfico de criterios">
                                <div className="rep-card-header">
                                    <h3 className="rep-card-title">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                            <path d="M18 18H2V2M6 14V10M10 14V6M14 14v-4M18 14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Resultados por Criterio
                                    </h3>
                                </div>
                                <RadarChart criteriosAgrupados={reportData.criteriosAgrupados} />
                            </section>

                            {/* Fortalezas y Oportunidades */}
                            <InsightsGrid
                                fortalezas={reportData.fortalezas}
                                oportunidades={reportData.oportunidades}
                            />

                            {/* Comentarios */}
                            <CommentsSection comentarios={reportData.comentarios} />
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}

export default Reportes
