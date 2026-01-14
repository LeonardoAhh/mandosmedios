import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getSurveyById,
    getUserProfile,
    submitResponse,
    getCompetenciasDinamicas,
    PREGUNTA_ABIERTA
} from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import RatingScale from '../../components/ui/RatingScale'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import './EncuestaPage.css'

const EncuestaPage = () => {
    const { surveyId, evaluadoId } = useParams()
    const navigate = useNavigate()
    const { profile } = useAuth()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [survey, setSurvey] = useState(null)
    const [evaluado, setEvaluado] = useState(null)
    const [respuestas, setRespuestas] = useState({})
    const [comentario, setComentario] = useState('')
    const [success, setSuccess] = useState(false)
    const [competencias, setCompetencias] = useState([])

    const preguntaAbierta = PREGUNTA_ABIERTA[profile?.nivel || 'operativo']

    useEffect(() => {
        loadData()
    }, [surveyId, evaluadoId, profile])

    const loadData = async () => {
        try {
            const nivel = profile?.nivel || 'operativo'
            const compResult = await getCompetenciasDinamicas(nivel)
            if (compResult.success) {
                setCompetencias(compResult.data)
            }

            if (surveyId) {
                const surveyResult = await getSurveyById(surveyId)
                if (surveyResult.success) {
                    setSurvey(surveyResult.data)
                }
            }

            if (evaluadoId) {
                const evaluadoResult = await getUserProfile(evaluadoId)
                if (evaluadoResult.success) {
                    setEvaluado(evaluadoResult.data)
                }
            }
        } catch (error) {
            console.error('Error loading survey:', error)
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
                surveyId: surveyId || 'evaluacion-general',
                evaluadoId: evaluadoId || evaluado?.id,
                respuestas,
                comentario
            })

            if (result.success) {
                setSuccess(true)
            } else {
                alert('Error al enviar: ' + result.error)
            }
        } catch (error) {
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
        return <Loader fullScreen message="Cargando encuesta..." />
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
                        <h2>¡Gracias!</h2>
                        <p>Tu evaluación ha sido registrada de forma anónima.</p>
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
                <h1 className="encuesta-title">
                    {survey?.titulo || 'Evaluación de Liderazgo'}
                </h1>
                {evaluado && (
                    <p className="encuesta-evaluado">
                        Evaluando a <strong>{evaluado.nombre}</strong>
                    </p>
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

            {/* Preguntas */}
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
