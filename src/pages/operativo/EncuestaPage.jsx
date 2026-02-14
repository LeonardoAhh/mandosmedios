import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    submitResponse,
    getAllSupervisores,
    getCompetenciasDinamicas,
    PREGUNTA_ABIERTA
} from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import RatingScale from '../../components/ui/RatingScale'
import Loader from '../../components/ui/Loader'
import './EncuestaPage.css'

const EncuestaPage = () => {
    const { evaluadoId } = useParams()
    const navigate = useNavigate()
    const { profile } = useAuth()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [supervisor, setSupervisor] = useState(null)
    const [respuestas, setRespuestas] = useState({})
    const [comentario, setComentario] = useState('')
    const [success, setSuccess] = useState(false)
    const [competencias, setCompetencias] = useState([])
    const [error, setError] = useState(null)

    // Pregunta abierta según nivel (por defecto operativo)
    const preguntaAbierta = PREGUNTA_ABIERTA?.[profile?.nivel || 'operativo'] ||
        '¿Qué debería mejorar este supervisor para apoyar mejor al equipo?'

    // Key para localStorage (único por evaluador y evaluado)
    const storageKey = useMemo(
        () => `survey_progress_${profile?.id}_${evaluadoId}`,
        [profile?.id, evaluadoId]
    )

    useEffect(() => {
        loadData()
        loadSavedProgress()
    }, [evaluadoId, profile])

    // Auto-guardar progreso en localStorage cada vez que cambian las respuestas
    useEffect(() => {
        if (evaluadoId && Object.keys(respuestas).length > 0) {
            localStorage.setItem(storageKey, JSON.stringify({
                respuestas,
                comentario,
                timestamp: Date.now()
            }))
        }
    }, [respuestas, comentario, storageKey, evaluadoId])

    // Auto-dismiss error después de 6 segundos
    useEffect(() => {
        if (!error) return
        const timer = setTimeout(() => setError(null), 6000)
        return () => clearTimeout(timer)
    }, [error])

    const loadSavedProgress = () => {
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const data = JSON.parse(saved)
                // Solo cargar si es reciente (menos de 24 horas)
                const hoursSince = (Date.now() - data.timestamp) / (1000 * 60 * 60)
                if (hoursSince < 24) {
                    setRespuestas(data.respuestas || {})
                    setComentario(data.comentario || '')
                }
            }
        } catch (err) {
            console.error('Error loading saved progress:', err)
        }
    }

    const loadData = async () => {
        try {
            // Cargar competencias dinámicas desde Firestore
            const nivel = profile?.nivel || 'operativo'
            const compResult = await getCompetenciasDinamicas(nivel)
            if (compResult.success) {
                setCompetencias(compResult.data)
            } else {
                console.error('Error cargando competencias:', compResult.error)
                setError('No se pudieron cargar las competencias.')
            }

            // Cargar información del supervisor
            if (evaluadoId) {
                const result = await getAllSupervisores()
                if (result.success) {
                    const found = result.data.find(s => s.id === evaluadoId)
                    if (found) {
                        setSupervisor(found)
                    }
                }
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError('Error al cargar la información. Intenta recargar la página.')
        } finally {
            setLoading(false)
        }
    }

    const handleRatingChange = useCallback((competenciaId, valor) => {
        setRespuestas(prev => ({
            ...prev,
            [competenciaId]: valor
        }))
    }, [])

    const handleComentarioChange = useCallback((e) => {
        setComentario(e.target.value)
    }, [])

    const handleSubmit = useCallback(async () => {
        setSubmitting(true)
        setError(null)

        try {
            const result = await submitResponse({
                surveyId: 'evaluacion-mandos-medios',
                evaluadorId: profile?.id,
                evaluadoId: evaluadoId,
                evaluadoName: supervisor?.name || 'Desconocido',
                evaluadoDepartment: supervisor?.department || profile?.departamento,
                turno: profile?.turnoActual || profile?.turnoFijo || 1,
                departamento: profile?.departamento,
                respuestas,
                comentario
            })

            if (result.success) {
                // Limpiar progreso guardado después de envío exitoso
                localStorage.removeItem(storageKey)
                setSuccess(true)
            } else {
                setError('Error al enviar: ' + result.error)
            }
        } catch (err) {
            console.error('Error submitting:', err)
            setError('Error al enviar la evaluación. Intenta nuevamente.')
        } finally {
            setSubmitting(false)
        }
    }, [profile, evaluadoId, supervisor, respuestas, comentario, storageKey])

    const handleGoBack = useCallback(() => navigate(-1), [navigate])
    const handleGoHome = useCallback(() => navigate('/encuestas'), [navigate])

    const answeredCount = Object.keys(respuestas).length
    const totalQuestions = competencias.length
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
    const canSubmit = answeredCount === totalQuestions
    const remaining = totalQuestions - answeredCount

    if (loading) {
        return <Loader fullScreen message="Cargando evaluación..." />
    }

    // Estado de éxito
    if (success) {
        return (
            <div className="encuesta-page success-page">
                <div className="success-card" role="status">
                    <div className="success-content">
                        <div className="success-icon-wrapper" aria-hidden="true">
                            <span className="success-icon">✓</span>
                        </div>
                        <h2>¡Gracias por tu evaluación!</h2>
                        <p>Tu evaluación a <strong>{supervisor?.name}</strong> ha sido registrada de forma anónima.</p>
                        <p className="success-note">
                            Tu opinión ayuda a mejorar el liderazgo en la organización.
                        </p>
                        <button className="success-btn" onClick={handleGoHome}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="encuesta-page">
            {/* Error Banner */}
            {error && (
                <div className="encuesta-error-banner" role="alert">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="encuesta-error-close" aria-label="Cerrar aviso">×</button>
                </div>
            )}

            {/* Header */}
            <header className="encuesta-header" aria-label="Información de evaluación">
                <button className="back-btn" onClick={handleGoBack} aria-label="Volver atrás">
                    ← Volver
                </button>
                <h1 className="encuesta-title">Evaluación de Liderazgo</h1>
                {supervisor && (
                    <div className="encuesta-supervisor">
                        <div className="supervisor-avatar" aria-hidden="true">
                            {supervisor.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="supervisor-details">
                            <span className="evaluando-label">Evaluando a:</span>
                            <span className="supervisor-name">{supervisor.name}</span>
                            <span className="supervisor-position">{supervisor.position}</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Barra de Progreso */}
            <div className="progress-container"
                role="progressbar"
                aria-valuenow={answeredCount}
                aria-valuemin={0}
                aria-valuemax={totalQuestions}
                aria-label={`Progreso: ${answeredCount} de ${totalQuestions} preguntas respondidas`}
            >
                <div className="progress-header">
                    <span className="progress-title">Tu progreso</span>
                    <span className="progress-count" aria-hidden="true">
                        <strong>{answeredCount}</strong> de {totalQuestions}
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Recordatorio */}
            <div className="reminder-card" role="note">
                <span aria-hidden="true">🔒</span>
                <p>Tus respuestas son <strong>100% anónimas</strong></p>
            </div>

            {/* Preguntas - Competencias dinámicas de Firestore */}
            <div className="questions-container" aria-label="Preguntas de evaluación">
                {competencias.map((competencia, index) => (
                    <RatingScale
                        key={competencia.id}
                        competencia={competencia}
                        value={respuestas[competencia.id]}
                        onChange={(valor) => handleRatingChange(competencia.id, valor)}
                        questionNumber={index + 1}
                    />
                ))}
            </div>

            {/* Pregunta Abierta */}
            <div className="open-question">
                <div className="open-question-header">
                    <div className="open-question-icon" aria-hidden="true">💬</div>
                    <h3 id="comentario-label">
                        Comentario
                        <span className="optional-tag">(opcional)</span>
                    </h3>
                </div>
                <p className="question-description" id="comentario-desc">
                    {preguntaAbierta}
                </p>
                <textarea
                    className="comment-input"
                    value={comentario}
                    onChange={handleComentarioChange}
                    placeholder="Escribe tu comentario aquí..."
                    maxLength={500}
                    rows={4}
                    aria-labelledby="comentario-label"
                    aria-describedby="comentario-desc comentario-count"
                />
                <span id="comentario-count" className="char-count" aria-live="polite">{comentario.length}/500</span>
            </div>

            {/* Botón de Envío */}
            <div className="submit-section">
                <div className="submit-container">
                    <button
                        className={`submit-btn ${submitting ? 'loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        aria-busy={submitting || undefined}
                        aria-label={canSubmit ? 'Enviar evaluación' : `Faltan ${remaining} preguntas por responder`}
                    >
                        {submitting ? (
                            <>Enviando...</>
                        ) : canSubmit ? (
                            <>Enviar Evaluación</>
                        ) : (
                            <>Faltan {remaining} preguntas</>
                        )}
                    </button>
                    {!canSubmit && (
                        <p className="submit-hint">
                            Responde todas las preguntas para continuar
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default EncuestaPage
