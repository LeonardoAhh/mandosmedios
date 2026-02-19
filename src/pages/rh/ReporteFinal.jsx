import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    getAllSupervisores,
    getAllResponses,
    getCompetenciasDinamicas
} from '../../config/firebase'
import { agruparCompetenciasPorCriterio, CRITERIOS } from '../../config/criteriosEvaluacion'
import './ReporteFinal.css'

const RECOMENDACIONES_CAPACITACION = {
    resultados_control: {
        titulo: 'Gestión de Resultados',
        descripcion: 'Mejora en la claridad de resultados e indicadores',
        recomendaciones: [
            'Taller de KPIs y métricas de rendimiento',
            'Curso de reportes mensuales efectivos',
            'Dashboarding y visualización de datos',
            'Metodología de seguimiento de objetivos OKR'
        ]
    },
    herramientas_trabajo: {
        titulo: 'Herramientas de Trabajo',
        descripcion: 'Optimización de recursos y simplificación de procesos',
        recomendaciones: [
            'Gestión eficiente de recursos',
            'Simplificación de procesos operativos',
            'Taller de productividad personal',
            'Gestión de herramientas y equipos'
        ]
    },
    objetivos_metas: {
        titulo: 'Objetivos y Metas',
        descripcion: 'Claridad en metas y seguimiento del desempeño',
        recomendaciones: [
            'SMART Goals y planificación estratégica',
            'Cierre de mes efectivo',
            'Planificación semanal y diaria',
            'Feedback loop con el equipo'
        ]
    },
    capacitacion: {
        titulo: 'Desarrollo de Capacidades',
        descripcion: 'Mantener al equipo actualizado y capacitado',
        recomendaciones: [
            'Diseño de programas de capacitación',
            'Evaluación de necesidades de entrenamiento',
            'Mentoría y transferencia de conocimiento',
            'Gestión del conocimiento organizacional'
        ]
    },
    productividad: {
        titulo: 'Productividad y Desempeño',
        descripcion: 'Evaluación y mejora de la productividad',
        recomendaciones: [
            'Métricas de productividad',
            'Gestión del tiempo',
            'Ránkings y gamificación productiva',
            'Mejora continua de procesos'
        ]
    },
    reconocimiento: {
        titulo: 'Reconocimiento y Motivación',
        descripcion: 'Felicitar y reconocer logros del equipo',
        recomendaciones: [
            'Programa de reconocimiento laboral',
            'Feedback positivo y celebración de logros',
            'Motivación de equipos',
            'Cultura de premios e incentivos'
        ]
    },
    comunicacion: {
        titulo: 'Comunicación Efectiva',
        descripcion: 'Escucha activa y comunicación frecuente',
        recomendaciones: [
            'Comunicación asertiva',
            'Escucha activa',
            'Reuniones efectivas',
            'Gestión de equipos multiculturales'
        ]
    },
    mejores_practicas: {
        titulo: 'Mejores Prácticas',
        descripcion: 'Compartir conocimiento y experiencia',
        recomendaciones: [
            'Comunidades de práctica',
            'Gestión del conocimiento',
            'Benchmarking interno',
            'Tutoría y mentoring'
        ]
    },
    cumplimiento: {
        titulo: 'Cumplimiento y Políticas',
        descripcion: 'Asegurar el cumplimiento de políticas',
        recomendaciones: [
            'Compliance y ética empresarial',
            'Gestión de políticas corporativas',
            'Auditoría interna',
            'Cultura de integridad'
        ]
    },
    solucion_problemas: {
        titulo: 'Resolución de Problemas',
        descripcion: 'Capacidad de resolver obstáculos',
        recomendaciones: [
            'Pensamiento analítico',
            'Toma de decisiones',
            'Gestión de crises',
            'Metodología de resolución de problemas'
        ]
    },
    desarrollo: {
        titulo: 'Desarrollo Profesional',
        descripcion: 'Oportunidades de crecimiento del equipo',
        recomendaciones: [
            'Plan de carrera',
            'Desarrollo de liderazgo',
            'Evaluación de potencial',
            'Gestión de talento'
        ]
    },
    nuestras_relaciones: {
        titulo: 'Relaciones en el Equipo',
        descripcion: 'Construir relaciones sólidas',
        recomendaciones: [
            'Trabajo en equipo',
            'Inteligencia emocional',
            'Gestión de conflictos interpersonales',
            'Construcción de confianza'
        ]
    },
    exitos_compartidos: {
        titulo: 'Éxitos Compartidos',
        descripcion: 'Fomentar el logro colectivo',
        recomendaciones: [
            'Celebración de logros en equipo',
            'Cultura de colaboración',
            'Gestión de proyectos colaborativos',
            'Reconocimiento grupal'
        ]
    },
    impulsar: {
        titulo: 'Impulso y Motivación',
        descripcion: 'Motivación y desarrollo del equipo',
        recomendaciones: [
            'Liderazgo motivacional',
            'Coaching para el desarrollo',
            'Gestión del cambio',
            'Empowerment y autonomía'
        ]
    },
    diversion: {
        titulo: 'Ambiente Laboral Positivo',
        descripcion: 'Crear un ambiente entusiasta',
        recomendaciones: [
            'Clima organizacional',
            'Creatividad e innovación',
            'Gestión del estrés laboral',
            'Equilibrio vida-trabajo'
        ]
    },
    individualidad: {
        titulo: 'Respeto a la Individualidad',
        descripcion: 'Valorar la diversidad personal',
        recomendaciones: [
            'Diversidad e inclusión',
            'Gestión de personalidades',
            'Respeto y valoración individual',
            'Personalización del liderazgo'
        ]
    },
    liderazgo: {
        titulo: 'Liderazgo Efectivo',
        descripcion: 'Cualidades de liderazgo',
        recomendaciones: [
            'Programa de liderazgo',
            'Toma de decisiones estratégicas',
            'Comunicación de visión',
            'Liderazgo por ejemplo'
        ]
    }
}

