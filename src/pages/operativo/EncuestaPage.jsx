import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getSurveyById,
    getUserProfile,
    submitResponse,
    getCompetenciasByNivel,
    PREGUNTA_ABIERTA
} from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import RatingScale from '../../components/ui/RatingScale'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
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
    const [currentStep, setCurrentStep] = useState(0)
    const [success, setSuccess] = useState(false)

    // Obtener competencias según el nivel del usuario autenticado
    const competencias = getCompetenciasByNivel(profile?.nivel || 'operativo')
    const preguntaAbierta = PREGUNTA_ABIERTA[profile?.nivel || 'operativo']

    useEffect(() => {
        loadData()
    }, [surveyId, evaluadoId])

    const loadData = async () => {
        try {
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

    const progress = (Object.keys(respuestas).length / competencias.length) * 100
    const canSubmit = Object.keys(respuestas).length === competencias.length

    if (loading) {
        return <Loader fullScreen message="Cargando encuesta..." />
    }

    if (success) {
        return (
            <div className="encuesta-page">
                <Card className="success-card">
                    <div className="success-content">
                        <span className="success-icon">✅</span>
                        <h2>¡Gracias por tu evaluación!</h2>
                        <p>Tu respuesta ha sido registrada de forma anónima.</p>
                        <p className="success-note">
                            Tu opinión ayuda a mejorar el liderazgo en la organización.
                        </p>
                        <Button onClick={() => navigate('/encuestas')}>
                            Volver al inicio
                        </Button>
                    </div>
                </Card>
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
                <div>
                    <h1 className="encuesta-title">
                        {survey?.titulo || 'Evaluación de Liderazgo'}
                    </h1>
                    {evaluado && (
                        <p className="encuesta-evaluado">
                            Evaluando a: <strong>{evaluado.nombre}</strong>
                        </p>
                    )}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="progress-text">
                    {Object.keys(respuestas).length} de {competencias.length} competencias
                </span>
            </div>

            {/* Reminder */}
            <Card variant="outline" className="reminder-card">
                <span>🔒</span>
                <p>Recuerda: tus respuestas son <strong>100% anónimas</strong>. Responde con honestidad.</p>
            </Card>

            {/* Questions */}
            <div className="questions-container">
                {competencias.map((competencia, index) => (
                    <RatingScale
                        key={competencia.id}
                        competencia={competencia}
                        value={respuestas[competencia.id]}
                        onChange={(valor) => handleRatingChange(competencia.id, valor)}
                    />
                ))}

                {/* Open Question */}
                <Card className="open-question">
                    <h3>💬 Pregunta abierta (opcional)</h3>
                    <p className="question-description">
                        {preguntaAbierta}
                    </p>
                    <textarea
                        className="comment-input"
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escribe tu comentario aquí... (máximo 500 caracteres)"
                        maxLength={500}
                        rows={4}
                    />
                    <span className="char-count">{comentario.length}/500</span>
                </Card>
            </div>

            {/* Submit */}
            <div className="submit-container">
                <Button
                    size="lg"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    loading={submitting}
                >
                    {canSubmit ? 'Enviar Evaluación' : `Completa ${competencias.length - Object.keys(respuestas).length} preguntas más`}
                </Button>
                {!canSubmit && (
                    <p className="submit-hint">
                        Debes responder todas las competencias para enviar
                    </p>
                )}
            </div>
        </div>
    )
}

export default EncuestaPage
