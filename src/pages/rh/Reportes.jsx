import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getAllSupervisores,
    getAllResponses,
    getCompetenciasDinamicas
} from '../../config/firebase'
import { agruparCompetenciasPorCriterio } from '../../config/criteriosEvaluacion'
import { generateSupervisorReport, generateConsolidatedReport } from '../../services/pdfService'
import Loader from '../../components/ui/Loader'
import './Reportes.css'

const Reportes = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [supervisores, setSupervisores] = useState([])
    const [responses, setResponses] = useState([])
    const [selectedSupervisor, setSelectedSupervisor] = useState(null)
    const [competencias, setCompetencias] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [filterDepartment, setFilterDepartment] = useState('all')
    const [filterShift, setFilterShift] = useState('all')

    useEffect(() => { loadData() }, [])

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
            setError('Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }

    const responseCountMap = useMemo(() => {
        const map = new Map()
        responses.forEach(r => {
            map.set(r.evaluadoId, (map.get(r.evaluadoId) || 0) + 1)
        })
        return map
    }, [responses])

    const filteredSupervisores = useMemo(() =>
        supervisores.filter(s => {
            if (filterDepartment !== 'all' && s.department !== filterDepartment) return false
            if (filterShift !== 'all' && s.currentShift !== parseInt(filterShift)) return false
            return true
        }),
        [supervisores, filterDepartment, filterShift]
    )

    const departments = useMemo(() =>
        [...new Set(supervisores.map(s => s.department).filter(Boolean))].sort(),
        [supervisores]
    )

    const reportData = useMemo(() => {
        if (!selectedSupervisor) return null

        const supervisor = supervisores.find(s => s.id === selectedSupervisor)
        const supervisorResponses = responses.filter(r => r.evaluadoId === selectedSupervisor)

        if (supervisorResponses.length === 0) {
            return { sinDatos: true, supervisor }
        }

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

        const criteriosAgrupados = agruparCompetenciasPorCriterio(competencias, promedios)

        const comentarios = supervisorResponses
            .map(r => r.comentario)
            .filter(c => c && c.trim())

        const promediosCriterios = Object.values(criteriosAgrupados).map(c => c.promedio)
        const promedioGeneral = promediosCriterios.length > 0
            ? promediosCriterios.reduce((a, b) => a + b, 0) / promediosCriterios.length
            : 0

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

    const handleSelectSupervisor = useCallback((supervisorId) => {
        setSelectedSupervisor(supervisorId)
        setSidebarOpen(false)
    }, [])

    const handleExportPDF = useCallback(() => {
        if (!reportData || reportData.sinDatos) return
        try {
            generateSupervisorReport({ ...reportData, competencias })
        } catch (err) {
            console.error('Error generando PDF:', err)
        }
    }, [reportData, competencias])

    const handleExportConsolidated = useCallback(() => {
        try {
            generateConsolidatedReport(filteredSupervisores, responses, competencias)
        } catch (err) {
            console.error('Error generando PDF consolidado:', err)
        }
    }, [filteredSupervisores, responses, competencias])

    const totalEvaluaciones = responses.length
    const getNivelColor = (promedio) => {
        if (promedio >= 4.5) return '#16a34a'
        if (promedio >= 4.0) return '#2563eb'
        if (promedio >= 3.0) return '#d97706'
        return '#dc2626'
    }

    if (loading) {
        return <Loader fullScreen message="Cargando reportes..." />
    }

    return (
        <div className="rep-page">
            {/* Header */}
            <header className="rep-header">
                <div className="rep-header-info">
                    <h1 className="rep-title">Reportes</h1>
                    <p className="rep-subtitle">Resultados de evaluación de supervisores</p>
                </div>
                <div className="rep-header-actions">
                    <button className="rep-btn rep-btn-primary" onClick={() => navigate('/rh/reportes/final')}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M6 6h6M6 9h4M6 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Resumen
                    </button>
                    <button className="rep-btn rep-btn-secondary" onClick={handleExportConsolidated} disabled={filteredSupervisores.length === 0}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 12v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3M9 2v8M5 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        PDF
                    </button>
                    <button className="rep-btn-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="rep-stats-bar">
                <div className="rep-stat">
                    <span className="rep-stat-value">{filteredSupervisores.length}</span>
                    <span className="rep-stat-label">Supervisores</span>
                </div>
                <div className="rep-stat">
                    <span className="rep-stat-value">{totalEvaluaciones}</span>
                    <span className="rep-stat-label">Evaluaciones</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rep-error">{error}</div>
            )}

            {/* Main Layout */}
            <div className="rep-layout">
                {/* Sidebar */}
                <aside className={`rep-sidebar ${sidebarOpen ? 'rep-sidebar-open' : ''}`}>
                    <div className="rep-sidebar-header">
                        <h3>Seleccionar</h3>
                        <button className="rep-sidebar-close" onClick={() => setSidebarOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    <div className="rep-filters">
                        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                            <option value="all">Todos los deptos</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
                            <option value="all">Todos los turnos</option>
                            <option value="1">Turno 1</option>
                            <option value="2">Turno 2</option>
                            <option value="3">Turno 3</option>
                            <option value="4">Turno 4</option>
                        </select>
                    </div>

                    <div className="rep-list">
                        {filteredSupervisores.length === 0 ? (
                            <div className="rep-empty">Sin resultados</div>
                        ) : (
                            filteredSupervisores.map((supervisor) => {
                                const respCount = responseCountMap.get(supervisor.id) || 0
                                const isActive = selectedSupervisor === supervisor.id

                                return (
                                    <button
                                        key={supervisor.id}
                                        className={`rep-list-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleSelectSupervisor(supervisor.id)}
                                    >
                                        <div className="rep-list-avatar">
                                            {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="rep-list-info">
                                            <span className="rep-list-name">{supervisor.name}</span>
                                            <span className="rep-list-meta">{supervisor.department} · T{supervisor.currentShift}</span>
                                        </div>
                                        <span className="rep-list-count">{respCount}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </aside>

                {/* Overlay */}
                {sidebarOpen && <div className="rep-overlay" onClick={() => setSidebarOpen(false)} />}

                {/* Content */}
                <main className="rep-content">
                    {!selectedSupervisor ? (
                        <div className="rep-placeholder">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect x="8" y="8" width="32" height="32" rx="6" stroke="#d4d4d8" strokeWidth="2"/>
                                <path d="M16 24h16M24 16v16" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <p>Selecciona un supervisor</p>
                        </div>
                    ) : reportData?.sinDatos ? (
                        <div className="rep-placeholder">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="16" stroke="#d4d4d8" strokeWidth="2"/>
                                <path d="M24 16v8M24 28h.01" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <p>{reportData.supervisor?.name} sin evaluaciones</p>
                        </div>
                    ) : reportData ? (
                        <div className="rep-detail">
                            {/* Profile Card */}
                            <div className="rep-profile">
                                <div className="rep-profile-left">
                                    <div className="rep-avatar">
                                        {reportData.supervisor?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="rep-profile-info">
                                        <h2>{reportData.supervisor?.name}</h2>
                                        <p>{reportData.supervisor?.position}</p>
                                        <span>{reportData.supervisor?.department} · Turno {reportData.supervisor?.currentShift}</span>
                                    </div>
                                </div>
                                <div className="rep-profile-score">
                                    <span className="rep-score-value" style={{ color: getNivelColor(reportData.promedioGeneral) }}>
                                        {reportData.promedioGeneral.toFixed(1)}
                                    </span>
                                    <span className="rep-score-label">Promedio</span>
                                    <button className="rep-btn rep-btn-sm" onClick={handleExportPDF}>
                                        PDF
                                    </button>
                                </div>
                            </div>

                            {/* Turnos */}
                            {Object.keys(reportData.porTurno || {}).length > 0 && (
                                <div className="rep-turnos">
                                    <span className="rep-turnos-label">Evaluaciones por turno:</span>
                                    <div className="rep-turnos-list">
                                        {Object.entries(reportData.porTurno).map(([turno, count]) => (
                                            <span key={turno} className="rep-turno-badge">
                                                T{turno}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Criterios */}
                            <div className="rep-criterios">
                                <h3>Resultados por Criterio</h3>
                                <div className="rep-criterios-grid">
                                    {Object.values(reportData.criteriosAgrupados)
                                        .filter(c => c.promedio > 0)
                                        .sort((a, b) => b.promedio - a.promedio)
                                        .map((item) => {
                                            const pct = (item.promedio / 5) * 100
                                            return (
                                                <div key={item.criterio.id} className="rep-criterio">
                                                    <div className="rep-criterio-header">
                                                        <span className="rep-criterio-icon">{item.criterio.icono}</span>
                                                        <span className="rep-criterio-name">{item.criterio.nombre}</span>
                                                        <span className="rep-criterio-value" style={{ color: getNivelColor(item.promedio) }}>
                                                            {item.promedio.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="rep-criterio-bar">
                                                        <div className="rep-criterio-fill" style={{ width: `${pct}%`, background: getNivelColor(item.promedio) }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>

                            {/* Fortalezas y Mejoras */}
                            <div className="rep-insights">
                                {reportData.fortalezas?.length > 0 && (
                                    <div className="rep-insight">
                                        <h4>Fortalezas</h4>
                                        <ul>
                                            {reportData.fortalezas.map((f, i) => (
                                                <li key={i}>
                                                    <span>{f.nombre}</span>
                                                    <span style={{ color: getNivelColor(f.promedio) }}>{f.promedio.toFixed(1)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {reportData.oportunidades?.length > 0 && (
                                    <div className="rep-insight rep-insight-warning">
                                        <h4>Áreas de Mejora</h4>
                                        <ul>
                                            {reportData.oportunidades.map((o, i) => (
                                                <li key={i}>
                                                    <span>{o.nombre}</span>
                                                    <span style={{ color: getNivelColor(o.promedio) }}>{o.promedio.toFixed(1)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Comentarios */}
                            {reportData.comentarios?.length > 0 && (
                                <div className="rep-comments">
                                    <h4>Comentarios ({reportData.comentarios.length})</h4>
                                    <ul>
                                        {reportData.comentarios.map((comment, i) => (
                                            <li key={i}>"{comment}"</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}

export default Reportes