const getNivelColor = (promedio) => {
    if (promedio >= 4.5) return { bg: '#d1fae5', text: '#065f46', label: 'Excelente' }
    if (promedio >= 4.0) return { bg: '#dbeafe', text: '#1e40af', label: 'Bueno' }
    if (promedio >= 3.0) return { bg: '#fef3c7', text: '#92400e', label: 'Regular' }
    if (promedio >= 2.0) return { bg: '#fee2e2', text: '#991b1b', label: 'Necesita mejora' }
    return { bg: '#fecaca', text: '#7f1d1d', label: 'Crítico' }
}

const CriterioCard = ({ criterio, promedio, evaluadores }) => {
    const nivel = getNivelColor(promedio)
    const recomendacion = RECOMENDACIONES_CAPACITACION[criterio.id]
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="rf-criterio-card">
            <div className="rf-criterio-header" onClick={() => setExpanded(!expanded)}>
                <div className="rf-criterio-icon">{criterio.icono}</div>
                <div className="rf-criterio-info">
                    <h4 className="rf-criterio-nombre">{criterio.nombre}</h4>
                    <p className="rf-criterio-desc">{criterio.descripcion}</p>
                </div>
                <div className="rf-criterio-stats">
                    <div className="rf-promedio-badge" style={{ background: nivel.bg, color: nivel.text }}>
                        {promedio.toFixed(1)}
                    </div>
                    <span className="rf-evaluadores-count">{evaluadores} eval.</span>
                </div>
                <button className="rf-expand-btn" aria-label={expanded ? 'Contraer' : 'Expandir'}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={expanded ? 'rotated' : ''}>
                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            
            {expanded && recomendacion && (
                <div className="rf-criterio-detail">
                    <div className="rf-capacitacion-section">
                        <h5 className="rf-capacitacion-title">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 10v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3M8 2v7M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Capacitaciones Recomendadas
                        </h5>
                        <ul className="rf-capacitacion-list">
                            {recomendacion.recomendaciones.map((rec, i) => (
                                <li key={i} className="rf-capacitacion-item">
                                    <span className="rf-cap-number">{i + 1}</span>
                                    <span className="rf-cap-text">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

const ReporteFinal = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [supervisores, setSupervisores] = useState([])
    const [responses, setResponses] = useState([])
    const [competencias, setCompetencias] = useState([])
    const [lastUpdate, setLastUpdate] = useState(null)

    const loadData = useCallback(async () => {
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

            setLastUpdate(new Date())
        } catch (err) {
            console.error('Error loading data:', err)
            setError('Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [loadData])

    const consolidado = useMemo(() => {
        if (responses.length === 0 || competencias.length === 0) {
            return { criterios: [], promedioGeneral: 0, totalEvaluaciones: 0, supervisoresEvaluados: 0 }
        }

        const promediosPorCompetencia = {}
        
        competencias.forEach(comp => {
            const valores = responses
                .map(r => r.respuestas?.[comp.id])
                .filter(v => v !== undefined && v !== null)
            
            if (valores.length > 0) {
                promediosPorCompetencia[comp.id] = {
                    promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
                    evaluadores: valores.length
                }
            }
        })

        const criteriosData = agruparCompetenciasPorCriterio(competencias, promediosPorCompetencia)

        const criterios = Object.entries(criteriosData)
            .map(([id, data]) => ({
                criterio: CRITERIOS.find(c => c.id === id) || data.criterio,
                promedio: data.promedio,
                evaluadores: data.cantidadCompetencias || responses.length
            }))
            .filter(c => c.promedio > 0)
            .sort((a, b) => b.promedio - a.promedio)

        const promedioGeneral = criterios.length > 0
            ? criterios.reduce((a, b) => a + b.promedio, 0) / criterios.length
            : 0

        const supervisoresEvaluados = new Set(responses.map(r => r.evaluadoId)).size

        return {
            criterios,
            promedioGeneral,
            totalEvaluaciones: responses.length,
            supervisoresEvaluados,
            mejorCriterio: criterios[0] || null,
            peorCriterio: criterios[criterios.length - 1] || null
        }
    }, [responses, competencias])

    const criteriosTop = useMemo(() => {
        return consolidado.criterios.slice(0, 3)
    }, [consolidado])

    const criteriosMejora = useMemo(() => {
        return consolidado.criterios.slice(-3).reverse()
    }, [consolidado])

    const formatTime = (date) => {
        if (!date) return ''
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return (
            <div className="rf-loading">
                <div className="rf-spinner"></div>
                <p>Cargando reporte consolidado...</p>
            </div>
        )
    }

    return (
        <div className="rf-page">
            <header className="rf-header">
                <div className="rf-header-left">
                    <h1 className="rf-title">Reporte Final Consolidado</h1>
                    <p className="rf-subtitle">Resumen ejecutivo de evaluaciones de supervisores</p>
                </div>
                <div className="rf-header-right">
                    <div className="rf-update-badge">
                        <span className="rf-update-dot"></span>
                        Actualizado: {formatTime(lastUpdate)}
                    </div>
                    <button className="rf-refresh-btn" onClick={loadData} aria-label="Actualizar datos">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 4a8 8 0 0 1 12.32 4.936M16 16a8 8 0 0 1-12.32-4.936" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M4 8V4h4M16 12V16h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </header>

            {error && (
                <div className="rf-error-banner">
                    <span>{error}</span>
                </div>
            )}

            <div className="rf-stats-row">
                <div className="rf-stat-card">
                    <span className="rf-stat-value">{consolidado.totalEvaluaciones}</span>
                    <span className="rf-stat-label">Evaluaciones</span>
                </div>
                <div className="rf-stat-card">
                    <span className="rf-stat-value">{consolidado.supervisoresEvaluados}</span>
                    <span className="rf-stat-label">Supervisores</span>
                </div>
                <div className="rf-stat-card">
                    <span className="rf-stat-value">{supervisores.length}</span>
                    <span className="rf-stat-label">Total Supervisores</span>
                </div>
                <div className="rf-stat-card rf-stat-highlight">
                    <span className="rf-stat-value">{consolidado.promedioGeneral.toFixed(1)}</span>
                    <span className="rf-stat-label">Promedio General</span>
                </div>
            </div>

            <section className="rf-summary-section">
                <div className="rf-summary-grid">
                    <div className="rf-summary-card rf-summary-success">
                        <h3>Fortalezas</h3>
                        {criteriosTop.length > 0 ? (
                            <ul className="rf-summary-list">
                                {criteriosTop.map((item, i) => (
                                    <li key={i} className="rf-summary-item">
                                        <span className="rf-summary-icon">{item.criterio.icono}</span>
                                        <span className="rf-summary-name">{item.criterio.nombre}</span>
                                        <span className="rf-summary-score">{item.promedio.toFixed(1)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="rf-no-data">Sin datos suficientes</p>
                        )}
                    </div>
                    
                    <div className="rf-summary-card rf-summary-warning">
                        <h3>Áreas de Mejora</h3>
                        {criteriosMejora.length > 0 ? (
                            <ul className="rf-summary-list">
                                {criteriosMejora.map((item, i) => (
                                    <li key={i} className="rf-summary-item">
                                        <span className="rf-summary-icon">{item.criterio.icono}</span>
                                        <span className="rf-summary-name">{item.criterio.nombre}</span>
                                        <span className="rf-summary-score">{item.promedio.toFixed(1)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="rf-no-data">Sin datos suficientes</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="rf-criterios-section">
                <h2 className="rf-section-title">Resultados por Criterio</h2>
                <p className="rf-section-subtitle">
                    Click en cada criterio para ver recomendaciones de capacitación
                </p>
                
                {consolidado.criterios.length === 0 ? (
                    <div className="rf-empty-state">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <rect x="12" y="16" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
                            <path d="M24 32h16M24 40h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <p>No hay evaluaciones registradas aún</p>
                    </div>
                ) : (
                    <div className="rf-criterios-grid">
                        {consolidado.criterios.map((item) => (
                            <CriterioCard
                                key={item.criterio.id}
                                criterio={item.criterio}
                                promedio={item.promedio}
                                evaluadores={item.evaluadores}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="rf-legend-section">
                <h3 className="rf-legend-title">Leyenda de Evaluación</h3>
                <div className="rf-legend-grid">
                    <div className="rf-legend-item">
                        <span className="rf-legend-badge" style={{ background: '#d1fae5', color: '#065f46' }}>4.5 - 5.0</span>
                        <span>Excelente</span>
                    </div>
                    <div className="rf-legend-item">
                        <span className="rf-legend-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>4.0 - 4.4</span>
                        <span>Bueno</span>
                    </div>
                    <div className="rf-legend-item">
                        <span className="rf-legend-badge" style={{ background: '#fef3c7', color: '#92400e' }}>3.0 - 3.9</span>
                        <span>Regular</span>
                    </div>
                    <div className="rf-legend-item">
                        <span className="rf-legend-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>2.0 - 2.9</span>
                        <span>Needs Improvement</span>
                    </div>
                    <div className="rf-legend-item">
                        <span className="rf-legend-badge" style={{ background: '#fecaca', color: '#7f1d1d' }}>1.0 - 1.9</span>
                        <span>Crítico</span>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ReporteFinal
