import { useState, useEffect } from 'react'
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

    // Pregunta abierta según nivel (por defecto operativo)
    const preguntaAbierta = PREGUNTA_ABIERTA?.[profile?.nivel || 'operativo'] ||
        '¿Qué debería mejorar este supervisor para apoyar mejor al equipo?'

    useEffect(() => {
        loadData()
    }, [evaluadoId, profile])

    const loadData = async () => {
        try {
            // Cargar competencias dinámicas desde Firestore
            const nivel = profile?.nivel || 'operativo'
            const compResult = await getCompetenciasDinamicas(nivel)
            if (compResult.success) {
                setCompetencias(compResult.data)
            } else {
                console.error('Error cargando competencias:', compResult.error)
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
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRatingChange = (competenciaId, valor) => {
        setRespuestas(prev => ({
            ...prev,
            [competenciaId]: valor
        }))
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const result = await submitResponse({
                surveyId: 'evaluacion-mandos-medios',
                evaluadoId: evaluadoId,
                evaluadoName: supervisor?.name || 'Desconocido',
                evaluadoDepartment: supervisor?.department || profile?.departamento,
                turno: profile?.turnoActual || profile?.turnoFijo || 1,
                departamento: profile?.departamento,
                respuestas,
                comentario
            })

            if (result.success) {
                setSuccess(true)
            } else {
                alert('Error al enviar: ' + result.error)
            }
        } catch (error) {
            console.error('Error submitting:', error)
            alert('Error al enviar la evaluación')
        } finally {
            setSubmitting(false)
        }
    }

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
                <div className="success-card">
                    <div className="success-content">
                        <div className="success-icon-wrapper">
                            <span className="success-icon">✓</span>
                        </div>
                        <h2>¡Gracias por tu evaluación!</h2>
                        <p>Tu evaluación a <strong>{supervisor?.name}</strong> ha sido registrada de forma anónima.</p>
                        <p className="success-note">
                            Tu opinión ayuda a mejorar el liderazgo en la organización.
                        </p>
                        <button className="success-btn" onClick={() => navigate('/encuestas')}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="encuesta-page">
            {/* Header */}
            <header className="encuesta-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Volver
                </button>
                <h1 className="encuesta-title">Evaluación de Liderazgo</h1>
                {supervisor && (
                    <div className="encuesta-supervisor">
                        <div className="supervisor-avatar">
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
            <div className="progress-container">
                <div className="progress-header">
                    <span className="progress-title">Tu progreso</span>
                    <span className="progress-count">
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
            <div className="reminder-card">
                <span>🔒</span>
                <p>Tus respuestas son <strong>100% anónimas</strong></p>
            </div>

            {/* Preguntas - Competencias dinámicas de Firestore */}
            <div className="questions-container">
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
                    <div className="open-question-icon">💬</div>
                    <h3>
                        Comentario
                        <span className="optional-tag">(opcional)</span>
                    </h3>
                </div>
                <p className="question-description">
                    {preguntaAbierta}
                </p>
                <textarea
                    className="comment-input"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe tu comentario aquí..."
                    maxLength={500}
                    rows={4}
                />
                <span className="char-count">{comentario.length}/500</span>
            </div>

            {/* Botón de Envío */}
            <div className="submit-section">
                <div className="submit-container">
                    <button
                        className={`submit-btn ${submitting ? 'loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
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
